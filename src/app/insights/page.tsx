import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KnowledgeEngine } from "@/features/knowledge-engine/services/knowledge-engine";
import { FinanceEngine } from "@/features/finance-engine/services/finance-engine";
import { AiWorkspaceClient } from "@/features/knowledge-engine/components/ai-workspace-client";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

async function InsightsContent({ userId }: { userId: string }) {
  const [fko, score] = await Promise.all([
    KnowledgeEngine.getFinancialKnowledge(userId),
    FinanceEngine.getFinancialScore(userId),
  ]);

  return (
    <AiWorkspaceClient
      userId={userId}
      initialFko={fko}
      initialScore={score}
    />
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl h-36" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-24" />
      ))}
    </div>
  );
}

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 pb-28">
      <header className="mb-6 select-none">
        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">AI Workspace</span>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          Intelligence Center
        </h1>
      </header>

      <Suspense fallback={<InsightsSkeleton />}>
        <InsightsContent userId={user.id} />
      </Suspense>
    </div>
  );
}
