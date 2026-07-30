import { createClient } from "@/lib/supabase/server";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "budget" | "goal" | "subscription" | "system" | "ai";
  is_read: boolean;
  created_at: string;
}

export class NotificationsRepository {
  static async getNotifications(userId: string): Promise<AppNotification[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, message, type, is_read, created_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(`Failed to fetch notifications: ${error.message}`);
    return (data as AppNotification[]) || [];
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .is("deleted_at", null);

    if (error) return 0;
    return count ?? 0;
  }

  static async markAsRead(userId: string, notificationId: string): Promise<void> {
    const supabase = await createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userId);
  }

  static async markAllAsRead(userId: string): Promise<void> {
    const supabase = await createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", false)
      .is("deleted_at", null);
  }

  static async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const supabase = await createClient();
    await supabase
      .from("notifications")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userId);
  }

  static async createNotification(params: {
    userId: string;
    title: string;
    message: string;
    type: AppNotification["type"];
  }): Promise<void> {
    const supabase = await createClient();
    await supabase.from("notifications").insert({
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
    });
  }
}
