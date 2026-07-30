"use client";

import React, { useState, useTransition } from "react";
import { Subscription, DetectedSubscription } from "../schemas";
import { deleteSubscriptionAction, createSubscriptionAction, detectSubscriptionsAction } from "../actions";
import { SubscriptionForm } from "./subscription-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Calendar, Sparkles, AlertCircle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionListProps {
  initialSubscriptions: Subscription[];
  categories: { id: string; name: string }[];
}

export function SubscriptionList({ initialSubscriptions, categories }: SubscriptionListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions);
  const [detected, setDetected] = useState<DetectedSubscription[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetectOpen, setIsDetectOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Monthly and Annual cost aggregates
  const calculateCosts = () => {
    let monthlyTotal = 0;
    subscriptions.forEach((s) => {
      let monthlyCost = s.amount;
      if (s.billing_period === "weekly") monthlyCost = s.amount * 4.33;
      else if (s.billing_period === "yearly") monthlyCost = s.amount / 12;
      else if (s.billing_period === "daily") monthlyCost = s.amount * 30;
      monthlyTotal += monthlyCost;
    });
    return {
      monthly: monthlyTotal,
      annual: monthlyTotal * 12,
    };
  };

  const costs = calculateCosts();

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const response = await deleteSubscriptionAction(id);
      if (response.success) {
        setSubscriptions((prev) => prev.filter((s) => s.id !== id));
        toast.success("Subscription untracked.");
      } else {
        toast.error(response.error);
      }
    });
  };

  const handleScan = async () => {
    setIsScanning(true);
    setIsDetectOpen(true);
    try {
      const response = await detectSubscriptionsAction();
      if (response.success && response.data) {
        setDetected(response.data);
        if (response.data.length === 0) {
          toast.info("No new recurring subscriptions detected in history.");
        } else {
          toast.success(`Found ${response.data.length} potential subscriptions!`);
        }
      } else {
        toast.error("Heuristics scanner failed.");
      }
    } catch {
      toast.error("Internal scan error.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleAcceptDetection = async (d: DetectedSubscription) => {
    startTransition(async () => {
      const response = await createSubscriptionAction({
        name: d.name,
        amount: d.amount,
        billing_period: d.billing_period,
        start_date: d.lastPaymentDate,
        next_billing_date: d.nextPaymentDate,
        category_id: d.categoryId,
        status: "active",
      });

      if (response.success) {
        setSubscriptions((prev) => [...prev, response.data]);
        setDetected((prev) => prev.filter((item) => item.name !== d.name));
        toast.success(`Added ${d.name} subscription!`);
      } else {
        toast.error(response.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Cost Summary Card */}
      <Card className="bg-zinc-900 border-zinc-800 rounded-3xl overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-baseline">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Monthly Commitment</span>
              <h2 className="text-3xl font-extrabold text-white mt-1 font-mono">
                ${costs.monthly.toFixed(2)}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Annual commitment</span>
              <p className="text-sm font-bold text-zinc-400 font-mono mt-1">
                ${costs.annual.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action triggers */}
      <div className="flex gap-2">
        <Button
          onClick={handleScan}
          className="flex-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-2xl py-3 h-auto font-bold flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4.5 h-4.5" />
          <span>Auto-Detect Recurrents</span>
        </Button>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-white text-zinc-950 hover:bg-zinc-200 rounded-2xl py-3 px-6 h-auto font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Track</span>
        </Button>
      </div>

      {/* 2. List items */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider select-none">Active commitments</h3>

        {subscriptions.length === 0 ? (
          <div className="py-16 text-center bg-zinc-900/20 border border-zinc-900 border-dashed rounded-3xl">
            <span className="text-xs text-zinc-500">No recurring commitments tracked. Tap Track or Auto-Detect.</span>
          </div>
        ) : (
          subscriptions.map((s) => {
            const nextDate = new Date(s.next_billing_date);
            const isRenewalSoon = nextDate.getTime() - new Date().getTime() <= 5 * 24 * 60 * 60 * 1000;
            const categoryName = categories.find((c) => c.id === s.category_id)?.name || "Uncategorized";

            return (
              <div 
                key={s.id}
                className="p-4.5 bg-zinc-900/60 border border-zinc-900 rounded-2xl space-y-3.5 relative group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 border border-zinc-800 rounded-xl flex items-center justify-center text-white font-bold">
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white leading-tight">{s.name}</h4>
                      <span className="text-[10px] text-zinc-550 font-mono uppercase mt-0.5 block">{categoryName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-zinc-200">
                      ${s.amount.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-zinc-500 block font-mono uppercase mt-0.5">
                      every {s.billing_period}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-850/60 pt-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Next Payment: {new Date(s.next_billing_date).toLocaleDateString()}</span>
                  </div>

                  {isRenewalSoon && (
                    <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-lg font-semibold uppercase tracking-wider animate-pulse">
                      Renewal Soon
                    </span>
                  )}
                </div>

                <button 
                  onClick={() => handleDelete(s.id)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 absolute right-3 top-3 bg-zinc-950/60 hover:bg-red-950/60 p-2 rounded-xl text-zinc-500 hover:text-red-400 border border-zinc-850 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Setup Modal Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-850 rounded-3xl p-6 max-w-sm w-[90%] mx-auto">
          <DialogHeader className="text-left pb-2 text-white">
            <DialogTitle className="text-lg font-bold">Track Commitment</DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Track manual billing commitments to predict annual recurring costs.
            </DialogDescription>
          </DialogHeader>
          <SubscriptionForm 
            categories={categories}
            onSuccess={() => {
              setIsFormOpen(false);
              window.location.reload();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Auto-Detect Scanning Drawer */}
      <Dialog open={isDetectOpen} onOpenChange={setIsDetectOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-850 rounded-3xl p-6 max-w-md w-[90%] mx-auto text-white">
          <DialogHeader className="text-left pb-2">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Smart Commitments Scanner</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Scanning historical transaction frequencies and merchants.
            </DialogDescription>
          </DialogHeader>

          {isScanning ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-zinc-400 font-medium">Scanning intervals matrix...</span>
            </div>
          ) : detected.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-zinc-650 mx-auto" />
              <p className="text-xs text-zinc-450">No new recurring payment patterns detected.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {detected.map((d, index) => (
                <div 
                  key={index}
                  className="p-3 bg-zinc-900 border border-zinc-850 rounded-xl flex items-center justify-between gap-3"
                >
                  <div>
                    <h5 className="text-xs font-semibold text-white">{d.name}</h5>
                    <p className="text-[10px] text-zinc-500 capitalize">
                      {d.billing_period} • {d.categoryName}
                    </p>
                    <p className="text-[9px] text-indigo-400 font-mono mt-0.5">
                      Confidence: {Math.round(d.confidence * 100)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold font-mono">${d.amount.toFixed(2)}</span>
                    <Button
                      onClick={() => handleAcceptDetection(d)}
                      disabled={isPending}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-7 w-7 p-0 flex items-center justify-center"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
