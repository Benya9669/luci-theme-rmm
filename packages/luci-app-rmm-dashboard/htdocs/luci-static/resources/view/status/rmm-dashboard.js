'use strict';
'require rpc';
'require poll';
'require uci';
'require view';

var callBoard = rpc.declare({ object: 'system', method: 'board', expect: { '': {} } });
var callInfo = rpc.declare({ object: 'system', method: 'info', expect: { '': {} } });
var callInterfaces = rpc.declare({ object: 'network.interface', method: 'dump', expect: { '': {} } });
var callServices = rpc.declare({ object: 'service', method: 'list', params: [ 'name' ], expect: { '': {} } });

function requested(call) {
	return call().then(function(value) { return { value: value || {} }; }, function(error) {
		return { error: error };
	});
}

function formatDuration(seconds) {
	if (typeof seconds !== 'number' || !isFinite(seconds) || seconds < 0)
		return _('Unavailable');
	var days = Math.floor(seconds / 86400);
	var hours = Math.floor(seconds % 86400 / 3600);
	var minutes = Math.floor(seconds % 3600 / 60);
	return (days ? _('%dd').format(days) + ' ' : '') + _('%dh %dm').format(hours, minutes);
}

function formatBytes(bytes) {
	if (typeof bytes !== 'number' || !isFinite(bytes) || bytes < 0)
		return _('Unavailable');
	return _('%s MiB').format((bytes / 1048576).toFixed(1));
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
	return Array.isArray(addresses) && addresses.length ? addresses[0].address : _('No address');
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
		var load = Array.isArray(info.load) ? info.load.map(function(value) { return (value / 65536).toFixed(2); }).join(' / ') : _('Unavailable');
		var wanStatus = data[2].error ? _('Unavailable') : !wan.length ? _('Not configured') : onlineWan.length ? _('Connected') : _('Disconnected');
		var agentStatus = data[3].error || !configReady ? _('Unavailable') : running ? _('Running') : enabled ? _('Stopped') : _('Disabled');
		var cards = [
			section(_('Router'), [
				item(_('Hostname'), board.hostname || _('Unavailable')),
				item(_('Model'), board.model || _('Unavailable')),
				item(_('Firmware'), board.release && board.release.description || _('Unavailable')),
				item(_('Uptime'), formatDuration(info.uptime))
			]),
			section(_('System'), [
				item(_('Load (1 / 5 / 15 min)'), load),
				item(_('Memory total'), formatBytes(memory.total)),
				item(_('Memory available'), formatBytes(memory.available))
			]),
			section(_('WAN connection'), [
				item(_('Status'), wanStatus, onlineWan.length ? 'ok' : wan.length ? 'warning' : ''),
				item(_('Interface'), onlineWan.length ? onlineWan.map(function(entry) { return entry.interface; }).join(', ') : wan.length ? wan.map(function(entry) { return entry.interface; }).join(', ') : _('Unavailable')),
				item(_('IP address'), onlineWan.length ? onlineWan.map(firstAddress).join(', ') : _('Unavailable'))
			]),
			section(_('RMM agent'), [
				item(_('Status'), agentStatus, running ? 'ok' : enabled ? 'warning' : ''),
				item(_('Heartbeat interval'), configReady ? _('%s s').format(uci.get('rmm-agent', 'main', 'interval_seconds') || '30') : _('Unavailable')),
				item(_('Connectivity check interval'), configReady ? _('%s s').format(uci.get('rmm-agent', 'main', 'connectivity_check_interval_seconds') || '300') : _('Unavailable'))
			])
		];

		root.replaceChildren(
			E('div', { 'class': 'rmm-dashboard-heading' }, [
				E('div', {}, [ E('div', { 'class': 'rmm-dashboard-eyebrow' }, _('SYSTEM / OVERVIEW')), E('h1', {}, _('RMM overview')) ]),
				E('span', { 'class': 'rmm-dashboard-refresh' }, _('Updates every 30 seconds'))
			]),
			E('div', { 'class': 'rmm-dashboard-grid' }, cards),
			E('p', { 'class': 'rmm-dashboard-note' }, _('WAN status shows the interface link state; it does not test Internet reachability.'))
		);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
