import * as cheerio from "cheerio";
import { throttledFetch } from "../rate-limiter.js";

const POPULAR_APPS = [
  "judgeme-product-reviews",
  "klaviyo-email-marketing",
  "privy",
  "omnisend",
  "smile-io",
  "loox",
  "aftership-order-tracking",
  "yotpo-social-reviews",
  "pagefly",
  "reconvert-upsell-cross-sell",
];

export async function discoverFromAppStoreReviews(
  limit: number = 500
): Promise<string[]> {
  const discovered = new Set<string>();

  for (const appSlug of POPULAR_APPS) {
    if (discovered.size >= limit) break;

    console.log(`  Discovering from app reviews: ${appSlug}...`);

    for (let page = 1; page <= 5; page++) {
      if (discovered.size >= limit) break;

      try {
        const reviewsUrl = `https://apps.shopify.com/${appSlug}/reviews?page=${page}`;
        const res = await throttledFetch(reviewsUrl, { retries: 1 });
        if (!res.ok) break;

        const html = await res.text();
        const $ = cheerio.load(html);

        // Look for store links in review author sections
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href") || "";
          if (
            href.includes(".myshopify.com") ||
            (href.startsWith("http") &&
              !href.includes("shopify.com") &&
              !href.includes("apps.shopify.com") &&
              !href.includes("javascript:"))
          ) {
            try {
              const url = new URL(href);
              const clean = `${url.protocol}//${url.hostname}`;
              if (
                !clean.includes("shopify.com") &&
                !clean.includes("google.com") &&
                !clean.includes("facebook.com")
              ) {
                discovered.add(clean);
              }
            } catch {
              // Invalid URL
            }
          }
        });

        // Look for store domains in review text
        const reviewText = $(".review-listing").text();
        const domainMatches = reviewText.match(
          /[\w-]+\.myshopify\.com/g
        );
        if (domainMatches) {
          for (const domain of domainMatches) {
            discovered.add(`https://${domain}`);
          }
        }
      } catch (err) {
        console.log(`  Error fetching reviews page ${page}: ${err}`);
        break;
      }
    }

    console.log(`  Found ${discovered.size} stores so far`);
  }

  return Array.from(discovered).slice(0, limit);
}
