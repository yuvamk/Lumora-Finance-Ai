"use client";

import React, { useState, useTransition } from "react";
import { BillingPeriod } from "../schemas";
import { createSubscriptionAction } from "../actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SubscriptionFormProps {
  categories: { id: string; name: string }[];
  onSuccess: () => void;
}

export function SubscriptionForm({ categories, onSuccess }: SubscriptionFormProps) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [nextDate, setNextDate] = useState("");
  const [category, setCategory] = useState(categories[0]?.id || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a subscription name.");
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid billing amount.");
      return;
    }

    startTransition(async () => {
      // Calculate next billing date fallback
      let resolvedNextDate = nextDate;
      if (!resolvedNextDate) {
        const next = new Date(startDate);
        if (period === "monthly") next.setMonth(next.getMonth() + 1);
        else if (period === "weekly") next.setDate(next.getDate() + 7);
        else if (period === "yearly") next.setFullYear(next.getFullYear() + 1);
        else next.setDate(next.getDate() + 1);
        resolvedNextDate = next.toISOString().slice(0, 10);
      }

      const response = await createSubscriptionAction({
        name,
        amount: Number(amount),
        billing_period: period,
        start_date: startDate,
        next_billing_date: resolvedNextDate,
        category_id: category,
        status: "active",
      });

      if (response.success) {
        toast.success("Subscription tracked successfully!");
        onSuccess();
      } else {
        toast.error(response.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-zinc-505 tracking-wider">Subscription Name</label>
        <input
          type="text"
          required
          placeholder="e.g. Netflix, Gym, Claude Pro..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-zinc-700 placeholder-zinc-600"
        />
      </div>

      {/* Amount & Category */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-zinc-505 tracking-wider">Billing Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">$</span>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-6.5 pr-3 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-zinc-505 tracking-wider">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-zinc-700"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cycle */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-zinc-505 tracking-wider">Billing period</label>
        <div className="grid grid-cols-4 bg-zinc-900/60 p-1 rounded-xl border border-zinc-850">
          {(["daily", "weekly", "monthly", "yearly"] as BillingPeriod[]).map((p) => (
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

      {/* Calendar Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-zinc-505 tracking-wider">Start Date</label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-zinc-700 text-zinc-350"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-zinc-505 tracking-wider">Next Renewal</label>
          <input
            type="date"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-zinc-700 text-zinc-350"
          />
        </div>
      </div>

      {/* Actions */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl font-bold py-2.5 mt-2"
      >
        {isPending ? "Recording..." : "Track Subscription"}
      </Button>
    </form>
  );
}
