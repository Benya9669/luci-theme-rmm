const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { parseHTML } = require('linkedom');

function fixture() {
  const { document } = parseHTML('<html lang="ru"><head></head><body></body></html>');
  let now = 100000;
  const FakeDate = class extends Date { static now() { return now; } };
  const polls = [];
  const calls = [];
  const replies = {};
  function E(tag, attrs, content) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k,v]) => typeof v === 'function' ? el.addEventListener(k,v) : el.setAttribute(k,v));
    for (const child of [content].flat(Infinity)) if (child != null) el.append(typeof child === 'object' ? child : document.createTextNode(String(child)));
    return el;
  }
  const context = vm.createContext({ document, Date: FakeDate, E, _: x=>x,
    rpc: { declare: spec => (...args) => { calls.push([spec.object,spec.method,args]); const reply=replies[spec.object+'.'+spec.method+':'+args[0]] ?? replies[spec.object+'.'+spec.method] ?? replies[spec.object]; return reply instanceof Error ? Promise.reject(reply) : Promise.resolve(reply || {}); } },
    uci: { load: ()=> Promise.resolve(), get: (_,__,key)=> ({enabled:'1',interval_seconds:'30',connectivity_check_interval_seconds:'600'}[key]) },
    poll: { add: (fn, seconds)=> polls.push({fn,seconds}) }, view: { extend: x=>x },
    L: { bind: (fn,self)=>fn.bind(self), resource:x=>x }
  });
  vm.runInContext("String.prototype.format = function(...args) { let i=0; return this.replace(/%[ds]/g,()=>args[i++]); };",context);
  const source=fs.readFileSync('packages/luci-app-rmm-dashboard/htdocs/luci-static/resources/view/status/rmm-dashboard.js','utf8');
  const view=vm.runInContext('(function(){'+source+'})()',context);
  return { view, document, polls, replies, calls, time: value=>now=value };
}
function snapshot(at=100000, overrides={}) {
  const values=[{hostname:'router',model:'model',release:{description:'OpenWrt'}},
    {uptime:100,memory:{total:104857600,available:26214400},load:[65536,0,0]},
    {interface:[{interface:'wan',up:true,l3_device:'eth0','ipv4-address':[{address:'192.0.2.1'}]}]},
    {'rmm-agent':{instances:{main:{running:true}}}}, {enabled:'1',heartbeat:'30',connectivity:'600'},
    {eth0:{statistics:{rx_bytes:1048576,tx_bytes:2097152}}}, {interfaces:[]}, {dhcp_leases:[],dhcp6_leases:[]}];
  return values.map((value,i)=>overrides[i] || {value,at});
}

