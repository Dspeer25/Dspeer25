'use client';
import React, { useState, useEffect, useRef } from "react";
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

const cDomains: Record<string, string> = { QQQ: "invesco.com", SPY: "ssga.com", AAPL: "apple.com", NVDA: "nvidia.com", TSLA: "tesla.com", AMZN: "amazon.com", META: "meta.com", MSFT: "microsoft.com", GOOG: "google.com" };
const CLogo = ({ t }: { t: string }) => <img src={`https://logo.clearbit.com/${cDomains[t]}?size=48`} alt={t} style={{ width: 20, height: 20, borderRadius: "50%", background: "#1a1b22", objectFit: "cover" as const }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;

function MockLogATrade() {
  const is = { background: "#0e0f14", border: "1px solid #2a2b35", borderRadius: 8, padding: "10px 12px", color: "#fff", fontFamily: fm, fontSize: 13, width: "100%" };
  return (<div>
    <div style={{ color: teal, fontFamily: fm, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 2, marginBottom: 16 }}>TRADE DETAILS</div>
    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Ticker</div><div style={{ ...is }}>NVDA</div></div><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Strategy</div><div style={{ ...is }}>0DTE Call</div></div></div>
    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Direction</div><div style={{ ...is, color: teal }}>LONG</div></div><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>P/L</div><div style={{ ...is, color: teal, fontWeight: 700 }}>+$870.00</div></div></div>
    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Entry</div><div style={{ ...is }}>$482.50</div></div><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Exit</div><div style={{ ...is }}>$491.20</div></div></div>
    <div style={{ color: teal, fontFamily: fm, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 2, marginBottom: 8 }}>JOURNAL</div>
    <div style={{ ...is, minHeight: 60, color: "#9ca3af", lineHeight: 1.6 }}>Waited for the VWAP reclaim at 10:15. Felt confident in the setup...</div>
    <div style={{ background: teal, color: "#0e0f14", fontFamily: fd, fontWeight: 700, padding: "12px 0", borderRadius: 8, textAlign: "center", marginTop: 16, fontSize: 15 }}>Log Trade</div>
  </div>);
}

function MockPastTrades() {
  const rows = [{ t: "NVDA", d: "Mar 14", s: "0DTE Call", pl: "+$870", w: true }, { t: "QQQ", d: "Mar 13", s: "0DTE Put", pl: "+$445", w: true }, { t: "TSLA", d: "Mar 12", s: "Call Scalp", pl: "-$210", w: false }, { t: "SPY", d: "Mar 11", s: "Put Debit", pl: "+$380", w: true }, { t: "AAPL", d: "Mar 10", s: "0DTE Call", pl: "-$155", w: false }];
  return (<div>
    <div style={{ display: "flex", padding: "10px 0", borderBottom: "1px solid #1a1b22", color: "#6b7280", fontFamily: fm, fontSize: 11 }}><span style={{ width: 70 }}>Date</span><span style={{ flex: 1 }}>Ticker</span><span style={{ flex: 1 }}>Strategy</span><span style={{ width: 80, textAlign: "right" }}>P/L</span><span style={{ width: 60, textAlign: "right" }}>Result</span></div>
    {rows.map((r, i) => (<div key={i} style={{ display: "flex", alignItems: "center", padding: "12px 0", borderBottom: i < 4 ? "1px solid #1a1b22" : "none", fontFamily: fm, fontSize: 13 }}><span style={{ width: 70, color: "#9ca3af" }}>{r.d}</span><span style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, color: "#fff", fontWeight: 700 }}><CLogo t={r.t} />{r.t}</span><span style={{ flex: 1, color: "#9ca3af" }}>{r.s}</span><span style={{ width: 80, textAlign: "right", color: r.w ? teal : "#ef4444", fontWeight: 700 }}>{r.pl}</span><span style={{ width: 60, textAlign: "right" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: r.w ? "rgba(0,212,160,0.1)" : "rgba(239,68,68,0.1)", color: r.w ? teal : "#ef4444" }}>{r.w ? "WIN" : "LOSS"}</span></span></div>))}
  </div>);
}


