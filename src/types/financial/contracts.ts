/**
 * Shared data contracts and interfaces for Lumora AI's Domain Engines.
 * Centralizes the Financial Knowledge Object and Explainability definitions.
 */

export interface MetricMetadata {
  calculationTimeMs: number;
  databaseTimeMs: number;
  timestamp: string;
}

export interface FinancialSummary {
  currentBalance: number;
  monthIncome: number;
  monthExpense: number;
  netCashFlow: number;
  savingsRate: number; // percentage (0 - 100)
  activeSubscriptionsTotal: number;
  metrics: MetricMetadata;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  type: "income" | "expense" | "transfer" | "refund";
  totalSpent: number;
  transactionCount: number;
  percentageOfTotal: number; // (spent / total_expense) * 100
}

export interface BudgetProgress {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationPercentage: number; // e.g. 85.50 %
  isOverBudget: boolean;
  period: string;
  carryForward: boolean;
  autoReset: boolean;
  color: string;
  icon: string;
  notes: string | null;
  warningThreshold: number;
}

export interface GoalProgressContract {
  goalId: string;
  name: string;
  targetAmount: number;
  currentBalance: number;
  totalSaved: number;
  progressPercentage: number;
  targetDate: string;
  monthsRemaining: number;
  suggestedMonthlySavings: number;
  icon: string;
  color: string;
  priority: string;
  notes: string | null;
}

// ============================================================================
// Deterministic Calculations Standard Contract
// ============================================================================
export interface FinancialCalculator<Input, Output> {
  calculate(input: Input): Output;
}

// ============================================================================
// Explainability and Telemetry Metadata
// ============================================================================
export interface ExplainabilityMetadata {
  confidence: number; // 0.0 - 1.0
  priority: "critical" | "high" | "medium" | "low" | "informational";
  generatedAt: string;
  engineVersion: string;
  algorithm: string;
  sourceTransactionsCount: number;
  calculationSummary: string;
}

export interface Insight {
  id: string;
  type: "trend" | "outlier" | "comparison" | "milestone";
  title: string;
  description: string;
  explainability: ExplainabilityMetadata;
}

export interface BehaviorPattern {
  key: string;
  name: string;
  metricValue: string;
  description: string;
  explainability: ExplainabilityMetadata;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  estimatedMonthlySavings: number;
  relatedCategories: string[];
  explainability: ExplainabilityMetadata;
}

export interface Prediction {
  metric: string;
  predictedValue: number;
  trend: "stable" | "upward" | "downward";
  timeframe: string;
  explainability: ExplainabilityMetadata;
}

// ============================================================================
// Single Source of Truth: Financial Knowledge Object
// ============================================================================
export interface FinancialKnowledgeObject {
  knowledgeVersion: string;
  generatedAt: string;
  financialSummary: FinancialSummary;
  categorySummaries: CategorySummary[];
  budgetSummaries: BudgetProgress[];
  goalSummaries: GoalProgressContract[];
  insights: Insight[];
  behaviors: BehaviorPattern[];
  recommendations: Recommendation[];
  predictions: Prediction[];
  criticalAlerts: string[];
}

export interface FactorScoreDetail {
  score: number; // 0 - 100
  weight: number; // multiplier e.g. 0.25
  reason: string;
  suggestion: string;
}

export interface FinancialScoreContract {
  overallScore: number; // 0 - 100
  grade: "A" | "B" | "C" | "D" | "F";
  factors: {
    savingsRate: FactorScoreDetail;
    budgetAdherence: FactorScoreDetail;
    recurringExpenseRatio: FactorScoreDetail;
    cashFlowStability: FactorScoreDetail;
  };
  metrics: MetricMetadata;
}

export interface AIContextContract {
  contextVersion: string;
  engineVersion: string;
  generatedAt: string;
  financialKnowledge: FinancialKnowledgeObject;
  score: Omit<FinancialScoreContract, "metrics">;
  recentUserActions: string[];
  wealthPlan?: {
    runwayMonths: number;
    averageMonthlyExpenses: number;
    totalCash: number;
    totalAssets: number;
    totalDebts: number;
    netWealth: number;
    safetyScore: number;
    fireNumber: number;
    fireProgress: number;
    assets: any[];
    debts: any[];
  };
  secondBrain?: {
    recentThoughts: string[];
    dailyHabits: any[];
    coreValues: string[];
    personalRules: string[];
    goals: string[];
    recentWellbeing: any;
    memories: any[];
  };
}
