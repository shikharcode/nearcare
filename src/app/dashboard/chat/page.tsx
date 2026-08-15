"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowUp, Trash2, Sparkles, Mic, Heart, Activity, Moon, Pill, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
  timestamp: Date;
}

interface StarterQuestion {
  text: string;
  icon: React.ReactNode;
}

const STARTER_QUESTIONS: StarterQuestion[] = [
  { text: "How is my BP trending?", icon: <Activity className="w-4 h-4" /> },
  { text: "Am I taking my meds regularly?", icon: <Pill className="w-4 h-4" /> },
  { text: "What patterns do you see in my sleep?", icon: <Moon className="w-4 h-4" /> },
  { text: "Any concerns this week?", icon: <AlertCircle className="w-4 h-4" /> },
  { text: "How is my heart health?", icon: <Heart className="w-4 h-4" /> },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5">
      <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
      <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
      <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function autoResizeTextarea() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 128) + "px";
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", text: trimmed, timestamp: new Date() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const history = messages.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      text: m.text,
    }));

    const streamingMessage: Message = {
      role: "assistant",
      text: "",
      streaming: true,
      timestamp: new Date(),
    };
    setMessages([...nextMessages, streamingMessage]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to get a response.");
        setMessages(nextMessages);
        return;
      }

      if (!res.body) {
        toast.error("No response body received.");
        setMessages(nextMessages);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === "assistant") {
            updated[lastIdx] = {
              role: "assistant",
              text: accumulated,
              streaming: true,
              timestamp: updated[lastIdx].timestamp,
            };
          }
          return updated;
        });
      }

      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === "assistant") {
          updated[lastIdx] = {
            role: "assistant",
            text: accumulated,
            streaming: false,
            timestamp: updated[lastIdx].timestamp,
          };
        }
        return updated;
      });
    } catch {
      toast.error("Network error. Please try again.");
      setMessages(nextMessages);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function clearConversation() {
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950">

      {/* Sticky Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {/* Avatar with animated online dot */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {/* Animated green pulse dot */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-white dark:border-gray-900" />
            </span>
          </div>

          <div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
              AI Health Assistant
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight flex items-center gap-1">
              Powered by{" "}
              <span className="font-semibold">
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">e</span>
                <span className="text-[#FBBC05]">m</span>
                <span className="text-[#4285F4]">i</span>
                <span className="text-[#34A853]">n</span>
                <span className="text-[#EA4335]">i</span>
              </span>
            </p>
          </div>
        </div>

        {hasMessages && (
          <button
            onClick={clearConversation}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-xs font-medium">Clear</span>
          </button>
        )}
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-gray-50 dark:bg-gray-950">

        {/* Empty State */}
        {!hasMessages && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4">
            {/* Large Gemini-inspired icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              {/* Decorative ring */}
              <div className="absolute inset-0 rounded-3xl ring-4 ring-blue-500/20 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Ask me anything
              </h2>
              <p className="text-base text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                I can analyze your health logs, medications, and vitals to give you personalized insights.
              </p>
            </div>

            {/* Suggested Questions — large chips */}
            <div className="w-full max-w-sm space-y-2.5">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q.text}
                  onClick={() => sendMessage(q.text)}
                  className="w-full flex items-center gap-3 h-12 px-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] text-left"
                >
                  <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
                    {q.icon}
                  </span>
                  <span className="text-sm font-medium">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex items-end gap-2",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {/* AI Avatar */}
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20 mb-5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            <div className={cn("flex flex-col gap-1", msg.role === "user" ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[85%] px-4 py-3 text-base leading-relaxed whitespace-pre-wrap break-words shadow-sm",
                  msg.role === "user"
                    ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-[20px_20px_4px_20px] shadow-blue-500/20"
                    : cn(
                        "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-[20px_20px_20px_4px]",
                        (!msg.text && msg.streaming) ? "min-w-[60px]" : ""
                      )
                )}
              >
                {/* Loading dots when streaming with no text yet */}
                {msg.role === "assistant" && msg.streaming && !msg.text && (
                  <TypingDots />
                )}

                {/* Message text */}
                {msg.text}

                {/* Streaming cursor */}
                {msg.role === "assistant" && msg.streaming && msg.text && (
                  <span className="inline-block w-[3px] h-[1.1em] bg-blue-500 align-middle ml-0.5 rounded-sm animate-[blink_1s_step-end_infinite]" />
                )}
              </div>

              {/* Timestamp */}
              <span className="text-xs text-gray-400 dark:text-gray-600 px-1">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Compact suggested chips when conversation is active */}
      {hasMessages && !loading && (
        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 scrollbar-none">
          {STARTER_QUESTIONS.map((q) => (
            <button
              key={q.text}
              onClick={() => sendMessage(q.text)}
              className="whitespace-nowrap flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 flex-shrink-0 active:scale-95"
            >
              <span className="text-gray-400 dark:text-gray-500">{q.icon}</span>
              {q.text}
            </button>
          ))}
        </div>
      )}

      {/* Sticky Input Area */}
      <div className="px-4 pt-3 pb-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-end gap-2.5">

          {/* Voice button */}
          <button
            type="button"
            disabled={loading}
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Voice input"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={(el) => {
                (inputRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
                (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
              }}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResizeTextarea();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your health data..."
              rows={1}
              disabled={loading}
              className={cn(
                "w-full resize-none rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all duration-200 min-h-12 max-h-32 leading-relaxed",
                loading && "opacity-50 cursor-not-allowed"
              )}
              style={{ height: "auto" }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-95",
              input.trim() && !loading
                ? "bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/50 hover:-translate-y-0.5"
                : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-600 mt-2 text-center">
          Enter to send · Shift+Enter for new line · Not medical advice
        </p>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .scrollbar-none {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
