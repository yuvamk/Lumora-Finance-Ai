import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationsRepository } from "@/features/notifications/repository";
import { NotificationsClient } from "@/features/notifications/components/notifications-client";
import { Bell } from "lucide-react";

function NotificationsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-zinc-800 rounded w-3/4" />
              <div className="h-2 bg-zinc-800 rounded w-full" />
              <div className="h-2 bg-zinc-800 rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import { NotificationEngine } from "@/features/notifications/services/notification-engine";

async function NotificationsContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Run automated alert checks for subscription renewals and budget limits
  await NotificationEngine.checkAndGenerateAlerts(user.id).catch(err => {
    console.error("Notification check error:", err);
  });

  const notifications = await NotificationsRepository.getNotifications(user.id);

  return <NotificationsClient notifications={notifications} />;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 pb-28">
      <header className="mb-6">
        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Inbox</span>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="w-6 h-6 text-amber-400" />
          Notifications
        </h1>
      </header>

      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsContent />
      </Suspense>
    </div>
  );
}
