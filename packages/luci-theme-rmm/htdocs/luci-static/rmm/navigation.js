/* SPDX-License-Identifier: Apache-2.0 */
(function() {
	'use strict';

	function init() {
		var menu = document.getElementById('topmenu');
		if (!menu)
			return;

		var nav = menu.parentElement;
		var mobile = window.matchMedia('(max-width: 599px)');
		var desktop = window.matchMedia('(min-width: 900px)');
		var scheduled = false;
		var restoringFocus = false;

		function groups() {
			return menu.querySelectorAll(':scope > li.dropdown');
		}

		function updateNavHeight() {
			if (mobile.matches)
				document.documentElement.style.setProperty('--rmm-mobile-nav-height', Math.ceil(nav.getBoundingClientRect().height) + 'px');
			else
				document.documentElement.style.removeProperty('--rmm-mobile-nav-height');
		}

		function closeGroups(restoreFocus) {
			var open = menu.querySelector(':scope > li.rmm-open');
			groups().forEach(function(group) {
				group.classList.remove('rmm-open');
				var trigger = group.querySelector(':scope > a.menu');
				if (trigger && !desktop.matches)
					trigger.setAttribute('aria-expanded', 'false');
			});
			if (restoreFocus && open) {
				restoringFocus = true;
				open.querySelector(':scope > a.menu')?.focus();
				restoringFocus = false;
			}
		}

		function update() {
			scheduled = false;
			menu.classList.toggle('rmm-nav-many', menu.children.length > 5);
			var current = location.pathname.replace(/\/+$/, '');
			var best = null;
			var bestLength = -1;

			menu.querySelectorAll('.rmm-current').forEach(function(link) {
				link.classList.remove('rmm-current');
				link.removeAttribute('aria-current');
			});
			menu.querySelectorAll('.rmm-active').forEach(function(group) {
				group.classList.remove('rmm-active');
			});

			menu.querySelectorAll('a[href]').forEach(function(link) {
				if (link.getAttribute('href') === '#')
					return;
				var url;
				try { url = new URL(link.href, location.href); }
				catch (_) { return; }
				if (url.origin !== location.origin)
					return;
				var path = url.pathname.replace(/\/+$/, '');
				if ((current === path || current.startsWith(path + '/')) && path.length > bestLength) {
					best = link;
					bestLength = path.length;
				}
			});

			if (best) {
				best.classList.add('rmm-current');
				best.setAttribute('aria-current', 'page');
				best.closest('li.dropdown')?.classList.add('rmm-active');
			}

			groups().forEach(function(group, index) {
				var trigger = group.querySelector(':scope > a.menu');
				var submenu = group.querySelector(':scope > .dropdown-menu');
				if (!trigger || !submenu)
					return;
				if (!submenu.id)
					submenu.id = 'rmm-submenu-' + index;
				trigger.setAttribute('aria-controls', submenu.id);
				if (!desktop.matches)
					trigger.setAttribute('aria-expanded', group.classList.contains('rmm-open') ? 'true' : 'false');
				else
					trigger.removeAttribute('aria-expanded');
			});
			updateNavHeight();
		}

		function scheduleUpdate() {
			if (!scheduled) {
				scheduled = true;
				Promise.resolve().then(update);
			}
		}

		menu.addEventListener('click', function(event) {
			var trigger = event.target.closest('li.dropdown > a.menu');
			if (!trigger || !menu.contains(trigger))
				return;
			if (!desktop.matches) {
				event.preventDefault();
				var group = trigger.parentElement;
				var wasOpen = group.classList.contains('rmm-open');
				closeGroups(false);
				group.classList.toggle('rmm-open', !wasOpen);
				trigger.setAttribute('aria-expanded', wasOpen ? 'false' : 'true');
			}
			else if (desktop.matches) {
				event.preventDefault();
				var firstLink = trigger.parentElement.querySelector('.dropdown-menu a[href]');
				if (firstLink)
					window.location.assign(firstLink.href);
			}
		});
		menu.addEventListener('keydown', function(event) {
			if (!desktop.matches && event.key === ' ' && event.target.matches('li.dropdown > a.menu')) {
				event.preventDefault();
				event.target.click();
			}
		});

		// Tablet submenus open when their trigger receives keyboard focus.
		menu.addEventListener('focusin', function(event) {
			if (mobile.matches || desktop.matches || restoringFocus)
				return;
			if (event.target.matches('a.menu') && !event.target.matches(':focus-visible'))
				return;
			var group = event.target.closest('li.dropdown');
			if (!group || !menu.contains(group))
				return;
			closeGroups(false);
			group.classList.add('rmm-open');
			group.querySelector(':scope > a.menu')?.setAttribute('aria-expanded', 'true');
		});
		menu.addEventListener('focusout', function(event) {
			if (mobile.matches || desktop.matches)
				return;
			var group = event.target.closest('li.dropdown');
			if (group && (!event.relatedTarget || !group.contains(event.relatedTarget)))
				closeGroups(false);
		});
		document.addEventListener('click', function(event) {
			if (!desktop.matches && !menu.contains(event.target))
				closeGroups(false);
		});
		document.addEventListener('keydown', function(event) {
			if (!desktop.matches && event.key === 'Escape' && menu.querySelector('.rmm-open')) {
				event.preventDefault();
				closeGroups(true);
			}
		});
		window.addEventListener('resize', function() {
			closeGroups(false);
			scheduleUpdate();
		});
		if (window.ResizeObserver)
			new ResizeObserver(updateNavHeight).observe(nav);
		new MutationObserver(scheduleUpdate).observe(menu, { childList: true, subtree: true });
		update();
		document.body.classList.add('rmm-nav-enhanced');
	}

	if (document.readyState === 'loading')
		document.addEventListener('DOMContentLoaded', init, { once: true });
	else
		init();
})();
