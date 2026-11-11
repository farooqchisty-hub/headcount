/* Headcount v2 cart: pricing section, add-ons, live order summary, checkout drawer with
   order bump, and the post-purchase funnel (oto, downsell, thank-you).
   Needs window.CONFIG (config.js) loaded first. Vanilla JS, no dependencies.
   Public API: window.HC_CART (see bottom of file). */
(function () {
  "use strict";
  var C = window.CONFIG;
  if (!C) { console.warn("[HC_CART] CONFIG missing: load assets/js/config.js first"); return; }

  /* ---------- helpers ---------- */
  var CUR = C.currency || "₹";
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LAUNCH_END = Date.parse(C.launchEnds || "");
  var qs = new URLSearchParams(location.search);
  function launchOver() { return !!LAUNCH_END && Date.now() > LAUNCH_END; }
  /* Fast-action bonus is active for orders placed on or before its end time. */
  function fastActive(ts) {
    var fa = C.fastAction; if (!fa) return false;
    var end = Date.parse(fa.endsAt || C.launchEnds || ""); if (!end) return false;
    return (ts || Date.now()) <= end;
  }
  function isDemo() { return !!C.demoMode || qs.get("demo") === "1"; }
  function fmt(n) { return CUR + Math.round(n || 0).toLocaleString("en-IN"); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function plan(id) { for (var i = 0; i < C.plans.length; i++) if (C.plans[i].id === id) return C.plans[i]; return null; }
  function addon(id) { for (var i = 0; i < C.addons.length; i++) if (C.addons[i].id === id) return C.addons[i]; return null; }
  function priceOf(p) { return launchOver() && p.strike ? p.strike : p.price; }
  function strikeOf(p) { return launchOver() ? 0 : (p.strike || 0); }
  function addonPrice(a) { return launchOver() && a.strike ? a.strike : a.price; }
  function addonStrike(a) { return launchOver() ? 0 : (a.strike || 0); }
  function addonAllowed(a, planId) { return !a.requires || a.requires.indexOf(planId) > -1; }
  function defaultPlan() { for (var i = 0; i < C.plans.length; i++) if (C.plans[i].default) return C.plans[i].id; return C.plans[0].id; }
  function emit(name, detail) { try { document.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) {} }
  function track(ev, data) {
    emit("hc:track", { event: ev, data: data });
    if (isDemo()) return;
    try { if (typeof window.fbq === "function") window.fbq("track", ev, data); } catch (e) {}
  }
  var store = {
    get: function (k, local) {
      try { var v = sessionStorage.getItem(k); if (v == null && local) v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; }
    },
    set: function (k, v, local) {
      try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
      if (local) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
    }
  };

  /* ---------- icons (inline SVG) ---------- */
  var I = {
    check: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="9" width="12" height="8.5" rx="2" fill="currentColor"/><path d="M6.8 9V6.8a3.2 3.2 0 016.4 0V9" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l8 3v6.2c0 4.8-3.3 8.6-8 9.8-4.7-1.2-8-5-8-9.8V5.5l8-3z" fill="currentColor" opacity=".16"/><path d="M12 2.5l8 3v6.2c0 4.8-3.3 8.6-8 9.8-4.7-1.2-8-5-8-9.8V5.5l8-3z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8.3 12.2l2.6 2.6 4.9-5.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5.5l4.5 4.5-4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    gift: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="8" width="14" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2.5 5.5h15v3h-15zM10 5.5V17M10 5.5C8.5 2.5 5.5 3 6 5c.3 1 4 .5 4 .5zm0 0c1.5-3 4.5-2.5 4-.5-.3 1-4 .5-4 .5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    card: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2.5 9.5h19" stroke="currentColor" stroke-width="2.4"/><path d="M6 15h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    bank: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5L12 4l9 5.5H3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M5.5 10.5v6.5M10 10.5v6.5M14 10.5v6.5M18.5 10.5v6.5M3.5 19.5h17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    upi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l6 8-6 8z" fill="#1f9d55"/><path d="M12 4l6 8-6 8z" fill="#f37021"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8a9.2 9.2 0 00-7.9 13.9L3 21l4.4-1.1A9.2 9.2 0 1012 2.8z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8.9 7.6c.3-.6.6-.6.9-.6h.6c.2 0 .4.1.5.4l.8 1.9c.1.2 0 .5-.1.6l-.6.7c-.1.2-.2.4 0 .6.4.7 1 1.4 1.6 1.9.6.5 1.3.9 2 1.2.2.1.4 0 .6-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.3.4.5 0 .5-.2 1.3-.8 1.7-.6.4-1.6.7-3.3 0a10.5 10.5 0 01-4.6-4c-.9-1.3-1.2-2.5-1.1-3.4 0-.6.3-1.1.6-1.4z" fill="currentColor"/></svg>',
    copy: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="6.5" y="6.5" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M13.5 6.5V5a1.5 1.5 0 00-1.5-1.5H5A1.5 1.5 0 003.5 5v7A1.5 1.5 0 005 13.5h1.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    clock: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 6v4.3l2.8 1.7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
  };

  /* Payment marks: simple drawn wordmarks for nominative "pay with" use. */
  var F = 'font-family="Arial,Helvetica,sans-serif"';
  var PAY = {
    upi: '<svg viewBox="0 0 48 28" role="img" aria-label="UPI"><rect width="48" height="28" rx="5" fill="#fff"/><text x="6" y="18.6" ' + F + ' font-size="12.5" font-weight="800" font-style="italic" fill="#3d3d3d">UPI</text><path d="M31.5 8.5l5.2 5.5-5.2 5.5z" fill="#1f9d55"/><path d="M35.8 8.5l5.2 5.5-5.2 5.5z" fill="#f37021"/></svg>',
    gpay: '<svg viewBox="0 0 48 28" role="img" aria-label="Google Pay"><rect width="48" height="28" rx="5" fill="#fff"/><text x="6.5" y="19" ' + F + ' font-size="13.5" font-weight="700"><tspan fill="#4285F4">G</tspan><tspan fill="#5f6368" font-weight="600"> Pay</tspan></text></svg>',
    phonepe: '<svg viewBox="0 0 58 28" role="img" aria-label="PhonePe"><rect width="58" height="28" rx="5" fill="#5f259f"/><text x="29" y="18.2" text-anchor="middle" ' + F + ' font-size="11" font-weight="700" fill="#fff">PhonePe</text></svg>',
    paytm: '<svg viewBox="0 0 48 28" role="img" aria-label="Paytm"><rect width="48" height="28" rx="5" fill="#fff"/><text x="24" y="18.8" text-anchor="middle" ' + F + ' font-size="13" font-weight="800"><tspan fill="#002e6e">Pay</tspan><tspan fill="#00b9f1">tm</tspan></text></svg>',
    rupay: '<svg viewBox="0 0 52 28" role="img" aria-label="RuPay"><rect width="52" height="28" rx="5" fill="#fff"/><text x="5.5" y="18.6" ' + F + ' font-size="12" font-weight="800" font-style="italic" fill="#1b3a8c">RuPay</text><path d="M42 9l4.4 5-4.4 5z" fill="#f37021"/><path d="M44.6 9L49 14l-4.4 5z" fill="#1f9d55"/></svg>',
    visa: '<svg viewBox="0 0 48 28" role="img" aria-label="Visa"><rect width="48" height="28" rx="5" fill="#fff"/><text x="24" y="19.4" text-anchor="middle" ' + F + ' font-size="14.5" font-weight="900" font-style="italic" fill="#1a1f71" letter-spacing=".5">VISA</text></svg>',
    mastercard: '<svg viewBox="0 0 48 28" role="img" aria-label="Mastercard"><rect width="48" height="28" rx="5" fill="#fff"/><circle cx="19.5" cy="14" r="7" fill="#eb001b"/><circle cx="28.5" cy="14" r="7" fill="#f79e1b"/><path d="M24 8.6a7 7 0 010 10.8 7 7 0 010-10.8z" fill="#ff5f00"/></svg>'
  };
  function payLogos(cls) {
    return '<div class="hc-paylogos ' + (cls || "") + '" aria-label="Payment methods accepted">' +
      ["upi", "gpay", "phonepe", "paytm", "rupay", "visa", "mastercard"].map(function (k) { return '<span class="hc-pl hc-pl-' + k + '">' + PAY[k] + "</span>"; }).join("") +
      "</div>";
  }

  /* ---------- state ---------- */
  var state = { plan: defaultPlan(), addons: [], method: "gpay" };
  (function restore() {
    var saved = store.get("hc_cart");
    if (saved && plan(saved.plan)) {
      state.plan = saved.plan;
      state.addons = (saved.addons || []).filter(function (id) { var a = addon(id); return a && addonAllowed(a, saved.plan); });
      if (saved.method) state.method = saved.method;
    }
    var want = qs.get("plan") || qs.get("tier");
    if (want === "agency") want = "pro";
    if (want && plan(want)) state.plan = want;
  })();

  function orderedAddons(ids) { return C.addons.map(function (a) { return a.id; }).filter(function (id) { return ids.indexOf(id) > -1; }); }

  function totals() {
    var p = plan(state.plan);
    var lines = [{ id: p.id, kind: "plan", name: p.name, sub: p.mathSub, price: priceOf(p), strike: strikeOf(p) }];
    orderedAddons(state.addons).forEach(function (id) {
      var a = addon(id);
      lines.push({ id: a.id, kind: "addon", name: a.name, price: addonPrice(a), strike: addonStrike(a) });
    });
    var total = 0, save = 0;
    lines.forEach(function (l) { total += l.price; if (l.strike > l.price) save += l.strike - l.price; });
    return { lines: lines, total: total, save: save, plan: p };
  }

  var notice = "";
  function setPlan(id, silent) {
    if (!plan(id)) return;
    var removed = [];
    state.plan = id;
    state.addons = state.addons.filter(function (aid) {
      var a = addon(aid); var ok = addonAllowed(a, id); if (!ok) removed.push(a.name); return ok;
    });
    notice = removed.length ? removed.join(", ") + " removed: it needs Crew Pro or Done With You." : "";
    if (!silent) track("CustomizeProduct", { content_name: plan(id).name });
    update();
  }
  function setAddon(id, on) {
    var a = addon(id); if (!a) return;
    var has = state.addons.indexOf(id) > -1;
    if (on === undefined) on = !has;
    if (on && !addonAllowed(a, state.plan)) return;
    if (on && !has) { state.addons.push(id); track("AddToCart", { content_name: a.name, value: addonPrice(a), currency: C.currencyCode }); }
    if (!on && has) state.addons.splice(state.addons.indexOf(id), 1);
    notice = "";
    update();
  }

  /* ---------- animated total ---------- */
  var shownTotal = null, raf = 0;
  function paintTotal(v) {
    $$("[data-hc-total]").forEach(function (n) {
      var tpl = n.getAttribute("data-tpl");
      n.textContent = tpl ? tpl.replace("{t}", fmt(v)) : fmt(v);
    });
  }
  function animateTotal(to) {
    cancelAnimationFrame(raf);
    if (shownTotal === null || reduceMotion || shownTotal === to) { shownTotal = to; paintTotal(to); return; }
    var from = shownTotal, t0 = performance.now(), dur = 560;
    $$(".hc-total-flash").forEach(function (n) { n.classList.remove("hc-flash"); void n.offsetWidth; n.classList.add("hc-flash"); });
    (function step(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      var v = Math.round(from + (to - from) * e);
      shownTotal = v; paintTotal(v);
      if (k < 1) raf = requestAnimationFrame(step); else { shownTotal = to; paintTotal(to); }
    })(t0);
  }

  /* ---------- countdown ---------- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function countdownText() {
    var ms = Math.max(0, LAUNCH_END - Date.now());
    var s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    return (d ? d + "d " : "") + pad(h) + "h " + pad(m) + "m " + pad(sec) + "s";
  }
  var cdTimer = 0;
  function startCountdown() {
    if (cdTimer || !LAUNCH_END) return;
    function tick() {
      if (launchOver()) { $$("[data-hc-launch]").forEach(function (n) { n.hidden = true; }); clearInterval(cdTimer); return; }
      $$("[data-hc-countdown]").forEach(function (n) { n.textContent = countdownText(); });
    }
    tick(); cdTimer = setInterval(tick, 1000);
  }

  /* ---------- pricing section ---------- */
  function planCard(p) {
    var strike = strikeOf(p);
    return '<div class="hcp-plan" data-plan="' + p.id + '">' +
      '<div class="hcp-plan-top">' +
        (p.badge ? '<span class="hcp-badge">' + esc(p.badge) + "</span>" : "<span></span>") +
        '<span class="hcp-radio" aria-hidden="true">' + I.check + "</span>" +
      "</div>" +
      '<h3 class="hcp-plan-name">' + esc(p.name) + "</h3>" +
      '<p class="hcp-plan-for">' + esc(p.forWho) + "</p>" +
      '<div class="hcp-plan-price">' +
        (strike ? '<span class="hcp-plan-was"><s>' + fmt(strike) + "</s> launch price till " + esc(C.launchEndsLabel || "launch ends") + "</span>" : "") +
        "<b>" + fmt(priceOf(p)) + "</b><span>once</span>" +
      "</div>" +
      '<p class="hcp-plan-math"><b>' + esc(p.math) + "</b><span>" + esc(p.mathSub) + "</span></p>" +
      (p.intro ? '<p class="hcp-plan-intro">' + esc(p.intro) + "</p>" : "") +
      '<ul class="hcp-feats">' + p.features.map(function (f) { return "<li>" + I.check + "<span>" + esc(f) + "</span></li>"; }).join("") + "</ul>" +
      '<button type="button" class="hcp-plan-cta" data-plan-cta="' + p.id + '"></button>' +
    "</div>";
  }
  function addonRow(a) {
    return '<div class="hcp-addon" data-addon="' + a.id + '">' +
      '<label class="hcp-addon-row">' +
        '<input type="checkbox" class="hc-sr" data-addon-input="' + a.id + '">' +
        '<span class="hc-switch" aria-hidden="true"><i></i></span>' +
        '<span class="hcp-addon-copy"><span class="hcp-addon-name">' + esc(a.name) + "</span>" +
          '<span class="hcp-addon-benefit">' + esc(a.benefit) + "</span></span>" +
        '<span class="hcp-addon-price">' + (addonStrike(a) ? "<s>" + fmt(addonStrike(a)) + "</s>" : "") + "<b>+" + fmt(addonPrice(a)) + "</b></span>" +
      "</label>" +
      (a.requires ? '<div class="hcp-addon-lock" hidden>' + I.lock + "<span>" + esc(a.lockedNote || "Not available on this plan.") + '</span><button type="button" data-hc-upgrade="' + a.requires[0] + '">Switch to ' + esc(plan(a.requires[0]).name) + "</button></div>" : "") +
    "</div>";
  }
  function valueStack() {
    var vs = C.valueStack || { items: [] };
    var sum = 0;
    var rows = vs.items.map(function (it) { sum += it.worth; return "<li>" + I.check + "<span>" + esc(it.label) + "</span><b>" + fmt(it.worth) + "</b></li>"; }).join("");
    var bt = +C.bonusTotal || 0;
    sum += bt;
    var bonus = bt
      ? "<li class=\"is-bonus\">" + I.gift + "<span>" + (C.bonusCount ? C.bonusCount + " bonuses" : "All bonuses") + ", free with every plan</span><b>" + fmt(bt) + "</b></li>"
      : "<li class=\"is-bonus\">" + I.gift + "<span>Every bonus on this page, free with every plan</span><b class=\"hcp-incl\">Included</b></li>";
    var crew = plan("crew") || C.plans[0];
    return '<div class="hcp-stack">' +
      '<div class="hcp-stack-head"><span class="hcp-mono">' + esc(vs.title || "What you get") + '</span><span class="hcp-mono hcp-dim">worth</span></div>' +
      '<ul class="hcp-stack-list">' + rows + bonus + "</ul>" +
      '<div class="hcp-stack-total"><span>Total value' + (bt ? "" : " before bonuses") + "</span><b>" + fmt(sum) + "</b></div>" +
      '<div class="hcp-stack-today"><span>' + esc(crew.name) + ' today<small>one payment, yours to keep</small></span><b>' + fmt(priceOf(crew)) + "</b></div>" +
    "</div>";
  }
  function summaryCard() {
    var g = C.guarantee || {};
    return '<div class="hcp-sum" data-hc-sum>' +
      '<div class="hcp-sum-head"><span class="hcp-mono">Your order</span><span class="hcp-sum-tag">One-time payment</span></div>' +
      '<ul class="hc-lines" data-hc-lines></ul>' +
      '<p class="hc-notice" data-hc-notice hidden></p>' +
      '<div class="hc-save" data-hc-save hidden></div>' +
      '<div class="hc-totalrow hc-total-flash"><span>Total today</span><b data-hc-total>' + fmt(totals().total) + "</b></div>" +
      '<p class="hc-gst">' + esc(C.gstNote || "") + "</p>" +
      '<button type="button" class="btn-primary hc-paybtn" data-hc-open data-hc-paymain>' + I.lock + '<span data-hc-total data-tpl="Pay {t} securely">Pay</span></button>' +
      '<p class="hc-micro">Instant access on email + WhatsApp</p>' +
      payLogos() +
      '<div class="hc-guar">' + '<span class="hc-guar-ic">' + I.shield + "</span>" +
        '<span><b>' + esc(g.badge || "") + "</b>" + esc(g.text || "") + "</span></div>" +
    "</div>";
  }

  function renderPricing(mount) {
    var crew = plan("crew") || C.plans[0];
    var anchor = C.hireAnchor || { monthly: 40000, line: "" };
    mount.innerHTML =
      '<div class="hcp">' +
        '<div class="hcp-wrap">' +
          '<header class="hcp-head">' +
            '<div class="hcp-head-copy">' +
              '<p class="eyebrow">Pricing</p>' +
              '<h2 class="hcp-h2">A ' + fmt(anchor.monthly) + '/month team for <span class="hcp-gold">' + fmt(priceOf(crew)) + '</span> <span class="serif">once.</span></h2>' +
              '<p class="hcp-sub">' + esc(anchor.line) + " Headcount is " + (C.agentCount || 40) + " agents you pay for one time. No monthly plan, ever.</p>" +
              (LAUNCH_END && !launchOver() ? '<div class="hcp-launch" data-hc-launch><span class="pill live">Launch price</span><span>ends in <b data-hc-countdown></b></span><span class="hcp-launch-then">Crew goes to ' + fmt(crew.strike) + " after " + esc(C.launchEndsLabel || "launch") + "</span></div>" : "") +
              '<ul class="hcp-ticks"><li>' + I.check + 'One payment</li><li>' + I.check + 'UPI in 10 seconds</li><li>' + I.check + "Instant access</li></ul>" +
            "</div>" +
            valueStack() +
          "</header>" +
          '<div class="hcp-grid">' +
            '<div class="hcp-main">' +
              '<div class="hcp-step"><span>01</span>Pick your team</div>' +
              '<div class="hcp-plans" role="group" aria-label="Plans">' + C.plans.map(planCard).join("") + "</div>" +
              '<div class="hcp-step"><span>02</span>Add to your order<em>optional</em></div>' +
              '<div class="hcp-addons">' + C.addons.map(addonRow).join("") + "</div>" +
            "</div>" +
            '<aside class="hcp-side"><div class="hcp-step hcp-step-side"><span>03</span>Pay once</div>' + summaryCard() + "</aside>" +
          "</div>" +
        "</div>" +
      "</div>";

    /* events */
    $$(".hcp-plan", mount).forEach(function (card) {
      card.addEventListener("click", function (e) {
        var id = card.getAttribute("data-plan");
        if (e.target.closest("[data-plan-cta]") && state.plan === id) { openCheckout(); return; }
        if (state.plan !== id) setPlan(id);
      });
    });
    $$("[data-addon-input]", mount).forEach(function (inp) {
      inp.addEventListener("change", function () { setAddon(inp.getAttribute("data-addon-input"), inp.checked); });
    });
    $$("[data-hc-upgrade]", mount).forEach(function (b) {
      b.addEventListener("click", function () {
        var aid = b.closest("[data-addon]").getAttribute("data-addon");
        setPlan(b.getAttribute("data-hc-upgrade"));
        setAddon(aid, true);
      });
    });

    buildBar();
    observePricing(mount);
    startCountdown();
  }

  /* ---------- mobile bottom bar ---------- */
  var bar = null;
  function buildBar() {
    if (bar) return;
    bar = document.createElement("div");
    bar.className = "hc-bar";
    bar.setAttribute("data-hc-bar", "");
    bar.innerHTML =
      '<div class="hc-bar-info"><span data-hc-barlabel></span><b data-hc-total class="hc-total-flash"></b></div>' +
      '<button type="button" class="btn-primary hc-bar-btn" data-hc-open>' + I.lock + '<span data-hc-total data-tpl="Pay {t}"></span></button>';
    document.body.appendChild(bar);
  }
  var inPricing = false, mainPayVisible = false;
  function syncBar() {
    var show = inPricing && !mainPayVisible && !drawerOpen;
    if (bar) bar.classList.toggle("is-on", show);
    document.documentElement.classList.toggle("hc-in-pricing", inPricing);
  }
  function observePricing(mount) {
    if (!("IntersectionObserver" in window)) return;
    var section = document.getElementById("pricing") || mount;
    new IntersectionObserver(function (es) { es.forEach(function (e) { inPricing = e.isIntersecting; }); syncBar(); }, { rootMargin: "-45% 0px -45% 0px" }).observe(section);
    var pay = $("[data-hc-paymain]", mount);
    if (pay) new IntersectionObserver(function (es) { es.forEach(function (e) { mainPayVisible = e.isIntersecting; }); syncBar(); }, { threshold: 0.6 }).observe(pay);
  }

  /* ---------- checkout drawer ---------- */
  var drawer = null, drawerOpen = false, lastFocus = null, pushed = false;
  function contact() { return store.get("hc_contact") || {}; }
  function buildDrawer() {
    if (drawer) return drawer;
    var bump = C.addons.filter(function (a) { return a.bump; })[0];
    var g = C.guarantee || {};
    var ct = contact();
    drawer = document.createElement("div");
    drawer.className = "hcx";
    drawer.hidden = true;
    drawer.innerHTML =
      '<div class="hcx-scrim" data-hcx-close></div>' +
      '<div class="hcx-panel" role="dialog" aria-modal="true" aria-labelledby="hcx-title">' +
        '<div class="hcx-handle" aria-hidden="true"></div>' +
        '<header class="hcx-head">' +
          '<div><p class="hcx-kicker">' + I.lock + 'Secure checkout</p><h3 id="hcx-title">Complete your order</h3></div>' +
          '<button type="button" class="hcx-close" data-hcx-close aria-label="Close checkout">' + I.close + "</button>" +
        "</header>" +
        '<div class="hcx-body">' +
          '<div class="hcx-plans" role="radiogroup" aria-label="Plan">' +
            C.plans.map(function (p) {
              return '<button type="button" role="radio" class="hcx-chip" data-hcx-plan="' + p.id + '"><span>' + esc(p.short || p.name) + "</span><b>" + fmt(priceOf(p)) + "</b></button>";
            }).join("") +
          "</div>" +
          '<form class="hcx-form" novalidate autocomplete="on">' +
            '<p class="hcx-label">Where should we send your access?</p>' +
            field("name", "Full name", "text", 'autocomplete="name" placeholder="Your name"', ct.name) +
            field("email", "Email", "email", 'autocomplete="email" inputmode="email" placeholder="you@brand.com"', ct.email, "Download link goes here") +
            '<div class="hcx-field" data-f="phone"><label for="hcx-phone">WhatsApp number<small>Setup help + access</small></label>' +
              '<div class="hcx-tel"><span>+91</span><input id="hcx-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="17" placeholder="98765 43210" value="' + esc(ct.phone || "") + '"></div>' +
              '<p class="hcx-err" aria-live="polite"></p></div>' +
            '<details class="hcx-gst"' + (ct.gstin ? " open" : "") + "><summary>" + I.plus + "Need a GST invoice? Add GSTIN</summary>" +
              field("gstin", "GSTIN", "text", 'autocomplete="off" maxlength="15" placeholder="22AAAAA0000A1Z5" style="text-transform:uppercase"', ct.gstin) +
              field("biz", "Business name on invoice", "text", 'autocomplete="organization" placeholder="Your company"', ct.biz) +
            "</details>" +
            (bump ?
              '<label class="hcx-bump" data-hcx-bump>' +
                '<span class="hcx-bump-tag"><i>' + I.arrow + '</i>Recommended for day 1</span>' +
                '<span class="hcx-bump-row"><input type="checkbox" class="hcx-bump-cb" data-hcx-bumpcb="' + bump.id + '">' +
                  '<span class="hcx-bump-box" aria-hidden="true">' + I.check + "</span>" +
                  '<span class="hcx-bump-copy"><b>' + esc((bump.bumpTitle || "Yes, add " + bump.name + " for {price}").replace("{price}", fmt(addonPrice(bump)))) + "</b>" +
                    (addonStrike(bump) ? '<span class="hcx-bump-norm">normally <s>' + fmt(addonStrike(bump)) + "</s></span>" : "") +
                    "<span>" + esc(bump.bumpBody || bump.benefit) + "</span></span>" +
                "</span>" +
              "</label>" : "") +
            '<div class="hcx-sum">' +
              '<p class="hcx-label">Order summary</p>' +
              '<ul class="hc-lines" data-hc-lines></ul>' +
              '<p class="hc-notice" data-hc-notice hidden></p>' +
              '<div class="hc-save" data-hc-save hidden></div>' +
              '<div class="hc-totalrow hc-total-flash"><span>Total today</span><b data-hc-total></b></div>' +
              '<p class="hc-gst">' + esc(C.gstNote || "") + "</p>" +
            "</div>" +
            '<fieldset class="hcx-methods"><legend class="hcx-label">Pay with UPI <em>fastest</em></legend>' +
              '<div class="hcx-upi">' +
                method("gpay", PAY.gpay, "GPay") + method("phonepe", PAY.phonepe, "PhonePe") + method("paytm", PAY.paytm, "Paytm") + method("upi", PAY.upi, "Any UPI") +
              "</div>" +
              '<div class="hcx-other">' +
                method("card", '<span class="hcx-m-ic">' + I.card + "</span>", "Card", "Visa, Mastercard, RuPay") +
                method("netbanking", '<span class="hcx-m-ic">' + I.bank + "</span>", "Netbanking", "All major banks") +
              "</div>" +
            "</fieldset>" +
            '<p class="hcx-legal">By paying you agree to the <a href="' + esc((C.legal || {}).terms || "#") + '">Terms</a> and <a href="' + esc((C.legal || {}).refund || "#") + '">Refund policy</a>. One-time payment, never a subscription.</p>' +
          "</form>" +
        "</div>" +
        '<footer class="hcx-foot">' +
          '<button type="button" class="btn-primary hcx-pay" data-hcx-pay>' + I.lock + '<span data-hc-total data-tpl="Pay {t} securely" data-hcx-paylabel></span></button>' +
          '<div class="hcx-trust"><span>' + I.lock + "Secured by Razorpay</span><span>" + I.shield + esc(g.badge || "") + "</span></div>" +
        "</footer>" +
      "</div>";
    document.body.appendChild(drawer);

    /* events */
    $$("[data-hcx-close]", drawer).forEach(function (b) { b.addEventListener("click", function () { closeCheckout(); }); });
    $$("[data-hcx-plan]", drawer).forEach(function (b) { b.addEventListener("click", function () { setPlan(b.getAttribute("data-hcx-plan")); }); });
    var cb = $("[data-hcx-bumpcb]", drawer);
    if (cb) cb.addEventListener("change", function () { setAddon(cb.getAttribute("data-hcx-bumpcb"), cb.checked); if (cb.checked) track("AddToCart", { content_name: "order_bump", value: addonPrice(bump), currency: C.currencyCode }); });
    $$("[data-method]", drawer).forEach(function (b) { b.addEventListener("click", function () { state.method = b.getAttribute("data-method"); update(); }); });
    $("[data-hcx-pay]", drawer).addEventListener("click", pay);
    $(".hcx-form", drawer).addEventListener("submit", function (e) { e.preventDefault(); pay(); });
    $(".hcx-form", drawer).addEventListener("input", function (e) {
      var f = e.target.closest(".hcx-field"); if (f && f.classList.contains("is-err")) validateField(f.getAttribute("data-f"), true);
      saveContact();
    });
    $$(".hcx-field input", drawer).forEach(function (inp) {
      inp.addEventListener("blur", function () { if (inp.value.trim()) validateField(inp.closest(".hcx-field").getAttribute("data-f"), true); });
    });
    drawer.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeCheckout(); return; }
      if (e.key !== "Tab") return;
      var f = $$('button:not([disabled]), a[href], input:not([type=hidden]), summary, [tabindex]:not([tabindex="-1"])', $(".hcx-panel", drawer))
        .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    return drawer;
  }
  function field(name, label, type, attrs, val, hint) {
    return '<div class="hcx-field" data-f="' + name + '"><label for="hcx-' + name + '">' + esc(label) + (hint ? "<small>" + esc(hint) + "</small>" : "") + "</label>" +
      '<input id="hcx-' + name + '" name="' + name + '" type="' + type + '" ' + attrs + ' value="' + esc(val || "") + '">' +
      '<p class="hcx-err" aria-live="polite"></p></div>';
  }
  function method(id, logo, name, sub) {
    return '<button type="button" class="hcx-m" data-method="' + id + '" aria-pressed="false">' +
      '<span class="hcx-m-logo">' + logo + "</span><span class=\"hcx-m-name\">" + esc(name) + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</span>" +
      '<span class="hcx-m-dot" aria-hidden="true">' + I.check + "</span></button>";
  }
  function val(n) { var el = drawer && $("#hcx-" + n, drawer); return el ? el.value.trim() : ""; }
  function phoneDigits() { var d = val("phone").replace(/\D/g, ""); if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2); if (d.length === 11 && d[0] === "0") d = d.slice(1); return d; }
  var RULES = {
    name: function () { return val("name").length >= 2 ? "" : "Enter your name"; },
    email: function () { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val("email")) ? "" : "Enter a valid email, your download link goes here"; },
    phone: function () { return /^[6-9]\d{9}$/.test(phoneDigits()) ? "" : "Enter a 10 digit Indian mobile number"; },
    gstin: function () { var g = val("gstin").toUpperCase(); return !g || /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g) ? "" : "GSTIN looks wrong (15 characters, like 22AAAAA0000A1Z5)"; },
    biz: function () { return ""; }
  };
  function validateField(name, show) {
    var f = $('.hcx-field[data-f="' + name + '"]', drawer); if (!f || !RULES[name]) return true;
    var msg = RULES[name]();
    if (show) {
      f.classList.toggle("is-err", !!msg);
      $(".hcx-err", f).textContent = msg;
      var inp = $("input", f); if (inp) inp.setAttribute("aria-invalid", msg ? "true" : "false");
    }
    return !msg;
  }
  function saveContact() {
    store.set("hc_contact", { name: val("name"), email: val("email"), phone: val("phone"), gstin: val("gstin").toUpperCase(), biz: val("biz") });
  }

  function openCheckout(planId) {
    if (planId && plan(planId)) setPlan(planId, true);
    buildDrawer();
    update();
    if (drawerOpen) return;
    drawerOpen = true;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.documentElement.classList.add("hcx-lock");
    requestAnimationFrame(function () { requestAnimationFrame(function () { drawer.classList.add("is-open"); }); });
    try { history.pushState({ hcx: 1 }, ""); pushed = true; } catch (e) {}
    syncBar();
    var t = totals();
    track("InitiateCheckout", { value: t.total, currency: C.currencyCode, content_ids: [state.plan].concat(state.addons), num_items: t.lines.length });
    emit("hc:checkout-open", { plan: state.plan });
    setTimeout(function () {
      var first = $$(".hcx-field input", drawer).filter(function (i) { return !i.value; })[0];
      /* Do not pop the keyboard on phones: focus the panel itself there. */
      if (window.innerWidth >= 960 && first) first.focus({ preventScroll: true });
      else $(".hcx-close", drawer).focus({ preventScroll: true });
    }, reduceMotion ? 0 : 320);
  }
  function closeCheckout(fromPop) {
    if (!drawerOpen) return;
    drawerOpen = false;
    drawer.classList.remove("is-open");
    document.documentElement.classList.remove("hcx-lock");
    setTimeout(function () { if (!drawerOpen) drawer.hidden = true; }, reduceMotion ? 0 : 340);
    if (pushed && !fromPop) { pushed = false; try { history.back(); } catch (e) {} } else pushed = false;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    syncBar();
  }
  window.addEventListener("popstate", function () { if (drawerOpen) closeCheckout(true); });
  /* Back button from Razorpay restores this page from cache: re-arm the pay button. */
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted || !drawer) return;
    var btn = $("[data-hcx-pay]", drawer), label = $("[data-hcx-paylabel]", drawer);
    btn.disabled = false; btn.classList.remove("is-loading");
    label.setAttribute("data-hc-total", ""); shownTotal = null; update();
  });

  function makeRef() { return "HC" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(); }
  function checkoutUrl(order) {
    var ck = C.checkout || {};
    var key = [order.plan].concat(order.addons).join("+");
    var link = ck.links && ck.links[key];
    var p = new URLSearchParams();
    p.set("ref", order.ref);
    if (link) return link + (link.indexOf("?") > -1 ? "&" : "?") + p.toString();
    p.set("amount", String(order.total));
    p.set("plan", order.plan);
    p.set("items", order.addons.join(","));
    p.set("method", order.method);
    return (ck.pageUrl || "") + ((ck.pageUrl || "").indexOf("?") > -1 ? "&" : "?") + p.toString();
  }
  function isLive(url) { return !isDemo() && !!url && !/REPLACE|^\[/.test(url); }
  function nextAfterPurchase(planId) {
    if (planId === "crew") return "oto.html";
    if (planId === "dwy") return "thank-you.html";
    return "downsell.html";
  }

  function pay() {
    buildDrawer();
    var bad = ["name", "email", "phone", "gstin"].filter(function (n) { return !validateField(n, true); });
    if (bad.length) {
      var f = $('.hcx-field[data-f="' + bad[0] + '"]', drawer);
      if (bad[0] === "gstin") $(".hcx-gst", drawer).open = true;
      f.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      var inp = $("input", f); if (inp) setTimeout(function () { inp.focus({ preventScroll: true }); }, 250);
      var btn0 = $("[data-hcx-pay]", drawer); btn0.classList.remove("hc-shake"); void btn0.offsetWidth; btn0.classList.add("hc-shake");
      return;
    }
    saveContact();
    var t = totals();
    var order = { ref: makeRef(), plan: state.plan, basePlan: state.plan, addons: orderedAddons(state.addons), total: t.total, save: t.save, method: state.method, offers: [], ts: Date.now(), demo: isDemo() };
    store.set("hc_order", order, true);
    var ct = contact();
    var ep = C.checkout && C.checkout.leadEndpoint;
    if (ep) {
      try {
        var body = JSON.stringify({ name: ct.name, email: ct.email, phone: "+91" + phoneDigits(), gstin: ct.gstin, biz: ct.biz, order: order, page: location.href.split("?")[0] });
        if (navigator.sendBeacon) navigator.sendBeacon(ep, new Blob([body], { type: "application/json" }));
        else fetch(ep, { method: "POST", body: body, headers: { "Content-Type": "application/json" }, keepalive: true });
      } catch (e) {}
    }
    track("AddPaymentInfo", { value: t.total, currency: C.currencyCode });
    var url = checkoutUrl(order);
    var btn = $("[data-hcx-pay]", drawer);
    btn.disabled = true; btn.classList.add("is-loading");
    var label = $("[data-hcx-paylabel]", drawer);
    label.removeAttribute("data-hc-total");
    label.textContent = "Opening secure payment";
    emit("hc:pay", { order: order, url: url, live: isLive(url) });
    if (isLive(url)) { location.href = url; return; }
    setTimeout(function () {
      location.href = nextAfterPurchase(order.plan) + "?plan=" + encodeURIComponent(order.plan) + "&ref=" + encodeURIComponent(order.ref) + "&demo=1";
    }, reduceMotion ? 50 : 750);
  }

  /* ---------- render state everywhere ---------- */
  var prevLines = [];
  function linesHTML(t) {
    return t.lines.map(function (l) {
      var isNew = prevLines.indexOf(l.id) === -1 && prevLines.length > 0;
      return '<li class="hc-line' + (l.kind === "addon" ? " is-addon" : "") + (isNew ? " is-new" : "") + '">' +
        '<span class="hc-line-name">' + (l.kind === "addon" ? '<i class="hc-plus">' + I.plus + "</i>" : "") + esc(l.name) +
          (l.kind === "plan" && l.sub ? "<small>" + esc(l.sub) + "</small>" : "") + "</span>" +
        '<span class="hc-line-price">' + (l.strike > l.price ? "<s>" + fmt(l.strike) + "</s>" : "") + fmt(l.price) +
          (l.kind === "addon" ? '<button type="button" class="hc-line-x" data-hc-remove="' + l.id + '" aria-label="Remove ' + esc(l.name) + '">' + I.close + "</button>" : "") +
        "</span></li>";
    }).join("");
  }
  function update() {
    var t = totals();
    var html = linesHTML(t);
    prevLines = t.lines.map(function (l) { return l.id; });
    $$("[data-hc-lines]").forEach(function (ul) { ul.innerHTML = html; });
    $$("[data-hc-remove]").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); setAddon(b.getAttribute("data-hc-remove"), false); }); });
    $$("[data-hc-save]").forEach(function (n) {
      n.hidden = !t.save;
      n.innerHTML = I.check + "<span>You save <b>" + fmt(t.save) + "</b> vs the price after " + esc(C.launchEndsLabel || "launch") + "</span>";
    });
    $$("[data-hc-notice]").forEach(function (n) { n.hidden = !notice; n.textContent = notice; });

    /* plan cards */
    $$(".hcp-plan").forEach(function (card) {
      var id = card.getAttribute("data-plan"), on = id === state.plan, p = plan(id);
      card.classList.toggle("is-on", on);
      var b = $("[data-plan-cta]", card);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.innerHTML = on ? "Continue with " + esc(p.name) + I.arrow : "Choose " + esc(p.name);
    });
    /* add-ons */
    $$(".hcp-addon").forEach(function (row) {
      var id = row.getAttribute("data-addon"), a = addon(id), ok = addonAllowed(a, state.plan), on = state.addons.indexOf(id) > -1;
      var inp = $("input", row); inp.checked = on; inp.disabled = !ok;
      row.classList.toggle("is-on", on); row.classList.toggle("is-locked", !ok);
      var lock = $(".hcp-addon-lock", row); if (lock) lock.hidden = ok;
    });
    /* bar label */
    var extra = state.addons.length;
    $$("[data-hc-barlabel]").forEach(function (n) { n.textContent = t.plan.name + (extra ? " + " + extra + " add-on" + (extra > 1 ? "s" : "") : ""); });
    /* drawer */
    if (drawer) {
      $$("[data-hcx-plan]", drawer).forEach(function (b) { var on = b.getAttribute("data-hcx-plan") === state.plan; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
      var cb = $("[data-hcx-bumpcb]", drawer);
      if (cb) { cb.checked = state.addons.indexOf(cb.getAttribute("data-hcx-bumpcb")) > -1; $("[data-hcx-bump]", drawer).classList.toggle("is-on", cb.checked); }
      $$("[data-method]", drawer).forEach(function (b) { var on = b.getAttribute("data-method") === state.method; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
      var pl = $("[data-hcx-paylabel]", drawer);
      if (pl && pl.hasAttribute("data-hc-total")) {
        var m = state.method;
        pl.setAttribute("data-tpl", m === "card" ? "Pay {t} by card" : m === "netbanking" ? "Pay {t} securely" : "Pay {t} with UPI");
      }
    }
    animateTotal(t.total);
    store.set("hc_cart", { plan: state.plan, addons: state.addons, method: state.method });
    emit("hc:cart", api.getState());
  }

  /* ---------- post-purchase funnel pages ---------- */
  function getOrder() {
    var o = store.get("hc_order", true);
    var qp = qs.get("plan"), ref = qs.get("ref");
    if (!o || (ref && o.ref !== ref && qp)) {
      var p = plan(qp) || plan("crew");
      o = { ref: ref || makeRef(), plan: p.id, basePlan: p.id, addons: [], total: priceOf(p), offers: [], ts: Date.now(), demo: isDemo() };
      store.set("hc_order", o, true);
    }
    o.offers = o.offers || [];
    return o;
  }
  function offerByKey(k) { return C.offers[k]; }
  function offerById(id) { for (var k in C.offers) if (C.offers[k].id === id) return C.offers[k]; return null; }
  function applyOffer(o, id) {
    if (o.offers.indexOf(id) > -1) return;
    var of = offerById(id); if (!of) return;
    o.offers.push(id);
    o.total += of.price;
    if (id === "pro_upgrade") o.plan = "pro";
  }
  function acceptOffer(key, btn, next) {
    var o = getOrder(), of = offerByKey(key);
    var link = C.checkout && C.checkout.offerLinks && C.checkout.offerLinks[of.id];
    if (btn) { btn.disabled = true; btn.classList.add("is-loading"); var s = $("span", btn); if (s) s.textContent = isLive(link) ? "Opening UPI" : "Adding to your order"; }
    track("AddToCart", { content_name: of.name, value: of.price, currency: C.currencyCode });
    if (isLive(link)) {
      o.pendingOffer = of.id; store.set("hc_order", o, true);
      location.href = link + (link.indexOf("?") > -1 ? "&" : "?") + "ref=" + encodeURIComponent(o.ref);
      return;
    }
    applyOffer(o, of.id); store.set("hc_order", o, true);
    setTimeout(function () { location.href = next + "?ref=" + encodeURIComponent(o.ref) + "&offer=" + of.id + (isDemo() ? "&demo=1" : ""); }, reduceMotion ? 50 : 600);
  }
  function go(page) { var o = getOrder(); location.replace(page + "?ref=" + encodeURIComponent(o.ref) + (isDemo() ? "&demo=1" : "")); }
  function fillPrices(root) {
    $$("[data-price]", root).forEach(function (n) {
      var path = n.getAttribute("data-price").split("."), v = C;
      for (var i = 0; i < path.length && v != null; i++) v = v[path[i]];
      if (typeof v === "number") n.textContent = fmt(v);
    });
    $$("[data-plan-price]", root).forEach(function (n) { var p = plan(n.getAttribute("data-plan-price")); if (p) n.textContent = fmt(n.hasAttribute("data-strike") ? p.strike : priceOf(p)); });
    $$("[data-c]", root).forEach(function (n) {
      var path = n.getAttribute("data-c").split("."), v = C;
      for (var i = 0; i < path.length && v != null; i++) v = v[path[i]];
      if (v != null) n.textContent = v;
    });
  }
  function initFunnel(page) {
    fillPrices(document);
    var o = getOrder();
    if (isDemo()) { var dm = $("[data-hc-demo]"); if (dm) dm.hidden = false; }
    var nm = (contact().name || "").split(" ")[0];
    $$("[data-hc-firstname]").forEach(function (n) { if (nm) n.textContent = ", " + nm; });
    $$("[data-hc-planname]").forEach(function (n) { n.textContent = (plan(o.basePlan || o.plan) || {}).name || "Crew"; });

    if (page === "oto") {
      if (o.plan === "dwy") return go("thank-you.html");
      if (o.plan !== "crew" || o.offers.indexOf("pro_upgrade") > -1) return go("downsell.html");
      $$("[data-hc-accept]").forEach(function (a) { a.addEventListener("click", function () { acceptOffer("proUpgrade", a, "thank-you.html"); }); });
      var d = $("[data-hc-decline]"); if (d) d.addEventListener("click", function (e) { e.preventDefault(); go("downsell.html"); });
      var crew = plan("crew"), pro = plan("pro");
      $$("[data-hc-diff]").forEach(function (n) { n.textContent = fmt(priceOf(pro) - priceOf(crew)); });
      $$("[data-hc-otosave]").forEach(function (n) { n.textContent = fmt(priceOf(pro) - priceOf(crew) - C.offers.proUpgrade.price); });
    }
    if (page === "downsell") {
      if (o.plan === "dwy" || o.offers.indexOf("install") > -1 || o.offers.indexOf("brain") > -1) return go("thank-you.html");
      var s1 = $('[data-step="install"]'), s2 = $('[data-step="brain"]');
      var a1 = $("[data-hc-accept-install]"), d1 = $("[data-hc-decline-install]");
      var a2 = $("[data-hc-accept-brain]"), d2 = $("[data-hc-decline-brain]");
      if (a1) a1.addEventListener("click", function () { acceptOffer("install", a1, "thank-you.html"); });
      var fast = fastActive(o.ts);
      if (fast) { if (s2) s2.remove(); $$("[data-hc-fastonly]").forEach(function (n) { n.hidden = false; }); }
      if (d1) d1.addEventListener("click", function (e) {
        e.preventDefault();
        if (fast) { go("thank-you.html"); return; }
        s1.classList.add("is-out");
        setTimeout(function () { s1.hidden = true; s2.hidden = false; requestAnimationFrame(function () { s2.classList.add("is-in"); }); window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); }, reduceMotion ? 0 : 260);
      });
      if (a2) a2.addEventListener("click", function () { acceptOffer("brain", a2, "thank-you.html"); });
      if (d2) d2.addEventListener("click", function (e) { e.preventDefault(); go("thank-you.html"); });
    }
    if (page === "thanks") renderThanks(o);
  }

  function renderThanks(o) {
    /* Razorpay redirects back with ?offer=<id> (offer links) or razorpay_payment_id. */
    var offerQ = qs.get("offer");
    if (offerQ && o.pendingOffer === offerQ) { applyOffer(o, offerQ); delete o.pendingOffer; }
    else if (o.pendingOffer && qs.get("razorpay_payment_id")) { applyOffer(o, o.pendingOffer); delete o.pendingOffer; }
    store.set("hc_order", o, true);

    var p = plan(o.plan) || plan("crew");
    var base = plan(o.basePlan || o.plan) || p;
    var rows = ['<li><span>' + esc(base.name) + "</span><b>" + fmt(priceOf(base)) + "</b></li>"];
    (o.addons || []).forEach(function (id) { var a = addon(id); if (a) rows.push("<li><span>" + esc(a.name) + "</span><b>" + fmt(addonPrice(a)) + "</b></li>"); });
    o.offers.forEach(function (id) { var of = offerById(id); if (of) rows.push('<li class="is-offer"><span>' + esc(of.name) + "</span><b>" + fmt(of.price) + "</b></li>"); });
    var recap = $("[data-hc-recap]");
    if (recap) recap.innerHTML = rows.join("") + '<li class="is-total"><span>Paid today</span><b>' + fmt(o.total) + "</b></li>";
    var pid = qs.get("razorpay_payment_id");
    $$("[data-hc-ref]").forEach(function (n) { n.textContent = pid || o.ref; });
    $$("[data-hc-finalplan]").forEach(function (n) { n.textContent = p.name; });

    /* personalised next steps for offers that include a call */
    var call = $("[data-hc-call]");
    if (call) {
      var msg = "";
      if (o.plan === "dwy" && (o.basePlan === "dwy")) msg = "We will WhatsApp you to book your 60 minute live install. Keep your Meta, Google and store logins handy.";
      else if (o.offers.indexOf("install") > -1) msg = "We will WhatsApp you to book your 45 minute install call. We set up your top 5 agents on your brand.";
      else if (o.offers.indexOf("brain") > -1) msg = "We will WhatsApp you a 15 minute form. Your Company Brain comes back written for you.";
      if (o.offers.indexOf("pro_upgrade") > -1) msg = (msg ? msg + " " : "") + "Your Crew Pro videos and 200 commands come with the same download.";
      call.hidden = !msg; var cm = $("[data-hc-callmsg]", call); if (cm) cm.textContent = msg;
    }

    /* fast-action bonus: Company Brain written for them */
    var fa = C.fastAction, fastBox = $("[data-hc-fast]");
    if (fastBox) {
      var showFast = fa && fastActive(o.ts) && (o.basePlan || o.plan) !== "dwy" && o.offers.indexOf("brain") === -1;
      fastBox.hidden = !showFast;
      var fl = $("[data-hc-fast-link]", fastBox);
      if (fl && fa) fl.href = /^\[/.test(fa.intakeUrl || "") ? "#" : fa.intakeUrl;
    }

    /* install command picker */
    var ins = C.install || {};
    var cmd = $("[data-hc-cmd]");
    function setRt(rt) {
      if (cmd) cmd.textContent = (ins.command || "").replace("{rt}", rt);
      $$("[data-rt]").forEach(function (b) { var on = b.getAttribute("data-rt") === rt; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    }
    $$("[data-rt]").forEach(function (b) { b.addEventListener("click", function () { setRt(b.getAttribute("data-rt")); }); });
    setRt((ins.runtimes || ["claude"])[0]);
    var first = $("[data-hc-first]"); if (first) first.textContent = ins.firstCommand || "";
    $$("[data-copy]").forEach(function (b) {
      b.addEventListener("click", function () {
        var src = $(b.getAttribute("data-copy")); if (!src) return;
        var txt = src.textContent;
        var done = function () { b.classList.add("is-done"); var s = $("span", b); var old = s.textContent; s.textContent = "Copied"; setTimeout(function () { s.textContent = old; b.classList.remove("is-done"); }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done);
        else { var ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove(); done(); }
      });
    });
    /* business tabs: first 3 agents */
    $$("[data-tab]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-tab");
        $$("[data-tab]").forEach(function (x) { var on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
        $$("[data-tab-panel]").forEach(function (pn) { pn.hidden = pn.getAttribute("data-tab-panel") !== k; });
      });
    });
    /* WhatsApp links */
    var wa = C.whatsapp || {};
    $$("[data-hc-wa-community]").forEach(function (a) { a.href = /^\[/.test(wa.community || "") ? "#" : wa.community; });
    $$("[data-hc-wa-help]").forEach(function (a) {
      var num = String(wa.number || "").replace(/\D/g, "");
      a.href = num ? "https://wa.me/" + num + "?text=" + encodeURIComponent("Hi, I just bought Headcount (order " + o.ref + "). I need help with setup.") : "#";
    });
    /* pixel purchase, once per order */
    if (!o.purchaseTracked) {
      track("Purchase", { value: o.total, currency: C.currencyCode, content_ids: [o.plan].concat(o.addons || [], o.offers) });
      if (!isDemo()) { o.purchaseTracked = true; store.set("hc_order", o, true); }
    }
  }

  /* ---------- public API ---------- */
  var api = {
    open: function (planId) { openCheckout(planId); },
    close: function () { closeCheckout(); },
    select: function (planId, opts) { setPlan(planId); if (opts && opts.scroll) api.scrollToPricing(); },
    scrollToPricing: function (planId) {
      if (planId) setPlan(planId);
      var el = document.getElementById("pricing") || document.getElementById("pricing-app");
      if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    },
    toggleAddon: function (id, on) { setAddon(id, on); },
    getState: function () { var t = totals(); return { plan: state.plan, addons: orderedAddons(state.addons), total: t.total, save: t.save, method: state.method }; },
    on: function (fn) { document.addEventListener("hc:cart", function (e) { fn(e.detail); }); },
    timeLeft: function () { return LAUNCH_END ? Math.max(0, LAUNCH_END - Date.now()) : 0; },
    launchOver: launchOver,
    priceOf: function (id) { var p = plan(id); return p ? priceOf(p) : 0; },
    fmt: fmt,
    payLogos: payLogos,
    config: C
  };

  var queued = (window.HC_CART && window.HC_CART._q) || [];
  window.HC_CART = api;

  /* Any element on the page can open checkout or preselect a plan:
     <a href="#pricing" data-hc-checkout="crew">  opens the checkout drawer with Crew
     <a href="#pricing" data-hc-select="pro">      selects Crew Pro and scrolls to pricing */
  document.addEventListener("click", function (e) {
    var o = e.target.closest && e.target.closest("[data-hc-open]");
    if (o) { e.preventDefault(); openCheckout(); return; }
    var c = e.target.closest && e.target.closest("[data-hc-checkout]");
    if (c) { e.preventDefault(); openCheckout(c.getAttribute("data-hc-checkout") || undefined); return; }
    var s = e.target.closest && e.target.closest("[data-hc-select]");
    if (s) { e.preventDefault(); api.scrollToPricing(s.getAttribute("data-hc-select") || undefined); }
  });

  function init() {
    var page = document.body && document.body.getAttribute("data-hc-page");
    if (page) { initFunnel(page); return; }
    var mount = document.getElementById("pricing-app");
    if (mount) renderPricing(mount);
    update();
    queued.forEach(function (call) { try { api[call[0]].apply(api, call[1]); } catch (e) {} });
    if (qs.get("checkout") === "1") openCheckout();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
