'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

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

/* Demo analysis data */
const insights = [
  {
    category: 'Win Rate by Setup',
    icon: '📊',
    items: [
      { label: 'Breakout', value: '68%', color: '#30C48B' },
      { label: 'Pullback', value: '54%', color: '#f59e0b' },
      { label: 'Reversal', value: '31%', color: '#f87171' },
      { label: 'Momentum', value: '72%', color: '#30C48B' },
    ],
  },
  {
    category: 'Performance by Time',
    icon: '⏰',
    items: [
      { label: '9:30–10:30 AM', value: '+$1,240', color: '#30C48B' },
      { label: '10:30–12:00 PM', value: '+$380', color: '#30C48B' },
      { label: '12:00–2:00 PM', value: '-$290', color: '#f87171' },
      { label: '2:00–4:00 PM', value: '+$150', color: '#f59e0b' },
    ],
  },
  {
    category: 'Risk Management',
    icon: '🛡️',
    items: [
      { label: 'Avg Risk/Trade', value: '$142', color: '#60a5fa' },
      { label: 'Avg Winner', value: '+$312', color: '#30C48B' },
      { label: 'Avg Loser', value: '-$98', color: '#f87171' },
      { label: 'Win/Loss Ratio', value: '3.2:1', color: '#30C48B' },
    ],
  },
  {
    category: 'Psychology Patterns',
    icon: '🧠',
    items: [
      { label: 'Revenge Trades', value: '4 this month', color: '#f87171' },
      { label: 'FOMO Entries', value: '2 this month', color: '#f59e0b' },
      { label: 'Plan-Following', value: '82%', color: '#30C48B' },
      { label: 'Early Exits', value: '6 trades', color: '#f59e0b' },
    ],
  },
  {
    category: 'Best & Worst',
    icon: '🏆',
    items: [
      { label: 'Best Day', value: '+$890 (Mar 12)', color: '#30C48B' },
      { label: 'Worst Day', value: '-$420 (Mar 8)', color: '#f87171' },
      { label: 'Longest Streak', value: '7 wins', color: '#30C48B' },
      { label: 'Max Drawdown', value: '-$640', color: '#f87171' },
    ],
  },
  {
    category: 'Consistency Score',
    icon: '📈',
    items: [
      { label: 'This Week', value: '78/99', color: '#30C48B' },
      { label: 'Last Week', value: '65/99', color: '#f59e0b' },
      { label: 'Monthly Avg', value: '71/99', color: '#60a5fa' },
      { label: 'Trend', value: '↑ Improving', color: '#30C48B' },
    ],
  },
];

const aiObservations = [
  'Your breakout entries have a significantly higher win rate than reversals. Consider reducing reversal position sizes by 50% until win rate improves.',
  'Morning session (9:30–10:30) accounts for 65% of your total profits. Your edge is strongest here — protect this time slot.',
  'After a losing trade, your next trade has a 38% win rate vs. your baseline 62%. Consider implementing a mandatory 15-minute cool-down.',
  'Your R-multiple on planned trades is 2.4x vs. -0.8x on impulse trades. Every impulse trade costs you an average of $180.',
];

export default function AnalysisPage() {
  const { isSignedIn } = useAuth();
  const [light, setLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('jx-theme');
    if (saved === 'light') setLight(true);
  }, []);
  useEffect(() => {
    localStorage.setItem('jx-theme', light ? 'light' : 'dark');
  }, [light]);

  const glassPanelCls = light
    ? 'bg-white/60 border border-[rgba(0,0,0,0.06)] shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
    : 'glass';

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

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <JournalXLogo light={light} />
        <div className="flex items-center gap-5">
          {isSignedIn && (
            <Link href="/dashboard" className={`text-[14px] transition-colors ${light ? 'text-[#666] hover:text-black' : 'text-[#999] hover:text-white'}`}>
              Dashboard
            </Link>
          )}
          <button onClick={() => setLight(!light)}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${light ? 'bg-[#222] text-white hover:bg-[#333]' : 'glass text-[#999] hover:text-white'}`}>
            {light ? '\u{1F319}' : '\u{2600}\u{FE0F}'}
          </button>
        </div>
      </nav>

      {/* Product nav */}
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

        {/* AI Observations */}
        <div className={`${glassPanelCls} rounded-2xl p-6 sm:p-8 mb-8`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-2 rounded-full bg-[#30C48B] animate-pulse" />
            <span className="text-[12px] font-bold tracking-[0.2em] uppercase text-[#30C48B]">AI Observations</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {aiObservations.map((obs, i) => (
              <div key={i} className={`text-[14px] leading-relaxed ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>
                <span className="text-[#30C48B] font-bold mr-1">{i + 1}.</span> {obs}
              </div>
            ))}
          </div>
        </div>

        {/* Insight Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {insights.map((group) => (
            <div key={group.category} className={`${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-lg">{group.icon}</span>
                <span className={`text-[12px] font-bold tracking-[0.15em] uppercase ${light ? 'text-[#888]' : 'text-[#999]'}`}>{group.category}</span>
              </div>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className={`text-[14px] ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>{item.label}</span>
                    <span className="text-[14px] font-bold tabular-nums" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Complete plan note */}
        <div className={`${glassPanelCls} rounded-xl p-6 text-center mt-8`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
          <p className={`text-[14px] mb-1 ${light ? 'text-[#999]' : 'text-[#888]'}`}>
            Analysis insights are generated from your real trading data by the AI coach.
          </p>
          <p className={`text-[12px] ${light ? 'text-[#bbb]' : 'text-[#666]'}`}>
            Available with the Complete plan ($75 one-time).
          </p>
        </div>
      </main>

      <footer className={`relative z-10 border-t py-10 text-center text-[14px] ${light ? 'border-[rgba(0,0,0,0.06)] text-[#bbb]' : 'border-[rgba(255,255,255,0.06)] text-[#666]'}`}>
        Journal X — The first AI-powered accountability journal for traders.
      </footer>
    </div>
  );
}
