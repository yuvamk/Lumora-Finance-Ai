import { createClient } from "@/lib/supabase/server";
import { Subscription, CreateSubscriptionInput, UpdateSubscriptionInput } from "./schemas";
import { AuthRepository } from "@/features/auth/repository";

export class SubscriptionRepository {
  /**
   * Retrieves active subscriptions for a user.
   */
  static async getSubscriptions(userId: string): Promise<Subscription[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        id,
        user_id,
        name,
        amount,
        billing_period,
        start_date,
        next_billing_date,
        category_id,
        payment_method_id,
        status,
        created_at,
        updated_at,
        deleted_at
      `)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("next_billing_date", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      amount: Number(row.amount),
      billing_period: row.billing_period,
      start_date: row.start_date,
      next_billing_date: row.next_billing_date,
      category_id: row.category_id,
      payment_method_id: row.payment_method_id,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
    })) as Subscription[];
  }

  /**
   * Inserts a new subscription profile.
   */
  static async createSubscription(userId: string, input: CreateSubscriptionInput): Promise<Subscription> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        ...input,
        user_id: userId,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    // Append Audit activity log
    await AuthRepository.logActivity({
      userId,
      action: "transaction_created", // map to generic transaction logs
      entity: "subscriptions",
      entityId: data.id,
      metadata: { name: input.name, amount: input.amount },
    });

    return data as Subscription;
  }

  /**
   * Updates an existing subscription configuration.
   */
  static async updateSubscription(
    userId: string,
    id: string,
    input: UpdateSubscriptionInput
  ): Promise<Subscription> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("subscriptions")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    return data as Subscription;
  }

  /**
   * Soft deletes a subscription profile.
   */
  static async deleteSubscription(userId: string, id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("subscriptions")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete subscription: ${error.message}`);
    }
  }
}
