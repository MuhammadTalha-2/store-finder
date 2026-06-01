import type { Store } from "@/lib/db/schema";

interface TemplateContext {
  store: Store;
  ourAppName?: string;
  ourAppUrl?: string;
}

export function renderTemplate(
  template: string,
  context: TemplateContext
): string {
  const { store, ourAppName, ourAppUrl } = context;

  const contactName = store.contactEmail
    ? store.contactEmail
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "there";

  return template
    .replace(/\{\{store_name\}\}/g, store.name || "your store")
    .replace(/\{\{store_url\}\}/g, store.url)
    .replace(/\{\{contact_name\}\}/g, contactName)
    .replace(/\{\{our_app_name\}\}/g, ourAppName || "our app")
    .replace(/\{\{our_app_url\}\}/g, ourAppUrl || "")
    .replace(
      /\{\{product_count\}\}/g,
      store.productCount?.toString() || "many"
    )
    .replace(/\{\{category\}\}/g, store.category || "your industry");
}
