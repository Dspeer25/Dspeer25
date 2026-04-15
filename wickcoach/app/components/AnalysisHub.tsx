'use client';
import React, { useState } from 'react';
import { fm, fd, Trade, buildTraderStats } from './shared';
import AIChatWidget from './AIChatWidget';

const teal = '#00d4a0';
const red = '#ff4444';

// ─── Static data ──────────────────────────────────────────────
const strategies = [
  { name: '0DTE Call', trades: 60, wr: 46.7, avg: 325.84, total: 19550, r: 0.7 },
  { name: '0DTE Put', trades: 54, wr: 42.6, avg: 247.07, total: 13341, r: 0.5 },
  { name: 'Call Debit Spread', trades: 18, wr: 61.1, avg: 493.94, total: 8891, r: 1.0 },
  { name: 'Put Debit Spread', trades: 19, wr: 52.6, avg: 355.96, total: 6763, r: 0.7 },
  { name: 'Call Scalp', trades: 16, wr: 56.3, avg: 396.17, total: 6339, r: 0.8 },
  { name: 'Put Scalp', trades: 8, wr: 50.0, avg: 487.08, total: 3897, r: 1.0 },
];

const tickerDomains: Record<string, string> = {
  V: 'visa.com', META: 'meta.com', NVDA: 'nvidia.com', AMD: 'amd.com',
  BA: 'boeing.com', MSFT: 'microsoft.com', JPM: 'jpmorganchase.com',
  DIS: 'disney.com', NFLX: 'netflix.com', TSLA: 'tesla.com', AAPL: 'apple.com',
  GOOGL: 'google.com', GOOG: 'google.com', AMZN: 'amazon.com', COIN: 'coinbase.com',
  PLTR: 'palantir.com', CRM: 'salesforce.com', COST: 'costco.com', HD: 'homedepot.com',
};

const tickers = [
  { t: 'V', color: '#1a1f71', trades: 14, wr: 78.6, pl: 10391 },
  { t: 'META', color: '#0668E1', trades: 9, wr: 77.8, pl: 6288 },
  { t: 'NVDA', color: '#76b900', trades: 14, wr: 50.0, pl: 6129 },
  { t: 'AMD', color: '#ed1c24', trades: 11, wr: 54.5, pl: 5929 },
  { t: 'BA', color: '#0039a6', trades: 9, wr: 66.7, pl: 5018 },
  { t: 'MSFT', color: '#00a4ef', trades: 17, wr: 47.1, pl: 5805 },
  { t: 'JPM', color: '#006cb7', trades: 8, wr: 62.5, pl: 4200 },
  { t: 'DIS', color: '#113ccf', trades: 6, wr: 50.0, pl: 3450 },
];

// Loss performance — ticker-level losses (different subset/sort than wins)
const tickerLosses = [
  { t: 'DIS', color: '#113ccf', trades: 4, wr: 25.0, pl: -2847 },
  { t: 'NFLX', color: '#e50914', trades: 5, wr: 20.0, pl: -1923 },
  { t: 'BA', color: '#0039a6', trades: 3, wr: 0.0, pl: -1580 },
  { t: 'META', color: '#0668E1', trades: 2, wr: 0.0, pl: -1245 },
  { t: 'AMD', color: '#ed1c24', trades: 5, wr: 40.0, pl: -987 },
  { t: 'MSFT', color: '#00a4ef', trades: 9, wr: 22.2, pl: -876 },
  { t: 'TSLA', color: '#cc0000', trades: 4, wr: 25.0, pl: -712 },
  { t: 'AAPL', color: '#555555', trades: 3, wr: 33.3, pl: -430 },
];

const hours = [
  { h: '9-10AM', pl: 18500, count: 45 },
  { h: '10-11AM', pl: 13006, count: 38 },
  { h: '11-12PM', pl: 9781, count: 28 },
  { h: '12-1PM', pl: 2176, count: 22 },
  { h: '1-2PM', pl: 7653, count: 30 },
  { h: '2-3PM', pl: 5726, count: 25 },
  { h: '3-4PM', pl: 3124, count: 18 },
];

// Blue used by "Trades vs. Goals" sliders — complementary to the teal
const blue = '#4a9eff';

