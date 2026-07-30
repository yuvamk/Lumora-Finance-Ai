"use client";

import React, { useState, useTransition } from "react";
import { recordGoalTransactionAction } from "../actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GoalTransactionFormProps {
  goalId: string;
  onSuccess: () => void;
}

export function GoalTransactionForm({ goalId, onSuccess }: GoalTransactionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [txType, setTxType] = useState<"deposit" | "withdrawal">("deposit");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a positive numeric amount.");
      return;
    }

    startTransition(async () => {
      const response = await recordGoalTransactionAction(goalId, {
        amount: Number(amount),
        type: txType,
      });

      if (response.success) {
        toast.success(txType === "deposit" ? "Deposit recorded! 🎉" : "Withdrawal recorded.");
        onSuccess();
      } else {
        toast.error(response.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      {/* Type selection tabs */}
      <div className="grid grid-cols-2 bg-zinc-900/60 p-1 rounded-xl border border-zinc-850">
        {(["deposit", "withdrawal"] as const).map((type) => (
          <button
            type="button"
            key={type}
            onClick={() => setTxType(type)}
            className={`text-xs font-semibold py-1.5 rounded-lg capitalize transition-colors ${
              txType === type 
                ? "bg-zinc-800 text-white" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Numeric Amount */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">$</span>
          <input
            type="number"
            step="0.01"
            required
            placeholder="0.00"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-8 pr-4 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
          />
        </div>
      </div>

      {/* Actions */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl font-bold py-2.5 mt-2"
      >
        {isPending ? "Recording..." : txType === "deposit" ? "Record Deposit" : "Record Withdrawal"}
      </Button>
    </form>
  );
}
