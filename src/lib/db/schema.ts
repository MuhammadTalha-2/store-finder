import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  real,
  jsonb,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const stores = pgTable(
  "stores",
  {
    id: serial("id").primaryKey(),
    url: text("url").notNull().unique(),
    myshopifyDomain: text("myshopify_domain"),
    name: text("name"),
    contactEmail: text("contact_email"),
    emailSource: text("email_source"),
    productCount: integer("product_count"),
    language: text("language"),
    country: text("country"),
    currency: text("currency"),
    category: text("category"),
    metaDescription: text("meta_description"),
    collectionCount: integer("collection_count"),
    hasBlog: boolean("has_blog"),
    isActive: boolean("is_active").default(true).notNull(),
    lastScrapedAt: timestamp("last_scraped_at", { withTimezone: true }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_stores_category").on(table.category),
    index("idx_stores_country").on(table.country),
    index("idx_stores_language").on(table.language),
    index("idx_stores_product_count").on(table.productCount),
    index("idx_stores_is_active").on(table.isActive),
  ]
);

export const knownApps = pgTable("known_apps", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  scriptPatterns: text("script_patterns").array().notNull(),
  isCompetitor: boolean("is_competitor").default(false).notNull(),
});

export const storeApps = pgTable(
  "store_apps",
  {
    id: serial("id").primaryKey(),
    storeId: integer("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    appId: integer("app_id")
      .notNull()
      .references(() => knownApps.id, { onDelete: "cascade" }),
    detectedAt: timestamp("detected_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    confidence: real("confidence").default(1.0).notNull(),
  },
  (table) => [
    uniqueIndex("idx_store_apps_unique").on(table.storeId, table.appId),
  ]
);

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  templateId: integer("template_id").references(() => emailTemplates.id),
  filtersJson: jsonb("filters_json"),
  status: text("status").default("draft").notNull(),
  totalRecipients: integer("total_recipients").default(0).notNull(),
  sentCount: integer("sent_count").default(0).notNull(),
  failedCount: integer("failed_count").default(0).notNull(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const campaignRecipients = pgTable(
  "campaign_recipients",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    storeId: integer("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    status: text("status").default("pending").notNull(),
    resendId: text("resend_id"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    errorMessage: text("error_message"),
  },
  (table) => [
    uniqueIndex("idx_campaign_recipients_unique").on(
      table.campaignId,
      table.storeId
    ),
  ]
);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const scrapeJobs = pgTable("scrape_jobs", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  status: text("status").default("running").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  storesDiscovered: integer("stores_discovered").default(0).notNull(),
  storesUpdated: integer("stores_updated").default(0).notNull(),
  storesFailed: integer("stores_failed").default(0).notNull(),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
});

export const dailyStats = pgTable("daily_stats", {
  date: date("date").primaryKey(),
  totalStores: integer("total_stores").default(0).notNull(),
  storesWithEmail: integer("stores_with_email").default(0).notNull(),
  emailsSentToday: integer("emails_sent_today").default(0).notNull(),
  newStoresToday: integer("new_stores_today").default(0).notNull(),
  storesByCategory: jsonb("stores_by_category"),
  storesByCountry: jsonb("stores_by_country"),
});

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
export type KnownApp = typeof knownApps.$inferSelect;
export type StoreApp = typeof storeApps.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type CampaignRecipient = typeof campaignRecipients.$inferSelect;
export type User = typeof users.$inferSelect;
export type ScrapeJob = typeof scrapeJobs.$inferSelect;
export type DailyStat = typeof dailyStats.$inferSelect;
