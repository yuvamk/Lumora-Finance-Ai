import { FinancialCalculator, Prediction } from "@/types/financial/contracts";

interface ForecasterInput {
  spentSoFar: number;
  dayOfMonth: number;
  totalDays: number;
}

/**
 * Standardized forecaster calculator to project velocity trends.
 */
export class VelocityForecasterCalculator implements FinancialCalculator<ForecasterInput, Prediction | null> {
  calculate(input: ForecasterInput): Prediction | null {
    const { spentSoFar, dayOfMonth, totalDays } = input;
    if (dayOfMonth <= 0 || spentSoFar <= 0) return null;

    const dailyVelocity = spentSoFar / dayOfMonth;
    const projectedValue = Math.round(dailyVelocity * totalDays * 100) / 100;

    return {
      metric: "month_end_expense_projection",
      predictedValue: projectedValue,
      trend: projectedValue > spentSoFar * 1.1 ? "upward" : "stable",
      timeframe: "end_of_current_month",
      explainability: {
        confidence: 0.85,
        priority: "medium",
        generatedAt: new Date().toISOString(),
        engineVersion: "1.0.0",
        algorithm: "VelocityForecasterCalculator",
        sourceTransactionsCount: 1, // Uses current month aggregate spent
        calculationSummary: `Extrapolated daily spending velocity of $${dailyVelocity.toFixed(2)}/day across the remaining days of the month.`,
      },
    };
  }
}
