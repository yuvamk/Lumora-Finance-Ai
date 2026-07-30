"use client";

import React, { useState, useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signUpAction, verifyOtpAction, type ActionResponse } from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, Check, Mail } from "lucide-react";
import { toast } from "sonner";

const initialState: ActionResponse<{ email: string } | null> = { success: false, error: "" };

function PasswordStrength({ password }: { password: string }) {
  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 || !/[^a-zA-Z0-9]/.test(password) ? 2 : 3;
  const labels = ["", "Weak", "Fair", "Strong"];
  const colors = ["", "bg-rose-500", "bg-amber-500", "bg-emerald-500"];
  if (!password) return null;
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 flex gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? colors[strength] : "bg-zinc-800"}`} />
        ))}
      </div>
      <span className={`text-[10px] font-semibold ${strength === 1 ? "text-rose-400" : strength === 2 ? "text-amber-400" : "text-emerald-400"}`}>
        {labels[strength]}
      </span>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState("");
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!verifyEmail) return;

    const supabase = createClient();
    
    // Check if user session updates (localStorage sync fires on local tab storage update)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        toast.success("Email verified successfully! Redirecting...");
        router.push("/onboarding");
      }
    });

    // Fallback polling: Check server session directly every 3 seconds
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        toast.success("Email verified successfully! Redirecting...");
        router.push("/onboarding");
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [verifyEmail, router]);

  const [, formAction, isPending] = useActionState(
    async (_prev: ActionResponse<{ email: string } | null>, formData: FormData): Promise<ActionResponse<{ email: string } | null>> => {
      const result = await signUpAction(_prev as ActionResponse, formData);
      if (!result.success) {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
      setVerifyEmail(result.data.email);
      return result;
    },
    initialState
  );

  const [, otpFormAction, otpIsPending] = useActionState(
    async (_prev: ActionResponse, formData: FormData): Promise<ActionResponse> => {
      formData.set("email", verifyEmail || "");
      const result = await verifyOtpAction(_prev, formData);
      if (result && !result.success) {
        toast.error(result.error);
        return result;
      }
      return { success: true, data: null };
    },
    { success: false, error: "" }
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

  if (verifyEmail) {
    return (
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-7 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Check your inbox</h2>
        <p className="text-xs text-zinc-500 leading-relaxed mb-6">
          We sent a verification code to<br /><span className="text-white font-semibold">{verifyEmail}</span>
        </p>

        <form action={otpFormAction} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <Label htmlFor="token" className="text-xs font-semibold text-zinc-400">Enter Verification Code</Label>
            <Input id="token" name="token" type="text" placeholder="••••••••" maxLength={8} required pattern="\d{6,8}"
              className="bg-zinc-950 border-zinc-800 text-center tracking-widest font-bold text-lg text-white rounded-xl h-12" />
          </div>

          <Button type="submit" disabled={otpIsPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-11 font-bold text-sm tracking-wide transition-all disabled:opacity-60">
            {otpIsPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Code"}
          </Button>
        </form>

        <p className="text-[11px] text-zinc-600 mt-4 leading-relaxed">
          You can also click the confirmation link in the email to activate your account.
        </p>

        <Link href="/auth/login" className="mt-6 block text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-7 shadow-2xl shadow-black/40">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Create your account</h1>
        <p className="text-xs text-zinc-500 mt-1">Start your AI-powered financial journey</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="display_name" className="text-xs font-semibold text-zinc-400">Your Name</Label>
          <Input id="display_name" name="display_name" type="text" autoComplete="name" placeholder="Alex Johnson"
            className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-11 focus:border-indigo-500/60" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-zinc-400">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required
            className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-11 focus:border-indigo-500/60" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-zinc-400">Password</Label>
          <div className="relative">
            <Input id="password" name="password" type={showPass ? "text" : "password"} autoComplete="new-password"
              placeholder="Min. 8 characters" required minLength={8}
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-11 pr-10 focus:border-indigo-500/60" />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrength password={password} />
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer group">
          <div className="w-4.5 h-4.5 rounded border border-zinc-700 bg-zinc-950 flex items-center justify-center mt-0.5 flex-shrink-0 group-hover:border-indigo-500/60 transition-colors">
            <Check className="w-3 h-3 text-indigo-400 opacity-0 group-has-[input:checked]:opacity-100 transition-opacity" />
          </div>
          <input type="checkbox" required className="sr-only" />
          <span className="text-[11px] text-zinc-500 leading-relaxed">
            I agree to the <span className="text-indigo-400">Terms of Service</span> and <span className="text-indigo-400">Privacy Policy</span>
          </span>
        </label>

        <Button type="submit" disabled={isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-11 font-bold text-sm tracking-wide transition-all disabled:opacity-60">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
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
        Already have an account?{" "}
        <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Sign in</Link>
      </p>
    </div>
  );
}
