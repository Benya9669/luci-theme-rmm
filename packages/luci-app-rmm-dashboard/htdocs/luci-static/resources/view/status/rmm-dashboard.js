'use strict';
'require rpc';
'require poll';
'require uci';
'require view';

var callBoard = rpc.declare({ object: 'system', method: 'board', expect: { '': {} } });
var callInfo = rpc.declare({ object: 'system', method: 'info', expect: { '': {} } });
var callInterfaces = rpc.declare({ object: 'network.interface', method: 'dump', expect: { '': {} } });
var callServices = rpc.declare({ object: 'service', method: 'list', params: [ 'name' ], expect: { '': {} } });

var russian = {
	'Unavailable': 'Недоступно',
	'No address': 'Нет адреса',
	'Not configured': 'Не настроено',
	'Connected': 'Подключено',
	'Disconnected': 'Отключено',
	'Running': 'Работает',
	'Stopped': 'Остановлен',
	'Disabled': 'Выключен',
	'Router': 'Роутер',
	'Hostname': 'Имя устройства',
	'Model': 'Модель',
	'Firmware': 'Прошивка',
	'Uptime': 'Время работы',
	'System': 'Система',
	'Load (1 / 5 / 15 min)': 'Нагрузка (1 / 5 / 15 мин)',
	'Memory total': 'Всего памяти',
	'Memory available': 'Доступно памяти',
	'WAN connection': 'Подключение WAN',
	'Status': 'Состояние',
	'Interface': 'Интерфейс',
	'IP address': 'IP-адрес',
	'RMM agent': 'Агент RMM',
	'Heartbeat interval': 'Интервал heartbeat',
	'Connectivity check interval': 'Интервал проверки связи',
	'RMM overview': 'Обзор RMM',
	'Updates every 30 seconds': 'Обновление каждые 30 секунд',
	'WAN status shows the interface link state; it does not test Internet reachability.': 'Состояние WAN показывает состояние интерфейса, но не проверяет доступ в Интернет.',
	'SYSTEM / OVERVIEW': 'СИСТЕМА / ОБЗОР',
	'd': 'д',
	'h': 'ч',
	'm': 'мин',
	's': 'с'
};

function tr(message) {
	return /^ru(?:-|$)/i.test(document.documentElement.lang) && russian[message] || _(message);
}

function requested(call) {
	return call().then(function(value) { return { value: value || {} }; }, function(error) {
		return { error: error };
	});
}

function formatDuration(seconds) {
	if (typeof seconds !== 'number' || !isFinite(seconds) || seconds < 0)
		return tr('Unavailable');
	var days = Math.floor(seconds / 86400);
	var hours = Math.floor(seconds % 86400 / 3600);
	var minutes = Math.floor(seconds % 3600 / 60);
	return (days ? '%d %s '.format(days, tr('d')) : '') + '%d %s %d %s'.format(hours, tr('h'), minutes, tr('m'));
}

function formatBytes(bytes) {
	if (typeof bytes !== 'number' || !isFinite(bytes) || bytes < 0)
		return tr('Unavailable');
	return (bytes / 1048576).toFixed(1) + ' MiB';
}

function item(label, value, state) {
	return E('div', { 'class': 'rmm-dashboard-row' }, [
		E('dt', {}, label),
		E('dd', { 'class': state ? 'rmm-dashboard-value rmm-dashboard-' + state : 'rmm-dashboard-value' }, value)
	]);
}

function section(title, rows) {
	return E('section', { 'class': 'rmm-dashboard-section' }, [
		E('h2', {}, title),
		E('dl', {}, rows)
	]);
}

function firstAddress(iface) {
	var ipv4 = iface && iface['ipv4-address'];
	var ipv6 = iface && iface['ipv6-address'];
	var addresses = Array.isArray(ipv4) && ipv4.length ? ipv4 : ipv6;
	return Array.isArray(addresses) && addresses.length ? addresses[0].address : tr('No address');
}

