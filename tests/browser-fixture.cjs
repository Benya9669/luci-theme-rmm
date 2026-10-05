const fs=require('node:fs');
const path=require('node:path');
const base='packages/luci-app-rmm-dashboard/htdocs/luci-static/resources/view/status/';
function page(language='ru') {
 const css=fs.readFileSync('tests/fixtures/bootstrap.css','utf8')+'\n'+fs.readFileSync('packages/luci-theme-rmm/htdocs/luci-static/rmm/cascade.css','utf8').replace(/@import[^;]+;/g,'')+'\n'+fs.readFileSync(base+'rmm-dashboard.css','utf8');
 const dom=fs.readFileSync('tests/fixtures/luci-dom.js','utf8').replace(/\nDOM;\s*$/, '');
 const source=fs.readFileSync(base+'rmm-dashboard.js','utf8');
 const nav=fs.readFileSync('packages/luci-theme-rmm/htdocs/luci-static/rmm/navigation.js','utf8');
 const search=fs.readFileSync('packages/luci-theme-rmm/htdocs/luci-static/rmm/search.js','utf8');
 return `<!doctype html><html lang="${language}" data-darkmode="true"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body data-rmm-route="/cgi-bin/luci/admin/dashboard"><header><a class="brand" href="#">RMM / Test router</a><nav class="rmm-global-nav"><ul id="topmenu" class="nav"><li><a href="/cgi-bin/luci/admin/dashboard">Dashboard</a></li><li class="dropdown"><a class="menu" href="#">Status</a><ul class="dropdown-menu"><li><a href="/cgi-bin/luci/admin/status/overview">Overview</a></li></ul></li><li class="dropdown"><a class="menu" href="#">System</a><ul class="dropdown-menu"><li><a href="/cgi-bin/luci/admin/system/system">System</a></li></ul></li><li class="dropdown"><a class="menu" href="#">Services</a><ul class="dropdown-menu"><li><a href="/cgi-bin/luci/admin/services/rmm-agent">RMM</a></li></ul></li><li class="dropdown"><a class="menu" href="#">Network</a><ul class="dropdown-menu"><li><a href="/cgi-bin/luci/admin/network/wireless">Wireless</a></li></ul></li><li><a href="/cgi-bin/luci/admin/logout">Logout</a></li></ul></nav></header><main id="maincontent" class="container"></main><script>
const Class={singleton:value=>value};
${dom}
let fixtureNames={};
const E=DOM.create.bind(DOM),_=x=>x,rpc={declare:spec=>(...args)=>{
 if(spec.method==='vendors')return Promise.resolve({vendors:Object.fromEntries(args[0].filter(mac=>mac.startsWith('00:1B:21')).map(mac=>[mac,'Intel Corporate']))});
 if(spec.object==='session')return Promise.resolve(true);
 if(spec.method==='set_name'){
  const [mac,name,previous]=args;if((fixtureNames[mac] || '')!==previous)return Promise.resolve({error:'Name changed; refresh'});
  if(name.trim())fixtureNames[mac]=name.trim();else delete fixtureNames[mac];return Promise.resolve({names:{...fixtureNames}});
 }
 if(spec.object==='network.rrdns')return Promise.resolve(Object.fromEntries(args[0].filter(ip=>ip==='2001:db8::21').map(ip=>[ip,'printer.lan'])));
 return Promise.resolve({});
}},poll={add:()=>{}},view={extend:x=>x},L={bind:(fn,self)=>fn.bind(self),resource:x=>'/'+x};
String.prototype.format=function(...args){let i=0;return this.replace(/%[ds]/g,()=>args[i++]);};
const dashboard=(function(){${source}})();
function snapshot(at=Date.now()) {
 const values=[{hostname:'Test router',model:'Cudy WR3000S',release:{description:'OpenWrt 25.12'}},{uptime:900,memory:{total:100000000,available:40000000},load:[5000,2000,1000]},
 {interface:[{interface:'wan',up:true,l3_device:'eth0',route:[{target:'0.0.0.0',mask:0,nexthop:'192.0.2.1'}]},{interface:'lan',up:true,l3_device:'br-lan'},{interface:'wg0',up:true,l3_device:'wg0'}]},
 {'rmm-agent':{instances:{main:{running:true}}}},{enabled:'1',heartbeat:'30',connectivity:'300'},
 {eth0:{statistics:{rx_bytes:at*1000,tx_bytes:at*300}}},
 {interfaces:['phy0-ap0','phy1-ap0'].map((device,i)=>({device,info:{at,value:{phy:'phy'+i,ssid:i?'Office-5G':'Office',frequency:i?5180:2412,channel:i?36:1}},stations:{at,value:{results:[{mac:'02:00:00:00:00:0'+(i+1),signal:-45,rx:{rate:866700},tx:{rate:433300}}]}}}))},
 {dhcp_leases:[{macaddr:'02:00:00:00:00:01',hostname:'Phone',ipaddr:'192.0.2.10'},{macaddr:'00:1B:21:00:00:09',hostname:'Desktop',ipaddr:'192.0.2.9'}],dhcp6_leases:[{hostname:'NAS (DHCPv6)',duid:'000400000000000000000000000000000020',ip6addr:'2001:db8::20/128'}]}, {names:{...fixtureNames},vendors:{'00:1B:21:00:00:09':'Intel Corporate'},traffic:{status:'current',source:'nlbwmon',at:Math.floor(at/1000),clients:{'00:1B:21:00:00:09':{rx_bytes:Math.floor(at/1000)*1000,tx_bytes:Math.floor(at/1000)*300},'02:00:00:00:00:20':{rx_bytes:Math.floor(at/1000)*800,tx_bytes:Math.floor(at/1000)*200}}},fdb:[{mac:'02:00:00:00:00:20',bridge:'br-lan',port:'lan3',vlan:10,link_up:true}],neighbors:[{mac:'02:00:00:00:00:20',device:'br-lan',address:'192.0.2.20',state:'reachable'},{mac:'02:00:00:00:00:20',device:'br-lan',address:'2001:db8::20',state:'reachable'},{mac:'02:00:00:00:00:21',device:'br-lan',address:'2001:db8::21',state:'stale'}]}];
 return values.map(value=>({value,at}));
}
const data=snapshot(Date.now()-15000);document.getElementById('maincontent').appendChild(dashboard.render(data));dashboard.update(dashboard.root,snapshot());
setInterval(()=>dashboard.update(dashboard.root,snapshot()),30000);
window.fixture={dashboard,snapshot};
</script><section class="container" id="form-fixture"><div class="cbi-section"><h2>System form</h2><div class="cbi-value"><label class="cbi-value-title" for="fixture-name">Hostname</label><div class="cbi-value-field"><input id="fixture-name" value="test-router"><div class="cbi-value-description">Device name</div></div></div><div class="ifacebadge">${Array.from({length:8},(_,i)=>'<span><img alt="port '+i+'" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27%3E%3Crect width=%2724%27 height=%2724%27 fill=%27%236f8999%27/%3E%3C/svg%3E"></span>').join('')}<span>br-lan</span></div><div class="cbi-page-actions"><button class="btn cbi-button-save" type="button">Save</button></div></div></section><script>${nav}</script><script>${search}</script></body></html>`;
}
function server() {
 return require('node:http').createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.endsWith('icons.svg')) {res.setHeader('content-type','image/svg+xml');return res.end(fs.readFileSync(url.pathname.includes('/rmm/')?'packages/luci-theme-rmm/htdocs/luci-static/rmm/icons.svg':base+'rmm-dashboard-icons.svg'));}
  if(url.pathname.endsWith('rmm-dashboard.css')){res.setHeader('content-type','text/css');return res.end(fs.readFileSync(base+'rmm-dashboard.css'));}
  res.setHeader('content-type','text/html; charset=utf-8');res.end(page(url.searchParams.get('lang')==='en'?'en':'ru'));
 });
}
module.exports={server};
if(require.main===module)server().listen(8767,'127.0.0.1',()=>console.log('Synthetic LuCI fixture: http://127.0.0.1:8767/cgi-bin/luci/admin/dashboard'));
