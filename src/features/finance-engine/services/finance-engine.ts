import { FinanceRepository } from "../repositories/finance.repository";
import { FinancialSummary, FinancialScoreContract } from "@/types/financial/contracts";
import { calculateSavingsRate } from "../calculators/income";
import { calculateNetCashFlow } from "../calculators/cashflow";
import { calculateFinancialHealthScore } from "../calculators/score";

/**
 * Coordinator service for Finance calculations.
 * Integrates database repositories with pure calculator domains.
 */
export class FinanceEngine {
  /**
   * Compiles the high-level monthly financial summary dashboard data.
   */
  static async getFinancialSummary(userId: string): Promise<FinancialSummary> {
    const calcStart = performance.now();
    
    // Fetch data via Repository (Database latency is timed internally)
    const { data: dbSummary, dbTimeMs } = await FinanceRepository.getDashboardSummary(userId);

    // Call pure calculation domains (safe from external deps)
    const savingsRate = calculateSavingsRate(dbSummary.monthIncome, dbSummary.monthExpense);
    const netCashFlow = calculateNetCashFlow(dbSummary.monthIncome, dbSummary.monthExpense);

    const calculationTimeMs = Math.round(performance.now() - calcStart);

    return {
      currentBalance: dbSummary.currentBalance,
      monthIncome: dbSummary.monthIncome,
      monthExpense: dbSummary.monthExpense,
      netCashFlow,
      savingsRate,
      activeSubscriptionsTotal: dbSummary.activeSubscriptionsTotal,
      metrics: {
        calculationTimeMs,
        databaseTimeMs: dbTimeMs,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Evaluates and aggregates the user's financial health score.
   */
  static async getFinancialScore(userId: string): Promise<FinancialScoreContract> {
    const calcStart = performance.now();

    // Fetch base aggregates and budget progress lists
    const summary = await this.getFinancialSummary(userId);
    const { data: budgets, dbTimeMs: budgetDbTime } = await FinanceRepository.getBudgetsProgress(userId);

    // Calculate overall budget utilization average
    let totalUtilization = 0;
    if (budgets.length > 0) {
      const sum = budgets.reduce((acc, curr) => acc + curr.utilizationPercentage, 0);
      totalUtilization = sum / budgets.length;
    }

    // Determine subscription ratio
    const subRatio = summary.monthIncome > 0 
      ? (summary.activeSubscriptionsTotal / summary.monthIncome) * 100 
      : 0;

    // Call pure health score domain calculator
    const scoreResult = calculateFinancialHealthScore({
      savingsRate: summary.savingsRate,
      budgetUtilization: totalUtilization,
      recurringExpenseRatio: subRatio,
      netCashFlow: summary.netCashFlow,
      income: summary.monthIncome,
    });

    const calculationTimeMs = Math.round(performance.now() - calcStart);

    return {
      ...scoreResult,
      metrics: {
        calculationTimeMs,
        databaseTimeMs: summary.metrics.databaseTimeMs + budgetDbTime,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
