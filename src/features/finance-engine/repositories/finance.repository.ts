import { createClient } from "@/lib/supabase/server";
import { 
  FinancialSummary, 
  CategorySummary, 
  BudgetProgress, 
  GoalProgressContract 
} from "@/types/financial/contracts";

export interface DBTimeTracker {
  dbTimeMs: number;
}

interface CategoryBreakdownRow {
  category_id: string;
  categories: {
    name: string;
    type: string;
  } | {
    name: string;
    type: string;
  }[] | null;
  total_spent: number;
  transaction_count: number;
}


export class FinanceRepository {
  /**
   * Fetches core dashboard view metrics (balance, income, expense).
   */
  static async getDashboardSummary(userId: string): Promise<{ data: Omit<FinancialSummary, "savingsRate" | "netCashFlow" | "metrics">; dbTimeMs: number }> {
    const start = performance.now();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("vw_dashboard_summary")
      .select("*")
      .eq("user_id", userId)
      .single();

    const dbTimeMs = Math.round(performance.now() - start);

    if (error) {
      console.warn("vw_dashboard_summary query failure:", error.message);
      return {
        data: {
          currentBalance: 0,
          monthIncome: 0,
          monthExpense: 0,
          activeSubscriptionsTotal: 0,
        },
        dbTimeMs,
      };
    }

    return {
      data: {
        currentBalance: Number(data.current_balance),
        monthIncome: Number(data.month_income),
        monthExpense: Number(data.month_expense),
        activeSubscriptionsTotal: Number(data.active_subscriptions_total),
      },
      dbTimeMs,
    };
  }

  /**
   * Fetches category expenditures summaries.
   */
  static async getCategorySummaries(userId: string): Promise<{ data: Omit<CategorySummary, "percentageOfTotal">[]; dbTimeMs: number }> {
    const start = performance.now();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("vw_category_breakdown")
      .select("category_id, categories(name, type), total_spent, transaction_count")
      .eq("user_id", userId)
      .eq("month", new Date().toISOString().slice(0, 7) + "-01"); // Current month

    const dbTimeMs = Math.round(performance.now() - start);

    if (error) {
      console.warn("vw_category_breakdown query failure:", error.message);
      return { data: [], dbTimeMs };
    }

    const summaries = data.map((row: CategoryBreakdownRow) => {
      const categoryData = Array.isArray(row.categories)
        ? row.categories[0]
        : row.categories;

      return {
        categoryId: row.category_id,
        categoryName: categoryData?.name || "Uncategorized",
        type: (categoryData?.type || "expense") as "income" | "expense" | "transfer" | "refund",
        totalSpent: Number(row.total_spent),
        transactionCount: Number(row.transaction_count),
      };
    });

    return { data: summaries, dbTimeMs };
  }

  /**
   * Fetches active budget rules.
   */
  static async getBudgetsProgress(userId: string): Promise<{ data: BudgetProgress[]; dbTimeMs: number }> {
    const start = performance.now();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("vw_budget_progress")
      .select("*")
      .eq("user_id", userId);

    const dbTimeMs = Math.round(performance.now() - start);

    if (error) {
      console.warn("vw_budget_progress query failure:", error.message);
      return { data: [], dbTimeMs };
    }

    const list = (data || []).map((row) => ({
      budgetId: row.budget_id,
      categoryId: row.category_id,
      categoryName: row.category_name,
      limitAmount: Number(row.limit_amount),
      spentAmount: Number(row.spent_amount),
      remainingAmount: Number(row.remaining_amount),
      utilizationPercentage: Number(row.utilization_percentage),
      isOverBudget: Number(row.spent_amount) >= Number(row.limit_amount),
      period: row.period || "monthly",
      carryForward: Boolean(row.carry_forward),
      autoReset: Boolean(row.auto_reset),
      color: row.color || "#6366f1",
      icon: row.icon || "credit-card",
      notes: row.notes,
      warningThreshold: Number(row.warning_threshold || 0.85),
    }));

    return { data: list, dbTimeMs };
  }

  static async getGoalsProgress(userId: string): Promise<{ data: GoalProgressContract[]; dbTimeMs: number }> {
    const start = performance.now();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("vw_goal_progress")
      .select("*")
      .eq("user_id", userId);

    const dbTimeMs = Math.round(performance.now() - start);

    if (error) {
      console.warn("vw_goal_progress query failure:", error.message);
      return { data: [], dbTimeMs };
    }

    const list = (data || []).map((row) => {
      const targetAmount = Number(row.target_amount);
      const totalSaved = Number(row.total_saved);
      const targetDate = row.target_date;
      const monthsRemaining = Math.max(
        1,
        (new Date(targetDate).getFullYear() - new Date().getFullYear()) * 12 +
          (new Date(targetDate).getMonth() - new Date().getMonth())
      );
      const suggestedMonthlySavings = Math.max(0, (targetAmount - totalSaved) / monthsRemaining);

      return {
        goalId: row.goal_id,
        name: row.name,
        targetAmount,
        currentBalance: totalSaved,
        totalSaved,
        progressPercentage: Number(row.progress_percentage),
        targetDate,
        monthsRemaining,
        suggestedMonthlySavings,
        icon: row.icon || "piggy-bank",
        color: row.color || "#6366f1",
        priority: row.priority || "medium",
        notes: row.notes,
      };
    });

    return { data: list, dbTimeMs };
  }
}
