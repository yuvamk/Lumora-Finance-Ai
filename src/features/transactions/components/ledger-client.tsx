"use client";

import React, { useState, useEffect, useTransition } from "react";
import { 
  Search, SlidersHorizontal, Trash2, Calendar
} from "lucide-react";
import { Transaction } from "../schemas";
import { TransactionCard } from "./transaction-card";
import { deleteTransactionAction } from "../actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LedgerClientProps {
  initialTransactions: Transaction[];
  categories: { id: string; name: string; type: string; icon: string; color: string }[];
  userId: string;
}

export function LedgerClient({ initialTransactions, categories }: LedgerClientProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Listen to quick-add events for real-time live client updating with zero refreshes
  useEffect(() => {
    const handleTransactionAdded = (e: Event) => {
      const customEvent = e as CustomEvent<Transaction>;
      if (customEvent.detail) {
        setTransactions((prev) => [customEvent.detail, ...prev]);
      }
    };

    window.addEventListener("transaction-added", handleTransactionAdded);
    return () => {
      window.removeEventListener("transaction-added", handleTransactionAdded);
    };
  }, []);

  // Filters calculation
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = searchQuery 
      ? t.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesType = filterType ? t.type === filterType : true;
    return matchesSearch && matchesType;
  });

  // Group by Date for Chronological grouping headers (TODAY, YESTERDAY, standard date)
  const groups: Record<string, Transaction[]> = {};
  filteredTransactions.forEach((t) => {
    const txDateStr = t.date; // YYYY-MM-DD
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    let dateKey = "";
    if (txDateStr === todayStr) {
      dateKey = "TODAY";
    } else if (txDateStr === yesterdayStr) {
      dateKey = "YESTERDAY";
    } else {
      dateKey = new Date(t.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }

    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(t);
  });

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const response = await deleteTransactionAction(id);
      if (response.success) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        toast.success("Transaction deleted.");
      } else {
        toast.error(response.error);
      }
    });
  };

  return (
    <div className="flex flex-col bg-zinc-950">
      {/* Top sticky filters and Search header — sits below the 56px TopHeader (top-14) */}
      <div className="sticky top-14 bg-zinc-950/95 backdrop-blur-md z-30 px-4 py-3 border-b border-zinc-900 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {/* Reusable Filter Search Input */}
          <div className="relative flex-1">
            <Search className="w-4.5 h-4.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search merchant, tags, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-9.5 pr-4 text-white focus:outline-none focus:border-zinc-700 placeholder-zinc-500 transition-colors"
            />
          </div>
          <Button 
            variant="outline"
            className="border-zinc-855 bg-zinc-900/60 p-2.5 h-auto rounded-xl text-zinc-400 hover:text-white"
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </Button>
        </div>

        {/* Composable Horizontal Tabs Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          {["", "expense", "income", "transfer", "refund"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all shrink-0 capitalize ${
                filterType === type 
                  ? "bg-white text-zinc-950 border-white"
                  : "bg-zinc-900 text-zinc-400 border-zinc-850 hover:border-zinc-800"
              }`}
            >
              {type || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Financial Timeline list group */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {filteredTransactions.length === 0 ? (
          // Reusable Empty State
          <div className="flex flex-col items-center justify-center py-20 text-center select-none">
            <Calendar className="w-12 h-12 text-zinc-700 stroke-[1.5] mb-3" />
            <span className="text-sm font-semibold text-zinc-400">No Transactions Found</span>
            <p className="text-xs text-zinc-650 mt-1 max-w-[200px]">
              Tap the floating plus button to record your first transaction.
            </p>
          </div>
        ) : (
          Object.entries(groups).map(([dateStr, items]) => (
            <div key={dateStr} className="space-y-2.5">
              {/* Day group header — non-sticky block divider */}
              <div className="py-1.5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center justify-between gap-2 border-b border-zinc-800/60 mb-1">
                <span>{dateStr}</span>
                <span className="text-indigo-400 font-mono text-xs font-semibold">
                  {(() => {
                    const spend = items.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                    const income = items.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                    const symbol = items[0]?.currency_symbol || "₹";
                    const parts = [];
                    if (spend > 0) parts.push(`Spend: ${symbol}${spend.toLocaleString()}`);
                    if (income > 0) parts.push(`Income: ${symbol}${income.toLocaleString()}`);
                    return parts.join(" | ") || `Net Change: ${symbol}0`;
                  })()}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((t) => {
                  const category = categories.find((c) => c.id === t.category_id);
                  return (
                    <div key={t.id} className="relative group">
                      <TransactionCard
                        transaction={t}
                        categoryName={category?.name}
                        categoryIcon={category?.icon}
                        categoryColor={category?.color}
                      />
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="opacity-0 group-hover:opacity-100 absolute right-3 top-1/2 -translate-y-1/2 bg-red-950/60 hover:bg-red-900 border border-red-500/20 p-2 rounded-xl text-red-400 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