test('system, network and agent show real metrics, timestamps and 30-second polling',()=>{
  const f=fixture(); const root=f.view.render(snapshot());
  assert.equal(root.querySelectorAll('section').length,4);
  assert.match(root.textContent,/75.0 MiB \(75.0%\)/);
  assert.match(root.textContent,/192.0.2.1/);
  assert.match(root.textContent,/600 с/);
  assert.equal(root.querySelectorAll('time').length,8);
  assert.equal(f.polls[0].seconds,30);
  assert.match(root.textContent,/Накопление данных/);
});
test('partial permission failure retains cached data and last successful source time',()=>{
  const f=fixture(); const root=f.view.render(snapshot()); const retry=f.view.retry;
  f.time(130000); f.view.update(root,snapshot(130000,{2:{error:{code:6}}}));
  assert.match(root.textContent,/Устаревшие данные · Нет доступа/);
  assert.match(root.textContent,/192.0.2.1/);
  assert.equal(f.view.sources[2].at,100000);
  assert.equal(f.view.sources[1].at,130000);
  assert.equal(f.view.retry,retry);
  f.time(160000); f.view.update(root,snapshot(160000));
  assert.equal(f.view.status.textContent,'Актуально');
});
test('initial unavailable source is distinct from missing agent and disabled service',()=>{
  const f=fixture(); const root=f.view.render(snapshot(100000,{2:{error:{code:6}},3:{value:{},at:100000}}));
  assert.match(root.textContent,/Нет доступа/);
  assert.match(root.textContent,/Не установлен/);
  assert.doesNotMatch(root.textContent,/192.0.2.1/);
  f.view.update(root,snapshot(130000,{3:{value:{'rmm-agent':{instances:{}}},at:130000},4:{value:{enabled:'0'},at:130000}}));
  assert.match(root.textContent,/Выключен/);
});
test('traffic uses elapsed time and counter reset or reboot never creates a negative rate',()=>{
  const f=fixture(); const root=f.view.render(snapshot());
  f.time(130000); f.view.update(root,snapshot(130000,{5:{at:130000,value:{eth0:{statistics:{rx_bytes:32505856,tx_bytes:65011712}}}}}));
  assert.match(root.textContent,/1.0 MiB\/s \/ 2.0 MiB\/s/);
  f.time(160000); f.view.update(root,snapshot(160000));
  assert.match(root.textContent,/Накопление данных/);
  f.view.update(root,snapshot(190000,{1:{at:190000,value:{uptime:1,memory:{},load:[]}}}));
  assert.match(root.textContent,/Скорость RX \/ TXНедоступно/);
});
test('malformed RPC responses become source errors; empty service response is valid',async()=>{
  const f=fixture(); f.replies.system={}; f.replies['network.interface']={interface:'wrong'};
  const data=await f.view.load();
  assert.ok(data[0].error); assert.ok(data[1].error); assert.ok(data[2].error);
  assert.equal(data[3].error,undefined);
  assert.equal(f.calls.filter(x=>x[0]==='network.device').length,1);
});
test('overlapping refreshes share requests and failed polls do not erase other sources',async()=>{
  const f=fixture(); const root=f.view.render(snapshot());
  const a=f.view.load(), b=f.view.load(); assert.equal(a,b); await a;
  f.replies.system=new Error('offline'); await f.view.refresh();
  assert.match(root.textContent,/Устаревшие данные/);
  assert.equal(f.view.retry.disabled,false);
});
test('asset cache versions match both package versions', () => {
  for (const packageName of ['luci-theme-rmm', 'luci-app-rmm-dashboard']) {
    const version = fs.readFileSync('packages/' + packageName + '/Makefile', 'utf8').match(/PKG_VERSION:=(.+)/)[1].trim();
    const files = packageName === 'luci-theme-rmm' ? ['ucode/template/themes/rmm/header.ut', 'ucode/template/themes/rmm/footer.ut'] : ['htdocs/luci-static/resources/view/status/rmm-dashboard.js'];
    for (const file of files) assert.ok(fs.readFileSync('packages/' + packageName + '/' + file, 'utf8').includes('?v=' + version));
  }
});
test('every initial source failure remains explicit, then recovers without losing controls', () => {
  const f=fixture(); const root=f.view.render(snapshot(100000, Object.fromEntries([0,1,2,3,4,5,6,7].map(i=>[i,{error:{code:6}}]))));
  assert.equal(f.view.status.textContent, 'Недоступно');
  const retry=f.view.retry; f.time(130000); f.view.update(root,snapshot(130000));
  assert.equal(f.view.status.textContent, 'Актуально'); assert.equal(f.view.retry,retry);
});

test('missing or malformed optional telemetry renders unavailable without breaking other sections', () => {
  const f=fixture(); const root=f.view.render(snapshot(100000, {
    0: {at:100000,value:{hostname:'router',model:{bad:true},release:{description:null}}},
    1: {at:100000,value:{uptime:100,memory:{total:100,available:200},load:[]}},
    2: {at:100000,value:{interface:[null,{interface:'wan',up:true,'ipv4-address':[null]}]}}
  }));
  assert.match(root.textContent,/Нет адреса/);
  assert.match(root.textContent,/Занято памятиНедоступно/);
  assert.match(root.textContent,/Работает/);
});

function catalog(language) {
  const text = fs.readFileSync('packages/luci-app-rmm-dashboard/po/'+language+'/rmm-dashboard.po','utf8');
  return Object.fromEntries([...text.matchAll(/^msgid (".*")\r?\nmsgstr (".*")/gm)].map(m=>[JSON.parse(m[1]),JSON.parse(m[2])]));
}
test('RU and zh-cn catalogs cover current dashboard labels and source states',()=>{
 const source=fs.readFileSync('packages/luci-app-rmm-dashboard/htdocs/luci-static/resources/view/status/rmm-dashboard.js','utf8');
 const dict=vm.runInNewContext('('+source.match(/var russian = (\{[\s\S]*?\n\});/)[1]+')');
 for (const lang of ['ru','zh_Hans']) {
  const messages=catalog(lang);
  for (const key of Object.keys(dict)) assert.ok(messages[key], lang+': '+key);
  assert.ok(messages['Read router and RMM agent status']);
  assert.ok(messages['%s MiB']);
 }
 const russian=catalog('ru');
 for (const [key,value] of Object.entries(dict)) assert.equal(russian[key],value);
});

