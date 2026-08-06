// src/features/wealth/components/asset-allocator-tab.tsx
"use client";
 
import React, { useState, useTransition } from "react";
import { upsertAssetAction, deleteAssetAction } from "../actions";
import type { RebalanceSuggestion } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, ArrowUpRight, ArrowDownRight, Scale } from "lucide-react";
import { toast } from "sonner";
 
interface AssetAllocatorTabProps {
  assets: RebalanceSuggestion[];
  totalAssets: number;
  onRefresh: () => void;
}
 
export function AssetAllocatorTab({ assets, totalAssets, onRefresh }: AssetAllocatorTabProps) {
  const [isPending, startTransition] = useTransition();
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState<"equity" | "gold" | "cash" | "fixed_income" | "crypto">("equity");
  const [currentValue, setCurrentValue] = useState("");
  const [targetPct, setTargetPct] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
 
  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(currentValue);
    const target = parseFloat(targetPct);
 
    if (!assetName || isNaN(value) || isNaN(target)) {
      toast.error("Please fill in all asset fields correctly.");
      return;
    }
 
    startTransition(async () => {
      const formData = new FormData();
      if (editingId) formData.set("id", editingId);
      formData.set("asset_name", assetName);
      formData.set("asset_type", assetType);
      formData.set("current_value", value.toString());
      formData.set("target_percentage", target.toString());
 
      const res = await upsertAssetAction({ success: false, error: "" }, formData);
      if (res.success) {
        toast.success(editingId ? "Asset updated!" : "Asset added successfully!");
        setAssetName("");
        setCurrentValue("");
        setTargetPct("");
        setEditingId(null);
        onRefresh();
      } else {
        toast.error(res.error);
      }
    });
  };
 
  const handleDeleteAsset = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    const res = await deleteAssetAction(id);
    if (res.success) {
      toast.success("Asset deleted.");
      onRefresh();
    } else {
      toast.error(res.error);
    }
  };
 
  const totalTargetPct = assets.reduce((sum, a) => sum + a.targetPercentage, 0);
 
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Assets Listing Table */}
      <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            Asset Portfolio & Targets
          </h3>
          <span className="text-xs text-zinc-400 font-bold">
            Total Assets: <span className="text-white">₹{totalAssets.toLocaleString()}</span>
          </span>
        </div>
 
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                <th className="pb-3 pl-2">Asset Name / Type</th>
                <th className="pb-3 text-right">Value (₹)</th>
                <th className="pb-3 text-center">Actual %</th>
                <th className="pb-3 text-center">Target %</th>
                <th className="pb-3 text-right">Rebalance Deviation</th>
                <th className="pb-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {assets.map((asset) => (
                <tr key={asset.assetId} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="py-3.5 pl-2">
                    <div className="font-bold text-white">{asset.name}</div>
                    <div className="text-[9px] text-zinc-500 uppercase font-semibold">{asset.type}</div>
                  </td>
                  <td className="py-3.5 text-right font-bold text-zinc-300">
                    ₹{asset.currentValue.toLocaleString()}
                  </td>
                  <td className="py-3.5 text-center font-semibold text-zinc-400">
                    {asset.currentPercentage}%
                  </td>
                  <td className="py-3.5 text-center font-semibold text-indigo-300">
                    {asset.targetPercentage}%
                  </td>
                  <td className="py-3.5 text-right font-bold">
                    {asset.difference === 0 ? (
                      <span className="text-zinc-500">Hold</span>
                    ) : asset.difference > 0 ? (
                      <span className="text-emerald-400 flex items-center justify-end gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Buy ₹{Math.abs(asset.difference).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center justify-end gap-0.5">
                        <ArrowDownRight className="w-3.5 h-3.5" /> Sell ₹{Math.abs(asset.difference).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => {
                          setEditingId(asset.assetId);
                          setAssetName(asset.name);
                          setAssetType(asset.type as any);
                          setCurrentValue(asset.currentValue.toString());
                          setTargetPct(asset.targetPercentage.toString());
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors font-bold"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteAsset(asset.assetId)}
                        className="text-zinc-600 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-650">
                    No manual assets registered yet. Add assets on the right to start rebalancing calculation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
 
      {/* Add / Edit Asset Form */}
      <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 shadow-xl h-fit space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {editingId ? "Edit Asset" : "Add New Asset"}
          </h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">Manage target percentages for risk balancing</p>
        </div>
 
        <form onSubmit={handleSaveAsset} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="assetName" className="text-xs font-semibold text-zinc-400">Asset Name</Label>
            <Input 
              id="assetName" 
              type="text" 
              placeholder="e.g. Nifty Index ETF, Gold Bars" 
              required
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="bg-white/[0.02] border-white/[0.08] text-white placeholder:text-zinc-700 rounded-xl h-10 focus:border-indigo-500/60" 
            />
          </div>
 
          <div className="space-y-1.5">
            <Label htmlFor="assetType" className="text-xs font-semibold text-zinc-400">Asset Category Type</Label>
            <select
              id="assetType"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as any)}
              className="w-full bg-zinc-950 border border-white/[0.08] text-white rounded-xl h-10 px-3 text-xs focus:border-indigo-500/60 outline-none"
            >
              <option value="equity">Equity (Mutual Funds, Stocks)</option>
              <option value="gold">Gold & Precious Metals</option>
              <option value="cash">Liquid Cash (Savings, FDs)</option>
              <option value="fixed_income">Fixed Income (Bonds, EPF)</option>
              <option value="crypto">Crypto Assets</option>
            </select>
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentValue" className="text-xs font-semibold text-zinc-400">Current Value (₹)</Label>
              <Input 
                id="currentValue" 
                type="number" 
                placeholder="₹" 
                required
                min={0}
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="bg-white/[0.02] border-white/[0.08] text-white rounded-xl h-10 focus:border-indigo-500/60" 
              />
            </div>
 
            <div className="space-y-1.5">
              <Label htmlFor="targetPct" className="text-xs font-semibold text-zinc-400">Target Split (%)</Label>
              <Input 
                id="targetPct" 
                type="number" 
                placeholder="%" 
                required
                min={0}
                max={100}
                value={targetPct}
                onChange={(e) => setTargetPct(e.target.value)}
                className="bg-white/[0.02] border-white/[0.08] text-white rounded-xl h-10 focus:border-indigo-500/60" 
              />
            </div>
          </div>
 
          {totalTargetPct !== 100 && (
            <div className="text-[10px] text-indigo-400 font-bold bg-indigo-500/5 border border-indigo-500/10 p-2.5 rounded-xl">
              ⚠️ Note: Current total Target Split is **{totalTargetPct}%**. It is recommended that target splits sum up to exactly **100%**.
            </div>
          )}
 
          <div className="flex gap-2">
            {editingId && (
              <Button 
                type="button" 
                onClick={() => {
                  setEditingId(null);
                  setAssetName("");
                  setCurrentValue("");
                  setTargetPct("");
                }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl h-10 font-bold text-xs"
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 font-bold text-xs tracking-wide transition-all disabled:opacity-60 flex items-center justify-center gap-1.5">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update Asset" : <><Plus className="w-4 h-4" /> Add Asset</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
