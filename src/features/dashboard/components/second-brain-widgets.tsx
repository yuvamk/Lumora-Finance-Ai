// src/features/dashboard/components/second-brain-widgets.tsx
"use client";
 
import React, { useState, useEffect, useTransition } from "react";
import { getBrainSummaryAction, toggleHabitAction, logWellbeingAction, upsertBrainDumpAction } from "@/features/second-brain/actions";
import { getWealthSummaryAction, WealthSummary } from "@/features/wealth/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Flame, Brain, Heart, Sparkles, Scale, HeartPulse, Target, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
 
const DEFAULT_HABITS = ["Meditation", "30 Min Reading", "Exercise", "Deep Work Block", "No Sugar", "8 Hours Sleep"];
 
export function SecondBrainWidgets({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [activeSubTab, setActiveSubTab] = useState<"habits" | "wellbeing" | "dump" | "wealth">("habits");
 
  // State variables
  const [habitsData, setHabitsData] = useState<Record<string, boolean>>({});
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [stress, setStress] = useState(3);
  const [wellbeingNotes, setWellbeingNotes] = useState("");
  const [brainDumpText, setBrainDumpText] = useState("");
  const [wealthData, setWealthData] = useState<WealthSummary | null>(null);
 
  // Load data on mount
  const refreshData = async () => {
    // 1. Fetch habits and wellbeing
    const res = await getBrainSummaryAction();
    if (res.success && res.data) {
      const hMap: Record<string, boolean> = {};
      res.data.habits.forEach(h => {
        hMap[h.name] = h.status;
      });
      setHabitsData(hMap);
    }
 
    // 2. Fetch wealth details
    const wRes = await getWealthSummaryAction();
    if (wRes.success && wRes.data) {
      setWealthData(wRes.data);
    }
  };
 
  useEffect(() => {
    refreshData();
  }, []);
 
  // Update iOS PWA home screen icon notification badge number dynamically
  useEffect(() => {
    if (typeof navigator !== "undefined" && "setAppBadge" in navigator) {
      const completed = DEFAULT_HABITS.filter(name => habitsData[name]).length;
      const remaining = DEFAULT_HABITS.length - completed;
      if (remaining > 0) {
        (navigator as any).setAppBadge(remaining).catch(() => {});
      } else {
        (navigator as any).clearAppBadge().catch(() => {});
      }
    }
  }, [habitsData]);
 
  const handleToggleHabit = (name: string) => {
    const nextStatus = !habitsData[name];
    setHabitsData(prev => ({ ...prev, [name]: nextStatus }));
 
    startTransition(async () => {
      const res = await toggleHabitAction(name, nextStatus);
      if (res.success) {
        toast.success(`${name} updated!`);
      } else {
        toast.error("Failed to update habit.");
        setHabitsData(prev => ({ ...prev, [name]: !nextStatus })); // Rollback
      }
    });
  };
 
  const handleLogWellbeing = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.set("mood", mood.toString());
      formData.set("energy", energy.toString());
      formData.set("stress", stress.toString());
      formData.set("notes", wellbeingNotes);
 
      const res = await logWellbeingAction({ success: false, error: "" }, formData);
      if (res.success) {
        toast.success("Well-being check-in saved!");
        setWellbeingNotes("");
        refreshData();
      } else {
        toast.error(res.error);
      }
    });
  };
 
  const handleSaveBrainDump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brainDumpText.trim()) return;
 
    startTransition(async () => {
      const formData = new FormData();
      formData.set("category", "thought");
      formData.set("content", brainDumpText);
      formData.set("tags", "home-widget");
 
      const res = await upsertBrainDumpAction({ success: false, error: "" }, formData);
      if (res.success) {
        toast.success("Thought archived in Second Brain!");
        setBrainDumpText("");
      } else {
        toast.error(res.error);
      }
    });
  };
 
  // Apple Widget Parameters
  const habitsDone = DEFAULT_HABITS.filter(name => habitsData[name]).length;
  const totalWealth = wealthData?.totalAssets || 0;
  const netWorth = totalWealth - (wealthData?.totalDebts || 0);
  const avgExpenses = wealthData?.averageMonthlyExpenses || 35000;
  const dailyBudget = Math.round(avgExpenses / 30);
  const runway = wealthData?.runwayMonths || 0;
 
  return (
    <div className="space-y-4">
      {/* iOS Simulated Home Widget */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-white/[0.08] rounded-[28px] p-5 shadow-2xl h-[155px] flex flex-col justify-between text-white font-sans select-none relative overflow-hidden">
        {/* Top bar */}
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase font-black text-indigo-400 tracking-[0.15em] block">Lumora AI Hub</span>
            <div className="text-xl font-extrabold text-white leading-none">₹{netWorth.toLocaleString()}</div>
            <span className="text-[8px] text-zinc-550 font-bold block uppercase tracking-wide">Estimated Net Capital</span>
          </div>
          <div className="text-right space-y-0.5">
            <span className="text-[9px] uppercase font-black text-emerald-400 tracking-[0.12em] block">Wellness</span>
            <div className="text-sm font-bold text-white leading-none">Mood: {mood}/10</div>
            <span className="text-[8px] text-zinc-550 font-bold block uppercase tracking-wide">Energy: {energy}/10</span>
          </div>
        </div>
 
        {/* Bottom stats layout */}
        <div className="grid grid-cols-3 gap-2 border-t border-white/[0.05] pt-3.5 mt-2 text-left">
          <div>
            <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-wider block">Today's Cap</span>
            <span className="text-xs font-bold text-zinc-200">₹{dailyBudget.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-wider block">Habit Rituals</span>
            <span className="text-xs font-bold text-zinc-200">{habitsDone}/{DEFAULT_HABITS.length}</span>
          </div>
          <div>
            <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-wider block">Runway</span>
            <span className="text-xs font-bold text-zinc-200">{runway} Mos</span>
          </div>
        </div>
 
        {/* Apple subtle widget gloss shine */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>
 
      <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-5 shadow-xl space-y-4">
        {/* Widget Tabs Header */}
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Life Engine Widgets
          </h3>
          
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {(["habits", "wellbeing", "dump", "wealth"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all select-none border ${
                  activeSubTab === tab
                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    : "bg-transparent text-zinc-500 border-transparent hover:text-zinc-300"
                }`}
              >
                {tab === "habits" ? "Habits" : tab === "wellbeing" ? "Check-in" : tab === "dump" ? "Brain Dump" : "Runway"}
              </button>
            ))}
          </div>
        </div>
 
        {/* Tab Panels */}
        <div className="min-h-[140px] flex flex-col justify-center">
          {/* 1. Habit checklist */}
          {activeSubTab === "habits" && (
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_HABITS.map(name => {
                const isDone = habitsData[name] || false;
                return (
                  <button
                    key={name}
                    onClick={() => handleToggleHabit(name)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all select-none cursor-pointer ${
                      isDone
                        ? "bg-indigo-500/5 border-indigo-500/10 text-indigo-300"
                        : "bg-white/[0.01] border-white/[0.04] text-zinc-400 hover:bg-white/[0.02]"
                    }`}
                  >
                    <span className="text-[11px] font-bold truncate pr-1">{name}</span>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-650 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
 
          {/* 2. Wellbeing Slider dials */}
          {activeSubTab === "wellbeing" && (
            <form onSubmit={handleLogWellbeing} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {/* Mood */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                    <span>Mood</span>
                    <span className="text-indigo-400">{mood}</span>
                  </div>
                  <input 
                    type="range" min={1} max={10} value={mood}
                    onChange={(e) => setMood(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 h-1 rounded-lg"
                  />
                </div>
                {/* Energy */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                    <span>Energy</span>
                    <span className="text-emerald-400">{energy}</span>
                  </div>
                  <input 
                    type="range" min={1} max={10} value={energy}
                    onChange={(e) => setEnergy(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 h-1 rounded-lg"
                  />
                </div>
                {/* Stress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                    <span>Stress</span>
                    <span className="text-rose-400">{stress}</span>
                  </div>
                  <input 
                    type="range" min={1} max={10} value={stress}
                    onChange={(e) => setStress(parseInt(e.target.value))}
                    className="w-full accent-rose-500 h-1 rounded-lg"
                  />
                </div>
              </div>
 
              <div className="flex gap-2">
                <Input 
                  placeholder="Log a quick daily check-in thought..."
                  value={wellbeingNotes}
                  onChange={(e) => setWellbeingNotes(e.target.value)}
                  className="bg-zinc-950 border-white/[0.08] text-white placeholder:text-zinc-700 h-9 text-xs rounded-xl flex-1 focus:border-indigo-500/60"
                />
                <Button type="submit" disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-9 text-xs font-bold px-4">
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                </Button>
              </div>
            </form>
          )}
 
          {/* 3. Brain Dump */}
          {activeSubTab === "dump" && (
            <form onSubmit={handleSaveBrainDump} className="flex gap-2 items-stretch h-full">
              <textarea
                placeholder="Dump a quick thought, dream, or memory..."
                value={brainDumpText}
                onChange={(e) => setBrainDumpText(e.target.value)}
                className="bg-zinc-950 border border-white/[0.08] text-white placeholder:text-zinc-700 text-xs rounded-xl p-2.5 flex-1 focus:border-indigo-500/60 outline-none resize-none"
              />
              <Button 
                type="submit" 
                disabled={isPending || !brainDumpText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold px-4 flex flex-col justify-center gap-1 select-none"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                <span>Dump</span>
              </Button>
            </form>
          )}
 
          {/* 4. Runway and Wealth widgets */}
          {activeSubTab === "wealth" && (
            <div className="grid grid-cols-2 gap-4">
              {/* Runway */}
              <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wide block">Runway</span>
                  <span className="text-lg font-extrabold text-white">{wealthData?.runwayMonths || 0} <span className="text-[10px] text-zinc-400 font-normal">Months</span></span>
                </div>
                <HeartPulse className="w-7 h-7 text-indigo-400 bg-indigo-500/10 p-1.5 rounded-xl flex-shrink-0" />
              </div>
 
              {/* FIRE Progress */}
              <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wide block">FIRE Goal</span>
                  <span className="text-lg font-extrabold text-white">{wealthData?.fireProgress || 0}%</span>
                </div>
                <Target className="w-7 h-7 text-emerald-400 bg-emerald-500/10 p-1.5 rounded-xl flex-shrink-0" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
