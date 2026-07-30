/**
 * Pure calculator functions for budgets operations.
 * Safe from database, Supabase, or browser dependencies.
 */

/**
 * Calculates budget utilization percentage.
 * @param spentAmount Amount spent.
 * @param limitAmount Configured limit.
 * @returns Utilization percentage.
 */
export function calculateBudgetUtilization(spentAmount: number, limitAmount: number): number {
  if (limitAmount <= 0) return 0;
  const pct = (spentAmount / limitAmount) * 100;
  return Math.round(pct * 100) / 100;
}

/**
 * Calculates budget funds remaining.
 * @param spentAmount Amount spent.
 * @param limitAmount Configured limit.
 * @returns Remaining funds.
 */
export function calculateBudgetRemaining(spentAmount: number, limitAmount: number): number {
  return Math.round((limitAmount - spentAmount) * 100) / 100;
}

/**
 * Returns true if the spending matches or exceeds the budget limit.
 * @param spentAmount Amount spent.
 * @param limitAmount Configured limit.
 */
export function isBudgetBreached(spentAmount: number, limitAmount: number): boolean {
  return spentAmount >= limitAmount;
}
