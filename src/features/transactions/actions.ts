"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TransactionRepository } from "./repository";
import { 
  createTransactionSchema, 
  updateTransactionSchema, 
  bulkUpdateTransactionsSchema,
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  BulkUpdateTransactionsInput
} from "./schemas";

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Server Action to create a new transaction.
 * Runs validation, verifies session, and invalidates page cache.
 */
export async function createTransactionAction(
  input: CreateTransactionInput
): Promise<ActionResponse<Transaction>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    // Resolve category if not provided or empty
    let categoryId = input.category_id;
    if (!categoryId) {
      const { data: serverCats } = await supabase
        .from("categories")
        .select("id, type")
        .is("deleted_at", null);
      
      const fallback = serverCats?.find(c => c.type === input.type) || serverCats?.[0];
      if (fallback) {
        categoryId = fallback.id;
      }
    }

    // Validate schema
    const parsedInput = createTransactionSchema.parse({
      ...input,
      category_id: categoryId,
    });
    
    // Write via Repository DAL
    const data = await TransactionRepository.createTransaction(user.id, parsedInput);
    
    // Invalidate Next.js cache boundaries
    revalidatePath("/dashboard");
    revalidatePath("/ledger");

    return { success: true, data };
  } catch (error) {
    console.error("Action error in createTransactionAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to update an existing transaction.
 */
export async function updateTransactionAction(
  id: string,
  input: UpdateTransactionInput
): Promise<ActionResponse<Transaction>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    const parsedInput = updateTransactionSchema.parse(input);
    const data = await TransactionRepository.updateTransaction(user.id, id, parsedInput);

    revalidatePath("/dashboard");
    revalidatePath("/ledger");

    return { success: true, data };
  } catch (error) {
    console.error("Action error in updateTransactionAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to delete a transaction.
 */
export async function deleteTransactionAction(
  id: string,
  softDelete: boolean = true
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    await TransactionRepository.deleteTransaction(user.id, id, softDelete);

    revalidatePath("/dashboard");
    revalidatePath("/ledger");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Action error in deleteTransactionAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to bulk update a list of transactions.
 */
export async function bulkUpdateTransactionsAction(
  input: BulkUpdateTransactionsInput
): Promise<ActionResponse<Transaction[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    const parsedInput = bulkUpdateTransactionsSchema.parse(input);
    const data = await TransactionRepository.bulkUpdateTransactions(user.id, parsedInput);

    revalidatePath("/dashboard");
    revalidatePath("/ledger");

    return { success: true, data };
  } catch (error) {
    console.error("Action error in bulkUpdateTransactionsAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

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

/**
 * Server Action to parse natural language finance statements using Claude.
 */
export async function parseExpenseNlpAction(
  text: string
): Promise<ActionResponse<NlpParsedTransaction>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    // 1. Fetch user categories to inject in system prompt
    const { data: dbCategories, error: catError } = await supabase
      .from("categories")
      .select("id, name")
      .is("deleted_at", null);

    if (catError) {
      throw new Error(`Failed to load categories: ${catError.message}`);
    }

    const categories = dbCategories || [];
    const categoriesList = categories.map((c) => c.name).join(", ");
    const defaultCategoryId = categories[0]?.id || "";

    const todayStr = new Date().toISOString().slice(0, 10);
    const nowTimeStr = new Date().toLocaleTimeString("en-GB", { hour12: false });

    // 2. Call Claude API securely from server-side env
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    let parsedResult: any = null;

    if (claudeApiKey) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": claudeApiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 800,
          messages: [
            {
              role: "user",
              content: `Analyze this statement: "${text}".
Extract the transaction properties and return ONLY a raw JSON object with the following structure:
{
  "amount": 0.00,
  "type": "expense" | "income" | "transfer",
  "merchant": "...",
  "item": "...",
  "categorySuggestion": "must match exactly one of: [${categoriesList}]",
  "paymentMethod": "...",
  "notes": "...",
  "date": "YYYY-MM-DD",
  "time": "HH:MM:SS",
  "isRecurring": false
}

Note:
- Default type to "expense" unless income/transfer is specified.
- If currency is ₹/rupees/INR or anything else, extract only the number as amount (e.g. ₹320 -> 320).
- If date is not specified, default to "${todayStr}".
- If time is not specified, default to "${nowTimeStr}".
- Suggested category MUST be one of: [${categoriesList}]. Choose the best match.
- Do not include markdown code blocks. Return only raw JSON.`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const textContent = data.content?.[0]?.text || "";
        const cleanJson = textContent.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedResult = JSON.parse(cleanJson);
      } else {
        console.error("Claude NLP API status error:", response.status, await response.text());
      }
    }

    // 3. Fallback parser if API fails or is not configured
    if (!parsedResult) {
      console.warn("⚠️ NLP Fallback parser triggered.");
      
      // Basic regex amount extraction
      const amountMatch = text.match(/(?:₹|rs\.?|rupees?|\$)\s*(\d+(?:\.\d{2})?)|(\d+(?:\.\d{2})?)\s*(?:₹|rs\.?|rupees?|\$|inr)/i) || text.match(/\b(\d+)\b/);
      const amount = amountMatch ? parseFloat(amountMatch[1] || amountMatch[2] || amountMatch[0]) : 20.00;

      let type: "income" | "expense" | "transfer" = "expense";
      if (text.toLowerCase().includes("salary") || text.toLowerCase().includes("received") || text.toLowerCase().includes("income") || text.toLowerCase().includes("refund")) {
        type = "income";
      } else if (text.toLowerCase().includes("transfer") || text.toLowerCase().includes("sent to bank")) {
        type = "transfer";
      }

      // Infer merchant & item
      let merchant = "Merchant";
      let item = "Expense Item";
      
      const words = text.split(/\s+/);
      if (text.toLowerCase().includes("toffee")) {
        merchant = "Toffee";
        item = "Toffee";
      } else if (text.toLowerCase().includes("uber")) {
        merchant = "Uber";
        item = "Uber Ride";
      } else if (text.toLowerCase().includes("starbucks")) {
        merchant = "Starbucks";
        item = "Coffee";
      } else if (text.toLowerCase().includes("electricity")) {
        merchant = "Power Corp";
        item = "Electricity Bill";
      } else if (text.toLowerCase().includes("rent")) {
        merchant = "Landlord";
        item = "House Rent";
      } else if (words.length > 0) {
        merchant = words[0];
        item = words.slice(1).join(" ") || words[0];
      }

      // Infer category
      let categorySuggestion = "Shopping";
      if (text.toLowerCase().includes("toffee") || text.toLowerCase().includes("starbucks") || text.toLowerCase().includes("coffee") || text.toLowerCase().includes("food") || text.toLowerCase().includes("dining") || text.toLowerCase().includes("vegetables")) {
        categorySuggestion = "Food & Dining";
      } else if (text.toLowerCase().includes("uber") || text.toLowerCase().includes("taxi") || text.toLowerCase().includes("cab") || text.toLowerCase().includes("petrol") || text.toLowerCase().includes("car")) {
        categorySuggestion = "Transportation";
      } else if (text.toLowerCase().includes("electricity") || text.toLowerCase().includes("water") || text.toLowerCase().includes("utilities") || text.toLowerCase().includes("gas")) {
        categorySuggestion = "Utilities";
      } else if (text.toLowerCase().includes("rent") || text.toLowerCase().includes("housing")) {
        categorySuggestion = "Housing & Rent";
      } else if (text.toLowerCase().includes("salary") || text.toLowerCase().includes("income")) {
        categorySuggestion = "Salary";
      } else if (text.toLowerCase().includes("insurance") || text.toLowerCase().includes("health") || text.toLowerCase().includes("medical")) {
        categorySuggestion = "Insurance & Health";
      } else if (text.toLowerCase().includes("netflix") || text.toLowerCase().includes("spotify") || text.toLowerCase().includes("subscription")) {
        categorySuggestion = "Subscriptions";
      }

      parsedResult = {
        amount,
        type,
        merchant,
        item,
        categorySuggestion,
        paymentMethod: "Cash",
        notes: text,
        date: todayStr,
        time: nowTimeStr,
        isRecurring: text.toLowerCase().includes("monthly") || text.toLowerCase().includes("recurring"),
      };
    }

    // 4. Resolve category suggestion to active category UUID
    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === parsedResult.categorySuggestion?.toLowerCase()
    );
    const categoryId = matchedCategory ? matchedCategory.id : defaultCategoryId;

    return {
      success: true,
      data: {
        amount: Number(parsedResult.amount) || 0,
        type: parsedResult.type || "expense",
        merchant: parsedResult.merchant || "Merchant",
        item: parsedResult.item || "Item",
        categorySuggestion: parsedResult.categorySuggestion || "Shopping",
        categoryId,
        paymentMethod: parsedResult.paymentMethod || "Cash",
        notes: parsedResult.notes || text,
        date: parsedResult.date || todayStr,
        time: parsedResult.time || nowTimeStr,
        isRecurring: Boolean(parsedResult.isRecurring),
      },
    };
  } catch (error) {
    console.error("Action error in parseExpenseNlpAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to load all active categories.
 */
export async function getCategoriesAction(): Promise<ActionResponse<{ id: string; name: string; type: string }[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, type")
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to load categories: ${error.message}`);
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Action error in getCategoriesAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}
