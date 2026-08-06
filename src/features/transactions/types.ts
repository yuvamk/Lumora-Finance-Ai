// src/features/transactions/types.ts
// Non-function exports moved out of "use server" file

import type { ActionResponse } from "@/features/auth/types";

export type { ActionResponse };

export interface NlpParsedTransaction {
  amount: number;
  type: "income" | "expense" | "transfer";
  merchant: string;
  item: string;
  categorySuggestion: string;
  categoryId: string;
  paymentMethod: string;
  notes: string;
  date: string;
  time: string;
  isRecurring: boolean;
}
