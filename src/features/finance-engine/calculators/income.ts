/**
 * Pure calculator functions for income-related metrics.
 * Safe from database, Supabase, or browser dependencies.
 */

/**
 * Calculates the savings rate percentage.
 * @param totalIncome Total money received.
 * @param totalExpense Total money spent.
 * @returns Savings rate percentage (0 - 100).
 */
export function calculateSavingsRate(totalIncome: number, totalExpense: number): number {
  if (totalIncome <= 0) return 0;
  
  const savings = totalIncome - totalExpense;
  if (savings <= 0) return 0;

  const rate = (savings / totalIncome) * 100;
  return Math.min(100, Math.round(rate * 100) / 100);
}

/**
 * Calculates the growth rate percentage of income compared to a previous period.
 * @param currentIncome Income in the current period.
 * @param previousIncome Income in the previous period.
 * @returns Growth rate percentage (can be negative).
 */
export function calculateIncomeGrowth(currentIncome: number, previousIncome: number): number {
  if (previousIncome <= 0) {
    return currentIncome > 0 ? 100 : 0;
  }

  const growth = ((currentIncome - previousIncome) / previousIncome) * 100;
  return Math.round(growth * 100) / 100;
}
