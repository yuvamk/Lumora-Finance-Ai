import { FinancialCalculator, Insight } from "@/types/financial/contracts";
import { Transaction } from "@/features/transactions/schemas";

/**
 * Standardized calculator to determine the single largest expenditure transaction.
 * Implements standard FinancialCalculator contract with complete explainability metrics.
 */
export class LargestTransactionCalculator implements FinancialCalculator<{ transactions: Transaction[] }, Insight | null> {
  calculate(input: { transactions: Transaction[] }): Insight | null {
    const { transactions } = input;
    const expenses = transactions.filter((t) => t.type === "expense" && !t.deleted_at);
    
    if (expenses.length === 0) return null;

    const largest = expenses.reduce((prev, current) => {
      return current.amount > prev.amount ? current : prev;
    });

    return {
      id: `insight-largest-${largest.id}`,
      type: "outlier",
      title: "Largest Expense Identified",
      description: `Your single largest expenditure this month was $${largest.amount.toFixed(2)} on ${largest.date}${
        largest.notes ? ` for "${largest.notes}"` : ""
      }.`,
      explainability: {
        confidence: 1.0,
        priority: "medium",
        generatedAt: new Date().toISOString(),
        engineVersion: "1.0.0",
        algorithm: "LargestTransactionCalculator",
        sourceTransactionsCount: expenses.length,
        calculationSummary: `Evaluated ${expenses.length} transaction outflow records to find the maximum decimal size.`,
      },
    };
  }
}
