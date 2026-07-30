import { FinanceRepository } from "@/features/finance-engine/repositories/finance.repository";
import { CategorySummary } from "@/types/financial/contracts";
import { calculateCategoryAllocation } from "@/features/finance-engine/calculators/expense";

export class CategoryAnalytics {
  /**
   * Compiles category spent allocations for the active month cycle.
   */
  static async getCategoryDistribution(userId: string): Promise<CategorySummary[]> {
    // Fetch category aggregations from repository
    const { data: rawSummaries } = await FinanceRepository.getCategorySummaries(userId);

    // Sum total expenses to configure percentage limits
    const totalExpenses = rawSummaries
      .filter((c) => c.type === "expense")
      .reduce((sum, curr) => sum + curr.totalSpent, 0);

    // Map allocations and calculate weights using pure calculators
    return rawSummaries.map((cat) => {
      const pct = cat.type === "expense" 
        ? calculateCategoryAllocation(cat.totalSpent, totalExpenses)
        : 0;

      return {
        ...cat,
        percentageOfTotal: pct,
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }
}
