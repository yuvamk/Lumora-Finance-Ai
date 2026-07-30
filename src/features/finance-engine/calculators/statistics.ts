/**
 * Pure calculator functions for generic finance statistics and forecasts.
 * Safe from database, Supabase, or browser dependencies.
 */

/**
 * Calculates mean transaction size.
 * @param totalAmount Sum of amounts.
 * @param count Count of transactions.
 * @returns Average transaction size.
 */
export function calculateAverageTransactionSize(totalAmount: number, count: number): number {
  if (count <= 0) return 0;
  return Math.round((totalAmount / count) * 100) / 100;
}

/**
 * Predicts month-end expenses based on spending velocity so far.
 * @param spentSoFar Total expenditures logged this month.
 * @param dayOfMonth Current day of month (1-31).
 * @param totalDaysInMonth Total days in current month (28-31).
 * @returns Projected month-end expense.
 */
export function projectMonthEndExpense(
  spentSoFar: number,
  dayOfMonth: number,
  totalDaysInMonth: number
): number {
  if (dayOfMonth <= 0) return spentSoFar;
  const dailyVelocity = spentSoFar / dayOfMonth;
  const projection = dailyVelocity * totalDaysInMonth;
  return Math.round(projection * 100) / 100;
}
