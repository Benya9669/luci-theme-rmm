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
  let native;
  function E(...args) {
    const el=native.create(...args);
    if(args[0]==='select') {
      const getter=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').get;
      Object.defineProperty(el,'value',{get:()=>getter.call(el),set:value=>{for(const option of el.querySelectorAll('option'))option.selected=option.value===String(value);}});
    }
    return el;
  }
  const storage=new Map();
  const context = vm.createContext({ Class:{singleton:value=>value}, document, window:{localStorage:{getItem:key=>storage.get(key) || null,setItem:(key,value)=>storage.set(key,value)}}, Date: FakeDate, E, _: x=>x,
    rpc: { declare: spec => (...args) => { calls.push([spec.object,spec.method,args]); const reply=replies[spec.object+'.'+spec.method+':'+args[0]] ?? replies[spec.object+'.'+spec.method] ?? replies[spec.object]; return reply instanceof Error ? Promise.reject(reply) : Promise.resolve(reply || {}); } },
    uci: { load: ()=> Promise.resolve(), get: (_,__,key)=> ({enabled:'1',interval_seconds:'30',connectivity_check_interval_seconds:'600'}[key]) },
    poll: { add: (fn, seconds)=> polls.push({fn,seconds}) }, view: { extend: x=>x },
    L: { bind: (fn,self)=>fn.bind(self), resource:x=>x }
  });
  native=vm.runInContext(fs.readFileSync('tests/fixtures/luci-dom.js','utf8'),context);
  vm.runInContext("String.prototype.format = function(...args) { let i=0; return this.replace(/%[ds]/g,()=>args[i++]); };",context);
  const source=fs.readFileSync('packages/luci-app-rmm-dashboard/htdocs/luci-static/resources/view/status/rmm-dashboard.js','utf8');
  const view=vm.runInContext('(function(){'+source+'})()',context);
  return { view, document, polls, replies, calls, storage, time: value=>now=value };
}
function snapshot(at=100000, overrides={}) {
  const values=[{hostname:'router',model:'model',release:{description:'OpenWrt'}},
    {uptime:100,memory:{total:104857600,available:26214400},load:[65536,0,0]},
    {interface:[{interface:'wan',up:true,l3_device:'eth0','ipv4-address':[{address:'192.0.2.1'}]}]},
    {'rmm-agent':{instances:{main:{running:true}}}}, {enabled:'1',heartbeat:'30',connectivity:'600'},
    {eth0:{statistics:{rx_bytes:1048576,tx_bytes:2097152}}}, {interfaces:[]}, {dhcp_leases:[],dhcp6_leases:[]}, {fdb:[],neighbors:[]}];
  return values.map((value,i)=>overrides[i] || {value,at});
}

test('system, network and agent show real metrics, timestamps and 30-second polling',()=>{
  const f=fixture(); const root=f.view.render(snapshot());
  assert.equal(Object.keys(f.view.blocks).length,5);
  assert.match(root.textContent,/75.0 MiB \(75.0%\)/);
  assert.match(root.textContent,/192.0.2.1/);
  assert.match(root.textContent,/600 с/);
  assert.equal(root.querySelectorAll('time').length,13);
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
  const f=fixture(); const root=f.view.render(snapshot(100000, Object.fromEntries([0,1,2,3,4,5,6,7,8].map(i=>[i,{error:{code:6}}]))));
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
 assert.ok(f.view.history.memory.length<=181);
 assert.ok(f.view.history.memory.every(point=>point.at>=0));
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
 assert.equal(f.view.clientRecords.filter(record=>record.type==='wifi').length,0);assert.equal(f.view.clientRecords.filter(record=>record.type==='dhcp').length,1);assert.equal(f.view.status.textContent,'Актуально');
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
 const entry=Object.values(acl)[0];assert.deepEqual(entry.write,{ubus:{'rmm.dashboard':['set_name']}});assert.deepEqual(entry.read.ubus['network.rrdns'],['lookup']);
 assert.deepEqual(entry.read.ubus.iwinfo,['devices','info','assoclist']);assert.deepEqual(entry.read.ubus['luci-rpc'],['getDHCPLeases']);
 assert.deepEqual(entry.read.uci,['rmm-agent']);
});


test('client search and signal filters compose locally and survive telemetry updates',()=>{
 const f=fixture(),root=f.view.render(wirelessSnapshot());
 const search=f.view.clientSearch,band=f.view.clientBand,signal=f.view.clientSignal;
 search.value='2001:DB8::20';f.view.filterStations();assert.equal(f.view.clientRecords[0].node.hidden,false);
 search.value='missing';f.view.filterStations();assert.equal(f.view.clientRecords[0].node.hidden,true);assert.equal(f.view.clientEmpty.hidden,false);
 search.value='';signal.querySelector('option[value="weak"]').selected=true;f.view.filterStations();assert.equal(f.view.clientRecords[0].node.hidden,true);
 signal.querySelector('option[value="all"]').selected=true;band.querySelector('option[value="2.4 GHz"]').selected=true;f.view.filterStations();assert.equal(f.view.clientRecords[0].node.hidden,true);
 f.time(130000);f.view.update(root,wirelessSnapshot(130000));
 assert.equal(f.view.clientSearch,search);assert.equal(f.view.clientBand,band);assert.equal(f.view.clientRecords[0].node.hidden,true);
 assert.equal(f.calls.length,0);assert.equal(f.polls.length,1);
});
test('native station details remain open across polling and expose unsupported telemetry explicitly',()=>{
 const f=fixture(),root=f.view.render(wirelessSnapshot());
 const details=root.querySelector('.rmm-dashboard-station-details');details.setAttribute('open','');
 f.time(130000);f.view.update(root,wirelessSnapshot(130000));
 assert.equal(root.querySelector('.rmm-dashboard-station-details'),details);assert.ok(details.hasAttribute('open'));
 assert.match(details.textContent,/Трафик станцииНедоступно/);assert.match(details.textContent,/Шум станцииНедоступно/);
 assert.match(details.textContent,/phy0-ap0/);assert.match(details.textContent,/Test <SSID>/);
 assert.match(details.querySelector('svg').getAttribute('aria-label'),/-50 dBm/);
});
test('signal history stores signed RSSI with gaps for errors, disconnects and resets on reconnect or reboot',()=>{
 const f=fixture(),root=f.view.render(wirelessSnapshot()),key='phy0-ap0/02:00:00:00:00:01';
 f.time(130000);f.view.update(root,wirelessSnapshot(130000,undefined,{code:6}));
 assert.equal(f.view.stationHistory[key].points.at(-1).signal,null);
 f.time(160000);f.view.update(root,wirelessSnapshot(160000));
 assert.equal(f.view.stationHistory[key].points.at(-1).signal,-50);
 f.time(190000);f.view.update(root,snapshot(190000));assert.equal(f.view.stationHistory[key].points.at(-1).signal,null);
 f.time(220000);const reconnect=wirelessSnapshot(220000);reconnect[6].value.interfaces[0].stations.value.results[0].connected_time=10;f.view.update(root,reconnect);
 assert.equal(f.view.stationHistory[key].points.length,1);
 f.time(250000);const reboot=wirelessSnapshot(250000);reboot[1].value.uptime=1;f.view.update(root,reboot);
 assert.equal(f.view.stationHistory[key].points.length,1);
});
test('unknown RSSI is filterable and retained identities expire after fifteen minutes',()=>{
 const f=fixture(),data=wirelessSnapshot();data[6].value.interfaces[0].stations.value.results[0].signal=0;
 const root=f.view.render(data),key='phy0-ap0/02:00:00:00:00:01';
 f.view.clientSignal.querySelector('option[value="unknown"]').selected=true;f.view.filterStations();
 assert.equal(f.view.clientRecords[0].node.hidden,false);assert.equal(f.view.stationHistory[key].points[0].signal,null);
 for(let at=101000;at<=180000;at+=1000){f.time(at);f.view.update(root,wirelessSnapshot(at));}
 assert.ok(f.view.stationHistory[key].points.length<=181);
 f.time(1110000);f.view.update(root,snapshot(1110000));assert.equal(f.view.stationHistory[key],undefined);assert.equal(Object.keys(f.view.stationNodes).length,0);
});


