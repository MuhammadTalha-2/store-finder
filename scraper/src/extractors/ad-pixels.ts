/**
 * Extract ad pixel / tracking IDs from homepage HTML.
 *
 * Goes beyond the basic "app detected" in app-signatures.ts by
 * extracting the actual pixel/tracking IDs. This data is useful for
 * understanding a store's marketing maturity.
 */

export interface AdPixels {
  facebookPixelId: string | null;
  googleAnalyticsId: string | null; // GA4 (G-xxx) or UA (UA-xxx)
  googleTagManagerId: string | null; // GTM-xxx
  tiktokPixelId: string | null;
  pinterestTagId: string | null;
  snapchatPixelId: string | null;
  microsoftClarityId: string | null;
  hotjarId: string | null;
}

interface PixelExtractor {
  key: keyof AdPixels;
  patterns: RegExp[];
}

const PIXEL_EXTRACTORS: PixelExtractor[] = [
  {
    key: "facebookPixelId",
    patterns: [
      // fbq('init', '1234567890')
      /fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/,
      // _fbq.push(['addPixelId', '1234567890'])
      /addPixelId['"]\s*,\s*['"](\d+)['"]/,
      // data-fb-pixel-id="1234567890"
      /data-fb-pixel-id=["'](\d+)["']/,
    ],
  },
  {
    key: "googleAnalyticsId",
    patterns: [
      // gtag('config', 'G-XXXXXXXXX') — GA4
      /gtag\s*\(\s*['"]config['"]\s*,\s*['"](G-[A-Z0-9]+)['"]/,
      // gtag('config', 'UA-XXXXX-Y') — Universal Analytics
      /gtag\s*\(\s*['"]config['"]\s*,\s*['"](UA-\d+-\d+)['"]/,
      // ga('create', 'UA-XXXXX-Y', ...)
      /ga\s*\(\s*['"]create['"]\s*,\s*['"](UA-\d+-\d+)['"]/,
      // _gaq.push(['_setAccount', 'UA-XXXXX-Y'])
      /_setAccount['"]\s*,\s*['"](UA-\d+-\d+)['"]/,
      // <script src="...gtag/js?id=G-XXXXXXX">
      /gtag\/js\?id=(G-[A-Z0-9]+)/,
      /gtag\/js\?id=(UA-\d+-\d+)/,
    ],
  },
  {
    key: "googleTagManagerId",
    patterns: [
      // googletagmanager.com/gtm.js?id=GTM-XXXXXXX
      /googletagmanager\.com\/gtm\.js\?id=(GTM-[A-Z0-9]+)/,
      // GTM container ID in script
      /['"]?(GTM-[A-Z0-9]+)['"]?\s*(?:,|;|\))/,
    ],
  },
  {
    key: "tiktokPixelId",
    patterns: [
      // ttq.load('XXXXXXXXXX')
      /ttq\.load\s*\(\s*['"]([A-Z0-9]+)['"]/,
      // analytics.tiktok.com/i18n/pixel/events.js?sdkid=XXXXXXX
      /tiktok\.com\/.*sdkid=([A-Z0-9]+)/i,
    ],
  },
  {
    key: "pinterestTagId",
    patterns: [
      // pintrk('load', '1234567890')
      /pintrk\s*\(\s*['"]load['"]\s*,\s*['"](\d+)['"]/,
      // pintrk('load', '1234567890', {})
      /pintrk\s*\(\s*['"]load['"]\s*,\s*['"]([\d]+)['"]/,
    ],
  },
  {
    key: "snapchatPixelId",
    patterns: [
      // snaptr('init', 'xxxx-xxxx-xxxx-xxxx')
      /snaptr\s*\(\s*['"]init['"]\s*,\s*['"]([a-f0-9-]+)['"]/,
    ],
  },
  {
    key: "microsoftClarityId",
    patterns: [
      // clarity('set', 'xxx') or clarity tag with project ID
      /clarity\.ms\/tag\/([a-z0-9]+)/i,
    ],
  },
  {
    key: "hotjarId",
    patterns: [
      // Hotjar tracking code
      /hotjar\.com.*?hjid['":\s]*(\d+)/i,
      // h._hjSettings={hjid:1234567,...}
      /hjid\s*[=:]\s*(\d+)/,
    ],
  },
];

/**
 * Extract ad pixel / tracking IDs from homepage HTML.
 */
export function extractAdPixels(html: string): AdPixels {
  const pixels: AdPixels = {
    facebookPixelId: null,
    googleAnalyticsId: null,
    googleTagManagerId: null,
    tiktokPixelId: null,
    pinterestTagId: null,
    snapchatPixelId: null,
    microsoftClarityId: null,
    hotjarId: null,
  };

  for (const extractor of PIXEL_EXTRACTORS) {
    for (const pattern of extractor.patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        pixels[extractor.key] = match[1];
        break; // Use first match for each pixel type
      }
    }
  }

  return pixels;
}

/**
 * Count how many ad pixels / tracking tools a store uses.
 */
export function countAdPixels(pixels: AdPixels): number {
  return Object.values(pixels).filter(Boolean).length;
}

/**
 * Get a human-friendly label for a pixel key.
 */
export function getPixelLabel(key: keyof AdPixels): string {
  const labels: Record<keyof AdPixels, string> = {
    facebookPixelId: "Facebook Pixel",
    googleAnalyticsId: "Google Analytics",
    googleTagManagerId: "Google Tag Manager",
    tiktokPixelId: "TikTok Pixel",
    pinterestTagId: "Pinterest Tag",
    snapchatPixelId: "Snapchat Pixel",
    microsoftClarityId: "Microsoft Clarity",
    hotjarId: "Hotjar",
  };
  return labels[key];
}
