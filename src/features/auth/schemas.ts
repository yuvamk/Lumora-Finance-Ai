import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  display_name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters").nullable().optional(),
  avatar_url: z.string().url("Avatar must be a valid URL").nullable().optional(),
});

export const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  base_currency_code: z.string().min(3, "Currency code must be 3 characters").max(3).optional(),
  base_currency_symbol: z.string().min(1, "Currency symbol is required").max(5).optional(),
  timezone: z.string().min(1, "Timezone is required").optional(),
  notification_preferences: z.object({
    email: z.boolean(),
    push: z.boolean(),
  }).optional(),
});
