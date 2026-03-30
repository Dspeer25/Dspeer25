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
        <span className="text-[11px] font-bold tracking-[0.35em] uppercase" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif", color: light ? '#3a3d48' : '#bbb' }}>Journal</span>
        <span className="text-[11px] font-bold tracking-[0.35em] uppercase text-[#30C48B] ml-[2px]" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}>X</span>
      </div>
    </Link>
  );
}

const navItems = ['Log a Trade', 'Past Trades', 'Analysis', 'Trading Goals', 'Trader Profile'] as const;
const navPaths = ['/log-trade', '/past-trades', '/analysis', '/trading-goals', '/trader-profile'] as const;

/* ── Two weeks of goals ── */
const weeks = [
  {
    label: 'Week of Mar 17',
    goals: [
      { goal: 'Only take A+ pullback setups off narrow MAs', status: 'on-track' as const, progress: 65 },
      { goal: 'Max 3 trades per day — no overtrading', status: 'on-track' as const, progress: 85 },
      { goal: 'No revenge trades after a loss', status: 'completed' as const, progress: 100 },
      { goal: 'Hold swing trades for minimum 2 days', status: 'at-risk' as const, progress: 50 },
      { goal: 'Review pre-market levels before first trade', status: 'on-track' as const, progress: 75 },
      { goal: 'Keep max daily drawdown under $300', status: 'at-risk' as const, progress: 55 },
      { goal: 'Journal emotional state before each session', status: 'completed' as const, progress: 100 },
    ],
    coachNote: 'Last week was a mixed bag. You revenge-traded twice after losses on Tuesday and Thursday — both resulted in additional drawdown. Your A+ setups had a 70% hit rate when you stuck to the plan, but impulse entries dragged your overall performance down. The emotional journaling habit hasn\'t taken hold yet — only 2 out of 5 sessions logged. Focus on that this week.',
  },
  {
    label: 'Week of Mar 24',
    goals: [
      { goal: 'Only take A+ pullback setups off narrow MAs', status: 'on-track' as const, progress: 80 },
      { goal: 'Max 3 trades per day — no overtrading', status: 'on-track' as const, progress: 100 },
      { goal: 'No revenge trades after a loss', status: 'at-risk' as const, progress: 60 },
      { goal: 'Hold swing trades for minimum 2 days', status: 'behind' as const, progress: 35 },
      { goal: 'Review pre-market levels before first trade', status: 'on-track' as const, progress: 90 },
      { goal: 'Keep max daily drawdown under $300', status: 'on-track' as const, progress: 85 },
      { goal: 'Journal emotional state before each session', status: 'at-risk' as const, progress: 55 },
    ],
    coachNote: 'Improvement across the board this week. You cut revenge trades from 2 to 1 — progress, but not yet eliminated. Pre-market prep is now a habit at 90% compliance. Your max drawdown stayed controlled at $280, well under the $300 target. The swing trade holding goal is still the weakest link — you exited NVDA after 6 hours instead of the 2-day minimum. Work on trusting your thesis.',
  },
];

const monthlyGoals = [
  { goal: 'Maintain 60%+ win rate on breakout setups', current: '68%', target: '60%', met: true },
  { goal: 'Keep max daily loss under $500', current: '$320 max', target: '$500', met: true },
  { goal: 'Average R-multiple above 1.5', current: '1.8R', target: '1.5R', met: true },
  { goal: 'Reduce impulse trades to fewer than 2/week', current: '3/week', target: '2/week', met: false },
];