test('relationships show IPv4/IPv6 default gateways on any reported interface and no speculative route',()=>{
 const f=fixture(),data=wirelessSnapshot();data[2].value.interface=[{interface:'uplink',up:true,l3_device:'eth9',route:[null,{target:'0.0.0.0',mask:0,nexthop:'192.0.2.254'},{target:'::',mask:0,nexthop:'2001:db8::1'},{target:'192.0.2.0',mask:24,nexthop:'198.51.100.1'},{target:'0.0.0.0',mask:0,nexthop:'0.0.0.0'}]}];
 f.view.render(data);const text=f.view.slots.topology.textContent;
 assert.match(text,/uplink/);assert.match(text,/eth9/);assert.ok(text.includes('192.0.2.254 / 2001:db8::1'));assert.doesNotMatch(text,/198.51.100.1/);
 assert.match(text,/физическая коммутация и доступ в Интернет не определяются/);
 assert.equal(f.calls.length,0);assert.equal(f.polls.length,1);
});
test('relationships group only confirmed radio identities and report operating modes per SSID',()=>{
 const f=fixture(),data=wirelessSnapshot(),iface=data[6].value.interfaces[0];iface.info.value.mode='Master';
 data[6].value.interfaces.push({device:'phy0-ap1',info:{at:100000,value:{phy:'phy0',ssid:'Second',mode:'Client'}},stations:{at:100000,value:{results:[]}}},{device:'unknown-ap',info:{error:{code:6}},stations:{at:100000,value:{results:[]}}});
 f.view.render(data);const topology=f.view.slots.topology;
 assert.equal([...topology.querySelectorAll('.rmm-dashboard-topology-label')].filter(n=>n.textContent==='Радиомодуль: phy0').length,1);
 assert.match(topology.textContent,/Радиомодуль: Недоступно/);assert.match(topology.textContent,/Точка доступа/);assert.match(topology.textContent,/Режим станции/);
 assert.match(topology.textContent,/iwinfo.info: Нет доступа/);
});
test('station relationship action clears obstructing filters and opens the native disclosure without requests',()=>{
 const f=fixture(),root=f.view.render(wirelessSnapshot()),key='phy0-ap0/02:00:00:00:00:01';
 f.view.clientSearch.value='hidden';f.view.filterStations();assert.equal(f.view.stationNodes[key].root.hidden,true);
 const button=f.view.slots.topology.querySelector('button');button.click();
 assert.equal(f.view.clientSearch.value,'');assert.equal(f.view.stationNodes[key].root.hidden,false);
 assert.ok(f.view.stationNodes[key].details.hasAttribute('open'));assert.equal(f.calls.length,0);
 f.time(130000);f.view.update(root,wirelessSnapshot(130000));assert.equal(f.view.slots.topology.querySelector('button'),button);
});
test('relationship failures retain source states and recovery removes disconnected station links',()=>{
 const f=fixture(),root=f.view.render(wirelessSnapshot());
 f.time(130000);f.view.update(root,snapshot(130000,{6:{error:{code:6}}}));
 assert.match(f.view.slots.topology.textContent,/iwinfo.devices: Устаревшие данные · Нет доступа/);
 assert.match(f.view.slots.topology.textContent,/iwinfo.assoclist: Устаревшие данные · Нет доступа/);
 assert.equal(f.view.slots.topology.querySelectorAll('button').length,2);
 f.time(160000);f.view.update(root,snapshot(160000));assert.equal(f.view.slots.topology.querySelectorAll('button').length,0);
 assert.match(f.view.slots.topology.textContent,/Шлюз по умолчанию не указан/);
 assert.match(f.view.slots.topology.textContent,/Беспроводные интерфейсы не найдены/);
});

test('overview keeps failures visible while expert sections and station metrics are disclosed',()=>{
 const f=fixture(), root=f.view.render(wirelessSnapshot());
 assert.equal(root.firstElementChild.className,'rmm-dashboard-heading');
 assert.equal(root.querySelectorAll('.rmm-dashboard-metric').length,4);
 assert.equal(root.querySelectorAll('.rmm-dashboard-expert > details[open]').length,0);
 const station=root.querySelector('.rmm-dashboard-station-details');
 assert.match(station.querySelector('summary').textContent,/192.0.2/);
 assert.ok(station.querySelector('summary .rmm-dashboard-client-signal'));
 assert.ok(station.querySelector('div dl'));
 station.setAttribute('open','');
 f.time(130000);f.view.update(root,wirelessSnapshot(130000,undefined,{code:6}));
 assert.equal(root.querySelector('.rmm-dashboard-station-details'),station);
 assert.ok(station.hasAttribute('open'));
 assert.match(root.querySelector('.rmm-dashboard-client-signal').textContent,/Устаревшие данные/);
 assert.match(root.querySelector('.rmm-dashboard-radio-state').textContent,/Нет доступа/);
 f.time(160000);f.view.update(root,snapshot(160000,{1:{error:{code:6}},2:{error:{code:6}},3:{error:{code:6}}}));
 assert.match(f.view.overview.textContent,/Устаревшие данные · Нет доступа/);
 assert.match(f.view.agentSummary.textContent,/Устаревшие данные · Нет доступа/);
 assert.equal(f.polls.length,1);assert.equal(f.calls.length,0);
});
test('WAN graphs remain unique while secondary device history stays in disclosures',()=>{
 const f=fixture(), data=snapshot();
 data[2].value.interface.push({interface:'wan6',l3_device:'eth0',up:true},{interface:'loopback',l3_device:'lo',up:true});
 data[5].value.lo={statistics:{rx_bytes:0,tx_bytes:0}};
 const root=f.view.render(data);
 assert.equal(f.view.trafficChart.querySelectorAll('figure').length,1);
 assert.equal(f.view.slots.network.querySelectorAll('details figure').length,1);
 assert.equal(f.view.slots.network.querySelectorAll('details[open]').length,0);
 assert.equal(f.view.memoryChart.querySelectorAll('figure').length,1);
});

test('radio disclosure and summary identities survive polling without losing open state',()=>{
 const f=fixture(), root=f.view.render(wirelessSnapshot());
 const radio=root.querySelector('.rmm-dashboard-radio'), summary=radio.querySelector('summary');
 radio.setAttribute('open','');
 f.time(130000);f.view.update(root,wirelessSnapshot(130000));
 assert.equal(root.querySelector('.rmm-dashboard-radio'),radio);
 assert.equal(radio.querySelector('summary'),summary);
 assert.ok(radio.hasAttribute('open'));
 f.time(160000);f.view.update(root,snapshot(160000));
 assert.equal(Object.keys(f.view.radioNodes).length,0);
});

