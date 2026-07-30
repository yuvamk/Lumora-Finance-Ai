/**
 * Pure calculator functions for savings goals.
 * Safe from database, Supabase, or browser dependencies.
 */

/**
 * Calculates progress percentage against goal targets.
 * @param currentBalance Current savings amount.
 * @param targetAmount Target amount.
 * @returns Progress percentage (0 - 100).
 */
export function calculateGoalProgressPercent(currentBalance: number, targetAmount: number): number {
  if (targetAmount <= 0) return 0;
  const pct = (currentBalance / targetAmount) * 100;
  return Math.min(100, Math.round(pct * 100) / 100);
}

/**
 * Calculates calendar months remaining between today and the target date.
 * @param targetDateStr Target date string.
 * @param baseDateStr Optional base date override.
 * @returns Months count (minimum 1).
 */
export function calculateMonthsRemaining(targetDateStr: string, baseDateStr?: string): number {
  const targetDate = new Date(targetDateStr);
  const baseDate = baseDateStr ? new Date(baseDateStr) : new Date();

  const yearsDiff = targetDate.getFullYear() - baseDate.getFullYear();
  const monthsDiff = targetDate.getMonth() - baseDate.getMonth();

  const totalMonths = yearsDiff * 12 + monthsDiff;
  return Math.max(1, totalMonths);
}

/**
 * Computes suggested monthly deposit sizes to hit a target.
 * @param targetAmount Target amount.
 * @param currentBalance Balance saved so far.
 * @param monthsRemaining Months count remaining.
 * @returns Monthly amount.
 */
export function calculateSuggestedMonthlySavings(
  targetAmount: number,
  currentBalance: number,
  monthsRemaining: number
): number {
  const gap = targetAmount - currentBalance;
  if (gap <= 0 || monthsRemaining <= 0) return 0;
  return Math.round((gap / monthsRemaining) * 100) / 100;
}
