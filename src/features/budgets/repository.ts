import { createClient } from "@/lib/supabase/server";
import { Budget, CreateBudgetInput, UpdateBudgetInput } from "./schemas";
import { AuthRepository } from "@/features/auth/repository";

export class BudgetRepository {
  /**
   * Inserts a new budget limit configuration.
   */
  static async createBudget(userId: string, input: CreateBudgetInput): Promise<Budget> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("budgets")
      .insert({
        ...input,
        user_id: userId,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create budget: ${error.message}`);
    }

    // Append Audit trail
    await AuthRepository.logActivity({
      userId,
      action: "budget_created",
      entity: "budgets",
      entityId: data.id,
      metadata: { limit_amount: input.limit_amount, period: input.period },
    });

    return data as Budget;
  }

  /**
   * Updates an existing budget configuration.
   */
  static async updateBudget(
    userId: string,
    id: string,
    input: UpdateBudgetInput
  ): Promise<Budget> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("budgets")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update budget: ${error.message}`);
    }

    // Log update audit event
    await AuthRepository.logActivity({
      userId,
      action: "budget_updated",
      entity: "budgets",
      entityId: id,
      metadata: { updates: input },
    });

    return data as Budget;
  }

  /**
   * Deletes a budget configuration (soft deletes by default).
   */
  static async deleteBudget(userId: string, id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("budgets")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete budget: ${error.message}`);
    }

    // Log deletion audit event
    await AuthRepository.logActivity({
      userId,
      action: "budget_deleted",
      entity: "budgets",
      entityId: id,
      metadata: {},
    });
  }
}
