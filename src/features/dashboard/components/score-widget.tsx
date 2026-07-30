import React from "react";
import { FinanceEngine } from "@/features/finance-engine/services/finance-engine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, ShieldAlert, CheckCircle2 } from "lucide-react";

interface ScoreWidgetProps {
  userId: string;
}

export async function ScoreWidget({ userId }: ScoreWidgetProps) {
  const scoreData = await FinanceEngine.getFinancialScore(userId);

  return (
    <Card className="bg-zinc-900 border-zinc-800 rounded-3xl overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Hero Analyzer</span>
            <CardTitle className="text-lg font-bold text-white mt-0.5">Financial Score</CardTitle>
          </div>
          <Activity className="w-5 h-5 text-indigo-400" />
        </div>
        <CardDescription className="text-xs text-zinc-500">
          Composite rating of your savings, budget, and recurring expense velocity.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-6">
        {/* Large Score Indicator */}
        <div className="flex items-center gap-6 bg-zinc-950/40 border border-zinc-850 p-4.5 rounded-2xl">
          <div className="w-18 h-18 rounded-full bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center shrink-0">
            <span className="text-3xl font-extrabold text-white font-mono leading-none">{scoreData.overallScore}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white">Grade Index</span>
              <span className="text-xs bg-indigo-500 text-zinc-950 font-extrabold px-1.5 py-0.25 rounded-md">
                {scoreData.grade}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-normal">
              Your overall rating is based on 4 independent scoring rules. Below are details.
            </p>
          </div>
        </div>

        {/* Factors list details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(scoreData.factors).map(([key, details]) => {
            const isGood = details.score >= 70;
            return (
              <div 
                key={key} 
                className="p-4 bg-zinc-950/20 border border-zinc-900 rounded-xl flex flex-col gap-2 hover:border-zinc-850 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <span className="text-zinc-500">Score:</span>
                    <span className={isGood ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {details.score}/100
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {details.reason}
                </p>
                <div className="flex items-start gap-1.5 mt-1 bg-zinc-900/40 p-2 rounded-lg border border-zinc-850">
                  {isGood ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <span className="text-[10px] text-zinc-500 leading-normal">
                    {details.suggestion}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function ScoreWidgetSkeleton() {
  return (
    <Card className="bg-zinc-900 border-zinc-800 rounded-3xl h-80 animate-pulse" />
  );
}
