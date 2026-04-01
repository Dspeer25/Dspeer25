'use client';
import { useState, useEffect, useRef } from "react";
import { Lock, Eye, ShieldCheck } from "lucide-react";

const fm = "'DM Mono', monospace";
const fd = "'Chakra Petch', sans-serif";
const teal = "#00d4a0";

const Logo = ({ size = 16, showText = false }: { size?: number; showText?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.5 }}>
    <svg width={size} height={size * 1.2} viewBox="0 0 20 24" fill="none">
      <circle cx="8" cy="4" r="2.8" stroke="#7a7d88" strokeWidth="1.2" fill="none" />
      <line x1="8" y1="6.8" x2="8" y2="15" stroke="#7a7d88" strokeWidth="1.2" />
      <line x1="8" y1="9.5" x2="3" y2="13" stroke="#7a7d88" strokeWidth="1.2" />
      <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#7a7d88" strokeWidth="1.2" />
      <line x1="8" y1="15" x2="4.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
      <line x1="8" y1="15" x2="11.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
      <line x1="15.5" y1="2" x2="15.5" y2="12" stroke={teal} strokeWidth="0.8" />
      <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={teal} opacity="0.9" />
    </svg>
    {showText && (
      <span style={{ fontSize: size * 0.8, letterSpacing: "0.12em", fontWeight: 700, fontFamily: fd }}>
        <span style={{ color: "#d0d0d8" }}>WICK</span>
        <span style={{ color: teal }}>COACH</span>
      </span>
    )}
  </div>
);

const observations = [
  { tag: "PATTERN", color: "#ff6b6b", text: "Stop widened on 3 of 5 losing trades this week" },
  { tag: "INSIGHT", color: teal, text: "Breakout entries: 72% win rate vs 28% on reversals" },
  { tag: "JOURNAL", color: "#4a9eff", text: "\"Not confident\" written before 4 of last 5 losses" },
  { tag: "MILESTONE", color: "#c9a84c", text: "3 consecutive weeks within daily loss limit" },
  { tag: "PATTERN", color: "#ff6b6b", text: "Sizing up after wins leads to largest drawdowns" },
  { tag: "INSIGHT", color: teal, text: "Avg hold time on winners: 4 min. Losers: 11 min." },
  { tag: "JOURNAL", color: "#4a9eff", text: "\"Felt rushed\" appears on 80% of red days" },
  { tag: "PATTERN", color: "#ff6b6b", text: "Revenge trades within 5 min of loss: 0% win rate" },
  { tag: "MILESTONE", color: "#c9a84c", text: "Best R:R week since tracking began: 1.9 avg" },
  { tag: "INSIGHT", color: teal, text: "Tuesday PM sessions: -$340 avg. AM only: +$180 avg" },
  { tag: "JOURNAL", color: "#4a9eff", text: "\"Stuck to plan\" correlates with +1.6R average" },
  { tag: "PATTERN", color: "#ff6b6b", text: "4+ trades before 10AM = negative day 90% of time" },
];

function AITicker() {
  const doubled = [...observations, ...observations];
  return (
    <div style={{ width: 300, height: 370, background: "rgba(14,15,20,0.85)", border: "1px solid #1e1e28", borderRadius: 14, overflow: "hidden", position: "relative", backdropFilter: "blur(12px)", boxShadow: "0 8px 60px rgba(0,0,0,0.4)" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e28", display: "flex", alignItems: "center", gap: 8, background: "rgba(14,15,20,0.95)", position: "relative", zIndex: 2 }}>
        <Logo size={14} />
        <span style={{ fontSize: 13, color: teal, letterSpacing: "0.1em", fontWeight: 600, fontFamily: fm }}>THIS WEEK&apos;S OBSERVATIONS</span>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: teal, boxShadow: `0 0 8px rgba(0,212,160,0.6)`, marginLeft: 4, animation: "pulse 2s ease infinite" }} />
      </div>
      <div style={{ animation: "tickerScroll 40s linear infinite", paddingTop: 8 }}>
        {doubled.map((o, i) => (
          <div key={i} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(26,27,34,0.6)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 3, height: 20, borderRadius: 2, background: o.color, flexShrink: 0, marginTop: 2, boxShadow: `0 0 6px ${o.color}40` }} />
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: o.color, fontFamily: fm }}>{o.tag}</span>
              <div style={{ fontSize: 14, color: "#c0c4d0", lineHeight: 1.5, marginTop: 2, fontFamily: fm }}>{o.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 42, left: 0, right: 0, height: 30, background: "linear-gradient(to bottom, rgba(14,15,20,0.9), transparent)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: "linear-gradient(to top, rgba(14,15,20,0.95), transparent)", pointerEvents: "none", zIndex: 1 }} />
    </div>
  );
}

function FAQ({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ borderBottom: "1px solid #1a1a24", padding: "22px 0", cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 16, color: "#d0d0d8", fontFamily: fm, fontWeight: 500 }}>{q}</span>
        <span style={{ fontSize: 20, color: teal, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "none", lineHeight: 1 }}>+</span>
      </div>
      <div style={{ maxHeight: open ? 300 : 0, overflow: "hidden", transition: "max-height 0.4s ease" }}>
        <div style={{ fontSize: 15, color: "#9a9da8", lineHeight: 1.75, paddingTop: 14, fontFamily: fm }}>{a}</div>
      </div>
    </div>
  );
}

const tickerColors: Record<string, string> = { QQQ: "#7b3fe4", TSLA: "#cc0000", SPY: "#1a4a8a", NVDA: "#76b900", AAPL: "#555", META: "#0668E1", AMZN: "#ff9900" };

