'use strict';
'require rpc';
'require poll';
'require view';

var callBoard = rpc.declare({ object: 'system', method: 'board', expect: { '': {} } });
var callInfo = rpc.declare({ object: 'system', method: 'info', expect: { '': {} } });
var callInterfaces = rpc.declare({ object: 'network.interface', method: 'dump', expect: { '': {} } });
var callServices = rpc.declare({ object: 'service', method: 'list', params: [ 'name' ], expect: { '': {} } });

var callDevices = rpc.declare({ object: 'network.device', method: 'status', expect: { '': {} } });

var callConfig = rpc.declare({ object: 'uci', method: 'get', params: [ 'config', 'section' ], expect: { values: {} } });

var russian = {
	'Partial data': 'Часть данных недоступна', 'Loading': 'Загрузка', 'Current': 'Актуально', 'Stale': 'Устаревшие данные',
	'Access denied': 'Нет доступа', 'Last successful update': 'Последнее успешное обновление',
	'Never updated': 'Ещё не обновлялось', 'Retry': 'Повторить', 'Refreshing': 'Обновление',
	'Memory used': 'Занято памяти', 'Network': 'Сеть', 'Device': 'Устройство',
	'Received / sent': 'Принято / отправлено', 'RX / TX rate': 'Скорость RX / TX',
	'Collecting': 'Накопление данных', 'Not installed': 'Не установлен',
	'No interfaces': 'Нет интерфейсов', 'Sources': 'Источники',
	'Traffic counters belong to devices; shared devices are not summed.': 'Счётчики относятся к устройствам; общие устройства не суммируются.',
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

function requested(call, valid) {
	return Promise.resolve().then(call).then(function(value) {
		if (!value || typeof value !== 'object' || Array.isArray(value) || valid && !valid(value))
			throw new Error('Invalid response');
		return { value: value, at: Date.now() };
	}).catch(function(error) { return { error: error || new Error('Unavailable') }; });
}

function finite(value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0; }
function failure(error) {
	return tr(error && (error.code === 6 || error.code === 403 || /permission|access denied/i.test(error.message || '')) ? 'Access denied' : 'Unavailable');
}
function clock(at) { return at ? new Date(at).toLocaleTimeString(document.documentElement.lang || undefined) : tr('Never updated'); }
function rate(current, previous, elapsed) {
	if (!finite(current)) return tr('Unavailable');
	return finite(previous) && current >= previous && elapsed > 0 ? formatTraffic((current - previous) / elapsed) + '/s' : tr('Collecting');
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
	return _('%s MiB').format((bytes / 1048576).toFixed(1));
}

function formatTraffic(bytes) {
	if (!finite(bytes)) return tr('Unavailable');
	var units = [ 'B', 'KiB', 'MiB', 'GiB', 'TiB' ], index = 0;
	while (bytes >= 1024 && index < units.length - 1) { bytes /= 1024; index++; }
	return bytes.toFixed(index ? 1 : 0) + ' ' + units[index];
}

function item(label, value, state) {
	return E('div', { 'class': 'rmm-dashboard-row' }, [
		E('dt', {}, label),
		E('dd', { 'class': state ? 'rmm-dashboard-value rmm-dashboard-' + state : 'rmm-dashboard-value' }, value)
	]);
}

function reportedText(value) { return typeof value === 'string' && value.length ? value : tr('Unavailable'); }

function firstAddress(iface) {
	var ipv4 = iface && iface['ipv4-address'];
	var ipv6 = iface && iface['ipv6-address'];
	var addresses = Array.isArray(ipv4) && ipv4.length ? ipv4 : ipv6;
	return Array.isArray(addresses) && addresses.length && addresses[0] && typeof addresses[0].address === 'string' ? addresses[0].address : tr('No address');
}

return view.extend({
	load: function() {
		if (this.pending) return this.pending;
		this.pending = Promise.all([
			requested(callBoard, function(v) { return typeof v.hostname === 'string' || typeof v.model === 'string'; }),
			requested(callInfo, function(v) { return finite(v.uptime) && !!v.memory; }),
			requested(callInterfaces, function(v) { return Array.isArray(v.interface); }),
			requested(function() { return callServices('rmm-agent'); }),
			requested(function() { return callConfig('rmm-agent', 'main').then(function(v) {
				if (!v || !Object.keys(v).length) throw new Error('No agent configuration');
				return { enabled: v.enabled, heartbeat: v.interval_seconds, connectivity: v.connectivity_check_interval_seconds };
			}); }),
			requested(callDevices)
		]).finally(L.bind(function() { this.pending = null; }, this));
		return this.pending;
	},

	render: function(data) {
		if (!document.getElementById('rmm-dashboard-styles'))
			document.head.appendChild(E('link', { id: 'rmm-dashboard-styles', rel: 'stylesheet', href: L.resource('view/status/rmm-dashboard.css') + '?v=0.5.0' }));
		this.sources = [];
		this.slots = {};
		this.status = E('span', { 'class': 'rmm-dashboard-refresh', role: 'status', 'aria-live': 'polite' }, tr('Loading'));
		this.retry = E('button', { 'class': 'btn', type: 'button', click: L.bind(function() { return this.refresh(); }, this) }, tr('Retry'));
		var root = E('div', { 'class': 'rmm-dashboard' });
		var sections = [ ['system', 'System'], ['network', 'Network'], ['agent', 'RMM agent'] ].map(L.bind(function(entry) {
			this.slots[entry[0]] = E('div', { 'class': 'rmm-dashboard-content' });
			return E('section', { 'class': 'rmm-dashboard-section' }, [ E('h2', {}, tr(entry[1])), this.slots[entry[0]] ]);
		}, this));
		root.appendChild(E('div', { 'class': 'rmm-dashboard-heading' }, [
			E('div', {}, [ E('div', { 'class': 'rmm-dashboard-eyebrow' }, tr('SYSTEM / OVERVIEW')), E('h1', {}, tr('RMM overview')) ]),
			E('div', { 'class': 'rmm-dashboard-toolbar' }, [ this.status, this.retry ])
		]));
		root.appendChild(E('p', { 'class': 'rmm-dashboard-note' }, tr('Updates every 30 seconds')));
		root.appendChild(E('div', { 'class': 'rmm-dashboard-grid' }, sections));
		root.appendChild(E('p', { 'class': 'rmm-dashboard-note' }, tr('WAN status shows the interface link state; it does not test Internet reachability.')));
		root.appendChild(E('p', { 'class': 'rmm-dashboard-note' }, tr('Traffic counters belong to devices; shared devices are not summed.')));
		this.update(root, data);
		this.root = root;
		poll.add(L.bind(this.refresh, this), 30);
		return root;
	},

	refresh: function() {
		this.retry.disabled = true;
		this.retry.textContent = tr('Refreshing');
		return this.load().then(L.bind(function(data) { this.update(this.root, data); }, this)).finally(L.bind(function() {
			this.retry.disabled = false;
			this.retry.textContent = tr('Retry');
		}, this));
	},

	update: function(root, data) {
		var previousDevices = this.sources[5];
		var previousInfo = this.sources[1];
		data.forEach(L.bind(function(result, index) {
			var previous = this.sources[index];
			this.sources[index] = result.error ? { value: previous && previous.value, at: previous && previous.at, error: result.error } : result;
		}, this));
		var sources = this.sources;
		function state(index) {
			var source = sources[index];
			var stale = !!source.value && (!!source.error || Date.now() - source.at > 65000);
			return stale ? tr('Stale') + (source.error ? ' · ' + failure(source.error) : '') : source.error ? failure(source.error) : tr('Current');
		}
		function sourceLine(label, index) {
			return E('p', { 'class': 'rmm-dashboard-source' + (sources[index].error ? ' rmm-dashboard-warning' : '') }, [
				E('span', {}, label + ': ' + state(index) + ' · ' + tr('Last successful update') + ': '),
				E('time', { datetime: sources[index].at ? new Date(sources[index].at).toISOString() : '' }, clock(sources[index].at))
			]);
		}
		var board = sources[0].value || {}, info = sources[1].value || {}, memory = info.memory || {};
		var interfaces = sources[2].value || {}, services = sources[3].value || {}, config = sources[4].value || {};
		var devices = sources[5].value || {};
		var entries = Array.isArray(interfaces.interface) ? interfaces.interface.filter(function(e) { return e && typeof e.interface === 'string'; }) : [];
		var wan = entries.filter(function(e) { return e.interface === 'wan' || e.interface === 'wan6'; });
		var agent = services['rmm-agent'];
		var running = !!(agent && agent.instances && Object.keys(agent.instances).some(function(k) { return agent.instances[k] && agent.instances[k].running; }));
		var used = finite(memory.total) && memory.total > 0 && finite(memory.available) && memory.available <= memory.total ? memory.total - memory.available : null;
		var rebooted = previousInfo && finite(previousInfo.value && previousInfo.value.uptime) && finite(info.uptime) && info.uptime < previousInfo.value.uptime;
		var load = Array.isArray(info.load) && info.load.every(finite) ? info.load.map(function(v) { return (v / 65536).toFixed(2); }).join(' / ') : tr('Unavailable');
		this.slots.system.replaceChildren(sourceLine('system.board', 0), sourceLine('system.info', 1), E('dl', {}, [
			item(tr('Hostname'), reportedText(board.hostname)), item(tr('Model'), reportedText(board.model)),
			item(tr('Firmware'), reportedText(board.release && board.release.description)), item(tr('Uptime'), formatDuration(info.uptime)),
			item(tr('Load (1 / 5 / 15 min)'), load), item(tr('Memory total'), formatBytes(memory.total)),
			item(tr('Memory available'), formatBytes(memory.available)), item(tr('Memory used'), used === null ? tr('Unavailable') : formatBytes(used) + ' (' + (used / memory.total * 100).toFixed(1) + '%)')
		]));
		var networkRows = [sourceLine('network.interface.dump', 2), sourceLine('network.device.status', 5), E('dl', {}, [
			item(tr('WAN connection'), sources[2].error && !sources[2].value ? failure(sources[2].error) : !wan.length ? tr('Not configured') : wan.some(function(e) { return e.up; }) ? tr('Connected') : tr('Disconnected'))
		])];
		entries.forEach(function(entry) {
			var name = entry.l3_device || entry.device;
			var stats = devices[name] && devices[name].statistics || {};
			var before = previousDevices && previousDevices.value && previousDevices.value[name] && previousDevices.value[name].statistics || {};
			var elapsed = previousDevices ? (sources[5].at - previousDevices.at) / 1000 : 0;
			var fresh = !sources[5].error && !sources[2].error && !rebooted;
			networkRows.push(E('h3', {}, entry.interface), E('dl', {}, [
				item(tr('Status'), entry.up ? tr('Connected') : tr('Disconnected'), entry.up ? 'ok' : 'warning'),
				item(tr('Device'), reportedText(name)), item(tr('IP address'), firstAddress(entry)),
				item(tr('Received / sent'), formatTraffic(stats.rx_bytes) + ' / ' + formatTraffic(stats.tx_bytes)),
				item(tr('RX / TX rate'), fresh ? rate(stats.rx_bytes, before.rx_bytes, elapsed) + ' / ' + rate(stats.tx_bytes, before.tx_bytes, elapsed) : tr('Unavailable'))
			]));
		});
		if (!entries.length) networkRows.push(E('p', { 'class': 'rmm-dashboard-source' }, sources[2].error ? failure(sources[2].error) : tr('No interfaces')));
		this.slots.network.replaceChildren.apply(this.slots.network, networkRows);
		var agentStatus = !sources[3].value ? failure(sources[3].error) : !agent ? tr('Not installed') : running ? tr('Running') : !sources[4].value ? failure(sources[4].error) : config.enabled === '1' ? tr('Stopped') : tr('Disabled');
		this.slots.agent.replaceChildren(sourceLine('service.list', 3), sourceLine('uci rmm-agent', 4), E('dl', {}, [
			item(tr('Status'), agentStatus, running ? 'ok' : agent ? 'warning' : ''),
			item(tr('Heartbeat interval'), sources[4].value ? (config.heartbeat || '30') + ' ' + tr('s') : failure(sources[4].error)),
			item(tr('Connectivity check interval'), sources[4].value ? (config.connectivity || '300') + ' ' + tr('s') : failure(sources[4].error))
		]));
		var errors = sources.filter(function(s) { return s.error; }).length;
		var stateCode = errors ? sources.some(function(s) { return s.error && s.value; }) ? 'Stale' : errors === sources.length ? 'Unavailable' : 'Partial data' : 'Current';
		// Announce only state transitions, not every successful telemetry poll.
		var statusText = tr(stateCode);
		if (this.status.textContent !== statusText) this.status.textContent = statusText;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
