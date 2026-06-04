import type { Store } from "@/lib/db/schema";

function escapeCell(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

interface StoreWithApps extends Omit<Store, "socialLinks" | "adPixels"> {
  installedApps: string[];
  missingCategories?: string[];
  gapScore?: number;
  leadScore?: number;
  socialLinks?: Record<string, string | null> | null;
  adPixels?: Record<string, string | null> | null;
}

const HEADERS = [
  "Store Name",
  "URL",
  "Contact Email",
  "Email Source",
  "Category",
  "Country",
  "Language",
  "Currency",
  "Product Count",
  "Collection Count",
  "Has Blog",
  "Shopify Theme",
  "Social Links",
  "Ad Pixels",
  "Installed Apps",
  "Missing Categories",
  "Gap Score",
  "Lead Score",
  "Last Scraped",
  "First Seen",
];

export function storesToCsv(stores: StoreWithApps[]): string {
  const rows = [HEADERS.map(escapeCell).join(",")];

  for (const store of stores) {
    const row = [
      store.name,
      store.url,
      store.contactEmail,
      store.emailSource,
      store.category,
      store.country,
      store.language,
      store.currency,
      store.productCount?.toString(),
      store.collectionCount?.toString(),
      store.hasBlog?.toString(),
      store.shopifyTheme,
      store.socialLinks
        ? Object.entries(store.socialLinks)
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join("; ")
        : "",
      store.adPixels
        ? Object.entries(store.adPixels)
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join("; ")
        : "",
      store.installedApps.join("; "),
      store.missingCategories?.join("; "),
      store.gapScore?.toString(),
      store.leadScore?.toString(),
      store.lastScrapedAt?.toISOString(),
      store.firstSeenAt?.toISOString(),
    ];
    rows.push(row.map(escapeCell).join(","));
  }

  return rows.join("\r\n");
}
