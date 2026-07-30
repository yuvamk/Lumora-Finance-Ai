import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 select-none group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-white tracking-tight">Lumora AI</span>
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest leading-none font-semibold">
            Financial Intelligence
          </p>
        </div>
      </Link>

      {/* Content */}
      <div className="w-full max-w-sm relative z-10">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-[10px] text-zinc-700 text-center select-none">
        © 2026 Lumora AI · Privacy · Terms
      </p>
    </div>
  );
}
