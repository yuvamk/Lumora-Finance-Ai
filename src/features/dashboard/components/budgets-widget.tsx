import React from "react";
import { FinanceRepository } from "@/features/finance-engine/repositories/finance.repository";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface BudgetsWidgetProps {
  userId: string;
}

export async function BudgetsWidget({ userId }: BudgetsWidgetProps) {
  const { data: budgets } = await FinanceRepository.getBudgetsProgress(userId);

  return (
    <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Limits Tracker</span>
            <CardTitle className="text-lg font-bold text-white mt-0.5">Budget Utilization</CardTitle>
          </div>
          <Activity className="w-5 h-5 text-zinc-500" />
        </div>
        <CardDescription className="text-xs text-zinc-500">
          Monthly expenditure thresholds monitored in real-time.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        {budgets.length === 0 ? (
          <div className="py-8 text-center">
            <span className="text-xs text-zinc-500">No active budgets found. Setup limits inside settings.</span>
          </div>
        ) : (
          budgets.map((b) => {
            const isBreached = b.utilizationPercentage >= 100;
            const isWarning = b.utilizationPercentage >= 85 && b.utilizationPercentage < 100;
            const barColor = isBreached ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-indigo-500";

            return (
              <div key={b.budgetId} className="space-y-1.5 p-3.5 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-zinc-200">{b.categoryName}</span>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    <span>${b.spentAmount.toFixed(2)}</span>
                    <span className="text-zinc-650 mx-1">/</span>
                    <span>${b.limitAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="w-full h-2 bg-zinc-850 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${Math.min(100, b.utilizationPercentage)}%` }} 
                    className={`h-full ${barColor} rounded-full`}
                  />
                </div>

                <div className="flex items-center justify-between mt-1 text-[9px] font-mono">
                  <span className="text-zinc-500">{b.period} cycle</span>
                  <span className={`${isBreached ? "text-rose-400 font-bold" : isWarning ? "text-amber-400 font-bold" : "text-zinc-500"}`}>
                    {b.utilizationPercentage.toFixed(1)}% limit
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export function BudgetsWidgetSkeleton() {
  return (
    <Card className="bg-zinc-900 border-zinc-800 rounded-3xl h-64 animate-pulse" />
  );
}
