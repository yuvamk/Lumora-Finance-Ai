import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { SearchEngine } from "@/features/search-engine/search-provider";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ results: [] });

  try {
    // Search transactions via existing SearchEngine
    const txResults = await SearchEngine.searchTransactions(user.id, { query: q, limit: 10 });

    // Search budgets (name/category ILIKE)
    const { data: budgets } = await supabase
      .from("budgets")
      .select("id, categories(name), limit_amount")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .limit(5);

    // Search goals
    const { data: goals } = await supabase
      .from("goals")
      .select("id, name, target_amount, current_balance")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .ilike("name", `%${q}%`)
      .limit(5);

    // Search subscriptions
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id, name, amount")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .ilike("name", `%${q}%`)
      .limit(5);

    const results = [
      ...(txResults as Record<string, unknown>[]).map((t) => ({
        id: t.id as string,
        type: "transaction" as const,
        title: (t.notes as string) || `${t.type} transaction`,
        subtitle: `${t.date} · ${(t.categories as { name: string } | null)?.name || "Uncategorized"}`,
        amount: Number(t.amount),
      })),
      ...(budgets || []).map((b: Record<string, unknown>) => ({
        id: b.id as string,
        type: "budget" as const,
        title: `Budget: ${(b.categories as { name: string } | null)?.name || "Category"}`,
        subtitle: "Monthly limit",
        amount: Number(b.limit_amount),
      })).filter(b => b.title.toLowerCase().includes(q.toLowerCase())),
      ...(goals || []).map((g: Record<string, unknown>) => ({
        id: g.id as string,
        type: "goal" as const,
        title: g.name as string,
        subtitle: "Savings goal",
        amount: Number(g.target_amount),
      })),
      ...(subs || []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        type: "subscription" as const,
        title: s.name as string,
        subtitle: "Subscription",
        amount: Number(s.amount),
      })),
    ].slice(0, 20);

    return NextResponse.json({ results });
  } catch (e) {
    console.error("Search error:", e);
    return NextResponse.json({ results: [] });
  }
}
