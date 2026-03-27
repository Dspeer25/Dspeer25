'use client';

import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import Link from 'next/link';

/* ── Logo ─────────────────────────────────────────── */
function JournalXLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="20" r="18" fill="url(#logoGlow)" opacity="0.25" />
        <g transform="translate(14, 8) rotate(-15, 10, 16)">
          <circle cx="10" cy="4" r="3.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" />
          <line x1="10" y1="7.5" x2="10" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="10" y1="11" x2="4" y2="7" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="10" y1="11" x2="16" y2="7" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="10" y1="18" x2="6" y2="24" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="10" y1="18" x2="14" y2="24" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" strokeLinecap="round" />
        </g>
        <line x1="24" y1="4" x2="24" y2="0" stroke="rgba(48,196,139,0.5)" strokeWidth="1" strokeLinecap="round" />
        <line x1="19" y1="6" x2="17" y2="2" stroke="rgba(48,196,139,0.3)" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="29" y1="6" x2="31" y2="2" stroke="rgba(48,196,139,0.3)" strokeWidth="0.8" strokeLinecap="round" />
        <defs>
          <radialGradient id="logoGlow" cx="0.5" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="#30C48B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#30C48B" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
      <span className="text-sm font-medium tracking-wide text-[#999]">Journal X</span>
    </div>
  );
}

/* ── Candlestick CTA — shaped like a big bullish candle ── */
function CandlestickCTA({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="group relative bg-transparent mb-16">
      {/* Glass plate underneath the candle */}
      <div
        className="absolute -inset-8 rounded-[40px]"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 rgba(255,255,255,0.04)',
        }}
      />

      {/* The candlestick itself */}
      <div className="relative flex flex-col items-center">
        {/* Upper wick */}
        <div
          className="w-[3px] h-16 rounded-full mb-0"
          style={{ background: 'linear-gradient(to bottom, rgba(48,196,139,0.3), rgba(48,196,139,0.8))' }}
        />

        {/* Candle body — the main interactive element */}
        <div
          className="relative w-40 sm:w-48 rounded-2xl flex flex-col items-center justify-center text-center py-16 sm:py-20 transition-all duration-500 group-hover:scale-[1.03] cursor-pointer"
          style={{
            background: 'linear-gradient(180deg, rgba(48,196,139,0.25) 0%, rgba(48,196,139,0.15) 100%)',
            border: '1px solid rgba(48,196,139,0.35)',
            boxShadow: '0 0 60px rgba(48,196,139,0.12), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 rgba(255,255,255,0.05)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
          }}
        >
          {/* Glass highlight on top of candle */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/3" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)' }} />
          </div>

          <div className="relative z-10">
            <div className="text-[#999] text-[9px] uppercase tracking-[0.3em] mb-4">Begin</div>
            <div className="text-xl sm:text-2xl font-light mb-1 leading-tight">Start Your</div>
            <div className="text-xl sm:text-2xl font-light text-[#30C48B] leading-tight">Journal</div>
          </div>
        </div>

        {/* Lower wick */}
        <div
          className="w-[3px] h-10 rounded-full mt-0"
          style={{ background: 'linear-gradient(to top, rgba(48,196,139,0.3), rgba(48,196,139,0.8))' }}
        />
      </div>

      {/* Outer glow ring */}
      <div className="absolute -inset-12 rounded-[48px] border border-[rgba(255,255,255,0.06)] group-hover:border-[rgba(48,196,139,0.15)] transition-all duration-700" />
    </button>
  );
}

