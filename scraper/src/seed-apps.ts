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
  { slug: "klaviyo", name: "Klaviyo", category: "email-marketing", scriptPatterns: ["klaviyo\\.com", "_learnq"], isCompetitor: false },
  { slug: "mailchimp", name: "Mailchimp", category: "email-marketing", scriptPatterns: ["mailchimp\\.com", "chimpstatic\\.com"], isCompetitor: false },
  { slug: "omnisend", name: "Omnisend", category: "email-marketing", scriptPatterns: ["omnisrc\\.com", "omnisend\\.com"], isCompetitor: false },
  { slug: "privy", name: "Privy", category: "email-marketing", scriptPatterns: ["privy\\.com", "widget\\.privy"], isCompetitor: false },
  { slug: "judgeme", name: "Judge.me", category: "reviews", scriptPatterns: ["judge\\.me", "judgeme"], isCompetitor: false },
  { slug: "yotpo", name: "Yotpo", category: "reviews", scriptPatterns: ["yotpo\\.com", "staticw2\\.yotpo"], isCompetitor: false },
  { slug: "loox", name: "Loox", category: "reviews", scriptPatterns: ["loox\\.io"], isCompetitor: false },
  { slug: "stamped", name: "Stamped.io", category: "reviews", scriptPatterns: ["stamped\\.io"], isCompetitor: false },
  { slug: "okendo", name: "Okendo", category: "reviews", scriptPatterns: ["okendo\\.io"], isCompetitor: false },
  { slug: "smile", name: "Smile.io", category: "loyalty", scriptPatterns: ["smile\\.io", "sweettooth"], isCompetitor: false },
  { slug: "loyaltylion", name: "LoyaltyLion", category: "loyalty", scriptPatterns: ["loyaltylion\\.com"], isCompetitor: false },
  { slug: "google-analytics", name: "Google Analytics", category: "analytics", scriptPatterns: ["googletagmanager\\.com", "google-analytics\\.com"], isCompetitor: false },
  { slug: "facebook-pixel", name: "Facebook Pixel", category: "analytics", scriptPatterns: ["connect\\.facebook\\.net", "fbevents\\.js"], isCompetitor: false },
  { slug: "hotjar", name: "Hotjar", category: "analytics", scriptPatterns: ["hotjar\\.com"], isCompetitor: true },
  { slug: "reconvert", name: "ReConvert", category: "upsell", scriptPatterns: ["reconvert\\.io"], isCompetitor: false },
  { slug: "zipify", name: "Zipify", category: "upsell", scriptPatterns: ["zipify\\.com"], isCompetitor: false },
  { slug: "bold-upsell", name: "Bold Upsell", category: "upsell", scriptPatterns: ["boldapps\\.net", "boldcommerce\\.com"], isCompetitor: false },
  { slug: "recharge", name: "ReCharge", category: "subscriptions", scriptPatterns: ["rechargepayments\\.com", "rechargeapps\\.com"], isCompetitor: true },
  { slug: "skio", name: "Skio", category: "subscriptions", scriptPatterns: ["skio\\.com"], isCompetitor: true },
  { slug: "loop-subscriptions", name: "Loop Subscriptions", category: "subscriptions", scriptPatterns: ["loopwork\\.co"], isCompetitor: true },
  { slug: "seal-subscriptions", name: "Seal Subscriptions", category: "subscriptions", scriptPatterns: ["sealsubscriptions\\.com"], isCompetitor: true },
  { slug: "paywhirl", name: "PayWhirl", category: "subscriptions", scriptPatterns: ["paywhirl\\.com"], isCompetitor: true },
  { slug: "gorgias", name: "Gorgias", category: "chat", scriptPatterns: ["gorgias\\.chat", "gorgias\\.io"], isCompetitor: false },
  { slug: "tidio", name: "Tidio", category: "chat", scriptPatterns: ["tidio\\.co", "tidiochat\\.com"], isCompetitor: false },
  { slug: "zendesk", name: "Zendesk", category: "chat", scriptPatterns: ["zendesk\\.com", "zdassets\\.com"], isCompetitor: false },
  { slug: "shogun", name: "Shogun", category: "page-builder", scriptPatterns: ["getshogun\\.com"], isCompetitor: false },
  { slug: "pagefly", name: "PageFly", category: "page-builder", scriptPatterns: ["pagefly\\.io"], isCompetitor: false },
  { slug: "aftership", name: "AfterShip", category: "shipping", scriptPatterns: ["aftership\\.com", "automizely\\.com"], isCompetitor: false },
  { slug: "justuno", name: "Justuno", category: "popups", scriptPatterns: ["justuno\\.com"], isCompetitor: false },
  { slug: "fomo", name: "Fomo", category: "social-proof", scriptPatterns: ["fomo\\.com"], isCompetitor: false },
  { slug: "order-printer-pro", name: "Order Printer Pro", category: "invoicing", scriptPatterns: ["orderprinterpro"], isCompetitor: true },
  { slug: "sufio", name: "Sufio", category: "invoicing", scriptPatterns: ["sufio\\.com"], isCompetitor: true },
];

async function main() {
  console.log("Seeding known apps...");

  for (const app of APPS) {
    await db
      .insert(knownApps)
      .values(app)
      .onConflictDoNothing();
    console.log(`  ✓ ${app.name}`);
  }

  console.log(`\nSeeded ${APPS.length} apps`);
}

main().catch(console.error);