test('compact path preserves native node state, omits loopback and never invents wired clients',()=>{
 const f=fixture(), data=wirelessSnapshot();
 data[2].value.interface.push({interface:'lan',l3_device:'br-lan',up:true},{interface:'loopback',l3_device:'lo',up:true});
 const root=f.view.render(data), key='ssid/phy0-ap0';
 const node=f.view.relationshipNodes[key], summary=node.summary;
 node.root.setAttribute('open','');
 f.time(130000);f.view.update(root,data.map(entry=>({...entry,at:130000})));
 assert.equal(f.view.relationshipNodes[key].root,node.root);
 assert.equal(f.view.relationshipNodes[key].summary,summary);
 assert.ok(node.root.hasAttribute('open'));
 assert.match(f.view.slots.topology.textContent,/Локальные интерфейсы/);
 assert.match(f.view.slots.topology.textContent,/br-lan/);
 assert.doesNotMatch(f.view.slots.topology.textContent,/loopback|Ethernet clients|Проводные клиенты/);
 assert.equal(f.view.relationshipNodes.sources.root.hasAttribute('open'),false);
 assert.equal(f.calls.length,0);assert.equal(f.polls.length,1);
 f.time(160000);f.view.update(root,snapshot(160000));
 assert.equal(f.view.relationshipNodes[key],undefined);
});
test('gateway failure and missing station lists remain explicit on compact node summaries',()=>{
 const f=fixture(),root=f.view.render(wirelessSnapshot());
 f.time(130000);f.view.update(root,wirelessSnapshot(130000,undefined,{code:6}));
 assert.match(f.view.relationshipNodes['ssid/phy0-ap0'].summary.textContent,/Устаревшие данные · Нет доступа/);
 const data=wirelessSnapshot(160000);data[2]={error:{code:6}};
 f.time(160000);f.view.update(root,data);
 assert.match(f.view.slots.topology.querySelector('.rmm-dashboard-path-uplink').textContent,/Устаревшие данные · Нет доступа/);
 assert.equal(f.view.relationshipNodes['ssid/phy0-ap0'].root.hasAttribute('open'),false);
});


test('sorting and SSID grouping retain station identities and put unknown rates last',()=>{
 const f=fixture(),data=wirelessSnapshot();
 data[6].value.interfaces[0].stations.value.results.push({mac:'AA:BB:CC:DD:EE:02',signal:-40,rx:{rate:1440000},tx:{rate:720000}});
 const root=f.view.render(data),nodes=f.view.clientRecords.map(record=>record.node);
 f.view.clientSort.value='signal';f.view.filterStations();
 assert.ok(f.view.wirelessContent.querySelector('.rmm-dashboard-station')===nodes[1]);
 f.view.clientSort.value='rate';f.view.filterStations();
 assert.ok(f.view.wirelessContent.querySelector('.rmm-dashboard-station')===nodes[1]);
 f.view.clientGroup.value='ssid';f.view.filterStations();
 assert.equal(f.view.wirelessContent.querySelectorAll('.rmm-dashboard-client-group').length,1);
 f.time(130000);f.view.update(root,data.map(entry=>({...entry,at:130000})));
 assert.equal(f.view.clientSort.value,'rate');assert.equal(f.view.clientGroup.value,'ssid');
 assert.ok(f.view.wirelessContent.querySelector('.rmm-dashboard-station')===nodes[1]);
 assert.equal(f.calls.length,0);
});

test('native inspector retains live details and restores the invoking control',()=>{
 const f=fixture(),root=f.view.render(wirelessSnapshot());f.document.body.append(root);
 const dialog=f.view.detailDialog;
 Object.defineProperty(dialog,'open',{get(){return this.hasAttribute('open');}});
 dialog.showModal=function(){this.setAttribute('open','');};
 dialog.close=function(){this.removeAttribute('open');this.dispatchEvent(new f.document.defaultView.Event('close'));};
 let restored=false;
 const node=f.view.relationshipNodes.router;node.summary.focus=()=>{restored=true;};f.view.detailClose.focus=()=>{};
 node.summary.click();assert.equal(dialog.open,true);assert.ok(node.body.parentNode===f.view.detailContent);
 f.time(130000);f.view.update(root,snapshot(130000));
 assert.ok(node.body.parentNode===f.view.detailContent);assert.match(node.body.textContent,/OpenWrt/);
 dialog.close();assert.ok(node.body.parentNode===node.root);assert.equal(restored,true);
 const data=wirelessSnapshot(160000);f.time(160000);f.view.update(root,data);
 const key=Object.keys(f.view.stationNodes)[0];f.view.openStation(key);
 f.time(190000);f.view.update(root,snapshot(190000));
 assert.match(f.view.detailContent.textContent,/Объект больше не указан/);dialog.close();
 assert.equal(f.calls.length,0);
});

test('sample inspection exposes unavailable measurements and keyboard navigation',()=>{
 const f=fixture(),root=f.view.render(snapshot());
 f.time(130000);f.view.update(root,snapshot(130000,{1:{error:{code:6}}}));
 const svg=f.view.memoryChart.querySelector('svg');
 const end=new f.document.defaultView.Event('keydown');Object.defineProperty(end,'key',{value:'End'});svg.dispatchEvent(end);
 assert.match(f.view.memoryChart.querySelector('.rmm-dashboard-chart-readout').textContent,/Данные не получены/);
 const home=new f.document.defaultView.Event('keydown');Object.defineProperty(home,'key',{value:'Home'});svg.dispatchEvent(home);
 assert.match(f.view.memoryChart.querySelector('.rmm-dashboard-chart-readout').textContent,/75.0%/);
 assert.equal(svg.getAttribute('tabindex'),'0');
 assert.equal(f.calls.length,0);
});

test('health summary names offline WAN, high memory and stopped agent without connectivity probes',()=>{
 const f=fixture(),data=snapshot();data[2].value.interface[0].up=false;
 data[1].value.memory.available=1048576;data[3].value['rmm-agent'].instances.main.running=false;
 const root=f.view.render(data);
 assert.match(f.view.healthSummary.textContent,/WAN.*Отключено/);
 assert.match(f.view.healthSummary.textContent,/Занято памяти ≥ 90%/);
 assert.match(f.view.healthSummary.textContent,/Агент RMM.*Остановлен/);
 assert.equal(f.calls.length,0);assert.equal(f.polls.length,1);
 f.time(130000);f.view.update(root,snapshot(130000));
 assert.match(f.view.healthSummary.textContent,/По полученным данным проблем нет/);
 assert.doesNotMatch(f.view.healthSummary.textContent,/null/);
});


test('multi-WAN and long names expose every route without asserting unknown link health',()=>{
 const f=fixture(),data=wirelessSnapshot();
 data[2].value.interface=[{interface:'wan-primary-long-name',l3_device:'eth0',route:[{target:'0.0.0.0',mask:0,nexthop:'192.0.2.254'},{target:'::',mask:0,nexthop:'2001:db8:1234:5678:abcd:ef01:2345:6789'}]},{interface:'wan6',up:false,l3_device:'eth1',route:[{target:'::',mask:0,nexthop:'2001:db8::1'}]}];
 const root=f.view.render(data);
 assert.equal(f.view.slots.topology.querySelectorAll('.rmm-dashboard-path-uplink .rmm-dashboard-path-node').length,2);
 assert.match(f.view.relationshipNodes['interface/wan-primary-long-name'].body.textContent,/2001:db8:1234/);
 assert.match(f.view.relationshipNodes['interface/wan-primary-long-name'].subtitle.textContent,/192.0.2.254 · \+1/);
 assert.match(f.view.overview.textContent,/Недоступно/);
 assert.match(f.view.healthSummary.textContent,/WAN.*Недоступно/);
 assert.equal(f.calls.length,0);
});


