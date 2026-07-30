import { createClient } from "@/lib/supabase/server";
import { DetectedSubscription, BillingPeriod } from "../schemas";

export class SubscriptionDetector {
  /**
   * Scans a user's transaction history to automatically detect recurring expenses.
   */
  static async detectSubscriptions(userId: string): Promise<DetectedSubscription[]> {
    const supabase = await createClient();

    // Fetch transactions from the last 180 days
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 180);
    const minDateStr = minDate.toISOString().slice(0, 10);

    const { data: txs, error } = await supabase
      .from("transactions")
      .select(`
        id,
        amount,
        date,
        notes,
        categories (id, name),
        merchants (id, name)
      `)
      .eq("user_id", userId)
      .eq("type", "expense")
      .is("deleted_at", null)
      .gte("date", minDateStr)
      .order("date", { ascending: true });

    if (error || !txs) return [];

    // Group transactions by name (use merchant name, or clean notes slug)
    const groups: Record<string, typeof txs> = {};

    txs.forEach((t) => {
      const merc = Array.isArray(t.merchants) ? t.merchants[0] : t.merchants;

      const groupName = merc?.name?.trim() || t.notes?.trim() || "";
      if (!groupName || groupName.length < 3) return;

      const normalizedKey = groupName.toLowerCase();
      if (!groups[normalizedKey]) {
        groups[normalizedKey] = [];
      }
      groups[normalizedKey].push(t);
    });

    const detections: DetectedSubscription[] = [];

    // Evaluate each group for patterns
    for (const key in groups) {
      const history = groups[key];
      if (history.length < 2) continue;

      // Group sub-intervals and amount groupings
      const amounts = history.map((h) => Number(h.amount));
      const dates = history.map((h) => new Date(h.date));

      // Calculate gaps in days
      const gaps: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        const diffMs = dates[i].getTime() - dates[i - 1].getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        gaps.push(diffDays);
      }

      if (gaps.length === 0) continue;

      // Verify gaps alignment to standard billing cycles
      let period: BillingPeriod = "monthly";
      let isRecurring = false;
      let matchedGap = 30;

      // Check if average gap fits daily, weekly, monthly, yearly
      const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;

      if (avgGap >= 27 && avgGap <= 33) {
        period = "monthly";
        isRecurring = true;
        matchedGap = 30;
      } else if (avgGap >= 5 && avgGap <= 9) {
        period = "weekly";
        isRecurring = true;
        matchedGap = 7;
      } else if (avgGap >= 350 && avgGap <= 375) {
        period = "yearly";
        isRecurring = true;
        matchedGap = 365;
      } else if (avgGap >= 1 && avgGap <= 2) {
        period = "daily";
        isRecurring = true;
        matchedGap = 1;
      }

      // Check amount variance: standard deviation / deviation threshold <= 5%
      const firstAmount = amounts[0];
      const allAmountsMatch = amounts.every((a) => Math.abs(a - firstAmount) / firstAmount <= 0.05);

      if (isRecurring && allAmountsMatch) {
        // We found a detected subscription!
        const lastTx = history[history.length - 1];
        const lastDate = lastTx.date;

        const nextDateObj = new Date(lastDate);
        nextDateObj.setDate(nextDateObj.getDate() + matchedGap);
        const nextPaymentDate = nextDateObj.toISOString().slice(0, 10);

        // Parse category details
        const cat = Array.isArray(lastTx.categories) ? lastTx.categories[0] : lastTx.categories;
        const merc = Array.isArray(lastTx.merchants) ? lastTx.merchants[0] : lastTx.merchants;

        const confidence = gaps.length >= 3 ? 0.99 : 0.85;

        detections.push({
          name: merc?.name || lastTx.notes || "Subscription",
          amount: Number(lastTx.amount),
          billing_period: period,
          lastPaymentDate: lastDate,
          nextPaymentDate,
          categoryName: cat?.name || "Uncategorized",
          categoryId: cat?.id || "",
          confidence,
        });
      }
    }

    return detections;
  }
}
