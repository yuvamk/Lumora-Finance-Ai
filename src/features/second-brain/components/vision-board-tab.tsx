// src/features/second-brain/components/vision-board-tab.tsx
"use client";
 
import React, { useState, useTransition } from "react";
import { updateCoreValuesAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Target, Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { CoreValues } from "../repository";
 
interface VisionBoardTabProps {
  coreValues: CoreValues;
  onRefresh: () => void;
}
 
export function VisionBoardTab({ coreValues, onRefresh }: VisionBoardTabProps) {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState(coreValues.values_list.join("\n"));
  const [rules, setRules] = useState(coreValues.personal_rules.join("\n"));
  const [goals, setGoals] = useState(coreValues.goals.join("\n"));
  const [editMode, setEditMode] = useState(false);
 
  const handleSaveVision = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.set("values_list", values);
      formData.set("personal_rules", rules);
      formData.set("goals", goals);
 
      const res = await updateCoreValuesAction({ success: false, error: "" }, formData);
      if (res.success) {
        toast.success("Vision board updated!");
        setEditMode(false);
        onRefresh();
      } else {
        toast.error(res.error);
      }
    });
  };
 
  return (
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            Core Values & Vision Board
          </h3>
          <p className="text-[10px] text-zinc-550 mt-0.5">Define your boundaries, personal rules, and long-term milestones</p>
        </div>
        <Button 
          onClick={() => setEditMode(!editMode)}
          className="bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.06] rounded-xl text-xs px-4 h-9 font-bold"
        >
          {editMode ? "Cancel" : "Update Vision"}
        </Button>
      </div>
 
      {editMode ? (
        <form onSubmit={handleSaveVision} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="valuesText" className="text-xs font-semibold text-zinc-400">Core Beliefs / Values (one per line)</Label>
              <textarea
                id="valuesText"
                rows={6}
                value={values}
                onChange={(e) => setValues(e.target.value)}
                className="w-full bg-zinc-950 border border-white/[0.08] text-white text-xs rounded-xl p-3 focus:border-indigo-500/60 outline-none resize-none"
              />
            </div>
 
            <div className="space-y-1.5">
              <Label htmlFor="rulesText" className="text-xs font-semibold text-zinc-400">Daily Life Rules (one per line)</Label>
              <textarea
                id="rulesText"
                rows={6}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="w-full bg-zinc-950 border border-white/[0.08] text-white text-xs rounded-xl p-3 focus:border-indigo-500/60 outline-none resize-none"
              />
            </div>
 
            <div className="space-y-1.5">
              <Label htmlFor="goalsText" className="text-xs font-semibold text-zinc-400">Long-term Goals (one per line)</Label>
              <textarea
                id="goalsText"
                rows={6}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="w-full bg-zinc-950 border border-white/[0.08] text-white text-xs rounded-xl p-3 focus:border-indigo-500/60 outline-none resize-none"
              />
            </div>
          </div>
 
          <Button type="submit" disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 font-bold text-xs tracking-wide transition-all disabled:opacity-60 flex items-center justify-center gap-1.5">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Values */}
          <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-5 space-y-3">
            <h4 className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">Core Values</h4>
            <ul className="space-y-2 text-xs text-zinc-350">
              {coreValues.values_list.map((v, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  {v}
                </li>
              ))}
              {coreValues.values_list.length === 0 && <li className="text-zinc-650 italic text-[11px]">No values configured.</li>}
            </ul>
          </div>
 
          {/* Rules */}
          <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-5 space-y-3">
            <h4 className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Personal Rules
            </h4>
            <ul className="space-y-2 text-xs text-zinc-350">
              {coreValues.personal_rules.map((r, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {r}
                </li>
              ))}
              {coreValues.personal_rules.length === 0 && <li className="text-zinc-650 italic text-[11px]">No rules configured.</li>}
            </ul>
          </div>
 
          {/* Goals */}
          <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-5 space-y-3">
            <h4 className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" /> Long-Term Goals
            </h4>
            <ul className="space-y-2 text-xs text-zinc-350">
              {coreValues.goals.map((g, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {g}
                </li>
              ))}
              {coreValues.goals.length === 0 && <li className="text-zinc-650 italic text-[11px]">No goals configured.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
