'use client';

import { useState, useMemo } from 'react';
import { Trade } from '@/lib/types';
import { demoTrades } from '@/lib/demoData';

const M = "'DM Mono', monospace";
const H = "'Syne', sans-serif";

export default function PastTradesPage() {
  const [trades] = useState<Trade[]>(() => demoTrades);

  const stats = useMemo(() => {
    const wins = trades.filter(t => t.result === 'W');
    const losses = trades.filter(t => t.result === 'L');
    const totalPnl = Math.round(trades.reduce((s, t) => s + t.dollarPnl, 0));
    const avgWin = wins.length ? Math.round(wins.reduce((s, t) => s + t.dollarPnl, 0) / wins.length) : 0;
    const avgLoss = losses.length ? Math.round(Math.abs(losses.reduce((s, t) => s + t.dollarPnl, 0) / losses.length)) : 0;
    const avgRR = trades.length ? (trades.reduce((s, t) => s + t.rr, 0) / trades.length).toFixed(2) : '0.00';
    const grossW = wins.reduce((s, t) => s + t.dollarPnl, 0);
    const grossL = Math.abs(losses.reduce((s, t) => s + t.dollarPnl, 0));
    const pf = grossL > 0 ? (grossW / grossL).toFixed(1) : '∞';
    const ev = trades.length ? Math.round(totalPnl / trades.length) : 0;
    const wr = trades.length ? Math.round((wins.length / trades.length) * 100) : 0;
    return { total: trades.length, wr, totalPnl, avgRR, avgWin, avgLoss, pf, ev };
  }, [trades]);

  const cards = [
    { label: 'Total Trades', value: String(stats.total),                                        color: '#ccc' },
    { label: 'Win Rate',     value: `${stats.wr}%`,                                             color: stats.wr >= 50 ? '#00d4a0' : '#ff5555' },
    { label: 'Total P&L',   value: `${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toLocaleString()}`, color: stats.totalPnl >= 0 ? '#00d4a0' : '#ff5555' },
    { label: 'Avg R:R',     value: stats.avgRR,                                                 color: '#ccc' },
    { label: 'Avg Win',     value: `+$${stats.avgWin}`,                                         color: '#00d4a0' },
    { label: 'Avg Loss',    value: `-$${stats.avgLoss}`,                                        color: '#ff5555' },
    { label: 'Profit Factor', value: stats.pf,                                                  color: '#f5a623' },
    { label: 'Exp. Value',  value: `${stats.ev >= 0 ? '+' : ''}$${stats.ev}`,                  color: stats.ev >= 0 ? '#00d4a0' : '#ff5555' },
  ];

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#ccc' }}>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 32px' }}>

        {/* PAGE HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: H, fontSize: 30, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1 }}>Past Trades</h1>
            <p style={{ fontFamily: M, fontSize: 12, color: '#555', marginTop: 8, letterSpacing: '0.02em' }}>Review, filter, and drill into every trade you&apos;ve logged.</p>
          </div>
          {/* Watermark */}
          <div style={{ opacity: 0.2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="36" height="36" viewBox="0 0 28 32" fill="none">
              <circle cx="11" cy="5" r="3.5" stroke="#aaa" strokeWidth="1.3" fill="none" />
              <line x1="11" y1="8.5" x2="11" y2="17" stroke="#aaa" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="5.5" y1="12" x2="16.5" y2="12" stroke="#aaa" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="11" y1="17" x2="7" y2="23" stroke="#aaa" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="11" y1="17" x2="15" y2="23" stroke="#aaa" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: H, fontSize: 12, fontWeight: 400, letterSpacing: '0.2em', color: '#aaa' }}>
              JOURNAL <span style={{ color: '#00d4a0' }}>X</span>
            </span>
          </div>
        </div>

        {/* STAT CARDS — 8 across */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0,1fr))', gap: 8, marginBottom: 20 }}>
          {cards.map(c => (
            <div key={c.label} style={{ background: '#111', border: '0.5px solid #1e1e1e', borderRadius: 8, padding: '11px 13px' }}>
              <div style={{ fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#555', marginBottom: 7 }}>{c.label}</div>
              <div style={{ fontFamily: M, fontSize: 17, fontWeight: 600, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* placeholder for next steps */}
        <div style={{ fontFamily: M, color: '#222', fontSize: 11, textAlign: 'center', padding: 32 }}>— equity curve / filters / table coming —</div>

      </main>
    </div>
  );
}
