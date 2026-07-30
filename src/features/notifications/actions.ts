"use server";

import { createClient } from "@/lib/supabase/server";
import { NotificationsRepository } from "./repository";
import { revalidatePath } from "next/cache";

export type ActionResponse<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function markNotificationReadAction(notificationId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    await NotificationsRepository.markAsRead(user.id, notificationId);
    revalidatePath("/notifications");
    return { success: true, data: null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    await NotificationsRepository.markAllAsRead(user.id);
    revalidatePath("/notifications");
    return { success: true, data: null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteNotificationAction(notificationId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    await NotificationsRepository.deleteNotification(user.id, notificationId);
    revalidatePath("/notifications");
    return { success: true, data: null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
