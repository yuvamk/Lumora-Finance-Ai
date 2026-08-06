import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TransactionRepository } from "@/features/transactions/repository";
import { LedgerClient } from "@/features/transactions/components/ledger-client";

export default async function LedgerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch categories using server client
  const { data: categoriesDb, error: catError } = await supabase
    .from("categories")
    .select("id, name, type, icon, color")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (catError) {
    throw new Error(`Failed to load categories: ${catError.message}`);
  }

  // Map database categories safely
  const categories = (categoriesDb || []).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    icon: c.icon || "credit-card",
    color: c.color || "#6366f1",
  }));

  // Fetch initial transactions matching repository bounds
  const initialTransactions = await TransactionRepository.getTransactions(user.id, {
    limit: 50,
  });

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col pb-28">
      {/* Mini App Bar Header */}
      <header className="px-4 pt-6 pb-2 bg-transparent flex flex-col gap-0.5 select-none">
        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Timeline</span>
        <h1 className="text-2xl font-bold tracking-tight">Ledger Journal</h1>
      </header>

      {/* Timeline core */}
      <main className="flex-1">
        <LedgerClient 
          initialTransactions={initialTransactions} 
          categories={categories} 
          userId={user.id} 
        />
      </main>
    </div>
  );
}
