import { createClient } from "@/lib/supabase/server";
import { Transaction, CreateTransactionInput, UpdateTransactionInput, BulkUpdateTransactionsInput } from "./schemas";
import { AuthRepository } from "@/features/auth/repository";

export interface TransactionFilters {
  limit?: number;
  offset?: number;
  type?: string;
  category_id?: string;
  merchant_id?: string;
  payment_method_id?: string;
  status?: string;
  mood?: string;
  minAmount?: number;
  maxAmount?: number;
  is_recurring?: boolean;
  hasReceipt?: boolean;
  hasNotes?: boolean;
  query?: string;
}

export class TransactionRepository {
  /**
   * Fetches user transactions matching composable filters.
   * Respects RLS bounds and soft deletes.
   */
  static async getTransactions(userId: string, filters: TransactionFilters): Promise<Transaction[]> {
    const supabase = await createClient();

    let queryBuilder = supabase
      .from("transactions")
      .select("*, categories(name)")
      .eq("user_id", userId)
      .is("deleted_at", null);

    // Apply Filters
    if (filters.type) {
      queryBuilder = queryBuilder.eq("type", filters.type);
    }
    if (filters.category_id) {
      queryBuilder = queryBuilder.eq("category_id", filters.category_id);
    }
    if (filters.merchant_id) {
      queryBuilder = queryBuilder.eq("merchant_id", filters.merchant_id);
    }
    if (filters.payment_method_id) {
      queryBuilder = queryBuilder.eq("payment_method_id", filters.payment_method_id);
    }
    if (filters.mood) {
      queryBuilder = queryBuilder.eq("mood", filters.mood);
    }
    if (filters.minAmount !== undefined) {
      queryBuilder = queryBuilder.gte("amount", filters.minAmount);
    }
    if (filters.maxAmount !== undefined) {
      queryBuilder = queryBuilder.lte("amount", filters.maxAmount);
    }
    if (filters.is_recurring !== undefined) {
      queryBuilder = queryBuilder.eq("is_recurring", filters.is_recurring);
    }
    if (filters.hasReceipt === true) {
      queryBuilder = queryBuilder.not("receipt_id", "is", null);
    }
    if (filters.hasNotes === true) {
      queryBuilder = queryBuilder.not("notes", "is", null).neq("notes", "");
    }
    if (filters.query) {
      queryBuilder = queryBuilder.ilike("notes", `%${filters.query}%`);
    }

    // Apply default sorting & pagination
    queryBuilder = queryBuilder
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(
        filters.offset || 0,
        (filters.offset || 0) + (filters.limit || 20) - 1
      );

    const { data, error } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return data as Transaction[];
  }

  /**
   * Inserts a transaction.
   */
  static async createTransaction(userId: string, input: CreateTransactionInput): Promise<Transaction> {
    const supabase = await createClient();

    // Fetch user's base currency preferences from settings table
    const { data: userSettings } = await supabase
      .from("settings")
      .select("base_currency_code, base_currency_symbol")
      .eq("user_id", userId)
      .single();

    const currencyCode = userSettings?.base_currency_code || "INR";
    const currencySymbol = userSettings?.base_currency_symbol || "₹";

    // Omit 'status' as it is a schema-only field not present in the database table
    const { status, ...dbInput } = input;

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        ...dbInput,
        currency_code: currencyCode,
        currency_symbol: currencySymbol,
        user_id: userId,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to insert transaction: ${error.message}`);
    }

    // Append Audit trail
    await AuthRepository.logActivity({
      userId,
      action: "transaction_created",
      entity: "transactions",
      entityId: data.id,
      metadata: { amount: input.amount, type: input.type },
    });

    return data as Transaction;
  }

  /**
   * Updates an existing transaction.
   */
  static async updateTransaction(
    userId: string,
    id: string,
    input: UpdateTransactionInput
  ): Promise<Transaction> {
    const supabase = await createClient();

    // Omit 'status' as it is a schema-only field not present in the database table
    const { status, ...dbInput } = input;

    const { data, error } = await supabase
      .from("transactions")
      .update({
        ...dbInput,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId) // Enforce user RLS matching security boundary
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update transaction: ${error.message}`);
    }

    // Log update audit event
    await AuthRepository.logActivity({
      userId,
      action: "transaction_updated",
      entity: "transactions",
      entityId: id,
      metadata: { updates: input },
    });

    return data as Transaction;
  }

  /**
   * Deletes a transaction (supports soft delete by default).
   */
  static async deleteTransaction(
    userId: string,
    id: string,
    softDelete: boolean = true
  ): Promise<void> {
    const supabase = await createClient();

    let error;
    if (softDelete) {
      const { error: err } = await supabase
        .from("transactions")
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId);
      error = err;
    } else {
      const { error: err } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      error = err;
    }

    if (error) {
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }

    // Log deletion audit event
    await AuthRepository.logActivity({
      userId,
      action: "transaction_deleted",
      entity: "transactions",
      entityId: id,
      metadata: { softDelete },
    });
  }

  /**
   * Bulk updates a batch of transactions.
   */
  static async bulkUpdateTransactions(
    userId: string,
    input: BulkUpdateTransactionsInput
  ): Promise<Transaction[]> {
    const supabase = await createClient();

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.category_id !== undefined) updatePayload.category_id = input.category_id;
    if (input.merchant_id !== undefined) updatePayload.merchant_id = input.merchant_id;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.mood !== undefined) updatePayload.mood = input.mood;

    const { data, error } = await supabase
      .from("transactions")
      .update(updatePayload)
      .in("id", input.ids)
      .eq("user_id", userId)
      .select("*");

    if (error) {
      throw new Error(`Bulk update transactions failed: ${error.message}`);
    }

    // Log bulk update audit event
    await AuthRepository.logActivity({
      userId,
      action: "transaction_updated",
      entity: "transactions",
      entityId: input.ids[0] || "00000000-0000-0000-0000-000000000000",
      metadata: { bulk: true, idsCount: input.ids.length, updates: updatePayload },
    });

    return data as Transaction[];
  }
}
