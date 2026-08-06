// src/features/wealth/repository.ts
import { createClient } from "@/lib/supabase/server";
 
export interface ManualAsset {
  id: string;
  asset_name: string;
  asset_type: "equity" | "gold" | "cash" | "fixed_income" | "crypto";
  current_value: number;
  target_percentage: number;
}
 
export interface ManualDebt {
  id: string;
  debt_name: string;
  balance: number;
  interest_rate: number;
  min_payment: number;
}
 
export interface FireSettings {
  target_retirement_age: number;
  expected_return_rate: number;
}
 
export interface PaperPortfolioItem {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  purchase_price: number;
}
 
// Fallback in-memory store if DB relations do not exist yet on cloud Supabase
interface FallbackStore {
  assets: Map<string, ManualAsset[]>;
  debts: Map<string, ManualDebt[]>;
  fire: Map<string, FireSettings>;
  portfolio: Map<string, PaperPortfolioItem[]>;
  balance: Map<string, number>;
}
 
const globalForWealth = global as unknown as {
  wealthStore: FallbackStore | undefined;
};
 
const wealthStore: FallbackStore = globalForWealth.wealthStore ?? {
  assets: new Map(),
  debts: new Map(),
  fire: new Map(),
  portfolio: new Map(),
  balance: new Map(),
};
 
if (process.env.NODE_ENV !== "production") {
  globalForWealth.wealthStore = wealthStore;
}
 
function getFallbackAssets(userId: string): ManualAsset[] {
  if (!wealthStore.assets.has(userId)) {
    // Seed some initial demo assets
    wealthStore.assets.set(userId, [
      { id: "1", asset_name: "Equity Mutual Funds", asset_type: "equity", current_value: 500000, target_percentage: 60 },
      { id: "2", asset_name: "Physical Gold", asset_type: "gold", current_value: 100000, target_percentage: 20 },
      { id: "3", asset_name: "Liquid Cash", asset_type: "cash", current_value: 200000, target_percentage: 20 },
    ]);
  }
  return wealthStore.assets.get(userId) || [];
}
 
function getFallbackDebts(userId: string): ManualDebt[] {
  if (!wealthStore.debts.has(userId)) {
    wealthStore.debts.set(userId, [
      { id: "1", debt_name: "Personal Loan", balance: 150000, interest_rate: 11.5, min_payment: 5000 },
      { id: "2", debt_name: "Credit Card Bill", balance: 45000, interest_rate: 36.0, min_payment: 2200 },
    ]);
  }
  return wealthStore.debts.get(userId) || [];
}
 
function getFallbackFire(userId: string): FireSettings {
  if (!wealthStore.fire.has(userId)) {
    wealthStore.fire.set(userId, { target_retirement_age: 55, expected_return_rate: 12.0 });
  }
  return wealthStore.fire.get(userId)!;
}
 
function getFallbackPortfolio(userId: string): PaperPortfolioItem[] {
  if (!wealthStore.portfolio.has(userId)) {
    wealthStore.portfolio.set(userId, [
      { id: "1", symbol: "INFY", name: "Infosys Ltd", quantity: 15, purchase_price: 1850.50 },
      { id: "2", symbol: "TCS", name: "Tata Consultancy Services", quantity: 5, purchase_price: 4120.00 },
    ]);
  }
  return wealthStore.portfolio.get(userId) || [];
}
 
function getFallbackBalance(userId: string): number {
  if (!wealthStore.balance.has(userId)) {
    wealthStore.balance.set(userId, 1000000.00); // 10L default
  }
  return wealthStore.balance.get(userId)!;
}
 
