import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeJobs, stores, storeApps, knownApps } from "@/lib/db/schema";
import { eq, or, and, isNull, desc } from "drizzle-orm";
import {
  validateShopifyUrl,
  processStore,
  extractStoreInfo,
  extractInstalledApps,
  extractContactEmailFromHtml,
  classifyCategory,
} from "@/lib/scraper/engine";
import { scrapeReviewPage, validateCandidate as validateCandidateUrl } from "@/lib/scraper/discover";

export const dynamic = "force-dynamic";
export const maxDuration = 10; // Vercel timeout hint

// POST — Process next batch of work for a job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const jobId = parseInt(idParam);

  // Load job
  const [job] = await db
    .select()
    .from(scrapeJobs)
    .where(eq(scrapeJobs.id, jobId))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "running") {
    return NextResponse.json({
      status: job.status,
      message: "Job is not running",
    });
  }

  const metadata = job.metadata as Record<string, unknown>;
  const jobType = metadata.type as string;
  const mode = (metadata.mode as string) || "quick";
  const cursor = (metadata.cursor as number) || 0;

  try {
    if (jobType === "import") {
      return await processImportBatch(job, metadata, cursor);
    } else if (jobType === "scan") {
      return await processScanBatch(job, metadata, cursor, mode);
    } else if (jobType === "discover") {
      return await processDiscoverBatch(job, metadata);
    }
    return NextResponse.json({ error: "Unknown job type" }, { status: 400 });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // Don't fail the whole job on a single batch error — just report it
    return NextResponse.json({
      status: "running",
      error: errorMsg,
      cursor,
      processed: cursor,
      total: jobType === "import"
        ? (metadata.urls as string[]).length
        : (metadata.queue as number[]).length,
    });
  }
}

// ---------- Import Batch ----------

async function processImportBatch(
  job: typeof scrapeJobs.$inferSelect,
  metadata: Record<string, unknown>,
  cursor: number
) {
  const urls = metadata.urls as string[];
  const total = urls.length;
  const BATCH_SIZE = 2; // Validate 2 URLs per call

  if (cursor >= total) {
    // Job complete
    await db
      .update(scrapeJobs)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(scrapeJobs.id, job.id));

    return NextResponse.json({
      status: "completed",
      processed: total,
      total,
      discovered: job.storesDiscovered,
      failed: job.storesFailed,
    });
  }

  const batch = urls.slice(cursor, cursor + BATCH_SIZE);
  let discovered = 0;
  let failed = 0;
  const results: { url: string; valid: boolean; signals?: string[] }[] = [];

  for (const url of batch) {
    try {
      // Check if already exists
      const existing = await db
        .select({ id: stores.id })
        .from(stores)
        .where(or(eq(stores.url, url), eq(stores.url, toggleWww(url))))
        .limit(1);

      if (existing.length > 0) {
        results.push({ url, valid: true, signals: ["already_exists"] });
        continue;
      }

      const validation = await validateShopifyUrl(url);
      if (validation.isShopify) {
        await db.insert(stores).values({ url }).onConflictDoNothing();
        discovered++;
        results.push({ url, valid: true, signals: validation.signals });
      } else {
        failed++;
        results.push({ url, valid: false, signals: validation.signals });
      }
    } catch {
      failed++;
      results.push({ url, valid: false, signals: ["error"] });
    }
  }

  const newCursor = cursor + batch.length;
  await db
    .update(scrapeJobs)
    .set({
      metadata: { ...metadata, cursor: newCursor },
      storesDiscovered: (job.storesDiscovered || 0) + discovered,
      storesFailed: (job.storesFailed || 0) + failed,
    })
    .where(eq(scrapeJobs.id, job.id));

  return NextResponse.json({
    status: newCursor >= total ? "completing" : "running",
    processed: newCursor,
    total,
    batchResults: results,
    discovered: (job.storesDiscovered || 0) + discovered,
    failed: (job.storesFailed || 0) + failed,
  });
}

// ---------- Scan Batch ----------

