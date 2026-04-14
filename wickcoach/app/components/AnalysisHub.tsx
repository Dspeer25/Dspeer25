'use client';
import React, { useState } from 'react';
import { fm, fd } from './shared';
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

const hours = [
  { h: '9-10AM', pl: 18500, count: 45 },
  { h: '10-11AM', pl: 13006, count: 38 },
  { h: '11-12PM', pl: 9781, count: 28 },
  { h: '12-1PM', pl: 2176, count: 22 },
  { h: '1-2PM', pl: 7653, count: 30 },
  { h: '2-3PM', pl: 5726, count: 25 },
  { h: '3-4PM', pl: 3124, count: 18 },
];

interface PatternRow {
  friction: { name: string; trades: string; pct: number };
  middle: React.ReactNode;
  momentum: { name: string; trades: string; pct: number };
}

const patternRows: PatternRow[] = [
  {
    friction: { name: 'Ignoring Rules', trades: '19 trades', pct: 56 },
    middle: <><strong style={{ color: '#fff' }}>+0.5R</strong> vs <strong style={{ color: teal }}>+1.1R</strong> expectancy gap</>,
    momentum: { name: 'Patience', trades: '39 trades · 56% win rate when you wait', pct: 68 },
  },
  {
    friction: { name: 'Impulse Entries', trades: '16 trades', pct: 34 },
    middle: <><strong style={{ color: red }}>19%</strong> win rate vs <strong style={{ color: '#fff' }}>61%</strong> patient</>,
    momentum: { name: 'Clean Execution', trades: '31 trades · Avg +1.6R per textbook trade', pct: 66 },
  },
  {
    friction: { name: 'Revenge Trading', trades: '15 trades', pct: 50 },
    middle: <>Cost you <strong style={{ color: red }}>+$35.90</strong> this window</>,
    momentum: { name: 'Stop Discipline', trades: '15 trades · Clean losses avg $492', pct: 50 },
  },
  {
    friction: { name: 'FOMO / Chasing', trades: '12 trades', pct: 46 },
    middle: <>Win rate drops to <strong style={{ color: red }}>0%</strong> when chasing</>,
    momentum: { name: 'Trusting Process', trades: '14 trades · 14 entries, resilience building', pct: 54 },
  },
];

