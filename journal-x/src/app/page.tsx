'use client';

import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import Link from 'next/link';

/* ── Ascending Man Logo (SVG) ─────────────────────── */
function JournalXLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="20" r="18" fill="url(#logoGlow)" opacity="0.3" />
        <g transform="translate(14, 8) rotate(-15, 10, 16)">
          <circle cx="10" cy="4" r="3.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none" />
          <line x1="10" y1="7.5" x2="10" y2="18" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="10" y1="11" x2="4" y2="7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="10" y1="11" x2="16" y2="7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="10" y1="18" x2="6" y2="24" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="10" y1="18" x2="14" y2="24" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round" />
        </g>
        <line x1="24" y1="4" x2="24" y2="0" stroke="rgba(99,102,241,0.6)" strokeWidth="1" strokeLinecap="round" />
        <line x1="19" y1="6" x2="17" y2="2" stroke="rgba(99,102,241,0.4)" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="29" y1="6" x2="31" y2="2" stroke="rgba(99,102,241,0.4)" strokeWidth="0.8" strokeLinecap="round" />
        <defs>
          <radialGradient id="logoGlow" cx="0.5" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
      <span className="text-base font-semibold tracking-tight">Journal X</span>
    </div>
  );
}

/* ── Dark Felt Texture Background ─────────────────── */
function FeltBackground() {
  return (
    <div className="fixed inset-0 z-0">
      {/* Base dark color */}
      <div className="absolute inset-0 bg-[#0c0c0c]" />

      {/* SVG noise filter for felt grain texture — high frequency, visible */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="feltNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="6" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#feltNoise)" opacity="0.06" />
      </svg>

      {/* Subtle warm vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
}

/* ── Candlestick Background ───────────────────────── */
function CandlestickBackground() {
  const candles = [
    { x: 40, o: 280, c: 220, h: 200, l: 300 },
    { x: 70, o: 220, c: 240, h: 210, l: 260 },
    { x: 100, o: 240, c: 200, h: 180, l: 260 },
    { x: 130, o: 200, c: 170, h: 150, l: 220 },
    { x: 160, o: 170, c: 190, h: 150, l: 210 },
    { x: 190, o: 190, c: 160, h: 140, l: 210 },
    { x: 220, o: 160, c: 140, h: 120, l: 180 },
    { x: 250, o: 140, c: 180, h: 120, l: 200 },
    { x: 280, o: 180, c: 150, h: 130, l: 200 },
    { x: 310, o: 150, c: 130, h: 110, l: 170 },
    { x: 340, o: 130, c: 160, h: 110, l: 180 },
    { x: 370, o: 160, c: 140, h: 120, l: 180 },
    { x: 400, o: 140, c: 120, h: 100, l: 160 },
    { x: 430, o: 120, c: 150, h: 100, l: 170 },
    { x: 460, o: 150, c: 170, h: 90, l: 190 },
    { x: 490, o: 170, c: 140, h: 120, l: 190 },
    { x: 520, o: 140, c: 160, h: 110, l: 180 },
    { x: 550, o: 160, c: 130, h: 110, l: 180 },
    { x: 580, o: 130, c: 150, h: 100, l: 170 },
    { x: 610, o: 150, c: 120, h: 100, l: 170 },
    { x: 640, o: 120, c: 140, h: 90, l: 160 },
    { x: 670, o: 140, c: 110, h: 90, l: 160 },
    { x: 700, o: 110, c: 130, h: 80, l: 150 },
    { x: 730, o: 130, c: 150, h: 80, l: 170 },
    { x: 760, o: 150, c: 120, h: 100, l: 170 },
    { x: 790, o: 120, c: 145, h: 95, l: 165 },
    { x: 820, o: 145, c: 130, h: 105, l: 165 },
    { x: 850, o: 130, c: 155, h: 95, l: 170 },
    { x: 880, o: 155, c: 140, h: 115, l: 175 },
    { x: 910, o: 140, c: 160, h: 100, l: 180 },
    { x: 940, o: 160, c: 135, h: 110, l: 175 },
    { x: 970, o: 135, c: 155, h: 105, l: 170 },
    { x: 1000, o: 155, c: 145, h: 120, l: 175 },
  ];

  const ma9Points: string[] = [];
  const ma21Points: string[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i >= 8) {
      let sum = 0;
      for (let j = i - 8; j <= i; j++) sum += (candles[j].o + candles[j].c) / 2;
      ma9Points.push(`${candles[i].x},${sum / 9}`);
    }
    if (i >= 20) {
      let sum = 0;
      for (let j = i - 20; j <= i; j++) sum += (candles[j].o + candles[j].c) / 2;
      ma21Points.push(`${candles[i].x},${sum / 21}`);
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.10]">
      <svg viewBox="0 0 1024 400" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
        {[100, 150, 200, 250, 300].map((y) => (
          <line key={y} x1="0" y1={y} x2="1024" y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="4,8" />
        ))}
        {candles.map((c, i) => {
          const bullish = c.c < c.o;
          const color = bullish ? '#34d399' : '#f87171';
          const top = Math.min(c.o, c.c);
          const height = Math.abs(c.o - c.c);
          return (
            <g key={i}>
              <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={color} strokeWidth="1" opacity="0.8" />
              <rect x={c.x - 5} y={top} width={10} height={Math.max(height, 2)} fill={color} opacity="0.9" rx="1" />
            </g>
          );
        })}
        {ma9Points.length > 1 && (
          <polyline points={ma9Points.join(' ')} fill="none" stroke="#818cf8" strokeWidth="1.5" opacity="0.8" />
        )}
        {ma21Points.length > 1 && (
          <polyline points={ma21Points.join(' ')} fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />
        )}
      </svg>
    </div>
  );
}

/* ── How It Works Modal ───────────────────────────── */
function HowItWorksModal({ onSelectPlan, onClose }: { onSelectPlan: () => void; onClose: () => void }) {
  const steps = [
    {
      num: '01',
      title: 'Sign Up',
      desc: 'Create your account in seconds. You\'re already here.',
    },
    {
      num: '02',
      title: 'Tell Us Your Story',
      desc: 'Share your experience level, goals, and trading rules. The AI listens and tailors the entire experience to YOUR trading level — from beginner to advanced.',
    },
    {
      num: '03',
      title: 'Trade with Accountability',
      desc: 'Log trades, track performance, and let AI hold you accountable in real-time when you break your own rules.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative glass rounded-3xl p-8 sm:p-10 max-w-3xl w-full animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-5 text-[#55556a] hover:text-white text-xl transition-colors bg-transparent">&#10005;</button>

        <h2 className="text-2xl font-bold text-center mb-2">How Journal X Works</h2>
        <p className="text-[#8b8b9e] text-center text-sm mb-10">Three steps to trading with real accountability.</p>

        {/* Horizontal 3-step layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 items-start">
          {steps.map((s, i) => (
            <div key={s.num} className="flex flex-col items-center text-center relative px-2">
              <div className="w-14 h-14 rounded-full glass flex items-center justify-center mb-4">
                <span className="text-[#6366f1] font-black text-sm">{s.num}</span>
              </div>
              <h3 className="font-semibold text-base mb-2">{s.title}</h3>
              <p className="text-xs text-[#8b8b9e] leading-relaxed">{s.desc}</p>

              {/* Large connector arrow between steps */}
              {i < steps.length - 1 && (
                <div className="hidden sm:flex absolute top-5 -right-5 w-10 h-10 items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12h16m0 0l-6-6m6 6l-6 6" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onSelectPlan}
            className="px-10 py-4 rounded-2xl font-semibold text-lg transition-all bg-[#34d399] hover:bg-[#2cb889] text-black"
            style={{ boxShadow: '0 0 40px rgba(52, 211, 153, 0.2), 0 0 80px rgba(52, 211, 153, 0.08)' }}
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
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = `/sign-up?tier=${tier}`;
      }
    } catch {
      window.location.href = '/sign-up';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative glass rounded-3xl p-8 sm:p-10 max-w-3xl w-full animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-5 text-[#55556a] hover:text-white text-xl transition-colors bg-transparent">&#10005;</button>

        <h2 className="text-2xl font-bold text-center mb-2">Choose Your Plan</h2>
        <p className="text-[#8b8b9e] text-center text-sm mb-8">One-time payment. Lifetime access. No subscriptions ever.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {/* Essential - $25 */}
          <div
            className="glass rounded-2xl p-6 flex flex-col transition-all duration-300"
            style={{ borderColor: 'rgba(255,255,255,0.18)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 50px rgba(99,102,241,0.35), 0 0 100px rgba(99,102,241,0.15), 0 0 150px rgba(99,102,241,0.08)';
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
            }}
          >
            <div className="text-xs text-[#8b8b9e] uppercase tracking-[0.15em] mb-1">Essential</div>
            <div className="text-3xl font-black mb-1">$25</div>
            <div className="text-sm text-[#6366f1] font-medium mb-5">one-time payment</div>
            <div className="text-xs text-[#8b8b9e] uppercase tracking-wider mb-3">Includes:</div>
            <ul className="space-y-2.5 flex-1">
              {features.map((f) => (
                <li key={`e-${f.name}`} className="flex items-center gap-2.5 text-sm">
                  {f.essential ? (
                    <span className="text-[#34d399] text-xs shrink-0">&#10003;</span>
                  ) : (
                    <span className="text-[#f87171]/50 text-xs shrink-0">&#10005;</span>
                  )}
                  <span className={f.essential ? 'text-[#e0e0ea]' : 'text-[#55556a] line-through'}>
                    {f.name}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('essential')}
              className="mt-6 block w-full text-center py-3 px-6 glass rounded-xl font-semibold text-sm hover:bg-[rgba(255,255,255,0.12)] transition-all"
            >
              Get Essential
            </button>
          </div>

          {/* Complete - $50 */}
          <div
            className="glass rounded-2xl p-6 flex flex-col relative transition-all duration-300"
            style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 60px rgba(99,102,241,0.4), 0 0 120px rgba(99,102,241,0.2), 0 0 180px rgba(99,102,241,0.1)';
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6366f1] to-transparent" />
            <div className="text-xs text-[#6366f1] uppercase tracking-[0.15em] mb-1 font-semibold">Complete</div>
            <div className="text-3xl font-black mb-1">$50</div>
            <div className="text-sm text-[#6366f1] font-medium mb-5">one-time payment</div>
            <div className="text-xs text-[#8b8b9e] uppercase tracking-wider mb-3">Includes:</div>
            <ul className="space-y-2.5 flex-1">
              {features.map((f) => (
                <li key={`c-${f.name}`} className="flex items-center gap-2.5 text-sm">
                  <span className="text-[#34d399] text-xs shrink-0">&#10003;</span>
                  <span className="text-[#e0e0ea]">{f.name}</span>
                  {f.hasInfo && (
                    <span className="relative group/tip inline-flex">
                      <span className="w-4 h-4 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-[9px] inline-flex items-center justify-center text-[#8b8b9e] cursor-help">?</span>
                      {/* Tooltip: absolute positioned, pointer-events none = no layout shift, no shaking */}
                      <span className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-72 rounded-xl p-4 text-xs text-[#c0c0d0] leading-relaxed z-[100] pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 whitespace-normal"
                        style={{
                          background: 'rgba(20, 20, 30, 0.95)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          backdropFilter: 'blur(20px)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        }}
                      >
                        <strong className="text-white block mb-1">AI Accountability Coach</strong>
                        Modeled after Mark Douglas&apos; trading psychology (&quot;Trading in the Zone&quot;). Has full access to your past stats, logged trades, and stated goals — holds you accountable in real time. When you break a rule, it asks why. Not punishment — reflection.
                        <span className="absolute left-1/2 top-full -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-[rgba(20,20,30,0.95)]" />
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('complete')}
              className="mt-6 block w-full text-center py-3 px-6 bg-[#6366f1] hover:bg-[#5558e6] rounded-xl font-semibold text-sm transition-all glow-accent"
            >
              Get Complete
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#55556a]">Secure checkout powered by Stripe.</p>
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
    <div className="min-h-screen text-[#f0f0f5] relative overflow-hidden">
      {/* Matte felt background */}
      <FeltBackground />

      {/* Candlestick chart behind glass */}
      <CandlestickBackground />

      {/* Subtle colored blobs for glass refraction */}
      <div className="fixed inset-0 pointer-events-none z-[2]">
        <div className="absolute top-[-10%] left-[20%] w-[800px] h-[800px] rounded-full bg-[#6366f1]/[0.05] blur-[200px]" />
        <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#818cf8]/[0.04] blur-[180px]" />
        <div className="absolute bottom-[-5%] left-[40%] w-[700px] h-[700px] rounded-full bg-[#4f46e5]/[0.04] blur-[200px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <JournalXLogo />
        <div className="flex gap-3">
          {isSignedIn ? (
            <Link href="/dashboard" className="px-5 py-2.5 glass rounded-xl text-sm font-medium glass-hover transition-all">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="px-4 py-2.5 text-sm text-[#8b8b9e] hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" className="px-5 py-2.5 glass rounded-xl text-sm font-medium glass-hover transition-all">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[88vh] px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-[#8b8b9e] mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse" />
          The first AI-powered accountability trading journal
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] mb-6 tracking-tight text-center">
          Your trades.<br />
          <span className="text-[#6366f1]">Your rules.</span><br />
          <span className="text-[#8b8b9e] text-4xl sm:text-5xl lg:text-6xl">Real accountability.</span>
        </h1>

        <p className="text-lg text-[#8b8b9e] max-w-xl mx-auto mb-16 leading-relaxed text-center">
          Journal X doesn&apos;t just track your trades — it holds you to the goals you set.
        </p>

        {/* THE ORB */}
        <button onClick={() => setShowHowItWorks(true)} className="group relative bg-transparent">
          <div className="orb w-72 h-72 sm:w-96 sm:h-96 rounded-full flex flex-col items-center justify-center text-center animate-pulse-glow cursor-pointer group-hover:scale-[1.04] transition-transform duration-500">
            <div className="text-[#8b8b9e] text-[11px] uppercase tracking-[0.25em] mb-4">Begin</div>
            <div className="text-3xl sm:text-4xl font-bold mb-1">Start Your</div>
            <div className="text-3xl sm:text-4xl font-bold text-[#6366f1]">Journal</div>
          </div>
          <div className="absolute inset-[-20px] rounded-full border border-[rgba(255,255,255,0.06)] group-hover:border-[rgba(255,255,255,0.12)] transition-all duration-500" />
          <div className="absolute inset-[-44px] rounded-full border border-[rgba(255,255,255,0.03)] group-hover:border-[rgba(255,255,255,0.08)] transition-all duration-700" />
          <div className="absolute inset-[-72px] rounded-full border border-[rgba(255,255,255,0.015)] group-hover:border-[rgba(255,255,255,0.05)] transition-all duration-1000" />
        </button>

        <p className="text-xs text-[#55556a] mt-14">One-time payment. Full access forever. No subscriptions.</p>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-center text-2xl font-bold mb-4">Not just a journal. A trading coach.</h2>
        <p className="text-center text-[#55556a] text-sm mb-14 max-w-md mx-auto">AI that knows your trading history, your goals, and your tendencies.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Weekly Check-ins', desc: 'Start each week with intention. Set goals, reflect, trade with a plan.', icon: '◎' },
            { title: 'AI Accountability', desc: 'Break a rule? The AI asks why. Not punishment — reflection.', icon: '◈' },
            { title: 'Smart Stats', desc: 'Upload your data in any format. AI analyzes patterns and tells you what works.', icon: '▦' },
            { title: 'Real-time Coach', desc: 'Chat with an AI modeled after Mark Douglas\' trading psychology.', icon: '✦' },
            { title: 'Trade Logging', desc: 'Fast, clean, zero friction. Log trades in seconds.', icon: '⚡' },
            { title: 'Performance Insights', desc: 'AI-generated insights comparing performance against stated goals.', icon: '◉' },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 glass-hover transition-all">
              <div className="text-xl mb-3 text-[#6366f1]">{f.icon}</div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-[#8b8b9e] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="glass rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">Stop trading without accountability.</h2>
          <p className="text-[#8b8b9e] mb-8 max-w-md mx-auto">The difference between profitable and unprofitable traders? Discipline. Journal X makes discipline automatic.</p>
          <button
            onClick={() => setShowHowItWorks(true)}
            className="inline-block px-10 py-4 glass rounded-2xl font-semibold text-lg transition-all glass-hover glow-accent bg-transparent"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(255,255,255,0.04)] py-8 text-center text-xs text-[#55556a]">
        Journal X — The first AI-powered accountability journal for traders.
      </footer>

      {showHowItWorks && (
        <HowItWorksModal
          onSelectPlan={openPricingFromSteps}
          onClose={() => setShowHowItWorks(false)}
        />
      )}

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </div>
  );
}
