"use client";

import React, { useState, useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPasswordAction } from "@/features/auth/actions";
import type { ActionResponse } from "@/features/auth/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const initialState: ActionResponse = { success: false, error: "" };

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);

  const [, formAction, isPending] = useActionState(
    async (_prev: ActionResponse, formData: FormData): Promise<ActionResponse> => {
      const result = await resetPasswordAction(_prev, formData);
      if (!result.success) {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2000);
      return result;
    },
    initialState
  );

  if (done) {
    return (
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Password updated!</h2>
        <p className="text-xs text-zinc-500">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-7 shadow-2xl shadow-black/40">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Set new password</h1>
        <p className="text-xs text-zinc-500 mt-1">Choose a strong password for your account</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-zinc-400">New Password</Label>
          <div className="relative">
            <Input id="password" name="password" type={showPass ? "text" : "password"} placeholder="Min. 8 characters" required minLength={8}
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-11 pr-10 focus:border-indigo-500/60" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm_password" className="text-xs font-semibold text-zinc-400">Confirm Password</Label>
          <Input id="confirm_password" name="confirm_password" type="password" placeholder="Repeat your password" required
            className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-11 focus:border-indigo-500/60" />
        </div>

        <Button type="submit" disabled={isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-11 font-bold text-sm tracking-wide transition-all disabled:opacity-60">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
        </Button>
      </form>

      <Link href="/auth/login" className="mt-5 block text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
        Back to Sign In
      </Link>
    </div>
  );
}
