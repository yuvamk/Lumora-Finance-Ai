import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SearchClient } from "@/features/search/components/search-client";

export const metadata = { title: "Search — Lumora AI" };

export default async function SearchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return <SearchClient />;
}
