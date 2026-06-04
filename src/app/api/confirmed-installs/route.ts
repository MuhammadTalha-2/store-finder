import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { confirmedInstalls, stores } from "@/lib/db/schema";
import { syncAllAppsFromPartners, parseCsvImport, OUR_APPS } from "@/lib/partners-api";
import { eq, and, or, ilike, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/confirmed-installs
 * Returns summary of confirmed installs and sync status.
 */
export async function GET() {
  const installs = await db
    .select({
      ourAppSlug: confirmedInstalls.ourAppSlug,
      source: confirmedInstalls.source,
      count: sql<number>`count(*)::int`,
    })
    .from(confirmedInstalls)
    .where(eq(confirmedInstalls.isActive, true))
    .groupBy(confirmedInstalls.ourAppSlug, confirmedInstalls.source);

  // Total by app
  const byApp: Record<string, { total: number; bySource: Record<string, number> }> = {};
  for (const app of OUR_APPS) {
    byApp[app.slug] = { total: 0, bySource: {} };
  }

  for (const row of installs) {
    if (!byApp[row.ourAppSlug]) {
      byApp[row.ourAppSlug] = { total: 0, bySource: {} };
    }
    byApp[row.ourAppSlug].total += row.count;
    byApp[row.ourAppSlug].bySource[row.source] = row.count;
  }

  // Check if Partners API is configured
  const partnersConfigured = !!(
    process.env.SHOPIFY_PARTNERS_TOKEN &&
    process.env.SHOPIFY_PARTNERS_ORG_ID
  );

  const appsConfigured = OUR_APPS.filter(
    (app) => !!process.env[app.envKey]
  ).map((a) => a.slug);

  return NextResponse.json({
    byApp,
    partnersConfigured,
    appsConfigured,
    apps: OUR_APPS.map((a) => ({ slug: a.slug, name: a.name, category: a.category })),
  });
}

/**
 * POST /api/confirmed-installs
 * Two modes:
 *   { action: "sync" } — Sync from Shopify Partners API
 *   { action: "csv", csv: "...", app?: "invoiceforge" } — Import from CSV
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.action === "sync") {
    return handlePartnersSync();
  }

  if (body.action === "csv") {
    return handleCsvImport(body.csv, body.app);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

async function handlePartnersSync() {
  const { results, errors } = await syncAllAppsFromPartners();

  let totalInserted = 0;
  let totalUpdated = 0;
  let totalMatched = 0;

  for (const result of results) {
    for (const install of result.installations) {
      try {
        // Upsert into confirmed_installs
        await db
          .insert(confirmedInstalls)
          .values({
            shopifyDomain: install.shopDomain,
            ourAppSlug: result.appSlug,
            source: "partners-api",
            installedAt: install.installedAt
              ? new Date(install.installedAt)
              : null,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: [
              confirmedInstalls.shopifyDomain,
              confirmedInstalls.ourAppSlug,
            ],
            set: {
              source: "partners-api",
              isActive: true,
              confirmedAt: new Date(),
              installedAt: install.installedAt
                ? new Date(install.installedAt)
                : undefined,
            },
          });
        totalInserted++;

        // Try to match with existing store by myshopify domain
        const matched = await tryMatchStore(install.shopDomain);
        if (matched) totalMatched++;
      } catch (err) {
        errors.push(
          `Failed to upsert ${install.shopDomain}: ${err instanceof Error ? err.message : "Unknown"}`
        );
      }
    }
  }

  return NextResponse.json({
    success: true,
    apps: results.map((r) => ({
      slug: r.appSlug,
      name: r.appName,
      installations: r.installations.length,
      error: r.error,
    })),
    totalInserted,
    totalMatched,
    errors,
  });
}

async function handleCsvImport(csvText: string, app?: string) {
  if (!csvText || typeof csvText !== "string") {
    return NextResponse.json({ error: "Missing csv field" }, { status: 400 });
  }

  const parsed = parseCsvImport(csvText, app as any);

  if (parsed.length === 0) {
    return NextResponse.json(
      { error: "No valid entries found in CSV" },
      { status: 400 }
    );
  }

  let inserted = 0;
  let matched = 0;
  const errors: string[] = [];

  for (const entry of parsed) {
    try {
      await db
        .insert(confirmedInstalls)
        .values({
          shopifyDomain: entry.shopDomain,
          ourAppSlug: entry.appSlug,
          source: "csv-import",
          isActive: true,
        })
        .onConflictDoUpdate({
          target: [
            confirmedInstalls.shopifyDomain,
            confirmedInstalls.ourAppSlug,
          ],
          set: {
            source: "csv-import",
            isActive: true,
            confirmedAt: new Date(),
          },
        });
      inserted++;

      const m = await tryMatchStore(entry.shopDomain);
      if (m) matched++;
    } catch (err) {
      errors.push(
        `${entry.shopDomain}: ${err instanceof Error ? err.message : "Unknown"}`
      );
    }
  }

  return NextResponse.json({
    success: true,
    parsed: parsed.length,
    inserted,
    matched,
    errors,
  });
}

/**
 * Try to match a shopify domain to an existing store in our DB
 * and set the store_id on the confirmed install.
 */
async function tryMatchStore(shopifyDomain: string): Promise<boolean> {
  // Try matching by myshopify_domain or by URL containing the domain
  const domain = shopifyDomain.replace(/\.myshopify\.com$/, "");

  const matchedStores = await db
    .select({ id: stores.id })
    .from(stores)
    .where(
      or(
        eq(stores.myshopifyDomain, shopifyDomain),
        ilike(stores.url, `%${domain}%`)
      )
    )
    .limit(1);

  if (matchedStores.length > 0) {
    await db
      .update(confirmedInstalls)
      .set({ storeId: matchedStores[0].id })
      .where(eq(confirmedInstalls.shopifyDomain, shopifyDomain));
    return true;
  }

  return false;
}
