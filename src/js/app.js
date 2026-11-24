/* ==========================================================================
   CartMind App Shell — hash router, liquid nav, splash, theme, ⌘K palette
   ========================================================================== */
(function () {
  'use strict';
  const { motion: M, pages } = window.CM;
  const { $, $$ } = M;
  const root = document.documentElement;

  const ROUTES = {
    'overview':         { title: 'Overview',          icon: 'home',          key: 'o' },
    'customer-360':     { title: 'Customer 360',      icon: 'group',         key: 'c' },
    'live-cart':        { title: 'Live Cart',         icon: 'shopping_cart', key: 'l' },
    'basket-explorer':  { title: 'Basket Explorer',   icon: 'layers',        key: 'b' },
    'bundle-simulator': { title: 'Bundle Simulator',  icon: 'tune',          key: 's' },
    'segments':         { title: 'Segments',          icon: 'pie_chart',     key: 'r' },
    'ask-cartmind':     { title: 'Ask CartMind',      icon: 'auto_awesome',  key: 'a' },
  };
  const view = $('#app-view');
  let current = null, cleanup = null;

  /* ---------------- Liquid nav pill ---------------- */
  const pill = $('#nav-pill');
  function movePill(link, instant) {
    if (!link) return;
    const top = link.offsetTop, h = link.offsetHeight;
    const prevTop = parseFloat(pill.dataset.top || top);
    if (instant) pill.style.transition = 'none';
    // stretch: first grow to cover both items, then settle (gooey feel)
    if (!instant && !M.reduced() && prevTop !== top) {
      const minTop = Math.min(prevTop, top), span = Math.abs(prevTop - top) + h;
      pill.classList.add('stretch');
      pill.style.transform = `translateY(${minTop}px)`; pill.style.height = span + 'px';
      setTimeout(() => { pill.classList.remove('stretch'); pill.style.transform = `translateY(${top}px)`; pill.style.height = h + 'px'; }, 190);
    } else { pill.style.transform = `translateY(${top}px)`; pill.style.height = h + 'px'; }
    pill.dataset.top = top;
    if (instant) requestAnimationFrame(() => (pill.style.transition = ''));
  }

  /* ---------------- Router ---------------- */
  function routeFromHash() { const r = location.hash.replace(/^#\/?/, '').split('?')[0]; return ROUTES[r] ? r : 'overview'; }

  function mount(route) {
    const tpl = document.getElementById('view-' + route);
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    view.innerHTML = '';
    view.appendChild(tpl.content.cloneNode(true));
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    M.enhance(view);
    if (pages[route]) cleanup = pages[route](view, M) || null;
    if (pages['*']) pages['*'](view, M);
  }

  function go(route, first) {
    if (route === current) return;
    const prev = current; current = route;
    $$('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.path === route));
    movePill($(`.nav-link[data-path="${route}"]`), first);
    const crumb = $('#crumb'); crumb.textContent = ROUTES[route].title; crumb.classList.remove('swap'); void crumb.offsetWidth; crumb.classList.add('swap');
    document.title = `${ROUTES[route].title} · CartMind`;
    const bar = $('#route-progress'); bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run');
    if (!first && document.startViewTransition && !M.reduced()) document.startViewTransition(() => mount(route));
    else mount(route);
  }

  window.CM.remount = () => mount(current);
  window.addEventListener('hashchange', () => go(routeFromHash()));

  /* ---------------- Splash → dock into the sidebar logo (FLIP) ---------------- */
  function splash() {
    const s = $('#splash');
    const seen = sessionStorage.getItem('cm-splash');
    if (seen || M.reduced()) { s.remove(); return Promise.resolve(); }
    sessionStorage.setItem('cm-splash', 1);
    return new Promise(res => {
      setTimeout(() => {
        const cart = $('#splash-cart'), icon = $('#brand-icon');
        const a = cart.getBoundingClientRect(), b = icon.getBoundingClientRect();
        const sc = b.height / a.height;
        res();
        cart.animate([{ transform: 'none' }, { transform: `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(${sc})` }], { duration: 750, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
        $$('.splash-word, .splash-tag, .splash-bar', s).forEach(el => el.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: 300, fill: 'forwards' }));
        setTimeout(() => { s.classList.add('done'); $('#brand-icon').animate([{ transform: 'scale(1.4)', filter: 'drop-shadow(0 0 10px #f59e0b)' }, { transform: 'scale(1)', filter: 'none' }], { duration: 700, easing: 'cubic-bezier(.34,1.56,.64,1)' }); setTimeout(() => s.remove(), 700); }, 640);
      }, 2050);
    });
  }

  /* ---------------- Theme: circular reveal from the toggle ---------------- */
  function setThemeUI() {
    const dark = root.classList.contains('dark');
    $('#theme-toggle .theme-icon').textContent = dark ? 'light_mode' : 'dark_mode';
    $('#theme-toggle .theme-label').textContent = dark ? 'Light mode' : 'Dark mode';
  }
  function toggleTheme(x, y) {
    const apply = () => { root.classList.toggle('dark'); try { localStorage.setItem('cm-theme', root.classList.contains('dark') ? 'dark' : 'light'); } catch (e) {} setThemeUI(); };
    if (!document.startViewTransition || M.reduced()) return apply();
    root.style.setProperty('--tx', x + 'px'); root.style.setProperty('--ty', y + 'px');
    root.style.setProperty('--tr', Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 'px');
    root.classList.add('theme-swap');
    const vt = document.startViewTransition(apply);
    vt.finished.finally(() => root.classList.remove('theme-swap'));
  }
  $('#theme-toggle').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(); toggleTheme(r.left + 24, r.top + r.height / 2); });
  $('#motion-toggle').addEventListener('click', e => {
    root.classList.toggle('calm');
    e.currentTarget.classList.toggle('text-primary', root.classList.contains('calm'));
    M.toast(root.classList.contains('calm') ? 'Calm mode on — animations reduced' : 'Full motion restored', 'animation');
  });
  setThemeUI();

  /* ---------------- Header: scroll glass + progress ---------------- */
  const topbar = $('#topbar'), sp = $('#scroll-progress');
  addEventListener('scroll', () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    topbar.classList.toggle('scrolled', y > 8);
    sp.style.setProperty('--sp', h > 0 ? (y / h).toFixed(4) : 0);
  }, { passive: true });

  /* ---------------- Notifications ---------------- */
  const bell = $('#bell'), panel = $('#notif-panel');
  bell.addEventListener('click', e => { e.stopPropagation(); panel.classList.toggle('open'); $('.bell-dot').style.display = 'none'; });
  document.addEventListener('click', e => { if (!panel.contains(e.target)) panel.classList.remove('open'); });
  setInterval(() => { if (!document.hidden && !M.reduced()) { bell.classList.remove('bell-ring'); void bell.offsetWidth; bell.classList.add('bell-ring'); } }, 18000);

  /* ---------------- ⌘K command palette ---------------- */
  const pal = $('#palette'), pin = $('#palette-input'), plist = $('#palette-list');
  const ACTIONS = [
    ...Object.entries(ROUTES).map(([r, v]) => ({ label: `Go to ${v.title}`, icon: v.icon, hint: `G ${v.key.toUpperCase()}`, run: () => (location.hash = '#/' + r) })),
    { label: 'Toggle dark mode', icon: 'contrast', hint: 'T', run: () => toggleTheme(innerWidth / 2, innerHeight / 2) },
    { label: 'Run live cart stream', icon: 'play_circle', hint: 'Demo', run: () => { location.hash = '#/live-cart'; setTimeout(() => document.getElementById('sim-btn-play')?.click(), 900); } },
    { label: 'Simulate 15% bundle discount', icon: 'science', hint: 'Demo', run: () => { location.hash = '#/bundle-simulator'; setTimeout(() => document.getElementById('run-sim-btn')?.click(), 900); } },
    { label: 'Inspect churn cohort (Loyal → At Risk)', icon: 'trending_down', hint: 'Demo', run: () => { location.hash = '#/segments'; setTimeout(() => window.inspectChurnCohort?.(), 900); } },
    { label: 'Ask: Which at-risk customers buy baby products?', icon: 'auto_awesome', hint: 'AI', run: () => { location.hash = '#/ask-cartmind'; } },
    { label: 'Replay intro animation', icon: 'replay', hint: '', run: () => { sessionStorage.removeItem('cm-splash'); location.reload(); } },
    { label: 'Celebrate 🎉', icon: 'celebration', hint: '', run: () => M.burst(innerWidth / 2, innerHeight / 2, 60) },
  ];
  let sel = 0, filtered = ACTIONS;
  function renderPalette() {
    const q = pin.value.trim().toLowerCase();
    filtered = ACTIONS.filter(a => !q || a.label.toLowerCase().split('').reduce((i, ch) => (i < 0 ? -1 : (q[i] === ch ? i + 1 : i)), 0) >= q.length || a.label.toLowerCase().includes(q));
    if (!filtered.length) filtered = [{ label: `Ask CartMind: “${pin.value}”`, icon: 'auto_awesome', hint: 'AI', run: () => { sessionStorage.setItem('cm-ask', pin.value); location.hash = '#/ask-cartmind'; if (current === 'ask-cartmind') window.CM.askNow?.(); } }];
    sel = Math.min(sel, filtered.length - 1);
    plist.innerHTML = filtered.map((a, i) => {
      const label = q ? a.label.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'), '<mark>$1</mark>') : a.label;
      return `<li class="${i === sel ? 'sel' : ''}" data-i="${i}" style="animation-delay:${i * 22}ms"><span class="material-symbols-outlined">${a.icon}</span><span>${label}</span><small>${a.hint}</small></li>`;
    }).join('');
  }
  function openPalette() { pal.classList.add('open'); pin.value = ''; sel = 0; renderPalette(); setTimeout(() => pin.focus(), 50); }
  function closePalette() { pal.classList.remove('open'); }
  function runSel() { const a = filtered[sel]; closePalette(); if (a) setTimeout(a.run, 120); }
  $('#search-trigger').addEventListener('click', openPalette);
  $('.palette-backdrop').addEventListener('click', closePalette);
  pin.addEventListener('input', () => { sel = 0; renderPalette(); });
  plist.addEventListener('click', e => { const li = e.target.closest('li'); if (li) { sel = +li.dataset.i; runSel(); } });
  plist.addEventListener('mousemove', e => { const li = e.target.closest('li'); if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; $$('li', plist).forEach((x, i) => x.classList.toggle('sel', i === sel)); } });

  /* ---------------- Keyboard shortcuts ---------------- */
  let gPending = 0;
  document.addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.classList.contains('open') ? closePalette() : openPalette(); return; }
    if (pal.classList.contains('open')) {
      if (e.key === 'Escape') closePalette();
      else if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % filtered.length; renderPalette(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + filtered.length) % filtered.length; renderPalette(); }
      else if (e.key === 'Enter') { e.preventDefault(); runSel(); }
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); openPalette(); return; }
    if (e.key.toLowerCase() === 't') { toggleTheme(innerWidth - 60, 30); return; }
    if (e.key.toLowerCase() === 'g') { gPending = Date.now(); return; }
    if (Date.now() - gPending < 900) {
      const hit = Object.entries(ROUTES).find(([, v]) => v.key === e.key.toLowerCase());
      if (hit) location.hash = '#/' + hit[0];
      gPending = 0;
    }
  });

  /* ---------------- Boot ---------------- */
  M.buttons(document.getElementById('sidebar'));
  M.buttons(document.getElementById('topbar'));
  addEventListener('resize', () => movePill($('.nav-link.active'), true));
  const ready = document.fonts ? document.fonts.ready : Promise.resolve();
  const sp1 = splash();
  ready.then(() => movePill($('.nav-link.active'), true));
  // Mount behind the splash so the dock reveals a live page
  sp1.then(() => { if (!current) go(routeFromHash(), true); });
})();
