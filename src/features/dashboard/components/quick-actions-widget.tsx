import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PiggyBank, Target, RefreshCw, BookOpen, Zap, Brain, Sparkles } from "lucide-react";
 
const quickActions = [
  {
    label: "Ledger",
    description: "Add transaction",
    href: "/ledger",
    icon: BookOpen,
    colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    label: "Budgets",
    description: "Manage limits",
    href: "/budgets",
    icon: PiggyBank,
    colorClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
  {
    label: "Goals",
    description: "Save targets",
    href: "/goals",
    icon: Target,
    colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    label: "Recurring",
    description: "Subscriptions",
    href: "/subscriptions",
    icon: RefreshCw,
    colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    label: "Brain Dump",
    description: "Save thoughts",
    href: "/insights?tab=brainDump",
    icon: Brain,
    colorClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    label: "Habit Tracker",
    description: "Check rituals",
    href: "/insights?tab=habits",
    icon: Sparkles,
    colorClass: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
];

export function QuickActionsWidget() {
  return (
    <Card className="bg-white/[0.03] backdrop-blur-xl border-white/[0.08] rounded-3xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />
          <CardTitle className="text-sm font-bold text-white">Quick Navigation</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <div className="grid grid-cols-2 gap-2.5">
          {quickActions.map(({ label, description, href, icon: Icon, colorClass }) => (
            <Link
              key={href}
              href={href}
              className={`group flex flex-col items-start gap-2 p-3.5 rounded-2xl border ${colorClass} bg-opacity-10 hover:bg-opacity-20 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]`}
            >
              <Icon className="w-4.5 h-4.5" strokeWidth={1.75} />
              <div>
                <p className="text-xs font-bold text-white">{label}</p>
                <p className="text-[9px] text-zinc-500 leading-tight mt-0.5">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
