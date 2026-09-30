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
    parentElement: null,
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
  const submenu = { id: '' };
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
      matchMedia: query => ({ matches: query.includes('599') ? width < 600 : width >= 900 }),
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

test('desktop group navigates to first child and has no disclosure state', () => {
  const page = setup(900);
  page.trigger.click();
  assert.equal(page.destination, page.link.href);
  assert.equal(page.attributes['aria-expanded'], undefined);
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