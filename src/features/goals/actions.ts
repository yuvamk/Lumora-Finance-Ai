"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { GoalRepository } from "./repository";
import { 
  createGoalSchema, 
  updateGoalSchema, 
  goalTransactionSchema,
  Goal, 
  CreateGoalInput, 
  UpdateGoalInput,
  GoalTransactionInput
} from "./schemas";
import { ActionResponse } from "@/features/transactions/actions";

/**
 * Server Action to create a new savings goal.
 */
export async function createGoalAction(
  input: CreateGoalInput
): Promise<ActionResponse<Goal>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    const parsedInput = createGoalSchema.parse(input);
    const data = await GoalRepository.createGoal(user.id, parsedInput);

    revalidatePath("/dashboard");
    revalidatePath("/goals");

    return { success: true, data };
  } catch (error) {
    console.error("Action error in createGoalAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to update an existing savings goal.
 */
export async function updateGoalAction(
  id: string,
  input: UpdateGoalInput
): Promise<ActionResponse<Goal>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    const parsedInput = updateGoalSchema.parse(input);
    const data = await GoalRepository.updateGoal(user.id, id, parsedInput);

    revalidatePath("/dashboard");
    revalidatePath("/goals");

    return { success: true, data };
  } catch (error) {
    console.error("Action error in updateGoalAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to delete a savings goal.
 */
export async function deleteGoalAction(
  id: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    await GoalRepository.deleteGoal(user.id, id);

    revalidatePath("/dashboard");
    revalidatePath("/goals");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Action error in deleteGoalAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to record a deposit or withdrawal from a savings goal.
 */
export async function recordGoalTransactionAction(
  goalId: string,
  input: GoalTransactionInput
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    const parsedInput = goalTransactionSchema.parse(input);
    await GoalRepository.recordGoalTransaction(user.id, goalId, parsedInput);

    revalidatePath("/dashboard");
    revalidatePath("/goals");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Action error in recordGoalTransactionAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}