test('history uses byte deltas, one shared-device plot and real timestamps',()=>{
 const f=fixture(); const root=f.view.render(snapshot());
 const traffic=(at,seconds)=>snapshot(at,{1:{at,value:{uptime:100+seconds,memory:{total:100,available:25},load:[0,0,0]}},2:{at,value:{interface:[{interface:'wan',l3_device:'eth0',up:true},{interface:'wan6',l3_device:'eth0',up:true}]}},5:{at,value:{eth0:{statistics:{rx_bytes:1048576+seconds*1024,tx_bytes:2097152+seconds*2048}}}}});
 f.time(130000); f.view.update(root,traffic(130000,30));
 f.time(160000); f.view.update(root,traffic(160000,60));
 assert.equal(root.querySelectorAll('figure').length,2);
 assert.equal(f.view.history.devices.eth0.at(-1).at,160000);
 assert.equal(f.view.history.devices.eth0.at(-1).rx,1024);
 assert.equal(f.view.history.devices.eth0.at(-1).tx,2048);
 assert.match(root.querySelector('.rmm-dashboard-chart-rx').getAttribute('d'),/^M.+L/);
 assert.match(root.textContent,/RX: 1.0 KiB\/s/);
 assert.equal(f.polls.length,1);
 assert.equal(f.polls[0].seconds,30);
});
test('history leaves gaps during errors, recovery and counter resets',()=>{
 const f=fixture();const root=f.view.render(snapshot());
 const update=(at,value,override={})=>{f.time(at);f.view.update(root,snapshot(at,{5:{at,value:{eth0:{statistics:{rx_bytes:value,tx_bytes:value}}}},...override}));};
 update(130000,4000000);update(160000,8000000);
 update(190000,12000000,{5:{error:{code:6}}});
 assert.equal(f.view.history.devices.eth0.at(-1).rx,null);
 update(220000,16000000);
 assert.equal(f.view.history.devices.eth0.at(-1).rx,null);
 update(250000,20000000);update(280000,24000000);
 assert.equal(root.querySelector('.rmm-dashboard-chart-rx').getAttribute('d').match(/M/g).length,2);
 update(310000,1);
 assert.equal(f.view.history.devices.eth0.at(-1).rx,null);
 update(340000,100,{1:{error:{code:6}}});
 assert.equal(f.view.history.memory.at(-1).used,null);
 update(370000,200,{1:{at:370000,value:{uptime:1,memory:{total:100,available:50},load:[0,0,0]}}});
 assert.equal(f.view.history.memory.length,1);
 assert.equal(f.view.history.devices.eth0.length,1);
 assert.equal(f.view.history.devices.eth0[0].rx,null);
});
test('history bounds frequent retries and never joins long collection gaps',()=>{
 const f=fixture();const root=f.view.render(snapshot());
 for(let at=101000;at<=700000;at+=1000){f.time(at);f.view.update(root,snapshot(at));}
 assert.ok(f.view.history.memory.length<=61);
 assert.ok(f.view.history.memory.every(point=>point.at>=400000));
 f.time(800000);f.view.update(root,snapshot(800000));
 const d=root.querySelector('.rmm-dashboard-chart-used').getAttribute('d');
 assert.ok(d.match(/M/g).length>=2);
 assert.doesNotMatch(root.querySelector('.rmm-dashboard-chart svg').getAttribute('aria-label'),/Максимум: 100.0%/);
});

