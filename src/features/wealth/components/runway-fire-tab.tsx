// src/features/wealth/components/runway-fire-tab.tsx
"use client";
 
import React, { useState, useTransition } from "react";
import { updateFireSettingsAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Flame, HeartPulse, RefreshCw } from "lucide-react";
import { toast } from "sonner";
 
interface RunwayFireTabProps {
  data: {
    runwayMonths: number;
    averageMonthlyExpenses: number;
    totalCash: number;
    totalAssets: number;
    totalDebts: number;
    netWealth: number;
    safetyScore: number;
    fireNumber: number;
    fireProgress: number;
  };
  fireSettings: {
    target_retirement_age: number;
    expected_return_rate: number;
  };
  onRefresh: () => void;
}
 
export function RunwayFireTab({ data, fireSettings, onRefresh }: RunwayFireTabProps) {
  const [isPending, startTransition] = useTransition();
  const [retireAge, setRetireAge] = useState(fireSettings.target_retirement_age.toString());
  const [returnRate, setReturnRate] = useState(fireSettings.expected_return_rate.toString());
 
  const handleUpdateFire = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.set("target_retirement_age", retireAge);
      formData.set("expected_return_rate", returnRate);
 
      const res = await updateFireSettingsAction({ success: false, error: "" }, formData);
      if (res.success) {
        toast.success("FIRE settings updated successfully!");
        onRefresh();
      } else {
        toast.error(res.error);
      }
    });
  };
 
  return (
    <div className="space-y-6">
      {/* 1. Emergency Fund Card */}
      <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-indigo-400" />
            Emergency Fund Runway
          </h3>
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase">
            Safety Score: {data.safetyScore}%
          </span>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 font-medium">Survival Runway</span>
            <div className="text-3xl font-extrabold text-white">
              {data.runwayMonths} <span className="text-sm text-zinc-400 font-normal">Months</span>
            </div>
            <p className="text-[11px] text-zinc-600">Based on cash assets vs monthly ledger expenses.</p>
          </div>
 
          <div className="space-y-1 border-t border-white/[0.04] md:border-t-0 md:border-l md:border-white/[0.06] pt-4 md:pt-0 md:pl-6">
            <span className="text-xs text-zinc-500 font-medium">Total Liquid Cash</span>
            <div className="text-xl font-bold text-emerald-400">
              ₹{data.totalCash.toLocaleString()}
            </div>
            <span className="text-[10px] text-zinc-500">Manual cash & bank assets.</span>
          </div>
 
          <div className="space-y-1 border-t border-white/[0.04] md:border-t-0 md:border-l md:border-white/[0.06] pt-4 md:pt-0 md:pl-6">
            <span className="text-xs text-zinc-500 font-medium">Average Monthly Expenses</span>
            <div className="text-xl font-bold text-rose-400">
              ₹{data.averageMonthlyExpenses.toLocaleString()}
            </div>
            <span className="text-[10px] text-zinc-500">Calculated from Ledger logs.</span>
          </div>
        </div>
 
        {/* Progress bar towards standard 6-month buffer */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-zinc-400">Emergency Fund Buffer</span>
            <span className="text-white">{data.runwayMonths >= 6 ? "Safe (6M+ reached)" : `${Math.round((data.runwayMonths / 6) * 100)}% of 6-Month Target`}</span>
          </div>
          <div className="w-full bg-white/[0.04] h-2.5 rounded-full overflow-hidden border border-white/[0.06]">
            <div 
              className={`h-full rounded-full transition-all duration-550 ${data.runwayMonths >= 6 ? 'bg-emerald-500' : data.runwayMonths >= 3 ? 'bg-indigo-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(100, (data.runwayMonths / 6) * 100)}%` }}
            />
          </div>
        </div>
      </div>
 
      {/* 2. FIRE Planner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats card */}
        <div className="md:col-span-2 bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-5 h-5 text-indigo-400" />
              FIRE Retirement Target
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full uppercase">
              {data.fireProgress}% Complete
            </span>
          </div>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-xs text-zinc-500 font-medium">Target FIRE Number</span>
              <div className="text-2xl font-extrabold text-white">
                ₹{data.fireNumber.toLocaleString()}
              </div>
              <p className="text-[10px] text-zinc-650 leading-relaxed">
                Calculated using the standard rule of 25 (Annual expenses multiplied by 25).
              </p>
            </div>
 
            <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-white/[0.06] pt-4 sm:pt-0 sm:pl-6">
              <span className="text-xs text-zinc-500 font-medium">Your Current Net Wealth</span>
              <div className="text-2xl font-extrabold text-indigo-400">
                ₹{data.netWealth.toLocaleString()}
              </div>
              <p className="text-[10px] text-zinc-650 leading-relaxed">
                Aggregated manual assets (₹{data.totalAssets.toLocaleString()}) minus liabilities (₹{data.totalDebts.toLocaleString()}).
              </p>
            </div>
          </div>
 
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="w-full bg-white/[0.04] h-3.5 rounded-full overflow-hidden border border-white/[0.06]">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-550"
                style={{ width: `${data.fireProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-500 font-bold">
              <span>₹0 (Start)</span>
              <span>FIRE Target: ₹{data.fireNumber.toLocaleString()}</span>
            </div>
          </div>
        </div>
 
        {/* Settings form card */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            FIRE Settings
          </h3>
 
          <form onSubmit={handleUpdateFire} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="retireAge" className="text-xs font-semibold text-zinc-400">Target Retirement Age</Label>
              <Input 
                id="retireAge" 
                type="number" 
                min={18} 
                max={100}
                required
                value={retireAge}
                onChange={(e) => setRetireAge(e.target.value)}
                className="bg-white/[0.02] border-white/[0.08] text-white rounded-xl h-10 focus:border-indigo-500/60" 
              />
            </div>
 
            <div className="space-y-1.5">
              <Label htmlFor="returnRate" className="text-xs font-semibold text-zinc-400">Expected Annual Returns (%)</Label>
              <Input 
                id="returnRate" 
                type="number" 
                step="0.1" 
                min={0} 
                max={50}
                required
                value={returnRate}
                onChange={(e) => setReturnRate(e.target.value)}
                className="bg-white/[0.02] border-white/[0.08] text-white rounded-xl h-10 focus:border-indigo-500/60" 
              />
            </div>
 
            <Button type="submit" disabled={isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 font-bold text-xs tracking-wide transition-all disabled:opacity-60">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Settings"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