export default function TradingGoalsPage() {
  const { isSignedIn } = useAuth();
  const [light, setLight] = useState(false);
  const [weekIdx, setWeekIdx] = useState(1); // default to current week

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

  const statusColor = (s: string) => s === 'completed' ? '#30C48B' : s === 'on-track' ? '#30C48B' : s === 'at-risk' ? '#f59e0b' : '#f87171';
  const statusLabel = (s: string) => s === 'completed' ? 'Completed' : s === 'on-track' ? 'On Track' : s === 'at-risk' ? 'At Risk' : 'Behind';

  const currentWeek = weeks[weekIdx];

  return (
    <div
      className="min-h-screen relative transition-colors duration-500"
      style={light ? { background: '#f5f5f0', color: '#1a1c2e' } : {}}
    >
      {light && (
        <style>{`
          body { background: #f5f5f0 !important; color: #1a1c2e !important; }
          body::before { opacity: 0.04 !important; }
        `}</style>
      )}

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <JournalXLogo light={light} />
        <div className="flex items-center gap-5">
          {isSignedIn && (
            <Link href="/dashboard" className={`text-[14px] transition-colors ${light ? 'text-[#8a8d98] hover:text-black' : 'text-[#8a8d98] hover:text-white'}`}>Dashboard</Link>
          )}
          <button onClick={() => setLight(!light)}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${light ? 'bg-[#222] text-white hover:bg-[#3a3d48]' : 'glass text-[#8a8d98] hover:text-white'}`}>
            {light ? '\u{1F319}' : '\u{2600}\u{FE0F}'}
          </button>
        </div>
      </nav>

      <div className="relative z-10 flex items-center justify-center gap-8 sm:gap-12 px-8 pt-2 pb-4 max-w-7xl mx-auto flex-wrap">
        {navItems.map((item, i) => (
          <Link key={item} href={navPaths[i]}
            className={`text-[11px] font-bold tracking-[0.35em] uppercase transition-colors ${
              i === 3 ? 'text-[#30C48B]' : light ? 'text-[#e0e0e8] hover:text-[#3a3d48]' : 'text-[#8a8d98] hover:text-[#e0e0e8]'
            }`}
            style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}>
            {item}
          </Link>
        ))}
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-8 pt-8 pb-24">
        <div className="mb-10">
          <h1 className={`text-3xl font-light tracking-tight mb-2 ${light ? 'text-[#1a1c2e]' : 'text-white'}`}>Trading Goals</h1>
          <p className={`text-[14px] ${light ? 'text-[#8a8d98]' : 'text-[#8a8d98]'}`}>Set intentions, track progress, and let the AI hold you accountable.</p>
        </div>

        {/* Week Selector */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={() => setWeekIdx(0)}
            className={`text-[13px] font-medium transition-colors bg-transparent px-0 ${weekIdx === 0 ? 'text-[#30C48B]' : light ? 'text-[#e0e0e8] hover:text-[#3a3d48]' : 'text-[#8a8d98] hover:text-white'}`}
          >
            &larr; {weeks[0].label}
          </button>
          <div className={`w-px h-5 ${light ? 'bg-[rgba(0,0,0,0.1)]' : 'bg-[rgba(255,255,255,0.1)]'}`} />
          <button
            onClick={() => setWeekIdx(1)}
            className={`text-[13px] font-medium transition-colors bg-transparent px-0 ${weekIdx === 1 ? 'text-[#30C48B]' : light ? 'text-[#e0e0e8] hover:text-[#3a3d48]' : 'text-[#8a8d98] hover:text-white'}`}
          >
            {weeks[1].label} &rarr;
          </button>
        </div>

        {/* Weekly Goals */}
        <div className="mb-8">
          <span className="text-[12px] font-black tracking-[0.2em] uppercase text-[#30C48B] block mb-5">{currentWeek.label}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentWeek.goals.map((g, i) => (
              <div key={`${weekIdx}-${i}`} className={`${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
                <div className="flex items-start justify-between mb-4">
                  <span className={`text-[16px] font-bold leading-snug flex-1 mr-3 ${light ? 'text-[#3a3d48]' : 'text-[#eee]'}`}>{g.goal}</span>
                  <span
                    className="text-[13px] font-bold tracking-wider uppercase px-3 py-1 rounded-full shrink-0"
                    style={{
                      color: statusColor(g.status),
                      background: `${statusColor(g.status)}18`,
                      border: `1px solid ${statusColor(g.status)}30`,
                    }}
                  >
                    {statusLabel(g.status)}
                  </span>
                </div>
                <div className={`w-full h-3 rounded-full ${light ? 'bg-[rgba(0,0,0,0.04)]' : 'bg-[rgba(255,255,255,0.06)]'}`}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${g.progress}%`, background: statusColor(g.status), boxShadow: `0 0 8px ${statusColor(g.status)}44` }} />
                </div>
                <div className={`text-[12px] mt-2 text-right ${light ? 'text-[#e0e0e8]' : 'text-[#8a8d98]'}`}>{g.progress}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Targets */}
        <div className={`${glassPanelCls} rounded-2xl p-6 sm:p-8 mb-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
          <span className="text-[12px] font-black tracking-[0.2em] uppercase text-[#30C48B] block mb-6">Monthly Targets</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {monthlyGoals.map((g, i) => (
              <div key={i} className={`rounded-xl p-5 ${light ? 'bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)]' : 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]'}`}>
                <p className={`text-[16px] mb-3 ${light ? 'text-[#3a3d48]' : 'text-[#ddd]'}`}>{g.goal}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-[12px] uppercase tracking-wider ${light ? 'text-[#8a8d98]' : 'text-[#8a8d98]'}`}>Current: </span>
                    <span className={`text-[16px] font-bold ${g.met ? 'text-[#30C48B]' : 'text-[#f87171]'}`}>{g.current}</span>
                  </div>
                  <div>
                    <span className={`text-[12px] uppercase tracking-wider ${light ? 'text-[#8a8d98]' : 'text-[#8a8d98]'}`}>Target: </span>
                    <span className={`text-[16px] font-medium ${light ? 'text-[#5a5d68]' : 'text-[#e0e0e8]'}`}>{g.target}</span>
                  </div>
                  <span className={`text-[16px] font-bold ${g.met ? 'text-[#30C48B]' : 'text-[#f87171]'}`}>{g.met ? '\u2713' : '\u2717'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coach Note — changes per week */}
        <div className={`${glassPanelCls} rounded-xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#30C48B] animate-pulse" />
            <span className="text-[12px] font-bold tracking-[0.2em] uppercase text-[#30C48B]">Coach Note — {currentWeek.label}</span>
          </div>
          <p className={`text-[14px] leading-relaxed ${light ? 'text-[#5a5d68]' : 'text-[#e0e0e8]'}`}>
            {currentWeek.coachNote}
          </p>
        </div>
      </main>

      <footer className={`relative z-10 border-t py-10 text-center text-[14px] ${light ? 'border-[rgba(0,0,0,0.06)] text-[#bbb]' : 'border-[rgba(255,255,255,0.06)] text-[#8a8d98]'}`}>
        Journal X — The first AI-powered accountability journal for traders.
      </footer>
    </div>
  );
}
