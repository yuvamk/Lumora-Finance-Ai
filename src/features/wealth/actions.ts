// src/features/wealth/actions.ts
"use server";
 
import { createClient } from "@/lib/supabase/server";
import { WealthRepository, ManualAsset, ManualDebt, FireSettings, PaperPortfolioItem } from "./repository";
import { ActionResponse } from "@/features/auth/actions";
import { revalidatePath } from "next/cache";
 
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
 
export async function getLiveMockPrice(symbol: string): Promise<number> {
  const stock = MOCK_STOCK_PRICES[symbol.toUpperCase()];
  if (!stock) return 100.00;
  
  // Dynamic tick price (random variation -0.5% to +0.5%)
  const variation = 1 + (Math.random() - 0.5) * 0.01;
  return Number((stock.price * variation).toFixed(2));
}
 
/** Fetch complete Wealth Plan summary */
export async function getWealthSummaryAction(): Promise<ActionResponse<WealthSummary>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    const userId = user.id;
    const [assets, debts, fireSettings, transactionsRes] = await Promise.all([
      WealthRepository.getAssets(userId),
      WealthRepository.getDebts(userId),
      WealthRepository.getFireSettings(userId),
      supabase.from("transactions").select("amount, type").eq("user_id", userId).is("deleted_at", null)
    ]);
 
    // 1. Calculate Average Monthly Expenses
    const txList = transactionsRes.data || [];
    const expenses = txList.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Fallback: estimate monthly expenses at ₹35,000 if ledger history is empty
    const averageMonthlyExpenses = expenses > 0 ? expenses : 35000;
 
    // 2. Aggregate Assets and Cash values
    const totalAssets = assets.reduce((sum, a) => sum + Number(a.current_value), 0);
    const totalCash = assets.filter(a => a.asset_type === "cash").reduce((sum, a) => sum + Number(a.current_value), 0);
    const totalDebts = debts.reduce((sum, d) => sum + Number(d.balance), 0);
    const netWealth = totalAssets - totalDebts;
 
    // 3. Compute Runway months and Safety Score
    const runwayMonths = averageMonthlyExpenses > 0 ? Number((totalCash / averageMonthlyExpenses).toFixed(1)) : 0;
    const safetyScore = Math.min(100, Math.round((runwayMonths / 6) * 100)); // 6 months runway = 100% safety
 
    // 4. Asset Rebalancing Recommendations
    const rebalanceSuggestions: RebalanceSuggestion[] = assets.map(a => {
      const currentPct = totalAssets > 0 ? (Number(a.current_value) / totalAssets) * 100 : 0;
      const targetPct = Number(a.target_percentage);
      const idealVal = (targetPct / 100) * totalAssets;
      const difference = idealVal - Number(a.current_value);
      
      let action: "buy" | "sell" | "hold" = "hold";
      if (difference > 1000) action = "buy";
      else if (difference < -1000) action = "sell";
 
      return {
        assetId: a.id,
        name: a.asset_name,
        type: a.asset_type,
        currentValue: Number(a.current_value),
        currentPercentage: Number(currentPct.toFixed(1)),
        targetPercentage: targetPct,
        difference: Number(difference.toFixed(2)),
        action,
      };
    });
 
    // 5. Debt Paydown Recommendations (Avalanche method sorting)
    const sortedDebts = [...debts].sort((a, b) => b.interest_rate - a.interest_rate);
    const debtSuggestions: DebtSuggestion[] = sortedDebts.map((d, index) => {
      const isHighest = index === 0;
      return {
        debtId: d.id,
        name: d.debt_name,
        balance: Number(d.balance),
        interestRate: Number(d.interest_rate),
        monthlyPriority: isHighest ? "highest" : index < 2 ? "medium" : "lowest",
        recommendedExtraPayment: isHighest ? 10000 : 0, // Suggest extra priority allocation
        reason: isHighest 
          ? `Highest interest rate at ${d.interest_rate}%. Focus all extra surplus cash here first.`
          : `High interest but secondary. Pay minimum due of ₹${d.min_payment} and snowball once higher rates are cleared.`,
      };
    });
 
    // 6. FIRE calculations
    // Rule of 25: FIRE Number = Annual Expenses * 25
    const fireNumber = averageMonthlyExpenses * 12 * 25;
    const fireProgress = fireNumber > 0 ? Number(Math.min(100, (Math.max(0, netWealth) / fireNumber) * 100).toFixed(1)) : 0;
 
    return {
      success: true,
      data: {
        runwayMonths,
        averageMonthlyExpenses,
        totalCash,
        totalAssets,
        totalDebts,
        netWealth,
        safetyScore,
        fireNumber,
        fireProgress,
        rebalanceSuggestions,
        debtSuggestions,
      }
    };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to load wealth engine data." };
  }
}
 
