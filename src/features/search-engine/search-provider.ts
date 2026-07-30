import { createClient } from "@/lib/supabase/server";

export interface SearchParams {
  query: string;
  limit?: number;
  offset?: number;
}

/**
 * Reusable Search Engine.
 * Supports text-matching filters against ledger notes, tags, and category tables.
 */
export class SearchEngine {
  /**
   * Search transactions for a user based on search text queries.
   */
  static async searchTransactions(userId: string, params: SearchParams): Promise<unknown[]> {
    const supabase = await createClient();

    // Standard parameterized text search using PostgreSQL ILIKE
    const { data, error } = await supabase
      .from("transactions")
      .select("*, categories(name)")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .ilike("notes", `%${params.query}%`)
      .order("date", { ascending: false })
      .range(params.offset || 0, (params.offset || 0) + (params.limit || 20) - 1);

    if (error) {
      throw new Error(`SearchEngine transaction search failed: ${error.message}`);
    }

    return data;
  }
}