const TBadge = ({ ticker }: { ticker: string }) => {
  const [srcIdx, setSrcIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const sources = [
    `https://financialmodelingprep.com/image-stock/${ticker}.png`,
    `https://assets.parqet.com/logos/symbol/${ticker}?format=png`,
    `https://storage.googleapis.com/iex/api/logos/${ticker}.png`,
  ];
  const allFailed = srcIdx >= sources.length;
  return (
    <div style={{ width: 28, height: 28, borderRadius: 5, background: tickerColors[ticker] || "#2a2a34", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", fontFamily: fm, flexShrink: 0, overflow: "hidden" }}>
      {!allFailed && (
        <img
          key={srcIdx}
          src={sources[srcIdx]}
          alt={ticker}
          width={20}
          height={20}
          style={{ objectFit: "contain", display: loaded ? "block" : "none" }}
          onLoad={() => setLoaded(true)}
          onError={() => { setLoaded(false); setSrcIdx(i => i + 1); }}
        />
      )}
      {(allFailed || !loaded) && <span style={{ fontSize: 9 }}>{ticker.slice(0, 4)}</span>}
    </div>
  );
};

function LiveDemo() {
  const tradeSets = [
    { date: "Dec 15", ticker: "TSLA", strat: "Color change off 20ma", result: "L", pnl: "-$405", note: "Felt like this could be closer to the MAs on the larger frames and was stopped out before the move happened", ai: "Way to log it, Dylan. I noticed that on most of your losing trades this month, you describe the same thing \u2014 that your larger timeframes were wider than usual. When you write this way, your stats tell a clear story:", stats: [{ l: "WIN RATE", v: "28%", c: "#ff5555" }, { l: "AVG R:R", v: "0.6R", c: "#ff5555" }, { l: "EXP. VALUE", v: "-$112", c: "#ff5555" }], cited: [{ date: "Dec 12", ticker: "SPY", strat: "Breakout long", result: "L", pnl: "-$310", note: "Larger frames were stretched. Took it anyway." }, { date: "Dec 8", ticker: "QQQ", strat: "VWAP reclaim", result: "L", pnl: "-$187", note: "MAs wider than I like but location was there." }, { date: "Dec 3", ticker: "NVDA", strat: "Mean reversion", result: "L", pnl: "-$420", note: "Frames too wide. Should have waited for them to tighten." }] },
    { date: "Dec 18", ticker: "AAPL", strat: "Opening range breakout", result: "W", pnl: "+$225", note: "Waited for full confirmation on the 5. Patient entry, let the candle close before committing. Felt calm and focused.", ai: "This is what it looks like when you trade your plan, Dylan. You wrote 'patient' and 'calm' \u2014 those words appear on 85% of your winning days. When you wait for the 5-minute confirmation, the data backs you up:", stats: [{ l: "WIN RATE", v: "78%", c: teal }, { l: "AVG R:R", v: "1.8R", c: teal }, { l: "EXP. VALUE", v: "+$186", c: teal }], cited: [{ date: "Dec 16", ticker: "TSLA", strat: "5-min breakout", result: "W", pnl: "+$162", note: "Waited for confirmation. Clean entry." }, { date: "Dec 14", ticker: "META", strat: "VWAP reclaim", result: "W", pnl: "+$340", note: "Patient. Let the setup come to me." }, { date: "Dec 11", ticker: "NVDA", strat: "Opening range", result: "W", pnl: "+$195", note: "Stuck to plan. Calm and focused all session." }] },
    { date: "Dec 22", ticker: "SPY", strat: "Gap fill reversal", result: "L", pnl: "-$580", note: "Took 4 trades in 20 minutes. Was down early and kept trying to make it back. Broke my max loss rule and doubled down.", ai: "Dylan, this is the pattern that costs you the most. You wrote about taking 4 trades in 20 minutes \u2014 that's revenge trading. Every time you journal about 'making it back,' the outcome is the same:", stats: [{ l: "WIN RATE", v: "12%", c: "#ff5555" }, { l: "AVG LOSS", v: "-$490", c: "#ff5555" }, { l: "RULE BREAK", v: "100%", c: "#ff5555" }], cited: [{ date: "Dec 19", ticker: "QQQ", strat: "Scalp revenge", result: "L", pnl: "-$340", note: "Kept adding. Should have stopped at max loss." }, { date: "Dec 10", ticker: "TSLA", strat: "Revenge entry", result: "L", pnl: "-$620", note: "4 min after last loss. No setup. Just emotion." }, { date: "Dec 5", ticker: "SPY", strat: "Doubled down", result: "L", pnl: "-$510", note: "Broke risk rules trying to get it back." }] },
  ];

  const [run, setRun] = useState(0);
  const [p, setP] = useState(0);
  const [nc, setNc] = useState(0);
  const [ac, setAc] = useState(0);
  const [ti, setTi] = useState(0);
  const [showCited, setShowCited] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const trade = tradeSets[run % tradeSets.length];
  const thinks = ["Scanning journal language...", "Cross-referencing trade data...", "Comparing to weekly goals...", "Finding patterns..."];
  const isW = trade.result === "W";

  const startAnim = () => {
    timers.current.forEach(clearTimeout);
    setP(0); setNc(0); setAc(0); setTi(0); setShowCited(false);
    timers.current = [
      setTimeout(() => setP(1), 600),
      setTimeout(() => setP(2), 1400),
      setTimeout(() => setP(3), 2200),
      setTimeout(() => setP(4), 6000),
      setTimeout(() => setP(5), 6800),
      setTimeout(() => setP(6), 8000),
      setTimeout(() => setP(7), 10000),
      setTimeout(() => setP(8), 12500),
    ];
  };

  useEffect(() => { startAnim(); return () => timers.current.forEach(clearTimeout); }, [run]);

  useEffect(() => {
    if (p !== 3) return;
    let i = 0;
    const iv = setInterval(() => { i++; setNc(i); if (i >= trade.note.length) clearInterval(iv); }, 25);
    return () => clearInterval(iv);
  }, [p, run]);

  useEffect(() => {
    if (p !== 8) return;
    let i = 0;
    const iv = setInterval(() => { i += 2; setAc(i); if (i >= trade.ai.length) clearInterval(iv); }, 16);
    return () => clearInterval(iv);
  }, [p, run]);

  useEffect(() => {
    if (p !== 7) return;
    const iv = setInterval(() => setTi(v => (v + 1) % thinks.length), 550);
    return () => clearInterval(iv);
  }, [p]);

  return (
    <section style={{ padding: "100px 48px", maxWidth: 680, margin: "0 auto" }}>
      <div style={{ fontSize: 18, color: teal, letterSpacing: "0.18em", marginBottom: 14, fontWeight: 700, fontFamily: fm }}>HOW IT WORKS</div>
      <h2 style={{ fontSize: 34, fontWeight: 700, fontFamily: fd, lineHeight: 1.35, marginBottom: 14, color: "#e8e8f0" }}>It&apos;s not just a trade log. It&apos;s a mirror.</h2>
      <p style={{ fontSize: 16, color: "#9a9da8", lineHeight: 1.7, marginBottom: 36, fontFamily: fm }}>Watch a trade get logged, analyzed, and coached &mdash; live.</p>

      <div style={{ background: "#0a0b10", border: "2px solid #1e1e28", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 40px rgba(0,0,0,0.3)", paddingBottom: 2 }}>
        {/* Window chrome */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 16px", borderBottom: "1px solid #1a1b22", background: "#0e0f14", overflow: "visible" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5555", opacity: 0.6 }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c9a84c", opacity: 0.6 }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: teal, opacity: 0.6 }} />
          <span style={{ fontSize: 13, color: "#6a6d78", marginLeft: 8, lineHeight: 1.6, paddingBottom: 2 }}>WickCoach &mdash; Trade Log</span>
          <div onClick={() => { if (p >= 8 || p === 0) setRun(r => r + 1); }} style={{ marginLeft: "auto", padding: "6px 16px", borderRadius: 5, fontSize: 12, fontWeight: 600, fontFamily: fm, background: p >= 8 ? teal : (p >= 1 && p < 5) ? teal : "rgba(0,212,160,0.1)", color: (p >= 8 || (p >= 1 && p < 5)) ? "#0a0a0f" : teal, cursor: p >= 8 ? "pointer" : "default", boxShadow: (p === 1 || p >= 8) ? "0 0 14px rgba(0,212,160,0.5)" : "none" }}>{p >= 8 ? "See Another" : "+ Log a Trade"}</div>
        </div>

        {/* Trade form phase */}
        {p >= 1 && p < 5 && (
          <div style={{ padding: "16px", borderBottom: "2px solid #1a1b22", background: "#11121a", animation: "fadeUp 0.3s ease" }}>
            <div style={{ fontSize: 12, color: "#8a8d98", letterSpacing: "0.08em", marginBottom: 10, fontWeight: 600, fontFamily: fm }}>NEW TRADE</div>
            <div style={{ display: "grid", gridTemplateColumns: "80px 80px 1fr 55px 75px", gap: 8, marginBottom: 12 }}>
              {[
                { l: "DATE", v: p >= 2 ? trade.date : "" },
                { l: "TICKER", v: p >= 2 ? trade.ticker : "" },
                { l: "STRATEGY", v: p >= 2 ? trade.strat : "" },
                { l: "RESULT", v: p >= 2 ? trade.result : "", c: isW ? teal : "#ff5555" },
                { l: "P&L", v: p >= 2 ? trade.pnl : "", c: isW ? teal : "#ff5555" },
              ].map(f => (
                <div key={f.l} style={{ background: "#0e0f14", borderRadius: 6, padding: "8px 10px", border: `1px solid ${f.v ? "rgba(0,212,160,0.15)" : "#1a1b22"}` }}>
                  <div style={{ fontSize: 10, color: "#6a6d78", marginBottom: 3, fontFamily: fm }}>{f.l}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: f.c || (f.v ? "#e0e0e8" : "#2a2a34"), fontFamily: fm }}>{f.v || "\u2014"}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#0e0f14", borderRadius: 6, padding: "10px 12px", border: `1px solid ${nc > 0 ? "rgba(0,212,160,0.12)" : "#1a1b22"}` }}>
              <div style={{ fontSize: 10, color: "#6a6d78", marginBottom: 4, fontFamily: fm }}>JOURNAL NOTE</div>
              <div style={{ fontSize: 15, color: "#c0c4d0", lineHeight: 1.65, fontFamily: fm }}>{trade.note.slice(0, nc)}{p === 3 && nc < trade.note.length && <span style={{ color: teal, animation: "blink 0.6s infinite" }}>|</span>}</div>
            </div>
            {p >= 4 && (
              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", position: "relative" }}>
                <div style={{ padding: "8px 20px", borderRadius: 5, fontSize: 13, fontWeight: 700, background: teal, color: "#0a0a0f", fontFamily: fm, boxShadow: "0 0 14px rgba(0,212,160,0.5)" }}>Submit</div>
                <svg style={{ position: "absolute", right: 20, top: 2, width: 24, height: 28, zIndex: 5, animation: "cursorClick 2s ease", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} viewBox="0 0 24 28" fill="none">
                  <path d="M2 2L2 22L8 16L14 26L18 24L12 14L20 14L2 2Z" fill={teal} stroke="#0a0a0f" strokeWidth="1.5" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Submitted trade row */}
        {p >= 5 && (
          <div style={{ position: "relative" }}>
            {p === 6 && (
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 3 }}>
                {Array.from({ length: 15 }, (_, i) => (
                  <div key={i} style={{ position: "absolute", left: `${5 + Math.random() * 90}%`, top: `${Math.random() * 100}%`, width: 2 + Math.random() * 3, height: 2 + Math.random() * 3, borderRadius: "50%", background: teal, opacity: 0, animation: `particle 1.8s ease ${Math.random() * 1.5}s infinite` }} />
                ))}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", padding: "14px 16px", gap: 8, position: "relative", overflow: "hidden", background: p === 6 ? "rgba(0,212,160,0.04)" : "transparent", borderBottom: "1px solid #1a1b22", animation: p === 5 ? "fadeUp 0.4s ease" : "none" }}>
              {p === 6 && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(0,212,160,0.12), rgba(0,212,160,0.22), rgba(0,212,160,0.12), transparent)", animation: "scanAcross 1.5s ease infinite", pointerEvents: "none", zIndex: 2 }} />}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, color: "#9a9da8", fontFamily: fm }}>{trade.date}</span>
                <TBadge ticker={trade.ticker} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e8", fontFamily: fm }}>{trade.ticker}</span>
                <span style={{ fontSize: 15, color: "#d0d0d8", fontWeight: 600, fontFamily: fm }}>{trade.strat}</span>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 3, background: isW ? "rgba(0,212,160,0.12)" : "rgba(255,85,85,0.12)", color: isW ? teal : "#ff5555", fontFamily: fm }}>{trade.result}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: isW ? teal : "#ff5555", fontFamily: fm }}>{trade.pnl}</span>
                </div>
              </div>
              <div style={{ fontSize: 14, color: "#6a7078", fontStyle: "italic", fontWeight: 300, lineHeight: 1.6, fontFamily: fm }}>&ldquo;{trade.note}&rdquo;</div>
            </div>
          </div>
        )}

        {/* Thinking phase */}
        {p === 7 && (
          <div style={{ textAlign: "center", padding: "24px", animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 12 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: teal, animation: `pulse 1s ease ${i * 0.2}s infinite` }} />)}
            </div>
            <div style={{ fontSize: 15, color: teal, fontFamily: fm, fontWeight: 500 }}>{thinks[ti]}</div>
          </div>
        )}

        {/* AI observation */}
        {p >= 8 && (
          <div style={{ padding: "18px", animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Logo size={20} />
              <span style={{ fontSize: 15, color: teal, letterSpacing: "0.1em", fontWeight: 700, fontFamily: fm }}>AI OBSERVATION</span>
            </div>
            <div style={{ background: "#111a18", border: "1px solid rgba(0,212,160,0.15)", borderRadius: 10, padding: "16px 18px", marginBottom: 14 }}>
              <div style={{ fontSize: 15, color: "#b8d0c4", lineHeight: 1.8, fontFamily: fm }}>{trade.ai.slice(0, ac)}{ac < trade.ai.length && <span style={{ color: teal, animation: "blink 0.6s infinite" }}>|</span>}</div>
            </div>
            {ac >= trade.ai.length && (<>
              <div style={{ display: "flex", gap: 12, marginBottom: 14, animation: "fadeUp 0.4s ease" }}>
                {trade.stats.map(s => (
                  <div key={s.l} style={{ flex: 1, background: "#13141a", border: "1px solid #1e1e28", borderRadius: 8, padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#8a8d98", marginBottom: 4, fontWeight: 600, fontFamily: fm }}>{s.l}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.c, fontFamily: fm }}>{s.v}</div>
                  </div>
                ))}
              </div>
              {!showCited && <div onClick={() => setShowCited(true)} style={{ textAlign: "center", padding: "14px", borderRadius: 8, border: "1px solid rgba(0,212,160,0.3)", background: "rgba(0,212,160,0.06)", cursor: "pointer", fontSize: 15, color: teal, fontWeight: 600, fontFamily: fm, animation: "citedPulse 2s ease infinite" }}>Click to see what trades the AI cited</div>}
              {showCited && (
                <div style={{ animation: "fadeUp 0.4s ease" }}>
                  <div style={{ fontSize: 12, color: "#6a6d78", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 10, marginTop: 4, fontFamily: fm }}>CITED TRADES</div>
                  {trade.cited.map((ct, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 14px", marginBottom: 6, background: "#13141a", border: `1px solid ${ct.result === "W" ? "rgba(0,212,160,0.1)" : "rgba(255,85,85,0.1)"}`, borderRadius: 8, animation: `fadeUp 0.3s ease ${i * 0.1}s both` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 14, color: "#9a9da8", fontFamily: fm }}>{ct.date}</span>
                        <TBadge ticker={ct.ticker} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#e0e0e8", fontFamily: fm }}>{ct.ticker}</span>
                        <span style={{ fontSize: 14, color: "#9a9da8", fontFamily: fm }}>{ct.strat}</span>
                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: ct.result === "W" ? "rgba(0,212,160,0.12)" : "rgba(255,85,85,0.12)", color: ct.result === "W" ? teal : "#ff5555", fontFamily: fm }}>{ct.result}</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: ct.result === "W" ? teal : "#ff5555", fontFamily: fm }}>{ct.pnl}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 14, color: "#8a9098", fontStyle: "italic", lineHeight: 1.5, fontFamily: fm }}>&ldquo;{ct.note}&rdquo;</div>
                    </div>
                  ))}
                </div>
              )}
            </>)}
          </div>
        )}
      </div>
    </section>
  );
}

function RadarSection() {
  type Trade = { ticker: string; strat: string; pill: "green" | "red" | "yellow"; pnl: string; date: string };
  type AxisData = { trades: Trade[]; coach: string };
  const tickerDomains: Record<string, string> = { QQQ: "invesco.com", SPY: "ssga.com", AAPL: "apple.com", NVDA: "nvidia.com", TSLA: "tesla.com", AMZN: "amazon.com", META: "meta.com", MSFT: "microsoft.com", GOOG: "google.com", AMD: "amd.com" };
  const pillStyles = {
    green: { background: "rgba(0,212,160,0.1)", color: teal },
    red: { background: "rgba(239,68,68,0.1)", color: "#ef4444" },
    yellow: { background: "rgba(234,179,8,0.1)", color: "#eab308" },
  };
  const profiles: { name: string; scores: number[]; data: AxisData[] }[] = [
    { name: "Week 1", scores: [58, 72, 84, 45, 40], data: [
      { trades: [{ ticker: "TSLA", strat: "0DTE Call", pill: "green", pnl: "+$310", date: "Feb 19" }, { ticker: "NVDA", strat: "Call Scalp", pill: "green", pnl: "-$270", date: "Feb 21" }, { ticker: "TSLA", strat: "0DTE Put", pill: "red", pnl: "-$445", date: "Feb 21" }], coach: "You wrote that the TSLA win on Wednesday \u2018felt easy.\u2019 Then Friday you took two unplanned trades back to back. In your journal you said you \u2018just had a feeling\u2019 on that NVDA scalp \u2014 that\u2019s the word you use every time you break a rule. When a trade feels easy, that\u2019s when your discipline is most at risk." },
      { trades: [{ ticker: "AAPL", strat: "Put Debit Spread", pill: "red", pnl: "+$185", date: "Feb 18" }, { ticker: "SPY", strat: "0DTE Call", pill: "green", pnl: "-$320", date: "Feb 20" }], coach: "Your AAPL entry was methodical \u2014 you even wrote out your thesis before entering. But your SPY entry Thursday has no notes at all. Reading these entries back to back, the pattern is clear: when you journal the plan first, you trade better. When you skip it, you\u2019re trading from emotion." },
      { trades: [{ ticker: "QQQ", strat: "0DTE Put", pill: "red", pnl: "+$490", date: "Feb 18" }, { ticker: "META", strat: "Put Scalp", pill: "red", pnl: "+$175", date: "Feb 20" }, { ticker: "AMD", strat: "Call Debit Spread", pill: "green", pnl: "+$220", date: "Feb 21" }], coach: "Three entries, all within a candle of your marked level. You wrote \u2018I waited for it to come to me\u2019 on the QQQ trade \u2014 and that exact patience showed up again on META and AMD. This is your A-game. The question is whether you notice what\u2019s different about these days." },
      { trades: [{ ticker: "TSLA", strat: "0DTE Call", pill: "green", pnl: "-$680", date: "Feb 20" }, { ticker: "AMZN", strat: "Naked Put", pill: "red", pnl: "-$410", date: "Feb 21" }], coach: "You wrote that the TSLA position \u2018got away from you.\u2019 It didn\u2019t. You sized it at 3x your normal and didn\u2019t set a stop. The AMZN naked put the next day was the same pattern. In both entries you describe feeling like you needed to \u2018make it back.\u2019 That urge is the thing to manage, not the position." },
      { trades: [{ ticker: "SPY", strat: "Call Scalp", pill: "green", pnl: "-$145", date: "Feb 18" }, { ticker: "QQQ", strat: "0DTE Call", pill: "green", pnl: "-$190", date: "Feb 19" }, { ticker: "NVDA", strat: "0DTE Put", pill: "red", pnl: "-$165", date: "Feb 21" }], coach: "All three entries happened in the first 8 minutes of the session. You wrote \u2018I couldn\u2019t just sit there\u2019 on Tuesday. That sentence is in four of your entries this week. Sitting there IS the trade. Your levels were right every time \u2014 your timing said you didn\u2019t trust them." },
    ]},
    { name: "Week 2", scores: [81, 48, 65, 88, 70], data: [
      { trades: [{ ticker: "SPY", strat: "0DTE Put", pill: "red", pnl: "+$380", date: "Mar 4" }, { ticker: "GOOG", strat: "Call Debit Spread", pill: "green", pnl: "+$195", date: "Mar 6" }], coach: "Two trades, both pre-planned the night before. You wrote \u2018I stuck to the list today\u2019 on both entries. That\u2019s a different person than Week 1. The interesting thing is you don\u2019t sound excited about it \u2014 and that\u2019s exactly right. Discipline is supposed to feel boring." },
      { trades: [{ ticker: "NVDA", strat: "0DTE Call", pill: "green", pnl: "-$390", date: "Mar 3" }, { ticker: "NVDA", strat: "0DTE Put", pill: "red", pnl: "-$245", date: "Mar 3" }, { ticker: "AAPL", strat: "Put Scalp", pill: "red", pnl: "+$160", date: "Mar 7" }], coach: "Two NVDA trades in one session \u2014 a call then a put. Your journal entry says \u2018I know it\u2019s going to reverse.\u2019 You said that twice, in opposite directions, in the same hour. That\u2019s not conviction. That\u2019s an argument with the market you needed to win." },
      { trades: [{ ticker: "META", strat: "0DTE Put", pill: "red", pnl: "+$340", date: "Mar 4" }, { ticker: "TSLA", strat: "Call Scalp", pill: "green", pnl: "-$210", date: "Mar 5" }, { ticker: "SPY", strat: "0DTE Call", pill: "green", pnl: "-$175", date: "Mar 7" }], coach: "META was clean \u2014 you noted your exact entry price the night before and hit it. TSLA you wrote \u2018I saw it moving and jumped in.\u2019 That one sentence is the difference between your winning and losing trades this week." },
      { trades: [{ ticker: "QQQ", strat: "0DTE Call", pill: "green", pnl: "+$275", date: "Mar 5" }, { ticker: "AMZN", strat: "Put Debit Spread", pill: "red", pnl: "-$115", date: "Mar 7" }], coach: "AMZN loss was your smallest of the month. You wrote \u2018stop hit, moving on\u2019 \u2014 four words, no drama. Compare that to the paragraphs you write when you hold through a stop. The length of your journal entry after a loss tells you everything about whether you managed the risk." },
      { trades: [{ ticker: "QQQ", strat: "0DTE Put", pill: "red", pnl: "+$520", date: "Mar 4" }, { ticker: "AMD", strat: "0DTE Call", pill: "green", pnl: "-$105", date: "Mar 6" }, { ticker: "MSFT", strat: "Call Debit Spread", pill: "green", pnl: "+$190", date: "Mar 7" }], coach: "Your QQQ entry says \u2018waited 40 min past open.\u2019 Your AMD entry says \u2018got in early, knew it immediately.\u2019 You\u2019re writing the coaching yourself at this point. The gap between knowing and doing is the only gap left." },
    ]},
    { name: "Week 3", scores: [93, 85, 90, 91, 78], data: [
      { trades: [{ ticker: "SPY", strat: "0DTE Put", pill: "red", pnl: "+$510", date: "Mar 12" }, { ticker: "NVDA", strat: "Call Debit Spread", pill: "green", pnl: "+$340", date: "Mar 14" }], coach: "You wrote \u2018TSLA was screaming but it wasn\u2019t on my list.\u2019 That sentence alone is worth more than both these wins. Two trades, both planned, both managed. Your journal this week reads like a different trader than four weeks ago." },
      { trades: [{ ticker: "AAPL", strat: "0DTE Call", pill: "green", pnl: "-$130", date: "Mar 11" }, { ticker: "QQQ", strat: "0DTE Put", pill: "red", pnl: "+$445", date: "Mar 13" }], coach: "Monday\u2019s loss didn\u2019t show up in Tuesday\u2019s journal at all. Not suppressed \u2014 just processed and released. You wrote \u2018bad trade, good process\u2019 and moved on. Three weeks ago a loss like that would have produced a full page of frustration. That\u2019s the shift." },
      { trades: [{ ticker: "TSLA", strat: "Put Scalp", pill: "red", pnl: "+$380", date: "Mar 11" }, { ticker: "SPY", strat: "0DTE Call", pill: "green", pnl: "+$290", date: "Mar 13" }, { ticker: "META", strat: "Iron Condor", pill: "yellow", pnl: "+$165", date: "Mar 14" }], coach: "Three entries at your pre-marked levels. Your META iron condor notes say \u2018set it up last night, executed the plan, walked away.\u2019 That\u2019s nine words describing a trade that would have taken you 200 words and three adjustments a month ago. You\u2019re getting quieter. That\u2019s good." },
      { trades: [{ ticker: "AMZN", strat: "0DTE Call", pill: "green", pnl: "-$95", date: "Mar 12" }, { ticker: "GOOG", strat: "Put Debit Spread", pill: "red", pnl: "+$355", date: "Mar 14" }], coach: "You wrote \u2018smallest size of the month, didn\u2019t need to be a hero.\u2019 That\u2019s a belief shift, not just a behavior change. AMZN was a loss and you described it as \u2018clean.\u2019 When losses feel clean, your risk management has become identity, not just rules." },
      { trades: [{ ticker: "QQQ", strat: "0DTE Put", pill: "red", pnl: "+$580", date: "Mar 12" }, { ticker: "TSLA", strat: "0DTE Call", pill: "green", pnl: "-$75", date: "Mar 14" }], coach: "Tuesday: waited 35 minutes, caught the move of the week. Friday: jumped in 5 minutes early, gave back a small piece. You wrote \u2018I knew I was early.\u2019 Progress isn\u2019t perfection. But notice \u2014 you\u2019re catching yourself in the act now. That awareness didn\u2019t exist in Week 1." },
    ]},
  ];
  const attrs = ["DISCIPLINE", "PSYCHOLOGY", "EXECUTION", "RISK MGMT", "PATIENCE"];
  const attrC = [teal, "#c9a84c", "#4a9eff", teal, "#c9a84c"];
  const [pi, setPi] = useState(0);
  const [aa, setAa] = useState<number | null>(null);
  const pr = profiles[pi];
  const cx = 200, cy = 185, mR = 140;
  const ang = attrs.map((_, i) => (i * 2 * Math.PI) / 5 - Math.PI / 2);
  const gp = (i: number, pct: number) => ({ x: cx + mR * (pct / 100) * Math.cos(ang[i]), y: cy + mR * (pct / 100) * Math.sin(ang[i]) });
  const mkPath = (pcts: number[]) => pcts.map((p, i) => gp(i, p)).map(p => `${p.x},${p.y}`).join(" ");

  return (
    <section style={{ padding: "100px 48px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 13, color: teal, letterSpacing: "0.18em", marginBottom: 14, fontWeight: 600, fontFamily: fm }}>YOUR TRADING NARRATIVE</div>
      <h2 style={{ fontSize: 34, fontWeight: 700, fontFamily: fd, lineHeight: 1.35, marginBottom: 16, color: "#e8e8f0" }}>Every trade is part of a bigger story.<br />The AI helps you read it.</h2>
      <p style={{ fontSize: 16, color: "#9a9da8", lineHeight: 1.7, marginBottom: 30, fontFamily: fm }}>Click any score to see the trades behind it.</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 30 }}>
        {profiles.map((p, i) => (
          <div key={i} onClick={() => { setPi(i); setAa(null); }} style={{ padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontFamily: fm, fontSize: 13, fontWeight: 600, background: pi === i ? "rgba(0,212,160,0.12)" : "rgba(0,212,160,0.03)", border: `1px solid ${pi === i ? "rgba(0,212,160,0.3)" : "#1a1b22"}`, color: pi === i ? teal : "#6a6d78" }}>{p.name}</div>
        ))}
      </div>
      <div style={{ position: "relative", width: 400, height: 400, margin: "0 auto" }}>
        <svg width="400" height="400" viewBox="0 0 400 400">
          <polygon points={mkPath([100, 100, 100, 100, 100])} fill="none" stroke="#1a1b22" strokeWidth="1" />
          <polygon points={mkPath([66, 66, 66, 66, 66])} fill="none" stroke="#151620" strokeWidth="0.5" />
          <polygon points={mkPath([33, 33, 33, 33, 33])} fill="none" stroke="#121318" strokeWidth="0.5" />
          {ang.map((_, i) => { const p = gp(i, 100); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#1a1b22" strokeWidth="0.5" />; })}
          <polygon points={mkPath(pr.scores)} fill="rgba(0,212,160,0.1)" stroke={teal} strokeWidth="2" style={{ filter: "drop-shadow(0 0 15px rgba(0,212,160,0.15))", transition: "all 0.8s ease" }} />
          {pr.scores.map((s, i) => { const p = gp(i, s); return (
            <circle key={i} cx={p.x} cy={p.y} r={aa === i ? 8 : 6} fill={attrC[i]} stroke="#0e0f14" strokeWidth="2.5" style={{ cursor: "pointer", filter: aa === i ? `drop-shadow(0 0 12px ${attrC[i]}80)` : "none", transition: "all 0.3s" }} onClick={() => setAa(aa === i ? null : i)} />
          ); })}
        </svg>
        {attrs.map((a, i) => {
          const lp = gp(i, 125);
          return (
            <div key={i} onClick={() => setAa(aa === i ? null : i)} style={{ position: "absolute", left: lp.x, top: lp.y, transform: "translate(-50%,-50%)", textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: aa === i ? attrC[i] : "#e0e0e8", fontFamily: fm, transition: "color 0.3s" }}>{pr.scores[i]}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: aa === i ? attrC[i] : "#8a8d98", fontFamily: fm, letterSpacing: "0.05em", transition: "color 0.3s" }}>{a}</div>
            </div>
          );
        })}
      </div>
      {aa === null && (
        <div style={{ fontSize: 13, color: "#4b5563", fontFamily: fm, marginTop: 20 }}>Click any score to see the trades behind it</div>
      )}
      {aa !== null && (
        <div key={`${pi}-${aa}`} style={{ maxWidth: 600, margin: "20px auto 0", textAlign: "left", background: "#13141a", border: "1px solid #1a1b22", borderRadius: 12, padding: "24px", animation: "fadeUp 0.3s ease" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: teal, fontFamily: fm, marginBottom: 16 }}>{attrs[aa]} &mdash; {pr.scores[aa]}</div>
          {pr.data[aa].trades.map((t, i) => {
            const isPos = t.pnl.startsWith("+");
            const ps = pillStyles[t.pill];
            const isLast = i === pr.data[aa].trades.length - 1;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: isLast ? "none" : "1px solid #1a1b22" }}>
                <img src={`https://logo.clearbit.com/${tickerDomains[t.ticker]}?size=48`} alt={t.ticker} style={{ width: 22, height: 22, borderRadius: "50%", marginRight: 8, verticalAlign: "middle", background: "#1a1b22", objectFit: "cover" as const, flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: fm }}>{t.ticker}</span>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: fm, padding: "3px 8px", borderRadius: 6, letterSpacing: "0.5px", whiteSpace: "nowrap" as const, background: ps.background, color: ps.color }}>{t.strat}</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: fm, color: isPos ? teal : "#ef4444" }}>{t.pnl}</span>
                <span style={{ fontSize: 13, color: "#6b7280", fontFamily: fm, marginLeft: "auto" }}>{t.date}</span>
              </div>
            );
          })}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Logo size={20} />
              <span style={{ fontSize: 12, fontWeight: 700, color: teal, fontFamily: fm, letterSpacing: "1px" }}>WickCoach AI</span>
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", fontFamily: fm, fontStyle: "italic", lineHeight: 1.65 }}>{pr.data[aa].coach}</div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function WickCoachFull() {
  const [tabGlow, setTabGlow] = useState(false);
  const [heroVis, setHeroVis] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setHeroVis(true), 300);
    return () => clearTimeout(t);
  }, []);

  const tabs = ["Log a Trade", "Past Trades", "Analysis", "Trading Goals", "Trader Profile"];

  const privacyCards = [
    { icon: <Eye size={22} color={teal} />, title: "Your trades stay yours", text: "All data stored locally in your browser. Nothing leaves your machine." },
    { icon: <Lock size={22} color={teal} />, title: "Upload any format", text: "CSVs, broker exports, screenshots \u2014 the AI reads it all and learns your history." },
    { icon: <ShieldCheck size={22} color={teal} />, title: "No tracking, no ads", text: "No analytics, no third-party sharing. Nothing." },
  ];

  const essentialFeatures = ["Trade logging", "Journal entries", "Past trades dashboard", "Equity curve", "Manual analytics"];
  const completeFeatures = ["Everything in Essential", "AI psychology coach", "Journal entry analysis", "Behavioral pattern detection", "Weekly goal tracking", "Mark Douglas methodology", "All future updates"];

  const faqs = [
    { q: "What is WickCoach?", a: "An AI trading journal that coaches your psychology by reading your trade logs AND your written journal entries." },
    { q: "How is the AI different?", a: "It reads what you wrote \u2014 your mindset, frustrations, confidence \u2014 and cross-references with results. It coaches behavior, not numbers." },
    { q: "Where is my data stored?", a: "Everything stays in your browser\u2019s local storage. We have zero access to it." },
    { q: "What\u2019s the difference between Essential and Complete?", a: "Essential gives you the trade log, journal, and dashboard. Complete adds the AI psychology coach that reads your entries, spots patterns, and holds you accountable." },
  ];

  return (
    <div style={{ background: "#0e0f14", color: "#d0d0d8", minHeight: "100vh", fontFamily: fm }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Chakra+Petch:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.3; transform: scale(1.3) } }
        @keyframes tickerScroll { 0% { transform: translateY(0) } 100% { transform: translateY(-50%) } }
        @keyframes tabPulse { 0%, 100% { box-shadow: 0 0 6px rgba(0,212,160,0.1); border-color: rgba(0,212,160,0.12) } 50% { box-shadow: 0 0 24px rgba(0,212,160,0.45); border-color: rgba(0,212,160,0.4) } }
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
        @keyframes scanAcross { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
        @keyframes particle { 0% { opacity: 0; transform: scale(0) } 30% { opacity: 0.7; transform: scale(1) } 70% { opacity: 0.3 } 100% { opacity: 0; transform: translateY(-15px) } }
        @keyframes cursorClick { 0% { opacity: 0; transform: translate(40px,-30px) } 15% { opacity: 1; transform: translate(40px,-30px) } 40% { opacity: 1; transform: translate(0,0) } 55% { opacity: 1; transform: translate(0,0) } 62% { opacity: 1; transform: translate(0,4px) } 70% { opacity: 1; transform: translate(0,0) } 85% { opacity: 1; transform: translate(0,0) } 100% { opacity: 0; transform: translate(0,0) } }
        @keyframes citedPulse { 0%, 100% { box-shadow: 0 0 8px rgba(0,212,160,0.15); border-color: rgba(0,212,160,0.2) } 50% { box-shadow: 0 0 25px rgba(0,212,160,0.4); border-color: rgba(0,212,160,0.5) } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.35 } 50% { opacity: 0.7 } }
        @keyframes rayPulse0 { 0%, 100% { opacity: 0.03 } 50% { opacity: 0.08 } }
        @keyframes rayPulse1 { 0%, 100% { opacity: 0.04 } 50% { opacity: 0.09 } }
        @keyframes rayPulse2 { 0%, 100% { opacity: 0.025 } 50% { opacity: 0.07 } }
        @keyframes rayPulse3 { 0%, 100% { opacity: 0.035 } 50% { opacity: 0.085 } }
        * { box-sizing: border-box; margin: 0; padding: 0 }
        *::-webkit-scrollbar { display: none }
        * { -ms-overflow-style: none; scrollbar-width: none }
        .price-card { transition: box-shadow 0.3s ease, border-color 0.3s ease }
        .price-card:hover { box-shadow: 0 0 30px rgba(0,212,160,0.2); border-color: rgba(0,212,160,0.35) !important }
        ::selection { background: rgba(0,212,160,0.2); color: #fff }
      `}</style>

      {/* ═══ NAV ═══ */}
      <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 40px 0", borderBottom: "1px solid #1a1b22", overflow: "visible" }}>
        <div style={{ marginBottom: 20 }}>
          <Logo size={34} showText />
        </div>
        <div style={{ display: "flex", gap: 5, width: "100%", maxWidth: 920 }}>
          {tabs.map(t => (
            <span key={t} style={{ fontSize: 14, color: teal, letterSpacing: "0.04em", padding: "14px 16px 16px", cursor: "pointer", fontFamily: fm, borderRadius: "8px 8px 0 0", fontWeight: 600, background: "rgba(0,212,160,0.05)", border: "1px solid rgba(0,212,160,0.12)", borderBottom: "none", flex: 1, textAlign: "center", lineHeight: 1.5, animation: tabGlow ? "tabPulse 1.4s ease infinite" : "none" }}>{t}</span>
          ))}
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{ position: "relative", minHeight: 520, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "60px 48px 100px", maxWidth: 1200, margin: "0 auto", overflow: "visible" }}>
        {/* Candlestick background + rays */}
        <div style={{ position: "absolute", left: "26%", top: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
          {/* Large circular radial glow — 800px diameter */}
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,160,0.06) 0%, rgba(0,212,160,0.025) 30%, transparent 65%)", animation: "pulseGlow 5s ease infinite" }} />
          {/* Organic glow shapes */}
          <div style={{ position: "absolute", left: "48%", top: "45%", transform: "translate(-50%,-50%) rotate(-8deg)", width: 220, height: 550, borderRadius: "45% 55% 50% 50%", background: "radial-gradient(ellipse at 40% 50%, rgba(0,255,200,0.07) 0%, transparent 70%)", animation: "pulseGlow 3.5s ease infinite" }} />
          <div style={{ position: "absolute", left: "53%", top: "52%", transform: "translate(-50%,-50%) rotate(12deg)", width: 350, height: 650, borderRadius: "55% 45% 48% 52%", background: "radial-gradient(ellipse at 55% 45%, rgba(0,212,160,0.045) 0%, transparent 65%)", animation: "pulseGlow 4.5s ease 0.8s infinite" }} />
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 120, height: 360, borderRadius: "40% 60% 55% 45%", background: "radial-gradient(ellipse, rgba(0,255,210,0.12) 0%, transparent 65%)", animation: "pulseGlow 3s ease 1.2s infinite" }} />
          {/* Radiating rays SVG */}
          <svg width="900" height="900" viewBox="0 0 900 900" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 0 }}>
            <defs>
              <filter id="rayBlur"><feGaussianBlur stdDeviation="6" /></filter>
              <linearGradient id="ray0" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00ffc8" stopOpacity="0.08" /><stop offset="100%" stopColor="#00ffc8" stopOpacity="0" /></linearGradient>
              <linearGradient id="ray1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#00ffc8" stopOpacity="0.07" /><stop offset="100%" stopColor="#00ffc8" stopOpacity="0" /></linearGradient>
              <linearGradient id="ray2" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#00ffc8" stopOpacity="0.06" /><stop offset="100%" stopColor="#00ffc8" stopOpacity="0" /></linearGradient>
              <linearGradient id="rayR" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00ffb8" stopOpacity="0.08" /><stop offset="100%" stopColor="#00ffb8" stopOpacity="0" /></linearGradient>
            </defs>
            {/* Ray 1 — up-right, long */}
            <polygon points="450,450 445,440 620,80 625,85" fill="url(#ray0)" filter="url(#rayBlur)" style={{ animation: "rayPulse0 4s ease infinite" }} />
            {/* Ray 2 — right, medium */}
            <polygon points="450,450 455,443 820,340 818,348" fill="url(#ray1)" filter="url(#rayBlur)" style={{ animation: "rayPulse1 4s ease 0.6s infinite" }} />
            {/* Ray 3 — down-right, long */}
            <polygon points="450,450 458,452 750,720 744,725" fill="url(#rayR)" filter="url(#rayBlur)" style={{ animation: "rayPulse2 4s ease 1.2s infinite" }} />
            {/* Ray 4 — up-left, medium */}
            <polygon points="450,450 448,442 250,120 244,126" fill="url(#ray0)" filter="url(#rayBlur)" style={{ animation: "rayPulse3 4s ease 1.8s infinite" }} />
            {/* Ray 5 — left, short */}
            <polygon points="450,450 445,445 140,380 142,388" fill="url(#ray1)" filter="url(#rayBlur)" style={{ animation: "rayPulse0 4s ease 2.4s infinite" }} />
            {/* Ray 6 — down-left */}
            <polygon points="450,450 444,455 200,710 208,714" fill="url(#rayR)" filter="url(#rayBlur)" style={{ animation: "rayPulse1 4s ease 3s infinite" }} />
            {/* Ray 7 — steep up */}
            <polygon points="450,450 447,442 420,60 426,62" fill="url(#ray2)" filter="url(#rayBlur)" style={{ animation: "rayPulse2 4s ease 0.9s infinite" }} />
            {/* Ray 8 — steep down */}
            <polygon points="450,450 453,458 480,840 474,838" fill="url(#ray2)" filter="url(#rayBlur)" style={{ animation: "rayPulse3 4s ease 2.1s infinite" }} />
          </svg>
          {/* Candlestick SVG */}
          <svg width="160" height="650" viewBox="0 0 160 650" style={{ position: "relative", zIndex: 0 }}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00ffb8" stopOpacity="0.3" /><stop offset="30%" stopColor="#00d4a0" stopOpacity="0.38" /><stop offset="70%" stopColor="#00d4a0" stopOpacity="0.28" /><stop offset="100%" stopColor="#009a74" stopOpacity="0.18" /></linearGradient>
              <linearGradient id="cH" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#00ffcc" stopOpacity="0.18" /><stop offset="40%" stopColor="#00ffcc" stopOpacity="0.05" /><stop offset="100%" stopColor="transparent" stopOpacity="0" /></linearGradient>
              <filter id="wg"><feGaussianBlur stdDeviation="8" /></filter>
              <filter id="pg"><feGaussianBlur stdDeviation="18" /></filter>
            </defs>
            <rect x="20" y="145" width="120" height="340" rx="8" fill="#00d4a0" opacity="0.05" filter="url(#pg)" />
            <rect x="30" y="155" width="100" height="320" rx="4" fill="url(#cg)" style={{ animation: "pulseGlow 3s ease infinite" }} />
            <rect x="32" y="158" width="40" height="314" rx="3" fill="url(#cH)" />
            <line x1="80" y1="25" x2="80" y2="155" stroke="#00d4a0" strokeWidth="4" opacity="0.3" />
            <line x1="80" y1="25" x2="80" y2="155" stroke="#00ffb8" strokeWidth="2" opacity="0.12" />
            <line x1="80" y1="25" x2="80" y2="155" stroke="#00d4a0" strokeWidth="16" opacity="0.04" filter="url(#wg)" />
            <line x1="80" y1="475" x2="80" y2="625" stroke="#00d4a0" strokeWidth="4" opacity="0.3" />
            <line x1="80" y1="475" x2="80" y2="625" stroke="#00ffb8" strokeWidth="2" opacity="0.12" />
            <line x1="80" y1="475" x2="80" y2="625" stroke="#00d4a0" strokeWidth="16" opacity="0.04" filter="url(#wg)" />
          </svg>
        </div>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 500, opacity: heroVis ? 1 : 0, transform: heroVis ? "translateY(0)" : "translateY(20px)", transition: "all 0.7s ease" }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.35, fontFamily: fd, color: "#e8e8f0", marginBottom: 28 }}>
            The first trading journal smart enough to read what you wrote and{" "}
            <span style={{ color: teal }}>coach you on what to fix.</span>
          </h1>
          <p style={{ fontSize: 17, color: "#9a9da8", lineHeight: 1.75, marginBottom: 20, fontFamily: fm, maxWidth: 440, opacity: heroVis ? 1 : 0, transition: "all 0.7s ease 0.15s" }}>
            Every journal can analyze your trades. None of them can analyze the psychology behind them &mdash; until now.
          </p>
          <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap", opacity: heroVis ? 1 : 0, transition: "all 0.7s ease 0.25s" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,212,160,0.06)", border: "1px solid rgba(0,212,160,0.12)", borderRadius: 8, padding: "10px 14px" }}>
              <Lock size={15} color={teal} />
              <span style={{ fontSize: 14, color: "#8a9a92", fontFamily: fm }}>100% local storage &mdash; your data stays on your device. We never see it.</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,212,160,0.06)", border: "1px solid rgba(0,212,160,0.12)", borderRadius: 8, padding: "10px 14px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22v-5" /><path d="M9 8V2" /><path d="M15 8V2" /><path d="M18 8v5a6 6 0 0 1-12 0V8h12z" />
              </svg>
              <span style={{ fontSize: 14, color: "#8a9a92", fontFamily: fm }}>Connects to all major brokers</span>
            </div>
          </div>
          <div onClick={() => setTabGlow(true)} style={{ background: teal, color: "#0a0a0f", padding: "15px 32px", borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: fm, display: "inline-block", boxShadow: "0 0 20px rgba(0,212,160,0.3)", opacity: heroVis ? 1 : 0, transition: "all 0.7s ease 0.35s" }}>
            Explore the Tabs
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1, opacity: heroVis ? 1 : 0, transform: heroVis ? "translateY(0)" : "translateY(20px)", transition: "all 0.7s ease 0.25s" }}>
          <AITicker />
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, maxWidth: 300 }}>
            <span style={{ color: teal, fontSize: 8 }}>{"\u25C6"}</span>
            <span style={{ fontSize: 16, color: "#e8e8f0", lineHeight: 1.5, fontFamily: fd, fontWeight: 600, textAlign: "center" }}>Cross-references your journal entries with your trade data to surface recurring themes.</span>
            <span style={{ color: teal, fontSize: 8 }}>{"\u25C6"}</span>
          </div>
        </div>
      </section>

      <LiveDemo />

      <RadarSection />

      {/* ═══ 90/10 SECTION ═══ */}
      <section style={{ padding: "120px 48px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 34, fontWeight: 700, fontFamily: fd, color: "#e8e8f0", lineHeight: 1.4, marginBottom: 36 }}>
          90% of trading is psychology and 10% is technical.{" "}
          <span style={{ color: teal }}>So why does every journal only analyze the 10%?</span>
        </div>
        <div style={{ fontSize: 18, fontFamily: fm, color: "#9a9da8", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 28px" }}>
          WickCoach goes beneath the surface of your trading mind. It reads how you think, not just what you traded &mdash; and connects the two to find the patterns you can&apos;t see from inside your own head.
        </div>
        <div style={{ fontSize: 17, fontFamily: fm, color: "#b8d0c4", lineHeight: 1.7, maxWidth: 560, margin: "0 auto", padding: "20px 28px", borderRadius: 10, background: "rgba(0,212,160,0.04)", border: "1px solid rgba(0,212,160,0.1)" }}>
          Understanding the emotions behind your trading actions can be uncomfortable at first &mdash; but it&apos;s the single fastest way to{" "}
          <span style={{ color: teal, fontWeight: 600 }}>actually increase your confidence</span> at the screen.
        </div>
      </section>

      {/* ═══ PRIVACY + DATA UPLOAD ═══ */}
      <section style={{ padding: "100px 48px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: 34, fontWeight: 700, fontFamily: fd, lineHeight: 1.3, marginBottom: 20, color: "#e8e8f0" }}>
          We never see your data.<br />It&apos;s stored on your own computer.
        </h2>
        <p style={{ fontSize: 16, color: "#9a9da8", lineHeight: 1.7, fontFamily: fm, maxWidth: 520, margin: "0 auto 40px" }}>
          Upload your past trading data in any format &mdash; CSVs, broker statements, screenshots. The AI uses it to understand your trading history before you log a single trade.
        </p>
        <div style={{ display: "flex", gap: 20 }}>
          {privacyCards.map((c, i) => (
            <div key={i} style={{ flex: 1, background: "#13141a", border: "1px solid #1a1b22", borderRadius: 12, padding: "28px 24px", textAlign: "left" }}>
              <div style={{ marginBottom: 16 }}>{c.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: "#d0d0d8", marginBottom: 10, fontFamily: fd }}>{c.title}</div>
              <div style={{ fontSize: 15, color: "#9a9da8", lineHeight: 1.7, fontFamily: fm }}>{c.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section style={{ padding: "100px 48px", maxWidth: 750, margin: "0 auto" }}>
        <h2 style={{ fontSize: 34, fontWeight: 700, fontFamily: fd, marginBottom: 12, color: "#e8e8f0", textAlign: "center" }}>Choose your plan.</h2>
        <p style={{ fontSize: 15, color: "#6a6d78", fontFamily: fm, textAlign: "center", marginBottom: 50 }}>One-time payment with software updates included.</p>
        <div style={{ display: "flex", gap: 20 }}>
          {/* Essential */}
          <div className="price-card" style={{ flex: 1, background: "#13141a", border: "1px solid #1e1e28", borderRadius: 14, padding: "36px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#9a9da8", fontFamily: fm, fontWeight: 600, marginBottom: 6 }}>ESSENTIAL</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: "#e8e8f0", fontFamily: fd, marginBottom: 4 }}>$35</div>
            <div style={{ fontSize: 14, color: "#6a6d78", marginBottom: 24, fontFamily: fm }}>one-time</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28, textAlign: "left" }}>
              {essentialFeatures.map(f => (
                <div key={f} style={{ fontSize: 14, color: "#b0b4c0", fontFamily: fm }}>
                  <span style={{ color: teal, marginRight: 10 }}>+</span>{f}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#5a5d68", fontFamily: fm, marginBottom: 16 }}>No AI coach included</div>
            <div style={{ background: "rgba(0,212,160,0.1)", color: teal, padding: "13px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: fm, border: "1px solid rgba(0,212,160,0.2)" }}>Get Essential</div>
          </div>
          {/* Complete */}
          <div className="price-card" style={{ flex: 1, background: "#13141a", border: "2px solid rgba(0,212,160,0.3)", borderRadius: 14, padding: "36px 28px", textAlign: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: teal, color: "#0a0a0f", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 20, fontFamily: fm }}>RECOMMENDED</div>
            <div style={{ fontSize: 14, color: teal, fontFamily: fm, fontWeight: 600, marginBottom: 6 }}>COMPLETE</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: "#e8e8f0", fontFamily: fd, marginBottom: 4 }}>$99</div>
            <div style={{ fontSize: 14, color: "#6a6d78", marginBottom: 24, fontFamily: fm }}>one-time</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28, textAlign: "left" }}>
              {completeFeatures.map(f => (
                <div key={f} style={{ fontSize: 14, color: "#b0b4c0", fontFamily: fm }}>
                  <span style={{ color: teal, marginRight: 10 }}>+</span>{f}
                </div>
              ))}
            </div>
            <div style={{ background: teal, color: "#0a0a0f", padding: "13px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: fm, boxShadow: "0 0 20px rgba(0,212,160,0.25)" }}>Get Complete</div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section style={{ padding: "100px 48px", maxWidth: 640, margin: "0 auto" }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, fontFamily: fd, marginBottom: 40, color: "#e8e8f0" }}>Frequently Asked Questions</h2>
        {faqs.map((f, i) => (
          <FAQ key={i} q={f.q} a={f.a} open={openFAQ === i} onClick={() => setOpenFAQ(openFAQ === i ? null : i)} />
        ))}
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ background: "#0a0b10", borderTop: "1px solid #1a1b22", padding: "60px 48px 30px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 40 }}>
          <div>
            <Logo size={22} showText />
            <div style={{ fontSize: 14, color: "#6a6d78", lineHeight: 1.65, marginTop: 14, fontFamily: fm }}>The first AI trading journal that coaches your psychology.</div>
          </div>
          {[
            { t: "Product", l: ["Features", "Pricing", "Demo"] },
            { t: "Support", l: ["FAQ", "Contact", "Privacy", "Terms"] },
          ].map(c => (
            <div key={c.t}>
              <div style={{ fontSize: 12, color: "#9a9da8", letterSpacing: "0.08em", marginBottom: 16, fontWeight: 500, fontFamily: fm }}>{c.t}</div>
              {c.l.map(l => <div key={l} style={{ fontSize: 14, color: "#6a6d78", marginBottom: 10, cursor: "pointer", fontFamily: fm }}>{l}</div>)}
            </div>
          ))}
          <div>
            <div style={{ fontSize: 12, color: "#9a9da8", letterSpacing: "0.08em", marginBottom: 16, fontWeight: 500, fontFamily: fm }}>Connect</div>
            {["Twitter / X", "Discord", "Email"].map(l => <div key={l} style={{ fontSize: 14, color: "#6a6d78", marginBottom: 10, cursor: "pointer", fontFamily: fm }}>{l}</div>)}
            <div style={{ fontSize: 15, color: teal, marginTop: 20, fontWeight: 600, fontFamily: fm }}>From $35 one-time</div>
          </div>
        </div>
        <div style={{ maxWidth: 1000, margin: "40px auto 0", borderTop: "1px solid #1a1b22", paddingTop: 20, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#3a3d48", fontFamily: fm }}>&copy; 2026 WickCoach. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