export class WealthRepository {
  /** Get all manual assets */
  static async getAssets(userId: string): Promise<ManualAsset[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("wealth_assets")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });
 
      if (error) throw error;
      return data as ManualAsset[];
    } catch (e: any) {
      console.warn("⚠️ wealth_assets query failed, falling back to local storage:", e.message);
      return getFallbackAssets(userId);
    }
  }
 
  /** Upsert a manual asset */
  static async upsertAsset(userId: string, asset: Omit<ManualAsset, "id"> & { id?: string }): Promise<ManualAsset> {
    const assetId = asset.id || crypto.randomUUID();
    const newAsset: ManualAsset = {
      id: assetId,
      asset_name: asset.asset_name,
      asset_type: asset.asset_type,
      current_value: Number(asset.current_value),
      target_percentage: Number(asset.target_percentage),
    };
 
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("wealth_assets")
        .upsert({
          id: assetId,
          user_id: userId,
          asset_name: asset.asset_name,
          asset_type: asset.asset_type,
          current_value: Number(asset.current_value),
          target_percentage: Number(asset.target_percentage),
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();
 
      if (error) throw error;
      return data as ManualAsset;
    } catch (e: any) {
      console.warn("⚠️ wealth_assets upsert failed, using local storage:", e.message);
      const list = getFallbackAssets(userId);
      const idx = list.findIndex(a => a.id === assetId);
      if (idx !== -1) {
        list[idx] = newAsset;
      } else {
        list.push(newAsset);
      }
      wealthStore.assets.set(userId, list);
      return newAsset;
    }
  }
 
  /** Delete a manual asset */
  static async deleteAsset(userId: string, assetId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from("wealth_assets")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", assetId)
        .eq("user_id", userId);
 
      if (error) throw error;
      return true;
    } catch (e: any) {
      console.warn("⚠️ wealth_assets delete failed, using local storage:", e.message);
      const list = getFallbackAssets(userId);
      const filtered = list.filter(a => a.id !== assetId);
      wealthStore.assets.set(userId, filtered);
      return true;
    }
  }
 
  /** Get all manual debts */
  static async getDebts(userId: string): Promise<ManualDebt[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("wealth_debts")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });
 
      if (error) throw error;
      return data as ManualDebt[];
    } catch (e: any) {
      console.warn("⚠️ wealth_debts query failed, falling back to local storage:", e.message);
      return getFallbackDebts(userId);
    }
  }
 
  /** Upsert a manual debt */
  static async upsertDebt(userId: string, debt: Omit<ManualDebt, "id"> & { id?: string }): Promise<ManualDebt> {
    const debtId = debt.id || crypto.randomUUID();
    const newDebt: ManualDebt = {
      id: debtId,
      debt_name: debt.debt_name,
      balance: Number(debt.balance),
      interest_rate: Number(debt.interest_rate),
      min_payment: Number(debt.min_payment),
    };
 
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("wealth_debts")
        .upsert({
          id: debtId,
          user_id: userId,
          debt_name: debt.debt_name,
          balance: Number(debt.balance),
          interest_rate: Number(debt.interest_rate),
          min_payment: Number(debt.min_payment),
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();
 
      if (error) throw error;
      return data as ManualDebt;
    } catch (e: any) {
      console.warn("⚠️ wealth_debts upsert failed, using local storage:", e.message);
      const list = getFallbackDebts(userId);
      const idx = list.findIndex(d => d.id === debtId);
      if (idx !== -1) {
        list[idx] = newDebt;
      } else {
        list.push(newDebt);
      }
      wealthStore.debts.set(userId, list);
      return newDebt;
    }
  }
 
  /** Delete a manual debt */
  static async deleteDebt(userId: string, debtId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from("wealth_debts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", debtId)
        .eq("user_id", userId);
 
      if (error) throw error;
      return true;
    } catch (e: any) {
      console.warn("⚠️ wealth_debts delete failed, using local storage:", e.message);
      const list = getFallbackDebts(userId);
      const filtered = list.filter(d => d.id !== debtId);
      wealthStore.debts.set(userId, filtered);
      return true;
    }
  }
 
  /** Get FIRE Settings */
  static async getFireSettings(userId: string): Promise<FireSettings> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("wealth_fire_settings")
        .select("*")
        .eq("user_id", userId)
        .single();
 
      if (error) throw error;
      return data as FireSettings;
    } catch (e: any) {
      console.warn("⚠️ wealth_fire_settings query failed, using local storage:", e.message);
      return getFallbackFire(userId);
    }
  }
 
  /** Upsert FIRE Settings */
  static async upsertFireSettings(userId: string, settings: FireSettings): Promise<FireSettings> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("wealth_fire_settings")
        .upsert({
          user_id: userId,
          target_retirement_age: Number(settings.target_retirement_age),
          expected_return_rate: Number(settings.expected_return_rate),
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();
 
      if (error) throw error;
      return data as FireSettings;
    } catch (e: any) {
      console.warn("⚠️ wealth_fire_settings upsert failed, using local storage:", e.message);
      wealthStore.fire.set(userId, settings);
      return settings;
    }
  }
 
  /** Get Paper Portfolio List */
  static async getPaperPortfolio(userId: string): Promise<PaperPortfolioItem[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("wealth_paper_portfolio")
        .select("*")
        .eq("user_id", userId);
 
      if (error) throw error;
      return data as PaperPortfolioItem[];
    } catch (e: any) {
      console.warn("⚠️ wealth_paper_portfolio query failed, using local storage:", e.message);
      return getFallbackPortfolio(userId);
    }
  }
 
  /** Buy/Sell Paper Asset share updates */
  static async updatePaperPortfolioItem(userId: string, item: Omit<PaperPortfolioItem, "id"> & { id?: string }): Promise<void> {
    const itemId = item.id || crypto.randomUUID();
    const newItem: PaperPortfolioItem = {
      id: itemId,
      symbol: item.symbol,
      name: item.name,
      quantity: Number(item.quantity),
      purchase_price: Number(item.purchase_price),
    };
 
    try {
      const supabase = await createClient();
      if (newItem.quantity <= 0) {
        await supabase.from("wealth_paper_portfolio").delete().eq("id", itemId).eq("user_id", userId);
      } else {
        await supabase
          .from("wealth_paper_portfolio")
          .upsert({
            id: itemId,
            user_id: userId,
            symbol: item.symbol,
            name: item.name,
            quantity: Number(item.quantity),
            purchase_price: Number(item.purchase_price),
            updated_at: new Date().toISOString(),
          });
      }
    } catch (e: any) {
      console.warn("⚠️ wealth_paper_portfolio write failed, using local storage:", e.message);
      const list = getFallbackPortfolio(userId);
      const idx = list.findIndex(p => p.symbol === item.symbol);
      if (idx !== -1) {
        if (newItem.quantity <= 0) {
          list.splice(idx, 1);
        } else {
          list[idx] = newItem;
        }
      } else if (newItem.quantity > 0) {
        list.push(newItem);
      }
      wealthStore.portfolio.set(userId, list);
    }
  }
 
  /** Get Paper Balance Cash value */
  static async getPaperBalance(userId: string): Promise<number> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("wealth_paper_balance")
        .select("cash_balance")
        .eq("user_id", userId)
        .single();
 
      if (error) throw error;
      return Number(data.cash_balance);
    } catch (e: any) {
      console.warn("⚠️ wealth_paper_balance query failed, using local storage:", e.message);
      return getFallbackBalance(userId);
    }
  }
 
  /** Update Paper Balance Cash value */
  static async updatePaperBalance(userId: string, balance: number): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase
        .from("wealth_paper_balance")
        .upsert({
          user_id: userId,
          cash_balance: Number(balance),
          updated_at: new Date().toISOString(),
        });
    } catch (e: any) {
      console.warn("⚠️ wealth_paper_balance write failed, using local storage:", e.message);
      wealthStore.balance.set(userId, balance);
    }
  }
}
