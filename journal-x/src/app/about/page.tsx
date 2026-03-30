'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function AboutPage() {
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
      style={light ? { background: '#f5f5f0', color: '#1a1c2e' } : {}}
    >
      {light && (
        <style>{`
          body { background: #f5f5f0 !important; color: #1a1c2e !important; }
          body::before { opacity: 0.04 !important; }
        `}</style>
      )}

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <JournalXLogo light={light} />
        <div className="flex items-center gap-5">
          <Link href="/" className={`text-[14px] transition-colors ${light ? 'text-[#8a8d98] hover:text-black' : 'text-[#8a8d98] hover:text-white'}`}>
            Home
          </Link>
          <button onClick={() => setLight(!light)}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${light ? 'bg-[#222] text-white hover:bg-[#3a3d48]' : 'glass text-[#8a8d98] hover:text-white'}`}>
            {light ? '\u{1F319}' : '\u{2600}\u{FE0F}'}
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-8 pt-12 pb-24">
        <h1 className={`text-4xl font-light tracking-tight mb-4 ${light ? 'text-[#1a1c2e]' : 'text-white'}`}>About Journal X</h1>
        <p className={`text-[14px] mb-12 ${light ? 'text-[#8a8d98]' : 'text-[#8a8d98]'}`}>The first AI-powered accountability journal built for traders.</p>

        <div className={`${glassPanelCls} rounded-2xl p-8 mb-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
          <h2 className="text-[18px] font-medium mb-4 text-[#30C48B]">Why We Built This</h2>
          <p className={`text-[14px] leading-relaxed mb-4 ${light ? 'text-[#5a5d68]' : 'text-[#e0e0e8]'}`}>
            Most traders lose money not because they lack a strategy — but because they lack discipline.
            They know their rules, but they break them. They set goals, but they don&apos;t follow through.
            They journal for a week, then stop.
          </p>
          <p className={`text-[14px] leading-relaxed mb-4 ${light ? 'text-[#5a5d68]' : 'text-[#e0e0e8]'}`}>
            Journal X was built to solve this problem. It&apos;s not just a place to log trades — it&apos;s an AI-powered
            accountability system that watches your behavior, detects patterns, and holds you to the standards
            you set for yourself.
          </p>
          <p className={`text-[14px] leading-relaxed ${light ? 'text-[#5a5d68]' : 'text-[#e0e0e8]'}`}>
            The AI coach is modeled after the principles of Mark Douglas (&quot;Trading in the Zone&quot;) — focused on
            process over outcome, discipline over emotion, and self-awareness over self-judgment.
          </p>
        </div>

        <div className={`${glassPanelCls} rounded-2xl p-8 mb-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
          <h2 className="text-[18px] font-medium mb-4 text-[#30C48B]">How It Works</h2>
          <div className="space-y-4">
            {[
              { step: '01', title: 'Log Your Trades', desc: 'Record every trade with the details that matter — entry, exit, risk, result, and your rationale.' },
              { step: '02', title: 'Set Your Goals', desc: 'Define weekly and monthly targets. The AI tracks your progress and calls out when you\'re drifting.' },
              { step: '03', title: 'Talk to the Coach', desc: 'After every trade, the AI asks the right questions. Not judgment — reflection. Why did you take this trade? Did it follow your plan?' },
              { step: '04', title: 'Grow Your Profile', desc: 'Over time, your Trader Profile builds — a data-driven map of your strengths, weaknesses, and tendencies.' },
            ].map((s) => (
              <div key={s.step} className="flex gap-4">
                <span className="text-[14px] font-bold text-[#30C48B] flex-shrink-0 w-8">{s.step}</span>
                <div>
                  <h3 className={`text-[16px] font-medium mb-1 ${light ? 'text-[#3a3d48]' : 'text-white'}`}>{s.title}</h3>
                  <p className={`text-[14px] leading-relaxed ${light ? 'text-[#8a8d98]' : 'text-[#e0e0e8]'}`}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${glassPanelCls} rounded-2xl p-8 mb-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
          <h2 className="text-[18px] font-medium mb-4 text-[#30C48B]">Pricing</h2>
          <p className={`text-[14px] leading-relaxed mb-4 ${light ? 'text-[#5a5d68]' : 'text-[#e0e0e8]'}`}>
            Journal X is a one-time purchase. No subscriptions. No recurring fees. Pay once, use it forever.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-xl p-5 text-center ${light ? 'bg-[rgba(0,0,0,0.02)]' : 'bg-[rgba(255,255,255,0.03)]'}`}>
              <div className={`text-[12px] font-bold tracking-[0.2em] uppercase mb-2 ${light ? 'text-[#8a8d98]' : 'text-[#8a8d98]'}`}>Essential</div>
              <div className={`text-3xl font-light mb-1 ${light ? 'text-[#1a1c2e]' : 'text-white'}`}>$35</div>
              <div className="text-[14px] text-[#30C48B]">All features, no AI coach</div>
            </div>
            <div className={`rounded-xl p-5 text-center border border-[rgba(48,196,139,0.2)] ${light ? 'bg-[rgba(0,0,0,0.02)]' : 'bg-[rgba(255,255,255,0.03)]'}`}>
              <div className="text-[12px] font-bold tracking-[0.2em] uppercase mb-2 text-[#30C48B]">Complete</div>
              <div className={`text-3xl font-light mb-1 ${light ? 'text-[#1a1c2e]' : 'text-white'}`}>$75</div>
              <div className="text-[14px] text-[#30C48B]">Everything + AI Coach</div>
            </div>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            href="/"
            className="inline-block px-10 py-4 rounded-full font-medium text-[16px] bg-[#30C48B] hover:bg-[#28A876] text-black transition-all"
            style={{ boxShadow: '0 0 30px rgba(48,196,139,0.15)' }}
          >
            Get Started
          </Link>
        </div>
      </main>

      <footer className={`relative z-10 border-t py-10 text-center text-[14px] ${light ? 'border-[rgba(0,0,0,0.06)] text-[#bbb]' : 'border-[rgba(255,255,255,0.06)] text-[#8a8d98]'}`}>
        Journal X — The first AI-powered accountability journal for traders.
      </footer>
    </div>
  );
}
