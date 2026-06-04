import { APP_SIGNATURES } from "../app-signatures.js";

interface DetectedApp {
  slug: string;
  name: string;
  confidence: number;
}

export function extractInstalledApps(html: string): DetectedApp[] {
  const detected: DetectedApp[] = [];

  for (const sig of APP_SIGNATURES) {
    let matchCount = 0;
    for (const pattern of sig.patterns) {
      if (pattern.test(html)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      detected.push({
        slug: sig.slug,
        name: sig.name,
        confidence: Math.min(matchCount / sig.patterns.length, 1),
      });
    }
  }

  return detected;
}
