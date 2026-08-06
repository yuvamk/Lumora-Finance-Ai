"use client";

import React, { useState, useTransition } from "react";
import { BudgetPeriod } from "../schemas";
import { createBudgetAction } from "../actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BudgetFormProps {
  categories: { id: string; name: string }[];
  onSuccess: () => void;
}

export function BudgetForm({ categories, onSuccess }: BudgetFormProps) {
  const [isPending, startTransition] = useTransition();

  const [limit, setLimit] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>("monthly");
  const [category, setCategory] = useState(categories[0]?.id || "");
  const [color, setColor] = useState("#6366f1");
  const [carryForward, setCarryForward] = useState(false);
  const [threshold, setThreshold] = useState(0.85);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit || isNaN(Number(limit))) {
      toast.error("Please enter a valid numeric limit.");
      return;
    }
    if (!category) {
      toast.error("Please select a category for this budget.");
      return;
    }

    startTransition(async () => {
      const response = await createBudgetAction({
        limit_amount: Number(limit),
        period,
        category_id: category,
        start_date: new Date().toISOString().slice(0, 10),
        color,
        carry_forward: carryForward,
        warning_threshold: threshold,
      });

      if (response.success) {
        toast.success("Budget threshold configured!");
        onSuccess();
      } else {
        toast.error(response.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      {/* Category Selection */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Category</label>
        {categories.length === 0 ? (
          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-zinc-500">
            No categories found — add categories in Settings first.
          </div>
        ) : (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-zinc-700 cursor-pointer"
          >
            <option value="" className="bg-zinc-950 text-zinc-400">— Select a Category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Limit Input */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Budget Limit</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">$</span>
          <input
            type="number"
            step="0.01"
            required
            placeholder="0.00"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-8 pr-4 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
          />
        </div>
      </div>

      {/* Period Selection */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Period cycle</label>
        <div className="grid grid-cols-4 bg-zinc-900/60 p-1 rounded-xl border border-zinc-850">
          {(["daily", "weekly", "monthly", "yearly"] as BudgetPeriod[]).map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-[10px] font-bold py-1.5 rounded-lg capitalize transition-colors ${
                period === p 
                  ? "bg-zinc-800 text-white" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Colors Selectors */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Highlight Color</label>
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

      {/* Warning Threshold Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline">
          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Alert Threshold</label>
          <span className="text-[10px] font-mono text-zinc-400">{Math.round(threshold * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.50"
          max="1.00"
          step="0.05"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Carry Forward Toggles */}
      <div className="flex items-center justify-between p-3.5 bg-zinc-900/60 border border-zinc-850 rounded-xl">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-zinc-200">Carry Forward Surplus</span>
          <span className="text-[9px] text-zinc-500">Rollover remaining balances to next cycle.</span>
        </div>
        <input
          type="checkbox"
          checked={carryForward}
          onChange={(e) => setCarryForward(e.target.checked)}
          className="w-4 h-4 rounded border-zinc-800 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl font-bold py-2.5 mt-2"
      >
        {isPending ? "Configuring..." : "Establish Budget Limit"}
      </Button>
    </form>
  );
}
