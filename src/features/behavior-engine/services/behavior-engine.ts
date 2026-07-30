import { TransactionRepository } from "@/features/transactions/repository";
import { BehaviorPattern } from "@/types/financial/contracts";
import { WeekendRatioCalculator } from "../calculators/weekend-ratio";

export class BehaviorEngine {
  /**
   * Evaluates transactions history to extract behavioral trends.
   */
  static async getBehavioralPatterns(userId: string): Promise<BehaviorPattern[]> {
    const transactions = await TransactionRepository.getTransactions(userId, { limit: 100 });
    const patterns: BehaviorPattern[] = [];

    const weekendCalc = new WeekendRatioCalculator();
    const weekendPattern = weekendCalc.calculate({ transactions });
    if (weekendPattern) {
      patterns.push(weekendPattern);
    }

    return patterns;
  }
}
