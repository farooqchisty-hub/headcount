/* Headcount v2, section 10: bonuses. Owner: BONUS. Renders into #bonus-app.
   Reads (all optional) window.CONFIG: launchEnds, fastAction {enabled, endsAt, turnaround}, plans, checkoutAnchor.
   Publishes window.HCBonuses = { items, total(), activeTotal(), fastActive(), renderShot(el, slug) } so the
   pricing value stack can show the same number. Every mockup is HTML/CSS/SVG drawn on a 600x480 canvas. */
(function () {
  "use strict";

  var DEFAULT_END = "2026-11-30T23:59:59+05:30";
  var CFG = function () { return window.CONFIG || {}; };

  /* ---------- data (counts are taken from the package files listed in BONUSES.md) ---------- */
  var ITEMS = [
    { slug: "ad-swipe", mock: "sheet", tint: "lime", value: 1499,
      name: "The Ad Format Swipe File", format: "Google Sheet + PDF",
      desc: "40 static ad formats and 12 video structures, each with its layout, angle and copy rule.",
      inside: ["40 static formats", "12 video structures", "Batch mixing rules"], short: "Ad Format Swipe File" },
    { slug: "rulebook", mock: "book", tint: "gold", value: 1999,
      name: "The Ad Account Rulebook", format: "PDF playbook + rule card",
      desc: "When to kill, hold or scale an ad, the alarms to set, and the hacked-account plan.",
      inside: ["11 kill and scale rules", "21 alarm rules", "9-step hack runbook"], short: "Ad Account Rulebook" },
    { slug: "hook-vault", mock: "notion", tint: "lime", value: 1499,
      name: "The Hook Vault", format: "Notion template",
      desc: "12 hook types with the pattern, first frame and risk, plus a reel teardown database.",
      inside: ["12 hook codes", "17-field teardown", "6 trend formulas"], short: "Hook Vault" },
    { slug: "outreach-pack", mock: "fan", tint: "lime", value: 1499,
      name: "The Outreach Template Pack", format: "Google Doc + Markdown",
      desc: "16 plain-text templates for cold email, link building, creators and affiliates.",
      inside: ["16 templates", "12 reply drafts", "65 banned phrases"], short: "Outreach Template Pack" },
    { slug: "dm-scripts", mock: "phone", tint: "green", value: 999,
      name: "WhatsApp and DM Closing Scripts", format: "PDF + copy-paste doc",
      desc: "The comment-to-DM funnel, openers, a one-line offer and objection answers.",
      inside: ["6-step DM funnel", "9 message templates", "8 objection answers"], short: "WhatsApp and DM Scripts" },
    { slug: "motion-kit", mock: "player", tint: "blue", value: 1999,
      name: "The Motion Template Kit", format: "5 video templates",
      desc: "Kinetic type, count-up, walkthrough, review and carousel. Edit one block, render MP4.",
      inside: ["5 templates", "9:16 and 1:1", "Render checklist"], short: "Motion Template Kit" },
    { slug: "company-brain", mock: "doc", tint: "gold", value: 999, fast: true,
      name: "Your Company Brain, written for you", format: "Done for you",
      desc: "Fill a 15-minute form. We write and check your COMPANY.md, the file every agent reads before it does anything, and send it to you.",
      inside: ["14 sections", "Checked by hand", "From your website + form"], short: "Company Brain, written for you" }
  ];
  var SEG = ["#c6ff3d", "#93d12b", "#dcff8a", "#6fae22", "#b4ec55", "#eaffb8", null];

  /* ---------- helpers ---------- */
  function inr(n) { return "₹" + Number(n).toLocaleString("en-IN"); }
  function fastCfg() { var f = CFG().fastAction || {}; return f; }
  function fastEnabled() { return fastCfg().enabled !== false; }
  function fastEnd() {
    var raw = fastCfg().endsAt || CFG().launchEnds || DEFAULT_END;
    var t = Date.parse(raw);
    if (isNaN(t)) t = Date.parse(DEFAULT_END);
    return t;
  }
  function fastActive() { return fastEnabled() && Date.now() < fastEnd(); }
  function turnaround() { return fastCfg().turnaround || "3 working days"; }
  function visibleItems() { return ITEMS.filter(function (b) { return !b.fast || fastEnabled(); }); }
  function activeItems() { return ITEMS.filter(function (b) { return !b.fast || fastActive(); }); }
  function sum(list) { return list.reduce(function (a, b) { return a + b.value; }, 0); }
  function fmtEnd() {
    try {
      return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })
        .format(new Date(fastEnd())).replace(/\s?am$/i, " am").replace(/\s?pm$/i, " pm") + " IST";
    } catch (e) { return "30 Nov, 11:59 pm IST"; }
  }
  function planPrice() {
    var p = CFG().plans, v;
    try {
      if (Array.isArray(p) && p.length) v = p[0].price;
      else if (p && typeof p === "object") { var first = p.crew || p[Object.keys(p)[0]]; v = first && first.price; }
    } catch (e) {}
    v = Number(String(v || "").replace(/[^\d.]/g, ""));
    return v > 0 ? v : 2999;
  }
  var WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"];
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- small inline icons ---------- */
  var I = {
    check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3 3 7-7"/></svg>',
    clock: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10" cy="10" r="7.5"/><path d="M10 5.5V10l3 2"/></svg>',
    bolt: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.2 1L3 9h4l-1.2 6L13 7H9l.2-6z"/></svg>',
    star: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z"/></svg>',
    lock: '<svg viewBox="0 0 12 12" fill="currentColor"><path d="M3.5 5V3.8a2.5 2.5 0 015 0V5h.6c.5 0 .9.4.9.9v4.2c0 .5-.4.9-.9.9H2.9a.9.9 0 01-.9-.9V5.9c0-.5.4-.9.9-.9h.6zm1.2 0h2.6V3.8a1.3 1.3 0 00-2.6 0V5z"/></svg>',
    page: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 1.8h5.5L12.5 5v9.2h-8.5z"/><path d="M9.3 1.8V5h3.2"/></svg>',
    db: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2.5" width="12" height="11" rx="2"/><path d="M2 6.5h12M6.5 6.5v7"/></svg>',
    ticks: '<svg viewBox="0 0 16 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M1 5.5l2.6 2.6L9 2.5M6.5 8.1L12.2 2.5"/></svg>'
  };

  /* ---------- MOCKUPS (600x480 canvas each) ---------- */
  var MOCKS = {};

  MOCKS.sheet = function () {
    var rows = [
      ["F01", "Hero headline + product", "hero", "hero", "pd", "Argument in under 8 words"],
      ["F02", "Product + benefit subhead", "hero", "hero", "d", "Subhead adds the proof"],
      ["F03", "New launch announcement", "hero", "hero", "d", "Say what is new in one line"],
      ["F04", "Bold statement (text first)", "statement", "statement", "pm", "Works with the product hidden"],
      ["F05", "Question hook", "statement", "statement", "po", "A yes or no they answer yes"],
      ["F06", "Big quote testimonial", "testimonial", "testimonial", "dm", "Verbatim, 8 to 30 words"],
      ["F07", "Founder quote", "testimonial", "testimonial", "od", "Plain voice, first person"],
      ["F08", "Review card", "review_card", "review", "od", "No fake third-party UI"],
      ["F09", "Review stack (3 short)", "review_card", "review", "o", "Each under 15 words"],
      ["F10", "Press quote", "testimonial", "testimonial", "o", "Real coverage, quote exactly"],
      ["F11", "Us vs them table", "compare", "compare", "po", "Every tick true for all rows"]
    ];
    var body = rows.map(function (r, i) {
      var ags = r[4].split("").map(function (c) { return '<i class="ag ' + c + '">' + c.toUpperCase() + "</i>"; }).join("");
      return '<div class="sh-row' + (r[0] === "F04" ? " sel" : "") + '"><b>' + (i + 2) + '</b><span class="mono">' + r[0] + "</span><span>" + r[1] +
        '</span><span><i class="ly ' + r[3] + '">' + r[2] + "</i></span><span>" + ags + '</span><span class="rule">' + r[5] + "</span></div>";
    }).join("");
    return '<div class="m-sheet">' +
      '<div class="sh-win">' +
        '<div class="sh-top"><svg class="sh-ico" viewBox="0 0 20 26"><path d="M2.5 0h10L20 7.5v16A2.5 2.5 0 0117.5 26h-15A2.5 2.5 0 010 23.5v-21A2.5 2.5 0 012.5 0z" fill="#1e8e3e"/><path d="M12.5 0L20 7.5h-5A2.5 2.5 0 0112.5 5z" fill="#0d652d"/><rect x="4.5" y="11" width="11" height="10" rx="1" fill="#fff"/><path d="M4.5 14.4h11M4.5 17.7h11M9 11v10" stroke="#1e8e3e" stroke-width="1.2"/></svg>' +
          '<div><div class="sh-name">Ad Format Swipe File ' + I.star + '</div><div class="sh-menu"><span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Format</span><span>Data</span><span>Tools</span><span>Help</span></div></div>' +
          '<div class="sh-share">' + I.lock + " Share</div><div class=\"sh-av\">HC</div></div>" +
        '<div class="sh-tool"><i></i><i></i><i></i><i class="s"></i><i class="w"></i><i class="s"></i><i class="b"></i><i></i><i></i><i class="s"></i><i class="w"></i><i></i><i></i></div>' +
        '<div class="sh-fx"><span class="sh-ref">B5</span><span class="sh-fxi">fx</span><span class="sh-fxv">Bold statement (text first)</span></div>' +
        '<div class="sh-row sh-colh"><b></b><b>A</b><b class="on">B</b><b>C</b><b>D</b><b>E</b></div>' +
        '<div class="sh-row sh-hdr"><b>1</b><span>ID</span><span>Format</span><span>Layout</span><span>Angle</span><span>Copy rule</span></div>' +
        body +
        '<div class="sh-tabs"><span class="pl">+</span><span class="on">40 Static formats</span><span>12 Video structures</span><span>Batch rules</span></div>' +
      "</div>" +
      '<svg class="sh-curve" viewBox="0 0 600 480"><path d="M230 263 C 300 263, 340 236, 412 230" fill="none" stroke="#c6ff3d" stroke-width="1.6" stroke-dasharray="4 4" opacity=".95"/><circle cx="230" cy="263" r="3.5" fill="#c6ff3d"/></svg>' +
      '<div class="sh-pin">F04 example</div>' +
      '<div class="sh-ad bx-float" style="--d:-1s"><div class="k">EXAMPLE \u00B7 FICTIONAL BRAND</div><div class="h">Your third coffee is the <em>problem.</em></div><i class="leaf"></i><i class="tin"></i><div class="cta">Try the starter set</div></div>' +
    "</div>";
  };

  MOCKS.book = function () {
    return '<div class="m-book">' +
      '<div class="bk-card bx-float-s" style="--d:-2.5s"><div class="k"><span>RULE CARD</span><b>META</b></div><h5>Kill, hold or scale</h5>' +
        '<div class="row kill"><b>K1</b><span>Pause at 2x target CPA spent with zero sales (3x while learning)</span></div>' +
        '<div class="row kill"><b>K2</b><span>Pause at 4x CPA if 7-day ROAS is under 60% of target</span></div>' +
        '<div class="row"><b>H1</b><span>Anything else: hold, no change</span></div>' +
        '<div class="row scale"><b>S1</b><span>3-day ROAS 120% and 7-day 110% of target: budget +20%</span></div>' +
        '<div class="row"><b>B2</b><span>Budget changed in the last 24 h: wait</span></div>' +
        '<div class="tab">1 of 4</div></div>' +
      '<div class="bk-shadow"></div>' +
      '<div class="bk-wrap bx-float"><div class="bk">' +
        '<div class="bk-face bk-back"></div><div class="bk-face bk-right"></div><div class="bk-face bk-top"></div>' +
        '<div class="bk-face bk-spine"><i></i><span>THE AD ACCOUNT RULEBOOK</span><b></b></div>' +
        '<div class="bk-face bk-front"><div class="bk-k">HEADCOUNT PLAYBOOK <span>BONUS 02</span></div>' +
          '<div class="bk-t">The Ad Account<em>Rulebook</em></div>' +
          '<div class="bk-s">When to kill, hold or scale. The rules our ad agents run on, written for humans.</div>' +
          '<div class="bk-rules"><div><b>K1</b><i class="r">PAUSE</i><span>2x CPA, 0 sales</span></div><div><b>H1</b><i class="h">HOLD</i><span>no clear signal</span></div><div><b>S1</b><i class="g">+20%</i><span>ROAS 120% of target</span></div></div>' +
          '<div class="bk-foot"><span>META \u00B7 GOOGLE \u00B7 WATCHDOG</span><svg viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" rx="4" fill="#c6ff3d"/><path d="M5 11V5M11 11V5M5 8h6" stroke="#0a0c06" stroke-width="1.8"/></svg></div>' +
          '<i class="bk-sheen"></i></div>' +
      "</div></div>" +
    "</div>";
  };

  MOCKS.notion = function () {
    var hooks = [
      ["H1", "Contrarian claim", "“Stop doing X.”", "pr", "Needs proof", "#c6ff3d"],
      ["H2", "Specific number", "“3 things...” “in 11 days”", "lo", "Low risk", "#ffc65c"],
      ["H3", "POV moment", "“POV: you finally...”", "lo", "Low risk", "#6ea8ff"],
      ["H4", "Result first", "“This took 20 minutes.”", "pr", "Needs a real result", "#ff9b7a"],
      ["H5", "Curiosity gap", "“The one setting nobody...”", "md", "Pay off by 10 s", "#c5a6ff"],
      ["H7", "Mistake or warning", "“If you do this, stop.”", "lo", "Low risk", "#7fe0c4"]
    ];
    var cards = hooks.map(function (h) {
      return '<div class="nt-c"><div class="pv" style="background:' + h[5] + '"><span>' + h[0] + '</span></div><div class="bd"><div class="t">' + h[1] + '</div><div class="q">' + h[2] + '</div><span class="tg ' + h[3] + '">' + h[4] + "</span></div></div>";
    }).join("");
    var side = [["Hook Vault", "db", 1], ["Reel teardowns", "db"], ["Remake briefs", "db"], ["Trend formulas", "page"], ["Founder hooks", "page"], ["Scoring rubric", "page"]]
      .map(function (s) { return '<div class="nt-item' + (s[2] ? " on" : "") + '">' + I[s[1]] + s[0] + "</div>"; }).join("");
    return '<div class="m-notion">' +
      '<div class="nt-win"><div class="nt-chrome"><span class="nt-dots"><i></i><i></i><i></i></span><span class="nt-url">' + I.lock + " notion.so/headcount/hook-vault</span></div>" +
        '<div class="nt-body"><div class="nt-side"><div class="nt-ws"><i>H</i>Headcount bonuses</div><div class="nt-sec">BONUS 03</div>' + side + "</div>" +
          '<div class="nt-main"><div class="nt-cover"></div><div class="nt-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v11a4 4 0 11-8 0v-1.5"/><path d="M4 12.5l2.5 2"/><circle cx="12" cy="3" r="1.2" fill="currentColor"/></svg></div>' +
            '<div class="nt-page"><div class="nt-title">Hook Vault</div><div class="nt-desc">12 hook codes. Code what the viewer gets in the first 1.5 s.</div>' +
              '<div class="nt-views"><span class="on">Gallery</span><span>Table</span><span>By risk</span><span>Scoring</span><span class="new">New</span></div>' +
              '<div class="nt-gal">' + cards + "</div></div></div></div></div>" +
      '<div class="nt-float bx-float" style="--d:-2s"><div class="h">Teardown <span>17 FIELDS</span></div><dl>' +
        "<dt>hook_code</dt><dd><b>H7-mistake</b></dd><dt>secondary</dt><dd>H2-number</dd><dt>first_cut_s</dt><dd>1.1</dd><dt>cuts_per_10s</dt><dd>6</dd><dt>text_density</dt><dd>9 words</dd><dt>loop</dt><dd>yes</dd></dl></div>" +
    "</div>";
  };

  MOCKS.fan = function () {
    var cards = [
      { a: -26, z: 1, tag: "t1", tagt: "Cold email", no: "01 / 16", h: "Signal-led email 1", sub: "Saw the {{signal}} at {{company}}", lines: 5 },
      { a: -13, z: 2, tag: "t4", tagt: "Creator", no: "11 / 16", h: "Creator first message", sub: "{{first_name}}, loved the {{post}}", lines: 5 },
      { a: 0, z: 5, front: true },
      { a: 13, z: 4, tag: "t2", tagt: "Podcast", no: "09 / 16", h: "Guest pitch", sub: "Guest for {{show_name}}", lines: 5 },
      { a: 26, z: 3, tag: "t5", tagt: "Reply", no: "Reply 01", h: "Interested: book it", sub: "Re: {{original_subject}}", lines: 4 }
    ];
    var html = cards.map(function (c, i) {
      if (c.front) {
        return '<div class="fn-card c2" style="--a:0;z-index:5"><div class="tp"><span class="tag t3">Link building</span><span class="no">05 / 16</span></div>' +
          "<h6>Broken link replacement</h6>" +
          '<div class="sub"><span>Subject:</span> Dead link on your <i class="f">{{page_topic}}</i> page</div>' +
          '<p>Hi <i class="f">{{first_name}}</i>, I was using your <i class="f">{{page_title}}</i> list and noticed the link to <i class="f">{{dead_anchor}}</i> now returns an error. We publish <i class="f">{{our_page_title}}</i>, which covers the same thing and is updated for <i class="f">{{year}}</i>. Might be a useful swap.</p>' +
          '<div class="chk">' + I.check + 'Replace every field with real, checked details</div><div class="ft"><span>Under 120 words</span><b>One ask</b></div></div>';
      }
      var ln = ""; for (var k = 0; k < c.lines; k++) ln += '<div class="ln" style="width:' + [96, 88, 92, 70, 84][k] + '%"></div>';
      return '<div class="fn-card c' + i + '" style="--a:' + c.a + ";z-index:" + c.z + '"><div class="tp"><span class="tag ' + c.tag + '">' + c.tagt + '</span><span class="no">' + c.no + "</span></div><h6>" + c.h +
        '</h6><div class="sub"><span>Subject:</span> ' + c.sub.replace(/\{\{([a-z_]+)\}\}/g, '<i class="f">{{$1}}</i>') + "</div>" + ln + '<div class="ft"><span>Plain text</span><b>One ask</b></div></div>';
    }).join("");
    return '<div class="m-fan"><div class="fn-hand bx-float-s">' + html + "</div>" +
      '<div class="fn-sticker bx-float" style="--d:-1.2s"><div><b>16</b>plain-text<br>templates</div></div>' +
      '<div class="fn-chip bx-float" style="left:30px;top:44px;--d:-3s">+ <b>12</b> reply drafts</div>' +
      '<div class="fn-chip bx-float" style="left:44px;top:88px;--d:-4.2s"><b>65</b> banned AI phrases</div>' +
    "</div>";
  };

  MOCKS.phone = function () {
    var tm = function (t, out) { return '<span class="tm">' + t + (out ? I.ticks : "") + "</span>"; };
    return '<div class="m-phone">' +
      '<div class="ph bx-float"><div class="ph-scr"><i class="ph-island"></i>' +
        '<div class="ph-status"><span>9:41</span><svg viewBox="0 0 44 10" fill="#e9edef"><rect x="0" y="6" width="3" height="4" rx=".6"/><rect x="4.5" y="4" width="3" height="6" rx=".6"/><rect x="9" y="2" width="3" height="8" rx=".6"/><rect x="13.5" y="0" width="3" height="10" rx=".6"/><path d="M24 3.2a7 7 0 019.6 0l-1.1 1.2a5.4 5.4 0 00-7.4 0zM26.2 5.6a3.8 3.8 0 015.2 0l-1.1 1.2a2.2 2.2 0 00-3 0zM28.8 8.2l1-1 1 1-1 1z"/><rect x="35.5" y=".8" width="7.5" height="8.4" rx="2" fill="none" stroke="#e9edef" stroke-width=".9"/><rect x="36.7" y="2" width="5" height="6" rx="1"/></svg></div>' +
        '<div class="ph-head"><svg class="bkc" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7.5 2L3.5 6l4 4"/></svg><span class="av">P</span><span class="nm"><b>Priya</b><span>typing<span class="ph-dots"><i></i><i></i><i></i></span></span></span>' +
          '<svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="4" width="9" height="8" rx="2"/><path d="M10.5 7l4-2.5v7l-4-2.5"/></svg><svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4.5 1.8l2 3.4-1.4 1.4a8 8 0 004.3 4.3l1.4-1.4 3.4 2-1 2.3c-6 .3-11-4.7-10.7-10.7z"/></svg></div>' +
        '<div class="ph-chat"><span class="ph-day">Today</span>' +
          '<div class="ph-b in">Hi, saw your reel. Price?' + tm("9:38") + "</div>" +
          '<div class="ph-b out ph-hl">Happy to help! Want the link, or a quick rundown first?' + tm("9:38", 1) + "</div>" +
          '<div class="ph-qr"><span>Send the link</span><span>Rundown</span></div>' +
          '<div class="ph-b in">Send the link' + tm("9:39") + "</div>" +
          '<div class="ph-b out ph-hl">Starter Set is ₹1,499. Three blends and a steel infuser. Checkout: <span class="lk">your-link</span>' + tm("9:39", 1) + "</div>" +
          '<div class="ph-b in">Shipping charges kitne hain?' + tm("9:40") + "</div>" +
          '<div class="ph-b out ph-hl">Free over ₹999. Delivered in 2 to 4 days.' + tm("9:40", 1) + "</div>" +
        "</div>" +
        '<div class="ph-in"><span class="f"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6.5"/><path d="M5.5 9.8c1.4 1.4 3.6 1.4 5 0"/><circle cx="6" cy="6.5" r=".6" fill="currentColor"/><circle cx="10" cy="6.5" r=".6" fill="currentColor"/></svg>Message</span><span class="mic"><svg viewBox="0 0 16 16" fill="currentColor"><rect x="5.5" y="1.5" width="5" height="8.5" rx="2.5"/><path d="M3.5 8a4.5 4.5 0 009 0M8 12.5v2" stroke="currentColor" stroke-width="1.4" fill="none"/></svg></span></div>' +
      "</div></div>" +
      '<svg class="ph-lines" viewBox="0 0 600 480"><g fill="none" stroke="#c6ff3d" stroke-width="1.3" stroke-dasharray="3 4" opacity=".75"><path d="M262 185 C 292 185, 294 104, 318 104"/><path d="M262 290 C 292 290, 294 236, 318 236"/><path d="M262 377 C 292 377, 294 368, 318 368"/></g><g fill="#c6ff3d"><circle cx="262" cy="185" r="3"/><circle cx="262" cy="290" r="3"/><circle cx="262" cy="377" r="3"/></g></svg>' +
      '<div class="ph-note bx-float-s" style="left:318px;top:62px;--d:-1s"><div class="k"><i>1</i>Opener</div><p>No link in the first reply. One question, two quick replies.</p></div>' +
      '<div class="ph-note bx-float-s" style="left:318px;top:194px;--d:-3s"><div class="k"><i>2</i>Offer formula</div><p><code>{name} is {price}. {one benefit}. Checkout: {link}</code></p></div>' +
      '<div class="ph-note bx-float-s" style="left:318px;top:326px;--d:-5s"><div class="k"><i>3</i>Objection</div><p>Answer with the exact threshold and time. Never invent a discount.</p></div>' +
    "</div>";
  };

  MOCKS.player = function () {
    var ch = [
      ["k1", "Kinetic type", "8 s", 8, '<b>STOP<br><i>WHAT</i></b>'],
      ["k2", "Stat count-up", "6 s", 6, "42%"],
      ["k3", "UI walkthrough", "10 s", 10, "<i></i><i></i><i></i><em></em>"],
      ["k4", "Animated review", "7 s", 7, "<b>★★★★★</b>"],
      ["k5", "Carousel to video", "12.5 s", 12.5, "<i></i><i></i>"]
    ];
    var list = ch.map(function (c, i) {
      return '<div class="pl-ch' + (i === 0 ? " on" : "") + '"><span class="th ' + c[0] + '">' + c[4] + '</span><span><div class="t">0' + (i + 1) + " " + c[1] + '</div><div class="d">' + (i === 0 ? "Now playing \u00B7 " : "") + c[2] + "</div></span></div>";
    }).join("");
    var prog = ch.map(function (c, i) { return '<i class="' + (i === 0 ? "done" : "") + '" style="--v:' + c[3] + (i === 0 ? ";--p:62%" : "") + '"></i>'; }).join("");
    return '<div class="m-player">' +
      '<div class="pl-win"><div class="pl-bar"><span class="nt-dots"><i></i><i></i><i></i></span><b>motion-template-kit / preview-reel.mp4</b></div>' +
        '<div class="pl-vid"><div class="pl-blur"></div><div class="pl-frame"><div class="l">Stop</div><div class="l">guessing</div><div class="l a">what works</div><div class="kick">Copy the mechanism, not the video.</div><i class="bar"></i></div>' +
          '<div class="pl-ctrl"><div class="pl-prog">' + prog + '<span class="pl-head" style="--x:11.4%"></span><span class="pl-tip" style="--x:11.4%">01 Kinetic type</span></div>' +
            '<div class="pl-row"><svg viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1.5" width="2.8" height="9" rx=".6"/><rect x="7.2" y="1.5" width="2.8" height="9" rx=".6"/></svg><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M1.5 4.5h2l3-2.5v8l-3-2.5h-2z" fill="currentColor"/><path d="M8.5 4a3 3 0 010 4"/></svg><span>0:05 / 0:43</span><span class="sp"></span><span>CC</span><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M1.5 4V1.5H4M8 1.5h2.5V4M10.5 8v2.5H8M4 10.5H1.5V8"/></svg></div></div></div>' +
        '<div class="pl-meta"><h6>The Motion Template Kit \u00B7 preview reel</h6><div><span>5 chapters</span><span>HyperFrames</span><span>Apache-2.0</span></div></div>' +
        '<div class="pl-list"><div class="hd">Chapters</div>' + list + "</div>" +
      "</div>" +
      '<div class="pl-json bx-float" style="--d:-1.5s"><div class="hd"><span>content.json</span><b>edit this, render</b></div>' +
        '{ <span class="k">"lines"</span>: [<span class="s">"Stop"</span>, <span class="s">"guessing"</span>, <span class="s">"what works"</span>],<br>&nbsp;&nbsp;<span class="k">"kicker"</span>: <span class="s">"Copy the mechanism, not the video."</span> }</div>' +
      '<div class="pl-fmts bx-float-s" style="--d:-3s"><span><b>9:16</b> 1080x1920</span><span><b>1:1</b> 1080x1080</span><span><b>MP4</b> render</span></div>' +
    "</div>";
  };

  MOCKS.doc = function () {
    var seal = '<svg viewBox="0 0 140 140"><defs><radialGradient id="bxg" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff1c4"/><stop offset=".45" stop-color="#ffc65c"/><stop offset="1" stop-color="#b9821f"/></radialGradient><path id="bxc" d="M70 70m-50 0a50 50 0 1 1 100 0a50 50 0 1 1 -100 0"/></defs>' +
      '<g><circle cx="70" cy="70" r="66" fill="url(#bxg)"/><circle cx="70" cy="70" r="60" fill="none" stroke="#7a5310" stroke-width="1" stroke-dasharray="2 3" opacity=".55"/><circle cx="70" cy="70" r="38" fill="#1b1407" opacity=".9"/>' +
      '<text font-family="Geist Mono, monospace" font-size="9.6" font-weight="700" letter-spacing="2.6" fill="#3d2a06"><textPath href="#bxc" startOffset="0">WRITTEN FOR YOU \u00B7 FAST-ACTION BONUS \u00B7 HEADCOUNT \u00B7</textPath></text>' +
      '<path d="M55 71l10 10 20-22" fill="none" stroke="#ffc65c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';
    return '<div class="m-doc"><div class="dc-back"></div>' +
      '<div class="dc bx-float-s" style="--d:-2s"><div class="top"><span>brain/COMPANY.md</span></div><h4>COMPANY.md</h4><div class="by">Written by Headcount from your website and form. Checked by hand.</div>' +
        '<h5><i>01</i>Brand</h5><div class="kv"><b>name:</b> <mark>Fernhollow</mark><br><b>one_liner:</b> Small-batch loose leaf tea blends for busy adults who want a calmer morning.</div>' +
        '<h5><i>02</i>Offer</h5><div class="kv"><b>core_offer:</b> <mark>Starter Tin Set</mark><br><b>guarantee:</b> 30 day taste guarantee</div>' +
        '<h5><i>05</i>Customer</h5><div class="kv"><b>top_pains:</b> <mark>"my third coffee makes me shaky"</mark></div>' +
        '<h5><i>06</i>Voice</h5><div class="kv"><b>three_words:</b> warm, plain, quietly funny<br><b>we_are_not:</b> wellness guru, clinical, hype</div>' +
        '<h5><i>10</i>Claims</h5><div class="kv"><b>never_say:</b> <span class="no">"detox", "cleanse", "organic"</span></div>' +
        '<div class="foot"><span>14 sections</span><span>Example, fictional brand</span></div></div>' +
      '<div class="dc-seal bx-float" style="--d:-1s">' + seal + "</div>" +
      '<div class="dc-check bx-float" style="--d:-3.5s"><div class="k">How it gets done</div>' +
        "<div>" + I.check + "15-minute form<span>you</span></div>" +
        "<div>" + I.check + "Website read<span>agent</span></div>" +
        "<div>" + I.check + "Every field checked<span>human</span></div>" +
        '<div class="wait">' + I.clock + 'Sent to you<span data-bx-turn>' + turnaround() + "</span></div></div>" +
    "</div>";
  };

  /* ---------- section markup ---------- */
  function stage(b) {
    return '<div class="bx-stage" data-tint="' + b.tint + '" aria-hidden="true"><div class="bx-tilt"><div class="bx-canvas">' + MOCKS[b.mock]() + '</div></div><span class="bx-glare"></span></div>';
  }
  function insideList(b) { return '<ul class="bx-inside">' + b.inside.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>"; }

  function cardHTML(b, n) {
    return '<article class="bx-card reveal" data-slug="' + b.slug + '">' + stage(b) +
      '<div class="bx-body"><div class="bx-tags"><span class="bx-num">Bonus ' + n + '</span><span class="bx-fmt">' + b.format + "</span></div>" +
      '<h3 class="bx-name">' + b.name + '</h3><p class="bx-desc">' + b.desc + "</p>" + insideList(b) +
      '<div class="bx-price"><span class="bx-worth">Worth <s>' + inr(b.value) + '</s></span><span class="bx-free">Free</span></div></div></article>';
  }

  function fastHTML(b, n) {
    return '<article class="bx-fast bx-card reveal" data-slug="' + b.slug + '"><div class="bx-fast-in">' + stage(b) +
      '<div class="bx-body"><div class="bx-tags"><span class="bx-fa">' + I.bolt + 'Fast-action bonus</span><span class="bx-num">Bonus ' + n + "</span></div>" +
      '<h3 class="bx-name">' + b.name + '</h3><p class="bx-desc">' + b.desc.replace("and send it to you.", "and send it to you within " + turnaround() + ".") + "</p>" +
      '<p class="bx-cond">' + I.clock + '<span data-bx-cond>Yours if you buy before <b>' + fmtEnd() + "</b>. After that it is sold on its own.</span></p>" +
      '<div class="bx-cd-wrap" data-bx-cdwrap><span class="bx-cd-k">Fast-action window closes in</span><div class="bx-cd" data-bx-cd role="timer" aria-live="off">' +
        '<div><b data-u="d">00</b><span>Days</span></div><div><b data-u="h">00</b><span>Hrs</span></div><div><b data-u="m">00</b><span>Min</span></div><div><b data-u="s">00</b><span>Sec</span></div></div></div>' +
      '<div class="bx-price"><span class="bx-worth">Worth <s>' + inr(b.value) + '</s></span><span class="bx-free" data-bx-fastfree>Free before deadline</span></div></div></div></article>';
  }

  function totalHTML() {
    var vis = visibleItems();
    var segs = vis.map(function (b, i) {
      var cls = b.fast ? "fa" : "";
      return '<i class="' + cls + '" data-slug="' + b.slug + '" style="--v:' + b.value + ";--n:" + i + ";--c:" + (SEG[i] || "#ffc65c") + '"><em>' + inr(b.value) + "</em></i>";
    }).join("");
    var legend = vis.map(function (b, i) {
      return '<li data-slug="' + b.slug + '"><i style="--c:' + (b.fast ? "#ffc65c" : SEG[i]) + '"></i><span>' + (i + 1) + ". " + b.short + (b.fast ? " (fast-action)" : "") + "</span><b>" + inr(b.value) + "</b></li>";
    }).join("");
    return '<div class="bx-total reveal" data-bx-total><div class="bx-total-top"><div><p class="bx-total-k">Total bonus value</p><p class="bx-total-v" data-bx-sum>' + inr(sum(activeItems())) + "</p></div>" +
      '<div class="bx-total-pay"><p>You pay for bonuses</p><b>' + inr(0) + "</b></div></div>" +
      '<div class="bx-bar" aria-hidden="true">' + segs + '</div><ol class="bx-legend">' + legend + "</ol>" +
      '<p class="bx-fine">Values are set at or below what comparable templates, playbooks and services sell for in India. Bonus ' + vis.length + " is the same service we sell on its own for " + inr(999) + ".</p></div>";
  }

  function headHTML() {
    var n = activeItems().length;
    return '<header class="bx-head reveal"><p class="eyebrow">Bonuses</p>' +
      '<h2 class="bx-h2">Plus <span class="bx-gold" data-bx-sum>' + inr(sum(activeItems())) + '</span> of bonuses, <span class="serif">free</span> with every plan</h2>' +
      '<p class="bx-sub"><span data-bx-count>' + WORDS[n] + "</span> extras built from the playbooks the 40 agents run on, packaged so you and your team can use them without opening an AI tool.</p>" +
      '<div class="bx-strip"><span><b>6</b> ready the day you buy</span>' + (fastActive() ? '<span data-bx-fastonly><b>1</b> written for you, if you buy before ' + fmtEnd().replace(/,.*$/, "") + "</span>" : "") + "</div></header>";
  }

  function ctaHTML() {
    var n = activeItems().length;
    var anchor = CFG().checkoutAnchor || "#pricing";
    return '<div class="bx-cta"><a class="btn-primary" href="' + anchor + '"><span class="bx-cta-l">Get Headcount + <span data-bx-n>' + n + "</span> bonuses for " + inr(planPrice()) + '</span><span class="bx-cta-s">Get Headcount + bonuses: ' + inr(planPrice()) + '</span><span aria-hidden="true">→</span></a>' +
      "<p>One-time payment. Bonuses 1 to 6 arrive with your download" + (fastActive() ? '<span data-bx-fastonly>; bonus 7 within ' + turnaround() + " of your form</span>" : "") + ".</p></div>";
  }

  /* ---------- behaviour ---------- */
  function fitStages(root) {
    var stages = root.querySelectorAll(".bx-stage");
    function fit(st) {
      var w = st.clientWidth, h = st.clientHeight;
      if (!w) return;
      var k = Math.min(w / 600, h / 480);
      st.style.setProperty("--k", k.toFixed(4));
      var c = st.querySelector(".bx-canvas");
      if (c) { c.style.left = ((w - 600 * k) / 2).toFixed(1) + "px"; c.style.top = ((h - 480 * k) / 2).toFixed(1) + "px"; }
    }
    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function (es) { es.forEach(function (e) { fit(e.target); }); });
      stages.forEach(function (s) { ro.observe(s); });
    } else {
      var all = function () { stages.forEach(fit); };
      window.addEventListener("resize", all); all();
    }
    stages.forEach(fit);
  }

  function reveal(root) {
    var els = root.querySelectorAll(".reveal,.bx-card,[data-bx-total]");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in", "bx-on"); }); countUp(root); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          if (e.target.hasAttribute("data-bx-total") && !e.target._counted) { e.target._counted = 1; countUp(root); }
        }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (e) { io.observe(e); });
    /* run animations only while a card is near the viewport */
    var live = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle("bx-on", e.isIntersecting); }); }, { rootMargin: "120px 0px" });
    root.querySelectorAll(".bx-card").forEach(function (c) { live.observe(c); });
  }

  function countUp(root) {
    var target = sum(activeItems());
    var el = root.querySelector(".bx-total-v[data-bx-sum]");
    if (!el) return;
    if (reduced) { el.textContent = inr(target); return; }
    var t0 = performance.now(), dur = 1300;
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = inr(Math.round(target * e));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  function tilt(root) {
    if (reduced) return;
    var cards = Array.prototype.slice.call(root.querySelectorAll(".bx-card"));
    var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) {
      cards.forEach(function (card) {
        var st = card.querySelector(".bx-stage"), tl = card.querySelector(".bx-tilt");
        if (!st || !tl) return;
        card.addEventListener("pointermove", function (ev) {
          var r = st.getBoundingClientRect();
          var x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
          tl.style.setProperty("--ry", ((x - 0.5) * 9).toFixed(2) + "deg");
          tl.style.setProperty("--rx", ((0.5 - Math.min(1.2, y)) * 7).toFixed(2) + "deg");
          st.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
          st.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
        });
        card.addEventListener("pointerleave", function () { tl.style.setProperty("--rx", "0deg"); tl.style.setProperty("--ry", "0deg"); });
      });
      return;
    }
    /* touch: a gentle scroll-linked tilt on cards that are on screen */
    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var vh = window.innerHeight;
        cards.forEach(function (card) {
          if (!card.classList.contains("bx-on")) return;
          var tl = card.querySelector(".bx-tilt"), st = card.querySelector(".bx-stage");
          if (!tl || !st) return;
          var r = st.getBoundingClientRect();
          var p = (r.top + r.height / 2) / vh; /* 0 top, 1 bottom */
          p = Math.max(-0.2, Math.min(1.2, p));
          tl.style.setProperty("--rx", ((p - 0.5) * 9).toFixed(2) + "deg");
        });
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function countdown(root) {
    var card = root.querySelector(".bx-fast");
    if (!card) return;
    var cd = card.querySelector("[data-bx-cd]");
    var u = {}; cd.querySelectorAll("b[data-u]").forEach(function (b) { u[b.getAttribute("data-u")] = b; });
    var timer;
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function tick() {
      var left = fastEnd() - Date.now();
      if (left <= 0) { clearInterval(timer); endFast(root); return; }
      var s = Math.floor(left / 1000);
      u.d.textContent = pad(Math.floor(s / 86400));
      u.h.textContent = pad(Math.floor((s % 86400) / 3600));
      u.m.textContent = pad(Math.floor((s % 3600) / 60));
      u.s.textContent = pad(s % 60);
    }
    tick();
    if (fastActive()) timer = setInterval(tick, 1000);
  }

  function endFast(root) {
    var card = root.querySelector(".bx-fast");
    if (!card || card.classList.contains("bx-ended")) return;
    card.classList.add("bx-ended");
    var w = card.querySelector("[data-bx-cdwrap]");
    if (w) w.outerHTML = '<p class="bx-ended-note">The fast-action window closed on ' + fmtEnd() + ". This service is now sold on its own.</p>";
    var c = card.querySelector(".bx-cond"); if (c) c.remove();
    root.querySelectorAll("[data-bx-fastonly]").forEach(function (el) { el.remove(); });
    var f = card.querySelector("[data-bx-fastfree]"); if (f) { f.textContent = "Ended"; f.style.color = "var(--mut)"; }
    root.querySelectorAll('[data-slug="company-brain"]').forEach(function (el) { if (el.tagName === "I" || el.tagName === "LI") el.classList.add("off"); });
    var total = inr(sum(activeItems()));
    root.querySelectorAll("[data-bx-sum]").forEach(function (el) { el.textContent = total; });
    var n = activeItems().length;
    root.querySelectorAll("[data-bx-n]").forEach(function (el) { el.textContent = n; });
    root.querySelectorAll("[data-bx-count]").forEach(function (el) { el.textContent = WORDS[n]; });
  }

  function render(root) {
    var vis = visibleItems();
    var regular = vis.filter(function (b) { return !b.fast; });
    var fast = vis.filter(function (b) { return b.fast; })[0];
    var html = '<div class="bx">' + headHTML() + '<div class="bx-grid">' +
      regular.map(function (b, i) { return cardHTML(b, i + 1); }).join("") + "</div>" +
      (fast ? fastHTML(fast, regular.length + 1) : "") + totalHTML() + ctaHTML() + "</div>";
    root.innerHTML = html;
    fitStages(root);
    reveal(root);
    tilt(root);
    if (fast) { if (fastActive()) countdown(root); else endFast(root); }
  }

  /* single-mockup render for PNG export (bonuses-test.html?shot=slug) */
  function renderShot(el, slug) {
    var b = ITEMS.filter(function (x) { return x.slug === slug; })[0];
    if (!b) { el.textContent = "unknown slug"; return; }
    document.documentElement.classList.add("bx-shot");
    el.innerHTML = '<div class="bx-stage" data-tint="' + b.tint + '"><div class="bx-tilt"><div class="bx-canvas">' + MOCKS[b.mock]() + "</div></div></div>";
  }

  window.HCBonuses = {
    items: ITEMS,
    total: function () { return sum(visibleItems()); },
    activeTotal: function () { return sum(activeItems()); },
    fastActive: fastActive,
    renderShot: renderShot
  };

  function boot() {
    var app = document.getElementById("bonus-app");
    if (app && !app.hasAttribute("data-bx-done")) { app.setAttribute("data-bx-done", ""); render(app); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