test('native LuCI optional children never show null and scalar telemetry stays text',()=>{
 const f=fixture(),data=wirelessSnapshot();data[0].value.hostname='<img src=x onerror=alert(1)>';
 const root=f.view.render(data);
 assert.doesNotMatch(root.textContent,/null|undefined/);
 assert.match(f.view.overview.textContent,/Подключено/);
 assert.equal(f.view.relationshipNodes.router.label.querySelector('img'),null);
 assert.match(f.view.relationshipNodes.router.label.textContent,/<img/);
});

test('layout preferences validate, persist and never hide critical state',()=>{
 const f=fixture(),root=f.view.render(snapshot());
 f.view.preferences.order=['clients','charts','topology','wireless','details'];
 f.view.preferences.visible.topology=false;f.view.preferences.compact=true;
 f.view.applyLayout();f.view.savePreferences();
 assert.equal(f.view.blocks.topology.hidden,true);assert.ok(root.classList.contains('rmm-dashboard-compact'));
 assert.equal(f.view.blockContainer.children[2],f.view.blocks.clients);
 assert.equal(f.view.healthSummary.hidden,false);
 assert.equal(JSON.parse(f.storage.get('rmm-dashboard-layout-v1')).visible.topology,false);
 const parsed=f.view.readPreferences();assert.equal(parsed.order[0],'clients');
 f.storage.set('rmm-dashboard-layout-v1',JSON.stringify({version:1,order:['bad'],period:0,compact:'yes',visible:{charts:'false'}}));
 const defaults=f.view.readPreferences();assert.equal(defaults.order.length,5);assert.equal(defaults.period,300000);assert.equal(defaults.compact,false);assert.equal(defaults.visible.charts,true);
 f.storage.set('rmm-dashboard-layout-v1','broken');assert.equal(f.view.readPreferences().period,300000);
});

test('changing the chart period repaints without overwriting samples or making requests',()=>{
 const f=fixture(),root=f.view.render(snapshot());
 f.time(130000);f.view.update(root,snapshot(130000,{5:{at:130000,value:{eth0:{statistics:{rx_bytes:4000000,tx_bytes:6000000}}}}}));
 const before=JSON.stringify(f.view.history);const stations=JSON.stringify(f.view.stationHistory);
 f.view.historyPeriod.value='900000';f.view.historyPeriod.dispatchEvent(new f.document.defaultView.Event('change'));
 assert.equal(JSON.stringify(f.view.history),before);assert.equal(JSON.stringify(f.view.stationHistory),stations);
 assert.match(f.view.trafficChart.textContent,/Последние 15 минут/);assert.equal(f.calls.length,0);assert.equal(f.polls.length,1);
});

test('DHCP clients deduplicate associations, retain evidence and survive partial source failure',()=>{
 const f=fixture(),data=wirelessSnapshot();data[7].value.dhcp_leases.push({macaddr:'02:00:00:00:00:09',hostname:'desktop',ipaddr:'192.0.2.9'});
 const root=f.view.render(data);assert.equal(f.view.clientRecords.length,2);
 assert.equal(f.view.clientRecords.filter(record=>record.type==='dhcp').length,1);
 f.view.clientType.value='dhcp';f.view.filterStations();assert.equal(f.view.clientRecords.find(record=>record.type==='wifi').node.hidden,true);
 assert.match(root.textContent,/DHCP-аренда; подключение не подтверждено/);
 const known=f.view.knownNodes['dhcp/02:00:00:00:00:09'];
 f.time(130000);f.view.update(root,snapshot(130000,{7:{error:{code:6}}}));assert.equal(f.view.knownNodes['dhcp/02:00:00:00:00:09'],known);assert.match(known.signal.textContent,/Устаревшие данные/);
 f.time(160000);f.view.update(root,snapshot(160000));assert.equal(Object.keys(f.view.knownNodes).length,0);
 assert.equal(f.calls.length,0);
});

function lanSnapshot(observations, at=100000) {
 return snapshot(at,{2:{at,value:{interface:[{interface:'lan',l3_device:'br-lan',up:true},{interface:'wan',l3_device:'eth0',up:true,route:[{target:'0.0.0.0',mask:0}]}]}},8:{at,value:{fdb:[],neighbors:[],...observations}}});
}
test('FDB merges DHCP and ARP/NDP with conservative status, stable nodes and port filters',()=>{
 const f=fixture(),data=lanSnapshot({fdb:[{mac:'02:00:00:00:00:09',bridge:'br-lan',port:'lan2',vlan:10,link_up:true}],neighbors:[{mac:'02:00:00:00:00:09',device:'br-lan',address:'192.0.2.9',state:'stale'},{mac:'02:00:00:00:00:09',device:'br-lan',address:'2001:db8::9',state:'reachable'}]});
 data[7].value.dhcp_leases=[{macaddr:'02:00:00:00:00:09',hostname:'Desktop',ipaddr:'192.0.2.9'}];
 const root=f.view.render(data),node=f.view.knownNodes['dhcp/02:00:00:00:00:09'];
 assert.equal(f.view.clientRecords.length,1);assert.equal(f.view.clientRecords[0].type,'wired');assert.equal(node.title.textContent,'Desktop');assert.equal(node.link.textContent,'Через lan2');assert.equal(node.signal.textContent,'Недавно доступен');assert.equal(node.address.textContent,'192.0.2.9 · +1 IP');assert.match(node.body.textContent,/прямое подключение кабелем не подтверждено/);
 f.view.clientType.value='wired';f.view.filterStations();assert.equal(node.root.hidden,false);f.view.clientSearch.value='lan2';f.view.filterStations();assert.equal(node.root.hidden,false);
 f.time(130000);f.view.update(root,lanSnapshot({},130000).map((source,index)=>index===8?{error:{code:6}}:source));assert.equal(f.view.knownNodes['dhcp/02:00:00:00:00:09'],node);assert.equal(node.signal.textContent,'Устаревшие данные');
});
test('FDB cache, ambiguous ports and disconnected links retain distinct evidence',()=>{
 const f=fixture(),data=lanSnapshot({fdb:[{mac:'02:00:00:00:00:09',bridge:'br-lan',port:'lan1',link_up:true},{mac:'02:00:00:00:00:09',bridge:'br-lan',port:'lan2',link_up:true}]});const root=f.view.render(data),node=f.view.knownNodes['dhcp/02:00:00:00:00:09'];assert.equal(node.signal.textContent,'Запись в кэше');assert.equal(node.link.textContent,'Несколько портов');data[8].value.fdb.forEach(row=>row.link_up=false);f.view.update(root,data);assert.equal(node.signal.textContent,'Линк порта отключён');
});
test('static-IP neighbor clients are included; WAN and malformed observations are excluded',()=>{
 const f=fixture();f.view.render(lanSnapshot({neighbors:[{mac:'02:00:00:00:00:09',device:'br-lan',address:'192.0.2.9',state:'permanent'},{mac:'02:00:00:00:00:10',device:'eth0',address:'192.0.2.1',state:'reachable'},{mac:'ff:ff:ff:ff:ff:ff',device:'br-lan',address:'192.0.2.4',state:'reachable'},{mac:'02:00:00:00:00:11',device:'br-lan',address:'<img>',state:'reachable'}],fdb:[{mac:'02:00:00:00:00:12',port:'wan',bridge:'eth0'}]}));assert.equal(f.view.clientRecords.length,1);assert.equal(f.view.clientRecords[0].type,'neighbor');assert.equal(f.view.knownNodes['dhcp/02:00:00:00:00:09'].signal.textContent,'Статический сосед');
});
test('Wi-Fi association takes priority over matching Ethernet FDB and gets neighbor addresses',()=>{
 const f=fixture(),data=lanSnapshot({fdb:[{mac:'02:00:00:00:00:01',bridge:'br-lan',port:'lan2',link_up:true}],neighbors:[{mac:'02:00:00:00:00:01',device:'br-lan',address:'192.0.2.10',state:'reachable'}]});data[6].value={interfaces:[{device:'phy0-ap0',info:{at:100000,value:{ssid:'Office',frequency:2412}},stations:{at:100000,value:{results:[{mac:'02:00:00:00:00:01',signal:-45}]}}}]};f.view.render(data);assert.equal(f.view.clientRecords.length,1);assert.equal(f.view.clientRecords[0].type,'wifi');assert.equal(Object.keys(f.view.knownNodes).length,0);assert.match(f.view.stationNodes['phy0-ap0/02:00:00:00:00:01'].body.textContent,/192.0.2.10/);
});
test('passive inventory RPC deduplicates refresh, reports errors and has read-only ACL',async()=>{
 const f=fixture();f.replies['rmm.dashboard.clients']={fdb:[],neighbors:[]};await Promise.all([f.view.load(),f.view.load()]);assert.equal(f.calls.filter(call=>call[0]==='rmm.dashboard').length,1);f.replies['rmm.dashboard.clients']={error:'Kernel table unavailable'};const next=await f.view.load();assert.ok(next[8].error);
 const acl=JSON.parse(fs.readFileSync('packages/luci-app-rmm-dashboard/root/usr/share/rpcd/acl.d/luci-app-rmm-dashboard.json','utf8'))['luci-app-rmm-dashboard'];assert.deepEqual(acl.read.ubus['rmm.dashboard'],['clients','vendors']);assert.deepEqual(acl.write,{ubus:{'rmm.dashboard':['set_name']}});assert.equal(acl.write.uci,undefined);
});

