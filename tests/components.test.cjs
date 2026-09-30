const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { parseHTML } = require('linkedom');

function fixture(content, page = 'admin-network-dhcp') {
  const { document, HTMLElement } = parseHTML(`<html lang="ru"><body data-page="${page}">${content}</body></html>`);
  // LinkeDOM does not implement browser tabIndex semantics, including explicit 0.
  Object.defineProperty(HTMLElement.prototype, 'tabIndex', {
    configurable: true,
    get() { return this.hasAttribute('tabindex') ? Number(this.getAttribute('tabindex')) : this.matches('a[href], button, input, select, textarea') ? 0 : -1; },
    set(value) { this.setAttribute('tabindex', String(value)); }
  });
  const events = {};
  const observers = [];
  const frames = [];
  let focused = document.body;
  Object.defineProperty(document, 'activeElement', { get: () => focused });
  HTMLElement.prototype.focus = function() { focused = this; };
  HTMLElement.prototype.getClientRects = function() { return this.closest('[hidden]') ? [] : [{}]; };
  document.addEventListener = (name, callback) => { events[name] = callback; };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../packages/luci-theme-rmm/htdocs/luci-static/rmm/components.js'), 'utf8'), {
    document, window: { innerWidth: 390, innerHeight: 800, getComputedStyle: () => ({ paddingBottom: '57px' }), addEventListener() {}, requestAnimationFrame: callback => frames.push(callback) },
    MutationObserver: class { constructor(callback) { observers.push(callback); } observe() {} }
  });
  return {
    document, events,
    refresh() { observers[0](); while (frames.length) frames.shift()(); },
    get focus() { return focused; }
  };
}

const records = `<div id="view"><table class="table"><tr class="tr table-titles"><th class="th">Имя</th><th class="th">IP</th></tr><tr class="tr"><td class="td">router</td><td class="td" data-title="Адрес">2001:db8::1234</td></tr></table></div>`;

test('records retain native nodes and widget labels; wrapper is idempotent', () => {
  const f = fixture(records);
  const table = f.document.querySelector('table');
  const row = table.querySelectorAll('tr')[1];
  const cell = row.querySelectorAll('td')[1];
  assert.equal(table.parentElement.className, 'rmm-table-scroll');
  assert.equal(row.classList.contains('rmm-record-row'), true);
  assert.equal(cell.getAttribute('data-title'), 'Адрес');
  assert.equal(cell.getAttribute('data-rmm-label'), 'Адрес');
  f.refresh();
  assert.equal(f.document.querySelectorAll('.rmm-table-scroll').length, 1);
  assert.equal(table.querySelectorAll('tr')[1], row);
  assert.equal(row.querySelectorAll('td')[1], cell);
});

test('polling-created rows receive labels and changed headings refresh labels', () => {
  const f = fixture(records);
  const table = f.document.querySelector('table');
  const row = f.document.createElement('tr');
  row.className = 'tr';
  row.innerHTML = '<td class="td">second</td><td class="td">2001:db8::5678</td>';
  table.appendChild(row);
  f.refresh();
  assert.equal(row.querySelectorAll('td')[1].getAttribute('data-rmm-label'), 'IP');
  table.querySelectorAll('th')[1].textContent = 'IPv6';
  f.refresh();
  assert.equal(row.querySelectorAll('td')[1].getAttribute('data-rmm-label'), 'IPv6');
});

test('editable tables keep visible overflow and retain their form controls', () => {
  const f = fixture(records.replace('router</td>', '<input id="setting" value="original"></td>'));
  const input = f.document.getElementById('setting');
  assert.equal(f.document.querySelectorAll('.rmm-table-scroll').length, 0);
  f.refresh();
  assert.equal(f.document.getElementById('setting'), input);
  assert.equal(input.getAttribute('value'), 'original');
});

test('merged/placeholder rows do not receive incorrect per-column labels', () => {
  const f = fixture(records.replace('</table>', '<tr class="tr placeholder"><td class="td" colspan="2">Empty</td></tr></table>'));
  assert.equal(f.document.querySelector('.placeholder').classList.contains('rmm-record-row'), false);
  assert.equal(f.document.querySelector('.placeholder td').hasAttribute('data-rmm-label'), false);
});

test('nested tables are classified independently', () => {
  const f = fixture(records.replace('router</td>', 'router<table class="table"><tr class="tr"><td class="td">Key</td><td class="td">Value</td></tr></table></td>'));
  assert.equal(f.document.querySelectorAll('.rmm-record-row').length, 1);
  assert.equal(f.document.querySelectorAll('.rmm-key-values').length, 1);
});

test('diagnostics destination labels are associated and not duplicated', () => {
  const f = fixture('<div id="view"><table class="table"><tr class="tr">' +
    '<td class="td"><input type="text"></td>'.repeat(3) + '</tr></table></div>', 'admin-network-diagnostics');
  assert.equal(f.document.querySelector('.table').classList.contains('rmm-diagnostics'), true);
  assert.equal(f.document.querySelectorAll('label').length, 3);
  for (const label of f.document.querySelectorAll('label')) assert.ok(f.document.getElementById(label.htmlFor));
  f.refresh();
  assert.equal(f.document.querySelectorAll('label').length, 3);
});