/** Mutate manual asset entries */
export async function upsertAssetAction(_prev: ActionResponse, formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    const id = formData.get("id") as string || undefined;
    const asset_name = formData.get("asset_name") as string;
    const asset_type = formData.get("asset_type") as any;
    const current_value = Number(formData.get("current_value"));
    const target_percentage = Number(formData.get("target_percentage"));
 
    if (!asset_name || !asset_type || isNaN(current_value) || isNaN(target_percentage)) {
      return { success: false, error: "Please enter valid asset properties." };
    }
 
    await WealthRepository.upsertAsset(user.id, {
      id,
      asset_name,
      asset_type,
      current_value,
      target_percentage,
    });
 
    revalidatePath("/insights");
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
 
export async function deleteAssetAction(assetId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    await WealthRepository.deleteAsset(user.id, assetId);
    revalidatePath("/insights");
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
 
/** Mutate manual debt entries */
export async function upsertDebtAction(_prev: ActionResponse, formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    const id = formData.get("id") as string || undefined;
    const debt_name = formData.get("debt_name") as string;
    const balance = Number(formData.get("balance"));
    const interest_rate = Number(formData.get("interest_rate"));
    const min_payment = Number(formData.get("min_payment"));
 
    if (!debt_name || isNaN(balance) || isNaN(interest_rate) || isNaN(min_payment)) {
      return { success: false, error: "Please enter valid debt parameters." };
    }
 
    await WealthRepository.upsertDebt(user.id, {
      id,
      debt_name,
      balance,
      interest_rate,
      min_payment,
    });
 
    revalidatePath("/insights");
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
 
export async function deleteDebtAction(debtId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    await WealthRepository.deleteDebt(user.id, debtId);
    revalidatePath("/insights");
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
 
/** Mutate FIRE parameters */
export async function updateFireSettingsAction(_prev: ActionResponse, formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    const target_retirement_age = Number(formData.get("target_retirement_age"));
    const expected_return_rate = Number(formData.get("expected_return_rate"));
 
    if (isNaN(target_retirement_age) || isNaN(expected_return_rate)) {
      return { success: false, error: "Invalid retirement numbers." };
    }
 
    await WealthRepository.upsertFireSettings(user.id, {
      target_retirement_age,
      expected_return_rate,
    });
 
    revalidatePath("/insights");
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
 
/** Paper Sandbox Actions */
export async function getSandboxDetailsAction(): Promise<ActionResponse<{ cash: number; portfolio: (PaperPortfolioItem & { livePrice: number; currentValue: number; gainLoss: number })[] }>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    const userId = user.id;
    const [cash, dbPortfolio] = await Promise.all([
      WealthRepository.getPaperBalance(userId),
      WealthRepository.getPaperPortfolio(userId),
    ]);
 
    const portfolio = await Promise.all(
      dbPortfolio.map(async (item) => {
        const livePrice = await getLiveMockPrice(item.symbol);
        const currentValue = Number((item.quantity * livePrice).toFixed(2));
        const costBasis = Number((item.quantity * item.purchase_price).toFixed(2));
        const gainLoss = Number((currentValue - costBasis).toFixed(2));
        
        return {
          ...item,
          livePrice,
          currentValue,
          gainLoss,
        };
      })
    );
 
    return { success: true, data: { cash, portfolio } };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to load sandbox." };
  }
}
 
export async function buyPaperAssetAction(symbol: string, quantity: number): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    const userId = user.id;
    const stock = MOCK_STOCK_PRICES[symbol.toUpperCase()];
    if (!stock) return { success: false, error: "Invalid stock symbol." };
 
    const currentPrice = await getLiveMockPrice(symbol);
    const cost = currentPrice * quantity;
    
    const cash = await WealthRepository.getPaperBalance(userId);
    if (cash < cost) {
      return { success: false, error: `Insufficient virtual cash. Required: ₹${cost.toLocaleString()}, Available: ₹${cash.toLocaleString()}` };
    }
 
    const portfolio = await WealthRepository.getPaperPortfolio(userId);
    const existing = portfolio.find(p => p.symbol === symbol.toUpperCase());
    
    let newQty = quantity;
    let newPrice = currentPrice;
 
    if (existing) {
      newQty = Number(existing.quantity) + quantity;
      // Weighted average cost basis
      const prevCost = Number(existing.quantity) * Number(existing.purchase_price);
      newPrice = Number(((prevCost + cost) / newQty).toFixed(2));
    }
 
    await Promise.all([
      WealthRepository.updatePaperBalance(userId, cash - cost),
      WealthRepository.updatePaperPortfolioItem(userId, {
        id: existing?.id,
        symbol: symbol.toUpperCase(),
        name: stock.name,
        quantity: newQty,
        purchase_price: newPrice,
      }),
    ]);
 
    revalidatePath("/insights");
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
 
export async function sellPaperAssetAction(symbol: string, quantity: number): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    const userId = user.id;
    const portfolio = await WealthRepository.getPaperPortfolio(userId);
    const existing = portfolio.find(p => p.symbol === symbol.toUpperCase());
 
    if (!existing || Number(existing.quantity) < quantity) {
      return { success: false, error: "You do not own enough virtual shares to sell this quantity." };
    }
 
    const currentPrice = await getLiveMockPrice(symbol);
    const proceeds = currentPrice * quantity;
    
    const cash = await WealthRepository.getPaperBalance(userId);
    const newQty = Number(existing.quantity) - quantity;
 
    await Promise.all([
      WealthRepository.updatePaperBalance(userId, cash + proceeds),
      WealthRepository.updatePaperPortfolioItem(userId, {
        id: existing.id,
        symbol: symbol.toUpperCase(),
        name: existing.name,
        quantity: newQty,
        purchase_price: existing.purchase_price, // Cost basis remains unchanged for remaining shares
      }),
    ]);
 
    revalidatePath("/insights");
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
 
export interface AuditInsight {
  id: string;
  title: string;
  description: string;
  type: "warning" | "info" | "success";
  savingPotential: number;
}
 
/** Analyze local spending audits */
export async function getAuditInsightsAction(): Promise<ActionResponse<AuditInsight[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    // Fetch transactions from the database directly
    const { data: dbTx, error } = await supabase
      .from("transactions")
      .select("amount, notes, created_at, type")
      .eq("user_id", user.id)
      .is("deleted_at", null);
 
    if (error) throw error;
    const txs = dbTx || [];
 
    const insights: AuditInsight[] = [];
 
    // 1. Food and Delivery Audit
    const foodKeywords = ["zomato", "swiggy", "ubereats", "food", "deliver", "restaurant", "cafe", "dining", "mcdonald", "pizza"];
    const foodTxs = txs.filter(t => 
      t.type === "expense" && 
      foodKeywords.some(kw => t.notes?.toLowerCase().includes(kw))
    );
    const totalFoodExpense = foodTxs.reduce((sum, t) => sum + Number(t.amount), 0);
 
    if (totalFoodExpense > 2000) {
      insights.push({
        id: "food-audit",
        title: "High Food Delivery / Dining Leak",
        description: `You logged ${foodTxs.length} dining/delivery expenses totaling ₹${totalFoodExpense.toLocaleString()} in your history. Cutting back on food ordering can boost savings.`,
        type: "warning",
        savingPotential: Math.round(totalFoodExpense * 0.4), // 40% saving potential
      });
    }
 
    // 2. Weekend Spending Spikes Audit
    let weekdaySum = 0;
    let weekdayCount = 0;
    let weekendSum = 0;
    let weekendCount = 0;
 
    txs.forEach(t => {
      if (t.type !== "expense") return;
      const date = new Date(t.created_at);
      const day = date.getDay(); // 0 = Sunday, 6 = Saturday
      const amt = Number(t.amount);
      if (day === 0 || day === 6) {
        weekendSum += amt;
        weekendCount++;
      } else {
        weekdaySum += amt;
        weekdayCount++;
      }
    });
 
    const avgWeekday = weekdayCount > 0 ? weekdaySum / weekdayCount : 0;
    const avgWeekend = weekendCount > 0 ? weekendSum / weekendCount : 0;
 
    if (avgWeekend > avgWeekday * 1.5 && weekendSum > 1000) {
      const pctIncrease = Math.round(((avgWeekend - avgWeekday) / avgWeekday) * 100);
      insights.push({
        id: "weekend-spike",
        title: "Weekend Spending Spike",
        description: `Your average spending on Saturdays and Sundays is ₹${Math.round(avgWeekend).toLocaleString()}, which is ${pctIncrease}% higher than your weekday average of ₹${Math.round(avgWeekday).toLocaleString()}.`,
        type: "info",
        savingPotential: Math.round((weekendSum - (avgWeekday * weekendCount)) * 0.5), // 50% of the delta
      });
    }
 
    // 3. Subscription Creep Audit
    const subKeywords = ["netflix", "spotify", "prime", "youtube", "icloud", "microsoft", "adobe", "google one", "renew", "premium", "pro"];
    const subTxs = txs.filter(t => 
      t.type === "expense" && 
      subKeywords.some(kw => t.notes?.toLowerCase().includes(kw))
    );
    const totalSubExpense = subTxs.reduce((sum, t) => sum + Number(t.amount), 0);
 
    if (subTxs.length > 0) {
      insights.push({
        id: "sub-creep",
        title: "Subscription Creep",
        description: `You have ${subTxs.length} active/recurring subscription markers totaling ₹${totalSubExpense.toLocaleString()}. Ensure you cancel unused trials.`,
        type: "info",
        savingPotential: Math.round(totalSubExpense * 0.3),
      });
    }
 
    // 4. Success Default
    if (insights.length === 0) {
      insights.push({
        id: "discipline-success",
        title: "Excellent Spending Discipline",
        description: "Your local ledger entries indicate perfect spending discipline with no food ordering leaks or weekend spikes. Keep it up!",
        type: "success",
        savingPotential: 0,
      });
    }
 
    return { success: true, data: insights };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to analyze spending audits." };
  }
}
