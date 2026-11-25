import * as rtnl from 'rtnl';
if (type(rtnl.const?.RTM_GETLINK) != 'int' || rtnl.RTM_GETLINK != null)
    die('RTNL fixture must preserve the native const namespace');
let plugin = loadfile('packages/luci-app-rmm-dashboard/root/usr/share/rpcd/ucode/rmm-dashboard')();
let methods = plugin['rmm.dashboard'];
if (length(methods) != 4 || !methods.clients || methods.clients.args || methods.agent_status.args) die('Unexpected RPC surface');
let settings = methods.agent_status.call();
if (length(settings) != 3 || settings.enabled != '1' || settings.heartbeat != '45' || settings.connectivity != '600')
    die('Unexpected dashboard configuration response');
let many_macs=[];for(let i=0;i<513;i++)push(many_macs,'00:1B:21:00:00:09');
if(!methods.vendors.call({args:{macs:many_macs}}).error)die('Unbounded vendor request');
let reply = methods.clients.call();
if (getenv('RMM_RPC_ERROR')) {
    if (!reply.error || reply.fdb || reply.neighbors) die('Collection failure presented as empty success');
}
else if (reply.error || length(reply.fdb)!=1 || length(reply.neighbors)!=2 || reply.fdb[0].port!='lan2') {
    die(sprintf('Invalid RPC result: %J', reply));
}
print('RPC plugin loading and passive collection: passed\n');
