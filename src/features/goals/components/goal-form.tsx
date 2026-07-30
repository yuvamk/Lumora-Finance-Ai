"use client";

import React, { useState, useTransition } from "react";
import { GoalPriority } from "../schemas";
import { createGoalAction } from "../actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GoalFormProps {
  onSuccess: () => void;
}

export function GoalForm({ onSuccess }: GoalFormProps) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [priority, setPriority] = useState<GoalPriority>("medium");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a goal name.");
      return;
    }
    if (!targetAmount || isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      toast.error("Please enter a valid positive target amount.");
      return;
    }

    startTransition(async () => {
      const response = await createGoalAction({
        name,
        target_amount: Number(targetAmount),
        current_balance: currentBalance ? Number(currentBalance) : 0,
        target_date: targetDate || new Date(new Date().getFullYear() + 1, 0, 1).toISOString().slice(0, 10),
        color,
        priority,
        notes: notes || undefined,
      });

      if (response.success) {
        toast.success("Savings target established!");
        onSuccess();
      } else {
        toast.error(response.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      {/* Goal Name */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Goal Name</label>
        <input
          type="text"
          required
          placeholder="e.g. Emergency Fund, New Laptop..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-zinc-700 placeholder-zinc-655"
        />
      </div>

      {/* Targets */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Target Amount</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500">$</span>
            <input
              type="number"
              required
              step="1"
              placeholder="1000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-7 pr-3 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Starting Balance</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500">$</span>
            <input
              type="number"
              step="1"
              placeholder="0"
              value={currentBalance}
              onChange={(e) => setCurrentBalance(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-7 pr-3 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Target Date */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Target Completion Date</label>
        <input
          type="date"
          required
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-zinc-700 text-zinc-350"
        />
      </div>

      {/* Priority Selection */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Priority Level</label>
        <div className="grid grid-cols-4 bg-zinc-900/60 p-1 rounded-xl border border-zinc-850">
          {(["low", "medium", "high", "critical"] as GoalPriority[]).map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setPriority(p)}
              className={`text-[10px] font-bold py-1.5 rounded-lg capitalize transition-colors ${
                priority === p 
                  ? "bg-zinc-800 text-white" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Cover Color Pickers */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Cover Accent Color</label>
        <div className="flex gap-2">
          {["#6366f1", "#10b981", "#ef4444", "#f59e0b", "#a855f7"].map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                color === c ? "border-white scale-110" : "border-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Goal Notes */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Goal Notes (Optional)</label>
        <textarea
          placeholder="e.g. For flights, hotels, and emergency buffers..."
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-zinc-700 placeholder-zinc-600 resize-none"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl font-bold py-2.5 mt-2"
      >
        {isPending ? "Creating..." : "Establish Savings Goal"}
      </Button>
    </form>
  );
}