function wirelessSnapshot(at=100000, infoError, stationsError) {
 const mac='02:00:00:00:00:01';
 return snapshot(at,{
  6:{at,value:{interfaces:[{device:'phy0-ap0',info:infoError?{error:infoError}:{at,value:{phy:'phy0',ssid:'Test <SSID>',frequency:5180,channel:36,txpower:20,noise:4294967201}},stations:stationsError?{error:stationsError}:{at,value:{results:[{mac,signal:4294967246,connected_time:120,rx:{rate:866700},tx:{rate:433300}}]}}}]}},
  7:{at,value:{dhcp_leases:[{macaddr:mac,hostname:'client <name>',ipaddr:'192.0.2.20'}],dhcp6_leases:[{macaddr:mac,ip6addrs:['2001:db8::20']}]}}
 });
}
test('wireless renders local DHCP identity, signed RSSI and negotiated rates without interpreting text as HTML',()=>{
 const f=fixture(),root=f.view.render(wirelessSnapshot());
 assert.match(root.textContent,/Test <SSID>/);assert.match(root.textContent,/client <name>/);
 assert.ok(root.textContent.includes('192.0.2.20 / 2001:db8::20'));assert.match(root.textContent,/-50 dBm/);assert.match(root.textContent,/-95 dBm/);
 assert.ok(root.textContent.includes('866.7 Mbit/s / 433.3 Mbit/s'));assert.match(root.textContent,/5 GHz/);
 assert.equal(root.querySelector('name'),null);assert.equal(root.querySelector('SSID'),null);
});
test('wireless failures independently retain last successful samples and successful empty station lists clear clients',()=>{
 const f=fixture(),root=f.view.render(wirelessSnapshot());
 f.time(130000);f.view.update(root,wirelessSnapshot(130000,{code:6}));
 assert.equal(f.view.sources[6].value.interfaces[0].info.at,100000);
 assert.equal(f.view.sources[6].value.interfaces[0].stations.at,130000);
 assert.equal(f.view.status.textContent,'Устаревшие данные');
 assert.match(root.textContent,/iwinfo.info: Устаревшие данные · Нет доступа/);
 f.time(160000);f.view.update(root,snapshot(160000,{6:{error:{code:6}},7:{error:{code:6}}}));
 assert.match(root.textContent,/iwinfo.assoclist: Устаревшие данные · Нет доступа/);
 assert.match(root.textContent,/client <name>/);
 const empty=wirelessSnapshot(190000);empty[6].value.interfaces[0].stations.value.results=[];
 f.time(190000);f.view.update(root,empty);
 assert.equal(root.querySelectorAll('.rmm-dashboard-station').length,0);assert.equal(f.view.status.textContent,'Актуально');
});
test('wireless RPC fanout deduplicates interfaces and never probes, scans or reads Wi-Fi credentials',async()=>{
 const f=fixture();f.replies['iwinfo.devices']={devices:['phy0-ap0','phy1-ap0','phy0-ap0']};
 f.replies['iwinfo.info']={phy:'phy0'};f.replies['iwinfo.assoclist']={results:[]};f.replies['luci-rpc.getDHCPLeases']={dhcp_leases:[]};
 const a=f.view.load(),b=f.view.load();assert.equal(a,b);const data=await a;
 assert.equal(data[6].value.interfaces.length,2);assert.equal(f.calls.filter(x=>x[0]==='iwinfo' && x[1]==='info').length,2);
 assert.equal(f.calls.filter(x=>x[0]==='iwinfo' && x[1]==='assoclist').length,2);
 assert.equal(f.calls.filter(x=>x[0]==='luci-rpc').length,1);
 assert.ok(f.calls.every(x=>!['scan','getHostHints','set','apply'].includes(x[1])));
 assert.ok(f.calls.filter(x=>x[0]==='uci').every(x=>x[2][0]==='rmm-agent'));
});
test('missing wireless RPC and malformed stations remain explicit without reporting a false empty list',()=>{
 const f=fixture(),root=f.view.render(snapshot(100000,{6:{error:{code:6}}}));
 assert.match(f.view.slots.wireless.textContent,/Нет доступа/);
 assert.doesNotMatch(f.view.slots.wireless.textContent,/Беспроводные интерфейсы не найдены/);
 const data=wirelessSnapshot();data[6].value.interfaces[0].stations.value.results.push(null,{mac:'<script>'});
 f.view.update(root,data);assert.equal(root.querySelectorAll('.rmm-dashboard-station').length,1);
 assert.match(root.textContent,/Некорректные записи станций: 2/);assert.equal(root.querySelector('script'),null);
 data[6].value.interfaces[0].stations.value.results=[null];f.view.update(root,data);
 assert.doesNotMatch(f.view.slots.wireless.textContent,/Нет подключённых станций/);
});
test('Wi-Fi ACL permits only the required read methods and local DHCP leases',()=>{
 const acl=JSON.parse(fs.readFileSync('packages/luci-app-rmm-dashboard/root/usr/share/rpcd/acl.d/luci-app-rmm-dashboard.json','utf8'));
 const entry=Object.values(acl)[0];assert.equal(entry.write,undefined);
 assert.deepEqual(entry.read.ubus.iwinfo,['devices','info','assoclist']);assert.deepEqual(entry.read.ubus['luci-rpc'],['getDHCPLeases']);
 assert.deepEqual(entry.read.uci,['rmm-agent']);
});
