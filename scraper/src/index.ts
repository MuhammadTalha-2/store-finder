import { db } from "./db.js";
import { throttledFetch } from "./rate-limiter.js";
import { validateShopifyStore } from "./store-validator.js";
import { extractStoreInfo } from "./extractors/store-info.js";
import { extractContactEmail } from "./extractors/contact-email.js";
import { extractProductCount } from "./extractors/product-count.js";
import { extractInstalledApps } from "./extractors/installed-apps.js";
import { classifyCategory } from "./extractors/category.js";
import { discoverFromAppStoreReviews } from "./discovery/app-store-reviews.js";
import { loadSeedUrls } from "./discovery/seed-urls.js";
import {
  discoverFromReviews,
  storeNameToCandidateUrls,
  type ReviewStoreInfo,
} from "./discovery/review-scraper.js";
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  real,
  jsonb,
} from "drizzle-orm/pg-core";
import { eq, sql, and, or, isNull, lt } from "drizzle-orm";

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
    case "discover-reviews":
      await runDiscoverReviews(args);
      break;
    case "extract":
      await runExtract(args);
      break;
    case "full":
      await runFull(args);
      break;
    default:
      console.log("Usage:");
      console.log("  npx tsx src/index.ts discover --source all --limit 500");
      console.log("  npx tsx src/index.ts discover-reviews --pages 10 --limit 500");
      console.log("  npx tsx src/index.ts extract --batch-size 50 --stale-days 7");
      console.log("  npx tsx src/index.ts full --limit 200");
      console.log("  npx tsx src/index.ts extract --force true --batch-size 100");
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

// ---------- Discover ----------

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
      const fromReviews = await discoverFromAppStoreReviews(
        Math.max(0, limit - seeds.length)
      );
      const combined = new Set([...seeds, ...fromReviews]);
      urls = Array.from(combined).slice(0, limit);
      break;
    }
    default:
      console.log(`Unknown source: ${source}`);
      process.exit(1);
  }

  // Normalize URLs
  urls = urls.map(normalizeUrl);

  console.log(`\nDiscovered ${urls.length} candidate URLs`);
  console.log("Validating...");

  let validated = 0;
  let skipped = 0;

  for (const url of urls) {
    try {
      // Check if already in DB (also check without/with www)
      const existing = await db
        .select({ id: stores.id })
        .from(stores)
        .where(
          or(
            eq(stores.url, url),
            eq(stores.url, toggleWww(url))
          )
        )
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      const result = await validateShopifyStore(url);
      if (result.isShopify) {
        await db.insert(stores).values({ url }).onConflictDoNothing();
        validated++;
        console.log(
          `  ✓ ${url} (signals: ${result.signals.join(", ")})`
        );
      } else {
        console.log(
          `  ✗ ${url} (not Shopify, signals: ${result.signals.join(", ")})`
        );
      }
    } catch (err) {
      console.log(`  ! ${url} — error: ${err}`);
    }
  }

  console.log(
    `\nValidated: ${validated}, Skipped (existing): ${skipped}, Total candidates: ${urls.length}`
  );
}

// ---------- Discover from Reviews (Playwright) ----------

