import { FinancialCalculator, BehaviorPattern } from "@/types/financial/contracts";
import { Transaction } from "@/features/transactions/schemas";

/**
 * Calculator analyzing whether spending occurs heavily on weekends vs weekdays.
 */
export class WeekendRatioCalculator implements FinancialCalculator<{ transactions: Transaction[] }, BehaviorPattern | null> {
  calculate(input: { transactions: Transaction[] }): BehaviorPattern | null {
    const { transactions } = input;
    const expenses = transactions.filter((t) => t.type === "expense" && !t.deleted_at);

    if (expenses.length === 0) return null;

    let weekendSpent = 0;
    let weekdaySpent = 0;

    expenses.forEach((t) => {
      const day = new Date(t.date).getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = day === 0 || day === 6;

      if (isWeekend) {
        weekendSpent += t.amount;

      } else {
        weekdaySpent += t.amount;
      }
    });

    const totalSpent = weekendSpent + weekdaySpent;
    if (totalSpent === 0) return null;

    const weekendRatio = (weekendSpent / totalSpent) * 100;
    const roundedRatio = Math.round(weekendRatio * 100) / 100;

    // Detect if ratio represents heavy weekend spending behavior (e.g. > 40%)
    const isWeekendHeavy = roundedRatio > 40;

    return {
      key: "weekend-spending-ratio",
      name: "Weekend Spending Habit",
      metricValue: `${roundedRatio}%`,
      description: isWeekendHeavy 
        ? `High concentration of spending occurs on weekends (${roundedRatio}% of total outflow).`
        : `Your spending is evenly distributed across weekdays, keeping weekends stable.`,
      explainability: {
        confidence: Number((Math.min(1.0, expenses.length / 10)).toFixed(2)),
        priority: isWeekendHeavy ? "medium" : "informational",
        generatedAt: new Date().toISOString(),
        engineVersion: "1.0.0",
        algorithm: "WeekendRatioCalculator",
        sourceTransactionsCount: expenses.length,
        calculationSummary: `Assessed weekend vs weekday timestamps across ${expenses.length} transaction entries.`,
      },
    };
  }
}
