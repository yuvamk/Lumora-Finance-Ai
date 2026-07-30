"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BudgetRepository } from "./repository";
import { 
  createBudgetSchema, 
  updateBudgetSchema, 
  Budget, 
  CreateBudgetInput, 
  UpdateBudgetInput 
} from "./schemas";
import { ActionResponse } from "@/features/transactions/actions";

/**
 * Server Action to create a new budget configuration.
 */
export async function createBudgetAction(
  input: CreateBudgetInput
): Promise<ActionResponse<Budget>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    const parsedInput = createBudgetSchema.parse(input);
    const data = await BudgetRepository.createBudget(user.id, parsedInput);

    // Invalidate Next.js cache paths
    revalidatePath("/dashboard");
    revalidatePath("/budgets");

    return { success: true, data };
  } catch (error) {
    console.error("Action error in createBudgetAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to update an existing budget configuration.
 */
export async function updateBudgetAction(
  id: string,
  input: UpdateBudgetInput
): Promise<ActionResponse<Budget>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    const parsedInput = updateBudgetSchema.parse(input);
    const data = await BudgetRepository.updateBudget(user.id, id, parsedInput);

    revalidatePath("/dashboard");
    revalidatePath("/budgets");

    return { success: true, data };
  } catch (error) {
    console.error("Action error in updateBudgetAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to delete a budget configuration.
 */
export async function deleteBudgetAction(
  id: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    await BudgetRepository.deleteBudget(user.id, id);

    revalidatePath("/dashboard");
    revalidatePath("/budgets");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Action error in deleteBudgetAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}
