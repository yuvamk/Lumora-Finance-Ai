"use client";
 
import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendOtpAction, verifyPasswordResetOtpAction, resetPasswordWithOtpAction } from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, ArrowLeft, KeyRound, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
 
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "reset" | "success">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isPending, startTransition] = useTransition();
 
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
 
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", email);
      const res = await sendOtpAction({ success: false, error: "" }, formData);
      if (res.success) {
        toast.success("OTP code sent successfully!");
        setStep("otp");
      } else {
        toast.error(res.error);
      }
    });
  };
 
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error("Please enter the 6-digit OTP code.");
      return;
    }
 
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("otp", otp);
      const res = await verifyPasswordResetOtpAction({ success: false, error: "" }, formData);
      if (res.success) {
        toast.success("OTP verified successfully!");
        setStep("reset");
      } else {
        toast.error(res.error);
      }
    });
  };
 
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
 
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("otp", otp);
      formData.set("password", password);
      formData.set("confirm_password", confirmPassword);
      const res = await resetPasswordWithOtpAction({ success: false, error: "" }, formData);
      if (res.success) {
        toast.success("Password updated successfully!");
        setStep("success");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        toast.error(res.error);
      }
    });
  };
 
  if (step === "success") {
    return (
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl shadow-black/40 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Password Updated!</h2>
        <p className="text-xs text-zinc-400">Your password was reset successfully. Redirecting you to sign in...</p>
      </div>
    );
  }
 
  if (step === "reset") {
    return (
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-7 shadow-2xl shadow-black/40">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-400" />
            Set New Password
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Provide a new secure password for your account</p>
        </div>
 
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-zinc-400">New Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPass ? "text" : "password"} 
                placeholder="Min. 8 characters" 
                required 
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/[0.02] border-white/[0.08] text-white placeholder:text-zinc-650 rounded-xl h-11 pr-10 focus:border-indigo-500/60" 
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
 
          <div className="space-y-1.5">
            <Label htmlFor="confirm_password" className="text-xs font-semibold text-zinc-400">Confirm Password</Label>
            <Input 
              id="confirm_password" 
              type="password" 
              placeholder="Repeat your password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-white/[0.02] border-white/[0.08] text-white placeholder:text-zinc-650 rounded-xl h-11 focus:border-indigo-500/60" 
            />
          </div>
 
          <Button type="submit" disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-11 font-bold text-sm tracking-wide transition-all disabled:opacity-60">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
          </Button>
        </form>
      </div>
    );
  }
 
  if (step === "otp") {
    return (
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-7 shadow-2xl shadow-black/40">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            Enter OTP Code
          </h1>
          <p className="text-xs text-zinc-500 mt-1">We sent a 6-digit confirmation code to <span className="text-zinc-300 font-semibold">{email}</span></p>
        </div>
 
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="otp" className="text-xs font-semibold text-zinc-400">Verification Code</Label>
            <Input 
              id="otp" 
              type="text" 
              maxLength={6}
              placeholder="123456" 
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="bg-white/[0.02] border-white/[0.08] text-white text-center font-mono tracking-[0.5em] text-lg font-bold placeholder:text-zinc-700 placeholder:tracking-normal rounded-xl h-11 focus:border-indigo-500/60" 
            />
          </div>
 
          <Button type="submit" disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-11 font-bold text-sm tracking-wide transition-all disabled:opacity-60">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify OTP Code"}
          </Button>
        </form>
 
        <button 
          onClick={() => setStep("email")} 
          className="mt-5 w-full flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Email Entry
        </button>
      </div>
    );
  }
 
  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-7 shadow-2xl shadow-black/40">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-400" />
          Reset Password
        </h1>
        <p className="text-xs text-zinc-500 mt-1">We will send a 6-digit code to verify your identity</p>
      </div>
 
      <form onSubmit={handleSendOtp} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-zinc-400">Email Address</Label>
          <Input 
            id="email" 
            type="email" 
            autoComplete="email" 
            placeholder="you@example.com" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/[0.02] border-white/[0.08] text-white placeholder:text-zinc-650 rounded-xl h-11 focus:border-indigo-500/60" 
          />
        </div>
 
        <Button type="submit" disabled={isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-11 font-bold text-sm tracking-wide transition-all disabled:opacity-60">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Verification OTP"}
        </Button>
      </form>
 
      <Link href="/auth/login" className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-400 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
      </Link>
    </div>
  );
}
