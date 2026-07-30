import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FinanceRepository } from "@/features/finance-engine/repositories/finance.repository";
import { BudgetList } from "@/features/budgets/components/budget-list";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch initial budgets data from view
  const { data: budgets } = await FinanceRepository.getBudgetsProgress(user.id);

  // Fetch categories to populate selectors in the modal
  const { data: categoriesDb } = await supabase
    .from("categories")
    .select("id, name")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  const categories = (categoriesDb || []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 pb-28">
      {/* Page Header */}
      <header className="mb-6 select-none">
        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Limits manager</span>
        <h1 className="text-2xl font-bold tracking-tight">Category Budgets</h1>
      </header>

      {/* Main budgets client manager */}
      <main>
        <BudgetList 
          initialBudgets={budgets} 
          categories={categories} 
        />
      </main>
    </div>
  );
}
