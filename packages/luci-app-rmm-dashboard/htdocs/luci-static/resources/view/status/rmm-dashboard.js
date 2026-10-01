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
 "Router overview": "Обзор роутера", "Wi-Fi clients": "Клиенты Wi-Fi", "Memory": "Память",
 "WAN traffic": "Трафик WAN", "Network interfaces": "Сетевые интерфейсы",
 "Router details": "Детали роутера", "Reported radios": "Доступные радиомодули",
 "No WAN device reported": "Устройство WAN не указано", "Summary": "Сводка",

	"Network relationships": "Связи сети",
	"Local router": "Локальный роутер",
	"Default route gateway": "Шлюз маршрута по умолчанию",
	"No default gateway reported": "Шлюз по умолчанию не указан",
	"Operating mode": "Режим работы",
	"Access point": "Точка доступа",
	"Station mode": "Режим станции",
	"Open station details": "Открыть детали станции",
	"Only reported routes and Wi-Fi associations are shown; physical cabling and Internet reachability are not inferred.": "Показаны указанные маршруты и Wi-Fi-подключения; физическая коммутация и доступ в Интернет не определяются.",
	"Search clients": "Поиск клиентов",
	"All bands": "Все диапазоны",
	"All signals": "Любой сигнал",
	"Signal ≥ -67 dBm": "Сигнал ≥ -67 dBm",
	"Signal -68…-75 dBm": "Сигнал -68…-75 dBm",
	"Signal < -75 dBm": "Сигнал < -75 dBm",
	"Unknown signal": "Сигнал неизвестен",
	"Clear filters": "Сбросить фильтры",
	"No matching stations": "Нет станций по выбранным фильтрам",
	"Station details": "Детали станции",
	"Signal history": "История сигнала",
	"Station traffic": "Трафик станции",
	"Station noise": "Шум станции",
	"Shown / total stations": "Показано / всего станций",
	"Search by name, MAC, IP or SSID": "Поиск по имени, MAC, IP или SSID",
	"Signal bands are filters, not a connection quality score.": "Диапазоны сигнала служат фильтром, а не оценкой качества соединения.",
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
	var svg = svgElement('svg', { viewBox: '0 0 600 140', preserveAspectRatio: 'none', role: 'img', 'aria-label': title + ' · ' + summary + ' · ' + tr('Peak') + ': ' + (hasValues ? format(peak) : tr('Unavailable')) });
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
function signalValue(value) {
	if (typeof value !== 'number' || !Number.isInteger(value)) return null;
	if (value > 2147483647 && value <= 4294967295) value -= 4294967296;
	return value < 0 && value >= -127 ? value : null;
}
function signalText(value) {
	var signal = signalValue(value);
	return signal === null ? tr('Unavailable') : signal + ' dBm';
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
			document.head.appendChild(E('link', { id: 'rmm-dashboard-styles', rel: 'stylesheet', href: L.resource('view/status/rmm-dashboard.css') + '?v=0.6.0' }));
		this.sources = [];
		this.history = { memory: [], devices: Object.create(null) };
		this.slots = {};
		this.stationHistory = Object.create(null);
		this.stationNodes = Object.create(null);
		this.radioNodes = Object.create(null);
		this.status = E('span', { 'class': 'rmm-dashboard-refresh', role: 'status', 'aria-live': 'polite' }, tr('Loading'));
		this.retry = E('button', { 'class': 'btn', type: 'button', click: L.bind(function() { return this.refresh(); }, this) }, tr('Retry'));
		var root = E('div', { 'class': 'rmm-dashboard' });
		this.identity = E('p', {'class':'rmm-dashboard-identity'});
		this.overview = E('section', {'class':'rmm-dashboard-overview','aria-label':tr('Summary')});
		this.agentSummary = E('div', {'class':'rmm-dashboard-agent-summary'});
		this.trafficChart = E('div', {'class':'rmm-dashboard-history-panel'});
		this.memoryChart = E('div', {'class':'rmm-dashboard-history-panel'});
		this.memoryDisclosure = E('details', {'class':'rmm-dashboard-memory rmm-dashboard-disclosure'},[E('summary',{},tr('Memory history')),this.memoryChart]);
		if (typeof window === 'undefined' || !window.matchMedia || !window.matchMedia('(max-width: 767px)').matches) this.memoryDisclosure.setAttribute('open','');
		this.radioContent = E('div', {'class':'rmm-dashboard-radios'});
		function section(title, content) { return E('section', {'class':'rmm-dashboard-section'}, [E('h2',{},tr(title)),content]); }
		var disclosures = [['system','Router details'],['network','Network interfaces'],['topology','Network relationships'],['agent','RMM agent']].map(L.bind(function(entry) {
			this.slots[entry[0]] = E('div', {'class':'rmm-dashboard-content'});
			return E('details', {'class':'rmm-dashboard-disclosure'}, [E('summary',{},tr(entry[1])),this.slots[entry[0]]]);
		},this));
		this.slots.wireless = E('div', {'class':'rmm-dashboard-content'});
		root.appendChild(E('div', {'class':'rmm-dashboard-heading'}, [
			E('div', {}, [E('div', {'class':'rmm-dashboard-eyebrow'},tr('SYSTEM / OVERVIEW')),E('h1',{},tr('Router overview')),this.identity]),
			E('div', {'class':'rmm-dashboard-toolbar'}, [this.status,this.retry])
		]));
		root.appendChild(this.overview);
		root.appendChild(this.agentSummary);
		root.appendChild(E('div', {'class':'rmm-dashboard-charts'}, [this.trafficChart,this.memoryDisclosure]));
		root.appendChild(section('Wireless',this.radioContent));
		root.appendChild(section('Wi-Fi clients',this.slots.wireless));
		root.appendChild(E('div', {'class':'rmm-dashboard-expert'}, disclosures));
		root.appendChild(E('details', {'class':'rmm-dashboard-disclosure rmm-dashboard-help'}, [
			E('summary',{},tr('Sources')),
			E('p', {'class':'rmm-dashboard-note'},tr('Updates every 30 seconds')),
			E('p', {'class':'rmm-dashboard-note'},tr('History starts when this page opens. Gaps indicate unavailable data.')),
			E('p', {'class':'rmm-dashboard-note'},tr('WAN status shows the interface link state; it does not test Internet reachability.')),
			E('p', {'class':'rmm-dashboard-note'},tr('Traffic counters belong to devices; shared devices are not summed.')),
			E('p', {'class':'rmm-dashboard-note'},tr('Signal bands are filters, not a connection quality score.')),
			E('p', {'class':'rmm-dashboard-note'},tr('Wireless interfaces visible to iwinfo are shown; disabled radios are not inventoried.')),
			E('p', {'class':'rmm-dashboard-note'},tr('Link rates are negotiated Wi-Fi rates, not measured traffic.'))
		]));
		var filterChange = L.bind(this.filterStations, this);
		function field(id, label, control) { return E('label', {for:id}, [E('span',{},tr(label)),control]); }
		function select(id, options) { return E('select',{id:id,change:filterChange}, options.map(function(option) { return E('option',{value:option[0]},tr(option[1])); })); }
		this.clientSearch = E('input',{id:'rmm-client-search',type:'search',maxlength:128,input:filterChange,placeholder:tr('Search by name, MAC, IP or SSID')});
		this.clientBand = select('rmm-client-band',[['all','All bands'],['2.4 GHz','2.4 GHz'],['5 GHz','5 GHz'],['6 GHz','6 GHz'],['60 GHz','60 GHz']]);
		this.clientSignal = select('rmm-client-signal',[['all','All signals'],['strong','Signal ≥ -67 dBm'],['medium','Signal -68…-75 dBm'],['weak','Signal < -75 dBm'],['unknown','Unknown signal']]);
		this.clientCount = E('p',{'class':'rmm-dashboard-source',role:'status','aria-live':'polite'});
		this.clientEmpty = E('p',{'class':'rmm-dashboard-source',hidden:''},tr('No matching stations'));
		this.wirelessContent = E('div',{});
		this.slots.wireless.appendChild(E('div',{'class':'rmm-dashboard-filters'},[
			field('rmm-client-search','Search clients',this.clientSearch),field('rmm-client-band','Band',this.clientBand),field('rmm-client-signal','Signal',this.clientSignal),
			E('button',{type:'button','class':'btn',click:L.bind(function() { this.clientSearch.value='';this.clientBand.value='all';this.clientSignal.value='all';this.filterStations(); },this)},tr('Clear filters'))
		]));
		this.slots.wireless.appendChild(this.clientCount);
		this.slots.wireless.appendChild(this.clientEmpty);

		this.slots.wireless.appendChild(E('div',{'class':'rmm-dashboard-client-heading','aria-hidden':'true'},[
			E('span',{},tr('Device')),E('span',{},tr('IP address')),E('span',{},tr('Band')),E('span',{},tr('Signal')),E('span',{},tr('Station details'))
		]));
		this.slots.wireless.appendChild(this.wirelessContent);
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
		if (rebooted) { this.history = { memory: [], devices: Object.create(null) }; this.stationHistory = Object.create(null); }
		var history = this.history;
		history.memory = remember(history.memory, { at: now, used: sourceFresh(sources[1], now) && used !== null ? used / memory.total * 100 : null }, now);
		var load = Array.isArray(info.load) && info.load.every(finite) ? info.load.map(function(v) { return (v / 65536).toFixed(2); }).join(' / ') : tr('Unavailable');
		this.slots.system.replaceChildren(sourceLine('system.board', 0), sourceLine('system.info', 1), E('dl', {}, [
			item(tr('Hostname'), reportedText(board.hostname)), item(tr('Model'), reportedText(board.model)),
			item(tr('Firmware'), reportedText(board.release && board.release.description)), item(tr('Uptime'), formatDuration(info.uptime)),
			item(tr('Load (1 / 5 / 15 min)'), load), item(tr('Memory total'), formatBytes(memory.total)),
			item(tr('Memory available'), formatBytes(memory.available)), item(tr('Memory used'), used === null ? tr('Unavailable') : formatBytes(used) + ' (' + (used / memory.total * 100).toFixed(1) + '%)')
		]));
		this.memoryChart.replaceChildren(historyChart(tr('Memory history'), history.memory, [{key: 'used', label: tr('Memory used')}], 100, function(value) { return value.toFixed(1) + '%'; }, now));
		var seenDevices = Object.create(null), wanCharts = [];
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
				var chart = historyChart(tr('Traffic history') + ' · ' + name, history.devices[name], [{key:'rx',label:'RX'}, {key:'tx',label:'TX'}], null, function(value) { return formatTraffic(value) + '/s'; }, now);
				if (wan.some(function(iface) { return (iface.l3_device || iface.device) === name; })) wanCharts.push(chart);
				else networkRows.push(E('details',{'class':'rmm-dashboard-disclosure'},[E('summary',{},tr('Traffic history') + ' · ' + name),chart]));
			}
		});
		Object.keys(history.devices).forEach(function(name) { if (!seenDevices[name]) delete history.devices[name]; });
		if (!entries.length) networkRows.push(E('p', { 'class': 'rmm-dashboard-source' }, sources[2].error ? failure(sources[2].error) : tr('No interfaces')));
		this.slots.network.replaceChildren.apply(this.slots.network, networkRows);
		this.trafficChart.replaceChildren.apply(this.trafficChart,wanCharts.length ? wanCharts : [E('h2',{},tr('WAN traffic')),E('p',{'class':'rmm-dashboard-source'},sources[2].error ? failure(sources[2].error) : tr('No WAN device reported'))]);
		var wirelessRows = [], radioRows = [], seenRadios = Object.create(null);
		if (sources[6].error) wirelessRows.push(sourceLine('iwinfo.devices',6));
		if (sources[7].error) wirelessRows.push(sourceLine('luci-rpc.getDHCPLeases',7));
		var wireless = sources[6].value && sources[6].value.interfaces || [];
		var hosts = leaseMap(sources[7].value || {});
		var seenStations = Object.create(null);
		var focused = document.activeElement;
		this.clientRecords = [];
		var self = this;
		wireless.forEach(function(entry) {
			var info = entry.info.value || {}, stations = stationList(entry.stations.value);
			var radioMetrics = E('dl',{},[
				item(tr('Interface'),entry.device),item(tr('Radio'),reportedText(info.phy)),item('SSID',reportedText(info.ssid)),item(tr('Band'),bandName(info)),
				item(tr('Channel'),finite(info.channel) && info.channel > 0 ? String(info.channel) : tr('Unavailable')),
				item(tr('Channel mode'),reportedText(info.htmode)),item(tr('TX power'),finite(info.txpower) ? info.txpower + ' dBm' : tr('Unavailable')),
				item(tr('Noise'),signalText(info.noise)),item(tr('Associated stations'),entry.stations.value ? String(stations.length) : failure(entry.stations.error))
			]);
			var radioNode = self.radioNodes[entry.device] || (self.radioNodes[entry.device] = E('details',{'class':'rmm-dashboard-radio rmm-dashboard-disclosure'}));
			seenRadios[entry.device] = true;
			var radioSummary = radioNode.querySelector('summary') || E('summary',{});
			radioSummary.replaceChildren(
					E('span',{'class':'rmm-dashboard-radio-name'},reportedText(info.ssid) + ' · ' + bandName(info)),
					E('span',{'class':'rmm-dashboard-radio-meta'},tr('Channel') + ' ' + (finite(info.channel) && info.channel > 0 ? info.channel : tr('Unavailable')) + ' · ' + reportedText(info.htmode)),
					E('span',{'class':'rmm-dashboard-radio-count'},entry.stations.value ? String(stations.length) + ' · ' + tr('Associated stations') : failure(entry.stations.error)),
					E('span',{'class':'rmm-dashboard-radio-state'},sources[6].error || entry.info.error || entry.stations.error ? (entry.info.value || entry.stations.value ? tr('Stale') + ' · ' : '') + failure(sources[6].error || entry.info.error || entry.stations.error) : tr('Current'))
				);
			radioNode.replaceChildren(radioSummary,radioMetrics,resultLine('iwinfo.info',entry.info,sources[6].error),resultLine('iwinfo.assoclist',entry.stations,sources[6].error));
			radioRows.push(radioNode);
			if (entry.stations.value && entry.stations.value.results.length !== stations.length) wirelessRows.push(E('p',{'class':'rmm-dashboard-source rmm-dashboard-warning'},tr('Invalid station records') + ': ' + (entry.stations.value.results.length - stations.length)));
			stations.forEach(function(station) {
				var mac = station.mac.toUpperCase(), host = hosts[mac] || {}, key = entry.device + '/' + mac;
				seenStations[key] = true;
				var previous = self.stationHistory[key], fresh = sourceFresh(sources[6],now) && sourceFresh(entry.stations,now);
				if (previous && fresh && finite(station.connected_time) && finite(previous.connected) && station.connected_time < previous.connected) previous = null;
				var points = remember(previous && previous.points || [], {at:now,signal:fresh ? signalValue(station.signal) : null},now);
				self.stationHistory[key] = {points:points,connected:fresh ? station.connected_time : previous && previous.connected,lastSeen:now};
				var nodes = self.stationNodes[key];
				if (!nodes) {
					nodes = {root:E('div',{'class':'rmm-dashboard-station'}),title:E('span',{'class':'rmm-dashboard-client-name'}),address:E('span',{'class':'rmm-dashboard-client-address'}),band:E('span',{'class':'rmm-dashboard-client-band'}),signal:E('span',{'class':'rmm-dashboard-client-signal'}),metrics:E('dl',{}),summary:E('summary',{'aria-label':tr('Station details')}),body:E('div',{})};
					nodes.details = E('details',{'class':'rmm-dashboard-station-details'},[nodes.summary,nodes.body]);
					nodes.summary.append(nodes.title,nodes.address,nodes.band,nodes.signal);nodes.root.appendChild(nodes.details);
					self.stationNodes[key] = nodes;
				}
				nodes.title.textContent = host.name || mac;
				nodes.address.textContent = host.addresses && host.addresses.length ? host.addresses.join(' / ') : tr('No local DHCP record');
				nodes.band.textContent = bandName(info);
				nodes.signal.textContent = signalText(station.signal) + (sources[6].error || entry.stations.error ? ' · ' + tr('Stale') : '');
				nodes.summary.setAttribute('aria-label',tr('Station details') + ': ' + nodes.title.textContent);
				nodes.metrics.replaceChildren.apply(nodes.metrics,[item(tr('MAC address'),mac),item(tr('IP address'),host.addresses && host.addresses.length ? host.addresses.join(' / ') : tr('No local DHCP record')),
					item(tr('Signal'),signalText(station.signal)),item(tr('Link rate RX / TX'),linkRate(station.rx) + ' / ' + linkRate(station.tx)),item(tr('Connected time'),formatDuration(station.connected_time))]);
				nodes.body.replaceChildren(nodes.metrics,resultLine('iwinfo.assoclist',entry.stations,sources[6].error),resultLine('luci-rpc.getDHCPLeases',sources[7]),E('dl',{},[
					item(tr('Interface'),entry.device),item(tr('Radio'),reportedText(info.phy)),item('SSID',reportedText(info.ssid)),item(tr('Band'),bandName(info)),
					item(tr('Station noise'),signalText(station.noise)),item(tr('Station traffic'),tr('Unavailable'))
				]),historyChart(tr('Signal history'),points.map(function(point) { return {at:point.at,used:point.signal === null ? null : point.signal + 127}; }),[{key:'used',label:tr('Signal')}],127,function(value) { return (value - 127).toFixed(0) + ' dBm'; },now));
				self.clientRecords.push({node:nodes.root,band:bandName(info),signal:signalValue(station.signal),search:[host.name,mac,entry.device,info.ssid].concat(host.addresses || []).filter(function(value) { return typeof value === 'string'; }).join(' ').toLowerCase()});
				wirelessRows.push(nodes.root);
			});
			if (entry.stations.value && !entry.stations.value.results.length) wirelessRows.push(E('p',{'class':'rmm-dashboard-source'},tr('No associated stations')));
		});
		if (!wireless.length) wirelessRows.push(E('p',{'class':'rmm-dashboard-source'},sources[6].error ? failure(sources[6].error) : tr('No wireless interfaces reported')));

		Object.keys(this.stationHistory).forEach(function(key) {
			if (!seenStations[key]) {
				var history = self.stationHistory[key];
				history.points = remember(history.points,{at:now,signal:null},now);
				if (now - history.lastSeen > historyWindow) delete self.stationHistory[key];
				delete self.stationNodes[key];
			}
		});
		// Bound identities as well as points on networks with high station churn.
		Object.keys(this.stationHistory).sort(function(a,b) { return self.stationHistory[b].lastSeen - self.stationHistory[a].lastSeen; }).slice(256).forEach(function(key) { delete self.stationHistory[key]; });
		Object.keys(this.radioNodes).forEach(function(key) { if (!seenRadios[key]) delete self.radioNodes[key]; });
		this.radioContent.replaceChildren.apply(this.radioContent,radioRows.length ? radioRows : [E('p',{'class':'rmm-dashboard-source'},sources[6].error ? failure(sources[6].error) : tr('No wireless interfaces reported'))]);
		this.wirelessContent.replaceChildren.apply(this.wirelessContent,wirelessRows);
		if (focused && focused.isConnected && (this.wirelessContent.contains(focused) || this.radioContent.contains(focused)) && typeof focused.focus === 'function') focused.focus();
		this.filterStations();
		this.renderRelationships();
		var agentStatus = !sources[3].value ? failure(sources[3].error) : !agent ? tr('Not installed') : running ? tr('Running') : !sources[4].value ? failure(sources[4].error) : config.enabled === '1' ? tr('Stopped') : tr('Disabled');
		this.slots.agent.replaceChildren(sourceLine('service.list', 3), sourceLine('uci rmm-agent', 4), E('dl', {}, [
			item(tr('Status'), agentStatus, running ? 'ok' : agent ? 'warning' : ''),
			item(tr('Heartbeat interval'), sources[4].value ? (config.heartbeat || '30') + ' ' + tr('s') : failure(sources[4].error)),
			item(tr('Connectivity check interval'), sources[4].value ? (config.connectivity || '300') + ' ' + tr('s') : failure(sources[4].error))
		]));
		this.identity.textContent = reportedText(board.hostname) + ' · ' + reportedText(board.release && board.release.description) + ' · ' + tr('Uptime') + ': ' + formatDuration(info.uptime);
		var wanStatus = !sources[2].value ? failure(sources[2].error) : !wan.length ? tr('Not configured') : wan.some(function(entry) { return entry.up === true; }) ? tr('Connected') : tr('Disconnected');
		var countKnown = !!sources[6].value && wireless.every(function(entry) { return !!entry.stations.value; });
		var count = wireless.reduce(function(total,entry) { return total + stationList(entry.stations.value).length; },0);
		function metric(label,value,description,indices) {
			var bad = indices.some(function(index) { return !sourceFresh(sources[index],now); });
			return E('div',{'class':'rmm-dashboard-metric'},[
				E('span',{'class':'rmm-dashboard-metric-label'},tr(label)),E('strong',{'class':'rmm-dashboard-metric-value'},value),
				E('span',{'class':'rmm-dashboard-metric-description'},description),
				bad ? E('span',{'class':'rmm-dashboard-warning'},indices.map(function(index) { return state(index); }).filter(function(value) { return value !== tr('Current'); }).join(' · ')) : null
			]);
		}
		this.overview.replaceChildren(
			metric('WAN connection',wanStatus,wan.map(function(entry) { return entry.interface; }).join(' / ') || tr('No interfaces'),[2]),
			metric('Memory',used === null ? tr('Unavailable') : formatBytes(used) + ' / ' + formatBytes(memory.total),used === null ? tr('Unavailable') : (used / memory.total * 100).toFixed(1) + '%',[1]),
			metric('Load (1 / 5 / 15 min)',load,'load average',[1]),
			metric('Wi-Fi clients',countKnown ? String(count) : tr('Unavailable'),tr('Interface') + ': ' + wireless.length + (wireless.some(function(entry) { return entry.info.error || entry.stations.error; }) ? ' · ' + tr('Partial data') : ''),[6])
		);
		this.agentSummary.replaceChildren(E('strong',{},tr('RMM agent')),E('span',{'class':running ? 'rmm-dashboard-ok' : 'rmm-dashboard-warning'},agentStatus),E('span',{},tr('Heartbeat interval') + ': ' + (sources[4].value ? (config.heartbeat || '30') + ' ' + tr('s') : failure(sources[4].error))),E('span',{'class':'rmm-dashboard-warning'},[3,4].filter(function(index) { return !sourceFresh(sources[index],now); }).map(state).join(' · ')));
		var nestedErrors = wireless.some(function(entry) { return entry.info.error || entry.stations.error; });
		var errors = sources.filter(function(s) { return s.error; }).length;
		var cachedWirelessError = wireless.some(function(entry) { return entry.info.error && entry.info.value || entry.stations.error && entry.stations.value; });
		var stateCode = sources.some(function(s) { return s.value && !sourceFresh(s, Date.now()); }) || cachedWirelessError ? 'Stale' : errors === sources.length ? 'Unavailable' : errors || nestedErrors ? 'Partial data' : 'Current';
		// Announce only state transitions, not every successful telemetry poll.
		var statusText = tr(stateCode);
		if (this.status.textContent !== statusText) this.status.textContent = statusText;
	},

	openStation: function(key) {
		var nodes = this.stationNodes[key];
		if (!nodes) return;
		this.clientSearch.value = '';this.clientBand.value = 'all';this.clientSignal.value = 'all';this.filterStations();
		nodes.details.setAttribute('open','');
		if (typeof nodes.summary.focus === 'function') nodes.summary.focus();
		if (typeof nodes.summary.scrollIntoView === 'function') nodes.summary.scrollIntoView({block:'nearest',behavior:'auto'});
	},

	renderRelationships: function() {
		var self = this, sources = this.sources, board = sources[0].value || {}, focused = document.activeElement;
		var interfaces = sources[2].value && sources[2].value.interface || [];
		var wireless = sources[6].value && sources[6].value.interfaces || [];
		var routes = [];
		interfaces.forEach(function(iface) {
			if (!iface || typeof iface.interface !== 'string') return;
			var gateways = (Array.isArray(iface.route) ? iface.route : []).filter(function(route) {
				return route && route.mask === 0 && (route.target === '0.0.0.0' || route.target === '::') && typeof route.nexthop === 'string' && route.nexthop.length && route.nexthop !== '0.0.0.0' && route.nexthop !== '::';
			}).map(function(route) { return route.nexthop; });
			if (gateways.length || iface.interface === 'wan' || iface.interface === 'wan6') routes.push(E('li',{},[
				E('span',{'class':'rmm-dashboard-topology-label'},tr('Interface') + ': ' + iface.interface),E('dl',{},[
					item(tr('Device'),reportedText(iface.l3_device || iface.device)),item(tr('Status'),typeof iface.up === 'boolean' ? tr(iface.up ? 'Connected' : 'Disconnected') : tr('Unavailable')),
					item(tr('Default route gateway'),gateways.length ? Array.from(new Set(gateways)).join(' / ') : tr('No default gateway reported'))
				])
			]));
		});
		var radios = Object.create(null);
		wireless.forEach(function(entry) {
			var info = entry.info.value || {}, phy = typeof info.phy === 'string' && info.phy.length ? info.phy : null;
			var key = phy ? 'radio/' + phy : 'interface/' + entry.device;
			if (!radios[key]) radios[key] = {phy:phy,interfaces:[]};
			var mode = info.mode === 'Master' ? tr('Access point') : info.mode === 'Client' ? tr('Station mode') : reportedText(info.mode);
			var stations = stationList(entry.stations.value).map(function(station) {
				var nodes = self.stationNodes[entry.device + '/' + station.mac.toUpperCase()];
				if (!nodes) return null;
				if (!nodes.topologyButton) nodes.topologyButton = E('button',{type:'button','class':'btn',click:L.bind(function() { this.openStation(entry.device + '/' + station.mac.toUpperCase()); },self)});
				nodes.topologyButton.textContent = nodes.title.textContent + ' · ' + station.mac.toUpperCase();
				nodes.topologyButton.setAttribute('aria-label',tr('Open station details') + ': ' + nodes.title.textContent + ' · ' + station.mac.toUpperCase());
				return E('li',{},nodes.topologyButton);
			}).filter(Boolean);
			radios[key].interfaces.push(E('li',{},[
				E('span',{'class':'rmm-dashboard-topology-label'},'SSID: ' + reportedText(info.ssid)),
				E('dl',{},[item(tr('Interface'),entry.device),item(tr('Band'),bandName(info)),item(tr('Operating mode'),mode)]),
				resultLine('iwinfo.info',entry.info,sources[6].error),resultLine('iwinfo.assoclist',entry.stations,sources[6].error),
				stations.length ? E('ul',{},stations) : E('p',{'class':'rmm-dashboard-source'},entry.stations.error && !entry.stations.value ? failure(entry.stations.error) : entry.stations.value && entry.stations.value.results.length === 0 ? tr('No associated stations') : tr('Unavailable'))
			]));
		});
		var radioRows = Object.keys(radios).map(function(key) { return E('li',{},[E('span',{'class':'rmm-dashboard-topology-label'},tr('Radio') + ': ' + reportedText(radios[key].phy)),E('ul',{},radios[key].interfaces)]); });
		this.slots.topology.replaceChildren(
			E('p',{'class':'rmm-dashboard-source'},tr('Only reported routes and Wi-Fi associations are shown; physical cabling and Internet reachability are not inferred.')),
			resultLine('system.board',sources[0]),resultLine('network.interface.dump',sources[2]),resultLine('iwinfo.devices',sources[6]),resultLine('luci-rpc.getDHCPLeases',sources[7]),
			E('ul',{'class':'rmm-dashboard-topology'},[E('li',{},[
				E('span',{'class':'rmm-dashboard-topology-label'},tr('Local router') + ': ' + reportedText(board.hostname)),
				routes.length ? E('ul',{},routes) : E('p',{'class':'rmm-dashboard-source'},sources[2].error && !sources[2].value ? failure(sources[2].error) : tr('No default gateway reported')),
				radioRows.length ? E('ul',{},radioRows) : E('p',{'class':'rmm-dashboard-source'},sources[6].error && !sources[6].value ? failure(sources[6].error) : tr('No wireless interfaces reported'))
			])])
		);
		if (focused && focused.isConnected && this.slots.topology.contains(focused) && typeof focused.focus === 'function') focused.focus();
	},

	filterStations: function() {
		var query = (this.clientSearch.value || '').trim().toLowerCase(), band = this.clientBand.value || 'all', signal = this.clientSignal.value || 'all';
		var shown = 0, records = this.clientRecords || [];
		records.forEach(function(record) {
			var matchesSignal = signal === 'all' || signal === 'unknown' && record.signal === null || record.signal !== null && (signal === 'strong' && record.signal >= -67 || signal === 'medium' && record.signal < -67 && record.signal >= -75 || signal === 'weak' && record.signal < -75);
			var visible = (!query || record.search.includes(query)) && (band === 'all' || record.band === band) && matchesSignal;
			record.node.hidden = !visible;if (visible) shown++;
		});
		var count = tr('Shown / total stations') + ': ' + shown + ' / ' + records.length;
		if (this.clientCount.textContent !== count) this.clientCount.textContent = count;
		this.clientEmpty.hidden = shown > 0 || records.length === 0;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
