"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signInSchema, signUpSchema } from "./schemas";
import { AuthRepository } from "./repository";

export type ActionResponse<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Sign in with email + password */
export async function signInAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { success: false, error: "Invalid email or password. Please try again." };
  }

  await AuthRepository.logActivity({
    userId: null,
    action: "login",
    entity: "profiles",
    entityId: "auth",
  });

  redirect("/dashboard");
}

/** Sign up with email + password */
export async function signUpAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse<{ email: string }>> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    display_name: (formData.get("display_name") as string) || undefined,
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.display_name },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { success: false, error: "This email is already registered. Try signing in." };
    }
    return { success: false, error: error.message };
  }

  return { success: true, data: { email: parsed.data.email } };
}

/** Sign out */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

import { EmailService } from "@/lib/email/service";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
 
// Temporary in-memory OTP cache
interface OtpEntry {
  code: string;
  expiresAt: number;
  verified: boolean;
}
 
const globalForOtp = global as unknown as {
  otpStore: Map<string, OtpEntry> | undefined;
};
 
const otpStore = globalForOtp.otpStore ?? new Map<string, OtpEntry>();
 
if (process.env.NODE_ENV !== "production") {
  globalForOtp.otpStore = otpStore;
}
 
export function createAdminClient() {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
 
/** Send password reset OTP */
export async function sendOtpAction(
  _prev: ActionResponse<{ email: string } | null>,
  formData: FormData
): Promise<ActionResponse<{ email: string }>> {
  const email = formData.get("email") as string;
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }
 
  // Generate 6-digit numeric OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins
 
  // Store in cache
  otpStore.set(email.toLowerCase(), { code: otp, expiresAt, verified: false });
 
  // Send email via Nodemailer
  const emailResult = await EmailService.sendEmail({
    to: email,
    subject: "Lumora Finance AI - Password Reset OTP",
    title: "Password Reset Verification Code",
    message: `You requested a password reset code for your Lumora Finance AI account.\n\nPlease use the 6-digit One-Time Password (OTP) verification code shown below to verify your identity. The code will expire in 15 minutes.`,
    actionText: `OTP Code: ${otp}`,
    actionUrl: `${env.NEXT_PUBLIC_APP_URL}/auth/forgot-password`
  });
 
  if (!emailResult.success) {
    return { success: false, error: emailResult.error || "Failed to send reset email. Contact support." };
  }
 
  return { success: true, data: { email } };
}
 
/** Verify password reset OTP */
export async function verifyPasswordResetOtpAction(
  _prev: ActionResponse<{ email: string; otp: string } | null>,
  formData: FormData
): Promise<ActionResponse<{ email: string; otp: string }>> {
  const email = formData.get("email") as string;
  const otp = formData.get("otp") as string;
 
  if (!email || !otp) {
    return { success: false, error: "Email and OTP code are required." };
  }
 
  const entry = otpStore.get(email.toLowerCase());
  if (!entry) {
    return { success: false, error: "No active OTP request found for this email." };
  }
 
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return { success: false, error: "OTP has expired. Please request a new one." };
  }
 
  if (entry.code !== otp.trim()) {
    return { success: false, error: "Invalid OTP code. Please check and try again." };
  }
 
  // Mark as verified in store
  otpStore.set(email.toLowerCase(), { ...entry, verified: true });
 
  return { success: true, data: { email, otp: otp.trim() } };
}
 
/** Reset password via verified OTP */
export async function resetPasswordWithOtpAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse<null>> {
  const email = formData.get("email") as string;
  const otp = formData.get("otp") as string;
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm_password") as string;
 
  if (!email || !otp || !password) {
    return { success: false, error: "Missing required password inputs." };
  }
 
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }
 
  if (password !== confirm) {
    return { success: false, error: "Passwords do not match." };
  }
 
  const entry = otpStore.get(email.toLowerCase());
  if (!entry || !entry.verified || entry.code !== otp.trim()) {
    return { success: false, error: "OTP verification expired or invalid. Please try again." };
  }
 
  try {
    const adminClient = createAdminClient();
    
    // 1. Fetch user by email to get user UUID
    const { data: { users }, error: getError } = await adminClient.auth.admin.listUsers();
    if (getError) {
      return { success: false, error: getError.message };
    }
 
    const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!targetUser) {
      return { success: false, error: "No user account found matching this email address." };
    }
 
    // 2. Update user password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUser.id, {
      password: password
    });
 
    if (updateError) {
      return { success: false, error: updateError.message };
    }
 
    // 3. Clear store
    otpStore.delete(email.toLowerCase());
 
    return { success: true, data: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update password." };
  }
}
 
/** Reset password (requires active session from email link) */
export async function resetPasswordAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse<null>> {
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm_password") as string;
 
  if (!password || password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { success: false, error: "Passwords do not match." };
  }
 
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
 
  if (error) {
    return { success: false, error: error.message };
  }
 
  return { success: true, data: null };
}

/** Update user profile */
export async function updateProfileAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const display_name = formData.get("display_name") as string;
  const avatar_url = (formData.get("avatar_url") as string) || null;

  try {
    await AuthRepository.updateProfile(user.id, {
      display_name: display_name || null,
      avatar_url,
    });
    return { success: true, data: null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Update failed." };
  }
}

/** Update user settings */
export async function updateSettingsAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const theme = formData.get("theme") as "light" | "dark" | "system" | null;
  const base_currency_code = formData.get("base_currency_code") as string | null;
  const base_currency_symbol = formData.get("base_currency_symbol") as string | null;
  const timezone = formData.get("timezone") as string | null;
  const email_notifs = formData.get("email_notifications") === "true";
  const push_notifs = formData.get("push_notifications") === "true";

  try {
    await AuthRepository.updateSettings(user.id, {
      ...(theme && { theme }),
      ...(base_currency_code && { base_currency_code }),
      ...(base_currency_symbol && { base_currency_symbol }),
      ...(timezone && { timezone }),
      notification_preferences: { email: email_notifs, push: push_notifs },
    });
    return { success: true, data: null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Settings update failed." };
  }
}

/** Verify OTP code for signup */
export async function verifyOtpAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const email = formData.get("email") as string;
  const token = formData.get("token") as string;

  if (!email || !token) {
    return { success: false, error: "Email and OTP code are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await AuthRepository.logActivity({
    userId: null,
    action: "signup_verify",
    entity: "profiles",
    entityId: "auth",
  });

  redirect("/onboarding");
}
