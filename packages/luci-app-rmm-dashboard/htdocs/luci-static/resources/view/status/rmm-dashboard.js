'use strict';
'require rpc';
'require poll';
'require view';

var callBoard = rpc.declare({ object: 'system', method: 'board', expect: { '': {} } });
var callInfo = rpc.declare({ object: 'system', method: 'info', expect: { '': {} } });
var callInterfaces = rpc.declare({ object: 'network.interface', method: 'dump', expect: { '': {} } });
var callServices = rpc.declare({ object: 'service', method: 'list', params: [ 'name' ], expect: { '': {} } });

var callDevices = rpc.declare({ object: 'network.device', method: 'status', expect: { '': {} } });

var callWifiDevices = rpc.declare({ object: 'iwinfo', method: 'devices', expect: { '': {} } });
var callWifiInfo = rpc.declare({ object: 'iwinfo', method: 'info', params: ['device'], expect: { '': {} } });
var callWifiStations = rpc.declare({ object: 'iwinfo', method: 'assoclist', params: ['device'], expect: { '': {} } });
var callLeases = rpc.declare({ object: 'luci-rpc', method: 'getDHCPLeases', expect: { '': {} } });

var callConfig = rpc.declare({ object: 'uci', method: 'get', params: [ 'config', 'section' ], expect: { values: {} } });

