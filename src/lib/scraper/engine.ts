import * as cheerio from "cheerio";

// ---------- Types ----------

export interface StoreInfo {
  name: string | null;
  language: string | null;
  country: string | null;
  currency: string | null;
  metaDescription: string | null;
  myshopifyDomain: string | null;
}

export interface DetectedApp {
  slug: string;
  name: string;
  confidence: number;
}

export interface ContactResult {
  email: string | null;
  source: string | null;
}

export interface ValidationResult {
  isShopify: boolean;
  signals: string[];
  homepageHtml?: string;
}

export interface ExtractResult {
  storeInfo: StoreInfo;
  detectedApps: DetectedApp[];
  contact: ContactResult;
  productCount: number;
  collectionCount: number | null;
  hasBlog: boolean;
  category: string;
}

// ---------- Helpers ----------

const FETCH_TIMEOUT = 8000; // 8s to stay within Vercel's 10s limit

async function safeFetch(
  url: string,
  options?: { timeout?: number }
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options?.timeout ?? FETCH_TIMEOUT
  );

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; InshalyticsBot/1.0; +https://inshalytics.com)",
        Accept: "text/html,application/json",
      },
      redirect: "follow",
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const IGNORE_EMAILS = new Set([
  "support@shopify.com",
  "help@shopify.com",
  "noreply@shopify.com",
  "example@example.com",
]);

function extractEmails(text: string): string[] {
  const matches = text.match(EMAIL_REGEX) || [];
  return matches.filter(
    (email) =>
      !IGNORE_EMAILS.has(email.toLowerCase()) &&
      !email.endsWith("@shopify.com") &&
      !email.endsWith("@example.com") &&
      !email.endsWith("@sentry.io") &&
      !email.includes("wixpress") &&
      !email.endsWith(".png") &&
      !email.endsWith(".jpg") &&
      email.length < 100
  );
}

const CURRENCY_TO_COUNTRY: Record<string, string> = {
  USD: "US", GBP: "GB", EUR: "DE", CAD: "CA", AUD: "AU",
  INR: "IN", JPY: "JP", NZD: "NZ", BRL: "BR", MXN: "MX",
  ZAR: "ZA", SGD: "SG", HKD: "HK", KRW: "KR", SEK: "SE",
  NOK: "NO", DKK: "DK", CHF: "CH", PLN: "PL", CZK: "CZ",
  ILS: "IL", AED: "AE", SAR: "SA", MYR: "MY", PHP: "PH",
  THB: "TH", IDR: "ID", TWD: "TW", TRY: "TR", RUB: "RU",
  NGN: "NG", EGP: "EG", PKR: "PK", BDT: "BD", VND: "VN",
  CLP: "CL", COP: "CO", PEN: "PE", ARS: "AR",
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  fashion: ["clothing", "apparel", "dress", "shirt", "pants", "shoes", "sneakers", "fashion", "wear", "outfit", "jacket", "hoodie", "t-shirt", "jeans", "skirt"],
  beauty: ["skincare", "makeup", "cosmetic", "beauty", "serum", "cream", "lotion", "fragrance", "perfume", "hair care", "nail", "lipstick"],
  electronics: ["electronic", "phone", "laptop", "computer", "gadget", "cable", "charger", "speaker", "headphone", "camera", "tech"],
  "home-garden": ["home", "furniture", "decor", "garden", "kitchen", "bedding", "pillow", "candle", "lamp", "rug", "curtain", "plant"],
  "food-beverage": ["food", "coffee", "tea", "chocolate", "snack", "organic", "drink", "beverage", "spice", "sauce", "gourmet"],
  "health-wellness": ["health", "wellness", "vitamin", "supplement", "fitness", "yoga", "meditation", "cbd", "essential oil", "natural"],
  "sports-outdoors": ["sport", "gym", "workout", "running", "cycling", "camping", "hiking", "fishing", "athletic", "exercise"],
  pets: ["pet", "dog", "cat", "puppy", "kitten", "animal", "collar", "leash", "treat", "grooming"],
  "kids-baby": ["baby", "kid", "child", "toddler", "infant", "toy", "nursery", "maternity", "diaper", "stroller"],
  jewelry: ["jewelry", "ring", "necklace", "bracelet", "earring", "watch", "gold", "silver", "diamond", "pendant", "accessory"],
  automotive: ["car", "auto", "vehicle", "motorcycle", "truck", "parts", "tire", "motor", "garage"],
  "arts-crafts": ["art", "craft", "handmade", "painting", "print", "canvas", "pottery", "crochet", "knitting", "sewing"],
  "books-media": ["book", "ebook", "journal", "magazine", "music", "vinyl", "record", "game", "puzzle", "stationery"],
  "business-services": ["business", "office", "software", "service", "consulting", "digital", "subscription", "saas", "agency"],
};

// ---------- Validate ----------

