import { FinanceRepository } from "@/features/finance-engine/repositories/finance.repository";

export interface AlertTrigger {
  type: "warning" | "breach";
  message: string;
  categoryId: string;
}

export class NotificationEvaluator {
  /**
   * Scans budget categories and triggers alerts if velocity ranges exceed 85% or 100%.
   */
  static async evaluateBudgetAlerts(userId: string): Promise<AlertTrigger[]> {
    const { data: budgets } = await FinanceRepository.getBudgetsProgress(userId);
    const triggers: AlertTrigger[] = [];

    for (const b of budgets) {
      if (b.utilizationPercentage >= 100) {
        triggers.push({
          type: "breach",
          message: `🚨 You have exceeded your budget for ${b.categoryName}. Spent $${b.spentAmount} of $${b.limitAmount} limit.`,
          categoryId: b.categoryId,
        });
      } else if (b.utilizationPercentage >= 85) {
        triggers.push({
          type: "warning",
          message: `⚠️ Budget warning: Your spending in ${b.categoryName} is at ${Math.round(b.utilizationPercentage)}% of limit.`,
          categoryId: b.categoryId,
        });
      }
    }

    return triggers;
  }
}
