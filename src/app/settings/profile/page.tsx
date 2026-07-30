import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/features/settings/components/profile-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  const initials = (profile?.display_name || user.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 pb-28">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
        </Link>
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Settings</span>
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
      </header>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6 p-5 bg-zinc-900 border border-zinc-800 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-sm font-bold text-white">{profile?.display_name || "Set your name"}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{profile?.email || user.email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
        <ProfileForm
          displayName={profile?.display_name ?? null}
          email={profile?.email || user.email || ""}
          avatarUrl={profile?.avatar_url ?? null}
        />
      </div>
    </div>
  );
}
