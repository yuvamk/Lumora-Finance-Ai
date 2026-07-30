import React from "react";
import { FinanceRepository } from "@/features/finance-engine/repositories/finance.repository";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Calendar } from "lucide-react";

interface GoalsWidgetProps {
  userId: string;
}

export async function GoalsWidget({ userId }: GoalsWidgetProps) {
  const { data: goals } = await FinanceRepository.getGoalsProgress(userId);

  return (
    <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Targets</span>
            <CardTitle className="text-lg font-bold text-white mt-0.5">Savings Goals</CardTitle>
          </div>
          <Sparkles className="w-5 h-5 text-zinc-500" />
        </div>
        <CardDescription className="text-xs text-zinc-500">
          Monitor goal progress percentages and savings buffers.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        {goals.length === 0 ? (
          <div className="py-8 text-center">
            <span className="text-xs text-zinc-500">No active savings targets.</span>
          </div>
        ) : (
          goals.map((g) => {
            const isCompleted = g.progressPercentage >= 100;
            const barColor = isCompleted ? "bg-emerald-500" : "bg-indigo-500";

            return (
              <div key={g.goalId} className="space-y-1.5 p-3.5 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-zinc-200">{g.name}</span>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    <span>${g.totalSaved.toFixed(2)}</span>
                    <span className="text-zinc-650 mx-1">/</span>
                    <span>${g.targetAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="w-full h-2 bg-zinc-850 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${Math.min(100, g.progressPercentage)}%` }} 
                    className={`h-full ${barColor} rounded-full`}
                  />
                </div>

                <div className="flex items-center justify-between mt-1 text-[9px] font-mono">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-600" />
                    Target: {new Date(g.targetDate).toLocaleDateString()}
                  </span>
                  <span className={`${isCompleted ? "text-emerald-400 font-bold" : "text-zinc-500"}`}>
                    {g.progressPercentage.toFixed(1)}% complete
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

export function GoalsWidgetSkeleton() {
  return (
    <Card className="bg-zinc-900 border-zinc-800 rounded-3xl h-64 animate-pulse" />
  );
}
