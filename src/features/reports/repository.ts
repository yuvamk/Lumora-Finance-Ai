import { createClient } from "@/lib/supabase/server";

export interface CashflowRow {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdownRow {
  category_name: string;
  total_spent: number;
  percentage: number;
  type: string;
}

export interface MonthlyStatRow {
  month: string;
  transaction_count: number;
  avg_amount: number;
}

export class ReportsRepository {
  /** Fetch 6-month cash flow from the vw_cashflow view */
  static async getCashflow(userId: string): Promise<CashflowRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vw_cashflow")
      .select("month, income, expense, net")
      .eq("user_id", userId)
      .order("month", { ascending: true })
      .limit(12);

    if (error) {
      console.error("getCashflow error:", error.message);
      return [];
    }
    return (data as CashflowRow[]) || [];
  }

  /** Fetch category breakdown from vw_category_breakdown */
  static async getCategoryBreakdown(userId: string): Promise<CategoryBreakdownRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vw_category_breakdown")
      .select("category_name, total_spent, percentage, type")
      .eq("user_id", userId)
      .order("total_spent", { ascending: false })
      .limit(20);

    if (error) {
      console.error("getCategoryBreakdown error:", error.message);
      return [];
    }
    return (data as CategoryBreakdownRow[]) || [];
  }

  /** Fetch monthly stats from vw_monthly_statistics */
  static async getMonthlyStats(userId: string): Promise<MonthlyStatRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vw_monthly_statistics")
      .select("month, transaction_count, avg_amount")
      .eq("user_id", userId)
      .order("month", { ascending: true })
      .limit(12);

    if (error) {
      console.error("getMonthlyStats error:", error.message);
      return [];
    }
    return (data as MonthlyStatRow[]) || [];
  }

  /** Fetch raw transactions for CSV export */
  static async getTransactionsForExport(userId: string, limit = 1000): Promise<Record<string, unknown>[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("transactions")
      .select("date, type, amount, currency_symbol, notes, categories(name)")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("getTransactionsForExport error:", error.message);
      return [];
    }
    return data as Record<string, unknown>[];
  }
}
