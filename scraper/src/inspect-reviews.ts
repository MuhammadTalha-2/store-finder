// Inspect Shopify App Store with various approaches

async function tryFetch(url: string, headers: Record<string, string> = {}) {
  const defaultHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    ...headers,
  };

  const res = await fetch(url, { headers: defaultHeaders, redirect: "follow" });
  return { status: res.status, headers: res.headers, body: await res.text() };
}

async function main() {
  const urls = [
    "https://apps.shopify.com/judge-me",
    "https://apps.shopify.com/judge-me-product-reviews",
    "https://apps.shopify.com/judgeme",
    "https://apps.shopify.com/klaviyo-email-marketing-sms",
    "https://apps.shopify.com/klaviyo-email-marketing",
    "https://apps.shopify.com/omnisend",
    "https://apps.shopify.com/privy",
  ];

  for (const url of urls) {
    const { status, body } = await tryFetch(url);
    const hasReview = /review/i.test(body);
    const title = body.match(/<title>([^<]*)<\/title>/)?.[1] || "no title";
    console.log(`${status} | ${url} | title: ${title.slice(0, 60)} | hasReview: ${hasReview} | length: ${body.length}`);

    if (status === 200) {
      // Found a working page! Deep inspect it
      console.log("\n=== WORKING PAGE FOUND ===\n");

      // Store domains
      const stores = body.match(/[\w-]+\.myshopify\.com/g);
      if (stores) {
        console.log("Store domains:", [...new Set(stores)]);
      }

      // Review author elements
      const authors = body.match(/(?:author|reviewer|merchant|shop)[^"]*"[^"]*"/gi);
      if (authors) {
        console.log("Author patterns:", [...new Set(authors)].slice(0, 10));
      }

      // Any JSON embedded data
      const jsonBlocks = body.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g);
      if (jsonBlocks) {
        console.log("\nJSON script blocks found:", jsonBlocks.length);
        for (const block of jsonBlocks.slice(0, 3)) {
          console.log(block.slice(0, 1000));
        }
      }

      // Data attributes
      const dataReview = body.match(/data-[a-z-]*review[^"]*="[^"]*"/gi);
      if (dataReview) {
        console.log("\nReview data attributes:", [...new Set(dataReview)].slice(0, 10));
      }

      // Print section with review content
      const rIdx = body.indexOf("rating");
      if (rIdx > -1) {
        console.log("\n--- Around 'rating' keyword ---");
        console.log(body.slice(Math.max(0, rIdx - 300), rIdx + 800));
      }

      // Print chunk from middle of page
      console.log("\n--- Middle of page ---");
      const mid = Math.floor(body.length / 2);
      console.log(body.slice(mid, mid + 2000));

      break; // Stop after first working page
    }
  }

  // Also try Shopify's GraphQL endpoint
  console.log("\n\n=== Trying GraphQL ===");
  const gqlRes = await fetch("https://apps.shopify.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: JSON.stringify({
      query: `{ app(handle: "omnisend") { title reviews { edges { node { body author { name } } } } } }`,
    }),
  });
  console.log("GraphQL status:", gqlRes.status);
  const gqlBody = await gqlRes.text();
  console.log("GraphQL body:", gqlBody.slice(0, 1000));
}

main().catch(console.error);