// ─── Weekly goals snapshot — mock per-week data ───────────────
interface WeeklyGoalSnapshot {
  weekLabel: string;      // e.g. "Apr 6 – Apr 12, 2026"
  goals: {
    title: string;
    type: string;         // PATIENCE, DISCIPLINE, TIMING, RISK, etc.
    trades: { actual: number; target: number; unitLabel: string };  // for blue slider
    psych: { actual: number; target: number; unitLabel: string };   // for green slider
  }[];
}

const weekHistory: WeeklyGoalSnapshot[] = [
  {
    weekLabel: 'Apr 6 – Apr 12, 2026',
    goals: [
      { title: 'Let trades breathe 3+ min at break-even', type: 'PATIENCE',
        trades: { actual: 14, target: 15, unitLabel: 'held 3+ min' },
        psych:  { actual: 8,  target: 10, unitLabel: 'journal entries mentioning patience' } },
      { title: 'Max 3 trades per day',                   type: 'DISCIPLINE',
        trades: { actual: 11, target: 15, unitLabel: 'days under cap' },
        psych:  { actual: 9,  target: 12, unitLabel: 'sessions rated "controlled"' } },
      { title: 'No trades before 10:15 AM ET',           type: 'TIMING',
        trades: { actual: 17, target: 20, unitLabel: 'open avoided' },
        psych:  { actual: 12, target: 15, unitLabel: 'waited for confirmation' } },
    ],
  },
  {
    weekLabel: 'Mar 30 – Apr 5, 2026',
    goals: [
      { title: 'Cap risk at 1R per trade',               type: 'RISK',
        trades: { actual: 18, target: 22, unitLabel: 'trades within 1R' },
        psych:  { actual: 14, target: 18, unitLabel: 'size plans logged' } },
      { title: 'Journal every loss',                     type: 'DISCIPLINE',
        trades: { actual: 7,  target: 9,  unitLabel: 'losses journaled' },
        psych:  { actual: 7,  target: 9,  unitLabel: 'reflections written' } },
      { title: 'No revenge re-entry after stop-out',     type: 'PATIENCE',
        trades: { actual: 12, target: 13, unitLabel: 'clean stops held' },
        psych:  { actual: 10, target: 13, unitLabel: 'stop-outs accepted' } },
    ],
  },
  {
    weekLabel: 'Mar 23 – Mar 29, 2026',
    goals: [
      { title: 'Only trade A+ setups',                   type: 'DISCIPLINE',
        trades: { actual: 16, target: 20, unitLabel: 'setups graded A+' },
        psych:  { actual: 11, target: 15, unitLabel: 'grades logged pre-entry' } },
      { title: 'Scale out in thirds',                    type: 'EXECUTION',
        trades: { actual: 9,  target: 12, unitLabel: 'trades scaled' },
        psych:  { actual: 8,  target: 12, unitLabel: 'exit plans pre-committed' } },
      { title: 'Stop trading after 2 losses',            type: 'RISK',
        trades: { actual: 4,  target: 5,  unitLabel: 'hard-stop days' },
        psych:  { actual: 4,  target: 5,  unitLabel: 'checks-in after 2nd loss' } },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────
const fmtDollar = (n: number, withCents = false) => {
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  if (withCents) return sign + '$' + abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return sign + '$' + abs.toLocaleString();
};
const fmtR = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1) + 'R';
const fmtPct = (n: number) => n.toFixed(1) + '%';

// Pinwheel hover data — static for mock
const winsCopy = {
  title: 'MAJOR PSYCHOLOGICAL WINS',
  points: [
    'Patience: 39 trades with a 56% win rate when you wait for setup',
    'Clean Execution: +1.6R average on 31 textbook trades',
    'Stop Discipline: clean exits avg $492 — you honor your stops',
    'Trusting the Process: 14 entries show building resilience',
  ],
};
const issuesCopy = {
  title: 'MAJOR PSYCHOLOGICAL ISSUES',
  points: [
    'Revenge Trading: 15 trades costing +$35.90 this window',
    'Impulse Entries: 19% win rate vs 61% when patient',
    'FOMO / Chasing: win rate drops to 0% when chasing',
    'Ignoring Rules: +0.5R vs +1.1R expectancy gap',
  ],
};

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

  const analysisWelcome =
    "I've analyzed your 200 executions. Here's what the data is telling me:\n\n" +
    "• Your edge: **Patience setups** — 56% win rate when you wait 3+ minutes after opening range, vs 19% on impulse entries. That one pattern alone explains most of your profit.\n\n" +
    "• Your leak: **Revenge trading** — 15 trades cost you $35.90 and dragged your expectancy from +1.1R to +0.5R. It's concentrated in the 12–1PM slot where your edge is weakest.\n\n" +
    "• **0DTE Calls** carry your book (+$19.5K on 60 trades, 46.7% WR, +0.7R avg). **0DTE Puts** trail (+$13.3K, 42.6% WR).\n\n" +
    "• Ticker concentration: **V**, **META**, **NVDA** and **AMD** generate 54% of your P/L across just 48 trades. The rest of your watchlist is noise.\n\n" +
    "What would you like to dig into? I can slice this by session, by setup, or by the emotional state you logged in the journal.";

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

  // Pinwheel data
  const totalTrades = 200;
  const wins = 92;
  const losses = 80;
  const be = totalTrades - wins - losses;
  const winPct = wins / totalTrades;
  const lossPct = losses / totalTrades;
  const bePct = be / totalTrades;
  const circ = 2 * Math.PI * 40; // r=40

  const maxAbsHourPL = Math.max(...hours.map(h => Math.abs(h.pl)));
  const sortedHours = heatmapMode === 'best'
    ? [...hours].sort((a, b) => b.pl - a.pl)
    : heatmapMode === 'worst'
      ? [...hours].sort((a, b) => a.pl - b.pl)
      : hours;
  const bestHour = [...hours].sort((a, b) => b.pl - a.pl)[0];
  const worstHour = [...hours].sort((a, b) => a.pl - b.pl)[0];

  const selectedWeek = weekHistory[selectedWeekIdx];

  return (
    <div style={{ background: 'transparent', padding: '32px 40px', minHeight: '100vh', fontFamily: fm, display: 'flex', flexDirection: 'column', gap: 32, overflowX: 'hidden' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>Analysis</h2>
          <p style={{ color: '#bbb', fontSize: 14, margin: '6px 0 0' }}>Behavioral pattern recognition across your trade history.</p>
          <p style={{ color: '#999', fontSize: 12, margin: '4px 0 0' }}>200 executions analyzed</p>
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
                  <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: teal, letterSpacing: 1.5 }}>{winsCopy.title}</div>
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {winsCopy.points.map(p => (
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
                  <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: red, letterSpacing: 1.5 }}>{issuesCopy.title}</div>
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {issuesCopy.points.map(p => (
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
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>200</div>
          <div style={{ fontSize: 13, color: '#bbb', marginTop: 6 }}>Win Rate: 46.0%</div>
          <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 10 }}>
            <div style={{ width: '46%', background: teal }} />
            <div style={{ width: '40%', background: red }} />
            <div style={{ width: '14%', background: '#4b5563' }} />
          </div>
        </div>

        {/* Process */}
        <div style={{ flex: 1, minWidth: 200, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '20px 24px', borderLeft: `3px solid ${teal}` }}>
          <div style={{ fontSize: 11, color: teal, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Process</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>137</div>
          <div style={{ fontSize: 13, color: teal, marginTop: 6 }}>Win Rate: 61.3%</div>
          <div style={{ fontSize: 12, color: teal, marginTop: 4 }}>+150.9R total</div>
        </div>

        {/* Impulse */}
        <div style={{ flex: 1, minWidth: 200, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '20px 24px', borderLeft: `3px solid ${red}` }}>
          <div style={{ fontSize: 11, color: red, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Impulse</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>63</div>
          <div style={{ fontSize: 13, color: red, marginTop: 6 }}>Win Rate: 12.7%</div>
          <div style={{ fontSize: 12, color: red, marginTop: 4 }}>-31.3R total</div>
        </div>

        {/* What If? */}
        <div style={{ flex: 1, minWidth: 200, background: '#141822', border: '1px solid rgba(0,212,160,0.3)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 0 20px rgba(0,212,160,0.08)' }}>
          <div style={{ fontSize: 11, color: teal, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>What If?</div>
          <div style={{ fontSize: 12, color: '#bbb', marginBottom: 8 }}>Your P/L if you only took process trades</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#bbb' }}>Actual P/L</span>
            <span style={{ fontSize: 13, color: '#fff' }}>+$58,532.00</span>
          </div>
          <div style={{ fontFamily: fd, fontSize: 26, fontWeight: 700, color: teal }}>+$74,791.90</div>
          <div style={{ fontSize: 12, color: red, marginTop: 4 }}>Indiscipline cost you $16,259.10</div>
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
              {weekHistory.map((w, i) => (
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

