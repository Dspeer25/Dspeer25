'use client';
import React, { useState, useRef } from "react";
import { fm, fd, Trade, formatDollar, buildGoalsContext, buildProfileContext, readQuantTargets, parseLocalDate } from "./shared";
import AIChatWidget from "./AIChatWidget";

// Local green — all greens in this file resolve to this single swatch.
const teal = '#00d4a0';

// Ticker tile color map. Each entry defines the tile's background, border, text color.
// Ticker → brand domain. Used to fetch the actual company logo via Google's
// favicon service. Unlisted tickers fall back to a first-letter tile.
const TICKER_DOMAINS: Record<string, string> = {
  AAPL: 'apple.com', AMD: 'amd.com', AMZN: 'amazon.com', BA: 'boeing.com',
  COIN: 'coinbase.com', DIS: 'disney.com', GOOG: 'google.com', GOOGL: 'google.com',
  JPM: 'jpmorganchase.com', META: 'meta.com', MSFT: 'microsoft.com',
  NFLX: 'netflix.com', NVDA: 'nvidia.com', QQQ: 'invesco.com', SPY: 'spglobal.com',
  TSLA: 'tesla.com', V: 'visa.com', WMT: 'walmart.com',
  PLTR: 'palantir.com', CRM: 'salesforce.com', COST: 'costco.com', HD: 'homedepot.com',
  NKE: 'nike.com', SBUX: 'starbucks.com', KO: 'coca-cola.com', PEP: 'pepsico.com',
  ORCL: 'oracle.com', ADBE: 'adobe.com', INTC: 'intel.com', CSCO: 'cisco.com',
  T: 'att.com', VZ: 'verizon.com',
};

const TickerTile = ({ ticker }: { ticker: string }) => {
  const domain = TICKER_DOMAINS[ticker];
  if (domain) {
    return (
      <div style={{
        width: 28, height: 28, borderRadius: 4, background: '#ffffff', padding: 3,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginRight: 8,
      }}>
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
          alt={ticker}
          width={22}
          height={22}
          style={{ width: 22, height: 22, objectFit: 'contain', borderRadius: 3 }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
    );
  }
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 4,
      background: '#1a1a1a', border: '1px solid #333', color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: fd, fontWeight: 700, fontSize: 11,
      flexShrink: 0, marginRight: 8,
    }}>
      {ticker.charAt(0)}
    </div>
  );
};

