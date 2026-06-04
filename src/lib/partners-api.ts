/**
 * Shopify Partners API Integration
 *
 * Fetches the list of stores that have our apps installed via the
 * Partners GraphQL API. This is the only reliable way to detect
 * admin-only apps (InvoiceForge, SubsExport, Track Your Traffic).
 *
 * Requires:
 *   SHOPIFY_PARTNERS_TOKEN — Partners API access token
 *   SHOPIFY_PARTNERS_ORG_ID — Organization ID from partners.shopify.com
 *
 * Our app IDs (set in env vars):
 *   SHOPIFY_APP_ID_INVOICEFORGE
 *   SHOPIFY_APP_ID_SUBSEXPORT
 *   SHOPIFY_APP_ID_TRACKYOURTRAFFIC
 */

/** Our app slugs (must match what we use in gap analysis) */
export const OUR_APPS = [
  {
    slug: "invoiceforge",
    name: "InvoiceForge",
    category: "invoicing",
    envKey: "SHOPIFY_APP_ID_INVOICEFORGE",
  },
  {
    slug: "subsexport",
    name: "SubsExport",
    category: "subscriptions",
    envKey: "SHOPIFY_APP_ID_SUBSEXPORT",
  },
  {
    slug: "track-your-traffic",
    name: "Track Your Traffic",
    category: "analytics",
    envKey: "SHOPIFY_APP_ID_TRACKYOURTRAFFIC",
  },
] as const;

export type OurAppSlug = (typeof OUR_APPS)[number]["slug"];

interface AppInstallation {
  shopDomain: string; // e.g. "my-store.myshopify.com"
  installedAt: string | null;
}

interface PartnersApiResult {
  appSlug: OurAppSlug;
  appName: string;
  installations: AppInstallation[];
  hasMore: boolean;
  cursor: string | null;
  error?: string;
}

/**
 * GraphQL query to fetch app installations from the Partners API.
 * Uses the `app` query with `installations` connection.
 */
const INSTALLATIONS_QUERY = `
  query AppInstallations($appId: ID!, $after: String) {
    app(id: $appId) {
      id
      name
      installations(first: 100, after: $after, includeInactive: false) {
        edges {
          node {
            shop {
              myshopifyDomain
            }
            launchDate
          }
          cursor
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  }
`;

/**
 * Fetch all installations for a single app from the Partners API.
 * Handles pagination automatically.
 */
async function fetchAppInstallations(
  appId: string,
  appSlug: OurAppSlug,
  appName: string,
  token: string,
  orgId: string
): Promise<PartnersApiResult> {
  const installations: AppInstallation[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const response: Response = await fetch(
      `https://partners.shopify.com/${orgId}/api/2024-04/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({
          query: INSTALLATIONS_QUERY,
          variables: {
            appId: `gid://partners/App/${appId}`,
            after: cursor,
          },
        }),
      }
    );

    if (!response.ok) {
      return {
        appSlug,
        appName,
        installations,
        hasMore: false,
        cursor: null,
        error: `Partners API returned ${response.status}: ${response.statusText}`,
      };
    }

    const json = await response.json();

    if (json.errors) {
      return {
        appSlug,
        appName,
        installations,
        hasMore: false,
        cursor: null,
        error: `GraphQL errors: ${JSON.stringify(json.errors)}`,
      };
    }

    const app = json.data?.app;
    if (!app) {
      return {
        appSlug,
        appName,
        installations,
        hasMore: false,
        cursor: null,
        error: "App not found in Partners API response",
      };
    }

    const edges = app.installations?.edges || [];
    for (const edge of edges) {
      installations.push({
        shopDomain: edge.node.shop.myshopifyDomain,
        installedAt: edge.node.launchDate || null,
      });
      cursor = edge.cursor;
    }

    hasMore = app.installations?.pageInfo?.hasNextPage ?? false;
  }

  return {
    appSlug,
    appName,
    installations,
    hasMore: false,
    cursor,
  };
}

/**
 * Fetch installations for ALL our apps from the Partners API.
 * Returns results per app.
 */
export async function syncAllAppsFromPartners(): Promise<{
  results: PartnersApiResult[];
  errors: string[];
}> {
  const token = process.env.SHOPIFY_PARTNERS_TOKEN;
  const orgId = process.env.SHOPIFY_PARTNERS_ORG_ID;

  if (!token || !orgId) {
    return {
      results: [],
      errors: [
        "Missing SHOPIFY_PARTNERS_TOKEN or SHOPIFY_PARTNERS_ORG_ID environment variables",
      ],
    };
  }

  const results: PartnersApiResult[] = [];
  const errors: string[] = [];

  for (const app of OUR_APPS) {
    const appId = process.env[app.envKey];
    if (!appId) {
      errors.push(`Missing env var ${app.envKey} for ${app.name}`);
      continue;
    }

    try {
      const result = await fetchAppInstallations(
        appId,
        app.slug,
        app.name,
        token,
        orgId
      );
      if (result.error) {
        errors.push(`${app.name}: ${result.error}`);
      }
      results.push(result);
    } catch (err) {
      errors.push(
        `${app.name}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return { results, errors };
}

/**
 * Parse a CSV of customer stores. Expected format:
 * Column 1: Shop domain (e.g. "my-store.myshopify.com" or "my-store.com")
 * Column 2 (optional): App slug (invoiceforge | subsexport | track-your-traffic)
 *
 * If no app slug column, assumes all listed stores have ALL our apps.
 */
export function parseCsvImport(
  csvText: string,
  defaultApp?: OurAppSlug
): { shopDomain: string; appSlug: OurAppSlug }[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Skip header if first line looks like a header
  // Check specific header words, not substrings that appear in domains
  const firstCols = lines[0].toLowerCase().split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  const headerWords = ["domain", "store", "shop", "url", "shop_domain", "myshopify"];
  const startIdx = firstCols.some((col) => headerWords.includes(col)) ? 1 : 0;

  const results: { shopDomain: string; appSlug: OurAppSlug }[] = [];
  const validSlugs = new Set(OUR_APPS.map((a) => a.slug));

  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length === 0 || !cols[0]) continue;

    let domain = cols[0];

    // Normalize domain: strip protocol, trailing slash
    domain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

    // If it doesn't end with .myshopify.com, try to use as-is (could be custom domain)
    // The matching logic in the API will handle both formats

    const appSlug = cols[1] && validSlugs.has(cols[1] as OurAppSlug)
      ? (cols[1] as OurAppSlug)
      : defaultApp;

    if (appSlug) {
      results.push({ shopDomain: domain, appSlug });
    } else {
      // No app specified and no default — add for all our apps
      for (const app of OUR_APPS) {
        results.push({ shopDomain: domain, appSlug: app.slug });
      }
    }
  }

  return results;
}
