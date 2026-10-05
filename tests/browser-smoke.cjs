// Isolated synthetic router snapshots; never connect to a real router in CI.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {server}=require('./browser-fixture.cjs');
(async()=>{
 const app=server();await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch();const origin='http://127.0.0.1:'+app.address().port;
 fs.mkdirSync('test-results',{recursive:true});
 try {
  for(const width of [320,390,768,1440])for(const language of ['ru','en']) {
   const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(origin+'/cgi-bin/luci/admin/dashboard?lang='+language);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow ${width}/${language}`);
   assert.doesNotMatch(await page.locator('.rmm-dashboard-overview').innerText(),/null|undefined/);
   await page.locator('.rmm-dashboard-path-device > summary').click();assert.equal(await page.locator('dialog.rmm-dashboard-inspector').isVisible(),true);
   await page.keyboard.press('Escape');assert.equal(await page.locator('.rmm-dashboard-path-device > summary').evaluate(el=>el===document.activeElement),true);
   const graph=page.locator('.rmm-dashboard-history-panel svg').first();await graph.focus();await page.keyboard.press('Home');
   await page.evaluate(()=>{const {dashboard,snapshot}=window.fixture;dashboard.update(dashboard.root,snapshot());});
   assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-chart-title')?.includes('eth0')),true);
   await page.locator('#rmm-history-period').selectOption('900000');
   const before=await page.evaluate(()=>JSON.stringify(window.fixture.dashboard.history));
   await page.locator('#rmm-history-period').selectOption('60000');assert.equal(await page.evaluate(()=>JSON.stringify(window.fixture.dashboard.history)),before);
   await page.locator('.rmm-dashboard-layout > summary').click();await page.locator('[data-block="topology"] input').uncheck();
   assert.equal(await page.locator('.rmm-dashboard-network-path').isVisible(),false);
   await page.reload();assert.equal(await page.locator('.rmm-dashboard-network-path').isVisible(),false);
   await page.locator('.rmm-dashboard-layout > summary').click();await page.locator('.rmm-dashboard-layout > button').click();
   assert.equal(await page.locator('.rmm-dashboard-network-path').isVisible(),true);
   await page.locator('#rmm-client-type').selectOption('dhcp');assert.equal(await page.locator('.rmm-dashboard-station:not([hidden])').count(),1);
   await page.locator('#rmm-client-type').selectOption('wired');assert.equal(await page.locator('.rmm-dashboard-station:not([hidden])').count(),1);assert.match(await page.locator('.rmm-dashboard-station:not([hidden]) summary').innerText(),/lan3/);
   await page.locator('#rmm-client-type').selectOption('neighbor');assert.equal(await page.locator('.rmm-dashboard-station:not([hidden])').count(),1);
   await page.locator('#rmm-client-type').selectOption('all');
   // Manual name editing exercises the real DOM/form semantics with fixture-only RPC.
   const label=language==='ru'?{edit:'Изменить имя',name:'Имя устройства',save:'Сохранить имя',automatic:'Использовать автоматическое имя',close:'Закрыть',dns:'Имена из DNS'}:{edit:'Edit display name',name:'Display name',save:'Save name',automatic:'Use automatic name',close:'Close',dns:'DNS names'};
   await page.locator('summary[aria-label$="NAS (DHCPv6)"]').click();
   const inspector=page.locator('dialog.rmm-dashboard-inspector');
   await inspector.getByRole('button',{name:label.edit,exact:true}).click();
   const nameInput=inspector.getByRole('textbox',{name:label.name,exact:true});await nameInput.fill('Home NAS');
   await page.evaluate(()=>{const {dashboard,snapshot}=window.fixture;dashboard.update(dashboard.root,snapshot());});
   assert.equal(await nameInput.inputValue(),'Home NAS');
   await inspector.getByRole('button',{name:label.save,exact:true}).click();
   await page.waitForFunction(()=>document.getElementById('rmm-dashboard-detail-title').textContent==='Home NAS');
   assert.doesNotMatch(await inspector.innerText(),/null|undefined/);
   assert.equal(await inspector.evaluate(el=>el.scrollWidth<=el.clientWidth),true,`name editor overflow ${width}/${language}`);
   await inspector.getByRole('button',{name:label.automatic,exact:true}).click();
   await page.waitForFunction(()=>document.getElementById('rmm-dashboard-detail-title').textContent==='NAS (DHCPv6)');
   await inspector.getByRole('button',{name:label.close,exact:true}).click();
   await page.getByRole('checkbox',{name:label.dns,exact:true}).check();
   await page.waitForFunction(()=>Array.from(document.querySelectorAll('.rmm-dashboard-client-name')).some(el=>el.textContent==='printer.lan'));
   await page.getByRole('checkbox',{name:label.dns,exact:true}).uncheck();
   assert.equal(await page.locator('.rmm-dashboard-client-name').filter({hasText:'printer.lan'}).count(),0);
   const network=page.locator('#topmenu > li > a[aria-label="Network"]');await network.focus();await network.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.textContent==='Wireless'),true);await page.keyboard.press('Escape');
   await page.locator('.rmm-search-launcher button').click();await page.locator('#rmm-search-query').fill('вайфай');assert.equal(await page.locator('.rmm-search-results a').count(),1);await page.keyboard.press('Escape');
   assert.ok(await page.locator('.rmm-dashboard-client-preview button').count()>=3);
   await page.locator('summary[aria-label$="Desktop"]').click();
   const clientDetails=page.locator('dialog.rmm-dashboard-inspector');
   assert.match(await clientDetails.innerText(),/Intel Corporate/);
   assert.equal(await clientDetails.evaluate(el=>el.scrollWidth<=el.clientWidth),true,`client insights overflow ${width}/${language}`);
   await clientDetails.getByRole('button',{name:label.close,exact:true}).click();
   assert.equal(await page.locator('#fixture-name').isVisible(),true);
   if(width<600)assert.equal(await page.locator('.cbi-value-title').evaluate(el=>getComputedStyle(el).textAlign),'left');
   const badge=await page.locator('.ifacebadge img').evaluateAll(images=>images.map(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom})));
   for(let i=0;i<badge.length;i++)for(let j=i+1;j<badge.length;j++)assert.ok(badge[i].right<=badge[j].left || badge[j].right<=badge[i].left || badge[i].bottom<=badge[j].top || badge[j].bottom<=badge[i].top,'LAN icons overlap');
   await page.screenshot({path:`test-results/dashboard-${width}-${language}.png`,fullPage:true});
   // Unavailable and partial states remain explicit, including safe source timestamps.
   await page.evaluate(()=>{const {dashboard}=window.fixture;dashboard.sources=[];dashboard.update(dashboard.root,Array.from({length:9},()=>({error:{code:6}})));});
   assert.doesNotMatch(await page.locator('.rmm-dashboard').innerText(),/Invalid Date|null|undefined/);
   assert.equal(errors.length,0,errors.join('\n'));
   await context.close();console.log(`PASS ${width}px ${language}`);
  }
 }finally{await browser.close();await new Promise(resolve=>app.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
