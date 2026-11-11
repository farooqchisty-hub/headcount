/* Headcount v2: single source of truth for prices, offers, checkout and urgency.
   Owned by FUNNEL. Read by every section. Load this file FIRST, without defer:
   <script src="assets/js/config.js"></script>
   Rules: one-time prices only, strike = the real post-launch price, urgency only from launchEnds.
   No em dashes or en dashes anywhere. */
window.CONFIG = {
  brand: "Headcount",
  currency: "₹",
  currencyCode: "INR",
  locale: "en-IN",

  /* Launch price ends at this moment (IST). Countdowns count to this. After it passes,
     cart.js automatically charges and shows the strike (post-launch) prices. */
  launchEnds: "2026-11-30T23:59:59+05:30",
  launchEndsLabel: "30 Nov",
  priceAfter: 4999, /* Crew price after launchEnds */

  /* Fast-action bonus (bonus 7 in the bonuses section): buyers who pay before endsAt get
     their Company Brain written for them free. While it is active the ₹999 "Company Brain
     written for you" downsell is skipped and thank-you.html links the intake form. */
  fastAction: {
    endsAt: "2026-11-30T23:59:59+05:30",
    label: "Company Brain written for you",
    worth: 999,
    intakeUrl: "[https://forms.gle/REPLACE_INTAKE_FORM]"
  },

  /* true = Pay buttons walk the demo funnel (oto, downsell, thank-you) without charging.
     Set to false once every checkout URL below is real. Any URL still containing
     "REPLACE" is treated as demo even when demoMode is false, so a buyer never lands
     on a dead link. Add ?demo=1 to any page URL to force demo mode for testing. */
  demoMode: true,

  /* Hiring anchor used in headlines. */
  hireAnchor: { monthly: 40000, line: "One junior marketer in India costs ₹25,000 to ₹40,000 a month." },

  agentCount: 40,
  coreCount: 2,

  plans: [
    {
      id: "crew", name: "Crew", short: "Crew",
      price: 2999, strike: 4999,
      badge: "Start here", default: true,
      forWho: "For founders who are the marketing team.",
      math: "₹75 per agent",
      mathSub: "40 agents + 2 core agents",
      intro: "",
      features: [
        "All 40 agents across 9 departments",
        "Company Brain + Growth Ledger (core)",
        "Monday Standup: one page every Monday",
        "One installer: ChatGPT, Claude, Codex, OpenClaw, Hermes",
        "9 setup guides, 1,100+ files",
        "12 months of updates"
      ]
    },
    {
      id: "pro", name: "Crew Pro", short: "Pro",
      price: 5999, strike: 9999,
      badge: "Best value",
      forWho: "For agencies, freelancers and serious operators.",
      math: "₹600 per client brand",
      mathSub: "use it on up to 10 brands",
      intro: "Everything in Crew, plus",
      features: [
        "Video walkthrough of every department",
        "200 ready commands by business type",
        "Client use for up to 10 brands",
        "Lifetime updates",
        "60 days priority WhatsApp help"
      ]
    },
    {
      id: "dwy", name: "Done With You", short: "Done With You",
      price: 11999, strike: 19999,
      badge: "We set it up",
      forWho: "For anyone who wants it running this week.",
      math: "₹300 per agent",
      mathSub: "installed live on your accounts",
      intro: "Everything in Crew Pro, plus",
      features: [
        "60 minute live install on your accounts",
        "Company Brain written for you",
        "Top 5 agents set up and run",
        "30 days WhatsApp help"
      ]
    }
  ],

  /* On-page add-ons. "requires" limits an add-on to certain plans. "bump" marks the
     checkout order bump. Like plans, an add-on with a strike price charges the strike
     price after launchEnds, so "normally" is always a price that is really charged. */
  addons: [
    {
      id: "niche", name: "Niche Brain Pack", price: 499, strike: 1499, bump: true,
      benefit: "12 pre-filled Company Brain files by niche + 40 first commands.",
      bumpTitle: "Yes, add the Niche Brain Pack for {price}",
      bumpBody: "Skip the blank page. 12 ready Company Brain files (skincare, fashion, supplements, food, home, SaaS, agency, coach, local) plus 40 first commands to paste."
    },
    {
      id: "creatives", name: "50 done-for-you ad creatives", price: 2999,
      benefit: "We run Static Ad Factory on your website and send 50 finished ads."
    },
    {
      id: "whitelabel", name: "White-label licence", price: 9999, requires: ["pro", "dwy"],
      benefit: "Rebrand the agents and resell them to your clients.",
      lockedNote: "Needs Crew Pro or Done With You."
    },
    {
      id: "custom", name: "Custom agent", price: 14999,
      benefit: "We build one new agent around one workflow of yours."
    }
  ],

  /* Post-purchase offers (oto.html, downsell.html). */
  offers: {
    proUpgrade: {
      id: "pro_upgrade", name: "Crew Pro upgrade", price: 2499,
      eligible: ["crew"]
    },
    install: {
      id: "install", name: "Done-for-you install", price: 1999,
      eligible: ["crew", "pro"]
    },
    brain: {
      id: "brain", name: "Company Brain written for you", price: 999,
      eligible: ["crew", "pro"]
    }
  },

  /* Value stack in the pricing section (Crew). "worth" values are anchors, not past prices. */
  valueStack: {
    title: "Everything in Crew",
    items: [
      { label: "40 outcome-based agents, 9 departments", worth: 4999 },
      { label: "Company Brain + Growth Ledger (core agents)", worth: 999 },
      { label: "Monday Standup: what moved, why, what is next", worth: 499 },
      { label: "One installer for 5 AI apps", worth: 499 },
      { label: "9 setup guides + 12 months of updates", worth: 999 }
    ]
  },

  /* BONUS owner: set to the sum of the bonus "worth" values and the bonus count. While 0,
     the pricing section shows a bonuses line without a number. */
  bonusTotal: 10493,
  bonusCount: 7,

  /* Guarantee: owner picks ONE (A shown). */
  guarantee: {
    days: 7,
    name: "Run it or refund",
    badge: "7-day run it or refund",
    text: "Run any 3 agents. If they don't save you a week of work, WhatsApp us within 7 days for a full refund."
  },

  gstNote: "Price includes GST. GST invoice on email.",

  /* Razorpay. Two ways to wire it, pick either:
     1) links: one Razorpay Payment Link per plan + add-on combination. Key = plan id, then
        add-on ids in this order: niche, creatives, whitelabel, custom, joined by "+".
        Example: "crew+niche", "pro+niche+whitelabel". Set each link's redirect URL to
        oto.html?plan=crew (Crew), downsell.html?plan=pro (Pro), thank-you.html?plan=dwy (DWY).
     2) pageUrl: one Razorpay Payment Page that reads ?amount= (rupees) and ?items=. Used for
        any combination missing from links. Redirect it to oto.html; oto.html routes by the
        order saved in the browser.
     No personal data is ever put in these URLs.
     leadEndpoint: optional URL that receives {name,email,phone,gstin,order} via sendBeacon
     right before the buyer leaves for Razorpay (abandoned checkout follow-up). */
  checkout: {
    pageUrl: "https://pages.razorpay.com/REPLACE_HEADCOUNT_PAGE",
    links: {
      "crew": "https://rzp.io/rzp/REPLACE_CREW",
      "crew+niche": "https://rzp.io/rzp/REPLACE_CREW_NICHE",
      "pro": "https://rzp.io/rzp/REPLACE_PRO",
      "pro+niche": "https://rzp.io/rzp/REPLACE_PRO_NICHE",
      "dwy": "https://rzp.io/rzp/REPLACE_DWY",
      "dwy+niche": "https://rzp.io/rzp/REPLACE_DWY_NICHE"
    },
    /* One Payment Link per post-purchase offer. Redirect each to thank-you.html?offer=<id>. */
    offerLinks: {
      pro_upgrade: "https://rzp.io/rzp/REPLACE_OTO_PRO",
      install: "https://rzp.io/rzp/REPLACE_OTO_INSTALL",
      brain: "https://rzp.io/rzp/REPLACE_DOWNSELL_BRAIN"
    },
    leadEndpoint: ""
  },

  /* Support and community. Placeholders stay in [brackets] until real. */
  whatsapp: {
    number: "[91XXXXXXXXXX]",
    display: "[+91 XXXXX XXXXX]",
    community: "[https://chat.whatsapp.com/REPLACE]"
  },
  supportEmail: "[support@yourdomain.in]",

  /* Legal pages linked from checkout (LEAD footer uses the same). */
  legal: { terms: "terms.html", refund: "refund.html", privacy: "privacy.html" },

  /* First steps shown on thank-you.html (from START-HERE.md). */
  install: {
    runtimes: ["claude", "codex", "openclaw", "hermes", "chatgpt"],
    command: "python3 install.py --runtime {rt} --agents all",
    firstCommand: "Run company-brain. My website is https://yourbrand.com"
  }
};

/* Call queue: other sections may call HC_CART before cart.js has loaded.
   cart.js replays these calls once it is ready. */
(function () {
  if (window.HC_CART) return;
  var q = [];
  var stub = { _q: q, _stub: true };
  ["open", "select", "toggleAddon", "scrollToPricing", "close"].forEach(function (m) {
    stub[m] = function () { q.push([m, [].slice.call(arguments)]); };
  });
  window.HC_CART = stub;
})();
