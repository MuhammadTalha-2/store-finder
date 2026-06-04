import * as cheerio from "cheerio";

interface StoreInfo {
  name: string | null;
  language: string | null;
  country: string | null;
  currency: string | null;
  metaDescription: string | null;
  myshopifyDomain: string | null;
}

export function extractStoreInfo(html: string): StoreInfo {
  const $ = cheerio.load(html);

  const garbageWords =
    /Navigation|Chevron|Storefront|Account|Cart|SearchAccount|logoNavigation/i;

  const rawTitle = $("title")
    .text()
    .split(/[|–\-—:·]/)[0]
    .trim()
    .slice(0, 60);
  const cleanTitle =
    rawTitle && !garbageWords.test(rawTitle) && rawTitle.length > 0
      ? rawTitle
      : null;

  const name =
    $('meta[property="og:site_name"]').attr("content") ||
    $('meta[name="application-name"]').attr("content") ||
    cleanTitle ||
    $('meta[property="og:title"]').attr("content") ||
    null;

  const language = $("html").attr("lang")?.split("-")[0] || null;

  const metaDescription =
    $('meta[name="description"]').attr("content") || null;

  let currency: string | null = null;
  let country: string | null = null;
  let myshopifyDomain: string | null = null;

  const shopifyMatch = html.match(
    /Shopify\.currency\s*=\s*{[^}]*"active"\s*:\s*"([A-Z]{3})"/
  );
  if (shopifyMatch) currency = shopifyMatch[1];

  const currencyMatch = html.match(/"currency"\s*:\s*"([A-Z]{3})"/);
  if (!currency && currencyMatch) currency = currencyMatch[1];

  // Country extraction — 4 fallbacks
  const shopifyCountryAssign = html.match(
    /Shopify\.country\s*=\s*"([A-Z]{2})"/
  );
  if (shopifyCountryAssign) country = shopifyCountryAssign[1];

  if (!country) {
    const shopifyCountryJson = html.match(/"country"\s*:\s*"([A-Z]{2})"/);
    if (shopifyCountryJson) country = shopifyCountryJson[1];
  }

  if (!country) {
    const langAttr = $("html").attr("lang");
    if (langAttr) {
      const langParts = langAttr.split("-");
      if (langParts.length >= 2) {
        const regionCode = langParts[langParts.length - 1].toUpperCase();
        if (/^[A-Z]{2}$/.test(regionCode)) {
          country = regionCode;
        }
      }
    }
  }

  if (!country && currency) {
    const currencyToCountry: Record<string, string> = {
      USD: "US", GBP: "GB", EUR: "DE", CAD: "CA", AUD: "AU",
      INR: "IN", JPY: "JP", NZD: "NZ", BRL: "BR", MXN: "MX",
      ZAR: "ZA", SGD: "SG", HKD: "HK", KRW: "KR", SEK: "SE",
      NOK: "NO", DKK: "DK", CHF: "CH", PLN: "PL", CZK: "CZ",
      ILS: "IL", AED: "AE", SAR: "SA", MYR: "MY", PHP: "PH",
      THB: "TH", IDR: "ID", TWD: "TW", TRY: "TR", RUB: "RU",
      NGN: "NG", EGP: "EG", PKR: "PK", BDT: "BD", VND: "VN",
      CLP: "CL", COP: "CO", PEN: "PE", ARS: "AR",
    };
    country = currencyToCountry[currency] || null;
  }

  if (!country) {
    const countryCodeMatch = html.match(/"country_code"\s*:\s*"([A-Z]{2})"/);
    if (countryCodeMatch) country = countryCodeMatch[1];
  }

  const myshopifyMatch = html.match(/([\w-]+)\.myshopify\.com/);
  if (myshopifyMatch)
    myshopifyDomain = `${myshopifyMatch[1]}.myshopify.com`;

  return { name, language, country, currency, metaDescription, myshopifyDomain };
}
