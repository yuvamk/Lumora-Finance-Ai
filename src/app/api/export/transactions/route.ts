import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { ReportsRepository } from "@/features/reports/repository";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transactions = await ReportsRepository.getTransactionsForExport(user.id);

  // Build CSV in-memory
  const headers = ["Date", "Type", "Amount", "Currency", "Category", "Notes"];
  const rows = transactions.map((t: Record<string, unknown>) => {
    const cats = t.categories as { name: string } | null;
    return [
      t.date,
      t.type,
      t.amount,
      t.currency_symbol,
      cats?.name ?? "",
      `"${String(t.notes ?? "").replace(/"/g, '""')}"`,
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="lumora-transactions.csv"`,
    },
  });
}
