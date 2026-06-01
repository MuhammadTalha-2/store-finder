import { db } from "./db.js";
import { validateShopifyStore } from "./store-validator.js";
import { extractStoreInfo } from "./extractors/store-info.js";
import { extractContactEmail } from "./extractors/contact-email.js";
import { extractProductCount } from "./extractors/product-count.js";
import { extractInstalledApps } from "./extractors/installed-apps.js";
import { classifyCategory } from "./extractors/category.js";
import { discoverFromAppStoreReviews } from "./discovery/app-store-reviews.js";
import { loadSeedUrls } from "./discovery/seed-urls.js";
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  real,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { eq, sql } from "drizzle-orm";

// Inline schema references (avoids importing from Next.js src)
const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  myshopifyDomain: text("myshopify_domain"),
  name: text("name"),
  contactEmail: text("contact_email"),
  emailSource: text("email_source"),
  productCount: integer("product_count"),
  language: text("language"),
  country: text("country"),
  currency: text("currency"),
  category: text("category"),
  metaDescription: text("meta_description"),
  collectionCount: integer("collection_count"),
  hasBlog: boolean("has_blog"),
  isActive: boolean("is_active").default(true).notNull(),
  lastScrapedAt: timestamp("last_scraped_at", { withTimezone: true }),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

const knownApps = pgTable("known_apps", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
});

const storeApps = pgTable("store_apps", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull(),
  appId: integer("app_id").notNull(),
  detectedAt: timestamp("detected_at", { withTimezone: true }).defaultNow().notNull(),
  confidence: real("confidence").default(1.0).notNull(),
});

const scrapeJobs = pgTable("scrape_jobs", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  status: text("status").default("running").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  storesDiscovered: integer("stores_discovered").default(0).notNull(),
  storesUpdated: integer("stores_updated").default(0).notNull(),
  storesFailed: integer("stores_failed").default(0).notNull(),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
});

// ---------- CLI ----------

const command = process.argv[2];
const args = parseArgs(process.argv.slice(3));

async function main() {
  console.log(`Store Finder Scraper — ${command || "help"}`);
  console.log("---");

  switch (command) {
    case "discover":
      await runDiscover(args);
      break;
    case "extract":
      await runExtract(args);
      break;
    case "full":
      await runFull(args);
      break;
    default:
      console.log("Usage:");
      console.log("  npx tsx src/index.ts discover --source app-reviews --limit 500");
      console.log("  npx tsx src/index.ts extract --batch-size 50");
      console.log("  npx tsx src/index.ts full --limit 200");
      process.exit(0);
  }
}

function parseArgs(argv: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      result[key] = argv[i + 1] || "true";
      i++;
    }
  }
  return result;
}

async function runDiscover(args: Record<string, string>) {
  const source = args.source || "all";
  const limit = parseInt(args.limit || "500");

  console.log(`Discovering stores from: ${source}, limit: ${limit}`);

  let urls: string[] = [];

  switch (source) {
    case "app-reviews":
      urls = await discoverFromAppStoreReviews(limit);
      break;
    case "seeds":
      urls = loadSeedUrls();
      break;
    case "all": {
      const seeds = loadSeedUrls();
      console.log(`  Loaded ${seeds.length} seed URLs`);
      const fromReviews = await discoverFromAppStoreReviews(Math.max(0, limit - seeds.length));
      const combined = new Set([...seeds, ...fromReviews]);
      urls = Array.from(combined).slice(0, limit);
      break;
    }
    default:
      console.log(`Unknown source: ${source}`);
      process.exit(1);
  }

  console.log(`\nDiscovered ${urls.length} candidate URLs`);
  console.log("Validating...");

  let validated = 0;
  let skipped = 0;

  for (const url of urls) {
    try {
      // Check if already in DB
      const existing = await db
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.url, url))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      const result = await validateShopifyStore(url);
      if (result.isShopify) {
        await db.insert(stores).values({ url }).onConflictDoNothing();
        validated++;
        console.log(`  ✓ ${url} (signals: ${result.signals.join(", ")})`);
      } else {
        console.log(`  ✗ ${url} (not Shopify, signals: ${result.signals.join(", ")})`);
      }
    } catch (err) {
      console.log(`  ! ${url} — error: ${err}`);
    }
  }

  console.log(`\nValidated: ${validated}, Skipped (existing): ${skipped}, Total candidates: ${urls.length}`);
}

async function runExtract(args: Record<string, string>) {
  const batchSize = parseInt(args["batch-size"] || "50");

  console.log(`Extracting data for stores (batch: ${batchSize})`);

  // Get stores that need extraction (no lastScrapedAt or old)
  const storesToExtract = await db
    .select()
    .from(stores)
    .where(eq(stores.isActive, true))
    .orderBy(stores.lastScrapedAt)
    .limit(batchSize);

  console.log(`Found ${storesToExtract.length} stores to process`);

  let updated = 0;
  let failed = 0;

  for (const store of storesToExtract) {
    console.log(`\nProcessing: ${store.url}`);

    try {
      const [info, contact, products, apps] = await Promise.all([
        extractStoreInfo(store.url),
        extractContactEmail(store.url),
        extractProductCount(store.url),
        extractInstalledApps(store.url),
      ]);

      const category = await classifyCategory(store.url, info.metaDescription);

      await db
        .update(stores)
        .set({
          name: info.name,
          myshopifyDomain: info.myshopifyDomain,
          language: info.language,
          country: info.country,
          currency: info.currency,
          metaDescription: info.metaDescription,
          contactEmail: contact.email,
          emailSource: contact.source,
          productCount: products.productCount,
          collectionCount: products.collectionCount,
          hasBlog: products.hasBlog,
          category,
          lastScrapedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(stores.id, store.id));

      // Save detected apps
      for (const app of apps) {
        const [knownApp] = await db
          .select({ id: knownApps.id })
          .from(knownApps)
          .where(eq(knownApps.slug, app.slug))
          .limit(1);

        if (knownApp) {
          await db
            .insert(storeApps)
            .values({
              storeId: store.id,
              appId: knownApp.id,
              confidence: app.confidence,
            })
            .onConflictDoNothing();
        }
      }

      console.log(`  ✓ ${info.name || "unnamed"} | ${products.productCount} products | ${apps.length} apps | email: ${contact.email || "none"} | category: ${category}`);
      updated++;
    } catch (err) {
      console.log(`  ✗ Error: ${err}`);
      failed++;
    }
  }

  console.log(`\nDone — Updated: ${updated}, Failed: ${failed}`);
}

async function runFull(args: Record<string, string>) {
  const limit = parseInt(args.limit || "200");

  console.log("Running full pipeline (discover + extract)");

  // Create a scrape job record
  const [job] = await db
    .insert(scrapeJobs)
    .values({ source: "cli-full", metadata: { limit } })
    .returning();

  try {
    // Discover
    await runDiscover({ source: "all", limit: String(limit) });

    // Extract
    await runExtract({ "batch-size": String(limit) });

    // Update job
    const [totalStores] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stores);

    await db
      .update(scrapeJobs)
      .set({
        status: "completed",
        completedAt: new Date(),
        storesDiscovered: totalStores.count,
      })
      .where(eq(scrapeJobs.id, job.id));

    console.log("\nFull pipeline completed!");
  } catch (err) {
    await db
      .update(scrapeJobs)
      .set({
        status: "failed",
        completedAt: new Date(),
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      .where(eq(scrapeJobs.id, job.id));

    console.error("Pipeline failed:", err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
