import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stores, storeApps, knownApps } from "@/lib/db/schema";
import { storeFiltersSchema } from "@/lib/filters";
import {
  and,
  asc,
  count,
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

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const filters = storeFiltersSchema.parse(params);

  const conditions = [eq(stores.isActive, true)];

  if (filters.category) {
    const cats = filters.category.split(",");
    conditions.push(inArray(stores.category, cats));
  }

  if (filters.country) {
    const countries = filters.country.split(",");
    conditions.push(inArray(stores.country, countries));
  }

  if (filters.language) {
    const langs = filters.language.split(",");
    conditions.push(inArray(stores.language, langs));
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
        ilike(stores.url, `%${filters.search}%`),
        ilike(stores.metaDescription, `%${filters.search}%`)
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
      const storeIdsWithApps = db
        .select({ storeId: storeApps.storeId })
        .from(storeApps)
        .where(inArray(storeApps.appId, appIds))
        .groupBy(storeApps.storeId)
        .having(sql`count(distinct ${storeApps.appId}) = ${appIds.length}`);

      conditions.push(inArray(stores.id, storeIdsWithApps));
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
      const storeIdsWithApps = db
        .select({ storeId: storeApps.storeId })
        .from(storeApps)
        .where(inArray(storeApps.appId, appIds));

      conditions.push(notInArray(stores.id, storeIdsWithApps));
    }
  }

  const where = and(...conditions);

  const sortColumn =
    filters.sort === "product_count"
      ? stores.productCount
      : filters.sort === "name"
        ? stores.name
        : stores.createdAt;

  const orderFn = filters.order === "asc" ? asc : desc;

  const [totalResult] = await db
    .select({ count: count() })
    .from(stores)
    .where(where);

  const rows = await db
    .select()
    .from(stores)
    .where(where)
    .orderBy(orderFn(sortColumn))
    .limit(filters.limit)
    .offset((filters.page - 1) * filters.limit);

  const storeIds = rows.map((s) => s.id);
  let appsMap: Record<number, string[]> = {};
  if (storeIds.length > 0) {
    const appResults = await db
      .select({
        storeId: storeApps.storeId,
        appSlug: knownApps.slug,
      })
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

  return NextResponse.json({
    stores: storesWithApps,
    total: totalResult.count,
    page: filters.page,
    totalPages: Math.ceil(totalResult.count / filters.limit),
  });
}
