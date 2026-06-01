import { knownApps } from "./schema";

export const KNOWN_APPS_SEED = [
  // Email Marketing
  {
    slug: "klaviyo",
    name: "Klaviyo",
    category: "email-marketing",
    scriptPatterns: ["klaviyo\\.com", "klviyo\\.com", "_learnq"],
    isCompetitor: false,
  },
  {
    slug: "mailchimp",
    name: "Mailchimp",
    category: "email-marketing",
    scriptPatterns: ["mailchimp\\.com", "chimpstatic\\.com", "mc\\.js"],
    isCompetitor: false,
  },
  {
    slug: "omnisend",
    name: "Omnisend",
    category: "email-marketing",
    scriptPatterns: ["omnisrc\\.com", "omnisend\\.com"],
    isCompetitor: false,
  },
  {
    slug: "privy",
    name: "Privy",
    category: "email-marketing",
    scriptPatterns: ["privy\\.com", "widget\\.privy"],
    isCompetitor: false,
  },

  // Reviews
  {
    slug: "judgeme",
    name: "Judge.me",
    category: "reviews",
    scriptPatterns: ["judge\\.me", "judgeme"],
    isCompetitor: false,
  },
  {
    slug: "yotpo",
    name: "Yotpo",
    category: "reviews",
    scriptPatterns: ["yotpo\\.com", "staticw2\\.yotpo"],
    isCompetitor: false,
  },
  {
    slug: "loox",
    name: "Loox",
    category: "reviews",
    scriptPatterns: ["loox\\.io"],
    isCompetitor: false,
  },
  {
    slug: "stamped",
    name: "Stamped.io",
    category: "reviews",
    scriptPatterns: ["stamped\\.io"],
    isCompetitor: false,
  },
  {
    slug: "okendo",
    name: "Okendo",
    category: "reviews",
    scriptPatterns: ["okendo\\.io", "d3hw6dc1ow8pp2\\.cloudfront"],
    isCompetitor: false,
  },

  // Loyalty
  {
    slug: "smile",
    name: "Smile.io",
    category: "loyalty",
    scriptPatterns: ["smile\\.io", "sweettooth"],
    isCompetitor: false,
  },
  {
    slug: "loyaltylion",
    name: "LoyaltyLion",
    category: "loyalty",
    scriptPatterns: ["loyaltylion\\.com", "lion\\.js"],
    isCompetitor: false,
  },

  // Analytics
  {
    slug: "google-analytics",
    name: "Google Analytics",
    category: "analytics",
    scriptPatterns: [
      "googletagmanager\\.com",
      "google-analytics\\.com",
      "gtag",
    ],
    isCompetitor: false,
  },
  {
    slug: "facebook-pixel",
    name: "Facebook Pixel",
    category: "analytics",
    scriptPatterns: ["connect\\.facebook\\.net", "fbevents\\.js", "fbq\\("],
    isCompetitor: false,
  },
  {
    slug: "hotjar",
    name: "Hotjar",
    category: "analytics",
    scriptPatterns: ["hotjar\\.com", "static\\.hotjar"],
    isCompetitor: true,
  },

  // Upsell & Conversion
  {
    slug: "reconvert",
    name: "ReConvert",
    category: "upsell",
    scriptPatterns: ["reconvert\\.io"],
    isCompetitor: false,
  },
  {
    slug: "zipify",
    name: "Zipify",
    category: "upsell",
    scriptPatterns: ["zipify\\.com", "zipifyapps"],
    isCompetitor: false,
  },
  {
    slug: "bold-upsell",
    name: "Bold Upsell",
    category: "upsell",
    scriptPatterns: ["boldapps\\.net", "boldcommerce\\.com"],
    isCompetitor: false,
  },

  // Subscriptions
  {
    slug: "recharge",
    name: "ReCharge",
    category: "subscriptions",
    scriptPatterns: ["rechargepayments\\.com", "rechargeapps\\.com"],
    isCompetitor: true,
  },
  {
    slug: "skio",
    name: "Skio",
    category: "subscriptions",
    scriptPatterns: ["skio\\.com"],
    isCompetitor: true,
  },
  {
    slug: "loop-subscriptions",
    name: "Loop Subscriptions",
    category: "subscriptions",
    scriptPatterns: ["loopwork\\.co", "loop-subscriptions"],
    isCompetitor: true,
  },
  {
    slug: "seal-subscriptions",
    name: "Seal Subscriptions",
    category: "subscriptions",
    scriptPatterns: ["sealsubscriptions\\.com"],
    isCompetitor: true,
  },
  {
    slug: "paywhirl",
    name: "PayWhirl",
    category: "subscriptions",
    scriptPatterns: ["paywhirl\\.com"],
    isCompetitor: true,
  },

  // Chat & Support
  {
    slug: "gorgias",
    name: "Gorgias",
    category: "chat",
    scriptPatterns: ["gorgias\\.chat", "gorgias\\.io"],
    isCompetitor: false,
  },
  {
    slug: "tidio",
    name: "Tidio",
    category: "chat",
    scriptPatterns: ["tidio\\.co", "tidiochat\\.com"],
    isCompetitor: false,
  },
  {
    slug: "zendesk",
    name: "Zendesk",
    category: "chat",
    scriptPatterns: ["zendesk\\.com", "zdassets\\.com"],
    isCompetitor: false,
  },

  // Page Builders
  {
    slug: "shogun",
    name: "Shogun",
    category: "page-builder",
    scriptPatterns: ["getshogun\\.com", "shogun-frontend"],
    isCompetitor: false,
  },
  {
    slug: "pagefly",
    name: "PageFly",
    category: "page-builder",
    scriptPatterns: ["pagefly\\.io"],
    isCompetitor: false,
  },

  // Shipping & Tracking
  {
    slug: "aftership",
    name: "AfterShip",
    category: "shipping",
    scriptPatterns: ["aftership\\.com", "automizely\\.com"],
    isCompetitor: false,
  },
  {
    slug: "shipstation",
    name: "ShipStation",
    category: "shipping",
    scriptPatterns: ["shipstation\\.com"],
    isCompetitor: false,
  },

  // Popups & Forms
  {
    slug: "justuno",
    name: "Justuno",
    category: "popups",
    scriptPatterns: ["justuno\\.com"],
    isCompetitor: false,
  },
  {
    slug: "optinmonster",
    name: "OptinMonster",
    category: "popups",
    scriptPatterns: ["optinmonster\\.com", "optnmstr\\.com"],
    isCompetitor: false,
  },

  // SEO
  {
    slug: "plug-in-seo",
    name: "Plug In SEO",
    category: "seo",
    scriptPatterns: ["pluginseo\\.com"],
    isCompetitor: false,
  },

  // Social Proof
  {
    slug: "fomo",
    name: "Fomo",
    category: "social-proof",
    scriptPatterns: ["fomo\\.com"],
    isCompetitor: false,
  },

  // Invoicing (our competitor space)
  {
    slug: "order-printer-pro",
    name: "Order Printer Pro",
    category: "invoicing",
    scriptPatterns: ["orderprinterpro"],
    isCompetitor: true,
  },
  {
    slug: "sufio",
    name: "Sufio",
    category: "invoicing",
    scriptPatterns: ["sufio\\.com"],
    isCompetitor: true,
  },
] satisfies (typeof knownApps.$inferInsert)[];
