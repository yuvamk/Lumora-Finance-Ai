import { z } from "zod";

export const goalPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

export const createGoalSchema = z.object({
  name: z.string().min(1, "Goal name is required").max(100),
  target_amount: z.number().positive("Target amount must be a positive number"),
  current_balance: z.number().nonnegative("Starting amount must be non-negative").default(0),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Target date must match YYYY-MM-DD"),
  icon: z.string().default("piggy-bank"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex code").default("#6366f1"),
  priority: goalPrioritySchema.default("medium"),
  notes: z.string().nullable().optional(),
});

export const updateGoalSchema = createGoalSchema.partial();

export const goalTransactionSchema = z.object({
  amount: z.number().positive("Transaction amount must be a positive number"),
  type: z.enum(["deposit", "withdrawal"]),
});

export type CreateGoalInput = z.input<typeof createGoalSchema>;
export type UpdateGoalInput = z.input<typeof updateGoalSchema>;
export type GoalPriority = z.infer<typeof goalPrioritySchema>;
export type GoalTransactionInput = z.input<typeof goalTransactionSchema>;

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_balance: number;
  target_date: string;
  icon: string;
  color: string;
  priority: GoalPriority;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
