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
	"Close": "Закрыть",
	"Details": "Подробности",
	"Sort clients": "Сортировка",
	"By name": "По имени",
	"Strongest signal": "Сначала сильный сигнал",
	"Fastest link": "Сначала быстрое соединение",
	"Group clients": "Группировка",
	"No grouping": "Без группировки",
	"By SSID": "По SSID",
	"Received": "Принято",
	"Sent": "Отправлено",
	"Inspect samples with arrow keys": "Выбирайте измерения стрелками",
	"Data is not reported": "Данные не получены",
	"Attention required": "Требует внимания",
	"No reported issues": "По полученным данным проблем нет",
	"Memory usage ≥ 90%": "Занято памяти ≥ 90%",
	"Object is no longer reported": "Объект больше не указан в данных",
	"Refresh issues": "Проблемы обновления",
	"Resource summary": "Состояние ресурсов",

	"Gateway": "Шлюз", "Local interfaces": "Локальные интерфейсы",
	"Reported network path": "Связи по данным роутера",
	"Logical interfaces and Wi-Fi associations": "Логические интерфейсы и подключения Wi-Fi",

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
	var readout = E('p',{'class':'rmm-dashboard-chart-readout'},tr('Inspect samples with arrow keys'));
	var cursor = svgElement('line',{y1:12,y2:116,'class':'rmm-dashboard-chart-cursor',visibility:'hidden'});
	svg.appendChild(cursor);
	svg.setAttribute('tabindex','0');
	svg.setAttribute('data-chart-title',title);
	svg.setAttribute('aria-label',svg.getAttribute('aria-label') + ' · ' + tr('Inspect samples with arrow keys'));
	var selected = Math.max(0,samples.length - 1);
	function inspect(index) {
		if (!samples.length) return;
		selected = Math.max(0,Math.min(samples.length - 1,index));
		var point = samples[selected], x = 8 + Math.max(0,Math.min(1,(point.at - (now-historyWindow))/historyWindow))*584;
		cursor.setAttribute('x1',x);cursor.setAttribute('x2',x);cursor.setAttribute('visibility','visible');
		readout.textContent = clock(point.at) + ' · ' + series.map(function(entry) { return entry.label + ': ' + (finite(point[entry.key]) ? format(point[entry.key]) : tr('Data is not reported')); }).join(' · ');
	}
	svg.addEventListener('pointermove',function(event) {
		var rect=svg.getBoundingClientRect(), target=now-historyWindow + Math.max(0,Math.min(1,((event.clientX-rect.left)/rect.width*600-8)/584))*historyWindow;
		var closest=0; samples.forEach(function(point,index) { if (Math.abs(point.at-target)<Math.abs(samples[closest].at-target)) closest=index; });inspect(closest);
	});
	svg.addEventListener('pointerdown',function() { svg.focus({preventScroll:true}); });
	svg.addEventListener('keydown',function(event) {
		if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
		event.preventDefault();inspect(event.key==='Home' ? 0 : event.key==='End' ? samples.length-1 : selected+(event.key==='ArrowLeft' ? -1 : 1));
	});
	figure.appendChild(E('div',{'class':'rmm-dashboard-chart-legend'},series.map(function(entry) { return E('span',{'data-series':entry.key},entry.label + (entry.key==='rx' ? ' · '+tr('Received') : entry.key==='tx' ? ' · '+tr('Sent') : '')); })));
	figure.appendChild(svg);
	figure.appendChild(readout);
	figure.appendChild(E('p', { 'class': 'rmm-dashboard-chart-scale' }, [E('span', {}, format(0)), E('span', {}, format(max))]));
	figure.appendChild(E('p', { 'class': 'rmm-dashboard-chart-times' }, [E('span', {}, clock(now - historyWindow)), E('span', {}, clock(now))]));
	if (samples.filter(function(point) { return series.some(function(entry) { return finite(point[entry.key]); }); }).length < 2)
		figure.appendChild(E('p', { 'class': 'rmm-dashboard-note' }, tr('Collecting')));
	return figure;
}