async function runDiscoverReviews(args: Record<string, string>) {
  const maxPagesPerApp = parseInt(args.pages || "10");
  const limit = parseInt(args.limit || "500");
  const pageDelay = parseInt(args.delay || "2000");
  const headless = args.headless !== "false";
  const slugsArg = args.apps; // comma-separated slugs (optional)

  console.log(
    `Discovering stores from app reviews (Playwright)\n` +
      `  Max pages/app: ${maxPagesPerApp}, Limit: ${limit}, Delay: ${pageDelay}ms\n`
  );

  // Create a scrape job record
  const [job] = await db
    .insert(scrapeJobs)
    .values({
      source: "cli-review-scraper",
      metadata: { maxPagesPerApp, limit, pageDelay },
    })
    .returning();

  try {
    // Step 1: Scrape review pages with Playwright
    const reviewStores = await discoverFromReviews({
      appSlugs: slugsArg ? slugsArg.split(",") : undefined,
      maxPagesPerApp,
      limit,
      pageDelay,
      headless,
    });

    console.log(`\nExtracted ${reviewStores.length} store names from reviews`);

    // Step 2: Convert store names → candidate myshopify URLs → validate
    let validated = 0;
    let skipped = 0;
    let failed = 0;

    for (const store of reviewStores) {
      const candidateUrls = storeNameToCandidateUrls(store.storeName);
      if (candidateUrls.length === 0) {
        failed++;
        continue;
      }

      let found = false;
      for (const url of candidateUrls) {
        // Check if already in DB
        const existing = await db
          .select({ id: stores.id })
          .from(stores)
          .where(
            or(eq(stores.url, url), eq(stores.url, toggleWww(url)))
          )
          .limit(1);

        if (existing.length > 0) {
          skipped++;
          found = true;
          break;
        }

        try {
          const result = await validateShopifyStore(url);
          if (result.isShopify) {
            await db
              .insert(stores)
              .values({
                url,
                name: store.storeName,
                country: store.country || null,
              })
              .onConflictDoNothing();

            console.log(
              `  ✓ ${store.storeName} → ${url} (signals: ${result.signals.join(", ")})`
            );
            validated++;
            found = true;
            break; // Stop trying other candidate URLs
          }
        } catch {
          // Try next candidate URL
        }
      }

      if (!found) {
        console.log(`  ✗ ${store.storeName} — no valid Shopify URL found`);
        failed++;
      }
    }

    // Update job record
    await db
      .update(scrapeJobs)
      .set({
        status: "completed",
        completedAt: new Date(),
        storesDiscovered: validated,
        storesUpdated: 0,
        storesFailed: failed,
        metadata: {
          maxPagesPerApp,
          limit,
          pageDelay,
          totalReviews: reviewStores.length,
          validated,
          skipped,
          failed,
        },
      })
      .where(eq(scrapeJobs.id, job.id));

    console.log(
      `\nReview discovery complete:` +
        `\n  Store names found: ${reviewStores.length}` +
        `\n  Validated & added: ${validated}` +
        `\n  Already in DB:     ${skipped}` +
        `\n  Not found:         ${failed}`
    );
  } catch (err) {
    await db
      .update(scrapeJobs)
      .set({
        status: "failed",
        completedAt: new Date(),
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      .where(eq(scrapeJobs.id, job.id));

    console.error("Review discovery failed:", err);
    process.exit(1);
  }
}

// ---------- Extract ----------

async function runExtract(args: Record<string, string>) {
  const batchSize = parseInt(args["batch-size"] || "50");
  const staleDays = parseInt(args["stale-days"] || "7");
  const force = args.force === "true";

  console.log(
    `Extracting data (batch: ${batchSize}, stale: ${staleDays}d, force: ${force})`
  );

  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - staleDays);

  // Build WHERE clause — incremental by default
  let whereClause;
  if (force) {
    // Force: re-scrape all active stores
    whereClause = eq(stores.isActive, true);
  } else {
    // Incremental: only stores that are stale or never scraped
    whereClause = and(
      eq(stores.isActive, true),
      or(
        isNull(stores.lastScrapedAt),
        lt(stores.lastScrapedAt, staleDate)
      )
    );
  }

  const storesToExtract = await db
    .select()
    .from(stores)
    .where(whereClause)
    .orderBy(
      // Prioritize: never scraped first, then missing email, then oldest
      sql`
        CASE
          WHEN ${stores.lastScrapedAt} IS NULL THEN 0
          WHEN ${stores.contactEmail} IS NULL THEN 1
          WHEN ${stores.country} IS NULL THEN 2
          ELSE 3
        END,
        ${stores.lastScrapedAt} ASC NULLS FIRST
      `
    )
    .limit(batchSize);

  console.log(`Found ${storesToExtract.length} stores to process\n`);

  let updated = 0;
  let failed = 0;

  for (const store of storesToExtract) {
    console.log(`Processing: ${store.url}`);

    try {
      // ── Fetch homepage ONCE ──
      const homepageRes = await throttledFetch(store.url, { retries: 1 });
      const homepageHtml = await homepageRes.text();

      // ── Extract everything from the single HTML fetch ──
      const info = extractStoreInfo(homepageHtml);
      const apps = extractInstalledApps(homepageHtml);

      // ── These still make their own requests (different pages/APIs) ──
      const [contact, products] = await Promise.all([
        extractContactEmail(store.url, homepageHtml),
        extractProductCount(store.url),
      ]);

      const category = await classifyCategory(
        store.url,
        info.metaDescription
      );

      // ── Save store data ──
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

      // ── Save detected apps ──
      if (apps.length > 0) {
        // Clear old app detections for this store before re-inserting
        await db
          .delete(storeApps)
          .where(eq(storeApps.storeId, store.id));

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
      }

      console.log(
        `  ✓ ${info.name || "unnamed"} | ${products.productCount} products | ${apps.length} apps | ${contact.email || "no email"} | ${info.country || "??"} | ${category}`
      );
      updated++;
    } catch (err) {
      console.log(`  ✗ Error: ${err}`);
      failed++;
    }
  }

  console.log(`\nDone — Updated: ${updated}, Failed: ${failed}`);
  return { updated, failed };
}

// ---------- Full pipeline ----------

async function runFull(args: Record<string, string>) {
  const limit = parseInt(args.limit || "200");
  const source = args.source || "all";

  console.log("Running full pipeline (discover + extract)");

  // Create a scrape job record
  const [job] = await db
    .insert(scrapeJobs)
    .values({ source: `cli-full:${source}`, metadata: { limit, source } })
    .returning();

  try {
    // Discover
    await runDiscover({ source, limit: String(limit) });

    // Extract — force on full runs so new stores get processed
    const result = await runExtract({
      "batch-size": String(limit),
      "stale-days": "7",
    });

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
        storesUpdated: result?.updated ?? 0,
        storesFailed: result?.failed ?? 0,
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

// ---------- Helpers ----------

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove trailing slash, lowercase hostname
    return `${u.protocol}//${u.hostname.toLowerCase()}`;
  } catch {
    return url;
  }
}

function toggleWww(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.startsWith("www.")) {
      return `${u.protocol}//${u.hostname.slice(4)}`;
    }
    return `${u.protocol}//www.${u.hostname}`;
  } catch {
    return url;
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
