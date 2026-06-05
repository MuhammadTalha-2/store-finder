import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stores, storeApps, knownApps, confirmedInstalls, storeListMembers } from "@/lib/db/schema";
import { OUR_APPS } from "@/lib/partners-api";
import { storeFiltersSchema } from "@/lib/filters";
import { computeGaps, computeGapScore } from "@/lib/app-gaps";
import { computeLeadScore, type LeadScoreBreakdown } from "@/lib/lead-score";
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
  isNull,
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

  // List membership filter
  if (filters.listId) {
    const memberStoreIds = db
      .select({ storeId: storeListMembers.storeId })
      .from(storeListMembers)
      .where(eq(storeListMembers.listId, filters.listId));
    conditions.push(inArray(stores.id, memberStoreIds));
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

  // Filter: stores missing ALL apps in a specific category
  if (filters.missingAppCategory) {
    const cats = filters.missingAppCategory.split(",");
    // Find all app IDs in these categories
    const appsInCats = await db
      .select({ id: knownApps.id })
      .from(knownApps)
      .where(inArray(knownApps.category, cats));
    const appIds = appsInCats.map((a) => a.id);

    if (appIds.length > 0) {
      // Stores that have ANY app in these categories
      const storeIdsWithCatApps = db
        .select({ storeId: storeApps.storeId })
        .from(storeApps)
        .where(inArray(storeApps.appId, appIds));

      // We want stores NOT in that list
      conditions.push(notInArray(stores.id, storeIdsWithCatApps));
    }
  }

  // Only include scraped stores for gap analysis if sorting by gap_score or lead_score
  if (filters.sort === "gap_score" || filters.sort === "lead_score") {
    conditions.push(isNotNull(stores.lastScrapedAt));
  }

  // Filter by minimum lead score — applied post-query since lead score is computed
  const minLeadScore = filters.minLeadScore;

  const where = and(...conditions);

  const sortColumn =
    filters.sort === "product_count"
      ? stores.productCount
      : filters.sort === "name"
        ? stores.name
        : filters.sort === "first_seen"
          ? stores.firstSeenAt
          : stores.createdAt;

  const orderFn = filters.order === "asc" ? asc : desc;

  // When minLeadScore or lead_score/gap_score sort is active, we need to
  // compute scores for all rows first, then filter/sort/paginate in-memory.
  const needsPostQueryProcessing =
    minLeadScore !== undefined ||
    filters.sort === "lead_score" ||
    filters.sort === "gap_score";

  let totalCount: number;
  let rows: (typeof stores.$inferSelect)[];

  if (needsPostQueryProcessing) {
    // Fetch all matching rows (no limit/offset — we paginate after scoring)
    rows = await db
      .select()
      .from(stores)
      .where(where)
      .orderBy(orderFn(sortColumn));
    totalCount = rows.length; // will be adjusted after filtering
  } else {
    const [totalResult] = await db
      .select({ count: count() })
      .from(stores)
      .where(where);
    totalCount = totalResult.count;

    rows = await db
      .select()
      .from(stores)
      .where(where)
      .orderBy(orderFn(sortColumn))
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit);
  }

  const storeIds = rows.map((s) => s.id);
  let appsMap: Record<number, { slug: string; category: string }[]> = {};
  if (storeIds.length > 0) {
    const appResults = await db
      .select({
        storeId: storeApps.storeId,
        appSlug: knownApps.slug,
        appCategory: knownApps.category,
      })
      .from(storeApps)
      .innerJoin(knownApps, eq(storeApps.appId, knownApps.id))
      .where(inArray(storeApps.storeId, storeIds));

    for (const row of appResults) {
      if (!appsMap[row.storeId]) appsMap[row.storeId] = [];
      appsMap[row.storeId].push({
        slug: row.appSlug,
        category: row.appCategory,
      });
    }
  }

  // Fetch all known app categories for gap computation
  const allCategoryRows = await db
    .selectDistinct({ category: knownApps.category })
    .from(knownApps);
  const allCategories = allCategoryRows.map((r) => r.category);

  // Fetch confirmed installs of our apps for these stores
  // This covers admin-only apps that can't be detected by storefront scraping
  let confirmedMap: Record<number, Set<string>> = {}; // storeId → Set of our app categories
  if (storeIds.length > 0) {
    const confirmedRows = await db
      .select({
        storeId: confirmedInstalls.storeId,
        ourAppSlug: confirmedInstalls.ourAppSlug,
      })
      .from(confirmedInstalls)
      .where(
        and(
          inArray(confirmedInstalls.storeId, storeIds),
          eq(confirmedInstalls.isActive, true)
        )
      );

    // Map our app slugs to their categories
    const ourAppCategoryMap = new Map<string, string>(
      OUR_APPS.map((a) => [a.slug, a.category])
    );

    for (const row of confirmedRows) {
      if (row.storeId == null) continue;
      if (!confirmedMap[row.storeId]) confirmedMap[row.storeId] = new Set();
      const cat = ourAppCategoryMap.get(row.ourAppSlug);
      if (cat) confirmedMap[row.storeId].add(cat);
    }
  }

  let storesWithApps = rows.map((store) => {
    const apps = appsMap[store.id] || [];
    const installedCategories = new Set(apps.map((a) => a.category));

    // Merge confirmed installs (admin-only apps) into installed categories
    const confirmedCategories = confirmedMap[store.id];
    if (confirmedCategories) {
      for (const cat of confirmedCategories) {
        installedCategories.add(cat);
      }
    }

    const missingCategories = computeGaps(installedCategories, allCategories);
    const gapScore = computeGapScore(missingCategories);
    const leadScore = computeLeadScore({
      contactEmail: store.contactEmail,
      productCount: store.productCount,
      country: store.country,
      category: store.category,
      hasBlog: store.hasBlog,
      firstSeenAt: store.firstSeenAt,
      missingCategories,
    });

    // Build confirmed apps list for UI
    const confirmedOurApps = confirmedCategories
      ? OUR_APPS.filter((a) => confirmedCategories.has(a.category)).map(
          (a) => a.slug
        )
      : [];

    return {
      ...store,
      installedApps: apps.map((a) => a.slug),
      confirmedOurApps, // admin-only apps confirmed via Partners API/CSV
      missingCategories,
      gapScore,
      leadScore: leadScore.total,
      leadScoreBreakdown: leadScore,
    };
  });

  // Apply min lead score filter (post-query since it's computed)
  if (minLeadScore !== undefined) {
    storesWithApps = storesWithApps.filter(
      (s) => s.leadScore >= minLeadScore
    );
  }

  // Sort by lead_score if requested (computed field, so sort post-query)
  if (filters.sort === "lead_score") {
    storesWithApps.sort((a, b) =>
      filters.order === "desc"
        ? b.leadScore - a.leadScore
        : a.leadScore - b.leadScore
    );
  }

  // Sort by gap_score if requested (also computed)
  if (filters.sort === "gap_score") {
    storesWithApps.sort((a, b) =>
      filters.order === "desc"
        ? b.gapScore - a.gapScore
        : a.gapScore - b.gapScore
    );
  }

  // When we did post-query processing, paginate in-memory
  if (needsPostQueryProcessing) {
    totalCount = storesWithApps.length;
    const start = (filters.page - 1) * filters.limit;
    storesWithApps = storesWithApps.slice(start, start + filters.limit);
  }

  return NextResponse.json({
    stores: storesWithApps,
    total: totalCount,
    page: filters.page,
    totalPages: Math.ceil(totalCount / filters.limit),
  });
}
