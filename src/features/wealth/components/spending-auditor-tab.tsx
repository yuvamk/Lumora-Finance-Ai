// src/features/wealth/components/spending-auditor-tab.tsx
"use client";
 
import React, { useState, useEffect } from "react";
import { getAuditInsightsAction } from "../actions";
import type { AuditInsight } from "../types";
import { Sparkles, ShieldCheck, AlertCircle, RefreshCw, BadgePercent } from "lucide-react";
 
export function SpendingAuditorTab() {
  const [insights, setInsights] = useState<AuditInsight[]>([]);
  const [loading, setLoading] = useState(true);
 
  const loadInsights = async () => {
    setLoading(true);
    const res = await getAuditInsightsAction();
    if (res.success && res.data) {
      setInsights(res.data);
    }
    setLoading(false);
  };
 
  useEffect(() => {
    loadInsights();
  }, []);
 
  return (
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            AI Habit Audit Logs
          </h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">Scans ledger notes locally to identify leakage points</p>
        </div>
        <button 
          onClick={loadInsights} 
          disabled={loading}
          className="text-zinc-500 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
 
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
          <span className="text-xs text-zinc-500">Auditing transaction patterns...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div 
              key={insight.id}
              className={`border rounded-2xl p-5 flex items-start gap-4 transition-all ${
                insight.type === "warning" 
                  ? "bg-rose-500/5 border-rose-500/10" 
                  : insight.type === "success" 
                  ? "bg-emerald-500/5 border-emerald-500/10"
                  : "bg-indigo-500/5 border-indigo-500/10"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                insight.type === "warning"
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  : insight.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
              }`}>
                {insight.type === "success" ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
 
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-xs font-bold text-white">{insight.title}</h4>
                  {insight.savingPotential > 0 && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <BadgePercent className="w-3.5 h-3.5" /> Save ₹{insight.savingPotential.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-450 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
