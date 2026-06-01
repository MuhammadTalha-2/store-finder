import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadSeedUrls(): string[] {
  const seedPath = join(__dirname, "../../seeds/known-stores.json");
  if (!existsSync(seedPath)) {
    console.log("No seed file found at", seedPath);
    return [];
  }

  const data = JSON.parse(readFileSync(seedPath, "utf-8"));
  return data.urls || data || [];
}
