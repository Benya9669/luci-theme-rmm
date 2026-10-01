import * as rtnl from 'rtnl';
if (type(rtnl.const?.RTM_GETLINK) != 'int' || rtnl.RTM_GETLINK != null)
    die('RTNL fixture must preserve the native const namespace');
let plugin = loadfile('packages/luci-app-rmm-dashboard/root/usr/share/rpcd/ucode/rmm-dashboard')();
let methods = plugin['rmm.dashboard'];
if (length(methods) != 1 || !methods.clients || methods.clients.args) die('Unexpected RPC surface');
let reply = methods.clients.call();
if (getenv('RMM_RPC_ERROR')) {
    if (!reply.error || reply.fdb || reply.neighbors) die('Collection failure presented as empty success');
}
else if (reply.error || length(reply.fdb)!=1 || length(reply.neighbors)!=2 || reply.fdb[0].port!='lan2') {
    die(sprintf('Invalid RPC result: %J', reply));
}
print('RPC plugin loading and passive collection: passed\n');