const timeframes = ['5', '10', '15', '30', '50', '100', 'All'];

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
export default function AnalysisContent() {
  const [heatmapMode, setHeatmapMode] = useState<'timeline' | 'best' | 'worst'>('timeline');
  const [showAllStrategies, setShowAllStrategies] = useState(false);
  const [showAllTickers, setShowAllTickers] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState<'wins' | 'losses' | null>(null);

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
      const analysisContext =
        '200 total trades. 92 wins, 80 losses, 28 breakeven. Total P/L +$58,532. Process trades 137 (61.3% WR, +150.9R). Impulse 63 (12.7% WR, -31.3R). ' +
        'Strategies by P/L: 0DTE Call 60 trades 46.7% WR +$19,550 +0.7R; 0DTE Put 54 42.6% +$13,341 +0.5R; Call Debit Spread 18 61.1% +$8,891 +1.0R; Put Debit Spread 19 52.6% +$6,763 +0.7R; Call Scalp 16 56.3% +$6,339 +0.8R; Put Scalp 8 50% +$3,897 +1.0R. ' +
        'Tickers by P/L: V +$10,391 (14t 78.6%); META +$6,288 (9t 77.8%); NVDA +$6,129 (14t 50%); AMD +$5,929 (11t 54.5%); BA +$5,018 (9t 66.7%); MSFT +$5,805 (17t 47.1%); JPM +$4,200 (8t 62.5%); DIS +$3,450 (6t 50%). ' +
        'Hourly: 9-10AM +$18,500 (45t); 10-11AM +$13,006; 11-12PM +$9,781; 12-1PM +$2,176; 1-2PM +$7,653; 2-3PM +$5,726; 3-4PM +$3,124. ' +
        'Psychology patterns: Ignoring Rules 19t (+0.5R vs +1.1R gap); Impulse Entries 16t (19% WR vs 61% patient); Revenge Trading 15t (cost $35.90); FOMO/Chasing 12t (0% WR); Patience 39t (56% WR when waiting); Clean Execution 31t (+1.6R); Stop Discipline 15t; Trusting Process 14t.';
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

  const rowGrad = 'linear-gradient(90deg, rgba(255,68,68,0.03) 0%, rgba(26,28,35,1) 40%, rgba(26,28,35,1) 60%, rgba(0,212,160,0.03) 100%)';

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

        {/* Ticker Performance — horizontal bar ranking */}
        {(() => {
          const sorted = [...tickers].sort((a, b) => b.pl - a.pl);
          const maxPL = Math.max(...sorted.map(t => Math.abs(t.pl)));
          const visible = showAllTickers ? sorted : sorted.slice(0, 4);
          return (
            <div style={{ flex: 1, minWidth: 300, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '24px 28px', boxSizing: 'border-box' }}>
              <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Ticker performance</div>
              <div style={{ fontSize: 13, color: '#aab0bd', marginBottom: 18 }}>P/L ranking across your tickers</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {visible.map((tk) => {
                  const positive = tk.pl >= 0;
                  const barWidth = (Math.abs(tk.pl) / maxPL) * 100;
                  return (
                    <div key={tk.t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: tk.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: fd, fontSize: 12, fontWeight: 700, color: '#fff' }}>{tk.t.charAt(0)}</span>
                      </div>
                      <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: '#fff', width: 50, flexShrink: 0 }}>{tk.t}</div>
                      <div style={{ flex: 1, position: 'relative', height: 24, background: '#2A3143', borderRadius: 4, overflow: 'hidden' }}>
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
                      <div style={{ fontSize: 13, fontWeight: 700, color: positive ? teal : red, fontFamily: fd, width: 80, textAlign: 'right', flexShrink: 0 }}>{fmtDollar(tk.pl)}</div>
                    </div>
                  );
                })}
              </div>

              <div
                onClick={() => setShowAllTickers(s => !s)}
                style={{ color: teal, fontSize: 12, cursor: 'pointer', marginTop: 14, textAlign: 'center', fontFamily: fm, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}
              >
                {showAllTickers ? 'Show less ↑' : `Show all ${tickers.length} ↓`}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ═══ WICKCOACH OBSERVATIONS BOARD ═══ */}
      <div style={{ background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '32px 0 24px', position: 'relative' }}>

        {/* Board-level header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 40px 24px' }}>
          <div>
            <h3 style={{ fontFamily: fd, fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>WickCoach observations</h3>
            <p style={{ color: '#888', fontSize: 12, margin: '6px 0 0' }}>AI-detected behavioral themes vs your stated goals</p>
          </div>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: '1px solid #2A3143', borderRadius: 6, padding: 4, gap: 2 }}>
            {timeframes.map(t => {
              const active = t === 'All';
              return (
                <span key={t} style={{
                  color: active ? '#fff' : '#888',
                  background: active ? '#3e4252' : 'transparent',
                  fontSize: 12, padding: '4px 12px', cursor: 'pointer', borderRadius: 4,
                  fontWeight: active ? 500 : 400,
                }}>{t}</span>
              );
            })}
          </div>
        </div>

        {/* Center axis line */}
        <div style={{ position: 'absolute', top: 80, bottom: 0, left: '50%', width: 1, background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />

        {/* Friction / Score / Momentum row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 60px', marginBottom: 32, position: 'relative', zIndex: 2 }}>
          <div style={{ flex: 1, textAlign: 'right', paddingRight: 80 }}>
            <span style={{ color: red, fontFamily: fd, fontWeight: 700, fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>Friction</span>
            <div style={{ height: 2, width: 60, background: red, marginLeft: 'auto', marginTop: 8, opacity: 0.5 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
              background: `radial-gradient(circle at center, #141822 58%, transparent 59%), conic-gradient(${teal} 0% 61%, #3e4252 61% 100%)`,
              boxShadow: 'inset 0 0 20px rgba(0,212,160,0.1), 0 0 30px rgba(0,0,0,0.5)',
            }}>
              <span style={{ fontFamily: fd, fontWeight: 700, fontSize: 32, color: '#fff' }}>61</span>
            </div>
            <span style={{ color: '#888', fontSize: 11, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1, background: '#141822', padding: '2px 8px', borderRadius: 4 }}>Psychology Score</span>
          </div>

          <div style={{ flex: 1, textAlign: 'left', paddingLeft: 80 }}>
            <span style={{ color: teal, fontFamily: fd, fontWeight: 700, fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>Momentum</span>
            <div style={{ height: 2, width: 60, background: teal, marginTop: 8, opacity: 0.5 }} />
          </div>
        </div>

        {/* Pattern rows */}
        {patternRows.map((row, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', minHeight: 80,
            padding: '16px 40px', position: 'relative', zIndex: 2,
            background: rowGrad,
            borderBottom: i < patternRows.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
          }}>
            {/* Friction side */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: 48 }}>
              <span style={{ color: red, fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{row.friction.name}</span>
              <span style={{ color: '#888', fontSize: 12 }}>{row.friction.trades}</span>
              <div style={{ width: 180, height: 6, background: '#2A3143', borderRadius: 3, marginTop: 8, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: `${row.friction.pct}%`, background: red, height: '100%' }} />
              </div>
            </div>

            {/* Middle callout */}
            <div style={{ width: 280, background: '#23252e', border: '1px solid #333642', borderRadius: 6, padding: '10px 16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <p style={{ color: '#bbb', fontSize: 12, margin: 0 }}>{row.middle}</p>
            </div>

            {/* Momentum side with white wick */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: 48 }}>
              <span style={{ color: teal, fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{row.momentum.name}</span>
              <span style={{ color: '#888', fontSize: 12 }}>{row.momentum.trades}</span>
              <div style={{ width: 180, height: 6, background: '#2A3143', borderRadius: 3, marginTop: 8, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${row.momentum.pct}%`, background: teal, height: '100%' }} />
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', height: '100%' }} />
              </div>
            </div>
          </div>
        ))}

        {/* Goals relation inside the board */}
        <div style={{ padding: '20px 40px 0', marginTop: 8 }}>
          <h4 style={{ fontFamily: fd, fontSize: 16, color: '#fff', margin: '0 0 12px' }}>How these patterns relate to your goals</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${teal}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: teal, flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <span style={{ color: '#ccc', fontSize: 13, letterSpacing: 0.5 }}>LET TRADES BREATHE 3+ WHEN AT BREAK-EVEN</span>
            <span style={{ marginLeft: 'auto', background: 'rgba(0,212,160,0.1)', color: teal, padding: '4px 10px', borderRadius: 4, fontSize: 11 }}>On track</span>
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

