'use client';

import { useState, useMemo, useRef } from 'react';
import { Trade } from '@/lib/types';
import { demoTrades } from '@/lib/demoData';

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
            <p style={{ fontFamily: M, fontSize: 14, color: '#666', marginTop: 8, letterSpacing: '0.02em' }}>Review, filter, and drill into every trade you&apos;ve logged.</p>
          </div>
          {/* Watermark — stick man holding candlestick */}
          <div style={{ opacity: 0.2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <svg width="36" height="36" viewBox="0 0 56 56" fill="none">
              {/* Stick man */}
              <circle cx="18" cy="12" r="4.5" stroke="#aaa" strokeWidth="1.8" fill="none" />
              <line x1="18" y1="16.5" x2="18" y2="30" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="18" y1="21" x2="12" y2="27" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="21" x2="32" y2="17" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="30" x2="13" y2="40" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="30" x2="23" y2="40" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" />
              {/* Candlestick in hand */}
              <line x1="35" y1="6" x2="35" y2="11" stroke="#00d4a0" strokeWidth="1.2" strokeLinecap="round" />
              <rect x="32" y="11" width="6" height="14" rx="1.5" fill="rgba(0,212,160,0.35)" stroke="#00d4a0" strokeWidth="1" />
              <line x1="35" y1="25" x2="35" y2="32" stroke="#00d4a0" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: H, fontSize: 10, fontWeight: 600, letterSpacing: '0.25em', color: '#aaa' }}>
              JOURNAL <span style={{ color: '#00d4a0' }}>X</span>
            </span>
          </div>
        </div>

        {/* STAT CARDS — 8 across */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0,1fr))', gap: 8, marginBottom: 20 }}>
          {cards.map(c => (
            <div key={c.label} style={{ background: '#111', border: '0.5px solid #1e1e1e', borderRadius: 8, padding: '11px 13px' }}>
              <div style={{ fontFamily: M, fontSize: 12, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#777', marginBottom: 7 }}>{c.label}</div>
              <div style={{ fontFamily: M, fontSize: 17, fontWeight: 600, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* EQUITY CURVE */}
        <div style={{ background: '#111', border: '0.5px solid #1e1e1e', borderRadius: 10, padding: '16px 20px 12px', marginBottom: 20 }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555' }}>Cumulative P&L</span>
            <div style={{ display: 'flex', gap: 24, fontFamily: M, fontSize: 11 }}>
              <span><span style={{ color: '#555' }}>Start </span><span style={{ color: '#00d4a0' }}>$0</span></span>
              <span><span style={{ color: '#555' }}>Current </span><span style={{ color: '#00d4a0' }}>+${curve.current.toLocaleString()}</span></span>
              <span><span style={{ color: '#555' }}>Peak </span><span style={{ color: '#00d4a0' }}>+${curve.peak.toLocaleString()}</span></span>
              <span><span style={{ color: '#555' }}>Max DD </span><span style={{ color: '#ff5555' }}>-${curve.maxDD.toLocaleString()}</span></span>
            </div>
          </div>

          {/* Chart area with Y-axis + SVG + X-axis */}
          <div style={{ display: 'flex' }}>
            {/* Y-axis label */}
            <div style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: M, fontSize: 11, color: '#555', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.05em' }}>Cumulative P&L ($)</span>
            </div>
            {/* Y-axis ticks */}
            <div style={{ width: 52, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', paddingBottom: 2, paddingTop: 2 }}>
              {yTicks.map(v => (
                <span key={v} style={{ fontFamily: M, fontSize: 12, color: '#666', textAlign: 'right', lineHeight: 1 }}>${v.toLocaleString()}</span>
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
                    return <line key={i} x1="0" y1={y} x2="1000" y2={y} stroke="#1a1a1a" strokeWidth="1" />;
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
                    background: '#1a1a1a', border: '1px solid #00d4a0', borderRadius: 6,
                    padding: '4px 10px', fontFamily: M, fontSize: 11, whiteSpace: 'nowrap', pointerEvents: 'none',
                    zIndex: 10,
                  }}>
                    <span style={{ color: '#888' }}>{fmtDate(curve.pts[hoverIdx].date)} </span>
                    <span style={{ color: '#00d4a0', fontWeight: 600 }}>+${curve.pts[hoverIdx].value.toLocaleString()}</span>
                  </div>
                )}
              </div>
              {/* X-axis labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
                {xLabels.map(d => (
                  <span key={d} style={{ fontFamily: M, fontSize: 12, color: '#666' }}>{fmtDate(d)}</span>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 2 }}>
                <span style={{ fontFamily: M, fontSize: 11, color: '#555', letterSpacing: '0.05em' }}>Trade Date</span>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER ROW */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20 }}>
          {/* Period tabs */}
          <div style={{ display: 'flex', gap: 0, background: '#111', border: '0.5px solid #1e1e1e', borderRadius: 8, overflow: 'hidden' }}>
            {['1D', '1W', '1M', 'QTR', '1Y', 'MAX'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                fontFamily: M, fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
                padding: '8px 16px', background: period === p ? '#00d4a0' : 'transparent',
                color: period === p ? '#0a0a0a' : '#555', border: 'none', cursor: 'pointer',
                transition: 'all 0.15s',
              }}>{p}</button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: '#1e1e1e', margin: '0 16px' }} />

          {/* Result filter */}
          <div style={{ display: 'flex', gap: 0, background: '#111', border: '0.5px solid #1e1e1e', borderRadius: 8, overflow: 'hidden' }}>
            {['ALL', 'W', 'L', 'BE'].map(r => (
              <button key={r} onClick={() => setResultFilter(r)} style={{
                fontFamily: M, fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
                padding: '8px 16px', background: resultFilter === r ? '#00d4a0' : 'transparent',
                color: resultFilter === r ? '#0a0a0a' : '#555', border: 'none', cursor: 'pointer',
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
              background: '#111', border: '0.5px solid #1e1e1e', borderRadius: 8,
              color: '#ccc', outline: 'none', width: 160,
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
            fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#555', textAlign: text === 'P&L' || text === 'R:R' ? 'right' : 'left',
          });

          const fmtD = (d: string) => {
            const dt = new Date(d + 'T12:00:00');
            return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          };

          const resultBadge = (r: string) => {
            const bg = r === 'W' ? '#00d4a0' : r === 'L' ? '#ff5555' : '#666';
            return (
              <span style={{
                fontFamily: M, fontSize: 11, fontWeight: 700, color: '#0a0a0a',
                background: bg, borderRadius: 4, padding: '2px 8px', display: 'inline-block',
              }}>{r}</span>
            );
          };

          const letterBadge = (ticker: string) => {
            const colors = ['#e53e3e','#dd6b20','#38a169','#3182ce','#805ad5','#d53f8c'];
            const c = colors[ticker.charCodeAt(0) % colors.length];
            return (
              <div style={{
                width: 22, height: 22, borderRadius: 4, display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: c + '33', border: `1px solid ${c}66`,
                color: c, fontSize: 10, fontWeight: 700, fontFamily: M, flexShrink: 0,
              }}>{ticker[0]}</div>
            );
          };

          return (
            <div style={{ background: '#111', border: '0.5px solid #1e1e1e', borderRadius: 10, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: cols, padding: '10px 16px', borderBottom: '0.5px solid #1e1e1e' }}>
                {['Date','Ticker','Instrument','Strategy','Result','Init Risk','Adj Risk','R:R','P&L',''].map(h => (
                  <div key={h} style={thStyle(h)}>{h}</div>
                ))}
              </div>

              {/* Table rows */}
              {paged.map(trade => (
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
                    <span style={{ fontFamily: M, fontSize: 12, color: '#666' }}>{fmtD(trade.date)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {letterBadge(trade.ticker)}
                      <span style={{ fontFamily: M, fontSize: 14, fontWeight: 700, color: '#fff' }}>{trade.ticker}</span>
                    </div>
                    <span style={{ fontFamily: M, fontSize: 12, color: '#666' }}>{trade.instrument}</span>
                    <span style={{ fontFamily: M, fontSize: 12, color: '#666' }}>{trade.strategy}</span>
                    <span>{resultBadge(trade.result)}</span>
                    <span style={{ fontFamily: M, fontSize: 12, color: '#888' }}>${trade.initialRisk.toFixed(0)}</span>
                    <span style={{ fontFamily: M, fontSize: 12, color: '#888' }}>${trade.adjustedRisk.toFixed(0)}</span>
                    <span style={{ fontFamily: M, fontSize: 12, fontWeight: 600, color: trade.rr > 0 ? '#00d4a0' : '#555', textAlign: 'right' }}>
                      {trade.rr > 0 ? `${trade.rr.toFixed(1)}R` : '—'}
                    </span>
                    <span style={{ fontFamily: M, fontSize: 12, fontWeight: 600, textAlign: 'right',
                      color: trade.dollarPnl > 0 ? '#00d4a0' : trade.dollarPnl < 0 ? '#ff5555' : '#555',
                    }}>
                      {trade.dollarPnl > 0 ? '+' : ''}{trade.dollarPnl !== 0 ? `$${trade.dollarPnl.toFixed(0)}` : '—'}
                    </span>
                    <span style={{ fontFamily: M, fontSize: 14, color: '#555', textAlign: 'center',
                      transform: expandedId === trade.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}>&#8964;</span>
                  </div>

                  {/* Expanded detail — placeholder for step 5 */}
                  {expandedId === trade.id && (
                    <div style={{ padding: '16px', borderBottom: '0.5px solid #1e1e1e', background: '#0d0d0d',
                      fontFamily: M, fontSize: 11, color: '#444' }}>
                      Expanded detail panel coming in step 5...
                    </div>
                  )}
                </div>
              ))}

              {paged.length === 0 && (
                <div style={{ fontFamily: M, fontSize: 12, color: '#444', textAlign: 'center', padding: 40 }}>No trades match your filters.</div>
              )}

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '0.5px solid #1e1e1e' }}>
                <span style={{ fontFamily: M, fontSize: 12, color: '#555' }}>
                  {filtered.length > 0 ? `${page * perPage + 1}–${Math.min((page + 1) * perPage, filtered.length)} of ${filtered.length} trades` : '0 trades'}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    style={{ fontFamily: M, fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
                      padding: '6px 14px', background: '#1a1a1a', border: '0.5px solid #1e1e1e',
                      borderRadius: 6, color: page === 0 ? '#333' : '#888', cursor: page === 0 ? 'default' : 'pointer',
                    }}>Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    style={{ fontFamily: M, fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
                      padding: '6px 14px', background: '#1a1a1a', border: '0.5px solid #1e1e1e',
                      borderRadius: 6, color: page >= totalPages - 1 ? '#333' : '#888', cursor: page >= totalPages - 1 ? 'default' : 'pointer',
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
