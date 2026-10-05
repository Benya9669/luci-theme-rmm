import * as fs from 'fs';
import {vendors_for,parse_traffic,traffic_snapshot} from '../packages/luci-app-rmm-dashboard/root/usr/share/ucode/rmm-dashboard/insights.uc';
function check(ok,message){if(!ok)die(message);}
function rejected(fn,message){let failed=false;try{fn();}catch(err){failed=true;}check(failed,message);}
let path='packages/luci-app-rmm-dashboard/root/usr/share/rmm-dashboard/vendors.tsv';
let reply=vendors_for(['00:1B:21:00:00:09','02:1B:21:00:00:09','FF:FF:FF:FF:FF:FF','bad'],path);
check(reply.vendors['00:1B:21:00:00:09']=='Intel Corporate',sprintf('Expected offline vendor: %J',reply));
check(length(reply.vendors)==1,'Local and invalid MACs must not identify a vendor');
check(vendors_for(['08:00:30:00:00:01'],path).vendors['08:00:30:00:00:01']==null,'Ambiguous assignment guessed');
check(vendors_for(['00:1B:21:00:00:09'],'/missing-rmm-vendors').vendor_error,'Missing database hidden');
let data={columns:['tx_bytes','mac','rx_bytes'],data:[[100,'00:1B:21:00:00:09',200],[100,'00:00:00:00:00:00',1000]]};
reply=parse_traffic(sprintf('%J',data));check(reply.clients['00:1B:21:00:00:09'].rx_bytes==200 && length(reply.clients)==1,'Traffic columns or filtering');
rejected(()=>parse_traffic('broken'),'Invalid JSON accepted');
rejected(()=>parse_traffic('{"columns":[],"data":[]}'),'Missing columns accepted');
rejected(()=>parse_traffic('{"columns":["mac","rx_bytes","tx_bytes"],"data":[["00:1B:21:00:00:09",-1,1]]}'),'Negative counter accepted');
rejected(()=>parse_traffic('{"columns":["mac","rx_bytes","tx_bytes"],"data":[["00:1B:21:00:00:09",9007199254740992,1]]}'),'Unsafe counter accepted');
check(traffic_snapshot().status=='unavailable','Native test should have no accounting daemon');
print('Offline vendors and traffic parser: passed\n');
