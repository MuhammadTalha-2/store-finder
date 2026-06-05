/**
 * Server-side Shopify store discovery from App Store review pages.
 *
 * Strategy: Shopify App Store review pages show merchant names (plain text,
 * not linked). We extract those names, slugify them into candidate
 * .myshopify.com domains, then validate which ones are real Shopify stores.
 *
 * The validation step (in the batch handler) checks /products.json and
 * cdn.shopify.com presence to confirm each candidate.
 */

import * as cheerio from "cheerio";

/** Apps whose review pages we scrape for store URLs */
export const DISCOVERABLE_APPS = [
  { slug: "judgeme", name: "Judge.me", category: "Reviews" },
  { slug: "klaviyo-email-marketing", name: "Klaviyo", category: "Email Marketing" },
  { slug: "privy", name: "Privy", category: "Pop-ups" },
  { slug: "omnisend", name: "Omnisend", category: "Email Marketing" },
  { slug: "smile-io", name: "Smile.io", category: "Loyalty" },
  { slug: "loox", name: "Loox", category: "Reviews" },
  { slug: "aftership-order-tracking", name: "AfterShip", category: "Shipping" },
  { slug: "yotpo-social-reviews", name: "Yotpo", category: "Reviews" },
  { slug: "pagefly", name: "PageFly", category: "Page Builders" },
  { slug: "reconvert-upsell-cross-sell", name: "ReConvert", category: "Upsell" },
  { slug: "shopify-email", name: "Shopify Email", category: "Email Marketing" },
  { slug: "stamped-io", name: "Stamped", category: "Reviews" },
  { slug: "vitals", name: "Vitals", category: "All-in-One" },
  { slug: "seo-optimizer", name: "SEO Booster", category: "SEO" },
  { slug: "gorgias", name: "Gorgias", category: "Chat & Support" },
  { slug: "rebuy-personalization-engine", name: "Rebuy", category: "Upsell" },
  { slug: "okendo", name: "Okendo", category: "Reviews" },
  { slug: "attentive", name: "Attentive", category: "SMS Marketing" },
  { slug: "postscript-sms-marketing", name: "Postscript", category: "SMS Marketing" },
  { slug: "recharge", name: "Recharge", category: "Subscriptions" },
];

/**
 * Convert a merchant name to candidate .myshopify.com slugs.
 * Generates multiple variations to maximize hit rate.
 *
 * "The Coffee Bean" → ["the-coffee-bean", "coffee-bean", "thecoffeebean"]
 */
