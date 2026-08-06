// src/features/wealth/types.ts
// Non-function exports moved out of "use server" wealth/actions.ts

export interface RebalanceSuggestion {
  assetId: string;
  name: string;
  type: string;
  currentValue: number;
  currentPercentage: number;
  targetPercentage: number;
  difference: number; // Positive = need to invest, Negative = need to reduce
  action: "buy" | "sell" | "hold";
}

export interface DebtSuggestion {
  debtId: string;
  name: string;
  balance: number;
  interestRate: number;
  monthlyPriority: "highest" | "medium" | "lowest";
  recommendedExtraPayment: number;
  reason: string;
}

export interface WealthSummary {
  runwayMonths: number;
  averageMonthlyExpenses: number;
  totalCash: number;
  totalAssets: number;
  totalDebts: number;
  netWealth: number;
  safetyScore: number; // 0 to 100
  fireNumber: number;
  fireProgress: number; // percentage
  rebalanceSuggestions: RebalanceSuggestion[];
  debtSuggestions: DebtSuggestion[];
}

// Mock Stock Prices with small random deviations for Sandbox simulation
export const MOCK_STOCK_PRICES: Record<string, { name: string; price: number }> = {
  INFY: { name: "Infosys Ltd", price: 1880.00 },
  TCS: { name: "Tata Consultancy Services", price: 4180.00 },
  RELIANCE: { name: "Reliance Industries", price: 2540.00 },
  HDFCBANK: { name: "HDFC Bank Ltd", price: 1620.00 },
  TATAMOTORS: { name: "Tata Motors Ltd", price: 980.00 },
  NIFTY50: { name: "Nifty 50 Index Fund", price: 24500.00 },
};

export interface AuditInsight {
  id: string;
  title: string;
  description: string;
  type: "warning" | "info" | "success";
  savingPotential: number;
}
