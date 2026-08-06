// src/features/second-brain/components/brain-dump-tab.tsx
"use client";
 
import React, { useState, useTransition } from "react";
import { upsertBrainDumpAction, deleteBrainDumpAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Brain, Trash2, Tag, Calendar } from "lucide-react";
import { toast } from "sonner";
import { BrainDump } from "../repository";
 
interface BrainDumpTabProps {
  dumps: BrainDump[];
  onRefresh: () => void;
}
 
export function BrainDumpTab({ dumps, onRefresh }: BrainDumpTabProps) {
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"thought" | "idea" | "dream" | "reflection">("thought");
  const [tags, setTags] = useState("");
 
  const handleSaveDump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) {
      toast.error("Please write something first.");
      return;
    }
 
    startTransition(async () => {
      const formData = new FormData();
      formData.set("category", category);
      formData.set("content", content);
      formData.set("tags", tags);
 
      const res = await upsertBrainDumpAction({ success: false, error: "" }, formData);
      if (res.success) {
        toast.success("Logged to your second brain!");
        setContent("");
        setTags("");
        onRefresh();
      } else {
        toast.error(res.error);
      }
    });
  };
 
  const handleDeleteDump = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const res = await deleteBrainDumpAction(id);
    if (res.success) {
      toast.success("Entry removed.");
      onRefresh();
    } else {
      toast.error(res.error);
    }
  };
 
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Logs Feed List */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          Unstructured Thought Logs
        </h3>
 
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
          {dumps.map((dump) => (
            <div 
              key={dump.id} 
              className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 relative group hover:bg-white/[0.03] transition-colors"
            >
              <button 
                onClick={() => handleDeleteDump(dump.id)}
                className="absolute right-4 top-4 text-zinc-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
 
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  dump.category === "idea" 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : dump.category === "dream"
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    : dump.category === "reflection"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                }`}>
                  {dump.category}
                </span>
                <span className="text-[10px] text-zinc-550 flex items-center gap-1 font-mono">
                  <Calendar className="w-3 h-3" />
                  {new Date(dump.created_at).toLocaleDateString()}
                </span>
              </div>
 
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{dump.content}</p>
 
              {dump.tags && dump.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {dump.tags.map((tag, idx) => (
                    <span key={idx} className="text-[9px] text-zinc-500 font-bold bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.04] flex items-center gap-0.5">
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
 
          {dumps.length === 0 && (
            <div className="py-12 text-center text-zinc-650 text-xs">
              No entries logged yet. Dump your thoughts on the right to store them!
            </div>
          )}
        </div>
      </div>
 
      {/* Input dump form */}
      <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl h-fit space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Brain Dump Center
          </h3>
          <p className="text-[10px] text-zinc-550 mt-0.5">Quickly dump random memories, insights, or ideas</p>
        </div>
 
        <form onSubmit={handleSaveDump} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs font-semibold text-zinc-400">Entry Type</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-zinc-950 border border-white/[0.08] text-white rounded-xl h-10 px-3 text-xs focus:border-indigo-500/60 outline-none"
            >
              <option value="thought">Thought (Reflection, Journal)</option>
              <option value="idea">Idea (Inventions, Tasks)</option>
              <option value="dream">Dream (Mind maps, Ambitions)</option>
              <option value="reflection">Reflection (Review, Mood summary)</option>
            </select>
          </div>
 
          <div className="space-y-1.5">
            <Label htmlFor="content" className="text-xs font-semibold text-zinc-400">Your Thoughts</Label>
            <textarea
              id="content"
              placeholder="Dump whatever is on your mind..."
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.08] text-white placeholder:text-zinc-700 text-xs rounded-xl p-3 focus:border-indigo-500/60 outline-none resize-none"
            />
          </div>
 
          <div className="space-y-1.5">
            <Label htmlFor="tags" className="text-xs font-semibold text-zinc-400">Tags (comma separated)</Label>
            <Input 
              id="tags" 
              type="text" 
              placeholder="e.g. project, coding, health" 
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-white/[0.02] border-white/[0.08] text-white placeholder:text-zinc-700 rounded-xl h-10 focus:border-indigo-500/60" 
            />
          </div>
 
          <Button type="submit" disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 font-bold text-xs tracking-wide transition-all disabled:opacity-60 flex items-center justify-center gap-1.5">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Archive Entry"}
          </Button>
        </form>
      </div>
    </div>
  );
}
