import { FinanceEngine } from "@/features/finance-engine/services/finance-engine";
import { CategoryAnalytics } from "@/features/analytics-engine/category/category-analytics";
import { FinanceRepository } from "@/features/finance-engine/repositories/finance.repository";
import { InsightEngine } from "@/features/insight-engine/services/insight-engine";
import { BehaviorEngine } from "@/features/behavior-engine/services/behavior-engine";
import { RecommendationEngine } from "@/features/recommendation-engine/services/recommendation-engine";
import { PredictionEngine } from "@/features/prediction-engine/services/prediction-engine";
import { FinancialKnowledgeObject } from "@/types/financial/contracts";
import { calculateMonthsRemaining, calculateSuggestedMonthlySavings } from "@/features/finance-engine/calculators/goals";

export class KnowledgeEngine {
  /**
   * Generates the single source of truth structured Financial Knowledge Object.
   * Completely decoupled from presentation templates.
   */
  static async getFinancialKnowledge(userId: string): Promise<FinancialKnowledgeObject> {
    // 1. Fetch base financial sums and category distributions
    const summary = await FinanceEngine.getFinancialSummary(userId);
    const categorySummaries = await CategoryAnalytics.getCategoryDistribution(userId);
    
    // 2. Fetch budget progress list
    const { data: budgetSummaries } = await FinanceRepository.getBudgetsProgress(userId);

    // 3. Fetch goals progress lists
    const { data: rawGoals } = await FinanceRepository.getGoalsProgress(userId);
    const goalSummaries = rawGoals.map((g) => {
      const monthsRemaining = calculateMonthsRemaining(g.targetDate);
      const suggestedMonthlySavings = calculateSuggestedMonthlySavings(
        g.targetAmount,
        g.currentBalance,
        monthsRemaining
      );

      return {
        ...g,
        monthsRemaining,
        suggestedMonthlySavings,
      };
    });

    // 4. Trigger sub-intelligence engines (deterministic observations)
    const insights = await InsightEngine.getInsights(userId);
    const behaviors = await BehaviorEngine.getBehavioralPatterns(userId);
    const recommendations = await RecommendationEngine.getRecommendations(userId);
    const predictions = await PredictionEngine.getPredictions(userId);

    // 5. Gather Critical alert triggers from limits utilization
    const criticalAlerts: string[] = [];
    budgetSummaries.forEach((b) => {
      if (b.utilizationPercentage >= 100) {
        criticalAlerts.push(`Limit Breach: Spent $${b.spentAmount} of $${b.limitAmount} in ${b.categoryName}.`);
      }
    });

    return {
      knowledgeVersion: "1.0.0",
      generatedAt: new Date().toISOString(),
      financialSummary: summary,
      categorySummaries,
      budgetSummaries,
      goalSummaries,
      insights,
      behaviors,
      recommendations,
      predictions,
      criticalAlerts,
    };
  }
}
