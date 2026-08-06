import React from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw, Calendar } from "lucide-react";
import Link from "next/link";

interface SubscriptionsWidgetProps {
  userId: string;
}

export async function SubscriptionsWidget({ userId }: SubscriptionsWidgetProps) {
  const supabase = await createClient();

  const { data: subs, error } = await supabase
    .from("subscriptions")
    .select("id, name, amount, billing_period, next_billing_date, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("next_billing_date", { ascending: true })
    .limit(5);

  if (error) {
    // Graceful widget-level degradation
    return (
      <Card className="bg-white/[0.03] backdrop-blur-xl border-white/[0.08] rounded-3xl">
        <CardContent className="p-6 py-8 text-center">
          <span className="text-xs text-zinc-500">Could not load subscriptions.</span>
        </CardContent>
      </Card>
    );
  }

  const subscriptions = subs || [];

  // Calculate monthly equivalent cost
  const monthlyTotal = subscriptions.reduce((acc, s) => {
    let monthly = s.amount;
    if (s.billing_period === "weekly") monthly = s.amount * 4.33;
    else if (s.billing_period === "yearly") monthly = s.amount / 12;
    else if (s.billing_period === "daily") monthly = s.amount * 30;
    return acc + monthly;
  }, 0);

  return (
    <Card className="bg-white/[0.03] backdrop-blur-xl border-white/[0.08] rounded-3xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Recurring
            </span>
            <CardTitle className="text-lg font-bold text-white mt-0.5">Subscriptions</CardTitle>
          </div>
          <RefreshCw className="w-5 h-5 text-indigo-400 animate-[spin_8s_linear_infinite]" />
        </div>
        <CardDescription className="text-xs text-zinc-500">
          Active recurring commitments tracked this month.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-3">
        {/* Monthly total pill */}
        <div className="flex items-baseline justify-between bg-black/25 border border-white/[0.05] rounded-2xl px-4 py-2.5">
          <span className="text-xs text-zinc-550">Monthly commitment</span>
          <span className="text-sm font-bold font-mono text-white">${monthlyTotal.toFixed(2)}</span>
        </div>

        {subscriptions.length === 0 ? (
          <div className="py-6 text-center">
            <span className="text-xs text-zinc-500">No active subscriptions tracked yet.</span>
          </div>
        ) : (
          subscriptions.slice(0, 4).map((s) => {
            const nextDate = new Date(s.next_billing_date);
            const daysUntil = Math.ceil(
              (nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            const isRenewalSoon = daysUntil <= 5;

            return (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl hover:border-white/[0.08] transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-zinc-350">
                    {s.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">{s.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-550" />
                      <span className={`text-[9px] font-mono ${isRenewalSoon ? "text-amber-400" : "text-zinc-650"}`}>
                        {isRenewalSoon ? `Renews in ${daysUntil}d` : nextDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono text-zinc-300">
                  ${s.amount.toFixed(2)}
                  <span className="text-[9px] text-zinc-600 font-normal ml-0.5">/{s.billing_period.slice(0, 2)}</span>
                </span>
              </div>
            );
          })
        )}

        {subscriptions.length > 0 && (
          <Link
            href="/subscriptions"
            className="block text-center text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider transition-colors pt-1"
          >
            View all {subscriptions.length} subscriptions →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function SubscriptionsWidgetSkeleton() {
  return (
    <Card className="bg-white/[0.02] border-white/[0.06] rounded-3xl h-72 animate-pulse" />
  );
}
