import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportsRepository } from "@/features/reports/repository";
import { FinanceEngine } from "@/features/finance-engine/services/finance-engine";
import { FinanceRepository } from "@/features/finance-engine/repositories/finance.repository";
import { CashFlowChart, CategoryPieChart, IncomeExpenseBarChart } from "@/features/reports/components/charts";
import { ExportButton } from "@/features/reports/components/export-button";
import { BarChart3, TrendingUp, PieChart, Target, CreditCard } from "lucide-react";

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">{title}</p>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color = "text-white" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );
}

import { TransactionRepository } from "@/features/transactions/repository";
import { ReportsTabsClient } from "@/features/reports/components/reports-tabs-client";

async function ReportsContent({ userId }: { userId: string }) {
  const supabase = await createClient();
  const [summary, cashflow, categoryBreakdown, budgets, goals, transactionsList, categoriesDb] = await Promise.all([
    FinanceEngine.getFinancialSummary(userId),
    ReportsRepository.getCashflow(userId),
    ReportsRepository.getCategoryBreakdown(userId),
    FinanceRepository.getBudgetsProgress(userId),
    FinanceRepository.getGoalsProgress(userId),
    TransactionRepository.getTransactions(userId, {}),
    supabase.from("categories").select("id, name").is("deleted_at", null),
  ]);

  return (
    <ReportsTabsClient
      userId={userId}
      summary={summary}
      cashflow={cashflow}
      categoryBreakdown={categoryBreakdown}
      budgets={budgets.data}
      goals={goals.data}
      transactions={transactionsList}
      categoriesDbList={categoriesDb.data || []}
    />
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 h-20 animate-pulse" />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 h-64 animate-pulse" />
      ))}
    </div>
  );
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-transparent text-white p-4 md:p-6 pb-28">
      <header className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Analytics</span>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Reports
          </h1>
        </div>
        <ExportButton userId={user.id} />
      </header>

      <Suspense fallback={<ReportsSkeleton />}>
        <ReportsContent userId={user.id} />
      </Suspense>
    </div>
  );
}
