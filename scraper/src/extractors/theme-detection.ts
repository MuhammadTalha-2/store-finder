/**
 * Detect the Shopify theme used by a store.
 *
 * Shopify pages embed theme metadata in JavaScript:
 *   - Shopify.theme = {"name":"Dawn","id":12345,"theme_store_id":887,...}
 *   - window.Shopify = {..., "theme":{"name":"Dawn","id":12345} ...}
 *
 * We also check <link> stylesheet hrefs for known theme folder patterns.
 */

import * as cheerio from "cheerio";

export interface ThemeInfo {
  name: string | null;
  themeStoreId: number | null; // Shopify theme store ID (null for custom themes)
}

/**
 * Extract Shopify theme information from homepage HTML.
 */
export function extractThemeInfo(html: string): ThemeInfo {
  const result: ThemeInfo = {
    name: null,
    themeStoreId: null,
  };

  // Strategy 1: Look for Shopify.theme = {...} or "theme":{"name":"..."}
  const themeAssignMatch = html.match(
    /Shopify\.theme\s*=\s*\{[^}]*"name"\s*:\s*"([^"]+)"/
  );
  if (themeAssignMatch) {
    result.name = themeAssignMatch[1];
    // Try to extract theme_store_id too
    const idMatch = html.match(
      /Shopify\.theme\s*=\s*\{[^}]*"theme_store_id"\s*:\s*(\d+)/
    );
    if (idMatch) {
      result.themeStoreId = parseInt(idMatch[1], 10);
    }
    return result;
  }

  // Strategy 2: Broader JSON match for theme name
  const themeJsonMatch = html.match(
    /"theme"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/
  );
  if (themeJsonMatch) {
    result.name = themeJsonMatch[1];
    // Try to get theme_store_id from same block
    const idJsonMatch = html.match(
      /"theme"\s*:\s*\{[^}]*"theme_store_id"\s*:\s*(\d+)/
    );
    if (idJsonMatch) {
      result.themeStoreId = parseInt(idJsonMatch[1], 10);
    }
    return result;
  }

  // Strategy 3: Check for known theme asset paths in CSS/script links
  const $ = cheerio.load(html);
  const knownThemes: Record<string, string> = {
    dawn: "Dawn",
    debut: "Debut",
    minimal: "Minimal",
    supply: "Supply",
    brooklyn: "Brooklyn",
    narrative: "Narrative",
    venture: "Venture",
    boundless: "Boundless",
    simple: "Simple",
    express: "Express",
    sense: "Sense",
    craft: "Craft",
    refresh: "Refresh",
    ride: "Ride",
    taste: "Taste",
    studio: "Studio",
    colorblock: "Colorblock",
    crave: "Crave",
    origin: "Origin",
    spotlight: "Spotlight",
    publisher: "Publisher",
  };

  // Check meta tag for theme name (some themes set this)
  const themeNameMeta = $('meta[name="theme-name"]').attr("content");
  if (themeNameMeta) {
    result.name = themeNameMeta;
    return result;
  }

  // Check stylesheet URLs for theme folder names
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    for (const [slug, name] of Object.entries(knownThemes)) {
      if (href.includes(`/themes/`) && href.toLowerCase().includes(slug)) {
        result.name = name;
        return false; // break
      }
    }
  });

  return result;
}
