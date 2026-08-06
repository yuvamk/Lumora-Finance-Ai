"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/nav/bottom-nav";
import { QuickAddButton } from "@/components/nav/quick-add-button";

interface AppLayoutProps {
  children: React.ReactNode;
  topHeader: React.ReactNode;
}

export function AppLayout({ children, topHeader }: AppLayoutProps) {
  const pathname = usePathname();

  // Hide header, bottom nav, and chat copilot on landing, auth, and onboarding
  const hideChrome =
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding");

  useEffect(() => {
    if (!hideChrome) {
      // Fire alert checks in the background after page has hydrated, preventing TTFB blocking
      fetch("/api/notifications/check").catch(() => {});
    }
  }, [hideChrome]);

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#09090b]">
      {/* Premium Ambient Background Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <div className="absolute top-[-10%] left-[-15%] w-[80vw] md:w-[50vw] h-[50vh] rounded-full bg-gradient-to-br from-indigo-600/15 via-indigo-500/5 to-transparent blur-[130px] opacity-75" />
        <div className="absolute bottom-[10%] right-[-20%] w-[90vw] md:w-[60vw] h-[60vh] rounded-full bg-gradient-to-br from-violet-600/12 via-fuchsia-500/3 to-transparent blur-[140px] opacity-65" />
        <div className="absolute top-[45%] left-[20%] w-[60vw] md:w-[45vw] h-[40vh] rounded-full bg-gradient-to-br from-emerald-500/5 to-transparent blur-[120px] opacity-55" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {topHeader}
        {/* pb-20 ensures content clears the fixed 56px bottom nav */}
        <main className="flex-grow pb-20">
          {children}
        </main>
        <BottomNav />
        <QuickAddButton />
      </div>
    </div>
  );
}
