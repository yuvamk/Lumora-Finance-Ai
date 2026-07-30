"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthRepository } from "@/features/auth/repository";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, ArrowLeft, Check, Loader2, SkipForward } from "lucide-react";
import { toast } from "sonner";

const CURRENCIES = [
  { code: "USD", symbol: "$", flag: "🇺🇸" }, { code: "EUR", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", flag: "🇬🇧" }, { code: "INR", symbol: "₹", flag: "🇮🇳" },
  { code: "PKR", symbol: "₨", flag: "🇵🇰" }, { code: "AED", symbol: "د.إ", flag: "🇦🇪" },
  { code: "CAD", symbol: "C$", flag: "🇨🇦" }, { code: "AUD", symbol: "A$", flag: "🇦🇺" },
  { code: "JPY", symbol: "¥", flag: "🇯🇵" }, { code: "SAR", symbol: "﷼", flag: "🇸🇦" },
];

const GOAL_EMOJIS = ["🏠", "🚗", "✈️", "💍", "🎓", "💻", "🏖️", "💰", "🎯", "📱"];

const TOTAL_STEPS = 5;

interface OnboardingData {
  displayName: string;
  currency: { code: string; symbol: string };
  monthlyIncome: string;
  budgetCategory: string;
  budgetAmount: string;
  goalName: string;
  goalAmount: string;
  goalEmoji: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    displayName: "", currency: { code: "USD", symbol: "$" },
    monthlyIncome: "", budgetCategory: "", budgetAmount: "",
    goalName: "", goalAmount: "", goalEmoji: "🎯",
  });

  const update = (key: keyof OnboardingData, value: OnboardingData[keyof OnboardingData]) =>
    setData(prev => ({ ...prev, [key]: value }));

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const prev = () => setStep(s => Math.max(s - 1, 1));

  const handleComplete = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      // Update profile & settings via direct Supabase (client-side onboarding)
      if (data.displayName) {
        await supabase.from("profiles").update({ display_name: data.displayName }).eq("id", user.id);
      }
      await supabase.from("settings").update({
        base_currency_code: data.currency.code,
        base_currency_symbol: data.currency.symbol,
      }).eq("user_id", user.id);

      // Mark onboarding complete (using profiles table — requires the migration column)
      // Gracefully skip if column doesn't exist yet
      try {
        await supabase.from("profiles").update({ onboarding_completed: true } as Record<string, unknown>).eq("id", user.id);
      } catch { /* column may not exist yet */ }

      setDone(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (e) {
      toast.error("Something went wrong. You can set these in Settings later.");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">You&apos;re all set!</h2>
          <p className="text-zinc-400 text-sm">Taking you to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-zinc-900">
        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <button onClick={prev} disabled={step === 1}
          className="w-9 h-9 rounded-xl border border-zinc-800 flex items-center justify-center text-zinc-600 hover:text-zinc-400 disabled:opacity-0 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5">
          {[...Array(TOTAL_STEPS)].map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 === step ? "w-6 bg-indigo-500" : i + 1 < step ? "w-3 bg-indigo-500/60" : "w-3 bg-zinc-800"}`} />
          ))}
        </div>
        {step < TOTAL_STEPS ? (
          <button onClick={next} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-400 transition-colors">
            Skip <SkipForward className="w-3.5 h-3.5" />
          </button>
        ) : <div className="w-9" />}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 max-w-sm mx-auto w-full">

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold leading-tight">Welcome to<br /><span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Lumora AI</span></h1>
              <p className="text-zinc-500 text-sm mt-2">Let&apos;s set up your financial profile in 2 minutes.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-400">What should we call you?</Label>
              <Input value={data.displayName} onChange={e => update("displayName", e.target.value)}
                placeholder="Your first name" autoFocus
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-12" />
            </div>
          </div>
        )}

        {/* Step 2: Currency */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold">Your currency</h2>
              <p className="text-zinc-500 text-sm mt-1">We&apos;ll use this for all calculations and reports.</p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {CURRENCIES.map(c => (
                <button key={c.code} type="button" onClick={() => update("currency", { code: c.code, symbol: c.symbol })}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border transition-all ${data.currency.code === c.code ? "bg-indigo-600/20 border-indigo-500" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"}`}>
                  <span className="text-xl">{c.flag}</span>
                  <span className="text-[10px] font-bold">{c.code}</span>
                </button>
              ))}
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg font-bold text-indigo-400">
                {data.currency.symbol}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{data.currency.code} selected</p>
                <p className="text-xs text-zinc-500">All amounts shown in {data.currency.code}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Income (optional) */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold">Monthly income</h2>
              <p className="text-zinc-500 text-sm mt-1">Optional — helps us predict your cash flow.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-400">Monthly Income ({data.currency.symbol})</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">{data.currency.symbol}</span>
                <Input type="number" value={data.monthlyIncome} onChange={e => update("monthlyIncome", e.target.value)}
                  placeholder="5,000" className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-12 pl-8" />
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4">
              <p className="text-xs text-zinc-500 leading-relaxed">💡 Your income information is stored securely and used only to generate financial insights.</p>
            </div>
          </div>
        )}

        {/* Step 4: First Budget (optional) */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold">Set a budget limit</h2>
              <p className="text-zinc-500 text-sm mt-1">Optional — you can add more in the Budgets section.</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-400">Category</Label>
                <select value={data.budgetCategory} onChange={e => update("budgetCategory", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl h-12 px-4 text-sm focus:outline-none focus:border-indigo-500/60 appearance-none">
                  <option value="">Select a category…</option>
                  <option value="Food & Dining">🍔 Food & Dining</option>
                  <option value="Transport">🚗 Transport</option>
                  <option value="Shopping">🛍 Shopping</option>
                  <option value="Entertainment">🎬 Entertainment</option>
                  <option value="Health">🏥 Health</option>
                  <option value="Utilities">⚡ Utilities</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-400">Monthly Limit ({data.currency.symbol})</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">{data.currency.symbol}</span>
                  <Input type="number" value={data.budgetAmount} onChange={e => update("budgetAmount", e.target.value)}
                    placeholder="500" className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-12 pl-8" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: First Goal (optional) */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold">What are you saving for?</h2>
              <p className="text-zinc-500 text-sm mt-1">Optional — create goals anytime in the Goals section.</p>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-zinc-400 mb-2 block">Choose an icon</Label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_EMOJIS.map(emoji => (
                    <button key={emoji} type="button" onClick={() => update("goalEmoji", emoji)}
                      className={`w-10 h-10 rounded-xl text-xl transition-all border ${data.goalEmoji === emoji ? "bg-indigo-600/20 border-indigo-500" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-400">Goal Name</Label>
                <Input value={data.goalName} onChange={e => update("goalName", e.target.value)}
                  placeholder="Emergency Fund, New Car…"
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-12" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-400">Target Amount ({data.currency.symbol})</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">{data.currency.symbol}</span>
                  <Input type="number" value={data.goalAmount} onChange={e => update("goalAmount", e.target.value)}
                    placeholder="10,000" className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-12 pl-8" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-4 pb-8 max-w-sm mx-auto w-full">
        {step < TOTAL_STEPS ? (
          <button onClick={next}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-13 font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20">
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleComplete} disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-13 font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {loading ? "Setting up…" : "Go to Dashboard"}
          </button>
        )}
      </div>
    </div>
  );
}