test('non-login dialogs are labelled, trap Tab and restore invoker focus', () => {
  const f = fixture('<button id="invoker" tabindex="0">Open</button><div id="modal_overlay" tabindex="0"><div class="modal"><h4>Settings</h4><button id="first" tabindex="0">Cancel</button><button id="last" tabindex="0">Save</button></div></div>');
  const invoker = f.document.getElementById('invoker');
  invoker.focus();
  f.events.focusin({ target: invoker });
  f.document.body.classList.add('modal-overlay-active');
  f.document.getElementById('modal_overlay').focus();
  f.refresh();
  const modal = f.document.querySelector('.modal');
  assert.equal(modal.getAttribute('role'), 'dialog');
  assert.equal(modal.getAttribute('aria-labelledby'), modal.querySelector('h4').id);
  const first = f.document.getElementById('first');
  const last = f.document.getElementById('last');
  last.focus();
  let prevented = false;
  f.events.keydown({ key: 'Tab', shiftKey: false, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(f.focus, first);
  f.events.keydown({ key: 'Tab', shiftKey: true, preventDefault() {} });
  assert.equal(f.focus, last);
  f.document.body.classList.remove('modal-overlay-active');
  f.refresh();
  assert.equal(f.focus, invoker);
});

test('login dialog keeps the native authentication behaviour', () => {
  const f = fixture('<div id="modal_overlay"><div class="modal login"><h4>Login</h4><input type="password"></div></div>');
  f.document.body.classList.add('modal-overlay-active');
  f.refresh();
  assert.equal(f.document.querySelector('.login').hasAttribute('role'), false);
});

test('text, primary actions and focus colors meet contrast checks', () => {
  function luminance(hex) {
    const rgb = hex.match(/\w\w/g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
  }
  function contrast(a, b) { const values = [luminance(a), luminance(b)].sort((a, b) => b - a); return (values[0] + .05) / (values[1] + .05); }
  const css = fs.readFileSync(path.join(__dirname, '../packages/luci-theme-rmm/htdocs/luci-static/rmm/cascade.css'), 'utf8');
  const token = name => css.match(new RegExp('--' + name + ': #([a-f0-9]{6});'))[1];
  for (const name of ['rmm-text', 'rmm-muted', 'rmm-accent-hover', 'rmm-success', 'rmm-warning']) assert.ok(contrast(token(name), token('rmm-surface')) >= 4.5, name);
  assert.ok(contrast(token('rmm-bg'), token('rmm-accent')) >= 4.5);
  assert.ok(contrast(token('rmm-accent-hover'), token('rmm-surface-2')) >= 3);
});

test('component stylesheet parses and scroll ownership is local', () => {
  const css = fs.readFileSync(path.join(__dirname, '../packages/luci-theme-rmm/htdocs/luci-static/rmm/cascade.css'), 'utf8');
  const { document } = parseHTML('<html><head><style></style></head><body></body></html>');
  const style = document.querySelector('style');
  style.textContent = css;
  assert.ok(style.sheet.cssRules.length > 30);
  assert.doesNotMatch(css, /max-device-width/);
  assert.doesNotMatch(css.match(/#view\s*\{([^}]*)\}/)[1], /overflow/);
});
test('open dropdown stays within mobile bounds and above the bottom navigation', () => {
  const f = fixture('<div class="cbi-dropdown" id="dropdown"><ul class="dropdown"><li>Long option</li></ul></div>');
  const dropdown = f.document.getElementById('dropdown');
  const list = dropdown.querySelector('ul');
  dropdown.getBoundingClientRect = () => ({ left: 330, top: 700, bottom: 742, width: 150 });
  Object.defineProperty(list, 'scrollWidth', { value: 500 });
  Object.defineProperty(list, 'scrollHeight', { value: 300 });
  dropdown.setAttribute('open', '');
  f.refresh();
  assert.equal(dropdown.style.getPropertyValue('--rmm-dropdown-left'), '12px');
  assert.equal(dropdown.style.getPropertyValue('--rmm-dropdown-width'), '366px');
  assert.equal(dropdown.style.getPropertyValue('--rmm-dropdown-top'), '400px');
  assert.equal(list.classList.contains('rmm-dropdown-panel'), true);
});
test('headerless interface summaries retain native controls and get mobile status layout', () => {
  const f = fixture('<div id="view"><table class="table"><tr class="tr"><td class="td"><div class="ifacebox">lan</div></td><td class="td">2001:db8::1</td><td class="td cbi-section-actions"><button>Restart</button></td></tr></table></div>');
  const button = f.document.querySelector('button');
  assert.equal(f.document.querySelector('table').classList.contains('rmm-status-table'), true);
  f.refresh();
  assert.equal(f.document.querySelector('button'), button);
  assert.equal(f.document.querySelectorAll('[data-rmm-label]').length, 0);
});
