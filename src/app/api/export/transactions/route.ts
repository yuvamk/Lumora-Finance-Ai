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
  
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = transactions.map((t: Record<string, unknown>) => {
    const cats = t.categories as { name: string } | null;
    return [
      escapeCsv(t.date),
      escapeCsv(t.type),
      escapeCsv(t.amount),
      escapeCsv(t.currency_symbol),
      escapeCsv(cats?.name),
      escapeCsv(t.notes),
    ].join(",");
  });

  const csv = [headers.map(h => `"${h}"`).join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="lumora-transactions.csv"`,
    },
  });
}
