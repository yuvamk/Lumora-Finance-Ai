import React from "react";

export function TransactionCardSkeleton() {
  return (
    <div className="w-full flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-900 rounded-2xl animate-pulse">
      {/* Icon & Texts */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 bg-zinc-800 rounded-xl shrink-0" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 bg-zinc-800 rounded" />
          <div className="h-3 w-16 bg-zinc-800 rounded" />
        </div>
      </div>

      {/* Amount Shimmer */}
      <div className="h-4 w-12 bg-zinc-800 rounded" />
    </div>
  );
}

export function TransactionTimelineSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <TransactionCardSkeleton key={i} />
      ))}
    </div>
  );
}
