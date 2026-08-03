import { createClient } from "@/lib/supabase/server";
import { EmailService } from "@/lib/email/service";

export class NotificationEngine {
  /**
   * Main trigger to check budgets & subscriptions for a specific user,
   * create in-app notifications, and dispatch email alerts.
   */
  static async checkAndGenerateAlerts(userId: string): Promise<{ generatedCount: number }> {
    const supabase = await createClient();
    let generatedCount = 0;

    // 1. Fetch User Profile and Settings for email preferences
    const [profileRes, settingsRes] = await Promise.all([
      supabase.from("profiles").select("email, display_name").eq("id", userId).single(),
      supabase.from("settings").select("notification_preferences").eq("user_id", userId).single(),
    ]);

    const userEmail = profileRes.data?.email;
    const notifPrefs = settingsRes.data?.notification_preferences as { email?: boolean } | null;
    const isEmailEnabled = notifPrefs?.email !== false;

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    
    const twoDaysFromNow = new Date(today.getTime() + 2 * 86400000);
    const twoDaysFromNowStr = twoDaysFromNow.toISOString().slice(0, 10);

    // =========================================================================
    // 2. CHECK SUBSCRIPTION END & RENEWAL DATES (2 days before & day of renewal)
    // =========================================================================
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("id, name, amount, billing_period, next_billing_date, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .is("deleted_at", null);

    if (subscriptions && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        const nextDateStr = sub.next_billing_date; // YYYY-MM-DD
        if (!nextDateStr) continue;

        // Check if renewing in 2 days
        if (nextDateStr === twoDaysFromNowStr) {
          const title = `Subscription Renewal in 2 Days`;
          const message = `Your subscription for "${sub.name}" (₹${sub.amount}) will renew in 2 days on ${nextDateStr}.`;
          
          const created = await NotificationEngine.createIfNotExists({
            userId,
            title,
            message,
            type: "subscription",
            uniqueKey: `sub-2day-${sub.id}-${nextDateStr}`,
          });

          if (created) {
            generatedCount++;
            if (isEmailEnabled && userEmail) {
              await EmailService.sendEmail({
                to: userEmail,
                subject: `[Lumora AI] Upcoming Renewal: ${sub.name} in 2 Days`,
                title,
                message,
              });
            }
          }
        }

        // Check if renewing today (day of subscription end/renewal)
        if (nextDateStr === todayStr) {
          const title = `Subscription Renewal Today`;
          const message = `Your subscription for "${sub.name}" (₹${sub.amount}) is renewing today (${nextDateStr}).`;
          
          const created = await NotificationEngine.createIfNotExists({
            userId,
            title,
            message,
            type: "subscription",
            uniqueKey: `sub-today-${sub.id}-${nextDateStr}`,
          });

          if (created) {
            generatedCount++;
            if (isEmailEnabled && userEmail) {
              await EmailService.sendEmail({
                to: userEmail,
                subject: `[Lumora AI] Renewal Alert: ${sub.name} renews today`,
                title,
                message,
              });
            }
          }
        }
      }
    }

    // =========================================================================
    // 3. CHECK BUDGET OVERRUNS AND NEAR-LIMIT WARNINGS
    // =========================================================================
    const { data: budgetProgress } = await supabase
      .from("vw_budget_progress")
      .select("budget_id, category_name, limit_amount, spent_amount, remaining_amount, utilization_percentage")
      .eq("user_id", userId);

    if (budgetProgress && budgetProgress.length > 0) {
      for (const b of budgetProgress) {
        const utilization = Number(b.utilization_percentage) || 0;
        const limit = Number(b.limit_amount) || 0;
        const spent = Number(b.spent_amount) || 0;
        const categoryName = b.category_name || "Category";

        // Exceeded Limit (>= 100%)
        if (utilization >= 100 && limit > 0) {
          const overAmount = (spent - limit).toFixed(2);
          const title = `Budget Exceeded: ${categoryName}`;
          const message = `Critical Alert: Spending in ${categoryName} has exceeded your limit of ₹${limit.toFixed(2)} by ₹${overAmount}. Total spent: ₹${spent.toFixed(2)} (${utilization.toFixed(1)}%).`;

          const created = await NotificationEngine.createIfNotExists({
            userId,
            title,
            message,
            type: "budget",
            uniqueKey: `budget-exceeded-${b.budget_id}-${todayStr}`,
          });

          if (created) {
            generatedCount++;
            if (isEmailEnabled && userEmail) {
              await EmailService.sendEmail({
                to: userEmail,
                subject: `[Lumora AI] CRITICAL: Budget Exceeded for ${categoryName}`,
                title,
                message,
              });
            }
          }
        }
        // Near Limit Warning (>= 80% and < 100%)
        else if (utilization >= 80 && limit > 0) {
          const title = `Budget Alert: ${categoryName}`;
          const message = `Warning: Spending in ${categoryName} has reached ${utilization.toFixed(1)}% of your ₹${limit.toFixed(2)} limit. Total spent: ₹${spent.toFixed(2)}.`;

          const created = await NotificationEngine.createIfNotExists({
            userId,
            title,
            message,
            type: "budget",
            uniqueKey: `budget-warning-${b.budget_id}-${todayStr}`,
          });

          if (created) {
            generatedCount++;
            if (isEmailEnabled && userEmail) {
              await EmailService.sendEmail({
                to: userEmail,
                subject: `[Lumora AI] Budget Alert: ${categoryName} limit approaching`,
                title,
                message,
              });
            }
          }
        }
      }
    }

    return { generatedCount };
  }

  /**
   * Check if a notification already exists for this unique key within the past 24 hours,
   * and insert into `notifications` if not present.
   */
  private static async createIfNotExists(params: {
    userId: string;
    title: string;
    message: string;
    type: "budget" | "goal" | "subscription" | "system" | "ai";
    uniqueKey: string;
  }): Promise<boolean> {
    const supabase = await createClient();
    
    // Check if notification with same title for user exists within last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", params.userId)
      .eq("title", params.title)
      .gte("created_at", twentyFourHoursAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      return false; // Already created today
    }

    const { error } = await supabase.from("notifications").insert({
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      is_read: false,
    });

    if (error) {
      console.error("Failed to insert notification:", error.message);
      return false;
    }

    return true;
  }
}
