import { db } from "./db.js";
import {
  pgTable,
  serial,
  text,
  boolean,
} from "drizzle-orm/pg-core";

const knownApps = pgTable("known_apps", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  scriptPatterns: text("script_patterns").array().notNull(),
  isCompetitor: boolean("is_competitor").default(false).notNull(),
});

const APPS = [
  // ── Email Marketing ──
  { slug: "klaviyo", name: "Klaviyo", category: "email-marketing", scriptPatterns: ["klaviyo\\.com", "_learnq", "klviyo"], isCompetitor: false },
  { slug: "mailchimp", name: "Mailchimp", category: "email-marketing", scriptPatterns: ["mailchimp\\.com", "chimpstatic\\.com"], isCompetitor: false },
  { slug: "omnisend", name: "Omnisend", category: "email-marketing", scriptPatterns: ["omnisrc\\.com", "omnisend\\.com"], isCompetitor: false },
  { slug: "privy", name: "Privy", category: "email-marketing", scriptPatterns: ["privy\\.com", "widget\\.privy"], isCompetitor: false },
  { slug: "drip", name: "Drip", category: "email-marketing", scriptPatterns: ["getdrip\\.com", "dc\\.js"], isCompetitor: false },
  { slug: "sendlane", name: "Sendlane", category: "email-marketing", scriptPatterns: ["sendlane\\.com"], isCompetitor: false },
  { slug: "seguno", name: "Seguno", category: "email-marketing", scriptPatterns: ["seguno\\.com"], isCompetitor: false },
  { slug: "shopify-email", name: "Shopify Email", category: "email-marketing", scriptPatterns: ["shopify-email", "shopifyemailmarketing"], isCompetitor: false },

  // ── Reviews ──
  { slug: "judgeme", name: "Judge.me", category: "reviews", scriptPatterns: ["judge\\.me", "judgeme"], isCompetitor: false },
  { slug: "yotpo", name: "Yotpo", category: "reviews", scriptPatterns: ["yotpo\\.com", "staticw2\\.yotpo"], isCompetitor: false },
  { slug: "loox", name: "Loox", category: "reviews", scriptPatterns: ["loox\\.io", "loox\\.app"], isCompetitor: false },
  { slug: "stamped", name: "Stamped.io", category: "reviews", scriptPatterns: ["stamped\\.io"], isCompetitor: false },
  { slug: "okendo", name: "Okendo", category: "reviews", scriptPatterns: ["okendo\\.io"], isCompetitor: false },
  { slug: "rivyo", name: "Rivyo", category: "reviews", scriptPatterns: ["rivyo"], isCompetitor: false },
  { slug: "alireviews", name: "Ali Reviews", category: "reviews", scriptPatterns: ["alireviews", "fireapps\\.io"], isCompetitor: false },
  { slug: "junip", name: "Junip", category: "reviews", scriptPatterns: ["junip\\.co"], isCompetitor: false },
  { slug: "fera", name: "Fera.ai", category: "reviews", scriptPatterns: ["fera\\.ai"], isCompetitor: false },
  { slug: "reviewsio", name: "Reviews.io", category: "reviews", scriptPatterns: ["reviews\\.io"], isCompetitor: false },
  { slug: "trustpilot", name: "Trustpilot", category: "reviews", scriptPatterns: ["widget\\.trustpilot"], isCompetitor: false },

  // ── Loyalty & Rewards ──
  { slug: "smile", name: "Smile.io", category: "loyalty", scriptPatterns: ["smile\\.io", "sweettooth"], isCompetitor: false },
  { slug: "loyaltylion", name: "LoyaltyLion", category: "loyalty", scriptPatterns: ["loyaltylion\\.com"], isCompetitor: false },
  { slug: "yotpo-loyalty", name: "Yotpo Loyalty", category: "loyalty", scriptPatterns: ["swell\\.is"], isCompetitor: false },
  { slug: "rise-ai", name: "Rise.ai", category: "loyalty", scriptPatterns: ["rise-ai\\.com", "rise\\.ai"], isCompetitor: false },
  { slug: "bon-loyalty", name: "BON Loyalty", category: "loyalty", scriptPatterns: ["bonloyalty"], isCompetitor: false },
  { slug: "growave", name: "Growave", category: "loyalty", scriptPatterns: ["growave\\.io"], isCompetitor: false },

  // ── Analytics & Tracking ──
  { slug: "google-analytics", name: "Google Analytics", category: "analytics", scriptPatterns: ["googletagmanager\\.com", "google-analytics\\.com", "gtag/js"], isCompetitor: false },
  { slug: "facebook-pixel", name: "Facebook Pixel", category: "analytics", scriptPatterns: ["connect\\.facebook\\.net", "fbevents\\.js"], isCompetitor: false },
  { slug: "tiktok-pixel", name: "TikTok Pixel", category: "analytics", scriptPatterns: ["analytics\\.tiktok\\.com", "ttq\\.load"], isCompetitor: false },
  { slug: "pinterest-tag", name: "Pinterest Tag", category: "analytics", scriptPatterns: ["pintrk", "ct\\.pinterest\\.com"], isCompetitor: false },
  { slug: "snapchat-pixel", name: "Snapchat Pixel", category: "analytics", scriptPatterns: ["sc-static\\.net/scevent", "snaptr"], isCompetitor: false },
  { slug: "hotjar", name: "Hotjar", category: "analytics", scriptPatterns: ["hotjar\\.com"], isCompetitor: false },
  { slug: "lucky-orange", name: "Lucky Orange", category: "analytics", scriptPatterns: ["luckyorange\\.com"], isCompetitor: false },
  { slug: "microsoft-clarity", name: "Microsoft Clarity", category: "analytics", scriptPatterns: ["clarity\\.ms"], isCompetitor: false },
  { slug: "triple-whale", name: "Triple Whale", category: "analytics", scriptPatterns: ["triplewhale\\.com"], isCompetitor: false },
  { slug: "northbeam", name: "Northbeam", category: "analytics", scriptPatterns: ["northbeam\\.io"], isCompetitor: false },
  { slug: "elevar", name: "Elevar", category: "analytics", scriptPatterns: ["getelevar\\.com"], isCompetitor: false },

  // ── Upsell & Cross-sell ──
  { slug: "reconvert", name: "ReConvert", category: "upsell", scriptPatterns: ["reconvert\\.io"], isCompetitor: false },
  { slug: "zipify", name: "Zipify", category: "upsell", scriptPatterns: ["zipify\\.com", "zipifyapps"], isCompetitor: false },
  { slug: "bold-upsell", name: "Bold Upsell", category: "upsell", scriptPatterns: ["boldapps\\.net", "boldcommerce\\.com"], isCompetitor: false },
  { slug: "candy-rack", name: "Candy Rack", category: "upsell", scriptPatterns: ["candyrack", "digismoothie"], isCompetitor: false },
  { slug: "selleasy", name: "Selleasy", category: "upsell", scriptPatterns: ["selleasy"], isCompetitor: false },
  { slug: "frequently-bought", name: "Frequently Bought Together", category: "upsell", scriptPatterns: ["frequently-bought", "codeblackbelt"], isCompetitor: false },
  { slug: "honeycomb-upsell", name: "Honeycomb Upsell", category: "upsell", scriptPatterns: ["honeycombapps"], isCompetitor: false },
  { slug: "in-cart-upsell", name: "In Cart Upsell", category: "upsell", scriptPatterns: ["icuapp", "incartupsell"], isCompetitor: false },
  { slug: "aftersell", name: "AfterSell", category: "upsell", scriptPatterns: ["aftersell\\.com"], isCompetitor: false },

  // ── Subscriptions ──
  { slug: "recharge", name: "ReCharge", category: "subscriptions", scriptPatterns: ["rechargepayments\\.com", "rechargeapps\\.com", "rechargecdn"], isCompetitor: true },
  { slug: "skio", name: "Skio", category: "subscriptions", scriptPatterns: ["skio\\.com"], isCompetitor: true },
  { slug: "loop-subscriptions", name: "Loop Subscriptions", category: "subscriptions", scriptPatterns: ["loopwork\\.co"], isCompetitor: true },
  { slug: "seal-subscriptions", name: "Seal Subscriptions", category: "subscriptions", scriptPatterns: ["sealsubscriptions\\.com"], isCompetitor: true },
  { slug: "paywhirl", name: "PayWhirl", category: "subscriptions", scriptPatterns: ["paywhirl\\.com"], isCompetitor: true },
  { slug: "appstle", name: "Appstle Subscriptions", category: "subscriptions", scriptPatterns: ["appstle\\.com"], isCompetitor: true },
  { slug: "bold-subscriptions", name: "Bold Subscriptions", category: "subscriptions", scriptPatterns: ["boldsubscriptions"], isCompetitor: true },
  { slug: "ordergroove", name: "Ordergroove", category: "subscriptions", scriptPatterns: ["ordergroove\\.com"], isCompetitor: true },

  // ── Chat & Support ──
  { slug: "gorgias", name: "Gorgias", category: "chat", scriptPatterns: ["gorgias\\.chat", "gorgias\\.io"], isCompetitor: false },
  { slug: "tidio", name: "Tidio", category: "chat", scriptPatterns: ["tidio\\.co", "tidiochat\\.com"], isCompetitor: false },
  { slug: "zendesk", name: "Zendesk", category: "chat", scriptPatterns: ["zendesk\\.com", "zdassets\\.com"], isCompetitor: false },
  { slug: "intercom", name: "Intercom", category: "chat", scriptPatterns: ["intercom\\.io", "intercomcdn\\.com"], isCompetitor: false },
  { slug: "crisp", name: "Crisp", category: "chat", scriptPatterns: ["crisp\\.chat", "client\\.crisp"], isCompetitor: false },
  { slug: "freshdesk", name: "Freshdesk", category: "chat", scriptPatterns: ["freshdesk\\.com"], isCompetitor: false },
  { slug: "richpanel", name: "Richpanel", category: "chat", scriptPatterns: ["richpanel\\.com"], isCompetitor: false },
  { slug: "reamaze", name: "Re:amaze", category: "chat", scriptPatterns: ["reamaze\\.com"], isCompetitor: false },
  { slug: "livechat", name: "LiveChat", category: "chat", scriptPatterns: ["livechatinc\\.com", "cdn\\.livechat"], isCompetitor: false },
  { slug: "drift", name: "Drift", category: "chat", scriptPatterns: ["drift\\.com", "js\\.driftt\\.com"], isCompetitor: false },
  { slug: "whatsapp-chat", name: "WhatsApp Chat", category: "chat", scriptPatterns: ["api\\.whatsapp\\.com", "wa\\.me/"], isCompetitor: false },

  // ── Page Builders ──
  { slug: "shogun", name: "Shogun", category: "page-builder", scriptPatterns: ["getshogun\\.com"], isCompetitor: false },
  { slug: "pagefly", name: "PageFly", category: "page-builder", scriptPatterns: ["pagefly\\.io"], isCompetitor: false },
  { slug: "gempage", name: "GemPages", category: "page-builder", scriptPatterns: ["gempages\\.net"], isCompetitor: false },
  { slug: "replo", name: "Replo", category: "page-builder", scriptPatterns: ["replo\\.app"], isCompetitor: false },

  // ── Shipping & Order Tracking ──
  { slug: "aftership", name: "AfterShip", category: "shipping", scriptPatterns: ["aftership\\.com", "automizely\\.com"], isCompetitor: false },
  { slug: "shipbob", name: "ShipBob", category: "shipping", scriptPatterns: ["shipbob\\.com"], isCompetitor: false },
  { slug: "shipstation", name: "ShipStation", category: "shipping", scriptPatterns: ["shipstation\\.com"], isCompetitor: false },
  { slug: "route", name: "Route", category: "shipping", scriptPatterns: ["route\\.com", "routeapp\\.io"], isCompetitor: false },
  { slug: "parcellab", name: "parcelLab", category: "shipping", scriptPatterns: ["parcellab\\.com"], isCompetitor: false },
  { slug: "narvar", name: "Narvar", category: "shipping", scriptPatterns: ["narvar\\.com"], isCompetitor: false },

  // ── Pop-ups & Lead Capture ──
  { slug: "justuno", name: "Justuno", category: "popups", scriptPatterns: ["justuno\\.com"], isCompetitor: false },
  { slug: "optinmonster", name: "OptinMonster", category: "popups", scriptPatterns: ["optinmonster\\.com", "omappapi"], isCompetitor: false },
  { slug: "wisepops", name: "Wisepops", category: "popups", scriptPatterns: ["wisepops\\.com"], isCompetitor: false },
  { slug: "popupsmart", name: "Popupsmart", category: "popups", scriptPatterns: ["popupsmart\\.com"], isCompetitor: false },
  { slug: "wheelio", name: "Wheelio", category: "popups", scriptPatterns: ["wheelio-popup", "wheelio\\.com"], isCompetitor: false },
  { slug: "spin-a-sale", name: "Spin-a-Sale", category: "popups", scriptPatterns: ["spinasale"], isCompetitor: false },
  { slug: "amped", name: "Amped", category: "popups", scriptPatterns: ["amped\\.io"], isCompetitor: false },

  // ── Social Proof & Urgency ──
  { slug: "fomo", name: "Fomo", category: "social-proof", scriptPatterns: ["fomo\\.com"], isCompetitor: false },
  { slug: "nudgify", name: "Nudgify", category: "social-proof", scriptPatterns: ["nudgify\\.com"], isCompetitor: false },
  { slug: "sales-pop", name: "Sales Pop", category: "social-proof", scriptPatterns: ["salespop"], isCompetitor: false },
  { slug: "hurrify", name: "Hurrify", category: "social-proof", scriptPatterns: ["hurrify"], isCompetitor: false },

  // ── SEO ──
  { slug: "plug-in-seo", name: "Plug in SEO", category: "seo", scriptPatterns: ["pluginseo"], isCompetitor: false },
  { slug: "smart-seo", name: "Smart SEO", category: "seo", scriptPatterns: ["smart-seo"], isCompetitor: false },
  { slug: "json-ld-seo", name: "JSON-LD for SEO", category: "seo", scriptPatterns: ["json-ld-for-seo", "iloveleo\\.com"], isCompetitor: false },
  { slug: "avada-seo", name: "Avada SEO", category: "seo", scriptPatterns: ["avada-seo", "avada\\.io"], isCompetitor: false },

  // ── Search & Navigation ──
  { slug: "algolia", name: "Algolia", category: "search", scriptPatterns: ["algolia\\.com", "algolianet\\.com", "algoliasearch"], isCompetitor: false },
  { slug: "searchanise", name: "Searchanise", category: "search", scriptPatterns: ["searchanise\\.com"], isCompetitor: false },
  { slug: "boost-search", name: "Boost Commerce", category: "search", scriptPatterns: ["boostcommerce\\.net"], isCompetitor: false },
  { slug: "instant-search", name: "Instant Search+", category: "search", scriptPatterns: ["instantsearchplus"], isCompetitor: false },

  // ── Referral & SMS ──
  { slug: "referralcandy", name: "ReferralCandy", category: "referral", scriptPatterns: ["referralcandy\\.com", "refcandy"], isCompetitor: false },
  { slug: "refersion", name: "Refersion", category: "referral", scriptPatterns: ["refersion\\.com"], isCompetitor: false },
  { slug: "goaffpro", name: "GoAffPro", category: "referral", scriptPatterns: ["goaffpro\\.com"], isCompetitor: false },
  { slug: "postscript", name: "Postscript SMS", category: "sms", scriptPatterns: ["postscript\\.io"], isCompetitor: false },
  { slug: "attentive", name: "Attentive", category: "sms", scriptPatterns: ["attentive\\.com", "attn\\.tv"], isCompetitor: false },

  // ── Wishlist ──
  { slug: "wishlist-plus", name: "Wishlist Plus", category: "wishlist", scriptPatterns: ["swymrelay", "swym\\.it"], isCompetitor: false },
  { slug: "wishlist-hero", name: "Wishlist Hero", category: "wishlist", scriptPatterns: ["wishlisthero"], isCompetitor: false },
  { slug: "wishlist-king", name: "Wishlist King", category: "wishlist", scriptPatterns: ["wishlistking", "appmate\\.io"], isCompetitor: false },

  // ── Size Guide ──
  { slug: "kiwi-sizing", name: "Kiwi Size Chart", category: "product-tools", scriptPatterns: ["kiwisizing\\.com"], isCompetitor: false },
  { slug: "size-matters", name: "Size Matters", category: "product-tools", scriptPatterns: ["sizematters"], isCompetitor: false },

  // ── Invoicing (competitors) ──
  { slug: "order-printer-pro", name: "Order Printer Pro", category: "invoicing", scriptPatterns: ["orderprinterpro"], isCompetitor: true },
  { slug: "sufio", name: "Sufio", category: "invoicing", scriptPatterns: ["sufio\\.com"], isCompetitor: true },

  // ── Translation & Currency ──
  { slug: "weglot", name: "Weglot", category: "translation", scriptPatterns: ["weglot\\.com", "cdn\\.weglot"], isCompetitor: false },
  { slug: "langify", name: "Langify", category: "translation", scriptPatterns: ["langify-app"], isCompetitor: false },
  { slug: "transcy", name: "Transcy", category: "translation", scriptPatterns: ["transcy\\.io"], isCompetitor: false },
  { slug: "geolizr", name: "Geolizr", category: "translation", scriptPatterns: ["geolizr\\.com"], isCompetitor: false },
  { slug: "hextom-free-shipping", name: "Hextom Free Shipping Bar", category: "conversion", scriptPatterns: ["hextom"], isCompetitor: false },

  // ── Notifications ──
  { slug: "back-in-stock", name: "Back in Stock", category: "notifications", scriptPatterns: ["backinstock"], isCompetitor: false },
  { slug: "pushowl", name: "PushOwl", category: "notifications", scriptPatterns: ["pushowl\\.com"], isCompetitor: false },
  { slug: "onesignal", name: "OneSignal", category: "notifications", scriptPatterns: ["onesignal\\.com"], isCompetitor: false },

  // ── Returns ──
  { slug: "loop-returns", name: "Loop Returns", category: "returns", scriptPatterns: ["loopreturns\\.com"], isCompetitor: false },
  { slug: "returnly", name: "Returnly", category: "returns", scriptPatterns: ["returnly\\.com"], isCompetitor: false },
  { slug: "happy-returns", name: "Happy Returns", category: "returns", scriptPatterns: ["happyreturns\\.com"], isCompetitor: false },
  { slug: "return-prime", name: "Return Prime", category: "returns", scriptPatterns: ["returnprime"], isCompetitor: false },

  // ── Age Verification ──
  { slug: "agechecker", name: "AgeChecker", category: "compliance", scriptPatterns: ["agechecker\\.net"], isCompetitor: false },
  { slug: "ageify", name: "Ageify", category: "compliance", scriptPatterns: ["ageify"], isCompetitor: false },

  // ── Inshalytics Apps (ours) ──
  { slug: "track-your-traffic", name: "Track Your Traffic", category: "analytics", scriptPatterns: ["TYT_CONFIG", "tyt-tracker", "TYTTracker", "tyt_first_touch"], isCompetitor: false },
  { slug: "invoiceforge", name: "InvoiceForge", category: "invoicing", scriptPatterns: ["invoiceforge"], isCompetitor: false },
  { slug: "subsexport", name: "SubsExport", category: "subscriptions", scriptPatterns: ["subsexport"], isCompetitor: false },

  // ── Misc Popular ──
  { slug: "shopify-inbox", name: "Shopify Inbox", category: "chat", scriptPatterns: ["shopify-chat", "shopifyinbox"], isCompetitor: false },
  { slug: "sms-bump", name: "SMSBump (Yotpo)", category: "sms", scriptPatterns: ["smsbump\\.com"], isCompetitor: false },
  { slug: "recart", name: "Recart", category: "sms", scriptPatterns: ["recart\\.com"], isCompetitor: false },
  { slug: "rebuy", name: "Rebuy", category: "personalization", scriptPatterns: ["rebuyengine\\.com"], isCompetitor: false },
  { slug: "nosto", name: "Nosto", category: "personalization", scriptPatterns: ["nosto\\.com", "connect\\.nosto"], isCompetitor: false },
  { slug: "limespot", name: "LimeSpot", category: "personalization", scriptPatterns: ["limespot\\.com"], isCompetitor: false },
  { slug: "vitals", name: "Vitals", category: "all-in-one", scriptPatterns: ["vitals\\.co", "vitalsapp"], isCompetitor: false },
  { slug: "shopify-payments", name: "Shop Pay", category: "payments", scriptPatterns: ["shop-pay", "shopifypay", "shopPayBtn"], isCompetitor: false },
];

async function main() {
  console.log("Seeding known apps...");

  let added = 0;
  for (const app of APPS) {
    const result = await db
      .insert(knownApps)
      .values(app)
      .onConflictDoNothing();
    console.log(`  ✓ ${app.name} (${app.category})`);
    added++;
  }

  console.log(`\nSeeded ${added} apps (${APPS.length} total defined)`);
}

main().catch(console.error);
