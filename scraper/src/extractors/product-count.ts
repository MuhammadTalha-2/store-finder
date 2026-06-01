import { throttledFetch } from "../rate-limiter.js";

interface ProductResult {
  productCount: number;
  collectionCount: number | null;
  hasBlog: boolean;
}

export async function extractProductCount(
  url: string
): Promise<ProductResult> {
  let productCount = 0;
  let page = 1;
  const pageSize = 250;

  // Paginate /products.json to get total count
  while (true) {
    try {
      const productsUrl = new URL(
        `/products.json?limit=${pageSize}&page=${page}`,
        url
      ).toString();
      const res = await throttledFetch(productsUrl, { retries: 1 });

      if (!res.ok) break;

      const data = await res.json();
      if (!data.products || !Array.isArray(data.products)) break;

      productCount += data.products.length;

      if (data.products.length < pageSize) break;
      if (page >= 20) break; // Safety limit (5000 products max)

      page++;
    } catch {
      break;
    }
  }

  // Check collections count
  let collectionCount: number | null = null;
  try {
    const collectionsUrl = new URL("/collections.json", url).toString();
    const res = await throttledFetch(collectionsUrl, { retries: 0 });
    if (res.ok) {
      const data = await res.json();
      if (data.collections) {
        collectionCount = data.collections.length;
      }
    }
  } catch {
    // Collections not available
  }

  // Check if blog exists
  let hasBlog = false;
  try {
    const blogsUrl = new URL("/blogs.json", url).toString();
    const res = await throttledFetch(blogsUrl, { retries: 0 });
    if (res.ok) {
      const data = await res.json();
      hasBlog = data.blogs && data.blogs.length > 0;
    }
  } catch {
    // Blog not available
  }

  return { productCount, collectionCount, hasBlog };
}
