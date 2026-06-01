export interface AppSignature {
  slug: string;
  name: string;
  patterns: RegExp[];
}

export const APP_SIGNATURES: AppSignature[] = [
  { slug: "klaviyo", name: "Klaviyo", patterns: [/klaviyo\.com/i, /_learnq/i] },
  { slug: "mailchimp", name: "Mailchimp", patterns: [/mailchimp\.com/i, /chimpstatic\.com/i] },
  { slug: "omnisend", name: "Omnisend", patterns: [/omnisrc\.com/i, /omnisend\.com/i] },
  { slug: "privy", name: "Privy", patterns: [/privy\.com/i, /widget\.privy/i] },
  { slug: "judgeme", name: "Judge.me", patterns: [/judge\.me/i, /judgeme/i] },
  { slug: "yotpo", name: "Yotpo", patterns: [/yotpo\.com/i, /staticw2\.yotpo/i] },
  { slug: "loox", name: "Loox", patterns: [/loox\.io/i] },
  { slug: "stamped", name: "Stamped.io", patterns: [/stamped\.io/i] },
  { slug: "okendo", name: "Okendo", patterns: [/okendo\.io/i] },
  { slug: "smile", name: "Smile.io", patterns: [/smile\.io/i, /sweettooth/i] },
  { slug: "loyaltylion", name: "LoyaltyLion", patterns: [/loyaltylion\.com/i] },
  { slug: "google-analytics", name: "Google Analytics", patterns: [/googletagmanager\.com/i, /google-analytics\.com/i] },
  { slug: "facebook-pixel", name: "Facebook Pixel", patterns: [/connect\.facebook\.net/i, /fbevents\.js/i] },
  { slug: "hotjar", name: "Hotjar", patterns: [/hotjar\.com/i, /static\.hotjar/i] },
  { slug: "reconvert", name: "ReConvert", patterns: [/reconvert\.io/i] },
  { slug: "zipify", name: "Zipify", patterns: [/zipify\.com/i, /zipifyapps/i] },
  { slug: "bold-upsell", name: "Bold Upsell", patterns: [/boldapps\.net/i, /boldcommerce\.com/i] },
  { slug: "recharge", name: "ReCharge", patterns: [/rechargepayments\.com/i, /rechargeapps\.com/i] },
  { slug: "skio", name: "Skio", patterns: [/skio\.com/i] },
  { slug: "loop-subscriptions", name: "Loop Subscriptions", patterns: [/loopwork\.co/i] },
  { slug: "gorgias", name: "Gorgias", patterns: [/gorgias\.chat/i, /gorgias\.io/i] },
  { slug: "tidio", name: "Tidio", patterns: [/tidio\.co/i, /tidiochat\.com/i] },
  { slug: "zendesk", name: "Zendesk", patterns: [/zendesk\.com/i, /zdassets\.com/i] },
  { slug: "shogun", name: "Shogun", patterns: [/getshogun\.com/i] },
  { slug: "pagefly", name: "PageFly", patterns: [/pagefly\.io/i] },
  { slug: "aftership", name: "AfterShip", patterns: [/aftership\.com/i, /automizely\.com/i] },
  { slug: "justuno", name: "Justuno", patterns: [/justuno\.com/i] },
  { slug: "fomo", name: "Fomo", patterns: [/fomo\.com/i] },
];
