"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  TrendingUp, 
  ArrowUpRight, 
  Sparkles, 
  Wallet, 
  LineChart, 
  MessageSquare, 
  CreditCard, 
  Shield, 
  Zap, 
  ArrowRight,
  User,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);
  const [activeSimulatorTab, setActiveSimulatorTab] = useState<"home" | "analytics" | "ai" | "subs">("home");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { sender: "assistant", text: "Hi! I'm Lumora, your financial co-pilot. I've analyzed your spending this month." },
    { sender: "assistant", text: "You spent 27% more on food delivery than last month, mostly on Friday nights. You could save ~$120/month by reducing these charges. Shall I set a dining budget?" }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");

    setTimeout(() => {
      let reply = "I've checked the database aggregates. ";
      if (userMsg.toLowerCase().includes("budget")) {
        reply += "You have a dining budget of $200. You've spent $145 so far, leaving $55. At your current rate, you will exceed it in 4 days.";
      } else if (userMsg.toLowerCase().includes("predict") || userMsg.toLowerCase().includes("tomorrow")) {
        reply += "Your predicted month-end expense is $1,420, which fits safely within your historical income of $2,500.";
      } else {
        reply += "I'm analyzing that query against your account records. Let me know if you would like me to set up a subscription alert for it.";
      }
      setChatMessages((prev) => [...prev, { sender: "assistant", text: reply }]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Lumora AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="border-zinc-800 text-zinc-400 bg-zinc-950/50 hidden sm:inline-flex">
            v0.1.0 Alpha Preview
          </Badge>
          {user ? (
            <Link href="/dashboard">
              <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500 font-medium rounded-full px-4">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-medium rounded-full px-4">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        {/* Left Column: Copy & Messaging */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
          <Badge className="w-fit bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 text-xs rounded-full font-medium">
            ✨ Introducing the AI Financial Operating System
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Understand every dollar. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400 bg-clip-text text-transparent">
              Predict every tomorrow.
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl leading-relaxed">
            Lumora is an intelligent financial companion that observes your habits, warns you of budget breaches, aggregates transactions automatically, and helps model tomorrow&apos;s cash flow. 
            <strong> Not another static ledger. An active brain for your money.</strong>
          </p>

          {/* Core Feature Value Props list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {[
              { icon: Shield, text: "Supabase Row-Level Security (RLS)" },
              { icon: Zap, text: "Database Aggregated AI Processing" },
              { icon: CreditCard, text: "Automated Subscription Roller" },
              { icon: TrendingUp, text: "Predictive Month-End Analytics" }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-300">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <feature.icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            {user ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-8 shadow-lg shadow-indigo-600/25 group">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-8 shadow-lg shadow-indigo-600/25 group">
                    Start Your Plan
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full border-zinc-800 hover:bg-zinc-950 text-zinc-300 hover:text-white rounded-full px-8">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Phone Simulator */}
        <div className="lg:col-span-5 flex justify-center relative">
          {/* Decorative backdrop glow behind phone */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/25 to-purple-500/10 blur-[100px] -z-10 rounded-full scale-75" />

          {/* iPhone Body */}
          <div className="w-[360px] h-[720px] rounded-[50px] border-[12px] border-zinc-800 bg-zinc-950 shadow-2xl relative flex flex-col overflow-hidden ring-1 ring-zinc-700/50">
            {/* Dynamic Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full absolute left-4" />
            </div>

            {/* Simulator Screen Content */}
            <div className="flex-1 flex flex-col overflow-hidden pt-10 pb-6 px-4 bg-zinc-950 relative">
              
              {/* Header inside Phone */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-xs text-zinc-500 block">Welcome back,</span>
                  <span className="text-sm font-semibold text-white">Alex Mercer</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
              </div>

              {/* Dynamic Viewport dependent on active Tab */}
              <div className="flex-1 overflow-y-auto pr-0.5 space-y-5 scrollbar-none">
                
                {/* HOME TAB VIEW */}
                {activeSimulatorTab === "home" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {/* Financial Health & Balance Card */}
                    <Card className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-md">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardDescription className="text-xs text-zinc-500 flex justify-between items-center">
                          CURRENT LIQUID BALANCE
                          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] py-0">
                            Health: 92/100
                          </Badge>
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-white tracking-tight">$8,245.50</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-1 grid grid-cols-2 gap-3 border-t border-zinc-900 mt-2">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase block">This Month Flow</span>
                          <span className="text-xs font-semibold text-emerald-400 flex items-center">
                            +$1,280.00 <ArrowUpRight className="w-3 h-3 ml-0.5" />
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase block">AI Forecast Out</span>
                          <span className="text-xs font-semibold text-zinc-300">
                            $1,420.00
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Insights Banner */}
                    <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-2xl p-3 flex gap-3 items-start">
                      <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-indigo-300">Co-Pilot Insight</h4>
                        <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                          Your subscription renews in 2 days (Netflix, $15.49). Based on usage trends, you haven&apos;t opened the app in 18 days.
                        </p>
                      </div>
                    </div>

                    {/* Recent Transactions List */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-zinc-400">Recent Transactions</span>
                        <span className="text-[11px] text-zinc-500">View all</span>
                      </div>

                      {[
                        { merchant: "Uber Eats", category: "Dining", amount: "-$32.50", mood: " regretful 😔", bg: "bg-rose-500/10 text-rose-400" },
                        { merchant: "Paycheck Deposit", category: "Income", amount: "+$2,500.00", mood: " happy 😊", bg: "bg-emerald-500/10 text-emerald-400" },
                        { merchant: "Adobe Creative Cloud", category: "Software", amount: "-$54.99", mood: " necessary ⚙️", bg: "bg-zinc-800/80 text-zinc-400" }
                      ].map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-zinc-900/60 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-colors">
                          <div>
                            <span className="text-xs font-medium text-white block">{t.merchant}</span>
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                              {t.category} • <span className="italic">{t.mood}</span>
                            </span>
                          </div>
                          <span className={`text-xs font-semibold ${t.amount.startsWith("-") ? "text-zinc-300" : "text-emerald-400"}`}>
                            {t.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ANALYTICS TAB VIEW */}
                {activeSimulatorTab === "analytics" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Spending Trends</h3>
                      <Badge variant="outline" className="border-zinc-800 text-[10px] py-0 px-2 text-zinc-400">Monthly View</Badge>
                    </div>

                    {/* Chart Mockup */}
                    <Card className="bg-zinc-900/60 border-zinc-800/80 p-4">
                      <div className="h-32 w-full flex items-end justify-between gap-1.5 px-2 pt-6">
                        {[40, 55, 30, 85, 45, 95, 60, 75].map((val, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                            <div 
                              style={{ height: `${val}%` }} 
                              className={`w-full rounded-t-sm transition-all duration-300 ${i === 5 ? "bg-gradient-to-t from-indigo-600 to-indigo-400" : "bg-zinc-800 group-hover:bg-zinc-700"}`}
                            />
                            <span className="text-[9px] text-zinc-600 font-mono">M{i+1}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center border-t border-zinc-900 mt-4 pt-3 text-[11px] text-zinc-400">
                        <span>Average Spend: <strong>$1,240</strong></span>
                        <span className="text-indigo-400 font-semibold flex items-center gap-0.5">
                          Peak: Month 6 <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Card>

                    {/* Category Distribution list */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-zinc-400">Category Allocations</span>
                      {[
                        { name: "Food & Dining", spent: "$450.00", pct: "36%", color: "bg-indigo-500" },
                        { name: "Rent & Utilities", spent: "$850.00", pct: "68%", color: "bg-purple-500" },
                        { name: "Subscriptions", spent: "$120.00", pct: "9%", color: "bg-pink-500" }
                      ].map((cat, i) => (
                        <div key={i} className="space-y-1.5 p-2 bg-zinc-900/40 rounded-xl">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-zinc-300 flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                              {cat.name}
                            </span>
                            <span className="text-zinc-400">{cat.spent} ({cat.pct})</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div className={`h-full ${cat.color}`} style={{ width: cat.pct }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI CHAT TAB VIEW */}
                {activeSimulatorTab === "ai" && (
                  <div className="flex flex-col h-[480px] justify-between animate-in fade-in duration-300">
                    {/* Message stream */}
                    <div className="space-y-3 overflow-y-auto max-h-[390px] pr-1">
                      {chatMessages.map((msg, idx) => (
                        <div 
                          key={idx} 
                          className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                            msg.sender === "user" 
                              ? "bg-indigo-600 text-white rounded-br-none" 
                              : "bg-zinc-900 text-zinc-300 rounded-bl-none border border-zinc-800"
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input form */}
                    <form onSubmit={handleSendMessage} className="flex gap-1.5 mt-2">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask: 'Dining budget status'..." 
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <Button type="submit" size="icon" className="h-8 w-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shrink-0">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </form>
                  </div>
                )}

                {/* SUBSCRIPTIONS TAB VIEW */}
                {activeSimulatorTab === "subs" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Rollover Bills</h3>
                      <span className="text-xs text-zinc-400 font-bold">$125.48/mo</span>
                    </div>

                    {/* Subscriptions Grid */}
                    <div className="grid grid-cols-1 gap-2.5">
                      {[
                        { name: "Netflix Premium", renewal: "2 days left", amount: "$15.49/mo", status: "Inactive usage detected ⚠️" },
                        { name: "Adobe Creative Suite", renewal: "Aug 12, 2026", amount: "$54.99/mo", status: "Used daily" },
                        { name: "Spotify Family", renewal: "Aug 18, 2026", amount: "$16.99/mo", status: "Dual service match found 🔀" },
                        { name: "Amazon Prime", renewal: "Yearly - Oct 04", amount: "$139.00/yr", status: "Active" }
                      ].map((sub, i) => (
                        <div key={i} className="p-3 bg-zinc-900/60 border border-zinc-900 rounded-xl">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-semibold text-white block">{sub.name}</span>
                              <span className="text-[10px] text-zinc-500">Renews: {sub.renewal}</span>
                            </div>
                            <span className="text-xs font-semibold text-zinc-300">{sub.amount}</span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-zinc-950 flex justify-between items-center text-[10px]">
                            <span className={sub.status.includes("⚠️") || sub.status.includes("🔀") ? "text-amber-400 font-medium" : "text-zinc-500"}>
                              {sub.status}
                            </span>
                            <span className="text-indigo-400 cursor-pointer">Manage</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Floating Action Button (FAB) inside Phone */}
              {activeSimulatorTab !== "ai" && (
                <button 
                  onClick={() => {
                    setActiveSimulatorTab("ai");
                    setChatMessages((prev) => [...prev, { sender: "assistant", text: "Ready to catalog a receipt or analyze a bill! What would you like me to look up?" }]);
                  }}
                  className="absolute bottom-16 right-6 w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/35 hover:scale-105 active:scale-95 transition-all duration-200 z-10"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}

              {/* Bottom Nav Bar inside Phone */}
              <div className="h-12 border-t border-zinc-900 mt-4 flex items-center justify-between px-3 pt-2 bg-zinc-950/80 backdrop-blur-md">
                {[
                  { id: "home", label: "Home", icon: Wallet },
                  { id: "analytics", label: "Analytics", icon: LineChart },
                  { id: "ai", label: "AI Co-pilot", icon: MessageSquare },
                  { id: "subs", label: "Bills", icon: CreditCard }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeSimulatorTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSimulatorTab(tab.id as "home" | "analytics" | "ai" | "subs")}
                      className="flex flex-col items-center gap-1 flex-1 text-center"
                    >
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
                      <span className={`text-[9px] font-medium transition-colors ${isActive ? "text-indigo-400" : "text-zinc-600"}`}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

            </div>
          </div>
        </div>

      </main>

      {/* Feature grid explaining the pillars */}
      <section className="mx-auto max-w-7xl px-6 py-20 border-t border-zinc-900">
        <div className="text-center max-w-xl mx-auto mb-12">
          <Badge className="bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-full text-xs py-0.5 px-3 mb-3">
            Core Engine Features
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Designed for Financial Sovereignty
          </h2>
          <p className="text-sm text-zinc-400 mt-3">
            Lumora integrates state of the art server action pipelines with PostgreSQL security rules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-zinc-900/30 border-zinc-800/80 p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Row Level Isolation (RLS)</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Your data is cryptographically safe. Every row in our PostgreSQL database matches your user ID using Supabase RLS. No cross-tenant reads are possible.
              </p>
            </div>
            <div className="pt-4 text-xs font-semibold text-indigo-400">Secure Database Design</div>
          </Card>

          <Card className="bg-zinc-900/30 border-zinc-800/80 p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">LLM Mathematical Isolation</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                To guarantee 100% calculation accuracy, the AI is blocked from doing math. Database engines sum, category-map, and filter before feeding structured JSON summaries to Claude.
              </p>
            </div>
            <div className="pt-4 text-xs font-semibold text-violet-400">Zero Hallucinations</div>
          </Card>

          <Card className="bg-zinc-900/30 border-zinc-800/80 p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Server-First Actions</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Written under Next.js 15 Server Action rules, transaction writes and category additions bypass heavy API routing to compile directly to DB instances with instant client caching.
              </p>
            </div>
            <div className="pt-4 text-xs font-semibold text-pink-400">Optimistic UI Transitions</div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-12 text-center text-xs text-zinc-600">
        <p>© 2026 Lumora AI Inc. All rights reserved. Secure personal financial intelligence co-pilot.</p>
      </footer>
    </div>
  );
}
