// src/features/second-brain/repository.ts
import { createClient } from "@/lib/supabase/server";
 
export interface BrainDump {
  id: string;
  category: "thought" | "idea" | "dream" | "reflection";
  content: string;
  tags: string[];
  created_at: string;
}
 
export interface HabitLog {
  id: string;
  name: string;
  logged_date: string;
  status: boolean;
}
 
export interface CoreValues {
  values_list: string[];
  personal_rules: string[];
  goals: string[];
}
 
export interface WellbeingLog {
  id: string;
  mood: number;
  energy: number;
  stress: number;
  notes: string;
  logged_date: string;
  created_at: string;
}
 
export interface MemoryItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  created_at: string;
}
 
// Fallback in-memory store for second brain features
interface SecondBrainStore {
  brainDumps: Map<string, BrainDump[]>;
  habits: Map<string, HabitLog[]>;
  coreValues: Map<string, CoreValues>;
  wellbeing: Map<string, WellbeingLog[]>;
  memories: Map<string, MemoryItem[]>;
}
 
const globalForBrain = global as unknown as {
  secondBrainStore: SecondBrainStore | undefined;
};
 
const secondBrainStore: SecondBrainStore = globalForBrain.secondBrainStore ?? {
  brainDumps: new Map(),
  habits: new Map(),
  coreValues: new Map(),
  wellbeing: new Map(),
  memories: new Map(),
};
 
if (process.env.NODE_ENV !== "production") {
  globalForBrain.secondBrainStore = secondBrainStore;
}
 
