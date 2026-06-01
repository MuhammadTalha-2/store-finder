import type { Store } from "@/lib/db/schema";

function escapeCell(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

interface StoreWithApps extends Store {
  installedApps: string[];
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
  "Installed Apps",
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
      store.installedApps.join("; "),
      store.lastScrapedAt?.toISOString(),
      store.firstSeenAt?.toISOString(),
    ];
    rows.push(row.map(escapeCell).join(","));
  }

  return rows.join("\r\n");
}