return view.extend({
	load: function() {
		return Promise.all([
			requested(callBoard),
			requested(callInfo),
			requested(callInterfaces),
			requested(function() { return callServices('rmm-agent'); }),
			uci.load('rmm-agent').then(function() { return { value: true }; }, function(error) { return { error: error }; })
		]);
	},

	render: function(data) {
		if (!document.getElementById('rmm-dashboard-styles'))
			document.head.appendChild(E('link', { 'id': 'rmm-dashboard-styles', 'rel': 'stylesheet', 'href': L.resource('view/status/rmm-dashboard.css') }));

		var root = E('div', { 'class': 'rmm-dashboard' });
		this.update(root, data);
		poll.add(L.bind(function() {
			return this.load().then(L.bind(function(next) { this.update(root, next); }, this));
		}, this), 30);
		return root;
	},

	update: function(root, data) {
		var board = data[0].value || {};
		var info = data[1].value || {};
		var interfaces = data[2].value || {};
		var services = data[3].value || {};
		var configReady = !data[4].error;
		var wan = (interfaces.interface || []).filter(function(entry) { return entry.interface === 'wan' || entry.interface === 'wan6'; });
		var onlineWan = wan.filter(function(entry) { return entry.up; });
		var agent = services['rmm-agent'];
		var running = !!(agent && agent.instances && Object.keys(agent.instances).some(function(key) { return agent.instances[key].running; }));
		var enabled = configReady ? uci.get('rmm-agent', 'main', 'enabled') === '1' : false;
		var memory = info.memory || {};
		var load = Array.isArray(info.load) ? info.load.map(function(value) { return (value / 65536).toFixed(2); }).join(' / ') : tr('Unavailable');
		var wanStatus = data[2].error ? tr('Unavailable') : !wan.length ? tr('Not configured') : onlineWan.length ? tr('Connected') : tr('Disconnected');
		var agentStatus = data[3].error || !configReady ? tr('Unavailable') : running ? tr('Running') : enabled ? tr('Stopped') : tr('Disabled');
		var cards = [
			section(tr('Router'), [
				item(tr('Hostname'), board.hostname || tr('Unavailable')),
				item(tr('Model'), board.model || tr('Unavailable')),
				item(tr('Firmware'), board.release && board.release.description || tr('Unavailable')),
				item(tr('Uptime'), formatDuration(info.uptime))
			]),
			section(tr('System'), [
				item(tr('Load (1 / 5 / 15 min)'), load),
				item(tr('Memory total'), formatBytes(memory.total)),
				item(tr('Memory available'), formatBytes(memory.available))
			]),
			section(tr('WAN connection'), [
				item(tr('Status'), wanStatus, onlineWan.length ? 'ok' : wan.length ? 'warning' : ''),
				item(tr('Interface'), onlineWan.length ? onlineWan.map(function(entry) { return entry.interface; }).join(', ') : wan.length ? wan.map(function(entry) { return entry.interface; }).join(', ') : tr('Unavailable')),
				item(tr('IP address'), onlineWan.length ? onlineWan.map(firstAddress).join(', ') : tr('Unavailable'))
			]),
			section(tr('RMM agent'), [
				item(tr('Status'), agentStatus, running ? 'ok' : enabled ? 'warning' : ''),
				item(tr('Heartbeat interval'), configReady ? '%s %s'.format(uci.get('rmm-agent', 'main', 'interval_seconds') || '30', tr('s')) : tr('Unavailable')),
				item(tr('Connectivity check interval'), configReady ? '%s %s'.format(uci.get('rmm-agent', 'main', 'connectivity_check_interval_seconds') || '300', tr('s')) : tr('Unavailable'))
			])
		];

		root.replaceChildren(
			E('div', { 'class': 'rmm-dashboard-heading' }, [
				E('div', {}, [ E('div', { 'class': 'rmm-dashboard-eyebrow' }, tr('SYSTEM / OVERVIEW')), E('h1', {}, tr('RMM overview')) ]),
				E('span', { 'class': 'rmm-dashboard-refresh' }, tr('Updates every 30 seconds'))
			]),
			E('div', { 'class': 'rmm-dashboard-grid' }, cards),
			E('p', { 'class': 'rmm-dashboard-note' }, tr('WAN status shows the interface link state; it does not test Internet reachability.'))
		);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
