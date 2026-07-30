"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  BarChart3,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/ledger", label: "Ledger", icon: BookOpen },
  { href: "/insights", label: "AI", icon: Sparkles },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="App navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/60"
    >
      <div className="max-w-2xl mx-auto flex items-stretch pb-safe">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors group ${
                isActive ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span
                className={`relative flex items-center justify-center w-8 h-8 rounded-2xl transition-all duration-200 ${
                  isActive ? "bg-indigo-500/15" : "group-hover:bg-zinc-800/60"
                }`}
              >
                <Icon
                  className={`transition-transform duration-200 ${
                    isActive ? "w-5 h-5 scale-110" : "w-4.5 h-4.5 group-hover:scale-105"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full" />
                )}
              </span>
              <span
                className={`text-[9px] font-semibold tracking-wide uppercase select-none ${
                  isActive ? "text-indigo-400" : "text-zinc-600"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
