/**
 * Playwright-based Shopify App Store review scraper.
 *
 * The Shopify App Store blocks all server-side/bot requests (returns 404 or
 * ECONNREFUSED). Reviews are server-side rendered with no separate API.
 * A real browser (Playwright + Chromium) is the only reliable way to extract
 * review data including store names and countries.
 *
 * URL pattern:  https://apps.shopify.com/{slug}/reviews?page={N}
 * 10 reviews per page, up to hundreds of pages for popular apps.
 *
 * From each review we extract:
 *   - Store name  (from span[title] near [data-review-id])
 *   - Country     (text line after the store name)
 *   - Duration    (e.g. "4 months using the app")
 *   - Review ID   (from data-review-id attribute)
 *
 * Store names are then slugified into candidate myshopify.com URLs and
 * validated with our existing Shopify store validator.
 */

import { chromium, type Browser, type Page } from "playwright";

// Popular Shopify apps whose reviews we scrape for store discovery.
// Mix of categories to get diverse stores.
const DEFAULT_APP_SLUGS = [
  // Email / SMS
  "omnisend",
  "klaviyo-email-marketing",
  "privy",
  // Reviews
  "judgeme-product-reviews",
  "yotpo-social-reviews",
  "loox",
  // Loyalty / Upsell
  "smile-io",
  "reconvert-upsell-cross-sell",
  // Page builders / Tracking
  "pagefly",
  "aftership-order-tracking",
  // Additional popular apps for more diversity
  "tidio-live-chat",
  "back-in-stock",
  "oberlo",
  "shopify-email",
];

export interface ReviewStoreInfo {
  storeName: string;
  country: string;
  duration: string;
  reviewId: string;
  appSlug: string;
}

export interface ReviewScraperOptions {
  /** App slugs to scrape reviews from. Defaults to popular apps. */
  appSlugs?: string[];
  /** Max pages per app to scrape (10 reviews/page). Default: 10 */
  maxPagesPerApp?: number;
  /** Max total stores to discover. Default: 500 */
  limit?: number;
  /** Delay between page navigations in ms. Default: 2000 */
  pageDelay?: number;
  /** Whether to run in headless mode. Default: true */
  headless?: boolean;
  /** Log progress to console. Default: true */
  verbose?: boolean;
}

/**
 * Scrape Shopify App Store review pages using Playwright.
 * Returns a list of store names + countries extracted from reviews.
 */
export async function discoverFromReviews(
  options: ReviewScraperOptions = {}
): Promise<ReviewStoreInfo[]> {
  const {
    appSlugs = DEFAULT_APP_SLUGS,
    maxPagesPerApp = 10,
    limit = 500,
    pageDelay = 2000,
    headless = true,
    verbose = true,
  } = options;

  const log = verbose ? console.log : () => {};

  log("Launching Playwright browser...");
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  const allStores: ReviewStoreInfo[] = [];
  const seenNames = new Set<string>();

  try {
    for (const slug of appSlugs) {
      if (allStores.length >= limit) break;

      log(`\n  Scraping reviews for: ${slug}`);

      for (let pageNum = 1; pageNum <= maxPagesPerApp; pageNum++) {
        if (allStores.length >= limit) break;

        const url = `https://apps.shopify.com/${slug}/reviews?page=${pageNum}`;
        log(`    Page ${pageNum}: ${url}`);

        try {
          await page.goto(url, {
            waitUntil: "networkidle",
            timeout: 30_000,
          });

          // Extract reviews from the current page
          const reviews = await extractReviewsFromPage(page, slug);

          if (reviews.length === 0) {
            log(`    No reviews found on page ${pageNum} — stopping for ${slug}`);
            break;
          }

          let newCount = 0;
          for (const review of reviews) {
            const key = review.storeName.toLowerCase().trim();
            if (!seenNames.has(key)) {
              seenNames.add(key);
              allStores.push(review);
              newCount++;
            }
          }

          log(
            `    Found ${reviews.length} reviews, ${newCount} new stores (total: ${allStores.length})`
          );

          // Rate-limit between page navigations
          if (pageNum < maxPagesPerApp) {
            await sleep(pageDelay);
          }
        } catch (err) {
          log(`    Error on page ${pageNum}: ${err}`);
          // Skip to next app on persistent errors
          break;
        }
      }

      // Pause between apps to avoid detection
      if (appSlugs.indexOf(slug) < appSlugs.length - 1) {
        await sleep(pageDelay * 1.5);
      }
    }
  } finally {
    await browser.close();
    log("\nBrowser closed.");
  }

  log(
    `\nReview scraping complete: ${allStores.length} unique stores from ${appSlugs.length} apps`
  );
  return allStores.slice(0, limit);
}

