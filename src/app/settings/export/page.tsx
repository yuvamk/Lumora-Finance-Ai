import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { ExportButton } from "@/features/reports/components/export-button";

export default async function ExportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get transaction count for info
  const { count } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("deleted_at", null);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 pb-28">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
        </Link>
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Settings</span>
          <h1 className="text-xl font-bold">Export Data</h1>
        </div>
      </header>

      {/* Transaction Export */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center">
            <Download className="w-4.5 h-4.5 text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Transactions CSV</p>
            <p className="text-xs text-zinc-500">{count ?? 0} transactions available</p>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
          Download all your transactions as a CSV file. Includes date, type, amount, category, and notes.
          Compatible with Excel, Google Sheets, and most accounting software.
        </p>
        <ExportButton userId={user.id} />
      </div>

      {/* More export options placeholder */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-5">
        <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">Coming Soon</p>
        <div className="space-y-2 text-xs text-zinc-700">
          <p>• PDF Financial Report</p>
          <p>• Budget History Export</p>
          <p>• Goals History Export</p>
          <p>• Full Account Archive (ZIP)</p>
        </div>
      </div>
    </div>
  );
}
