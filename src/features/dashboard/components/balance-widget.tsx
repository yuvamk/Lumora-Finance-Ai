import React from "react";
import { FinanceEngine } from "@/features/finance-engine/services/finance-engine";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface BalanceWidgetProps {
  userId: string;
}

export async function BalanceWidget({ userId }: BalanceWidgetProps) {
  const supabase = await createClient();
  
  // Fetch summaries and base currency preferences from settings
  const [summary, { data: userSettings }] = await Promise.all([
    FinanceEngine.getFinancialSummary(userId),
    supabase
      .from("settings")
      .select("base_currency_symbol")
      .eq("user_id", userId)
      .single()
  ]);

  const symbol = userSettings?.base_currency_symbol || "₹";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Current Balance Card */}
      <Card className="bg-white/[0.03] backdrop-blur-xl border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.04] transition-all rounded-3xl overflow-hidden relative">
        <CardContent className="p-6">
          <span className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider">Net Worth Balance</span>
          <h2 className="text-3xl font-bold text-white mt-1.5 font-mono">
            {symbol}{summary.currentBalance.toFixed(2)}
          </h2>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-zinc-550 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-zinc-650" />
            <span>Telemetry: {summary.metrics.databaseTimeMs}ms query speed</span>
          </div>
        </CardContent>
      </Card>
 
      {/* Monthly Income Card */}
      <Card className="bg-white/[0.03] backdrop-blur-xl border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.04] transition-all rounded-3xl">
        <CardContent className="p-6">
          <span className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider">Month Income</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <h2 className="text-3xl font-bold text-white font-mono">
              {symbol}{summary.monthIncome.toFixed(2)}
            </h2>
            <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Inflow</span>
            </div>
          </div>
        </CardContent>
      </Card>
 
      {/* Monthly Expense Card */}
      <Card className="bg-white/[0.03] backdrop-blur-xl border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.04] transition-all rounded-3xl">
        <CardContent className="p-6">
          <span className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider">Month Expense</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <h2 className="text-3xl font-bold text-white font-mono">
              {symbol}{summary.monthExpense.toFixed(2)}
            </h2>
            <div className="bg-rose-500/10 text-rose-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Outflow</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function BalanceWidgetSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-28 bg-white/[0.02] border border-white/[0.06] rounded-3xl animate-pulse" />
      ))}
    </div>
  );
}
