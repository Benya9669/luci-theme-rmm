const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {parseHTML}=require('linkedom');
function fixture(menu) {
 const {document,HTMLElement}=parseHTML('<html lang="ru"><body><ul id="topmenu">'+menu+'</ul><div id="maincontent"></div></body></html>');
 let focused=document.body,observer;Object.defineProperty(document,'activeElement',{get:()=>focused});
 HTMLElement.prototype.focus=function(){focused=this;};
 HTMLElement.prototype.showModal=function(){this.setAttribute('open','');};
 HTMLElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new document.defaultView.Event('close'));};
 vm.runInNewContext(fs.readFileSync('packages/luci-theme-rmm/htdocs/luci-static/rmm/search.js','utf8'),{document,location:{href:'http://router/cgi-bin/luci/admin/dashboard',origin:'http://router',pathname:'/cgi-bin/luci/admin/dashboard'},URL,Promise,Set,MutationObserver:class{constructor(fn){observer=fn;}observe(){}}});
 const dialog=document.querySelector('dialog'),input=dialog.querySelector('input'),trigger=document.querySelector('.rmm-search-launcher button');
 function key(target,value,extra={}){const event=new document.defaultView.Event('keydown',{bubbles:true,cancelable:true});Object.assign(event,{key:value,...extra});target.dispatchEvent(event);return event;}
 return {document,dialog,input,trigger,key,get focus(){return focused;},async update(){observer();await Promise.resolve();},search(value){input.value=value;input.dispatchEvent(new document.defaultView.Event('input'));}};
}
const menu='<li class="dropdown"><a href="#">Система</a><ul><li><a href="/cgi-bin/luci/admin/system/system">Настройки</a></li><li><a href="/cgi-bin/luci/admin/system/flash">Обновление</a></li></ul></li><li><a href="/cgi-bin/luci/admin/dashboard">Обзор</a></li>';
test('search indexes authorized DOM links with categories, deduplicates destinations and excludes unsafe or hidden entries',()=>{
 const f=fixture(menu+'<li><a href="/cgi-bin/luci/admin/dashboard">Duplicate</a></li><li><a href="http://foreign/cgi-bin/luci/admin/system">Foreign</a></li><li><a href="javascript:alert(1)">Script</a></li><li><a href="/cgi-bin/luci/admin/logout">Logout</a></li><li hidden><a href="/cgi-bin/luci/admin/private">Hidden</a></li>');
 f.trigger.click();const results=f.dialog.querySelectorAll('a');assert.equal(results.length,3);
 assert.ok(f.dialog.textContent.includes('Система / Настройки'));assert.doesNotMatch(f.dialog.textContent,/Foreign|Script|Logout|Hidden|Duplicate/);
 f.search('СИСТЕМА настройки');assert.equal(f.dialog.querySelectorAll('a').length,1);
 f.search('nothing');assert.match(f.dialog.textContent,/Нет подходящих страниц/);
});
test('keyboard shortcut, arrow selection, tab boundaries and Escape restore focus',()=>{
 const f=fixture(menu);f.trigger.focus();f.key(f.document.body,'k',{ctrlKey:true});assert.ok(f.dialog.hasAttribute('open'));assert.equal(f.focus,f.input);
 f.key(f.input,'ArrowUp');assert.equal(f.focus,f.dialog.querySelectorAll('a')[2]);
 f.key(f.focus,'ArrowDown');assert.equal(f.focus,f.dialog.querySelectorAll('a')[0]);
 const close=f.dialog.querySelector('button');close.focus();f.key(close,'Tab',{shiftKey:true});assert.equal(f.focus,f.dialog.querySelectorAll('a')[2]);
 f.key(f.focus,'Tab');assert.equal(f.focus,close);f.key(close,'Escape');assert.equal(f.dialog.hasAttribute('open'),false);assert.equal(f.focus,f.trigger);
});
test('search stays unavailable without menu routes and updates asynchronously when ACL-rendered menu changes',async()=>{
 const f=fixture('');assert.equal(f.trigger.hidden,true);
 f.document.getElementById('topmenu').innerHTML=menu;await f.update();assert.equal(f.trigger.hidden,false);f.trigger.click();assert.equal(f.dialog.querySelectorAll('a').length,3);
 const denied=f.document.querySelector('#topmenu a[href="/cgi-bin/luci/admin/system/flash"]');denied.parentElement.remove();await f.update();assert.equal(f.dialog.querySelectorAll('a').length,2);
});
test('shortcut preserves editing and existing LuCI dialogs; result anchors retain native navigation',()=>{
 const f=fixture(menu),field=f.document.createElement('input');f.document.body.append(field);f.key(field,'k',{ctrlKey:true});assert.equal(f.dialog.hasAttribute('open'),false);
 f.document.body.classList.add('modal-overlay-active');assert.equal(f.key(f.document.body,'k',{ctrlKey:true}).defaultPrevented,false);assert.equal(f.dialog.hasAttribute('open'),false);
 f.document.body.classList.remove('modal-overlay-active');f.trigger.click();assert.equal(f.dialog.querySelector('a').getAttribute('href'),'http://router/cgi-bin/luci/admin/system/system');
});
test('packaging and versioned footer include the menu search asset',()=>{
 const make=fs.readFileSync('packages/luci-theme-rmm/Makefile','utf8'),footer=fs.readFileSync('packages/luci-theme-rmm/ucode/template/themes/rmm/footer.ut','utf8');
 assert.ok(make.includes('/search.js'));assert.ok(footer.includes('/search.js?v=0.5.0'));
});

test('Enter from the query activates a native result anchor',()=>{
 const f=fixture(menu);f.trigger.click();f.search('Настройки');let activated=false;
 f.dialog.querySelector('a').addEventListener('click',event=>{activated=true;event.preventDefault();});f.key(f.input,'Enter');assert.equal(activated,true);
});
test('async menu updates preserve the focused destination or return to search when it is removed',async()=>{
 const f=fixture(menu);f.trigger.click();f.dialog.querySelector('a').focus();await f.update();assert.equal(f.focus.getAttribute('href'),'http://router/cgi-bin/luci/admin/system/system');
 f.document.querySelector('#topmenu a[href="/cgi-bin/luci/admin/system/system"]').parentElement.remove();await f.update();assert.equal(f.focus,f.input);
});
