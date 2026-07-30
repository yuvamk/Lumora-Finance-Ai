import React from "react";

interface PageSkeletonProps {
  sectionTitle: string;
  pageTitle: string;
  cardCount?: number;
  gridCols?: string;
  headerRight?: boolean;
}

export function PageSkeleton({
  sectionTitle,
  pageTitle,
  cardCount = 3,
  gridCols = "grid-cols-1",
  headerRight = false,
}: PageSkeletonProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 pb-28 space-y-6">
      {/* Page Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-zinc-650 tracking-wider">
            {sectionTitle}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white/40 animate-pulse">
            {pageTitle}
          </h1>
        </div>
        {headerRight && (
          <div className="w-24 h-9 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
        )}
      </header>

      {/* Main Grid Widgets Container */}
      <div className={`grid ${gridCols} gap-4`}>
        {Array.from({ length: cardCount }).map((_, i) => (
          <div
            key={i}
            className="bg-zinc-900 border border-zinc-800/60 rounded-3xl p-6 space-y-4 animate-pulse"
          >
            {/* Title / Description */}
            <div className="space-y-2">
              <div className="h-4 w-1/3 bg-zinc-800 rounded" />
              <div className="h-3 w-1/2 bg-zinc-850 rounded" />
            </div>

            {/* Content box */}
            <div className="h-32 bg-zinc-950/40 rounded-2xl border border-zinc-800/30" />
            
            {/* Footer */}
            <div className="flex justify-between items-center pt-2">
              <div className="h-3 w-20 bg-zinc-800 rounded" />
              <div className="h-3 w-12 bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
