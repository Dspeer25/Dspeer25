'use client';
import React, { useState, useRef, useEffect } from "react";
import { fm, fd, teal, Trade, formatDollar } from "./shared";
import { TickerLogo } from "./TickerLogos";

export default function PastTradesContent({ trades, setActiveTab }: { trades: Trade[]; setActiveTab: (tab: string) => void }) {
  const [search, setSearch] = useState('');
  const [stratFilter, setStratFilter] = useState('All');
  const [resultFilter, setResultFilter] = useState('All');
  const [dateRange, setDateRange] = useState('All Time');
  const [sortBy, setSortBy] = useState('date-desc');
  const [colWidths, setColWidths] = useState<number[]>([80, 95, 75, 120, 80, 55, 140, 105, 80, 200]);
  const [aiOpen, setAiOpen] = useState(false);
  const [resizing, setResizing] = useState<{ col: number; startX: number; startW: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [eqHover, setEqHover] = useState<{ x: number; y: number; date: string; value: number } | null>(null);
  const [eqRange, setEqRange] = useState('YTD');
  const [notesTooltip, setNotesTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  React.useEffect(() => { setCurrentPage(1); }, [search, stratFilter, resultFilter, dateRange, sortBy]);
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'assistant', content: string}[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, aiLoading]);

  React.useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const diff = e.clientX - resizing.startX;
      setColWidths(prev => {
        const next = [...prev];
        next[resizing.col] = Math.max(40, resizing.startW + diff);
        return next;
      });
    };
    const onUp = () => setResizing(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [resizing]);

  React.useEffect(() => {
    if (!aiOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAiOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aiOpen]);

  async function sendToCoach() {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiLoading(true);
    try {
      const tradesContext = trades.map(t =>
        `${t.ticker} ${t.strategy} ${t.direction} Entry:$${t.entryPrice} Exit:$${t.exitPrice} P/L:$${t.pl} R:R:${t.riskReward} Date:${t.date} Journal:"${t.journal}"`
      ).join('\n');
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...aiMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg }
          ],
          tradesContext
        })
      });
      const data = await response.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Unable to analyze right now.' }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Try again.' }]);
    }
    setAiLoading(false);
  }

  const [strategies, setStrategies] = useState<string[]>(() => {
    try { const s = localStorage.getItem('wickcoach_strategies'); if (s) return JSON.parse(s); } catch {}
    return ['All', '0DTE Call', '0DTE Put', 'Call Scalp', 'Put Scalp', 'Call Debit Spread', 'Put Debit Spread', 'Put Credit Spread', 'Call Credit Spread', 'Iron Condor', 'Shares Long Swing', 'Shares Momentum', 'Shares Breakout'];
  });

  const removeStrategy = (strat: string) => {
    const updated = strategies.filter(s => s !== strat);
    setStrategies(updated);
    try { localStorage.setItem('wickcoach_strategies', JSON.stringify(updated)); } catch {}
    if (stratFilter === strat) setStratFilter('All');
  };

  // Filter + sort
  const filtered = trades.filter(t => {
    if (search && !t.ticker.toLowerCase().includes(search.toLowerCase())) return false;
    if (stratFilter !== 'All' && t.strategy !== stratFilter) return false;
    if (resultFilter === 'Wins' && t.result !== 'WIN') return false;
    if (resultFilter === 'Losses' && t.result !== 'LOSS') return false;
    if (resultFilter === 'Break Even' && t.pl !== 0) return false;
    if (dateRange === 'This Week') {
      const d = new Date(t.date); const now = new Date(); const weekAgo = new Date(now.getTime() - 7 * 86400000);
      if (d < weekAgo) return false;
    } else if (dateRange === '10 Days') {
      const d = new Date(t.date); const now = new Date(); const cutoff = new Date(now.getTime() - 10 * 86400000);
      if (d < cutoff) return false;
    } else if (dateRange === '15 Days') {
      const d = new Date(t.date); const now = new Date(); const cutoff = new Date(now.getTime() - 15 * 86400000);
      if (d < cutoff) return false;
    } else if (dateRange === 'This Month') {
      const d = new Date(t.date); const now = new Date();
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
    }
    return true;
  }).sort((a, b) => {
    const [field, dir] = sortBy.split('-');
    const asc = dir === 'asc' ? 1 : -1;
    if (field === 'date') return asc * (new Date(a.date).getTime() - new Date(b.date).getTime());
    if (field === 'direction') return asc * a.direction.localeCompare(b.direction);
    if (field === 'qty') return asc * (a.contracts - b.contracts);
    if (field === 'pl') return asc * (a.pl - b.pl);
    if (field === 'rr') {
      const aRR = parseFloat(a.riskReward.split(':')[1]) || 0;
      const bRR = parseFloat(b.riskReward.split(':')[1]) || 0;
      return asc * (aRR - bRR);
    }
    if (field === 'ticker') return asc * a.ticker.localeCompare(b.ticker);
    return 0;
  });

  // Stats — also respect equity curve time filter
  const statTrades = (() => {
    const now = new Date();
    let cutoff: Date;
    if (eqRange === '1D') cutoff = new Date(now.getTime() - 86400000);
    else if (eqRange === '1W') cutoff = new Date(now.getTime() - 7 * 86400000);
    else if (eqRange === '1M') cutoff = new Date(now.getTime() - 30 * 86400000);
    else if (eqRange === '3M') cutoff = new Date(now.getTime() - 90 * 86400000);
    else cutoff = new Date('2000-01-01');
    return filtered.filter(t => new Date(t.date) >= cutoff);
  })();
  const wins = statTrades.filter(t => t.result === 'WIN' && t.pl > 0);
  const losses = statTrades.filter(t => t.result === 'LOSS' || (t.result !== 'WIN' && t.pl < 0));
  const totalPL = statTrades.reduce((s, t) => s + t.pl, 0);
  const winRate = statTrades.length > 0 ? Math.round((wins.length / statTrades.length) * 100) : 0;
  const winRRValues = wins.map(t => parseFloat(t.riskReward.split(':')[1]) || 0);
  const avgRR = winRRValues.length > 0 ? (winRRValues.reduce((a, b) => a + b, 0) / winRRValues.length).toFixed(1) : '—';
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pl, 0) / losses.length) : 0;
  const expectedValue = statTrades.length > 0 ? (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss : 0;

  // P/L sparkline points
  const sparkPoints = (() => {
    if (filtered.length === 0) return 'M0,12 L60,12';
    let running = 0;
    const vals = filtered.slice().reverse().map(t => { running += t.pl; return running; });
    const maxV = Math.max(...vals.map(Math.abs), 1);
    return vals.map((v, i) => {
      const x = (i / Math.max(vals.length - 1, 1)) * 60;
      const y = 12 - (v / maxV) * 10;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  })();


  const formatDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (t: string) => {
    if (!t) return '—';
    const parts = t.split(':');
    if (parts.length < 2) return t;
    let h = parseInt(parts[0]); const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12; if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  };

  const selectBase: React.CSSProperties = { background: '#0e0f14', borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 8, padding: '10px 14px', color: '#c9cdd4', fontFamily: fm, fontSize: 14, outline: 'none', cursor: 'pointer', appearance: 'none' as const, WebkitAppearance: 'none' as const };

  const pillBtn = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 8, fontSize: 14, fontFamily: fm, fontWeight: 600, cursor: 'pointer',
    background: active ? 'rgba(0,212,160,0.1)' : '#0e0f14',
    borderTop: active ? '1px solid #00d4a0' : '1px solid #2a2b32',
    borderRight: active ? '1px solid #00d4a0' : '1px solid #2a2b32',
    borderBottom: active ? '1px solid #00d4a0' : '1px solid #2a2b32',
    borderLeft: active ? '1px solid #00d4a0' : '1px solid #2a2b32',
    color: active ? teal : '#6b7280', transition: 'all 0.2s',
  });

  // Equity curve data — respects calendar dropdown filter
  const equityCurveAll = (() => {
    const sorted = filtered.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let running = 0;
    return sorted.map(t => { running += t.pl; return { date: t.date, value: running }; });
  })();
  const equityCurve = (() => {
    if (equityCurveAll.length === 0) return [];
    const now = new Date();
    let cutoff: Date;
    if (eqRange === '1D') { cutoff = new Date(now.getTime() - 86400000); }
    else if (eqRange === '1W') { cutoff = new Date(now.getTime() - 7 * 86400000); }
    else if (eqRange === '1M') { cutoff = new Date(now.getTime() - 30 * 86400000); }
    else if (eqRange === '3M') { cutoff = new Date(now.getTime() - 90 * 86400000); }
    else { cutoff = new Date('2000-01-01'); }
    return equityCurveAll.filter(e => new Date(e.date) >= cutoff);
  })();
  const eqMin = equityCurve.length > 0 ? Math.min(...equityCurve.map(e => e.value)) : 0;
  const eqMaxVal = equityCurve.length > 0 ? Math.max(...equityCurve.map(e => e.value)) : 1;
  const eqRange2 = Math.max(eqMaxVal - eqMin, 1);
  const eqLine = equityCurve.length > 0
    ? equityCurve.map((e, i) => { const x = (i / Math.max(equityCurve.length - 1, 1)) * 700; const y = 10 + (1 - (e.value - eqMin) / eqRange2) * 100; return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ')
    : 'M0,100 L700,100';
  const eqFill = equityCurve.length > 0 ? eqLine + ` L700,120 L0,120 Z` : 'M0,100 L700,100 L700,120 L0,120 Z';
  // Y-axis labels
  const eqYLabels = (() => {
    if (equityCurve.length === 0) return [];
    const steps = 4;
    const labels: { value: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const value = eqMaxVal - (i / steps) * eqRange2;
      const y = 10 + (i / steps) * 100;
      labels.push({ value: Math.round(value), y });
    }
    return labels;
  })();
  const breakEven = statTrades.filter(t => t.pl === 0);

  // Pagination
  const perPage = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const pagedTrades = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  // Welcome message for Fix 8
  const welcomeMsg = trades.length > 0 && aiMessages.length === 0 ? (() => {
    const wr = trades.length > 0 ? Math.round((trades.filter(t => t.result === 'WIN').length / trades.length) * 100) : 0;
    const best = trades.slice().sort((a, b) => b.pl - a.pl)[0];
    return `You have ${trades.length} trade${trades.length !== 1 ? 's' : ''} logged with a ${wr}% win rate. Your best performer was ${best?.ticker} (+$${best?.pl.toFixed(2)}). Want me to analyze your patterns?`;
  })() : null;

  const colHeaders = ['Asset', 'Date', 'Time', 'Strategy', 'Direction', 'Qty', 'Entry/Exit', 'Net P/L', 'R:R', 'Notes'];
  const sortableMap: Record<string, string> = { 'Date': 'date', 'Direction': 'direction', 'Qty': 'qty', 'Net P/L': 'pl', 'R:R': 'rr', 'Asset': 'ticker' };
  function toggleSort(field: string) {
    if (sortBy === field + '-desc') setSortBy(field + '-asc');
    else if (sortBy === field + '-asc') setSortBy('date-desc');
    else setSortBy(field + '-desc');
  }

  function autoFitColumn(colIndex: number) {
    const targetWidth = colWidths[colIndex];
    setColWidths(prev => prev.map(() => targetWidth));
  }

  function formatAiText(text: string): React.ReactNode[] {
    const lines = text.split('\n');
    const nodes: React.ReactNode[] = [];
    lines.forEach((line, li) => {
      if (li > 0) nodes.push(<br key={`br-${li}`} />);
      const bulletMatch = line.match(/^•\s*(.*)/);
      const content = bulletMatch ? bulletMatch[1] : line;
      const parts = content.split(/\*\*(.*?)\*\*/g);
      const rendered = parts.map((part, pi) =>
        pi % 2 === 1 ? <span key={pi} style={{ color: teal, fontWeight: 700 }}>{part}</span> : part
      );
      if (bulletMatch) {
        nodes.push(<span key={`bullet-${li}`} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 4 }}><span style={{ color: teal, flexShrink: 0 }}>•</span><span>{rendered}</span></span>);
      } else {
        nodes.push(<span key={`line-${li}`}>{rendered}</span>);
      }
    });
    return nodes;
  }

  return (
    <div style={{ minHeight: '80vh', background: '#1a1c23', position: 'relative' }}>
      {/* ── MAIN CONTENT — FULL WIDTH CENTERED ── */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 40px', position: 'relative' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: fd, fontSize: 24, fontWeight: 700, color: teal }}>Past Trades</span>
              <span style={{ fontSize: 10, fontFamily: fm, color: '#0e0f14', background: teal, padding: '3px 8px', borderRadius: 4, fontWeight: 700, letterSpacing: 1 }}>LIVE</span>
            </div>
            <div style={{ fontFamily: fm, fontSize: 13, color: '#6b7280', marginTop: 4 }}>Analyze, review, and backtest your historical executions.</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span onClick={() => setAiOpen(!aiOpen)} style={{ fontFamily: fm, fontSize: 13, color: teal, padding: '8px 16px', borderRadius: 8, borderTop: `1px solid rgba(0,212,160,0.3)`, borderRight: `1px solid rgba(0,212,160,0.3)`, borderBottom: `1px solid rgba(0,212,160,0.3)`, borderLeft: `1px solid rgba(0,212,160,0.3)`, background: 'rgba(0,212,160,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <svg width="14" height="17" viewBox="0 0 20 24" fill="none"><circle cx="8" cy="4" r="2.8" stroke={teal} strokeWidth="1.2" fill="none" /><line x1="8" y1="6.8" x2="8" y2="15" stroke={teal} strokeWidth="1.2" /><rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={teal} opacity="0.9" /><line x1="15.5" y1="2" x2="15.5" y2="12" stroke={teal} strokeWidth="0.8" /></svg>
              AI Coach
            </span>
            <span style={{ fontFamily: fm, fontSize: 13, color: '#c9cdd4', padding: '8px 16px', borderRadius: 8, borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', background: '#111218', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export CSV
            </span>
          </div>
        </div>
        {/* ── STAT CARDS ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, flex: 1 }}>
          {/* Total P/L */}
          <div style={{ background: '#13141a', borderTop: `3px solid ${teal}`, borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, padding: '12px 16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ color: '#6b7280', fontFamily: fm, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Total P/L</div>
            <div style={{ color: totalPL >= 0 ? teal : '#ef4444', fontFamily: fd, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{formatDollar(totalPL)}</div>
            <svg width="100%" height="20" viewBox="0 0 200 20" preserveAspectRatio="none" style={{ display: 'block', marginTop: 6 }}>
              <defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={totalPL >= 0 ? teal : '#ef4444'} stopOpacity="0.15" /><stop offset="100%" stopColor={totalPL >= 0 ? teal : '#ef4444'} stopOpacity="0" /></linearGradient></defs>
              <path d={(sparkPoints.replace(/60/g, '200').replace(/24/g, '20') || 'M0,10 L200,10') + ' L200,20 L0,20 Z'} fill="url(#sparkFill)" />
              <path d={sparkPoints.replace(/60/g, '200').replace(/24/g, '20') || 'M0,10 L200,10'} stroke={totalPL >= 0 ? teal : '#ef4444'} strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          {/* Win Rate */}
          <div style={{ background: '#13141a', borderTop: `3px solid ${teal}`, borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ color: '#6b7280', fontFamily: fm, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Win Rate</div>
            <div style={{ color: '#fff', fontFamily: fd, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{winRate}%</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, fontFamily: fm, fontSize: 11 }}>
              <span style={{ color: teal }}>{wins.length}W</span>
              <span style={{ color: '#ef4444' }}>{losses.length}L</span>
              {breakEven.length > 0 && <span style={{ color: '#f59e0b' }}>{breakEven.length}E</span>}
            </div>
            <div style={{ display: 'flex', height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 4, background: '#1e1f2a' }}>
              {filtered.length > 0 && <div style={{ width: `${(wins.length / filtered.length) * 100}%`, background: teal }} />}
              {filtered.length > 0 && <div style={{ width: `${(losses.length / filtered.length) * 100}%`, background: '#ef4444' }} />}
            </div>
          </div>
          {/* Total Trades */}
          <div style={{ background: '#13141a', borderTop: `3px solid ${teal}`, borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ color: '#6b7280', fontFamily: fm, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Total Trades</div>
            <div style={{ color: '#fff', fontFamily: fd, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{statTrades.length}</div>
          </div>
          {/* Avg R:R */}
          <div style={{ background: '#13141a', borderTop: `3px solid ${teal}`, borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ color: '#6b7280', fontFamily: fm, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Avg R:R</div>
            <div style={{ color: '#fff', fontFamily: fd, fontSize: 24, fontWeight: 700, marginTop: 4 }}><span>1</span><span style={{ margin: '0 6px' }}>:</span><span>{avgRR}</span></div>
          </div>
          {/* Expected Value */}
          <div style={{ background: '#13141a', borderTop: `3px solid ${teal}`, borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ color: '#6b7280', fontFamily: fm, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Expected Value</div>
            <div style={{ color: expectedValue >= 0 ? teal : '#ef4444', fontFamily: fd, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{formatDollar(Math.round(expectedValue * 100) / 100)}</div>
            <div style={{ fontFamily: fm, fontSize: 11, color: '#6b7280', marginTop: 4 }}>Per trade</div>
          </div>
        </div>
          {/* WickCoach icon — HIGH-LEVEL ANALYSIS (right of Expected Value) */}
          <div onClick={() => setAiOpen(!aiOpen)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', flexShrink: 0, width: 80, position: 'relative' }}>
            {!aiOpen && (
              <div style={{ position: 'absolute', top: -70, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' as const, animation: 'hlaArrowBounce 1.5s ease-in-out infinite', pointerEvents: 'none' }}>
                <span style={{ fontFamily: fm, fontSize: 11, color: '#39ff85', fontWeight: 600, textShadow: '0 0 12px rgba(0,212,160,0.4)' }}>Click to ask me about your Trading</span>
                <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                  <path d="M8 0 L8 14" stroke="#39ff85" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M2 10 L8 18 L14 10" stroke="#39ff85" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            <div style={{ fontFamily: fm, fontSize: 10, color: teal, textTransform: 'uppercase' as const, letterSpacing: 2, textAlign: 'center', lineHeight: 1.3, fontWeight: 600 }}>HIGH-LEVEL ANALYSIS</div>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,212,160,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,212,160,0.2)', transition: 'all 0.3s', borderTop: `1px solid rgba(0,212,160,0.3)`, borderRight: `1px solid rgba(0,212,160,0.3)`, borderBottom: `1px solid rgba(0,212,160,0.3)`, borderLeft: `1px solid rgba(0,212,160,0.3)` }}>
              <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                <circle cx="8" cy="4" r="2.8" stroke={teal} strokeWidth="1.2" fill="none" />
                <line x1="8" y1="6.8" x2="8" y2="15" stroke={teal} strokeWidth="1.2" />
                <line x1="8" y1="9.5" x2="3" y2="13" stroke={teal} strokeWidth="1.2" />
                <line x1="8" y1="9.5" x2="14.5" y2="6" stroke={teal} strokeWidth="1.2" />
                <line x1="8" y1="15" x2="4.5" y2="21" stroke={teal} strokeWidth="1.2" />
                <line x1="8" y1="15" x2="11.5" y2="21" stroke={teal} strokeWidth="1.2" />
                <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={teal} opacity="0.9" />
                <line x1="15.5" y1="2" x2="15.5" y2="12" stroke={teal} strokeWidth="0.8" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── EQUITY CURVE ── */}
        <div style={{ background: '#13141a', borderTop: '1px solid #1e1f2a', borderRight: '1px solid #1e1f2a', borderBottom: '1px solid #1e1f2a', borderLeft: '1px solid #1e1f2a', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              <span style={{ fontFamily: fd, fontSize: 15, fontWeight: 700, color: '#e8e8f0' }}>Equity Curve</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['1D', '1W', '1M', '3M', 'YTD'].map(p => (
                <span key={p} onClick={() => setEqRange(p)} style={{ fontFamily: fm, fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', background: eqRange === p ? 'rgba(0,212,160,0.18)' : 'transparent', color: eqRange === p ? teal : '#6b7280', borderTop: eqRange === p ? '1px solid rgba(0,212,160,0.3)' : '1px solid transparent', borderRight: eqRange === p ? '1px solid rgba(0,212,160,0.3)' : '1px solid transparent', borderBottom: eqRange === p ? '1px solid rgba(0,212,160,0.3)' : '1px solid transparent', borderLeft: eqRange === p ? '1px solid rgba(0,212,160,0.3)' : '1px solid transparent', fontWeight: 600 }}>{p}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', position: 'relative' }}>
            {/* Y-axis labels */}
            <div style={{ width: 65, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: 6 }}>
              {eqYLabels.map((label, li) => (
                <span key={li} style={{ fontFamily: fm, fontSize: 13, color: '#9ca3af', textAlign: 'right', lineHeight: '1', fontWeight: 600 }}>{label.value >= 0 ? '+' : ''}{label.value >= 1000 ? `$${(label.value / 1000).toFixed(1)}k` : `$${label.value}`}</span>
              ))}
            </div>
            {/* Chart */}
            <div style={{ flex: 1, position: 'relative' }}>
              <svg width="100%" height="120" viewBox="0 0 700 120" preserveAspectRatio="none" style={{ display: 'block' }}
                onMouseMove={e => {
                  if (equityCurve.length === 0) return;
                  const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
                  if (!rect) return;
                  const relX = (e.clientX - rect.left) / rect.width;
                  const idx = Math.min(Math.max(Math.round(relX * (equityCurve.length - 1)), 0), equityCurve.length - 1);
                  const pt = equityCurve[idx];
                  const svgX = (idx / Math.max(equityCurve.length - 1, 1)) * 700;
                  const svgY = 10 + (1 - (pt.value - eqMin) / eqRange2) * 100;
                  setEqHover({ x: svgX, y: svgY, date: pt.date, value: pt.value });
                }}
                onMouseLeave={() => setEqHover(null)}
              >
                {[30, 60, 90].map(y => <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="#1a1b22" strokeWidth="1" />)}
                <defs><linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={teal} stopOpacity="0.12" /><stop offset="100%" stopColor={teal} stopOpacity="0" /></linearGradient></defs>
                <path d={eqFill} fill="url(#eqGrad)" />
                <path d={eqLine} fill="none" stroke={teal} strokeWidth="2" />
                {eqHover && (<>
                  <line x1={eqHover.x} y1="0" x2={eqHover.x} y2="120" stroke="rgba(0,212,160,0.4)" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx={eqHover.x} cy={eqHover.y} r="4" fill={teal} stroke="#0e0f14" strokeWidth="2" />
                </>)}
              </svg>
              {/* Hover tooltip */}
              {eqHover && (
                <div style={{ position: 'absolute', left: `${(eqHover.x / 700) * 100}%`, top: -8, transform: 'translateX(-50%) translateY(-100%)', background: '#13141a', borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 6, padding: '6px 10px', fontFamily: fm, fontSize: 11, color: '#c9cdd4', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none' }}>
                  <div style={{ color: '#9ca3af' }}>{new Date(eqHover.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <div style={{ color: eqHover.value >= 0 ? teal : '#ef4444', fontWeight: 700 }}>{formatDollar(Math.round(eqHover.value))}</div>
                </div>
              )}
            </div>
          </div>
          {equityCurve.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingLeft: 65 }}>
              {[0, Math.floor(equityCurve.length * 0.25), Math.floor(equityCurve.length * 0.5), Math.floor(equityCurve.length * 0.75), equityCurve.length - 1].filter((v, i, a) => a.indexOf(v) === i).map(idx => (
                <span key={idx} style={{ fontFamily: fm, fontSize: 11, color: '#6b7280' }}>
                  {new Date(equityCurve[idx].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── FILTER BAR ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Ticker (e.g. AAPL)" style={{ ...selectBase, paddingLeft: 38, width: 220 }} />
          </div>
          {/* Strategy dropdown */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            <select value={stratFilter} onChange={e => setStratFilter(e.target.value)} style={{ ...selectBase, paddingLeft: 32, paddingRight: 32, minWidth: 170 }}>
              {strategies.map(s => <option key={s} value={s}>{s === 'All' ? 'Strategy: All' : `Strategy: ${s}`}</option>)}
              <option value="+ Add New">+ Add New</option>
            </select>
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: teal, fontSize: 10, pointerEvents: 'none' }}>▼</span>
          </div>
          {stratFilter !== 'All' && stratFilter !== '+ Add New' && (
            <span onClick={() => removeStrategy(stratFilter)} style={{ color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: fm }}>✕</span>
          )}
          {/* Result pills with colored dots */}
          <div style={{ display: 'flex', gap: 4, background: '#111218', borderRadius: 8, padding: 3, borderTop: '1px solid #1e1f2a', borderRight: '1px solid #1e1f2a', borderBottom: '1px solid #1e1f2a', borderLeft: '1px solid #1e1f2a' }}>
            {([['All', '#6b7280'], ['Wins', teal], ['Losses', '#ef4444'], ['Break Even', '#f59e0b']] as [string, string][]).map(([r, dotColor]) => (
              <span key={r} onClick={() => setResultFilter(r)} style={{ ...pillBtn(resultFilter === r), display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                {r === 'All' ? 'All Trades' : r}
              </span>
            ))}
          </div>
          {/* Sort reset */}
          {sortBy !== 'date-desc' && (
            <span onClick={() => setSortBy('date-desc')} title="Reset sort to default" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', background: '#0e0f14', borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', marginLeft: 4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
            </span>
          )}
          {/* Date range — pushed right */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ marginRight: 4 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ ...selectBase, paddingRight: 28, fontSize: 13 }}>
                {['This Week', '10 Days', '15 Days', 'This Month', 'All Time'].map(d => <option key={d} value={d}>{d === 'All Time' ? 'All Time' : d}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: teal, fontSize: 10, pointerEvents: 'none' }}>▼</span>
            </div>
          </div>
        </div>

        {/* ── TRADE LIST ── */}
        <div style={{ background: '#111218', borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, overflow: 'hidden', boxShadow: '0 0 40px rgba(0,212,160,0.03)' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: colWidths.map(w => w + 'px').join(' '), background: '#0e0f14', borderBottom: '2px solid #2a2b32' }}>
            {colHeaders.map((h, hi) => {
              const sortField = sortableMap[h];
              const isActive = sortField && sortBy.startsWith(sortField + '-');
              const isAsc = sortBy === sortField + '-asc';
              return (
                <span key={h} onClick={() => { if (sortField) toggleSort(sortField); }} style={{ color: isActive ? teal : '#9ca3af', fontFamily: fm, fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: 1.5, fontWeight: 600, position: 'relative', userSelect: resizing ? 'none' : 'auto', padding: '12px 8px', borderRight: hi < colHeaders.length - 1 ? '1px solid #1e1f2a' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', whiteSpace: 'nowrap', cursor: sortField ? 'pointer' : 'default', gap: 4 }}>
                  {h}
                  {sortField && (
                    <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 0, fontSize: 8, marginLeft: 2 }}>
                      <span style={{ color: isActive && isAsc ? teal : '#3a3b42' }}>&#9650;</span>
                      <span style={{ color: isActive && !isAsc ? teal : '#3a3b42' }}>&#9660;</span>
                    </span>
                  )}
                  <span onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setResizing({ col: hi, startX: e.clientX, startW: colWidths[hi] }); }} onDoubleClick={e => { e.stopPropagation(); autoFitColumn(hi); }} style={{ position: 'absolute', right: -4, top: 0, width: 8, height: '100%', cursor: 'col-resize', zIndex: 2, background: 'transparent' }} onMouseEnter={e => { e.currentTarget.style.borderRight = `3px solid ${teal}`; }} onMouseLeave={e => { if (!resizing || resizing.col !== hi) e.currentTarget.style.borderRight = 'none'; }} />
                </span>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
              <div style={{ color: '#8a8d98', fontFamily: fm, fontSize: 16 }}>No trades logged yet</div>
              <span onClick={() => setActiveTab('Log a Trade')} style={{ color: teal, fontFamily: fm, fontSize: 14, cursor: 'pointer', marginTop: 10, fontWeight: 600 }}>Log your first trade &rarr;</span>
            </div>
          ) : (<>
            {pagedTrades.map((t, idx) => {
              const rowBg = idx % 2 === 0 ? '#111218' : '#151620';
              return (
                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: colWidths.map(w => w + 'px').join(' '), background: rowBg, borderBottom: '1px solid #2a2b32', alignItems: 'center', fontFamily: fm, fontSize: 14, color: '#e8e8f0', transition: 'background 0.15s', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.background = '#1c1d28'; }} onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}>
                  {/* Asset */}
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden', padding: '12px 6px', borderRight: '1px solid #1e1f2a', whiteSpace: 'nowrap' }}>
                    <TickerLogo ticker={t.ticker} />
                    <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 13 }}>{t.ticker}</span>
                  </span>
                  {/* Date */}
                  <span style={{ color: '#c9cdd4', fontSize: 13, whiteSpace: 'nowrap', padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(() => { const d = new Date(t.date); return `${d.getMonth()+1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`; })()}</span>
                  {/* Time */}
                  <span style={{ color: '#9ca3af', fontSize: 12, whiteSpace: 'nowrap', padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{formatTime(t.time)}</span>
                  {/* Strategy */}
                  <span style={{ color: '#c9cdd4', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.strategy}</span>
                  {/* Direction */}
                  <span style={{ padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: t.direction === 'LONG' ? 'rgba(0,212,160,0.15)' : 'rgba(239,68,68,0.15)', color: t.direction === 'LONG' ? teal : '#ef4444' }}>{t.direction}</span>
                  </span>
                  {/* Qty */}
                  <span style={{ color: '#e8e8f0', fontSize: 14, padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.contracts}</span>
                  {/* Entry / Exit */}
                  <span style={{ color: '#c9cdd4', fontSize: 13, whiteSpace: 'nowrap', padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>${t.entryPrice.toFixed(2)} → ${t.exitPrice.toFixed(2)}</span>
                  {/* Net P/L */}
                  <span style={{ color: t.pl >= 0 ? teal : '#ef4444', fontWeight: 700, fontSize: 15, padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{formatDollar(t.pl)}</span>
                  {/* R:R */}
                  <span style={{ color: t.result === 'BREAKEVEN' || t.pl === 0 ? '#f59e0b' : '#c9cdd4', fontSize: 13, whiteSpace: 'nowrap', padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.result === 'BREAKEVEN' || t.pl === 0 ? '0.0' : t.riskReward.replace(/(\d+):(\d)/, '$1 : $2')}</span>
                  {/* Notes */}
                  <div style={{ color: '#9ca3af', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '12px 8px', width: '100%', boxSizing: 'border-box', minWidth: 0, position: 'relative', cursor: 'default' }} onMouseEnter={e => { if (t.journal) { const rect = e.currentTarget.getBoundingClientRect(); setNotesTooltip({ text: t.journal, x: rect.left, y: rect.top }); } }} onMouseLeave={() => setNotesTooltip(null)}>{t.journal || '—'}</div>
                </div>
              );
            })}
          </>)}
        </div>
        {filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '16px 0', marginTop: 8 }}>
            <span onClick={() => { if (safePage > 1) setCurrentPage(safePage - 1); }} style={{ fontFamily: fm, fontSize: 13, color: safePage > 1 ? teal : '#3a3b42', cursor: safePage > 1 ? 'pointer' : 'default', fontWeight: 600 }}>&larr; Previous</span>
            <span style={{ fontFamily: fm, fontSize: 13, color: '#6b7280' }}>Showing {(safePage - 1) * perPage + 1}-{Math.min(safePage * perPage, filtered.length)} of {filtered.length} trades</span>
            <span onClick={() => { if (safePage < totalPages) setCurrentPage(safePage + 1); }} style={{ fontFamily: fm, fontSize: 13, color: safePage < totalPages ? teal : '#3a3b42', cursor: safePage < totalPages ? 'pointer' : 'default', fontWeight: 600 }}>Next &rarr;</span>
          </div>
        )}

        {/* Notes tooltip */}
        {notesTooltip && (
          <div style={{ position: 'fixed', left: Math.min(notesTooltip.x, window.innerWidth - 380), top: notesTooltip.y - 10, transform: 'translateY(-100%)', background: '#13141a', borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 8, padding: 12, maxWidth: 350, fontFamily: fm, fontSize: 13, color: '#c9cdd4', lineHeight: 1.6, zIndex: 50, whiteSpace: 'normal', pointerEvents: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
            {notesTooltip.text}
          </div>
        )}
      </div>

      {/* ── FLOATING AI PANEL — GLASSMORPHISM ── */}
      {aiOpen && (
        <div style={{ position: 'fixed', bottom: 88, right: 24, width: 380, maxHeight: 520, borderRadius: 16, display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden', background: 'rgba(14,15,20,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,212,160,0.2)', borderRight: '1px solid rgba(0,212,160,0.2)', borderBottom: '1px solid rgba(0,212,160,0.2)', borderLeft: '1px solid rgba(0,212,160,0.2)', boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(0,212,160,0.08)', backgroundImage: 'radial-gradient(rgba(0,212,160,0.18) 1px, transparent 1px)', backgroundSize: '4px 4px' }}>
          {/* Header */}
          <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(0,212,160,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="17" viewBox="0 0 20 24" fill="none">
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
              <div>
                <div style={{ fontFamily: fd, fontSize: 15, fontWeight: 700, color: '#fff' }}>WickCoach AI</div>
                <div style={{ fontFamily: fm, fontSize: 9, color: '#6b7280', letterSpacing: 2, textTransform: 'uppercase' as const }}>TRADING CO-PILOT</div>
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div style={{ flex: 1, padding: '10px 12px', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360 }}>
            {aiMessages.length === 0 && (
              welcomeMsg ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: teal, flexShrink: 0, marginTop: 6 }} />
                  <div style={{ background: 'rgba(19,20,26,0.7)', borderTop: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, maxWidth: '90%' }}>
                    <div style={{ fontFamily: fm, fontSize: 12, color: '#c9cdd4', lineHeight: 1.6 }}>{welcomeMsg}</div>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  <div style={{ fontFamily: fm, fontSize: 12, color: '#6b7280', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.6 }}>Ask about your trading patterns, psychology, or specific trades.</div>
                </div>
              )
            )}
            {aiMessages.map((msg, i) => (
              msg.role === 'assistant' ? (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: teal, flexShrink: 0, marginTop: 6 }} />
                  <div style={{ background: 'rgba(19,20,26,0.7)', borderTop: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, maxWidth: '90%' }}>
                    <div style={{ fontFamily: fm, fontSize: 12, color: '#c9cdd4', lineHeight: 1.6 }}>{formatAiText(msg.content)}</div>
                  </div>
                </div>
              ) : (
                <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ background: 'rgba(0,212,160,0.08)', borderTop: '1px solid rgba(0,212,160,0.15)', borderRight: '1px solid rgba(0,212,160,0.15)', borderBottom: '1px solid rgba(0,212,160,0.15)', borderLeft: '1px solid rgba(0,212,160,0.15)', borderRadius: 10, padding: 10, maxWidth: '85%' }}>
                    <div style={{ fontFamily: fm, fontSize: 12, color: '#fff', lineHeight: 1.6 }}>{msg.content}</div>
                  </div>
                </div>
              )
            ))}
            {aiLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: teal, flexShrink: 0, marginTop: 6 }} />
                <div style={{ background: 'rgba(19,20,26,0.7)', borderTop: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(d => (
                      <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6b7280', animation: `dotPulse 1.2s ease-in-out ${d * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div style={{ padding: '8px 12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(14,15,20,0.6)', borderTop: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px' }}>
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendToCoach(); }} placeholder="Ask WickCoach..." style={{ flex: 1, background: 'transparent', borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderLeft: 'none', outline: 'none', color: '#c9cdd4', fontFamily: fm, fontSize: 13 }} />
              <div onClick={sendToCoach} style={{ width: 30, height: 30, borderRadius: '50%', background: teal, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: aiLoading ? 0.5 : 1 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0e0f14" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes dotPulse { 0%,80%,100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}
