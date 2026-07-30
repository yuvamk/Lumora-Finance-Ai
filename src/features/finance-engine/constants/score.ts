/**
 * Constants configuration for the Financial Health Scoring Engine.
 * Rules, weights, and thresholds are centralized here for easy tuning.
 */

export interface ScoringRule {
  key: "savingsRate" | "budgetAdherence" | "recurringExpenseRatio" | "cashFlowStability";
  name: string;
  weight: number; // Sum of all weights must equal 1.0 (100%)
  minThreshold: number;
  maxThreshold: number;
  enabled: boolean;
  description: string;
}

export const SCORING_RULES: Record<string, ScoringRule> = {
  savingsRate: {
    key: "savingsRate",
    name: "Savings Rate",
    weight: 0.30, // 30% of total score
    minThreshold: 0,   // 0% savings rate gives 0 score
    maxThreshold: 50,  // 50%+ savings rate gives max 100 score
    enabled: true,
    description: "Evaluates the proportion of income saved during the monthly cycle.",
  },
  budgetAdherence: {
    key: "budgetAdherence",
    name: "Budget Adherence",
    weight: 0.30, // 30% of total score
    minThreshold: 50,  // Exceeding budgets by 50%+ gives 0 score
    maxThreshold: 100, // Staying under 100% of limits gives max 100 score
    enabled: true,
    description: "Rates how closely expenditures align with configured budget limits.",
  },
  recurringExpenseRatio: {
    key: "recurringExpenseRatio",
    name: "Fixed Subscriptions Ratio",
    weight: 0.20, // 20% of total score
    minThreshold: 10,  // 10% or less fixed costs gives max 100 score
    maxThreshold: 50,  // 50%+ fixed costs gives 0 score
    enabled: true,
    description: "Assesses what portion of monthly income is locked into recurring subscriptions and bills.",
  },
  cashFlowStability: {
    key: "cashFlowStability",
    name: "Cash Flow Stability",
    weight: 0.20, // 20% of total score
    minThreshold: -100, // Stretched net negative income flow gives 0 score
    maxThreshold: 100,  // Positive net income flow gives max 100 score
    enabled: true,
    description: "Measures whether the monthly cash flow is positive and stable.",
  },
};

export const GRADE_THRESHOLDS = [
  { grade: "A" as const, minScore: 90 },
  { grade: "B" as const, minScore: 80 },
  { grade: "C" as const, minScore: 70 },
  { grade: "D" as const, minScore: 60 },
  { grade: "F" as const, minScore: 0 },
];
