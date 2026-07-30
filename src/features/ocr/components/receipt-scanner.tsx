"use client";

import React, { useState, useRef, useTransition } from "react";
import { OcrResult } from "../schemas";
import { uploadReceiptAction, completeReceiptAction } from "../actions";
import { createTransactionAction } from "@/features/transactions/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ReceiptScannerProps {
  categories: { id: string; name: string }[];
  onSuccess: () => void;
}

export function ReceiptScanner({ categories, onSuccess }: ReceiptScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, startTransition] = useTransition();

  // OCR state payload
  const [receiptId, setReceiptId] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [tax, setTax] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState(categories[0]?.id || "");
  const [items, setItems] = useState<OcrResult["items"]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    toast.info("Extracting invoice parameters...");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(",")[1];
        const response = await uploadReceiptAction({
          fileName: file.name,
          fileSize: file.size,
          base64Data,
        });

        if (response.success) {
          const { receiptId: rId, ocrResult: ocr } = response.data;
          setReceiptId(rId);
          setMerchant(ocr.merchant);
          setAmount(ocr.amount.toString());
          setTax(ocr.tax.toString());
          setDate(ocr.date);
          setItems(ocr.items);

          // Find matching category ID
          const matchedCat = categories.find(
            (c) => c.name.toLowerCase() === ocr.categorySuggestion.toLowerCase()
          );
          setCategory(matchedCat?.id || categories[0]?.id || "");

          setIsPreviewOpen(true);
          toast.success("Receipt parameters extracted successfully!");
        } else {
          toast.error(response.error);
        }
      } catch {
        toast.error("Internal OCR execution failure.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant.trim()) {
      toast.error("Please enter a merchant name.");
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    startTransition(async () => {
      // Build clean items descriptor
      const itemsNotes = items.map((i) => `${i.name} (x${i.quantity}) - $${i.price}`).join("\n");
      const transactionNotes = `Scanned Receipt Items:\n${itemsNotes}`;

      // 1. Write transaction into database
      const txResponse = await createTransactionAction({
        type: "expense",
        amount: Number(amount),
        category_id: category,
        date,
        notes: itemsNotes ? transactionNotes : "Scanned Receipt Transaction",
        receipt_id: receiptId,
      });

      if (txResponse.success) {
        // 2. Change receipt status to completed
        await completeReceiptAction(receiptId);
        toast.success("Receipt transaction recorded! 🎉");
        setIsPreviewOpen(false);
        onSuccess();
      } else {
        toast.error(txResponse.error);
      }
    });
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload trigger layout card */}
      <div 
        onClick={triggerUpload}
        className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/60 p-8 rounded-3xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 relative select-none"
      >
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,application/pdf"
          className="hidden"
        />

        {isScanning ? (
          <>
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs text-zinc-400 font-medium">Reading invoice formats...</span>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-850">
              <Camera className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">Scan Receipt Invoice</p>
              <p className="text-[10px] text-zinc-500 mt-1">Supports Camera, JPG, PNG or PDF formats</p>
            </div>
          </>
        )}
      </div>

      {/* Editable confirmation drawer dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-850 rounded-3xl p-6 max-w-sm w-[90%] mx-auto text-white">
          <DialogHeader className="text-left pb-2">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Verify Receipt</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Confirm extracted metadata parameters before saving.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmSave} className="space-y-4">
            {/* Merchant */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Merchant Name</label>
              <input
                type="text"
                required
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-zinc-700"
              />
            </div>

            {/* Amount & Tax */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Total Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Included Tax</label>
                <input
                  type="number"
                  step="0.01"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>
            </div>

            {/* Date & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Invoice Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-zinc-700 text-zinc-350"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-zinc-700"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line items (Optional) */}
            {items.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block">Line Items</span>
                <div className="bg-zinc-900 border border-zinc-850 p-2.5 rounded-xl space-y-1.5 max-h-[80px] overflow-y-auto">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-[10px] text-zinc-400">
                      <span>{item.name} <span className="text-[8px] text-zinc-600">x{item.quantity}</span></span>
                      <span className="font-mono text-zinc-300">${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit confirmations */}
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl font-bold py-2.5 mt-2"
            >
              {isSaving ? "Confirming..." : "Confirm & Save Expense"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
