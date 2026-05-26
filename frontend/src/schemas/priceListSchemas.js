import { z } from "zod";

const MAX_DECIMAL = 9999999999.99;

/**
 * Matches Django DecimalField(max_digits=12, decimal_places=2) — positive currency.
 */
export const priceDecimalSchema = z
  .union([z.string(), z.number()])
  .transform((val) => {
    if (typeof val === "string") {
      const cleaned = val.trim().replace(/,/g, "");
      if (cleaned === "") return NaN;
      return Number(cleaned);
    }
    return val;
  })
  .refine((n) => !Number.isNaN(n), "Enter a valid amount")
  .refine((n) => n > 0, "Must be greater than zero")
  .refine((n) => n <= MAX_DECIMAL, "Maximum 9,999,999,999.99")
  .refine((n) => {
    const parts = String(n).split(".");
    return !parts[1] || parts[1].length <= 2;
  }, "At most 2 decimal places");

export const categoryIdSchema = z.coerce
  .number()
  .int("Select a category")
  .positive("Select a category");

export function buildPriceListEntrySchema() {
  return z
    .object({
      cloth_name: z
        .string()
        .trim()
        .min(2, "Item name is required")
        .max(255, "Name is too long"),
      category: categoryIdSchema,
      size: z.enum(["small", "medium", "large"]),
      fua_price: priceDecimalSchema,
      partner_price: priceDecimalSchema,
      is_active: z.boolean().optional().default(true),
    })
    .refine((data) => data.partner_price <= data.fua_price, {
      message: "Partner price cannot exceed Fua price",
      path: ["partner_price"],
    });
}

export function buildPriceListPatchSchema() {
  return z
    .object({
      cloth_name: z.string().trim().min(2).max(255).optional(),
      category: categoryIdSchema.optional(),
      size: z.enum(["small", "medium", "large"]).optional(),
      fua_price: priceDecimalSchema.optional(),
      partner_price: priceDecimalSchema.optional(),
      is_active: z.boolean().optional(),
    })
    .refine(
      (data) => {
        if (data.fua_price != null && data.partner_price != null) {
          return data.partner_price <= data.fua_price;
        }
        return true;
      },
      {
        message: "Partner price cannot exceed Fua price",
        path: ["partner_price"],
      },
    );
}

export function buildBulkPriceUpdateSchema() {
  return z.object({
    categories: z
      .array(z.coerce.number().int().positive())
      .min(1, "Select at least one category"),
    sizes: z.array(z.enum(["small", "medium", "large"])).optional(),
    percentChange: z
      .union([z.string(), z.number()])
      .transform((v) => (typeof v === "string" ? Number(v) : v))
      .refine((n) => !Number.isNaN(n), "Enter a valid percentage")
      .refine((n) => n >= -90 && n <= 900, "Use a value between -90% and 900%"),
    applyTo: z.enum(["fua_price", "partner_price", "both"]),
    activeOnly: z.boolean().default(true),
  });
}
