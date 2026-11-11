/* Headcount v2 workflows (LEAD): three animated SVG workflow loops (ROAS Autopilot, Viral Reel Cloner,
   Reddit Buying Signals) with a dot that walks the route and lights each step, plus the hand-off network
   (Company Brain feeds agents, agents hand off, everything logs to the Growth Ledger, Monday Standup reports). */
(function () {
  'use strict';
  var HC = window.HC, D = document;
  if (!HC) return;
  var RM = HC.RM;

  function pill(cx, cy, label, n, step, w) {
    w = w || Math.round(label.length * 6.15 + 36);
    var x0 = cx - w / 2;
    return '<g data-on="' + step + '"><rect class="n-r" x="' + x0 + '" y="' + (cy - 14) + '" width="' + w + '" height="28" rx="14"/>' +
      '<circle class="n-c" cx="' + (x0 + 14) + '" cy="' + cy + '" r="8.5"/><text class="n-n" x="' + (x0 + 14) + '" y="' + (cy + 3.4) + '" text-anchor="middle">' + n + '</text>' +
      '<text class="n-t" x="' + (x0 + 28) + '" y="' + (cy + 4) + '">' + label + '</text></g>';
  }
  var DOT = '<path class="f-trail"/><circle class="f-halo" r="10"/><circle class="f-dot" r="4"/>';

  /* ---------- A: ROAS Autopilot, a daily loop ---------- */
  var A_ROUTE = 'M180 40 A110 110 0 0 1 180 260 A110 110 0 0 1 180 40';
  var A = {
    dur: 12500,
    steps: [
      ['Pull numbers', 'Reads yesterday\'s spend and sales from your Meta account.'],
      ['Judge 14 ads', 'Kill, hold or scale each ad by written rules. No mood, no guesswork.'],
      ['Ask your yes', '"4 changes need your yes." You reply with the numbers you approve.'],
      ['Apply + log', 'Makes only the approved changes, then writes them to the Growth Ledger.'],
      ['Order new ads', 'Ads getting tired? It asks Winner Remixer for new versions before sales drop.']
    ],
    svg: function () {
      var pts = [[180, 40], [284.6, 116], [244.7, 239], [115.3, 239], [75.4, 116]];
      var nodes = pts.map(function (p, i) { return pill(p[0], p[1], A.steps[i][0], i + 1, i); }).join('');
      return '<svg viewBox="0 0 360 300" role="img" aria-label="ROAS Autopilot daily loop: pull numbers, judge ads, ask your yes, apply and log, order fresh ads.">' +
        '<defs><radialGradient id="wfa-g"><stop offset="0" stop-color="#c6ff3d" stop-opacity=".16"/><stop offset="1" stop-color="#c6ff3d" stop-opacity="0"/></radialGradient></defs>' +
        '<path class="f-base f-route" d="' + A_ROUTE + '"/>' +
        '<circle cx="180" cy="150" r="92" fill="url(#wfa-g)"/>' +
        '<circle cx="180" cy="150" r="55" fill="#0d0f12" stroke="rgba(255,255,255,.09)"/>' +
        '<text class="c-k" x="180" y="126" text-anchor="middle">ROAS TODAY</text>' +
        '<text class="c-big" x="180" y="161" text-anchor="middle" style="font-size:34px">2.65</text>' +
        '<text class="c-k" x="180" y="178" text-anchor="middle">TARGET 2.50</text>' +
        '<text class="c-acc" x="180" y="193" text-anchor="middle">▲ from 2.31</text>' +
        nodes + DOT.replace('class="f-trail"', 'class="f-trail" d="' + A_ROUTE + '"') + '</svg>';
    },
    marks: function (path, L) { return [0, L * 0.2, L * 0.4, L * 0.6, L * 0.8]; }
  };

  /* ---------- B: Viral Reel Cloner, a weekly pipeline ---------- */
  var B_ROUTE = 'M40 126 H334 Q348 126 348 140 V150 Q348 164 334 164 H180 V274 H40 Q20 274 20 254 V146 Q20 126 40 126';
  var B = {
    dur: 13000,
    steps: [
      ['Scan 30 accounts', 'Pulls the latest reels from every account on your watchlist.'],
      ['Spot outliers', 'Flags reels that got 3x or more their account\'s normal views.'],
      ['Say why it won', 'One line on the mechanism: the hook, the structure, the payoff.'],
      ['Write 3 remakes', 'Same idea, your brand, your words. Never their footage or audio.'],
      ['Track on day 7', 'Did it work for you too? Keep it, tweak it or retire it.']
    ],
    svg: function () {
      var mult = ['0.8x', '1.3x', '12.6x', '0.9x', '3.4x'], hot = { 2: 1, 4: 1 }, th = '';
      [26, 90, 154, 218, 282].forEach(function (x, i) {
        th += '<g class="thumb"' + (hot[i] ? ' data-from="1"' : '') + '><rect class="tb" x="' + x + '" y="14" width="52" height="80" rx="9"/>' +
          '<path class="pl" d="M' + (x + 21) + ' 45 l12 9 -12 9z"/>' +
          '<rect x="' + (x + 8) + '" y="80" width="' + (12 + (i * 7) % 26) + '" height="3" rx="1.5" fill="rgba(255,255,255,.18)"/>' +
          '<text class="tx" x="' + (x + 26) + '" y="111" text-anchor="middle">' + mult[i] + '</text></g>';
      });
      var why = '<g data-on="2"><rect class="n-r" x="50" y="142" width="260" height="44" rx="14"/><circle class="n-c" cx="64" cy="164" r="8.5"/><text class="n-n" x="64" y="167.4" text-anchor="middle">3</text>' +
        '<text class="n-t" x="80" y="160">Why it won</text><text class="n-s" x="80" y="176">POV hook · label close-up · loop end</text></g>';
      var lines = '<g data-on="3"><path class="f-line" d="M180 186 C180 198 66 196 66 208"/><path class="f-line" d="M180 186 C180 198 294 196 294 208"/></g>' +
        '<g data-on="4"><path class="f-line" d="M66 236 Q66 274 95 274"/><path class="f-line" d="M294 236 Q294 274 265 274"/></g>';
      var rem = '<g data-on="3">' + ['A', 'B', 'C'].map(function (l, i) {
        var cx = [66, 180, 294][i];
        return '<rect class="n-r" x="' + (cx - 48) + '" y="208" width="96" height="28" rx="14"/><text class="n-t" x="' + cx + '" y="226" text-anchor="middle">Remake ' + l + '</text>';
      }).join('') + '</g>';
      return '<svg viewBox="0 0 360 300" role="img" aria-label="Viral Reel Cloner pipeline: scan accounts, spot outlier reels, explain why each won, write 3 remakes, track results on day 7.">' +
        '<path class="f-base f-route" d="' + B_ROUTE + '"/>' + th + lines + why + rem +
        pill(180, 274, 'Day 7: 4.2x for you', 5, 4, 170) +
        DOT.replace('class="f-trail"', 'class="f-trail" d="' + B_ROUTE + '"') + '</svg>';
    },
    marks: function (path, L) {
      return [0,
        firstPos(path, L, function (p) { return p.x >= 150 && p.y < 130; }),
        firstPos(path, L, function (p) { return p.y >= 152 && p.x <= 312; }),
        firstPos(path, L, function (p) { return p.y >= 204 && p.x > 170 && p.x < 190; }),
        firstPos(path, L, function (p) { return p.y >= 258 && p.x > 170 && p.x < 190; })];
    }
  };

  /* ---------- C: Reddit Buying Signals, find to reply ---------- */
  var C_ROUTE = 'M14 20 V280 Q14 292 26 292 H334 Q346 292 346 280 V20 Q346 8 334 8 H26 Q14 8 14 20';
  var C = {
    dur: 12000,
    steps: [
      ['Find buying questions', 'Searches your subreddits every morning for people asking what to buy.'],
      ['Check intent + rules', 'Skips people who are only venting, and reads every subreddit\'s rules first.'],
      ['Draft an honest reply', 'Answers the question first, says you work there, one link at most.'],
      ['You post it', 'Nothing goes up without you. One real person, one account.'],
      ['Track results', 'Visits and signups per reply, so tomorrow\'s drafts get better.']
    ],
    svg: function () {
      var stack = '<g data-on="0">' +
        '<rect x="48" y="16" width="264" height="50" rx="10" fill="#111317" stroke="rgba(255,255,255,.08)"/>' +
        '<rect x="38" y="25" width="284" height="52" rx="10" fill="#14171c" stroke="rgba(255,255,255,.1)"/>' +
        '<rect x="28" y="36" width="304" height="58" rx="11" fill="#14171c"/><rect class="n-r" x="28" y="36" width="304" height="58" rx="11"/>' +
        '<text class="th-s" x="40" y="55">r/ecommerce · 2h · 14 comments</text>' +
        '<text class="th-t" x="40" y="77">Best alternative to CrateHub? Keeps double selling</text>' +
        '</g>' +
        '<rect x="266" y="44" width="56" height="17" rx="8.5" fill="rgba(198,255,61,.14)" stroke="rgba(198,255,61,.5)"/><text class="bdg" x="294" y="55.6" text-anchor="middle" fill="#c6ff3d">HOT 78</text>' +
        '<text class="n-s" x="28" y="112">6 threads scanned · 3 hot · 1 held (venting)</text>';
      var chips = '<g data-on="1">' + [['Asking to buy', 28, 104], ['Rules read', 140, 86], ['Not venting', 234, 98]].map(function (c) {
        return '<rect class="n-r" x="' + c[1] + '" y="122" width="' + c[2] + '" height="24" rx="12"/><text class="n-t" x="' + (c[1] + c[2] / 2) + '" y="138" text-anchor="middle" style="font-size:10.5px">✓ ' + c[0] + '</text>';
      }).join('') + '</g>';
      var draft = '<g data-on="2"><rect class="n-r" x="28" y="156" width="304" height="80" rx="11"/>' +
        '<text class="c-k" x="40" y="174">DRAFT REPLY · ANSWERS FIRST</text>' +
        '<rect class="ln-g" x="40" y="183" width="270" height="5" rx="2.5"/><rect class="ln-g" x="40" y="194" width="248" height="5" rx="2.5"/><rect class="ln-g" x="40" y="205" width="196" height="5" rx="2.5"/>' +
        '<text class="disc" x="40" y="226">Full disclosure: I work on Brightbin.</text></g>';
      var ticks = [65, 134, 196, 262].map(function (y) { return '<path class="f-line" d="M14 ' + y + ' H28"/>'; }).join('');
      return '<svg viewBox="0 0 360 300" role="img" aria-label="Reddit Buying Signals: find buying questions, check intent and rules, draft an honest disclosed reply, you post it, track visits and signups.">' +
        '<path class="f-base f-route" d="' + C_ROUTE + '"/>' + ticks + stack + chips + draft +
        pill(98, 262, 'You post it', 4, 3, 140) + pill(256, 262, '41 visits · 3 signups', 5, 4, 152) +
        DOT.replace('class="f-trail"', 'class="f-trail" d="' + C_ROUTE + '"') + '</svg>';
    },
    marks: function (path, L) {
      return [0,
        firstPos(path, L, function (p) { return p.x < 20 && p.y >= 112; }),
        firstPos(path, L, function (p) { return p.x < 20 && p.y >= 152; }),
        firstPos(path, L, function (p) { return p.x < 20 && p.y >= 246; }),
        firstPos(path, L, function (p) { return p.y > 288 && p.x >= 176; })];
    }
  };

  function firstPos(path, L, test) {
    for (var s = 0; s <= L; s += 2) { if (test(path.getPointAtLength(s))) return s; }
    return L;
  }

  /* ---------- runner ---------- */
  var live = [];
  function mount(card, def) {
    var holder = card.querySelector('.wf-svg');
    holder.innerHTML = def.svg();
    var svg = holder.querySelector('svg'), path = svg.querySelector('.f-route');
    var L = path.getTotalLength(), TR = 64;
    var trail = svg.querySelector('.f-trail'), dot = svg.querySelector('.f-dot'), halo = svg.querySelector('.f-halo');
    trail.setAttribute('stroke-dasharray', TR + ' ' + (L + TR));
    var marks = def.marks(path, L);
    var groups = svg.querySelectorAll('[data-on],[data-from]');
    var sn = card.querySelector('.sn'), sd = card.querySelector('.sd');
    var st = { el: card, on: false, t: 0, step: -1, L: L };
    function setStep(i) {
      if (st.step === i) return; st.step = i;
      groups.forEach(function (g) {
        var on = g.hasAttribute('data-on') ? +g.getAttribute('data-on') === i : i >= +g.getAttribute('data-from');
        g.classList.toggle('on', on);
      });
      sn.textContent = 'STEP ' + (i + 1) + ' OF ' + def.steps.length + ' · ' + def.steps[i][0].toUpperCase();
      sd.textContent = def.steps[i][1];
    }
    st.draw = function (dt) {
      st.t = (st.t + dt) % def.dur;
      var pos = st.t / def.dur * L, pt = path.getPointAtLength(pos);
      dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
      halo.setAttribute('cx', pt.x); halo.setAttribute('cy', pt.y);
      trail.setAttribute('stroke-dashoffset', TR - pos);
      var i = 0; for (var k = marks.length - 1; k >= 0; k--) { if (pos >= marks[k]) { i = k; break; } }
      setStep(i);
    };
    st.draw(0);
    if (RM) { trail.style.display = 'none'; return; }
    live.push(st);
    HC.onView(card, function (v) { st.on = v; kick(); }, { threshold: 0.2 });
  }
  var raf = 0, last = 0;
  function frame(t) {
    var dt = last ? Math.min(64, t - last) : 16; last = t;
    var any = false;
    live.forEach(function (s) { if (s.on) { any = true; s.draw(dt); } });
    if (any && !D.hidden) raf = requestAnimationFrame(frame); else { raf = 0; last = 0; }
  }
  function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  D.addEventListener('visibilitychange', function () { if (!D.hidden) kick(); });

  var defs = { roas: A, reels: B, reddit: C };
  D.querySelectorAll('[data-wf]').forEach(function (card) { var d = defs[card.getAttribute('data-wf')]; if (d) mount(card, d); });

  /* ---------- hand-off network ---------- */
  var net = D.getElementById('net');
  if (!net) return;
  var LBL = {
    brain: ['Company Brain', 'read by every agent'], reddit: ['Reddit Buying Signals'], comp: ['Competitor Watch'], viral: ['Viral Reel Cloner'], winback: ['Winback Analyst'],
    angle: ['Angle Miner'], social: ['Social Autopilot'], flow: ['Flow Architect'], stat: ['Static Ad Factory'], roas: ['ROAS Autopilot'], remix: ['Winner Remixer'],
    ledger: ['Growth Ledger', 'every action'], standup: ['Monday Standup', 'one page, 7 am Monday'], you: ['You', 'approve + decide']
  };
  var DOTC = { reddit: '#6ea8ff', comp: '#b58cff', viral: '#ff7ab6', winback: '#ffc65c', angle: '#c6ff3d', social: '#ff7ab6', flow: '#ffc65c', stat: '#c6ff3d', roas: '#c6ff3d', remix: '#c6ff3d' };

  function H(a, b) { var x1 = a.x + a.w / 2, x2 = b.x - b.w / 2, m = (x1 + x2) / 2; return 'M' + x1 + ' ' + a.y + ' C' + m + ' ' + a.y + ' ' + m + ' ' + b.y + ' ' + x2 + ' ' + b.y; }
  function V(a, b) { var y1 = a.y + a.h / 2, y2 = b.y - b.h / 2, m = (y1 + y2) / 2; return 'M' + a.x + ' ' + y1 + ' C' + a.x + ' ' + m + ' ' + b.x + ' ' + m + ' ' + b.x + ' ' + y2; }
  function node(id, n) {
    var l = LBL[id], x0 = n.x - n.w / 2, y0 = n.y - n.h / 2, cls = { brain: 1, ledger: 1, standup: 1, you: 1 }[id] ? id : 'ag';
    var s = '<g class="nd ' + cls + '"><rect x="' + x0 + '" y="' + y0 + '" width="' + n.w + '" height="' + n.h + '" rx="11"/>';
    if (cls === 'ag') {
      s += '<circle cx="' + (x0 + 15) + '" cy="' + n.y + '" r="4" fill="' + (DOTC[id] || '#c6ff3d') + '"/><text x="' + (x0 + 27) + '" y="' + (n.y + 4.3) + '">' + l[0] + '</text>';
    } else if (id === 'ledger' && n.tall) {
      s += '<text x="' + n.x + '" y="' + (n.y - 6) + '" text-anchor="middle" style="font-weight:600">Growth</text><text x="' + n.x + '" y="' + (n.y + 10) + '" text-anchor="middle" style="font-weight:600">Ledger</text>' +
        '<text class="ns" x="' + n.x + '" y="' + (n.y + 28) + '" text-anchor="middle">every action</text>';
      for (var r = 0; r < 6; r++) s += '<rect x="' + (x0 + 16) + '" y="' + (n.y + 74 + r * 16) + '" width="' + (n.w - 32 - (r * 13) % 30) + '" height="5" rx="2.5" fill="rgba(255,198,92,.16)"/>';
      for (var q = 0; q < 4; q++) s += '<rect x="' + (x0 + 16) + '" y="' + (y0 + 96 + q * 16) + '" width="' + (n.w - 32 - (q * 11) % 26) + '" height="5" rx="2.5" fill="rgba(255,198,92,.12)"/>';
    } else {
      var ty = l[1] ? n.y - 3 : n.y + 4.5;
      s += '<text x="' + n.x + '" y="' + ty + '" text-anchor="middle" style="font-weight:600;font-size:13.5px">' + l[0] + '</text>';
      if (l[1]) s += '<text class="ns" x="' + n.x + '" y="' + (n.y + 14) + '" text-anchor="middle">' + l[1] + '</text>';
    }
    return s + '</g>';
  }
  function edge(d, kind) { return '<g class="' + (kind || 'e-hand') + '"><path class="e-base" d="' + d + '"/><path class="e-flow" d="' + d + '"/></g>'; }

  function desktop() {
    var w = 172, h = 40, N = {
      brain: { x: 95, y: 230, w: 150, h: 76 },
      reddit: { x: 318, y: 50, w: w, h: h }, comp: { x: 318, y: 140, w: w, h: h }, viral: { x: 318, y: 320, w: w, h: h }, winback: { x: 318, y: 410, w: w, h: h },
      angle: { x: 530, y: 50, w: w, h: h }, social: { x: 530, y: 320, w: w, h: h }, flow: { x: 530, y: 410, w: w, h: h },
      stat: { x: 742, y: 50, w: w, h: h }, roas: { x: 742, y: 140, w: w, h: h }, remix: { x: 742, y: 230, w: w, h: h },
      ledger: { x: 930, y: 230, w: 100, h: 420, tall: 1 },
      standup: { x: 1105, y: 170, w: 170, h: 64 }, you: { x: 1105, y: 318, w: 170, h: 56 }
    };
    var lanes = ['reddit', 'comp', 'remix', 'viral', 'winback'].map(function (id) { var n = N[id]; return edge('M' + (n.x + n.w / 2) + ' ' + n.y + ' H880', 'e-log'); }).join('');
    var brain = ['reddit', 'comp', 'viral', 'winback'].map(function (id) { return edge(H(N.brain, N[id]), 'e-brain'); }).join('');
    var hand = [H(N.reddit, N.angle), H(N.comp, N.angle), H(N.angle, N.stat), V(N.stat, N.roas), V(N.roas, N.remix), 'M828 238 C864 238 864 42 828 42',
      H(N.viral, N.social), H(N.winback, N.flow), H(N.social, N.remix), 'M980 170 H1020', V(N.standup, N.you)].map(function (d) { return edge(d); }).join('');
    var nodes = Object.keys(N).map(function (id) { return node(id, N[id]); }).join('');
    var dots = [50, 140, 230, 320, 410].map(function (y) { return '<circle class="pulse" cx="880" cy="' + y + '" r="3.5" fill="#ffc65c"/>'; }).join('');
    return '<svg class="d" viewBox="0 0 1200 460" role="img" aria-label="Hand-off network">' + lanes + brain + hand + nodes + dots +
      '<text class="net-lbl" x="95" y="290" text-anchor="middle">every agent reads it first</text>' +
      '<text class="net-lbl" x="876" y="452" text-anchor="end">logs flow in</text></svg>';
  }
  function mobile() {
    var w = 150, h = 38, L = 88, R = 272, N = {
      brain: { x: 180, y: 32, w: 230, h: 50 },
      reddit: { x: L, y: 112, w: w, h: h }, comp: { x: R, y: 112, w: w, h: h }, angle: { x: L, y: 182, w: w, h: h },
      stat: { x: L, y: 252, w: w, h: h }, viral: { x: R, y: 252, w: w, h: h }, roas: { x: L, y: 322, w: w, h: h }, social: { x: R, y: 322, w: w, h: h },
      remix: { x: L, y: 392, w: w, h: h }, winback: { x: R, y: 392, w: w, h: h }, flow: { x: R, y: 462, w: w, h: h },
      ledger: { x: 180, y: 548, w: 330, h: 56 }, standup: { x: 180, y: 630, w: 240, h: 54 }, you: { x: 180, y: 706, w: 200, h: 42 }
    };
    var brain = [V(N.brain, N.reddit), V(N.brain, N.comp)].map(function (d) { return edge(d, 'e-brain'); }).join('');
    var hand = [V(N.reddit, N.angle), 'M272 131 C272 182 200 182 163 182', V(N.angle, N.stat), V(N.stat, N.roas), V(N.roas, N.remix), 'M13 398 C0 398 0 246 13 246',
      V(N.viral, N.social), 'M197 322 C180 322 180 392 163 392', V(N.winback, N.flow), V(N.ledger, N.standup), V(N.standup, N.you)].map(function (d) { return edge(d); }).join('');
    var logs = ['M88 411 V520', 'M272 481 V520'].map(function (d) { return edge(d, 'e-log'); }).join('');
    var nodes = Object.keys(N).map(function (id) { return node(id, N[id]); }).join('');
    return '<svg class="m" viewBox="0 0 360 740" role="img" aria-label="Hand-off network">' + brain + logs + hand + nodes + '</svg>';
  }
  net.querySelector('.net-svg').innerHTML = desktop() + mobile();
  if (!RM) HC.onView(net, function (v) { net.classList.toggle('play', v); }, { threshold: 0.1 });
})();
