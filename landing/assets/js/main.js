/* Headcount v2 main (LEAD). Reads CONFIG (from config.js) with safe fallbacks, runs countdowns,
   scroll reveals, the sticky mobile CTA, and the section animations for: the math, how it works,
   Growth Ledger chat, and what's in the box. Exposes small helpers on window.HC for hero.js and flows.js. */
(function () {
  'use strict';
  var D = document;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- CONFIG with fallbacks ---------- */
  var CFG = (typeof CONFIG !== 'undefined' && CONFIG) || window.CONFIG || {};
  function num(v) {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') { var n = parseFloat(v.replace(/[^\d.]/g, '')); return isNaN(n) ? NaN : n; }
    return NaN;
  }
  function plan(id) {
    var p = CFG.plans; if (!p) return null;
    if (Array.isArray(p)) {
      for (var i = 0; i < p.length; i++) {
        var k = String(p[i].id || p[i].key || p[i].slug || p[i].name || '').toLowerCase();
        if (k === id) return p[i];
      }
      return null;
    }
    return p[id] || null;
  }
  function first() { for (var i = 0; i < arguments.length; i++) { if (arguments[i] > 0) return arguments[i]; } return NaN; }
  var crew = plan('crew') || {};
  var PRICE = first(num(crew.price), num(crew.now), num(CFG.price)) || 2999;
  var pa = CFG.priceAfter;
  var PRICE_AFTER = first(pa && typeof pa === 'object' ? num(pa.crew) : num(pa), num(crew.priceAfter), num(crew.strike), num(crew.was), num(crew.after)) || 4999;
  var LAUNCH = new Date(CFG.launchEnds || CFG.launch_ends || '2026-11-30T23:59:59+05:30');
  if (isNaN(LAUNCH.getTime())) LAUNCH = new Date('2026-11-30T23:59:59+05:30');
  var G = CFG.guarantee;
  var G_TEXT = (typeof G === 'string' && G) || (G && typeof G === 'object' && (G.text || G.body || G.long || G.description)) || '';
  var G_TITLE = (G && typeof G === 'object' && (G.badge || G.title || G.name)) || '';
  var WAc = CFG.whatsapp, WA = (WAc && typeof WAc === 'object' ? (WAc.display || WAc.number) : WAc) || CFG.whatsappNumber || '';
  var EMAIL = CFG.supportEmail || (CFG.contact && CFG.contact.email) || '';

  function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  var DATE_LABEL = (CFG.launchEnds && CFG.launchEndsLabel) || (function () {
    try { return LAUNCH.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }); }
    catch (e) { return '30 Nov'; }
  })();

  function setAll(sel, val) { D.querySelectorAll(sel).forEach(function (el) { el.textContent = val; }); }
  setAll('[data-price]', inr(PRICE));
  setAll('[data-price-after]', inr(PRICE_AFTER));
  setAll('[data-launch-date]', DATE_LABEL);
  setAll('[data-per-agent]', inr(PRICE / 40));
  if (G_TEXT) setAll('[data-guarantee-text]', G_TEXT);
  if (G_TITLE) setAll('[data-guarantee-title]', G_TITLE);
  if (WA) setAll('[data-whatsapp]', WA);
  if (EMAIL) setAll('[data-email]', EMAIL);
  if (CFG.legal) D.querySelectorAll('[data-legal]').forEach(function (a) { var u = CFG.legal[a.getAttribute('data-legal')]; if (u) a.href = u; });

  /* ---------- icons (16px stroke) ---------- */
  var IC = {
    paid: '<circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.4"/>',
    creative: '<path d="M8 1.8l1.5 4.2 4.2 1.5-4.2 1.5L8 13.2 6.5 9 2.3 7.5 6.5 6z"/>',
    viral: '<rect x="2" y="2.5" width="12" height="11" rx="3"/><path d="M6.6 5.8v4.4L10.2 8z" fill="currentColor"/>',
    social: '<path d="M2.5 4.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7l-3 2.3v-2.3a2 2 0 0 1-1.5-2z"/>',
    search: '<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/>',
    pipeline: '<path d="M2 3h12l-4.5 5.3V13l-3-1.4V8.3z"/>',
    creators: '<path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z"/>',
    lifecycle: '<rect x="2" y="3.5" width="12" height="9" rx="2"/><path d="M2.5 4.5 8 9l5.5-4.5"/>',
    intel: '<path d="M3 13V8.5M8 13V3M13 13V6"/>',
    core: '<ellipse cx="8" cy="4" rx="5" ry="2"/><path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4M3 8c0 1.1 2.2 2 5 2s5-.9 5-2"/>',
    check: '<path d="M3 8.5 6.5 12 13 4.5"/>',
    folder: '<path d="M1.8 4.2c0-.8.6-1.4 1.4-1.4h3l1.4 1.6h5.2c.8 0 1.4.6 1.4 1.4v6.2c0 .8-.6 1.4-1.4 1.4H3.2c-.8 0-1.4-.6-1.4-1.4z"/>',
    file: '<path d="M4 1.8h5.2L12.5 5v8.2c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1V2.8c0-.6.4-1 1-1z"/><path d="M9 1.8V5h3.5"/>'
  };
  function icon(name, cls) {
    return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '>' + (IC[name] || IC.core) + '</svg>';
  }
  D.querySelectorAll('[data-icon]').forEach(function (el) { el.innerHTML = icon(el.getAttribute('data-icon')); });

  /* ---------- visibility-aware timing helpers ---------- */
  var scopes = [];
  function onView(el, cb, opts) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting, e); }); }, opts || { threshold: 0.15 });
    io.observe(el);
    return io;
  }
  function scope(el, threshold) {
    var s = { on: false, waiters: [] };
    scopes.push(s);
    onView(el, function (v) { s.on = v; if (v) flush(s); }, { threshold: threshold == null ? 0.12 : threshold });
    return s;
  }
  function flush(s) { var w = s.waiters.splice(0); w.forEach(function (f) { f(); }); }
  D.addEventListener('visibilitychange', function () { if (!D.hidden) scopes.forEach(flush); });
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function wait(s, ms) {
    return sleep(ms).then(function loop() {
      if (s.on && !D.hidden) return;
      return new Promise(function (r) { s.waiters.push(r); }).then(loop);
    });
  }
  function type(el, text, s, speed) {
    speed = speed || 22;
    if (RM) { el.textContent = text; return Promise.resolve(); }
    el.textContent = '';
    var i = 0;
    function step() {
      if (i >= text.length) return Promise.resolve();
      var n = text.length - i > 40 ? 2 : 1;
      el.textContent += text.slice(i, i + n); i += n;
      return wait(s, speed).then(step);
    }
    return step();
  }
  function countTo(el, to, opts) {
    opts = opts || {};
    var dur = opts.dur || 1400, fmt = opts.fmt || function (v) { return Math.round(v).toLocaleString('en-IN'); };
    if (RM) { el.textContent = fmt(to); return; }
    var from = opts.from || 0, t0 = performance.now();
    function f(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  }

  window.HC = { CFG: CFG, RM: RM, PRICE: PRICE, PRICE_AFTER: PRICE_AFTER, LAUNCH: LAUNCH, inr: inr, icon: icon, onView: onView, scope: scope, wait: wait, sleep: sleep, type: type, countTo: countTo };

  /* ---------- countdowns (to the real CONFIG date only) ---------- */
  var cds = D.querySelectorAll('[data-countdown]');
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tick() {
    var ms = LAUNCH.getTime() - Date.now();
    if (ms <= 0) {
      var ann = D.getElementById('ann');
      if (ann && !ann.classList.contains('ended')) {
        ann.classList.add('ended');
        var t = ann.querySelector('.ann-txt'); if (t) t.textContent = 'Launch pricing has ended.';
      }
      var fin = D.getElementById('final'); if (fin) fin.classList.add('ended');
      return false;
    }
    var s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    cds.forEach(function (el) {
      if (el.getAttribute('data-countdown') === 'compact') el.textContent = d + 'd ' + pad(h) + ':' + pad(m) + ':' + pad(sec);
      else {
        var u = { d: pad(d), h: pad(h), m: pad(m), s: pad(sec) };
        el.querySelectorAll('[data-u]').forEach(function (b) { b.textContent = u[b.getAttribute('data-u')]; });
      }
    });
    return true;
  }
  if (tick()) { var cdT = setInterval(function () { if (!tick()) clearInterval(cdT); }, 1000); }

  /* ---------- scroll reveals ---------- */
  var revs = D.querySelectorAll('.reveal');
  if (RM || !('IntersectionObserver' in window)) revs.forEach(function (el) { el.classList.add('in'); });
  else {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    revs.forEach(function (el) { rio.observe(el); });
  }

  /* ---------- runtime chips: inline the LOGOS team's monochrome SVGs when present ---------- */
  var RT_FILES = { chatgpt: 'chatgpt', claude: 'claude', codex: 'openai-codex', openclaw: 'openclaw', hermes: 'hermes-agent' };
  if (window.fetch) D.querySelectorAll('.rt-chip[data-logo]').forEach(function (chip) {
    var f = RT_FILES[chip.getAttribute('data-logo')]; if (!f) return;
    fetch('assets/logos/' + f + '.svg').then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
      if (t.indexOf('<svg') !== 0 && t.indexOf('<svg') < 0) return;
      var dot = chip.querySelector('i'); if (!dot) return;
      var span = D.createElement('span'); span.className = 'rt-ic'; span.setAttribute('aria-hidden', 'true');
      span.innerHTML = t.slice(t.indexOf('<svg')).replace(/<title>[^<]*<\/title>/, '');
      var svg = span.querySelector('svg'); if (!svg) return;
      svg.removeAttribute('role'); svg.removeAttribute('aria-label'); svg.setAttribute('width', '16'); svg.setAttribute('height', '16');
      dot.replaceWith(span);
    }).catch(function () {});
  });

  /* ---------- sticky mobile CTA: after hero, hidden over pricing and final CTA ---------- */
  (function () {
    var bar = D.getElementById('sticky-cta'); if (!bar) return;
    var heroCta = D.querySelector('.hero-cta'), pricing = D.getElementById('pricing'), fin = D.getElementById('final');
    var st = { past: false, pricing: false, fin: false };
    function upd() {
      var show = st.past && !st.pricing && !st.fin;
      bar.classList.toggle('show', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
      var a = bar.querySelector('a'); if (a) a.tabIndex = show ? 0 : -1;
    }
    onView(heroCta, function (v, e) { st.past = !v && e && e.boundingClientRect.top < 0; upd(); }, { threshold: 0 });
    onView(pricing, function (v) { st.pricing = v; upd(); }, { threshold: 0 });
    onView(fin, function (v) { st.fin = v; upd(); }, { threshold: 0.05 });
  })();

  /* ---------- FAQ: one open at a time ---------- */
  var dets = D.querySelectorAll('.faq-list details');
  dets.forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) dets.forEach(function (o) { if (o !== d) o.open = false; }); });
  });

  /* ---------- 4 the math ---------- */
  (function () {
    var grid = D.getElementById('hire-grid'); if (!grid) return;
    var slips = grid.querySelectorAll('.slip'), numEl = D.getElementById('hire-num'), perEl = D.getElementById('hire-per');
    var period = 'm', played = false;
    function short(v, y) {
      if (y) return (v / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
      return Math.round(v / 1000) + 'k';
    }
    function lowTotal() { var t = 0; slips.forEach(function (s) { t += +s.getAttribute('data-lo'); }); return t * (period === 'y' ? 12 : 1); }
    function render(animate) {
      var y = period === 'y';
      slips.forEach(function (s) {
        var lo = +s.getAttribute('data-lo') * (y ? 12 : 1), hi = +s.getAttribute('data-hi') * (y ? 12 : 1);
        s.querySelector('.amt').textContent = '₹' + short(lo, y) + ' to ' + short(hi, y);
        s.querySelector('.per-u').textContent = y ? 'a year' : 'a month';
      });
      perEl.textContent = y ? 'every year, forever' : 'every month, forever';
      var to = lowTotal();
      if (animate) countTo(numEl, to, { dur: 1600, fmt: inr, from: animate === 'swap' ? (y ? to / 12 : to * 12) : 0 });
      else numEl.textContent = inr(to);
    }
    grid.querySelectorAll('.seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        if (period === b.getAttribute('data-period')) return;
        period = b.getAttribute('data-period');
        grid.querySelectorAll('.seg button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        render('swap');
      });
    });
    onView(grid, function (v) {
      if (v && !played) { played = true; grid.classList.add('in'); numEl.textContent = inr(0); setTimeout(function () { render(true); }, RM ? 0 : 350); }
    }, { threshold: 0.25 });
  })();

  /* ---------- 5 how it works: add Headcount to your AI app ----------
     Download lands, the buyer asks in plain words, the app asks permission, a checklist ticks.
     The static final state lives in the HTML (no-JS and reduced motion keep it). */
  (function () {
    var box = D.getElementById('mini-add'); if (!box) return;
    var out = box.querySelector('.setup'), chips = box.querySelectorAll('.rts span'), appName = box.querySelector('.app-name');
    var s = scope(box);
    var APPS = [['claude', 'Claude', 'Claude'], ['codex', 'Codex', 'Codex'], ['chatgpt', 'ChatGPT', 'the ChatGPT app']];
    var ASK = 'Set up Headcount from my Downloads folder';
    var CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5"/></svg>';
    function el(cls, html) { var d = D.createElement('div'); d.className = cls; if (html) d.innerHTML = html; return d; }
    function put(node) { out.appendChild(node); return node; }
    function setApp(a) {
      chips.forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-rt') === a[0]); });
      appName.textContent = a[1];
    }
    if (RM) return;
    out.innerHTML = '';

    function play(a) {
      var dl, perm, ticks, rows;
      setApp(a);
      out.innerHTML = ''; out.classList.remove('fade');
      dl = put(el('su-dl', '<span class="su-dl-ic">' + icon('file') + '</span><span class="su-dl-t"><b>headcount.zip</b><span class="su-dl-bar"><i></i></span></span><span class="su-dl-s">Downloading</span>'));
      return wait(s, 250)
        .then(function () { dl.classList.add('show'); return wait(s, 350); })
        .then(function () { dl.classList.add('go'); return wait(s, 1200); })
        .then(function () { dl.classList.add('done'); dl.querySelector('.su-dl-s').textContent = '✓ Downloaded'; return wait(s, 900); })
        .then(function () {
          dl.classList.add('out');
          var u = put(el('bm u'));
          return type(u, ASK, s, 24);
        })
        .then(function () { dl.remove(); return wait(s, 450); })
        .then(function () {
          var t = put(el('typing', '<i></i><i></i><i></i>'));
          return wait(s, 850).then(function () { t.remove(); });
        })
        .then(function () {
          perm = put(el('su-perm', '<span>Run the Headcount installer?</span><span class="su-perm-b"><span class="su-btn">Deny</span><span class="su-btn allow">Allow</span></span>'));
          return wait(s, 1300);
        })
        .then(function () { perm.classList.add('press'); return wait(s, 420); })
        .then(function () {
          perm.className = 'su-perm ok';
          perm.innerHTML = CHECK + '<span>You allowed the installer</span>';
          ticks = put(el('su-list', '<div class="su-row"><span class="su-dot"></span>Found 40 agents + Company Brain</div><div class="su-row"><span class="su-dot"></span>Added them to ' + a[2] + '</div><div class="su-row"><span class="su-dot"></span>Growth ledger ready</div>'));
          rows = ticks.querySelectorAll('.su-row');
          var p = wait(s, 250);
          rows.forEach(function (r) {
            p = p.then(function () { r.classList.add('show', 'run'); return wait(s, 750); })
                 .then(function () { r.classList.remove('run'); r.classList.add('ck'); return wait(s, 180); });
          });
          return p;
        })
        .then(function () { return wait(s, 500); })
        .then(function () { put(el('bm a', 'Ready. Want to start with <span class="nowrap"><b>Company Brain</b>?</span>')); return wait(s, 3800); })
        .then(function () { out.classList.add('fade'); return wait(s, 500); });
    }
    var i = 0;
    (function loop() { play(APPS[i]).then(function () { i = (i + 1) % APPS.length; loop(); }); })();
  })();

  /* ---------- 5 how it works: Company Brain interview ---------- */
  (function () {
    var box = D.getElementById('mini-brain'); if (!box) return;
    var out = box.querySelector('.bchat'), s = scope(box);
    var SCRIPT = [
      ['a', 'I read your site. Your bestseller is the <b>Starter Kit at ₹1,499</b>. Right?'],
      ['u', 'Yes, over half our first orders.'],
      ['a', 'Margin after product, shipping and fees?'],
      ['u', 'About 62%.'],
      ['a', 'Then you break even at <b>1.61 ROAS</b>. I suggest <b>2.4</b> as your target. OK?'],
      ['u', 'OK, go.'],
      ['ok', '✓ brain/COMPANY.md written · every agent reads it']
    ];
    function add(m) {
      var d = D.createElement('div'); d.className = 'bm ' + m[0]; d.innerHTML = m[1]; out.appendChild(d);
      while (out.children.length > 6) out.removeChild(out.firstChild);
    }
    SCRIPT.slice(0, 4).forEach(add);
    if (RM) return;
    var k = 4;
    (function loop() {
      var m = SCRIPT[k];
      var p = wait(s, m[0] === 'a' || m[0] === 'ok' ? 700 : 1300);
      if (m[0] === 'a') p = p.then(function () {
        var t = D.createElement('div'); t.className = 'typing'; t.innerHTML = '<i></i><i></i><i></i>'; out.appendChild(t);
        return wait(s, 900).then(function () { t.remove(); });
      });
      p.then(function () { add(m); k = (k + 1) % SCRIPT.length; return wait(s, m[0] === 'ok' ? 2600 : 500); }).then(loop);
    })();
  })();

  /* ---------- 5 how it works: Monday Standup ---------- */
  (function () {
    var box = D.getElementById('mini-stand'); if (!box) return;
    var s = scope(box), mvs = box.querySelectorAll('.mv'), yes = box.querySelectorAll('.yes'), cnt = box.querySelector('.yes-count');
    function setN(b, v) { b.textContent = b.getAttribute('data-s') + Math.round(v) + '%'; }
    mvs.forEach(function (m) { m.classList.add('show'); var b = m.querySelector('b'); setN(b, +b.getAttribute('data-n')); });
    yes.forEach(function (y) { y.classList.add('show'); });
    if (RM) return;
    (function loop() {
      var p = wait(s, 400).then(function () {
        yes.forEach(function (y) { y.classList.remove('ck'); }); cnt.textContent = '2';
        mvs.forEach(function (m, k) {
          var b = m.querySelector('b');
          setTimeout(function () { countTo(b, +b.getAttribute('data-n'), { dur: 900, fmt: function (v) { return b.getAttribute('data-s') + Math.round(v) + '%'; } }); }, k * 260);
        });
        return wait(s, 1600);
      });
      yes.forEach(function (y, k) { p = p.then(function () { return wait(s, 900); }).then(function () { y.classList.add('ck'); cnt.textContent = k ? 'all done' : '1'; }); });
      p.then(function () { return wait(s, 3600); }).then(loop);
    })();
  })();

  /* ---------- 8 Growth Ledger chat ---------- */
  (function () {
    var chat = D.getElementById('ledger-chat'); if (!chat) return;
    var steps = chat.querySelectorAll('[data-step]'), s = scope(chat, 0.05), started = false;
    function show(n) { steps.forEach(function (el) { if (+el.getAttribute('data-step') === n) el.classList.add('show'); }); }
    var tool = chat.querySelector('.tool'), res = tool.querySelector('.res'), typed = chat.querySelector('.typed');
    if (RM) { steps.forEach(function (el) { el.classList.add('show'); }); tool.classList.add('done'); res.textContent = '14 rows'; return; }
    onView(chat, function (v) {
      if (!v || started) return; started = true;
      var text = typed.getAttribute('data-text'); typed.textContent = '';
      show(1);
      type(typed, text, s, 16)
        .then(function () { show(2); return wait(s, 900); })
        .then(function () { tool.classList.add('done'); res.textContent = '14 rows'; return wait(s, 250); })
        .then(function () { show(3); return wait(s, 2200); })
        .then(function () { show(4); return wait(s, 900); })
        .then(function () { show(5); });
    }, { threshold: 0.12 });
  })();

  /* ---------- 9 what's in the box ---------- */
  (function () {
    var tree = D.getElementById('tree'); if (!tree) return;
    var PV = {
      skill: ['SKILL.md', 'the playbook',
        '<span class="c">---</span>\n<span class="k">name:</span> roas-autopilot\n<span class="k">description:</span> Give it a ROAS target,\n  a daily budget, an offer and\n  creatives; it checks tracking,\n  builds Meta sales campaigns, then\n  runs a daily kill/hold/scale loop.\n<span class="c">---</span>\n<span class="h"># ROAS Autopilot</span>\n<span class="k">Outcome:</span> Meta campaigns that hit your\nROAS target, or an honest "not\nreachable at this budget" with what\nwould be.\n\n<span class="h">## Workflow</span>\n<span class="h">### Step 1:</span> Intake the brief\n<span class="h">### Step 2:</span> Feasibility plan\n<span class="c">...</span>'],
      config: ['config.yaml', 'rules you can change',
        '<span class="c"># Safe defaults: nothing launches,\n# spends or changes budget\n# without your yes.</span>\n<span class="k">goal:</span>\n  <span class="k">target_roas:</span> <span class="s">2.5</span>\n  <span class="k">daily_budget:</span> <span class="s">300</span>\n  <span class="k">max_daily_budget:</span> <span class="s">600</span>\n<span class="k">rules:</span>\n  <span class="c"># 2x target cost, zero sales: pause</span>\n  <span class="k">kill_no_purchase_spend_x_cpa:</span> <span class="s">2.0</span>\n<span class="k">approvals:</span>\n  <span class="k">autopilot_band:</span>\n    <span class="k">enabled:</span> <span class="s">false</span>\n    <span class="k">max_single_increase:</span> <span class="s">0.20</span>'],
      rules: ['scripts/rules_engine.py', 'tested, dry run first',
        '<span class="p">$</span> python3 scripts/rules_engine.py plan\n\n<span class="h">Launch plan: REACHABLE</span>\nTarget ROAS 2.50, budget 650 a day\nTarget cost per purchase 27.20\nAbout 167 purchases a week\n\nBand: <span class="k">scale</span>\n- Core: Advantage+ sales, 520 a day\n- Test: manual CBO, 130 a day\n\n<span class="c"># example run, fictional brand</span>'],
      approval: ['templates/launch-approval.md', 'what you approve',
        '<span class="h"># Launch pack: {{brand}}, {{date}}</span>\n\n<span class="k">Ask:</span> Create these objects as PAUSED?\nReply "yes" or tell me what to change.\n<span class="s">Nothing goes live until a second yes.</span>\n\n<span class="h">## Goal and feasibility</span>\n- Target ROAS {{target_roas}}\n- Daily budget {{daily_budget}}\n\n<span class="h">## Tracking health</span>\n{{health_checks_list}}\n<span class="c">...</span>'],
      example: ['examples/example-output.md', 'a full worked run',
        '<span class="h">## Daily decisions (day 22)</span>\nHOLD 8, PAUSE 3, REFRESH 2, SCALE 1.\nApprovals needed: 4.\n\n<span class="k">PAUSE</span> Static, gift box\n  2.7x target cost, zero sales\n<span class="k">PAUSE</span> Video, founder story\n  7d ROAS 0.53, under 60% of target\n<span class="k">SCALE</span> Core campaign <span class="s">+20%</span>\n  3d ROAS 3.03, 7d ROAS 2.81\n<span class="k">REFRESH</span> UGC, morning ritual\n  tired: frequency 3.4, CTR down'],
    };
    var ROWS = [
      [0, 'folder', 'fo', 'roas-autopilot/', ''],
      [1, 'file', 'fm', 'SKILL.md', 'the playbook', 'skill'],
      [1, 'file', 'fm', 'README.md', 'plain-English setup'],
      [1, 'file', 'fm', 'CONNECT.md', 'which keys, where'],
      [1, 'file', 'fy', 'config.yaml', 'every rule and limit', 'config'],
      [1, 'folder', 'fo', 'references/', '5 deep guides'],
      [2, 'file', 'fm', 'kill-hold-scale-rules.md', '', null, 'xm'],
      [2, 'file', 'fm', 'tracking-health-gate.md', '', null, 'xm'],
      [1, 'folder', 'fo', 'scripts/', 'tested Python'],
      [2, 'file', 'fp', 'meta_api.py', 'Meta API', null, 'xm'],
      [2, 'file', 'fp', 'rules_engine.py', 'the rules', 'rules'],
      [2, 'file', 'fp', 'check_setup.py', 'setup check', null, 'xm'],
      [1, 'folder', 'fo', 'templates/', 'approvals + reports'],
      [2, 'file', 'fm', 'launch-approval.md', '', 'approval'],
      [2, 'file', 'fm', 'weekly-report.md', '', null, 'xm'],
      [1, 'folder', 'fo', 'examples/', 'a full worked run'],
      [2, 'file', 'fm', 'example-output.md', '', 'example']
    ];
    tree.innerHTML = ROWS.map(function (r) {
      return '<li class="d' + r[0] + (r[6] ? ' ' + r[6] : '') + '"' + (r[5] ? ' data-pv="' + r[5] + '" tabindex="0" role="button"' : '') + '>' + icon(r[1], r[2]) + '<span>' + r[3] + '</span>' + (r[4] ? '<span class="nt">' + r[4] + '</span>' : '') + '</li>';
    }).join('');
    var lis = tree.querySelectorAll('li'), code = D.getElementById('pv-code'), nm = D.querySelector('.pv-name'), wh = D.querySelector('.pv-what');
    var order = ['skill', 'config', 'rules', 'approval', 'example'], cur = 0, userPicked = 0;
    function pick(key, instant) {
      var p = PV[key]; if (!p) return;
      lis.forEach(function (li) { li.classList.toggle('on', li.getAttribute('data-pv') === key); });
      function swap() { nm.textContent = p[0]; wh.textContent = p[1]; code.innerHTML = p[2]; code.classList.remove('fade'); }
      if (instant || RM) { swap(); return; }
      code.classList.add('fade'); setTimeout(swap, 220);
    }
    pick('skill', true);
    lis.forEach(function (li) {
      var k = li.getAttribute('data-pv'); if (!k) return;
      function go() { userPicked = Date.now(); cur = order.indexOf(k); pick(k); }
      li.addEventListener('click', go);
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    var ide = D.getElementById('ide'), s = scope(ide, 0.2), opened = false;
    if (RM) { lis.forEach(function (li) { li.classList.add('show'); }); }
    onView(ide, function (v) {
      if (!v || opened) return; opened = true;
      var p = Promise.resolve();
      lis.forEach(function (li) { p = p.then(function () { li.classList.add('show'); return wait(s, 70); }); });
      p.then(function cycle() {
        return wait(s, 4200).then(function () {
          if (Date.now() - userPicked > 9000) { cur = (cur + 1) % order.length; pick(order[cur]); }
          return cycle();
        });
      });
    }, { threshold: 0.2 });
    var counts = D.getElementById('counts'), counted = false;
    onView(counts, function (v) {
      if (!v || counted) return; counted = true;
      counts.querySelectorAll('[data-to]').forEach(function (b) {
        var to = +b.getAttribute('data-to'), suf = b.getAttribute('data-suf') || '';
        countTo(b, to, { dur: 1500, fmt: function (x) { return Math.round(x).toLocaleString('en-IN') + suf; } });
      });
    }, { threshold: 0.3 });
  })();
})();
