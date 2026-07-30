import { KnowledgeEngine } from "@/features/knowledge-engine/services/knowledge-engine";
import { FinanceEngine } from "@/features/finance-engine/services/finance-engine";
import { AIContextContract } from "@/types/financial/contracts";

/**
 * AI Context Engine.
 * Formulates prompt-ready contexts for Claude by consuming the Financial Knowledge Object.
 */
export class AIContextBuilder {
  static async buildAIContext(userId: string): Promise<AIContextContract> {
    // 1. Fetch unified Knowledge Object (Single Source of Truth)
    const financialKnowledge = await KnowledgeEngine.getFinancialKnowledge(userId);
    
    // 2. Fetch score summaries
    const scoreObj = await FinanceEngine.getFinancialScore(userId);

    return {
      contextVersion: "1.0.0",
      engineVersion: "1.0.0",
      generatedAt: new Date().toISOString(),
      financialKnowledge,
      score: {
        overallScore: scoreObj.overallScore,
        grade: scoreObj.grade,
        factors: scoreObj.factors,
      },
      recentUserActions: [], // Extensible hook for historical interaction logs
    };
  }
}
