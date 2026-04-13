'use client';
import React, { useState } from 'react';
import { fm, fd } from './shared';

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

// ─── Component ────────────────────────────────────────────────
export default function AnalysisContent() {
  const [heatmapMode, setHeatmapMode] = useState<'timeline' | 'best' | 'worst'>('timeline');

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
    <div style={{ background: '#131318', padding: '32px 40px', minHeight: '100vh', fontFamily: fm, display: 'flex', flexDirection: 'column', gap: 32, overflowX: 'hidden' }}>

      {/* ═══ HEADER ═══ */}
      <div>
        <h2 style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>Analysis</h2>
        <p style={{ color: '#bbb', fontSize: 14, margin: '6px 0 0' }}>Behavioral pattern recognition across your trade history.</p>
        <p style={{ color: '#999', fontSize: 12, margin: '4px 0 0' }}>200 executions analyzed</p>
      </div>

      {/* ═══ FOUR STAT CARDS ═══ */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Total Trades */}
        <div style={{ flex: 1, minWidth: 200, background: '#1a1c23', border: '1px solid #2a2d38', borderRadius: 12, padding: '20px 24px' }}>
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
        <div style={{ flex: 1, minWidth: 200, background: '#1a1c23', border: '1px solid #2a2d38', borderRadius: 12, padding: '20px 24px', borderLeft: `3px solid ${teal}` }}>
          <div style={{ fontSize: 11, color: teal, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Process</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>137</div>
          <div style={{ fontSize: 13, color: teal, marginTop: 6 }}>Win Rate: 61.3%</div>
          <div style={{ fontSize: 12, color: teal, marginTop: 4 }}>+150.9R total</div>
        </div>

        {/* Impulse */}
        <div style={{ flex: 1, minWidth: 200, background: '#1a1c23', border: '1px solid #2a2d38', borderRadius: 12, padding: '20px 24px', borderLeft: `3px solid ${red}` }}>
          <div style={{ fontSize: 11, color: red, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Impulse</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>63</div>
          <div style={{ fontSize: 13, color: red, marginTop: 6 }}>Win Rate: 12.7%</div>
          <div style={{ fontSize: 12, color: red, marginTop: 4 }}>-31.3R total</div>
        </div>

        {/* What If? */}
        <div style={{ flex: 1, minWidth: 200, background: '#1a1c23', border: '1px solid rgba(0,212,160,0.3)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 0 20px rgba(0,212,160,0.08)' }}>
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
        {/* Strategy Breakdown */}
        <div style={{ flex: '0 0 60%', minWidth: 300, background: '#1a1c23', border: '1px solid #2a2d38', borderRadius: 12, padding: '24px 28px', boxSizing: 'border-box' }}>
          <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Strategy breakdown</div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>Performance by setup type</div>

          {/* Header row */}
          <div style={{ display: 'flex', borderBottom: '1px solid #2a2d38', padding: '12px 16px' }}>
            <div style={{ flex: 2, fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>Strategy</div>
            <div style={{ flex: 1, fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Trades</div>
            <div style={{ flex: 1, fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Win Rate</div>
            <div style={{ flex: 1, fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Avg P/L</div>
            <div style={{ flex: 1, fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Total P/L</div>
            <div style={{ flex: 1, fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Avg R</div>
          </div>

          {strategies.map((s, i) => {
            const isTop = i === 0;
            const isBottom = i === strategies.length - 1;
            return (
              <div key={s.name} style={{
                display: 'flex', padding: '12px 16px',
                borderBottom: '1px solid #2a2d38',
                background: i % 2 === 0 ? '#1a1c23' : '#1e2029',
                borderLeft: isTop ? `3px solid ${teal}` : isBottom ? `3px solid ${red}` : '3px solid transparent',
              }}>
                <div style={{ flex: 2, fontSize: 14, color: '#fff' }}>{s.name}</div>
                <div style={{ flex: 1, fontSize: 13, color: '#bbb', textAlign: 'right' }}>{s.trades}</div>
                <div style={{ flex: 1, fontSize: 14, color: s.wr >= 50 ? teal : red, textAlign: 'right' }}>{fmtPct(s.wr)}</div>
                <div style={{ flex: 1, fontSize: 13, color: s.avg >= 0 ? teal : red, textAlign: 'right' }}>{fmtDollar(s.avg, true)}</div>
                <div style={{ flex: 1, fontSize: 14, color: s.total >= 0 ? teal : red, textAlign: 'right', fontWeight: 700 }}>{fmtDollar(s.total)}</div>
                <div style={{ flex: 1, fontSize: 13, color: s.r >= 0 ? teal : red, textAlign: 'right' }}>{fmtR(s.r)}</div>
              </div>
            );
          })}
          <div style={{ color: teal, fontSize: 12, cursor: 'pointer', marginTop: 12, textAlign: 'center' }}>Show all ↓</div>
        </div>

        {/* Ticker Performance */}
        <div style={{ flex: 1, minWidth: 300, background: '#1a1c23', border: '1px solid #2a2d38', borderRadius: 12, padding: '24px 28px', boxSizing: 'border-box' }}>
          <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Ticker performance</div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>P/L by asset</div>

          {tickers.map((tk, i, arr) => {
            const positive = tk.pl >= 0;
            return (
              <div
                key={tk.t}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px',
                  borderBottom: i < arr.length - 1 ? '1px solid #2a2d38' : 'none',
                  borderLeft: `3px solid ${positive ? teal : red}`,
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 6, background: tk.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: fd, fontSize: 12, fontWeight: 700, color: '#fff' }}>{tk.t.charAt(0)}</span>
                </div>
                <div style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: '#fff', width: 50, flexShrink: 0 }}>{tk.t}</div>
                <div style={{ fontSize: 12, color: '#999', flex: 1 }}>{tk.trades} trades · {fmtPct(tk.wr)} win</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: positive ? teal : red, textAlign: 'right', flexShrink: 0 }}>{fmtDollar(tk.pl)}</div>
              </div>
            );
          })}
          <div style={{ color: teal, fontSize: 12, cursor: 'pointer', marginTop: 12, textAlign: 'center' }}>Show all ↓</div>
        </div>
      </div>

      {/* ═══ WICKCOACH OBSERVATIONS BOARD ═══ */}
      <div style={{ background: '#1a1c23', border: '1px solid #2a2d38', borderRadius: 12, padding: '32px 0 24px', position: 'relative' }}>

        {/* Board-level header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 40px 24px' }}>
          <div>
            <h3 style={{ fontFamily: fd, fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>WickCoach observations</h3>
            <p style={{ color: '#888', fontSize: 12, margin: '6px 0 0' }}>AI-detected behavioral themes vs your stated goals</p>
          </div>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: '1px solid #2a2d38', borderRadius: 6, padding: 4, gap: 2 }}>
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
              background: `radial-gradient(circle at center, #1a1c23 58%, transparent 59%), conic-gradient(${teal} 0% 61%, #3e4252 61% 100%)`,
              boxShadow: 'inset 0 0 20px rgba(0,212,160,0.1), 0 0 30px rgba(0,0,0,0.5)',
            }}>
              <span style={{ fontFamily: fd, fontWeight: 700, fontSize: 32, color: '#fff' }}>61</span>
            </div>
            <span style={{ color: '#888', fontSize: 11, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1, background: '#1a1c23', padding: '2px 8px', borderRadius: 4 }}>Psychology Score</span>
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
              <div style={{ width: 180, height: 6, background: '#2a2d38', borderRadius: 3, marginTop: 8, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
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
              <div style={{ width: 180, height: 6, background: '#2a2d38', borderRadius: 3, marginTop: 8, overflow: 'hidden', display: 'flex' }}>
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
      <div style={{ background: '#1a1c23', border: '1px solid #2a2d38', borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Time-of-day performance</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>When your edge is sharpest — and when it bleeds</div>
          </div>
          <div style={{ display: 'flex', background: '#131318', borderRadius: 8, padding: 3, gap: 2 }}>
            {(['timeline', 'best', 'worst'] as const).map(mode => {
              const active = heatmapMode === mode;
              const label = mode === 'timeline' ? 'Timeline' : mode === 'best' ? 'Best hours' : 'Worst hours';
              const bg = active ? (mode === 'timeline' ? '#2a2b32' : mode === 'best' ? teal : red) : 'transparent';
              const color = active ? (mode === 'best' ? '#0e0f14' : '#fff') : '#999';
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
    </div>
  );
}

