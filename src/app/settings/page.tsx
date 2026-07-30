import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  User,
  Shield,
  Settings2,
  Bell,
  Palette,
  Download,
  ChevronRight,
  LogOut,
} from "lucide-react";

const settingsNav = [
  { href: "/settings/profile", label: "Profile", description: "Name, avatar, email", icon: User, color: "text-indigo-400" },
  { href: "/settings/security", label: "Security", description: "Password, sessions", icon: Shield, color: "text-emerald-400" },
  { href: "/settings/preferences", label: "Preferences", description: "Currency, timezone, format", icon: Settings2, color: "text-blue-400" },
  { href: "/settings/notifications", label: "Notifications", description: "Email and push alerts", icon: Bell, color: "text-amber-400" },
  { href: "/settings/appearance", label: "Appearance", description: "Theme, dark mode", icon: Palette, color: "text-violet-400" },
  { href: "/settings/export", label: "Export Data", description: "Download your financial data", icon: Download, color: "text-zinc-400" },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 pb-28">
      <header className="mb-6 select-none">
        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Account</span>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </header>

      {/* Profile Summary Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-white truncate">{displayName}</p>
          <p className="text-xs text-zinc-500 truncate">{profile?.email || user.email}</p>
        </div>
        <Link href="/settings/profile" className="text-zinc-600 hover:text-white transition-colors">
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Settings Navigation */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden divide-y divide-zinc-800/60">
        {settingsNav.map(({ href, label, description, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/40 transition-colors group"
          >
            <div className={`w-9 h-9 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center flex-shrink-0 transition-colors`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <form action={async () => {
          "use server";
          const supabase = await createClient();
          await supabase.auth.signOut();
          redirect("/auth/login");
        }}>
          <button
            type="submit"
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-rose-950/20 transition-colors group text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-800 group-hover:bg-rose-950/40 flex items-center justify-center flex-shrink-0 transition-colors">
              <LogOut className="w-4.5 h-4.5 text-rose-400" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-400">Sign Out</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Sign out of your account</p>
            </div>
          </button>
        </form>
      </div>

      {/* App version */}
      <p className="text-center text-[10px] text-zinc-700 mt-6 select-none">
        Lumora AI v0.1.0 · Built with ❤️ for your finances
      </p>
    </div>
  );
}
