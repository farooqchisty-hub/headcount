/*
  Headcount v2 logos layer: assets/js/logos.js (+ assets/css/logos.css)
  Data: assets/data/logos.json. Marks: assets/logos/<id>.svg and the symbol sprite assets/logos/sprite.svg.
  The sprite is fetched once and injected hidden at the top of <body>; every mark paints with currentColor.

  Mount points (put them anywhere, this script fills them):
    <div data-logos="runtimes"></div>                        6 large tiles, eyebrow "Works inside"
    <div data-logos="runtimes" data-mode="compact"></div>    one-row dock for the hero
    <div data-logos="platforms"></div>                       3-row infinite marquee, eyebrow "Connects to"
    <div data-logos="models"></div>                          marquee, "Use your choice of models", plus footnote
    <div data-logos="platforms" data-mode="grid"></div>      static grid with a count headline
    <div data-logos="platforms models" data-mode="grid"></div>  both groups under one headline

  Options (data attributes on the mount):
    data-mode      tiles | compact | marquee | grid   (default: runtimes = tiles, others = marquee)
    data-rows      1 to 3 marquee rows                (default: platforms 3, models 1 from 1040px wide, else 2)
    data-label     eyebrow text override, or "none" to hide it
    data-title     optional headline (grid default: "30 platforms, 12 AI models", counted from the data)
    data-sub       sub line override, or "none"       (sub line only shows in grid mode)
    data-footnote  on | off                           (default: on for models and grid, off elsewhere)
    data-align     center (default) | left
    data-speed     marquee speed in px per second     (default 34, 28 on narrow screens)

  JS API (window.HCLogos):
    HCLogos.ready             Promise of the logos.json data, resolved after the sprite is in the page
    HCLogos.renderAll(root)   render every [data-logos] inside root (runs automatically on load)
    HCLogos.render(el)        render one mount
    HCLogos.icon(id, cls)     markup string: <svg class="hc-ico"><use href="#hc-logo-ID"/></svg>
    HCLogos.vars(id)          inline style string with the brand tint vars (--c, --c-bg, --c-line, --c-glow)
    HCLogos.get(id)           one entry from logos.json

  Notes: heights are reserved in CSS so nothing shifts when this runs. Marquees pause on hover and when
  off screen. prefers-reduced-motion shows every logo once in a static wrap. Copy rule: groups are
  labelled "Works inside", "Connects to", "Use your choice of models". Never "partners" or "trusted by".
*/
(function () {
  'use strict';

  var script = document.currentScript;
  var ASSETS = script && script.src ? new URL('..', script.src).href : new URL('assets/', location.href).href;
  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var DATA = null;
  var byId = {};
  var marquees = [];
  var io = null;
  /* models: one long row on wide screens (12 logos would repeat in view), two rows below 1040px */
  var mqWide = window.matchMedia ? window.matchMedia('(min-width: 1040px)') : { matches: true };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function rgba(hex, a) {
    var h = hex.replace('#', '');
    return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16) + ',' + a + ')';
  }
  function vars(l) {
    if (typeof l === 'string') l = byId[l] || {};
    var c = (l.display || '#F4F2EC').toUpperCase();
    var neutral = c === '#F4F2EC';
    return '--c:' + c +
      ';--c-bg:' + (neutral ? 'rgba(255,255,255,.055)' : rgba(c, 0.13)) +
      ';--c-line:' + (neutral ? 'rgba(255,255,255,.16)' : rgba(c, 0.32)) +
      ';--c-glow:' + rgba(c, neutral ? 0.22 : 0.5);
  }
  function icon(id, cls) {
    return '<svg class="' + (cls || 'hc-ico') + '" aria-hidden="true" focusable="false"><use href="#hc-logo-' + id + '"></use></svg>';
  }
  function plate(l) {
    var k = l.kind === 'monogram' ? ' is-mono' : (l.plate === 'self' ? ' is-self' : (l.wide ? ' is-wide' : ''));
    return '<span class="hc-plate' + k + '">' + icon(l.id) + '</span>';
  }
  function pill(l, hidden) {
    var maker = l.showMaker && l.maker;
    return '<li' + (hidden ? ' aria-hidden="true"' : '') + '><span class="hc-pill" style="' + vars(l) + '"' +
      (maker ? ' title="' + esc(l.name + ' by ' + l.maker) + '"' : '') + '>' + plate(l) +
      '<span class="hc-pill__txt"><span class="hc-pill__name">' + esc(l.name) + '</span>' +
      (maker ? '<span class="hc-pill__maker">' + esc(l.maker) + '</span>' : '') + '</span></span></li>';
  }
  function attr(el, name) { var v = el.getAttribute(name); return v == null ? '' : v.trim(); }
  function groupsOf(el) {
    return attr(el, 'data-logos').split(/\s+/).filter(function (g) { return DATA.groups[g]; });
  }
  function logosOf(groups) {
    return DATA.logos.filter(function (l) { return groups.indexOf(l.group) > -1; });
  }
  function count(g) { return DATA.logos.filter(function (l) { return l.group === g; }).length; }

  function countTitle(groups) {
    if (groups.length === 1 && groups[0] === 'runtimes') {
      return 'Works inside <b data-count="' + count('runtimes') + '">' + count('runtimes') + '</b> AI tools';
    }
    var p = count('platforms'), m = count('models');
    if (groups.indexOf('platforms') < 0) return '<b data-count="' + m + '">' + m + '</b> AI models, your keys';
    return '<b data-count="' + p + '">' + p + '</b> platforms, <b data-count="' + m + '">' + m + '</b> AI models';
  }

  function head(el, groups, mode) {
    var g = groups[0];
    var label = attr(el, 'data-label');
    var out = '';
    if (label !== 'none') {
      var text = label || (groups.length > 1 && mode === 'grid' ? 'Connects to' : DATA.groups[g].label);
      out += '<p class="eyebrow hc-logos__eyebrow">' + esc(text) + '</p>';
    }
    var title = attr(el, 'data-title');
    if (title) out += '<h3 class="hc-logos__title">' + esc(title) + '</h3>';
    else if (mode === 'grid') out += '<h3 class="hc-logos__title">' + countTitle(groups) + '</h3>';
    var sub = attr(el, 'data-sub');
    if (mode === 'grid' && sub !== 'none') out += '<p class="hc-logos__sub">' + esc(sub || DATA.groups[g].sub) + '</p>';
    return out ? '<div class="hc-logos__head">' + out + '</div>' : '';
  }

  function foot(el, groups, mode) {
    var f = attr(el, 'data-footnote');
    var on = f ? f === 'on' : (mode === 'grid' || groups.indexOf('models') > -1);
    return on ? '<p class="hc-logos__foot">' + esc(DATA.footnote) + '</p>' : '';
  }

  /* ---------- modes ---------- */
  function tiles(logos) {
    return '<ul class="hc-rt">' + logos.map(function (l) {
      return '<li class="hc-rt__item" style="' + vars(l) + '">' + plate(l) +
        '<span class="hc-rt__name">' + esc(l.name) + '</span>' +
        (l.maker ? '<span class="hc-rt__maker">' + esc(l.maker) + '</span>' : '') + '</li>';
    }).join('') + '</ul>';
  }
  function compact(logos) {
    return '<ul class="hc-dock" style="--hc-n:' + logos.length + '">' + logos.map(function (l) {
      return '<li class="hc-dock__item" style="' + vars(l) + '">' + plate(l) +
        '<span class="hc-dock__name">' + esc(l.name) + '</span></li>';
    }).join('') + '</ul>';
  }
  function grid(logos, groups) {
    return groups.map(function (g) {
      var list = logos.filter(function (l) { return l.group === g; });
      return (groups.length > 1 ? '<p class="hc-grid__label">' + esc(DATA.groups[g].label) + '</p>' : '') +
        '<ul class="hc-grid" aria-label="' + esc(DATA.groups[g].label) + '">' + list.map(function (l) { return pill(l); }).join('') + '</ul>';
    }).join('');
  }
  function staticWrap(logos, label) {
    return '<ul class="hc-wrap" aria-label="' + esc(label) + '">' + logos.map(function (l) { return pill(l); }).join('') + '</ul>';
  }
  function marquee(el, logos, groups) {
    var def = groups.indexOf('platforms') > -1 ? 3 : (mqWide.matches ? 1 : 2);
    var rows = Math.max(1, Math.min(3, parseInt(attr(el, 'data-rows'), 10) || def, logos.length));
    var buckets = [];
    for (var i = 0; i < rows; i++) buckets.push([]);
    logos.forEach(function (l, n) { buckets[n % rows].push(l); });
    var label = DATA.groups[groups[0]].label;
    var html = '<div class="hc-mq">' + buckets.map(function (b, r) {
      return '<div class="hc-mq__row" data-dir="' + (r % 2 ? 'right' : 'left') + '"><div class="hc-mq__track">' +
        '<ul class="hc-mq__group" aria-label="' + esc(label) + (rows > 1 ? ', row ' + (r + 1) : '') + '"></ul></div></div>';
    }).join('') + '</div>';
    return { html: html, buckets: buckets, auto: !attr(el, 'data-rows'), wide: mqWide.matches };
  }

  /* fill each marquee row so one group is at least as wide as the viewport, then duplicate it */
  function fill(m) {
    var box = m.el.querySelector('.hc-mq');
    if (!box) return;
    var W = box.clientWidth || window.innerWidth;
    m.width = W;
    var speed = parseFloat(attr(m.el, 'data-speed')) || (W < 600 ? 28 : 34);
    var rows = box.querySelectorAll('.hc-mq__row');
    for (var r = 0; r < rows.length; r++) {
      var track = rows[r].firstChild;
      var group = track.firstChild;
      while (track.childNodes.length > 1) track.removeChild(track.lastChild);
      var items = m.buckets[r];
      group.innerHTML = items.map(function (l) { return pill(l); }).join('');
      var base = group.getBoundingClientRect().width || 1;
      var k = Math.max(1, Math.ceil((W * 1.12 + 24) / base));
      var extra = '';
      for (var i = 1; i < k; i++) extra += items.map(function (l) { return pill(l, true); }).join('');
      if (extra) group.insertAdjacentHTML('beforeend', extra);
      var dup = group.cloneNode(true);
      dup.setAttribute('aria-hidden', 'true');
      dup.removeAttribute('aria-label');
      track.appendChild(dup);
      var factor = [1, 1.16, 0.9][r] || 1;
      track.style.setProperty('--hc-dur', (base * k / speed * factor).toFixed(1) + 's');
    }
  }

  function observe(el) {
    if (!('IntersectionObserver' in window)) return;
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var mq = e.target.querySelector('.hc-mq');
          if (mq) mq.classList.toggle('is-off', !e.isIntersecting);
          if (e.isIntersecting) countUp(e.target);
        });
      }, { rootMargin: '80px 0px' });
    }
    io.observe(el);
  }

  function countUp(el) {
    if (el.__hcCounted) return;
    el.__hcCounted = true;
    if (mqReduce.matches) return;
    var nums = el.querySelectorAll('[data-count]');
    if (!nums.length) return;
    var t0 = performance.now(), dur = 900;
    function tick(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      for (var i = 0; i < nums.length; i++) nums[i].textContent = Math.round(e * +nums[i].getAttribute('data-count'));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function render(el) {
    if (!DATA || !el) return;
    var groups = groupsOf(el);
    if (!groups.length) return;
    var mode = attr(el, 'data-mode') || (groups[0] === 'runtimes' ? 'tiles' : 'marquee');
    var logos = logosOf(groups);
    el.classList.add('hc-logos', 'hc-logos--' + mode);
    var body, m = null;
    if (mode === 'tiles') body = tiles(logos);
    else if (mode === 'compact') body = compact(logos);
    else if (mode === 'grid') body = grid(logos, groups);
    else if (mqReduce.matches) body = staticWrap(logos, DATA.groups[groups[0]].label);
    else { m = marquee(el, logos, groups); body = m.html; }
    el.innerHTML = head(el, groups, mode) + body + foot(el, groups, mode);
    if (m) {
      m.el = el;
      marquees = marquees.filter(function (x) { return x.el !== el; });
      marquees.push(m);
      fill(m);
    }
    el.classList.add('hc-ready');
    observe(el);
  }

  function renderAll(root) {
    var els = (root || document).querySelectorAll('[data-logos]');
    for (var i = 0; i < els.length; i++) render(els[i]);
  }

  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      marquees.forEach(function (m) {
        if (!document.contains(m.el)) return;
        if (m.auto && m.wide !== mqWide.matches) { render(m.el); return; }
        var w = m.el.querySelector('.hc-mq');
        if (w && Math.abs(w.clientWidth - m.width) > 24) fill(m);
      });
    }, 180);
  });

  function domReady() {
    return new Promise(function (res) {
      if (document.readyState !== 'loading') res();
      else document.addEventListener('DOMContentLoaded', res, { once: true });
    });
  }

  var ready = Promise.all([
    fetch(ASSETS + 'data/logos.json').then(function (r) { if (!r.ok) throw new Error('logos.json ' + r.status); return r.json(); }),
    fetch(ASSETS + 'logos/sprite.svg').then(function (r) { if (!r.ok) throw new Error('sprite.svg ' + r.status); return r.text(); }),
    domReady()
  ]).then(function (res) {
    DATA = res[0];
    DATA.logos.forEach(function (l) { byId[l.id] = l; });
    if (!document.getElementById('hc-logo-sprite')) document.body.insertAdjacentHTML('afterbegin', res[1]);
    return DATA;
  });

  ready.then(function () {
    renderAll();
    /* pill widths change once Geist arrives: re-measure the marquees */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { marquees.forEach(fill); });
  }).catch(function (err) {
    if (window.console) console.warn('[HCLogos] could not load logos:', err);
  });

  window.HCLogos = {
    ready: ready,
    render: render,
    renderAll: renderAll,
    icon: icon,
    vars: vars,
    get: function (id) { return byId[id]; }
  };
})();
