'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { demoTrades, getCoachObservations } from '@/lib/demoData';

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
  { tag: 'PSYCHOLOGY', tagColor: '#FF6B35', text: 'You revenge-traded once this period after a loss on TSLA. It resulted in a further drawdown. Step away after losses.', linkText: 'View revenge trades' },
  { tag: 'RISK', tagColor: '#f59e0b', text: 'Average loss is well-controlled at $98, but 2 trades exceeded 1.5x your planned risk. Tighten stops on momentum scalps.', linkText: 'View risk data' },
  { tag: 'MILESTONE', tagColor: '#30C48B', text: 'Win rate at 61% this period — above your 55% baseline. Your planned setups are working. Stay disciplined.', linkText: 'View winning trades' },
];

/* ── Stat cards data (no emojis) ── */
const winRateBySetup = [
  { label: 'Breakout', value: 68, color: '#30C48B' },
  { label: 'Pullback', value: 54, color: '#f59e0b' },
  { label: 'Reversal', value: 31, color: '#f87171' },
  { label: 'Momentum', value: 72, color: '#30C48B' },
];

const performanceByTime = [
  { label: '9:30–10:30 AM', value: 1240, max: 1240, color: '#30C48B' },
  { label: '10:30–12:00 PM', value: 380, max: 1240, color: '#30C48B' },
  { label: '12:00–2:00 PM', value: -290, max: 1240, color: '#f87171' },
  { label: '2:00–4:00 PM', value: 150, max: 1240, color: '#f59e0b' },
];

const riskManagement = [
  { label: 'Avg Risk/Trade', value: '$142', color: '#60a5fa' },
  { label: 'Avg Winner', value: '+$312', color: '#30C48B' },
  { label: 'Avg Loser', value: '-$98', color: '#f87171' },
  { label: 'Win/Loss Ratio', value: '3.2:1', color: '#30C48B' },
];

const psychologyPatterns = [
  { label: 'Revenge Trades', value: '1 this month', color: '#f87171' },
  { label: 'FOMO Entries', value: '2 this month', color: '#f59e0b' },
  { label: 'Plan-Following', value: '82%', color: '#30C48B' },
  { label: 'Early Exits', value: '6 trades', color: '#f59e0b' },
];

const bestWorst = [
  { label: 'Best Day', value: '+$890 (Mar 12)', color: '#30C48B' },
  { label: 'Worst Day', value: '-$420 (Mar 8)', color: '#f87171' },
  { label: 'Longest Streak', value: '7 wins', color: '#30C48B' },
  { label: 'Max Drawdown', value: '-$640', color: '#f87171' },
];

const consistencyScore = [
  { label: 'This Week', value: '78/99', color: '#30C48B' },
  { label: 'Last Week', value: '65/99', color: '#f59e0b' },
  { label: 'Monthly Avg', value: '71/99', color: '#60a5fa' },
  { label: 'Trend', value: 'Improving', color: '#30C48B' },
];

