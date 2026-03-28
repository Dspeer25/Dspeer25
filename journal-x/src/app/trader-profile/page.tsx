'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { demoTrades, computeAttributes } from '@/lib/demoData';
import AttributeWheel from '@/components/AttributeWheel';

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

/* ── Nav ── */
const navItems = ['Log a Trade', 'Past Trades', 'Analysis', 'Trading Goals', 'Trader Profile'] as const;
const navPaths = ['/log-trade', '/past-trades', '/analysis', '/trading-goals', '/trader-profile'] as const;

function getGradeFromOvr(ovr: number): string {
  if (ovr >= 85) return 'Elite';
  if (ovr >= 75) return 'Pro';
  if (ovr >= 65) return 'Solid';
  if (ovr >= 50) return 'Developing';
  return 'Rookie';
}

export default function TraderProfilePage() {
  const { isSignedIn } = useAuth();
  const [light, setLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('jx-theme');
    if (saved === 'light') setLight(true);
  }, []);
  useEffect(() => {
    localStorage.setItem('jx-theme', light ? 'light' : 'dark');
  }, [light]);

  const attributes = useMemo(() => computeAttributes(demoTrades), []);
  const overallRating = Math.round(attributes.reduce((s, a) => s + a.value, 0) / attributes.length);
  const grade = getGradeFromOvr(overallRating);

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
            <Link href="/dashboard" className={`text-sm transition-colors ${light ? 'text-[#666] hover:text-black' : 'text-[#999] hover:text-white'}`}>
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
              i === 4 ? 'text-[#30C48B]' : light ? 'text-[#aaa] hover:text-[#333]' : 'text-[#666] hover:text-[#ccc]'
            }`}
            style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}>
            {item}
          </Link>
        ))}
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-8 pt-8 pb-24">
        {/* Header with OVR */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-light tracking-tight mb-2 ${light ? 'text-[#1a1a1a]' : 'text-white'}`}>Trader Profile</h1>
            <p className={`text-[14px] ${light ? 'text-[#888]' : 'text-[#999]'}`}>
              Your attributes — built from every trade logged and every coach conversation.
            </p>
          </div>
          {/* OVR circle */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke={light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'} strokeWidth="6" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#30C48B" strokeWidth="6"
                  strokeDasharray={`${(overallRating / 99) * 264} 264`}
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(48,196,139,0.4))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-[12px] font-bold tracking-[0.2em] uppercase ${light ? 'text-[#999]' : 'text-[#777]'}`}>OVR</span>
                <span className={`text-2xl font-bold ${light ? 'text-[#1a1a1a]' : 'text-white'}`}>{overallRating}</span>
              </div>
            </div>
            <span className="text-[12px] font-bold tracking-[0.2em] uppercase text-[#30C48B] mt-1">{grade}</span>
          </div>
        </div>

        {/* ─── The Wheel ─── */}
        <div className={`${glassPanelCls} rounded-2xl p-6 sm:p-8 mb-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
          <AttributeWheel attrs={attributes} light={light} />
        </div>

        {/* ─── Strengths & Weaknesses side by side ─── */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`${glassPanelCls} rounded-xl p-5`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <span className="text-[12px] font-black tracking-[0.2em] uppercase text-[#30C48B] block mb-4">Top Strengths</span>
            {[...attributes].sort((a, b) => b.value - a.value).slice(0, 5).map((attr, i) => (
              <div key={i} className="flex items-center justify-between mb-2.5">
                <span className={`text-xs ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>{attr.name}</span>
                <span className="text-xs font-bold text-[#30C48B] tabular-nums">{attr.value}</span>
              </div>
            ))}
          </div>
          <div className={`${glassPanelCls} rounded-xl p-5`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <span className="text-[12px] font-black tracking-[0.2em] uppercase text-[#f87171] block mb-4">Needs Work</span>
            {[...attributes].sort((a, b) => a.value - b.value).slice(0, 5).map((attr, i) => (
              <div key={i} className="flex items-center justify-between mb-2.5">
                <span className={`text-xs ${light ? 'text-[#555]' : 'text-[#ccc]'}`}>{attr.name}</span>
                <span className="text-xs font-bold text-[#f87171] tabular-nums">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Coach Observations ─── */}
        <div className={`${glassPanelCls} rounded-xl p-6 mb-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
          <span className="text-[12px] font-black tracking-[0.2em] uppercase text-[#30C48B] block mb-4">Coach Observations</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { note: 'Tends to widen stops after entry — work on trusting initial risk.', tag: 'Risk Mgmt', color: '#60a5fa' },
              { note: 'Strong pattern recognition on breakouts, but chases when missing the initial move.', tag: 'Psychology', color: '#f59e0b' },
              { note: 'Consistently grades own execution honestly. Good self-awareness.', tag: 'Discipline', color: '#30C48B' },
              { note: 'Exits winners too early — leaving R on the table. Let runners run.', tag: 'Execution', color: '#a78bfa' },
            ].map((item, i) => (
              <div key={i} className={`text-[14px] leading-relaxed ${light ? 'text-[#666]' : 'text-[#bbb]'}`}>
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase mr-2" style={{ color: item.color }}>{item.tag}</span>
                {item.note}
              </div>
            ))}
          </div>
        </div>

        {/* $50 plan note */}
        <div className={`${glassPanelCls} rounded-xl p-6 text-center`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
          <p className={`text-[14px] mb-1 ${light ? 'text-[#999]' : 'text-[#888]'}`}>
            Your Trader Profile evolves with every trade you log and every coach conversation.
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