// Seed helpers
function getFallbackDumps(userId: string): BrainDump[] {
  if (!secondBrainStore.brainDumps.has(userId)) {
    secondBrainStore.brainDumps.set(userId, [
      { id: "1", category: "idea", content: "Build a modular desktop widgets system using local storage sandbox.", tags: ["project", "code"], created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
      { id: "2", category: "reflection", content: "Felt very productive today after setting a 90-minute morning coding block.", tags: ["life", "productivity"], created_at: new Date().toISOString() },
    ]);
  }
  return secondBrainStore.brainDumps.get(userId) || [];
}
 
function getFallbackHabits(userId: string): HabitLog[] {
  if (!secondBrainStore.habits.has(userId)) {
    const today = new Date().toISOString().split("T")[0];
    secondBrainStore.habits.set(userId, [
      { id: "1", name: "Meditation", logged_date: today, status: true },
      { id: "2", name: "30 Min Reading", logged_date: today, status: false },
      { id: "3", name: "Exercise", logged_date: today, status: true },
      { id: "4", name: "Deep Work Block", logged_date: today, status: true },
    ]);
  }
  return secondBrainStore.habits.get(userId) || [];
}
 
function getFallbackValues(userId: string): CoreValues {
  if (!secondBrainStore.coreValues.has(userId)) {
    secondBrainStore.coreValues.set(userId, {
      values_list: ["Intellectual Honesty", "Health First", "Continuous Learning"],
      personal_rules: ["Deep work before lunch", "No caffeine after 3 PM", "Read 20 pages daily"],
      goals: ["Complete Lumora AI workspace", "Run a 10K marathon", "Learn Rust basics"],
    });
  }
  return secondBrainStore.coreValues.get(userId)!;
}
 
function getFallbackWellbeing(userId: string): WellbeingLog[] {
  if (!secondBrainStore.wellbeing.has(userId)) {
    const today = new Date().toISOString().split("T")[0];
    secondBrainStore.wellbeing.set(userId, [
      { id: "1", mood: 8, energy: 7, stress: 4, notes: "Very productive day. Slept well last night.", logged_date: today, created_at: new Date().toISOString() }
    ]);
  }
  return secondBrainStore.wellbeing.get(userId) || [];
}
 
function getFallbackMemories(userId: string): MemoryItem[] {
  if (!secondBrainStore.memories.has(userId)) {
    secondBrainStore.memories.set(userId, [
      { id: "1", title: "Finished Lumora V2", description: "Successfully pushed the rebalanced glassmorphic UI layout. User loved it!", tags: ["breakthrough", "achievement"], created_at: new Date().toISOString() },
      { id: "2", title: "Quote on Simplicity", description: "\"Simplicity is the ultimate sophistication.\" — Leonardo da Vinci", tags: ["quote", "wisdom"], created_at: new Date().toISOString() },
    ]);
  }
  return secondBrainStore.memories.get(userId) || [];
}
 
export class SecondBrainRepository {
  /** Brain Dumps CRUD */
  static async getBrainDumps(userId: string): Promise<BrainDump[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("brain_dumps")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
 
      if (error) throw error;
      return data as BrainDump[];
    } catch (e: any) {
      console.warn("⚠️ brain_dumps fetch failed, using local storage:", e.message);
      return getFallbackDumps(userId);
    }
  }
 
  static async upsertBrainDump(userId: string, dump: Omit<BrainDump, "id" | "created_at"> & { id?: string }): Promise<BrainDump> {
    const id = dump.id || crypto.randomUUID();
    const newDump: BrainDump = {
      id,
      category: dump.category,
      content: dump.content,
      tags: dump.tags,
      created_at: new Date().toISOString(),
    };
 
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("brain_dumps")
        .upsert({
          id,
          user_id: userId,
          category: dump.category,
          content: dump.content,
          tags: dump.tags,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();
 
      if (error) throw error;
      return data as BrainDump;
    } catch (e: any) {
      console.warn("⚠️ brain_dumps upsert failed, using local storage:", e.message);
      const list = getFallbackDumps(userId);
      const idx = list.findIndex(d => d.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...newDump };
      } else {
        list.unshift(newDump);
      }
      secondBrainStore.brainDumps.set(userId, list);
      return newDump;
    }
  }
 
  static async deleteBrainDump(userId: string, dumpId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("brain_dumps").delete().eq("id", dumpId).eq("user_id", userId);
      if (error) throw error;
      return true;
    } catch (e: any) {
      console.warn("⚠️ brain_dumps delete failed, using local storage:", e.message);
      const list = getFallbackDumps(userId);
      const filtered = list.filter(d => d.id !== dumpId);
      secondBrainStore.brainDumps.set(userId, filtered);
      return true;
    }
  }
 
  /** Habits check-in queries */
  static async getHabits(userId: string, dateStr: string): Promise<HabitLog[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("habit_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("logged_date", dateStr);
 
      if (error) throw error;
      return data as HabitLog[];
    } catch (e: any) {
      console.warn("⚠️ habit_logs query failed, using local storage:", e.message);
      const allHabits = getFallbackHabits(userId);
      return allHabits.filter(h => h.logged_date === dateStr);
    }
  }
 
  static async toggleHabit(userId: string, name: string, dateStr: string, status: boolean): Promise<HabitLog> {
    const id = crypto.randomUUID();
    const newLog: HabitLog = { id, name, logged_date: dateStr, status };
 
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("habit_logs")
        .upsert({
          user_id: userId,
          name,
          logged_date: dateStr,
          status,
        }, { onConflict: "user_id,name,logged_date" })
        .select("*")
        .single();
 
      if (error) throw error;
      return data as HabitLog;
    } catch (e: any) {
      console.warn("⚠️ habit_logs write failed, using local storage:", e.message);
      const list = getFallbackHabits(userId);
      const idx = list.findIndex(h => h.name === name && h.logged_date === dateStr);
      if (idx !== -1) {
        list[idx].status = status;
      } else {
        list.push(newLog);
      }
      secondBrainStore.habits.set(userId, list);
      return newLog;
    }
  }
 
  /** Core Values and Rules */
  static async getCoreValues(userId: string): Promise<CoreValues> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("core_values")
        .select("*")
        .eq("user_id", userId)
        .single();
 
      if (error) throw error;
      return {
        values_list: data.values_list || [],
        personal_rules: data.personal_rules || [],
        goals: data.goals || [],
      };
    } catch (e: any) {
      console.warn("⚠️ core_values query failed, using local storage:", e.message);
      return getFallbackValues(userId);
    }
  }
 
  static async upsertCoreValues(userId: string, values: CoreValues): Promise<CoreValues> {
    try {
      const supabase = await createClient();
      await supabase
        .from("core_values")
        .upsert({
          user_id: userId,
          values_list: values.values_list,
          personal_rules: values.personal_rules,
          goals: values.goals,
          updated_at: new Date().toISOString(),
        });
      return values;
    } catch (e: any) {
      console.warn("⚠️ core_values write failed, using local storage:", e.message);
      secondBrainStore.coreValues.set(userId, values);
      return values;
    }
  }
 
  /** Wellbeing Logs */
  static async getWellbeingLogs(userId: string): Promise<WellbeingLog[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("wellbeing_logs")
        .select("*")
        .eq("user_id", userId)
        .order("logged_date", { ascending: false });
 
      if (error) throw error;
      return data as WellbeingLog[];
    } catch (e: any) {
      console.warn("⚠️ wellbeing_logs query failed, using local storage:", e.message);
      return getFallbackWellbeing(userId);
    }
  }
 
  static async logWellbeing(userId: string, log: Omit<WellbeingLog, "id" | "created_at">): Promise<WellbeingLog> {
    const id = crypto.randomUUID();
    const newLog: WellbeingLog = {
      ...log,
      id,
      created_at: new Date().toISOString(),
    };
 
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("wellbeing_logs")
        .upsert({
          user_id: userId,
          mood: Number(log.mood),
          energy: Number(log.energy),
          stress: Number(log.stress),
          notes: log.notes,
          logged_date: log.logged_date,
        })
        .select("*")
        .single();
 
      if (error) throw error;
      return data as WellbeingLog;
    } catch (e: any) {
      console.warn("⚠️ wellbeing_logs write failed, using local storage:", e.message);
      const list = getFallbackWellbeing(userId);
      list.unshift(newLog);
      secondBrainStore.wellbeing.set(userId, list);
      return newLog;
    }
  }
 
  /** Memory Vault scrapbook methods */
  static async getMemories(userId: string): Promise<MemoryItem[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("memory_vault")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
 
      if (error) throw error;
      return data as MemoryItem[];
    } catch (e: any) {
      console.warn("⚠️ memory_vault query failed, using local storage:", e.message);
      return getFallbackMemories(userId);
    }
  }
 
  static async addMemory(userId: string, memory: Omit<MemoryItem, "id" | "created_at">): Promise<MemoryItem> {
    const id = crypto.randomUUID();
    const newMemory: MemoryItem = {
      ...memory,
      id,
      created_at: new Date().toISOString(),
    };
 
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("memory_vault")
        .insert({
          id,
          user_id: userId,
          title: memory.title,
          description: memory.description,
          tags: memory.tags,
        })
        .select("*")
        .single();
 
      if (error) throw error;
      return data as MemoryItem;
    } catch (e: any) {
      console.warn("⚠️ memory_vault write failed, using local storage:", e.message);
      const list = getFallbackMemories(userId);
      list.unshift(newMemory);
      secondBrainStore.memories.set(userId, list);
      return newMemory;
    }
  }
 
  static async deleteMemory(userId: string, memoryId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("memory_vault").delete().eq("id", memoryId).eq("user_id", userId);
      if (error) throw error;
      return true;
    } catch (e: any) {
      console.warn("⚠️ memory_vault delete failed, using local storage:", e.message);
      const list = getFallbackMemories(userId);
      const filtered = list.filter(m => m.id !== memoryId);
      secondBrainStore.memories.set(userId, filtered);
      return true;
    }
  }
}
