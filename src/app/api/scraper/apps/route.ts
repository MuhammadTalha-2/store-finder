import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knownApps } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET — List all known apps grouped by category
export async function GET() {
  const apps = await db
    .select({
      slug: knownApps.slug,
      name: knownApps.name,
      category: knownApps.category,
      isCompetitor: knownApps.isCompetitor,
    })
    .from(knownApps)
    .orderBy(asc(knownApps.category), asc(knownApps.name));

  // Group by category
  const categories: Record<string, { slug: string; name: string; isCompetitor: boolean }[]> = {};
  for (const app of apps) {
    if (!categories[app.category]) categories[app.category] = [];
    categories[app.category].push({
      slug: app.slug,
      name: app.name,
      isCompetitor: app.isCompetitor,
    });
  }

  return NextResponse.json({ apps, categories });
}
