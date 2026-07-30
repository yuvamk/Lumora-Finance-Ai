import React from "react";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { BottomNav } from "@/components/nav/bottom-nav";
import { ChatDrawer } from "@/components/chat/chat-drawer";
import { TopHeader } from "@/components/nav/top-header";

/**
 * AppShell wraps the bottom nav, top header, and chat drawer.
 * It renders NOTHING on the landing page (/) and auth pages (/auth/*).
 */
export async function AppShell() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  // Don't render app chrome on public/auth pages
  const isAppPage =
    pathname !== "/" &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/onboarding");

  if (!isAppPage) return null;

  // Also gate on actual auth session (TopHeader does this internally)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return (
    <>
      <TopHeader />
      <BottomNav />
      <ChatDrawer />
    </>
  );
}