/**
 * Extract review data from the current page using Playwright's evaluate.
 */
async function extractReviewsFromPage(
  page: Page,
  appSlug: string
): Promise<ReviewStoreInfo[]> {
  return page.evaluate((slug) => {
    const reviews: {
      storeName: string;
      country: string;
      duration: string;
      reviewId: string;
      appSlug: string;
    }[] = [];

    // Each review has a button with data-review-id
    const reviewButtons = document.querySelectorAll("[data-review-id]");

    for (const btn of reviewButtons) {
      const reviewId = btn.getAttribute("data-review-id") || "";

      // Walk up from the button to find the info block with class
      // containing "tw-text-fg-tertiary" — this div holds the store name,
      // country, and "X months using the app" text.
      let infoBlock: HTMLElement | null = btn as HTMLElement;
      for (let i = 0; i < 8; i++) {
        if (!infoBlock.parentElement) break;
        infoBlock = infoBlock.parentElement;
        if (
          infoBlock.className &&
          infoBlock.className.includes("tw-text-fg-tertiary")
        ) {
          break;
        }
      }

      // Extract store name from span[title]
      const nameEl = infoBlock.querySelector("span[title]");
      const storeName = nameEl?.getAttribute("title")?.trim() || "";

      if (!storeName) continue;

      // Extract country and duration from text content
      const textContent = infoBlock.textContent || "";
      const lines = textContent
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      let country = "";
      let duration = "";

      for (const line of lines) {
        if (line.includes("using the app")) {
          duration = line;
        } else if (
          line !== storeName &&
          !line.includes("Copy") &&
          !line.includes("link to review") &&
          line.length > 2 &&
          line.length < 60
        ) {
          // Country is typically the line right after the store name
          country = line;
        }
      }

      reviews.push({
        storeName,
        country,
        duration,
        reviewId,
        appSlug: slug,
      });
    }

    return reviews;
  }, appSlug);
}

/**
 * Convert a store name to candidate myshopify.com URLs.
 *
 * Many Shopify stores use their brand name (slugified) as their
 * myshopify.com subdomain. This function generates plausible candidates.
 *
 * Examples:
 *   "Morspecs"                 → ["morspecs.myshopify.com"]
 *   "Zaffera Studios"          → ["zaffera-studios.myshopify.com", "zafferastudios.myshopify.com"]
 *   "The Kings of Styling"     → ["the-kings-of-styling.myshopify.com", "thekingsofstyling.myshopify.com"]
 *   "Emma's Noggin"            → ["emmas-noggin.myshopify.com", "emmasnoggin.myshopify.com"]
 */
export function storeNameToCandidateUrls(name: string): string[] {
  const candidates: string[] = [];
  const clean = name
    .toLowerCase()
    .replace(/['']/g, "") // Remove apostrophes
    .replace(/[®™©]/g, "") // Remove trademark symbols
    .replace(/&/g, "and") // Replace & with "and"
    .replace(/[^a-z0-9\s-]/g, "") // Remove other special chars
    .trim();

  if (!clean) return [];

  // Primary: hyphenated slug
  const hyphenated = clean.replace(/\s+/g, "-").replace(/-+/g, "-");
  candidates.push(`https://${hyphenated}.myshopify.com`);

  // Secondary: no spaces (concatenated)
  const concatenated = clean.replace(/\s+/g, "");
  if (concatenated !== hyphenated) {
    candidates.push(`https://${concatenated}.myshopify.com`);
  }

  // Tertiary: without common prefixes like "the", "a"
  const withoutPrefix = clean
    .replace(/^(the|a|an)\s+/, "")
    .replace(/\s+/g, "-");
  if (withoutPrefix !== hyphenated && withoutPrefix.length > 2) {
    candidates.push(`https://${withoutPrefix}.myshopify.com`);
  }

  // Also try without suffixes like "store", "shop", "co", "co."
  const withoutSuffix = clean
    .replace(
      /\s+(store|shop|co\.?|company|inc\.?|ltd\.?|llc|supplies|boutique)$/,
      ""
    )
    .replace(/\s+/g, "-");
  if (
    withoutSuffix !== hyphenated &&
    withoutSuffix.length > 2 &&
    !candidates.includes(`https://${withoutSuffix}.myshopify.com`)
  ) {
    candidates.push(`https://${withoutSuffix}.myshopify.com`);
  }

  return candidates;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