test('FDB VLAN observations only match the explicit local VLAN and exclude routed uplinks',()=>{
 const f=fixture(),data=lanSnapshot({fdb:[{mac:'02:00:00:00:00:09',bridge:'br-lan',port:'lan2',vlan:10,link_up:null},{mac:'02:00:00:00:00:10',bridge:'br-lan',port:'lan3',vlan:20,link_up:true}]});data[2].value.interface=[{interface:'office',l3_device:'br-lan.10',up:true},{interface:'uplink',l3_device:'br-lan.20',route:[{target:'::',mask:0}]}];f.view.render(data);assert.equal(f.view.clientRecords.length,1);assert.equal(f.view.knownNodes['dhcp/02:00:00:00:00:09'].signal.textContent,'Запись в кэше');
});

test('compact Ethernet summary uses validated local FDB paths and deduplicates MACs per port',()=>{
 const f=fixture(),data=wirelessSnapshot();
 data[2].value.interface.push({interface:'lan',l3_device:'br-lan',up:true});
 data[8]={at:100000,value:{fdb:[{mac:'02:00:00:00:00:20',bridge:'br-lan',port:'lan3'},{mac:'02:00:00:00:00:20',bridge:'br-lan',port:'lan3',vlan:10},{mac:'02:00:00:00:00:21',bridge:'eth0',port:'wan'},{mac:'invalid',bridge:'br-lan',port:'lan4'}],neighbors:[]}};
 const root=f.view.render(data),card=f.view.relationshipNodes.ethernet;
 assert.match(card.summary.textContent,/lan3 · 1 MAC/);
 assert.doesNotMatch(card.summary.textContent,/wan|lan4/);
 assert.match(card.body.textContent,/прямое подключение кабелем не подтверждено/);
 assert.equal(f.view.relationshipPath.querySelectorAll('.rmm-dashboard-path-branch').length,2);
 card.root.setAttribute('open','');f.time(130000);f.view.update(root,data.map(entry=>({...entry,at:130000})));
 assert.equal(f.view.relationshipNodes.ethernet,card);assert.ok(card.root.hasAttribute('open'));
 assert.equal(f.calls.length,0);
});

test('connector bus uses visible card bounds and integer edge anchors, excluding nested details',()=>{
 const f=fixture();f.view.render(wirelessSnapshot());
 const path=f.view.relationshipPath;f.document.body.appendChild(path);
 const bounds=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
 path.getBoundingClientRect=()=>bounds(0,0,1000,140);Object.defineProperty(path,'clientWidth',{value:1000});
 const router=path.querySelector('.rmm-dashboard-path-device'),branches=[...path.querySelectorAll('.rmm-dashboard-path-branch')],gateways=[...path.querySelectorAll('.rmm-dashboard-path-uplink summary')];
 router.getBoundingClientRect=()=>bounds(240,0,200,100);router.querySelector('summary').getBoundingClientRect=()=>bounds(240,0,200,100);
 gateways.forEach(card=>{card.getBoundingClientRect=()=>bounds(0,0,200,100);card.parentElement.getBoundingClientRect=()=>bounds(0,0,200,100);});
 branches.forEach((branch,i)=>{branch.getBoundingClientRect=()=>bounds(480+i*240,0,200,100);branch.querySelector('summary').getBoundingClientRect=()=>bounds(480+i*240,0,200,100);});
 f.view.drawRelationshipLines();
 assert.equal(path.getAttribute('data-layout'),'desktop');
 const lines=[...path.querySelectorAll('polyline')].map(el=>el.getAttribute('points'));
 assert.ok(lines.includes('340,100 340,116 820,116'));
 assert.ok(lines.includes('580,100 580,116'));
 assert.ok(lines.includes('200,50 220,50 220,50 240,50'));
});
test('DHCPv6 without MAC matches an exact fresh NDP address, normalizes IPv6 and exposes name evidence',()=>{
 const f=fixture(),mac='02:00:00:00:00:09',data=lanSnapshot({neighbors:[{mac,device:'br-lan',address:'2001:db8::9',state:'reachable'}]});
 data[7].value.dhcp6_leases=[{duid:'000400000000000000000000000000000009',hostname:'IPv6 <NAS>',ip6addr:'2001:0DB8:0:0:0:0:0:9',ip6addrs:['2001:db8::9/128','2001:db8::10/64','not-an-address']}];
 const root=f.view.render(data),node=f.view.knownNodes['dhcp/'+mac];
 assert.equal(f.view.clientRecords.length,1);assert.equal(node.title.textContent,'IPv6 <NAS>');
 assert.equal(node.address.textContent,'2001:0DB8:0:0:0:0:0:9 · +1 IP');
 assert.match(node.body.textContent,/DHCPv6/);assert.match(node.body.textContent,/IPv6-запись NDP/);
 assert.doesNotMatch(node.body.textContent,/not-an-address/);assert.equal(node.root.querySelector('NAS'),null);
 f.view.clientSearch.value='2001:db8::10';f.view.filterStations();assert.equal(node.root.hidden,false);
 f.view.clientSearch.value='2001:db8::9';f.view.filterStations();assert.equal(node.root.hidden,false);
 f.time(130000);f.view.update(root,data.map((entry,i)=>i===8?{error:{code:6}}:{...entry,at:130000}));
 assert.equal(f.view.knownNodes['dhcp/'+mac],node);assert.equal(node.title.textContent,mac);
 assert.equal(f.calls.length,0);
});
test('same-MAC DHCPv4/v6 and NDP keep one client, prefer the DHCPv4 name and retain all IPs in details',()=>{
 const f=fixture(),mac='02:00:00:00:00:09',data=lanSnapshot({neighbors:[{mac,device:'br-lan',address:'fe80::9',state:'stale'}]});
 data[7].value.dhcp_leases=[{macaddr:mac,hostname:'Desktop',ipaddr:'192.0.2.9'}];
 data[7].value.dhcp6_leases=[{macaddr:mac,hostname:'Other-name',ip6addr:'2001:db8::9/64',ip6addrs:['2001:0db8:0000:0000:0000:0000:0000:0009']}];
 f.view.render(data);const node=f.view.knownNodes['dhcp/'+mac];assert.equal(f.view.clientRecords.length,1);
 assert.equal(node.title.textContent,'Desktop');assert.equal(node.address.textContent,'192.0.2.9 · +2 IP');
 assert.equal(node.address.title,'192.0.2.9 / 2001:db8::9 / fe80::9');assert.match(node.body.textContent,/DHCPv4/);
});
test('DHCPv6 matching refuses ambiguous IPv6 owners, cached neighbors, stale sources and unknown DUID guesses',()=>{
 for(const mode of ['ambiguous','cached','stale-lease','stale-inventory','stale-interface','unknown']) {
  const f=fixture(),mac='02:00:00:00:00:09',neighbors=[{mac,device:'br-lan',address:'2001:db8::9',state:mode==='cached'?'stale':'reachable'}];
  if(mode==='ambiguous')neighbors.push({mac:'02:00:00:00:00:10',device:'br-lan',address:'2001:db8::9',state:'reachable'});
  const data=lanSnapshot({neighbors});data[7].value.dhcp6_leases=[{duid:'00030001020000000009',hostname:'Unconfirmed',ip6addr:mode==='unknown'?'2001:db8::99':'2001:db8::9'}];
  if(mode==='stale-lease')data[7].at=1000;if(mode==='stale-inventory')data[8].at=1000;if(mode==='stale-interface')data[2].at=1000;
  f.view.render(data);assert.equal(f.view.knownNodes['dhcp/'+mac].title.textContent,mac,mode);
  assert.equal(f.view.clientRecords.length,mode==='ambiguous'?2:1,mode);
 }
});
test('same hostname and conflicting MAC evidence never collapse separate interfaces',()=>{
 const f=fixture(),mac='02:00:00:00:00:09',other='02:00:00:00:00:10',data=lanSnapshot({neighbors:[{mac:other,device:'br-lan',address:'2001:db8::9',state:'reachable'}]});
 data[7].value.dhcp_leases=[{macaddr:mac,hostname:'Desktop',ipaddr:'192.0.2.9'}];
 data[7].value.dhcp6_leases=[{macaddr:other,hostname:'Desktop',ip6addr:'2001:db8::9'}];
 f.view.render(data);assert.equal(f.view.clientRecords.length,2);
 assert.equal(f.view.knownNodes['dhcp/'+mac].address.textContent,'192.0.2.9');
 assert.equal(f.view.knownNodes['dhcp/'+other].address.textContent,'2001:db8::9');
});

