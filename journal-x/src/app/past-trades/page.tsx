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
    const avgRR = trades.length ? (trades.reduce((s, t) => s + t.rr, 0) / trades.length).toFixed(2) : '0';
    const grossW = wins.reduce((s, t) => s + t.dollarPnl, 0);
    const grossL = Math.abs(losses.reduce((s, t) => s + t.dollarPnl, 0));
    const pf = grossL > 0 ? (grossW / grossL).toFixed(1) : '∞';
    const ev = trades.length ? Math.round(totalPnl / trades.length) : 0;
    const wr = trades.length ? Math.round((wins.length / trades.length) * 100) : 0;
    return { total: trades.length, wr, totalPnl, avgRR, avgWin, avgLoss, pf, ev };
  }, [trades]);

  const cards = [
    { label: 'Total Trades', value: String(stats.total), color: '#ccc' },
    { label: 'Win Rate', value: `${stats.wr}%`, color: stats.wr >= 50 ? '#00d4a0' : '#ff5555' },
    { label: 'Total P&L', value: `${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toLocaleString()}`, color: stats.totalPnl >= 0 ? '#00d4a0' : '#ff5555' },
    { label: 'Avg R:R', value: stats.avgRR, color: '#ccc' },
    { label: 'Avg Win', value: `+$${stats.avgWin}`, color: '#00d4a0' },
    { label: 'Avg Loss', value: `-$${stats.avgLoss}`, color: '#ff5555' },
    { label: 'Profit Factor', value: stats.pf, color: '#f5a623' },
    { label: 'Exp. Value', value: `${stats.ev >= 0 ? '+' : ''}$${stats.ev}`, color: stats.ev >= 0 ? '#00d4a0' : '#ff5555' },
  ];

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: M, color: '#ccc' }}>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 32px' }}>

        {/* PAGE HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: H, fontSize: 32, fontWeight: 700, color: '#fff', margin: 0 }}>Past Trades</h1>
            <p style={{ fontSize: 13, color: '#555', marginTop: 6 }}>Review, filter, and drill into every trade you&apos;ve logged.</p>
          </div>
          <div style={{ opacity: 0.2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width="42" height="42" viewBox="0 0 56 56" fill="none">
              <circle cx="18" cy="12" r="4.5" stroke="#fff" strokeWidth="1.8" fill="none" />
              <line x1="18" y1="16.5" x2="18" y2="30" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="18" y1="21" x2="12" y2="27" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="21" x2="32" y2="17" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="30" x2="13" y2="40" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="30" x2="23" y2="40" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="35" y1="6" x2="35" y2="11" stroke="#00d4a0" strokeWidth="1.2" strokeLinecap="round" />
              <rect x="32" y="11" width="6" height="14" rx="1.5" fill="rgba(0,212,160,0.35)" stroke="#00d4a0" strokeWidth="1" />
              <line x1="35" y1="25" x2="35" y2="32" stroke="#00d4a0" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', color: '#fff', marginTop: 2 }}>JOURNAL X</span>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0,1fr))', gap: 8, marginBottom: 24 }}>
          {cards.map(c => (
            <div key={c.label} style={{ background: '#111', border: '0.5px solid #1e1e1e', borderRadius: 10, padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555', marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 400, color: c.color, fontFamily: M }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* TODO: equity curve, filters, table — next pieces */}
        <div style={{ color: '#333', fontSize: 12, padding: 40, textAlign: 'center' }}>More sections coming...</div>

      </main>
    </div>
  );
}
