const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function setup(width, pathname = '/cgi-bin/luci/admin/status/overview', route = null) {
  const handlers = {};
  const listen = (scope) => (name, callback) => { handlers[scope + name] = callback; };
  const classes = () => {
    const values = new Set();
    return {
      add: value => values.add(value), remove: value => values.delete(value),
      contains: value => values.has(value),
      toggle(value, enabled) { enabled ? values.add(value) : values.delete(value); }
    };
  };
  const attributes = {};
  let focus = null;
  let keyboard = true;
  const trigger = {
    parentElement: null, getBoundingClientRect: () => ({ top: 800 }),
    setAttribute: (key, value) => { attributes[key] = value; },
    removeAttribute: key => { delete attributes[key]; },
    matches: selector => selector === ':focus-visible' ? keyboard : true,
    closest: selector => selector.includes('a.menu') ? trigger : group,
    focus() { focus = trigger; handlers.menufocusin?.({ target: trigger }); },
    click() { handlers.menuclick({ target: trigger, preventDefault() {} }); }
  };
  const linkAttributes = {};
  const link = {
    href: 'http://router/cgi-bin/luci/admin/status/overview',
    classList: classes(),
    getAttribute: key => key === 'href' ? '/cgi-bin/luci/admin/status/overview' : linkAttributes[key],
    setAttribute: (key, value) => { linkAttributes[key] = value; },
    removeAttribute: key => { delete linkAttributes[key]; },
    closest: () => group,
    matches: () => false
  };
  const submenu = { id: '', scrollHeight: 240, style: { setProperty() {} } };
  const group = {
    classList: classes(),
    querySelector: selector => selector.includes('a.menu') ? trigger : selector.includes('a[href]') ? link : submenu,
    contains: target => target === trigger || target === link
  };
  trigger.parentElement = group;
  const menu = {
    parentElement: { getBoundingClientRect: () => ({ height: 56 }) },
    children: [group], classList: classes(), addEventListener: listen('menu'),
    contains: target => target === group || group.contains(target),
    querySelector: () => group.classList.contains('rmm-open') ? group : null,
    querySelectorAll: selector => selector === ':scope > li.dropdown' ? [group] : selector === 'a[href]' ? [link] : []
  };
  const document = {
    readyState: 'complete', getElementById: () => menu, addEventListener: listen('document'),
    body: { classList: classes(), getAttribute: () => route },
    documentElement: { style: { setProperty() {}, removeProperty() {} } }
  };
  let destination;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../packages/luci-theme-rmm/htdocs/luci-static/rmm/navigation.js'), 'utf8'), {
    document, location: { pathname, href: 'http://router' + pathname, origin: 'http://router' },
    window: {
      innerHeight: 900, matchMedia: query => ({ matches: query.includes('599') ? width < 600 : width >= 900 }),
      addEventListener: listen('window'), location: { assign: value => { destination = value; } }
    },
    MutationObserver: class { observe() {} }, URL, Promise
  });
  return {
    trigger, link, attributes, group, handlers, linkAttributes,
    mouseFocus() { keyboard = false; trigger.focus(); },
    get focus() { return focus; }, get destination() { return destination; },
    get open() { return group.classList.contains('rmm-open'); }
  };
}

test('tablet keyboard opens submenu; Escape closes and restores focus without reopening', () => {
  const page = setup(768);
  page.trigger.focus();
  assert.equal(page.open, true);
  assert.equal(page.attributes['aria-expanded'], 'true');
  page.handlers.menufocusin({ target: page.link });
  page.handlers.documentkeydown({ key: 'Escape', preventDefault() {} });
  assert.equal(page.open, false);
  assert.equal(page.focus, page.trigger);
  assert.equal(page.attributes['aria-expanded'], 'false');
});

test('first tablet mouse click opens; second closes', () => {
  const page = setup(768);
  page.mouseFocus();
  assert.equal(page.open, false);
  page.trigger.click();
  assert.equal(page.open, true);
  page.trigger.click();
  assert.equal(page.open, false);
});

test('tablet focus remains inside group and closes when leaving', () => {
  const page = setup(600);
  page.trigger.focus();
  page.handlers.menufocusout({ target: page.trigger, relatedTarget: page.link });
  assert.equal(page.open, true);
  page.handlers.menufocusout({ target: page.link, relatedTarget: null });
  assert.equal(page.open, false);
});

