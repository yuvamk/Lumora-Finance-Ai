"use client";

import React, { useState, useActionState } from "react";
import { updateProfileAction } from "@/features/auth/actions";
import type { ActionResponse } from "@/features/auth/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

const initialState: ActionResponse = { success: false, error: "" };

interface ProfileFormProps {
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
}

export function ProfileForm({ displayName, email, avatarUrl }: ProfileFormProps) {
  const [saved, setSaved] = useState(false);

  const [, formAction, isPending] = useActionState(
    async (_prev: ActionResponse, formData: FormData): Promise<ActionResponse> => {
      const result = await updateProfileAction(_prev, formData);
      if (!result.success) {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
      setSaved(true);
      toast.success("Profile updated successfully");
      setTimeout(() => setSaved(false), 3000);
      return result;
    },
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="display_name" className="text-xs font-semibold text-zinc-400">Display Name</Label>
        <Input id="display_name" name="display_name" type="text" defaultValue={displayName || ""}
          placeholder="Your name" className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-11" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-zinc-400">Email</Label>
        <Input type="email" value={email} readOnly
          className="bg-zinc-900/50 border-zinc-800 text-zinc-500 rounded-xl h-11 cursor-not-allowed" />
        <p className="text-[10px] text-zinc-600">Email is managed by your authentication provider.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="avatar_url" className="text-xs font-semibold text-zinc-400">Avatar URL</Label>
        <Input id="avatar_url" name="avatar_url" type="url" defaultValue={avatarUrl || ""}
          placeholder="https://example.com/avatar.jpg"
          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-11" />
      </div>

      <Button type="submit" disabled={isPending || saved}
        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-10 px-6 font-bold text-sm transition-all disabled:opacity-60">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : saved ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : null}
        {saved ? "Saved!" : "Save Changes"}
      </Button>
    </form>
  );
}
