import { z } from "zod";

export const clothCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(500).optional().default(""),
  sort_order: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .refine((n) => !Number.isNaN(n) && n >= 0, "Sort order must be 0 or greater"),
  is_active: z.boolean().optional().default(true),
});

export const clothCategoryPatchSchema = clothCategorySchema.partial();