export default function PastTradesContent({ trades, setActiveTab }: { trades: Trade[]; setActiveTab: (tab: string) => void }) {
  const [search, setSearch] = useState('');
  const [stratFilter, setStratFilter] = useState('All');
  const [resultFilter, setResultFilter] = useState('All');
  const [dateRange, setDateRange] = useState('All Time');
  const [sortBy, setSortBy] = useState('date-desc');
  const [colWidths, setColWidths] = useState<number[]>([90, 105, 80, 135, 90, 60, 155, 115, 85, 220]);
  const [aiOpen, setAiOpen] = useState(false);
  const [resizing, setResizing] = useState<{ col: number; startX: number; startW: number } | null>(null);
  const didResizeRef = React.useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [eqHover, setEqHover] = useState<{ x: number; y: number; date: string; value: number } | null>(null);
  const [eqRange, setEqRange] = useState('YTD');
  const [notesTooltip, setNotesTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [aiBtnHover, setAiBtnHover] = useState(false);
  const [chartHeight, setChartHeight] = useState(180);
  React.useEffect(() => { setCurrentPage(1); }, [search, stratFilter, resultFilter, dateRange, sortBy]);
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'assistant', content: string}[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  React.useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const diff = e.clientX - resizing.startX;
      if (Math.abs(diff) > 2) didResizeRef.current = true;
      setColWidths(prev => {
        const next = [...prev];
        next[resizing.col] = Math.max(40, resizing.startW + diff);
        return next;
      });
    };
    const onUp = () => {
      setResizing(null);
      // Keep the "did resize" flag set briefly so the click that
      // follows mouseup on the header span is ignored.
      setTimeout(() => { didResizeRef.current = false; }, 120);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [resizing]);

  async function sendToCoach() {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiLoading(true);
    try {
      // Mirror every column visible in the Past Trades table so the AI can
      // reason about any field the trader can see on screen. Order follows the
      // table header: Asset, Date, Time, Strategy, Direction, Qty, Entry/Exit,
      // Net P/L, R:R, Analyst Notes. Result is included so wins/losses are
      // unambiguous in prose (the table shows it via P/L sign + row color).
      const tradesContext = trades.map(t => (
        `Date:${t.date} Time:${t.time} ` +
        `Asset:${t.ticker} Strategy:${t.strategy} Direction:${t.direction} Qty:${t.contracts} ` +
        `Entry:$${t.entryPrice} Exit:$${t.exitPrice} ` +
        `NetPL:$${t.pl} Result:${t.result} R:R:${t.riskReward} ` +
        `Notes:"${t.journal}"`
      )).join('\n');
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...aiMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg }
          ],
          tradesContext,
          goalsContext: buildGoalsContext(),
          profileContext: buildProfileContext(),
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
      const d = parseLocalDate(t.date); const now = new Date(); const weekAgo = new Date(now.getTime() - 7 * 86400000);
      if (d < weekAgo) return false;
    } else if (dateRange === '10 Days') {
      const d = parseLocalDate(t.date); const now = new Date(); const cutoff = new Date(now.getTime() - 10 * 86400000);
      if (d < cutoff) return false;
    } else if (dateRange === '15 Days') {
      const d = parseLocalDate(t.date); const now = new Date(); const cutoff = new Date(now.getTime() - 15 * 86400000);
      if (d < cutoff) return false;
    } else if (dateRange === 'This Month') {
      const d = parseLocalDate(t.date); const now = new Date();
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
    return filtered.filter(t => parseLocalDate(t.date) >= cutoff);
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

  // Derived labels for the stat cards — no hardcoded flavor text.
  // Month-over-month win rate delta (this 30 days vs prior 30 days).
  const now = new Date();
  const monthStart = new Date(now.getTime() - 30 * 86400000);
  const prevMonthStart = new Date(now.getTime() - 60 * 86400000);
  const currMonth = filtered.filter(t => parseLocalDate(t.date) >= monthStart);
  const prevMonth = filtered.filter(t => parseLocalDate(t.date) >= prevMonthStart && parseLocalDate(t.date) < monthStart);
  const currWR = currMonth.length ? (currMonth.filter(t => t.pl > 0).length / currMonth.length) * 100 : 0;
  const prevWR = prevMonth.length ? (prevMonth.filter(t => t.pl > 0).length / prevMonth.length) * 100 : 0;
  const wrDelta = prevMonth.length > 0 ? Math.round(currWR - prevWR) : null;
  // Average trades per active day in the stat window.
  const statDays = statTrades.length > 0
    ? Math.max(1, Math.ceil((now.getTime() - Math.min(...statTrades.map(t => parseLocalDate(t.date).getTime()))) / 86400000))
    : 1;
  const tradesPerDay = statTrades.length / statDays;
  // Avg R numeric value for target comparison.
  const avgRRNumeric = winRRValues.length > 0 ? winRRValues.reduce((a, b) => a + b, 0) / winRRValues.length : 0;

  // Compare real stats against the trader's own targets (set in Weekly
  // Goals → Numerical). If no target is set, we don't pass judgment.
  const { quantitativeTargets } = readQuantTargets();
  const targetRR = quantitativeTargets.find(t => t.id === 'target-rr')?.value ?? null;
  const targetWR = quantitativeTargets.find(t => t.id === 'target-wr')?.value ?? null;
  const rrVsTarget = targetRR !== null ? (avgRRNumeric >= targetRR) : null;
  const wrVsTarget = targetWR !== null ? (winRate >= targetWR) : null;

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
    const dt = parseLocalDate(d);
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

  const selectBase: React.CSSProperties = { background: '#0f1318', borderTop: '1px solid #2A3143', borderRight: '1px solid #2A3143', borderBottom: '1px solid #2A3143', borderLeft: '1px solid #2A3143', borderRadius: 8, padding: '10px 14px', color: '#c9cdd4', fontFamily: fm, fontSize: 14, outline: 'none', cursor: 'pointer', appearance: 'none' as const, WebkitAppearance: 'none' as const };

  const pillBtn = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 8, fontSize: 14, fontFamily: fm, fontWeight: 600, cursor: 'pointer',
    background: active ? 'rgba(0,212,160,0.1)' : '#0f1318',
    borderTop: active ? '1px solid #00d4a0' : '1px solid #2A3143',
    borderRight: active ? '1px solid #00d4a0' : '1px solid #2A3143',
    borderBottom: active ? '1px solid #00d4a0' : '1px solid #2A3143',
    borderLeft: active ? '1px solid #00d4a0' : '1px solid #2A3143',
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
    return equityCurveAll.filter(e => parseLocalDate(e.date) >= cutoff);
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
    // Use functional setter so we read the latest width if a drag-in-progress
    // just modified it, then equalize all columns to that width.
    setColWidths(prev => {
      const target = prev[colIndex];
      return prev.map(() => target);
    });
    setResizing(null); // cancel any drag the double-click may have started
  }

  return (
    <div style={{ minHeight: '80vh', background: 'transparent', position: 'relative' }}>
      {/* ── MAIN CONTENT — FULL WIDTH CENTERED ── */}
      <div style={{ maxWidth: 1400, width: '95%', margin: '0 auto', padding: '24px 40px', position: 'relative' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: '#ffffff' }}>Past Trades</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,212,160,0.1)', border: '1px solid rgba(0,212,160,0.2)', padding: '4px 10px', borderRadius: 12, fontSize: 11, color: '#00d4a0', fontWeight: 600, fontFamily: fm, letterSpacing: 0.5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4a0', animation: 'livePulse 1.8s ease-out infinite', flexShrink: 0 }} />
                LIVE
              </span>
            </div>
            <div style={{ fontFamily: fm, fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Analyze, review, and backtest your historical executions across all strategies.</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            <span style={{ fontFamily: fm, fontSize: 13, color: 'rgba(255,255,255,0.7)', padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export CSV
            </span>
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setAiBtnHover(true)}
              onMouseLeave={() => setAiBtnHover(false)}
            >
              <span
                onClick={() => setAiOpen(!aiOpen)}
                style={{ fontFamily: fm, fontSize: 15, color: '#000', padding: '12px 26px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #00d4a0, #00e6b0)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 0 24px rgba(0,212,160,0.3), inset 0 1px 0 rgba(255,255,255,0.25)', letterSpacing: 0.5 }}>
                <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                  <circle cx="8" cy="4" r="2.8" stroke="#000" strokeWidth="1.4" fill="none" />
                  <line x1="8" y1="6.8" x2="8" y2="15" stroke="#000" strokeWidth="1.4" />
                  <line x1="8" y1="9.5" x2="3" y2="13" stroke="#000" strokeWidth="1.4" />
                  <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#000" strokeWidth="1.4" />
                  <line x1="8" y1="15" x2="4.5" y2="21" stroke="#000" strokeWidth="1.4" />
                  <line x1="8" y1="15" x2="11.5" y2="21" stroke="#000" strokeWidth="1.4" />
                  <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill="#000" />
                  <line x1="15.5" y1="2" x2="15.5" y2="12" stroke="#000" strokeWidth="1" />
                </svg>
                Ask AI Coach
              </span>
              {aiBtnHover && !aiOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 240, maxWidth: 'calc(100vw - 40px)', background: '#0f1318', border: '1px solid rgba(0,212,160,0.4)', borderRadius: 10, padding: '12px 14px', boxShadow: '0 10px 32px rgba(0,0,0,0.55), 0 0 20px rgba(0,212,160,0.12)', zIndex: 50, pointerEvents: 'none', textAlign: 'center' }}>
                  <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: teal, lineHeight: 1.4 }}>
                    High Level Analysis on your Past Trades
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* ── STAT CARDS — 5 connected cards ── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, border: '1px solid #2A3143', borderRadius: 10, overflow: 'hidden', background: '#141822' }}>
          {/* Card 1 — TOTAL NET P/L */}
          <div style={{ flex: 1, padding: '24px 24px', borderRight: '1px solid #2A3143', textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontFamily: fm, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Total Net P/L</div>
            <div style={{ color: totalPL >= 0 ? '#00d4a0' : '#ff4444', fontFamily: fd, fontSize: 38, fontWeight: 700, marginTop: 10, lineHeight: 1.1 }}>
              {(totalPL >= 0 ? '+' : '-') + '$' + Math.abs(totalPL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ width: '60%', height: 3, background: '#00d4a0', borderRadius: 2, marginTop: 14, marginLeft: 'auto', marginRight: 'auto' }} />
          </div>

          {/* Card 2 — WIN RATE */}
          <div style={{ flex: 1, padding: '24px 24px', borderRight: '1px solid #2A3143', textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontFamily: fm, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Win Rate</div>
            <div style={{ color: '#fff', fontFamily: fd, fontSize: 38, fontWeight: 700, marginTop: 10, lineHeight: 1.1 }}>{winRate}%</div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontFamily: fm, fontSize: 13 }}>{wins.length}W / {losses.length}L</span>
              {wrDelta !== null && (
                <span style={{ color: wrDelta >= 0 ? '#00d4a0' : '#ff4444', fontFamily: fm, fontSize: 13 }}>
                  {wrDelta >= 0 ? '+' : ''}{wrDelta}% MoM
                </span>
              )}
              {wrVsTarget !== null && (
                <span style={{ color: wrVsTarget ? '#00d4a0' : '#ff4444', fontFamily: fm, fontSize: 12 }}>
                  {wrVsTarget ? 'Above Target' : 'Below Target'}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 12, background: '#2A3143', width: '60%', marginLeft: 'auto', marginRight: 'auto' }}>
              {filtered.length > 0 && <div style={{ width: `${(wins.length / filtered.length) * 100}%`, background: '#00d4a0' }} />}
              {filtered.length > 0 && <div style={{ width: `${(losses.length / filtered.length) * 100}%`, background: '#ff4444' }} />}
            </div>
          </div>

          {/* Card 3 — TOTAL EXECUTIONS */}
          <div style={{ flex: 1, padding: '24px 24px', borderRight: '1px solid #2A3143', textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontFamily: fm, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Total Executions</div>
            <div style={{ color: '#fff', fontFamily: fd, fontSize: 38, fontWeight: 700, marginTop: 10, lineHeight: 1.1 }}>{statTrades.length}</div>
            <div style={{ fontFamily: fm, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 14, fontStyle: 'italic' as const }}>{tradesPerDay.toFixed(1)} trades / day</div>
          </div>

          {/* Card 4 — AVG R:R */}
          <div style={{ flex: 1, padding: '24px 24px', borderRight: '1px solid #2A3143', textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontFamily: fm, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Avg R</div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
              <span style={{ color: '#aab0bd', fontFamily: fd, fontSize: 22, fontWeight: 600 }}>R</span>
              <span style={{ color: '#fff', fontFamily: fd, fontSize: 38, fontWeight: 700, lineHeight: 1.1 }}>{avgRR}</span>
            </div>
            {rrVsTarget !== null && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 14 }}>
                <span style={{ width: 6, height: 6, background: rrVsTarget ? '#00d4a0' : '#ff4444', borderRadius: '50%', display: 'inline-block' }} />
                <span style={{ fontFamily: fm, fontSize: 12, color: rrVsTarget ? '#00d4a0' : '#ff4444' }}>{rrVsTarget ? 'Above Target' : 'Below Target'}</span>
              </div>
            )}
          </div>

          {/* Card 5 — HIGH-LEVEL ANALYSIS */}
          <div onClick={() => setAiOpen(!aiOpen)} style={{ flex: 1, padding: '24px 24px', cursor: 'pointer', position: 'relative', textAlign: 'center' }}>
            {!aiOpen && (
              <div style={{ position: 'absolute', top: -70, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' as const, animation: 'hlaArrowBounce 1.5s ease-in-out infinite', pointerEvents: 'none' }}>
                <span style={{ fontFamily: fm, fontSize: 11, color: '#00d4a0', fontWeight: 600, textShadow: '0 0 12px rgba(0,212,160,0.4)' }}>Click to ask me about your Trading</span>
                <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                  <path d="M8 0 L8 14" stroke="#00d4a0" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M2 10 L8 18 L14 10" stroke="#00d4a0" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            <div style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,212,160,0.1)', border: '1px solid rgba(0,212,160,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(0,212,160,0.2)' }}>
              <svg width="14" height="17" viewBox="0 0 20 24" fill="none">
                <circle cx="8" cy="4" r="2.8" stroke="#00d4a0" strokeWidth="1.2" fill="none" />
                <line x1="8" y1="6.8" x2="8" y2="15" stroke="#00d4a0" strokeWidth="1.2" />
                <line x1="8" y1="9.5" x2="3" y2="13" stroke="#00d4a0" strokeWidth="1.2" />
                <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#00d4a0" strokeWidth="1.2" />
                <line x1="8" y1="15" x2="4.5" y2="21" stroke="#00d4a0" strokeWidth="1.2" />
                <line x1="8" y1="15" x2="11.5" y2="21" stroke="#00d4a0" strokeWidth="1.2" />
                <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill="#00d4a0" opacity="0.9" />
                <line x1="15.5" y1="2" x2="15.5" y2="12" stroke="#00d4a0" strokeWidth="0.8" />
              </svg>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontFamily: fm, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Expected Value</div>
            <div style={{ color: expectedValue >= 0 ? '#00d4a0' : '#ff4444', fontFamily: fd, fontSize: 32, fontWeight: 700, marginTop: 10, lineHeight: 1.1 }}>
              {(expectedValue >= 0 ? '+' : '-') + '$' + Math.abs(expectedValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontFamily: fm, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 10, fontStyle: 'italic' }}>Per Trade</div>
          </div>
        </div>

        {/* ── EQUITY CURVE ── */}
        <div style={{ background: '#141822', border: '1px solid #2A3143', borderRadius: 8, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4a0" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              <span style={{ fontFamily: fd, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>Cumulative Equity Curve</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Height scale control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: fm, fontSize: 11, color: '#7a7d85', letterSpacing: 1, textTransform: 'uppercase' }}>Scale</span>
                <span
                  onClick={() => setChartHeight(h => Math.max(120, h - 40))}
                  title="Shrink chart"
                  style={{ cursor: 'pointer', width: 22, height: 22, borderRadius: 4, border: '1px solid #2A3143', background: '#0f1318', color: teal, fontFamily: fm, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
                >−</span>
                <input
                  type="range"
                  min={120}
                  max={480}
                  step={20}
                  value={chartHeight}
                  onChange={e => setChartHeight(parseInt(e.target.value))}
                  style={{ width: 90, accentColor: teal, cursor: 'pointer' }}
                />
                <span
                  onClick={() => setChartHeight(h => Math.min(480, h + 40))}
                  title="Grow chart"
                  style={{ cursor: 'pointer', width: 22, height: 22, borderRadius: 4, border: '1px solid #2A3143', background: '#0f1318', color: teal, fontFamily: fm, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
                >+</span>
                <span style={{ fontFamily: fm, fontSize: 10, color: '#555', minWidth: 30, textAlign: 'right' }}>{chartHeight}px</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['1D', '1W', '1M', '3M', 'YTD'].map(p => {
                  const active = eqRange === p;
                  return (
                    <span key={p} onClick={() => setEqRange(p)} style={{
                      fontFamily: fm, fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                      background: active ? '#00d4a0' : 'transparent',
                      color: active ? '#000' : 'rgba(255,255,255,0.4)',
                      fontWeight: active ? 700 : 600,
                      border: '1px solid transparent',
                    }}>{p}</span>
                  );
                })}
              </div>
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
              <svg width="100%" height={chartHeight} viewBox="0 0 700 120" preserveAspectRatio="none" style={{ display: 'block' }}
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
                <path d={eqLine} fill="none" stroke="#00d4a0" strokeWidth="2" />
                {equityCurve.length > 0 && !eqHover && (() => {
                  const lastIdx = equityCurve.length - 1;
                  const lastPt = equityCurve[lastIdx];
                  const endX = (lastIdx / Math.max(equityCurve.length - 1, 1)) * 700;
                  const endY = 10 + (1 - (lastPt.value - eqMin) / eqRange2) * 100;
                  return <circle cx={endX} cy={endY} r="5" fill="#00d4a0" stroke="#13141a" strokeWidth="2" />;
                })()}
                {eqHover && (<>
                  <line x1={eqHover.x} y1="0" x2={eqHover.x} y2="120" stroke="rgba(0,212,160,0.4)" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx={eqHover.x} cy={eqHover.y} r="4" fill="#00d4a0" stroke="#13141a" strokeWidth="2" />
                </>)}
              </svg>
              {/* Current value label next to end dot */}
              {equityCurve.length > 0 && !eqHover && (() => {
                const lastIdx = equityCurve.length - 1;
                const lastPt = equityCurve[lastIdx];
                const endXPct = (lastIdx / Math.max(equityCurve.length - 1, 1)) * 100;
                // SVG viewBox is 0..120 in Y. Convert the data point's SVG y
                // into actual pixels using the current chartHeight so the
                // label tracks the line when the user rescales.
                const svgY = 10 + (1 - (lastPt.value - eqMin) / eqRange2) * 100;
                const pxY = (svgY / 120) * chartHeight - 10;
                return (
                  <div style={{ position: 'absolute', left: `calc(${endXPct}% + 10px)`, top: pxY, fontFamily: fm, fontSize: 11, color: '#00d4a0', fontWeight: 700, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                    {formatDollar(Math.round(lastPt.value))}
                  </div>
                );
              })()}
              {/* Hover tooltip */}
              {eqHover && (
                <div style={{ position: 'absolute', left: `${(eqHover.x / 700) * 100}%`, top: -8, transform: 'translateX(-50%) translateY(-100%)', background: '#141822', borderTop: '1px solid #2A3143', borderRight: '1px solid #2A3143', borderBottom: '1px solid #2A3143', borderLeft: '1px solid #2A3143', borderRadius: 6, padding: '6px 10px', fontFamily: fm, fontSize: 11, color: '#c9cdd4', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none' }}>
                  <div style={{ color: '#9ca3af' }}>{parseLocalDate(eqHover.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <div style={{ color: eqHover.value >= 0 ? teal : '#ff4444', fontWeight: 700 }}>{formatDollar(Math.round(eqHover.value))}</div>
                </div>
              )}
            </div>
          </div>
          {equityCurve.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingLeft: 65 }}>
              {[0, Math.floor(equityCurve.length * 0.25), Math.floor(equityCurve.length * 0.5), Math.floor(equityCurve.length * 0.75), equityCurve.length - 1].filter((v, i, a) => a.indexOf(v) === i).map(idx => (
                <span key={idx} style={{ fontFamily: fm, fontSize: 11, color: '#6b7280' }}>
                  {parseLocalDate(equityCurve[idx].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: teal, fontSize: 11, pointerEvents: 'none' }}>▼</span>
          </div>
          {stratFilter !== 'All' && stratFilter !== '+ Add New' && (
            <span onClick={() => removeStrategy(stratFilter)} style={{ color: '#ff4444', fontSize: 12, cursor: 'pointer', fontFamily: fm }}>✕</span>
          )}
          {/* Result pills with colored dots */}
          <div style={{ display: 'flex', gap: 4, background: '#141822', borderRadius: 8, padding: 3, borderTop: '1px solid rgba(42,49,67,0.5)', borderRight: '1px solid rgba(42,49,67,0.5)', borderBottom: '1px solid rgba(42,49,67,0.5)', borderLeft: '1px solid rgba(42,49,67,0.5)' }}>
            {([['All', '#6b7280'], ['Wins', teal], ['Losses', '#ff4444'], ['Break Even', '#f59e0b']] as [string, string][]).map(([r, dotColor]) => (
              <span key={r} onClick={() => setResultFilter(r)} style={{ ...pillBtn(resultFilter === r), display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                {r === 'All' ? 'All Trades' : r}
              </span>
            ))}
          </div>
          {/* Sort reset */}
          {sortBy !== 'date-desc' && (
            <span onClick={() => setSortBy('date-desc')} title="Reset sort to default" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', background: '#0f1318', borderTop: '1px solid #2A3143', borderRight: '1px solid #2A3143', borderBottom: '1px solid #2A3143', borderLeft: '1px solid #2A3143', marginLeft: 4 }}>
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
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: teal, fontSize: 11, pointerEvents: 'none' }}>▼</span>
            </div>
          </div>
        </div>

        {/* ── TRADE LIST ── */}
        <div style={{ background: '#141822', borderTop: '1px solid #2A3143', borderRight: '1px solid #2A3143', borderBottom: '1px solid #2A3143', borderLeft: '1px solid #2A3143', borderRadius: 10, overflow: 'hidden', boxShadow: '0 0 40px rgba(0,212,160,0.03)' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: colWidths.map(w => w + 'px').join(' '), background: '#0f1318', borderBottom: '2px solid #2A3143' }}>
            {colHeaders.map((h, hi) => {
              const sortField = sortableMap[h];
              const isActive = sortField && sortBy.startsWith(sortField + '-');
              const isAsc = sortBy === sortField + '-asc';
              return (
                <span key={h} onClick={() => { if (didResizeRef.current || resizing) return; if (sortField) toggleSort(sortField); }} style={{ color: isActive ? teal : 'rgba(255,255,255,0.7)', fontFamily: fm, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 700, position: 'relative', userSelect: resizing ? 'none' : 'auto', padding: '14px 8px', borderRight: hi < colHeaders.length - 1 ? '1px solid rgba(42,49,67,0.5)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', cursor: sortField ? 'pointer' : 'default', gap: 4 }}>
                  {h}
                  {sortField && (
                    <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 0, fontSize: 11, marginLeft: 2 }}>
                      <span style={{ color: isActive && isAsc ? teal : '#3a3b42' }}>&#9650;</span>
                      <span style={{ color: isActive && !isAsc ? teal : '#3a3b42' }}>&#9660;</span>
                    </span>
                  )}
                  <span
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); didResizeRef.current = false; setResizing({ col: hi, startX: e.clientX, startW: colWidths[hi] }); }}
                    onClick={e => { e.stopPropagation(); }}
                    onDoubleClick={e => { e.preventDefault(); e.stopPropagation(); didResizeRef.current = true; autoFitColumn(hi); setTimeout(() => { didResizeRef.current = false; }, 120); }}
                    style={{ position: 'absolute', right: -4, top: 0, width: 8, height: '100%', cursor: 'col-resize', zIndex: 2, background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.borderRight = `3px solid ${teal}`; }}
                    onMouseLeave={e => { if (!resizing || resizing.col !== hi) e.currentTarget.style.borderRight = 'none'; }}
                  />
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
              const rowBg = idx % 2 === 0 ? '#111218' : '#161822';
              return (
                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: colWidths.map(w => w + 'px').join(' '), background: rowBg, borderBottom: '1px solid #2A3143', borderLeft: '2px solid transparent', alignItems: 'center', fontFamily: fm, fontSize: 15, color: '#e8e8f0', transition: 'background 0.15s', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.background = '#1c1d28'; }} onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}>
                  {/* Asset */}
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden', padding: '14px 8px', borderRight: '1px solid rgba(42,49,67,0.5)', whiteSpace: 'nowrap' }}>
                    <TickerTile ticker={t.ticker} />
                    <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 15 }}>{t.ticker}</span>
                  </span>
                  {/* Date */}
                  <span style={{ color: '#c9cdd4', fontSize: 15, whiteSpace: 'nowrap', padding: '14px 8px', borderRight: '1px solid rgba(42,49,67,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(() => { const d = parseLocalDate(t.date); return `${d.getMonth()+1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`; })()}</span>
                  {/* Time */}
                  <span style={{ color: '#b8c0ce', fontSize: 15, whiteSpace: 'nowrap', padding: '14px 8px', borderRight: '1px solid rgba(42,49,67,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{formatTime(t.time)}</span>
                  {/* Strategy */}
                  <span style={{ color: '#d5dae2', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '14px 8px', borderRight: '1px solid rgba(42,49,67,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.strategy}</span>
                  {/* Direction */}
                  <span style={{ padding: '14px 8px', borderRight: '1px solid rgba(42,49,67,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, fontFamily: fm, background: t.direction === 'LONG' ? 'rgba(0,212,160,0.1)' : 'rgba(255,68,68,0.1)', border: t.direction === 'LONG' ? '1px solid rgba(0,212,160,0.15)' : '1px solid rgba(255,68,68,0.15)', color: t.direction === 'LONG' ? teal : '#ff4444' }}>{t.direction}</span>
                  </span>
                  {/* Qty */}
                  <span style={{ color: '#e8e8f0', fontSize: 14, padding: '14px 8px', borderRight: '1px solid rgba(42,49,67,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.contracts}</span>
                  {/* Entry / Exit */}
                  <span style={{ color: '#c9cdd4', fontSize: 15, whiteSpace: 'nowrap', padding: '14px 8px', borderRight: '1px solid rgba(42,49,67,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>${t.entryPrice.toFixed(2)} → ${t.exitPrice.toFixed(2)}</span>
                  {/* Net P/L */}
                  <span style={{ color: t.pl >= 0 ? teal : '#ff4444', fontWeight: 700, fontSize: 16, padding: '14px 8px', borderRight: '1px solid rgba(42,49,67,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{formatDollar(t.pl)}</span>
                  {/* R:R */}
                  <span style={{ color: t.result === 'BREAKEVEN' || t.pl === 0 ? '#f59e0b' : '#c9cdd4', fontSize: 13, whiteSpace: 'nowrap', padding: '14px 8px', borderRight: '1px solid rgba(42,49,67,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.result === 'BREAKEVEN' || t.pl === 0 ? '0.0' : t.riskReward.replace(/(\d+):(\d)/, '$1 : $2')}</span>
                  {/* Notes — clamped to 2 lines; column drag exposes more horizontal text; hover reveals the full note */}
                  <div style={{ color: '#b8c0ce', fontSize: 14, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word', overflowWrap: 'anywhere', padding: '12px 10px', width: '100%', boxSizing: 'border-box', minWidth: 0, position: 'relative', cursor: 'default' }} onMouseEnter={e => { if (t.journal) { const rect = e.currentTarget.getBoundingClientRect(); setNotesTooltip({ text: t.journal, x: rect.left, y: rect.top }); } }} onMouseLeave={() => setNotesTooltip(null)}>{t.journal || '—'}</div>
                </div>
              );
            })}
          </>)}
        </div>
        {filtered.length > 0 && (() => {
          const startIdx = (safePage - 1) * perPage + 1;
          const endIdx = Math.min(safePage * perPage, filtered.length);
          // Build page number list with ellipsis
          const pages: (number | '…')[] = [];
          if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
          } else {
            pages.push(1);
            if (safePage > 3) pages.push('…');
            const start = Math.max(2, safePage - 1);
            const end = Math.min(totalPages - 1, safePage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (safePage < totalPages - 2) pages.push('…');
            pages.push(totalPages);
          }
          const btnBase: React.CSSProperties = {
            width: 32, height: 32, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: fm, fontSize: 13, cursor: 'pointer', userSelect: 'none' as const, transition: 'background 0.15s',
          };
          return (
            <div style={{ borderTop: '1px solid #2A3143', padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: fm, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                Showing {startIdx}-{endIdx} of {filtered.length} executions
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <span
                  onClick={() => { if (safePage > 1) setCurrentPage(safePage - 1); }}
                  style={{ ...btnBase, border: '1px solid #2A3143', color: safePage > 1 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', cursor: safePage > 1 ? 'pointer' : 'not-allowed' }}
                >‹</span>
                {pages.map((p, i) => p === '…' ? (
                  <span key={`dots-${i}`} style={{ ...btnBase, color: 'rgba(255,255,255,0.3)', cursor: 'default', padding: '0 4px' }}>…</span>
                ) : (
                  <span
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    style={{
                      ...btnBase,
                      background: p === safePage ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: p === safePage ? '#fff' : 'rgba(255,255,255,0.4)',
                      fontWeight: p === safePage ? 700 : 400,
                    }}
                    onMouseEnter={e => { if (p !== safePage) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (p !== safePage) e.currentTarget.style.background = 'transparent'; }}
                  >{p}</span>
                ))}
                <span
                  onClick={() => { if (safePage < totalPages) setCurrentPage(safePage + 1); }}
                  style={{ ...btnBase, border: '1px solid #2A3143', color: safePage < totalPages ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', cursor: safePage < totalPages ? 'pointer' : 'not-allowed' }}
                >›</span>
              </div>
            </div>
          );
        })()}

        {/* Notes tooltip */}
        {notesTooltip && (
          <div style={{ position: 'fixed', left: Math.min(notesTooltip.x, window.innerWidth - 380), top: notesTooltip.y - 10, transform: 'translateY(-100%)', background: '#141822', borderTop: '1px solid #2A3143', borderRight: '1px solid #2A3143', borderBottom: '1px solid #2A3143', borderLeft: '1px solid #2A3143', borderRadius: 8, padding: 12, maxWidth: 350, fontFamily: fm, fontSize: 13, color: '#c9cdd4', lineHeight: 1.6, zIndex: 50, whiteSpace: 'normal', pointerEvents: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
            {notesTooltip.text}
          </div>
        )}
      </div>

      {/* ── FLOATING AI CHAT WIDGET ── */}
      <AIChatWidget
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        messages={aiMessages}
        input={aiInput}
        setInput={setAiInput}
        onSend={sendToCoach}
        loading={aiLoading}
        welcomeMsg={welcomeMsg}
      />
      <style>{`
        @keyframes livePulse {
          0% { box-shadow: 0 0 0 0 rgba(0,212,160,0.4); }
          70% { box-shadow: 0 0 0 4px rgba(0,212,160,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,212,160,0); }
        }
      `}</style>
    </div>
  );
}

