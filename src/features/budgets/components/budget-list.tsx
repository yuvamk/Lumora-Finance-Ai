"use client";

import React, { useState, useTransition } from "react";
import { BudgetProgress } from "@/types/financial/contracts";
import { deleteBudgetAction } from "../actions";
import { BudgetForm } from "./budget-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ShieldAlert, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface BudgetListProps {
  initialBudgets: BudgetProgress[];
  categories: { id: string; name: string }[];
}

export function BudgetList({ initialBudgets, categories }: BudgetListProps) {
  const [budgets, setBudgets] = useState<BudgetProgress[]>(initialBudgets);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Metrics rollups
  const totalLimit = budgets.reduce((acc, curr) => acc + curr.limitAmount, 0);
  const totalSpent = budgets.reduce((acc, curr) => acc + curr.spentAmount, 0);
  const remaining = totalLimit - totalSpent;
  const overallUtilization = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const response = await deleteBudgetAction(id);
      if (response.success) {
        setBudgets((prev) => prev.filter((b) => b.budgetId !== id));
        toast.success("Budget limit deleted.");
      } else {
        toast.error(response.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Metrics Card Rollup */}
      <Card className="bg-zinc-900 border-zinc-800 rounded-3xl overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-baseline">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Overall Limit</span>
              <h2 className="text-3xl font-extrabold text-white mt-1 font-mono">
                ${totalSpent.toFixed(2)} <span className="text-sm font-medium text-zinc-500">/ ${totalLimit.toFixed(2)}</span>
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Remaining Allowance</span>
              <p className={`text-sm font-bold font-mono mt-1 ${remaining >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                ${remaining.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              style={{ width: `${Math.min(100, overallUtilization)}%` }} 
              className={`h-full rounded-full transition-all duration-300 ${
                overallUtilization >= 100 ? "bg-rose-500" : overallUtilization >= 85 ? "bg-amber-500" : "bg-indigo-500"
              }`}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
            <span>Overall Utilization</span>
            <span>{overallUtilization.toFixed(1)}%</span>
          </div>

          {/* Warning Banner alerts */}
          {overallUtilization >= 90 && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-400">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
              <span className="text-xs font-semibold">
                Critical Alert: Total spending has exceeded 90% of overall limits!
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Budgets grid cards list */}
      <div className="space-y-4">
        <div className="flex justify-between items-center select-none">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Category Limits</h3>
          <Button
            onClick={() => setIsFormOpen(true)}
            size="sm"
            className="bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Configure</span>
          </Button>
        </div>

        {budgets.length === 0 ? (
          <div className="py-16 text-center bg-zinc-900/20 border border-zinc-900 border-dashed rounded-3xl">
            <span className="text-xs text-zinc-500">No active category limits set. Tap configure.</span>
          </div>
        ) : (
          budgets.map((b) => {
            const isBreached = b.spentAmount >= b.limitAmount;
            const isWarning = b.spentAmount >= b.limitAmount * b.warningThreshold && !isBreached;
            const statusColor = isBreached ? "border-rose-500/20 bg-rose-500/5 text-rose-400" : isWarning ? "border-amber-500/20 bg-amber-500/5 text-amber-400" : "border-zinc-850 bg-zinc-900/40 text-zinc-400";

            return (
              <div 
                key={b.budgetId}
                className="p-4 bg-zinc-900/60 border border-zinc-900 rounded-2xl space-y-3 relative group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div 
                      style={{ backgroundColor: `${b.color}15`, border: `1px solid ${b.color}35` }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    >
                      {b.categoryName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white leading-tight">{b.categoryName}</h4>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase">{b.period} cycle</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-zinc-200">
                      ${b.spentAmount.toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-600 block font-mono">
                      Limit: ${b.limitAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-zinc-850 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${Math.min(100, b.utilizationPercentage)}%` }} 
                    style-color={b.color}
                    className="h-full bg-indigo-500 rounded-full transition-all"
                  />
                </div>

                {/* Status warning banner */}
                {(isWarning || isBreached) && (
                  <div className={`p-2.5 border rounded-xl flex items-center gap-2 text-[10px] font-semibold leading-normal ${statusColor}`}>
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isBreached 
                        ? `Exceeded category limit by $${Math.abs(b.remainingAmount).toFixed(2)}!`
                        : `Warning: Spending has crossed the ${Math.round(b.warningThreshold * 100)}% alert threshold.`
                      }
                    </span>
                  </div>
                )}

                {/* Rollover indicators */}
                {b.carryForward && (
                  <div className="flex items-center gap-1 text-[9px] text-indigo-400 font-mono font-semibold">
                    <RefreshCw className="w-3 h-3" />
                    <span>Rollover Carry Forward Enabled</span>
                  </div>
                )}

                <button 
                  onClick={() => handleDelete(b.budgetId)}
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

      {/* Slide Drawer Setup Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-850 rounded-3xl p-6 max-w-sm w-[90%] mx-auto">
          <DialogHeader className="text-left pb-2 text-white">
            <DialogTitle className="text-lg font-bold">Configure Limit</DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Establish spending limit boundaries for category accounts.
            </DialogDescription>
          </DialogHeader>
          <BudgetForm 
            categories={categories}
            onSuccess={() => {
              setIsFormOpen(false);
              // Fetch data or reload location
              window.location.reload();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
