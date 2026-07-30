import { FinanceRepository } from "@/features/finance-engine/repositories/finance.repository";
import { Recommendation } from "@/types/financial/contracts";
import { RulesAdvisorCalculator } from "../calculators/rules-advisor";

export class RecommendationEngine {
  /**
   * Scans budget categories and triggers recommendation advisory details.
   */
  static async getRecommendations(userId: string): Promise<Recommendation[]> {
    const { data: budgets } = await FinanceRepository.getBudgetsProgress(userId);
    const recommendations: Recommendation[] = [];

    const advisor = new RulesAdvisorCalculator();

    for (const b of budgets) {
      const rec = advisor.calculate({
        spent: b.spentAmount,
        limit: b.limitAmount,
        categoryName: b.categoryName,
        categoryId: b.categoryId,
      });
      if (rec) {
        recommendations.push(rec);
      }
    }

    return recommendations;
  }
}
