export interface AppSignature {
  slug: string;
  name: string;
  patterns: RegExp[];
}

export const APP_SIGNATURES: AppSignature[] = [
  // ── Email Marketing ──
  { slug: "klaviyo", name: "Klaviyo", patterns: [/klaviyo\.com/i, /_learnq/i, /klviyo/i] },
  { slug: "mailchimp", name: "Mailchimp", patterns: [/mailchimp\.com/i, /chimpstatic\.com/i] },
  { slug: "omnisend", name: "Omnisend", patterns: [/omnisrc\.com/i, /omnisend\.com/i] },
  { slug: "privy", name: "Privy", patterns: [/privy\.com/i, /widget\.privy/i] },
  { slug: "drip", name: "Drip", patterns: [/getdrip\.com/i, /dc\.js/i] },
  { slug: "sendlane", name: "Sendlane", patterns: [/sendlane\.com/i] },
  { slug: "seguno", name: "Seguno", patterns: [/seguno\.com/i] },
  { slug: "shopify-email", name: "Shopify Email", patterns: [/shopify-email/i, /shopifyemailmarketing/i] },

  // ── Reviews ──
  { slug: "judgeme", name: "Judge.me", patterns: [/judge\.me/i, /judgeme/i] },
  { slug: "yotpo", name: "Yotpo", patterns: [/yotpo\.com/i, /staticw2\.yotpo/i] },
  { slug: "loox", name: "Loox", patterns: [/loox\.io/i, /loox\.app/i] },
  { slug: "stamped", name: "Stamped.io", patterns: [/stamped\.io/i] },
  { slug: "okendo", name: "Okendo", patterns: [/okendo\.io/i] },
  { slug: "rivyo", name: "Rivyo", patterns: [/rivyo/i] },
  { slug: "alireviews", name: "Ali Reviews", patterns: [/alireviews/i, /fireapps\.io/i] },
  { slug: "junip", name: "Junip", patterns: [/junip\.co/i] },
  { slug: "fera", name: "Fera.ai", patterns: [/fera\.ai/i] },
  { slug: "reviewsio", name: "Reviews.io", patterns: [/reviews\.io/i, /widget\.reviews\.io/i] },
  { slug: "trustpilot", name: "Trustpilot", patterns: [/trustpilot\.com\/review/i, /widget\.trustpilot/i] },

  // ── Loyalty & Rewards ──
  { slug: "smile", name: "Smile.io", patterns: [/smile\.io/i, /sweettooth/i] },
  { slug: "loyaltylion", name: "LoyaltyLion", patterns: [/loyaltylion\.com/i] },
  { slug: "yotpo-loyalty", name: "Yotpo Loyalty", patterns: [/swell\.is/i, /yotpo.*loyalty/i] },
  { slug: "rise-ai", name: "Rise.ai", patterns: [/rise-ai\.com/i, /rise\.ai/i] },
  { slug: "bon-loyalty", name: "BON Loyalty", patterns: [/bonloyalty/i] },
  { slug: "growave", name: "Growave", patterns: [/growave\.io/i] },

  // ── Analytics & Tracking ──
  { slug: "google-analytics", name: "Google Analytics", patterns: [/googletagmanager\.com/i, /google-analytics\.com/i, /gtag\/js/i] },
  { slug: "facebook-pixel", name: "Facebook Pixel", patterns: [/connect\.facebook\.net/i, /fbevents\.js/i, /fbq\(/i] },
  { slug: "tiktok-pixel", name: "TikTok Pixel", patterns: [/analytics\.tiktok\.com/i, /ttq\.load/i] },
  { slug: "pinterest-tag", name: "Pinterest Tag", patterns: [/pintrk/i, /ct\.pinterest\.com/i] },
  { slug: "snapchat-pixel", name: "Snapchat Pixel", patterns: [/sc-static\.net\/scevent/i, /snaptr/i] },
  { slug: "hotjar", name: "Hotjar", patterns: [/hotjar\.com/i, /static\.hotjar/i] },
  { slug: "lucky-orange", name: "Lucky Orange", patterns: [/luckyorange\.com/i] },
  { slug: "microsoft-clarity", name: "Microsoft Clarity", patterns: [/clarity\.ms/i] },
  { slug: "triple-whale", name: "Triple Whale", patterns: [/triplewhale\.com/i] },
  { slug: "northbeam", name: "Northbeam", patterns: [/northbeam\.io/i] },
  { slug: "elevar", name: "Elevar", patterns: [/getelevar\.com/i] },

  // ── Upsell & Cross-sell ──
  { slug: "reconvert", name: "ReConvert", patterns: [/reconvert\.io/i] },
  { slug: "zipify", name: "Zipify", patterns: [/zipify\.com/i, /zipifyapps/i] },
  { slug: "bold-upsell", name: "Bold Upsell", patterns: [/boldapps\.net/i, /boldcommerce\.com/i] },
  { slug: "candy-rack", name: "Candy Rack", patterns: [/candyrack/i, /digismoothie/i] },
  { slug: "selleasy", name: "Selleasy", patterns: [/selleasy/i] },
  { slug: "frequently-bought", name: "Frequently Bought Together", patterns: [/frequently-bought/i, /codeblackbelt/i] },
  { slug: "honeycomb-upsell", name: "Honeycomb Upsell", patterns: [/honeycombapps/i] },
  { slug: "in-cart-upsell", name: "In Cart Upsell", patterns: [/icuapp/i, /incartupsell/i] },
  { slug: "aftersell", name: "AfterSell", patterns: [/aftersell\.com/i] },

  // ── Subscriptions ──
  { slug: "recharge", name: "ReCharge", patterns: [/rechargepayments\.com/i, /rechargeapps\.com/i, /rechargecdn/i] },
  { slug: "skio", name: "Skio", patterns: [/skio\.com/i] },
  { slug: "loop-subscriptions", name: "Loop Subscriptions", patterns: [/loopwork\.co/i] },
  { slug: "seal-subscriptions", name: "Seal Subscriptions", patterns: [/sealsubscriptions\.com/i] },
  { slug: "paywhirl", name: "PayWhirl", patterns: [/paywhirl\.com/i] },
  { slug: "appstle", name: "Appstle Subscriptions", patterns: [/appstle\.com/i] },
  { slug: "bold-subscriptions", name: "Bold Subscriptions", patterns: [/boldsubscriptions/i] },
  { slug: "ordergroove", name: "Ordergroove", patterns: [/ordergroove\.com/i] },

  // ── Chat & Support ──
  { slug: "gorgias", name: "Gorgias", patterns: [/gorgias\.chat/i, /gorgias\.io/i] },
  { slug: "tidio", name: "Tidio", patterns: [/tidio\.co/i, /tidiochat\.com/i] },
  { slug: "zendesk", name: "Zendesk", patterns: [/zendesk\.com/i, /zdassets\.com/i] },
  { slug: "intercom", name: "Intercom", patterns: [/intercom\.io/i, /intercomcdn\.com/i, /widget\.intercom/i] },
  { slug: "crisp", name: "Crisp", patterns: [/crisp\.chat/i, /client\.crisp/i] },
  { slug: "freshdesk", name: "Freshdesk", patterns: [/freshdesk\.com/i] },
  { slug: "richpanel", name: "Richpanel", patterns: [/richpanel\.com/i] },
  { slug: "reamaze", name: "Re:amaze", patterns: [/reamaze\.com/i, /reamaze\.js/i] },
  { slug: "livechat", name: "LiveChat", patterns: [/livechatinc\.com/i, /cdn\.livechat/i] },
  { slug: "drift", name: "Drift", patterns: [/drift\.com/i, /js\.driftt\.com/i] },
  { slug: "whatsapp-chat", name: "WhatsApp Chat", patterns: [/api\.whatsapp\.com/i, /wa\.me\//i] },

  // ── Page Builders ──
  { slug: "shogun", name: "Shogun", patterns: [/getshogun\.com/i] },
  { slug: "pagefly", name: "PageFly", patterns: [/pagefly\.io/i] },
  { slug: "gempage", name: "GemPages", patterns: [/gempages\.net/i] },
  { slug: "replo", name: "Replo", patterns: [/replo\.app/i] },

  // ── Shipping & Order Tracking ──
  { slug: "aftership", name: "AfterShip", patterns: [/aftership\.com/i, /automizely\.com/i] },
  { slug: "shipbob", name: "ShipBob", patterns: [/shipbob\.com/i] },
  { slug: "shipstation", name: "ShipStation", patterns: [/shipstation\.com/i] },
  { slug: "route", name: "Route", patterns: [/route\.com/i, /routeapp\.io/i] },
  { slug: "parcellab", name: "parcelLab", patterns: [/parcellab\.com/i] },
  { slug: "narvar", name: "Narvar", patterns: [/narvar\.com/i] },

  // ── Pop-ups & Lead Capture ──
  { slug: "justuno", name: "Justuno", patterns: [/justuno\.com/i] },
  { slug: "optinmonster", name: "OptinMonster", patterns: [/optinmonster\.com/i, /omappapi/i] },
  { slug: "wisepops", name: "Wisepops", patterns: [/wisepops\.com/i] },
  { slug: "popupsmart", name: "Popupsmart", patterns: [/popupsmart\.com/i] },
  { slug: "wheelio", name: "Wheelio", patterns: [/wheelio-popup/i, /wheelio\.com/i] },
  { slug: "spin-a-sale", name: "Spin‑a‑Sale", patterns: [/spinasale/i] },
  { slug: "amped", name: "Amped", patterns: [/amped\.io/i] },

  // ── Social Proof & Urgency ──
  { slug: "fomo", name: "Fomo", patterns: [/fomo\.com/i] },
  { slug: "nudgify", name: "Nudgify", patterns: [/nudgify\.com/i] },
  { slug: "sales-pop", name: "Sales Pop", patterns: [/salespop/i] },
  { slug: "hurrify", name: "Hurrify", patterns: [/hurrify/i] },

  // ── SEO ──
  { slug: "plug-in-seo", name: "Plug in SEO", patterns: [/pluginseo/i] },
  { slug: "smart-seo", name: "Smart SEO", patterns: [/smart-seo/i] },
  { slug: "json-ld-seo", name: "JSON-LD for SEO", patterns: [/json-ld-for-seo/i, /iloveleo\.com/i] },
  { slug: "avada-seo", name: "Avada SEO", patterns: [/avada-seo/i, /avada\.io/i] },

  // ── Search & Navigation ──
  { slug: "algolia", name: "Algolia", patterns: [/algolia\.com/i, /algolianet\.com/i, /algoliasearch/i] },
  { slug: "searchanise", name: "Searchanise", patterns: [/searchanise\.com/i] },
  { slug: "boost-search", name: "Boost Commerce", patterns: [/boostcommerce\.net/i] },
  { slug: "instant-search", name: "Instant Search+", patterns: [/instantsearchplus/i] },

  // ── Referral & Affiliate ──
  { slug: "referralcandy", name: "ReferralCandy", patterns: [/referralcandy\.com/i, /refcandy/i] },
  { slug: "refersion", name: "Refersion", patterns: [/refersion\.com/i] },
  { slug: "goaffpro", name: "GoAffPro", patterns: [/goaffpro\.com/i] },
  { slug: "postscript", name: "Postscript SMS", patterns: [/postscript\.io/i] },
  { slug: "attentive", name: "Attentive", patterns: [/attentive\.com/i, /attn\.tv/i] },

  // ── Wishlist & Saved Items ──
  { slug: "wishlist-plus", name: "Wishlist Plus", patterns: [/swymrelay/i, /swym\.it/i] },
  { slug: "wishlist-hero", name: "Wishlist Hero", patterns: [/wishlisthero/i] },
  { slug: "wishlist-king", name: "Wishlist King", patterns: [/wishlistking/i, /appmate\.io/i] },

  // ── Size Guide & Product Tools ──
  { slug: "kiwi-sizing", name: "Kiwi Size Chart", patterns: [/kiwisizing\.com/i] },
  { slug: "size-matters", name: "Size Matters", patterns: [/sizematters/i] },

  // ── Invoicing (competitors) ──
  { slug: "order-printer-pro", name: "Order Printer Pro", patterns: [/orderprinterpro/i] },
  { slug: "sufio", name: "Sufio", patterns: [/sufio\.com/i] },

  // ── Currency & Language ──
  { slug: "geolizr", name: "Geolizr", patterns: [/geolizr\.com/i] },
  { slug: "weglot", name: "Weglot", patterns: [/weglot\.com/i, /cdn\.weglot/i] },
  { slug: "langify", name: "Langify", patterns: [/langify-app/i] },
  { slug: "transcy", name: "Transcy", patterns: [/transcy\.io/i] },
  { slug: "hextom-free-shipping", name: "Hextom Free Shipping Bar", patterns: [/hextom/i] },

  // ── Back in Stock & Notifications ──
  { slug: "back-in-stock", name: "Back in Stock", patterns: [/backinstock/i] },
  { slug: "pushowl", name: "PushOwl", patterns: [/pushowl\.com/i] },
  { slug: "onesignal", name: "OneSignal", patterns: [/onesignal\.com/i] },

  // ── Countdown & Urgency ──
  { slug: "essential-countdown-timer", name: "Essential Countdown Timer", patterns: [/essential-countdown/i] },
  { slug: "urgency-bear", name: "Countdown Timer Bar", patterns: [/countdown.*timer.*bar/i] },

  // ── Returns ──
  { slug: "loop-returns", name: "Loop Returns", patterns: [/loopreturns\.com/i] },
  { slug: "returnly", name: "Returnly", patterns: [/returnly\.com/i] },
  { slug: "happy-returns", name: "Happy Returns", patterns: [/happyreturns\.com/i] },
  { slug: "return-prime", name: "Return Prime", patterns: [/returnprime/i] },

  // ── Age Verification ──
  { slug: "agechecker", name: "AgeChecker", patterns: [/agechecker\.net/i] },
  { slug: "ageify", name: "Ageify", patterns: [/ageify/i] },

  // ── Inshalytics Apps (ours) ──
  { slug: "track-your-traffic", name: "Track Your Traffic", patterns: [/TYT_CONFIG/i, /tyt-tracker/i, /TYTTracker/i, /tyt_first_touch/i] },
  { slug: "invoiceforge", name: "InvoiceForge", patterns: [/invoiceforge/i] },
  { slug: "subsexport", name: "SubsExport", patterns: [/subsexport/i] },

  // ── Misc Popular ──
  { slug: "shopify-inbox", name: "Shopify Inbox", patterns: [/shopify-chat/i, /shopifyinbox/i] },
  { slug: "sms-bump", name: "SMSBump (Yotpo)", patterns: [/smsbump\.com/i] },
  { slug: "recart", name: "Recart", patterns: [/recart\.com/i] },
  { slug: "rebuy", name: "Rebuy", patterns: [/rebuyengine\.com/i] },
  { slug: "nosto", name: "Nosto", patterns: [/nosto\.com/i, /connect\.nosto/i] },
  { slug: "limespot", name: "LimeSpot", patterns: [/limespot\.com/i] },
  { slug: "vitals", name: "Vitals", patterns: [/vitals\.co/i, /vitalsapp/i] },
  { slug: "cartflows", name: "CartFlows", patterns: [/cartflows/i] },
  { slug: "shopify-payments", name: "Shop Pay", patterns: [/shop-pay/i, /shopifypay/i, /shopPayBtn/i] },
];
