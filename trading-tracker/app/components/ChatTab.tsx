"use client";

import { useState, useRef, useEffect } from "react";

type Trade = {
  date: string;
  ticker: string;
  time: string;
  tradeType: string;
  event: string;
  location: string;
  state: string;
  initialRisk: string;
  result: "W" | "L" | "BE" | "";
  amount: string;
  rrRatio: string;
  notes: string;
};

type Message = { role: "user" | "assistant"; content: string };

function tradesToContext(trades: Trade[]): string {
  if (trades.length === 0) return "";
  return trades
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => {
      const sign = e.result === "W" ? "+" : e.result === "L" ? "-" : "";
      const pnl = e.amount ? `${sign}$${e.amount}` : "—";
      const rr = e.rrRatio && e.rrRatio !== "0" ? ` | ${e.rrRatio}R` : "";
      const note = e.notes ? ` | "${e.notes.slice(0, 120)}"` : "";
      return `${e.date} ${e.time} | ${e.ticker} | ${e.tradeType} | ${e.event} | ${e.location}/${e.state} | Risk $${e.initialRisk} | ${e.result || "?"} | ${pnl}${rr}${note}`;
    })
    .join("\n");
}

export default function ChatTab({ entries }: { entries: Trade[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          tradesContext: tradesToContext(entries),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);
    } catch (err) {
      console.error("[ChatTab]", err);
      setError("Request failed. Check your ANTHROPIC_API_KEY and try again.");
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const retry = () => {
    setError(null);
    setMessages((prev) => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: "420px" }}>
      <div className="mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-white">Ask Coach</h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Ask anything about your trading. I have access to your full trade
          history ({entries.length} trade{entries.length !== 1 ? "s" : ""}).
        </p>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.length === 0 && !loading && (
          <p className="text-slate-600 text-sm text-center mt-20">
            No messages yet. Ask something below.
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-[#2d2f45] border border-[#3d3f5e] text-slate-200"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#2d2f45] border border-[#3d3f5e] rounded-xl px-4 py-3 text-sm text-slate-500 italic">
              Thinking...
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center gap-3">
              <span>{error}</span>
              <button
                onClick={retry}
                className="text-xs text-red-300 underline hover:text-red-100 flex-shrink-0"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex gap-2 items-end flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask about your trades... (Enter to send, Shift+Enter for newline)"
          rows={2}
          className="flex-1 bg-[#2d2f45] border border-[#3d3f5e] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors flex-shrink-0"
        >
          Send
        </button>
      </div>
    </div>
  );
}
