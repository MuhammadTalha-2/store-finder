import * as cheerio from "cheerio";

export interface SocialLinks {
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  tiktok: string | null;
  youtube: string | null;
  pinterest: string | null;
  linkedin: string | null;
  snapchat: string | null;
}

const SOCIAL_PATTERNS: { key: keyof SocialLinks; patterns: RegExp[] }[] = [
  {
    key: "facebook",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/i,
      /(?:https?:\/\/)?(?:www\.)?fb\.com\/[a-zA-Z0-9._-]+/i,
    ],
  },
  {
    key: "instagram",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+/i,
    ],
  },
  {
    key: "twitter",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+/i,
    ],
  },
  {
    key: "tiktok",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+/i,
    ],
  },
  {
    key: "youtube",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c\/|channel\/|@)[a-zA-Z0-9._-]+/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/[a-zA-Z0-9._-]+/i,
    ],
  },
  {
    key: "pinterest",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/[a-zA-Z0-9._-]+/i,
      /(?:https?:\/\/)?(?:[a-z]{2}\.)?pinterest\.com\/[a-zA-Z0-9._-]+/i,
    ],
  },
  {
    key: "linkedin",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9._-]+/i,
    ],
  },
  {
    key: "snapchat",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?snapchat\.com\/add\/[a-zA-Z0-9._-]+/i,
    ],
  },
];

/**
 * Extract social media links from the homepage HTML.
 * Looks at <a> href attributes throughout the page,
 * prioritizing footer and header sections.
 */
export function extractSocialLinks(html: string): SocialLinks {
  const $ = cheerio.load(html);
  const links: SocialLinks = {
    facebook: null,
    instagram: null,
    twitter: null,
    tiktok: null,
    youtube: null,
    pinterest: null,
    linkedin: null,
    snapchat: null,
  };

  // Collect all <a> hrefs from the page
  const hrefs: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href) hrefs.push(href);
  });

  // Also check raw HTML for social URLs that may not be in <a> tags
  // (e.g., in JavaScript variables or data attributes)
  for (const social of SOCIAL_PATTERNS) {
    for (const pattern of social.patterns) {
      // First try <a> hrefs
      for (const href of hrefs) {
        if (pattern.test(href) && !links[social.key]) {
          const match = href.match(pattern);
          if (match) {
            let url = match[0];
            // Normalize to include https://
            if (!url.startsWith("http")) {
              url = `https://${url}`;
            }
            // Skip generic share/intent links
            if (
              url.includes("/sharer") ||
              url.includes("/share?") ||
              url.includes("/intent/") ||
              url.includes("/dialog/") ||
              url.includes("facebook.com/tr") ||
              url.includes("/plugins/")
            ) {
              continue;
            }
            links[social.key] = url;
            break;
          }
        }
      }

      // If not found in hrefs, try raw HTML match
      if (!links[social.key]) {
        const htmlMatch = html.match(pattern);
        if (htmlMatch) {
          let url = htmlMatch[0];
          if (!url.startsWith("http")) {
            url = `https://${url}`;
          }
          if (
            !url.includes("/sharer") &&
            !url.includes("/share?") &&
            !url.includes("/intent/") &&
            !url.includes("/dialog/") &&
            !url.includes("facebook.com/tr") &&
            !url.includes("/plugins/")
          ) {
            links[social.key] = url;
          }
        }
      }
    }
  }

  return links;
}

/**
 * Count how many social media profiles a store has.
 */
export function countSocialLinks(links: SocialLinks): number {
  return Object.values(links).filter(Boolean).length;
}
