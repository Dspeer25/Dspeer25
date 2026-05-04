"use client";

import { useState, useRef, useEffect } from "react";
import { TradeSummary } from "../../lib/tradesContext";

export default function StatQueryButton({ trades }: { trades: TradeSummary[] }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setQuestion("");
      setResult(null);
      setError(null);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  const calculate = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/stat-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, trades }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data.answer);
    } catch (err) {
      console.error("[StatQueryButton]", err);
      setError("Request failed. Check your ANTHROPIC_API_KEY.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Query your trade stats"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#00d4a0",
          color: "#fff",
          fontSize: "22px",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,212,160,0.4)",
          zIndex: 9998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 6px 20px rgba(0,212,160,0.55)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 4px 16px rgba(0,212,160,0.4)";
        }}
      >
        ?
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#1e2035",
              border: "1px solid #3d3f5e",
              borderRadius: "16px",
              width: "480px",
              maxWidth: "calc(100vw - 32px)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                color: "#64748b",
                fontSize: "18px",
                cursor: "pointer",
                lineHeight: 1,
                padding: "2px 6px",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#e2e8f0")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#64748b")
              }
            >
              x
            </button>

            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#f1f5f9",
                  letterSpacing: "0.01em",
                }}
              >
                Ask about your trades
              </h3>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                {trades.length} trade{trades.length !== 1 ? "s" : ""} in range
              </p>
            </div>

            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  calculate();
                }
              }}
              placeholder='e.g. "avg R when initialRisk > $200" or "win rate of last 10 trades"'
              rows={3}
              style={{
                background: "#131425",
                border: "1px solid #3d3f5e",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "13px",
                color: "#e2e8f0",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) =>
                ((e.currentTarget as HTMLTextAreaElement).style.borderColor =
                  "#6366f1")
              }
              onBlur={(e) =>
                ((e.currentTarget as HTMLTextAreaElement).style.borderColor =
                  "#3d3f5e")
              }
            />

            <button
              onClick={calculate}
              disabled={loading || !question.trim()}
              style={{
                background:
                  loading || !question.trim() ? "#2d2f45" : "#6366f1",
                color: loading || !question.trim() ? "#475569" : "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 20px",
                fontSize: "13px",
                fontWeight: 600,
                cursor:
                  loading || !question.trim() ? "not-allowed" : "pointer",
                transition: "background 0.15s",
                alignSelf: "flex-start",
              }}
            >
              {loading ? "Calculating..." : "Calculate"}
            </button>

            {/* Result area */}
            {(result || error) && (
              <div
                style={{
                  background: error ? "rgba(239,68,68,0.08)" : "#131425",
                  border: `1px solid ${error ? "rgba(239,68,68,0.3)" : "#3d3f5e"}`,
                  borderRadius: "10px",
                  padding: "14px",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  color: error ? "#f87171" : "#e2e8f0",
                  whiteSpace: "pre-wrap",
                }}
              >
                {error ?? result}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