/* ── Candlestick Background ───────────────────────── */
function CandlestickBackground() {
  const candles = [
    { x: 40, o: 280, c: 220, h: 200, l: 300 }, { x: 70, o: 220, c: 240, h: 210, l: 260 },
    { x: 100, o: 240, c: 200, h: 180, l: 260 }, { x: 130, o: 200, c: 170, h: 150, l: 220 },
    { x: 160, o: 170, c: 190, h: 150, l: 210 }, { x: 190, o: 190, c: 160, h: 140, l: 210 },
    { x: 220, o: 160, c: 140, h: 120, l: 180 }, { x: 250, o: 140, c: 180, h: 120, l: 200 },
    { x: 280, o: 180, c: 150, h: 130, l: 200 }, { x: 310, o: 150, c: 130, h: 110, l: 170 },
    { x: 340, o: 130, c: 160, h: 110, l: 180 }, { x: 370, o: 160, c: 140, h: 120, l: 180 },
    { x: 400, o: 140, c: 120, h: 100, l: 160 }, { x: 430, o: 120, c: 150, h: 100, l: 170 },
    { x: 460, o: 150, c: 170, h: 90, l: 190 }, { x: 490, o: 170, c: 140, h: 120, l: 190 },
    { x: 520, o: 140, c: 160, h: 110, l: 180 }, { x: 550, o: 160, c: 130, h: 110, l: 180 },
    { x: 580, o: 130, c: 150, h: 100, l: 170 }, { x: 610, o: 150, c: 120, h: 100, l: 170 },
    { x: 640, o: 120, c: 140, h: 90, l: 160 }, { x: 670, o: 140, c: 110, h: 90, l: 160 },
    { x: 700, o: 110, c: 130, h: 80, l: 150 }, { x: 730, o: 130, c: 150, h: 80, l: 170 },
    { x: 760, o: 150, c: 120, h: 100, l: 170 }, { x: 790, o: 120, c: 145, h: 95, l: 165 },
    { x: 820, o: 145, c: 130, h: 105, l: 165 }, { x: 850, o: 130, c: 155, h: 95, l: 170 },
    { x: 880, o: 155, c: 140, h: 115, l: 175 }, { x: 910, o: 140, c: 160, h: 100, l: 180 },
    { x: 940, o: 160, c: 135, h: 110, l: 175 }, { x: 970, o: 135, c: 155, h: 105, l: 170 },
  ];
  const ma9: string[] = [], ma21: string[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i >= 8) { let s = 0; for (let j = i-8; j<=i; j++) s+=(candles[j].o+candles[j].c)/2; ma9.push(`${candles[i].x},${s/9}`); }
    if (i >= 20) { let s = 0; for (let j = i-20; j<=i; j++) s+=(candles[j].o+candles[j].c)/2; ma21.push(`${candles[i].x},${s/21}`); }
  }
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.08]">
      <svg viewBox="0 0 1024 400" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
        {candles.map((c, i) => {
          const bull = c.c < c.o; const color = bull ? '#30C48B' : '#f87171';
          const top = Math.min(c.o, c.c); const h = Math.abs(c.o - c.c);
          return (<g key={i}><line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={color} strokeWidth="1" /><rect x={c.x-5} y={top} width={10} height={Math.max(h,2)} fill={color} rx="1" /></g>);
        })}
        {ma9.length > 1 && <polyline points={ma9.join(' ')} fill="none" stroke="#30C48B" strokeWidth="1.5" opacity="0.7" />}
        {ma21.length > 1 && <polyline points={ma21.join(' ')} fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.5" />}
      </svg>
    </div>
  );
}

