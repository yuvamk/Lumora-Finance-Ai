import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionRepository } from "@/features/subscriptions/repository";
import { SubscriptionList } from "@/features/subscriptions/components/subscription-list";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch tracked subscriptions
  const subscriptions = await SubscriptionRepository.getSubscriptions(user.id);

  // Fetch categories to populate dropdowns in forms
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
        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Commitments tracker</span>
        <h1 className="text-2xl font-bold tracking-tight">Recurring Subscriptions</h1>
      </header>

      {/* Main client coordinator */}
      <main>
        <SubscriptionList 
          initialSubscriptions={subscriptions} 
          categories={categories} 
        />
      </main>
    </div>
  );
}
