'use client';
import React, { useEffect, useState } from 'react';
import { fm, fd, Trade, Goal, buildTraderStats, computeAnalytics } from './shared';
import AIChatWidget from './AIChatWidget';

const teal = '#00d4a0';
const red = '#ff4444';

// Logo-domain lookup — reference data, not stats.
const tickerDomains: Record<string, string> = {
  V: 'visa.com', META: 'meta.com', NVDA: 'nvidia.com', AMD: 'amd.com',
  BA: 'boeing.com', MSFT: 'microsoft.com', JPM: 'jpmorganchase.com',
  DIS: 'disney.com', NFLX: 'netflix.com', TSLA: 'tesla.com', AAPL: 'apple.com',
  GOOGL: 'google.com', GOOG: 'google.com', AMZN: 'amazon.com', COIN: 'coinbase.com',
  PLTR: 'palantir.com', CRM: 'salesforce.com', COST: 'costco.com', HD: 'homedepot.com',
};

// Blue used by "Trades vs. Goals" sliders — complementary to teal.
const blue = '#4a9eff';

// ─── Helpers ──────────────────────────────────────────────────
const fmtDollar = (n: number, withCents = false) => {
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  if (withCents) return sign + '$' + abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return sign + '$' + abs.toLocaleString();
};
const fmtR = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1) + 'R';
const fmtPct = (n: number) => n.toFixed(1) + '%';

// ─── Weekly goals snapshot ─────────────────────────────────────
// Real trades get bucketed into ISO weeks; real goals (from localStorage)
// are the cards shown per week. Compliance numbers are derived from the
// trade counts in that week. No hardcoded weekly stats.
interface WeekBucket {
  weekLabel: string;
  start: Date;
  end: Date;
  trades: Trade[];
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();              // Sun = 0
  const diff = (day === 0 ? -6 : 1) - day; // snap back to Monday
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() + diff);
  return s;
}

