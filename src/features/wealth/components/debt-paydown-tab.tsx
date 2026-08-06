// src/features/wealth/components/debt-paydown-tab.tsx
"use client";
 
import React, { useState, useTransition } from "react";
import { upsertDebtAction, deleteDebtAction, DebtSuggestion } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, ShieldAlert, Award } from "lucide-react";
import { toast } from "sonner";
 
interface DebtPaydownTabProps {
  debts: DebtSuggestion[];
  totalDebts: number;
  onRefresh: () => void;
}
 
export function DebtPaydownTab({ debts, totalDebts, onRefresh }: DebtPaydownTabProps) {
  const [isPending, startTransition] = useTransition();
  const [debtName, setDebtName] = useState("");
  const [balance, setBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [minPayment, setMinPayment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
 
  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const balVal = parseFloat(balance);
    const rateVal = parseFloat(interestRate);
    const minVal = parseFloat(minPayment);
 
    if (!debtName || isNaN(balVal) || isNaN(rateVal) || isNaN(minVal)) {
      toast.error("Please fill in all debt properties correctly.");
      return;
    }
 
    startTransition(async () => {
      const formData = new FormData();
      if (editingId) formData.set("id", editingId);
      formData.set("debt_name", debtName);
      formData.set("balance", balVal.toString());
      formData.set("interest_rate", rateVal.toString());
      formData.set("min_payment", minVal.toString());
 
      const res = await upsertDebtAction({ success: false, error: "" }, formData);
      if (res.success) {
        toast.success(editingId ? "Debt updated!" : "Debt added successfully!");
        setDebtName("");
        setBalance("");
        setInterestRate("");
        setMinPayment("");
        setEditingId(null);
        onRefresh();
      } else {
        toast.error(res.error);
      }
    });
  };
 
  const handleDeleteDebt = async (id: string) => {
    if (!confirm("Are you sure you want to delete this debt?")) return;
    const res = await deleteDebtAction(id);
    if (res.success) {
      toast.success("Debt removed.");
      onRefresh();
    } else {
      toast.error(res.error);
    }
  };
 
  const highestInterestDebt = debts[0];
 
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Debt Avalanche Priority List */}
      <div className="lg:col-span-2 space-y-6">
        {/* Avalanche advisory banner */}
        {highestInterestDebt && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Active Paydown Target</h4>
              <p className="text-xs text-rose-300 mt-1">
                Your highest-interest debt is **{highestInterestDebt.name}** at **{highestInterestDebt.interestRate}%**. 
                To save the most money, pay the minimum due on all other debts, and put every extra rupee of your savings surplus into this account.
              </p>
            </div>
          </div>
        )}
 
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              Debt Paydown Priorities
            </h3>
            <span className="text-xs text-zinc-400 font-bold">
              Total Debt: <span className="text-rose-400">₹{totalDebts.toLocaleString()}</span>
            </span>
          </div>
 
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-3 pl-2">Debt Name</th>
                  <th className="pb-3 text-right">Balance (₹)</th>
                  <th className="pb-3 text-center">Interest Rate</th>
                  <th className="pb-3 text-right">Min Due (₹)</th>
                  <th className="pb-3 text-center">Priority</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {debts.map((debt, index) => (
                  <tr key={debt.debtId} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="py-3.5 pl-2 font-bold text-white">
                      {debt.name}
                    </td>
                    <td className="py-3.5 text-right font-bold text-rose-300">
                      ₹{debt.balance.toLocaleString()}
                    </td>
                    <td className="py-3.5 text-center font-semibold text-zinc-450">
                      {debt.interestRate}%
                    </td>
                    <td className="py-3.5 text-right font-semibold text-zinc-400">
                      ₹{debt.balance > 0 ? debt.balance < 2000 ? debt.balance.toLocaleString() : "2,000" : "0"} 
                      {/* Show illustrative min payment */}
                    </td>
                    <td className="py-3.5 text-center font-bold">
                      {index === 0 ? (
                        <span className="text-[9px] font-extrabold bg-rose-500/15 border border-rose-500/25 px-2 py-0.5 rounded-full text-rose-400 uppercase tracking-wide">
                          Avalanche Target
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full text-zinc-500 uppercase tracking-wide">
                          Pay Minimum
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingId(debt.debtId);
                            setDebtName(debt.name);
                            setBalance(debt.balance.toString());
                            setInterestRate(debt.interestRate.toString());
                            setMinPayment(debt.balance > 0 ? "2000" : "0");
                          }}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors font-bold"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteDebt(debt.debtId)}
                          className="text-zinc-600 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {debts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-650">
                      No debts registered. You are debt-free! Excellent work.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
 
      {/* Register Debt Form */}
      <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl h-fit space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {editingId ? "Edit Debt" : "Add Debt Account"}
          </h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">Input outstanding loan and rate details</p>
        </div>
 
        <form onSubmit={handleSaveDebt} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="debtName" className="text-xs font-semibold text-zinc-400">Debt Name</Label>
            <Input 
              id="debtName" 
              type="text" 
              placeholder="e.g. Credit Card A, HDFC Car Loan" 
              required
              value={debtName}
              onChange={(e) => setDebtName(e.target.value)}
              className="bg-white/[0.02] border-white/[0.08] text-white placeholder:text-zinc-700 rounded-xl h-10 focus:border-indigo-500/60" 
            />
          </div>
 
          <div className="space-y-1.5">
            <Label htmlFor="balance" className="text-xs font-semibold text-zinc-400">Outstanding Balance (₹)</Label>
            <Input 
              id="balance" 
              type="number" 
              placeholder="₹" 
              required
              min={0}
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="bg-white/[0.02] border-white/[0.08] text-white rounded-xl h-10 focus:border-indigo-500/60" 
            />
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="interestRate" className="text-xs font-semibold text-zinc-400">Interest Rate (% p.a.)</Label>
              <Input 
                id="interestRate" 
                type="number" 
                step="0.1"
                placeholder="%" 
                required
                min={0}
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="bg-white/[0.02] border-white/[0.08] text-white rounded-xl h-10 focus:border-indigo-500/60" 
              />
            </div>
 
            <div className="space-y-1.5">
              <Label htmlFor="minPayment" className="text-xs font-semibold text-zinc-400">Minimum Monthly Due</Label>
              <Input 
                id="minPayment" 
                type="number" 
                placeholder="₹" 
                required
                min={0}
                value={minPayment}
                onChange={(e) => setMinPayment(e.target.value)}
                className="bg-white/[0.02] border-white/[0.08] text-white rounded-xl h-10 focus:border-indigo-500/60" 
              />
            </div>
          </div>
 
          <div className="flex gap-2">
            {editingId && (
              <Button 
                type="button" 
                onClick={() => {
                  setEditingId(null);
                  setDebtName("");
                  setBalance("");
                  setInterestRate("");
                  setMinPayment("");
                }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl h-10 font-bold text-xs"
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 font-bold text-xs tracking-wide transition-all disabled:opacity-60 flex items-center justify-center gap-1.5">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update Debt" : <><Plus className="w-4 h-4" /> Add Debt</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
