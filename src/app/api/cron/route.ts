import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stores, dailyStats, campaignRecipients } from "@/lib/db/schema";
import { count, eq, isNotNull, sql, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  const startOfDay = new Date(today + "T00:00:00Z");

  const [totalResult] = await db
    .select({ count: count() })
    .from(stores)
    .where(eq(stores.isActive, true));

  const [emailResult] = await db
    .select({ count: count() })
    .from(stores)
    .where(isNotNull(stores.contactEmail));

  const [newTodayResult] = await db
    .select({ count: count() })
    .from(stores)
    .where(gte(stores.createdAt, startOfDay));

  const [sentTodayResult] = await db
    .select({ count: count() })
    .from(campaignRecipients)
    .where(gte(campaignRecipients.sentAt, startOfDay));

  const categoryRows = await db
    .select({ category: stores.category, count: count() })
    .from(stores)
    .where(eq(stores.isActive, true))
    .groupBy(stores.category);

  const countryRows = await db
    .select({ country: stores.country, count: count() })
    .from(stores)
    .where(eq(stores.isActive, true))
    .groupBy(stores.country);

  const categoryMap = Object.fromEntries(
    categoryRows.map((r) => [r.category || "unknown", r.count])
  );
  const countryMap = Object.fromEntries(
    countryRows.map((r) => [r.country || "unknown", r.count])
  );

  await db
    .insert(dailyStats)
    .values({
      date: today,
      totalStores: totalResult.count,
      storesWithEmail: emailResult.count,
      newStoresToday: newTodayResult.count,
      emailsSentToday: sentTodayResult.count,
      storesByCategory: categoryMap,
      storesByCountry: countryMap,
    })
    .onConflictDoUpdate({
      target: dailyStats.date,
      set: {
        totalStores: totalResult.count,
        storesWithEmail: emailResult.count,
        newStoresToday: newTodayResult.count,
        emailsSentToday: sentTodayResult.count,
        storesByCategory: categoryMap,
        storesByCountry: countryMap,
      },
    });

  return NextResponse.json({ ok: true, date: today });
}