var russian = {
	"Wireless": "Беспроводная сеть",
	"Associated stations": "Подключённые станции",
	"Radio": "Радиомодуль",
	"Band": "Диапазон",
	"Channel": "Канал",
	"Channel mode": "Режим канала",
	"TX power": "Мощность TX",
	"Noise": "Шум",
	"Signal": "Сигнал",
	"Link rate RX / TX": "Скорость соединения RX / TX",
	"MAC address": "MAC-адрес",
	"Connected time": "Время подключения",
	"No associated stations": "Нет подключённых станций",
	"No wireless interfaces reported": "Беспроводные интерфейсы не найдены",
	"No local DHCP record": "Нет локальной DHCP-записи",
	"Wireless interfaces visible to iwinfo are shown; disabled radios are not inventoried.": "Показаны интерфейсы, доступные iwinfo; выключенные радиомодули не входят в этот список.",
	"Link rates are negotiated Wi-Fi rates, not measured traffic.": "Скорость Wi-Fi-соединения не равна фактическому трафику.",
	"Invalid station records": "Некорректные записи станций",
	'Traffic history': 'История трафика', 'Memory history': 'История памяти',
	'Last 5 minutes': 'Последние 5 минут', 'Peak': 'Максимум',
	'History starts when this page opens. Gaps indicate unavailable data.': 'История начинается при открытии страницы. Разрывы означают отсутствие данных.',
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

// Five minutes in this view instance only; no router storage or extra timer.
var historyWindow = 300000;
var historyLimit = 61;
function remember(samples, sample, now) {
	var recent = samples.filter(function(point) { return point.at >= now - historyWindow && point.at <= now; });
	var previous = recent[recent.length - 1];
	if (previous && sample.at < previous.at) return recent;
	// Manual Retry may be frequent: retain the latest sample per five-second bucket.
	if (previous && Math.floor(sample.at / 5000) === Math.floor(previous.at / 5000)) recent[recent.length - 1] = sample;
	else recent.push(sample);
	return recent.slice(-historyLimit);
}
function sourceFresh(source, now) { return !source.error && finite(source.at) && source.at <= now && now - source.at <= 65000; }
function byteRate(current, previous, elapsed) {
	return finite(current) && finite(previous) && current >= previous && elapsed > 0 && elapsed <= 65 ? (current - previous) / elapsed : null;
}
function svgElement(tag, attributes, children) {
	var node = document.createElementNS('http://www.w3.org/2000/svg', tag);
	Object.keys(attributes || {}).forEach(function(key) { node.setAttribute(key, attributes[key]); });
	(children || []).forEach(function(child) { node.appendChild(child); });
	return node;
}
function historyChart(title, samples, series, fixedMax, format, now) {
	var latest = samples[samples.length - 1];
	var peak = Math.max.apply(null, [0].concat(samples.flatMap(function(point) { return series.map(function(entry) { return finite(point[entry.key]) ? point[entry.key] : 0; }); })));
	var max = fixedMax || Math.max(1, peak);
	var hasValues = samples.some(function(point) { return series.some(function(entry) { return finite(point[entry.key]); }); });
	var summary = series.map(function(entry) { return entry.label + ': ' + (latest && finite(latest[entry.key]) ? format(latest[entry.key]) : tr('Unavailable')); }).join(' · ');
	var figure = E('figure', { 'class': 'rmm-dashboard-chart' }, [
		E('figcaption', {}, [E('span', { 'class': 'rmm-dashboard-chart-title' }, title), E('span', {}, tr('Last 5 minutes'))]),
		E('p', { 'class': 'rmm-dashboard-chart-summary' }, summary)
	]);
	var svg = svgElement('svg', { viewBox: '0 0 600 140', role: 'img', 'aria-label': title + ' · ' + summary + ' · ' + tr('Peak') + ': ' + (hasValues ? format(peak) : tr('Unavailable')) });
	[12, 64, 116].forEach(function(y) { svg.appendChild(svgElement('line', { x1: '8', x2: '592', y1: y, y2: y, 'class': 'rmm-dashboard-chart-grid' })); });
	series.forEach(function(entry) {
		var commands = [], previous = null;
		samples.forEach(function(point) {
			if (!finite(point[entry.key])) { previous = null; return; }
			var x = 8 + Math.max(0, Math.min(1, (point.at - (now - historyWindow)) / historyWindow)) * 584;
			var y = 116 - Math.min(1, point[entry.key] / max) * 104;
			commands.push((previous && point.at - previous.at <= 65000 ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2));
			previous = point;
		});
		if (commands.length) svg.appendChild(svgElement('path', { d: commands.join(' '), 'class': 'rmm-dashboard-chart-line rmm-dashboard-chart-' + entry.key, fill: 'none', 'vector-effect': 'non-scaling-stroke' }));
	});
	figure.appendChild(svg);
	figure.appendChild(E('p', { 'class': 'rmm-dashboard-chart-scale' }, [E('span', {}, format(0)), E('span', {}, format(max))]));
	figure.appendChild(E('p', { 'class': 'rmm-dashboard-chart-times' }, [E('span', {}, clock(now - historyWindow)), E('span', {}, clock(now))]));
	if (samples.filter(function(point) { return series.some(function(entry) { return finite(point[entry.key]); }); }).length < 2)
		figure.appendChild(E('p', { 'class': 'rmm-dashboard-note' }, tr('Collecting')));
	return figure;
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

function wifiLoad() {
	return callWifiDevices().then(function(reply) {
		if (!reply || !Array.isArray(reply.devices) || reply.devices.length > 64 || reply.devices.some(function(name) { return typeof name !== 'string' || !/^[A-Za-z0-9_.:-]{1,64}$/.test(name); })) throw new Error('Invalid wireless interfaces');
		return Promise.all(Array.from(new Set(reply.devices)).sort().map(function(device) {
			return Promise.all([requested(function() { return callWifiInfo(device); }, function(info) { return typeof info.phy === 'string' || typeof info.ssid === 'string' || typeof info.mode === 'string'; }),
				requested(function() { return callWifiStations(device); }, function(reply) { return Array.isArray(reply.results); })]).then(function(results) { return {device:device,info:results[0],stations:results[1]}; });
		})).then(function(interfaces) { return {interfaces:interfaces}; });
	});
}
function cachedResult(result, previous) { return result.error ? {value:previous && previous.value,at:previous && previous.at,error:result.error} : result; }
function signalText(value) {
	if (typeof value !== 'number' || !Number.isInteger(value)) return tr('Unavailable');
	if (value > 2147483647 && value <= 4294967295) value -= 4294967296;
	return value < 0 && value >= -127 ? value + ' dBm' : tr('Unavailable');
}
function bandName(info) {
	var frequency = info.frequency;
	return finite(frequency) ? frequency >= 2400 && frequency < 2500 ? '2.4 GHz' : frequency >= 4900 && frequency < 5925 ? '5 GHz' : frequency >= 5925 && frequency <= 7125 ? '6 GHz' : frequency >= 57000 && frequency <= 71000 ? '60 GHz' : tr('Unavailable') : tr('Unavailable');
}
function linkRate(value) { return value && finite(value.rate) && value.rate > 0 ? (value.rate / 1000).toFixed(1) + ' Mbit/s' : tr('Unavailable'); }
function resultLine(label, result, parentError) {
	var error = parentError || result.error;
	var stale = result.value && (error || !sourceFresh(result, Date.now()));
	var state = stale ? tr('Stale') + (error ? ' · ' + failure(error) : '') : error ? failure(error) : tr('Current');
	return E('p', { 'class':'rmm-dashboard-source' }, [label + ': ' + state + ' · ' + tr('Last successful update') + ': ', E('time', {datetime:result.at ? new Date(result.at).toISOString() : ''}, clock(result.at))]);
}
function stationList(reply) { return reply && Array.isArray(reply.results) ? reply.results.filter(function(row) { return row && typeof row.mac === 'string' && /^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(row.mac); }) : []; }
function leaseMap(reply) {
	var hosts = Object.create(null);
	['dhcp_leases','dhcp6_leases'].forEach(function(key) {
		(Array.isArray(reply[key]) ? reply[key] : []).forEach(function(lease) {
			if (!lease || typeof lease.macaddr !== 'string' || !/^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(lease.macaddr)) return;
			var host = hosts[lease.macaddr.toUpperCase()] || (hosts[lease.macaddr.toUpperCase()] = {addresses:[]});
			if (typeof lease.hostname === 'string' && lease.hostname.length && lease.hostname !== '*') host.name = lease.hostname;
			[lease.ipaddr,lease.ip6addr].concat(Array.isArray(lease.ip6addrs) ? lease.ip6addrs : []).forEach(function(address) { if (typeof address === 'string' && address.length && !host.addresses.includes(address)) host.addresses.push(address); });
		});
	});
	return hosts;
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
			requested(callDevices),
			requested(wifiLoad),
			requested(callLeases, function(reply) { return Array.isArray(reply.dhcp_leases) || Array.isArray(reply.dhcp6_leases); })
		]).finally(L.bind(function() { this.pending = null; }, this));
		return this.pending;
	},

	render: function(data) {
		if (!document.getElementById('rmm-dashboard-styles'))
			document.head.appendChild(E('link', { id: 'rmm-dashboard-styles', rel: 'stylesheet', href: L.resource('view/status/rmm-dashboard.css') + '?v=0.5.0' }));
		this.sources = [];
		this.history = { memory: [], devices: Object.create(null) };
		this.slots = {};
		this.status = E('span', { 'class': 'rmm-dashboard-refresh', role: 'status', 'aria-live': 'polite' }, tr('Loading'));
		this.retry = E('button', { 'class': 'btn', type: 'button', click: L.bind(function() { return this.refresh(); }, this) }, tr('Retry'));
		var root = E('div', { 'class': 'rmm-dashboard' });
		var sections = [ ['system', 'System'], ['network', 'Network'], ['wireless', 'Wireless'], ['agent', 'RMM agent'] ].map(L.bind(function(entry) {
			this.slots[entry[0]] = E('div', { 'class': 'rmm-dashboard-content' });
			return E('section', { 'class': 'rmm-dashboard-section' }, [ E('h2', {}, tr(entry[1])), this.slots[entry[0]] ]);
		}, this));
		root.appendChild(E('div', { 'class': 'rmm-dashboard-heading' }, [
			E('div', {}, [ E('div', { 'class': 'rmm-dashboard-eyebrow' }, tr('SYSTEM / OVERVIEW')), E('h1', {}, tr('RMM overview')) ]),
			E('div', { 'class': 'rmm-dashboard-toolbar' }, [ this.status, this.retry ])
		]));
		root.appendChild(E('p', { 'class': 'rmm-dashboard-note' }, tr('Updates every 30 seconds')));
		root.appendChild(E('p', { 'class': 'rmm-dashboard-note' }, tr('History starts when this page opens. Gaps indicate unavailable data.')));
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
		var previousWireless = this.sources[6];
		data.forEach(L.bind(function(result, index) {
			var previous = this.sources[index];
			this.sources[index] = result.error ? { value: previous && previous.value, at: previous && previous.at, error: result.error } : result;
		}, this));
		var sources = this.sources;
		if (sources[6].value && !sources[6].error) {
			var oldWireless = Object.create(null);
			((previousWireless && previousWireless.value && previousWireless.value.interfaces) || []).forEach(function(entry) { oldWireless[entry.device] = entry; });
			sources[6] = Object.assign({}, sources[6], {value:{interfaces:sources[6].value.interfaces.map(function(entry) {
				var previous = oldWireless[entry.device];
				return {device:entry.device,info:cachedResult(entry.info,previous && previous.info),stations:cachedResult(entry.stations,previous && previous.stations)};
			})}});
		}

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
		var now = Date.now();
		if (rebooted) this.history = { memory: [], devices: Object.create(null) };
		var history = this.history;
		history.memory = remember(history.memory, { at: now, used: sourceFresh(sources[1], now) && used !== null ? used / memory.total * 100 : null }, now);
		var load = Array.isArray(info.load) && info.load.every(finite) ? info.load.map(function(v) { return (v / 65536).toFixed(2); }).join(' / ') : tr('Unavailable');
		this.slots.system.replaceChildren(sourceLine('system.board', 0), sourceLine('system.info', 1), E('dl', {}, [
			item(tr('Hostname'), reportedText(board.hostname)), item(tr('Model'), reportedText(board.model)),
			item(tr('Firmware'), reportedText(board.release && board.release.description)), item(tr('Uptime'), formatDuration(info.uptime)),
			item(tr('Load (1 / 5 / 15 min)'), load), item(tr('Memory total'), formatBytes(memory.total)),
			item(tr('Memory available'), formatBytes(memory.available)), item(tr('Memory used'), used === null ? tr('Unavailable') : formatBytes(used) + ' (' + (used / memory.total * 100).toFixed(1) + '%)')
		]));
		this.slots.system.appendChild(historyChart(tr('Memory history'), history.memory, [{key: 'used', label: tr('Memory used')}], 100, function(value) { return value.toFixed(1) + '%'; }, now));
		var seenDevices = Object.create(null);
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
			if (typeof name === 'string' && !seenDevices[name]) {
				seenDevices[name] = true;
				var validBaseline = fresh && sourceFresh(sources[1], now) && sourceFresh(sources[2], now) && sourceFresh(sources[5], now) && previousDevices && !previousDevices.error && previousInfo && !previousInfo.error;
				history.devices[name] = remember(history.devices[name] || [], { at: now,
					rx: validBaseline ? byteRate(stats.rx_bytes, before.rx_bytes, elapsed) : null,
					tx: validBaseline ? byteRate(stats.tx_bytes, before.tx_bytes, elapsed) : null }, now);
				networkRows.push(historyChart(tr('Traffic history') + ' · ' + name, history.devices[name], [{key:'rx',label:'RX'}, {key:'tx',label:'TX'}], null, function(value) { return formatTraffic(value) + '/s'; }, now));
			}
		});
		Object.keys(history.devices).forEach(function(name) { if (!seenDevices[name]) delete history.devices[name]; });
		if (!entries.length) networkRows.push(E('p', { 'class': 'rmm-dashboard-source' }, sources[2].error ? failure(sources[2].error) : tr('No interfaces')));
		this.slots.network.replaceChildren.apply(this.slots.network, networkRows);
		var wirelessRows = [sourceLine('iwinfo.devices',6),sourceLine('luci-rpc.getDHCPLeases',7),E('p',{'class':'rmm-dashboard-source'},tr('Wireless interfaces visible to iwinfo are shown; disabled radios are not inventoried.'))];
		var wireless = sources[6].value && sources[6].value.interfaces || [];
		var hosts = leaseMap(sources[7].value || {});
		wireless.forEach(function(entry) {
			var info = entry.info.value || {}, stations = stationList(entry.stations.value);
			wirelessRows.push(E('h3',{},entry.device),resultLine('iwinfo.info',entry.info,sources[6].error),E('dl',{},[
				item(tr('Radio'),reportedText(info.phy)),item('SSID',reportedText(info.ssid)),item(tr('Band'),bandName(info)),
				item(tr('Channel'),finite(info.channel) && info.channel > 0 ? String(info.channel) : tr('Unavailable')),
				item(tr('Channel mode'),reportedText(info.htmode)),item(tr('TX power'),finite(info.txpower) ? info.txpower + ' dBm' : tr('Unavailable')),
				item(tr('Noise'),signalText(info.noise)),item(tr('Associated stations'),entry.stations.value ? String(stations.length) : failure(entry.stations.error))
			]),resultLine('iwinfo.assoclist',entry.stations,sources[6].error));
			if (entry.stations.value && entry.stations.value.results.length !== stations.length) wirelessRows.push(E('p',{'class':'rmm-dashboard-source rmm-dashboard-warning'},tr('Invalid station records') + ': ' + (entry.stations.value.results.length - stations.length)));
			stations.forEach(function(station) {
				var mac = station.mac.toUpperCase(), host = hosts[mac] || {};
				wirelessRows.push(E('div',{'class':'rmm-dashboard-station'},[E('h4',{},host.name || mac),E('dl',{},[
					item(tr('MAC address'),mac),item(tr('IP address'),host.addresses && host.addresses.length ? host.addresses.join(' / ') : tr('No local DHCP record')),
					item(tr('Signal'),signalText(station.signal)),item(tr('Link rate RX / TX'),linkRate(station.rx) + ' / ' + linkRate(station.tx)),item(tr('Connected time'),formatDuration(station.connected_time))
				])]));
			});
			if (entry.stations.value && !entry.stations.value.results.length) wirelessRows.push(E('p',{'class':'rmm-dashboard-source'},tr('No associated stations')));
		});
		if (!wireless.length) wirelessRows.push(E('p',{'class':'rmm-dashboard-source'},sources[6].error ? failure(sources[6].error) : tr('No wireless interfaces reported')));
		wirelessRows.push(E('p',{'class':'rmm-dashboard-source'},tr('Link rates are negotiated Wi-Fi rates, not measured traffic.')));
		this.slots.wireless.replaceChildren.apply(this.slots.wireless,wirelessRows);
		var agentStatus = !sources[3].value ? failure(sources[3].error) : !agent ? tr('Not installed') : running ? tr('Running') : !sources[4].value ? failure(sources[4].error) : config.enabled === '1' ? tr('Stopped') : tr('Disabled');
		this.slots.agent.replaceChildren(sourceLine('service.list', 3), sourceLine('uci rmm-agent', 4), E('dl', {}, [
			item(tr('Status'), agentStatus, running ? 'ok' : agent ? 'warning' : ''),
			item(tr('Heartbeat interval'), sources[4].value ? (config.heartbeat || '30') + ' ' + tr('s') : failure(sources[4].error)),
			item(tr('Connectivity check interval'), sources[4].value ? (config.connectivity || '300') + ' ' + tr('s') : failure(sources[4].error))
		]));
		var nestedErrors = wireless.some(function(entry) { return entry.info.error || entry.stations.error; });
		var errors = sources.filter(function(s) { return s.error; }).length;
		var cachedWirelessError = wireless.some(function(entry) { return entry.info.error && entry.info.value || entry.stations.error && entry.stations.value; });
		var stateCode = sources.some(function(s) { return s.value && !sourceFresh(s, Date.now()); }) || cachedWirelessError ? 'Stale' : errors === sources.length ? 'Unavailable' : errors || nestedErrors ? 'Partial data' : 'Current';
		// Announce only state transitions, not every successful telemetry poll.
		var statusText = tr(stateCode);
		if (this.status.textContent !== statusText) this.status.textContent = statusText;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
