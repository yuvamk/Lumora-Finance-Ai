import { z } from "zod";

export const subscriptionStatusSchema = z.enum(["active", "paused", "cancelled"]);
export const billingPeriodSchema = z.enum(["daily", "weekly", "monthly", "yearly"]);

export const createSubscriptionSchema = z.object({
  name: z.string().min(1, "Subscription name is required").max(100),
  amount: z.number().positive("Billing amount must be a positive number"),
  billing_period: billingPeriodSchema.default("monthly"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must match YYYY-MM-DD"),
  next_billing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Next billing date must match YYYY-MM-DD"),
  category_id: z.string().uuid("Category must be a valid UUID"),
  payment_method_id: z.string().uuid("Payment method must be a valid UUID").nullable().optional(),
  status: subscriptionStatusSchema.default("active"),
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial();

export type CreateSubscriptionInput = z.input<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.input<typeof updateSubscriptionSchema>;
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
export type BillingPeriod = z.infer<typeof billingPeriodSchema>;

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  billing_period: BillingPeriod;
  start_date: string;
  next_billing_date: string;
  category_id: string;
  payment_method_id: string | null;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DetectedSubscription {
  name: string;
  amount: number;
  billing_period: BillingPeriod;
  lastPaymentDate: string;
  nextPaymentDate: string;
  categoryName: string;
  categoryId: string;
  confidence: number; // e.g. 0.95
}
