// src/features/second-brain/components/habit-tracker-tab.tsx
"use client";
 
import React, { useTransition } from "react";
import { toggleHabitAction } from "../actions";
import { CheckCircle2, Circle, Flame, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { HabitLog } from "../repository";
 
interface HabitTrackerTabProps {
  habits: HabitLog[];
  onRefresh: () => void;
}
 
const DEFAULT_HABIT_NAMES = ["Meditation", "30 Min Reading", "Exercise", "Deep Work Block", "No Sugar", "8 Hours Sleep"];
 
export function HabitTrackerTab({ habits, onRefresh }: HabitTrackerTabProps) {
  const [isPending, startTransition] = useTransition();
 
  const handleToggleHabit = (name: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleHabitAction(name, !currentStatus);
      if (res.success) {
        toast.success(`${name} ${!currentStatus ? 'checked!' : 'unchecked!'}`);
        onRefresh();
      } else {
        toast.error(res.error);
      }
    });
  };
 
  // Map habits data to default checklist
  const habitsMap = new Map(habits.map(h => [h.name, h.status]));
  const completedCount = DEFAULT_HABIT_NAMES.filter(name => habitsMap.get(name)).length;
  const compliancePct = Math.round((completedCount / DEFAULT_HABIT_NAMES.length) * 100);
 
  return (
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Daily Habit Log & Rituals
          </h3>
          <p className="text-[10px] text-zinc-550 mt-0.5">Maintain streaks to build permanent neural pathways</p>
        </div>
 
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="bg-white/[0.03] border border-white/[0.06] px-3.5 py-2 rounded-2xl flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Habit Compliance: <span className="text-indigo-400">{compliancePct}%</span></span>
          </div>
          <div className="text-zinc-400">{completedCount} / {DEFAULT_HABIT_NAMES.length} Done</div>
        </div>
      </div>
 
      {/* Habit Checkboxes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEFAULT_HABIT_NAMES.map((name) => {
          const isDone = habitsMap.get(name) || false;
          return (
            <button
              key={name}
              disabled={isPending}
              onClick={() => handleToggleHabit(name, isDone)}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all select-none group cursor-pointer ${
                isDone 
                  ? "bg-indigo-500/10 border-indigo-500/25 text-indigo-300 shadow-md"
                  : "bg-white/[0.01] border-white/[0.06] text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold">{name}</span>
                <p className="text-[9px] text-zinc-500 uppercase tracking-wide">Daily Ritual</p>
              </div>
 
              <div className="flex items-center">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                ) : (
                  <Circle className="w-5 h-5 text-zinc-650 group-hover:text-zinc-550 transition-colors" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
