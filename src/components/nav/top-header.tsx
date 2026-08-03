import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NotificationsRepository } from "@/features/notifications/repository";
import { Bell, Search } from "lucide-react";

import { NotificationEngine } from "@/features/notifications/services/notification-engine";

export async function TopHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Run automated alert checks for subscription renewals and budget limits
  await NotificationEngine.checkAndGenerateAlerts(user.id).catch(() => {});

  const [profile, unreadCount] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single().then(r => r.data),
    NotificationsRepository.getUnreadCount(user.id).catch(() => 0),
  ]);

  const initials = (profile?.display_name || user.email || "U").slice(0, 2).toUpperCase();
  const firstName = profile?.display_name?.split(" ")[0] || "there";

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/40 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        {/* Greeting */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500">Good {getTimeOfDay()}</p>
          <p className="text-sm font-bold text-white truncate">{firstName} 👋</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search */}
          <Link href="/search"
            className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors">
            <Search className="w-4 h-4 text-zinc-400" />
          </Link>

          {/* Notifications */}
          <Link href="/notifications" className="relative w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors">
            <Bell className="w-4 h-4 text-zinc-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-indigo-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar */}
          <Link href="/settings/profile"
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-shadow">
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