function MockTradingGoalsInner({ goalSet }: { goalSet: { week: string; goals: { text: string; status: string; statusText: string }[]; aiBullets: string; followUp: string } }) {
  const [displayedText, setDisplayedText] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [answer, setAnswer] = useState('');

  const fullText = goalSet.aiBullets;

  React.useEffect(() => {
    let i = 0;
    let typingTimer: ReturnType<typeof setInterval>;
    const delayTimer = setTimeout(() => {
      setIsTyping(true);
      typingTimer = setInterval(() => {
        if (i < fullText.length) {
          setDisplayedText(fullText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typingTimer);
          setIsTyping(false);
          setIsThinking(true);
          setTimeout(() => {
            setIsThinking(false);
            setShowFollowUp(true);
          }, 2000);
        }
      }, 18);
    }, 4000);
    return () => {
      clearTimeout(delayTimer);
      if (typingTimer) clearInterval(typingTimer);
    };
  }, [fullText]);

  const renderedBullets = displayedText.split('\n').filter(l => l.length > 0);
  const aiAnimating = isTyping || isThinking;

  const statusColors: Record<string, { fill: string; stroke: string; textColor: string }> = {
    complete: { fill: '#00d4a0', stroke: '#00d4a0', textColor: '#00d4a0' },
    progress: { fill: 'none', stroke: '#eab308', textColor: '#eab308' },
    missed: { fill: 'none', stroke: '#ef4444', textColor: '#ef4444' },
  };

  return (
    <div style={{ display: 'flex', gap: 20, padding: 0, height: '100%', overflow: 'hidden' }}>
      {/* LEFT COLUMN */}
      <div style={{ flex: '0 0 58%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: fd, color: '#fff', fontSize: 20, fontWeight: 700 }}>Trader Stated Goals</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ padding: '4px 14px', borderRadius: 6, fontSize: 11, fontFamily: fm, fontWeight: 700, background: 'rgba(0,212,160,0.15)', border: '1px solid #00d4a0', color: '#00d4a0' }}>Week</span>
            <span style={{ padding: '4px 14px', borderRadius: 6, fontSize: 11, fontFamily: fm, fontWeight: 700, background: '#1a1b22', border: '1px solid #1a1b22', color: '#6b7280' }}>Month</span>
          </div>
        </div>
        <div style={{ fontFamily: fm, color: '#ffffff', fontSize: 14, marginTop: 10, marginBottom: 18 }}>{goalSet.week}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {goalSet.goals.map((goal, gi) => {
            const sc = statusColors[goal.status] || statusColors.progress;
            return (
              <div key={gi} style={{ background: 'linear-gradient(135deg, rgba(0,212,160,0.04), rgba(0,212,160,0.01))', border: '1px solid rgba(0,212,160,0.15)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <svg width="22" height="22" viewBox="0 0 22 22" style={{ flexShrink: 0, marginTop: 1 }}>
                  {goal.status === 'complete' ? (
                    <><circle cx="11" cy="11" r="10" fill={sc.fill} /><path d="M7 11l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>
                  ) : (
                    <circle cx="11" cy="11" r="9.5" fill="none" stroke={sc.stroke} strokeWidth="2" />
                  )}
                </svg>
                <div>
                  <div style={{ fontFamily: fm, color: '#ffffff', fontSize: 13, fontWeight: 500 }}>{goal.text}</div>
                  <div style={{ fontFamily: fm, color: sc.textColor, fontSize: 11, marginTop: 4 }}>{goal.statusText}</div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Scan line */}
        <div style={{ position: 'absolute', left: 0, width: '100%', height: 2, background: 'linear-gradient(90deg, transparent, #00d4a0, transparent)', boxShadow: '0 0 20px rgba(0,212,160,0.4)', animation: 'goalScan 4s ease-in-out infinite', zIndex: 2, pointerEvents: 'none' }} />
        {/* Sparkles */}
        {[{ l: '12%', t: '22%', d: '0s' }, { l: '45%', t: '38%', d: '0.4s' }, { l: '78%', t: '28%', d: '0.8s' }, { l: '30%', t: '58%', d: '1.2s' }, { l: '65%', t: '72%', d: '1.6s' }, { l: '88%', t: '52%', d: '2s' }].map((s, i) => (
          <div key={i} style={{ position: 'absolute', left: s.l, top: s.t, width: 4, height: 4, borderRadius: '50%', background: '#00d4a0', animation: 'sparkle 2s ease-in-out infinite', animationDelay: s.d, pointerEvents: 'none' }} />
        ))}
      </div>
      {/* RIGHT COLUMN */}
      <div className="goals-right-col" style={{ flex: '0 0 38%', maxHeight: '100%', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, animation: aiAnimating ? 'aiPulse 1.5s ease-in-out infinite' : 'none' }}>
          <Logo size={16} />
          <span style={{ fontFamily: fm, fontSize: 12, fontWeight: 700, color: '#00d4a0', letterSpacing: 1 }}>WickCoach AI</span>
        </div>
        <div style={{ background: '#1a1b22', border: '1px solid #232430', borderRadius: 10, padding: 16, marginTop: 12, minHeight: 120 }}>
          <div style={{ fontFamily: fm, color: '#d1d5db', fontSize: 13, lineHeight: '1.7', fontStyle: 'italic' }}>
            {renderedBullets.map((line, idx) => (
              <div key={idx} style={{ marginBottom: idx < renderedBullets.length - 1 ? 10 : 0 }}>
                {line.startsWith('\u2022') ? <><span style={{ color: '#00d4a0' }}>{'\u2022'}</span>{line.slice(1)}</> : line}
              </div>
            ))}
            {isTyping && <span style={{ animation: 'blink 1s step-end infinite', color: '#00d4a0' }}>|</span>}
          </div>
          {isThinking && (
            <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4a0', animation: 'thinkDot 1.2s ease-in-out infinite', animationDelay: '0s' }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4a0', animation: 'thinkDot 1.2s ease-in-out infinite', animationDelay: '0.3s' }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4a0', animation: 'thinkDot 1.2s ease-in-out infinite', animationDelay: '0.6s' }} />
            </div>
          )}
        </div>
        <div style={{ opacity: showFollowUp ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: showFollowUp ? 'auto' : 'none' }}>
          <div style={{ background: 'rgba(0,212,160,0.05)', border: '1px solid rgba(0,212,160,0.2)', borderRadius: 8, padding: 10, marginTop: 10 }}>
            <div style={{ fontFamily: fm, fontSize: 10, fontWeight: 700, color: '#00d4a0', letterSpacing: 1, marginBottom: 8 }}>FOLLOW-UP</div>
            <div style={{ fontFamily: fm, color: '#c9cdd4', fontSize: 13, lineHeight: '1.6' }}>{goalSet.followUp}</div>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setAnswer(''); }}
              placeholder="Type your answer..."
              style={{ background: '#13141a', border: '1px solid #232430', borderRadius: 6, padding: '8px 10px', color: '#ffffff', fontSize: 13, fontFamily: fm, width: '100%', outline: 'none', marginTop: 10, boxSizing: 'border-box' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#00d4a0'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#232430'; }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MockTradingGoals() {
  const goalSets = [
    {
      week: "Week of Mar 17 \u2013 Mar 21",
      goals: [
        { text: "Limit to 3 trades per day \u2014 no exceptions", status: "complete", statusText: "Completed \u2014 hit 5/5 days" },
        { text: "Wait 15 min after open before first entry", status: "progress", statusText: "In progress \u2014 hit 3/5 days" },
        { text: "Journal every trade within 10 minutes of closing", status: "missed", statusText: "Missed \u2014 0/5 days completed" },
      ],
      aiBullets: "\u2022 3-trade limit \u2014 Clear. I\u2019ll flag any 4th entry and pull up what you journaled before it.\n\n\u2022 15-min wait \u2014 Noted. I\u2019ll track your first entry time each day against this rule.\n\n\u2022 Journal within 10 min \u2014 I\u2019ll track the gap between your close and your entry timestamp.",
      followUp: "On the 15-minute rule \u2014 are you avoiding first-candle volatility, or giving yourself time to read the open before reacting? This changes what I watch for in your journal.",
    },
    {
      week: "Week of Mar 24 \u2013 Mar 28",
      goals: [
        { text: "No revenge trades \u2014 if I lose, I wait 30 min", status: "progress", statusText: "In progress \u2014 broke rule once on Wednesday" },
        { text: "Risk no more than 1.5% per trade", status: "complete", statusText: "Completed \u2014 stayed under on all 7 trades" },
        { text: "Review previous day\u2019s journal before trading", status: "complete", statusText: "Completed \u2014 5/5 days" },
      ],
      aiBullets: "\u2022 No revenge trades \u2014 This is your highest-leverage goal. I\u2019ll watch for multiple entries within 30 minutes of a loss.\n\n\u2022 1.5% risk cap \u2014 Clean. I\u2019ll compare your actual position sizes to this threshold every trade.\n\n\u2022 Morning journal review \u2014 I\u2019ll look for patterns in how your first trade changes on days you review vs days you skip.",
      followUp: "On the revenge trade rule \u2014 when you broke it Wednesday, what were you feeling right before the second entry? Understanding the trigger matters more than the rule itself.",
    },
    {
      week: "Week of Mar 31 \u2013 Apr 4",
      goals: [
        { text: "Only trade setups from my watchlist \u2014 no improvising", status: "missed", statusText: "Missed \u2014 3 off-watchlist trades this week" },
        { text: "Take profits at first target \u2014 no hoping for more", status: "progress", statusText: "In progress \u2014 held past target twice" },
        { text: "End trading by 2pm \u2014 no afternoon session", status: "complete", statusText: "Completed \u2014 shut down by 2pm every day" },
      ],
      aiBullets: "\u2022 Watchlist only \u2014 3 off-list trades is a pattern. I\u2019ll track which tickers pull you off your plan.\n\n\u2022 Take profits at target \u2014 Held past target twice. I\u2019ll check your journal for what you wrote in those moments.\n\n\u2022 Done by 2pm \u2014 Perfect compliance. Your afternoon discipline is strong.",
      followUp: "The 3 off-watchlist trades \u2014 were they all the same ticker or different ones? If it\u2019s the same name pulling you in, that\u2019s not a discipline issue, it\u2019s an obsession. Different problem, different fix.",
    },
  ];

  const [goalSetIndex, setGoalSetIndex] = useState(0);
  const [refreshHover, setRefreshHover] = useState(false);

  return (<div style={{ position: 'relative' }}>
    <style>{`
      @keyframes goalScan {
        0% { top: 5%; opacity: 0; }
        15% { opacity: 1; }
        85% { opacity: 1; }
        100% { top: 90%; opacity: 0; }
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      @keyframes sparkle {
        0%, 100% { opacity: 0; transform: scale(0.5); }
        50% { opacity: 1; transform: scale(1.3); }
      }
      @keyframes aiPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes thinkDot {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 1; }
      }
      .goals-right-col { scrollbar-width: thin; scrollbar-color: #00d4a0 #1a1b22; }
      .goals-right-col::-webkit-scrollbar { width: 4px; }
      .goals-right-col::-webkit-scrollbar-track { background: #1a1b22; border-radius: 2px; }
      .goals-right-col::-webkit-scrollbar-thumb { background: #00d4a0; border-radius: 2px; }
    `}</style>
    {/* Refresh button */}
    <div
      onClick={() => setGoalSetIndex(prev => (prev + 1) % goalSets.length)}
      onMouseEnter={() => setRefreshHover(true)}
      onMouseLeave={() => setRefreshHover(false)}
      style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', background: refreshHover ? 'rgba(0,212,160,0.2)' : 'rgba(0,212,160,0.1)', border: '1px solid rgba(0,212,160,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, transition: 'background 0.2s' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    </div>
    <MockTradingGoalsInner key={goalSetIndex} goalSet={goalSets[goalSetIndex]} />
  </div>);
}

function MockAnalysis() {
  return (<div style={{ display: "flex", gap: 20 }}>
    <div style={{ flex: 1 }}>
      <div style={{ background: "#0e0f14", border: "1px solid #1a1b22", borderRadius: 10, padding: "14px", marginBottom: 10 }}><span style={{ color: "#9ca3af", fontFamily: fm, fontSize: 13 }}>Why do I keep losing on Fridays?</span></div>
      <div style={{ background: "rgba(0,212,160,0.04)", border: "1px solid rgba(0,212,160,0.1)", borderRadius: 10, padding: "14px", display: "flex", gap: 10 }}><Logo size={16} /><span style={{ color: "#b8d0c4", fontFamily: fm, fontSize: 13, lineHeight: 1.6 }}>Looking at your last 8 Friday trades, 6 were taken in the first 10 minutes. Your weekday entries average 25 minutes after open. Friday urgency is costing you &mdash; you&apos;re trading the week&apos;s emotions, not Friday&apos;s chart.</span></div>
    </div>
    <div style={{ width: 180, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ background: "#0e0f14", border: "1px solid #1a1b22", borderRadius: 10, padding: "16px", textAlign: "center" }}><div style={{ color: "#6b7280", fontFamily: fm, fontSize: 11, marginBottom: 6 }}>Friday Win Rate</div><div style={{ color: "#ef4444", fontFamily: fm, fontSize: 24, fontWeight: 800 }}>25%</div></div>
      <div style={{ background: "#0e0f14", border: "1px solid #1a1b22", borderRadius: 10, padding: "16px", textAlign: "center" }}><div style={{ color: "#6b7280", fontFamily: fm, fontSize: 11, marginBottom: 6 }}>Mon-Thu Win Rate</div><div style={{ color: teal, fontFamily: fm, fontSize: 24, fontWeight: 800 }}>64%</div></div>
    </div>
  </div>);
}

function MockTraderProfile() {
  const cx2 = 120, cy2 = 110, mR2 = 80;
  const sc = [93, 85, 90, 91, 78];
  const ang2 = sc.map((_, i) => (i * 2 * Math.PI) / 5 - Math.PI / 2);
  const pts = sc.map((s, i) => `${cx2 + mR2 * (s / 100) * Math.cos(ang2[i])},${cy2 + mR2 * (s / 100) * Math.sin(ang2[i])}`).join(" ");
  const ptsFull = [100,100,100,100,100].map((s, i) => `${cx2 + mR2 * (s / 100) * Math.cos(ang2[i])},${cy2 + mR2 * (s / 100) * Math.sin(ang2[i])}`).join(" ");
  return (<div style={{ textAlign: "center" }}>
    <svg width="240" height="240" viewBox="0 0 240 240"><polygon points={ptsFull} fill="none" stroke="#1a1b22" strokeWidth="1" /><polygon points={pts} fill="rgba(0,212,160,0.1)" stroke={teal} strokeWidth="2" /></svg>
    <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>{[{ l: "142 trades", v: "logged" }, { l: "58%", v: "win rate" }, { l: "1.8", v: "avg R:R" }].map((s, i) => (<div key={i} style={{ background: "#0e0f14", border: "1px solid #1a1b22", borderRadius: 8, padding: "12px 20px", textAlign: "center" }}><div style={{ color: "#fff", fontFamily: fm, fontSize: 16, fontWeight: 700 }}>{s.l}</div><div style={{ color: "#6b7280", fontFamily: fm, fontSize: 11 }}>{s.v}</div></div>))}</div>
    <div style={{ color: "#6b7280", fontFamily: fm, fontSize: 12, marginTop: 14 }}>Trading since: Oct 2025</div>
  </div>);
}

function MockPositionSizer() {
  const is = { background: "#0e0f14", border: "1px solid #1a1b22", borderRadius: 8, padding: "10px 12px", color: "#fff", fontFamily: fm, fontSize: 13, width: "100%" };
  return (<div>
    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Account Balance</div><div style={is}>$25,000</div></div><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Risk per Trade</div><div style={is}>2%</div></div></div>
    <div style={{ display: "flex", gap: 12, marginBottom: 20 }}><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Entry Price</div><div style={is}>$485.00</div></div><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Stop Loss</div><div style={is}>$480.00</div></div></div>
    <div style={{ background: "rgba(0,212,160,0.06)", border: "1px solid rgba(0,212,160,0.15)", borderRadius: 10, padding: "20px", textAlign: "center" }}><div style={{ color: teal, fontFamily: fm, fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>RESULT</div><div style={{ color: "#fff", fontFamily: fd, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Position Size: 100 shares</div><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 14 }}>Risk Amount: $500</div></div>
  </div>);
}

function MockGrowthSimulator() {
  return (<div>
    <svg viewBox="0 0 400 200" style={{ width: "100%", height: 200 }}>
      <line x1="40" y1="180" x2="380" y2="180" stroke="#1a1b22" strokeWidth="1" />
      <line x1="40" y1="10" x2="40" y2="180" stroke="#1a1b22" strokeWidth="1" />
      <polyline points="40,170 80,155 120,140 160,130 200,110 240,95 280,75 320,55 360,30" fill="none" stroke={teal} strokeWidth="2.5" />
      <polyline points="40,170 80,165 120,162 160,158 200,155 240,150 280,148 320,144 360,140" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4 4" />
      {["1","3","6","9","12"].map((m, i) => <text key={i} x={40 + i * 80} y={196} fill="#6b7280" fontSize="10" fontFamily={fm} textAnchor="middle">Mo {m}</text>)}
    </svg>
    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>{[{ l: "$10,000", v: "Starting" }, { l: "$18,400", v: "Projected 12mo" }, { l: "5.2%", v: "Monthly Return" }].map((s, i) => (<div key={i} style={{ flex: 1, background: "#0e0f14", border: "1px solid #1a1b22", borderRadius: 8, padding: "12px", textAlign: "center" }}><div style={{ color: "#fff", fontFamily: fm, fontSize: 16, fontWeight: 700 }}>{s.l}</div><div style={{ color: "#6b7280", fontFamily: fm, fontSize: 11 }}>{s.v}</div></div>))}</div>
  </div>);
}

function MockTradeTimeline() {
  const days = ["Mon","Tue","Wed","Thu","Fri"];
  const weeks = [["+$340","-$220","+$180","","+$290"],["-$150","+$410","","+$180","-$95"],["+$510","","+$245","-$130","+$195"],["+$380","-$180","+$445","","+$355"]];
  return (<div>
    <div style={{ color: "#fff", fontFamily: fd, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>March 2026 &mdash; 18 trades, 11 wins, $2,840 net</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
      {days.map(d => <div key={d} style={{ textAlign: "center", color: "#6b7280", fontFamily: fm, fontSize: 10, paddingBottom: 4 }}>{d}</div>)}
      {weeks.flat().map((v, i) => { const isW = v.startsWith("+"); return <div key={i} style={{ background: v ? (isW ? "rgba(0,212,160,0.1)" : "rgba(239,68,68,0.1)") : "#0e0f14", border: `1px solid ${v ? (isW ? "rgba(0,212,160,0.2)" : "rgba(239,68,68,0.2)") : "#1a1b22"}`, borderRadius: 6, padding: "10px 4px", textAlign: "center", fontFamily: fm, fontSize: 11, fontWeight: 700, color: v ? (isW ? teal : "#ef4444") : "#2a2b35", minHeight: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>{v || "\u2014"}</div>; })}
    </div>
  </div>);
}


export default function WickCoachFull() {
  const [tabGlow, setTabGlow] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("Log a Trade");
  const [view, setView] = useState<'home' | 'app'>('home');
  const [activeCategory, setActiveCategory] = useState(0);

  const handleCategoryClick = (index: number) => {
    setActiveCategory(index);
  };

  const tabs = ["Log a Trade", "Past Trades", "Trading Goals", "Analysis", "Trader Profile"];

  function LogATradeContent({ setActiveTab: setTab }: { setActiveTab: (tab: string) => void }) {
    const [ticker, setTicker] = useState('');
    const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);
    const [positionType, setPositionType] = useState<'SHARES' | 'DERIVATIVES'>('DERIVATIVES');
    const [strategyType, setStrategyType] = useState('0DTE Call');
    const [strategyInputMode, setStrategyInputMode] = useState<'select' | 'text'>('select');
    const [customStrategy, setCustomStrategy] = useState('');
    const [direction, setDirection] = useState('LONG');
    const [contracts, setContracts] = useState('');
    const [entryPrice, setEntryPrice] = useState('');
    const [exitPrice, setExitPrice] = useState('');
    const [pl, setPl] = useState('');
    const [plManualOverride, setPlManualOverride] = useState(false);
    const [journal, setJournal] = useState('');
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [risk, setRisk] = useState('');
    const [riskReward, setRiskReward] = useState('\u2014');
    const [submitHover, setSubmitHover] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [uploadHover, setUploadHover] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [startTime] = useState(Date.now());
    const [elapsedTime, setElapsedTime] = useState(0);
    const [finalTime, setFinalTime] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    React.useEffect(() => {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [startTime]);

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    React.useEffect(() => {
      if (!plManualOverride && entryPrice && exitPrice && contracts) {
        const multiplier = positionType === 'SHARES' ? 1 : 100;
        const calc = (parseFloat(exitPrice) - parseFloat(entryPrice)) * parseInt(contracts) * multiplier;
        setPl(calc.toFixed(2));
      }
    }, [entryPrice, exitPrice, contracts, plManualOverride, positionType]);

    React.useEffect(() => {
      setPlManualOverride(false);
    }, [entryPrice, exitPrice, contracts]);

    React.useEffect(() => {
      const plNum = parseFloat(pl);
      const riskNum = parseFloat(risk);
      if (plNum > 0 && riskNum > 0) {
        const ratio = plNum / riskNum;
        setRiskReward(`1 : ${ratio.toFixed(1)}`);
      } else {
        setRiskReward('\u2014');
      }
    }, [pl, risk]);

    const resetForm = () => {
      setTicker(''); setTradeDate(new Date().toISOString().split('T')[0]);
      setPositionType('DERIVATIVES'); setStrategyType('0DTE Call');
      setStrategyInputMode('select'); setCustomStrategy('');
      setDirection('LONG'); setContracts(''); setEntryPrice('');
      setExitPrice(''); setPl(''); setPlManualOverride(false);
      setJournal(''); setScreenshot(null); setSubmitted(false);
      setRisk(''); setRiskReward('\u2014');
    };

    const inputStyle = {
      background: '#0e0f14',
      border: '1px solid #2a2b35',
      borderRadius: 8,
      padding: '12px 14px',
      color: '#ffffff',
      fontFamily: "'DM Mono', monospace",
      fontSize: 14,
      width: '100%',
      outline: 'none',
      boxSizing: 'border-box' as const,
    };

    const labelStyle = {
      color: '#c9cdd4',
      fontFamily: "'DM Mono', monospace",
      fontSize: 14,
      marginBottom: 6,
      display: 'block' as const,
    };

    const sectionLabelStyle = {
      color: '#00d4a0',
      fontFamily: "'DM Mono', monospace",
      fontSize: 18,
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: 2,
      marginBottom: 24,
      textDecoration: 'underline' as const,
      textUnderlineOffset: '6px',
      textDecorationColor: '#00d4a0',
    };

    const strategyOptions = [
      '0DTE Call', '0DTE Put', 'Call Scalp', 'Put Scalp',
      'Call Debit Spread', 'Put Debit Spread', 'Put Credit Spread',
      'Call Credit Spread', 'Iron Condor', 'Naked Put', 'Naked Call',
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => setScreenshot(ev.target?.result as string);
      reader.readAsDataURL(file);
    };

    const plNum = parseFloat(pl);
    const plColor = plNum > 0 ? '#00d4a0' : plNum < 0 ? '#ef4444' : '#ffffff';

    if (submitted) {
      return (
        <div style={{ textAlign: 'center', paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: '#00d4a0' }}>{"\u2713"}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,212,160,0.1)', border: '1px solid rgba(0,212,160,0.2)', borderRadius: 20, padding: '8px 20px', marginBottom: 20 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#00d4a0', fontWeight: 700 }}>Logged in {formatTime(finalTime)}</span>
          </div>
          <h2 style={{ fontFamily: "'Chakra Petch', sans-serif", color: '#ffffff', fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Trade Logged</h2>
          <p style={{ color: '#6b7280', fontFamily: "'DM Mono', monospace", fontSize: 14, lineHeight: '1.6', marginBottom: 32 }}>Your trade has been saved and is ready for AI analysis.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => setTab('Past Trades')} style={{ background: '#13141a', border: '1px solid #00d4a0', borderRadius: 8, padding: '12px 24px', color: '#00d4a0', fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>View in Past Trades</button>
            <button onClick={() => setTab('Analysis')} style={{ background: '#13141a', border: '1px solid #00d4a0', borderRadius: 8, padding: '12px 24px', color: '#00d4a0', fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>View in Analysis</button>
          </div>
          <p onClick={resetForm} style={{ color: '#6b7280', fontFamily: "'DM Mono', monospace", fontSize: 13, marginTop: 24, cursor: 'pointer' }}>+ Log another trade</p>
        </div>
      );
    }

    return (
      <>
        <div style={sectionLabelStyle}>TRADE DETAILS</div>

        <label style={labelStyle}>Ticker</label>
        <input style={inputStyle} placeholder="e.g. QQQ, SPY, TSLA" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} />
        <div style={{ height: 16 }} />

        <label style={labelStyle}>Date</label>
        <input type="date" style={{ ...inputStyle, colorScheme: 'dark' }} value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} />
        <div style={{ height: 16 }} />

        <label style={labelStyle}>Position Type</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['SHARES', 'DERIVATIVES'] as const).map(pt => (
            <button key={pt} onClick={() => setPositionType(pt)} style={{ flex: 1, background: positionType === pt ? 'rgba(0,212,160,0.15)' : '#0e0f14', border: positionType === pt ? '1px solid #00d4a0' : '1px solid #2a2b35', color: positionType === pt ? '#00d4a0' : '#6b7280', borderRadius: 8, padding: '10px 0', fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 }}>{pt}</button>
          ))}
        </div>
        <div style={{ height: 16 }} />

        {positionType === 'DERIVATIVES' && (<>
          <label style={labelStyle}>Strategy Type</label>
          {strategyInputMode === 'select' ? (<>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={strategyType} onChange={(e) => setStrategyType(e.target.value)}>
              {strategyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div onClick={() => setStrategyInputMode('text')} style={{ color: '#6b7280', fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: 'pointer', marginTop: 6 }}>Or type your own</div>
          </>) : (<>
            <input style={inputStyle} placeholder="Type your strategy" value={customStrategy} onChange={(e) => setCustomStrategy(e.target.value)} />
            <div onClick={() => setStrategyInputMode('select')} style={{ color: '#6b7280', fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: 'pointer', marginTop: 6 }}>Choose from list</div>
          </>)}
          <div style={{ height: 16 }} />
        </>)}

        <label style={labelStyle}>Direction</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {['LONG', 'SHORT'].map(dir => (
            <button key={dir} onClick={() => setDirection(dir)} style={{ flex: 1, background: direction === dir ? 'rgba(0,212,160,0.15)' : '#0e0f14', border: direction === dir ? '1px solid #00d4a0' : '1px solid #2a2b35', color: direction === dir ? '#00d4a0' : '#6b7280', borderRadius: 8, padding: '10px 0', fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 }}>{dir}</button>
          ))}
        </div>
        <div style={{ height: 16 }} />

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{positionType === 'SHARES' ? 'Shares' : 'Contracts'}</label>
            <input type="number" style={inputStyle} placeholder={positionType === 'SHARES' ? '# of shares' : '# of contracts'} min={1} value={contracts} onChange={(e) => setContracts(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>P/L</label>
            <input type="number" step={0.01} style={{ ...inputStyle, color: plColor }} placeholder="Auto or manual" value={pl} onChange={(e) => { setPl(e.target.value); setPlManualOverride(true); }} />
          </div>
        </div>
        <div style={{ height: 16 }} />

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Entry Price</label>
            <input type="number" step={0.01} style={inputStyle} placeholder="$0.00" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Exit Price</label>
            <input type="number" step={0.01} style={inputStyle} placeholder="$0.00" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} />
          </div>
        </div>

        <div style={{ height: 16 }} />

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Risk ($)</label>
            <input type="number" step={0.01} style={inputStyle} placeholder="$0.00" value={risk} onChange={(e) => setRisk(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Risk : Reward</label>
            <input readOnly style={{ ...inputStyle, fontWeight: 700, color: riskReward === '\u2014' ? '#6b7280' : '#00d4a0', background: '#0a0b0f', cursor: 'default' }} value={riskReward} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 48 }}>
          <div style={{ flex: 1 }}>
            <div style={sectionLabelStyle}>JOURNAL ENTRY</div>
            <textarea style={{ ...inputStyle, minHeight: 200, resize: 'vertical', lineHeight: '1.7' }} placeholder="Share your brief approach on this trade for the WickCoach AI to analyze..." value={journal} onChange={(e) => setJournal(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={sectionLabelStyle}>SCREENSHOT</div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            {!screenshot ? (
              <div onClick={() => fileInputRef.current?.click()} onMouseEnter={() => setUploadHover(true)} onMouseLeave={() => setUploadHover(false)} style={{ width: '100%', minHeight: 200, border: `2px dashed ${uploadHover ? '#00d4a0' : '#2a2b35'}`, borderRadius: 12, background: '#0e0f14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <span style={{ color: '#6b7280', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>Drop an image here</span>
                <span style={{ color: '#00d4a0', fontFamily: "'DM Mono', monospace", fontSize: 12, cursor: 'pointer' }}>or click to browse</span>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', minHeight: 200, borderRadius: 12, overflow: 'hidden', border: '1px solid #2a2b35' }}>
                <img src={screenshot} alt="Screenshot" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }} />
                <div onClick={() => { setScreenshot(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>{"\u2715"}</div>
              </div>
            )}
          </div>
        </div>

        <button onClick={() => { setFinalTime(elapsedTime); if (intervalRef.current) clearInterval(intervalRef.current); setSubmitted(true); }} onMouseEnter={() => setSubmitHover(true)} onMouseLeave={() => setSubmitHover(false)} style={{ marginTop: 32, background: '#00d4a0', color: '#0e0f14', fontFamily: "'Chakra Petch', sans-serif", fontSize: 16, fontWeight: 700, padding: '14px 0', borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%', letterSpacing: 1, filter: submitHover ? 'brightness(1.1)' : 'none' }}>Log Trade</button>

        <p style={{ color: '#4b5563', fontFamily: "'DM Mono', monospace", fontSize: 12, textAlign: 'center', marginTop: 12 }}>Your data stays on your device. Always.</p>
      </>
    );
  }

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
        @keyframes tabPulse { 0%, 100% { box-shadow: 0 0 6px rgba(0,212,160,0.1); border-color: rgba(0,212,160,0.12) } 50% { box-shadow: 0 0 24px rgba(0,212,160,0.45); border-color: rgba(0,212,160,0.4) } }
        * { box-sizing: border-box; margin: 0; padding: 0 }
        *::-webkit-scrollbar { display: none }
        * { -ms-overflow-style: none; scrollbar-width: none }
        .price-card { transition: box-shadow 0.3s ease, border-color 0.3s ease }
        .price-card:hover { box-shadow: 0 0 30px rgba(0,212,160,0.2); border-color: rgba(0,212,160,0.35) !important }
        ::selection { background: rgba(0,212,160,0.2); color: #fff }
      `}</style>

      {/* ═══ APP VIEW ═══ */}
      {view === 'app' && (<>
        <div style={{ padding: "12px 24px" }}>
          <span onClick={() => setView('home')} style={{ color: "#6b7280", fontFamily: fm, fontSize: 13, cursor: "pointer" }}>&larr; Back to home</span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 40px 0", borderBottom: "1px solid #1a1b22", overflow: "visible" }}>
          <div onClick={() => setView('home')} style={{ marginBottom: 20, cursor: 'pointer' }}>
            <Logo size={34} showText />
          </div>
          <div style={{ display: "flex", gap: 5, width: "100%", maxWidth: 920 }}>
            {tabs.map(t => (
              <span key={t} onClick={() => setActiveTab(t)} style={{ fontSize: 14, color: teal, letterSpacing: "0.04em", padding: "14px 16px 16px", cursor: "pointer", fontFamily: fm, borderRadius: "8px 8px 0 0", fontWeight: 600, background: activeTab === t ? "rgba(0,212,160,0.12)" : "rgba(0,212,160,0.05)", border: activeTab === t ? `1px solid ${teal}` : "1px solid rgba(0,212,160,0.12)", borderBottom: "none", flex: 1, textAlign: "center", lineHeight: 1.5 }}>{t}</span>
            ))}
          </div>
        </nav>
        <div style={{ maxWidth: 580, margin: '0 auto', padding: '40px 20px' }}>
          {activeTab === 'Log a Trade' && (
            <LogATradeContent setActiveTab={setActiveTab} />
          )}
          {activeTab !== 'Log a Trade' && (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <p style={{ color: '#4b5563', fontFamily: 'DM Mono', fontSize: 16 }}>Coming soon</p>
            </div>
          )}
        </div>
      </>)}

      {/* ═══ HOME VIEW ═══ */}
      {view === 'home' && (<>

      {/* ═══ NAV ═══ */}
      <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 40px 0", borderBottom: "1px solid #1a1b22", overflow: "visible" }}>
        <div style={{ marginBottom: 20 }}>
          <Logo size={34} showText />
        </div>
        <div style={{ display: "flex", gap: 5, width: "100%", maxWidth: 920 }}>
          {tabs.map(t => (
            <span key={t} onClick={() => setView('app')} style={{ fontSize: 14, color: teal, letterSpacing: "0.04em", padding: "14px 16px 16px", cursor: "pointer", fontFamily: fm, borderRadius: "8px 8px 0 0", fontWeight: 600, background: "rgba(0,212,160,0.05)", border: "1px solid rgba(0,212,160,0.12)", borderBottom: "none", flex: 1, textAlign: "center", lineHeight: 1.5, animation: tabGlow ? "tabPulse 1.4s ease infinite" : "none" }}>{t}</span>
          ))}
        </div>
      </nav>

      {/* ═══ FEATURE CAROUSEL ═══ */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', padding: '80px 20px 100px', background: '#0e0f14' }}>
        <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,160,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -300, left: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,160,0.05) 0%, rgba(59,130,246,0.03) 50%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 60, position: 'relative' }}>
            {/* Stick figure floating with candle balloons */}
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 0, pointerEvents: 'none' }}>
              <svg width="700" height="340" viewBox="0 0 700 340" fill="none" style={{ display: 'block' }}>
                <defs>
                  <filter id="neon"><feGaussianBlur stdDeviation="4" /></filter>
                  <filter id="neon2"><feGaussianBlur stdDeviation="10" /></filter>
                  <filter id="neon3"><feGaussianBlur stdDeviation="20" /></filter>
                </defs>

                {/* ══ Strings from hand (395,148) to bottom of each candle ══ */}
                <line x1="395" y1="148" x2="201" y2="100" stroke="#7a7d88" strokeWidth="1.2" opacity="0.5" />
                <line x1="395" y1="148" x2="269" y2="85" stroke="#7a7d88" strokeWidth="1.2" opacity="0.5" />
                <line x1="395" y1="148" x2="345" y2="76" stroke="#7a7d88" strokeWidth="1.2" opacity="0.5" />
                <line x1="395" y1="148" x2="410" y2="80" stroke="#7a7d88" strokeWidth="1.2" opacity="0.5" />
                <line x1="395" y1="148" x2="475" y2="66" stroke="#7a7d88" strokeWidth="1.2" opacity="0.5" />
                <line x1="395" y1="148" x2="540" y2="50" stroke="#7a7d88" strokeWidth="1.2" opacity="0.45" />

                {/* ══ Candle 1 (GREEN) — far left ══ */}
                <ellipse cx="201" cy="66" rx="21" ry="34" fill="none" stroke="#00d4a0" strokeWidth="14" opacity="0.14" filter="url(#neon3)" />
                <ellipse cx="201" cy="66" rx="21" ry="34" fill="none" stroke="#00ffcc" strokeWidth="9" opacity="0.25" filter="url(#neon2)" />
                <ellipse cx="201" cy="66" rx="21" ry="34" fill="none" stroke="#00ffcc" strokeWidth="5" opacity="0.38" filter="url(#neon)" />
                <ellipse cx="201" cy="66" rx="21" ry="34" fill="#00d4a0" opacity="0.02" />
                <ellipse cx="201" cy="66" rx="21" ry="34" fill="none" stroke="#00ffcc" strokeWidth="1.2" opacity="0.38" />
                <line x1="201" y1="14" x2="201" y2="32" stroke="#00d4a0" strokeWidth="10" opacity="0.2" filter="url(#neon2)" />
                <line x1="201" y1="14" x2="201" y2="32" stroke="#00ffcc" strokeWidth="1.2" opacity="0.35" strokeLinecap="round" />

                {/* ══ Candle 2 (RED) ══ */}
                <ellipse cx="269" cy="53" rx="21" ry="32" fill="none" stroke="#ff5555" strokeWidth="14" opacity="0.12" filter="url(#neon3)" />
                <ellipse cx="269" cy="53" rx="21" ry="32" fill="none" stroke="#ff6666" strokeWidth="9" opacity="0.23" filter="url(#neon2)" />
                <ellipse cx="269" cy="53" rx="21" ry="32" fill="none" stroke="#ff6666" strokeWidth="5" opacity="0.35" filter="url(#neon)" />
                <ellipse cx="269" cy="53" rx="21" ry="32" fill="#ff5555" opacity="0.015" />
                <ellipse cx="269" cy="53" rx="21" ry="32" fill="none" stroke="#ff6666" strokeWidth="1.2" opacity="0.35" />
                <line x1="269" y1="6" x2="269" y2="22" stroke="#ff5555" strokeWidth="10" opacity="0.18" filter="url(#neon2)" />
                <line x1="269" y1="6" x2="269" y2="22" stroke="#ff6666" strokeWidth="1.2" opacity="0.3" strokeLinecap="round" />

                {/* ══ Candle 3 (GREEN) — center-left, tallest ══ */}
                <ellipse cx="345" cy="40" rx="23" ry="36" fill="none" stroke="#00d4a0" strokeWidth="16" opacity="0.16" filter="url(#neon3)" />
                <ellipse cx="345" cy="40" rx="23" ry="36" fill="none" stroke="#00ffcc" strokeWidth="10" opacity="0.27" filter="url(#neon2)" />
                <ellipse cx="345" cy="40" rx="23" ry="36" fill="none" stroke="#00ffcc" strokeWidth="5.5" opacity="0.4" filter="url(#neon)" />
                <ellipse cx="345" cy="40" rx="23" ry="36" fill="#00d4a0" opacity="0.02" />
                <ellipse cx="345" cy="40" rx="23" ry="36" fill="none" stroke="#00ffcc" strokeWidth="1.4" opacity="0.42" />

                {/* ══ Candle 4 (GREEN) — center-right ══ */}
                <ellipse cx="410" cy="47" rx="20" ry="33" fill="none" stroke="#00d4a0" strokeWidth="14" opacity="0.14" filter="url(#neon3)" />
                <ellipse cx="410" cy="47" rx="20" ry="33" fill="none" stroke="#00ffcc" strokeWidth="9" opacity="0.25" filter="url(#neon2)" />
                <ellipse cx="410" cy="47" rx="20" ry="33" fill="none" stroke="#00ffcc" strokeWidth="5" opacity="0.38" filter="url(#neon)" />
                <ellipse cx="410" cy="47" rx="20" ry="33" fill="#00d4a0" opacity="0.02" />
                <ellipse cx="410" cy="47" rx="20" ry="33" fill="none" stroke="#00ffcc" strokeWidth="1.2" opacity="0.38" />

                {/* ══ Candle 5 (RED) ══ */}
                <ellipse cx="475" cy="35" rx="20" ry="31" fill="none" stroke="#ff5555" strokeWidth="14" opacity="0.12" filter="url(#neon3)" />
                <ellipse cx="475" cy="35" rx="20" ry="31" fill="none" stroke="#ff6666" strokeWidth="9" opacity="0.23" filter="url(#neon2)" />
                <ellipse cx="475" cy="35" rx="20" ry="31" fill="none" stroke="#ff6666" strokeWidth="5" opacity="0.35" filter="url(#neon)" />
                <ellipse cx="475" cy="35" rx="20" ry="31" fill="#ff5555" opacity="0.015" />
                <ellipse cx="475" cy="35" rx="20" ry="31" fill="none" stroke="#ff6666" strokeWidth="1.2" opacity="0.35" />

                {/* ══ Candle 6 (GREEN) — far right, highest ══ */}
                <ellipse cx="540" cy="25" rx="20" ry="25" fill="none" stroke="#00d4a0" strokeWidth="14" opacity="0.14" filter="url(#neon3)" />
                <ellipse cx="540" cy="25" rx="20" ry="25" fill="none" stroke="#00ffcc" strokeWidth="9" opacity="0.25" filter="url(#neon2)" />
                <ellipse cx="540" cy="25" rx="20" ry="25" fill="none" stroke="#00ffcc" strokeWidth="5" opacity="0.38" filter="url(#neon)" />
                <ellipse cx="540" cy="25" rx="20" ry="25" fill="#00d4a0" opacity="0.02" />
                <ellipse cx="540" cy="25" rx="20" ry="25" fill="none" stroke="#00ffcc" strokeWidth="1.2" opacity="0.38" />

                {/* ══ Stick figure — logo proportions scaled up ══ */}
                {/* Head */}
                <circle cx="350" cy="178" r="18" stroke="#7a7d88" strokeWidth="3" fill="none" />
                {/* Body */}
                <line x1="350" y1="196" x2="350" y2="262" stroke="#7a7d88" strokeWidth="3" strokeLinecap="round" />
                {/* Left arm — down-left like logo */}
                <line x1="350" y1="216" x2="315" y2="242" stroke="#7a7d88" strokeWidth="3" strokeLinecap="round" />
                {/* Right arm — reaching up-right to hold strings */}
                <line x1="350" y1="216" x2="395" y2="148" stroke="#7a7d88" strokeWidth="3" strokeLinecap="round" />
                {/* Left leg */}
                <line x1="350" y1="262" x2="326" y2="310" stroke="#7a7d88" strokeWidth="3" strokeLinecap="round" />
                {/* Right leg */}
                <line x1="350" y1="262" x2="374" y2="310" stroke="#7a7d88" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            {/* Heading */}
            <h1 style={{ position: 'relative', zIndex: 1, fontFamily: fd, color: '#ffffff', fontSize: 44, fontWeight: 700, lineHeight: 1.2, maxWidth: 800, margin: '0 auto 0' }}>You&apos;ve reviewed a thousand charts. When&apos;s the last time you reviewed yourself?</h1>
            {/* Subtitle */}
            <p style={{ position: 'relative', zIndex: 1, color: '#9ca3af', fontFamily: fm, fontSize: 15, maxWidth: 600, margin: '0 auto', lineHeight: 1.7, marginTop: 24 }}>The AI trading journal that reads what you wrote and holds you accountable to the trader you said you&apos;d be.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 48 }}>
            {[
              { label: "Log a Trade", d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" },
              { label: "Past Trades", d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2" },
              { label: "Trading Goals", d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" },
              { label: "Analysis", d: "M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7zM9 21h6" },
              { label: "Trader Profile", d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
              { label: "Position Sizer", d: "M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM8 6h8M8 10h8M8 14h4" },
              { label: "Growth Simulator", d: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" },
              { label: "Trade Timeline", d: "M3 4h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM16 2v4M8 2v4M1 10h22" },
            ].map((cat, i) => {
              const isActive = activeCategory === i;
              return (
                <div key={i} onClick={() => handleCategoryClick(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'linear-gradient(135deg, rgba(0,212,160,0.25), rgba(0,212,160,0.1))' : 'rgba(255,255,255,0.03)', border: isActive ? '1px solid rgba(0,212,160,0.5)' : '1px solid rgba(255,255,255,0.06)', boxShadow: isActive ? '0 0 20px rgba(0,212,160,0.4), 0 0 50px rgba(0,212,160,0.25), 0 0 100px rgba(0,212,160,0.12)' : 'none', transform: isActive ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.3s ease' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isActive ? teal : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={cat.d} /></svg>
                  </div>
                  <span style={{ fontFamily: fm, fontSize: 11, color: isActive ? teal : '#6b7280', textAlign: 'center', whiteSpace: 'nowrap' as const, transition: 'color 0.3s ease' }}>{cat.label}</span>
                </div>
              );
            })}
          </div>
          {/* iMac frame */}
          <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 20px' }}>
            {/* Monitor */}
            <div style={{ background: 'linear-gradient(180deg, #38393f 0%, #2c2d33 4%, #232428 100%)', borderRadius: '18px 18px 2px 2px', padding: '10px 10px 28px 10px', position: 'relative', boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.5), 0 0 100px rgba(0,0,0,0.3), inset 0 0 10px rgba(0,0,0,0.5)' }}>
              {/* Camera dot */}
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0e0f14', border: '1px solid #3a3b45', margin: '2px auto 6px' }} />
              {/* Screen bezel */}
              <div style={{ background: '#000000', borderRadius: 6, padding: 5, position: 'relative', border: '1px solid #3a3b45' }}>
                {/* Screen content */}
                <div style={{ background: '#0e0f14', borderRadius: 4, overflow: 'hidden', height: 440, padding: 32 }}>
                  {activeCategory === 0 && <MockLogATrade />}
                  {activeCategory === 1 && <MockPastTrades />}
                  {activeCategory === 2 && <MockTradingGoals />}
                  {activeCategory === 3 && <MockAnalysis />}
                  {activeCategory === 4 && <MockTraderProfile />}
                  {activeCategory === 5 && <MockPositionSizer />}
                  {activeCategory === 6 && <MockGrowthSimulator />}
                  {activeCategory === 7 && <MockTradeTimeline />}
                </div>
              </div>
              {/* Chin with WickCoach logo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="23" height="28" viewBox="0 0 20 24" fill="none">
                    <circle cx="8" cy="4" r="2.8" stroke="#7a7d88" strokeWidth="1.2" fill="none" />
                    <line x1="8" y1="6.8" x2="8" y2="15" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="9.5" x2="3" y2="13" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="15" x2="4.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="15" x2="11.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="15.5" y1="2" x2="15.5" y2="12" stroke="#00d4a0" strokeWidth="0.8" />
                    <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill="#00d4a0" opacity="0.9" />
                  </svg>
                  <span style={{ fontSize: 22, letterSpacing: '0.12em', fontWeight: 700, fontFamily: fd }}>
                    <span style={{ color: '#d0d0d8' }}>WICK</span>
                    <span style={{ color: '#00d4a0' }}>COACH</span>
                  </span>
                </div>
              </div>
            </div>
            {/* Stand neck */}
            <div style={{ width: 100, height: 50, margin: '0 auto', background: 'linear-gradient(180deg, #222328 0%, #1a1b20 40%, #28292f 100%)', clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </div>
            {/* Stand base */}
            <div style={{ width: 180, height: 10, margin: '0 auto', background: 'linear-gradient(180deg, #28292f 0%, #1c1d22 100%)', borderRadius: '0 0 50% 50% / 0 0 100% 100%', boxShadow: '0 2px 10px rgba(0,0,0,0.4)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '10%', right: '10%', top: 0, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>
            {/* Surface shadow */}
            <div style={{ width: '50%', height: 20, margin: '4px auto 0', background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
            {/* Teal glow reflection */}
            <div style={{ width: '40%', height: 30, margin: '-15px auto 0', background: 'radial-gradient(ellipse, rgba(0,212,160,0.04) 0%, transparent 70%)', filter: 'blur(8px)', pointerEvents: 'none' }} />
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <button onClick={() => setView('app')} style={{ background: teal, color: '#0e0f14', fontFamily: fd, fontSize: 18, fontWeight: 700, padding: '16px 48px', borderRadius: 12, border: 'none', cursor: 'pointer', letterSpacing: 1, boxShadow: '0 0 30px rgba(0,212,160,0.2)' }}>Log Goals &rarr;</button>
            <p
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#00d4a0'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#6b7280'; }}
              style={{ color: '#6b7280', fontFamily: fm, fontSize: 12, marginTop: 8, cursor: 'pointer', textAlign: 'center' }}
            >or sign up to get started</p>
            <p style={{ color: '#6b7280', fontFamily: fm, fontSize: 13, marginTop: 12 }}>One-time payment. No subscription. No data collection.</p>
          </div>
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

      </>)}
    </div>
  );
}
