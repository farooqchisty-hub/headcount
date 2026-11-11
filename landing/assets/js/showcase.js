/* Headcount v2, section 6: agent showcase.
   Renders department tabs, an auto-playing example run inside a ChatGPT-style or Claude-style
   window, and the full 42 card library. Data: assets/data/agents.json (names, departments,
   outcomes, source of truth) and assets/data/showcase.json (runs, example results).
   Vanilla JS, no dependencies. Animations start only in view and respect reduced motion. */
(function () {
  'use strict';

  var SCRIPT = document.currentScript;
  var DATA = SCRIPT && SCRIPT.src ? new URL('../data/', SCRIPT.src).href : 'assets/data/';
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var reduce = mq.matches;
  var CANCEL = { cancelled: true };

  /* ---------- tiny helpers ---------- */
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  var el = function (html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var inr = function (n) { return '₹' + Number(n).toLocaleString('en-IN'); };

  /* ---------- 24px line icon set (stroke icons, currentColor) ---------- */
  var I = {
    /* agents */
    'roas-autopilot': '<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4.5-5"/><circle cx="12" cy="16" r="1.3"/><path d="M4 20h16"/>',
    'google-ads-waste-killer': '<circle cx="6" cy="7" r="2.6"/><circle cx="6" cy="17" r="2.6"/><path d="M8.2 8.6L20 17M8.2 15.4L20 7"/>',
    'ad-account-watchdog': '<path d="M12 3l7 3v5.5c0 4.3-2.9 7.8-7 9.5-4.1-1.7-7-5.2-7-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
    'angle-miner': '<path d="M3 9.5L12 21l9-11.5L17 4H7z"/><path d="M3 9.5h18"/><path d="M12 21L8.5 9.5 10.5 4M12 21l3.5-11.5L13.5 4"/>',
    'static-ad-factory': '<rect x="3" y="6.5" width="14" height="14" rx="2"/><path d="M7 3.5h11.5A2.5 2.5 0 0 1 21 6v11"/><path d="M3 17l4-4 3 3 3-3 4 4"/><circle cx="8.5" cy="10.5" r="1.3"/>',
    'winner-remixer': '<path d="M3 7h3.5l10 10H20M3 17h3.5l3-3M14 10l2.5-3H20"/><path d="M18 5l2 2-2 2M18 15l2 2-2 2"/>',
    'video-ad-studio': '<rect x="3" y="6.5" width="13" height="11" rx="2"/><path d="M16 11l5-3v8l-5-3"/>',
    'product-photoshoot': '<path d="M4 8.5h3.2L9 5.5h6l1.8 3H20V19H4z"/><circle cx="12" cy="13.5" r="3.3"/>',
    'viral-reel-cloner': '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 9.3v5.4l4.3-2.7z"/>',
    'motion-graphics-studio': '<path d="M4 18c4 0 4-12 8-12s4 12 8 12"/><circle cx="4" cy="18" r="1.5"/><circle cx="20" cy="18" r="1.5"/><path d="M12 6h4.5"/><circle cx="18" cy="6" r="1.4"/>',
    'clip-repurposer': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 5v14M15 5v14M3 10h3M3 14h3M18 10h3M18 14h3"/>',
    'trend-jacker': '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    'founder-brand-engine': '<circle cx="11" cy="8" r="3.6"/><path d="M4 20.5c1-4 3.8-6 7-6s6 2 7 6"/><path d="M19 2.5v4M17 4.5h4"/>',
    'engagement-agent': '<path d="M3 5h12v8.5H8.5L5 16.5v-3H3z"/><path d="M15 9h6v8.5h-2v3l-3-3h-5v-2.5"/>',
    'dm-closer': '<path d="M21 3L3 10.5l7.2 2.8L13 21z"/><path d="M10.2 13.3L15.5 8"/>',
    'ai-influencer-farm': '<circle cx="10" cy="8" r="3.6"/><path d="M3 20.5c1-4 3.8-6 7-6 1.5 0 2.9.4 4 1.1"/><path d="M18 12.5l1 2.3 2.3 1-2.3 1L18 19l-1-2.2-2.3-1 2.3-1z"/>',
    'social-autopilot': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15.5l2 2 4-4"/>',
    'reputation-guard': '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    'seo-content-pipeline': '<path d="M13 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h5M13 3l5 5v2.5M13 3v5h5"/><circle cx="16" cy="16" r="3"/><path d="M18.2 18.2L21 21M8 11h3.5M8 14h2"/>',
    'programmatic-seo': '<rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/>',
    'technical-seo-fixer': '<path d="M8 7.5L3.5 12 8 16.5M16 7.5l4.5 4.5-4.5 4.5M13.5 5l-3 14"/>',
    'ai-visibility-tracker': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6.2-6.2"/><circle cx="12" cy="12" r="1.2"/>',
    'geo-citation-closer': '<path d="M5 7h5v5c0 3.3-1.6 5.3-4.5 6M14 7h5v5c0 3.3-1.6 5.3-4.5 6"/>',
    'backlink-builder': '<path d="M10 14a4 4 0 0 0 5.7 0l3.1-3.1a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3.1 3.1a4 4 0 0 0 5.7 5.7l1-1"/>',
    'catalog-optimizer': '<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    'reddit-buying-signals': '<circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>',
    'signal-prospector': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    'enrichment-waterfall': '<path d="M3 5h18M6 10h12M9 15h6M11 20h2"/>',
    'outbound-operator': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7.5l9 6 9-6"/>',
    'ai-sales-closer': '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 11l2 2 4-4"/>',
    'linkedin-ads-agent': '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12.5h18"/>',
    'ugc-creator-finder': '<circle cx="10" cy="8" r="4"/><path d="M3 20.5c.8-3.5 3.5-5.5 7-5.5"/><circle cx="17" cy="17" r="3"/><path d="M19.2 19.2l2.3 2.3"/>',
    'influencer-deal-desk': '<path d="M12 4v16M7.5 20h9M5 7h14"/><path d="M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',
    'affiliate-recruiter': '<circle cx="10" cy="8" r="4"/><path d="M3 20.5c.8-3.5 3.5-5.5 7-5.5s6.2 2 7 5.5"/><path d="M19 7.5v6M16 10.5h6"/>',
    'flow-architect': '<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="15" width="6" height="6" rx="1.5"/><path d="M6 9v3a3 3 0 0 0 3 3h6"/><circle cx="18" cy="6" r="3"/>',
    'campaign-builder': '<path d="M3 10v4h4l8 5V5l-8 5z"/><path d="M18.5 9a4 4 0 0 1 0 6"/>',
    'winback-analyst': '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><path d="M12 8v4l3 2"/>',
    'competitor-watch': '<circle cx="6.5" cy="15.5" r="3.5"/><circle cx="17.5" cy="15.5" r="3.5"/><path d="M10 15.5h4M4.5 12.5L7 5h3l.6 7M19.5 12.5L17 5h-3l-.6 7"/>',
    'monday-standup': '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4M9 10h6M9 14h6M9 18h3"/>',
    'cro-test-runner': '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
    'company-brain': '<path d="M12 5a3 3 0 0 0-5.8 1A3 3 0 0 0 4 11a3 3 0 0 0 2 5.2A3 3 0 0 0 12 18.5z"/><path d="M12 5a3 3 0 0 1 5.8 1A3 3 0 0 1 20 11a3 3 0 0 1-2 5.2 3 3 0 0 1-6 2.3"/><path d="M12 5v15"/>',
    'growth-ledger': '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.5"/><path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5"/>',
    /* ui */
    chev: '<path d="M7 10l5 5 5-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    side: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9 4v16"/>',
    replay: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4.5V8.5h4"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 8l9 6 9-6"/>',
    split: '<path d="M12 3l9 9-9 9-9-9z"/>',
    exit: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>',
    doc: '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    bookmark: '<path d="M6.5 3.5h11v17l-5.5-4-5.5 4z"/>',
    send2: '<path d="M21 3L3 10.5l7.2 2.8L13 21z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3.1-3.1a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3.1 3.1a4 4 0 0 0 5.7 5.7l1-1"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    cart: '<path d="M3 4h2.5l2.2 11h10.6L20.5 8H7"/><circle cx="9.5" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/>',
    up2: '<path d="M7 14l5-5 5 5"/>',
    down2: '<path d="M7 10l5 5 5-5"/>',
    /* generic marks: deliberately not the vendors' logos */
    markC: '<path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18"/>',
    markG: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M5.1 8l13.8 8M5.1 16l13.8-8"/>'
  };
  var svg = function (name, cls) {
    return '<svg class="sc-i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (I[name] || I.bolt) + '</svg>';
  };

  /* ---------- state ---------- */
  var M = { depts: [], agents: [], byId: {}, lib: {}, runs: {}, meta: {} };
  var S = {
    dept: null, agent: null, tok: 0, auto: true, visible: false, hover: false,
    started: false, skin: 'chatgpt', waiters: [], pinned: true, progAt: 0
  };
  var R = {}; /* element refs */

  /* pause aware wait: holds while the window is off screen, the tab is hidden, or (optionally) hovered */
  function wait(ms, tok, holdOnHover) {
    return new Promise(function (resolve, reject) {
      var go = function () {
        if (tok !== S.tok) return reject(CANCEL);
        if (!S.visible || document.hidden || (holdOnHover && S.hover)) { S.waiters.push(go); return; }
        if (reduce || ms <= 0) return resolve();
        setTimeout(function () { tok !== S.tok ? reject(CANCEL) : resolve(); }, ms);
      };
      go();
    });
  }
  function resume() {
    var w = S.waiters; S.waiters = [];
    w.forEach(function (f) { f(); });
  }

  /* ---------- boot ---------- */
  function getJSON(name) {
    return fetch(DATA + name, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(name + ' ' + r.status);
      return r.json();
    });
  }

  function boot() {
    var app = document.getElementById('showcase-app');
    var grid = document.getElementById('agent-grid');
    if (!app && !grid) return;
    Promise.all([getJSON('agents.json'), getJSON('showcase.json')]).then(function (res) {
      var A = res[0], D = res[1];
      M.meta = D.meta || {};
      M.lib = D.library || {};
      M.runs = D.runs || {};
      M.depts = A.departments.map(function (d) { return { id: d[0], name: d[1] }; });
      M.agents = A.agents.map(function (a) {
        var l = M.lib[a.id] || {};
        return { id: a.id, dept: a.dept, name: a.name, outcome: a.outcome, example: l.example || '', status: l.status || ['Working', 'Waiting for your yes'] };
      });
      M.agents.forEach(function (a) { M.byId[a.id] = a; });
      if (app) buildApp(app);
      if (grid) buildGrid(grid);
      startStatusCycle();
      if (mq.addEventListener) mq.addEventListener('change', function (e) { reduce = e.matches; });
    }).catch(function (e) {
      if (window.console) console.warn('showcase: could not load data', e);
    });
  }

  /* ---------- run model ---------- */
  function deptAgents(dept) { return M.agents.filter(function (a) { return a.dept === dept; }); }
  function deptName(id) { var d = M.depts.filter(function (x) { return x.id === id; })[0]; return d ? d.name : id; }
  function isScripted(id) { return !!M.runs[id]; }

  function getRun(id) {
    if (M.runs[id]) return M.runs[id];
    /* lighter generated run for agents without a full script */
    var a = M.byId[id], l = M.lib[id] || {};
    var idx = M.agents.indexOf(a);
    return {
      skin: idx % 2 ? 'claude' : 'chatgpt',
      title: a.name + ', example run',
      prompt: l.ask || ('Run ' + id + '.'),
      tools: l.tools || [['company_brain', 'read', 'context loaded'], ['workflow', 'run', 'done'], ['self_check', 'outputs', 'pass']],
      reply: a.outcome,
      artifact: { type: 'summary', title: 'Example result', meta: deptName(a.dept), agent: id },
      approve: { q: 'Approve and log this run?', sub: 'Anything that spends, posts or sends waits for your yes.', yes: 'Approve', no: 'Edit' },
      ledger: id + ' · example run'
    };
  }

  /* ---------- section heading + stage ---------- */
  function buildApp(root) {
    root.classList.add('sc-root');
    var section = root.closest('section');
    var grid = document.getElementById('agent-grid');
    var outsideH2 = section ? $$('h2', section).filter(function (h) { return !root.contains(h) && !(grid && grid.contains(h)); }) : [];
    var meta = M.meta;
    var sk = meta.skins || {};
    var gpt = sk.chatgpt || {}, cl = sk.claude || {};

    var head = outsideH2.length ? '' :
      '<header class="sc-head">' +
        '<p class="eyebrow">' + esc(meta.eyebrow || 'agent showcase') + '</p>' +
        '<h2 class="sc-h2">' + (meta.h2 || 'Watch your new team work.') + '</h2>' +
        '<p class="sc-sub">' + esc(meta.sub || '') + '</p>' +
      '</header>';

    var tabs = M.depts.filter(function (d) { return d.id !== 'core'; }).map(function (d) {
      return '<button class="sc-tab" role="tab" type="button" data-dept="' + d.id + '" aria-selected="false">' +
        esc(d.name) + '<span class="n">' + deptAgents(d.id).length + '</span></button>';
    }).join('');

    var every = (meta.everyRun || []).map(function (t) { return '<li>' + svg('check') + '<span>' + esc(t) + '</span></li>'; }).join('');

    root.innerHTML =
      '<div class="sc-wrap">' + head +
        '<div class="sc-bar">' +
          '<span class="sc-label"><i></i>' + esc(meta.labelLong || meta.label || 'Example runs') + '</span>' +
          '<span class="sc-hint">Tap a department, then an agent</span>' +
        '</div>' +
        '<div class="sc-tabs" role="tablist" aria-label="Departments">' + tabs + '</div>' +
        '<div class="sc-stage">' +
          '<aside class="sc-side">' +
            '<div class="sc-side-h"><span class="sc-side-t"></span><span class="sc-side-n"></span></div>' +
            '<div class="sc-list" role="list"></div>' +
            '<div class="sc-every"><p>Every agent, every run</p><ul>' + every + '</ul></div>' +
          '</aside>' +
          '<div class="sc-winwrap">' +
            '<div class="sc-win" data-skin="chatgpt">' +
              '<div class="sc-chrome">' +
                '<span class="sc-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
                '<div class="sc-skins" role="group" aria-label="Show this run in">' +
                  '<button type="button" data-skin="chatgpt" aria-pressed="true">' + esc(gpt.name || 'ChatGPT') + '</button>' +
                  '<button type="button" data-skin="claude" aria-pressed="false">' + esc(cl.name || 'Claude') + '</button>' +
                '</div>' +
                '<span class="sc-ctag">' + esc(meta.label || 'Example runs').replace(/s$/, '') + '</span>' +
                '<button type="button" class="sc-replay" aria-label="Replay this run">' + svg('replay') + '</button>' +
              '</div>' +
              '<div class="sc-app">' +
                '<nav class="sc-rail" aria-hidden="true">' +
                  '<span class="sc-rail-g">' + svg('markG', 'mk') + svg('edit') + svg('search') + svg('grid') + '</span>' +
                  '<span class="sc-rail-c">' + svg('side') + '<b class="sc-rail-new">' + svg('plus') + '</b>' + svg('chat') + svg('folder') + '</span>' +
                  '<span class="sc-rail-av">A</span>' +
                '</nav>' +
                '<div class="sc-main">' +
                  '<div class="sc-top">' +
                    '<span class="sc-top-l">' + svg('menu', 'sc-mob') +
                      '<span class="sc-top-g">' + esc(gpt.model || 'ChatGPT') + svg('chev') + '<em>' + esc(gpt.modelSub || '') + '</em></span>' +
                      '<span class="sc-top-c"><span class="sc-crumb">' + esc(cl.project || 'Headcount') + '</span><span class="sc-sep">/</span><span class="sc-title"></span>' + svg('chev') + '</span>' +
                    '</span>' +
                    '<span class="sc-top-r"><span class="sc-proj">' + svg('folder') + esc(gpt.project || 'Headcount') + '</span>' + svg('edit', 'sc-mob') + '</span>' +
                  '</div>' +
                  '<div class="sc-thread" tabindex="0" aria-label="Example run transcript"></div>' +
                  '<div class="sc-comp">' +
                    '<div class="sc-cbox">' +
                      '<span class="sc-cplus">' + svg('plus') + '</span>' +
                      '<div class="sc-ctxt"><span class="sc-ph"></span><span class="sc-typed"></span></div>' +
                      '<span class="sc-cmodel">' + esc(cl.model || 'Opus') + svg('chev') + '</span>' +
                      '<span class="sc-cmic">' + svg('mic') + '</span>' +
                      '<span class="sc-csend">' + svg('up') + '</span>' +
                    '</div>' +
                    '<p class="sc-cnote">' + esc(meta.disclaimer || '') + '</p>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    R.root = root;
    R.tabs = $('.sc-tabs', root);
    R.list = $('.sc-list', root);
    R.sideT = $('.sc-side-t', root);
    R.sideN = $('.sc-side-n', root);
    R.stage = $('.sc-stage', root);
    R.win = $('.sc-win', root);
    R.thread = $('.sc-thread', root);
    R.title = $('.sc-title', root);
    R.ph = $('.sc-ph', root);
    R.typed = $('.sc-typed', root);
    R.send = $('.sc-csend', root);

    /* events */
    R.tabs.addEventListener('click', function (e) {
      var b = e.target.closest('.sc-tab'); if (!b) return;
      S.auto = false;
      selectDept(b.dataset.dept, true);
    });
    R.list.addEventListener('click', function (e) {
      var b = e.target.closest('.sc-ag'); if (!b) return;
      S.auto = false;
      play(b.dataset.id);
    });
    $('.sc-skins', root).addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      S.auto = false;
      setSkin(b.dataset.skin);
    });
    $('.sc-replay', root).addEventListener('click', function () { S.auto = false; play(S.agent); });
    R.thread.addEventListener('click', function (e) {
      var y = e.target.closest('.sc-yes'), n = e.target.closest('.sc-no'), nx = e.target.closest('.sc-next');
      if (y) { S.auto = false; approve(y); }
      if (n) { S.auto = false; editRun(n); }
      if (nx) { S.auto = false; goNext(); }
    });
    R.thread.addEventListener('scroll', function () {
      if (Date.now() - S.progAt < 700) return;
      var t = R.thread;
      S.pinned = t.scrollHeight - t.scrollTop - t.clientHeight < 90;
    }, { passive: true });
    R.win.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') S.hover = true; });
    R.win.addEventListener('pointerleave', function () { S.hover = false; resume(); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) resume(); });

    /* first state: first department, idle window until it scrolls into view */
    var first = (M.meta.order || [])[0] || M.agents[0].id;
    S.agent = first;
    selectDept(M.byId[first].dept, false, first);
    setSkin(getRun(first).skin);
    idle(first);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          S.visible = en.isIntersecting;
          if (S.visible) {
            if (!S.started) { S.started = true; play(S.agent); }
            resume();
          }
        });
      }, { threshold: 0.3 }).observe(R.win);
    } else {
      S.visible = true; S.started = true; play(S.agent);
    }
  }

  function idle(id) {
    var a = M.byId[id];
    R.title.textContent = getRun(id).title;
    R.thread.innerHTML = '<div class="sc-idle">' + svg(id, 'sc-idle-i') + '<p>' + esc(a.name) + '</p><span>Starting example run</span></div>';
    R.ph.textContent = phText();
  }
  function phText() { var sk = (M.meta.skins || {})[S.skin] || {}; return sk.placeholder || 'Ask anything'; }

  function selectDept(dept, andPlay, agentId) {
    S.dept = dept;
    $$('.sc-tab', R.tabs).forEach(function (t) {
      var on = t.dataset.dept === dept;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) scrollRow(R.tabs, t);
    });
    var list = deptAgents(dept);
    R.sideT.textContent = deptName(dept);
    R.sideN.textContent = list.length + ' agents';
    R.list.innerHTML = list.map(function (a) {
      return '<button type="button" class="sc-ag" role="listitem" data-id="' + a.id + '">' +
        '<span class="sc-ag-i">' + svg(a.id) + '</span>' +
        '<span class="sc-ag-b"><span class="sc-ag-n">' + esc(a.name) + '</span>' +
        '<span class="sc-ag-o">' + esc(a.outcome) + '</span></span>' +
        '<span class="sc-ag-s"><span class="sc-pill" data-st="' + a.id + '" data-i="0">' + esc(a.status[0]) + '</span>' +
        (isScripted(a.id) ? '<span class="sc-ag-full" title="Full example run">' + svg('play') + '<span>Full run</span></span>' : '') + '</span>' +
        '</button>';
    }).join('');
    markStatus($$('[data-st]', R.list));
    var pick = agentId || (list.filter(function (a) { return isScripted(a.id); })[0] || list[0]).id;
    markAgent(pick);
    if (andPlay) play(pick);
  }

  function markAgent(id) {
    $$('.sc-ag', R.list).forEach(function (b) {
      var on = b.dataset.id === id;
      b.classList.toggle('on', on);
      b.setAttribute('aria-current', on ? 'true' : 'false');
      if (on) scrollRow(R.list, b);
    });
  }

  /* scroll a horizontal row without moving the page */
  function scrollRow(row, item) {
    if (!row || !item || row.scrollWidth <= row.clientWidth + 2) return;
    var left = item.offsetLeft - row.clientWidth / 2 + item.offsetWidth / 2;
    try { row.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' }); } catch (e) { row.scrollLeft = left; }
  }

  function setSkin(skin) {
    S.skin = skin === 'claude' ? 'claude' : 'chatgpt';
    R.win.dataset.skin = S.skin;
    $$('.sc-skins button', R.root).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.skin === S.skin ? 'true' : 'false'); });
    if (R.ph) R.ph.textContent = phText();
  }

  /* ---------- thread helpers ---------- */
  function toBottom(smooth) {
    if (!S.pinned) return;
    var t = R.thread;
    S.progAt = Date.now();
    if (smooth && !reduce && t.scrollTo) t.scrollTo({ top: t.scrollHeight, behavior: 'smooth' });
    else t.scrollTop = t.scrollHeight;
  }

  async function typeComposer(text, tok) {
    R.ph.hidden = true;
    R.typed.textContent = '';
    R.send.classList.remove('on');
    if (reduce) { R.typed.textContent = text; R.send.classList.add('on'); return; }
    var step = Math.max(1, Math.ceil(text.length / 64));
    for (var i = step; i < text.length; i += step) {
      R.typed.textContent = text.slice(0, i);
      if (i > step) R.send.classList.add('on');
      await wait(22, tok);
    }
    R.typed.textContent = text;
    R.send.classList.add('on');
  }

  function clearComposer() {
    R.typed.textContent = '';
    R.ph.hidden = false;
    R.ph.textContent = phText();
    R.send.classList.remove('on', 'press');
  }

  async function stream(parent, text, tok) {
    var p = el('<p class="sc-txt"></p>');
    parent.appendChild(p);
    if (reduce) { p.textContent = text; toBottom(); return; }
    var words = text.split(' ');
    p.classList.add('streaming');
    for (var i = 2; i < words.length + 2; i += 2) {
      p.textContent = words.slice(0, i).join(' ');
      toBottom();
      await wait(32, tok);
    }
    p.classList.remove('streaming');
  }

  async function reveal(root, tok) {
    var items = $$('.sc-st', root);
    for (var i = 0; i < items.length; i++) {
      items[i].classList.add('in');
      countUp(items[i]);
      if (i % 2 === 0) toBottom(true);
      await wait(items[i].dataset.d ? +items[i].dataset.d : 130, tok);
    }
    $$('[data-count]', root).forEach(countUp);
  }

  function countUp(node) {
    var targets = node.matches && node.matches('[data-count]') ? [node] : $$('[data-count]', node);
    targets.forEach(function (n) {
      if (n.dataset.counted) return;
      n.dataset.counted = '1';
      var end = +n.dataset.count, unit = n.dataset.unit || '';
      if (reduce) { n.textContent = end + unit; return; }
      var t0 = performance.now(), dur = 1100;
      var tick = function (now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        n.textContent = Math.round(end * e) + unit;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- the run ---------- */
  async function play(id) {
    if (!id || !M.byId[id]) return;
    var tok = ++S.tok;
    var run = getRun(id);
    var a = M.byId[id];
    S.agent = id;
    S.pinned = true;
    if (a.dept !== S.dept) selectDept(a.dept, false, id); else markAgent(id);
    setSkin(run.skin);
    R.title.textContent = run.title;
    R.thread.innerHTML = '';
    R.thread.scrollTop = 0;
    clearComposer();
    R.win.classList.add('running');

    try {
      await wait(380, tok);
      await typeComposer(run.prompt, tok);
      await wait(280, tok);
      R.send.classList.add('press');
      await wait(160, tok);
      clearComposer();

      var u = el('<div class="sc-msg sc-u"><div class="sc-bub"><span class="sc-av">A</span><span class="sc-ut"></span></div></div>');
      $('.sc-ut', u).textContent = run.prompt;
      R.thread.appendChild(u);
      toBottom(true);
      await wait(320, tok);

      var msg = el('<div class="sc-msg sc-a"><span class="sc-amark">' + svg('markC') + '</span><div class="sc-abody"></div></div>');
      var body = $('.sc-abody', msg);
      R.thread.appendChild(msg);
      var think = el('<div class="sc-think"><span class="sc-shim">Thinking</span></div>');
      body.appendChild(think);
      toBottom(true);
      await wait(650, tok);
      think.remove();

      /* tool calls */
      var n = run.tools.length;
      var tb = el('<div class="sc-tools"><div class="sc-tools-h"><span class="sc-spin"></span><span class="sc-tools-l">Running ' + esc(id) + '</span><span class="sc-tools-c">0 / ' + n + '</span></div><div class="sc-tools-b"></div></div>');
      body.appendChild(tb);
      var tbb = $('.sc-tools-b', tb);
      for (var i = 0; i < n; i++) {
        var t = run.tools[i];
        var row = el('<div class="sc-tool"><span class="sc-ts"><span class="sc-spin"></span></span><span class="sc-tn"><b></b> <span class="sc-ta"></span></span><span class="sc-tr"></span></div>');
        $('b', row).textContent = t[0];
        $('.sc-ta', row).textContent = t[1];
        tbb.appendChild(row);
        toBottom(true);
        await wait(t[3] || 640, tok);
        $('.sc-ts', row).innerHTML = svg('check');
        $('.sc-tr', row).textContent = t[2];
        row.classList.add('done');
        $('.sc-tools-c', tb).textContent = (i + 1) + ' / ' + n;
      }
      tb.classList.add('done');
      $('.sc-tools-h .sc-spin', tb).outerHTML = svg('check', 'sc-ok');
      $('.sc-tools-l', tb).textContent = 'Ran ' + n + ' steps';
      await wait(240, tok);

      await stream(body, run.reply, tok);
      await wait(200, tok);

      var art = renderArtifact(run.artifact, run);
      body.appendChild(art);
      toBottom(true);
      await reveal(art, tok);

      if (run.after) { await wait(220, tok); await stream(body, run.after, tok); }
      await wait(320, tok);

      var ap = run.approve || {};
      var appr = el('<div class="sc-appr sc-st"><div class="sc-appr-t"><p class="sc-appr-q"></p><p class="sc-appr-s"></p></div>' +
        '<div class="sc-appr-b"><button type="button" class="sc-yes">' + svg('check') + '<span></span></button><button type="button" class="sc-no">' + svg('edit') + '<span></span></button></div></div>');
      $('.sc-appr-q', appr).textContent = ap.q || 'Approve?';
      $('.sc-appr-s', appr).textContent = ap.sub || '';
      $('.sc-yes span', appr).textContent = ap.yes || 'Approve';
      $('.sc-no span', appr).textContent = ap.no || 'Edit';
      body.appendChild(appr);
      toBottom(true);
      await wait(30, tok);
      appr.classList.add('in');
      toBottom(true);
      await wait(650, tok);

      var led = el('<p class="sc-ledger sc-st">' + svg('growth-ledger') + '<span>Logged to Growth Ledger</span><code></code></p>');
      $('code', led).textContent = run.ledger || '';
      body.appendChild(led);
      await wait(30, tok);
      led.classList.add('in');
      toBottom(true);
      await wait(420, tok);

      var nid = nextId();
      var nx = el('<button type="button" class="sc-next sc-st"><i class="sc-next-f"></i><span>Next example: <b></b></span>' + svg('arrow') + '</button>');
      $('b', nx).textContent = M.byId[nid].name;
      R.thread.appendChild(nx);
      await wait(30, tok);
      nx.classList.add('in');
      toBottom(true);
      R.win.classList.remove('running');

      if (S.auto && !reduce) {
        var total = 9000, stepMs = 100, f = $('.sc-next-f', nx);
        for (var tt = 0; tt <= total; tt += stepMs) {
          if (!S.auto) { f.style.transform = 'scaleX(0)'; return; }
          f.style.transform = 'scaleX(' + (tt / total).toFixed(3) + ')';
          await wait(stepMs, tok, true);
        }
        if (S.auto) play(nid);
      }
    } catch (e) {
      if (e !== CANCEL && window.console) console.error(e);
    }
  }

  function nextId() {
    var order = M.meta.order || [];
    var i = order.indexOf(S.agent);
    if (i < 0) {
      /* unscripted agent: next scripted run in the same department, else the first of the order */
      var same = deptAgents(S.dept).map(function (a) { return a.id; }).filter(isScripted);
      return same[0] && same[0] !== S.agent ? same[0] : order[0];
    }
    return order[(i + 1) % order.length];
  }
  function goNext() { play(nextId()); }

  function approve(btn) {
    var box = btn.closest('.sc-appr');
    if (!box || box.classList.contains('ok')) return;
    box.classList.add('ok');
    btn.innerHTML = svg('check') + '<span>Approved</span>';
    var no = $('.sc-no', box); if (no) no.disabled = true;
    var s = $('.sc-appr-s', box); if (s) s.textContent = 'Approved by you just now. The agent carries on and reports back in the Monday Standup.';
    var led = box.parentNode && $('.sc-ledger span', box.parentNode);
    if (led) led.textContent = 'Approval logged to Growth Ledger';
  }
  function editRun(btn) {
    var box = btn.closest('.sc-appr');
    if (!box) return;
    var s = $('.sc-appr-s', box);
    if (s) s.textContent = 'Reply in plain words and the agent redoes only that part.';
    R.ph.hidden = true;
    R.typed.textContent = 'Hold item 2 for now, go ahead with the rest';
    R.send.classList.add('on');
  }

  /* ---------- artifacts ---------- */
  function artShell(art, inner, extraCls) {
    return el('<div class="sc-art sc-art-' + art.type + (extraCls ? ' ' + extraCls : '') + '">' +
      '<div class="sc-art-h"><span class="sc-art-t">' + esc(art.title) + '</span><span class="sc-art-m">' + esc(art.meta || '') + '</span></div>' +
      inner + '</div>');
  }

  function renderArtifact(art, run) {
    var f = ART[art.type] || ART.summary;
    return f(art, run);
  }

  var tone = function (t) { return t ? ' t-' + t : ''; };

  var ART = {
    decisions: function (a) {
      var k = (a.kpis || []).map(function (x) {
        return '<div class="sc-kpi sc-st"><span>' + esc(x[0]) + '</span><b class="' + tone(x[2]) + '">' + esc(x[1]) + '</b></div>';
      }).join('');
      var rows = a.rows.map(function (r) {
        var act = r[0].toLowerCase();
        var cls = /pause|negative|revert|kill/.test(act) ? 'kill' : /scale/.test(act) ? 'scale' : /refresh/.test(act) ? 'refresh' : 'hold';
        return '<div class="sc-dr sc-st">' +
          '<span class="sc-act a-' + cls + '">' + esc(r[0]) + '</span>' +
          '<span class="sc-dr-b"><b>' + esc(r[1]) + '</b><span>' + esc(r[2]) + '</span></span>' +
          '<span class="sc-dr-r"><code>' + esc(r[3]) + '</code>' + (r[4] === 'yes' ? '<em class="need">needs yes</em>' : '<em>auto</em>') + '</span>' +
          '</div>';
      }).join('');
      return artShell(a, '<div class="sc-kpis">' + k + '</div><div class="sc-drs">' + rows + '</div>');
    },

    adgrid: function (a) {
      var logo = a.logo || 'brand';
      var tiles = a.tiles.map(function (t, i) {
        return '<figure class="sc-adf sc-st" data-d="150">' + adTile(t, logo) +
          '<figcaption><span>' + esc(t.tag) + '</span><em>' + svg('check') + 'QA</em></figcaption></figure>';
      }).join('');
      return artShell(a, '<div class="sc-ads">' + tiles + '</div>');
    },

    storyboard: function (a) {
      var frames = a.frames.map(function (f, i) {
        return '<figure class="sc-fr sc-st" data-d="160"><div class="sc-frv sc-sc-' + esc(f.scene) + '">' + scene(f.scene) +
          '<span class="sc-tc">' + esc(f.t) + '</span>' + (i === 0 ? '<span class="sc-hookb">HOOK</span>' : '') +
          '<span class="sc-cap">' + esc(f.cap) + '</span>' +
          '<span class="sc-rui" aria-hidden="true">' + svg('heart') + svg('chat') + svg('send2') + '</span>' +
          '</div><figcaption>' + esc(f.beat) + '</figcaption></figure>';
      }).join('');
      var hooks = a.hooks.map(function (h, i) {
        return '<li class="sc-st' + (h[2] ? ' held' : '') + '"><span class="sc-rk">' + (i + 1) + '</span><span class="sc-hk">' + esc(h[0]) +
          (h[2] ? '<em>' + esc(h[2]) + '</em>' : '') + '</span><span class="sc-hs"><b>' + h[1] + '</b>/20<i style="--w:' + (h[1] / 20 * 100) + '%"></i></span></li>';
      }).join('');
      return artShell(a, '<div class="sc-reel">' + frames + '</div><div class="sc-sub-h sc-st">Hooks, ranked</div><ol class="sc-hooks">' + hooks + '</ol>' +
        '<p class="sc-fine sc-st">' + esc(a.note) + '</p>');
    },

    motion: function (a) {
      var style = '--b1:' + a.b1 + ';--b2:' + a.b2 + ';--ma:' + a.acc;
      var screen = function (cls) {
        return '<div class="sc-mv ' + cls + '" style="' + style + '"><div class="sc-mv-in">' +
          '<b class="sc-mv-n" data-count="' + a.stat + '" data-unit="' + esc(a.unit) + '">0' + esc(a.unit) + '</b>' +
          '<span class="sc-mv-1">' + esc(a.l1) + '</span><span class="sc-mv-2">' + esc(a.l2) + '</span></div>' +
          '<span class="sc-mv-bar"><i></i></span></div>';
      };
      var qa = a.qa.map(function (q) {
        return '<li class="sc-st"><code>' + esc(q[0]) + '</code><span>' + esc(q[1]) + ' · ' + esc(q[2]) + '</span><em>' + svg('check') + 'check</em><em>' + svg('check') + 'frames</em></li>';
      }).join('');
      return artShell(a,
        '<div class="sc-mvs"><figure class="sc-st">' + screen('r916') + '<figcaption>9:16 · 0:06</figcaption></figure>' +
        '<figure class="sc-st">' + screen('r11') + '<figcaption>1:1 · 0:06</figcaption></figure>' +
        '<div class="sc-mvx"><div class="sc-sub-h sc-st">QA</div><ul class="sc-qa">' + qa + '</ul>' +
        '<div class="sc-sub-h sc-st">Caption</div><p class="sc-capt sc-st">' + esc(a.caption) + '</p><p class="sc-fine sc-st">' + esc(a.source) + '</p></div></div>');
    },

    personas: function (a) {
      var ps = a.personas.map(function (p) {
        var checks = p.checks.map(function (c) { return '<li class="' + (c[1] ? 'ok' : 'bad') + '">' + svg(c[1] ? 'check' : 'x') + esc(c[0]) + '</li>'; }).join('');
        return '<div class="sc-pc sc-st' + (p.ok ? '' : ' blocked') + '">' +
          '<div class="sc-pc-h">' + avatar(p.g1, p.g2, 'lg') + '<span><b>' + esc(p.name) + '</b><code>' + esc(p.handle) + '</code></span>' +
          '<em class="' + (p.ok ? 'pass' : 'fail') + '">' + (p.ok ? 'PASS' : 'BLOCKED') + '</em></div>' +
          '<p>' + esc(p.bio) + '</p><ul>' + checks + '</ul></div>';
      }).join('');
      var cal = a.cal.map(function (c) {
        return '<div class="sc-cd sc-st"><span class="d">' + esc(c[0]) + '</span><span class="k">' + esc(c[1]) + '</span><b>' + esc(c[2]) + '</b><code>' + esc(c[3]) + '</code></div>';
      }).join('');
      var pct = Math.round(a.spend / a.budget * 100);
      return artShell(a, '<div class="sc-pcs">' + ps + '</div><div class="sc-sub-h sc-st">Wren, first week</div><div class="sc-cal">' + cal + '</div>' +
        '<div class="sc-budget sc-st"><span>Model costs this month</span><b>' + inr(a.spend) + ' <em>of ' + inr(a.budget) + '</em></b><i style="--w:' + pct + '%"></i></div>');
    },

    dm: function (a) {
      var msgs = a.msgs.map(function (m) {
        var chips = m[2] ? '<span class="sc-qr">' + m[2].map(function (c) { return '<i>' + esc(c) + '</i>'; }).join('') + '</span>' : '';
        return '<div class="sc-dmm sc-st ' + (m[0] === 'bot' ? 'dm-b' : 'dm-c') + '"><span class="sc-dmt">' + esc(m[1]) + '</span>' + chips + '</div>';
      }).join('');
      var l = a.link;
      var link = '<div class="sc-lk sc-st"><span class="sc-lk-img">' + miniJar() + '</span><span class="sc-lk-b"><b>' + esc(l.title) + '</b><em>' + esc(l.price) + '</em><code>' + esc(l.url) + '</code></span>' +
        '<span class="sc-lk-c">' + svg('cart') + esc(l.cta) + '</span></div>';
      var max = a.funnel[0][1];
      var fun = a.funnel.map(function (f, i) {
        var prev = i ? a.funnel[i - 1][1] : 0;
        return '<li class="sc-st"><span>' + esc(f[0]) + '</span><i style="--w:' + Math.max(4, f[1] / max * 100) + '%"></i><b>' + f[1] + '</b><em>' + (i ? Math.round(f[1] / prev * 100) + '%' : '') + '</em></li>';
      }).join('');
      return artShell(a,
        '<div class="sc-dmx"><div class="sc-phone">' +
          '<div class="sc-ph-h">' + avatar('#c49a6c', '#7a4a2a') + '<span><b>' + esc(a.brand) + '</b><em>Automated replies on</em></span></div>' +
          '<div class="sc-cm sc-st">' + avatar('#f8a5c2', '#a55eea') + '<span><b>' + esc(a.comment[0]) + '</b> commented on your reel<q>' + esc(a.comment[1]) + '</q></span></div>' +
          msgs + link +
        '</div><div class="sc-fun"><div class="sc-sub-h sc-st">Last 7 days</div><ul>' + fun + '</ul><p class="sc-rev sc-st">' + esc(a.rev) + '</p></div></div>');
    },

    reddit: function (a) {
      var th = a.threads.map(function (t) {
        return '<div class="sc-rd sc-st" data-d="200"><div class="sc-rd-h"><code>' + esc(t.sub) + '</code><span>' + esc(t.age) + '</span>' +
          '<em class="tier-' + esc(t.tier) + '">intent ' + t.score + ' · ' + esc(t.tier) + '</em></div>' +
          '<b class="sc-rd-t">' + esc(t.title) + '</b>' +
          '<div class="sc-rd-d"><span class="sc-rd-l">Draft reply · ' + esc(t.mode) + '</span><p>' + esc(t.draft) + '</p></div></div>';
      }).join('');
      return artShell(a, '<div class="sc-rds">' + th + '</div><p class="sc-fine sc-st">' + esc(a.held) + '</p>');
    },

    sov: function (a) {
      var k = a.kpis.map(function (x) { return '<div class="sc-kpi sc-st"><span>' + esc(x[0]) + '</span><b>' + esc(x[1]) + '</b></div>'; }).join('');
      var rows = a.engines.map(function (e) {
        return '<div class="sc-sv sc-st" data-d="180"><span class="sc-sv-n">' + esc(e[0]) + '</span>' +
          '<span class="sc-sv-bars"><span class="b you"><i style="--w:' + (e[1] / 32 * 100) + '%"></i><b>' + e[1].toFixed(1) + '%</b></span>' +
          '<span class="b riv"><i style="--w:' + (e[2] / 32 * 100) + '%"></i><b>' + e[2].toFixed(1) + '%</b></span></span>' +
          '<em class="' + (e[4] ? 'real' : 'noise') + '">' + esc(e[3]) + ' pts · ' + (e[4] ? 'real move' : 'noise') + '</em></div>';
      }).join('');
      var gaps = a.gaps.map(function (g) { return '<li class="sc-st"><code>' + esc(g[0]) + '</code><b>' + g[1] + ' citations</b></li>'; }).join('');
      return artShell(a, '<div class="sc-kpis k3">' + k + '</div>' +
        '<div class="sc-sv-leg"><span><i class="you"></i>' + esc(a.you) + '</span><span><i class="riv"></i>' + esc(a.rival) + '</span><span class="r">share of voice</span></div>' +
        '<div class="sc-svs">' + rows + '</div><div class="sc-sub-h sc-st">Cited instead of you</div><ul class="sc-gaps">' + gaps + '</ul>');
    },

    backlinks: function (a) {
      var q = a.req;
      var req = '<div class="sc-req sc-st"><div class="sc-req-h"><code>' + esc(q.id) + '</code><b>' + esc(q.outlet) + '</b><em>' + svg('clock') + esc(q.left) + '</em></div>' +
        '<span class="sc-req-t">' + esc(q.topic) + ' · expert: ' + esc(q.expert) + '</span><p>' + esc(q.draft) + '</p></div>';
      var rows = a.rows.map(function (r) {
        return '<div class="sc-bl sc-st"><span class="sc-bl-d"><code>' + esc(r[0]) + '</code><span>' + esc(r[1]) + ' · ' + esc(r[4]) + '</span></span>' +
          '<span class="sc-bl-s"><i style="--w:' + r[2] + '%"></i><b>' + r[2] + '</b></span><em class="' + (r[3] === 'pursue' ? 'go' : 'no') + '">' + esc(r[3]) + '</em></div>';
      }).join('');
      return artShell(a, '<div class="sc-sub-h sc-st">Journalist request, answer now</div>' + req + '<div class="sc-sub-h sc-st">Prospects, scored</div><div class="sc-bls">' + rows + '</div>');
    },

    pipeline: function (a) {
      var rows = a.rows.map(function (r) {
        return '<div class="sc-pl sc-st' + (r[4] === 'you' ? ' you' : '') + '"><span class="sc-ring" style="--p:' + r[0] + '"><b>' + r[0] + '</b></span>' +
          '<span class="sc-pl-b"><b>' + esc(r[1]) + '</b><span>' + esc(r[2]) + '</span></span><em>' + esc(r[3]) + '</em></div>';
      }).join('');
      var p = a.pay;
      var pay = '<div class="sc-pay sc-st"><div class="sc-pay-h">' + svg('lock') + '<span>Payment link</span><code>' + esc(p.url) + '</code></div>' +
        '<div class="sc-pay-b"><span><em>Billed to</em><b>' + esc(p.to) + '</b><span>' + esc(p.item) + '</span></span>' +
        '<span class="sc-pay-t"><em>Total</em><b>' + esc(p.total) + '</b><span>' + esc(p.note) + '</span></span></div>' +
        '<span class="sc-pay-c">' + esc(p.cta) + '</span></div>';
      return artShell(a, '<div class="sc-pls">' + rows + '</div>' + pay);
    },

    creators: function (a) {
      var rows = a.rows.map(function (r) {
        var over = r[5] > a.cap;
        return '<div class="sc-cr sc-st' + (over ? ' over' : '') + '">' + avatar(r[7], r[8]) +
          '<span class="sc-cr-b"><b>@' + esc(r[0]) + ' <em class="tier">' + esc(r[1]) + '</em></b><span>' + esc(r[6]) + '</span></span>' +
          '<span class="sc-cr-s"><span><em>score</em><b>' + r[2] + '</b></span><span><em>views</em><b>' + esc(r[3]) + '</b></span>' +
          '<span><em>rate</em><b class="g">' + esc(r[4]) + '</b></span><span class="cpm"><em>CPM</em><b>' + inr(r[5]) + '</b></span></span></div>';
      }).join('');
      return artShell(a, '<div class="sc-crs">' + rows + '</div><p class="sc-fine sc-st">' + esc(a.note) + '</p>');
    },

    flow: function (a) {
      var n = a.nodes;
      var node = function (kind, icon, label, text) {
        return '<div class="sc-fn sc-st k-' + kind + '" data-d="170">' + svg(icon) + '<span><em>' + label + '</em><b>' + esc(text) + '</b></span></div>';
      };
      var line = '<i class="sc-fl sc-st" data-d="60"></i>';
      var diagram = '<div class="sc-flow">' +
        node('trig', 'bolt', 'Trigger', n.trigger) + line +
        node('wait', 'clock', 'Delay', n.wait1) + line +
        node('mail', 'mail', 'Email 1', n.email1) + line +
        node('split', 'split', 'Split', n.split) + line +
        '<div class="sc-fbr sc-st" data-d="60"><span>yes</span><span>no</span></div>' +
        '<div class="sc-fcols"><div>' + node('exit', 'exit', 'Yes', n.yes) + '</div><div>' +
          node('wait', 'clock', 'Delay', n.wait2) + line + node('mail', 'mail', 'Email 2', n.email2) + '</div></div>' +
        '</div>';
      var max = 3.83;
      var st = a.stakes.map(function (s) {
        var v = parseFloat(s[2].replace(/[^\d.]/g, ''));
        return '<li class="sc-st"><span>' + esc(s[0]) + ' <em class="' + esc(s[1]) + '">' + esc(s[1]) + '</em></span><i style="--w:' + (v / max * 100) + '%"></i><b>' + esc(s[2]) + '</b></li>';
      }).join('');
      return artShell(a, '<div class="sc-flx">' + diagram + '<div class="sc-stk"><div class="sc-sub-h sc-st">Revenue at stake, per month</div><ul>' + st + '</ul><p class="sc-fine sc-st">' + esc(a.total) + '</p></div></div>');
    },

    alerts: function (a) {
      var rows = a.rows.map(function (r) {
        var lv = r[0] >= 80 ? 'hi' : r[0] >= 60 ? 'md' : 'lo';
        return '<div class="sc-al sc-st"><span class="sc-al-s ' + lv + '">' + r[0] + '</span><span class="sc-al-b"><code>' + esc(r[1]) + '</code><b>' + esc(r[2]) + '</b><span>' + esc(r[3]) + '</span></span></div>';
      }).join('');
      return artShell(a, '<div class="sc-als">' + rows + '</div><div class="sc-resp sc-st"><em>Suggested response</em><p>' + esc(a.resp) + '</p></div>');
    },

    standup: function (a) {
      var k = a.kpis.map(function (x) {
        var down = x[2].charAt(0) === '-';
        return '<div class="sc-sk sc-st t-' + x[3] + '"><span>' + esc(x[0]) + '</span><b>' + esc(x[1]) + '</b><em>' + svg(down ? 'down2' : 'up2') + esc(x[2].replace(/^[+-]/, '')) + ' vs 4 wk</em></div>';
      }).join('');
      var why = a.why.map(function (w) { return '<li class="sc-st"><b>' + esc(w[0]) + ':</b> ' + esc(w[1]) + '</li>'; }).join('');
      var nx = a.next.map(function (w) { return '<li class="sc-st"><code>' + esc(w[0]) + '</code><span>' + esc(w[1]) + '</span></li>'; }).join('');
      var yes = a.yes.map(function (w) { return '<li class="sc-st"><i></i>' + esc(w) + '</li>'; }).join('');
      return artShell(a, '<div class="sc-doc"><div class="sc-doc-f">' + svg('doc') + '<code>' + esc(a.file) + '</code></div>' +
        '<p class="sc-doc-s sc-st">' + esc(a.summary) + '</p><div class="sc-sks">' + k + '</div>' +
        '<div class="sc-sub-h sc-st">Why each moved</div><ul class="sc-why">' + why + '</ul>' +
        '<div class="sc-sub-h sc-st">What each agent does next</div><ul class="sc-nx">' + nx + '</ul>' +
        '<div class="sc-sub-h sc-st">Needs your yes</div><ul class="sc-yesl">' + yes + '</ul></div>');
    },

    summary: function (a) {
      var ag = M.byId[a.agent];
      var steps = (M.meta.everyRun || []).slice(0, 5).map(function (s) { return '<li class="sc-st">' + svg('check') + esc(s) + '</li>'; }).join('');
      return artShell(a, '<div class="sc-sum"><div class="sc-sum-h sc-st"><span class="sc-sum-i">' + svg(ag.id) + '</span><span><em>' + esc(ag.name) + '</em><b>' + esc(ag.example) + '</b></span></div>' +
        '<ul class="sc-sum-l">' + steps + '</ul></div>');
    }
  };

  /* ---------- drawn pieces: avatars, products, reel scenes ---------- */
  function avatar(g1, g2, size) {
    return '<span class="sc-avt' + (size ? ' ' + size : '') + '" style="--g1:' + g1 + ';--g2:' + g2 + '" aria-hidden="true"><i></i><i></i></span>';
  }
  function prod(kind, cls) {
    var c = cls ? ' ' + cls : '';
    if (kind === 'tube') return '<span class="sc-pr tube' + c + '"><i class="cr"></i><i class="bd"><b>d</b></i><i class="cp"></i></span>';
    if (kind === 'jar') return '<span class="sc-pr jar' + c + '"><i class="ld"></i><i class="bd"><b>d</b></i></span>';
    return '<span class="sc-pr bottle' + c + '"><i class="bl"></i><i class="nk"></i><i class="bd"><b>d</b></i></span>';
  }
  function miniJar() { return '<span class="sc-mini">' + prod('jar') + '</span>'; }

  function adTile(t, logo) {
    var style = '--b1:' + t.b1 + ';--b2:' + t.b2 + ';--ai:' + t.ink + ';--ac:' + t.acc;
    var h = '<span class="lg">' + esc(logo) + '</span>';
    switch (t.fmt) {
      case 'hero':
        h += '<span class="tx"><b class="hd">' + esc(t.head) + '</b><span class="sb">' + esc(t.sub) + '</span></span>' +
          prod('tube', 'p-hero') + '<span class="bdg">' + esc(t.badge) + '</span><span class="cta">' + esc(t.cta) + '</span>';
        break;
      case 'compare':
        h += '<span class="tx"><b class="hd">' + esc(t.head) + '</b></span><span class="cmp"><span class="ch"><i></i><i>us</i><i>them</i></span>' +
          t.rows.map(function (r) {
            return '<span class="cr"><i>' + esc(r[0]) + '</i><i class="' + (r[1] ? 'y' : 'n') + '">' + svg(r[1] ? 'check' : 'x') + '</i><i class="' + (r[2] ? 'y' : 'n') + '">' + svg(r[2] ? 'check' : 'x') + '</i></span>';
          }).join('') + '</span>' + prod('tube', 'p-cmp') + '<span class="cta">' + esc(t.cta) + '</span>';
        break;
      case 'statement':
        h += '<span class="tx"><b class="hd big">' + esc(t.head) + '</b></span>' + prod('bottle', 'p-stm') + '<span class="cta">' + esc(t.cta) + '</span>';
        break;
      case 'offer':
        h += '<span class="tx"><span class="sb up">' + esc(t.head) + '</span><b class="pr">' + esc(t.price) + '</b><s>' + esc(t.was) + '</s></span>' +
          prod('jar', 'p-off') + '<span class="bdg">' + esc(t.badge) + '</span><span class="cta">' + esc(t.cta) + '</span>';
        break;
      case 'bundle':
        h += '<span class="tx"><b class="hd">' + esc(t.head) + '</b><span class="sb">' + esc(t.price) + ' for both</span></span>' +
          prod('bottle', 'p-bn1') + prod('jar', 'p-bn2') + '<span class="bdg wide">' + esc(t.badge) + '</span><span class="cta">' + esc(t.cta) + '</span>';
        break;
      case 'callout':
        h += '<span class="tx"><b class="hd">' + esc(t.head) + '</b></span>' + prod('bottle', 'p-cal') +
          '<span class="cls">' + t.callouts.map(function (c) { return '<i>' + esc(c) + '</i>'; }).join('') + '</span><span class="cta">' + esc(t.cta) + '</span>';
        break;
    }
    return '<div class="sc-ad f-' + t.fmt + '" style="' + style + '">' + h + '</div>';
  }

  function scene(kind) {
    switch (kind) {
      case 'label': return '<span class="sc-bigtube"><i class="ln"></i><i class="ln"></i><i class="ln"></i><i class="ln"></i><i class="ln"></i></span><span class="sc-thumb"></span>';
      case 'callouts': return '<span class="sc-bigtube"><i class="ln"></i><i class="ln hl"><b>parfum</b></i><i class="ln"></i><i class="ln hl"><b>alcohol</b></i><i class="ln hl"><b>linalool</b></i></span>';
      case 'swap': return '<span class="sc-swap" style="--ac:#c4461e">' + prod('tube') + '</span>';
      case 'cheek': return '<span class="sc-cream"></span><span class="sc-cream s2"></span>';
      case 'cta': return '<span class="sc-bm">' + svg('bookmark') + '</span>';
    }
    return '';
  }

  /* ---------- library grid ---------- */
  function buildGrid(root) {
    root.classList.add('sc-root');
    var meta = M.meta;
    var counts = {};
    M.agents.forEach(function (a) { counts[a.dept] = (counts[a.dept] || 0) + 1; });
    var chips = '<button type="button" class="sc-fc" data-f="all" aria-pressed="true">All<span>' + M.agents.length + '</span></button>' +
      M.depts.map(function (d) {
        return '<button type="button" class="sc-fc" data-f="' + d.id + '" aria-pressed="false">' + esc(d.id === 'core' ? 'Core' : d.name) + '<span>' + (counts[d.id] || 0) + '</span></button>';
      }).join('');
    var cards = M.agents.map(function (a, i) {
      var core = a.dept === 'core';
      return '<a class="sc-card' + (core ? ' core' : '') + '" href="#showcase-app" data-id="' + a.id + '" data-dept="' + a.dept + '" style="--i:' + (i % 4) + '">' +
        '<span class="sc-card-top"><span class="sc-card-i">' + svg(a.id) + '</span>' +
          (core ? '<span class="sc-inc">Included</span>' : '') +
          '<span class="sc-pill" data-st="' + a.id + '" data-i="0">' + esc(a.status[0]) + '</span></span>' +
        '<span class="sc-card-n">' + esc(a.name) + '</span>' +
        '<span class="sc-card-d">' + esc(deptName(a.dept)) + '</span>' +
        '<span class="sc-card-o">' + esc(a.outcome) + '</span>' +
        '<span class="sc-card-r"><span aria-hidden="true">→ </span>' + esc(a.example) + '</span>' +
        '<span class="sc-card-p">' + svg('play') + (isScripted(a.id) ? 'Watch the full example run' : 'Watch an example run') + '</span>' +
      '</a>';
    }).join('');

    root.innerHTML = '<div class="sc-wrap sc-lib">' +
      '<div class="sc-lib-h"><div><p class="eyebrow">' + esc(meta.gridEyebrow || 'the full roster') + '</p>' +
      '<h3 class="sc-h3">' + (meta.gridH3 || '') + '</h3></div>' +
      '<span class="sc-label"><i></i>' + esc(meta.label || 'Example runs') + '</span></div>' +
      '<div class="sc-fcs" role="group" aria-label="Filter agents by department">' + chips + '</div>' +
      '<div class="sc-grid collapsed">' + cards + '</div>' +
      '<button type="button" class="sc-more">Show all ' + M.agents.length + ' agents' + svg('chev') + '</button>' +
      '<p class="sc-lib-note">' + esc(meta.gridNote || '') + '</p></div>';

    var grid = $('.sc-grid', root), more = $('.sc-more', root);
    markStatus($$('[data-st]', grid));

    $('.sc-fcs', root).addEventListener('click', function (e) {
      var b = e.target.closest('.sc-fc'); if (!b) return;
      var f = b.dataset.f;
      $$('.sc-fc', root).forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
      $$('.sc-card', grid).forEach(function (c) { c.hidden = f !== 'all' && c.dataset.dept !== f; });
      grid.classList.toggle('collapsed', f === 'all' && !grid.dataset.open);
      more.hidden = f !== 'all' || !!grid.dataset.open;
      observeCards(root);
    });
    more.addEventListener('click', function () {
      grid.dataset.open = '1';
      grid.classList.remove('collapsed');
      more.hidden = true;
      observeCards(root);
    });
    grid.addEventListener('click', function (e) {
      var c = e.target.closest('.sc-card'); if (!c) return;
      e.preventDefault();
      if (!R.win) return;
      S.auto = false;
      var target = R.stage || R.win;
      var top = target.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
      play(c.dataset.id);
    });
    observeCards(root);
  }

  var cardIO = null;
  function observeCards(root) {
    var cards = $$('.sc-card:not(.in)', root);
    if (reduce || !('IntersectionObserver' in window)) { cards.forEach(function (c) { c.classList.add('in'); }); return; }
    if (!cardIO) {
      cardIO = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); cardIO.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    }
    cards.forEach(function (c) { cardIO.observe(c); });
  }

  /* ---------- status pills that cycle (only the ones on screen) ---------- */
  function markStatus(nodes) {
    nodes.forEach(function (n) {
      var a = M.byId[n.dataset.st];
      if (!a) return;
      var i = +n.dataset.i || 0;
      n.classList.toggle('wait', /waiting/i.test(a.status[i]));
      n.classList.add('live');
    });
  }
  function startStatusCycle() {
    if (reduce) return;
    setInterval(function () {
      if (reduce || document.hidden) return;
      var vh = window.innerHeight;
      var vis = $$('.sc-root [data-st]').filter(function (n) {
        if (!n.offsetParent) return false;
        var r = n.getBoundingClientRect();
        return r.bottom > 0 && r.top < vh;
      });
      if (!vis.length) return;
      for (var k = 0; k < Math.min(3, vis.length); k++) {
        var n = vis[Math.floor(Math.random() * vis.length)];
        advance(n);
      }
    }, 1300);
  }
  function advance(n) {
    var a = M.byId[n.dataset.st];
    if (!a || n.classList.contains('sw')) return;
    var i = ((+n.dataset.i || 0) + 1) % a.status.length;
    n.classList.add('sw');
    setTimeout(function () {
      n.dataset.i = i;
      var txt = a.status[i];
      n.textContent = /waiting/i.test(txt) ? txt + '…' : txt;
      n.classList.toggle('wait', /waiting/i.test(txt));
      n.classList.remove('sw');
    }, 200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
