"use client";

import React, { useState, useEffect, useTransition } from "react";
import { 
  Search, SlidersHorizontal, Trash2, Calendar, X, RotateCcw, Filter,
  Home, Utensils, Car, Zap, Briefcase, TrendingUp, Gift, ArrowLeftRight, 
  ShoppingBag, CreditCard, Clock, Heart, Globe, Paperclip, Info
} from "lucide-react";
import { Transaction } from "../schemas";
import { TransactionCard } from "./transaction-card";
import { deleteTransactionAction } from "../actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const ICON_MAP: Record<string, any> = {
  home: Home,
  utensils: Utensils,
  car: Car,
  zap: Zap,
  briefcase: Briefcase,
  "trending-up": TrendingUp,
  gift: Gift,
  "arrow-left-right": ArrowLeftRight,
  "shopping-bag": ShoppingBag,
  "credit-card": CreditCard,
};

interface LedgerClientProps {
  initialTransactions: Transaction[];
  categories: { id: string; name: string; type: string; icon: string; color: string }[];
  userId: string;
}

export function LedgerClient({ initialTransactions, categories }: LedgerClientProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");

  // Modals state
  const [selectedTxDetails, setSelectedTxDetails] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

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

  const handleConfirmDelete = async () => {
    if (!txToDelete) return;
    const targetId = txToDelete.id;
    startTransition(async () => {
      const response = await deleteTransactionAction(targetId);
      if (response.success) {
        setTransactions((prev) => prev.filter((t) => t.id !== targetId));
        toast.success("Transaction deleted.");
        setTxToDelete(null);
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
                    <TransactionCard
                      key={t.id}
                      transaction={t}
                      categoryName={category?.name}
                      categoryIcon={category?.icon}
                      categoryColor={category?.color}
                      onEdit={(tx) => setSelectedTxDetails(tx)}
                      onDelete={(tx) => setTxToDelete(tx)}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={txToDelete !== null} onOpenChange={(open) => { if (!open) setTxToDelete(null); }}>
        <DialogContent className="bg-zinc-950 border border-zinc-850 rounded-3xl p-6 max-w-sm w-[90%] mx-auto text-white">
          <DialogHeader className="text-left pb-2">
            <DialogTitle className="text-lg font-bold text-red-500 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Transaction?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 mt-2">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {txToDelete && (
            <div className="bg-zinc-900/50 border border-zinc-850 rounded-2xl p-4 my-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  style={{ 
                    backgroundColor: `${categories.find(c => c.id === txToDelete.category_id)?.color || '#6366f1'}15`, 
                    border: `1px solid ${categories.find(c => c.id === txToDelete.category_id)?.color || '#6366f1'}30` 
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                >
                  {(() => {
                    const cat = categories.find(c => c.id === txToDelete.category_id);
                    const IconComponent = cat?.icon ? (ICON_MAP[cat.icon] || CreditCard) : CreditCard;
                    return <IconComponent style={{ color: cat?.color || '#6366f1' }} className="w-5 h-5" />;
                  })()}
                </div>
                <div>
                  <span className="text-sm font-semibold text-white block truncate max-w-[150px]">
                    {txToDelete.notes || categories.find(c => c.id === txToDelete.category_id)?.name || "General"}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {txToDelete.date}
                  </span>
                </div>
              </div>
              <span className={`text-sm font-mono font-bold ${
                txToDelete.type === "income" || txToDelete.type === "refund" ? "text-emerald-400" : "text-zinc-200"
              }`}>
                {txToDelete.type === "income" || txToDelete.type === "refund" ? "+" : "-"}
                {txToDelete.currency_symbol}{txToDelete.amount.toFixed(2)}
              </span>
            </div>
          )}

          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setTxToDelete(null)}
              className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs px-4 py-2"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-650 hover:bg-red-500 text-white rounded-xl text-xs px-4 py-2 font-semibold"
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Details Modal */}
      <Dialog open={selectedTxDetails !== null} onOpenChange={(open) => { if (!open) setSelectedTxDetails(null); }}>
        <DialogContent className="bg-zinc-950 border border-zinc-850 rounded-3xl p-6 max-w-md w-[90%] mx-auto text-white">
          <DialogHeader className="text-left pb-2">
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" />
              Transaction Details
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Complete details and metadata for this transaction.
            </DialogDescription>
          </DialogHeader>

          {selectedTxDetails && (
            <div className="space-y-5 my-2">
              {/* Large Amount and Merchant Hero */}
              <div className="text-center py-6 px-4 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col items-center justify-center gap-1">
                <div 
                  style={{ 
                    backgroundColor: `${categories.find(c => c.id === selectedTxDetails.category_id)?.color || '#6366f1'}15`, 
                    border: `1px solid ${categories.find(c => c.id === selectedTxDetails.category_id)?.color || '#6366f1'}30` 
                  }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mb-2"
                >
                  {(() => {
                    const cat = categories.find(c => c.id === selectedTxDetails.category_id);
                    const IconComponent = cat?.icon ? (ICON_MAP[cat.icon] || CreditCard) : CreditCard;
                    return <IconComponent style={{ color: cat?.color || '#6366f1' }} className="w-6 h-6" />;
                  })()}
                </div>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {categories.find(c => c.id === selectedTxDetails.category_id)?.name || "General"}
                </span>
                <span className={`text-3xl font-extrabold font-mono tracking-tight ${
                  selectedTxDetails.type === "income" || selectedTxDetails.type === "refund" ? "text-emerald-400" : "text-zinc-100"
                }`}>
                  {selectedTxDetails.type === "income" || selectedTxDetails.type === "refund" ? "+" : "-"}
                  {selectedTxDetails.currency_symbol}{selectedTxDetails.amount.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-zinc-300 mt-1 max-w-xs truncate">
                  {selectedTxDetails.notes || "No notes"}
                </span>
              </div>

              {/* Grid of metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Type</span>
                  <Badge className={`capitalize py-0.5 px-2.5 rounded-full border text-[11px] font-semibold ${
                    selectedTxDetails.type === "income" || selectedTxDetails.type === "refund"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-zinc-800 text-zinc-300 border-zinc-700"
                  }`}>
                    {selectedTxDetails.type}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Status</span>
                  <Badge className={`capitalize py-0.5 px-2.5 rounded-full border text-[11px] font-semibold ${
                    selectedTxDetails.status === "inbox"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                  }`}>
                    {selectedTxDetails.status}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Date</span>
                  <span className="text-zinc-200 font-medium flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    {new Date(selectedTxDetails.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Time</span>
                  <span className="text-zinc-200 font-medium flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {selectedTxDetails.time || "—"}
                    {selectedTxDetails.timezone && (
                      <span className="text-[9px] text-zinc-500 font-mono">({selectedTxDetails.timezone})</span>
                    )}
                  </span>
                </div>

                {selectedTxDetails.mood && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Mood / Category Flag</span>
                    <span className="text-zinc-200 font-medium flex items-center gap-1.5 mt-0.5 capitalize">
                      <Heart className="w-3.5 h-3.5 text-zinc-500" />
                      {selectedTxDetails.mood}
                    </span>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Source</span>
                  <span className="text-zinc-200 font-medium flex items-center gap-1.5 mt-0.5 capitalize">
                    <Globe className="w-3.5 h-3.5 text-zinc-500" />
                    {selectedTxDetails.source}
                  </span>
                </div>

                {selectedTxDetails.is_recurring && (
                  <div className="col-span-2 space-y-1 border-t border-zinc-900 pt-2">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Recurring Transaction</span>
                    <span className="text-zinc-200 font-medium text-[11px] block bg-indigo-500/5 border border-indigo-500/10 p-2 rounded-xl">
                      🔁 Recurs automatically: {selectedTxDetails.recurring_rule || "Standard Schedule"}
                    </span>
                  </div>
                )}
              </div>

              {/* Description / Notes text */}
              {selectedTxDetails.notes && (
                <div className="space-y-1.5 border-t border-zinc-900 pt-3">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Description / Notes</span>
                  <p className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3 text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap">
                    {selectedTxDetails.notes}
                  </p>
                </div>
              )}

              {/* Attachments preview */}
              {selectedTxDetails.attachments && selectedTxDetails.attachments.length > 0 && (
                <div className="space-y-2 border-t border-zinc-900 pt-3">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Attachments</span>
                  <div className="flex flex-col gap-1.5">
                    {selectedTxDetails.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1.5 truncate bg-zinc-900/60 p-2 rounded-xl border border-zinc-850 hover:border-zinc-800 transition-all"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        Attachment #{idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4 flex justify-end">
            <Button
              onClick={() => setSelectedTxDetails(null)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs px-4 py-2 w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
