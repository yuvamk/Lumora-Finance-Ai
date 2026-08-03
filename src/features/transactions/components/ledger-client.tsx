"use client";

import React, { useState, useEffect, useTransition } from "react";
import { 
  Search, SlidersHorizontal, Trash2, Calendar, X, RotateCcw, Filter
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

  // Advanced Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount_high" | "amount_low">("newest");
  const [statusFilter, setStatusFilter] = useState<"all" | "recurring" | "inbox">("all");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");

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

  // Calculate active filter count
  const activeFilterCount = 
    (selectedCategory ? 1 : 0) +
    (dateRange !== "all" ? 1 : 0) +
    (sortBy !== "newest" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (minAmount || maxAmount ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedCategory("");
    setDateRange("all");
    setSortBy("newest");
    setStatusFilter("all");
    setMinAmount("");
    setMaxAmount("");
    setSearchQuery("");
    setFilterType("");
  };

  // Filters calculation
  const filteredTransactions = transactions
    .filter((t) => {
      // 1. Search Query
      const catName = categories.find((c) => c.id === t.category_id)?.name || "";
      const matchesSearch = searchQuery 
        ? (t.notes?.toLowerCase().includes(searchQuery.toLowerCase()) || catName.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      // 2. Type Filter
      const matchesType = filterType ? t.type === filterType : true;

      // 3. Category Filter
      const matchesCategory = selectedCategory ? t.category_id === selectedCategory : true;

      // 4. Status/Flag Filter
      const matchesStatus = 
        statusFilter === "recurring" ? t.is_recurring :
        statusFilter === "inbox" ? t.status === "inbox" : true;

      // 5. Date Range Filter
      let matchesDate = true;
      if (dateRange !== "all") {
        const txDate = new Date(t.date).getTime();
        const now = new Date();
        if (dateRange === "today") {
          const todayStr = now.toISOString().slice(0, 10);
          matchesDate = t.date === todayStr;
        } else if (dateRange === "week") {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).getTime();
          matchesDate = txDate >= sevenDaysAgo;
        } else if (dateRange === "month") {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).getTime();
          matchesDate = txDate >= thirtyDaysAgo;
        }
      }

      // 6. Amount Range Filter
      const min = minAmount ? parseFloat(minAmount) : null;
      const max = maxAmount ? parseFloat(maxAmount) : null;
      const matchesMin = min !== null && !isNaN(min) ? t.amount >= min : true;
      const matchesMax = max !== null && !isNaN(max) ? t.amount <= max : true;

      return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesDate && matchesMin && matchesMax;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "amount_high") {
        return b.amount - a.amount;
      } else if (sortBy === "amount_low") {
        return a.amount - b.amount;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Group by Date for Chronological grouping headers
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
              className="w-full text-base md:text-sm bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-9.5 pr-8 text-white focus:outline-none focus:border-zinc-700 placeholder-zinc-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            variant="outline"
            className={`relative border p-2.5 h-auto rounded-xl transition-all ${
              isFilterOpen || activeFilterCount > 0
                ? "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
            title="Toggle Filters"
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-zinc-950 text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-zinc-950">
                {activeFilterCount}
              </span>
            )}
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

        {/* Expandable Advanced Filter Panel */}
        {isFilterOpen && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Advanced Filters</span>
              </div>
              <div className="flex items-center gap-2">
                {(activeFilterCount > 0 || searchQuery || filterType) && (
                  <button 
                    onClick={handleResetFilters}
                    className="text-[11px] text-zinc-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset All
                  </button>
                )}
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Category</label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                    !selectedCategory 
                      ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-semibold"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id === selectedCategory ? "" : cat.id)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                      selectedCategory === cat.id
                        ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-semibold"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeframe & Sort Controls */}
            <div className="grid grid-cols-2 gap-3">
              {/* Timeframe */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Timeframe</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past 7 Days</option>
                  <option value="month">Past 30 Days</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                >
                  <option value="newest">Date: Newest First</option>
                  <option value="oldest">Date: Oldest First</option>
                  <option value="amount_high">Amount: Highest First</option>
                  <option value="amount_low">Amount: Lowest First</option>
                </select>
              </div>
            </div>

            {/* Status & Amount range */}
            <div className="grid grid-cols-2 gap-3">
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status / Tag</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                >
                  <option value="all">All Records</option>
                  <option value="recurring">Recurring Only</option>
                  <option value="inbox">Inbox Pending</option>
                </select>
              </div>

              {/* Amount Range */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Amount Range</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                  <span className="text-zinc-600 text-xs">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Financial Timeline list group */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {filteredTransactions.length === 0 ? (
          // Reusable Empty State
          <div className="flex flex-col items-center justify-center py-20 text-center select-none">
            <Calendar className="w-12 h-12 text-zinc-700 stroke-[1.5] mb-3" />
            <span className="text-sm font-semibold text-zinc-400">No Transactions Found</span>
            <p className="text-xs text-zinc-650 mt-1 max-w-[200px]">
              {(activeFilterCount > 0 || searchQuery || filterType)
                ? "No matching records found. Try adjusting or resetting active filters."
                : "Tap the floating plus button to record your first transaction."}
            </p>
            {(activeFilterCount > 0 || searchQuery || filterType) && (
              <Button
                onClick={handleResetFilters}
                size="sm"
                className="mt-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs rounded-xl"
              >
                Clear All Filters
              </Button>
            )}
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
