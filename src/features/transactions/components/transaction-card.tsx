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
  LucideIcon
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
}

export function TransactionCard({ 
  transaction,
  categoryName = "General",
  categoryIcon = "credit-card",
  categoryColor = "#6366f1",
  onEdit 
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
      className="group flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-900 rounded-2xl hover:border-zinc-800 hover:bg-zinc-900/80 transition-all duration-200 cursor-pointer active:scale-[0.99] select-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
    >
      {/* Left Column: Icon & Metadata */}
      <div className="flex items-center gap-3.5">
        {/* Category Icon Container */}
        <div 
          style={{ backgroundColor: `${categoryColor}15`, border: `1px solid ${categoryColor}30` }}
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        >
          <IconComponent style={{ color: categoryColor }} className="w-5 h-5" />
        </div>

        {/* Merchant & Subtext */}
        <div className="min-w-0">
          <span className="text-sm font-semibold text-white block truncate leading-tight">
            {transaction.notes || categoryName}
          </span>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-[10px] text-zinc-500 font-medium">{categoryName}</span>
            {transaction.timezone !== "UTC" && (
              <span className="text-[9px] text-zinc-600 uppercase font-mono">({transaction.timezone})</span>
            )}
            {transaction.mood && (
              <span className="text-[10px] bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded-full font-mono flex items-center gap-0.5">
                <Heart className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                {transaction.mood}
              </span>
            )}
            {transaction.status === "inbox" && (
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] py-0 px-1 font-medium rounded-sm">
                inbox
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Amount & Status badges */}
      <div className="flex flex-col items-end gap-1 shrink-0 text-right">
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
    </div>
  );
}
