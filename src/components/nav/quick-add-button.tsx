"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Plus, Sparkles, ShoppingBag, ArrowUpRight, ArrowLeftRight, 
  TrendingUp, Landmark, CreditCard, Camera, Loader2, ChevronDown
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createTransactionAction, getCategoriesAction } from "@/features/transactions/actions";
import { ReceiptScanner } from "@/features/ocr/components/receipt-scanner";

export function QuickAddButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<
    "menu" | "expense" | "income" | "transfer" | "investment" | "loan" | "recurring" | "quick-expense" | "receipt-scan"
  >("menu");
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Form states
  const [amount, setAmount] = useState("");
  const [whatDidYouBuy, setWhatDidYouBuy] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [merchant, setMerchant] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toLocaleTimeString("en-GB", { hour12: false }).slice(0, 5));
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState<"happy" | "stressed" | "neutral" | "regretful" | "necessary">("neutral");
  const [tags, setTags] = useState("");
  const [recurringRule, setRecurringRule] = useState("monthly");

  const supabase = createClient();

  // Load categories immediately on component mount
  useEffect(() => {
    async function loadCategories() {
      const response = await getCategoriesAction();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        // Client fallback if server action has any connectivity lag
        const { data } = await supabase
          .from("categories")
          .select("id, name, type")
          .is("deleted_at", null)
          .order("name", { ascending: true });
        if (data) {
          setCategories(data);
        }
      }
    }
    loadCategories();
  }, []);

  const handleSaveTransaction = async (type: any, isRecurring = false) => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    startTransition(async () => {
      // Build clean notes string including whatDidYouBuy, notes, and tags
      const parts = [];
      if (whatDidYouBuy.trim()) parts.push(`Purchased: ${whatDidYouBuy}`);
      if (merchant.trim()) parts.push(`Merchant: ${merchant}`);
      if (notes.trim()) parts.push(`Notes: ${notes}`);
      if (tags.trim()) parts.push(`Tags: ${tags}`);
      const finalNotes = parts.join(" | ") || `${type} recorded`;

      const response = await createTransactionAction({
        type,
        amount: Number(amount),
        category_id: selectedCategory || undefined,
        date,
        time: time || undefined,
        notes: finalNotes,
        mood: type === "expense" ? mood : undefined,
        is_recurring: isRecurring,
        recurring_rule: isRecurring ? recurringRule : undefined,
        status: "categorized",
      });

      if (response.success) {
        toast.success(`${type} recorded successfully!`);
        setIsOpen(false);
        resetState();
        
        // Dispatch custom global event for instant client-side reactive state updates
        if (response.data) {
          window.dispatchEvent(new CustomEvent("transaction-added", { detail: response.data }));
        }

        // Reload server components in the background so cards sync seamlessly
        router.refresh();
      } else {
        toast.error(response.error);
      }
    });
  };

  const resetState = () => {
    setActiveScreen("menu");
    setAmount("");
    setWhatDidYouBuy("");
    setSelectedCategory("");
    setMerchant("");
    setPaymentMethod("Cash");
    setDate(new Date().toISOString().slice(0, 10));
    setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }).slice(0, 5));
    setNotes("");
    setMood("neutral");
    setTags("");
    setRecurringRule("monthly");
  };

  const selectCategoryForType = (type: string) => {
    const matched = categories.find((c) => c.type === type)?.id || "";
    setSelectedCategory(matched);
  };

  return (
    <>
      {/* Compact Circular FAB Button in Bottom-Left Corner */}
      <button
        onClick={() => {
          resetState();
          setIsOpen(true);
        }}
        aria-label="Quick Add Transaction"
        className="fixed bottom-[72px] left-4 z-40 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/30 flex items-center justify-center transition-all cursor-pointer border border-indigo-400/30"
      >
        <Plus className="w-5 h-5 text-white stroke-[2.5]" />
      </button>

      {/* Bottom Sheet Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="bg-zinc-950 border-t border-zinc-900 rounded-t-[32px] max-w-2xl mx-auto p-6 focus:outline-none">
          <SheetHeader className="text-left pb-4 border-b border-zinc-900">
            <SheetTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Add Transaction
            </SheetTitle>
            <SheetDescription className="text-xs text-zinc-500">
              Select transaction capture style. Values update analytics instantly.
            </SheetDescription>
          </SheetHeader>

          {/* SCREEN 1: Options Menu */}
          {activeScreen === "menu" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-6">
              <Button
                variant="outline"
                onClick={() => {
                  selectCategoryForType("expense");
                  setActiveScreen("expense");
                }}
                className="h-20 rounded-2xl border-zinc-900 hover:bg-zinc-900 flex flex-col justify-center items-center gap-1.5"
              >
                <ShoppingBag className="w-5 h-5 text-rose-400" />
                <span className="text-xs font-bold text-zinc-200">Expense</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  selectCategoryForType("income");
                  setActiveScreen("income");
                }}
                className="h-20 rounded-2xl border-zinc-900 hover:bg-zinc-900 flex flex-col justify-center items-center gap-1.5"
              >
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-200">Income</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  selectCategoryForType("transfer");
                  setActiveScreen("transfer");
                }}
                className="h-20 rounded-2xl border-zinc-900 hover:bg-zinc-900 flex flex-col justify-center items-center gap-1.5"
              >
                <ArrowLeftRight className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold text-zinc-200">Transfer</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  selectCategoryForType("investment");
                  setActiveScreen("investment");
                }}
                className="h-20 rounded-2xl border-zinc-900 hover:bg-zinc-900 flex flex-col justify-center items-center gap-1.5"
              >
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold text-zinc-200">Investment</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  selectCategoryForType("loan");
                  setActiveScreen("loan");
                }}
                className="h-20 rounded-2xl border-zinc-900 hover:bg-zinc-900 flex flex-col justify-center items-center gap-1.5"
              >
                <Landmark className="w-5 h-5 text-violet-400" />
                <span className="text-xs font-bold text-zinc-200">Loan</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  selectCategoryForType("expense");
                  setActiveScreen("recurring");
                }}
                className="h-20 rounded-2xl border-zinc-900 hover:bg-zinc-900 flex flex-col justify-center items-center gap-1.5"
              >
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-bold text-zinc-200">Recurring</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  selectCategoryForType("expense");
                  setActiveScreen("quick-expense");
                }}
                className="h-20 rounded-2xl border-zinc-900 hover:bg-zinc-900 flex flex-col justify-center items-center gap-1.5"
              >
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold text-zinc-200">Quick Log</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  selectCategoryForType("expense");
                  setActiveScreen("receipt-scan");
                }}
                className="h-20 rounded-2xl border-zinc-900 hover:bg-zinc-900 flex flex-col justify-center items-center gap-1.5"
              >
                <Camera className="w-5 h-5 text-violet-400" />
                <span className="text-xs font-bold text-zinc-200">Scan</span>
              </Button>
            </div>
          )}

          {/* SCREEN 2: Expense Form */}
          {activeScreen === "expense" && (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveTransaction("expense"); }} className="py-4 space-y-4">
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => resetState()} className="text-zinc-500 hover:text-white px-2">
                  ← Back
                </Button>
                <h3 className="text-sm font-bold text-white">Record Expense</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-xs text-zinc-400">Amount (₹)</Label>
                    <Input id="amount" type="number" step="any" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="merchant" className="text-xs text-zinc-400">Merchant (Optional)</Label>
                    <Input id="merchant" placeholder="Store name" value={merchant} onChange={(e) => setMerchant(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs text-zinc-400">Category (Optional)</Label>
                    <div className="relative">
                      <select
                        id="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl h-11 pl-3 pr-8 text-xs focus:ring-0 focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-zinc-950 text-zinc-400">Select Category (Optional)</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} className="bg-zinc-950 text-white">{c.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="date" className="text-xs text-zinc-400">Date</Label>
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 text-xs" required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs text-zinc-400">Notes</Label>
                  <Textarea id="notes" placeholder="Details..." value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl text-xs" />
                </div>

                <Button type="submit" disabled={isPending} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 rounded-xl">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Expense"}
                </Button>
              </div>
            </form>
          )}

          {/* SCREEN 3: Income Form */}
          {activeScreen === "income" && (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveTransaction("income"); }} className="py-4 space-y-4">
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => resetState()} className="text-zinc-500 hover:text-white px-2">
                  ← Back
                </Button>
                <h3 className="text-sm font-bold text-white">Record Income</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-xs text-zinc-400">Amount (₹)</Label>
                    <Input id="amount" type="number" step="any" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs text-zinc-400">Category (Optional)</Label>
                    <div className="relative">
                      <select
                        id="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl h-11 pl-3 pr-8 text-xs focus:ring-0 focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-zinc-950 text-zinc-400">Select Category (Optional)</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} className="bg-zinc-950 text-white">{c.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs text-zinc-400">Date</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 text-xs" required />
                </div>

                <Button type="submit" disabled={isPending} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 rounded-xl">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Income"}
                </Button>
              </div>
            </form>
          )}

          {/* SCREEN 4: Transfer Form */}
          {activeScreen === "transfer" && (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveTransaction("transfer"); }} className="py-4 space-y-4">
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => resetState()} className="text-zinc-500 hover:text-white px-2">
                  ← Back
                </Button>
                <h3 className="text-sm font-bold text-white">Record Transfer</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-xs text-zinc-400">Amount (₹)</Label>
                    <Input id="amount" type="number" step="any" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs text-zinc-400">Category (Optional)</Label>
                    <div className="relative">
                      <select
                        id="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl h-11 pl-3 pr-8 text-xs focus:ring-0 focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-zinc-950 text-zinc-400">Select Category (Optional)</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} className="bg-zinc-950 text-white">{c.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs text-zinc-400">Date</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 text-xs" required />
                </div>

                <Button type="submit" disabled={isPending} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold h-11 rounded-xl">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Transfer"}
                </Button>
              </div>
            </form>
          )}

          {/* SCREEN 5: Investment Form */}
          {activeScreen === "investment" && (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveTransaction("investment"); }} className="py-4 space-y-4">
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => resetState()} className="text-zinc-500 hover:text-white px-2">
                  ← Back
                </Button>
                <h3 className="text-sm font-bold text-white">Record Investment</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-xs text-zinc-400">Amount (₹)</Label>
                    <Input id="amount" type="number" step="any" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs text-zinc-400">Category (Optional)</Label>
                    <div className="relative">
                      <select
                        id="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl h-11 pl-3 pr-8 text-xs focus:ring-0 focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-zinc-950 text-zinc-400">Select Category (Optional)</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} className="bg-zinc-950 text-white">{c.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs text-zinc-400">Date</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 text-xs" required />
                </div>

                <Button type="submit" disabled={isPending} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 rounded-xl">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Investment"}
                </Button>
              </div>
            </form>
          )}

          {/* SCREEN 6: Loan Form */}
          {activeScreen === "loan" && (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveTransaction("loan"); }} className="py-4 space-y-4">
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => resetState()} className="text-zinc-500 hover:text-white px-2">
                  ← Back
                </Button>
                <h3 className="text-sm font-bold text-white">Record Loan</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-xs text-zinc-400">Amount (₹)</Label>
                    <Input id="amount" type="number" step="any" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs text-zinc-400">Category (Optional)</Label>
                    <div className="relative">
                      <select
                        id="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl h-11 pl-3 pr-8 text-xs focus:ring-0 focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-zinc-950 text-zinc-400">Select Category (Optional)</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} className="bg-zinc-950 text-white">{c.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs text-zinc-400">Date</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 text-xs" required />
                </div>

                <Button type="submit" disabled={isPending} className="w-full bg-violet-650 hover:bg-violet-600 text-white font-bold h-11 rounded-xl">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Loan"}
                </Button>
              </div>
            </form>
          )}

          {/* SCREEN 7: Recurring Expense Form */}
          {activeScreen === "recurring" && (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveTransaction("expense", true); }} className="py-4 space-y-4">
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => resetState()} className="text-zinc-500 hover:text-white px-2">
                  ← Back
                </Button>
                <h3 className="text-sm font-bold text-white">Record Recurring Expense</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-xs text-zinc-400">Amount (₹)</Label>
                    <Input id="amount" type="number" step="any" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs text-zinc-400">Category (Optional)</Label>
                    <div className="relative">
                      <select
                        id="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl h-11 pl-3 pr-8 text-xs focus:ring-0 focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-zinc-950 text-zinc-400">Select Category (Optional)</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} className="bg-zinc-950 text-white">{c.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rule" className="text-xs text-zinc-400">Frequency</Label>
                    <select
                      id="rule"
                      value={recurringRule}
                      onChange={(e) => setRecurringRule(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 text-white rounded-xl h-11 px-3 text-xs focus:ring-0 focus:outline-none"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="date" className="text-xs text-zinc-400">Start Date</Label>
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 text-xs" required />
                  </div>
                </div>

                <Button type="submit" disabled={isPending} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-11 rounded-xl">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Recurring Expense"}
                </Button>
              </div>
            </form>
          )}

          {/* SCREEN 8: Quick Expense Form (Optimized Form) */}
          {activeScreen === "quick-expense" && (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveTransaction("expense"); }} className="py-4 space-y-4">
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => resetState()} className="text-zinc-500 hover:text-white px-2">
                  ← Back
                </Button>
                <h3 className="text-sm font-bold text-white">Quick Log Expense</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-xs text-zinc-400">Amount (₹)</Label>
                    <Input id="amount" type="number" step="any" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="whatDidYouBuy" className="text-xs text-zinc-400">What did you buy?</Label>
                    <Input id="whatDidYouBuy" placeholder="Toffee, Petrol, etc." value={whatDidYouBuy} onChange={(e) => setWhatDidYouBuy(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs text-zinc-400">Category (Optional)</Label>
                    <div className="relative">
                      <select
                        id="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl h-11 pl-3 pr-8 text-xs focus:ring-0 focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-zinc-950 text-zinc-400">Select Category (Optional)</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} className="bg-zinc-950 text-white">{c.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="merchant" className="text-xs text-zinc-400">Merchant (Optional)</Label>
                    <Input id="merchant" placeholder="Store name" value={merchant} onChange={(e) => setMerchant(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="payment" className="text-xs text-zinc-400">Payment</Label>
                    <select
                      id="payment"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 text-white rounded-xl h-11 px-2.5 text-[11px] focus:ring-0 focus:outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="Card">Credit Card</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="date" className="text-xs text-zinc-400">Date</Label>
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 text-[11px] px-2" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="time" className="text-xs text-zinc-400">Time</Label>
                    <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 text-[11px] px-2" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="mood" className="text-xs text-zinc-400">Mood</Label>
                    <select
                      id="mood"
                      value={mood}
                      onChange={(e) => setMood(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-850 text-white rounded-xl h-11 px-3 text-xs focus:ring-0 focus:outline-none"
                    >
                      <option value="neutral">Neutral 😐</option>
                      <option value="happy">Happy 😊</option>
                      <option value="stressed">Stressed 😰</option>
                      <option value="regretful">Regretful 😔</option>
                      <option value="necessary">Necessary ✅</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tags" className="text-xs text-zinc-400">Tags (comma separated)</Label>
                    <Input id="tags" placeholder="e.g. coffee, commute" value={tags} onChange={(e) => setTags(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11" />
                  </div>
                </div>

                <Button type="submit" disabled={isPending} className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold h-11 rounded-xl">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Quick Expense"}
                </Button>
              </div>
            </form>
          )}

          {/* SCREEN 9: Receipt Scanner */}
          {activeScreen === "receipt-scan" && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => resetState()} className="text-zinc-500 hover:text-white px-2">
                  ← Back
                </Button>
                <h3 className="text-sm font-bold text-white">Scan Receipt Image</h3>
              </div>
              <ReceiptScanner categories={categories} onSuccess={() => { setIsOpen(false); resetState(); }} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