/* ── How It Works Modal ───────────────────────────── */
function HowItWorksModal({ onSelectPlan, onClose }: { onSelectPlan: () => void; onClose: () => void }) {
  const steps = [
    { num: '01', title: 'Sign Up', desc: 'Create your account in seconds. You\'re already here.' },
    { num: '02', title: 'Tell Us Your Story', desc: 'Share your experience level, goals, and trading rules. The AI tailors the entire experience to YOUR trading level.' },
    { num: '03', title: 'Trade with Accountability', desc: 'Log trades, track performance, and let AI hold you accountable in real-time.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative glass rounded-3xl p-10 sm:p-12 max-w-3xl w-full animate-fade-in">
        <button onClick={onClose} className="absolute top-5 right-6 text-[#555] hover:text-white text-lg transition-colors bg-transparent">&#10005;</button>

        <h2 className="text-3xl font-light text-center mb-3 tracking-tight">How Journal X Works</h2>
        <p className="text-[#888] text-center text-sm mb-12">Three steps to trading with real accountability.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12 items-start">
          {steps.map((s, i) => (
            <div key={s.num} className="flex flex-col items-center text-center relative">
              <div className="w-14 h-14 rounded-full glass flex items-center justify-center mb-5">
                <span className="text-[#30C48B] font-semibold text-sm">{s.num}</span>
              </div>
              <h3 className="font-medium text-base mb-2">{s.title}</h3>
              <p className="text-xs text-[#888] leading-relaxed">{s.desc}</p>

              {i < steps.length - 1 && (
                <div className="hidden sm:flex absolute top-6 -right-6 items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14m0 0l-5-5m5 5l-5 5" stroke="#30C48B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onSelectPlan}
            className="px-10 py-4 rounded-full font-medium text-base transition-all bg-[#30C48B] hover:bg-[#28A876] text-black"
            style={{ boxShadow: '0 0 30px rgba(48, 196, 139, 0.2)' }}
          >
            Select Plan
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Pricing Modal ────────────────────────────────── */
function PricingModal({ onClose }: { onClose: () => void }) {
  const features = [
    { name: 'Trade Logging', essential: true, full: true },
    { name: 'Weekly Goal Setting', essential: true, full: true },
    { name: 'Smart Stats & Analytics', essential: true, full: true },
    { name: 'Calendar PnL View', essential: true, full: true },
    { name: 'Daily Journal', essential: true, full: true },
    { name: 'Performance Grading (ABCDF)', essential: true, full: true },
    { name: 'Risk Management Lockout', essential: true, full: true },
    { name: 'Toolkit (Calculators, Checklists)', essential: true, full: true },
    { name: 'AI Accountability Coach', essential: false, full: true, hasInfo: true },
    { name: 'Real-Time AI Chat (Mark Douglas)', essential: false, full: true },
    { name: 'AI Weekly Check-in Reviews', essential: false, full: true },
    { name: 'AI Rule Violation Detection', essential: false, full: true },
  ];

  const handleCheckout = async (tier: 'essential' | 'complete') => {
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier }) });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; } else { window.location.href = `/sign-up?tier=${tier}`; }
    } catch { window.location.href = '/sign-up'; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative glass rounded-3xl p-10 sm:p-12 max-w-3xl w-full animate-fade-in">
        <button onClick={onClose} className="absolute top-5 right-6 text-[#555] hover:text-white text-lg transition-colors bg-transparent">&#10005;</button>

        <h2 className="text-3xl font-light text-center mb-3 tracking-tight">Choose Your Plan</h2>
        <p className="text-[#888] text-center text-sm mb-10">One-time payment. Lifetime access. No subscriptions.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {/* Essential */}
          <div
            className="glass rounded-2xl p-7 flex flex-col transition-all duration-300"
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 60px rgba(48,196,139,0.25), 0 0 120px rgba(48,196,139,0.10)';
              e.currentTarget.style.borderColor = 'rgba(48,196,139,0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.borderColor = '';
            }}
          >
            <div className="text-xs text-[#888] uppercase tracking-[0.2em] mb-2">Essential</div>
            <div className="text-4xl font-light mb-1">$25</div>
            <div className="text-sm text-[#30C48B] mb-6">one-time payment</div>
            <ul className="space-y-2.5 flex-1">
              {features.map((f) => (
                <li key={`e-${f.name}`} className="flex items-center gap-2.5 text-sm">
                  {f.essential
                    ? <span className="text-[#30C48B] text-xs shrink-0">&#10003;</span>
                    : <span className="text-[#f87171]/40 text-xs shrink-0">&#10005;</span>}
                  <span className={f.essential ? 'text-[#ddd]' : 'text-[#555] line-through'}>{f.name}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('essential')}
              className="mt-7 w-full py-3 rounded-full font-medium text-sm transition-all glass glass-hover"
            >
              Get Essential
            </button>
          </div>

          {/* Complete */}
          <div
            className="glass rounded-2xl p-7 flex flex-col relative transition-all duration-300"
            style={{ borderColor: 'rgba(48,196,139,0.3)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 70px rgba(48,196,139,0.3), 0 0 140px rgba(48,196,139,0.12)';
              e.currentTarget.style.borderColor = 'rgba(48,196,139,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.borderColor = 'rgba(48,196,139,0.3)';
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#30C48B] to-transparent" />
            <div className="text-xs text-[#30C48B] uppercase tracking-[0.2em] mb-2 font-medium">Complete</div>
            <div className="text-4xl font-light mb-1">$50</div>
            <div className="text-sm text-[#30C48B] mb-6">one-time payment</div>
            <ul className="space-y-2.5 flex-1">
              {features.map((f) => (
                <li key={`c-${f.name}`} className="flex items-center gap-2.5 text-sm">
                  <span className="text-[#30C48B] text-xs shrink-0">&#10003;</span>
                  <span className="text-[#ddd]">{f.name}</span>
                  {f.hasInfo && (
                    <span className="relative group/tip inline-flex">
                      <span className="w-4 h-4 rounded-full glass text-[9px] inline-flex items-center justify-center text-[#999] cursor-help">?</span>
                      <span
                        className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-72 glass rounded-xl p-4 text-xs text-[#bbb] leading-relaxed z-[100] pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 whitespace-normal"
                      >
                        <strong className="text-white block mb-1">AI Accountability Coach</strong>
                        Modeled after Mark Douglas&apos; trading psychology (&quot;Trading in the Zone&quot;). Has full access to your past stats, logged trades, and stated goals — holds you accountable in real time. When you break a rule, it asks why. Not punishment — reflection.
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('complete')}
              className="mt-7 w-full py-3 rounded-full font-medium text-sm bg-[#30C48B] hover:bg-[#28A876] transition-all text-black"
              style={{ boxShadow: '0 0 30px rgba(48,196,139,0.15)' }}
            >
              Get Complete
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#555]">Secure checkout powered by Stripe.</p>
      </div>
    </div>
  );
}

/* ── Landing Page ─────────────────────────────────── */
export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  const openPricingFromSteps = () => {
    setShowHowItWorks(false);
    setShowPricing(true);
  };

  return (
    <div className="min-h-screen text-white relative">
      <CandlestickBackground />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <JournalXLogo />
        <div className="flex items-center gap-6">
          {isSignedIn ? (
            <Link href="/dashboard" className="text-sm text-[#999] hover:text-white transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm text-[#777] hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" className="text-sm px-5 py-2 rounded-full transition-all glass glass-hover">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] px-8">
        <p className="text-sm text-[#888] tracking-wide mb-16">The first AI-powered accountability trading journal</p>

        {/* THE CANDLESTICK CTA */}
        <CandlestickCTA onClick={() => setShowHowItWorks(true)} />

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light leading-[1.15] mb-6 tracking-tight text-center max-w-3xl">
          Your trades. <span className="text-[#30C48B]">Your rules.</span><br />
          <span className="text-[#666]">Real accountability.</span>
        </h1>

        <p className="text-base text-[#888] max-w-lg mx-auto leading-relaxed text-center">
          Journal X doesn&apos;t just track your trades — it holds you to the goals you set.
        </p>

        <p className="text-xs text-[#555] mt-16">One-time payment &middot; Full access forever &middot; No subscriptions</p>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 py-32">
        <h2 className="text-center text-3xl font-light mb-4 tracking-tight">Not just a journal. A trading coach.</h2>
        <p className="text-center text-[#888] text-sm mb-16 max-w-md mx-auto">AI that knows your trading history, your goals, and your tendencies.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { title: 'Weekly Check-ins', desc: 'Start each week with intention. Set goals, reflect, trade with a plan.', num: '01' },
            { title: 'AI Accountability', desc: 'Break a rule? The AI asks why. Not punishment — reflection.', num: '02' },
            { title: 'Smart Stats', desc: 'Upload your data in any format. AI analyzes patterns and tells you what works.', num: '03' },
            { title: 'Real-time Coach', desc: 'Chat with an AI modeled after Mark Douglas\' trading psychology.', num: '04' },
            { title: 'Trade Logging', desc: 'Fast, clean, zero friction. Log trades in seconds.', num: '05' },
            { title: 'Performance Insights', desc: 'AI-generated insights comparing performance against stated goals.', num: '06' },
          ].map((f) => (
            <div key={f.title} className="glass glass-hover rounded-2xl p-7 transition-all duration-300">
              <div className="text-xs text-[#30C48B] mb-4 font-medium">{f.num}.</div>
              <h3 className="font-medium text-base mb-2">{f.title}</h3>
              <p className="text-sm text-[#999] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-8 py-24 text-center">
        <div className="glass rounded-3xl p-12">
          <h2 className="text-3xl font-light mb-5 tracking-tight">Stop trading without accountability.</h2>
          <p className="text-[#888] mb-10 max-w-md mx-auto text-sm leading-relaxed">
            The difference between profitable and unprofitable traders? Discipline. Journal X makes discipline automatic.
          </p>
          <button
            onClick={() => setShowHowItWorks(true)}
            className="px-10 py-4 rounded-full font-medium text-base transition-all glass glass-hover"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(255,255,255,0.06)] py-10 text-center text-xs text-[#555]">
        Journal X — The first AI-powered accountability journal for traders.
      </footer>

      {showHowItWorks && <HowItWorksModal onSelectPlan={openPricingFromSteps} onClose={() => setShowHowItWorks(false)} />}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </div>
  );
}
