import React from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Calendar, TrendingUp, Clock, AlertTriangle, ArrowUpRight } from "lucide-react";

interface DailySummaryWidgetProps {
  userId: string;
}

export async function DailySummaryWidget({ userId }: DailySummaryWidgetProps) {
  const supabase = await createClient();
  const todayStr = new Date().toISOString().slice(0, 10);
  const startOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  // Fetch transactions for today
  const { data: todayTxs } = await supabase
    .from("transactions")
    .select("*, categories(name)")
    .eq("user_id", userId)
    .eq("date", todayStr)
    .is("deleted_at", null);

  // Fetch transactions for this month to calculate monthly spending
  const { data: monthTxs } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("date", startOfMonthStr)
    .is("deleted_at", null);

  // Fetch recent 3 transactions
  const { data: recentTxs } = await supabase
    .from("transactions")
    .select("*, categories(name)")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch upcoming bills from active subscriptions
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("next_billing_date", { ascending: true })
    .limit(2);

  const expenses = (todayTxs || []).filter((t) => t.type === "expense");
  const incomes = (todayTxs || []).filter((t) => t.type === "income");

  const todaySpending = expenses.reduce((sum, t) => sum + t.amount, 0);
  const todayIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
  const todaySavings = todayIncome - todaySpending;

  const monthSpending = (monthTxs || []).reduce((sum, t) => sum + t.amount, 0);

  // Largest expense today
  const largestExpense = expenses.length > 0
    ? expenses.reduce((max, t) => (t.amount > max.amount ? t : max), expenses[0])
    : null;

  // Top category today
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((t) => {
    const catName = t.categories?.name || "Other";
    categoryTotals[catName] = (categoryTotals[catName] || 0) + t.amount;
  });
  const topCategoryToday = Object.keys(categoryTotals).length > 0
    ? Object.entries(categoryTotals).reduce((max, cur) => (cur[1] > max[1] ? cur : max))[0]
    : "None";

  // AI Daily Summary Statement
  const hasExpenses = expenses.length > 0;
  const aiSummaryText = hasExpenses
    ? `You spent ₹${todaySpending.toLocaleString()} today. Largest expense: ₹${largestExpense?.amount.toLocaleString()} for ${largestExpense?.notes?.split(" | ")[0]?.replace("Purchased: ", "") || "Item"}. Most purchases were in "${topCategoryToday}". You stayed within your budget.`
    : "No transaction events captured today. Tap the bottom-left '+' button to quick add a transaction!";

  return (
    <div className="space-y-4">
      {/* Today's & Monthly Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-zinc-900/60 border-zinc-800/80 rounded-2xl">
          <CardContent className="p-4">
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Today's Spending</span>
            <p className="text-base font-bold text-rose-400 mt-1 font-mono">₹{todaySpending}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/60 border-zinc-800/80 rounded-2xl">
          <CardContent className="p-4">
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Today's Income</span>
            <p className="text-base font-bold text-emerald-400 mt-1 font-mono">₹{todayIncome}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/60 border-zinc-800/80 rounded-2xl">
          <CardContent className="p-4">
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Today's Savings</span>
            <p className={`text-base font-bold mt-1 font-mono ${todaySavings >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              ₹{todaySavings}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/60 border-zinc-800/80 rounded-2xl">
          <CardContent className="p-4">
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Month Spending</span>
            <p className="text-base font-bold text-indigo-400 mt-1 font-mono">₹{monthSpending}</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Daily Statement Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">AI Daily Statement</span>
        </div>
        <p className="text-xs text-zinc-200 leading-relaxed font-semibold">
          {aiSummaryText}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Transactions List */}
        <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
          <CardContent className="p-5 space-y-3.5">
            <div className="flex justify-between items-center pb-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recent Logs</span>
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="space-y-3">
              {recentTxs && recentTxs.length > 0 ? (
                recentTxs.map((t) => (
                  <div key={t.id} className="flex justify-between items-center text-xs gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-zinc-200 truncate" title={t.notes || "Item"}>
                        {t.notes?.split(" | ")[0]?.replace("Purchased: ", "") || "Item"}
                      </h4>
                      <span className="text-[9px] text-zinc-500 font-mono">{t.date}</span>
                    </div>
                    <span className={`font-mono font-bold shrink-0 ${t.type === "income" ? "text-emerald-400" : "text-zinc-300"}`}>
                      {t.type === "income" ? "+" : "-"} ₹{t.amount}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-zinc-650">No transaction logs recorded yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bills List */}
        <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
          <CardContent className="p-5 space-y-3.5">
            <div className="flex justify-between items-center pb-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Upcoming Bills</span>
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="space-y-3">
              {subscriptions && subscriptions.length > 0 ? (
                subscriptions.map((s) => (
                  <div key={s.id} className="flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-semibold text-zinc-200">{s.name}</h4>
                      <span className="text-[9px] text-rose-400 font-mono">Due: {s.next_billing_date}</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-300">
                      ₹{s.amount}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-zinc-650">No upcoming active bills detected.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DailySummaryWidgetSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-zinc-900 rounded-2xl border border-zinc-800/60" />
        ))}
      </div>
      <div className="h-24 bg-zinc-900 rounded-3xl border border-zinc-800/60" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-32 bg-zinc-900 rounded-3xl border border-zinc-800/60" />
        <div className="h-32 bg-zinc-900 rounded-3xl border border-zinc-800/60" />
      </div>
    </div>
  );
}