/* ── Inline bar chart component ── */
function HorizontalBar({ label, pct, color, light }: { label: string; pct: number; color: string; light: boolean }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[14px] ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>{label}</span>
        <span className="text-[14px] font-bold tabular-nums" style={{ color }}>{pct}%</span>
      </div>
      <div className={`w-full h-2.5 rounded-full ${light ? 'bg-[rgba(0,0,0,0.04)]' : 'bg-[rgba(255,255,255,0.06)]'}`}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}44` }} />
      </div>
    </div>
  );
}

function PnlBar({ label, value, maxVal, color, light }: { label: string; value: number; maxVal: number; color: string; light: boolean }) {
  const pct = Math.abs(value) / maxVal * 100;
  const display = value >= 0 ? `+$${value.toLocaleString()}` : `-$${Math.abs(value).toLocaleString()}`;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[14px] ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>{label}</span>
        <span className="text-[14px] font-bold tabular-nums" style={{ color }}>{display}</span>
      </div>
      <div className={`w-full h-2.5 rounded-full ${light ? 'bg-[rgba(0,0,0,0.04)]' : 'bg-[rgba(255,255,255,0.06)]'}`}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}44` }} />
      </div>
    </div>
  );
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

        {/* Insight Cards Grid — no emojis, with bar charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Win Rate by Setup — with bar charts */}
          <div className={`${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <span className={`text-[12px] font-bold tracking-[0.15em] uppercase block mb-5 ${light ? 'text-[#888]' : 'text-[#999]'}`}>Win Rate by Setup</span>
            {winRateBySetup.map((item) => (
              <HorizontalBar key={item.label} label={item.label} pct={item.value} color={item.color} light={light} />
            ))}
          </div>

          {/* Performance by Time — with bar charts */}
          <div className={`${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <span className={`text-[12px] font-bold tracking-[0.15em] uppercase block mb-5 ${light ? 'text-[#888]' : 'text-[#999]'}`}>Performance by Time</span>
            {performanceByTime.map((item) => (
              <PnlBar key={item.label} label={item.label} value={item.value} maxVal={item.max} color={item.color} light={light} />
            ))}
          </div>

          {/* Risk Management */}
          <div className={`${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <span className={`text-[12px] font-bold tracking-[0.15em] uppercase block mb-5 ${light ? 'text-[#888]' : 'text-[#999]'}`}>Risk Management</span>
            <div className="space-y-3">
              {riskManagement.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className={`text-[14px] ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>{item.label}</span>
                  <span className="text-[14px] font-bold tabular-nums" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Psychology Patterns */}
          <div className={`${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <span className={`text-[12px] font-bold tracking-[0.15em] uppercase block mb-5 ${light ? 'text-[#888]' : 'text-[#999]'}`}>Psychology Patterns</span>
            <div className="space-y-3">
              {psychologyPatterns.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className={`text-[14px] ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>{item.label}</span>
                  <span className="text-[14px] font-bold tabular-nums" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Best & Worst */}
          <div className={`${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <span className={`text-[12px] font-bold tracking-[0.15em] uppercase block mb-5 ${light ? 'text-[#888]' : 'text-[#999]'}`}>Best & Worst</span>
            <div className="space-y-3">
              {bestWorst.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className={`text-[14px] ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>{item.label}</span>
                  <span className="text-[14px] font-bold tabular-nums" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Consistency Score */}
          <div className={`${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <span className={`text-[12px] font-bold tracking-[0.15em] uppercase block mb-5 ${light ? 'text-[#888]' : 'text-[#999]'}`}>Consistency Score</span>
            <div className="space-y-3">
              {consistencyScore.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className={`text-[14px] ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>{item.label}</span>
                  <span className="text-[14px] font-bold tabular-nums" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer note — 16px, green first sentence, clickable $75 link */}
        <div className={`${glassPanelCls} rounded-xl p-6 text-center mt-8`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
          <p className="text-[16px] mb-1">
            <span style={{ color: '#30C48B' }}>Analysis insights are generated from your real trading data by the AI coach.</span>{' '}
            <span className={light ? 'text-[#999]' : 'text-[#888]'}>
              Available with the Complete plan{' '}
              <button
                onClick={() => setShowPricing(true)}
                className="underline underline-offset-2 transition-colors"
                style={{ color: light ? '#333' : '#fff', background: 'none', padding: 0, fontSize: '16px' }}
              >
                $75 one-time
              </button>.
            </span>
          </p>
        </div>
      </main>

      <footer className={`relative z-10 border-t py-10 text-center text-[14px] ${light ? 'border-[rgba(0,0,0,0.06)] text-[#bbb]' : 'border-[rgba(255,255,255,0.06)] text-[#666]'}`}>
        Journal X — The first AI-powered accountability journal for traders.
      </footer>

      {/* Pricing modal stub */}
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
              <Link href="/sign-up?tier=complete" className="inline-block px-10 py-3 rounded-full font-medium text-base bg-[#30C48B] hover:bg-[#28A876] transition-all text-black" style={{ boxShadow: '0 0 30px rgba(48,196,139,0.15)' }}>
                Get Complete
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
