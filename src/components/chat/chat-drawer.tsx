"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, X, Send, Sparkles, Loader2, Bot, User, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createTransactionAction } from "@/features/transactions/actions";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Lumora AI, your financial co-pilot 🚀\n\nI've already analyzed your finances. Ask me anything — budgets, goals, spending habits, or predictions.",
    },
  ]);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [savedStates, setSavedStates] = useState<Record<number, "idle" | "saved" | "cancelled">>({});
  const [isConfirming, setIsConfirming] = useState(false);
  const supabase = createClient();

  // Listen for global open event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-lumora-chat", handleOpen);
    return () => window.removeEventListener("open-lumora-chat", handleOpen);
  }, []);

  // Load chat history from DB on component mount
  useEffect(() => {
    async function loadHistory() {
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
    loadHistory();
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleClearChat = async () => {
    try {
      await fetch("/api/chat", { method: "DELETE" });
      setMessages([
        {
          role: "assistant",
          content:
            "Hi! I'm Lumora AI, your financial co-pilot 🚀\n\nI've already analyzed your finances. Ask me anything — budgets, goals, spending habits, or predictions.",
        },
      ]);
      setSavedStates({});
      toast.success("Chat history cleared!");
    } catch {
      toast.error("Failed to clear chat history.");
    }
  };

  const handleConfirmSave = async (
    index: number,
    amountStr: string,
    merchant: string,
    categoryName: string,
    notes: string
  ) => {
    setIsConfirming(true);
    try {
      const { data: categories } = await supabase
        .from("categories")
        .select("id, name")
        .is("deleted_at", null);

      const matchedCat = (categories || []).find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase()
      );
      const categoryId = matchedCat?.id || categories?.[0]?.id;

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
        
        // Append confirmation text bubble from Lumora AI
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

  const handleCancelSave = (index: number) => {
    setSavedStates((prev) => ({ ...prev, [index]: "cancelled" }));
    toast.info("Transaction cancelled.");
  };

  const handleSend = (directText?: string) => {
    const textToSend = directText || input;
    const trimmed = textToSend.trim();
    if (!trimmed || isPending) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    if (!directText) setInput("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            conversationId,
            history: messages,
          }),
        });

        if (!response.ok) {
          throw new Error("Chat API error");
        }

        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content || "Sorry, I couldn't formulate a response." },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ Connection error. Please try again.",
          },
        ]);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const QUICK_PROMPTS = [
    "How are my budgets looking?",
    "What's my savings rate?",
    "Show my top spending categories",
    "Am I on track with my goals?",
  ];

  return (
    <>
      {/* === Backdrop === */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* === Drawer Panel === */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "85vh" }}
        aria-hidden={!isOpen}
      >
        <div className="bg-zinc-950 border-t border-zinc-800/80 rounded-t-3xl flex flex-col max-w-2xl mx-auto shadow-2xl shadow-black/50"
             style={{ maxHeight: "85vh" }}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white leading-tight">Lumora AI Copilot</h2>
                <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">
                  ● Financial Intelligence Active
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearChat}
                title="Clear chat history"
                className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/30 flex items-center justify-center text-zinc-400 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.map((msg, i) => {
              const isAssistant = msg.role === "assistant";
              const ctaRegex = /<save-expense-cta\s+amount="([^"]+)"\s+merchant="([^"]+)"\s+category="([^"]+)"\s+notes="([^"]+)"\s*\/>/;
              const suggestionsRegex = /<suggested-questions>([\s\S]*?)<\/suggested-questions>/;

              const match = msg.content.match(ctaRegex);
              const suggestionsMatch = msg.content.match(suggestionsRegex);

              const cleanContent = msg.content.replace(ctaRegex, "").replace(suggestionsRegex, "").trim();

              return (
                <div
                  key={i}
                  className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div className={`flex gap-2.5 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 ${
                      msg.role === "assistant"
                        ? "bg-gradient-to-br from-indigo-600 to-violet-500"
                        : "bg-zinc-800 border border-zinc-700"
                    }`}>
                      {msg.role === "assistant" ? (
                        <Bot className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-zinc-300" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-sm"
                          : "bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-sm"
                      }`}
                    >
                      <div className="space-y-2 text-left">
                        <div className="whitespace-pre-wrap">{cleanContent}</div>

                        {match && (() => {
                          const amount = match[1];
                          const merchant = match[2];
                          const category = match[3];
                          const notes = match[4];

                          return (
                            <div className="mt-3 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 space-y-2.5">
                              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                                <span>Confirm transaction</span>
                                <span className="font-mono text-indigo-400 text-xs">₹{amount}</span>
                              </div>
                              <div className="text-[10px] text-zinc-500 space-y-0.5 leading-normal">
                                <p>Merchant: <span className="text-zinc-300 font-semibold">{merchant}</span></p>
                                <p>Category: <span className="text-zinc-300 font-semibold">{category}</span></p>
                              </div>
                              
                              {/* Actions */}
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
                                    onClick={() => handleConfirmSave(i, amount, merchant, category, notes)}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-7 text-[10px] rounded-lg"
                                  >
                                    {isConfirming ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancelSave(i)}
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
                    </div>
                  </div>

                  {/* Interactive Clickable Suggested Questions */}
                  {isAssistant && suggestionsMatch && (
                    <div className="flex flex-wrap gap-1.5 mt-1 justify-start pl-9 max-w-[85%]">
                      {suggestionsMatch[1]
                        .split("\n")
                        .map((line) => line.replace(/^[-\*\s\d\.\)]+/g, "").trim())
                        .filter(Boolean)
                        .map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(q)}
                            className="text-[10px] font-bold bg-zinc-950/90 hover:bg-indigo-600/15 border border-zinc-800 hover:border-indigo-500/40 text-zinc-400 hover:text-indigo-300 px-3 py-1.5 rounded-full transition-all text-left cursor-pointer flex items-center gap-1.5 shadow-sm"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0" />
                            <span>{q}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing indicator */}
            {isPending && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {/* Quick prompts (only show when no user messages yet) */}
            {messages.length === 1 && !isPending && (
              <div className="pt-2 space-y-2">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">Quick questions</span>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="text-left text-[11px] text-zinc-400 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-2.5 transition-colors leading-snug cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="px-4 py-3 border-t border-zinc-800/60 flex-shrink-0">
            <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-3.5 py-2.5 focus-within:border-indigo-500/50 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your finances…"
                disabled={isPending}
                rows={1}
                className="flex-1 bg-transparent text-xs text-white placeholder-zinc-600 resize-none outline-none leading-relaxed max-h-24 overflow-y-auto"
                style={{ minHeight: "1.25rem" }}
              />
              <button
                onClick={() => handleSend()}
                disabled={isPending || !input.trim()}
                className="w-7 h-7 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all flex-shrink-0 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            </div>
            <p className="text-center text-[9px] text-zinc-700 mt-1.5 select-none">
              Powered by Anthropic Claude (claude-haiku-4-5) • Press Enter to send
            </p>
          </div>
        </div>
      </div>

      {/* === FAB Trigger === */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Copilot"
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
      >
        <MessageSquare className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-zinc-950 animate-pulse" />
      </button>
    </>
  );
}