export async function validateShopifyUrl(url: string): Promise<ValidationResult> {
  const signals: string[] = [];
  let homepageHtml: string | undefined;

  // Signal 1: /products.json
  try {
    const productsUrl = new URL("/products.json?limit=1", url).toString();
    const res = await safeFetch(productsUrl, { timeout: 6000 });
    if (res.ok) {
      const data = await res.json();
      if (data.products && Array.isArray(data.products)) {
        signals.push("products_json");
      }
    }
  } catch {
    // Not Shopify or blocked
  }

  // Signal 2+3: Homepage
  try {
    const res = await safeFetch(url, { timeout: 6000 });
    homepageHtml = await res.text();
    if (homepageHtml.includes("cdn.shopify.com")) signals.push("cdn_shopify");
    if (homepageHtml.includes("Shopify.theme") || homepageHtml.includes("myshopify.com")) {
      signals.push("shopify_js");
    }
    const serverHeader = res.headers.get("x-shopify-stage");
    if (serverHeader) signals.push("shopify_header");
  } catch {
    // Store not reachable
  }

  const hasStrongSignal = signals.includes("products_json") || signals.includes("shopify_js");
  return {
    isShopify: signals.length >= 2 || hasStrongSignal,
    signals,
    homepageHtml,
  };
}

// ---------- Extract Store Info ----------

export function extractStoreInfo(html: string): StoreInfo {
  const $ = cheerio.load(html);

  const garbageWords = /Navigation|Chevron|Storefront|Account|Cart|SearchAccount|logoNavigation/i;

  const rawTitle = $("title").text().split(/[|–\-—:·]/)[0].trim().slice(0, 60);
  const cleanTitle =
    rawTitle && !garbageWords.test(rawTitle) && rawTitle.length > 0 ? rawTitle : null;

  const name =
    $('meta[property="og:site_name"]').attr("content") ||
    $('meta[name="application-name"]').attr("content") ||
    cleanTitle ||
    $('meta[property="og:title"]').attr("content") ||
    null;

  const language = $("html").attr("lang")?.split("-")[0] || null;
  const metaDescription = $('meta[name="description"]').attr("content") || null;

  let currency: string | null = null;
  let country: string | null = null;
  let myshopifyDomain: string | null = null;

  const shopifyMatch = html.match(/Shopify\.currency\s*=\s*{[^}]*"active"\s*:\s*"([A-Z]{3})"/);
  if (shopifyMatch) currency = shopifyMatch[1];
  const currencyMatch = html.match(/"currency"\s*:\s*"([A-Z]{3})"/);
  if (!currency && currencyMatch) currency = currencyMatch[1];

  // Country — 4 fallbacks
  const shopifyCountryAssign = html.match(/Shopify\.country\s*=\s*"([A-Z]{2})"/);
  if (shopifyCountryAssign) country = shopifyCountryAssign[1];
  if (!country) {
    const shopifyCountryJson = html.match(/"country"\s*:\s*"([A-Z]{2})"/);
    if (shopifyCountryJson) country = shopifyCountryJson[1];
  }
  if (!country) {
    const langAttr = $("html").attr("lang");
    if (langAttr) {
      const parts = langAttr.split("-");
      if (parts.length >= 2) {
        const region = parts[parts.length - 1].toUpperCase();
        if (/^[A-Z]{2}$/.test(region)) country = region;
      }
    }
  }
  if (!country && currency) {
    country = CURRENCY_TO_COUNTRY[currency] || null;
  }
  if (!country) {
    const countryCodeMatch = html.match(/"country_code"\s*:\s*"([A-Z]{2})"/);
    if (countryCodeMatch) country = countryCodeMatch[1];
  }

  const myshopifyMatch = html.match(/([\w-]+)\.myshopify\.com/);
  if (myshopifyMatch) myshopifyDomain = `${myshopifyMatch[1]}.myshopify.com`;

  return { name, language, country, currency, metaDescription, myshopifyDomain };
}

// ---------- Extract Installed Apps ----------

export function extractInstalledApps(
  html: string,
  knownApps: { slug: string; name: string; scriptPatterns: string[] }[]
): DetectedApp[] {
  const detected: DetectedApp[] = [];

  for (const app of knownApps) {
    let matchCount = 0;
    for (const pattern of app.scriptPatterns) {
      try {
        const regex = new RegExp(pattern, "i");
        if (regex.test(html)) matchCount++;
      } catch {
        // Invalid pattern
      }
    }
    if (matchCount > 0) {
      detected.push({
        slug: app.slug,
        name: app.name,
        confidence: Math.min(matchCount / app.scriptPatterns.length, 1),
      });
    }
  }

  return detected;
}

// ---------- Extract Contact Email ----------

