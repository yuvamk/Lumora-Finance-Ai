"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Sparkles, Brain, Lightbulb, TrendingUp, AlertTriangle, 
  MessageSquare, Loader2, Send, Bot, User, Camera, Play, CheckCircle2, History, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createTransactionAction, parseExpenseNlpAction } from "@/features/transactions/actions";
import { ReceiptScanner } from "@/features/ocr/components/receipt-scanner";

interface AiWorkspaceClientProps {
  userId: string;
  initialFko: any;
  initialScore: any;
}

export function AiWorkspaceClient({ userId, initialFko, initialScore }: AiWorkspaceClientProps) {
  const [activeTab, setActiveTab] = useState<
    "chat" | "insights" | "predictions" | "recommendations" | "assistant" | "scanner" | "history"
  >("chat");

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isPending, startTransition] = useTransition();

  // Chat states
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Lumora AI, your personal finance co-pilot 🚀\n\nAsk me anything: budget advice, trend explanation, expense logging (e.g. 'I spent 20 rupees on toffee'), or future predictions.",
    },
  ]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [savedStates, setSavedStates] = useState<Record<number, "idle" | "saved" | "cancelled">>({});
  const [isConfirming, setIsConfirming] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Expense assistant states
  const [nlpText, setNlpText] = useState("");
  const [nlpExtracted, setNlpExtracted] = useState<any>(null);

  const supabase = createClient();

  // Load categories and chat history
  useEffect(() => {
    async function loadData() {
      // Load categories
      const { data: catData } = await supabase
        .from("categories")
        .select("id, name")
        .is("deleted_at", null)
        .order("name", { ascending: true });
      if (catData) setCategories(catData);

      // Load chat history
      try {
        const response = await fetch("/api/chat");
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
          if (data.conversationId) {
            setConversationId(data.conversationId);
          }
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    }
    loadData();
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const handleSendChat = (directText?: string) => {
    const textToSend = directText || chatInput;
    const trimmed = textToSend.trim();
    if (!trimmed || isPending) return;

    const currentHistory = [...messages];
    const userMsg = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    
    if (!directText) {
      setChatInput("");
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            conversationId,
            history: currentHistory,
          }),
        });

        if (!response.ok) {
          throw new Error("Chat error");
        }

        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content || "Sorry, I could not formulate a response." },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ Connection error. Please try again.",
          },
        ]);
      }
    });
  };

  const handleClearChat = async () => {
    try {
      await fetch("/api/chat", { method: "DELETE" });
      setMessages([
        {
          role: "assistant",
          content:
            "Hi! I'm Lumora AI, your personal finance co-pilot 🚀\n\nAsk me anything: budget advice, trend explanation, expense logging (e.g. 'I spent 20 rupees on toffee'), or future predictions.",
        },
      ]);
      setSavedStates({});
      toast.success("Chat history cleared!");
    } catch {
      toast.error("Failed to clear chat history.");
    }
  };

  const handleConfirmSaveChat = async (
    index: number,
    amountStr: string,
    merchant: string,
    categoryName: string,
    notes: string
  ) => {
    setIsConfirming(true);
    try {
      const matchedCat = categories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase()
      );
      const categoryId = matchedCat?.id || categories[0]?.id;

      if (!categoryId) {
        throw new Error("Unable to map to a valid category.");
      }

      const response = await createTransactionAction({
        type: "expense",
        amount: Number(amountStr),
        category_id: categoryId,
        date: new Date().toISOString().slice(0, 10),
        notes: notes || `Expense at ${merchant}`,
        status: "categorized",
      });

      if (response.success) {
        setSavedStates((prev) => ({ ...prev, [index]: "saved" }));
        toast.success(`Recorded ₹${amountStr} for ${merchant}!`);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Done! ₹${amountStr} for ${merchant} has been saved under ${categoryName}.`,
          },
        ]);
      } else {
        toast.error(response.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm save.");
    } finally {
      setIsConfirming(false);
    }
  };

  // Expense assistant parsing
  const handleNlpParse = () => {
    if (!nlpText.trim()) {
      toast.error("Please enter a sentence first.");
      return;
    }

    startTransition(async () => {
      const response = await parseExpenseNlpAction(nlpText);
      if (response.success) {
        setNlpExtracted(response.data);
      } else {
        toast.error(response.error);
      }
    });
  };

  const handleSaveAssistantExpense = async () => {
    if (!nlpExtracted) return;

    startTransition(async () => {
      const response = await createTransactionAction({
        type: "expense",
        amount: Number(nlpExtracted.amount),
        category_id: nlpExtracted.categoryId,
        date: nlpExtracted.date,
        notes: `${nlpExtracted.merchant} - ${nlpExtracted.notes}`,
        status: "categorized",
      });

      if (response.success) {
        toast.success("Expense recorded successfully!");
        setNlpText("");
        setNlpExtracted(null);
      } else {
        toast.error(response.error);
      }
    });
  };

  const gradeColor = initialScore.grade === "A" ? "text-emerald-400" : initialScore.grade === "B" ? "text-indigo-400"
    : initialScore.grade === "C" ? "text-amber-400" : "text-rose-400";

  return (
    <div className="space-y-6">
      {/* Workspace Tabs */}
      <div className="flex border-b border-zinc-900 pb-px overflow-x-auto no-scrollbar">
        {(["chat", "insights", "predictions", "recommendations", "assistant", "scanner", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 select-none ${
              activeTab === tab
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab === "chat" ? "AI Chat" : tab === "insights" ? "Insights" : tab === "predictions" ? "Predictions" : tab === "recommendations" ? "Savings" : tab === "assistant" ? "Logger" : tab === "scanner" ? "OCR scan" : "History logs"}
          </button>
        ))}
      </div>

      {/* TAB 1: Conversational Chat */}
      {activeTab === "chat" && (
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-4 flex flex-col h-[520px]">
          {/* Header Bar with Clear Chat button */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Lumora AI Copilot</span>
            </div>
            <button
              onClick={handleClearChat}
              title="Clear chat history"
              className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-rose-400 bg-zinc-900 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-rose-400" />
              <span>Clear Chat</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto space-y-4 pr-1 min-h-0 mb-4">
            {messages.map((msg, i) => {
              const isAssistant = msg.role === "assistant";
              const { parsedElements, ctaMatch, suggestionsMatch } = renderChatContent(msg.content);

              return (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isAssistant ? "bg-indigo-600" : "bg-zinc-800"
                  }`}>
                    {isAssistant ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-zinc-300" />}
                  </div>

                  <div className="flex flex-col max-w-[80%] gap-1.5">
                    <div className={`px-3.5 py-2.5 rounded-2xl leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none text-xs"
                        : "bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-800"
                    }`}>
                      {isAssistant ? (
                        <div className="space-y-1.5 text-left">
                          {parsedElements}

                          {ctaMatch && (() => {
                            const amount = ctaMatch[1];
                            const merchant = ctaMatch[2];
                            const category = ctaMatch[3];
                            const notes = ctaMatch[4];

                            return (
                              <div className="mt-3 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 space-y-2">
                                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                                  <span>Confirm transaction</span>
                                  <span className="font-mono text-indigo-400 text-xs">₹{amount}</span>
                                </div>
                                <div className="text-[10px] text-zinc-500 space-y-0.5">
                                  <p>Merchant: <span className="text-zinc-300 font-semibold">{merchant}</span></p>
                                  <p>Category: <span className="text-zinc-300 font-semibold">{category}</span></p>
                                </div>
                                
                                {savedStates[i] === "saved" ? (
                                  <div className="text-center text-[9px] text-emerald-400 font-bold py-1 bg-emerald-500/10 rounded-lg">
                                    ✓ Saved to Ledger
                                  </div>
                                ) : savedStates[i] === "cancelled" ? (
                                  <div className="text-center text-[9px] text-zinc-500 font-semibold py-1 bg-zinc-900 rounded-lg">
                                    Cancelled
                                  </div>
                                ) : (
                                  <div className="flex gap-2 pt-1">
                                    <Button
                                      size="sm"
                                      disabled={isConfirming}
                                      onClick={() => handleConfirmSaveChat(i, amount, merchant, category, notes)}
                                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-7 text-[10px] rounded-lg"
                                    >
                                      {isConfirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSavedStates((prev) => ({ ...prev, [i]: "cancelled" }))}
                                      className="flex-1 border-zinc-800 text-zinc-400 hover:bg-zinc-900 h-7 text-[10px] rounded-lg"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {/* Suggested Clickable Questions */}
                    {isAssistant && suggestionsMatch && (
                      <div className="flex flex-wrap gap-1.5 mt-0.5 justify-start pl-1">
                        {parseSuggestions(suggestionsMatch[1]).map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendChat(q)}
                            className="text-[10px] font-bold bg-zinc-950/80 hover:bg-indigo-600/10 border border-zinc-800 hover:border-indigo-500/30 text-zinc-400 hover:text-indigo-400 px-3 py-1.5 rounded-full transition-all text-left cursor-pointer"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isPending && (
              <div className="flex gap-2.5 flex-row">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 bg-indigo-600">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <DotWaveLoader />
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Panel */}
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-2xl px-3.5 py-2.5 focus-within:border-indigo-500/50 transition-colors">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder="Ask about budgets, trends, or record an expense..."
              className="flex-grow bg-transparent text-base md:text-xs text-white placeholder-zinc-650 outline-none"
            />
             <Button
              onClick={() => handleSendChat()}
              disabled={isPending || !chatInput.trim()}
              className="w-7 h-7 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center p-0 flex-shrink-0"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: Insights */}
      {activeTab === "insights" && (
        <div className="space-y-4">
          {/* Health Score Summary Card */}
          <div className="bg-gradient-to-r from-indigo-950/60 to-violet-950/60 border border-indigo-800/40 rounded-3xl p-5">
            <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-3 font-semibold">Financial Health Score</p>
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-black ${gradeColor}`}>{initialScore.grade}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-zinc-400">Overall Score</span>
                  <span className="text-sm font-bold text-white">{initialScore.overallScore}/100</span>
                </div>
                <div className="h-2 bg-zinc-850 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-indigo-500`} style={{ width: `${initialScore.overallScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Generated Insights</p>
            {initialFko.insights.map((ins: any) => (
              <div key={ins.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h4 className="text-xs font-bold text-white leading-snug">{ins.title}</h4>
                  <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border border-indigo-500/20 text-indigo-400 bg-indigo-500/5">
                    {ins.explainability.priority}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{ins.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Predictions */}
      {activeTab === "predictions" && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Dynamic Spending Predictions</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {initialFko.predictions.map((p: any, i: number) => {
              const isDownward = p.trend === "downward";
              return (
                <div key={i} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">{p.metric}</span>
                    <h4 className="text-base font-bold text-white mt-1">₹{p.predictedValue.toLocaleString()}</h4>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{p.timeframe}</p>
                  </div>
                  <span className={`text-xl font-bold font-mono ${isDownward ? "text-emerald-400" : "text-rose-400"}`}>
                    {isDownward ? "↓" : "↑"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Recommendations */}
      {activeTab === "recommendations" && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Savings Opportunities</p>
          {initialFko.recommendations.map((r: any) => (
            <div key={r.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex justify-between items-center gap-4">
              <div>
                <h4 className="text-xs font-bold text-white">{r.title}</h4>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{r.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-xl">
                  Save ₹{r.estimatedMonthlySavings}/mo
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: Expense Assistant (NLP Logger) */}
      {activeTab === "assistant" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nlpText" className="text-xs text-zinc-400">Describe your spend in natural language</Label>
            <div className="flex gap-2">
              <Input
                id="nlpText"
                value={nlpText}
                onChange={(e) => setNlpText(e.target.value)}
                placeholder="E.g., I spent ₹80 on breakfast, or paid 120 for petrol."
                className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 text-base md:text-sm"
              />
              <Button
                onClick={handleNlpParse}
                disabled={isPending || !nlpText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 h-11 px-4 rounded-xl flex items-center justify-center flex-shrink-0 font-bold"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-white" />}
              </Button>
            </div>
          </div>

          {nlpExtracted && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mt-4 space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
                <div>
                  <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">AI Extracted details</span>
                  <h4 className="text-base font-bold text-white mt-1">{nlpExtracted.merchant}</h4>
                  <p className="text-zinc-400 mt-0.5">{nlpExtracted.item}</p>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 font-mono">{nlpExtracted.date}</span>
                  <h3 className="text-xl font-bold text-indigo-400 mt-0.5 font-mono">₹{nlpExtracted.amount}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-zinc-500">Category Suggestion</span>
                  <p className="font-semibold text-zinc-200 mt-0.5">{nlpExtracted.categorySuggestion}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Payment Method</span>
                  <p className="font-semibold text-zinc-200 mt-0.5">{nlpExtracted.paymentMethod}</p>
                </div>
              </div>

              <Button
                onClick={handleSaveAssistantExpense}
                disabled={isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 rounded-xl flex items-center justify-center gap-1.5"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm and Save Expense
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: Receipt Scanner */}
      {activeTab === "scanner" && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Claude Vision Receipt Scan</p>
          <ReceiptScanner categories={categories} onSuccess={() => setActiveTab("history")} />
        </div>
      )}

      {/* TAB 7: History Logs */}
      {activeTab === "history" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recent AI logs</span>
            <History className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="space-y-2">
            {messages.filter(m => m.role === "user").slice(-6).map((msg, idx) => (
              <div key={idx} className="bg-zinc-900/60 border border-zinc-900 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-zinc-300">"{msg.content}"</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">Parsed query statement</p>
                </div>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Parsed</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function parseSuggestions(xmlContent: string): string[] {
  return xmlContent
    .split("\n")
    .map(line => line.replace(/^[-\*\s\d\.\)]+/g, "").trim())
    .filter(Boolean);
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const boldCodeRegex = /(\*\*.*?\*\*|`.*?`)/g;
  const splitParts = text.split(boldCodeRegex);

  splitParts.forEach((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      parts.push(<strong key={idx} className="font-bold text-white">{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("`") && part.endsWith("`")) {
      parts.push(
        <code key={idx} className="bg-zinc-950 px-1.5 py-0.5 rounded font-mono text-[10px] text-indigo-300 border border-zinc-800">
          {part.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(part);
    }
  });

  return parts;
}

function renderChatContent(content: string) {
  const ctaRegex = /<save-expense-cta\s+amount="([^"]+)"\s+merchant="([^"]+)"\s+category="([^"]+)"\s+notes="([^"]+)"\s*\/>/;
  const suggestionsRegex = /<suggested-questions>([\s\S]*?)<\/suggested-questions>/;

  const ctaMatch = content.match(ctaRegex);
  const suggestionsMatch = content.match(suggestionsRegex);

  let cleanText = content.replace(ctaRegex, "").replace(suggestionsRegex, "").trim();

  const lines = cleanText.split("\n");
  const parsedElements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = (key: number) => {
    if (tableRows.length === 0) return null;
    const hasHeader = tableRows.length > 1;
    const headerRow = hasHeader ? tableRows[0] : null;
    const bodyRows = hasHeader ? tableRows.slice(1).filter(r => r.some(c => c.trim() && !c.includes("---"))) : tableRows;

    tableRows = [];
    inTable = false;

    return (
      <div key={`table-${key}`} className="my-2.5 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/50">
        <table className="w-full text-[11px] text-left border-collapse">
          {headerRow && (
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400">
                {headerRow.map((col, idx) => (
                  <th key={idx} className="px-3 py-1.5 font-bold uppercase tracking-wider">{col.trim()}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {bodyRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-zinc-800/40 last:border-0 hover:bg-zinc-900/20">
                {row.map((col, colIdx) => (
                  <td key={colIdx} className="px-3 py-1.5 text-zinc-300 font-medium">{col.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      const cols = trimmed.split("|").slice(1, -1);
      if (!cols.every(c => c.trim().match(/^-+$/))) {
        tableRows.push(cols);
      }
      return;
    } else if (inTable) {
      const tableElem = flushTable(idx);
      if (tableElem) parsedElements.push(tableElem);
    }

    if (trimmed.startsWith("###")) {
      parsedElements.push(
        <h4 key={idx} className="text-xs font-bold text-white mt-3.5 mb-1.5 tracking-wide">{trimmed.replace(/^###\s*/, "")}</h4>
      );
    } else if (trimmed.startsWith("##")) {
      parsedElements.push(
        <h3 key={idx} className="text-xs font-bold text-indigo-300 mt-4 mb-2 border-b border-zinc-800/40 pb-0.5">{trimmed.replace(/^##\s*/, "")}</h3>
      );
    } else if (trimmed.startsWith("#")) {
      parsedElements.push(
        <h2 key={idx} className="text-sm font-extrabold text-white mt-5 mb-2.5">{trimmed.replace(/^#\s*/, "")}</h2>
      );
    } 
    else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      const bulletText = trimmed.replace(/^[-\*]\s*/, "");
      parsedElements.push(
        <div key={idx} className="flex gap-2 items-start my-0.5 text-zinc-300 pl-1.5">
          <span className="text-indigo-400 flex-shrink-0 mt-0.5">•</span>
          <span className="text-[11px] leading-relaxed">{parseInlineMarkdown(bulletText)}</span>
        </div>
      );
    } 
    else if (trimmed) {
      parsedElements.push(
        <p key={idx} className="my-1 text-zinc-300 text-[11px] leading-relaxed">{parseInlineMarkdown(trimmed)}</p>
      );
    } else {
      parsedElements.push(<div key={idx} className="h-1.5" />);
    }
  });

  if (inTable) {
    const tableElem = flushTable(9999);
    if (tableElem) parsedElements.push(tableElem);
  }

  return {
    parsedElements,
    ctaMatch,
    suggestionsMatch,
  };
}

function DotWaveLoader() {
  return (
    <div className="flex gap-1 items-center px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-none w-14 justify-center">
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-[bounce_1.4s_infinite_ease-in-out_both] [animation-delay:-0.32s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-[bounce_1.4s_infinite_ease-in-out_both] [animation-delay:-0.16s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-[bounce_1.4s_infinite_ease-in-out_both]" />
    </div>
  );
}
