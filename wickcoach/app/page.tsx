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

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{ padding: "100px 48px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ fontSize: 18, color: teal, letterSpacing: "0.18em", marginBottom: 14, fontWeight: 700, fontFamily: fm }}>HOW IT WORKS</div>
        <h2 style={{ fontSize: 34, fontWeight: 700, fontFamily: fd, lineHeight: 1.35, marginBottom: 14, color: "#e8e8f0" }}>It&apos;s not just a trade log. It&apos;s a mirror.</h2>
        <p style={{ fontSize: 16, color: "#9a9da8", lineHeight: 1.7, marginBottom: 36, fontFamily: fm }}>Log a trade, write what you felt, and watch the AI connect the dots.</p>

        <div style={{ background: "#0a0b10", border: "2px solid #1e1e28", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 40px rgba(0,0,0,0.3)" }}>
          {/* Window chrome */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 16px", borderBottom: "1px solid #1a1b22", background: "#0e0f14" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5555", opacity: 0.6 }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c9a84c", opacity: 0.6 }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: teal, opacity: 0.6 }} />
            <span style={{ fontSize: 13, color: "#6a6d78", marginLeft: 8, lineHeight: 1.6 }}>WickCoach &mdash; Trade Log</span>
          </div>

          {/* Trade row */}
          <div style={{ display: "flex", flexDirection: "column", padding: "14px 16px", gap: 8, borderBottom: "1px solid #1a1b22" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, color: "#9a9da8", fontFamily: fm }}>Dec 18</span>
              <div style={{ width: 28, height: 28, borderRadius: 5, background: "#555", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", fontFamily: fm, flexShrink: 0 }}>AAPL</div>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e8", fontFamily: fm }}>AAPL</span>
              <span style={{ fontSize: 15, color: "#d0d0d8", fontWeight: 600, fontFamily: fm }}>Opening range breakout</span>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 3, background: "rgba(0,212,160,0.12)", color: teal, fontFamily: fm }}>W</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: teal, fontFamily: fm }}>+$225</span>
              </div>
            </div>
            <div style={{ fontSize: 14, color: "#6a7078", fontStyle: "italic", fontWeight: 300, lineHeight: 1.6, fontFamily: fm }}>&ldquo;Waited for full confirmation on the 5. Patient entry, let the candle close before committing. Felt calm and focused.&rdquo;</div>
          </div>

          {/* AI Observation */}
          <div style={{ padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Logo size={20} />
              <span style={{ fontSize: 15, color: teal, letterSpacing: "0.1em", fontWeight: 700, fontFamily: fm }}>AI OBSERVATION</span>
            </div>
            <div style={{ background: "#111a18", border: "1px solid rgba(0,212,160,0.15)", borderRadius: 10, padding: "16px 18px", marginBottom: 14 }}>
              <div style={{ fontSize: 15, color: "#b8d0c4", lineHeight: 1.8, fontFamily: fm }}>
                This is what it looks like when you trade your plan, Dylan. You wrote &lsquo;patient&rsquo; and &lsquo;calm&rsquo; &mdash; those words appear on 85% of your winning days. When you wait for the 5-minute confirmation, the data backs you up:
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "WIN RATE", value: "78%" },
                { label: "AVG R:R", value: "1.8R" },
                { label: "EXP. VALUE", value: "+$186" },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: "#13141a", border: "1px solid #1e1e28", borderRadius: 8, padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#8a8d98", marginBottom: 4, fontWeight: 600, fontFamily: fm }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: teal, fontFamily: fm }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
