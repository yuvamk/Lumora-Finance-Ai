// src/features/wealth/components/paper-trading-tab.tsx
"use client";
 
import React, { useState, useEffect, useTransition } from "react";
import { getSandboxDetailsAction, buyPaperAssetAction, sellPaperAssetAction, MOCK_STOCK_PRICES, getLiveMockPrice } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, DollarSign, Wallet, RefreshCw, LineChart } from "lucide-react";
import { toast } from "sonner";
 
interface PaperTradingTabProps {
  onRefresh: () => void;
}
 
export function PaperTradingTab({ onRefresh }: PaperTradingTabProps) {
  const [isPending, startTransition] = useTransition();
  const [cash, setCash] = useState(1000000);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("INFY");
  const [quantity, setQuantity] = useState("10");
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
 
  // Fetch sandbox details from DB
  const loadSandbox = async () => {
    const res = await getSandboxDetailsAction();
    if (res.success && res.data) {
      setCash(res.data.cash);
      setPortfolio(res.data.portfolio);
    }
  };
 
  // Poll mock live prices
  const updatePrices = async () => {
    const prices: Record<string, number> = {};
    for (const sym of Object.keys(MOCK_STOCK_PRICES)) {
      prices[sym] = await getLiveMockPrice(sym);
    }
    setLivePrices(prices);
  };
 
  useEffect(() => {
    loadSandbox();
    updatePrices();
    const interval = setInterval(() => {
      updatePrices();
    }, 4500); // Tick prices every 4.5 seconds!
 
    return () => clearInterval(interval);
  }, []);
 
  const handleTrade = (type: "buy" | "sell") => {
    const qtyVal = parseFloat(quantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      toast.error("Please enter a valid positive quantity.");
      return;
    }
 
    startTransition(async () => {
      const action = type === "buy" ? buyPaperAssetAction : sellPaperAssetAction;
      const res = await action(selectedSymbol, qtyVal);
      
      if (res.success) {
        toast.success(type === "buy" ? `Purchased shares of ${selectedSymbol}!` : `Sold shares of ${selectedSymbol}!`);
        loadSandbox();
        onRefresh();
      } else {
        toast.error(res.error);
      }
    });
  };
 
  const currentSymbolPrice = livePrices[selectedSymbol] || MOCK_STOCK_PRICES[selectedSymbol]?.price || 0;
  const estimatedCost = currentSymbolPrice * (parseFloat(quantity) || 0);
  const totalStocksValue = portfolio.reduce((sum, item) => {
    const currentPrice = livePrices[item.symbol] || item.livePrice;
    return sum + (item.quantity * currentPrice);
  }, 0);
  const totalSandboxValue = cash + totalStocksValue;
  const netProfit = totalSandboxValue - 1000000; // Profit over starting 10L cash
 
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Portfolio overview and owned holdings */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-5 shadow-lg space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-indigo-400" />
              Simulated Cash
            </span>
            <div className="text-xl font-bold text-white">₹{cash.toLocaleString()}</div>
          </div>
 
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-5 shadow-lg space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide flex items-center gap-1.5">
              <LineChart className="w-3.5 h-3.5 text-indigo-400" />
              Stocks Net Value
            </span>
            <div className="text-xl font-bold text-white">₹{totalStocksValue.toLocaleString()}</div>
          </div>
 
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-5 shadow-lg space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              Net Sandbox Profit
            </span>
            <div className={`text-xl font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString()}
            </div>
          </div>
        </div>
 
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Virtual Stock Holdings
            </h3>
            <button onClick={loadSandbox} className="text-zinc-500 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
 
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-3 pl-2">Asset Name</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3 text-right">Cost Price (₹)</th>
                  <th className="pb-3 text-right">Live Price (₹)</th>
                  <th className="pb-3 text-right">Current Value (₹)</th>
                  <th className="pb-3 pr-2 text-right">Gain / Loss (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {portfolio.map((item) => {
                  const currentLivePrice = livePrices[item.symbol] || item.livePrice;
                  const currentVal = item.quantity * currentLivePrice;
                  const gainOrLoss = currentVal - (item.quantity * item.purchase_price);
                  return (
                    <tr key={item.id} className="group hover:bg-white/[0.01] transition-colors">
                      <td className="py-3.5 pl-2">
                        <div className="font-bold text-white">{item.symbol}</div>
                        <div className="text-[9px] text-zinc-500 font-semibold">{item.name}</div>
                      </td>
                      <td className="py-3.5 text-center font-bold text-zinc-400">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 text-right text-zinc-300">
                        ₹{item.purchase_price.toLocaleString()}
                      </td>
                      <td className="py-3.5 text-right font-bold text-indigo-400 animate-pulse">
                        ₹{currentLivePrice.toLocaleString()}
                      </td>
                      <td className="py-3.5 text-right font-bold text-zinc-300">
                        ₹{currentVal.toLocaleString()}
                      </td>
                      <td className={`py-3.5 pr-2 text-right font-bold ${gainOrLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {gainOrLoss >= 0 ? '+' : ''}₹{gainOrLoss.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {portfolio.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-650">
                      You don&apos;t own any virtual shares yet. Use the Trade center on the right to start mock trading!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
 
      {/* Trading sandbox interface */}
      <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl h-fit space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Mock Trading Panel
          </h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">Practice asset buying and selling instantly</p>
        </div>
 
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="stockSelect" className="text-xs font-semibold text-zinc-400">Select Mock Security</Label>
            <select
              id="stockSelect"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full bg-zinc-950 border border-white/[0.08] text-white rounded-xl h-10 px-3 text-xs focus:border-indigo-500/60 outline-none"
            >
              {Object.entries(MOCK_STOCK_PRICES).map(([sym, details]) => (
                <option key={sym} value={sym}>
                  {sym} - {details.name} (₹{livePrices[sym] || details.price})
                </option>
              ))}
            </select>
          </div>
 
          <div className="space-y-1.5">
            <Label htmlFor="tradeQty" className="text-xs font-semibold text-zinc-400">Share Quantity</Label>
            <Input 
              id="tradeQty" 
              type="number" 
              min={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-white/[0.02] border-white/[0.08] text-white rounded-xl h-10 focus:border-indigo-500/60" 
            />
          </div>
 
          <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-2xl flex flex-col gap-1.5 text-xs text-zinc-400">
            <div className="flex justify-between">
              <span>Estimated Cost / Share</span>
              <span className="font-bold text-white">₹{currentSymbolPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-white/[0.04] pt-1.5 text-sm">
              <span className="font-semibold text-zinc-300">Total Transaction Value</span>
              <span className="font-bold text-indigo-400">₹{estimatedCost.toLocaleString()}</span>
            </div>
          </div>
 
          <div className="flex gap-4">
            <Button 
              type="button" 
              onClick={() => handleTrade("sell")}
              disabled={isPending}
              className="flex-1 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-500/25 text-rose-300 rounded-xl h-11 font-bold text-xs"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sell Shares"}
            </Button>
            <Button 
              type="button" 
              onClick={() => handleTrade("buy")}
              disabled={isPending}
              className="flex-1 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/25 text-emerald-300 rounded-xl h-11 font-bold text-xs"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy Shares"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
