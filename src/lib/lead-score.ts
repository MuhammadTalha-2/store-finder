/**
 * Lead Score / ICP (Ideal Customer Profile) Score
 *
 * Computes a 0-100 composite score for each store indicating how
 * good a prospect they are for outreach. Higher = better lead.
 *
 * Score components:
 *   Email availability   → 0-20 pts  (can we reach them?)
 *   Our app gaps          → 0-25 pts  (do they need our apps?)
 *   Product count         → 0-15 pts  (are they a real, active store?)
 *   Country tier          → 0-15 pts  (English-speaking, high-GDP markets)
 *   Store maturity        → 0-10 pts  (established but not too new)
 *   Category fit          → 0-10 pts  (categories that benefit most from our apps)
 *   Has blog              → 0-5 pts   (signals marketing sophistication)
 */

import { OUR_APP_CATEGORIES } from "./app-gaps";

// ─── Country Tiers ──────────────────────────────────────────────────

/** Tier 1: English-speaking, high Shopify adoption, high GDP */
const TIER_1_COUNTRIES = new Set([
  "US",
  "GB",
  "CA",
  "AU",
  "NZ",
  "IE",
]);

/** Tier 2: Strong e-commerce markets, English-capable */
const TIER_2_COUNTRIES = new Set([
  "DE",
  "FR",
  "NL",
  "SE",
  "NO",
  "DK",
  "FI",
  "BE",
  "CH",
  "AT",
  "SG",
  "HK",
  "JP",
  "KR",
  "IL",
  "AE",
  "SA",
]);

/** Tier 3: Growing e-commerce markets */
const TIER_3_COUNTRIES = new Set([
  "ES",
  "IT",
  "PT",
  "PL",
  "CZ",
  "BR",
  "MX",
  "IN",
  "MY",
  "TH",
  "PH",
  "ZA",
  "NG",
  "EG",
  "TR",
  "CO",
  "CL",
  "AR",
]);

// ─── Category Fit ───────────────────────────────────────────────────

/**
 * Store categories that benefit most from our apps:
 * - InvoiceForge: B2B stores, business services, electronics
 * - SubsExport: food/beverage (subscriptions), health/wellness, beauty
 * - Track Your Traffic: All stores benefit, but fashion/beauty/electronics are biggest
 */
const HIGH_FIT_CATEGORIES = new Set([
  "fashion",
  "beauty",
  "electronics",
  "food-beverage",
  "health-wellness",
  "business-services",
]);

const MEDIUM_FIT_CATEGORIES = new Set([
  "home-garden",
  "sports-outdoors",
  "jewelry",
  "pets",
  "kids-baby",
]);

// ─── Score Input Interface ──────────────────────────────────────────

export interface LeadScoreInput {
  contactEmail: string | null;
  productCount: number | null;
  country: string | null;
  category: string | null;
  hasBlog: boolean | null;
  firstSeenAt: Date | string | null;
  missingCategories: string[];
}

export interface LeadScoreBreakdown {
  total: number;
  email: number;
  appGaps: number;
  products: number;
  country: number;
  maturity: number;
  categoryFit: number;
  blog: number;
}

// ─── Scoring Functions ──────────────────────────────────────────────

function scoreEmail(email: string | null): number {
  return email ? 20 : 0;
}

function scoreAppGaps(missingCategories: string[]): number {
  // Each of our app categories missing = 8 pts (max ~24 for all 3)
  // Capped at 25
  let score = 0;
  for (const cat of missingCategories) {
    if (OUR_APP_CATEGORIES.has(cat)) {
      score += 8;
    }
  }
  return Math.min(25, score);
}

function scoreProducts(productCount: number | null): number {
  if (productCount === null || productCount === 0) return 2; // Unknown — slight benefit of the doubt
  if (productCount < 5) return 3;   // Very small — might be testing
  if (productCount < 20) return 6;  // Small store
  if (productCount < 50) return 9;  // Growing
  if (productCount < 200) return 13; // Established — sweet spot
  if (productCount < 500) return 15; // Large store — ideal
  if (productCount < 2000) return 12; // Very large — may have custom solutions
  return 8; // Enterprise — harder to convert
}

function scoreCountry(country: string | null): number {
  if (!country) return 5; // Unknown — neutral
  if (TIER_1_COUNTRIES.has(country)) return 15;
  if (TIER_2_COUNTRIES.has(country)) return 11;
  if (TIER_3_COUNTRIES.has(country)) return 7;
  return 4; // Other
}

function scoreMaturity(firstSeenAt: Date | string | null): number {
  if (!firstSeenAt) return 5; // Unknown
  const now = new Date();
  const seen = typeof firstSeenAt === "string" ? new Date(firstSeenAt) : firstSeenAt;
  const daysSinceFirstSeen = Math.floor(
    (now.getTime() - seen.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Very new (< 7 days) — just discovered, might be brand new store
  if (daysSinceFirstSeen < 7) return 4;
  // Recent (1-4 weeks) — establishing
  if (daysSinceFirstSeen < 30) return 6;
  // 1-3 months — good signal of stability
  if (daysSinceFirstSeen < 90) return 8;
  // 3+ months — established, highest value
  return 10;
}

function scoreCategoryFit(category: string | null): number {
  if (!category) return 3; // Unknown
  if (HIGH_FIT_CATEGORIES.has(category)) return 10;
  if (MEDIUM_FIT_CATEGORIES.has(category)) return 7;
  return 4; // Low fit
}

function scoreBlog(hasBlog: boolean | null): number {
  if (hasBlog === null) return 1; // Unknown
  return hasBlog ? 5 : 0;
}

// ─── Main Scoring Function ──────────────────────────────────────────

export function computeLeadScore(input: LeadScoreInput): LeadScoreBreakdown {
  const email = scoreEmail(input.contactEmail);
  const appGaps = scoreAppGaps(input.missingCategories);
  const products = scoreProducts(input.productCount);
  const country = scoreCountry(input.country);
  const maturity = scoreMaturity(input.firstSeenAt);
  const categoryFit = scoreCategoryFit(input.category);
  const blog = scoreBlog(input.hasBlog);

  const total = Math.min(100, email + appGaps + products + country + maturity + categoryFit + blog);

  return {
    total,
    email,
    appGaps,
    products,
    country,
    maturity,
    categoryFit,
    blog,
  };
}

/**
 * Quick label for lead score ranges — used in badges
 */
export function getLeadScoreLabel(score: number): string {
  if (score >= 80) return "Hot";
  if (score >= 60) return "Warm";
  if (score >= 40) return "Cool";
  return "Cold";
}

/**
 * Color class for lead score badges (Tailwind)
 */
export function getLeadScoreColor(score: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (score >= 80) {
    return {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    };
  }
  if (score >= 60) {
    return {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    };
  }
  if (score >= 40) {
    return {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    };
  }
  return {
    bg: "bg-gray-50",
    text: "text-gray-500",
    border: "border-gray-200",
  };
}
