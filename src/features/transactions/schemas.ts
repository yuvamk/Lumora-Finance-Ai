import { z } from "zod";

export const transactionTypeSchema = z.enum([
  "income",
  "expense",
  "transfer",
  "refund",
  "investment",
  "loan",
  "credit_card_payment",
  "adjustment",
]);

export const transactionStatusSchema = z.enum([
  "inbox",
  "categorized",
  "verified",
  "archived",
]);

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount: z.number().positive("Amount must be a positive number"),
  currency_code: z.string().min(3).max(3).default("INR"),
  currency_symbol: z.string().min(1).max(5).default("₹"),
  category_id: z.string().uuid("Category must be a valid UUID").or(z.literal("")).optional(),
  subcategory_id: z.string().uuid().nullable().optional(),
  merchant_id: z.string().uuid().nullable().optional(),
  payment_method_id: z.string().uuid().nullable().optional(),
  goal_id: z.string().uuid().nullable().optional(),
  budget_id: z.string().uuid().nullable().optional(),
  parent_transaction_id: z.string().uuid().nullable().optional(),
  receipt_id: z.string().uuid().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must match YYYY-MM-DD format"),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must match HH:MM format").nullable().optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").nullable().optional(),
  mood: z.enum(["happy", "stressed", "neutral", "regretful", "necessary"]).nullable().optional(),
  source: z.enum(["manual", "import", "ocr", "api"]).default("manual"),
  is_recurring: z.boolean().default(false),
  recurring_rule: z.string().nullable().optional(),
  timezone: z.string().default("UTC"),
  attachments: z.array(z.string().url("Attachment must be a valid URL")).default([]),
  status: transactionStatusSchema.default("inbox"),
});

export const updateTransactionSchema = createTransactionSchema.partial().omit({
  currency_code: true,
  currency_symbol: true,
});

export const bulkUpdateTransactionsSchema = z.object({
  ids: z.array(z.string().uuid("Invalid transaction UUID")),
  category_id: z.string().uuid().optional(),
  merchant_id: z.string().uuid().optional(),
  status: transactionStatusSchema.optional(),
  mood: z.enum(["happy", "stressed", "neutral", "regretful", "necessary"]).optional(),
});
export type CreateTransactionInput = z.input<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.input<typeof updateTransactionSchema>;
export type BulkUpdateTransactionsInput = z.input<typeof bulkUpdateTransactionsSchema>;
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  currency_code: string;
  currency_symbol: string;
  category_id: string;
  subcategory_id: string | null;
  merchant_id: string | null;
  payment_method_id: string | null;
  goal_id: string | null;
  budget_id: string | null;
  parent_transaction_id: string | null;
  receipt_id: string | null;
  date: string;
  time: string | null;
  notes: string | null;
  mood: string | null;
  source: string;
  is_recurring: boolean;
  recurring_rule: string | null;
  timezone: string;
  attachments: string[];
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
export interface TransactionGroup {
  date: string;
  transactions: Transaction[];
}
