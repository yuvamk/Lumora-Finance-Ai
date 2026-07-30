"use client";

import React, { useState, useActionState } from "react";
import { updateSettingsAction, type ActionResponse } from "@/features/auth/actions";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

const initialState: ActionResponse = { success: false, error: "" };

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee", flag: "🇵🇰" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", flag: "🇸🇦" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", flag: "🇨🇭" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", flag: "🇨🇳" },
];

const INR_DEFAULT = { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" };

const TIMEZONES = [
  "UTC", "America/New_York", "America/Los_Angeles", "America/Chicago",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Dubai",
  "Asia/Karachi", "Asia/Kolkata", "Asia/Tokyo", "Asia/Singapore",
  "Australia/Sydney", "Pacific/Auckland",
];

interface PreferencesFormProps {
  currentCurrencyCode: string;
  currentCurrencySymbol: string;
  currentTimezone: string;
}



export function PreferencesForm({ currentCurrencyCode, currentCurrencySymbol, currentTimezone }: PreferencesFormProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(
    CURRENCIES.find(c => c.code === currentCurrencyCode) || CURRENCIES[0]
  );
  const [saved, setSaved] = useState(false);

  const [, formAction, isPending] = useActionState(
    async (_prev: ActionResponse, formData: FormData): Promise<ActionResponse> => {
      formData.set("base_currency_code", selectedCurrency.code);
      formData.set("base_currency_symbol", selectedCurrency.symbol);
      const result = await updateSettingsAction(_prev, formData);
      if (!result.success) { toast.error(result.error); return { success: false, error: result.error }; }
      setSaved(true);
      toast.success("Preferences saved");
      setTimeout(() => setSaved(false), 3000);
      return result;
    },
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Currency */}
      <div>
        <Label className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 block">Base Currency</Label>
        <div className="grid grid-cols-3 gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setSelectedCurrency(c)}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all text-center ${
                selectedCurrency.code === c.code
                  ? "bg-indigo-600/20 border-indigo-500 text-white"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <span className="text-lg">{c.flag}</span>
              <span className="text-xs font-bold">{c.code}</span>
              <span className="text-[10px] text-zinc-600">{c.symbol}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-1.5">
        <Label htmlFor="timezone" className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Timezone</Label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={currentTimezone}
          className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl h-11 px-4 text-sm focus:outline-none focus:border-indigo-500/60 appearance-none"
        >
          {TIMEZONES.map(tz => (
            <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={isPending || saved}
        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-10 px-6 font-bold text-sm transition-all disabled:opacity-60">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : saved ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : null}
        {saved ? "Saved!" : "Save Preferences"}
      </Button>
    </form>
  );
}
