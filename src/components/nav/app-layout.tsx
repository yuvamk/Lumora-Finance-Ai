"use client";

import React from "react";
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

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {topHeader}
      {/* pb-20 ensures content clears the fixed 56px bottom nav */}
      <main className="flex-grow pb-20">
        {children}
      </main>
      <BottomNav />
      <QuickAddButton />
    </div>
  );
}