function nameToSlugs(name: string): string[] {
  const slugs = new Set<string>();

  // Base slug: lowercase, replace non-alphanumeric with hyphens, collapse
  const base = name
    .toLowerCase()
    .replace(/[''""`]/g, "")        // remove quotes/apostrophes
    .replace(/&/g, "and")            // & → and
    .replace(/[^a-z0-9]+/g, "-")    // non-alphanum → hyphen
    .replace(/^-+|-+$/g, "")        // trim leading/trailing hyphens
    .replace(/-{2,}/g, "-");        // collapse double hyphens

  if (base && base.length >= 2) {
    slugs.add(base);
  }

  // Without common prefixes (the, my, etc.)
  const withoutPrefix = base.replace(/^(the|my|our|a)-/, "");
  if (withoutPrefix !== base && withoutPrefix.length >= 2) {
    slugs.add(withoutPrefix);
  }

  // No hyphens (some stores use concatenated names)
  const noHyphens = base.replace(/-/g, "");
  if (noHyphens !== base && noHyphens.length >= 2) {
    slugs.add(noHyphens);
  }

  // With common suffixes
  if (base.length >= 2 && base.length <= 20) {
    slugs.add(`${base}-store`);
    slugs.add(`${base}-shop`);
  }

  return Array.from(slugs);
}

/**
 * Check if a .myshopify.com domain actually resolves to a Shopify store.
 * Lighter check than full validateShopifyUrl — just HEAD + products.json.
 */
async function checkMyShopifyDomain(
  slug: string
): Promise<{ valid: boolean; customDomain?: string }> {
  const myshopifyUrl = `https://${slug}.myshopify.com`;

  try {
    // Try /products.json — definitive Shopify signal
    const res = await fetch(`${myshopifyUrl}/products.json?limit=1`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.products && Array.isArray(data.products)) {
        // Check if we were redirected to a custom domain
        const finalUrl = res.url;
        let customDomain: string | undefined;
        try {
          const parsed = new URL(finalUrl);
          if (!parsed.hostname.includes("myshopify.com")) {
            customDomain = `https://${parsed.hostname}`;
          }
        } catch {
          // ignore
        }
        return { valid: true, customDomain };
      }
    }
  } catch {
    // Not reachable or timeout
  }

  return { valid: false };
}

export interface DiscoveredStore {
  merchantName: string;
  myshopifySlug: string;
  url: string; // custom domain or myshopify.com URL
  country?: string;
}

/**
 * Fetch a single review page, extract merchant names,
 * and resolve them to .myshopify.com candidate URLs.
 *
 * Returns candidate URLs to validate (not yet confirmed as real stores).
 */
export async function scrapeReviewPage(
  appSlug: string,
  page: number
): Promise<{ urls: string[]; merchantNames: string[]; hasMore: boolean }> {
  const reviewsUrl = `https://apps.shopify.com/${appSlug}/reviews?page=${page}`;

  const res = await fetch(reviewsUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    return { urls: [], merchantNames: [], hasMore: false };
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const merchantNames: string[] = [];
  const candidateUrls = new Set<string>();

  // Extract merchant names from review blocks
  // New structure: <div data-merchant-review> contains reviewer info
  // Store name is in <span title="StoreName" class="tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap">
  $('[data-merchant-review] span[title]').each((_, el) => {
    const name = $(el).attr("title")?.trim();
    if (name && name.length >= 2 && name.length <= 100) {
      merchantNames.push(name);
    }
  });

  // Fallback: try the older selector pattern
  if (merchantNames.length === 0) {
    $("span.tw-overflow-hidden.tw-text-ellipsis.tw-whitespace-nowrap[title]").each((_, el) => {
      const name = $(el).attr("title")?.trim();
      if (name && name.length >= 2 && name.length <= 100) {
        merchantNames.push(name);
      }
    });
  }

  // Second fallback: look for review containers by ID pattern
  if (merchantNames.length === 0) {
    $('[id^="review-"]').each((_, el) => {
      const nameEl = $(el).find("span[title]").first();
      const name = nameEl.attr("title")?.trim();
      if (name && name.length >= 2 && name.length <= 100) {
        merchantNames.push(name);
      }
    });
  }

  // Convert merchant names to candidate .myshopify.com URLs
  for (const name of merchantNames) {
    const slugs = nameToSlugs(name);
    for (const slug of slugs) {
      candidateUrls.add(`https://${slug}.myshopify.com`);
    }
  }

  // Also look for .myshopify.com domains mentioned in review text
  const pageText = $("body").text();
  const domainMatches = pageText.match(/[\w-]+\.myshopify\.com/g);
  if (domainMatches) {
    for (const domain of domainMatches) {
      candidateUrls.add(`https://${domain.toLowerCase()}`);
    }
  }

  // Check for more pages
  const hasMore =
    $('a[rel="next"]').length > 0 ||
    html.includes(`page=${page + 1}`);

  return {
    urls: Array.from(candidateUrls),
    merchantNames,
    hasMore,
  };
}

/**
 * Validate a candidate .myshopify.com URL.
 * Returns the confirmed store URL (custom domain if redirected) or null.
 */
export async function validateCandidate(
  candidateUrl: string
): Promise<{ url: string; signals: string[] } | null> {
  try {
    const parsed = new URL(candidateUrl);
    const hostname = parsed.hostname;

    // If it's a .myshopify.com URL, extract the slug and check
    if (hostname.endsWith(".myshopify.com")) {
      const slug = hostname.replace(".myshopify.com", "");
      const result = await checkMyShopifyDomain(slug);
      if (result.valid) {
        return {
          url: result.customDomain || candidateUrl,
          signals: ["products_json", result.customDomain ? "custom_domain" : "myshopify"],
        };
      }
    }
  } catch {
    // Invalid URL
  }

  return null;
}
