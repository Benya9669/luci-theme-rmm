import { inventory } from '../packages/luci-app-rmm-dashboard/root/usr/share/ucode/rmm-dashboard/clients.uc';
function check(value, message) { if (!value) die(message); }
let links = [ { dev:'br-lan', type:1, address:'02:00:00:00:00:01' },
    { dev:'lan2', master:'br-lan', type:1, carrier:true, linkinfo:{ slave:{type:'bridge'} } },
    { dev:'phy0-ap0', master:'br-lan', type:1 },
    { dev:'veth0', master:'br-lan', type:1, linkinfo:{ type:'veth' } } ];
let rows = [ { dev:'lan2', lladdr:'02:00:00:00:00:09', state:2, flags:0, vlan:10 },
    { dev:'lan2', lladdr:'02:00:00:00:00:01', state:2 },
    { dev:'lan2', lladdr:'ff:ff:ff:ff:ff:ff', state:2 },
    { dev:'lan2', lladdr:'00:00:00:00:00:00', state:2 },
    { dev:'lan2', lladdr:'02:00:00:00:00:10', state:128 },
    { dev:'lan2', lladdr:'02:00:00:00:00:11', state:2, flags:2 },
    { dev:'phy0-ap0', lladdr:'02:00:00:00:00:12', state:2 },
    { dev:'veth0', lladdr:'02:00:00:00:00:13', state:2 } ];
let neighbors = [ { dev:'br-lan', lladdr:'02:00:00:00:00:09', dst:'192.0.2.9', state:2 },
    { dev:'br-lan', lladdr:'02:00:00:00:00:09', dst:'2001:db8::9', state:4 },
    { dev:'br-lan', dst:'192.0.2.8', state:1 },
    { dev:'br-lan', lladdr:'02:00:00:00:00:01', dst:'192.0.2.1', state:2 } ];
let value = inventory(links, rows, neighbors, { 'phy0-ap0':true });
check(length(value.fdb)==1 && value.fdb[0].port=='lan2' && value.fdb[0].vlan==10 && value.fdb[0].link_up, 'FDB filtering or port metadata');
check(length(value.neighbors)==2 && value.neighbors[0].state=='reachable' && value.neighbors[1].state=='stale', 'ARP/NDP identity or state');
let states = [32,1,128,8,16,0], expected = ['failed','incomplete','permanent','delay','probe','unknown'];
for (let index, state in states) {
    neighbors[0].state=state;
    check(inventory(links,[],[neighbors[0]],{}).neighbors[0].state==expected[index], 'Incorrect neighbor state');
}
let many=[];
for(let i=0;i<1100;i++)push(many,rows[0]);
value=inventory(links,many,many,{});
check(length(value.fdb)==1024 && value.truncated, 'Unbounded FDB output');
check(length(inventory([],[],[],{}).fdb)==0, 'Empty tables');
links[1].linkinfo.type='dsa';
check(length(inventory(links,[rows[0]],[],{}).fdb)==1, 'DSA physical member excluded');
links[1].carrier=null;
check(inventory(links,[rows[0]],[],{}).fdb[0].link_up==null, 'Unknown carrier must not mean link down');
let many_neighbors=[];
for(let i=0;i<1100;i++)push(many_neighbors,neighbors[0]);
value=inventory(links,[],many_neighbors,{});
check(length(value.neighbors)==1024 && value.truncated, 'Unbounded neighbors output');
print('Passive client inventory: all native ucode tests passed\n');