export function extractContactEmailFromHtml(html: string): ContactResult {
  const $ = cheerio.load(html);

  // Check mailto links
  const mailtoLinks = $('a[href^="mailto:"]')
    .map((_, el) => $(el).attr("href")?.replace("mailto:", "").split("?")[0])
    .get()
    .filter((e): e is string => !!e);

  const validMailto = mailtoLinks.filter((e) => !IGNORE_EMAILS.has(e.toLowerCase()));
  if (validMailto.length > 0) {
    return { email: validMailto[0], source: "mailto" };
  }

  // Check footer text
  const footerHtml = $("footer").html() || "";
  const footerEmails = extractEmails(footerHtml);
  if (footerEmails.length > 0) {
    return { email: footerEmails[0], source: "footer" };
  }

  // Full page fallback
  const allEmails = extractEmails(html);
  if (allEmails.length > 0) {
    return { email: allEmails[0], source: "page_body" };
  }

  return { email: null, source: null };
}

export async function extractContactEmailFull(
  url: string,
  homepageHtml: string
): Promise<ContactResult> {
  // 1. Try /pages/contact
  try {
    const contactUrl = new URL("/pages/contact", url).toString();
    const res = await safeFetch(contactUrl, { timeout: 5000 });
    if (res.ok) {
      const html = await res.text();
      const emails = extractEmails(html);
      if (emails.length > 0) return { email: emails[0], source: "contact_page" };
    }
  } catch {
    // Not available
  }

  // 2. Homepage HTML
  const fromHomepage = extractContactEmailFromHtml(homepageHtml);
  if (fromHomepage.email) return fromHomepage;

  // 3. Privacy policy
  try {
    const policyUrl = new URL("/policies/privacy-policy", url).toString();
    const res = await safeFetch(policyUrl, { timeout: 5000 });
    if (res.ok) {
      const html = await res.text();
      const emails = extractEmails(html);
      if (emails.length > 0) return { email: emails[0], source: "privacy_policy" };
    }
  } catch {
    // Not available
  }

  return { email: null, source: null };
}

// ---------- Extract Product Count ----------

export async function extractProductCount(url: string): Promise<{
  productCount: number;
  collectionCount: number | null;
  hasBlog: boolean;
}> {
  let productCount = 0;

  try {
    const productsUrl = new URL("/products.json?limit=250", url).toString();
    const res = await safeFetch(productsUrl, { timeout: 6000 });
    if (res.ok) {
      const data = await res.json();
      if (data.products && Array.isArray(data.products)) {
        productCount = data.products.length;
        // If we got 250, there might be more — do one more page
        if (productCount === 250) {
          try {
            const page2Url = new URL("/products.json?limit=250&page=2", url).toString();
            const res2 = await safeFetch(page2Url, { timeout: 5000 });
            if (res2.ok) {
              const data2 = await res2.json();
              if (data2.products) productCount += data2.products.length;
            }
          } catch {
            // Just use first page count
          }
        }
      }
    }
  } catch {
    // Products not available
  }

  // Skip collections and blog checks to stay within timeout
  return { productCount, collectionCount: null, hasBlog: false };
}

// ---------- Classify Category ----------

export function classifyCategory(metaDescription: string | null, productTypes?: string[]): string {
  const scores: Record<string, number> = {};

  if (metaDescription) {
    const text = metaDescription.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) scores[category] = (scores[category] || 0) + 2;
      }
    }
  }

  if (productTypes) {
    for (const ptype of productTypes) {
      const text = ptype.toLowerCase();
      for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
          if (text.includes(keyword)) scores[category] = (scores[category] || 0) + 1;
        }
      }
    }
  }

  let bestCategory = "other";
  let bestScore = 0;
  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

// ---------- Full Single-Store Pipeline ----------

export async function processStore(
  storeUrl: string,
  knownApps: { slug: string; name: string; scriptPatterns: string[] }[],
  mode: "quick" | "full" = "quick"
): Promise<ExtractResult> {
  // 1. Fetch homepage
  const homepageRes = await safeFetch(storeUrl, { timeout: 7000 });
  const homepageHtml = await homepageRes.text();

  // 2. Extract from HTML (instant — no network)
  const storeInfo = extractStoreInfo(homepageHtml);
  const detectedApps = extractInstalledApps(homepageHtml, knownApps);

  // Always fetch product count — it's a single fast API call
  // Quick mode: email from homepage only; Full mode: deep email search
  const [contact, products] = await Promise.all([
    mode === "quick"
      ? extractContactEmailFromHtml(homepageHtml)
      : extractContactEmailFull(storeUrl, homepageHtml),
    extractProductCount(storeUrl),
  ]);

  // Classify from meta only (product type classification would need another fetch)
  const category = classifyCategory(storeInfo.metaDescription);

  return {
    storeInfo,
    detectedApps,
    contact,
    productCount: products.productCount,
    collectionCount: products.collectionCount,
    hasBlog: products.hasBlog,
    category,
  };
}
