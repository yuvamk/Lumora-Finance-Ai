// src/features/second-brain/types.ts
// Non-function exports moved out of "use server" second-brain/actions.ts

import type { BrainDump, HabitLog, CoreValues, WellbeingLog, MemoryItem } from "./repository";

export interface SecondBrainSummary {
  dumps: BrainDump[];
  habits: HabitLog[];
  coreValues: CoreValues;
  wellbeing: WellbeingLog[];
  memories: MemoryItem[];
}
