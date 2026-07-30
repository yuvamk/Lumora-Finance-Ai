"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Monitor, Moon, Sun, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/features/auth/actions";

type Theme = "light" | "dark" | "system";

interface AppearanceFormProps {
  currentTheme: Theme;
}

const themes: { value: Theme; label: string; icon: React.ElementType; desc: string }[] = [
  { value: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
  { value: "light", label: "Light", icon: Sun, desc: "Clean and bright" },
  { value: "system", label: "System", icon: Monitor, desc: "Follows your device" },
];

export function AppearanceForm({ currentTheme }: AppearanceFormProps) {
  const { setTheme } = useTheme();
  const [selected, setSelected] = useState<Theme>(currentTheme);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setTheme(selected);
    const fd = new FormData();
    fd.set("theme", selected);
    const result = await updateSettingsAction({ success: false, error: "" }, fd);
    setLoading(false);
    if (!result.success) { toast.error(result.error); return; }
    setSaved(true);
    toast.success("Theme updated");
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Theme</p>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelected(value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                selected === value
                  ? "bg-indigo-600/20 border-indigo-500 text-white"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-bold">{label}</span>
              <span className="text-[10px] text-zinc-600 text-center leading-tight">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading || saved}
        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-10 px-6 font-bold text-sm transition-all disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : saved ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : null}
        {saved ? "Saved!" : "Apply Theme"}
      </Button>
    </div>
  );
}