function namedSnapshot(names={},at=100000) {
 const data=lanSnapshot({neighbors:[{mac:'02:00:00:00:00:09',device:'br-lan',address:'192.0.2.9',state:'reachable'}]},at);
 data[8].value.names=names;return data;
}
async function openName(f,key='known/dhcp/02:00:00:00:00:09') {
 const editor=f.view.nameEditors[key];editor.toggle.click();await new Promise(resolve=>setImmediate(resolve));return editor;
}
test('manual name takes priority by MAC, survives IP changes and never creates phantom clients',()=>{
 const f=fixture(),data=namedSnapshot({'02:00:00:00:00:09':'Мой ПК','02:00:00:00:00:AA':'Missing'});data[7].value.dhcp_leases=[{macaddr:'02:00:00:00:00:09',hostname:'DHCP',ipaddr:'192.0.2.9'}];
 const root=f.view.render(data);assert.equal(f.view.clientRecords.length,1);assert.equal(f.view.clientRecords[0].name,'Мой ПК');assert.match(root.textContent,/Ручное имя/);assert.equal(f.calls.length,0);
 data[8].value.neighbors[0].address='192.0.2.90';data[7].value.dhcp_leases[0].ipaddr='192.0.2.90';f.view.update(root,data);assert.equal(f.view.clientRecords[0].name,'Мой ПК');assert.match(root.textContent,/192.0.2.90/);
});
test('manual editor verifies permission, saves through narrow RPC and removes only explicit alias',async()=>{
 const f=fixture();f.replies['session.access']=true;f.view.render(namedSnapshot());const editor=await openName(f);
 assert.equal(editor.save.disabled,false);assert.equal(editor.input.disabled,false);editor.input.value='Домашний ПК';editor.dirty=true;
 f.replies['rmm.dashboard.set_name']={names:{'02:00:00:00:00:09':'Домашний ПК'}};await f.view.saveClientName(editor,editor.input.value);
 assert.equal(f.view.clientRecords[0].name,'Домашний ПК');assert.equal(editor.notice.textContent,'Имя сохранено');
 assert.deepEqual(f.calls.find(call=>call[1]==='set_name'),['rmm.dashboard','set_name',['02:00:00:00:00:09','Домашний ПК','']]);
 f.replies['rmm.dashboard.set_name']={names:{}};await f.view.saveClientName(editor,'');assert.equal(f.view.sources[8].value.names['02:00:00:00:00:09'],undefined);
 assert.equal(editor.pending,false);assert.equal(f.view.clientRecords[0].name,'02:00:00:00:00:09');
});
test('read-only access and unavailable storage cannot submit client names',async()=>{
 const f=fixture();f.view.render(namedSnapshot());const editor=await openName(f);assert.equal(editor.save.disabled,true);assert.match(editor.notice.textContent,/только для чтения/);
 await f.view.saveClientName(editor,'Forbidden');assert.equal(f.calls.filter(call=>call[1]==='set_name').length,0);
 f.replies['session.access']=true;editor.toggle.click();await openName(f);f.view.sources[8].value.names_error='broken';f.view.syncNameEditor(editor);assert.equal(editor.save.disabled,true);assert.match(editor.notice.textContent,/Хранилище/);
});
test('poll retains unsaved editor input; concurrent save error preserves draft and previous name',async()=>{
 const f=fixture();f.replies['session.access']=true;const root=f.view.render(namedSnapshot({'02:00:00:00:00:09':'Original'}));const editor=await openName(f);const input=editor.input;
 input.value='My draft';editor.dirty=true;f.time(130000);f.view.update(root,namedSnapshot({'02:00:00:00:00:09':'Other session'},130000));
 assert.equal(editor.input,input);assert.equal(input.value,'My draft');assert.equal(editor.previous,'Original');
 f.replies['rmm.dashboard.set_name']={error:'Client name changed; refresh before saving'};await f.view.saveClientName(editor,input.value);
 assert.equal(input.value,'My draft');assert.match(editor.notice.textContent,/другой сессии/);assert.equal(f.view.clientRecords[0].name,'Other session');
});
test('pending name saves are deduplicated; malformed and control-character names are not sent',async()=>{
 const f=fixture();f.replies['session.access']=true;f.view.render(namedSnapshot());const editor=await openName(f);
 await f.view.saveClientName(editor,'Bad\nName');await f.view.saveClientName(editor,'я'.repeat(129));assert.equal(f.calls.filter(call=>call[1]==='set_name').length,0);
 let complete;f.replies['rmm.dashboard.set_name']=new Promise(resolve=>complete=resolve);const pending=f.view.saveClientName(editor,'Good');assert.equal(editor.input.disabled,true);
 await f.view.saveClientName(editor,'Duplicate');complete({names:{'02:00:00:00:00:09':'Good'}});await pending;assert.equal(f.calls.filter(call=>call[1]==='set_name').length,1);assert.equal(editor.input.disabled,false);
});
test('malformed manual map and names are ignored without interpreting HTML',()=>{
 const f=fixture(),data=namedSnapshot({'02:00:00:00:00:09':'<img src=x>','FF:FF:FF:FF:FF:FF':'Bad'});const root=f.view.render(data);
 assert.equal(f.view.clientRecords[0].name,'<img src=x>');assert.equal(root.querySelector('img'),null);
 data[8].value.names={'02:00:00:00:00:09':'\ud800'};assert.doesNotThrow(()=>f.view.update(root,data));assert.equal(f.view.clientRecords[0].name,'02:00:00:00:00:09');
});
test('DNS is opt-in, uses router resolver in background, caches names and yields to DHCP/manual names',async()=>{
 const f=fixture(),data=namedSnapshot();f.view.render(data);assert.equal(f.calls.length,0);assert.equal(f.view.dnsEnabled,false);
 f.replies['network.rrdns.lookup']={'192.0.2.9':'desktop.lan'};f.view.dnsEnabled=true;await f.view.lookupNames(f.view.clientHosts,100000);
 assert.equal(f.view.clientRecords[0].name,'desktop.lan');assert.deepEqual(f.calls.find(call=>call[1]==='lookup').slice(0,2),['network.rrdns','lookup']);assert.equal(f.calls[0][2][1],1000);assert.equal(f.calls[0][2][2],8);
 await f.view.lookupNames(f.view.clientHosts,130000);assert.equal(f.calls.length,1);
 data[7].value.dhcp_leases=[{macaddr:'02:00:00:00:00:09',hostname:'DHCP',ipaddr:'192.0.2.9'}];f.view.update(f.view.root,data,true);assert.equal(f.view.clientRecords[0].name,'DHCP');
 data[8].value.names={'02:00:00:00:00:09':'Manual'};f.view.update(f.view.root,data,true);assert.equal(f.view.clientRecords[0].name,'Manual');
});
test('DNS batches at most eight unique safe addresses, refuses ambiguous owners, and bounds cache',async()=>{
 const f=fixture();f.view.render(namedSnapshot());f.view.dnsEnabled=true;const hosts={};
 for(let n=1;n<=20;n++)hosts['02:00:00:00:01:'+n.toString(16).padStart(2,'0').toUpperCase()]={addresses:['192.0.2.'+n]};
 hosts['02:00:00:00:02:01']={addresses:['fe80::1','ff02::1','127.0.0.1','169.254.1.2','invalid','192.0.2.1'],name:'DHCP',nameSource:'DHCPv4'};
 f.replies['network.rrdns.lookup']={};await f.view.lookupNames(hosts,100000);const args=f.calls.find(call=>call[1]==='lookup')[2];assert.equal(args[0].length,8);assert.equal(args[0].includes('192.0.2.1'),false);assert.equal(args[0].some(ip=>ip.includes(':')),false);
 for(let n=0;n<256;n++)f.view.dnsCache.set('old/'+n,{name:'old',expires:900000});await f.view.lookupNames(hosts,100000);assert.equal(f.view.dnsCache.size,256);
});
test('DNS negative cache expires, canonical IPv6 replies match and unrelated responses are ignored',async()=>{
 const f=fixture(),data=lanSnapshot({neighbors:[{mac:'02:00:00:00:00:09',device:'br-lan',address:'2001:db8::9',state:'reachable'}]});f.view.render(data);f.view.dnsEnabled=true;
 f.replies['network.rrdns.lookup']={'192.0.2.99':'Wrong','2001:db8:0:0:0:0:0:9':'Bad<script>'};await f.view.lookupNames(f.view.clientHosts,100000);assert.equal(f.view.clientRecords[0].name,'02:00:00:00:00:09');
 await f.view.lookupNames(f.view.clientHosts,110000);assert.equal(f.calls.length,1);
 f.time(230000);f.view.sources.forEach(source=>source.at=230000);f.replies['network.rrdns.lookup']={'2001:db8:0:0:0:0:0:9':'nas.lan.'};await f.view.lookupNames(f.view.clientHosts,230000);assert.equal(f.view.clientRecords[0].name,'nas.lan');
});
test('DNS disable discards in-flight results and stale source cannot schedule queries',async()=>{
 const f=fixture();f.view.render(namedSnapshot());f.view.dnsEnabled=true;let complete;f.replies['network.rrdns.lookup']=new Promise(resolve=>complete=resolve);
 const pending=f.view.lookupNames(f.view.clientHosts,100000);assert.equal(f.view.lookupNames(f.view.clientHosts,100000),undefined);assert.equal(f.calls.length,1);
 f.view.dnsEnabled=false;f.view.dnsGeneration++;complete({'192.0.2.9':'Late'});await pending;assert.equal(f.view.dnsCache.size,0);
 f.view.dnsEnabled=true;f.view.sources[8].error={code:6};await f.view.lookupNames(f.view.clientHosts,100000);assert.equal(f.calls.length,1);
});
test('DNS cache is tied to both MAC and IP and failure never blocks telemetry',async()=>{
 const f=fixture();f.view.render(namedSnapshot());f.view.dnsEnabled=true;f.replies['network.rrdns.lookup']=new Error('offline');await f.view.lookupNames(f.view.clientHosts,100000);assert.equal(f.view.dnsStatus.textContent,'Имена из DNS недоступны');assert.equal(f.view.retry.disabled,false);
 f.view.dnsCache.set('02:00:00:00:00:09/192.0.2.9',{name:'Old owner',expires:900000});const newHost={addresses:['192.0.2.9']};f.view.decorateClient('02:00:00:00:00:10',newHost,100000);assert.equal(newHost.name,undefined);
});

