/**
 * Pure calculator functions for cash flow operations.
 * Safe from database, Supabase, or browser dependencies.
 */

/**
 * Calculates net cash flow (Income minus Expenses).
 * @param income Income amount.
 * @param expense Expense amount.
 * @returns Net cash flow.
 */
export function calculateNetCashFlow(income: number, expense: number): number {
  return Math.round((income - expense) * 100) / 100;
}

/**
 * Calculates savings pool size (returns 0 if cash flow is negative).
 * @param income Income amount.
 * @param expense Expense amount.
 * @returns Savings amount.
 */
export function calculateSavings(income: number, expense: number): number {
  const savings = income - expense;
  return savings > 0 ? Math.round(savings * 100) / 100 : 0;
}
