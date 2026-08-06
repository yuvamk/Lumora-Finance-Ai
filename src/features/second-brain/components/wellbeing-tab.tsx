// src/features/second-brain/components/wellbeing-tab.tsx
"use client";
 
import React, { useState, useTransition } from "react";
import { logWellbeingAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, ShieldAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { WellbeingLog } from "../repository";
 
interface WellbeingTabProps {
  logs: WellbeingLog[];
  onRefresh: () => void;
}
 
export function WellbeingTab({ logs, onRefresh }: WellbeingTabProps) {
  const [isPending, startTransition] = useTransition();
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [stress, setStress] = useState(3);
  const [notes, setNotes] = useState("");
 
  const handleSaveWellbeing = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.set("mood", mood.toString());
      formData.set("energy", energy.toString());
      formData.set("stress", stress.toString());
      formData.set("notes", notes);
 
      const res = await logWellbeingAction({ success: false, error: "" }, formData);
      if (res.success) {
        toast.success("Well-being check-in saved!");
        setNotes("");
        onRefresh();
      } else {
        toast.error(res.error);
      }
    });
  };
 
  const latestLog = logs[0];
 
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visualizers & Past Logs */}
      <div className="lg:col-span-2 space-y-6">
        {/* Latest wellness status */}
        {latestLog && (
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4">
            <h4 className="text-[10px] font-extrabold text-zinc-550 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Latest Mental Battery Score
            </h4>
 
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4">
                <span className="text-[9px] uppercase font-bold text-indigo-400">Mood</span>
                <div className="text-2xl font-extrabold text-white mt-1">{latestLog.mood}/10</div>
              </div>
 
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                <span className="text-[9px] uppercase font-bold text-emerald-400">Energy</span>
                <div className="text-2xl font-extrabold text-white mt-1">{latestLog.energy}/10</div>
              </div>
 
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4">
                <span className="text-[9px] uppercase font-bold text-rose-400">Stress</span>
                <div className="text-2xl font-extrabold text-white mt-1">{latestLog.stress}/10</div>
              </div>
            </div>
 
            {latestLog.notes && (
              <div className="text-xs text-zinc-400 italic bg-white/[0.01] p-3 rounded-xl border border-white/[0.04] leading-relaxed">
                "{latestLog.notes}"
              </div>
            )}
          </div>
        )}
 
        {/* History log entries */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            History Check-ins
          </h3>
 
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex justify-between items-center text-xs border-b border-white/[0.04] pb-3">
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-400 font-mono">
                    {new Date(log.logged_date).toLocaleDateString()}
                  </span>
                  {log.notes && <p className="text-[11px] text-zinc-500">"{log.notes}"</p>}
                </div>
                <div className="flex gap-2 font-bold text-[10px]">
                  <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">M: {log.mood}</span>
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">E: {log.energy}</span>
                  <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">S: {log.stress}</span>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="py-6 text-center text-zinc-650">No check-ins logged yet.</div>
            )}
          </div>
        </div>
      </div>
 
      {/* Check-in slider form */}
      <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl h-fit space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Daily Check-in
          </h3>
          <p className="text-[10px] text-zinc-550 mt-0.5">Rate your internal state indices</p>
        </div>
 
        <form onSubmit={handleSaveWellbeing} className="space-y-4">
          {/* Mood */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-zinc-400">
              <Label htmlFor="mood">Mood Rating</Label>
              <span className="text-indigo-400">{mood}/10</span>
            </div>
            <input 
              id="mood" 
              type="range" 
              min={1} 
              max={10} 
              value={mood}
              onChange={(e) => setMood(parseInt(e.target.value))}
              className="w-full accent-indigo-500 bg-zinc-900 rounded-lg h-2 appearance-none cursor-pointer"
            />
          </div>
 
          {/* Energy */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-zinc-400">
              <Label htmlFor="energy">Energy Level</Label>
              <span className="text-emerald-400">{energy}/10</span>
            </div>
            <input 
              id="energy" 
              type="range" 
              min={1} 
              max={10} 
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full accent-emerald-500 bg-zinc-900 rounded-lg h-2 appearance-none cursor-pointer"
            />
          </div>
 
          {/* Stress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-zinc-400">
              <Label htmlFor="stress">Stress Level</Label>
              <span className="text-rose-400">{stress}/10</span>
            </div>
            <input 
              id="stress" 
              type="range" 
              min={1} 
              max={10} 
              value={stress}
              onChange={(e) => setStress(parseInt(e.target.value))}
              className="w-full accent-rose-500 bg-zinc-900 rounded-lg h-2 appearance-none cursor-pointer"
            />
          </div>
 
          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold text-zinc-400">Notes / Reflection</Label>
            <textarea
              id="notes"
              placeholder="How are you feeling today?"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.08] text-white placeholder:text-zinc-700 text-xs rounded-xl p-3 focus:border-indigo-500/60 outline-none resize-none"
            />
          </div>
 
          <Button type="submit" disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 font-bold text-xs tracking-wide transition-all disabled:opacity-60 flex items-center justify-center gap-1.5">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Wellbeing"}
          </Button>
        </form>
      </div>
    </div>
  );
}
