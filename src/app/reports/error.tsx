"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Reports route runtime failure:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-rose-400" />
      </div>
      <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-xs text-zinc-500 max-w-sm mt-2 leading-relaxed">
        {error.message || "An unexpected error occurred while loading your financial reports."}
      </p>
      <div className="flex gap-3 mt-8">
        <Button
          onClick={() => (window.location.href = "/dashboard")}
          variant="outline"
          className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 rounded-2xl h-10 px-5 text-xs font-semibold"
        >
          Go to Dashboard
        </Button>
        <Button
          onClick={() => reset()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-10 px-5 text-xs font-bold flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
