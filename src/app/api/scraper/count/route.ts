import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stores, storeApps, knownApps } from "@/lib/db/schema";
import {
  and,
  eq,
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

// POST — Count stores matching filters (preview before running)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    target = "unscraped",
    staleDays = 7,
    appCategory,
    hasApp,
    missingApp,
    country,
    hasEmail,
  } = body;

  const conditions = [eq(stores.isActive, true)];

  if (target === "unscraped") {
    conditions.push(isNull(stores.lastScrapedAt));
  } else if (target === "stale") {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - staleDays);
    conditions.push(
      or(isNull(stores.lastScrapedAt), lt(stores.lastScrapedAt, staleDate))!
    );
  }

  if (country && country.length > 0) {
    conditions.push(inArray(stores.country, country));
  }

  if (hasEmail === true) {
    conditions.push(isNotNull(stores.contactEmail));
  } else if (hasEmail === false) {
    conditions.push(isNull(stores.contactEmail));
  }

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

  const [result] = await db
    .select({ count: count() })
    .from(stores)
    .where(and(...conditions));

  return NextResponse.json({ count: result.count });
}
