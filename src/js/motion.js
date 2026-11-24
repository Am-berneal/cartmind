/* ==========================================================================
   CartMind Motion Engine
   A dependency-free animation layer that upgrades any view:
   reveals, count-ups, SVG drawing, tilt + spotlight cards, magnetic buttons,
   ripples, decrypt headlines, odometers, fly-to arcs, grocery confetti,
   synapse particles, Monte-Carlo rain and more.
   ========================================================================== */
(function () {
  'use strict';
  const CM = (window.CM = window.CM || {});
  const root = document.documentElement;
  const reduced = () => root.classList.contains('calm') || (matchMedia('(prefers-reduced-motion: reduce)').matches && !root.classList.contains('force-motion'));
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const ease = { outExpo: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)), outCubic: t => 1 - Math.pow(1 - t, 3), inOut: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) };
  const raf = fn => requestAnimationFrame(fn);

  /* ---------- Shared IntersectionObserver: adds .is-in and fires hooks ---------- */
  const hooks = new WeakMap();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('is-in');
      const fns = hooks.get(el);
      if (fns) { hooks.delete(el); fns.forEach(fn => fn(el)); }
      io.unobserve(el);
      setTimeout(() => el.classList.add('settled'), 1400);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  function watch(el, fn) {
    if (fn) { const list = hooks.get(el) || []; list.push(fn); hooks.set(el, list); }
    if (fn && el.classList.contains('is-in') && el.isConnected) { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) { hooks.delete(el); fn(el); return; } }
    io.observe(el);
  }

  /* ---------- 1. Reveal: blur-to-sharp 3D lift with smart stagger ---------- */
  function isCard(el) {
    const c = el.className;
    if (typeof c !== 'string') return false;
    return /rounded-(xl|2xl|lg)/.test(c) && /(bg-surface-container-lowest|bg-white|shadow|border)/.test(c) && !/absolute|fixed/.test(c);
  }
  function reveal(scope) {
    const cards = $$('div, section, article', scope).filter(el => isCard(el) && !el.parentElement.closest('.m-reveal') && el.offsetHeight > 40);
    const vh = innerHeight;
    let i = 0;
    cards.forEach(el => {
      el.classList.add('m-reveal');
      const r = el.getBoundingClientRect();
      if (r.top < vh) el.style.setProperty('--d', Math.min(i++ * 60, 720) + 'ms');
      watch(el);
    });
    // Section titles not inside cards
    $$('h1, h2', scope).filter(h => !h.closest('.m-reveal')).forEach((h, k) => { h.classList.add('m-reveal'); h.style.setProperty('--d', k * 50 + 'ms'); watch(h); });
    return cards;
  }

  /* ---------- 2. Count-up for every metric-looking number ---------- */
  const NUM_RE = /^([^\d\-−]*?)([\-−]?\d[\d,]*\.?\d*)(.*)$/;
  function countUp(el, opts = {}) {
    const raw = (el.dataset.cmFinal || el.textContent).trim();
    const m = raw.match(NUM_RE);
    if (!m || raw.length > 22) return;
    const [, pre, numStr, post] = m;
    const target = parseFloat(numStr.replace(/,/g, '').replace('−', '-'));
    if (!isFinite(target)) return;
    const decimals = (numStr.split('.')[1] || '').length;
    const indian = /\d,\d\d,\d{3}/.test(numStr) || pre.includes('₹');
    const grouped = numStr.includes(',');
    el.dataset.cmFinal = raw;
    const fmt = v => {
      let s = Math.abs(v) >= 1000 && grouped ? v.toLocaleString(indian ? 'en-IN' : 'en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : v.toFixed(decimals);
      if (numStr.startsWith('−')) s = s.replace('-', '−');
      return pre + s + post;
    };
    if (reduced()) { el.textContent = raw; return; }
    const from = opts.from ?? 0, dur = opts.duration ?? 1400 + Math.min(String(Math.round(Math.abs(target))).length * 90, 600);
    const t0 = performance.now();
    el.style.fontVariantNumeric = 'tabular-nums';
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = fmt(from + (target - from) * ease.outExpo(p));
      if (p < 1) raf(tick); else el.textContent = raw;
    })(t0);
  }
  function countUps(scope) {
    const sel = '[class*="text-metric"], [class*="text-headline-sm"], [class*="text-headline-md"], #metric-subtotal, [data-count]';
    $$(sel, scope).forEach(el => {
      if (el.children.length) {
        // count the first text-only child span instead
        const leaf = $$('span, strong, b', el).find(c => !c.children.length && /\d/.test(c.textContent) && c.textContent.trim().length < 18);
        if (leaf && !leaf.dataset.cmFinal) { watch(leaf, () => countUp(leaf)); }
        return;
      }
      const t = el.textContent.trim();
      if (!/\d/.test(t) || t.length > 18 || /\d{1,2}:\d\d/.test(t) || /^(W|Q|v)\d/.test(t)) return;
      watch(el, () => countUp(el));
    });
  }

  /* ---------- 3. SVG choreography: draw strokes, sweep areas, pop dots, grow bars ---------- */
  function svgMotion(scope) {
    $$('svg', scope).forEach((svg, si) => {
      if (svg.closest('#splash') || svg.closest('button') || svg.getBoundingClientRect().width < 60) return;
      let k = 0;
      $$('path, line, polyline', svg).forEach(p => {
        const stroke = p.getAttribute('stroke') || getComputedStyle(p).stroke;
        const fill = p.getAttribute('fill');
        const hasStroke = stroke && stroke !== 'none';
        const dashed = p.getAttribute('stroke-dasharray');
        if (fill && fill.startsWith('url(')) { p.classList.add('m-area'); p.style.setProperty('--d', 300 + k * 80 + 'ms'); watch(p); return; }
        if (!hasStroke) return;
        if (dashed || (fill && fill !== 'none' && fill !== 'transparent')) { p.classList.add('m-fade'); p.style.setProperty('--d', 200 + k * 40 + 'ms'); watch(p); return; }
        let len = 0;
        try { len = p.getTotalLength ? p.getTotalLength() : 0; } catch (e) {}
        if (!len) return;
        p.style.setProperty('--len', Math.ceil(len) + 1);
        p.style.setProperty('--dur', Math.min(0.7 + len / 600, 2.2) + 's');
        p.style.setProperty('--d', Math.min(k++ * 45, 900) + 'ms');
        p.classList.add('m-draw');
        watch(p);
      });
      // Donut segments sweep around
      $$('circle[stroke-dasharray]', svg).forEach((c, i) => {
        const [a, b] = c.getAttribute('stroke-dasharray').split(/[ ,]+/).map(Number);
        if (!(a && b) || +c.getAttribute('stroke-width') < 8) return;
        c.style.strokeDasharray = `0 ${a + b}`;
        watch(svg, () => c.animate([{ strokeDasharray: `0 ${a + b}` }, { strokeDasharray: `${a} ${b}` }], { duration: 900, delay: 150 + i * 160, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }).finished.then(() => (c.style.strokeDasharray = '')));
        c.addEventListener('mouseenter', () => c.animate([{ strokeWidth: c.getAttribute('stroke-width') }, { strokeWidth: +c.getAttribute('stroke-width') + 6 }], { duration: 300, fill: 'forwards', easing: 'cubic-bezier(.34,1.56,.64,1)' }));
        c.addEventListener('mouseleave', () => c.animate([{ strokeWidth: +c.getAttribute('stroke-width') + 6 }, { strokeWidth: c.getAttribute('stroke-width') }], { duration: 300, fill: 'forwards' }));
      });
      // Small dots
      $$('circle:not([stroke-dasharray])', svg).forEach((c, i) => {
        const r = +c.getAttribute('r');
        if (!r || r > 14 || c.closest('pattern')) return;
        c.classList.add('m-dot'); c.style.setProperty('--d', 500 + i * 60 + 'ms'); watch(c);
      });
      // Vertical bars
      $$('rect', svg).forEach((r, i) => {
        const w = +r.getAttribute('width'), h = +r.getAttribute('height');
        if (!w || !h || w > 60 || h < 8 || r.closest('pattern')) return;
        r.classList.add('m-grow-y'); r.style.setProperty('--d', 150 + i * 90 + 'ms'); watch(r);
      });
      $$('text', svg).forEach((t, i) => { t.classList.add('m-fade'); t.style.setProperty('--d', 300 + Math.min(i * 25, 700) + 'ms'); watch(t); });
    });
  }

  /* ---------- 4. Progress bars (inline width %) grow from zero ---------- */
  function bars(scope) {
    $$('[style*="width"]', scope).forEach((el, i) => {
      const w = el.style.width;
      if (!w.endsWith('%') || el.offsetHeight > 24 || el.closest('svg')) return;
      el.classList.add('m-bar');
      el.style.width = '0%';
      el.style.setProperty('--d', 1.4 + i * .15 + 's');
      watch(el.parentElement || el, () => setTimeout(() => { el.style.transition = 'width 1.3s cubic-bezier(.16,1,.3,1)'; el.style.width = w; }, 120 + i * 70));
    });
  }

  /* ---------- 5. Cards: cursor spotlight + 3D tilt with depth ---------- */
  function cards(list) {
    list.forEach(card => {
      card.classList.add('m-card');
      const w = card.offsetWidth;
      const tilt = w < 460 && card.offsetHeight < 420;
      if (tilt) card.classList.add('m-tilt');
      let frame;
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
        if (!tilt || reduced()) return;
        cancelAnimationFrame(frame);
        frame = raf(() => {
          const rx = ((y / r.height) - .5) * -7, ry = ((x / r.width) - .5) * 9;
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px) scale(1.015)`;
        });
      });
      card.addEventListener('pointerleave', () => { cancelAnimationFrame(frame); card.style.transform = ''; });
    });
  }

  /* ---------- 6. Buttons: ripple, magnetic pull, shine on primary CTAs ---------- */
  function buttons(scope) {
    $$('button, a.nav-link', scope).forEach(b => {
      if (b.dataset.mBtn) return;
      b.dataset.mBtn = 1;
      b.classList.add('m-btn');
      if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
      b.addEventListener('pointerdown', e => {
        const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
        const rip = document.createElement('span');
        rip.className = 'm-ripple';
        rip.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
        b.appendChild(rip);
        setTimeout(() => rip.remove(), 700);
      });
      const primary = /\bbg-primary\b|bg-primary-container/.test(b.className) && b.offsetWidth > 60 && !b.closest('nav');
      if (primary) {
        b.classList.add('m-shine');
        b.addEventListener('pointermove', e => {
          if (reduced()) return;
          const r = b.getBoundingClientRect();
          const dx = (e.clientX - r.left - r.width / 2) / r.width, dy = (e.clientY - r.top - r.height / 2) / r.height;
          b.style.transform = `translate(${dx * 8}px, ${dy * 6}px)`;
        });
        b.addEventListener('pointerleave', () => (b.style.transform = ''));
      }
    });
  }

  /* ---------- 7. Decrypt headline (letters resolve from glyph noise) ---------- */
  function scramble(el, delay = 0) {
    if (!el || reduced()) return;
    const final = el.textContent;
    if (final.length > 70 || el.children.length) return;
    const glyphs = '01₹%#<>/*+=ABCDEFXYZ';
    el.classList.add('m-scramble');
    const start = performance.now() + delay;
    const span = 26;
    (function tick(now) {
      const t = now - start;
      if (t < 0) return raf(tick);
      let out = '';
      let done = 0;
      for (let i = 0; i < final.length; i++) {
        const reveal = i * span * 0.55 + 220;
        if (t >= reveal || final[i] === ' ') { out += final[i]; done++; }
        else out += `<span class="sc">${glyphs[(Math.random() * glyphs.length) | 0]}</span>`;
      }
      el.innerHTML = out;
      if (done < final.length) raf(tick); else { el.textContent = final; el.classList.remove('m-scramble'); }
    })(performance.now());
  }

  /* ---------- 8. Odometer: rolling digit columns ---------- */
  function odometer(el, value, prefix = '₹') {
    const str = prefix + Math.round(value).toLocaleString('en-IN');
    if (reduced()) { el.textContent = str; return; }
    const old = el.querySelector('.odo');
    const wrap = document.createElement('span');
    wrap.className = 'odo';
    [...str].forEach((ch, i) => {
      if (!/\d/.test(ch)) { const s = document.createElement('span'); s.textContent = ch; wrap.appendChild(s); return; }
      const col = document.createElement('span');
      col.className = 'odo-col';
      for (let d = 0; d <= 9; d++) { const s = document.createElement('span'); s.textContent = d; col.appendChild(s); }
      col.style.transform = 'translateY(0)';
      col.style.transitionDelay = i * 45 + 'ms';
      wrap.appendChild(col);
      raf(() => raf(() => (col.style.transform = `translateY(-${+ch * 1.1}em)`)));
    });
    if (old) old.remove();
    el.textContent = '';
    el.appendChild(wrap);
    el.classList.remove('lc-bump'); void el.offsetWidth; el.classList.add('lc-bump');
  }

  /* ---------- 9. Fly-to arc (bezier) between two elements ---------- */
  function flyTo(src, dest, opts = {}) {
    return new Promise(res => {
      if (!src || !dest || reduced()) return res();
      const a = src.getBoundingClientRect(), b = dest.getBoundingClientRect();
      const clone = src.cloneNode(true);
      clone.className += ' fly-clone';
      clone.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px;margin:0`;
      document.body.appendChild(clone);
      const ex = b.left + b.width / 2 - (a.left + a.width / 2), ey = b.top + Math.min(b.height, 80) / 2 - (a.top + a.height / 2);
      const cx = ex * .35, cy = Math.min(ey, 0) - 160;
      const frames = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24, u = 1 - t;
        const x = 2 * u * t * cx + t * t * ex, y = 2 * u * t * cy + t * t * ey;
        frames.push({ transform: `translate(${x}px, ${y}px) scale(${1 - t * .55}) rotate(${t * (opts.spin ?? -10)}deg)`, opacity: t > .9 ? (1 - t) * 10 : 1 });
      }
      clone.animate(frames, { duration: opts.duration || 850, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' }).finished.then(() => { clone.remove(); res(); });
    });
  }

  /* ---------- 10. Grocery confetti burst ---------- */
  const GLYPHS = ['nutrition', 'egg', 'bakery_dining', 'local_cafe', 'icecream', 'shopping_basket', 'eco', 'redeem', 'star', 'local_pizza'];
  const COLORS = ['#0f766e', '#14b8a6', '#f59e0b', '#fbbf24', '#6366f1', '#ec4899', '#22c55e'];
  function burst(x, y, n = 28) {
    if (reduced()) return;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'confetti';
      s.textContent = GLYPHS[i % GLYPHS.length];
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.color = COLORS[i % COLORS.length];
      s.style.fontSize = 14 + Math.random() * 14 + 'px';
      document.body.appendChild(s);
      const ang = Math.random() * Math.PI * 2, vel = 120 + Math.random() * 220;
      const dx = Math.cos(ang) * vel, dy = Math.sin(ang) * vel - 160;
      s.animate([
        { transform: 'translate(-50%,-50%) scale(.2) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx * .6}px), calc(-50% + ${dy * .6}px)) scale(1.1) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: .45 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 260}px)) scale(.8) rotate(${Math.random() * 720}deg)`, opacity: 0 }
      ], { duration: 1300 + Math.random() * 700, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' }).finished.then(() => s.remove());
    }
  }

  /* ---------- 11. Synapse particles that travel along SVG edges ---------- */
  function synapses(svg, paths, opts = {}) {
    if (reduced()) return;
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'synapse');
    svg.appendChild(g);
    paths.forEach((p, i) => {
      let d = p.getAttribute('d');
      if (!d && p.tagName === 'line') d = `M${p.getAttribute('x1')} ${p.getAttribute('y1')} L${p.getAttribute('x2')} ${p.getAttribute('y2')}`;
      if (!d) return;
      const weight = +(p.getAttribute('stroke-width') || 2);
      const count = opts.count ? opts.count(p) : 1;
      for (let c = 0; c < count; c++) {
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('r', opts.r ? opts.r(p) : Math.max(2, Math.min(weight * .7, 4.5)));
        dot.setAttribute('fill', opts.color ? opts.color(p) : '#f59e0b');
        dot.setAttribute('opacity', '0');
        const am = document.createElementNS(NS, 'animateMotion');
        const dur = opts.dur ? opts.dur(p) : 2.4 + Math.random() * 2;
        am.setAttribute('dur', dur + 's');
        am.setAttribute('repeatCount', 'indefinite');
        am.setAttribute('begin', (c * dur / count + Math.random() * 1.5).toFixed(2) + 's');
        am.setAttribute('path', d);
        if (opts.reverse && opts.reverse(p)) { am.setAttribute('keyPoints', '1;0'); am.setAttribute('keyTimes', '0;1'); am.setAttribute('calcMode', 'linear'); }
        const an = document.createElementNS(NS, 'animate');
        an.setAttribute('attributeName', 'opacity'); an.setAttribute('values', '0;1;1;0'); an.setAttribute('keyTimes', '0;.15;.85;1');
        an.setAttribute('dur', dur + 's'); an.setAttribute('repeatCount', 'indefinite'); an.setAttribute('begin', am.getAttribute('begin'));
        dot.appendChild(am); dot.appendChild(an); g.appendChild(dot);
      }
    });
    return g;
  }

  /* ---------- 12. Monte-Carlo rain over a container ---------- */
  function monteCarlo(container, n = 140) {
    return new Promise(res => {
      if (reduced()) return res();
      const r = container.getBoundingClientRect();
      const layer = document.createElement('div');
      layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5';
      if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
      container.appendChild(layer);
      let pending = n;
      for (let i = 0; i < n; i++) {
        const d = document.createElement('i');
        d.className = 'mc-dot';
        // land on a bell curve centred at the sweet spot
        const g = (Math.random() + Math.random() + Math.random()) / 3;
        const x = g * r.width, endY = r.height * (.2 + Math.abs(g - .5) * 1.4) + Math.random() * 20;
        d.style.left = x + 'px'; d.style.top = '0px';
        d.style.background = Math.abs(g - .45) < .08 ? '#f59e0b' : '#0f766e';
        layer.appendChild(d);
        d.animate([{ transform: `translateY(-20px)`, opacity: 0 }, { transform: `translateY(${endY}px)`, opacity: 1, offset: .8 }, { transform: `translateY(${endY}px) scale(.3)`, opacity: 0 }],
          { duration: 900 + Math.random() * 500, delay: Math.random() * 500, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' })
          .finished.then(() => { if (--pending === 0) { layer.remove(); res(); } });
      }
    });
  }

  /* ---------- 13. Toasts ---------- */
  function toast(msg, icon = 'check_circle', ms = 3200) {
    const host = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast';
    t.style.setProperty('--t', ms + 'ms');
    t.innerHTML = `<span class="material-symbols-outlined">${icon}</span><span>${msg}</span><i></i>`;
    host.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 420); }, ms);
  }

  /* ---------- 14. FLIP: animate list re-ordering ---------- */
  function flip(container, mutate) {
    const kids = Array.from(container.children);
    const first = new Map(kids.map(k => [k, k.getBoundingClientRect()]));
    mutate();
    if (reduced()) return;
    Array.from(container.children).forEach(k => {
      const f = first.get(k); if (!f) return;
      const l = k.getBoundingClientRect();
      const dy = f.top - l.top, dx = f.left - l.left;
      if (!dx && !dy) return;
      k.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.34,1.3,.64,1)' });
    });
  }

  /* ---------- 15. Chart tooltip singleton ---------- */
  let tipEl;
  function tip(show, x, y, html) {
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'm-tip'; document.body.appendChild(tipEl); }
    if (!show) return tipEl.classList.remove('show');
    tipEl.innerHTML = html; tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px'; tipEl.classList.add('show');
  }

  /* ---------- 16. Living KPI heartbeat ---------- */
  function heartbeat(el, { min, max, step, fmt }) {
    let v = parseFloat(el.dataset.cmFinal ? el.dataset.cmFinal.replace(/[^\d.\-]/g, '') : el.textContent.replace(/[^\d.\-]/g, ''));
    const id = setInterval(() => {
      if (!document.body.contains(el)) return clearInterval(id);
      if (reduced() || document.hidden) return;
      const delta = (Math.random() - .42) * step;
      const nv = Math.max(min, Math.min(max, v + delta));
      const up = nv >= v; v = nv;
      el.textContent = fmt(v);
      el.classList.remove('m-flash-up', 'm-flash-down'); void el.offsetWidth;
      el.classList.add(up ? 'm-flash-up' : 'm-flash-down');
    }, 4200 + Math.random() * 2500);
    return id;
  }

  /* ---------- 17. Image fallback (remote images may fail to load) ---------- */
  function images(scope) {
    $$('img', scope).forEach(img => {
      img.loading = 'lazy';
      img.style.transition = 'opacity .6s ease, transform .6s cubic-bezier(.16,1,.3,1)';
      if (!img.complete) { img.style.opacity = 0; img.style.transform = 'scale(1.08)'; }
      img.addEventListener('load', () => { img.style.opacity = 1; img.style.transform = ''; });
      img.addEventListener('error', () => {
        const f = document.createElement('div');
        f.className = 'img-fallback';
        f.innerHTML = '<span class="material-symbols-outlined">grocery</span>';
        img.replaceWith(f);
      });
    });
  }

  /* ---------- 18. Table rows & pill badges ---------- */
  function rows(scope) {
    $$('tbody tr', scope).forEach((tr, i) => { tr.classList.add('m-row'); tr.animate([{ opacity: 0, transform: 'translateX(-14px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 500 + i * 80, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }); });
    $$('span[class*="rounded-full"][class*="px-"]', scope).slice(0, 80).forEach((b, i) => { if (b.textContent.trim().length < 30) { b.classList.add('m-badge'); b.style.setProperty('--d', 400 + (i % 12) * 40 + 'ms'); } });
  }

  /* ---------- Orchestrate a freshly mounted view ---------- */
  function enhance(scope) {
    const list = reveal(scope);
    cards(list);
    countUps(scope);
    svgMotion(scope);
    bars(scope);
    buttons(scope);
    rows(scope);
    images(scope);
    const h = $('h1', scope) || $('[class*="text-headline-lg"]', scope);
    scramble(h, 120);
  }

  CM.motion = { enhance, reveal, countUp, countUps, svgMotion, bars, cards, buttons, scramble, odometer, flyTo, burst, synapses, monteCarlo, toast, flip, tip, heartbeat, watch, reduced, $, $$ };
  window.showToast = msg => toast(msg, 'bolt');
})();
