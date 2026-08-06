"use client";

import React from "react";
import { 
  CreditCard, 
  Paperclip, 
  RefreshCw, 
  Heart,
  Briefcase,
  Gift,
  Home,
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  TrendingUp,
  ArrowLeftRight,
  LucideIcon,
  Trash2
} from "lucide-react";
import { Transaction } from "../schemas";
import { Badge } from "@/components/ui/badge";

// Map category icons dynamically to support beautiful system defaults
const ICON_MAP: Record<string, LucideIcon> = {
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

interface TransactionCardProps {
  transaction: Transaction;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  onEdit?: (t: Transaction) => void;
  onDelete?: (t: Transaction) => void;
}

export function TransactionCard({ 
  transaction,
  categoryName = "General",
  categoryIcon = "credit-card",
  categoryColor = "#6366f1",
  onEdit,
  onDelete
}: TransactionCardProps) {
  const IconComponent = ICON_MAP[categoryIcon] || CreditCard;
  const isIncome = transaction.type === "income" || transaction.type === "refund";
  const formattedAmount = `${isIncome ? "+" : "-"}${transaction.currency_symbol}${transaction.amount.toFixed(2)}`;

  return (
    <div 
      onClick={() => onEdit?.(transaction)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit?.(transaction);
        }
      }}
      role="button"
      tabIndex={0}
      className="group flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200 cursor-pointer active:scale-[0.99] select-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 shadow-sm"
    >
      {/* Left Column: Icon & Metadata */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0 mr-3">
        {/* Category Icon Container */}
        <div 
          style={{ backgroundColor: `${categoryColor}15`, border: `1px solid ${categoryColor}30` }}
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        >
          <IconComponent style={{ color: categoryColor }} className="w-5 h-5" />
        </div>

        {/* Merchant & Subtext */}
        <div className="flex-1 min-w-0">
          <span 
            className="text-sm font-semibold text-white block truncate leading-tight"
            title={transaction.notes || categoryName}
          >
            {transaction.notes || categoryName}
          </span>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-[10px] text-zinc-500 font-medium truncate max-w-[120px]">{categoryName}</span>
            {transaction.timezone !== "UTC" && (
              <span className="text-[9px] text-zinc-600 uppercase font-mono shrink-0">({transaction.timezone})</span>
            )}
            {transaction.mood && (
              <span className="text-[10px] bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded-full font-mono flex items-center gap-0.5 shrink-0 max-w-[100px] truncate">
                <Heart className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                <span className="truncate">{transaction.mood}</span>
              </span>
            )}
            {transaction.status === "inbox" && (
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] py-0 px-1 font-medium rounded-sm shrink-0">
                inbox
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Amount & Status badges + optional Delete button */}
      <div className="flex items-center gap-3 shrink-0 ml-auto">
        <div className="flex flex-col items-end gap-1 text-right">
          <span className={`text-sm font-semibold font-mono tracking-tight ${isIncome ? "text-emerald-400" : "text-zinc-200"}`}>
            {formattedAmount}
          </span>
          <div className="flex items-center gap-1">
            {transaction.is_recurring && (
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            )}
            {transaction.attachments && transaction.attachments.length > 0 && (
              <Paperclip className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            )}
          </div>
        </div>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(transaction);
            }}
            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 rounded-xl transition-all duration-200 shrink-0"
            title="Delete transaction"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        )}
      </div>
    </div>
  );
}
