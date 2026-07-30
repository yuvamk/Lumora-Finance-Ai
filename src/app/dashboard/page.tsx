import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { 
  BalanceWidget, 
  BalanceWidgetSkeleton 
} from "@/features/dashboard/components/balance-widget";
import { 
  ScoreWidget, 
  ScoreWidgetSkeleton 
} from "@/features/dashboard/components/score-widget";
import { 
  BudgetsWidget, 
  BudgetsWidgetSkeleton 
} from "@/features/dashboard/components/budgets-widget";
import { 
  GoalsWidget, 
  GoalsWidgetSkeleton 
} from "@/features/dashboard/components/goals-widget";
import {
  SubscriptionsWidget,
  SubscriptionsWidgetSkeleton,
} from "@/features/dashboard/components/subscriptions-widget";
import Link from "next/link";
import { 
  DailySummaryWidget, 
  DailySummaryWidgetSkeleton 
} from "@/features/dashboard/components/daily-summary-widget";
import { QuickActionsWidget } from "@/features/dashboard/components/quick-actions-widget";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 pb-28">
      {/* Header Panel */}
      <header className="mb-6 select-none">
        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Dashboard</span>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
      </header>

      {/* Main Grid Widgets Container */}
      <div className="space-y-4">
        {/* Row 1: Balance Summaries */}
        <Suspense fallback={<BalanceWidgetSkeleton />}>
          <BalanceWidget userId={user.id} />
        </Suspense>

        {/* Row 1.5: Today's Daily Analytics and AI Daily summary */}
        <Suspense fallback={<DailySummaryWidgetSkeleton />}>
          <DailySummaryWidget userId={user.id} />
        </Suspense>

        {/* Row 2: Quick Navigation Actions */}
        <QuickActionsWidget />

        {/* Row 3: Hero Scoring Widget */}
        <Suspense fallback={<ScoreWidgetSkeleton />}>
          <ScoreWidget userId={user.id} />
        </Suspense>

        {/* Row 4: Budgets & Goals Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Suspense fallback={<BudgetsWidgetSkeleton />}>
            <BudgetsWidget userId={user.id} />
          </Suspense>

          <Suspense fallback={<GoalsWidgetSkeleton />}>
            <GoalsWidget userId={user.id} />
          </Suspense>
        </div>

        {/* Row 5: Subscriptions Overview */}
        <Suspense fallback={<SubscriptionsWidgetSkeleton />}>
          <SubscriptionsWidget userId={user.id} />
        </Suspense>

        {/* AI Copilot CTA banner */}
        <Link href="/insights" className="block">
          <div className="bg-gradient-to-r from-indigo-600/15 to-violet-600/10 border border-indigo-500/20 hover:border-indigo-500/40 rounded-3xl p-5 flex items-center justify-between cursor-pointer transition-all">
            <div>
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">AI Copilot</p>
              <h3 className="text-sm font-bold text-white mt-0.5">Ask Lumora AI anything</h3>
              <p className="text-[10px] text-zinc-500 mt-1 leading-snug">
                Powered by Claude — explains your finances in plain language.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0 ml-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

