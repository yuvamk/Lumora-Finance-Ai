import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthRepository } from "@/features/auth/repository";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PreferencesForm } from "@/features/settings/components/preferences-form";

export default async function PreferencesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const settings = await AuthRepository.getSettings(user.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 pb-28">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
        </Link>
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Settings</span>
          <h1 className="text-xl font-bold">Preferences</h1>
        </div>
      </header>
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
        <PreferencesForm
          currentCurrencyCode={settings?.base_currency_code ?? "USD"}
          currentCurrencySymbol={settings?.base_currency_symbol ?? "$"}
          currentTimezone={settings?.timezone ?? "UTC"}
        />
      </div>
    </div>
  );
}
