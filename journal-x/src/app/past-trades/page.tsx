'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Trade, INSTRUMENTS } from '@/lib/types';

/* ── Logo ── */
function JournalXLogo({ light = false }: { light?: boolean }) {
  const c = light ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.75)';
  const cl = light ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.65)';
  const leg = light ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)';
  return (
    <Link href="/" className="flex flex-col items-start">
      <svg width="52" height="52" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="12" r="4.5" stroke={c} strokeWidth="1.8" fill="none" />
        <line x1="18" y1="16.5" x2="18" y2="30" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="18" y1="21" x2="12" y2="27" stroke={cl} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="21" x2="32" y2="17" stroke={cl} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="30" x2="13" y2="40" stroke={leg} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="30" x2="23" y2="40" stroke={leg} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="35" y1="6" x2="35" y2="11" stroke="#30C48B" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="32" y="11" width="6" height="14" rx="1.5" fill="rgba(48,196,139,0.35)" stroke="#30C48B" strokeWidth="1" />
        <line x1="35" y1="25" x2="35" y2="32" stroke="#30C48B" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <div className="mt-[-2px] ml-[2px]">
        <span className="text-[11px] font-bold tracking-[0.35em] uppercase" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif", color: light ? '#333' : '#bbb' }}>Journal</span>
        <span className="text-[11px] font-bold tracking-[0.35em] uppercase text-[#30C48B] ml-[2px]" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}>X</span>
      </div>
    </Link>
  );
}

const navItems = ['Log a Trade', 'Past Trades', 'Analysis', 'Trading Goals', 'Trader Profile'] as const;
const navPaths = ['/log-trade', '/past-trades', '/analysis', '/trading-goals', '/trader-profile'] as const;