async function processScanBatch(
  job: typeof scrapeJobs.$inferSelect,
  metadata: Record<string, unknown>,
  cursor: number,
  mode: string
) {
  const queue = metadata.queue as number[];
  const total = queue.length;

  if (cursor >= total) {
    await db
      .update(scrapeJobs)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(scrapeJobs.id, job.id));

    return NextResponse.json({
      status: "completed",
      processed: total,
      total,
      updated: job.storesUpdated,
      failed: job.storesFailed,
    });
  }

  // Process 1 store per batch (to stay within 10s)
  const storeId = queue[cursor];

  // Load store
  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  if (!store) {
    // Store was deleted — skip it
    const newCursor = cursor + 1;
    await db
      .update(scrapeJobs)
      .set({ metadata: { ...metadata, cursor: newCursor } })
      .where(eq(scrapeJobs.id, job.id));

    return NextResponse.json({
      status: newCursor >= total ? "completing" : "running",
      processed: newCursor,
      total,
      skipped: true,
    });
  }

  // Load known app patterns from DB
  const appPatterns = await db
    .select({
      id: knownApps.id,
      slug: knownApps.slug,
      name: knownApps.name,
      scriptPatterns: knownApps.scriptPatterns,
    })
    .from(knownApps);

  let updated = 0;
  let failed = 0;
  let result: {
    name: string | null;
    apps: number;
    email: string | null;
    country: string | null;
    products: number;
  } | null = null;

  try {
    const extracted = await processStore(
      store.url,
      appPatterns.map((a) => ({
        slug: a.slug,
        name: a.name,
        scriptPatterns: a.scriptPatterns,
      })),
      mode as "quick" | "full"
    );

    // Save store data
    await db
      .update(stores)
      .set({
        name: extracted.storeInfo.name,
        myshopifyDomain: extracted.storeInfo.myshopifyDomain,
        language: extracted.storeInfo.language,
        country: extracted.storeInfo.country,
        currency: extracted.storeInfo.currency,
        metaDescription: extracted.storeInfo.metaDescription,
        contactEmail: extracted.contact.email,
        emailSource: extracted.contact.source,
        productCount: mode === "full" ? extracted.productCount : store.productCount,
        collectionCount: extracted.collectionCount,
        hasBlog: extracted.hasBlog,
        category: extracted.category,
        lastScrapedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(stores.id, store.id));

    // Save detected apps
    if (extracted.detectedApps.length > 0) {
      await db.delete(storeApps).where(eq(storeApps.storeId, store.id));

      for (const app of extracted.detectedApps) {
        const knownApp = appPatterns.find((a) => a.slug === app.slug);
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

    updated = 1;
    result = {
      name: extracted.storeInfo.name,
      apps: extracted.detectedApps.length,
      email: extracted.contact.email,
      country: extracted.storeInfo.country,
      products: extracted.productCount,
    };
  } catch (err) {
    failed = 1;
    result = null;
  }

  const newCursor = cursor + 1;
  const isComplete = newCursor >= total;

  await db
    .update(scrapeJobs)
    .set({
      metadata: { ...metadata, cursor: newCursor },
      storesUpdated: (job.storesUpdated || 0) + updated,
      storesFailed: (job.storesFailed || 0) + failed,
      ...(isComplete
        ? { status: "completed", completedAt: new Date() }
        : {}),
    })
    .where(eq(scrapeJobs.id, job.id));

  return NextResponse.json({
    status: isComplete ? "completed" : "running",
    processed: newCursor,
    total,
    updated: (job.storesUpdated || 0) + updated,
    failed: (job.storesFailed || 0) + failed,
    current: {
      url: store.url,
      success: updated === 1,
      result,
    },
  });
}

// ---------- Discover Batch ----------

async function processDiscoverBatch(
  job: typeof scrapeJobs.$inferSelect,
  metadata: Record<string, unknown>
) {
  const phase = (metadata.phase as string) || "scrape";
  const scrapeQueue = (metadata.scrapeQueue as { slug: string; page: number }[]) || [];
  const scrapeCursor = (metadata.scrapeCursor as number) || 0;
  const candidateUrls = (metadata.candidateUrls as string[]) || [];
  const validateCursor = (metadata.validateCursor as number) || 0;
  const maxStores = (metadata.maxStores as number) || 200;
  const mode = (metadata.mode as string) || "quick";

  if (phase === "scrape") {
    // Phase 1: Scrape one review page per batch call
    if (scrapeCursor >= scrapeQueue.length) {
      // Done scraping — transition to validate phase
      // Deduplicate candidate URLs
      const unique = [...new Set(candidateUrls)];

      if (unique.length === 0) {
        // No candidates found — complete job
        await db
          .update(scrapeJobs)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(scrapeJobs.id, job.id));

        return NextResponse.json({
          status: "completed",
          phase: "scrape",
          processed: scrapeQueue.length,
          total: scrapeQueue.length,
          candidatesFound: 0,
          message: "No new store URLs discovered",
        });
      }

      // Limit candidates to maxStores
      const limitedCandidates = unique.slice(0, maxStores);

      await db
        .update(scrapeJobs)
        .set({
          metadata: {
            ...metadata,
            phase: "validate",
            candidateUrls: limitedCandidates,
            validateCursor: 0,
          },
        })
        .where(eq(scrapeJobs.id, job.id));

      return NextResponse.json({
        status: "running",
        phase: "validate",
        message: `Found ${limitedCandidates.length} candidate URLs. Starting validation...`,
        scrapeComplete: true,
        totalCandidates: limitedCandidates.length,
        processed: 0,
        total: limitedCandidates.length,
      });
    }

    // Scrape one review page
    const item = scrapeQueue[scrapeCursor];
    let newUrls: string[] = [];
    let merchantNames: string[] = [];
    let hasMore = false;

    try {
      const result = await scrapeReviewPage(item.slug, item.page);
      newUrls = result.urls;
      merchantNames = result.merchantNames;
      hasMore = result.hasMore;
    } catch {
      // Failed to fetch this page — continue
    }

    const updatedCandidates = [...candidateUrls, ...newUrls];
    const newScrapeCursor = scrapeCursor + 1;

    await db
      .update(scrapeJobs)
      .set({
        metadata: {
          ...metadata,
          scrapeCursor: newScrapeCursor,
          candidateUrls: updatedCandidates,
        },
      })
      .where(eq(scrapeJobs.id, job.id));

    return NextResponse.json({
      status: "running",
      phase: "scrape",
      processed: newScrapeCursor,
      total: scrapeQueue.length,
      currentApp: item.slug,
      currentPage: item.page,
      newUrlsFound: newUrls.length,
      merchantNames,
      totalCandidates: [...new Set(updatedCandidates)].length,
      hasMore,
    });
  }

  if (phase === "validate") {
    // Phase 2: Validate 2 candidate URLs per batch call
    const total = candidateUrls.length;
    const BATCH_SIZE = 2;

    if (validateCursor >= total) {
      // All validated — complete discover job
      await db
        .update(scrapeJobs)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(scrapeJobs.id, job.id));

      // Auto-create a follow-up scan job for unscraped stores
      const discoverMode = (metadata.mode as string) || "quick";
      const unscannedStores = await db
        .select({ id: stores.id })
        .from(stores)
        .where(and(eq(stores.isActive, true), isNull(stores.lastScrapedAt)))
        .orderBy(desc(stores.id))
        .limit(500);

      let followUpJobId: number | null = null;
      let followUpTotal = 0;

      if (unscannedStores.length > 0) {
        const scanQueue = unscannedStores.map((s) => s.id);
        const [scanJob] = await db
          .insert(scrapeJobs)
          .values({
            source: "web-scan",
            status: "running",
            metadata: {
              type: "scan",
              mode: discoverMode === "full" ? "full" : "quick",
              target: "unscraped",
              queue: scanQueue,
              cursor: 0,
              autoFollowUp: true,
            },
            storesDiscovered: 0,
          })
          .returning();
        followUpJobId = scanJob.id;
        followUpTotal = scanQueue.length;
      }

      return NextResponse.json({
        status: "completed",
        phase: "validate",
        processed: total,
        total,
        discovered: job.storesDiscovered,
        failed: job.storesFailed,
        followUpJobId,
        followUpTotal,
      });
    }

    const batch = candidateUrls.slice(validateCursor, validateCursor + BATCH_SIZE);
    let discovered = 0;
    let failed = 0;
    const results: { url: string; valid: boolean; signals?: string[]; isNew?: boolean }[] = [];

    for (const url of batch) {
      try {
        // Check if already exists (try both with/without www)
        const existing = await db
          .select({ id: stores.id })
          .from(stores)
          .where(or(eq(stores.url, url), eq(stores.url, toggleWww(url))))
          .limit(1);

        if (existing.length > 0) {
          results.push({ url, valid: true, signals: ["already_exists"], isNew: false });
          continue;
        }

        // Use the discover-specific validator for .myshopify.com candidates
        const candidateResult = await validateCandidateUrl(url);
        if (candidateResult) {
          const storeUrl = candidateResult.url; // may be custom domain
          // Also check the resolved URL isn't already in DB
          const existingResolved = storeUrl !== url
            ? await db
                .select({ id: stores.id })
                .from(stores)
                .where(or(eq(stores.url, storeUrl), eq(stores.url, toggleWww(storeUrl))))
                .limit(1)
            : [];

          if (existingResolved.length > 0) {
            results.push({ url: storeUrl, valid: true, signals: ["already_exists"], isNew: false });
          } else {
            await db.insert(stores).values({ url: storeUrl }).onConflictDoNothing();
            discovered++;
            results.push({ url: storeUrl, valid: true, signals: candidateResult.signals, isNew: true });
          }
        } else {
          failed++;
          results.push({ url, valid: false, signals: ["not_shopify"] });
        }
      } catch {
        failed++;
        results.push({ url, valid: false, signals: ["error"] });
      }
    }

    const newValidateCursor = validateCursor + batch.length;
    const isComplete = newValidateCursor >= total;

    await db
      .update(scrapeJobs)
      .set({
        metadata: {
          ...metadata,
          validateCursor: newValidateCursor,
        },
        storesDiscovered: (job.storesDiscovered || 0) + discovered,
        storesFailed: (job.storesFailed || 0) + failed,
        ...(isComplete
          ? { status: "completed", completedAt: new Date() }
          : {}),
      })
      .where(eq(scrapeJobs.id, job.id));

    // If validation just completed, auto-create follow-up scan job
    let followUpJobId: number | null = null;
    let followUpTotal = 0;

    if (isComplete) {
      const discoverMode = (metadata.mode as string) || "quick";
      const unscannedStores = await db
        .select({ id: stores.id })
        .from(stores)
        .where(and(eq(stores.isActive, true), isNull(stores.lastScrapedAt)))
        .orderBy(desc(stores.id))
        .limit(500);

      if (unscannedStores.length > 0) {
        const scanQueue = unscannedStores.map((s) => s.id);
        const [scanJob] = await db
          .insert(scrapeJobs)
          .values({
            source: "web-scan",
            status: "running",
            metadata: {
              type: "scan",
              mode: discoverMode === "full" ? "full" : "quick",
              target: "unscraped",
              queue: scanQueue,
              cursor: 0,
              autoFollowUp: true,
            },
            storesDiscovered: 0,
          })
          .returning();
        followUpJobId = scanJob.id;
        followUpTotal = scanQueue.length;
      }
    }

    return NextResponse.json({
      status: isComplete ? "completed" : "running",
      phase: "validate",
      processed: newValidateCursor,
      total,
      batchResults: results,
      discovered: (job.storesDiscovered || 0) + discovered,
      failed: (job.storesFailed || 0) + failed,
      ...(isComplete ? { followUpJobId, followUpTotal } : {}),
    });
  }

  return NextResponse.json({ error: "Unknown discover phase" }, { status: 400 });
}

// ---------- Helpers ----------

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
