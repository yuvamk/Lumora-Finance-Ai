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

/** Send password reset email */
export async function forgotPasswordAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse<{ email: string }>> {
  const email = formData.get("email") as string;
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { email } };
}

/** Reset password (requires active session from email link) */
export async function resetPasswordAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
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

  redirect("/auth/login?reset=success");
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
