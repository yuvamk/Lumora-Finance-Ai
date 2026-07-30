"use client";

import React, { useState, useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ActionResponse } from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const initialState: ActionResponse<{ email: string } | null> = { success: false, error: "" };

export default function ForgotPasswordPage() {
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const [, formAction, isPending] = useActionState(
    async (_prev: ActionResponse<{ email: string } | null>, formData: FormData): Promise<ActionResponse<{ email: string } | null>> => {
      const result = await forgotPasswordAction(_prev as ActionResponse, formData);
      if (!result.success) {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
      setSentEmail(result.data.email);
      return result;
    },
    initialState
  );

  if (sentEmail) {
    return (
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Check your email</h2>
        <p className="text-xs text-zinc-500 leading-relaxed">
          We sent a password reset link to<br />
          <span className="text-white font-semibold">{sentEmail}</span>
        </p>
        <p className="text-[11px] text-zinc-600 mt-3">Didn&apos;t get it? Check your spam folder.</p>
        <Link href="/auth/login" className="mt-6 flex items-center justify-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-7 shadow-2xl shadow-black/40">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Reset password</h1>
        <p className="text-xs text-zinc-500 mt-1">We&apos;ll send you a secure reset link</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-zinc-400">Email address</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required
            className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-11 focus:border-indigo-500/60" />
        </div>

        <Button type="submit" disabled={isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-11 font-bold text-sm tracking-wide transition-all disabled:opacity-60">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
        </Button>
      </form>

      <Link href="/auth/login" className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-400 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
      </Link>
    </div>
  );
}
