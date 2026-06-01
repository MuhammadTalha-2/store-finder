import * as cheerio from "cheerio";
import { throttledFetch } from "../rate-limiter.js";

interface StoreInfo {
  name: string | null;
  language: string | null;
  country: string | null;
  currency: string | null;
  metaDescription: string | null;
  myshopifyDomain: string | null;
}

export async function extractStoreInfo(url: string): Promise<StoreInfo> {
  const res = await throttledFetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const name =
    $('meta[property="og:site_name"]').attr("content") ||
    $("title").text().split("|")[0].split("–")[0].split("-")[0].trim() ||
    null;

  const language = $("html").attr("lang")?.split("-")[0] || null;

  const metaDescription =
    $('meta[name="description"]').attr("content") || null;

  // Extract currency from Shopify global object
  let currency: string | null = null;
  let country: string | null = null;
  let myshopifyDomain: string | null = null;

  const shopifyMatch = html.match(/Shopify\.currency\s*=\s*{[^}]*"active"\s*:\s*"([A-Z]{3})"/);
  if (shopifyMatch) currency = shopifyMatch[1];

  const currencyMatch = html.match(/"currency"\s*:\s*"([A-Z]{3})"/);
  if (!currency && currencyMatch) currency = currencyMatch[1];

  const countryMatch = html.match(/"country_code"\s*:\s*"([A-Z]{2})"/);
  if (countryMatch) country = countryMatch[1];

  const myshopifyMatch = html.match(/([\w-]+)\.myshopify\.com/);
  if (myshopifyMatch) myshopifyDomain = `${myshopifyMatch[1]}.myshopify.com`;

  return { name, language, country, currency, metaDescription, myshopifyDomain };
}
