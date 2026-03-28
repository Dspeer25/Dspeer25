'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { demoTrades } from '@/lib/demoData';

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

/* ── AI Observations with tags ── */
const aiObservationCards = [
  { tag: 'PATTERN', tagColor: '#4A9EFF', text: 'Your breakout entries have a 68% win rate, but reversals sit at 31%. The data suggests sizing down on counter-trend plays.', linkText: 'View breakout trades' },
  { tag: 'PSYCHOLOGY', tagColor: '#f59e0b', text: 'You revenge-traded once this period after a loss on TSLA. It resulted in a further drawdown. Step away after losses.', linkText: 'View revenge trades' },
  { tag: 'RISK', tagColor: '#f87171', text: 'Average loss is well-controlled at $98, but 2 trades exceeded 1.5x your planned risk. Tighten stops on momentum scalps.', linkText: 'View risk data' },
  { tag: 'MILESTONE', tagColor: '#30C48B', text: 'Win rate at 61% this period — above your 55% baseline. Your planned setups are working. Stay disciplined.', linkText: 'View winning trades' },
];

/* ── Compute stats from demo trades ── */
function computeStats(trades: typeof demoTrades) {
  const wins = trades.filter(t => t.result === 'W');
  const losses = trades.filter(t => t.result === 'L');
  const totalPnl = trades.reduce((s, t) => s + t.dollarPnl, 0);
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.dollarPnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.dollarPnl, 0) / losses.length) : 1;
  const grossWins = wins.reduce((s, t) => s + t.dollarPnl, 0);
  const grossLosses = Math.abs(losses.reduce((s, t) => s + t.dollarPnl, 0));

  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0;
  const expectedValue = trades.length > 0 ? totalPnl / trades.length : 0;
  const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.dollarPnl)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.dollarPnl)) : 0;

  // Max drawdown
  let peak = 0, maxDD = 0, running = 0;
  for (const t of trades) {
    running += t.dollarPnl;
    if (running > peak) peak = running;
    const dd = peak - running;
    if (dd > maxDD) maxDD = dd;
  }

  // Simplified Sharpe (mean return / std dev)
  const returns = trades.map(t => t.dollarPnl);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpe = stdDev > 0 ? mean / stdDev : 0;

  // Win rate by setup
  const setupMap = new Map<string, { wins: number; total: number }>();
  for (const t of trades) {
    const s = t.strategy;
    const entry = setupMap.get(s) || { wins: 0, total: 0 };
    entry.total++;
    if (t.result === 'W') entry.wins++;
    setupMap.set(s, entry);
  }
  const winRateBySetup = Array.from(setupMap.entries())
    .filter(([, v]) => v.total >= 1)
    .map(([k, v]) => ({ label: k, value: Math.round((v.wins / v.total) * 100) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Performance by time slot
  const timeSlots = [
    { label: '9:30–10:30', filter: (h: number) => h >= 9 && h < 10.5 },
    { label: '10:30–12:00', filter: (h: number) => h >= 10.5 && h < 12 },
    { label: '12:00–2:00', filter: (h: number) => h >= 12 && h < 14 },
    { label: '2:00–4:00', filter: (h: number) => h >= 14 && h <= 16 },
  ];
  const perfByTime = timeSlots.map(slot => {
    const hour = (t: typeof trades[0]) => {
      const parts = t.time.split(':');
      return parseInt(parts[0]) + parseInt(parts[1]) / 60;
    };
    const slotTrades = trades.filter(t => slot.filter(hour(t)));
    const pnl = slotTrades.reduce((s, t) => s + t.dollarPnl, 0);
    return { label: slot.label, value: Math.round(pnl) };
  });

  // Psychology
  const revengeCount = trades.filter(t => t.strategy.toLowerCase().includes('revenge')).length;
  const fomoCount = trades.filter(t => t.strategy.toLowerCase().includes('fomo') || t.strategy.toLowerCase().includes('impulse') || t.strategy.toLowerCase().includes('chase')).length;
  const plannedCount = trades.filter(t =>
    t.strategy.toLowerCase().includes('breakout') || t.strategy.toLowerCase().includes('pullback') ||
    t.strategy.toLowerCase().includes('a+ setup') || t.strategy.toLowerCase().includes('vwap')
  ).length;
  const planFollowing = trades.length > 0 ? Math.round((plannedCount / trades.length) * 100) : 0;

  // Early exits (wins with RR < 1)
  const earlyExits = wins.filter(t => t.rr > 0 && t.rr < 1).length;

  return {
    profitFactor: profitFactor === Infinity ? '∞' : profitFactor.toFixed(2),
    expectedValue: expectedValue >= 0 ? `+$${Math.round(expectedValue)}` : `-$${Math.abs(Math.round(expectedValue))}`,
    sharpe: sharpe.toFixed(2),
    maxDrawdown: `-$${Math.round(maxDD)}`,
    avgWinLoss: avgLoss > 0 ? (avgWin / avgLoss).toFixed(1) + ':1' : '—',
    largestWin: `+$${Math.round(largestWin)}`,
    largestLoss: `-$${Math.abs(Math.round(largestLoss))}`,
    winRateBySetup,
    perfByTime,
    revengeCount,
    fomoCount,
    planFollowing,
    earlyExits,
    avgWin: `+$${Math.round(avgWin)}`,
    avgLoss: `-$${Math.round(avgLoss)}`,
    avgRisk: `$${Math.round(trades.reduce((s, t) => s + t.initialRisk, 0) / (trades.length || 1))}`,
  };
}

export default function AnalysisPage() {
  const { isSignedIn } = useAuth();
  const [light, setLight] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('jx-theme');
    if (saved === 'light') setLight(true);
  }, []);
  useEffect(() => {
    localStorage.setItem('jx-theme', light ? 'light' : 'dark');
  }, [light]);

  const stats = useMemo(() => computeStats(demoTrades), []);

  const glassPanelCls = light
    ? 'bg-white/60 border border-[rgba(0,0,0,0.06)] shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
    : 'glass';

  const maxPerfAbs = Math.max(...stats.perfByTime.map(p => Math.abs(p.value)), 1);

  return (
    <div
      className="min-h-screen relative transition-colors duration-500"
      style={light ? { background: '#f5f5f0', color: '#1a1a1a' } : {}}
    >
      {light && (
        <style>{`
          body { background: #f5f5f0 !important; color: #1a1a1a !important; }
          body::before { opacity: 0.04 !important; }
        `}</style>
      )}

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <JournalXLogo light={light} />
        <div className="flex items-center gap-5">
          {isSignedIn && (
            <Link href="/dashboard" className={`text-[14px] transition-colors ${light ? 'text-[#666] hover:text-black' : 'text-[#999] hover:text-white'}`}>Dashboard</Link>
          )}
          <button onClick={() => setLight(!light)}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${light ? 'bg-[#222] text-white hover:bg-[#333]' : 'glass text-[#999] hover:text-white'}`}>
            {light ? '\u{1F319}' : '\u{2600}\u{FE0F}'}
          </button>
        </div>
      </nav>

      <div className="relative z-10 flex items-center justify-center gap-8 sm:gap-12 px-8 pt-2 pb-4 max-w-7xl mx-auto flex-wrap">
        {navItems.map((item, i) => (
          <Link key={item} href={navPaths[i]}
            className={`text-[11px] font-bold tracking-[0.35em] uppercase transition-colors ${
              i === 2 ? 'text-[#30C48B]' : light ? 'text-[#aaa] hover:text-[#333]' : 'text-[#666] hover:text-[#ccc]'
            }`}
            style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}>
            {item}
          </Link>
        ))}
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-8 pt-8 pb-24">
        <div className="mb-10">
          <h1 className={`text-3xl font-light tracking-tight mb-2 ${light ? 'text-[#1a1a1a]' : 'text-white'}`}>Analysis</h1>
          <p className={`text-[14px] ${light ? 'text-[#888]' : 'text-[#999]'}`}>AI-driven insights from your trading data — patterns, tendencies, and edge.</p>
        </div>

        {/* AI Observations — 2x2 glass cards with colored tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {aiObservationCards.map((obs, i) => (
            <div key={i} className={`${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: obs.tagColor }} />
                <span className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: obs.tagColor }}>{obs.tag}</span>
              </div>
              <p className={`text-[14px] leading-relaxed mb-3 ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>{obs.text}</p>
              <span className="text-[12px] font-medium text-[#30C48B] cursor-pointer hover:underline">{obs.linkText} &rarr;</span>
            </div>
          ))}
        </div>

        {/* Charts + metrics grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">

          {/* Win Rate by Setup — SVG horizontal bar chart */}
          <div className={`${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <span className={`text-[12px] font-bold tracking-[0.15em] uppercase block mb-5 text-[#30C48B]`}>Win Rate by Setup</span>
            <svg viewBox="0 0 260 160" className="w-full">
              {stats.winRateBySetup.map((item, i) => {
                const y = i * 32;
                const barW = (item.value / 100) * 170;
                const color = item.value >= 50 ? '#30C48B' : '#f87171';
                return (
                  <g key={item.label}>
                    <text x="0" y={y + 14} fill={light ? '#666' : '#bbb'} fontSize="11" fontWeight="500">{item.label}</text>
                    <rect x="85" y={y + 2} width={barW} height="14" rx="3" fill={color} opacity="0.8" />
                    <text x={85 + barW + 5} y={y + 14} fill={color} fontSize="11" fontWeight="bold">{item.value}%</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Performance by Time — SVG vertical bar chart */}
          <div className={`${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <span className={`text-[12px] font-bold tracking-[0.15em] uppercase block mb-5 text-[#30C48B]`}>Performance by Time</span>
            <svg viewBox="0 0 260 170" className="w-full">
              {/* Zero line */}
              <line x1="0" y1="100" x2="260" y2="100" stroke={light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'} strokeWidth="1" />
              {stats.perfByTime.map((item, i) => {
                const barX = 10 + i * 62;
                const barWidth = 42;
                const maxH = 80;
                const barH = (Math.abs(item.value) / maxPerfAbs) * maxH;
                const color = item.value >= 0 ? '#30C48B' : '#f87171';
                const barY = item.value >= 0 ? 100 - barH : 100;
                const display = item.value >= 0 ? `+$${item.value}` : `-$${Math.abs(item.value)}`;
                return (
                  <g key={item.label}>
                    <rect x={barX} y={barY} width={barWidth} height={barH} rx="4" fill={color} opacity="0.75" />
                    <text x={barX + barWidth / 2} y={item.value >= 0 ? barY - 5 : barY + barH + 13} textAnchor="middle" fill={color} fontSize="10" fontWeight="bold">{display}</text>
                    <text x={barX + barWidth / 2} y="155" textAnchor="middle" fill={light ? '#999' : '#777'} fontSize="8">{item.label}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Risk Management */}
          <div className={`${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <span className={`text-[12px] font-bold tracking-[0.15em] uppercase block mb-5 text-[#30C48B]`}>Risk Management</span>
            <div className="space-y-3">
              {[
                { label: 'Avg Risk/Trade', value: stats.avgRisk, color: '#60a5fa' },
                { label: 'Avg Winner', value: stats.avgWin, color: '#30C48B' },
                { label: 'Avg Loser', value: stats.avgLoss, color: '#f87171' },
                { label: 'Win/Loss Ratio', value: stats.avgWinLoss, color: '#30C48B' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className={`text-[14px] ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>{item.label}</span>
                  <span className="text-[14px] font-bold tabular-nums" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Psychology Patterns — 2x2 metric tiles */}
          <div className={`${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <span className={`text-[12px] font-bold tracking-[0.15em] uppercase block mb-5 text-[#30C48B]`}>Psychology Patterns</span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Revenge Trades', value: stats.revengeCount, color: '#f87171' },
                { label: 'FOMO Entries', value: stats.fomoCount, color: '#f59e0b' },
                { label: 'Plan Following', value: `${stats.planFollowing}%`, color: '#30C48B' },
                { label: 'Early Exits', value: stats.earlyExits, color: '#f59e0b' },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl p-3 text-center ${light ? 'bg-[rgba(0,0,0,0.02)]' : 'bg-[rgba(255,255,255,0.03)]'}`}>
                  <div className="text-2xl font-bold tabular-nums mb-1" style={{ color: item.color }}>{item.value}</div>
                  <div className={`text-[11px] uppercase tracking-wider ${light ? 'text-[#999]' : 'text-[#777]'}`}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Best & Worst */}
          <div className={`${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <span className={`text-[12px] font-bold tracking-[0.15em] uppercase block mb-5 text-[#30C48B]`}>Best & Worst</span>
            <div className="space-y-3">
              {[
                { label: 'Largest Win', value: stats.largestWin, color: '#30C48B' },
                { label: 'Largest Loss', value: stats.largestLoss, color: '#f87171' },
                { label: 'Max Drawdown', value: stats.maxDrawdown, color: '#f87171' },
                { label: 'Expected Value', value: stats.expectedValue, color: stats.expectedValue.startsWith('+') ? '#30C48B' : '#f87171' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className={`text-[14px] ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>{item.label}</span>
                  <span className="text-[14px] font-bold tabular-nums" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Consistency Score */}
          <div className={`${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <span className={`text-[12px] font-bold tracking-[0.15em] uppercase block mb-5 text-[#30C48B]`}>Consistency Score</span>
            <div className="space-y-3">
              {[
                { label: 'This Week', value: '78/99', color: '#30C48B' },
                { label: 'Last Week', value: '65/99', color: '#f59e0b' },
                { label: 'Monthly Avg', value: '71/99', color: '#60a5fa' },
                { label: 'Trend', value: 'Improving', color: '#30C48B' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className={`text-[14px] ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>{item.label}</span>
                  <span className="text-[14px] font-bold tabular-nums" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Statistical Analysis — 3-column grid */}
        <div className={`${glassPanelCls} rounded-2xl p-6 sm:p-8 mb-8`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
          <span className="text-[12px] font-bold tracking-[0.15em] uppercase block mb-6 text-[#30C48B]">Statistical Analysis</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Sharpe Ratio', value: '1.8', color: '#30C48B' },
              { label: 'Profit Factor', value: '2.3', color: '#30C48B' },
              { label: 'Expected Value', value: '+$47/trade', color: '#30C48B' },
              { label: 'Max Drawdown', value: '-$640', color: '#f87171' },
              { label: 'Avg Win / Avg Loss', value: '3.2:1', color: '#30C48B' },
              { label: 'Consistency Score', value: '74/99', color: '#30C48B' },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-4 text-center ${light ? 'bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)]' : 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]'}`}>
                <div className="text-xl font-bold tabular-nums mb-1" style={{ color: item.color }}>{item.value}</div>
                <div className={`text-[11px] uppercase tracking-wider ${light ? 'text-[#999]' : 'text-[#777]'}`}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`${glassPanelCls} rounded-xl p-6 text-center`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
          <p className="text-[16px] mb-1">
            <span style={{ color: '#30C48B' }}>Analysis insights are generated from your real trading data by the AI coach.</span>{' '}
            <span className={light ? 'text-[#999]' : 'text-[#888]'}>
              Available with the Complete plan{' '}
              <button onClick={() => setShowPricing(true)} className="underline underline-offset-2 transition-colors" style={{ color: light ? '#333' : '#fff', background: 'none', padding: 0, fontSize: '16px' }}>$75 one-time</button>.
            </span>
          </p>
        </div>
      </main>

      <footer className={`relative z-10 border-t py-10 text-center text-[14px] ${light ? 'border-[rgba(0,0,0,0.06)] text-[#bbb]' : 'border-[rgba(255,255,255,0.06)] text-[#666]'}`}>
        Journal X — The first AI-powered accountability journal for traders.
      </footer>

      {showPricing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 backdrop-blur-md bg-black/70" onClick={() => setShowPricing(false)} />
          <div className={`relative rounded-3xl p-10 sm:p-12 max-w-lg w-full animate-fade-in ${light ? 'bg-white/90 border border-[rgba(0,0,0,0.08)]' : 'glass'}`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <button onClick={() => setShowPricing(false)} className={`absolute top-5 right-6 text-lg transition-colors bg-transparent ${light ? 'text-[#aaa] hover:text-[#333]' : 'text-[#555] hover:text-white'}`}>&#10005;</button>
            <h2 className={`text-2xl font-light text-center mb-3 tracking-tight ${light ? 'text-[#1a1a1a]' : ''}`}>Complete Plan</h2>
            <div className="text-center mb-4">
              <span className={`text-4xl font-light ${light ? 'text-[#1a1a1a]' : 'text-white'}`}>$75</span>
              <span className="text-sm text-[#30C48B] ml-2">one-time payment</span>
            </div>
            <p className={`text-center text-[14px] mb-6 ${light ? 'text-[#999]' : 'text-[#888]'}`}>Lifetime access to AI coaching, analysis, and all features.</p>
            <div className="text-center">
              <Link href="/sign-up?tier=complete" className="inline-block px-10 py-3 rounded-full font-medium text-base bg-[#30C48B] hover:bg-[#28A876] transition-all text-black" style={{ boxShadow: '0 0 30px rgba(48,196,139,0.15)' }}>Get Complete</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
