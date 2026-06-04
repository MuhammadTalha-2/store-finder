import * as cheerio from "cheerio";
import { throttledFetch } from "../rate-limiter.js";

interface ContactResult {
  email: string | null;
  source: string | null;
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
      !email.endsWith("@sentry-next.wixpress.com") &&
      !email.includes("wixpress") &&
      !email.endsWith(".png") &&
      !email.endsWith(".jpg") &&
      email.length < 100
  );
}

export async function extractContactEmail(
  url: string,
  homepageHtml: string
): Promise<ContactResult> {
  // 1. Try /pages/contact first (separate fetch — this is a different page)
  try {
    const contactUrl = new URL("/pages/contact", url).toString();
    const res = await throttledFetch(contactUrl, { retries: 0 });
    if (res.ok) {
      const html = await res.text();
      const emails = extractEmails(html);
      if (emails.length > 0) {
        return { email: emails[0], source: "contact_page" };
      }
    }
  } catch {
    // Page not available
  }

  // 2. Use the already-fetched homepage HTML for mailto + footer
  {
    const $ = cheerio.load(homepageHtml);

    // Check mailto links
    const mailtoLinks = $('a[href^="mailto:"]')
      .map((_, el) =>
        $(el).attr("href")?.replace("mailto:", "").split("?")[0]
      )
      .get()
      .filter((e): e is string => !!e);

    const validMailto = mailtoLinks.filter(
      (e) => !IGNORE_EMAILS.has(e.toLowerCase())
    );
    if (validMailto.length > 0) {
      return { email: validMailto[0], source: "mailto" };
    }

    // Check footer text
    const footerHtml = $("footer").html() || "";
    const footerEmails = extractEmails(footerHtml);
    if (footerEmails.length > 0) {
      return { email: footerEmails[0], source: "footer" };
    }

    // Check full page as fallback
    const allEmails = extractEmails(homepageHtml);
    if (allEmails.length > 0) {
      return { email: allEmails[0], source: "page_body" };
    }
  }

  // 3. Try privacy policy (separate fetch)
  try {
    const policyUrl = new URL("/policies/privacy-policy", url).toString();
    const res = await throttledFetch(policyUrl, { retries: 0 });
    if (res.ok) {
      const html = await res.text();
      const emails = extractEmails(html);
      if (emails.length > 0) {
        return { email: emails[0], source: "privacy_policy" };
      }
    }
  } catch {
    // Page not available
  }

  return { email: null, source: null };
}
