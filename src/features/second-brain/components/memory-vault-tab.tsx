// src/features/second-brain/components/memory-vault-tab.tsx
"use client";
 
import React, { useState, useTransition } from "react";
import { addMemoryAction, deleteMemoryAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Award, Trash2, Tag, Calendar, Heart } from "lucide-react";
import { toast } from "sonner";
import { MemoryItem } from "../repository";
 
interface MemoryVaultTabProps {
  memories: MemoryItem[];
  onRefresh: () => void;
}
 
export function MemoryVaultTab({ memories, onRefresh }: MemoryVaultTabProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
 
  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error("Please fill in memory details.");
      return;
    }
 
    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("description", description);
      formData.set("tags", tags);
 
      const res = await addMemoryAction({ success: false, error: "" }, formData);
      if (res.success) {
        toast.success("Saved in your Memory Vault!");
        setTitle("");
        setDescription("");
        setTags("");
        onRefresh();
      } else {
        toast.error(res.error);
      }
    });
  };
 
  const handleDeleteMemory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this memory entry?")) return;
    const res = await deleteMemoryAction(id);
    if (res.success) {
      toast.success("Memory deleted.");
      onRefresh();
    } else {
      toast.error(res.error);
    }
  };
 
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Memories Scrapbook List */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-400" />
          Memory Vault & Highlights
        </h3>
 
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
          {memories.map((memory) => (
            <div 
              key={memory.id} 
              className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-5 relative group hover:bg-white/[0.03] transition-colors flex flex-col justify-between"
            >
              <button 
                onClick={() => handleDeleteMemory(memory.id)}
                className="absolute right-4 top-4 text-zinc-655 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
 
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-zinc-550 font-mono">
                  <Calendar className="w-3 h-3" />
                  {new Date(memory.created_at).toLocaleDateString()}
                </div>
 
                <h4 className="text-xs font-bold text-white leading-snug">{memory.title}</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{memory.description}</p>
              </div>
 
              {memory.tags && memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-white/[0.04]">
                  {memory.tags.map((tag, idx) => (
                    <span key={idx} className="text-[9px] text-zinc-500 font-bold bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.04] flex items-center gap-0.5">
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
 
          {memories.length === 0 && (
            <div className="col-span-2 py-12 text-center text-zinc-650 text-xs">
              Memory Vault is empty. Log breakthroughs, goals achieved, or wisdom on the right!
            </div>
          )}
        </div>
      </div>
 
      {/* Add Memory Form */}
      <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl h-fit space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Add to Vault
          </h3>
          <p className="text-[10px] text-zinc-550 mt-0.5">Archive breakthroughs, accomplishments, and quotes</p>
        </div>
 
        <form onSubmit={handleAddMemory} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-zinc-400">Memory Title</Label>
            <Input 
              id="title" 
              type="text" 
              placeholder="e.g. Completed V2 Redesign, Book Quote" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/[0.02] border-white/[0.08] text-white placeholder:text-zinc-700 rounded-xl h-10 focus:border-indigo-500/60" 
            />
          </div>
 
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-zinc-400">Context / Description</Label>
            <textarea
              id="description"
              placeholder="Provide background details, links, or quote text..."
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/[0.02] border-white/[0.08] text-white placeholder:text-zinc-700 text-xs rounded-xl p-3 focus:border-indigo-500/60 outline-none resize-none"
            />
          </div>
 
          <div className="space-y-1.5">
            <Label htmlFor="tags" className="text-xs font-semibold text-zinc-400">Tags (comma separated)</Label>
            <Input 
              id="tags" 
              type="text" 
              placeholder="e.g. milestone, quote, breakthrough" 
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-white/[0.02] border-white/[0.08] text-white placeholder:text-zinc-700 rounded-xl h-10 focus:border-indigo-500/60" 
            />
          </div>
 
          <Button type="submit" disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 font-bold text-xs tracking-wide transition-all disabled:opacity-60 flex items-center justify-center gap-1.5">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Memory"}
          </Button>
        </form>
      </div>
    </div>
  );
}
