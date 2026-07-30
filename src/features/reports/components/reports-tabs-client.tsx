"use client";

import React, { useState } from "react";
import { CashFlowChart, CategoryPieChart, IncomeExpenseBarChart } from "./charts";
import { Transaction } from "@/features/transactions/schemas";
import { 
  BarChart3, Sparkles, Calendar, Search, 
  TrendingUp, TrendingDown, DollarSign, Tag, Landmark, Award
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ReportsTabsClientProps {
  userId: string;
  summary: any;
  cashflow: any[];
  categoryBreakdown: any[];
  budgets: any[];
  goals: any[];
  transactions: Transaction[];
  categoriesDbList: any[];
}

export function ReportsTabsClient({
  userId,
  summary,
  cashflow,
  categoryBreakdown,
  budgets,
  goals,
  transactions,
  categoriesDbList,
}: ReportsTabsClientProps) {
  const [activeTab, setActiveTab] = useState<"monthly" | "daily" | "history">("monthly");
  
  // Item history search state
  const [searchQuery, setSearchQuery] = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // 1. Calculate Daily Analytics
  const todayTransactions = transactions.filter((t) => t.date === todayStr);
  const todayExpenses = todayTransactions.filter((t) => t.type === "expense");
  const todayIncomes = todayTransactions.filter((t) => t.type === "income");

  const todaySpending = todayExpenses.reduce((sum, t) => sum + t.amount, 0);
  const todayIncome = todayIncomes.reduce((sum, t) => sum + t.amount, 0);
  const todaySavings = todayIncome - todaySpending;

  // Largest expense today
  const largestExpenseTx = todayExpenses.length > 0 
    ? todayExpenses.reduce((max, t) => (t.amount > max.amount ? t : max), todayExpenses[0])
    : null;
  const largestExpenseAmount = largestExpenseTx ? largestExpenseTx.amount : 0;
  const largestExpenseMerchant = largestExpenseTx ? (categoriesDbList.find(c => c.id === largestExpenseTx.category_id)?.name || "Item") : "None";

  // Top category today (by amount)
  const todayCategoryTotals: Record<string, number> = {};
  todayExpenses.forEach((t) => {
    const catName = categoriesDbList.find(c => c.id === t.category_id)?.name || "Other";
    todayCategoryTotals[catName] = (todayCategoryTotals[catName] || 0) + t.amount;
  });
  const topCategoryToday = Object.keys(todayCategoryTotals).length > 0
    ? Object.entries(todayCategoryTotals).reduce((max, cur) => (cur[1] > max[1] ? cur : max))[0]
    : "None";

  // Top merchant today (by amount)
  const todayMerchantTotals: Record<string, number> = {};
  todayExpenses.forEach((t) => {
    // extract merchant name from notes or default
    const merchant = t.notes?.split("-")[0]?.trim() || "Merchant";
    todayMerchantTotals[merchant] = (todayMerchantTotals[merchant] || 0) + t.amount;
  });
  const topMerchantToday = Object.keys(todayMerchantTotals).length > 0
    ? Object.entries(todayMerchantTotals).reduce((max, cur) => (cur[1] > max[1] ? cur : max))[0]
    : "None";

  const averageExpenseToday = todayExpenses.length > 0 ? todaySpending / todayExpenses.length : 0;
  const purchaseCountToday = todayExpenses.length;

  // 2. Search Item History
  const matchedHistoryTxs = searchQuery.trim()
    ? transactions.filter((t) => {
        const query = searchQuery.toLowerCase();
        const noteMatch = t.notes?.toLowerCase().includes(query) || false;
        const catMatch = categoriesDbList.find(c => c.id === t.category_id)?.name?.toLowerCase().includes(query) || false;
        return noteMatch || catMatch;
      })
    : [];

  const historyExpenses = matchedHistoryTxs.filter((t) => t.type === "expense");
  const averageHistoryPrice = historyExpenses.length > 0
    ? historyExpenses.reduce((sum, t) => sum + t.amount, 0) / historyExpenses.length
    : 0;

  // Monthly frequency for history item
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const monthlyHistoryFrequency = historyExpenses.filter(
    (t) => new Date(t.date) >= thirtyDaysAgo
  ).length;

  return (
    <div className="space-y-6">
      {/* Dynamic Tab Switcher */}
      <div className="flex border-b border-zinc-900 pb-px">
        {(["monthly", "daily", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all select-none ${
              activeTab === tab
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab === "monthly" ? "Monthly Stats" : tab === "daily" ? "Daily Insights" : "Item History"}
          </button>
        ))}
      </div>

      {/* TAB 1: MONTHLY ANALYTICS */}
      {activeTab === "monthly" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Monthly Income</p>
              <p className="text-xl font-bold mt-1 text-emerald-400">₹{summary.monthIncome.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Monthly Expense</p>
              <p className="text-xl font-bold mt-1 text-rose-400">₹{summary.monthExpense.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Savings Rate</p>
              <p className="text-xl font-bold mt-1 text-indigo-400">{summary.savingsRate.toFixed(1)}%</p>
              <p className="text-[9px] text-zinc-600 mt-0.5">of income saved</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Net Cash Flow</p>
              <p className={`text-xl font-bold mt-1 ${summary.netCashFlow >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                ₹{summary.netCashFlow.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Cash Flow Trend Area Chart */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">📈 Cash Flow — Last 12 Months</p>
            <CashFlowChart data={cashflow} />
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">🥧 Spending by Category</p>
              <CategoryPieChart data={categoryBreakdown} />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">💰 Income vs Expenses</p>
              <IncomeExpenseBarChart data={cashflow} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY ANALYTICS & SUMMARY */}
      {activeTab === "daily" && (
        <div className="space-y-6">
          {/* AI Daily Summary statement */}
          <div className="bg-gradient-to-br from-indigo-900/20 to-zinc-900 border border-indigo-500/25 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">AI Daily Statement</span>
            </div>
            <p className="text-sm font-semibold text-zinc-200 leading-relaxed">
              {todaySpending > 0 
                ? `You spent ₹${todaySpending.toLocaleString()} today. Largest expense was ₹${largestExpenseAmount.toLocaleString()} under category "${topCategoryToday}". Most purchases were made in "${topCategoryToday}". You stayed within your daily savings budget.`
                : "No transaction events captured today. Tell Lumora AI or tap '+' below to log what you spend."
              }
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Today's Spending</p>
              <p className="text-xl font-bold mt-1 text-rose-400">₹{todaySpending.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Today's Income</p>
              <p className="text-xl font-bold mt-1 text-emerald-400">₹{todayIncome.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Today's Savings</p>
              <p className={`text-xl font-bold mt-1 ${todaySavings >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                ₹{todaySavings.toLocaleString()}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Avg Purchase Cost</p>
              <p className="text-xl font-bold mt-1 text-indigo-400">₹{averageExpenseToday.toFixed(0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Largest Expense</p>
              {largestExpenseTx ? (
                <div>
                  <h4 className="text-lg font-bold text-white">{largestExpenseTx.notes?.split("-")[0]?.trim() || "Item"}</h4>
                  <p className="text-2xl font-bold text-rose-400 mt-1">₹{largestExpenseTx.amount}</p>
                  <p className="text-[10px] text-zinc-500 mt-2">Category: {topCategoryToday}</p>
                </div>
              ) : (
                <p className="text-xs text-zinc-600">No expenses logged today.</p>
              )}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Top category & merchant</p>
              <div>
                <p className="text-xs text-zinc-500">Top Category</p>
                <h4 className="text-sm font-bold text-zinc-200 mt-0.5">{topCategoryToday}</h4>

                <p className="text-xs text-zinc-500 mt-3">Top Merchant</p>
                <h4 className="text-sm font-bold text-zinc-200 mt-0.5">{topMerchantToday}</h4>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Transaction activity</p>
              <div>
                <p className="text-xs text-zinc-500">Number of Purchases</p>
                <h4 className="text-2xl font-bold text-white mt-1">{purchaseCountToday}</h4>
                <p className="text-[10px] text-zinc-600 mt-2">Logged in ledger</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ITEM HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="itemSearch" className="text-xs text-zinc-400">Search purchased item history</Label>
            <div className="relative">
              <Search className="w-4.5 h-4.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="itemSearch"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="E.g., toffee, coffee, uber, rent..."
                className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 pl-9.5"
              />
            </div>
          </div>

          {searchQuery.trim() ? (
            <div className="space-y-5">
              {/* Aggregated item stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Average Price</p>
                  <p className="text-xl font-bold mt-1 text-indigo-400">₹{averageHistoryPrice.toFixed(2)}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Monthly Frequency</p>
                  <p className="text-xl font-bold mt-1 text-indigo-400">{monthlyHistoryFrequency} times</p>
                </div>
              </div>

              {/* Transactions list */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Matching Records ({matchedHistoryTxs.length})</p>
                <div className="space-y-2">
                  {matchedHistoryTxs.map((t) => {
                    const catName = categoriesDbList.find((c) => c.id === t.category_id)?.name || "Category";
                    return (
                      <div key={t.id} className="bg-zinc-900/60 border border-zinc-900 rounded-2xl p-4 flex justify-between items-center text-xs">
                        <div>
                          <h4 className="font-bold text-zinc-200">{t.notes?.split("-")[0]?.trim() || "Item"}</h4>
                          <span className="text-[10px] text-zinc-500">{t.date}</span>
                          <span className="text-[10px] text-zinc-500 ml-2">{t.time || ""}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold ${t.type === "income" ? "text-emerald-400" : "text-zinc-200"}`}>
                            {t.type === "income" ? "+" : "-"} ₹{t.amount}
                          </span>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{catName}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center select-none">
              <Search className="w-12 h-12 text-zinc-800 stroke-[1.5] mb-3" />
              <span className="text-sm font-semibold text-zinc-500">Search Item History</span>
              <p className="text-xs text-zinc-650 mt-1 max-w-[200px]">
                Enter any item keyword to see average prices, frequency, and chronological records.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
