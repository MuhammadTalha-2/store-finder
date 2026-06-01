import { throttledFetch } from "../rate-limiter.js";

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

export async function classifyCategory(
  url: string,
  metaDescription: string | null
): Promise<string> {
  const scores: Record<string, number> = {};

  // Score from meta description
  if (metaDescription) {
    const text = metaDescription.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          scores[category] = (scores[category] || 0) + 2;
        }
      }
    }
  }

  // Score from first page of products
  try {
    const productsUrl = new URL("/products.json?limit=50", url).toString();
    const res = await throttledFetch(productsUrl, { retries: 0 });
    if (res.ok) {
      const data = await res.json();
      if (data.products && Array.isArray(data.products)) {
        for (const product of data.products) {
          const productType = (product.product_type || "").toLowerCase();
          const title = (product.title || "").toLowerCase();
          const tags = (product.tags || "").toLowerCase();
          const combined = `${productType} ${title} ${tags}`;

          for (const [category, keywords] of Object.entries(
            CATEGORY_KEYWORDS
          )) {
            for (const keyword of keywords) {
              if (combined.includes(keyword)) {
                scores[category] = (scores[category] || 0) + 1;
              }
            }
          }
        }
      }
    }
  } catch {
    // Products not available
  }

  // Return highest-scoring category
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
