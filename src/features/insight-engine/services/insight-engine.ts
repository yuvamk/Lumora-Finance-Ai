import { TransactionRepository } from "@/features/transactions/repository";
import { Insight } from "@/types/financial/contracts";
import { LargestTransactionCalculator } from "../calculators/largest-transaction";

export class InsightEngine {
  /**
   * Evaluates historical records to generate deterministic observations.
   */
  static async getInsights(userId: string): Promise<Insight[]> {
    // Fetch last 100 transaction events to build insights
    const transactions = await TransactionRepository.getTransactions(userId, { limit: 100 });
    const insights: Insight[] = [];

    // Run largest transaction calculator
    const largestCalc = new LargestTransactionCalculator();
    const largestInsight = largestCalc.calculate({ transactions });
    if (largestInsight) {
      insights.push(largestInsight);
    }

    return insights;
  }
}
