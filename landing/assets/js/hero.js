/* Headcount v2 hero (LEAD): the "headcount.live" panel. Agent cards cycle through status pills
   (Scanning, Working, Needs yes, Done) and type their example result lines; a log ticker streams;
   a phone (wide screens) or toast (phones) shows the approval step. Runs only while in view. */
(function () {
  'use strict';
  var HC = window.HC, D = document;
  var stage = D.getElementById('hero-stage');
  if (!HC || !stage) return;
  var RM = HC.RM, icon = HC.icon, wait = HC.wait;

  /* Example runs on a fictional brand. Shown with an "example runs" label in the panel. */
  var RUNS = [
    { n: 'ROAS Autopilot', ic: 'paid', s: ['Reading yesterday\'s spend', 'Judging 14 ads by your rules', '4 changes ready for you'], ask: 1, r: 'Paused 3 ads that spent ₹7,350 with zero sales' },
    { n: 'Static Ad Factory', ic: 'creative', s: ['Reading your website', 'Designing 20 ads', 'Checking brand rules'], r: '20 on-brand static ads ready for review' },
    { n: 'Viral Reel Cloner', ic: 'viral', s: ['Scanning 30 accounts', 'Scoring outlier reels', 'Writing 3 remakes'], r: 'Found a reel at 12.6x normal views. 3 remakes written' },
    { n: 'Reddit Buying Signals', ic: 'pipeline', s: ['Searching 5 subreddits', 'Reading each sub\'s rules', 'Drafting honest replies'], ask: 1, r: '3 people asking what to buy. Replies drafted' },
    { n: 'Google Ads Waste Killer', ic: 'paid', s: ['Reading search terms', 'Finding junk clicks', '37 negatives drafted'], ask: 1, r: '37 junk searches found, ₹11,200 a week leaking' },
    { n: 'Flow Architect', ic: 'lifecycle', s: ['Auditing your email flows', 'Building a winback flow', 'Sending test emails'], r: 'Missing winback flow built, ready to switch on' },
    { n: 'Reputation Guard', ic: 'social', s: ['Reading new reviews', 'Drafting replies', 'Flagging complaints'], r: '18 reviews answered. 2 complaints sent to you' },
    { n: 'DM Closer', ic: 'social', s: ['Reading comments', 'Matching "PRICE" keyword', 'Drafting DMs'], ask: 1, r: '41 buyers found in comments. DMs drafted' },
    { n: 'AI Visibility Tracker', ic: 'search', s: ['Asking 4 AI engines', 'Scoring 100 prompts', 'Comparing rivals'], r: 'ChatGPT now names you in 4 of 20 answers' },
    { n: 'Competitor Watch', ic: 'intel', s: ['Checking 6 rivals', 'Comparing their pages', 'Writing your brief'], r: 'A rival started a 30% off sale at 9:14 am' },
    { n: 'SEO Content Pipeline', ic: 'search', s: ['Finding decaying pages', 'Rewriting weak sections', 'Checking every fact'], r: '6 old blog posts refreshed, ready to publish' },
    { n: 'Monday Standup', ic: 'intel', s: ['Reading 12 agent logs', 'Finding what moved', 'Writing one page'], r: 'Your Monday page is ready: 4 numbers moved' }
  ];
  var DEPTS = [['Paid Ads', 3, 'paid'], ['Creative Studio', 5, 'creative'], ['Viral Content', 5, 'viral'], ['Social Presence', 5, 'social'], ['SEO + AI Search', 7, 'search'], ['Pipeline + Sales', 6, 'pipeline'], ['Creators', 3, 'creators'], ['Lifecycle', 3, 'lifecycle'], ['Intel + Ops', 3, 'intel'], ['Core', 2, 'core']];
  var DEPT_OF = { paid: 0, creative: 1, viral: 2, social: 3, search: 4, pipeline: 5, creators: 6, lifecycle: 7, intel: 8, core: 9 };
  var LOG = [
    ['roas-autopilot', 'judged 14 ads, 3 over the kill line'],
    ['ad-account-watchdog', 'no surprise changes in the last hour'],
    ['static-ad-factory', '20 ads rendered, 2 failed brand check, redone'],
    ['reddit-buying-signals', 'skipped 1 thread: person was venting'],
    ['google-ads-waste-killer', '37 negatives drafted, waiting for approval'],
    ['flow-architect', 'winback flow tested on 3 inboxes'],
    ['competitor-watch', 'new price page spotted on a rival site'],
    ['viral-reel-cloner', 'similarity check passed on all 3 remakes'],
    ['growth-ledger', '23 actions logged today']
  ];
  var CHAT = [
    ['u', 'Run roas-autopilot daily loop'],
    ['t'],
    ['a', 'Morning. I judged 14 ads against your rules.'],
    ['card'],
    ['u', 'Yes to all 4'],
    ['t'],
    ['a', '<span class="ok">✓ Done.</span> Logged to Growth Ledger. Next check 08:00 tomorrow.']
  ];
  var TOASTS = [
    ['ROAS Autopilot', 'Raise the winning campaign budget ₹5,200 to ₹6,240 a day (+20%)?'],
    ['Google Ads Waste Killer', 'Add 37 negative keywords to stop junk clicks?'],
    ['Reddit Buying Signals', 'Post this reply in r/ecommerce? It says you work there.']
  ];

  /* ---------- build ---------- */
  var mark = '<svg class="ph-av" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="9" fill="#101216" stroke="#3a3f48"/><g stroke="#f4f2ec" stroke-width="2.2" stroke-linecap="round"><path d="M9.5 9v14M13.5 9v14M17.5 9v14M21.5 9v14"/></g><path d="M6.5 21 25 11" stroke="#c6ff3d" stroke-width="2.6" stroke-linecap="round"/></svg>';
  var side = DEPTS.map(function (d, i) { return '<div class="dep" data-d="' + i + '">' + icon(d[2]) + '<span>' + d[0] + '</span><em>' + d[1] + '</em></div>'; }).join('');
  var slots = '';
  for (var k = 0; k < 6; k++) slots += '<div class="ag"></div>';
  stage.innerHTML =
    '<div class="laptop"><div class="bezel"><div class="screen">' +
      '<div class="win-bar"><i></i><i></i><i></i><span class="win-title">headcount.live</span><span class="grow"></span>' +
        '<span class="hp-ex">example runs<span class="lg"> · fictional brand</span></span><span class="pill live hp-count"><b class="hp-run">9</b>&nbsp;running</span></div>' +
      '<div class="hp-body">' +
        '<aside class="hp-side" aria-hidden="true"><h4>Departments</h4>' + side + '<div class="side-foot">Brain: <b>COMPANY.md ✓</b><br>Ledger: <b>on</b></div></aside>' +
        '<div class="hp-main">' +
          '<div class="hp-stats"><div class="hp-stat"><span>Running</span><b class="hp-run">9</b></div><div class="hp-stat"><span>Need yes</span><b class="hp-ask">3</b></div><div class="hp-stat"><span>Done today</span><b class="hp-done">21</b></div></div>' +
          '<div class="hp-grid">' + slots + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="hp-log" aria-hidden="true"></div>' +
    '</div></div><div class="lap-base"></div></div>' +
    '<div class="phone" aria-hidden="true"><div class="ph-screen"><div class="ph-notch"></div>' +
      '<div class="ph-status"><span>08:02</span><span>5G</span></div>' +
      '<div class="ph-head">' + mark + '<div><b>ROAS Autopilot</b><span>● Headcount agent</span></div></div>' +
      '<div class="ph-msgs"></div><div class="ph-input">Reply to your agent<i></i></div>' +
    '</div></div>' +
    '<div class="hp-toast hide" aria-hidden="true"><div class="tt-top"><span class="tt-a"></span><span class="st ask">Needs yes</span></div><div class="tt-q"></div>' +
      '<div class="tt-btns"><span class="y">Approve</span><span>Not now</span></div><div class="tt-done">✓ Approved. Logged to Growth Ledger.</div></div>';

  var cards = stage.querySelectorAll('.ag'), deps = stage.querySelectorAll('.dep');
  var runEls = stage.querySelectorAll('.hp-run'), askEl = stage.querySelector('.hp-ask'), doneEl = stage.querySelector('.hp-done');
  var logEl = stage.querySelector('.hp-log'), msgs = stage.querySelector('.ph-msgs'), toast = stage.querySelector('.hp-toast');
  var sc = HC.scope(stage, 0.05);
  var stats = { run: 9, ask: 3, done: 21 };
  function setStats() { runEls.forEach(function (e) { e.textContent = stats.run; }); askEl.textContent = stats.ask; doneEl.textContent = stats.done; }

  var queue = RUNS.map(function (_, i) { return i; }), onScreen = [];
  function nextRun() {
    for (var i = 0; i < queue.length; i++) {
      var id = queue[i];
      if (onScreen.indexOf(id) === -1) { queue.splice(i, 1); queue.push(id); return id; }
    }
    return queue[0];
  }
  function paintDeps() {
    var live = {};
    onScreen.forEach(function (id) { if (id != null) live[DEPT_OF[RUNS[id].ic]] = 1; });
    deps.forEach(function (d) { d.classList.toggle('on', !!live[d.getAttribute('data-d')]); });
  }
  function cardHTML(r) {
    return '<div class="ag-top"><span class="ag-ic">' + icon(r.ic) + '</span><div class="ag-meta"><div class="ag-name">' + r.n + '</div><div class="ag-step"></div></div><span class="st scan">Scanning</span></div>' +
      '<div class="ag-res"><span class="sk"></span><span class="sk s2"></span></div><div class="ag-bar"><i></i></div>';
  }
  function setPill(c, cls, txt) { var p = c.querySelector('.st'); p.className = 'st ' + cls; p.textContent = txt; }

  function finalCard(c, r) {
    c.innerHTML = cardHTML(r);
    c.classList.remove('out');
    c.classList.add(r.ask ? 'is-ask' : 'is-done');
    c.querySelector('.ag-step').textContent = r.s[2];
    setPill(c, r.ask ? 'ask' : 'done', r.ask ? 'Needs yes' : 'Done');
    c.querySelector('.ag-res').innerHTML = '<span class="arw">→</span>' + r.r;
    c.querySelector('.ag-bar i').style.width = '100%';
  }

  if (RM) {
    cards.forEach(function (c, i) { onScreen[i] = i; finalCard(c, RUNS[i]); });
    paintDeps();
    logEl.innerHTML = LOG.slice(0, 3).map(function (l, i) { return '<div class="ln"><span class="t">08:0' + i + '</span><span class="a">' + l[0] + '</span><span class="x">' + l[1] + '</span></div>'; }).join('');
    msgs.innerHTML = '<div class="pm u">Run roas-autopilot daily loop</div>' + cardMsg() + '<div class="pm u">Yes to all 4</div>';
    toast.classList.remove('hide'); fillToast(0);
    return;
  }

  function runSlot(i, delay, pre) {
    var c = cards[i];
    var id = nextRun(); onScreen[i] = id; paintDeps();
    var r = RUNS[id];
    if (pre) {
      finalCard(c, r);
      return wait(sc, pre).then(function () { c.classList.add('swap'); return wait(sc, 320); }).then(function () { return runSlot(i); });
    }
    c.className = 'ag' + (delay == null ? ' swap' : '');
    c.innerHTML = cardHTML(r);
    var stepEl = c.querySelector('.ag-step'), bar = c.querySelector('.ag-bar i'), res = c.querySelector('.ag-res');
    stepEl.textContent = r.s[0];
    return wait(sc, delay == null ? 40 : delay).then(function () {
      c.classList.remove('swap');
      bar.style.width = '30%';
      return wait(sc, 1500);
    }).then(function () {
      setPill(c, 'work', 'Working'); stepEl.textContent = r.s[1]; bar.style.width = '78%';
      return wait(sc, 1900);
    }).then(function () {
      stepEl.textContent = r.s[2]; bar.style.width = '100%';
      if (r.ask) { setPill(c, 'ask', 'Needs yes'); c.classList.add('is-ask'); stats.ask++; }
      else { setPill(c, 'done', 'Done'); c.classList.add('is-done'); stats.done++; }
      setStats();
      res.innerHTML = '<span class="arw">→</span><span class="tx"></span><span class="caret"></span>';
      return HC.type(res.querySelector('.tx'), r.r, sc, 24);
    }).then(function () {
      var cr = res.querySelector('.caret'); if (cr) cr.remove();
      return wait(sc, r.ask ? 3800 : 3000);
    }).then(function () {
      if (r.ask) { stats.ask = Math.max(2, stats.ask - 1); stats.done++; setStats(); }
      c.classList.add('swap');
      return wait(sc, 320);
    }).then(function () { return runSlot(i); });
  }

  /* log ticker */
  var clock = 8 * 3600 + 2 * 60 + 14, li = 0;
  function hms(t) { var h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function logLine() {
    var l = LOG[li++ % LOG.length]; clock += 7 + Math.floor(Math.random() * 40);
    var d = D.createElement('div'); d.className = 'ln';
    d.innerHTML = '<span class="t">' + hms(clock) + '</span><span class="a">' + l[0] + '</span><span class="x">' + l[1] + '</span>';
    logEl.insertBefore(d, logEl.firstChild);
    while (logEl.children.length > 3) logEl.removeChild(logEl.lastChild);
    if (Math.random() < 0.5) { stats.run = 8 + Math.floor(Math.random() * 4); setStats(); }
  }
  function logLoop() { logLine(); return wait(sc, 2300).then(logLoop); }

  /* phone chat (wide screens) */
  function cardMsg() {
    return '<div class="pm a card"><h5>4 changes need your yes</h5><ol>' +
      '<li><em>1</em>Pause "Gift box" ad: ₹7,350 spent, 0 sales</li>' +
      '<li><em>2</em>Pause "Founder story" video: ROAS 0.53</li>' +
      '<li><em>3</em>Pause "Sleep ritual" test: 0 sales</li>' +
      '<li><em>4</em>Raise winner budget +20%: ROAS 3.03</li></ol></div>';
  }
  function addMsg(m) {
    var html;
    if (m[0] === 't') html = '<div class="typing"><i></i><i></i><i></i></div>';
    else if (m[0] === 'card') html = cardMsg();
    else html = '<div class="pm ' + m[0] + '">' + m[1] + '</div>';
    msgs.insertAdjacentHTML('beforeend', html);
    while (msgs.children.length > 6) msgs.removeChild(msgs.firstChild);
    return msgs.lastChild;
  }
  function chatLoop() {
    msgs.innerHTML = '';
    var p = wait(sc, 600);
    CHAT.forEach(function (m) {
      p = p.then(function () {
        var el = addMsg(m);
        if (m[0] === 't') return wait(sc, 1000).then(function () { el.remove(); });
        return wait(sc, m[0] === 'card' ? 2600 : 1300);
      });
    });
    return p.then(function () { return wait(sc, 4200); }).then(chatLoop);
  }

  /* approval toast (phones, tablets) */
  function fillToast(i) {
    var t = TOASTS[i % TOASTS.length];
    toast.querySelector('.tt-a').textContent = t[0];
    toast.querySelector('.tt-q').textContent = t[1];
    toast.classList.remove('done');
    var pl = toast.querySelector('.tt-top .st'); pl.className = 'st ask'; pl.textContent = 'Needs yes';
  }
  var ti = 0;
  function toastLoop() {
    fillToast(ti++);
    var y = toast.querySelector('.y');
    return wait(sc, 400).then(function () { toast.classList.remove('hide'); return wait(sc, 3200); })
      .then(function () { y.classList.add('press'); return wait(sc, 260); })
      .then(function () { y.classList.remove('press'); toast.classList.add('done'); var pl = toast.querySelector('.tt-top .st'); pl.className = 'st done'; pl.textContent = 'Approved'; return wait(sc, 1900); })
      .then(function () { toast.classList.add('hide'); return wait(sc, 900); })
      .then(toastLoop);
  }

  var wide = matchMedia('(min-width:1100px)');
  setStats();
  cards.forEach(function (_, i) { if (i % 2 === 0) runSlot(i, 0, 2600 + i * 1100); else runSlot(i, 200 + i * 700); });
  logLoop();
  if (wide.matches) chatLoop(); else toastLoop();
  var started = wide.matches;
  wide.addEventListener && wide.addEventListener('change', function (e) { if (e.matches && !started) { started = true; chatLoop(); } });

  /* gentle tilt + parallax, wide screens only */
  var lap = stage.querySelector('.laptop'), phone = stage.querySelector('.phone'), ticking = false, heroOn = true;
  HC.onView(stage, function (v) { heroOn = v; }, { threshold: 0 });
  function par() {
    ticking = false;
    if (!heroOn || window.innerWidth < 1000) { lap.style.transform = ''; phone.style.transform = ''; return; }
    var p = Math.max(0, Math.min(1, window.scrollY / (window.innerHeight * 0.7)));
    lap.style.transform = 'rotateX(' + (9 * (1 - p)).toFixed(2) + 'deg) scale(' + (0.955 + 0.045 * p).toFixed(3) + ')';
    phone.style.transform = 'translateY(' + (-46 * p).toFixed(1) + 'px)';
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(par); } }, { passive: true });
  window.addEventListener('resize', par);
  par();
})();