function fmtWeekRange(start: Date, end: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const sameMonth = start.getMonth() === end.getMonth();
  const left = `${months[start.getMonth()]} ${start.getDate()}`;
  const right = sameMonth ? `${end.getDate()}, ${end.getFullYear()}` : `${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  return `${left} – ${right}`;
}

// Build the 3 most recent week buckets that contain any trades. Falls
// back to the current week + previous two so the UI always has something.
function buildWeekBuckets(trades: Trade[]): WeekBucket[] {
  const today = new Date();
  const buckets: WeekBucket[] = [];
  for (let i = 0; i < 3; i++) {
    const start = startOfWeek(new Date(today.getTime() - i * 7 * 86400000));
    const end = new Date(start.getTime() + 6 * 86400000);
    const inWeek = trades.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= new Date(end.getTime() + 86400000 - 1);
    });
    buckets.push({ weekLabel: fmtWeekRange(start, end), start, end, trades: inWeek });
  }
  return buckets;
}

// ─── Component ────────────────────────────────────────────────
export default function AnalysisContent({ trades = [] }: { trades?: Trade[] }) {
  const [heatmapMode, setHeatmapMode] = useState<'timeline' | 'best' | 'worst'>('timeline');
  const [showAllStrategies, setShowAllStrategies] = useState(false);
  const [showAllTickers, setShowAllTickers] = useState(false);
  const [tickerView, setTickerView] = useState<'wins' | 'losses'>('wins');
  const [hoveredSlice, setHoveredSlice] = useState<'wins' | 'losses' | null>(null);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);

  // ─── Analysis AI chat ───
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Live analytics derived from the trades prop. Every card, bar, pill,
  // and tooltip on this page reads from here — no hardcoded numbers.
  const a = computeAnalytics(trades);
  const { totals, strategies, tickers, tickerLosses, hours, processSplit, whatIfPL, indisciplineCost, patterns } = a;

  // Top-4 tickers contribution for the welcome message
  const top4Tickers = tickers.slice(0, 4);
  const top4Pct = totals.totalPL !== 0
    ? (top4Tickers.reduce((s, t) => s + t.pl, 0) / totals.totalPL) * 100
    : 0;
  const bestStrategy = strategies[0];
  const analysisWelcome = totals.n === 0
    ? "No trades logged yet. Once you log a few, I'll have something to analyze."
    : `I've analyzed your ${totals.n} executions. Here's what the data is telling me:\n\n` +
      `Process trades: ${processSplit.process.n} at ${processSplit.process.wr.toFixed(1)}% win rate. Impulse trades: ${processSplit.impulse.n} at ${processSplit.impulse.wr.toFixed(1)}% win rate. The gap is your edge, the gap is your leak.\n\n` +
      (bestStrategy ? `${bestStrategy.name} carries your book (${fmtDollar(bestStrategy.total)} on ${bestStrategy.trades} trades, ${fmtPct(bestStrategy.wr)} WR, ${fmtR(bestStrategy.r)} avg).\n\n` : '') +
      (top4Tickers.length ? `Ticker concentration: ${top4Tickers.map(t => t.t).join(', ')} generate ${top4Pct.toFixed(0)}% of P/L across ${top4Tickers.reduce((s, t) => s + t.trades, 0)} trades.\n\n` : '') +
      `What would you like to dig into? I can slice by session, setup, or journal sentiment.`;

  async function sendToCoach() {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiLoading(true);
    try {
      const analysisContext = buildTraderStats(trades);
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...aiMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg },
          ],
          tradesContext: analysisContext,
          mode: 'analysis',
        }),
      });
      const data = await response.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Unable to analyze right now.' }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Try again.' }]);
    }
    setAiLoading(false);
  }

  // Pinwheel geometry — all counts come from analytics.
  const totalTrades = totals.n;
  const wins = totals.wins;
  const losses = totals.losses;
  const be = totals.breakeven;
  const winPct = totalTrades ? wins / totalTrades : 0;
  const lossPct = totalTrades ? losses / totalTrades : 0;
  const bePct = totalTrades ? be / totalTrades : 0;
  const circ = 2 * Math.PI * 40; // r=40

  // Hourly heatmap — computed from real trade times in shared.ts
  const maxAbsHourPL = Math.max(1, ...hours.map(h => Math.abs(h.pl))); // avoid div-by-zero
  const sortedHours = heatmapMode === 'best'
    ? [...hours].sort((a, b) => b.pl - a.pl)
    : heatmapMode === 'worst'
      ? [...hours].sort((a, b) => a.pl - b.pl)
      : hours;
  const bestHour = [...hours].sort((a, b) => b.pl - a.pl)[0] || { h: '—', pl: 0, count: 0 };
  const worstHour = [...hours].sort((a, b) => a.pl - b.pl)[0] || { h: '—', pl: 0, count: 0 };

  // Load real goals from localStorage so Rules vs Execution reflects
  // whatever the trader has actually set, not mock text.
  const [realGoals, setRealGoals] = useState<Goal[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wickcoach_goals');
      if (saved) setRealGoals(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Per-week trade buckets for the Rules vs Execution section.
  const weekBuckets = buildWeekBuckets(trades);
  const selectedWeekBucket = weekBuckets[selectedWeekIdx] || weekBuckets[0];

  // Derive per-goal slider values from the selected week's real trades.
  // Trades side: trade count as a proxy for execution volume.
  // Psych side: journal entries whose text matches the goal type.
  const goalTypeKeywords: Record<string, string[]> = {
    'Trade Management': ['managed', 'held', 'breathe', 'exit'],
    'Entry Criteria':   ['entry', 'confirmation', 'confirmed', 'setup'],
    'Patience / Setup': ['patient', 'waited', 'setup'],
    'Risk Management':  ['risk', 'sized', 'size', 'stop', 'cap'],
    'Psychology':       ['calm', 'focused', 'discipline', 'mindset'],
    'General':          ['plan', 'rule', 'process'],
  };
  const selectedWeekGoals = realGoals.slice(0, 3).map((g) => {
    const weekTrades = selectedWeekBucket?.trades || [];
    const psychTarget = Math.max(5, Math.floor(weekTrades.length * 0.6));
    const kws = goalTypeKeywords[g.goalType] || goalTypeKeywords['General'];
    const psychActual = weekTrades.filter(t => {
      const j = (t.journal || '').toLowerCase();
      return kws.some(k => j.includes(k));
    }).length;
    const tradesTarget = Math.max(5, weekTrades.length || 5);
    const tradesActual = weekTrades.length;
    return {
      title: g.title || '(untitled)',
      type: (g.goalType || 'General').toUpperCase().split(' ')[0],
      trades: { actual: tradesActual, target: tradesTarget, unitLabel: 'trades this week' },
      psych:  { actual: psychActual,  target: psychTarget,  unitLabel: `journal mentions "${kws[0]}"` },
    };
  });
  const selectedWeek = { weekLabel: selectedWeekBucket?.weekLabel || '—', goals: selectedWeekGoals };

  return (
    <div style={{ background: 'transparent', padding: '32px 40px', minHeight: '100vh', fontFamily: fm, display: 'flex', flexDirection: 'column', gap: 32, overflowX: 'hidden' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>Analysis</h2>
          <p style={{ color: '#bbb', fontSize: 14, margin: '6px 0 0' }}>Behavioral pattern recognition across your trade history.</p>
          <p style={{ color: '#999', fontSize: 12, margin: '4px 0 0' }}>{totalTrades.toLocaleString()} execution{totalTrades === 1 ? '' : 's'} analyzed</p>
        </div>

        {/* WickCoach AI — Click for analysis */}
        <div
          onClick={() => setAiOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 20px',
            background: 'rgba(0,212,160,0.08)',
            border: '1px solid rgba(0,212,160,0.4)',
            borderRadius: 12,
            cursor: 'pointer',
            transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.3s ease',
            boxShadow: '0 0 24px rgba(0,212,160,0.12)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,160,0.15)'; e.currentTarget.style.borderColor = '#00d4a0'; e.currentTarget.style.boxShadow = '0 0 32px rgba(0,212,160,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,212,160,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,212,160,0.4)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(0,212,160,0.12)'; }}
        >
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,212,160,0.12)', border: '1px solid rgba(0,212,160,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="28" height="34" viewBox="0 0 20 24" fill="none">
              <circle cx="8" cy="4" r="2.8" stroke="#7a7d88" strokeWidth="1.2" fill="none" />
              <line x1="8" y1="6.8" x2="8" y2="15" stroke="#7a7d88" strokeWidth="1.2" />
              <line x1="8" y1="9.5" x2="3" y2="13" stroke="#7a7d88" strokeWidth="1.2" />
              <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#7a7d88" strokeWidth="1.2" />
              <line x1="8" y1="15" x2="4.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
              <line x1="8" y1="15" x2="11.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
              <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={teal} opacity="0.9" />
              <line x1="15.5" y1="2" x2="15.5" y2="12" stroke={teal} strokeWidth="0.8" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>WickCoach AI</span>
            <span style={{ fontFamily: fm, fontSize: 12, color: teal, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>Click for analysis</span>
          </div>
        </div>
      </div>

      {/* ═══ PINWHEEL ═══ */}
      <div style={{ background: '#141822', border: '1px solid #2A3143', borderRadius: 16, padding: '32px 28px', display: 'flex', alignItems: 'center', gap: 40, position: 'relative', flexWrap: 'wrap', justifyContent: 'center' }}>

        {/* Pie chart */}
        <div style={{ position: 'relative', width: 220, height: 220, flexShrink: 0 }}>
          <svg width="220" height="220" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            {/* background track */}
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2A3143" strokeWidth="16" />
            {/* wins (green) */}
            <circle
              cx="50" cy="50" r="40" fill="transparent"
              stroke={teal} strokeWidth={hoveredSlice === 'wins' ? 20 : 16}
              strokeDasharray={`${(winPct * circ).toFixed(2)} ${circ.toFixed(2)}`}
              strokeDashoffset="0"
              style={{ cursor: 'pointer', transition: 'stroke-width 0.2s', pointerEvents: 'stroke' }}
              onMouseEnter={() => setHoveredSlice('wins')}
              onMouseLeave={() => setHoveredSlice(null)}
            />
            {/* losses (red) */}
            <circle
              cx="50" cy="50" r="40" fill="transparent"
              stroke={red} strokeWidth={hoveredSlice === 'losses' ? 20 : 16}
              strokeDasharray={`${(lossPct * circ).toFixed(2)} ${circ.toFixed(2)}`}
              strokeDashoffset={`${(-winPct * circ).toFixed(2)}`}
              style={{ cursor: 'pointer', transition: 'stroke-width 0.2s', pointerEvents: 'stroke' }}
              onMouseEnter={() => setHoveredSlice('losses')}
              onMouseLeave={() => setHoveredSlice(null)}
            />
            {/* break-even (grey) */}
            <circle
              cx="50" cy="50" r="40" fill="transparent"
              stroke="#6b7280" strokeWidth="16"
              strokeDasharray={`${(bePct * circ).toFixed(2)} ${circ.toFixed(2)}`}
              strokeDashoffset={`${(-(winPct + lossPct) * circ).toFixed(2)}`}
            />
          </svg>
          {/* Center label */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ fontFamily: fd, fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{totalTrades}</div>
            <div style={{ fontFamily: fm, fontSize: 10, color: '#999', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>Total Trades</div>
          </div>
        </div>

        {/* Legend + hover detail */}
        <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, background: teal, borderRadius: 2, display: 'inline-block' }} />
              <span style={{ color: '#ddd', fontSize: 13, fontFamily: fm }}>Wins</span>
              <span style={{ color: teal, fontSize: 13, fontFamily: fd, fontWeight: 700 }}>{wins}</span>
              <span style={{ color: '#888', fontSize: 12 }}>({fmtPct(winPct * 100)})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, background: red, borderRadius: 2, display: 'inline-block' }} />
              <span style={{ color: '#ddd', fontSize: 13, fontFamily: fm }}>Losses</span>
              <span style={{ color: red, fontSize: 13, fontFamily: fd, fontWeight: 700 }}>{losses}</span>
              <span style={{ color: '#888', fontSize: 12 }}>({fmtPct(lossPct * 100)})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, background: '#6b7280', borderRadius: 2, display: 'inline-block' }} />
              <span style={{ color: '#ddd', fontSize: 13, fontFamily: fm }}>Break Even</span>
              <span style={{ color: '#bbb', fontSize: 13, fontFamily: fd, fontWeight: 700 }}>{be}</span>
              <span style={{ color: '#888', fontSize: 12 }}>({fmtPct(bePct * 100)})</span>
            </div>
          </div>

          {/* Hover tooltip — only visible while hovering a slice */}
          <div
            style={{
              background: hoveredSlice === 'wins' ? 'rgba(0,212,160,0.08)' : hoveredSlice === 'losses' ? 'rgba(255,68,68,0.08)' : 'transparent',
              border: hoveredSlice === 'wins' ? '1px solid rgba(0,212,160,0.4)' : hoveredSlice === 'losses' ? '1px solid rgba(255,68,68,0.4)' : '1px dashed #2A3143',
              borderRadius: 10,
              padding: '14px 16px',
              minHeight: 160,
              transition: 'all 0.25s ease',
            }}
          >
            {hoveredSlice === 'wins' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="20" viewBox="0 0 20 24" fill="none">
                    <circle cx="8" cy="4" r="2.8" stroke="#7a7d88" strokeWidth="1.2" fill="none" />
                    <line x1="8" y1="6.8" x2="8" y2="15" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="9.5" x2="3" y2="13" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="15" x2="4.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="15" x2="11.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
                    <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={teal} opacity="0.9" />
                    <line x1="15.5" y1="2" x2="15.5" y2="12" stroke={teal} strokeWidth="0.8" />
                  </svg>
                  <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: teal, letterSpacing: 1.5 }}>MAJOR PSYCHOLOGICAL WINS</div>
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    `Patience: ${patterns.patience} trades journaled as patient waits`,
                    `Clean Execution: ${patterns.cleanExecution} textbook trades`,
                    `Stop Discipline: ${patterns.stopDiscipline} clean stop-outs`,
                    `Trusting Process: ${patterns.trustingProcess} entries kept you on plan`,
                  ].map(p => (
                    <li key={p} style={{ color: '#ddd', fontSize: 12, lineHeight: 1.5 }}>{p}</li>
                  ))}
                </ul>
              </>
            )}
            {hoveredSlice === 'losses' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="20" viewBox="0 0 20 24" fill="none">
                    <circle cx="8" cy="4" r="2.8" stroke="#7a7d88" strokeWidth="1.2" fill="none" />
                    <line x1="8" y1="6.8" x2="8" y2="15" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="9.5" x2="3" y2="13" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="15" x2="4.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="15" x2="11.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
                    <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={red} opacity="0.9" />
                    <line x1="15.5" y1="2" x2="15.5" y2="12" stroke={red} strokeWidth="0.8" />
                  </svg>
                  <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: red, letterSpacing: 1.5 }}>MAJOR PSYCHOLOGICAL ISSUES</div>
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    `Revenge Trading: ${patterns.revengeTrading} trades journaled as revenge`,
                    `Impulse Entries: ${patterns.impulseEntries} entries with no setup`,
                    `FOMO / Chasing: ${patterns.fomoChasing} trades chasing price`,
                    `Ignoring Rules: ${patterns.ignoringRules} trades broke your plan`,
                  ].map(p => (
                    <li key={p} style={{ color: '#ddd', fontSize: 12, lineHeight: 1.5 }}>{p}</li>
                  ))}
                </ul>
              </>
            )}
            {!hoveredSlice && (
              <div style={{ color: '#666', fontSize: 12, fontFamily: fm, textAlign: 'center', paddingTop: 60, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Hover a segment for WickCoach analysis
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ FOUR STAT CARDS ═══ */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Total Trades */}
        <div style={{ flex: 1, minWidth: 200, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Total Trades</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{totals.n.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: '#bbb', marginTop: 6 }}>Win Rate: {fmtPct(totals.winRate)}</div>
          <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 10 }}>
            <div style={{ width: `${(winPct * 100).toFixed(2)}%`, background: teal }} />
            <div style={{ width: `${(lossPct * 100).toFixed(2)}%`, background: red }} />
            <div style={{ width: `${(bePct * 100).toFixed(2)}%`, background: '#4b5563' }} />
          </div>
        </div>

        {/* Process */}
        <div style={{ flex: 1, minWidth: 200, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '20px 24px', borderLeft: `3px solid ${teal}` }}>
          <div style={{ fontSize: 11, color: teal, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Process</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{processSplit.process.n.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: teal, marginTop: 6 }}>Win Rate: {fmtPct(processSplit.process.wr)}</div>
          <div style={{ fontSize: 12, color: teal, marginTop: 4 }}>{fmtR(processSplit.process.rTotal)} total</div>
        </div>

        {/* Impulse */}
        <div style={{ flex: 1, minWidth: 200, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '20px 24px', borderLeft: `3px solid ${red}` }}>
          <div style={{ fontSize: 11, color: red, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Impulse</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{processSplit.impulse.n.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: red, marginTop: 6 }}>Win Rate: {fmtPct(processSplit.impulse.wr)}</div>
          <div style={{ fontSize: 12, color: red, marginTop: 4 }}>{fmtR(processSplit.impulse.rTotal)} total</div>
        </div>

        {/* What If? */}
        <div style={{ flex: 1, minWidth: 200, background: '#141822', border: '1px solid rgba(0,212,160,0.3)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 0 20px rgba(0,212,160,0.08)' }}>
          <div style={{ fontSize: 11, color: teal, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>What If?</div>
          <div style={{ fontSize: 12, color: '#bbb', marginBottom: 8 }}>Your P/L if you only took process trades</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#bbb' }}>Actual P/L</span>
            <span style={{ fontSize: 13, color: '#fff' }}>{fmtDollar(totals.totalPL, true)}</span>
          </div>
          <div style={{ fontFamily: fd, fontSize: 26, fontWeight: 700, color: teal }}>{fmtDollar(whatIfPL, true)}</div>
          {indisciplineCost !== 0 && (
            <div style={{ fontSize: 12, color: red, marginTop: 4 }}>Indiscipline cost you ${Math.abs(indisciplineCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          )}
        </div>
      </div>

      {/* ═══ STRATEGY BREAKDOWN + TICKER PERFORMANCE ═══ */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Strategy Breakdown — visual bars */}
        {(() => {
          const maxTotal = Math.max(...strategies.map(s => Math.abs(s.total)));
          const maxR = Math.max(...strategies.map(s => Math.abs(s.r)), 1.5);
          const visible = showAllStrategies ? strategies : strategies.slice(0, 3);
          return (
            <div style={{ flex: '0 0 60%', minWidth: 300, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '24px 28px', boxSizing: 'border-box' }}>
              <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Strategy breakdown</div>
              <div style={{ fontSize: 13, color: '#aab0bd', marginBottom: 18 }}>Performance by setup type — sorted by total P/L</div>

              {visible.map((s, i) => {
                const winBar = Math.max(0, Math.min(100, s.wr));
                const totalBar = (Math.abs(s.total) / maxTotal) * 100;
                const rBar = (Math.abs(s.r) / maxR) * 100;
                const isBest = i === 0;
                return (
                  <div key={s.name} style={{
                    padding: '14px 16px',
                    background: i % 2 === 0 ? '#1a1f2a' : '#141822',
                    border: '1px solid #2A3143',
                    borderLeft: isBest ? `3px solid ${teal}` : '3px solid #2A3143',
                    borderRadius: 8,
                    marginBottom: 8,
                  }}>
                    {/* Row 1: name + trades + total */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{ fontSize: 14, color: '#fff', fontWeight: 600, flex: 1 }}>{s.name}</div>
                      <div style={{ fontSize: 13, color: '#aab0bd', fontFamily: fm, letterSpacing: 1, fontWeight: 500 }}>{s.trades} TRADES</div>
                      <div style={{ fontSize: 15, color: s.total >= 0 ? teal : red, fontWeight: 700, fontFamily: fd, minWidth: 90, textAlign: 'right' }}>{fmtDollar(s.total)}</div>
                    </div>
                    {/* Row 2: 3 inline bars */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      {/* Win rate */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#aab0bd', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, fontWeight: 500 }}>
                          <span>Win Rate</span>
                          <span style={{ color: s.wr >= 50 ? teal : red, fontWeight: 700 }}>{fmtPct(s.wr)}</span>
                        </div>
                        <div style={{ height: 6, background: '#2A3143', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${winBar}%`, height: '100%', background: s.wr >= 50 ? teal : red, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                      {/* Avg R */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#aab0bd', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, fontWeight: 500 }}>
                          <span>Avg R</span>
                          <span style={{ color: s.r >= 0 ? teal : red, fontWeight: 700 }}>{fmtR(s.r)}</span>
                        </div>
                        <div style={{ height: 6, background: '#2A3143', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${rBar}%`, height: '100%', background: s.r >= 0 ? teal : red, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                      {/* Total P/L share */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#aab0bd', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, fontWeight: 500 }}>
                          <span>Avg P/L</span>
                          <span style={{ color: s.avg >= 0 ? teal : red, fontWeight: 700 }}>{fmtDollar(s.avg, true)}</span>
                        </div>
                        <div style={{ height: 6, background: '#2A3143', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${totalBar}%`, height: '100%', background: s.total >= 0 ? teal : red, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div
                onClick={() => setShowAllStrategies(s => !s)}
                style={{ color: teal, fontSize: 12, cursor: 'pointer', marginTop: 12, textAlign: 'center', fontFamily: fm, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}
              >
                {showAllStrategies ? 'Show less ↑' : `Show all ${strategies.length} ↓`}
              </div>
            </div>
          );
        })()}

        {/* Ticker Performance — horizontal bar ranking with wins/losses toggle */}
        {(() => {
          const source = tickerView === 'wins' ? tickers : tickerLosses;
          const sorted = tickerView === 'wins'
            ? [...source].sort((a, b) => b.pl - a.pl)
            : [...source].sort((a, b) => a.pl - b.pl); // most negative first
          const maxPL = Math.max(...sorted.map(t => Math.abs(t.pl)));
          const visible = showAllTickers ? sorted : sorted.slice(0, 4);
          const subtitle = tickerView === 'wins'
            ? 'Top-profit tickers, sorted by total P/L'
            : 'Worst loss tickers, sorted by total loss';
          return (
            <div style={{ flex: 1, minWidth: 300, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '24px 28px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Ticker performance</div>
                  <div style={{ fontSize: 13, color: '#aab0bd', marginTop: 4 }}>{subtitle}</div>
                </div>
                {/* Wins/Losses toggle */}
                <div style={{ display: 'inline-flex', background: '#0f1318', border: '1px solid #2A3143', borderRadius: 999, padding: 3, flexShrink: 0 }}>
                  <button
                    onClick={() => setTickerView('wins')}
                    style={{
                      padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                      fontFamily: fm, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                      background: tickerView === 'wins' ? teal : 'transparent',
                      color: tickerView === 'wins' ? '#0A0D14' : '#aab0bd',
                      transition: 'all 0.2s ease',
                    }}
                  >Wins</button>
                  <button
                    onClick={() => setTickerView('losses')}
                    style={{
                      padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                      fontFamily: fm, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                      background: tickerView === 'losses' ? red : 'transparent',
                      color: tickerView === 'losses' ? '#fff' : '#aab0bd',
                      transition: 'all 0.2s ease',
                    }}
                  >Losses</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {visible.map((tk) => {
                  const positive = tk.pl >= 0;
                  const barWidth = (Math.abs(tk.pl) / maxPL) * 100;
                  const domain = tickerDomains[tk.t];
                  return (
                    <div key={tk.t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ffffff', padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {domain ? (
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                            alt={tk.t}
                            width={22}
                            height={22}
                            style={{ width: 22, height: 22, objectFit: 'contain', borderRadius: 3 }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span style={{ fontFamily: fd, fontSize: 11, fontWeight: 700, color: tk.color }}>{tk.t.charAt(0)}</span>
                        )}
                      </div>
                      <div style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: '#fff', width: 54, flexShrink: 0 }}>{tk.t}</div>
                      <div style={{ flex: 1, position: 'relative', height: 26, background: '#2A3143', borderRadius: 4, overflow: 'hidden' }}>
                        <div
                          style={{
                            position: 'absolute', top: 0, left: 0, bottom: 0,
                            width: `${barWidth}%`,
                            background: `linear-gradient(to right, ${positive ? 'rgba(0,212,160,0.25)' : 'rgba(255,68,68,0.25)'}, ${positive ? teal : red})`,
                            transition: 'width 0.5s ease',
                          }}
                        />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: fm, letterSpacing: 0.5, fontWeight: 500, textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
                          {tk.trades} trades · {fmtPct(tk.wr)} win
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: positive ? teal : red, fontFamily: fd, width: 86, textAlign: 'right', flexShrink: 0 }}>{fmtDollar(tk.pl)}</div>
                    </div>
                  );
                })}
              </div>

              <div
                onClick={() => setShowAllTickers(s => !s)}
                style={{ color: teal, fontSize: 12, cursor: 'pointer', marginTop: 14, textAlign: 'center', fontFamily: fm, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}
              >
                {showAllTickers ? 'Show less ↑' : `Show all ${source.length} ↓`}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ═══ RULES vs EXECUTION ═══ */}
      <div style={{ background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '28px 32px 32px' }}>

        {/* Header + week dropdown (centered) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, gap: 8 }}>
          <h3 style={{ fontFamily: fd, fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>Rules vs. Execution</h3>
          <p style={{ color: '#888', fontSize: 12, margin: 0 }}>How your trading and psychology compared to the rules you set</p>
          <div style={{ position: 'relative', marginTop: 10 }}>
            <select
              value={selectedWeekIdx}
              onChange={e => setSelectedWeekIdx(parseInt(e.target.value))}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                background: '#1f2430',
                border: '1px solid #2A3143',
                color: '#e8e8f0',
                fontFamily: fm,
                fontSize: 13,
                fontWeight: 600,
                padding: '10px 38px 10px 18px',
                borderRadius: 8,
                cursor: 'pointer',
                letterSpacing: 0.5,
                outline: 'none',
              }}
            >
              {weekBuckets.map((w, i) => (
                <option key={i} value={i} style={{ background: '#1f2430', color: '#e8e8f0' }}>{w.weekLabel}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: teal, pointerEvents: 'none', fontSize: 10 }}>▼</span>
          </div>
        </div>

        {/* Compact goal cards (3) */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {selectedWeek.goals.map((g, idx) => (
            <div key={idx} style={{
              flex: '1 1 240px',
              background: '#1f2430',
              border: '1px solid #2A3143',
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(0,212,160,0.12)',
                border: `1px solid ${teal}`,
                color: teal,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: fd, fontSize: 13, fontWeight: 700,
                flexShrink: 0,
              }}>{idx + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#e8e8f0', fontFamily: fm, fontWeight: 500, lineHeight: 1.35 }}>{g.title}</div>
              </div>
              <span style={{
                background: 'rgba(0,212,160,0.12)', color: teal,
                fontSize: 9.5, letterSpacing: 1.5, fontWeight: 700,
                padding: '3px 8px', borderRadius: 999, fontFamily: fm, flexShrink: 0,
              }}>{g.type}</span>
            </div>
          ))}
        </div>

        {/* Split panel: Trades vs. Goals (blue) | Psych vs. Goals (green) */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

          {/* LEFT — Trades vs. Goals (BLUE) */}
          <div style={{
            flex: '1 1 320px',
            background: '#12151d',
            border: '1px solid #2A3143',
            borderLeft: `3px solid ${blue}`,
            borderRadius: 10,
            padding: '20px 22px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, background: blue, borderRadius: 2, display: 'inline-block' }} />
              <h4 style={{ fontFamily: fd, fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: 0.5 }}>Trades vs. Goals</h4>
            </div>
            <p style={{ color: '#888', fontSize: 11.5, margin: '0 0 18px', letterSpacing: 0.3 }}>Actual trading activity measured against the rules</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedWeek.goals.map((g, i) => {
                const pct = Math.round((g.trades.actual / g.trades.target) * 100);
                const clamped = Math.min(100, pct);
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5, color: '#d0d0d8', fontFamily: fm, fontWeight: 500 }}>#{i + 1} · {g.trades.unitLabel}</span>
                      <span style={{ fontSize: 12, color: blue, fontFamily: fd, fontWeight: 700 }}>{g.trades.actual}<span style={{ color: '#666' }}> / {g.trades.target}</span></span>
                    </div>
                    <div style={{ position: 'relative', height: 8, background: '#2A3143', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${clamped}%`,
                        height: '100%',
                        background: `linear-gradient(to right, rgba(74,158,255,0.4), ${blue})`,
                        boxShadow: `0 0 8px rgba(74,158,255,0.4)`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: '#888', marginTop: 4, letterSpacing: 0.3 }}>{pct}% compliance</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Psych vs. Goals (GREEN) */}
          <div style={{
            flex: '1 1 320px',
            background: '#12151d',
            border: '1px solid #2A3143',
            borderLeft: `3px solid ${teal}`,
            borderRadius: 10,
            padding: '20px 22px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, background: teal, borderRadius: 2, display: 'inline-block' }} />
              <h4 style={{ fontFamily: fd, fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: 0.5 }}>Psych vs. Goals</h4>
            </div>
            <p style={{ color: '#888', fontSize: 11.5, margin: '0 0 18px', letterSpacing: 0.3 }}>Psychological alignment with the rules — from journal & tags</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedWeek.goals.map((g, i) => {
                const pct = Math.round((g.psych.actual / g.psych.target) * 100);
                const clamped = Math.min(100, pct);
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5, color: '#d0d0d8', fontFamily: fm, fontWeight: 500 }}>#{i + 1} · {g.psych.unitLabel}</span>
                      <span style={{ fontSize: 12, color: teal, fontFamily: fd, fontWeight: 700 }}>{g.psych.actual}<span style={{ color: '#666' }}> / {g.psych.target}</span></span>
                    </div>
                    <div style={{ position: 'relative', height: 8, background: '#2A3143', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${clamped}%`,
                        height: '100%',
                        background: `linear-gradient(to right, rgba(0,212,160,0.4), ${teal})`,
                        boxShadow: `0 0 8px rgba(0,212,160,0.4)`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: '#888', marginTop: 4, letterSpacing: 0.3 }}>{pct}% alignment</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TIME-OF-DAY PERFORMANCE ═══ */}
      <div style={{ background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Time-of-day performance</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>When your edge is sharpest — and when it bleeds</div>
          </div>
          <div style={{ display: 'flex', background: '#141822', borderRadius: 8, padding: 3, gap: 2 }}>
            {(['timeline', 'best', 'worst'] as const).map(mode => {
              const active = heatmapMode === mode;
              const label = mode === 'timeline' ? 'Timeline' : mode === 'best' ? 'Best hours' : 'Worst hours';
              const bg = active ? (mode === 'timeline' ? '#2a2b32' : mode === 'best' ? teal : red) : 'transparent';
              const color = active ? (mode === 'best' ? '#0A0D14' : '#fff') : '#999';
              return (
                <button key={mode} onClick={() => setHeatmapMode(mode)} style={{
                  padding: '6px 16px', borderRadius: 6, fontSize: 12, fontFamily: fm, cursor: 'pointer', border: 'none',
                  background: bg, color, fontWeight: active ? 700 : 400, transition: 'all 0.2s',
                }}>{label}</button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {sortedHours.map(d => {
            const opacity = 0.15 + (Math.abs(d.pl) / maxAbsHourPL) * 0.35;
            const bg = heatmapMode === 'best'
              ? `rgba(0,212,160,${opacity.toFixed(2)})`
              : heatmapMode === 'worst'
                ? `rgba(255,68,68,${opacity.toFixed(2)})`
                : d.pl >= 0 ? `rgba(0,212,160,${opacity.toFixed(2)})` : `rgba(255,68,68,${opacity.toFixed(2)})`;
            return (
              <div key={d.h} style={{
                flex: 1, height: 75, borderRadius: 8, background: bg,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              }}>
                <span style={{ fontSize: 12, color: '#ccc' }}>{d.h}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: fd }}>{fmtDollar(d.pl)}</span>
                <span style={{ fontSize: 11, color: '#999' }}>{d.count} trades</span>
              </div>
            );
          })}
        </div>

        {heatmapMode === 'timeline' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: '0 4px' }}>
            <span style={{ color: teal, fontSize: 11, letterSpacing: '1px' }}>OPEN</span>
            <span style={{ color: '#999', fontSize: 11, letterSpacing: '1px' }}>MIDDAY</span>
            <span style={{ color: '#ffb400', fontSize: 11, letterSpacing: '1px' }}>CLOSE</span>
          </div>
        )}

        <div style={{ fontSize: 13, color: '#bbb', marginTop: 14 }}>
          Best hour: <span style={{ color: teal }}>{bestHour.h} ({fmtDollar(bestHour.pl)})</span>
          {' · '}
          Worst hour: <span style={{ color: red }}>{worstHour.h} ({fmtDollar(worstHour.pl)})</span>
        </div>
      </div>

      {/* ═══ ANALYSIS AI CHAT WIDGET ═══ */}
      <AIChatWidget
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        messages={aiMessages}
        input={aiInput}
        setInput={setAiInput}
        onSend={sendToCoach}
        loading={aiLoading}
        welcomeMsg={analysisWelcome}
      />
    </div>
  );
}

