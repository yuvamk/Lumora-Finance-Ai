"use client";

import React, { useState, useTransition } from "react";
import { GoalProgressContract } from "@/types/financial/contracts";
import { deleteGoalAction } from "../actions";
import { GoalForm } from "./goal-form";
import { GoalTransactionForm } from "./goal-transaction-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ArrowUpRight, Trophy, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface GoalListProps {
  initialGoals: GoalProgressContract[];
}

export function GoalList({ initialGoals }: GoalListProps) {
  const [goals, setGoals] = useState<GoalProgressContract[]>(initialGoals);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Metrics rollups
  const totalTarget = goals.reduce((acc, curr) => acc + curr.targetAmount, 0);
  const totalSaved = goals.reduce((acc, curr) => acc + curr.totalSaved, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const response = await deleteGoalAction(id);
      if (response.success) {
        setGoals((prev) => prev.filter((g) => g.goalId !== id));
        toast.success("Goal deleted.");
      } else {
        toast.error(response.error);
      }
    });
  };

  const handleTxOpen = (id: string) => {
    setSelectedGoalId(id);
    setIsTxOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Overall Progress Header Card */}
      <Card className="bg-zinc-900 border-zinc-800 rounded-3xl overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-baseline">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Goal Targets</span>
              <h2 className="text-3xl font-extrabold text-white mt-1 font-mono">
                ${totalSaved.toFixed(2)} <span className="text-sm font-medium text-zinc-500">/ ${totalTarget.toFixed(2)}</span>
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Overall Progress</span>
              <p className="text-sm font-extrabold text-white font-mono mt-1">
                {overallProgress.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-zinc-850 rounded-full overflow-hidden">
            <div 
              style={{ width: `${Math.min(100, overallProgress)}%` }} 
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Goals list */}
      <div className="space-y-4">
        <div className="flex justify-between items-center select-none">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Savings targets</h3>
          <Button
            onClick={() => setIsFormOpen(true)}
            size="sm"
            className="bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Establish Target</span>
          </Button>
        </div>

        {goals.length === 0 ? (
          <div className="py-16 text-center bg-zinc-900/20 border border-zinc-900 border-dashed rounded-3xl">
            <span className="text-xs text-zinc-500">No active savings targets set. Tap Establish Target.</span>
          </div>
        ) : (
          goals.map((g) => {
            const isCompleted = g.progressPercentage >= 100;

            return (
              <div 
                key={g.goalId}
                className="p-5 bg-zinc-900/60 border border-zinc-900 rounded-3xl space-y-4 relative group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3.5">
                    <div 
                      style={{ backgroundColor: `${g.color}15`, border: `1px solid ${g.color}35` }}
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                    >
                      {g.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white leading-tight">{g.name}</h4>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase mt-0.5 block">
                        Priority: {g.priority}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-zinc-200">
                      ${g.totalSaved.toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-600 block font-mono">
                      Target: ${g.targetAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-zinc-850 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${Math.min(100, g.progressPercentage)}%` }} 
                    style-color={g.color}
                    className="h-full bg-emerald-500 rounded-full transition-all"
                  />
                </div>

                <div className="flex items-center justify-between mt-1 text-[9px] font-mono text-zinc-500">
                  <span>Target Date: {new Date(g.targetDate).toLocaleDateString()}</span>
                  <span>{g.progressPercentage.toFixed(1)}% Saved</span>
                </div>

                {/* AI / Suggestion Recommendation message */}
                {!isCompleted && g.suggestedMonthlySavings > 0 && (
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-2 text-[10px] leading-relaxed text-zinc-400">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      Save **$${g.suggestedMonthlySavings.toFixed(2)}/month** to hit this goal in {g.monthsRemaining} months.
                    </span>
                  </div>
                )}

                {/* Celebration Banner status */}
                {isCompleted && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5 text-emerald-400">
                    <Trophy className="w-4.5 h-4.5 shrink-0 animate-bounce" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Goal Completed! Excellent buffer compiled! 🎉
                    </span>
                  </div>
                )}

                {/* Deposit / Withdraw Action buttons */}
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => handleTxOpen(g.goalId)}
                    size="sm"
                    className="flex-1 bg-zinc-950 border border-zinc-850 text-zinc-300 hover:text-white rounded-xl py-1.5 h-auto text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <ArrowUpRight className="w-4 h-4 text-zinc-500" />
                    <span>Deposit / Withdraw</span>
                  </Button>
                </div>

                <button 
                  onClick={() => handleDelete(g.goalId)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 absolute right-3 top-3 bg-zinc-950/60 hover:bg-red-950/60 p-2 rounded-xl text-zinc-500 hover:text-red-400 border border-zinc-850 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Slide Drawer Setup Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-850 rounded-3xl p-6 max-w-sm w-[90%] mx-auto">
          <DialogHeader className="text-left pb-2 text-white">
            <DialogTitle className="text-lg font-bold">New Goal</DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Set savings goals targets to configure safety deposits.
            </DialogDescription>
          </DialogHeader>
          <GoalForm 
            onSuccess={() => {
              setIsFormOpen(false);
              window.location.reload();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Deposit Transaction Modal */}
      <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-850 rounded-3xl p-6 max-w-sm w-[90%] mx-auto">
          <DialogHeader className="text-left pb-2 text-white">
            <DialogTitle className="text-lg font-bold">Goal Transaction</DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Record a manual deposit or withdrawal from this goal buffer.
            </DialogDescription>
          </DialogHeader>
          {selectedGoalId && (
            <GoalTransactionForm 
              goalId={selectedGoalId}
              onSuccess={() => {
                setIsTxOpen(false);
                window.location.reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
