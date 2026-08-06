import { z } from "zod";
import { 
  updateProfileSchema, 
  updateSettingsSchema, 
  signUpSchema, 
  signInSchema 
} from "./schemas";

export type ActionResponse<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserSettings {
  user_id: string;
  theme: string;
  base_currency_code: string;
  base_currency_symbol: string;
  timezone: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
  };
  created_at: string;
  updated_at: string;
}
