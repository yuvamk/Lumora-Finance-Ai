import React from "react";
import { BalanceWidgetSkeleton } from "@/features/dashboard/components/balance-widget";
import { ScoreWidgetSkeleton } from "@/features/dashboard/components/score-widget";
import { BudgetsWidgetSkeleton } from "@/features/dashboard/components/budgets-widget";
import { GoalsWidgetSkeleton } from "@/features/dashboard/components/goals-widget";
import { SubscriptionsWidgetSkeleton } from "@/features/dashboard/components/subscriptions-widget";
import { DailySummaryWidgetSkeleton } from "@/features/dashboard/components/daily-summary-widget";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 pb-28 space-y-6">
      {/* Header Panel Skeleton */}
      <div className="space-y-2 select-none">
        <div className="h-3 w-16 bg-zinc-900 rounded-md animate-pulse" />
        <div className="h-7 w-32 bg-zinc-900 rounded-md animate-pulse" />
      </div>

      {/* Main Grid Widgets Container Skeleton */}
      <div className="space-y-4">
        {/* Row 1: Balance Summaries Skeleton */}
        <BalanceWidgetSkeleton />

        {/* Row 1.5: Today's Daily Analytics and AI Daily summary Skeleton */}
        <DailySummaryWidgetSkeleton />

        {/* Row 2: Quick Actions Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-zinc-900 border border-zinc-800/60 rounded-2xl" />
          ))}
        </div>

        {/* Row 3: Score Widget Skeleton */}
        <ScoreWidgetSkeleton />

        {/* Row 4: Budgets & Goals Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BudgetsWidgetSkeleton />
          <GoalsWidgetSkeleton />
        </div>

        {/* Row 5: Subscriptions Skeleton */}
        <SubscriptionsWidgetSkeleton />
      </div>
    </div>
  );
}
