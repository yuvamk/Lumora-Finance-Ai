// src/features/second-brain/actions.ts
"use server";
 
import { createClient } from "@/lib/supabase/server";
import { SecondBrainRepository, BrainDump, HabitLog, CoreValues, WellbeingLog, MemoryItem } from "./repository";
import { ActionResponse } from "@/features/auth/actions";
import { revalidatePath } from "next/cache";
 
export interface SecondBrainSummary {
  dumps: BrainDump[];
  habits: HabitLog[];
  coreValues: CoreValues;
  wellbeing: WellbeingLog[];
  memories: MemoryItem[];
}
 
/** Load unified Second Brain profile summary */
export async function getBrainSummaryAction(): Promise<ActionResponse<SecondBrainSummary>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    const userId = user.id;
    const today = new Date().toISOString().split("T")[0];
 
    const [dumps, habits, coreValues, wellbeing, memories] = await Promise.all([
      SecondBrainRepository.getBrainDumps(userId),
      SecondBrainRepository.getHabits(userId, today),
      SecondBrainRepository.getCoreValues(userId),
      SecondBrainRepository.getWellbeingLogs(userId),
      SecondBrainRepository.getMemories(userId),
    ]);
 
    return {
      success: true,
      data: {
        dumps,
        habits,
        coreValues,
        wellbeing,
        memories,
      }
    };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to load Second Brain." };
  }
}
 
/** Brain Dump actions */
export async function upsertBrainDumpAction(_prev: ActionResponse, formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    const id = formData.get("id") as string || undefined;
    const category = formData.get("category") as any;
    const content = formData.get("content") as string;
    const rawTags = formData.get("tags") as string || "";
 
    if (!content || !category) {
      return { success: false, error: "Please enter your thoughts." };
    }
 
    const tags = rawTags.split(",").map(t => t.trim()).filter(Boolean);
 
    await SecondBrainRepository.upsertBrainDump(user.id, {
      id,
      category,
      content,
      tags,
    });
 
    revalidatePath("/insights");
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
 
export async function deleteBrainDumpAction(dumpId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    await SecondBrainRepository.deleteBrainDump(user.id, dumpId);
    revalidatePath("/insights");
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
 
/** Habit checklist actions */
export async function toggleHabitAction(name: string, status: boolean): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    const today = new Date().toISOString().split("T")[0];
    await SecondBrainRepository.toggleHabit(user.id, name, today, status);
    
    revalidatePath("/insights");
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
 
/** Core Values / Personal Vision actions */
export async function updateCoreValuesAction(_prev: ActionResponse, formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    const rawValues = formData.get("values_list") as string || "";
    const rawRules = formData.get("personal_rules") as string || "";
    const rawGoals = formData.get("goals") as string || "";
 
    const values_list = rawValues.split("\n").map(v => v.trim()).filter(Boolean);
    const personal_rules = rawRules.split("\n").map(r => r.trim()).filter(Boolean);
    const goals = rawGoals.split("\n").map(g => g.trim()).filter(Boolean);
 
    await SecondBrainRepository.upsertCoreValues(user.id, {
      values_list,
      personal_rules,
      goals,
    });
 
    revalidatePath("/insights");
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
 
/** Wellbeing mood log check-ins */
export async function logWellbeingAction(_prev: ActionResponse, formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    const mood = parseInt(formData.get("mood") as string);
    const energy = parseInt(formData.get("energy") as string);
    const stress = parseInt(formData.get("stress") as string);
    const notes = formData.get("notes") as string || "";
 
    if (isNaN(mood) || isNaN(energy) || isNaN(stress)) {
      return { success: false, error: "Please rate all well-being indicators." };
    }
 
    const today = new Date().toISOString().split("T")[0];
    await SecondBrainRepository.logWellbeing(user.id, {
      mood,
      energy,
      stress,
      notes,
      logged_date: today,
    });
 
    revalidatePath("/insights");
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
 
/** Memory Vault actions */
export async function addMemoryAction(_prev: ActionResponse, formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const rawTags = formData.get("tags") as string || "";
 
    if (!title || !description) {
      return { success: false, error: "Please enter title and descriptions." };
    }
 
    const tags = rawTags.split(",").map(t => t.trim()).filter(Boolean);
 
    await SecondBrainRepository.addMemory(user.id, {
      title,
      description,
      tags,
    });
 
    revalidatePath("/insights");
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
 
export async function deleteMemoryAction(memoryId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
 
    await SecondBrainRepository.deleteMemory(user.id, memoryId);
    revalidatePath("/insights");
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
