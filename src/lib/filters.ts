import { z } from "zod";

export const storeFiltersSchema = z.object({
  category: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  minProducts: z.coerce.number().optional(),
  maxProducts: z.coerce.number().optional(),
  hasEmail: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  hasApp: z.string().optional(),
  missingApp: z.string().optional(),
  missingAppCategory: z.string().optional(),
  minLeadScore: z.coerce.number().optional(),
  search: z.string().optional(),
  sort: z.string().default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

export type StoreFilters = z.infer<typeof storeFiltersSchema>;
