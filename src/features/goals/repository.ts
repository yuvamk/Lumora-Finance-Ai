import { createClient } from "@/lib/supabase/server";
import { Goal, CreateGoalInput, UpdateGoalInput, GoalTransactionInput } from "./schemas";
import { AuthRepository } from "@/features/auth/repository";

export class GoalRepository {
  /**
   * Inserts a new savings goal.
   */
  static async createGoal(userId: string, input: CreateGoalInput): Promise<Goal> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("goals")
      .insert({
        ...input,
        user_id: userId,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create savings goal: ${error.message}`);
    }

    // Append Audit trail
    await AuthRepository.logActivity({
      userId,
      action: "goal_created",
      entity: "goals",
      entityId: data.id,
      metadata: { target_amount: input.target_amount, priority: input.priority },
    });

    return data as Goal;
  }

  /**
   * Updates an existing savings goal.
   */
  static async updateGoal(
    userId: string,
    id: string,
    input: UpdateGoalInput
  ): Promise<Goal> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("goals")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update savings goal: ${error.message}`);
    }

    // Log update audit event
    await AuthRepository.logActivity({
      userId,
      action: "goal_updated",
      entity: "goals",
      entityId: id,
      metadata: { updates: input },
    });

    return data as Goal;
  }

  /**
   * Deletes a savings goal (soft deletes).
   */
  static async deleteGoal(userId: string, id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("goals")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete goal: ${error.message}`);
    }

    // Log deletion audit event
    await AuthRepository.logActivity({
      userId,
      action: "goal_deleted",
      entity: "goals",
      entityId: id,
      metadata: {},
    });
  }

  /**
   * Records a deposit or withdrawal from the savings goal.
   */
  static async recordGoalTransaction(
    userId: string,
    goalId: string,
    input: GoalTransactionInput
  ): Promise<void> {
    const supabase = await createClient();

    // Verify first that this goal belongs to the user (RLS boundary)
    const { data: goal, error: getError } = await supabase
      .from("goals")
      .select("id")
      .eq("id", goalId)
      .eq("user_id", userId)
      .single();

    if (getError || !goal) {
      throw new Error("Goal not found or unauthorized access.");
    }

    // Calculate signed amount (negative for withdrawals)
    const signedAmount = input.type === "withdrawal" ? -input.amount : input.amount;

    const { error: insertError } = await supabase
      .from("goal_progress")
      .insert({
        goal_id: goalId,
        amount: signedAmount,
      });

    if (insertError) {
      throw new Error(`Failed to record goal transaction: ${insertError.message}`);
    }

    // Check if goal completed (target met) to trigger celebration logs
    const { data: progressRow } = await supabase
      .from("vw_goal_progress")
      .select("progress_percentage")
      .eq("goal_id", goalId)
      .single();

    if (progressRow && Number(progressRow.progress_percentage) >= 100) {
      await AuthRepository.logActivity({
        userId,
        action: "goal_completed",
        entity: "goals",
        entityId: goalId,
        metadata: { completion: true },
      });
    }

    // Log standard deposit/withdrawal transaction event
    await AuthRepository.logActivity({
      userId,
      action: input.type === "deposit" ? "goal_deposited" : "goal_withdrawn",
      entity: "goals",
      entityId: goalId,
      metadata: { amount: input.amount },
    });
  }
}
