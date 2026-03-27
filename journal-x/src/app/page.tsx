'use client';

import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import Link from 'next/link';

/* ── Logo — stick man holding candlestick with "JOURNAL X" below ── */
function JournalXLogo({ light = false }: { light?: boolean }) {
  const manColor = light ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.75)';
  const manColorLight = light ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.65)';
  const manColorLeg = light ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)';
  return (
    <div className="flex flex-col items-start">
      <svg width="52" height="52" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Stick man */}
        <circle cx="18" cy="12" r="4.5" stroke={manColor} strokeWidth="1.8" fill="none" />
        <line x1="18" y1="16.5" x2="18" y2="30" stroke={manColor} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="18" y1="21" x2="12" y2="27" stroke={manColorLight} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="21" x2="32" y2="17" stroke={manColorLight} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="30" x2="13" y2="40" stroke={manColorLeg} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="30" x2="23" y2="40" stroke={manColorLeg} strokeWidth="1.5" strokeLinecap="round" />
        {/* Candlestick in hand */}
        <line x1="35" y1="6" x2="35" y2="11" stroke="#30C48B" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="32" y="11" width="6" height="14" rx="1.5" fill="rgba(48,196,139,0.35)" stroke="#30C48B" strokeWidth="1" />
        <line x1="35" y1="25" x2="35" y2="32" stroke="#30C48B" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <div className="mt-[-2px] ml-[2px]">
        <span className="text-[11px] font-bold tracking-[0.35em] uppercase" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif", color: light ? '#333' : '#bbb' }}>
          Journal
        </span>
        <span className="text-[11px] font-bold tracking-[0.35em] uppercase text-[#30C48B] ml-[2px]" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}>
          X
        </span>
      </div>
    </div>
  );
}

/* ── Candlestick CTA — big bullish candle, green glow, no outer frame ── */
function CandlestickCTA({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="group relative bg-transparent mb-16">
      {/* The candlestick — short top wick, big body, long bottom wick (bullish) */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Upper wick — short (bullish = small upper shadow) */}
        <div
          className="w-[4px] h-10 rounded-full"
          style={{ background: 'linear-gradient(to bottom, rgba(48,196,139,0.15), rgba(48,196,139,0.7))' }}
        />

        {/* Candle body */}
        <div
          className="relative w-56 sm:w-68 rounded-2xl flex flex-col items-center justify-center text-center py-20 sm:py-28 transition-all duration-500 group-hover:scale-[1.03] cursor-pointer"
          style={{
            background: 'linear-gradient(180deg, rgba(48,196,139,0.22) 0%, rgba(48,196,139,0.10) 100%)',
            border: '1px solid rgba(48,196,139,0.30)',
            boxShadow: '0 0 80px rgba(48,196,139,0.18), 0 0 160px rgba(48,196,139,0.08), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(255,255,255,0.04)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
          }}
        >
          {/* Glass highlight on top */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-1/3" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.14), transparent)' }} />
          </div>

          <div className="relative z-10 px-2">
            <div className="text-[#888] text-[10px] tracking-[0.2em] mb-5">[start here]</div>
            <div className="text-4xl sm:text-5xl font-medium mb-1 leading-none tracking-tight whitespace-nowrap">Start Your</div>
            <div className="text-4xl sm:text-5xl font-medium text-[#30C48B] leading-none tracking-tight">Journal</div>
          </div>

          {/* Hover glow intensifies */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ boxShadow: '0 0 100px rgba(48,196,139,0.35), 0 0 200px rgba(48,196,139,0.12)' }}
          />
        </div>

        {/* Lower wick — long (bullish = long lower shadow, buyers pushed price up) */}
        <div
          className="w-[4px] h-32 rounded-full"
          style={{ background: 'linear-gradient(to top, rgba(48,196,139,0.1), rgba(48,196,139,0.7))' }}
        />
      </div>
    </button>
  );
}

