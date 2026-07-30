import { FinancialCalculator, Recommendation } from "@/types/financial/contracts";

interface AdvisorInput {
  spent: number;
  limit: number;
  categoryName: string;
  categoryId: string;
}

/**
 * Rules-based recommendation engine calculator.
 */
export class RulesAdvisorCalculator implements FinancialCalculator<AdvisorInput, Recommendation | null> {
  calculate(input: AdvisorInput): Recommendation | null {
    const { spent, limit, categoryName, categoryId } = input;
    if (limit <= 0) return null;

    const utilization = (spent / limit) * 100;

    // Recommend cost reductions if utilization exceeds 90%
    if (utilization >= 90) {
      return {
        id: `rec-budget-limit-${categoryId}`,
        title: `Reduce ${categoryName} Outflows`,
        description: `Your ${categoryName} spending is at ${Math.round(utilization)}% of limit. Postpone non-essential purchases to protect budget boundaries.`,
        estimatedMonthlySavings: Math.round((spent - limit > 0 ? spent - limit : limit * 0.1) * 100) / 100,
        relatedCategories: [categoryId],
        explainability: {
          confidence: 0.90,
          priority: utilization >= 100 ? "critical" : "high",
          generatedAt: new Date().toISOString(),
          engineVersion: "1.0.0",
          algorithm: "RulesAdvisorCalculator",
          sourceTransactionsCount: 1, // Evaluated single category aggregation
          calculationSummary: `Triggered advisor rule: Category "${categoryName}" utilization exceeds 90% threshold.`,
        },
      };
    }

    return null;
  }
}
