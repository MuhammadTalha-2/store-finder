/**
 * Tech Stack Gap Analysis
 *
 * Identifies which app categories a store is MISSING — these are
 * opportunities for outreach. A store with no "reviews" app is a
 * prospect for Judge.me; a store with no "invoicing" app is a
 * prospect for InvoiceForge.
 *
 * Categories are ranked by outreach relevance: core commerce
 * categories that most stores benefit from are weighted higher.
 */

/** App categories ordered by outreach relevance (most actionable first) */
export const OPPORTUNITY_CATEGORIES = [
  // -- Our own apps (highest priority) --
  "invoicing",
  "subscriptions",
  "analytics",
  // -- Core commerce (most stores need these) --
  "email-marketing",
  "reviews",
  "loyalty",
  "upsell",
  "seo",
  "popups",
  "chat",
  "shipping",
  // -- Growth & engagement --
  "social-proof",
  "referral",
  "wishlist",
  "search",
  "sms",
  "notifications",
  // -- Specialized (not every store needs these) --
  "page-builder",
  "subscriptions",
  "returns",
  "translation",
  "personalization",
  "conversion",
  "compliance",
  "product-tools",
  "payments",
  "all-in-one",
] as const;

/** Human-readable labels for app categories */
export const APP_CATEGORY_LABELS: Record<string, string> = {
  "email-marketing": "Email Marketing",
  reviews: "Reviews",
  loyalty: "Loyalty & Rewards",
  analytics: "Analytics",
  upsell: "Upsell & Cross-sell",
  subscriptions: "Subscriptions",
  chat: "Live Chat",
  "page-builder": "Page Builder",
  shipping: "Shipping",
  popups: "Popups & Forms",
  "social-proof": "Social Proof",
  seo: "SEO",
  search: "Search",
  referral: "Referral",
  wishlist: "Wishlist",
  invoicing: "Invoicing",
  translation: "Translation",
  notifications: "Notifications",
  returns: "Returns",
  compliance: "Compliance",
  sms: "SMS Marketing",
  conversion: "Conversion",
  personalization: "Personalization",
  "product-tools": "Product Tools",
  payments: "Payments",
  "all-in-one": "All-in-One",
};

/** Categories that are our own apps — highlighted specially in the UI */
export const OUR_APP_CATEGORIES = new Set([
  "invoicing",
  "subscriptions",
  "analytics",
]);

/**
 * Categories that most stores benefit from — if missing, it's a
 * strong signal for outreach.
 */
export const CORE_CATEGORIES = new Set([
  "email-marketing",
  "reviews",
  "loyalty",
  "upsell",
  "seo",
  "popups",
  "chat",
  "shipping",
  "invoicing",
  "subscriptions",
  "analytics",
]);

/**
 * Given a store's installed app categories, return the categories
 * it's missing, sorted by outreach relevance.
 */
export function computeGaps(
  installedCategories: Set<string>,
  allCategories: string[]
): string[] {
  // Deduplicate OPPORTUNITY_CATEGORIES (subscriptions appears twice)
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const cat of OPPORTUNITY_CATEGORIES) {
    if (!seen.has(cat)) {
      seen.add(cat);
      ordered.push(cat);
    }
  }

  return ordered.filter(
    (cat) => allCategories.includes(cat) && !installedCategories.has(cat)
  );
}

/**
 * Compute a gap score (0-100) based on how many core categories
 * the store is missing. Higher = more opportunities.
 */
export function computeGapScore(missingCategories: string[]): number {
  let score = 0;
  for (const cat of missingCategories) {
    if (OUR_APP_CATEGORIES.has(cat)) {
      score += 15; // Our apps are highest value
    } else if (CORE_CATEGORIES.has(cat)) {
      score += 8; // Core categories are high value
    } else {
      score += 3; // Nice-to-have categories
    }
  }
  return Math.min(100, score);
}
