'use client';

import { useState, useMemo, useRef } from 'react';
import { Trade } from '@/lib/types';
import { demoTrades } from '@/lib/demoData';
import TickerLogo from '@/components/TickerLogo';

const M = "'DM Mono', monospace";
const H = "'Syne', sans-serif";

export default function PastTradesPage() {
  const [trades] = useState<Trade[]>(() => demoTrades);
  const [period, setPeriod] = useState<string>('MAX');
  const [resultFilter, setResultFilter] = useState<string>('ALL');
  const [tickerSearch, setTickerSearch] = useState('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const perPage = 6;

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

  // Equity curve
  const curve = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    let cum = 0, peak = 0, maxDD = 0;
    const pts = sorted.map(t => {
      cum += t.dollarPnl;
      if (cum > peak) peak = cum;
      const dd = peak - cum;
      if (dd > maxDD) maxDD = dd;
      return { date: t.date, value: Math.round(cum) };
    });
    return { pts, peak: Math.round(peak), maxDD: Math.round(maxDD), current: Math.round(cum) };
  }, [trades]);

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Y-axis ticks
  const yMax = useMemo(() => {
    const m = Math.max(...curve.pts.map(p => p.value), 0);
    return Math.ceil(m / 500) * 500 || 500;
  }, [curve.pts]);
  const yTicks = useMemo(() => {
    const step = yMax / 4;
    return [0, 1, 2, 3, 4].map(i => Math.round(i * step));
  }, [yMax]);

  // X-axis labels (pick ~6 evenly spaced dates)
  const xLabels = useMemo(() => {
    const pts = curve.pts;
    if (pts.length <= 1) return pts.map(p => p.date);
    const step = Math.max(1, Math.floor((pts.length - 1) / 5));
    const labels: string[] = [];
    for (let i = 0; i < pts.length; i += step) labels.push(pts[i].date);
    if (labels[labels.length - 1] !== pts[pts.length - 1].date) labels.push(pts[pts.length - 1].date);
    return labels;
  }, [curve.pts]);

  const fmtDate = (d: string) => {
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const cards = [
    { label: 'Total Trades', value: String(stats.total),                                        color: '#e0e0e8' },
    { label: 'Win Rate',     value: `${stats.wr}%`,                                             color: stats.wr >= 50 ? '#00d4a0' : '#ff5555' },
    { label: 'Total P&L',   value: `${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toLocaleString()}`, color: stats.totalPnl >= 0 ? '#00d4a0' : '#ff5555' },
    { label: 'Avg R:R',     value: stats.avgRR,                                                 color: '#e0e0e8' },
    { label: 'Avg Win',     value: `+$${stats.avgWin}`,                                         color: '#00d4a0' },
    { label: 'Avg Loss',    value: `-$${stats.avgLoss}`,                                        color: '#ff5555' },
    { label: 'Profit Factor', value: stats.pf,                                                  color: '#f5a623' },
    { label: 'Exp. Value',  value: `${stats.ev >= 0 ? '+' : ''}$${stats.ev}`,                  color: stats.ev >= 0 ? '#00d4a0' : '#ff5555' },
  ];

  return (
    <div style={{ background: '#0c0e17', minHeight: '100vh', color: '#e0e0e8' }}>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 32px' }}>

        {/* PAGE HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: H, fontSize: 30, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1 }}>Past Trades</h1>
            <p style={{ fontFamily: M, fontSize: 14, color: '#8a8d98', marginTop: 8, letterSpacing: '0.02em' }}>Review, filter, and drill into every trade you&apos;ve logged.</p>
          </div>
          {/* Watermark — stick man holding candlestick */}
          <div style={{ opacity: 0.2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <svg width="36" height="36" viewBox="0 0 56 56" fill="none">
              {/* Stick man */}
              <circle cx="18" cy="12" r="4.5" stroke="#e0e0e8" strokeWidth="1.8" fill="none" />
              <line x1="18" y1="16.5" x2="18" y2="30" stroke="#e0e0e8" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="18" y1="21" x2="12" y2="27" stroke="#e0e0e8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="21" x2="32" y2="17" stroke="#e0e0e8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="30" x2="13" y2="40" stroke="#e0e0e8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="30" x2="23" y2="40" stroke="#e0e0e8" strokeWidth="1.5" strokeLinecap="round" />
              {/* Candlestick in hand */}
              <line x1="35" y1="6" x2="35" y2="11" stroke="#00d4a0" strokeWidth="1.2" strokeLinecap="round" />
              <rect x="32" y="11" width="6" height="14" rx="1.5" fill="rgba(0,212,160,0.35)" stroke="#00d4a0" strokeWidth="1" />
              <line x1="35" y1="25" x2="35" y2="32" stroke="#00d4a0" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: H, fontSize: 10, fontWeight: 600, letterSpacing: '0.25em', color: '#e0e0e8' }}>
              JOURNAL <span style={{ color: '#00d4a0' }}>X</span>
            </span>
          </div>
        </div>

        {/* STAT CARDS — 8 across */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0,1fr))', gap: 8, marginBottom: 20 }}>
          {cards.map(c => (
            <div key={c.label} style={{ background: '#141620', border: '0.5px solid #1e2030', borderRadius: 8, padding: '11px 13px' }}>
              <div style={{ fontFamily: M, fontSize: 12, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8a8d98', marginBottom: 7 }}>{c.label}</div>
              <div style={{ fontFamily: M, fontSize: 17, fontWeight: 600, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* EQUITY CURVE */}
        <div style={{ background: '#141620', border: '0.5px solid #1e2030', borderRadius: 10, padding: '16px 20px 12px', marginBottom: 20 }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5a5d68' }}>Cumulative P&L</span>
            <div style={{ display: 'flex', gap: 24, fontFamily: M, fontSize: 11 }}>
              <span><span style={{ color: '#5a5d68' }}>Start </span><span style={{ color: '#00d4a0' }}>$0</span></span>
              <span><span style={{ color: '#5a5d68' }}>Current </span><span style={{ color: '#00d4a0' }}>+${curve.current.toLocaleString()}</span></span>
              <span><span style={{ color: '#5a5d68' }}>Peak </span><span style={{ color: '#00d4a0' }}>+${curve.peak.toLocaleString()}</span></span>
              <span><span style={{ color: '#5a5d68' }}>Max DD </span><span style={{ color: '#ff5555' }}>-${curve.maxDD.toLocaleString()}</span></span>
            </div>
          </div>

          {/* Chart area with Y-axis + SVG + X-axis */}
          <div style={{ display: 'flex' }}>
            {/* Y-axis label */}
            <div style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: M, fontSize: 11, color: '#5a5d68', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.05em' }}>Cumulative P&L ($)</span>
            </div>
            {/* Y-axis ticks */}
            <div style={{ width: 52, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', paddingBottom: 2, paddingTop: 2 }}>
              {yTicks.map(v => (
                <span key={v} style={{ fontFamily: M, fontSize: 12, color: '#8a8d98', textAlign: 'right', lineHeight: 1 }}>${v.toLocaleString()}</span>
              ))}
            </div>
            {/* Chart SVG */}
            <div style={{ flex: 1, position: 'relative' }}>
              <div
                ref={chartRef}
                style={{ position: 'relative', height: 180 }}
                onMouseMove={(e) => {
                  if (!chartRef.current || curve.pts.length < 2) return;
                  const rect = chartRef.current.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const idx = Math.round((x / rect.width) * (curve.pts.length - 1));
                  setHoverIdx(Math.max(0, Math.min(curve.pts.length - 1, idx)));
                }}
                onMouseLeave={() => setHoverIdx(null)}
              >
                <svg width="100%" height="100%" viewBox={`0 0 1000 180`} preserveAspectRatio="none" style={{ display: 'block' }}>
                  {/* Grid lines */}
                  {yTicks.map((v, i) => {
                    const y = 175 - (v / yMax) * 170;
                    return <line key={i} x1="0" y1={y} x2="1000" y2={y} stroke="#1a1c2e" strokeWidth="1" />;
                  })}
                  {/* Gradient fill */}
                  <defs>
                    <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d4a0" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#00d4a0" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {curve.pts.length > 1 && (
                    <>
                      <path
                        d={
                          curve.pts.map((p, i) => {
                            const x = (i / (curve.pts.length - 1)) * 1000;
                            const y = 175 - (Math.max(p.value, 0) / yMax) * 170;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ') + ` L 1000 175 L 0 175 Z`
                        }
                        fill="url(#curveGrad)"
                      />
                      <polyline
                        points={curve.pts.map((p, i) => {
                          const x = (i / (curve.pts.length - 1)) * 1000;
                          const y = 175 - (Math.max(p.value, 0) / yMax) * 170;
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none" stroke="#00d4a0" strokeWidth="2.5"
                      />
                    </>
                  )}
                  {/* Hover crosshair */}
                  {hoverIdx !== null && curve.pts.length > 1 && (() => {
                    const x = (hoverIdx / (curve.pts.length - 1)) * 1000;
                    const y = 175 - (Math.max(curve.pts[hoverIdx].value, 0) / yMax) * 170;
                    return (
                      <>
                        <line x1={x} y1="0" x2={x} y2="175" stroke="#00d4a0" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
                        <circle cx={x} cy={y} r="5" fill="#00d4a0" />
                      </>
                    );
                  })()}
                </svg>
                {/* Hover tooltip */}
                {hoverIdx !== null && curve.pts[hoverIdx] && (
                  <div style={{
                    position: 'absolute', top: 4,
                    left: `${(hoverIdx / (curve.pts.length - 1)) * 100}%`,
                    transform: 'translateX(-50%)',
                    background: '#1a1c2e', border: '1px solid #00d4a0', borderRadius: 6,
                    padding: '4px 10px', fontFamily: M, fontSize: 11, whiteSpace: 'nowrap', pointerEvents: 'none',
                    zIndex: 10,
                  }}>
                    <span style={{ color: '#8a8d98' }}>{fmtDate(curve.pts[hoverIdx].date)} </span>
                    <span style={{ color: '#00d4a0', fontWeight: 600 }}>+${curve.pts[hoverIdx].value.toLocaleString()}</span>
                  </div>
                )}
              </div>
              {/* X-axis labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
                {xLabels.map(d => (
                  <span key={d} style={{ fontFamily: M, fontSize: 12, color: '#8a8d98' }}>{fmtDate(d)}</span>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 2 }}>
                <span style={{ fontFamily: M, fontSize: 11, color: '#5a5d68', letterSpacing: '0.05em' }}>Trade Date</span>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER ROW */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20 }}>
          {/* Period tabs */}
          <div style={{ display: 'flex', gap: 0, background: '#141620', border: '0.5px solid #1e2030', borderRadius: 8, overflow: 'hidden' }}>
            {['1D', '1W', '1M', 'QTR', '1Y', 'MAX'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                fontFamily: M, fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
                padding: '8px 16px', background: period === p ? '#00d4a0' : 'transparent',
                color: period === p ? '#0c0e17' : '#5a5d68', border: 'none', cursor: 'pointer',
                transition: 'all 0.15s',
              }}>{p}</button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: '#1e2030', margin: '0 16px' }} />

          {/* Result filter */}
          <div style={{ display: 'flex', gap: 0, background: '#141620', border: '0.5px solid #1e2030', borderRadius: 8, overflow: 'hidden' }}>
            {['ALL', 'W', 'L', 'BE'].map(r => (
              <button key={r} onClick={() => setResultFilter(r)} style={{
                fontFamily: M, fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
                padding: '8px 16px', background: resultFilter === r ? '#00d4a0' : 'transparent',
                color: resultFilter === r ? '#0c0e17' : '#5a5d68', border: 'none', cursor: 'pointer',
                transition: 'all 0.15s',
              }}>{r}</button>
            ))}
          </div>

          {/* Search */}
          <input
            value={tickerSearch}
            onChange={e => setTickerSearch(e.target.value.toUpperCase())}
            placeholder="Search ticker..."
            style={{
              marginLeft: 'auto', fontFamily: M, fontSize: 12, padding: '8px 14px',
              background: '#141620', border: '0.5px solid #1e2030', borderRadius: 8,
              color: '#e0e0e8', outline: 'none', width: 160,
            }}
          />
        </div>

        {/* TRADE TABLE */}
        {(() => {
          // Filter trades
          let filtered = [...trades].sort((a, b) => b.date.localeCompare(a.date));
          if (period !== 'MAX') {
            const now = new Date();
            const cutoff = new Date();
            if (period === '1D') cutoff.setDate(now.getDate() - 1);
            else if (period === '1W') cutoff.setDate(now.getDate() - 7);
            else if (period === '1M') cutoff.setMonth(now.getMonth() - 1);
            else if (period === 'QTR') cutoff.setMonth(now.getMonth() - 3);
            else if (period === '1Y') cutoff.setFullYear(now.getFullYear() - 1);
            const cs = cutoff.toISOString().split('T')[0];
            filtered = filtered.filter(t => t.date >= cs);
          }
          if (resultFilter !== 'ALL') filtered = filtered.filter(t => t.result === resultFilter);
          if (tickerSearch) filtered = filtered.filter(t => t.ticker.includes(tickerSearch));
          const totalPages = Math.ceil(filtered.length / perPage);
          const paged = filtered.slice(page * perPage, (page + 1) * perPage);

          const cols = '80px 110px 130px 150px 64px 90px 90px 80px 90px 32px';
          const thStyle = (text: string): React.CSSProperties => ({
            fontFamily: M, fontSize: 13, fontWeight: 500, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#e0e0e8', textShadow: '0 0 8px rgba(180,180,180,0.4)', textAlign: text === 'P&L' || text === 'R:R' ? 'right' : 'left',
          });

          const fmtD = (d: string) => {
            const dt = new Date(d + 'T12:00:00');
            return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          };

          const resultBadge = (r: string) => {
            const bg = r === 'W' ? '#00d4a0' : r === 'L' ? '#ff5555' : '#8a8d98';
            return (
              <span style={{
                fontFamily: M, fontSize: 11, fontWeight: 700, color: '#0c0e17',
                background: bg, borderRadius: 4, padding: '2px 8px', display: 'inline-block',
              }}>{r}</span>
            );
          };


          return (
            <div style={{ background: '#141620', border: '0.5px solid #1e2030', borderRadius: 10, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: cols, padding: '10px 16px', borderBottom: '0.5px solid #1e2030' }}>
                {['Date','Ticker','Instrument','Strategy','Result','Init Risk','Adj Risk','R:R','P&L',''].map(h => (
                  <div key={h} style={thStyle(h)}>{h}</div>
                ))}
              </div>

              {/* Table rows */}
              {paged.map((trade, pi) => {
                // Index in full filtered array for prev-trade check
                const fi = page * perPage + pi;
                const prevTrade = fi > 0 ? filtered[fi - 1] : null;
                return (
                <div key={trade.id}>
                  {/* Row */}
                  <div
                    onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}
                    style={{
                      display: 'grid', gridTemplateColumns: cols, padding: '12px 16px',
                      alignItems: 'center', borderBottom: '0.5px solid #151515',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#151515'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontFamily: M, fontSize: 13, color: '#8a8d98', textShadow: '0 0 6px rgba(150,150,150,0.3)' }}>{fmtD(trade.date)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TickerLogo ticker={trade.ticker} size={22} />
                      <span style={{ fontFamily: M, fontSize: 14, fontWeight: 700, color: '#fff' }}>{trade.ticker}</span>
                    </div>
                    <span style={{ fontFamily: M, fontSize: 13, color: '#8a8d98', textShadow: '0 0 6px rgba(150,150,150,0.3)' }}>{trade.instrument}</span>
                    <span style={{ fontFamily: M, fontSize: 13, color: '#8a8d98', textShadow: '0 0 6px rgba(150,150,150,0.3)' }}>{trade.strategy}</span>
                    <span>{resultBadge(trade.result)}</span>
                    <span style={{ fontFamily: M, fontSize: 13, color: '#8a8d98', textShadow: '0 0 6px rgba(150,150,150,0.3)' }}>${trade.initialRisk.toFixed(0)}</span>
                    <span style={{ fontFamily: M, fontSize: 13, color: '#8a8d98', textShadow: '0 0 6px rgba(150,150,150,0.3)' }}>${trade.adjustedRisk.toFixed(0)}</span>
                    <span style={{ fontFamily: M, fontSize: 12, fontWeight: 600, color: trade.rr > 0 ? '#00d4a0' : '#5a5d68', textAlign: 'right' }}>
                      {trade.rr > 0 ? `${trade.rr.toFixed(1)}R` : '—'}
                    </span>
                    <span style={{ fontFamily: M, fontSize: 12, fontWeight: 600, textAlign: 'right',
                      color: trade.dollarPnl > 0 ? '#00d4a0' : trade.dollarPnl < 0 ? '#ff5555' : '#5a5d68',
                    }}>
                      {trade.dollarPnl > 0 ? '+' : ''}{trade.dollarPnl !== 0 ? `$${trade.dollarPnl.toFixed(0)}` : '—'}
                    </span>
                    <span style={{ fontFamily: M, fontSize: 14, color: '#5a5d68', textAlign: 'center',
                      transform: expandedId === trade.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}>&#8964;</span>
                  </div>

                  {/* Expanded detail panel */}
                  {expandedId === trade.id && (
                    <div style={{ padding: '12px 16px 16px', borderBottom: '0.5px solid #1e2030', background: '#0e1019' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr 1.6fr', gap: 10 }}>
                        {/* Col 1: Trade Chart */}
                        <div style={{ background: '#141620', border: '0.5px solid #1a1c2e', borderRadius: 6, padding: '13px 14px' }}>
                          <div style={{ fontFamily: M, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5a5d68', marginBottom: 10 }}>Trade Chart</div>
                          <svg viewBox="0 0 200 100" style={{ width: '100%', height: 130, background: '#060606', borderRadius: 4, display: 'block' }}>
                            {/* 12 candlesticks */}
                            {[
                              { x: 10, o: 62, c: 45, h: 38, l: 68, up: false },
                              { x: 26, o: 45, c: 38, h: 30, l: 50, up: true },
                              { x: 42, o: 40, c: 52, h: 35, l: 58, up: false },
                              { x: 58, o: 50, c: 42, h: 35, l: 55, up: true },
                              { x: 74, o: 42, c: 35, h: 28, l: 48, up: true },
                              { x: 90, o: 36, c: 45, h: 30, l: 50, up: false },
                              { x: 106, o: 44, c: 38, h: 32, l: 48, up: true },
                              { x: 122, o: 38, c: 30, h: 24, l: 42, up: true },
                              { x: 138, o: 32, c: 40, h: 26, l: 45, up: false },
                              { x: 154, o: 38, c: 28, h: 22, l: 42, up: true },
                              { x: 170, o: 30, c: 38, h: 24, l: 42, up: false },
                              { x: 186, o: 36, c: 28, h: 20, l: 40, up: true },
                            ].map((c, i) => {
                              const color = c.up ? '#00d4a0' : '#ff5555';
                              const top = Math.min(c.o, c.c);
                              const bot = Math.max(c.o, c.c);
                              return (
                                <g key={i} opacity="0.8">
                                  <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={color} strokeWidth="1" />
                                  <rect x={c.x - 4} y={top} width="8" height={Math.max(bot - top, 1)} fill={color} rx="0.5" />
                                </g>
                              );
                            })}
                            {/* Moving average polyline */}
                            <polyline
                              points="10,55 26,48 42,50 58,46 74,40 90,43 106,40 122,35 138,37 154,32 170,34 186,30"
                              fill="none" stroke="#3182ce" strokeWidth="1" opacity="0.5"
                            />
                          </svg>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                            <span style={{ fontFamily: M, fontSize: 11, color: '#5a5d68' }}>{trade.time}</span>
                            <span style={{ fontFamily: M, fontSize: 11, color: '#5a5d68' }}>{trade.ticker} 1m</span>
                            <span style={{ fontFamily: M, fontSize: 11, color: '#5a5d68' }}>—</span>
                          </div>
                        </div>
                        {/* Col 2: Trade Detail */}
                        <div style={{ background: '#141620', border: '0.5px solid #1a1c2e', borderRadius: 6, padding: '13px 14px' }}>
                          <div style={{ fontFamily: M, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5a5d68', marginBottom: 10 }}>Trade Detail</div>
                          {[
                            { label: 'Entry', value: `$${trade.entryPrice.toFixed(2)}` },
                            { label: 'Exit', value: `$${trade.exitPrice.toFixed(2)}` },
                            { label: 'Size', value: `${trade.positionSize} contracts` },
                            { label: 'Time', value: trade.time },
                            { label: 'Hold', value: '—' },
                          ].map((r, ri) => (
                            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: ri < 4 ? '0.5px solid #161616' : 'none' }}>
                              <span style={{ fontFamily: M, fontSize: 12, color: '#8a8d98' }}>{r.label}</span>
                              <span style={{ fontFamily: M, fontSize: 13, fontWeight: 500, color: '#ddd' }}>{r.value}</span>
                            </div>
                          ))}
                        </div>
                        {/* Col 3: Psychology */}
                        {(() => {
                          const isW = trade.result === 'W';
                          const isL = trade.result === 'L';
                          const prevL = prevTrade?.result === 'L';
                          const psych = [
                            { label: 'Confidence', value: isW && trade.rr > 1.5 ? 'High' : isW ? 'Med' : 'Low', color: isW && trade.rr > 1.5 ? '#00ffbb' : isW ? '#ddd' : '#ff6666' },
                            { label: 'Plan followed', value: isL && trade.rr === 0 ? 'No' : 'Yes', color: isL && trade.rr === 0 ? '#ff6666' : '#00ffbb' },
                            { label: 'Emotional state', value: isW ? 'Calm' : isL ? 'Frustrated' : 'Neutral', color: isL ? '#ff6666' : '#ddd' },
                            { label: 'Early exit', value: isW && trade.rr < 1.2 ? 'Yes' : 'No', color: isW && trade.rr < 1.2 ? '#ffb347' : '#00ffbb' },
                            { label: 'Revenge trade', value: isL && prevL ? 'Possible' : 'No', color: isL && prevL ? '#ffb347' : '#00ffbb' },
                          ];
                          return (
                            <div style={{ background: '#141620', border: '0.5px solid #1a1c2e', borderRadius: 6, padding: '13px 14px' }}>
                              <div style={{ fontFamily: M, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5a5d68', marginBottom: 10 }}>Psychology</div>
                              {psych.map((r, ri) => (
                                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: ri < 4 ? '0.5px solid #161616' : 'none' }}>
                                  <span style={{ fontFamily: M, fontSize: 12, color: '#8a8d98' }}>{r.label}</span>
                                  <span style={{ fontFamily: M, fontSize: 13, fontWeight: 600, color: r.color }}>{r.value}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                        {/* Col 4: Coach Observation */}
                        {(() => {
                          const rr = trade.rr;
                          const s = trade.strategy;
                          const tk = trade.ticker;
                          const inst = trade.instrument;
                          const adj = `$${trade.adjustedRisk.toFixed(0)}`;
                          let text: Array<{ t: string; h?: boolean }> = [];
                          if (trade.result === 'W' && rr > 2.0) {
                            text = [
                              { t: `Strong execution on the ` }, { t: s, h: true }, { t: ` setup — you held to ` }, { t: `${rr.toFixed(1)}R`, h: true },
                              { t: ` which is above your avg. This is the discipline that compounds. Note the ` }, { t: inst, h: true },
                              { t: ` timing aligned with your best-performing session window.` },
                            ];
                          } else if (trade.result === 'W' && rr >= 1.2) {
                            text = [
                              { t: `Solid ` }, { t: s, h: true }, { t: ` entry. You captured ` }, { t: `${rr.toFixed(1)}R`, h: true },
                              { t: ` on this trade. Early exit pattern detected — your target was likely higher. Over time, cutting winners short is the primary drag on your expected value.` },
                            ];
                          } else if (trade.result === 'W') {
                            text = [
                              { t: `You won this trade but left money on the table. ` }, { t: `${rr.toFixed(1)}R`, h: true },
                              { t: ` is below your 1.27 avg. Review whether you exited on a plan or out of fear — this pattern has cost you an estimated ` },
                              { t: `$180`, h: true }, { t: ` this month.` },
                            ];
                          } else if (trade.result === 'L') {
                            text = [
                              { t: `The ` }, { t: s, h: true }, { t: ` setup on ` }, { t: tk, h: true },
                              { t: ` didn't work this session. Your adj risk of ` }, { t: adj, h: true },
                              { t: ` was within plan. Focus: was the entry valid by your rules? A loss on a valid setup is execution — a loss on an invalid setup is a mistake.` },
                            ];
                          } else {
                            text = [
                              { t: `Breakeven on this ` }, { t: tk, h: true },
                              { t: ` trade. You protected capital — that's discipline. Review whether the exit was planned or reactive. Planned breakevens build consistency. Reactive ones often indicate hesitation.` },
                            ];
                          }
                          return (
                            <div style={{ background: '#0c1812', border: '0.5px solid rgba(0,212,160,0.15)', borderRadius: 6, padding: '13px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <svg width="18" height="18" viewBox="0 0 56 56" fill="none" style={{ flexShrink: 0 }}>
                                  <circle cx="18" cy="12" r="4.5" stroke="#00d4a0" strokeWidth="1.8" fill="none" />
                                  <line x1="18" y1="16.5" x2="18" y2="30" stroke="#00d4a0" strokeWidth="1.8" strokeLinecap="round" />
                                  <line x1="18" y1="21" x2="12" y2="27" stroke="#00d4a0" strokeWidth="1.5" strokeLinecap="round" />
                                  <line x1="18" y1="21" x2="32" y2="17" stroke="#00d4a0" strokeWidth="1.5" strokeLinecap="round" />
                                  <line x1="18" y1="30" x2="13" y2="40" stroke="#00d4a0" strokeWidth="1.5" strokeLinecap="round" />
                                  <line x1="18" y1="30" x2="23" y2="40" stroke="#00d4a0" strokeWidth="1.5" strokeLinecap="round" />
                                  <line x1="35" y1="6" x2="35" y2="11" stroke="#00d4a0" strokeWidth="1.2" strokeLinecap="round" />
                                  <rect x="32" y="11" width="6" height="14" rx="1.5" fill="rgba(0,212,160,0.25)" stroke="#00d4a0" strokeWidth="1" />
                                  <line x1="35" y1="25" x2="35" y2="32" stroke="#00d4a0" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                                <span style={{ fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00d4a0', opacity: 1 }}>Coach Observation</span>
                              </div>
                              <p style={{ fontFamily: M, fontSize: 12, color: '#7abf94', lineHeight: 1.7, margin: 0, textShadow: '0 0 16px rgba(0,212,160,0.25), 0 0 32px rgba(0,212,160,0.1)' }}>
                                {text.map((part, i) => part.h
                                  ? <span key={i} style={{ color: '#00ffbb', textShadow: '0 0 10px rgba(0,212,160,0.5)' }}>{part.t}</span>
                                  : <span key={i}>{part.t}</span>
                                )}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                );
              })}

              {paged.length === 0 && (
                <div style={{ fontFamily: M, fontSize: 12, color: '#5a5d68', textAlign: 'center', padding: 40 }}>No trades match your filters.</div>
              )}

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '0.5px solid #1e2030' }}>
                <span style={{ fontFamily: M, fontSize: 13, color: '#8a8d98' }}>
                  {filtered.length > 0 ? `${page * perPage + 1}–${Math.min((page + 1) * perPage, filtered.length)} of ${filtered.length} trades` : '0 trades'}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    style={{ fontFamily: M, fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
                      padding: '6px 14px', background: '#1a1c2e', border: '0.5px solid #1e2030',
                      borderRadius: 6, color: page === 0 ? '#3a3d48' : '#8a8d98', cursor: page === 0 ? 'default' : 'pointer',
                    }}>Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    style={{ fontFamily: M, fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
                      padding: '6px 14px', background: '#1a1c2e', border: '0.5px solid #1e2030',
                      borderRadius: 6, color: page >= totalPages - 1 ? '#3a3d48' : '#8a8d98', cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                    }}>Next</button>
                </div>
              </div>
            </div>
          );
        })()}

      </main>
    </div>
  );
}