test('DNS rotates batches so missing PTR records cannot starve later clients',async()=>{
 const f=fixture();f.view.render(namedSnapshot());f.view.dnsEnabled=true;const hosts={};
 for(let n=1;n<=48;n++)hosts['02:00:00:00:01:'+n.toString(16).padStart(2,'0').toUpperCase()]={addresses:['192.0.2.'+n]};
 f.replies['network.rrdns.lookup']={};
 for(let cycle=0;cycle<6;cycle++){const now=100000+cycle*30000;f.time(now);f.view.sources.forEach(source=>source.at=now);await f.view.lookupNames(hosts,now);}
 const addresses=new Set(f.calls.filter(call=>call[1]==='lookup').flatMap(call=>Array.from(call[2][0])));assert.equal(addresses.size,48);
});

test('local vendor lookup skips local MACs, stays offline, labels details and supports search',async()=>{
 const f=fixture(),data=lanSnapshot({neighbors:[{mac:'00:1B:21:00:00:09',device:'br-lan',address:'192.0.2.9',state:'reachable'}]});
 f.replies['rmm.dashboard.vendors']={vendors:{'00:1B:21:00:00:09':'Intel Corporate'}};f.view.render(data);await f.view.vendorPending;
 assert.match(f.view.knownNodes['dhcp/00:1B:21:00:00:09'].body.textContent,/Intel Corporate/);assert.equal(f.calls.filter(call=>call[1]==='vendors').length,1);assert.equal(f.calls.some(call=>call[0]==='network.rrdns'),false);
 f.view.clientSearch.value='intel';f.view.filterStations();assert.equal(f.view.clientRecords[0].node.hidden,false);
 await f.view.lookupVendors(130000);assert.equal(f.calls.filter(call=>call[1]==='vendors').length,1);
 assert.equal(f.view.vendorText('02:1B:21:00:00:09'),'Локально назначенный MAC');
});
test('vendor lookup failure is optional and database text stays safe',async()=>{
 const f=fixture(),data=lanSnapshot({neighbors:[{mac:'00:1B:21:00:00:09',device:'br-lan',address:'192.0.2.9',state:'reachable'}]});f.replies['rmm.dashboard.vendors']=new Error('missing');const root=f.view.render(data);await f.view.vendorPending;
 assert.equal(f.view.status.textContent,'Актуально');assert.match(root.textContent,/Локальная база производителей недоступна/);
 f.view.vendorPrefixes.set('00:1B:21','<script>');f.view.update(root,f.view.sources,true);assert.equal(root.querySelector('script'),null);
});
test('client journal records first/last observations, IP and path changes, bounded events and one physical MAC',()=>{
 const f=fixture(),data=namedSnapshot();data[8].value.fdb=[{mac:'02:00:00:00:00:09',bridge:'br-lan',port:'lan2'}];const root=f.view.render(data),mac='02:00:00:00:00:09';
 const first=f.view.clientJournal.get(mac);assert.equal(first.first,100000);assert.equal(first.last,100000);assert.equal(first.events.length,1);
 f.time(130000);const changed=namedSnapshot({},130000);changed[8].value.neighbors[0].address='192.0.2.99';changed[8].value.fdb=[{mac,bridge:'br-lan',port:'lan3'}];f.view.update(root,changed);
 assert.equal(first.first,100000);assert.equal(first.last,130000);assert.equal(first.events.filter(event=>event.type==='IP addresses changed').length,1);assert.equal(first.events.filter(event=>event.type==='Connection path changed').length,1);
 f.view.update(root,f.view.sources,true);assert.equal(first.events.length,3);
 for(let cycle=0;cycle<40;cycle++){const at=160000+cycle*30000;f.time(at);const next=namedSnapshot({},at);next[8].value.neighbors[0].address='192.0.2.'+(cycle+1);f.view.update(root,next);}
 assert.equal(first.events.length,32);assert.ok(f.view.journalList.children.length<=30);
});
test('journal source failure and truncated inventory do not invent disappearance; recovery records absence and reappearance',()=>{
 const f=fixture(),root=f.view.render(namedSnapshot()),mac='02:00:00:00:00:09',entry=f.view.clientJournal.get(mac);
 f.time(130000);f.view.update(root,snapshot(130000,{8:{error:{code:6}}}));assert.equal(entry.present,true);assert.equal(entry.last,100000);
 f.time(160000);f.view.update(root,snapshot(160000,{8:{at:160000,value:{fdb:[],neighbors:[],truncated:true}}}));assert.equal(entry.present,true);
 f.time(190000);f.view.update(root,snapshot(190000));assert.equal(entry.present,false);assert.equal(entry.events.at(-1).type,'No longer reported');
 f.time(220000);f.view.update(root,namedSnapshot({},220000));assert.equal(entry.present,true);assert.equal(entry.events.some(event=>event.type==='Observed again'),true);
 assert.equal(f.storage.has('rmm-dashboard-client-history'),false);
});
test('nlbwmon counters are per MAC, rates survive repaint, reset/gaps/reboot invalidate averages',()=>{
 const f=fixture(),mac='02:00:00:00:00:09';function sample(at,rx,tx){const data=namedSnapshot({},at);data[8].value.traffic={status:'current',source:'nlbwmon',at:at/1000,clients:{[mac]:{rx_bytes:rx,tx_bytes:tx},'02:00:00:00:00:AA':{rx_bytes:90000,tx_bytes:90000}}};return data;}
 const root=f.view.render(sample(100000,1000,2000));assert.equal(f.view.clientRecords.length,1);
 f.time(130000);f.view.update(root,sample(130000,31000,17000));const body=f.view.knownNodes['dhcp/'+mac].body;assert.match(body.textContent,/1000 B\/s \/ 500 B\/s/);
 f.view.update(root,f.view.sources,true);assert.match(body.textContent,/1000 B\/s \/ 500 B\/s/);
 f.time(160000);f.view.update(root,sample(160000,1,1));assert.equal(f.view.clientTraffic.get(mac).rates,null);
 f.time(250000);f.view.update(root,sample(250000,4000,4000));assert.equal(f.view.clientTraffic.get(mac).rates,null);
 f.time(280000);const reboot=sample(280000,8000,8000);reboot[1].value.uptime=1;f.view.update(root,reboot);assert.equal(f.view.clientTraffic.get(mac).rates,null);
});
test('missing and stale traffic never becomes zero usage or affects core telemetry state',()=>{
 const f=fixture(),root=f.view.render(namedSnapshot()),mac='02:00:00:00:00:09';assert.match(f.view.knownNodes['dhcp/'+mac].body.textContent,/Учёт трафика недоступен/);assert.equal(f.view.status.textContent,'Актуально');
 const data=namedSnapshot();data[8].value.traffic={status:'current',at:1,clients:{[mac]:{rx_bytes:100,tx_bytes:100}}};f.view.update(root,data);assert.match(f.view.knownNodes['dhcp/'+mac].body.textContent,/Принято \/ отправлено за период учётаУстаревшие данные/);
});
test('network previews use current manual names, group validated ports and open client inspector without telemetry requests',()=>{
 const f=fixture(),data=namedSnapshot({'02:00:00:00:00:09':'My desktop'});data[8].value.fdb=[{mac:'02:00:00:00:00:09',bridge:'br-lan',port:'lan3'}];const root=f.view.render(data);
 const preview=f.view.slots.topology.querySelector('.rmm-dashboard-client-preview button');assert.equal(preview.textContent,'My desktop');const calls=f.calls.length;let opened;
 f.view.openDetails=(key,title)=>{opened={key,title};return true;};preview.click();assert.equal(opened.key,'known/dhcp/02:00:00:00:00:09');assert.equal(opened.title,'My desktop');assert.equal(f.calls.length,calls);
 data[8].value.names['02:00:00:00:00:09']='Renamed';f.view.update(root,data,true);assert.equal(f.view.slots.topology.querySelector('.rmm-dashboard-client-preview button'),preview);assert.equal(preview.textContent,'Renamed');
});

test('same MAC on two SSIDs keeps distinct preview buttons and the selected interface',()=>{
 const f=fixture(),mac='02:00:00:00:00:01',data=wirelessSnapshot();
 const first=data[6].value.interfaces[0];const second=JSON.parse(JSON.stringify(first));second.device='phy1-ap0';second.info.value.ssid='Other';data[6].value.interfaces.push(second);
 f.view.render(data);let selected;f.view.openStation=key=>selected=key;
 const a=f.view.clientPreview([mac],null,first.device).querySelector('button');const b=f.view.clientPreview([mac],null,second.device).querySelector('button');
 assert.ok(a);assert.ok(b);assert.notEqual(a,b);b.click();assert.equal(selected,second.device+'/'+mac);a.click();assert.equal(selected,first.device+'/'+mac);
});