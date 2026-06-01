import { throttledFetch } from "./rate-limiter.js";

interface ValidationResult {
  isShopify: boolean;
  signals: string[];
}

export async function validateShopifyStore(
  url: string
): Promise<ValidationResult> {
  const signals: string[] = [];

  // Signal 1: Check /products.json
  try {
    const productsUrl = new URL("/products.json?limit=1", url).toString();
    const res = await throttledFetch(productsUrl, { retries: 1 });
    if (res.ok) {
      const data = await res.json();
      if (data.products && Array.isArray(data.products)) {
        signals.push("products_json");
      }
    }
  } catch {
    // Not Shopify or blocked
  }

  // Signal 2: Check homepage for cdn.shopify.com
  try {
    const res = await throttledFetch(url, { retries: 1 });
    const html = await res.text();
    if (html.includes("cdn.shopify.com")) {
      signals.push("cdn_shopify");
    }

    // Signal 3: Check for Shopify-specific meta or headers
    const serverHeader = res.headers.get("x-shopify-stage");
    if (serverHeader) {
      signals.push("shopify_header");
    }
    if (html.includes("Shopify.theme") || html.includes("myshopify.com")) {
      signals.push("shopify_js");
    }
  } catch {
    // Store not reachable
  }

  const hasStrongSignal = signals.includes("products_json") || signals.includes("shopify_js");
  return {
    isShopify: signals.length >= 2 || hasStrongSignal,
    signals,
  };
}
