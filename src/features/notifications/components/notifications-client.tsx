"use client";

import React, { useState, useTransition } from "react";
import { AppNotification } from "@/features/notifications/repository";
import { markNotificationReadAction, markAllNotificationsReadAction, deleteNotificationAction } from "@/features/notifications/actions";
import { Bell, AlertTriangle, Target, RefreshCw, Cpu, CheckCircle2, X, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "@/lib/utils/date";

const typeConfig = {
  budget: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  goal: { icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  subscription: { icon: RefreshCw, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  ai: { icon: Cpu, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  system: { icon: Bell, color: "text-zinc-400", bg: "bg-zinc-800 border-zinc-700" },
};

export function NotificationsClient({ notifications }: { notifications: AppNotification[] }) {
  const [items, setItems] = useState(notifications);
  const [isPending, startTransition] = useTransition();

  const unreadCount = items.filter(n => !n.is_read).length;

  const handleMarkRead = (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    startTransition(async () => {
      const result = await markNotificationReadAction(id);
      if (!result.success) toast.error(result.error);
    });
  };

  const handleMarkAllRead = () => {
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.success) toast.error(result.error);
      else toast.success("All notifications marked as read");
    });
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(n => n.id !== id));
    startTransition(async () => {
      const result = await deleteNotificationAction(id);
      if (!result.success) toast.error(result.error);
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-zinc-700" />
        </div>
        <p className="text-sm font-semibold text-zinc-400">All caught up!</p>
        <p className="text-xs text-zinc-600 mt-1">No notifications yet. We&apos;ll alert you when something needs attention.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header Actions */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-zinc-500">{unreadCount} unread</span>
          <button onClick={handleMarkAllRead} disabled={isPending}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        </div>
      )}

      {/* Notification Items */}
      <div className="space-y-2">
        {items.map((notification) => {
          const cfg = typeConfig[notification.type] || typeConfig.system;
          const Icon = cfg.icon;

          return (
            <div
              key={notification.id}
              className={`relative flex gap-3 p-4 rounded-2xl border transition-all ${
                notification.is_read
                  ? "bg-zinc-900/50 border-zinc-800/50 opacity-60"
                  : "bg-zinc-900 border-zinc-800"
              }`}
            >
              {/* Type Icon */}
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                <Icon className={`w-4.5 h-4.5 ${cfg.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0" onClick={() => !notification.is_read && handleMarkRead(notification.id)}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white leading-tight">{notification.title}</p>
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{notification.message}</p>
                <p className="text-[10px] text-zinc-600 mt-1.5">
                  {formatDistanceToNow(new Date(notification.created_at))}
                </p>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(notification.id)}
                className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center text-zinc-700 hover:text-zinc-400 hover:bg-zinc-800 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
