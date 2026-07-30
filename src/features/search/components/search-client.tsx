"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock, ArrowRight, Loader2, DollarSign, Target, CreditCard, RefreshCw } from "lucide-react";

interface SearchResult {
  id: string;
  type: "transaction" | "budget" | "goal" | "subscription";
  title: string;
  subtitle: string;
  amount?: number;
}

const TYPE_CONFIG = {
  transaction: { icon: DollarSign, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  budget: { icon: CreditCard, color: "text-amber-400", bg: "bg-amber-500/10" },
  goal: { icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  subscription: { icon: RefreshCw, color: "text-blue-400", bg: "bg-blue-500/10" },
};

const RECENT_KEY = "lumora_recent_searches";

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      setRecentSearches(stored);
    } catch { /* ignore */ }
    inputRef.current?.focus();
  }, []);

  const addRecentSearch = (q: string) => {
    const next = [q, ...recentSearches.filter(r => r !== q)].slice(0, 5);
    setRecentSearches(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data.results || []);
          }
        } catch { setResults([]); }
      });
    }, 300);
  };

  const handleResultClick = (result: SearchResult) => {
    addRecentSearch(query);
    const routes: Record<string, string> = {
      transaction: "/ledger",
      budget: "/budgets",
      goal: "/goals",
      subscription: "/subscriptions",
    };
    window.location.href = routes[result.type] || "/dashboard";
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    handleInput(term);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-4 pb-28">
      {/* Sticky search bar */}
      <div className="sticky top-0 z-10 bg-zinc-950 px-4 pb-4 pt-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Search transactions, budgets, goals…"
            className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 rounded-2xl h-12 pl-11 pr-10 text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"
          />
          {(query || isPending) && (
            <button
              onClick={() => { setQuery(""); setResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Results */}
        {results.length > 0 && (
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-3">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {results.map((result) => {
                const cfg = TYPE_CONFIG[result.type];
                const Icon = cfg.icon;
                return (
                  <button key={result.id} onClick={() => handleResultClick(result)}
                    className="w-full flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800/60 transition-colors text-left">
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4.5 h-4.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{result.title}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{result.subtitle}</p>
                    </div>
                    {result.amount !== undefined && (
                      <span className="text-sm font-bold text-white flex-shrink-0">${result.amount.toLocaleString()}</span>
                    )}
                    <ArrowRight className="w-4 h-4 text-zinc-700 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* No results */}
        {query && !isPending && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-10 h-10 text-zinc-800 mb-3" />
            <p className="text-sm font-semibold text-zinc-400">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-xs text-zinc-600 mt-1">Try searching by amount, category, or note</p>
          </div>
        )}

        {/* Recent searches */}
        {!query && recentSearches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Recent</p>
              <button onClick={clearRecent} className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">Clear</button>
            </div>
            <div className="space-y-2">
              {recentSearches.map((term) => (
                <button key={term} onClick={() => handleRecentClick(term)}
                  className="w-full flex items-center gap-3 p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800/60 transition-colors text-left">
                  <Clock className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  <span className="text-sm text-zinc-400 flex-1">{term}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-700" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!query && recentSearches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-12 h-12 text-zinc-800 mb-4" />
            <p className="text-sm font-semibold text-zinc-500">Search everything</p>
            <p className="text-xs text-zinc-700 mt-1">Transactions, budgets, goals, subscriptions</p>
          </div>
        )}
      </div>
    </div>
  );
}