// Local Tabler registry; MIT attribution is shipped with this package.
function dashboardIcon(name) {
	return svgElement('svg', {viewBox:'0 0 24 24','class':'rmm-dashboard-icon','aria-hidden':'true',focusable:'false',fill:'none',stroke:'currentColor','stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round'},[svgElement('use',{href:L.resource('view/status/rmm-dashboard-icons.svg') + '#icon-' + name})]);
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
			document.head.appendChild(E('link', { id: 'rmm-dashboard-styles', rel: 'stylesheet', href: L.resource('view/status/rmm-dashboard.css') + '?v=0.7.0' }));
		this.sources = [];
		this.history = { memory: [], devices: Object.create(null) };
		this.slots = {};
		this.stationHistory = Object.create(null);
		this.stationNodes = Object.create(null);
		this.radioNodes = Object.create(null);
		this.relationshipNodes = Object.create(null);
		this.status = E('span', { 'class': 'rmm-dashboard-refresh', role: 'status', 'aria-live': 'polite' }, tr('Loading'));
		this.retry = E('button', { 'class': 'btn', type: 'button', click: L.bind(function() { return this.refresh(); }, this) }, tr('Retry'));
		var root = E('div', { 'class': 'rmm-dashboard' });
		this.identity = E('p', {'class':'rmm-dashboard-identity'});
		this.overview = E('section', {'class':'rmm-dashboard-overview','aria-label':tr('Summary')});
		this.agentSummary = E('div', {'class':'rmm-dashboard-agent-summary'});
		this.healthSummary = E('section',{'class':'rmm-dashboard-health','aria-label':tr('Resource summary')});
		this.trafficChart = E('div', {'class':'rmm-dashboard-history-panel'});
		this.memoryChart = E('div', {'class':'rmm-dashboard-history-panel'});
		this.memoryDisclosure = E('details', {'class':'rmm-dashboard-memory rmm-dashboard-disclosure'},[E('summary',{},tr('Memory history')),this.memoryChart]);
		if (typeof window === 'undefined' || !window.matchMedia || !window.matchMedia('(max-width: 767px)').matches) this.memoryDisclosure.setAttribute('open','');
		this.radioContent = E('div', {'class':'rmm-dashboard-radios'});
		function section(title, content) { return E('section', {'class':'rmm-dashboard-section'}, [E('h2',{},[dashboardIcon(title === 'Wireless' ? 'router' : title === 'Wi-Fi clients' ? 'layout-grid' : 'network'),E('span',{},tr(title))]),content]); }
		var disclosures = [['system','Router details'],['network','Network interfaces'],['agent','RMM agent']].map(L.bind(function(entry) {
			this.slots[entry[0]] = E('div', {'class':'rmm-dashboard-content'});
			return E('details', {'class':'rmm-dashboard-disclosure'}, [E('summary',{},tr(entry[1])),this.slots[entry[0]]]);
		},this));
		this.slots.wireless = E('div', {'class':'rmm-dashboard-content'});
		this.slots.topology = E('div', {'class':'rmm-dashboard-content'});
		root.appendChild(E('div', {'class':'rmm-dashboard-heading'}, [
			E('div', {}, [E('div', {'class':'rmm-dashboard-eyebrow'},tr('SYSTEM / OVERVIEW')),E('h1',{},[dashboardIcon('router'),E('span',{},tr('Router overview'))]),this.identity]),
			E('div', {'class':'rmm-dashboard-toolbar'}, [this.status,this.retry])
		]));
		root.appendChild(this.overview);
		root.appendChild(this.agentSummary);
		root.appendChild(this.healthSummary);
		var pathSection = section('Network relationships',this.slots.topology);
		pathSection.classList.add('rmm-dashboard-network-path');
		root.appendChild(pathSection);
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
		this.detailTitle=E('h2',{id:'rmm-dashboard-detail-title'});
		this.detailContent=E('div',{'class':'rmm-dashboard-detail-content'});
		this.detailClose=E('button',{type:'button','class':'btn',click:L.bind(function(){this.detailDialog.close();},this)},tr('Close'));
		this.detailDialog=E('dialog',{'class':'rmm-dashboard-inspector','aria-labelledby':'rmm-dashboard-detail-title',close:L.bind(this.restoreDetails,this)},[E('div',{'class':'rmm-dashboard-detail-header'},[this.detailTitle,this.detailClose]),this.detailContent]);
		root.appendChild(this.detailDialog);
		var filterChange = L.bind(this.filterStations, this);
		function field(id, label, control) { return E('label', {for:id}, [E('span',{},tr(label)),control]); }
		function select(id, options) { return E('select',{id:id,change:filterChange}, options.map(function(option) { return E('option',{value:option[0]},tr(option[1])); })); }
		this.clientSearch = E('input',{id:'rmm-client-search',type:'search',maxlength:128,input:filterChange,placeholder:tr('Search by name, MAC, IP or SSID')});
		this.clientBand = select('rmm-client-band',[['all','All bands'],['2.4 GHz','2.4 GHz'],['5 GHz','5 GHz'],['6 GHz','6 GHz'],['60 GHz','60 GHz']]);
		this.clientSignal = select('rmm-client-signal',[['all','All signals'],['strong','Signal ≥ -67 dBm'],['medium','Signal -68…-75 dBm'],['weak','Signal < -75 dBm'],['unknown','Unknown signal']]);
		this.clientSort=select('rmm-client-sort',[['name','By name'],['signal','Strongest signal'],['rate','Fastest link']]);
		this.clientGroup=select('rmm-client-group',[['none','No grouping'],['ssid','By SSID']]);
		this.clientCount = E('p',{'class':'rmm-dashboard-source',role:'status','aria-live':'polite'});
		this.clientEmpty = E('p',{'class':'rmm-dashboard-source',hidden:''},tr('No matching stations'));
		this.wirelessContent = E('div',{});
		this.slots.wireless.appendChild(E('div',{'class':'rmm-dashboard-filters'},[
			field('rmm-client-search','Search clients',this.clientSearch),field('rmm-client-band','Band',this.clientBand),field('rmm-client-signal','Signal',this.clientSignal),field('rmm-client-sort','Sort clients',this.clientSort),field('rmm-client-group','Group clients',this.clientGroup),
			E('button',{type:'button','class':'btn',click:L.bind(function() { this.clientSearch.value='';this.clientBand.value='all';this.clientSignal.value='all';this.filterStations(); },this)},tr('Clear filters'))
		]));
		this.slots.wireless.appendChild(this.clientCount);
		this.slots.wireless.appendChild(this.clientEmpty);

		this.slots.wireless.appendChild(E('div',{'class':'rmm-dashboard-client-heading','aria-hidden':'true'},[
			E('span',{},tr('Device')),E('span',{},tr('IP address')),E('span',{},tr('Band')),E('span',{},tr('Signal')),E('span',{},tr('Link rate RX / TX')),E('span',{},tr('Station details'))
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
		var activeChart = document.activeElement && document.activeElement.getAttribute('data-chart-title');
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
		var wan = entries.filter(function(e) { return e.interface === 'wan' || e.interface === 'wan6' || Array.isArray(e.route) && e.route.some(function(route) { return route && route.mask === 0 && (route.target === '0.0.0.0' || route.target === '::'); }); });
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
					nodes = {root:E('div',{'class':'rmm-dashboard-station'}),title:E('span',{'class':'rmm-dashboard-client-name'}),address:E('span',{'class':'rmm-dashboard-client-address'}),band:E('span',{'class':'rmm-dashboard-client-band'}),signal:E('span',{'class':'rmm-dashboard-client-signal'}),link:E('span',{'class':'rmm-dashboard-client-link'}),metrics:E('dl',{}),summary:E('summary',{'aria-label':tr('Station details')}),body:E('div',{})};
					nodes.details = E('details',{'class':'rmm-dashboard-station-details'},[nodes.summary,nodes.body]);
					nodes.summary.append(nodes.title,nodes.address,nodes.band,nodes.signal,nodes.link);
					if (typeof self.detailDialog.showModal==='function') nodes.summary.setAttribute('aria-haspopup','dialog');nodes.root.appendChild(nodes.details);
					nodes.summary.addEventListener('click',function(event) { if (self.openDetails('station/'+key,nodes.title.textContent,nodes.body,nodes.details,nodes.summary)) event.preventDefault(); });
					self.stationNodes[key] = nodes;
				}
				nodes.title.textContent = host.name || mac;
				nodes.address.textContent = host.addresses && host.addresses.length ? host.addresses.join(' / ') : tr('No local DHCP record');
				nodes.band.textContent = bandName(info);
				nodes.link.setAttribute('data-label',tr('Link rate RX / TX'));
				nodes.link.textContent = linkRate(station.rx) + ' / ' + linkRate(station.tx);
				nodes.signal.textContent = signalText(station.signal) + (sources[6].error || entry.stations.error ? ' · ' + tr('Stale') : '');
				nodes.summary.setAttribute('aria-label',tr('Station details') + ': ' + nodes.title.textContent);
				nodes.metrics.replaceChildren.apply(nodes.metrics,[item(tr('MAC address'),mac),item(tr('IP address'),host.addresses && host.addresses.length ? host.addresses.join(' / ') : tr('No local DHCP record')),
					item(tr('Signal'),signalText(station.signal)),item(tr('Link rate RX / TX'),linkRate(station.rx) + ' / ' + linkRate(station.tx)),item(tr('Connected time'),formatDuration(station.connected_time))]);
				nodes.body.replaceChildren(nodes.metrics,resultLine('iwinfo.assoclist',entry.stations,sources[6].error),resultLine('luci-rpc.getDHCPLeases',sources[7]),E('dl',{},[
					item(tr('Interface'),entry.device),item(tr('Radio'),reportedText(info.phy)),item('SSID',reportedText(info.ssid)),item(tr('Band'),bandName(info)),
					item(tr('Station noise'),signalText(station.noise)),item(tr('Station traffic'),tr('Unavailable'))
				]),historyChart(tr('Signal history'),points.map(function(point) { return {at:point.at,used:point.signal === null ? null : point.signal + 127}; }),[{key:'used',label:tr('Signal')}],127,function(value) { return (value - 127).toFixed(0) + ' dBm'; },now));
				self.clientRecords.push({key:key,name:nodes.title.textContent,ssid:reportedText(info.ssid),node:nodes.root,band:bandName(info),signal:signalValue(station.signal),rate:station.rx && finite(station.rx.rate) || station.tx && finite(station.tx.rate) ? Math.max(station.rx && finite(station.rx.rate) ? station.rx.rate : 0,station.tx && finite(station.tx.rate) ? station.tx.rate : 0) : null,search:[host.name,mac,entry.device,info.ssid].concat(host.addresses || []).filter(function(value) { return typeof value === 'string'; }).join(' ').toLowerCase()});
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
		this.stationMessages=wirelessRows.filter(function(row) { return !row.classList.contains('rmm-dashboard-station'); });
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
		var wanStatus = !sources[2].value ? failure(sources[2].error) : !wan.length ? tr('Not configured') : wan.some(function(entry) { return entry.up === true; }) ? tr('Connected') : wan.every(function(entry) { return entry.up === false; }) ? tr('Disconnected') : tr('Unavailable');
		var countKnown = !!sources[6].value && wireless.every(function(entry) { return !!entry.stations.value; });
		var count = wireless.reduce(function(total,entry) { return total + stationList(entry.stations.value).length; },0);
		function metric(label,value,description,indices) {
			var bad = indices.some(function(index) { return !sourceFresh(sources[index],now); });
			return E('div',{'class':'rmm-dashboard-metric'},[
				E('span',{'class':'rmm-dashboard-metric-label'},[dashboardIcon(label === 'WAN connection' ? 'network' : label === 'Memory' ? 'terminal-2' : label === 'Wi-Fi clients' ? 'router' : 'activity-heartbeat'),E('span',{},tr(label))]),E('strong',{'class':'rmm-dashboard-metric-value'},value),
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
		this.agentSummary.replaceChildren(dashboardIcon('activity-heartbeat'),E('strong',{},tr('RMM agent')),E('span',{'class':running ? 'rmm-dashboard-ok' : 'rmm-dashboard-warning'},agentStatus),E('span',{},tr('Heartbeat interval') + ': ' + (sources[4].value ? (config.heartbeat || '30') + ' ' + tr('s') : failure(sources[4].error))),E('span',{'class':'rmm-dashboard-warning'},[3,4].filter(function(index) { return !sourceFresh(sources[index],now); }).map(state).join(' · ')));
		var nestedErrors = wireless.some(function(entry) { return entry.info.error || entry.stations.error; });
		var errors = sources.filter(function(s) { return s.error; }).length;
		var cachedWirelessError = wireless.some(function(entry) { return entry.info.error && entry.info.value || entry.stations.error && entry.stations.value; });
		var stateCode = sources.some(function(s) { return s.value && !sourceFresh(s, Date.now()); }) || cachedWirelessError ? 'Stale' : errors === sources.length ? 'Unavailable' : errors || nestedErrors ? 'Partial data' : 'Current';
		// Announce only state transitions, not every successful telemetry poll.
		var statusText = tr(stateCode);
		if (this.status.textContent !== statusText) this.status.textContent = statusText;
		var issues=[];
		if (used===null) issues.push(tr('Memory')+': '+tr('Unavailable'));
		if (wanStatus!==tr('Connected')) issues.push(tr('WAN connection')+': '+wanStatus);
		if (used!==null && memory.total>0 && used/memory.total>=.9) issues.push(tr('Memory usage ≥ 90%'));
		if (!running && agentStatus!==tr('Disabled') && agentStatus!==tr('Not installed')) issues.push(tr('RMM agent')+': '+agentStatus);
		if (stateCode!=='Current') {
			var sourceNames=['system.board','system.info','network.interface.dump','service.list','uci rmm-agent','network.device.status','iwinfo.devices','luci-rpc.getDHCPLeases'];
			sources.forEach(function(source,index) { if (!sourceFresh(source,now)) issues.push(sourceNames[index]+': '+(source.value ? tr('Stale')+' · ' : '')+(source.error ? failure(source.error) : tr('Data is not reported'))); });
			if (nestedErrors || cachedWirelessError) issues.push(tr('Wireless')+': '+tr('Partial data'));
		}
		this.healthSummary.classList.toggle('rmm-dashboard-warning',issues.length>0);
		this.healthSummary.replaceChildren(E('strong',{},tr(issues.length ? 'Attention required' : 'No reported issues')));
		if (issues.length) this.healthSummary.appendChild(E('ul',{},issues.map(function(issue){return E('li',{},issue);})));
		if (this.activeDetails) {
			var selected=this.activeDetails, record=selected.key.indexOf('station/')===0 ? this.stationNodes[selected.key.slice(8)] : this.relationshipNodes[selected.key];
			if (!record) this.detailContent.replaceChildren(E('p',{'class':'rmm-dashboard-warning'},tr('Object is no longer reported')));
			else {
				if (record.body!==selected.body) { selected.parent.appendChild(selected.body);selected.body=record.body;selected.parent=record.details || record.root;this.detailContent.replaceChildren(record.body); }
				this.detailTitle.textContent=(record.label || record.title).textContent;
			}
		}
		if (activeChart) Array.from((this.detailDialog.open ? this.detailDialog : root).querySelectorAll('svg[data-chart-title]')).some(function(svg) { if (svg.getAttribute('data-chart-title')!==activeChart) return false;svg.focus({preventScroll:true});return true; });
	},

	openStation: function(key) {
		var nodes = this.stationNodes[key];
		if (!nodes) return;
		if (this.openDetails('station/'+key,nodes.title.textContent,nodes.body,nodes.details,document.activeElement)) return;
		this.clientSearch.value = '';this.clientBand.value = 'all';this.clientSignal.value = 'all';this.filterStations();
		nodes.details.setAttribute('open','');
		if (typeof nodes.summary.focus === 'function') nodes.summary.focus();
		if (typeof nodes.summary.scrollIntoView === 'function') nodes.summary.scrollIntoView({block:'nearest',behavior:'auto'});
	},

	openDetails: function(key,title,body,parent,invoker) {
		if (typeof this.detailDialog.showModal !== 'function') return false;
		var restore=this.activeDetails && this.activeDetails.invoker || invoker;
		this.restoreDetails(false);
		this.activeDetails={key:key,body:body,parent:parent,invoker:restore};
		this.detailTitle.textContent=title;this.detailContent.replaceChildren(body);
		if (!this.detailDialog.open) this.detailDialog.showModal();
		this.detailClose.focus();
		return true;
	},
	restoreDetails: function(focus) {
		var selected=this.activeDetails;if (!selected) return;
		selected.parent.appendChild(selected.body);this.activeDetails=null;
		if (focus!==false) {
			var invoker=selected.invoker && selected.invoker.isConnected ? selected.invoker : this.retry;
			if (typeof invoker.focus==='function') invoker.focus({preventScroll:true});
		}
	},

	renderRelationships: function() {
		var self = this, sources = this.sources, board = sources[0].value || {}, focused = document.activeElement;
		var interfaces = sources[2].value && sources[2].value.interface || [];
		var wireless = sources[6].value && sources[6].value.interfaces || [];
		var seen = Object.create(null), gateways = [], local = [], radios = Object.create(null);
		var metadata = [resultLine('system.board',sources[0]),resultLine('network.interface.dump',sources[2]),resultLine('iwinfo.devices',sources[6]),resultLine('luci-rpc.getDHCPLeases',sources[7])];
		function state(result, parentError) {
			var error = parentError || result.error;
			return result.value && (error || !sourceFresh(result,Date.now())) ? tr('Stale') + (error ? ' · ' + failure(error) : '') : error ? failure(error) : tr('Current');
		}
		// Keep native disclosures and their summaries stable during telemetry polls.
		function node(key, label, subtitle, content, status) {
			var record = self.relationshipNodes[key];
			if (!record) {
				record = {root:E('details',{'class':'rmm-dashboard-path-node rmm-dashboard-path-' + (key === 'router' ? 'device' : key.indexOf('ssid/') === 0 ? 'ssid' : key === 'sources' ? 'sources' : 'interface')}),summary:E('summary',{}),label:E('span',{'class':'rmm-dashboard-topology-label'}),subtitle:E('span',{'class':'rmm-dashboard-path-subtitle'}),status:E('span',{'class':'rmm-dashboard-path-status'}),body:E('div',{'class':'rmm-dashboard-path-details'})};
				record.summary.append(dashboardIcon(key === 'router' ? 'router' : key.indexOf('ssid/') === 0 ? 'layout-grid' : key === 'sources' ? 'terminal-2' : 'network'),record.label,record.subtitle,record.status);
				record.root.append(record.summary,record.body);
				if (key!=='sources' && typeof self.detailDialog.showModal==='function') record.summary.setAttribute('aria-haspopup','dialog');
				if (key!=='sources') record.summary.addEventListener('click',function(event) { if (self.openDetails(key,record.label.textContent,record.body,record.root,record.summary)) event.preventDefault(); });
				self.relationshipNodes[key] = record;
			}
			seen[key] = true;
			record.label.textContent = label;
			record.subtitle.textContent = subtitle;
			record.status.textContent = status || '';
			record.status.classList.toggle('rmm-dashboard-warning',!!status && (status.includes(tr('Stale')) || status.includes(tr('Unavailable')) || status.includes(tr('Access denied')) || status.includes(tr('Disconnected'))));
			record.body.replaceChildren.apply(record.body,content);
			return record.root;
		}
		interfaces.forEach(function(iface) {
			if (!iface || typeof iface.interface !== 'string' || iface.interface === 'loopback') return;
			var next = (Array.isArray(iface.route) ? iface.route : []).filter(function(route) {
				return route && route.mask === 0 && (route.target === '0.0.0.0' || route.target === '::') && typeof route.nexthop === 'string' && route.nexthop.length && route.nexthop !== '0.0.0.0' && route.nexthop !== '::';
			}).map(function(route) { return route.nexthop; });
			var up = typeof iface.up === 'boolean' ? tr(iface.up ? 'Connected' : 'Disconnected') : tr('Unavailable');
			var isUplink = next.length || iface.interface === 'wan' || iface.interface === 'wan6';
			var label = isUplink ? tr('Gateway') + ' · ' + iface.interface : tr('Interface') + ': ' + iface.interface;
			var details = [E('dl',{},[item(tr('Device'),reportedText(iface.l3_device || iface.device)),item(tr('Status'),up),item(tr('IP address'),firstAddress(iface))])];
			if (isUplink) details.push(E('dl',{},[item(tr('Default route gateway'),next.length ? Array.from(new Set(next)).join(' / ') : tr('No default gateway reported'))]));
			var gatewaysUnique=Array.from(new Set(next));
			var entry = node('interface/' + iface.interface,label,isUplink ? next.length ? gatewaysUnique[0] + (gatewaysUnique.length>1 ? ' · +'+(gatewaysUnique.length-1) : '') : tr('No default gateway reported') : reportedText(iface.l3_device || iface.device),details,up + (state(sources[2]) !== tr('Current') ? ' · ' + state(sources[2]) : ''));
			(isUplink ? gateways : local).push(E('li',{},entry));
		});
		wireless.forEach(function(entry) {
			var info = entry.info.value || {}, phy = typeof info.phy === 'string' && info.phy.length ? info.phy : null;
			var key = phy ? 'radio/' + phy : 'interface/' + entry.device;
			if (!radios[key]) radios[key] = {phy:phy,interfaces:[],bands:[]};
			if (!radios[key].bands.includes(bandName(info))) radios[key].bands.push(bandName(info));
			var mode = info.mode === 'Master' ? tr('Access point') : info.mode === 'Client' ? tr('Station mode') : reportedText(info.mode);
			var stations = stationList(entry.stations.value).map(function(station) {
				var nodes = self.stationNodes[entry.device + '/' + station.mac.toUpperCase()];
				if (!nodes) return null;
				if (!nodes.topologyButton) nodes.topologyButton = E('button',{type:'button','class':'btn',click:L.bind(function() { this.openStation(entry.device + '/' + station.mac.toUpperCase()); },self)});
				nodes.topologyButton.textContent = nodes.title.textContent;
				nodes.topologyButton.setAttribute('aria-label',tr('Open station details') + ': ' + nodes.title.textContent + ' · ' + station.mac.toUpperCase());
				return E('li',{},nodes.topologyButton);
			}).filter(Boolean);
			var contents = [E('dl',{},[item(tr('Interface'),entry.device),item(tr('Band'),bandName(info)),item(tr('Operating mode'),mode),item(tr('Channel'),finite(info.channel) && info.channel > 0 ? String(info.channel) : tr('Unavailable'))]),
				stations.length ? E('ul',{'class':'rmm-dashboard-path-clients'},stations) : E('p',{'class':'rmm-dashboard-source'},entry.stations.error && !entry.stations.value ? failure(entry.stations.error) : entry.stations.value && entry.stations.value.results.length === 0 ? tr('No associated stations') : tr('Unavailable'))];
			var subtitle = bandName(info) + ' · ' + (entry.stations.value ? String(stations.length) + ' · ' + tr('Wi-Fi clients') : failure(entry.stations.error));
			radios[key].interfaces.push(E('li',{},node('ssid/' + entry.device,reportedText(info.ssid),subtitle,contents,Array.from(new Set([state(entry.info,sources[6].error),state(entry.stations,sources[6].error)])).filter(function(value) { return value !== tr('Current'); }).join(' · '))));
			metadata.push(resultLine('iwinfo.info',entry.info,sources[6].error),resultLine('iwinfo.assoclist',entry.stations,sources[6].error));
		});
		var radioRows = Object.keys(radios).map(function(key) { return E('li',{'class':'rmm-dashboard-path-radio'},[E('div',{'class':'rmm-dashboard-path-radio-node'},[dashboardIcon('router'),E('h3',{'class':'rmm-dashboard-topology-label'},tr('Radio') + ': ' + reportedText(radios[key].phy)),E('span',{'class':'rmm-dashboard-path-subtitle'},radios[key].bands.join(' / '))]),E('ul',{'class':'rmm-dashboard-path-list'},radios[key].interfaces)]); });
		var router = node('router',reportedText(board.hostname),reportedText(board.model),[E('dl',{},[item(tr('Firmware'),reportedText(board.release && board.release.description)),item(tr('Uptime'),formatDuration(sources[1].value && sources[1].value.uptime))])],Array.from(new Set([state(sources[0]),state(sources[1])])).filter(function(value) { return value !== tr('Current'); }).join(' · '));
		var sourceRecord = node('sources',tr('Sources'),'',[E('p',{'class':'rmm-dashboard-source'},tr('Only reported routes and Wi-Fi associations are shown; physical cabling and Internet reachability are not inferred.'))].concat(metadata));
		this.slots.topology.replaceChildren(
			E('p',{'class':'rmm-dashboard-path-caption'},tr('Logical interfaces and Wi-Fi associations')),
			E('div',{'class':'rmm-dashboard-path','role':'group','aria-label':tr('Reported network path')},[
				E('section',{'class':'rmm-dashboard-path-uplink'},[E('h3',{},tr('Gateway')),gateways.length ? E('ul',{'class':'rmm-dashboard-path-list'},gateways) : E('p',{'class':'rmm-dashboard-source'},sources[2].error ? failure(sources[2].error) : tr('No default gateway reported'))]),
				E('section',{'class':'rmm-dashboard-path-router'},router),
				E('section',{'class':'rmm-dashboard-path-branches'},[
					local.length ? E('div',{},[E('h3',{},tr('Local interfaces')),E('ul',{'class':'rmm-dashboard-path-list'},local)]) : null,
					radioRows.length ? E('ul',{'class':'rmm-dashboard-path-list'},radioRows) : E('p',{'class':'rmm-dashboard-source'},sources[6].error ? failure(sources[6].error) : tr('No wireless interfaces reported'))
				])
			]),sourceRecord
		);
		Object.keys(this.relationshipNodes).forEach(function(key) { if (!seen[key]) delete self.relationshipNodes[key]; });
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
		var focus=document.activeElement, order=this.clientSort.value || 'name', group=this.clientGroup.value==='ssid';
		var sorted=records.slice().sort(function(a,b) {
			if (group && a.ssid!==b.ssid) return a.ssid.localeCompare(b.ssid);
			if (order==='signal' || order==='rate') {
				var av=a[order],bv=b[order];
				if (av===null && bv!==null) return 1;if (bv===null && av!==null) return -1;
				if (av!==null && bv!==null && av!==bv) return bv-av;
			}
			return a.name.localeCompare(b.name) || a.key.localeCompare(b.key);
		});
		var rows=[],previous=null;
		sorted.forEach(function(record) {
			if (group && !record.node.hidden && previous!==record.ssid) { rows.push(E('h3',{'class':'rmm-dashboard-client-group'},'SSID · '+record.ssid));previous=record.ssid; }
			rows.push(record.node);
		});
		this.wirelessContent.replaceChildren.apply(this.wirelessContent,rows.concat(this.stationMessages || []));
		if (focus && focus.isConnected && this.wirelessContent.contains(focus) && typeof focus.focus==='function') focus.focus({preventScroll:true});
		var count = tr('Shown / total stations') + ': ' + shown + ' / ' + records.length;
		if (this.clientCount.textContent !== count) this.clientCount.textContent = count;
		this.clientEmpty.hidden = shown > 0 || records.length === 0;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
