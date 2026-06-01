import pLimit from "p-limit";

const globalLimit = pLimit(10);

const domainTimestamps = new Map<string, number>();
const DOMAIN_DELAY_MS = 2000;

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

async function waitForDomain(domain: string): Promise<void> {
  const lastRequest = domainTimestamps.get(domain) || 0;
  const elapsed = Date.now() - lastRequest;
  if (elapsed < DOMAIN_DELAY_MS) {
    await new Promise((r) => setTimeout(r, DOMAIN_DELAY_MS - elapsed));
  }
  domainTimestamps.set(domain, Date.now());
}

export async function throttledFetch(
  url: string,
  options: { timeout?: number; retries?: number } = {}
): Promise<Response> {
  const { timeout = 15000, retries = 2 } = options;

  return globalLimit(async () => {
    const domain = getDomain(url);
    await waitForDomain(domain);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; InshalyticsBot/1.0; +https://inshalytics.com)",
            Accept: "text/html,application/json",
          },
        });

        clearTimeout(timer);

        if (response.status === 429 || response.status === 503) {
          const retryAfter = response.headers.get("retry-after");
          const delay = retryAfter
            ? parseInt(retryAfter) * 1000
            : Math.min(5000 * Math.pow(2, attempt), 60000);
          console.log(
            `  Rate limited on ${domain}, waiting ${delay / 1000}s...`
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        return response;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < retries) {
          const delay = Math.min(5000 * Math.pow(2, attempt), 60000);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError || new Error(`Failed to fetch ${url}`);
  });
}
