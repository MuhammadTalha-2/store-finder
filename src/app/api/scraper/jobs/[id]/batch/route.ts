import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeJobs, stores, storeApps, knownApps } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import {
  validateShopifyUrl,
  processStore,
  extractStoreInfo,
  extractInstalledApps,
  extractContactEmailFromHtml,
  classifyCategory,
} from "@/lib/scraper/engine";

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
