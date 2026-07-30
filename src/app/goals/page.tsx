import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FinanceRepository } from "@/features/finance-engine/repositories/finance.repository";
import { GoalList } from "@/features/goals/components/goal-list";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch initial savings goals progress from analytical view
  const { data: goals } = await FinanceRepository.getGoalsProgress(user.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 pb-28">
      {/* Page Header */}
      <header className="mb-6 select-none">
        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Targets manager</span>
        <h1 className="text-2xl font-bold tracking-tight">Savings Goals</h1>
      </header>

      {/* Main goals list coordinator */}
      <main>
        <GoalList initialGoals={goals} />
      </main>
    </div>
  );
}