test('mobile Space opens and outside click closes', () => {
  const page = setup(390);
  page.trigger.focus();
  assert.equal(page.open, false);
  page.handlers.menukeydown({ key: ' ', target: page.trigger, preventDefault() {} });
  assert.equal(page.open, true);
  page.handlers.documentclick({ target: {} });
  assert.equal(page.open, false);
});

test('desktop icon group toggles a labelled flyout and Escape restores focus', () => {
  const page = setup(900);
  page.trigger.click();
  assert.equal(page.destination, undefined);
  assert.equal(page.open, true);
  assert.equal(page.attributes['aria-expanded'], 'true');
  page.handlers.documentkeydown({ key: 'Escape', preventDefault() {} });
  assert.equal(page.open, false);
  assert.equal(page.focus, page.trigger);
});

test('dispatcher route highlights the overview behind the root entry alias', () => {
  const page = setup(768, '/cgi-bin/luci/', '/cgi-bin/luci/admin/status/overview');
  assert.equal(page.linkAttributes['aria-current'], 'page');
});

test('visible URL highlights direct routes when no resolved route is supplied', () => {
  const page = setup(768);
  assert.equal(page.linkAttributes['aria-current'], 'page');
});

test('foreign resolved routes cannot change current destination', () => {
  const page = setup(768, '/cgi-bin/luci/', 'https://foreign.example/cgi-bin/luci/admin/status/overview');
  assert.equal(page.linkAttributes['aria-current'], undefined);
});
const { parseHTML } = require('linkedom');
test('icon rail preserves anchors, accessible names and idempotent asynchronous menu decoration', async () => {
  const { document } = parseHTML('<html><body data-rmm-icons="/icons.svg?v=test"><nav><ul id="topmenu"><li><a href="/cgi-bin/luci/admin/dashboard">RMM</a></li><li class="dropdown"><a class="menu" href="#">System</a><ul class="dropdown-menu"><li><a href="/cgi-bin/luci/admin/system/system">Settings</a></li></ul></li></ul></nav></body></html>');
  document.getElementById('topmenu').parentElement.getBoundingClientRect = () => ({height:56});
  let changed;
  const context = { document, location:{href:'http://router/cgi-bin/luci/admin/dashboard', pathname:'/cgi-bin/luci/admin/dashboard',origin:'http://router'}, window:{innerHeight:900, matchMedia:query=>({matches:query.includes('900')}),addEventListener(){}}, URL, Promise, MutationObserver:class { constructor(fn){changed=fn;} observe(){} } };
  const original=document.querySelector('a');
  let clicks=0; original.addEventListener('click',()=>clicks++);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../packages/luci-theme-rmm/htdocs/luci-static/rmm/navigation.js'),'utf8'),context);
  assert.equal(document.querySelector('a'),original);
  assert.equal(original.getAttribute('aria-label'),'RMM');
  assert.equal(original.getAttribute('title'),'RMM');
  assert.equal(original.getAttribute('aria-current'),'page');
  assert.equal(original.querySelector('use').getAttribute('href'),'/icons.svg?v=test#icon-layout-grid');
  assert.equal(document.querySelector('a.menu use').getAttribute('href'),'/icons.svg?v=test#icon-router');
  original.click(); assert.equal(clicks,1);
  changed(); await Promise.resolve();
  assert.equal(original.querySelectorAll('svg').length,1);
  const node=document.createElement('li');node.innerHTML='<a href="/cgi-bin/luci/admin/network/network">Network</a>';document.getElementById('topmenu').append(node);
  changed();await Promise.resolve();
  assert.equal(node.querySelector('use').getAttribute('href'),'/icons.svg?v=test#icon-network');
  assert.equal(node.querySelector('.rmm-nav-label').textContent,'Network');
});

test('dashboard route retains old alias and read access restrictions',()=>{
 const menu=JSON.parse(fs.readFileSync(path.join(__dirname,'../packages/luci-app-rmm-dashboard/root/usr/share/luci/menu.d/luci-app-rmm-dashboard.json')));
 assert.equal(menu['admin/dashboard'].action.path,'status/rmm-dashboard');
 assert.equal(menu['admin/dashboard'].firstchild_ineligible,true);
 assert.equal(menu['admin/status/rmm-dashboard'].action.type,'alias');
 assert.equal(menu['admin/status/rmm-dashboard'].action.path,'admin/dashboard');
 assert.deepEqual(menu['admin/dashboard'].depends,menu['admin/status/rmm-dashboard'].depends);
});
