// Test-only netlink transport. Production plugin uses the native rtnl extension.
export const RTM_GETLINK=18, RTM_GETNEIGH=30, NLM_F_DUMP=768;
export const AF_UNSPEC=0, AF_BRIDGE=7, AF_INET=2, AF_INET6=10;
export function request(command, flags, payload) {
    if (flags != NLM_F_DUMP) die('Expected passive dump');
    if (getenv('RMM_RPC_ERROR')) return null;
    if (command==RTM_GETLINK && payload.family==AF_UNSPEC)
        return [{ dev:'br-lan', type:1 },{ dev:'lan2', master:'br-lan', type:1, carrier:true, linkinfo:{slave:{type:'bridge'}} }];
    if (command==RTM_GETNEIGH && payload.family==AF_BRIDGE)
        return [{ dev:'lan2', lladdr:'02:00:00:00:00:09', state:2, flags:0, vlan:10 }];
    if (command==RTM_GETNEIGH && payload.family==AF_INET)
        return [{ dev:'br-lan', lladdr:'02:00:00:00:00:09', dst:'192.0.2.9', state:2 }];
    if (command==RTM_GETNEIGH && payload.family==AF_INET6)
        return [{ dev:'br-lan', lladdr:'02:00:00:00:00:09', dst:'2001:db8::9', state:4 }];
    die('Unexpected or non-read-only netlink command');
};
export function error() { return 'Test kernel table unavailable'; };
