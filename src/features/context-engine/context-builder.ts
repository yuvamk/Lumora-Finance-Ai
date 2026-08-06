import { KnowledgeEngine } from "@/features/knowledge-engine/services/knowledge-engine";
import { FinanceEngine } from "@/features/finance-engine/services/finance-engine";
import { AIContextContract } from "@/types/financial/contracts";
import { WealthRepository } from "@/features/wealth/repository";
import { SecondBrainRepository } from "@/features/second-brain/repository";
 
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
 
    // 3. Compute manual wealth planning parameters
    let wealthPlan = undefined;
    try {
      const [assets, debts] = await Promise.all([
        WealthRepository.getAssets(userId),
        WealthRepository.getDebts(userId),
      ]);
 
      const averageMonthlyExpenses = financialKnowledge?.financialSummary?.monthExpense || 35000;
      const totalAssets = assets.reduce((sum, a) => sum + Number(a.current_value), 0);
      const totalCash = assets.filter(a => a.asset_type === "cash").reduce((sum, a) => sum + Number(a.current_value), 0);
      const totalDebts = debts.reduce((sum, d) => sum + Number(d.balance), 0);
      const netWealth = totalAssets - totalDebts;
      const runwayMonths = averageMonthlyExpenses > 0 ? Number((totalCash / averageMonthlyExpenses).toFixed(1)) : 0;
      const safetyScore = Math.min(100, Math.round((runwayMonths / 6) * 100));
      const fireNumber = averageMonthlyExpenses * 12 * 25;
      const fireProgress = fireNumber > 0 ? Number(Math.min(100, (Math.max(0, netWealth) / fireNumber) * 100).toFixed(1)) : 0;
 
      wealthPlan = {
        runwayMonths,
        averageMonthlyExpenses,
        totalCash,
        totalAssets,
        totalDebts,
        netWealth,
        safetyScore,
        fireNumber,
        fireProgress,
        assets: assets.map(a => ({ name: a.asset_name, type: a.asset_type, value: a.current_value, target: a.target_percentage })),
        debts: debts.map(d => ({ name: d.debt_name, balance: d.balance, rate: d.interest_rate })),
      };
    } catch (err) {
      console.warn("⚠️ Failed to append wealthPlan to AI Context:", err);
    }
 
    // 4. Compute personal Second Brain parameters
    let secondBrain = undefined;
    try {
      const today = new Date().toISOString().split("T")[0];
      const [dumps, habits, coreValues, wellbeing, memories] = await Promise.all([
        SecondBrainRepository.getBrainDumps(userId),
        SecondBrainRepository.getHabits(userId, today),
        SecondBrainRepository.getCoreValues(userId),
        SecondBrainRepository.getWellbeingLogs(userId),
        SecondBrainRepository.getMemories(userId),
      ]);
 
      secondBrain = {
        recentThoughts: dumps.slice(0, 5).map(d => `[${d.category}] ${d.content}`),
        dailyHabits: habits.map(h => ({ name: h.name, status: h.status })),
        coreValues: coreValues.values_list,
        personalRules: coreValues.personal_rules,
        goals: coreValues.goals,
        recentWellbeing: wellbeing[0] ? { mood: wellbeing[0].mood, energy: wellbeing[0].energy, stress: wellbeing[0].stress, notes: wellbeing[0].notes } : null,
        memories: memories.slice(0, 5).map(m => `${m.title}: ${m.description}`),
      };
    } catch (err) {
      console.warn("⚠️ Failed to append secondBrain to AI Context:", err);
    }
 
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
      wealthPlan,
      secondBrain,
    };
  }
}