/* ── How It Works Modal ───────────────────────────── */
function HowItWorksModal({ onSelectPlan, onClose, light = false }: { onSelectPlan: () => void; onClose: () => void; light?: boolean }) {
  const steps = [
    { num: '01', title: 'Sign Up', desc: 'Create your account in seconds. You\'re already here.' },
    { num: '02', title: 'Tell Us Your Story', desc: 'Share your experience level, goals, and trading rules. The AI tailors the entire experience to YOUR trading level.' },
    { num: '03', title: 'Trade with Accountability', desc: 'Log trades, track performance, and let AI hold you accountable in real-time.' },
  ];

  const modalBg: React.CSSProperties = light
    ? { background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,245,240,0.95) 100%)', border: '1px solid rgba(0,0,0,0.08)', backdropFilter: 'blur(40px)', boxShadow: '0 24px 80px rgba(0,0,0,0.12)' }
    : {};
  const stepCircle: React.CSSProperties = light
    ? { background: 'rgba(245,245,240,0.8)', border: '1px solid rgba(0,0,0,0.06)' }
    : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className={`absolute inset-0 backdrop-blur-md ${light ? 'bg-black/30' : 'bg-black/70'}`} onClick={onClose} />
      <div className={`relative rounded-3xl p-10 sm:p-12 max-w-3xl w-full animate-fade-in ${light ? '' : 'glass'}`} style={light ? modalBg : {}}>
        <button onClick={onClose} className={`absolute top-5 right-6 text-lg transition-colors bg-transparent ${light ? 'text-[#aaa] hover:text-[#333]' : 'text-[#555] hover:text-white'}`}>&#10005;</button>

        <h2 className={`text-3xl font-light text-center mb-3 tracking-tight ${light ? 'text-[#1a1a1a]' : ''}`}>How Journal X Works</h2>
        <p className={`text-center text-sm mb-12 ${light ? 'text-[#999]' : 'text-[#888]'}`}>Three steps to trading with real accountability.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12 items-start">
          {steps.map((s, i) => (
            <div key={s.num} className="flex flex-col items-center text-center relative">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${light ? '' : 'glass'}`} style={light ? stepCircle : {}}>
                <span className="text-[#30C48B] font-semibold text-sm">{s.num}</span>
              </div>
              <h3 className={`font-medium text-base mb-2 ${light ? 'text-[#1a1a1a]' : ''}`}>{s.title}</h3>
              <p className={`text-xs leading-relaxed ${light ? 'text-[#999]' : 'text-[#888]'}`}>{s.desc}</p>

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
function PricingModal({ onClose, light = false }: { onClose: () => void; light?: boolean }) {
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

  const modalBg: React.CSSProperties = light
    ? { background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,245,240,0.95) 100%)', border: '1px solid rgba(0,0,0,0.08)', backdropFilter: 'blur(40px)', boxShadow: '0 24px 80px rgba(0,0,0,0.12)' }
    : {};
  const cardBg: React.CSSProperties = light
    ? { background: 'rgba(245,245,240,0.6)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }
    : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className={`absolute inset-0 backdrop-blur-md ${light ? 'bg-black/30' : 'bg-black/70'}`} onClick={onClose} />

      <div className={`relative rounded-3xl p-10 sm:p-12 max-w-3xl w-full animate-fade-in ${light ? '' : 'glass'}`} style={light ? modalBg : {}}>
        <button onClick={onClose} className={`absolute top-5 right-6 text-lg transition-colors bg-transparent ${light ? 'text-[#aaa] hover:text-[#333]' : 'text-[#555] hover:text-white'}`}>&#10005;</button>

        <h2 className={`text-3xl font-light text-center mb-3 tracking-tight ${light ? 'text-[#1a1a1a]' : ''}`}>Choose Your Plan</h2>
        <p className={`text-center text-sm mb-10 ${light ? 'text-[#999]' : 'text-[#888]'}`}>One-time payment. Lifetime access. No subscriptions.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {/* Essential */}
          <div
            className={`rounded-2xl p-7 flex flex-col transition-all duration-300 ${light ? '' : 'glass'}`}
            style={light ? { ...cardBg } : {}}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 60px rgba(48,196,139,0.25), 0 0 120px rgba(48,196,139,0.10)';
              e.currentTarget.style.borderColor = 'rgba(48,196,139,0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = light ? (cardBg.boxShadow as string) : '';
              e.currentTarget.style.borderColor = light ? 'rgba(0,0,0,0.06)' : '';
            }}
          >
            <div className="text-xs text-[#888] uppercase tracking-[0.2em] mb-2">Essential</div>
            <div className={`text-4xl font-light mb-1 ${light ? 'text-[#1a1a1a]' : ''}`}>$25</div>
            <div className="text-sm text-[#30C48B] mb-6">one-time payment</div>
            <ul className="space-y-2.5 flex-1">
              {features.map((f) => (
                <li key={`e-${f.name}`} className="flex items-center gap-2.5 text-sm">
                  {f.essential
                    ? <span className="text-[#30C48B] text-xs shrink-0">&#10003;</span>
                    : <span className="text-[#f87171]/40 text-xs shrink-0">&#10005;</span>}
                  <span className={f.essential ? (light ? 'text-[#333]' : 'text-[#ddd]') : (light ? 'text-[#bbb] line-through' : 'text-[#555] line-through')}>{f.name}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('essential')}
              className={`mt-7 w-full py-3 rounded-full font-medium text-sm transition-all ${light ? 'bg-[#eee] hover:bg-[#ddd] text-[#333]' : 'glass glass-hover'}`}
            >
              Get Essential
            </button>
          </div>

          {/* Complete */}
          <div
            className={`rounded-2xl p-7 flex flex-col relative transition-all duration-300 ${light ? '' : 'glass'}`}
            style={light ? { ...cardBg, borderColor: 'rgba(48,196,139,0.2)' } : { borderColor: 'rgba(48,196,139,0.3)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 70px rgba(48,196,139,0.3), 0 0 140px rgba(48,196,139,0.12)';
              e.currentTarget.style.borderColor = 'rgba(48,196,139,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = light ? (cardBg.boxShadow as string) : '';
              e.currentTarget.style.borderColor = light ? 'rgba(48,196,139,0.2)' : 'rgba(48,196,139,0.3)';
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#30C48B] to-transparent" />
            <div className="text-xs text-[#30C48B] uppercase tracking-[0.2em] mb-2 font-medium">Complete</div>
            <div className={`text-4xl font-light mb-1 ${light ? 'text-[#1a1a1a]' : ''}`}>$50</div>
            <div className="text-sm text-[#30C48B] mb-6">one-time payment</div>
            <ul className="space-y-2.5 flex-1">
              {features.map((f) => (
                <li key={`c-${f.name}`} className="flex items-center gap-2.5 text-sm">
                  <span className="text-[#30C48B] text-xs shrink-0">&#10003;</span>
                  <span className={light ? 'text-[#333]' : 'text-[#ddd]'}>{f.name}</span>
                  {f.hasInfo && (
                    <span className="relative group/tip inline-flex">
                      <span className={`w-4 h-4 rounded-full text-[9px] inline-flex items-center justify-center cursor-help ${light ? 'bg-[#e5e5e0] text-[#888]' : 'glass text-[#999]'}`}>?</span>
                      <span
                        className={`absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-72 rounded-xl p-4 text-xs leading-relaxed z-[100] pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 whitespace-normal ${light ? 'bg-white text-[#666] shadow-lg border border-[rgba(0,0,0,0.08)]' : 'glass text-[#bbb]'}`}
                      >
                        <strong className={`block mb-1 ${light ? 'text-[#1a1a1a]' : 'text-white'}`}>AI Accountability Coach</strong>
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

        <p className={`text-center text-xs ${light ? 'text-[#bbb]' : 'text-[#555]'}`}>Secure checkout powered by Stripe.</p>
      </div>
    </div>
  );
}

/* ── Candlestick CTA — light theme variant ── */
function CandlestickCTALight({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="group relative bg-transparent mb-16">
      <div className="relative z-10 flex flex-col items-center">
        <div
          className="w-[4px] h-10 rounded-full"
          style={{ background: 'linear-gradient(to bottom, rgba(48,196,139,0.2), rgba(48,196,139,0.8))' }}
        />
        <div
          className="relative w-56 sm:w-68 rounded-2xl flex flex-col items-center justify-center text-center py-20 sm:py-28 transition-all duration-500 group-hover:scale-[1.03] cursor-pointer"
          style={{
            background: 'linear-gradient(180deg, rgba(48,196,139,0.12) 0%, rgba(48,196,139,0.04) 100%)',
            border: '1px solid rgba(48,196,139,0.25)',
            boxShadow: '0 0 60px rgba(48,196,139,0.10), 0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
          }}
        >
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-1/3" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)' }} />
          </div>
          <div className="relative z-10 px-2">
            <div className="text-[#999] text-[10px] tracking-[0.2em] mb-5">[start here]</div>
            <div className="text-4xl sm:text-5xl font-medium mb-1 leading-none tracking-tight whitespace-nowrap text-[#222]">Start Your</div>
            <div className="text-4xl sm:text-5xl font-medium text-[#30C48B] leading-none tracking-tight">Journal</div>
          </div>
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ boxShadow: '0 0 80px rgba(48,196,139,0.25), 0 0 160px rgba(48,196,139,0.08)' }}
          />
        </div>
        <div
          className="w-[4px] h-32 rounded-full"
          style={{ background: 'linear-gradient(to top, rgba(48,196,139,0.15), rgba(48,196,139,0.8))' }}
        />
      </div>
    </button>
  );
}

/* ── Landing Page ─────────────────────────────────── */
export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [light, setLight] = useState(false);

  const openPricingFromSteps = () => {
    setShowHowItWorks(false);
    setShowPricing(true);
  };

  // Light theme glass style
  const lightGlass: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.55) 100%)',
    border: '1px solid rgba(0,0,0,0.08)',
    backdropFilter: 'blur(40px) saturate(150%)',
    WebkitBackdropFilter: 'blur(40px) saturate(150%)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
  };

  return (
    <div
      className="min-h-screen relative transition-colors duration-500"
      style={light ? { background: '#f5f5f0', color: '#1a1a1a' } : {}}
    >
      {/* Light mode overrides the body::before texture */}
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
          {/* Theme toggle */}
          <button
            onClick={() => setLight(!light)}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${light ? 'bg-[#222] text-white hover:bg-[#333]' : 'glass text-[#999] hover:text-white'}`}
            title={light ? 'Switch to dark' : 'Switch to light'}
          >
            {light ? '🌙' : '☀️'}
          </button>
        </div>
      </nav>

      {/* Product nav — borderless elegant text links */}
      <div className="relative z-10 flex items-center justify-center gap-10 sm:gap-14 px-8 pt-2 pb-4 max-w-7xl mx-auto">
        {['Log a Trade', 'Past Trades', 'Analysis', 'Trading Goals'].map((item) => (
          <span
            key={item}
            className={`text-[11px] font-bold tracking-[0.35em] uppercase cursor-pointer transition-colors ${light ? 'text-[#aaa] hover:text-[#333]' : 'text-[#555] hover:text-[#ccc]'}`}
            style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}
          >
            {item}
          </span>
        ))}
      </div>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] px-8">
        <h2 className={`text-lg sm:text-xl tracking-wide mb-20 font-light text-center ${light ? 'text-[#888]' : 'text-[#888]'}`}>
          AI-Powered Trading Journal That Holds You Accountable
        </h2>

        {/* THE CANDLESTICK CTA */}
        {light
          ? <CandlestickCTALight onClick={() => setShowHowItWorks(true)} />
          : <CandlestickCTA onClick={() => setShowHowItWorks(true)} />
        }

        {/* Rising moving average line — slightly more curved */}
        <div className="absolute inset-0 pointer-events-none z-[5] overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none">
            <path
              d="M-50 810 C120 780 200 740 320 680 C440 620 500 580 600 530 C700 480 750 440 850 390 C950 340 1050 280 1150 220 C1250 160 1350 110 1500 60"
              stroke={light ? 'rgba(48,140,220,0.10)' : 'rgba(100,180,255,0.12)'}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M-50 835 C120 805 200 770 320 715 C440 660 500 620 600 570 C700 520 750 485 850 435 C950 385 1050 325 1150 265 C1250 210 1350 165 1500 110"
              stroke={light ? 'rgba(48,140,220,0.05)' : 'rgba(100,180,255,0.06)'}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        <h1 className="relative z-10 text-4xl sm:text-5xl lg:text-6xl font-light leading-[1.15] mb-6 tracking-tight text-center max-w-3xl">
          <span className={light ? 'text-[#999]' : 'text-[#666]'}>Your trades. Your rules.</span><br />
          <span className={`underline decoration-[#30C48B] decoration-2 underline-offset-8 ${light ? 'text-[#1a1a1a]' : 'text-white'}`}>Real accountability.</span>
        </h1>

        <p className={`relative z-10 text-base max-w-lg mx-auto leading-relaxed text-center ${light ? 'text-[#888]' : 'text-[#888]'}`}>
          Journal X doesn&apos;t just track your trades — it holds you to the goals you set.
        </p>

        <p className={`relative z-10 text-xs mt-16 ${light ? 'text-[#bbb]' : 'text-[#555]'}`}>One-time payment &middot; Full access forever &middot; No subscriptions</p>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 py-32">
        <h2 className={`text-center text-3xl font-light mb-4 tracking-tight ${light ? 'text-[#1a1a1a]' : ''}`}>Not just a journal. A trading coach.</h2>
        <p className={`text-center text-sm mb-16 max-w-md mx-auto ${light ? 'text-[#999]' : 'text-[#888]'}`}>AI that knows your trading history, your goals, and your tendencies.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { title: 'Weekly Check-ins', desc: 'Start each week with intention. Set goals, reflect, trade with a plan.', num: '01' },
            { title: 'AI Accountability', desc: 'Break a rule? The AI asks why. Not punishment — reflection.', num: '02' },
            { title: 'Smart Stats', desc: 'Upload your data in any format. AI analyzes patterns and tells you what works.', num: '03' },
            { title: 'Real-time Coach', desc: 'Chat with an AI modeled after Mark Douglas\' trading psychology.', num: '04' },
            { title: 'Trade Logging', desc: 'Fast, clean, zero friction. Log trades in seconds.', num: '05' },
            { title: 'Performance Insights', desc: 'AI-generated insights comparing performance against stated goals.', num: '06' },
          ].map((f) => (
            <div
              key={f.title}
              className={`rounded-2xl p-7 transition-all duration-300 ${light ? '' : 'glass glass-hover'}`}
              style={light ? { ...lightGlass } : {}}
              onMouseEnter={light ? (e) => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)'; } : undefined}
              onMouseLeave={light ? (e) => { e.currentTarget.style.boxShadow = lightGlass.boxShadow as string; } : undefined}
            >
              <div className="text-xs text-[#30C48B] mb-4 font-medium">{f.num}.</div>
              <h3 className={`font-medium text-base mb-2 ${light ? 'text-[#1a1a1a]' : ''}`}>{f.title}</h3>
              <p className={`text-sm leading-relaxed ${light ? 'text-[#777]' : 'text-[#999]'}`}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-8 py-24 text-center">
        <div
          className={`rounded-3xl p-12 ${light ? '' : 'glass'}`}
          style={light ? { ...lightGlass } : {}}
        >
          <h2 className={`text-3xl font-light mb-5 tracking-tight ${light ? 'text-[#1a1a1a]' : ''}`}>Stop trading without accountability.</h2>
          <p className={`mb-10 max-w-md mx-auto text-sm leading-relaxed ${light ? 'text-[#888]' : 'text-[#888]'}`}>
            The difference between profitable and unprofitable traders? Discipline. Journal X makes discipline automatic.
          </p>
          <button
            onClick={() => setShowHowItWorks(true)}
            className={`px-10 py-4 rounded-full font-medium text-base transition-all ${light ? 'bg-[#30C48B] hover:bg-[#28A876] text-white' : 'glass glass-hover'}`}
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 border-t py-10 text-center text-xs ${light ? 'border-[rgba(0,0,0,0.06)] text-[#bbb]' : 'border-[rgba(255,255,255,0.06)] text-[#555]'}`}>
        Journal X — The first AI-powered accountability journal for traders.
      </footer>

      {showHowItWorks && <HowItWorksModal onSelectPlan={openPricingFromSteps} onClose={() => setShowHowItWorks(false)} light={light} />}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} light={light} />}
    </div>
  );
}
