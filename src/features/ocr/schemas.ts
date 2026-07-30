import { z } from "zod";

export const ocrLineItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
});

export const ocrResultSchema = z.object({
  merchant: z.string().min(1, "Merchant name is required"),
  amount: z.number().positive("Amount must be a positive number"),
  currency: z.string().default("USD"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must match YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Time must match HH:MM:SS").nullable().optional(),
  tax: z.number().nonnegative("Tax must be non-negative").default(0),
  paymentMethod: z.string().default("Credit Card"),
  categorySuggestion: z.string().default("Uncategorized"),
  items: z.array(ocrLineItemSchema).default([]),
});

export type OcrLineItem = z.infer<typeof ocrLineItemSchema>;
export type OcrResult = z.infer<typeof ocrResultSchema>;
