/**
 * Pure calculator functions for expense-related metrics.
 * Safe from database, Supabase, or browser dependencies.
 */

/**
 * Calculates the growth rate percentage of expenses compared to a previous period.
 * @param currentExpense Expense in the current period.
 * @param previousExpense Expense in the previous period.
 * @returns Growth rate percentage (can be negative).
 */
export function calculateExpenseGrowth(currentExpense: number, previousExpense: number): number {
  if (previousExpense <= 0) {
    return currentExpense > 0 ? 100 : 0;
  }

  const growth = ((currentExpense - previousExpense) / previousExpense) * 100;
  return Math.round(growth * 100) / 100;
}

/**
 * Calculates what percentage of total expenses a specific category represents.
 * @param categorySpent Amount spent in a category.
 * @param totalExpense Total expenditures.
 * @returns Allocation percentage (0 - 100).
 */
export function calculateCategoryAllocation(categorySpent: number, totalExpense: number): number {
  if (totalExpense <= 0) return 0;

  const allocation = (categorySpent / totalExpense) * 100;
  return Math.min(100, Math.round(allocation * 100) / 100);
}
