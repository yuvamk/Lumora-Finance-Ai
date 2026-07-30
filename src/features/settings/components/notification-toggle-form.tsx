"use client";

import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Mail, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/features/auth/actions";

interface NotificationToggleFormProps {
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export function NotificationToggleForm({ emailEnabled, pushEnabled }: NotificationToggleFormProps) {
  const [email, setEmail] = useState(emailEnabled);
  const [push, setPush] = useState(pushEnabled);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.set("email_notifications", String(email));
    fd.set("push_notifications", String(push));
    const result = await updateSettingsAction({ success: false, error: "" }, fd);
    setLoading(false);
    if (!result.success) { toast.error(result.error); return; }
    setSaved(true);
    toast.success("Notification preferences saved");
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Email */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center">
            <Mail className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-white">Email Notifications</Label>
            <p className="text-[11px] text-zinc-500 mt-0.5">Budget alerts, goal milestones</p>
          </div>
        </div>
        <Switch checked={email} onCheckedChange={setEmail} className="data-[state=checked]:bg-indigo-600" />
      </div>

      {/* Push */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center">
            <Smartphone className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-white">Push Notifications</Label>
            <p className="text-[11px] text-zinc-500 mt-0.5">Real-time alerts on your device</p>
          </div>
        </div>
        <Switch checked={push} onCheckedChange={setPush} className="data-[state=checked]:bg-indigo-600" />
      </div>

      <Button onClick={handleSave} disabled={loading || saved}
        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-10 px-6 font-bold text-sm transition-all disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : saved ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : null}
        {saved ? "Saved!" : "Save Preferences"}
      </Button>
    </div>
  );
}
