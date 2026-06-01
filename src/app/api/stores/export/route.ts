import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stores, storeApps, knownApps } from "@/lib/db/schema";
import { storeFiltersSchema } from "@/lib/filters";
import { storesToCsv } from "@/lib/csv-export";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  lte,
  notInArray,
  or,
  sql,
} from "drizzle-orm";

export const dynamic = "force-dynamic";

const MAX_EXPORT_ROWS = 10000;

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const filters = storeFiltersSchema.parse({ ...params, limit: MAX_EXPORT_ROWS, page: 1 });

  const conditions = [eq(stores.isActive, true)];

  if (filters.category) {
    conditions.push(inArray(stores.category, filters.category.split(",")));
  }
  if (filters.country) {
    conditions.push(inArray(stores.country, filters.country.split(",")));
  }
  if (filters.language) {
    conditions.push(inArray(stores.language, filters.language.split(",")));
  }
  if (filters.minProducts !== undefined) {
    conditions.push(gte(stores.productCount, filters.minProducts));
  }
  if (filters.maxProducts !== undefined) {
    conditions.push(lte(stores.productCount, filters.maxProducts));
  }
  if (filters.hasEmail === true) {
    conditions.push(isNotNull(stores.contactEmail));
  }
  if (filters.search) {
    conditions.push(
      or(
        ilike(stores.name, `%${filters.search}%`),
        ilike(stores.url, `%${filters.search}%`)
      )!
    );
  }

  if (filters.hasApp) {
    const appSlugs = filters.hasApp.split(",");
    const appRows = await db
      .select({ id: knownApps.id })
      .from(knownApps)
      .where(inArray(knownApps.slug, appSlugs));
    const appIds = appRows.map((a) => a.id);
    if (appIds.length > 0) {
      const sub = db
        .select({ storeId: storeApps.storeId })
        .from(storeApps)
        .where(inArray(storeApps.appId, appIds))
        .groupBy(storeApps.storeId)
        .having(sql`count(distinct ${storeApps.appId}) = ${appIds.length}`);
      conditions.push(inArray(stores.id, sub));
    }
  }

  if (filters.missingApp) {
    const appSlugs = filters.missingApp.split(",");
    const appRows = await db
      .select({ id: knownApps.id })
      .from(knownApps)
      .where(inArray(knownApps.slug, appSlugs));
    const appIds = appRows.map((a) => a.id);
    if (appIds.length > 0) {
      const sub = db
        .select({ storeId: storeApps.storeId })
        .from(storeApps)
        .where(inArray(storeApps.appId, appIds));
      conditions.push(notInArray(stores.id, sub));
    }
  }

  const where = and(...conditions);

  const rows = await db
    .select()
    .from(stores)
    .where(where)
    .orderBy(desc(stores.createdAt))
    .limit(MAX_EXPORT_ROWS);

  const storeIds = rows.map((s) => s.id);
  const appsMap: Record<number, string[]> = {};
  if (storeIds.length > 0) {
    const appResults = await db
      .select({ storeId: storeApps.storeId, appSlug: knownApps.slug })
      .from(storeApps)
      .innerJoin(knownApps, eq(storeApps.appId, knownApps.id))
      .where(inArray(storeApps.storeId, storeIds));
    for (const row of appResults) {
      if (!appsMap[row.storeId]) appsMap[row.storeId] = [];
      appsMap[row.storeId].push(row.appSlug);
    }
  }

  const storesWithApps = rows.map((store) => ({
    ...store,
    installedApps: appsMap[store.id] || [],
  }));

  const csv = storesToCsv(storesWithApps);
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="store-finder-export-${date}.csv"`,
    },
  });
}
