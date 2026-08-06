"use client";

import React, { useState, useActionState } from "react";
import { resetPasswordAction } from "@/features/auth/actions";
import type { ActionResponse } from "@/features/auth/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

const initialState: ActionResponse = { success: false, error: "" };

export function ChangePasswordForm() {
  const [saved, setSaved] = useState(false);

  const [, formAction, isPending] = useActionState(
    async (_prev: ActionResponse, formData: FormData): Promise<ActionResponse> => {
      const result = await resetPasswordAction(_prev, formData);
      if (!result.success) { toast.error(result.error); return { success: false, error: result.error }; }
      setSaved(true);
      toast.success("Password updated successfully");
      setTimeout(() => setSaved(false), 3000);
      return result;
    },
    initialState
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-semibold text-zinc-400">New Password</Label>
        <Input id="password" name="password" type="password" placeholder="Min. 8 characters" minLength={8} required
          className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-11" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm_password" className="text-xs font-semibold text-zinc-400">Confirm Password</Label>
        <Input id="confirm_password" name="confirm_password" type="password" placeholder="Repeat password" required
          className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-11" />
      </div>
      <Button type="submit" disabled={isPending || saved}
        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-10 px-6 font-bold text-sm transition-all disabled:opacity-60">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : saved ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : null}
        {saved ? "Updated!" : "Update Password"}
      </Button>
    </form>
  );
}
