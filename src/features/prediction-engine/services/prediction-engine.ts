import { FinanceEngine } from "@/features/finance-engine/services/finance-engine";
import { Prediction } from "@/types/financial/contracts";
import { VelocityForecasterCalculator } from "../calculators/velocity-forecaster";

export class PredictionEngine {
  /**
   * Projects end-of-cycle spendings based on current months logs.
   */
  static async getPredictions(userId: string): Promise<Prediction[]> {
    const summary = await FinanceEngine.getFinancialSummary(userId);
    const predictions: Prediction[] = [];

    const now = new Date();
    const dayOfMonth = now.getDate();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const forecaster = new VelocityForecasterCalculator();
    const forecast = forecaster.calculate({
      spentSoFar: summary.monthExpense,
      dayOfMonth,
      totalDays,
    });

    if (forecast) {
      predictions.push(forecast);
    }

    return predictions;
  }
}
