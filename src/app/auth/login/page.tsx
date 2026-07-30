"use client";

import React, { useState, useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signInAction, type ActionResponse } from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

const initialState: ActionResponse = { success: false, error: "" };

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);

  const [, formAction, isPending] = useActionState(
    async (_prev: ActionResponse, formData: FormData): Promise<ActionResponse> => {
      const result = await signInAction(_prev, formData);
      if (!result.success) {
        toast.error(result.error);
        return result;
      }
      router.push("/dashboard");
      return result;
    },
    initialState
  );

  const handleOAuth = async (provider: "google" | "github") => {
    setOauthLoading(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { toast.error(error.message); setOauthLoading(null); }
  };

  return (
    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-7 shadow-2xl shadow-black/40">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Welcome back</h1>
        <p className="text-xs text-zinc-500 mt-1">Sign in to your financial dashboard</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-zinc-400">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required
            className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-11 focus:border-indigo-500/60" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-zinc-400">Password</Label>
            <Link href="/auth/forgot-password" className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input id="password" name="password" type={showPass ? "text" : "password"} autoComplete="current-password"
              placeholder="••••••••" required
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-11 pr-10 focus:border-indigo-500/60" />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-11 font-bold text-sm tracking-wide transition-all disabled:opacity-60">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
        </Button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">or continue with</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => handleOAuth("google")} disabled={!!oauthLoading}
          className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-2xl h-11 font-semibold text-xs transition-all disabled:opacity-60">
          {oauthLoading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> :
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
          Google
        </button>
        <button onClick={() => handleOAuth("github")} disabled={!!oauthLoading}
          className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-2xl h-11 font-semibold text-xs transition-all disabled:opacity-60">
          {oauthLoading === "github" ? <Loader2 className="w-4 h-4 animate-spin" /> :
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>}
          GitHub
        </button>
      </div>

      <p className="text-center text-xs text-zinc-600 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Sign up free</Link>
      </p>
    </div>
  );
}
