import { db } from "@/lib/db";
import { knownApps, stores } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { StoresClient } from "./stores-client";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const apps = await db
    .select({ slug: knownApps.slug, name: knownApps.name, category: knownApps.category })
    .from(knownApps)
    .orderBy(knownApps.name);

  const countries = await db
    .selectDistinct({ country: stores.country })
    .from(stores)
    .where(eq(stores.isActive, true))
    .orderBy(stores.country);

  const availableCountries = countries
    .map((c) => c.country)
    .filter((c): c is string => c !== null);

  // Get unique app categories for gap filter
  const categoryRows = await db
    .selectDistinct({ category: knownApps.category })
    .from(knownApps)
    .orderBy(knownApps.category);
  const appCategories = categoryRows.map((r) => r.category);

  return (
    <StoresClient
      knownApps={apps}
      availableCountries={availableCountries}
      appCategories={appCategories}
    />
  );
}
