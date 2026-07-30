import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Shield, LogOut } from "lucide-react";
import Link from "next/link";
import { ChangePasswordForm } from "@/features/settings/components/change-password-form";
import { signOutAction } from "@/features/auth/actions";

export default async function SecuritySettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 pb-28">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
        </Link>
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Settings</span>
          <h1 className="text-xl font-bold">Security</h1>
        </div>
      </header>

      {/* Change Password */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-white">Change Password</p>
        </div>
        <ChangePasswordForm />
      </div>

      {/* Sign out all sessions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <form action={signOutAction}>
          <button type="submit"
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-rose-950/20 transition-colors text-left group">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 group-hover:bg-rose-950/40 flex items-center justify-center flex-shrink-0 transition-colors">
              <LogOut className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-400">Sign Out</p>
              <p className="text-[11px] text-zinc-600">Sign out from all devices</p>
            </div>
          </button>
        </form>
      </div>

      {/* Signed in as */}
      <p className="text-center text-[11px] text-zinc-700 mt-5">
        Signed in as <span className="text-zinc-500">{user.email}</span>
      </p>
    </div>
  );
}
