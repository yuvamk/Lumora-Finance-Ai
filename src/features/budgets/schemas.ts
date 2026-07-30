import { z } from "zod";

export const budgetPeriodSchema = z.enum(["daily", "weekly", "monthly", "yearly"]);

export const createBudgetSchema = z.object({
  name: z.string().max(100).nullable().optional(),
  category_id: z.string().uuid("Category must be a valid UUID").nullable().optional(),
  limit_amount: z.number().positive("Limit must be a positive number"),
  period: budgetPeriodSchema.default("monthly"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must match YYYY-MM-DD"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must match YYYY-MM-DD").nullable().optional(),
  carry_forward: z.boolean().default(false),
  auto_reset: z.boolean().default(true),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex code").default("#6366f1"),
  icon: z.string().default("credit-card"),
  notes: z.string().nullable().optional(),
  warning_threshold: z.number().min(0.1).max(1.0).default(0.85),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export type CreateBudgetInput = z.input<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.input<typeof updateBudgetSchema>;
export type BudgetPeriod = z.infer<typeof budgetPeriodSchema>;
export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string | null;
  limit_amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string | null;
  carry_forward: boolean;
  auto_reset: boolean;
  color: string;
  icon: string;
  notes: string | null;
  warning_threshold: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
