/* ==========================================================================
   CartMind page controllers
   Each controller receives the freshly-mounted view element and the motion
   engine, wires interactions + signature animations, and may return a
   cleanup function that runs when the user navigates away.
   ========================================================================== */
(function () {
  'use strict';
  const CM = (window.CM = window.CM || {});
  const pages = (CM.pages = {});
  const NS = 'http://www.w3.org/2000/svg';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const byText = (scope, sel, re) => Array.from(scope.querySelectorAll(sel)).filter(el => re.test(el.textContent));
  const mark = el => (el && (el.dataset.h = 1), el);
  const centre = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const svgPoint = (svg, x, y) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const tween = (dur, fn, easing = t => 1 - Math.pow(1 - t, 3)) => new Promise(res => { const t0 = performance.now(); (function f(now) { const p = Math.min((now - t0) / dur, 1); fn(easing(p)); p < 1 ? requestAnimationFrame(f) : res(); })(t0); });

  /* =====================================================================
     OVERVIEW
     ===================================================================== */
  pages['overview'] = (v, M) => {
    const timers = [];
    // Interactive crosshair on the AOV chart
    const chart = Array.from(v.querySelectorAll('svg')).find(s => s.getAttribute('viewBox') === '0 0 760 220');
    if (chart) {
      const pts = d => d.match(/[ML]\s*\d+\s+\d+/g).map(s => s.slice(1).trim().split(/\s+/).map(Number));
      const paths = chart.querySelectorAll('path');
      const base = pts(paths[0].getAttribute('d')), ai = pts(paths[2].getAttribute('d'));
      const val = y => Math.round(1800 - (y - 20) * (150 / 45));
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('y1', 15); line.setAttribute('y2', 195); line.setAttribute('stroke', '#0f766e'); line.setAttribute('stroke-dasharray', '3 3'); line.setAttribute('opacity', 0);
      line.style.transition = 'opacity .2s, x1 .25s cubic-bezier(.16,1,.3,1), x2 .25s cubic-bezier(.16,1,.3,1)';
      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('r', 7); dot.setAttribute('fill', '#f59e0b'); dot.setAttribute('stroke', '#fff'); dot.setAttribute('stroke-width', 3); dot.setAttribute('opacity', 0);
      dot.style.transition = 'cx .25s cubic-bezier(.16,1,.3,1), cy .25s cubic-bezier(.16,1,.3,1), opacity .2s';
      chart.append(line, dot);
      chart.addEventListener('mousemove', e => {
        const p = svgPoint(chart, e.clientX, e.clientY);
        let i = Math.round((p.x - 65) / 60); i = Math.max(0, Math.min(11, i));
        const [x, y] = ai[i];
        line.setAttribute('x1', x); line.setAttribute('x2', x); line.setAttribute('opacity', .8);
        dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('opacity', 1);
        const b = val(base[i][1]), a = val(y);
        M.tip(true, e.clientX, e.clientY, `W${i + 1} · ₹${a.toLocaleString('en-IN')} <small>Baseline ₹${b.toLocaleString('en-IN')} · lift +${(((a - b) / b) * 100).toFixed(1)}%</small>`);
      });
      chart.addEventListener('mouseleave', () => { line.setAttribute('opacity', 0); dot.setAttribute('opacity', 0); M.tip(false); });
      // Pulse ring on the latest week
      const ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('cx', 725); ring.setAttribute('cy', 24); ring.setAttribute('r', 6); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', '#0f766e'); ring.setAttribute('stroke-width', 2); ring.classList.add('m-pulse-ring');
      chart.appendChild(ring);
    }
    // Donut legend ↔ segment highlighting
    const donut = Array.from(v.querySelectorAll('svg')).find(s => s.getAttribute('viewBox') === '0 0 160 160');
    if (donut) {
      const segs = donut.querySelectorAll('circle');
      const legend = byText(v, 'div', /^(Weekly Stock-up|Quick Top-up|Healthy Breakfast|Party Night|Baby Care)/).filter(d => d.children.length >= 2 && d.textContent.includes('%'));
      legend.slice(0, 5).forEach((row, i) => {
        row.style.transition = 'transform .3s cubic-bezier(.34,1.56,.64,1), opacity .3s';
        row.addEventListener('mouseenter', () => { segs.forEach((s, k) => (s.style.opacity = k === i ? 1 : .25)); row.style.transform = 'translateX(6px)'; });
        row.addEventListener('mouseleave', () => { segs.forEach(s => (s.style.opacity = 1)); row.style.transform = ''; });
      });
      donut.style.transition = 'transform 1.2s cubic-bezier(.16,1,.3,1)';
      M.watch(donut, () => donut.animate([{ transform: 'rotate(-180deg) scale(.7)' }, { transform: 'rotate(-90deg) scale(1)' }], { duration: 1200, easing: 'cubic-bezier(.16,1,.3,1)' }));
    }
    // Living KPI: Average order value breathes with simulated live traffic
    const aov = byText(v, '[class*="text-metric"]', /₹1,485/)[0];
    const aovLeaf = aov && (Array.from(aov.querySelectorAll('span')).find(s => /₹1,485/.test(s.textContent) && !s.children.length) || aov);
    if (aovLeaf) setTimeout(() => timers.push(M.heartbeat(aovLeaf, { min: 1440, max: 1530, step: 18, fmt: x => '₹' + Math.round(x).toLocaleString('en-IN') })), 2600);
    // AI insights card gets the animated conic border
    const ai = byText(v, 'span, h3, h2', /^AI Insights$/)[0];
    if (ai) ai.closest('.m-reveal, [class*="rounded-xl"]')?.classList.add('ai-border');
    // Actions
    byText(v, 'button', /Deploy All Prescriptions/).forEach(b => mark(b).addEventListener('click', () => { M.burst(...centre(b), 40); M.toast('5 prescriptions deployed to WhatsApp, Push & Email', 'rocket_launch'); }));
    byText(v, 'button', /Simulate Campaign/).forEach(b => mark(b).addEventListener('click', () => { M.toast('Opening Bundle Simulator…', 'science'); setTimeout(() => (location.hash = '#/bundle-simulator'), 500); }));
    byText(v, 'button', /Review Active Rules/).forEach(b => mark(b).addEventListener('click', () => (location.hash = '#/basket-explorer')));
    return () => timers.forEach(clearInterval);
  };

  /* =====================================================================
     CUSTOMER 360
     ===================================================================== */
  pages['customer-360'] = (v, M) => {
    const grid = v.querySelector('.grid-cols-7');
    if (grid) {
      grid.style.position = 'relative';
      const cells = Array.from(grid.children);
      const pop = () => cells.forEach((c, i) => { c.classList.remove('is-in'); c.classList.add('m-cell'); c.style.setProperty('--d', i * 55 + 'ms'); requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('is-in'))); });
      M.watch(grid, pop);
      // chips inside the calendar get a tiny "drop" on hover
      cells.forEach(c => c.addEventListener('mouseenter', () => c.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' }, { transform: 'translateY(0)' }], { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)' })));
      byText(v, 'button', /Re-estimate/).forEach(b => mark(b).addEventListener('click', () => {
        b.querySelector('.material-symbols-outlined')?.classList.remove('spin-once'); void b.offsetWidth; b.querySelector('.material-symbols-outlined')?.classList.add('spin-once');
        const sw = document.createElement('div'); sw.className = 'rc-sweep'; grid.appendChild(sw); setTimeout(() => sw.remove(), 1500);
        setTimeout(pop, 250);
        M.toast('Reorder clock re-estimated · confidence 94%', 'timelapse');
      }));
    }
    // "+" add buttons fly the product into the replenishment CTA
    const target = byText(v, 'button', /Auto-Replenishment/)[0];
    v.querySelectorAll('button').forEach(b => {
      if (b.textContent.trim() !== 'add') return;
      mark(b).addEventListener('click', async () => {
        const row = b.closest('[class*="rounded"]') || b.parentElement;
        b.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span>';
        b.classList.add('bg-primary', 'text-on-primary');
        await M.flyTo(row, target || b, { duration: 800 });
        if (target) target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'cubic-bezier(.34,1.56,.64,1)' });
        M.toast('Added to auto-replenishment bundle', 'add_shopping_cart');
      });
    });
    if (target) mark(target).addEventListener('click', () => { M.burst(...centre(target), 30); M.toast('Auto-replenishment bundle created for Priya S.', 'autorenew'); });
    byText(v, 'button', /Trigger Personalized Push/).forEach(b => mark(b).addEventListener('click', () => { M.burst(...centre(b), 24); M.toast('Push sent: “Milk & eggs run out Thursday — reorder in 1 tap”', 'notifications_active'); }));
  };

  /* =====================================================================
     LIVE CART — streaming basket simulation
     ===================================================================== */
  pages['live-cart'] = (v, M) => {
    let total = 1010, count = 4, speed = 1, timer = null;
    const threshold = 1200;
    const totalEl = v.querySelector('#metric-subtotal');
    const countEl = v.querySelector('#cart-item-count');
    const list = v.querySelector('#basket-timeline-list');
    const input = v.querySelector('#product-inject-input');
    const injectBtn = mark(v.querySelector('#inject-trigger-btn'));
    const playBtn = mark(v.querySelector('#sim-btn-play')), pauseBtn = mark(v.querySelector('#sim-btn-pause')), resetBtn = mark(v.querySelector('#sim-btn-reset'));
    const firstBtn = v.querySelector('.inject-prediction-btn');
    const predList = firstBtn && firstBtn.closest('[class*="rounded-xl"]')?.parentElement;
    const expressBar = Array.from(v.querySelectorAll('.m-bar')).find(b => b.parentElement.closest('div')?.parentElement?.textContent.includes('Express'));
    const remainEl = byText(v, 'span', /remaining for Free Express/).filter(s => !s.children.length)[0];
    const pctEl = byText(v, 'span', /% Achieved$/).filter(s => !s.children.length)[0];
    if (totalEl) M.odometer(totalEl, total);

    function updateExpress(prev) {
      const pct = Math.min(total / threshold * 100, 100);
      if (expressBar) { expressBar.style.transition = 'width 1s cubic-bezier(.16,1,.3,1)'; expressBar.style.width = pct + '%'; }
      if (pctEl) pctEl.textContent = pct.toFixed(1) + '% Achieved';
      if (remainEl) remainEl.textContent = total >= threshold ? 'Free Express unlocked 🎉' : `₹${(threshold - total).toLocaleString('en-IN')} remaining for Free Express`;
      if (prev < threshold && total >= threshold) {
        const host = expressBar?.closest('[class*="rounded"]');
        host?.classList.add('threshold-hit');
        if (host) M.burst(...centre(host), 36);
        M.toast('Free Express delivery unlocked — basket crossed ₹1,200', 'local_shipping');
      }
    }
    function append(title, price, imgSrc) {
      const prev = total;
      count += 1; total += price;
      const card = document.createElement('div');
      card.className = 'lc-enter bg-surface-container-lowest rounded-xl shadow-md p-space-md flex items-center justify-between gap-space-sm relative overflow-hidden bg-gradient-to-r from-primary/5 via-surface-container-lowest to-surface-container-lowest lc-glow';
      card.innerHTML = `
        <div class="flex items-center gap-space-sm min-w-0">
          <div class="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-table-cell text-table-cell font-bold shrink-0 shadow-sm">${count}</div>
          <div class="w-12 h-12 rounded-lg bg-surface-container overflow-hidden shrink-0"><div class="img-tile"><span class="material-symbols-outlined">${imgSrc || 'grocery'}</span></div></div>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-2"><span class="font-table-cell text-table-cell text-on-surface font-bold truncate">${title}</span><span class="px-1.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-wider animate-pulse">Just Added</span></div>
            <div class="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm"><span>SKU #AI-${(Math.random() * 900 + 100) | 0}</span><span>•</span><span class="text-primary font-medium">Added just now</span><span>•</span><span class="text-primary font-semibold">Qty 1</span></div>
          </div>
        </div>
        <div class="flex flex-col items-end shrink-0"><span class="font-table-cell text-table-cell text-primary font-bold">₹${price.toLocaleString('en-IN')}</span><span class="font-label-sm text-label-sm text-on-surface-variant">CartMind offer</span></div>`;
      list.querySelectorAll('.lc-glow').forEach(c => c.classList.remove('lc-glow'));
      list.querySelectorAll('.animate-pulse').forEach(p => p.classList.remove('animate-pulse'));
      list.appendChild(card);
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      if (totalEl) M.odometer(totalEl, total);
      if (countEl) { countEl.textContent = count + ' Items'; countEl.classList.remove('lc-bump'); void countEl.offsetWidth; countEl.classList.add('lc-bump'); }
      updateExpress(prev);
    }
    async function inject(btn) {
      if (btn.disabled) return;
      btn.disabled = true;
      const card = btn.closest('[class*="rounded-xl"]');
      const img = card?.querySelector('.img-tile .material-symbols-outlined')?.textContent;
      btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span><span>Added</span>';
      btn.classList.remove('bg-primary'); btn.classList.add('bg-surface-container', 'text-on-surface-variant');
      await M.flyTo(card, list.lastElementChild || list, { duration: 800 });
      append(btn.dataset.name, parseInt(btn.dataset.price || '250', 10), img);
      // collapse the used prediction and let the rest re-rank (FLIP)
      if (card && predList) {
        await card.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(40px) scale(.95)' }], { duration: 350, easing: 'ease-in', fill: 'forwards' }).finished;
        M.flip(predList, () => { card.remove(); rerank(); });
      }
    }
    function rerank() {
      if (!predList) return;
      const cards = Array.from(predList.children).filter(c => c.querySelector('.inject-prediction-btn'));
      cards.forEach(c => {
        const bar = c.querySelector('.m-bar'), lab = byText(c, 'span', /^\d+%$/)[0];
        if (!bar || !lab) return;
        const nv = Math.max(35, Math.min(97, parseInt(lab.textContent) + Math.round((Math.random() - .35) * 14)));
        lab.textContent = nv + '%'; bar.style.width = nv + '%'; c.dataset.score = nv;
      });
      cards.sort((a, b) => b.dataset.score - a.dataset.score).forEach((c, i) => {
        predList.appendChild(c);
        const rank = Array.from(c.querySelectorAll('div')).find(d => /^#\d$/.test(d.textContent.trim()));
        if (rank) rank.textContent = '#' + (i + 1);
      });
    }
    v.querySelectorAll('.inject-prediction-btn').forEach(b => mark(b).addEventListener('click', () => inject(b)));
    const QUEUE = ['Fresh Mozzarella di Bufala', 'Sun-dried Tomatoes in Oil', 'Dark Chocolate 70% 100g', 'Sparkling Water 6-pack'];
    const manual = () => { const val = input.value.trim(); if (!val) { input.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 300 }); return; } append(val, 290); input.value = ''; };
    injectBtn?.addEventListener('click', manual);
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') manual(); });

    const setActive = (on, off) => { on.classList.add('bg-primary', 'text-on-primary'); on.classList.remove('text-on-surface-variant'); off.classList.remove('bg-primary', 'text-on-primary'); off.classList.add('text-on-surface-variant'); };
    function step() {
      const next = Array.from(v.querySelectorAll('.inject-prediction-btn')).find(b => !b.disabled);
      if (next) inject(next);
      else if (QUEUE.length) append(QUEUE.shift(), 180 + ((Math.random() * 300) | 0));
      else { stop(); M.toast('Session complete · basket closed at ₹' + total.toLocaleString('en-IN'), 'shopping_cart_checkout'); }
    }
    function play() { if (timer) return; setActive(playBtn, pauseBtn); step(); timer = setInterval(step, 2800 / speed); M.toast(`Streaming live session at ${speed}x`, 'play_circle', 2000); }
    function stop() { clearInterval(timer); timer = null; setActive(pauseBtn, playBtn); }
    playBtn?.addEventListener('click', play);
    pauseBtn?.addEventListener('click', stop);
    resetBtn?.addEventListener('click', () => { stop(); CM.remount(); M.toast('Basket reset', 'restart_alt', 1800); });
    byText(v, 'button', /^\s*[125]x\s*$/).forEach(b => mark(b).addEventListener('click', () => {
      speed = parseInt(b.textContent);
      b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('bg-surface-container-lowest', x === b));
      b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('shadow-sm', x === b));
      if (timer) { clearInterval(timer); timer = setInterval(step, 2800 / speed); }
    }));
    return () => clearInterval(timer);
  };

  /* =====================================================================
     BASKET EXPLORER — draggable elastic graph with synapse particles
     ===================================================================== */
  pages['basket-explorer'] = (v, M) => {
    const svg = Array.from(v.querySelectorAll('svg')).find(s => s.getAttribute('viewBox') === '0 0 960 760');
    if (!svg) return;
    const parseT = g => (g.getAttribute('transform').match(/translate\(\s*([\d.\-]+)[ ,]+([\d.\-]+)/) || []).slice(1).map(Number);
    const nodes = Array.from(svg.querySelectorAll('g[transform^="translate"]')).filter(g => g.querySelector(':scope > circle') && parseT(g).length === 2);
    const lines = Array.from(svg.querySelectorAll('line'));
    const near = (a, b) => Math.abs(a[0] - b[0]) < 2 && Math.abs(a[1] - b[1]) < 2;
    const model = nodes.map((g, i) => {
      const [x, y] = parseT(g);
      const inner = document.createElementNS(NS, 'g');
      inner.setAttribute('class', 'g-inner');
      while (g.firstChild) inner.appendChild(g.firstChild);
      g.appendChild(inner);
      g.classList.add('g-node');
      const ends = [];
      lines.forEach(l => {
        if (near([+l.getAttribute('x1'), +l.getAttribute('y1')], [x, y])) ends.push([l, 1]);
        if (near([+l.getAttribute('x2'), +l.getAttribute('y2')], [x, y])) ends.push([l, 2]);
      });
      ends.forEach(([l]) => l.classList.add('g-edge'));
      // staged pop-in from the centre outward
      const dist = Math.hypot(x - 480, y - 380);
      inner.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 650, delay: 250 + dist * 1.6, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' });
      return { g, inner, x, y, ox: x, oy: y, ends };
    });
    // Synapse particles along complement edges (speed ∝ lift)
    const complementEdges = lines.filter(l => /#005C55/i.test(l.getAttribute('stroke') || ''));
    let syn = M.synapses(svg, complementEdges, { dur: l => Math.max(1.4, 5 - +l.getAttribute('stroke-width')), color: () => '#f59e0b', reverse: l => +l.getAttribute('x1') !== 480 });
    const place = n => { n.g.setAttribute('transform', `translate(${n.x}, ${n.y})`); n.ends.forEach(([l, k]) => { l.setAttribute('x' + k, n.x); l.setAttribute('y' + k, n.y); }); };
    // Hover: isolate the neighbourhood
    model.forEach(n => {
      n.g.addEventListener('mouseenter', () => {
        if (dragging) return;
        const edges = new Set(n.ends.map(e => e[0]));
        const neighbours = new Set([n]);
        model.forEach(m => m.ends.forEach(([l]) => { if (edges.has(l)) neighbours.add(m); }));
        model.forEach(m => m.g.classList.toggle('dim', !neighbours.has(m)));
        lines.forEach(l => l.classList.toggle('dim', !edges.has(l)));
        const name = n.g.querySelectorAll('text')[n.g.querySelectorAll('text').length > 1 ? 1 : 0]?.textContent || '';
        const r = n.g.getBoundingClientRect();
        M.tip(true, r.left + r.width / 2, r.top, `${name}<small>${n.ends.length} connections · drag me</small>`);
      });
      n.g.addEventListener('mouseleave', () => { model.forEach(m => m.g.classList.remove('dim')); lines.forEach(l => l.classList.remove('dim')); M.tip(false); });
    });
    // Drag with elastic spring-back
    let dragging = null, off = [0, 0];
    svg.addEventListener('pointerdown', e => {
      const g = e.target.closest('.g-node'); if (!g) return;
      dragging = model.find(n => n.g === g); if (!dragging) return;
      const p = svgPoint(svg, e.clientX, e.clientY);
      off = [p.x - dragging.x, p.y - dragging.y];
      g.classList.add('dragging'); svg.setPointerCapture(e.pointerId);
      if (syn) syn.style.opacity = 0;
      M.tip(false);
    });
    svg.addEventListener('pointermove', e => {
      if (!dragging) return;
      const p = svgPoint(svg, e.clientX, e.clientY);
      dragging.x = p.x - off[0]; dragging.y = p.y - off[1]; place(dragging);
    });
    const release = () => {
      if (!dragging) return;
      const n = dragging; dragging = null; n.g.classList.remove('dragging');
      const sx = n.x, sy = n.y;
      // damped spring back to the computed layout position
      tween(1100, t => { n.x = n.ox + (sx - n.ox) * t; n.y = n.oy + (sy - n.oy) * t; place(n); }, t => { const s = 1 - t; return Math.pow(s, 2.2) * Math.cos(t * Math.PI * 3.2); })
        .then(() => { n.x = n.ox; n.y = n.oy; place(n); if (syn) syn.style.opacity = 1; });
    };
    svg.addEventListener('pointerup', release); svg.addEventListener('pointercancel', release);
    // Floating idle motion on nodes
    model.forEach((n, i) => { n.inner.style.setProperty('--fd', -i * .7 + 's'); setTimeout(() => n.inner.classList.add('g-float'), 1800); });
    // Zoom controls
    let zoom = 1;
    svg.style.transition = 'transform .6s cubic-bezier(.34,1.56,.64,1)'; svg.style.transformOrigin = '50% 50%';
    const zbtn = icon => v.querySelectorAll('button').length && Array.from(v.querySelectorAll('button')).find(b => b.textContent.trim() === icon);
    [['add', .15], ['remove', -.15], ['center_focus_strong', 0]].forEach(([ic, d]) => { const b = zbtn(ic); if (b) mark(b).addEventListener('click', () => { zoom = d ? Math.max(.7, Math.min(1.6, zoom + d)) : 1; svg.style.transform = `scale(${zoom})`; }); });
    // Lift / support sliders fade weak edges
    v.querySelectorAll('input[type=range]').forEach((r, idx) => r.addEventListener('input', () => {
      const th = idx === 0 ? +r.value * .45 : +r.value * .7;
      complementEdges.forEach(l => { l.style.transition = 'opacity .4s'; l.style.opacity = +l.getAttribute('stroke-width') >= th ? '' : .08; });
    }));
    // Substitutes toggle
    const subToggle = v.querySelector('input[type=checkbox]');
    subToggle?.addEventListener('change', () => {
      model.forEach(n => { if (/#BA1A1A|#6E7977/i.test(n.g.querySelector('circle')?.getAttribute('stroke') || '')) { n.g.style.transition = 'opacity .45s, transform .45s'; n.g.style.opacity = subToggle.checked ? '' : 0; } });
      M.toast(subToggle.checked ? 'Showing substitutes (cannibalisation risk)' : 'Substitutes hidden — complements only', 'swap_horiz', 2200);
    });
    byText(v, 'button', /Recalculate Affinity/).forEach(b => mark(b).addEventListener('click', async () => {
      b.querySelector('.material-symbols-outlined')?.classList.add('animate-spin');
      model.forEach((n, i) => n.inner.animate([{ transform: 'scale(1)' }, { transform: 'scale(.6)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 900, delay: i * 40, easing: 'cubic-bezier(.34,1.56,.64,1)' }));
      complementEdges.forEach(l => l.animate([{ opacity: .1 }, { opacity: 1 }], { duration: 900 }));
      await sleep(1100);
      b.querySelector('.material-symbols-outlined')?.classList.remove('animate-spin');
      M.toast('Product2Vec affinities recalculated on 3.4M baskets', 'hub');
    }));
    byText(v, 'button', /Create Rule/).forEach(b => mark(b).addEventListener('click', () => { M.burst(...centre(b), 18); b.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span> Rule live'; M.toast('Bundle rule pushed to recommendation API', 'rule'); }));
    return () => M.tip(false);
  };

  /* =====================================================================
     BUNDLE SIMULATOR — live what-if with gliding optimum + Monte-Carlo rain
     ===================================================================== */
  pages['bundle-simulator'] = (v, M) => {
    const slider = v.querySelector('#discount-range'), label = v.querySelector('#discount-val-label');
    const priceEl = v.querySelector('#bundle-preview-price'), savingsEl = v.querySelector('#shopper-savings');
    const runBtn = mark(v.querySelector('#run-sim-btn')), resetBtn = mark(v.querySelector('#reset-btn'));
    const standalone = 243;
    const svgs = Array.from(v.querySelectorAll('svg'));
    const curveSvg = svgs.find(s => /Profit Sweet Spot/.test(s.textContent));
    const barSvg = svgs.find(s => /Avg Basket Value/.test(s.textContent));
    const curve = curveSvg && Array.from(curveSvg.querySelectorAll('path')).find(p => p.getAttribute('stroke') === '#0f766e');
    const pins = curveSvg ? Array.from(curveSvg.querySelectorAll('circle')).filter(c => /#fea619/i.test(c.getAttribute('fill'))) : [];
    const vline = curveSvg && Array.from(curveSvg.querySelectorAll('line')).find(l => /#fea619/i.test(l.getAttribute('stroke') || ''));
    const samples = [];
    if (curve) { const L = curve.getTotalLength(); for (let i = 0; i <= 300; i++) { const p = curve.getPointAtLength(L * i / 300); samples.push([p.x, p.y]); } }
    const yAt = x => { let best = samples[0]; samples.forEach(s => { if (Math.abs(s[0] - x) < Math.abs(best[0] - x)) best = s; }); return best[1]; };
    // bundle bars: [rect, label, base value, value at 15%, baseline rect height, height at 15%, fmt]
    const bars = [];
    if (barSvg) {
      const greens = Array.from(barSvg.querySelectorAll('rect')).filter(r => /#0f766e/i.test(r.getAttribute('fill')));
      const greys = Array.from(barSvg.querySelectorAll('rect')).filter(r => /#dae2fd/i.test(r.getAttribute('fill')));
      const labels = Array.from(barSvg.querySelectorAll('text')).filter(t => /fill-\[#0f766e\]/.test(t.getAttribute('class') || ''));
      const spec = [[1485, 1569.5, x => '₹' + x.toLocaleString('en-IN', { maximumFractionDigits: 1 })], [4.8, 5.4, x => x.toFixed(1) + ' items'], [510, 577, x => '₹' + Math.round(x)]];
      greens.forEach((r, i) => bars.push({ r, t: labels[i], base: spec[i][0], peak: spec[i][1], fmt: spec[i][2], hb: +greys[i].getAttribute('height'), hp: +r.getAttribute('height'), h: +r.getAttribute('height') }));
    }
    const s = d => 1 - Math.pow((d - 15) / 15, 2) * 1.25;
    let animId = 0;
    function update(d, animate = true) {
      d = +d;
      const price = standalone * (100 - d) / 100;
      priceEl && (priceEl.textContent = '₹' + price.toFixed(2));
      savingsEl && (savingsEl.textContent = '₹' + (standalone - price).toFixed(2) + ' / pack');
      if (label) {
        label.textContent = d === 15 ? '15% Optimal' : d > 20 ? d + '% Margin Risk' : d + '% Applied';
        label.className = 'px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ' + (d === 15 ? 'bg-secondary-container text-on-secondary-container' : d > 20 ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-surface');
        label.animate([{ transform: 'scale(.85)' }, { transform: 'scale(1)' }], { duration: 350, easing: 'cubic-bezier(.34,1.56,.64,1)' });
      }
      // glide the optimum pin along the profit curve
      if (samples.length) {
        const x = 40 + d / 30 * 385, y = yAt(x);
        const col = d > 22 ? '#dc2626' : d >= 12 && d <= 18 ? '#f59e0b' : '#64748b';
        const fromX = +pins[0].getAttribute('cx'), fromY = +pins[0].getAttribute('cy');
        const id = ++animId;
        tween(animate ? 450 : 1, t => {
          if (id !== animId) return;
          const cx = fromX + (x - fromX) * t, cy = fromY + (y - fromY) * t;
          pins.forEach(p => { p.setAttribute('cx', cx); p.setAttribute('cy', cy); p.setAttribute('fill', col); });
          if (vline) { vline.setAttribute('x1', cx); vline.setAttribute('x2', cx); vline.setAttribute('y1', cy); vline.setAttribute('stroke', col); }
        }, t => 1 - Math.pow(1 - t, 4));
      }
      const tipTxt = byText(v, 'span', /Discount: \d+%/).filter(x => !x.children.length)[0];
      if (tipTxt) tipTxt.textContent = (d === 15 ? 'Optimal' : 'Selected') + ' Discount: ' + d + '%';
      // morph the bundle bars + labels
      bars.forEach(b => {
        const target = b.hb + (b.hp - b.hb) * s(d), from = b.h;
        const val = b.base + (b.peak - b.base) * s(d);
        tween(animate ? 600 : 1, t => {
          const h = from + (target - from) * t; b.h = h;
          b.r.setAttribute('height', h); b.r.setAttribute('y', 170 - h);
          if (b.t) { b.t.setAttribute('y', 170 - h - 8); b.t.textContent = b.fmt(val); }
        }, t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); });
      });
    }
    slider && mark(slider).addEventListener('input', e => update(e.target.value));
    resetBtn?.addEventListener('click', () => { slider.value = 15; update(15); M.toast('Scenario reset to optimal 15%', 'restart_alt', 1800); });
    runBtn?.addEventListener('click', async () => {
      const html = runBtn.innerHTML;
      runBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span><span>Running 10k Monte-Carlo iterations…</span>';
      runBtn.disabled = true;
      const host = curveSvg?.parentElement;
      await Promise.all([host ? M.monteCarlo(host, 160) : sleep(800), barSvg ? M.monteCarlo(barSvg.parentElement, 80) : null]);
      runBtn.innerHTML = html; runBtn.disabled = false;
      if (curve && curve.classList.contains('m-draw')) { curve.classList.remove('is-in', 'settled'); void curve.getBoundingClientRect(); curve.style.setProperty('--d', '0ms'); requestAnimationFrame(() => curve.classList.add('is-in')); }
      v.querySelectorAll('[data-cm-final]').forEach(el => { if (el.closest('.m-reveal')) M.countUp(el, { duration: 900 }); });
      M.burst(...centre(runBtn), 26);
      M.toast(`Simulation complete · ${slider?.value || 15}% discount → projected AOV uplift +5.7%`, 'insights');
    });
    v.querySelector('#guard-toggle')?.addEventListener('change', e => M.toast(e.target.checked ? 'Cannibalisation guardrail ON' : 'Guardrail OFF — substitutes may be bundled', 'shield', 2200));
    byText(v, 'button', /^\s*Deploy\s*$/).forEach(b => mark(b).addEventListener('click', () => { M.burst(...centre(b), 22); M.toast('Bundle scenario deployed to 3 stores', 'rocket_launch'); }));
    byText(v, 'button', /^\s*Simulate\s*$/).forEach(b => mark(b).addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => runBtn?.click(), 500); }));
    if (slider) setTimeout(() => update(slider.value, false), 50);
  };

  /* =====================================================================
     SEGMENTS — flowing Sankey + heatmap wave
     ===================================================================== */
  pages['segments'] = (v, M) => {
    const sankey = v.querySelector('svg[aria-label*="Sankey"]');
    const flows = Array.from(v.querySelectorAll('[data-flow]'));
    const oldTip = v.querySelector('#sankey-tooltip'); if (oldTip) oldTip.remove();
    if (sankey) {
      flows.forEach(f => f.classList.add('sk-flow'));
      M.synapses(sankey, flows, {
        count: p => Math.max(1, Math.round(+p.getAttribute('stroke-width') / 9)),
        r: p => Math.min(3.5, 1.5 + +p.getAttribute('stroke-width') / 14),
        color: p => (p.id === 'churn-flow-path' ? '#fff' : 'rgba(255,255,255,.9)'),
        dur: p => 3.4 + Math.random() * 1.4,
      });
      flows.forEach(f => {
        f.addEventListener('mouseenter', () => { sankey.classList.add('sk-dim'); f.classList.add('sk-hot'); });
        f.addEventListener('mousemove', e => { const [a, b] = f.dataset.flow.split(':'); M.tip(true, e.clientX, e.clientY, `${a}<small>${b}</small>`); });
        f.addEventListener('mouseleave', () => { sankey.classList.remove('sk-dim'); f.classList.remove('sk-hot'); M.tip(false); });
      });
      const churn = v.querySelector('#churn-flow-path');
      if (churn) churn.animate([{ strokeWidth: 12 }, { strokeWidth: 16 }, { strokeWidth: 12 }], { duration: 1800, iterations: Infinity, easing: 'ease-in-out', delay: 2000 });
    }
    // Heatmap: diagonal wave reveal
    const grid = v.querySelector('.grid-cols-6');
    if (grid) {
      const cells = Array.from(grid.children);
      cells.forEach((c, i) => { c.classList.add('m-cell'); c.style.setProperty('--d', ((i / 6 | 0) + (i % 6)) * 70 + 'ms'); });
      M.watch(grid, () => cells.forEach(c => c.classList.add('is-in')));
    }
    window.inspectChurnCohort = () => {
      const p = v.querySelector('#churn-flow-path');
      if (!p) return;
      p.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { sankey.classList.add('sk-dim'); p.classList.add('sk-hot'); const [x, y] = centre(p); M.tip(true, x, y, 'Loyal → At Risk<small>1,240 shoppers · churn alert</small>'); }, 600);
      setTimeout(() => { sankey.classList.remove('sk-dim'); p.classList.remove('sk-hot'); M.tip(false); }, 3600);
      M.toast('Inspecting 1,240 Loyal → At Risk shoppers', 'troubleshoot');
    };
    v.querySelectorAll('[onclick]').forEach(b => { mark(b); if (/Generate/.test(b.textContent)) b.addEventListener('click', () => M.burst(...centre(b), 20)); });
    return () => M.tip(false);
  };

  /* =====================================================================
     ASK CARTMIND — streaming copilot
     ===================================================================== */
  const ANSWERS = [
    { re: /yogurt|complement/i, title: 'Top complements for Greek Yogurt', text: 'Greek Yogurt baskets attach <b>Organic Honey (lift 3.4×)</b>, <b>Granola (2.9×)</b> and <b>Fresh Berries (2.6×)</b>. Bundling honey + granola at 10% off projects <b>+₹96 AOV</b> on 18,400 weekly baskets.', bars: [['Organic Honey', 92], ['Granola', 81], ['Fresh Berries', 74], ['Chia Seeds', 58]], sql: "SELECT b.product_name, lift\nFROM association_rules r\nJOIN products b ON b.id = r.consequent\nWHERE r.antecedent = 'Greek Yogurt'\n  AND r.relationship = 'complement'\nORDER BY lift DESC LIMIT 4;" },
    { re: /diwali|stock ?out|pantry/i, title: 'Diwali pantry stock-out forecast', text: 'Demand for <b>Ghee, Besan and Dry Fruits</b> peaks <b>9 days before Diwali</b> (+212%). 4 SKUs are projected to stock out in <b>Bengaluru & Pune</b> stores; raising reorder points by 35% avoids an estimated <b>₹18.6L lost GMV</b>.', bars: [['Desi Ghee 1L', 96], ['Besan 1kg', 88], ['Kaju 500g', 79], ['Sugar 5kg', 63]], sql: "SELECT sku, store, forecast_qty, on_hand\nFROM demand_forecast f\nJOIN inventory i USING (sku, store)\nWHERE f.event = 'diwali'\n  AND forecast_qty > on_hand\nORDER BY forecast_qty - on_hand DESC;" },
    { re: /milk|elastic|discount/i, title: 'Discount elasticity — Organic Milk', text: 'Organic Milk is <b>inelastic (−0.42)</b>: a 10% discount lifts units only 4.2%. Instead, CartMind recommends a <b>milk + bread bundle</b>, which lifts basket size <b>+0.6 items</b> without margin loss.', bars: [['0% off', 40], ['5% off', 46], ['10% off', 52], ['Bundle', 84]], sql: "SELECT discount_pct, AVG(units) AS units\nFROM price_experiments\nWHERE sku = 'organic_milk_1l'\nGROUP BY discount_pct ORDER BY 1;" },
    { re: /breakfast|churn|velocity/i, title: 'Breakfast mission churn velocity', text: 'Breakfast-mission shoppers who skip <b>2 consecutive weekly orders</b> churn at <b>3.1×</b> the base rate. 2,980 shoppers are in that window now — a ₹75 oats + milk nudge recovers an estimated <b>31%</b>.', bars: [['Week 1', 22], ['Week 2', 41], ['Week 3', 67], ['Week 4', 88]], sql: "SELECT weeks_since_last, churn_rate\nFROM mission_cohorts\nWHERE mission = 'healthy_breakfast'\nORDER BY weeks_since_last;" },
  ];
  const DEFAULT_ANSWER = { title: 'Basket insight', text: 'Across <b>3.4M orders</b>, the strongest uplift opportunity is the <b>Party Night</b> mission: shoppers adding chips are 2.8× likely to add dips within 3 items. A dips nudge on add-to-cart projects <b>+₹142 AOV</b>.', bars: [['Chips → Dips', 88], ['Pasta → Sauce', 79], ['Bread → Butter', 71], ['Tea → Biscuits', 64]], sql: "SELECT antecedent, consequent, lift, confidence\nFROM association_rules\nWHERE relationship = 'complement'\nORDER BY expected_uplift DESC LIMIT 4;" };

  pages['ask-cartmind'] = (v, M) => {
    const feed = v.querySelector('#chat-feed'), input = v.querySelector('#chat-input');
    const send = mark(v.querySelector('#chat-send')), mic = mark(v.querySelector('#chat-mic'));
    let alive = true;
    const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    // Replay the opening conversation as a live stream
    const first = feed && feed.children[1];
    if (first && !M.reduced()) {
      const para = first.querySelector('p');
      const html = para ? para.innerHTML : '';
      first.style.opacity = 0;
      const think = document.createElement('div');
      think.className = 'flex items-center gap-space-sm msg-in';
      think.innerHTML = '<div class="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary"><span class="material-symbols-outlined text-[18px]">auto_awesome</span></div><div class="px-4 py-3 rounded-xl bg-surface-container-lowest shadow-sm"><span class="ai-thinking"><i></i><i></i><i></i></span></div>';
      feed.insertBefore(think, first);
      setTimeout(async () => {
        if (!alive) return;
        think.remove(); first.style.opacity = ''; first.classList.add('msg-in');
        if (para) await typeHTML(para, html, 6);
        streamSQL(first.querySelector('#sql-code'));
      }, 1300);
    }
    function typeHTML(el, html, speed = 10) {
      return new Promise(res => {
        const tmp = document.createElement('div'); tmp.innerHTML = html;
        const tokens = []; // split into words while keeping tags intact
        tmp.childNodes.forEach(n => { if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(w => w && tokens.push(esc(w))); else tokens.push(n.outerHTML); });
        el.innerHTML = ''; el.classList.add('caret');
        let i = 0, out = '';
        (function tick() {
          if (!alive) return res();
          out += tokens[i++] || '';
          el.innerHTML = out;
          if (i < tokens.length) setTimeout(tick, speed + Math.random() * speed * 2); else { el.classList.remove('caret'); res(); }
        })();
      });
    }
    function streamSQL(code) {
      if (!code) return;
      code = code.querySelector('code') || code;
      const lines = code.innerHTML.split('\n');
      code.innerHTML = lines.map((l, i) => `<span style="display:block;opacity:0;transform:translateX(-8px);transition:all .35s cubic-bezier(.16,1,.3,1) ${i * 70}ms">${l || ' '}</span>`).join('');
      requestAnimationFrame(() => requestAnimationFrame(() => code.querySelectorAll(':scope > span').forEach(s => { s.style.opacity = 1; s.style.transform = 'none'; })));
    }
    async function ask(q) {
      q = q.trim(); if (!q) return;
      input.value = '';
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const user = document.createElement('div');
      user.className = 'flex items-start justify-end gap-space-sm pl-space-xl msg-in';
      user.innerHTML = `<div class="flex flex-col items-end gap-1.5 max-w-xl"><span class="font-label-sm text-label-sm text-on-surface-variant">You • ${now}</span><div class="bg-primary text-on-primary px-space-lg py-space-sm rounded-xl rounded-tr-sm shadow-sm"><p class="font-body-md text-body-md">${esc(q)}</p></div></div><div class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"><span class="material-symbols-outlined text-[18px]">person</span></div>`;
      feed.appendChild(user);
      const a = ANSWERS.find(x => x.re.test(q)) || DEFAULT_ANSWER;
      const bot = document.createElement('div');
      bot.className = 'flex items-start gap-space-sm pr-2 msg-in';
      bot.innerHTML = `<div class="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0"><span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">auto_awesome</span></div>
        <div class="ai-border flex-1 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
          <div class="flex items-center justify-between"><span class="font-table-cell text-table-cell text-on-surface font-semibold">${a.title}</span><span class="font-label-sm text-label-sm text-on-surface-variant">Exec: ${(180 + Math.random() * 240) | 0}ms</span></div>
          <div class="ans flex flex-col gap-2"><div class="ai-shimmer h-3 w-11/12"></div><div class="ai-shimmer h-3 w-9/12"></div><div class="ai-shimmer h-3 w-10/12"></div></div>
          <div class="bars flex flex-col gap-2"></div>
          <div class="rounded-lg bg-[#0f172a] p-space-md font-mono text-[11px] leading-relaxed text-[#e2e8f0] overflow-x-auto"><pre class="whitespace-pre sql"></pre></div>
        </div>`;
      feed.appendChild(bot);
      bot.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(1100);
      if (!alive) return;
      const ans = bot.querySelector('.ans'); ans.className = 'ans font-body-md text-body-md text-on-surface leading-relaxed';
      await typeHTML(ans, a.text, 14);
      const barsEl = bot.querySelector('.bars');
      barsEl.innerHTML = a.bars.map(([n, p]) => `<div class="flex items-center gap-3"><span class="w-32 shrink-0 font-label-md text-label-md text-on-surface-variant">${n}</span><div class="flex-1 h-2.5 rounded-full bg-surface-container overflow-hidden"><div class="m-bar h-full rounded-full bg-gradient-to-r from-primary-container to-primary" style="width:0%;transition:width 1.1s cubic-bezier(.16,1,.3,1)"></div></div><span class="w-10 text-right font-label-md text-label-md text-primary">${p}%</span></div>`).join('');
      requestAnimationFrame(() => requestAnimationFrame(() => barsEl.querySelectorAll('.m-bar').forEach((b, i) => setTimeout(() => (b.style.width = a.bars[i][1] + '%'), i * 120))));
      const sql = bot.querySelector('.sql');
      const kw = /\b(SELECT|FROM|JOIN|WHERE|AND|ORDER BY|GROUP BY|LIMIT|AS|USING|ON|DESC)\b/g;
      sql.innerHTML = esc(a.sql).replace(kw, '<span class="text-[#38bdf8]">$1</span>');
      streamSQL(sql);
    }
    send?.addEventListener('click', () => ask(input.value));
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') ask(input.value); });
    v.querySelectorAll('[data-suggest]').forEach(b => mark(b).addEventListener('click', () => ask(b.textContent.replace(/^\s*\w+\s+/, '').trim())));
    mic?.addEventListener('click', async () => {
      mic.classList.add('mic-live');
      M.toast('Listening…', 'mic', 1600);
      await sleep(1500);
      mic.classList.remove('mic-live');
      const q = 'Top complements for Greek Yogurt';
      for (let i = 1; i <= q.length; i++) { input.value = q.slice(0, i); await sleep(22); }
      ask(q);
    });
    // Copy SQL feedback
    byText(v, 'button', /Copy/).forEach(b => b.addEventListener('click', () => M.toast('SQL copied to clipboard', 'content_copy', 1800)));
    // Email subject variants: animated radio selection
    const varCards = Array.from(v.querySelectorAll('span')).filter(s => /^Var [ABC]$/.test(s.textContent.trim())).map(s => s.closest('[class*="rounded-lg"]'));
    varCards.forEach(card => {
      card.style.cursor = 'pointer'; card.style.transition = 'all .35s cubic-bezier(.34,1.56,.64,1)';
      card.addEventListener('click', () => {
        varCards.forEach(c => {
          const on = c === card;
          c.classList.toggle('border-2', on); c.classList.toggle('border-primary', on); c.classList.toggle('bg-surface-container-low', on); c.classList.toggle('bg-surface-container-lowest', !on);
          const radio = c.querySelector('[class*="w-4 h-4"]');
          if (radio) radio.innerHTML = on ? '<div class="w-2 h-2 rounded-full bg-primary" style="animation:badge-in .4s cubic-bezier(.34,1.56,.64,1)"></div>' : '';
          if (radio) { radio.classList.toggle('border-primary', on); radio.classList.toggle('border-2', on); }
        });
        card.animate([{ transform: 'scale(.97)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'cubic-bezier(.34,1.56,.64,1)' });
      });
    });
    // Phone push notification drops in like an OS banner, on a loop
    const push = byText(v, 'span', /Running low on Diapers/)[0]?.closest('[class*="rounded"]');
    let pushTimer;
    if (push) {
      const drop = () => push.animate([{ transform: 'translateY(-36px) scale(.94)', opacity: 0 }, { transform: 'translateY(4px)', opacity: 1, offset: .6 }, { transform: 'none', opacity: 1 }], { duration: 800, easing: 'cubic-bezier(.34,1.56,.64,1)' });
      M.watch(push, () => setTimeout(drop, 500));
      pushTimer = setInterval(() => !document.hidden && drop(), 9000);
      push.closest('[class*="rounded-xl"]')?.classList.add('ai-border');
    }
    byText(v, 'button', /Approve & Schedule Campaign/).forEach(b => mark(b).addEventListener('click', async () => {
      M.burst(...centre(b), 50);
      b.innerHTML = '<span class="material-symbols-outlined text-[20px]">event_available</span><span>Scheduled · Sat 08:30 AM</span>';
      b.animate([{ transform: 'scale(.94)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 600, easing: 'cubic-bezier(.34,1.56,.64,1)' });
      M.toast('Campaign scheduled for 1,560 shoppers', 'campaign');
    }));
    // A question typed in the ⌘K palette arrives here
    CM.askNow = () => { const q = sessionStorage.getItem('cm-ask'); if (q) { sessionStorage.removeItem('cm-ask'); setTimeout(() => ask(q), 400); } };
    CM.askNow();
    return () => { alive = false; clearInterval(pushTimer); CM.askNow = null; };
  };

  /* =====================================================================
     Every page: give un-wired buttons meaningful feedback
     ===================================================================== */
  pages['*'] = (v, M) => {
    v.querySelectorAll('button').forEach(b => {
      if (b.dataset.h || b.id || b.getAttribute('onclick') || b.closest('[onclick]')) return;
      const text = b.textContent.replace(/\s+/g, ' ').replace(/^(download|tune|campaign|sync|add|remove|open_in_new|content_copy|person_add|rocket_launch|play_arrow|compare_arrows|arrow_forward|auto_awesome|attach_file)\s*/i, '').trim();
      if (!text || text.length > 40) return;
      b.addEventListener('click', () => {
        const icon = /export|download|csv|pdf|json/i.test(text) ? 'download_done' : /sync|crm/i.test(text) ? 'sync' : /segment/i.test(text) ? 'group_add' : 'check_circle';
        M.toast(`${text} — done`, icon, 2200);
      });
    });
  };
})();