/* ── Demo trades ── */
function makeDemoTrades(): Trade[] {
  const tickers = [
    { t: 'AAPL', logo: 'https://logo.clearbit.com/apple.com' },
    { t: 'TSLA', logo: 'https://logo.clearbit.com/tesla.com' },
    { t: 'NVDA', logo: 'https://logo.clearbit.com/nvidia.com' },
    { t: 'SPY', logo: 'https://logo.clearbit.com/ssga.com' },
    { t: 'AMZN', logo: 'https://logo.clearbit.com/amazon.com' },
    { t: 'META', logo: 'https://logo.clearbit.com/meta.com' },
    { t: 'MSFT', logo: 'https://logo.clearbit.com/microsoft.com' },
    { t: 'QQQ', logo: 'https://logo.clearbit.com/invesco.com' },
    { t: 'AMD', logo: 'https://logo.clearbit.com/amd.com' },
    { t: 'GOOGL', logo: 'https://logo.clearbit.com/google.com' },
  ];
  const instruments = ['0DTE Call', '0DTE Put', 'Stock Long', 'Call Spread', 'Scalp', 'Swing Call', 'Put Spread', 'Stock Short'];
  const strategies = ['VWAP reclaim', 'Breakout', 'Opening range', 'Mean reversion', 'Gap fill', 'Trend continuation', 'Reversal', 'Momentum scalp', 'Support bounce', 'Breakdown fade'];
  const results: ('W' | 'L' | 'BE')[] = ['W', 'W', 'W', 'L', 'L', 'W', 'BE', 'W', 'L', 'W'];
  const trades: Trade[] = [];

  for (let i = 0; i < 20; i++) {
    const tk = tickers[i % tickers.length];
    const r = results[i % results.length];
    const risk = Math.round((50 + Math.random() * 200) * 100) / 100;
    const adjRisk = Math.round((risk + (Math.random() - 0.5) * 40) * 100) / 100;
    const pnl = r === 'W' ? Math.round((risk * (1 + Math.random() * 3)) * 100) / 100
      : r === 'L' ? -Math.round((risk * (0.5 + Math.random() * 0.8)) * 100) / 100 : 0;
    const rr = r === 'W' && risk > 0 ? Math.round((pnl / risk) * 100) / 100 : 0;

    const d = new Date();
    d.setDate(d.getDate() - i * Math.ceil(Math.random() * 3));

    trades.push({
      id: `demo-${i}`,
      date: d.toISOString().split('T')[0],
      ticker: tk.t,
      tickerLogo: tk.logo,
      time: `${9 + Math.floor(Math.random() * 6)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      tradeType: Math.random() > 0.3 ? 'Day' : 'Swing',
      direction: Math.random() > 0.3 ? 'Long' : 'Short',
      instrument: instruments[i % instruments.length],
      strategy: strategies[i % strategies.length],
      entryPrice: 100 + Math.random() * 300,
      exitPrice: 100 + Math.random() * 300,
      positionSize: Math.floor(10 + Math.random() * 200),
      initialRisk: risk,
      adjustedRisk: adjRisk,
      result: r,
      dollarPnl: pnl,
      rr,
      notes: '',
      starred: false,
      grade: '',
      customFields: {},
    });
  }
  return trades;
}

/* ── Ticker Autocomplete ── */
interface TickerResult { ticker: string; name: string; type: string; logo: string; }

function TickerAutocomplete({ value, onChange, light, onSelect }: {
  value: string; onChange: (v: string) => void; light: boolean;
  onSelect: (ticker: string, logo: string) => void;
}) {
  const [results, setResults] = useState<TickerResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/tickers/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setOpen(true);
    } catch { setResults([]); }
    setLoading(false);
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 250);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const inputCls = `w-full rounded-lg px-3 py-2 text-sm outline-none transition-all ${
    light
      ? 'bg-white/80 border border-[rgba(0,0,0,0.10)] text-[#1a1a1a] placeholder-[#bbb] focus:border-[#30C48B]'
      : 'bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-[#eee] placeholder-[#666] focus:border-[#30C48B]'
  }`;

  return (
    <div ref={ref} className="relative">
      <input value={value} onChange={e => handleChange(e.target.value.toUpperCase())}
        placeholder="Search ticker..." className={`${inputCls} uppercase`}
        onFocus={() => { if (results.length) setOpen(true); }}
      />
      {loading && <div className="absolute right-2 top-2.5 w-3 h-3 border-2 border-[#30C48B] border-t-transparent rounded-full animate-spin" />}
      {open && results.length > 0 && (
        <div className={`absolute z-50 top-full mt-1 left-0 right-0 rounded-xl overflow-hidden shadow-xl ${
          light ? 'bg-white border border-[rgba(0,0,0,0.08)]' : 'bg-[#1e1e1e] border border-[rgba(255,255,255,0.10)]'
        }`}>
          {results.map(r => (
            <button key={r.ticker} type="button"
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                light ? 'hover:bg-[rgba(0,0,0,0.03)]' : 'hover:bg-[rgba(255,255,255,0.05)]'
              }`}
              onClick={() => { onSelect(r.ticker, r.logo); setOpen(false); onChange(r.ticker); }}>
              {r.logo ? (
                <img src={r.logo} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold ${
                  light ? 'bg-[#eee] text-[#666]' : 'bg-[rgba(255,255,255,0.1)] text-[#888]'
                }`}>{r.ticker.slice(0, 2)}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${light ? 'text-[#1a1a1a]' : 'text-white'}`}>{r.ticker}</div>
                <div className={`text-[10px] truncate ${light ? 'text-[#999]' : 'text-[#777]'}`}>{r.name}</div>
              </div>
              <span className={`text-[10px] uppercase tracking-wider ${light ? 'text-[#bbb]' : 'text-[#555]'}`}>{r.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Time periods ── */
const periods = ['1D', '1W', '1M', 'QTR', '1Y', 'Max'] as const;
type Period = typeof periods[number];

function filterByPeriod(trades: Trade[], period: Period): Trade[] {
  if (period === 'Max') return trades;
  const now = new Date();
  const cutoff = new Date();
  if (period === '1D') cutoff.setDate(now.getDate() - 1);
  else if (period === '1W') cutoff.setDate(now.getDate() - 7);
  else if (period === '1M') cutoff.setMonth(now.getMonth() - 1);
  else if (period === 'QTR') cutoff.setMonth(now.getMonth() - 3);
  else if (period === '1Y') cutoff.setFullYear(now.getFullYear() - 1);
  const cs = cutoff.toISOString().split('T')[0];
  return trades.filter(t => t.date >= cs);
}

/* ── Sort ── */
type SortCol = 'date' | 'ticker' | 'instrument' | 'strategy' | 'result' | 'initialRisk' | 'adjustedRisk' | 'rr' | 'dollarPnl';

/* ── Page ── */
export default function PastTradesPage() {
  const { isSignedIn } = useAuth();
  const [light, setLight] = useState(false);
  const [trades, setTrades] = useState<Trade[]>(() => makeDemoTrades());
  const [period, setPeriod] = useState<Period>('Max');
  const [resultFilter, setResultFilter] = useState<'' | 'W' | 'L' | 'BE'>('');
  const [tickerSearch, setTickerSearch] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const perPage = 6;

  useEffect(() => {
    const saved = localStorage.getItem('jx-theme');
    if (saved === 'light') setLight(true);
  }, []);
  useEffect(() => { localStorage.setItem('jx-theme', light ? 'light' : 'dark'); }, [light]);

  // Filter
  let filtered = filterByPeriod(trades, period);
  if (resultFilter) filtered = filtered.filter(t => t.result === resultFilter);
  if (tickerSearch) filtered = filtered.filter(t => t.ticker.includes(tickerSearch.toUpperCase()));

  // Sort
  filtered = [...filtered].sort((a, b) => {
    const av = a[sortCol];
    const bv = b[sortCol];
    if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
    return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  // Stats
  const totalTrades = filtered.length;
  const wins = filtered.filter(t => t.result === 'W').length;
  const losses = filtered.filter(t => t.result === 'L').length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const totalPnl = Math.round(filtered.reduce((s, t) => s + t.dollarPnl, 0) * 100) / 100;
  const avgRR = totalTrades > 0 ? Math.round((filtered.reduce((s, t) => s + t.rr, 0) / totalTrades) * 100) / 100 : 0;

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(0);
  };

  const updateTrade = (id: string, updates: Partial<Trade>) => {
    setTrades(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates };
      if (updates.dollarPnl !== undefined || updates.initialRisk !== undefined) {
        const pnl = updates.dollarPnl ?? t.dollarPnl;
        const risk = updates.initialRisk ?? t.initialRisk;
        updated.rr = risk > 0 && updated.result === 'W' ? Math.round((pnl / risk) * 100) / 100 : 0;
      }
      return updated;
    }));
  };

  // Style helpers
  const glassCls = light
    ? 'bg-white/60 border border-[rgba(0,0,0,0.06)] shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
    : 'glass';
  const labelCls = `text-[12px] font-bold tracking-[0.2em] uppercase ${light ? 'text-[#999]' : 'text-[#777]'}`;
  const cellInputCls = `rounded-lg px-2 py-1.5 text-xs outline-none w-full transition-all ${
    light
      ? 'bg-white/80 border border-[rgba(0,0,0,0.08)] text-[#1a1a1a] focus:border-[#30C48B]'
      : 'bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.10)] text-[#eee] focus:border-[#30C48B]'
  }`;
  const thCls = (col: SortCol) => `text-left cursor-pointer select-none transition-colors hover:text-[#30C48B] ${
    sortCol === col ? 'text-[#30C48B]' : (light ? 'text-[#999]' : 'text-[#777]')
  }`;

  const SortArrow = ({ col }: { col: SortCol }) => sortCol === col ? (
    <span className="ml-1 text-[8px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
  ) : null;

  return (
    <div className="min-h-screen relative transition-colors duration-500" style={light ? { background: '#f5f5f0', color: '#1a1a1a' } : {}}>
      {light && <style>{`body{background:#f5f5f0!important;color:#1a1a1a!important}body::before{opacity:0.04!important}`}</style>}

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <JournalXLogo light={light} />
        <div className="flex items-center gap-5">
          {isSignedIn && <Link href="/dashboard" className={`text-sm transition-colors ${light ? 'text-[#666] hover:text-black' : 'text-[#999] hover:text-white'}`}>Dashboard</Link>}
          <button onClick={() => setLight(!light)} className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${light ? 'bg-[#222] text-white hover:bg-[#333]' : 'glass text-[#999] hover:text-white'}`}>
            {light ? '\u{1F319}' : '\u{2600}\u{FE0F}'}
          </button>
        </div>
      </nav>

      <div className="relative z-10 flex items-center justify-center gap-8 sm:gap-12 px-8 pt-2 pb-4 max-w-7xl mx-auto flex-wrap">
        {navItems.map((item, i) => (
          <Link key={item} href={navPaths[i]} className={`text-[11px] font-bold tracking-[0.35em] uppercase transition-colors ${i === 1 ? 'text-[#30C48B]' : light ? 'text-[#aaa] hover:text-[#333]' : 'text-[#666] hover:text-[#ccc]'}`}
            style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}>{item}</Link>
        ))}
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-8 pt-6 pb-24">
        <div className="mb-8">
          <h1 className={`text-3xl font-light tracking-tight mb-2 ${light ? 'text-[#1a1a1a]' : 'text-white'}`}>Past Trades</h1>
          <p className={`text-[14px] ${light ? 'text-[#888]' : 'text-[#999]'}`}>Review, filter, and edit every trade you&apos;ve logged.</p>
        </div>

        {/* ─── Stats Bar ─── */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total Trades', value: totalTrades.toString() },
            { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 50 ? '#30C48B' : '#f87171' },
            { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`, color: totalPnl >= 0 ? '#30C48B' : '#f87171' },
            { label: 'Avg R:R', value: avgRR.toFixed(2), color: avgRR >= 1 ? '#30C48B' : '#f87171' },
            { label: 'W / L', value: `${wins} / ${losses}` },
          ].map(s => (
            <div key={s.label} className={`${glassCls} rounded-xl p-4 text-center`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
              <div className={labelCls}>{s.label}</div>
              <div className={`text-xl font-light mt-1 ${light ? 'text-[#1a1a1a]' : 'text-white'}`} style={s.color ? { color: s.color } : {}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ─── Filters Row ─── */}
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          {/* Period selector — pill tabs */}
          <div className="flex items-center gap-0 relative">
            {periods.map(p => (
              <button key={p} onClick={() => { setPeriod(p); setPage(0); }}
                className={`px-3 py-1.5 text-[12px] font-bold tracking-[0.15em] uppercase transition-all relative ${
                  period === p ? 'text-[#30C48B]' : light ? 'text-[#bbb] hover:text-[#666]' : 'text-[#666] hover:text-[#ccc]'
                }`}>
                {p}
                {period === p && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-[#30C48B] rounded-full" />}
              </button>
            ))}
          </div>

          <div className={`w-px h-5 ${light ? 'bg-[rgba(0,0,0,0.08)]' : 'bg-[rgba(255,255,255,0.08)]'}`} />

          {/* Result filter */}
          <div className="flex items-center gap-0">
            {(['', 'W', 'L', 'BE'] as const).map(r => (
              <button key={r || 'all'} onClick={() => { setResultFilter(r); setPage(0); }}
                className={`px-3 py-1.5 text-[12px] font-bold tracking-[0.15em] uppercase transition-all relative ${
                  resultFilter === r ? 'text-[#30C48B]' : light ? 'text-[#bbb] hover:text-[#666]' : 'text-[#666] hover:text-[#ccc]'
                }`}>
                {r || 'All'}
                {resultFilter === r && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-[#30C48B] rounded-full" />}
              </button>
            ))}
          </div>

          <div className={`w-px h-5 ${light ? 'bg-[rgba(0,0,0,0.08)]' : 'bg-[rgba(255,255,255,0.08)]'}`} />

          {/* Ticker search */}
          <div className="w-48">
            <TickerAutocomplete value={tickerSearch} onChange={v => { setTickerSearch(v); setPage(0); }}
              light={light} onSelect={(t) => { setTickerSearch(t); setPage(0); }} />
          </div>
        </div>

        {/* ─── Trade Table ─── */}
        <div className={`${glassCls} rounded-2xl overflow-hidden`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
          {/* Header */}
          <div className={`grid grid-cols-[90px_90px_120px_130px_60px_80px_80px_65px_85px_40px] gap-0 px-5 py-3 border-b ${
            light ? 'border-[rgba(0,0,0,0.04)]' : 'border-[rgba(255,255,255,0.04)]'
          }`}>
            <button className={`${thCls('date')} text-[12px] font-bold tracking-[0.15em] uppercase`} onClick={() => handleSort('date')}>Date<SortArrow col="date" /></button>
            <button className={`${thCls('ticker')} text-[12px] font-bold tracking-[0.15em] uppercase`} onClick={() => handleSort('ticker')}>Ticker<SortArrow col="ticker" /></button>
            <button className={`${thCls('instrument')} text-[12px] font-bold tracking-[0.15em] uppercase`} onClick={() => handleSort('instrument')}>Instrument<SortArrow col="instrument" /></button>
            <button className={`${thCls('strategy')} text-[12px] font-bold tracking-[0.15em] uppercase`} onClick={() => handleSort('strategy')}>Strategy<SortArrow col="strategy" /></button>
            <button className={`${thCls('result')} text-[12px] font-bold tracking-[0.15em] uppercase`} onClick={() => handleSort('result')}>Result<SortArrow col="result" /></button>
            <button className={`${thCls('initialRisk')} text-[12px] font-bold tracking-[0.15em] uppercase`} onClick={() => handleSort('initialRisk')}>Init Risk<SortArrow col="initialRisk" /></button>
            <button className={`${thCls('adjustedRisk')} text-[12px] font-bold tracking-[0.15em] uppercase`} onClick={() => handleSort('adjustedRisk')}>Adj Risk<SortArrow col="adjustedRisk" /></button>
            <button className={`${thCls('rr')} text-[12px] font-bold tracking-[0.15em] uppercase`} onClick={() => handleSort('rr')}>R:R<SortArrow col="rr" /></button>
            <button className={`${thCls('dollarPnl')} text-[12px] font-bold tracking-[0.15em] uppercase`} onClick={() => handleSort('dollarPnl')}>P&L<SortArrow col="dollarPnl" /></button>
            <div />
          </div>

          {/* Rows */}
          {paged.map(trade => {
            const editing = editingId === trade.id;
            return (
              <div key={trade.id}
                className={`grid grid-cols-[90px_90px_120px_130px_60px_80px_80px_65px_85px_40px] gap-0 px-5 py-3 items-center border-b transition-colors ${
                  light ? 'border-[rgba(0,0,0,0.03)] hover:bg-[rgba(0,0,0,0.015)]' : 'border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)]'
                }`}>
                {/* Date */}
                <div className={`text-xs ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>
                  {new Date(trade.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>

                {/* Ticker */}
                <div className="flex items-center gap-1.5">
                  {trade.tickerLogo ? (
                    <img src={trade.tickerLogo} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                      light ? 'bg-[#eee] text-[#888]' : 'bg-[rgba(255,255,255,0.08)] text-[#888]'
                    }`}>{trade.ticker.slice(0, 2)}</div>
                  )}
                  <span className={`text-xs font-medium ${light ? 'text-[#1a1a1a]' : 'text-white'}`}>{trade.ticker}</span>
                </div>

                {/* Instrument */}
                {editing ? (
                  <select value={trade.instrument} onChange={e => updateTrade(trade.id, { instrument: e.target.value })} className={cellInputCls}>
                    <option value="">—</option>
                    {INSTRUMENTS.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                  </select>
                ) : (
                  <div className={`text-xs ${light ? 'text-[#777]' : 'text-[#aaa]'}`}>{trade.instrument || '—'}</div>
                )}

                {/* Strategy */}
                {editing ? (
                  <input value={trade.strategy} onChange={e => updateTrade(trade.id, { strategy: e.target.value })}
                    className={cellInputCls} placeholder="Strategy..." />
                ) : (
                  <div className={`text-xs truncate ${light ? 'text-[#777]' : 'text-[#aaa]'}`}>{trade.strategy || '—'}</div>
                )}

                {/* Result */}
                {editing ? (
                  <select value={trade.result} onChange={e => updateTrade(trade.id, { result: e.target.value as 'W' | 'L' | 'BE' })} className={cellInputCls}>
                    <option value="W">W</option>
                    <option value="L">L</option>
                    <option value="BE">BE</option>
                  </select>
                ) : (
                  <span className={`text-xs font-bold ${trade.result === 'W' ? 'text-[#30C48B]' : trade.result === 'L' ? 'text-[#f87171]' : 'text-[#fbbf24]'}`}>
                    {trade.result}
                  </span>
                )}

                {/* Init Risk */}
                {editing ? (
                  <input type="number" value={trade.initialRisk} onChange={e => updateTrade(trade.id, { initialRisk: parseFloat(e.target.value) || 0 })}
                    className={cellInputCls} />
                ) : (
                  <div className={`text-xs tabular-nums ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>${trade.initialRisk.toFixed(0)}</div>
                )}

                {/* Adj Risk */}
                {editing ? (
                  <input type="number" value={trade.adjustedRisk} onChange={e => updateTrade(trade.id, { adjustedRisk: parseFloat(e.target.value) || 0 })}
                    className={cellInputCls} />
                ) : (
                  <div className={`text-xs tabular-nums ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>${trade.adjustedRisk.toFixed(0)}</div>
                )}

                {/* R:R */}
                <div className={`text-xs font-medium tabular-nums ${trade.rr > 0 ? 'text-[#30C48B]' : light ? 'text-[#999]' : 'text-[#666]'}`}>
                  {trade.rr > 0 ? `${trade.rr.toFixed(1)}R` : '—'}
                </div>

                {/* P&L */}
                {editing ? (
                  <input type="number" value={trade.dollarPnl} onChange={e => updateTrade(trade.id, { dollarPnl: parseFloat(e.target.value) || 0 })}
                    className={cellInputCls} />
                ) : (
                  <div className={`text-xs font-medium tabular-nums ${trade.dollarPnl > 0 ? 'text-[#30C48B]' : trade.dollarPnl < 0 ? 'text-[#f87171]' : light ? 'text-[#999]' : 'text-[#666]'}`}>
                    {trade.dollarPnl > 0 ? '+' : ''}{trade.dollarPnl !== 0 ? `$${trade.dollarPnl.toFixed(0)}` : '—'}
                  </div>
                )}

                {/* Edit toggle */}
                <button onClick={() => setEditingId(editing ? null : trade.id)}
                  className={`text-xs transition-colors ${editing ? 'text-[#30C48B]' : light ? 'text-[#ccc] hover:text-[#666]' : 'text-[#555] hover:text-[#ccc]'}`}>
                  {editing ? '✓' : '✎'}
                </button>
              </div>
            );
          })}

          {paged.length === 0 && (
            <div className={`px-5 py-12 text-center text-sm ${light ? 'text-[#bbb]' : 'text-[#666]'}`}>No trades match your filters.</div>
          )}

          {/* Pagination */}
          <div className={`flex items-center justify-between px-5 py-3 border-t ${light ? 'border-[rgba(0,0,0,0.04)]' : 'border-[rgba(255,255,255,0.04)]'}`}>
            <span className={`text-[12px] ${light ? 'text-[#999]' : 'text-[#777]'}`}>
              {filtered.length > 0 ? `${page * perPage + 1}–${Math.min((page + 1) * perPage, filtered.length)} of ${filtered.length}` : '0 trades'}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className={`text-[12px] font-bold tracking-[0.1em] uppercase px-3 py-1 rounded-lg transition-all disabled:opacity-30 ${
                  light ? 'text-[#666] hover:bg-[rgba(0,0,0,0.04)]' : 'text-[#999] hover:bg-[rgba(255,255,255,0.05)]'
                }`}>Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className={`text-[12px] font-bold tracking-[0.1em] uppercase px-3 py-1 rounded-lg transition-all disabled:opacity-30 ${
                  light ? 'text-[#666] hover:bg-[rgba(0,0,0,0.04)]' : 'text-[#999] hover:bg-[rgba(255,255,255,0.05)]'
                }`}>Next</button>
            </div>
          </div>
        </div>
      </main>

      <footer className={`relative z-10 border-t py-10 text-center text-[14px] ${light ? 'border-[rgba(0,0,0,0.06)] text-[#bbb]' : 'border-[rgba(255,255,255,0.06)] text-[#666]'}`}>
        Journal X — The first AI-powered accountability journal for traders.
      </footer>
    </div>
  );
}
