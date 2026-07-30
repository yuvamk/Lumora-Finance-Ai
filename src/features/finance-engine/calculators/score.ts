import { SCORING_RULES, GRADE_THRESHOLDS } from "../constants/score";
import { FinancialScoreContract, FactorScoreDetail } from "@/types/financial/contracts";

/**
 * Pure calculator for Financial Health Score.
 * Computes scores based on injected settings to ensure no DB context lock.
 */

interface ScoreInput {
  savingsRate: number;            // 0 - 100 %
  budgetUtilization: number;      // 0 - 150%+ % (100% = exact limit, >100% overspend)
  recurringExpenseRatio: number;  // 0 - 100 %
  netCashFlow: number;            // positive or negative decimal
  income: number;                 // total income
}

export function calculateFinancialHealthScore(input: ScoreInput): Omit<FinancialScoreContract, "metrics"> {
  // 1. Calculate Savings Rate Factor
  const srRule = SCORING_RULES.savingsRate;
  let srScore = 0;
  if (input.savingsRate >= srRule.maxThreshold) {
    srScore = 100;
  } else if (input.savingsRate > srRule.minThreshold) {
    srScore = (input.savingsRate / srRule.maxThreshold) * 100;
  }
  
  const savingsRateFactor: FactorScoreDetail = {
    score: Math.round(srScore),
    weight: srRule.weight,
    reason: input.savingsRate >= 20 
      ? `Healthy savings rate of ${input.savingsRate}% logs solid wealth creation.`
      : `Savings rate of ${input.savingsRate}% is below the target 20% savings threshold.`,
    suggestion: input.savingsRate >= 20
      ? "Maintain this pace. Consider allocating surplus to long-term investment goals."
      : "Try reducing food delivery or shopping bills by 10% to establish a cash buffer.",
  };

  // 2. Calculate Budget Adherence Factor
  const baRule = SCORING_RULES.budgetAdherence;
  let baScore = 100;
  if (input.budgetUtilization > baRule.maxThreshold) {
    const overspend = input.budgetUtilization - baRule.maxThreshold;
    const range = baRule.minThreshold; // 50% buffer over limit
    baScore = Math.max(0, 100 - (overspend / range) * 100);
  }

  const budgetAdherenceFactor: FactorScoreDetail = {
    score: Math.round(baScore),
    weight: baRule.weight,
    reason: input.budgetUtilization <= 100
      ? "Excellence in staying within configured category budget limits."
      : `Exceeded budget limit settings by ${Math.round(input.budgetUtilization - 100)}%.`,
    suggestion: input.budgetUtilization <= 100
      ? "Keep monitoring category spending velocity regularly."
      : "Adjust category limits or set up proactive warnings on shopping/dining drawers.",
  };

  // 3. Calculate Recurring Expense Ratio
  const reRule = SCORING_RULES.recurringExpenseRatio;
  let reScore = 100;
  if (input.recurringExpenseRatio > reRule.minThreshold) {
    const excess = input.recurringExpenseRatio - reRule.minThreshold;
    const range = reRule.maxThreshold - reRule.minThreshold; // 40% range (10% to 50%)
    reScore = Math.max(0, 100 - (excess / range) * 100);
  }

  const recurringExpenseFactor: FactorScoreDetail = {
    score: Math.round(reScore),
    weight: reRule.weight,
    reason: input.recurringExpenseRatio <= 30
      ? `Subscriptions account for a safe ${Math.round(input.recurringExpenseRatio)}% of income.`
      : `High subscription load (${Math.round(input.recurringExpenseRatio)}% of income) locks up cash.`,
    suggestion: input.recurringExpenseRatio <= 30
      ? "Your recurring ratio is healthy. Review cancel targets quarterly."
      : "Cancel duplicate subscriptions or downgrade high-cost software suites.",
  };

  // 4. Calculate Cash Flow Stability
  const cfRule = SCORING_RULES.cashFlowStability;
  let cfScore = 100;
  if (input.netCashFlow < 0) {
    if (input.income > 0) {
      const negativeRatio = (Math.abs(input.netCashFlow) / input.income) * 100;
      cfScore = Math.max(0, 100 - negativeRatio);
    } else {
      cfScore = 0;
    }
  }

  const cashFlowStabilityFactor: FactorScoreDetail = {
    score: Math.round(cfScore),
    weight: cfRule.weight,
    reason: input.netCashFlow >= 0
      ? "Net cash flow is positive, indicating secure financial surplus."
      : `Net negative cash flow. You spent $${Math.abs(input.netCashFlow)} more than earned.`,
    suggestion: input.netCashFlow >= 0
      ? "Allocate surplus savings to pending goals or investment indexes."
      : "Postpone secondary purchases to recover positive cash flow margins.",
  };

  // 5. Aggregate Weighted Score
  const totalWeightedScore = 
    (savingsRateFactor.score * savingsRateFactor.weight) +
    (budgetAdherenceFactor.score * budgetAdherenceFactor.weight) +
    (recurringExpenseFactor.score * recurringExpenseFactor.weight) +
    (cashFlowStabilityFactor.score * cashFlowStabilityFactor.weight);

  const roundedScore = Math.max(0, Math.min(100, Math.round(totalWeightedScore)));

  // 6. Map Grade Letter
  let grade: "A" | "B" | "C" | "D" | "F" = "F";
  for (const threshold of GRADE_THRESHOLDS) {
    if (roundedScore >= threshold.minScore) {
      grade = threshold.grade;
      break;
    }
  }

  return {
    overallScore: roundedScore,
    grade,
    factors: {
      savingsRate: savingsRateFactor,
      budgetAdherence: budgetAdherenceFactor,
      recurringExpenseRatio: recurringExpenseFactor,
      cashFlowStability: cashFlowStabilityFactor,
    },
  };
}
