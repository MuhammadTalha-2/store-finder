import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  scrapeJobs,
  stores,
  storeApps,
  knownApps,
} from "@/lib/db/schema";
import {
  desc,
  eq,
  and,
  or,
  isNull,
  lt,
  isNotNull,
  inArray,
  notInArray,
  sql,
  count,
} from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET — List recent scrape jobs
export async function GET() {
  const jobs = await db
    .select()
    .from(scrapeJobs)
    .orderBy(desc(scrapeJobs.startedAt))
    .limit(20);

  return NextResponse.json({ jobs });
}

// POST — Create a new scrape job
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    type, // "scan" | "import" | "discover-and-scan"
    mode = "quick", // "quick" | "full"
    // Scan filters
    target = "unscraped", // "all" | "unscraped" | "stale"
    staleDays = 7,
    appCategory,   // string[] — app categories to filter
    hasApp,        // string[] — must have these app slugs
    missingApp,    // string[] — must NOT have these app slugs
    country,       // string[] — country codes
    hasEmail,      // boolean
    // Import
    urls,          // string[] — URLs to import
    limit = 200,
  } = body;

  if (type === "import") {
    // Import job — validate and add custom URLs
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
    }

    // Normalize and deduplicate URLs
    const normalizedUrls = [...new Set(
      urls
        .map((u: string) => u.trim())
        .filter((u: string) => u.length > 0)
        .map((u: string) => {
          try {
            if (!u.startsWith("http")) u = "https://" + u;
            const parsed = new URL(u);
            return `${parsed.protocol}//${parsed.hostname.toLowerCase()}`;
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    )];

    const [job] = await db
      .insert(scrapeJobs)
      .values({
        source: "web-import",
        status: "running",
        metadata: {
          type: "import",
          urls: normalizedUrls,
          cursor: 0,
          mode,
          validated: 0,
          invalid: 0,
        },
        storesDiscovered: 0,
      })
      .returning();

    return NextResponse.json({
      job,
      totalTarget: normalizedUrls.length,
    });
  }

  if (type === "scan" || type === "discover-and-scan") {
    // Build conditions to find matching stores
    const conditions = [eq(stores.isActive, true)];

    // Target filter
    if (target === "unscraped") {
      conditions.push(isNull(stores.lastScrapedAt));
    } else if (target === "stale") {
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - staleDays);
      conditions.push(
        or(isNull(stores.lastScrapedAt), lt(stores.lastScrapedAt, staleDate))!
      );
    }
    // "all" = no date filter

    // Country filter
    if (country && country.length > 0) {
      conditions.push(inArray(stores.country, country));
    }

    // Has email filter
    if (hasEmail === true) {
      conditions.push(isNotNull(stores.contactEmail));
    } else if (hasEmail === false) {
      conditions.push(isNull(stores.contactEmail));
    }

    // App category filter — stores must have at least one app in the given categories
    if (appCategory && appCategory.length > 0) {
      const appsInCategory = await db
        .select({ id: knownApps.id })
        .from(knownApps)
        .where(inArray(knownApps.category, appCategory));

      const appIds = appsInCategory.map((a) => a.id);
      if (appIds.length > 0) {
        const storeIdsWithCategoryApps = db
          .select({ storeId: storeApps.storeId })
          .from(storeApps)
          .where(inArray(storeApps.appId, appIds));
        conditions.push(inArray(stores.id, storeIdsWithCategoryApps));
      }
    }

    // Has specific apps
    if (hasApp && hasApp.length > 0) {
      const appRows = await db
        .select({ id: knownApps.id })
        .from(knownApps)
        .where(inArray(knownApps.slug, hasApp));
      const appIds = appRows.map((a) => a.id);
      if (appIds.length > 0) {
        const storeIdsWithApps = db
          .select({ storeId: storeApps.storeId })
          .from(storeApps)
          .where(inArray(storeApps.appId, appIds))
          .groupBy(storeApps.storeId)
          .having(sql`count(distinct ${storeApps.appId}) = ${appIds.length}`);
        conditions.push(inArray(stores.id, storeIdsWithApps));
      }
    }

    // Missing specific apps
    if (missingApp && missingApp.length > 0) {
      const appRows = await db
        .select({ id: knownApps.id })
        .from(knownApps)
        .where(inArray(knownApps.slug, missingApp));
      const appIds = appRows.map((a) => a.id);
      if (appIds.length > 0) {
        const storeIdsWithApps = db
          .select({ storeId: storeApps.storeId })
          .from(storeApps)
          .where(inArray(storeApps.appId, appIds));
        conditions.push(notInArray(stores.id, storeIdsWithApps));
      }
    }

    const where = and(...conditions);

    // Get matching store IDs (up to limit)
    const matchingStores = await db
      .select({ id: stores.id, url: stores.url })
      .from(stores)
      .where(where)
      .orderBy(
        sql`CASE
          WHEN ${stores.lastScrapedAt} IS NULL THEN 0
          WHEN ${stores.contactEmail} IS NULL THEN 1
          WHEN ${stores.country} IS NULL THEN 2
          ELSE 3
        END, ${stores.lastScrapedAt} ASC NULLS FIRST`
      )
      .limit(limit);

    const queue = matchingStores.map((s) => s.id);

    // Count total matching (for display)
    const [totalResult] = await db
      .select({ count: count() })
      .from(stores)
      .where(where);

    const [job] = await db
      .insert(scrapeJobs)
      .values({
        source: "web-scan",
        status: "running",
        metadata: {
          type: "scan",
          mode,
          target,
          filters: { appCategory, hasApp, missingApp, country, hasEmail },
          queue,
          cursor: 0,
        },
        storesDiscovered: 0,
      })
      .returning();

    return NextResponse.json({
      job,
      totalTarget: queue.length,
      totalMatching: totalResult.count,
    });
  }

  return NextResponse.json({ error: "Invalid job type" }, { status: 400 });
}
