'use client';

import { useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import Link from 'next/link';

/* ── Logo — stick man holding candlestick with "JOURNAL X" below ── */
function JournalXLogo({ light = false }: { light?: boolean }) {
  const manColor = light ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.75)';
  const manColorLight = light ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.65)';
  const manColorLeg = light ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)';
  return (
    <div className="flex flex-col items-start">
      <svg width="82" height="82" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <span className="text-[16px] font-bold tracking-[0.35em] uppercase" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif", color: light ? '#333' : '#bbb' }}>
          Journal
        </span>
        <span className="text-[16px] font-bold tracking-[0.35em] uppercase text-[#30C48B] ml-[2px]" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}>
          X
        </span>
      </div>
    </div>
  );
}

/* ── Candlestick CTA — crystal neon candle, vibrant glow ── */
function CandlestickCTA({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="group relative bg-transparent mb-16">
      <div className="relative z-10 flex flex-col items-center">
        {/* Upper wick */}
        <div
          className="w-[5px] h-14 rounded-full"
          style={{ background: 'linear-gradient(to bottom, rgba(48,196,139,0.1), rgba(48,196,139,0.9))', boxShadow: '0 0 12px rgba(48,196,139,0.4)' }}
        />

        {/* Candle body — glossy frosted glass */}
        <div
          className="relative w-64 sm:w-76 rounded-2xl flex flex-col items-center justify-center text-center py-24 sm:py-32 transition-all duration-500 group-hover:scale-[1.04] cursor-pointer"
          style={{
            background: 'linear-gradient(180deg, rgba(48,196,139,0.08) 0%, rgba(48,196,139,0.02) 100%)',
            border: '1px solid rgba(48,196,139,0.30)',
            boxShadow: '0 0 120px rgba(48,196,139,0.30), 0 0 240px rgba(48,196,139,0.15), 0 0 50px rgba(48,196,139,0.20), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(255,255,255,0.06)',
            backdropFilter: 'blur(60px) saturate(200%)',
            WebkitBackdropFilter: 'blur(60px) saturate(200%)',
          }}
        >
          {/* Glossy shimmer — top + side highlights */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-2/5" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)' }} />
            <div className="absolute top-0 left-0 bottom-0 w-1/4" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.06), transparent)' }} />
          </div>

          <div className="relative z-10 px-2">
            <div className="text-5xl sm:text-6xl lg:text-7xl mb-2 leading-none tracking-[0.08em] whitespace-nowrap uppercase" style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 400 }}>Start Your</div>
            <div className="text-5xl sm:text-6xl lg:text-7xl text-[#30C48B] leading-none tracking-[0.08em] uppercase" style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 400, textShadow: '0 0 40px rgba(48,196,139,0.5), 0 0 80px rgba(48,196,139,0.2), 0 0 4px rgba(48,196,139,0.8)' }}>Journal</div>
          </div>

          {/* Hover neon glow */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ boxShadow: '0 0 120px rgba(48,196,139,0.45), 0 0 240px rgba(48,196,139,0.15), 0 0 60px rgba(48,196,139,0.2)' }}
          />
        </div>

        {/* Lower wick */}
        <div
          className="w-[5px] h-40 rounded-full"
          style={{ background: 'linear-gradient(to top, rgba(48,196,139,0.05), rgba(48,196,139,0.9))', boxShadow: '0 0 12px rgba(48,196,139,0.4)' }}
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
            <div className={`text-4xl font-light mb-1 ${light ? 'text-[#1a1a1a]' : ''}`}>$35</div>
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
            <div className={`text-4xl font-light mb-1 ${light ? 'text-[#1a1a1a]' : ''}`}>$75</div>
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

/* ── Coach Showcase — rotating insights + ratings every 25s ── */
const coachSets = [
  {
    insights: [
      { label: 'Pattern Detected:', text: 'Your last three trades show premature profit-taking vs. your stated targets. Want to review them?', color: '#30C48B' },
      { label: 'Pattern Detected:', text: 'You\'ve noted hesitation again despite committing to remove this habit. Let\'s explore what\'s behind it.', color: '#30C48B' },
      { label: 'Milestone Reached:', text: 'Weekly goal hit — only A+ pullbacks off the narrow MAs. Nice job.', color: '#30C48B' },
      { label: 'Observation:', text: 'Win rate and R are nearly 2x higher before 12:30 PM EDT vs. afternoon trades.', color: '#ccc' },
    ],
    weeklyRating: 76,
    bars: [
      { name: 'Discipline', pct: 72, color: '#30C48B', val: 72 },
      { name: 'Psychology', pct: 45, color: '#f59e0b', val: 45 },
      { name: 'Execution', pct: 68, color: '#60a5fa', val: 68 },
      { name: 'Risk Mgmt', pct: 81, color: '#30C48B', val: 81 },
    ],
  },
  {
    insights: [
      { label: 'Pattern Detected:', text: 'You widened your stop 3x this week post-entry. Each led to a larger loss than planned.', color: '#30C48B' },
      { label: 'Observation:', text: 'Breakout entries: 72% win rate. Reversals: 28%. Consider sizing down on reversals.', color: '#ccc' },
      { label: 'Milestone Reached:', text: 'Three straight weeks within your max daily loss limit. Discipline up 11 points.', color: '#30C48B' },
      { label: 'Pattern Detected:', text: 'You size up after winning streaks — data shows this leads to your largest drawdowns.', color: '#ccc' },
    ],
    weeklyRating: 71,
    bars: [
      { name: 'Discipline', pct: 80, color: '#30C48B', val: 80 },
      { name: 'Psychology', pct: 52, color: '#f59e0b', val: 52 },
      { name: 'Execution', pct: 63, color: '#60a5fa', val: 63 },
      { name: 'Risk Mgmt', pct: 74, color: '#30C48B', val: 74 },
    ],
  },
  {
    insights: [
      { label: 'Observation:', text: 'Your best R-multiples come within the first 30 min of your session. Performance drops after hour 3.', color: '#ccc' },
      { label: 'Pattern Detected:', text: 'You\'ve revenge-traded twice this week after taking a loss. Both resulted in further drawdown.', color: '#30C48B' },
      { label: 'Milestone Reached:', text: 'You followed your exit rules on 9 of 10 trades this week. That\'s a personal best.', color: '#30C48B' },
      { label: 'Observation:', text: 'Average R on planned trades: 2.4. Average R on impulse trades: -0.8. The data is clear.', color: '#ccc' },
    ],
    weeklyRating: 82,
    bars: [
      { name: 'Discipline', pct: 88, color: '#30C48B', val: 88 },
      { name: 'Psychology', pct: 58, color: '#f59e0b', val: 58 },
      { name: 'Execution', pct: 75, color: '#60a5fa', val: 75 },
      { name: 'Risk Mgmt', pct: 85, color: '#30C48B', val: 85 },
    ],
  },
];

function CoachShowcase({ light }: { light: boolean }) {
  const [setIdx, setSetIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setSetIdx(i => (i + 1) % coachSets.length), 25000);
    return () => clearInterval(interval);
  }, []);
  const current = coachSets[setIdx];

  return (
    <div className="absolute right-8 lg:right-16 top-[55%] -translate-y-1/2 z-[6] pointer-events-none hidden lg:block">
      <div className="relative" style={{ animation: 'float 6s ease-in-out infinite' }}>
        {/* Speech bubble card */}
        <div
          className={`w-[370px] rounded-2xl p-6 animate-fade-in transition-transform duration-500 hover:scale-[1.10] ${light
            ? 'bg-white/50 border border-[rgba(0,0,0,0.06)] shadow-[0_8px_40px_rgba(0,0,0,0.06)]'
            : ''
          }`}
          style={light ? { backdropFilter: 'blur(30px)' } : {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(60px) saturate(180%)',
            WebkitBackdropFilter: 'blur(60px) saturate(180%)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 80px rgba(48,196,139,0.12), inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 rgba(255,255,255,0.03)',
          }}
        >
          {/* Speech bubble tail */}
          <div className="absolute -left-3 top-12 w-0 h-0" style={{
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderRight: light ? '12px solid rgba(255,255,255,0.5)' : '12px solid rgba(255,255,255,0.10)',
          }} />

          {/* Logo icon upper-left + Coach header in same row */}
          <div className="flex items-center gap-3 mb-4">
            <svg width="36" height="36" viewBox="0 0 56 56" fill="none" className="flex-shrink-0">
              <circle cx="18" cy="12" r="4.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" fill="none" />
              <line x1="18" y1="16.5" x2="18" y2="30" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="18" y1="21" x2="12" y2="27" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="21" x2="32" y2="17" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="30" x2="13" y2="40" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="30" x2="23" y2="40" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="35" y1="6" x2="35" y2="11" stroke="#30C48B" strokeWidth="1.2" strokeLinecap="round" />
              <rect x="32" y="11" width="6" height="14" rx="1.5" fill="rgba(48,196,139,0.35)" stroke="#30C48B" strokeWidth="1" />
              <line x1="35" y1="25" x2="35" y2="32" stroke="#30C48B" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#30C48B] animate-pulse" />
              <span className="text-[12px] font-bold tracking-[0.2em] uppercase text-[#30C48B]" style={{ textShadow: '0 0 10px rgba(48,196,139,0.3)' }}>AI Coach — Live</span>
            </div>
          </div>

          {/* Rotating insight lines — shorter text */}
          <div key={setIdx} className="space-y-2.5">
            {current.insights.map((ins, i) => (
              <div key={i} className={`text-[13px] leading-relaxed ${light ? 'text-[#555]' : 'text-[#e0e0e0]'}`}
                style={{ animation: `typeIn 0.6s ease-out ${i * 0.3}s both` }}>
                <span className="font-bold" style={{ color: ins.color }}>{ins.label}</span> {ins.text}
                <span className="text-[#30C48B] text-[10px] ml-1 opacity-70">(View trades)</span>
              </div>
            ))}
          </div>

          {/* Weekly Rating + rotating attribute bars */}
          <div className="mt-5 pt-3" style={{ borderTop: light ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(48,196,139,0.10)' }}>
            <div className="flex items-center justify-between mb-2.5">
              <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${light ? 'text-[#999]' : 'text-[#888]'}`}>Weekly Rating</span>
              <span className="text-[18px] font-bold text-[#30C48B]" style={{ textShadow: '0 0 12px rgba(48,196,139,0.5), 0 0 24px rgba(48,196,139,0.25)' }}>{current.weeklyRating}</span>
            </div>
            {current.bars.map((bar) => (
              <div key={bar.name} className="flex items-center gap-2 mb-1.5">
                <span className={`text-[9px] font-bold tracking-wider uppercase w-[72px] ${light ? 'text-[#999]' : 'text-[#999]'}`}>{bar.name}</span>
                <div className={`flex-1 h-1.5 rounded-full ${light ? 'bg-[rgba(0,0,0,0.04)]' : 'bg-[rgba(255,255,255,0.06)]'}`}>
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${bar.pct}%`, background: bar.color, boxShadow: `0 0 6px ${bar.color}66` }} />
                </div>
                <span className="text-[10px] font-bold" style={{ color: bar.color }}>{bar.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
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
        {[
          { label: 'Log a Trade', href: '/log-trade' },
          { label: 'Past Trades', href: '/past-trades' },
          { label: 'Analysis', href: '/analysis' },
          { label: 'Trading Goals', href: '/trading-goals' },
          { label: 'Trader Profile', href: '/trader-profile' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`text-[13px] font-bold tracking-[0.3em] uppercase transition-colors ${light ? 'text-[#aaa] hover:text-[#333]' : 'text-[#888] hover:text-white'}`}
            style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] px-8">
        <h2 className={`text-2xl sm:text-3xl tracking-wide mb-20 font-light text-center ${light ? 'text-[#555]' : 'text-white'}`} style={{ fontFamily: "'Share Tech Mono', monospace" }}>
          AI-Powered Trading Journal That Holds You Accountable
        </h2>

        {/* THE CANDLESTICK CTA */}
        {light
          ? <CandlestickCTALight onClick={() => setShowHowItWorks(true)} />
          : <CandlestickCTA onClick={() => setShowHowItWorks(true)} />
        }

        {/* Moving averages — neon Tron-style glow */}
        <div className="absolute inset-0 pointer-events-none z-[5] overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none">
            <defs>
              <filter id="glow20" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur1" />
                <feGaussianBlur stdDeviation="3" in="SourceGraphic" result="blur2" />
                <feMerge><feMergeNode in="blur1" /><feMergeNode in="blur2" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow200" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur1" />
                <feGaussianBlur stdDeviation="2" in="SourceGraphic" result="blur2" />
                <feMerge><feMergeNode in="blur1" /><feMergeNode in="blur2" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* 20SMA bloom layer — soft background glow */}
            <path
              d="M-50 820 C60 800 100 780 180 750 C240 730 280 700 340 680 C400 660 430 640 480 610 C530 580 560 570 620 540 C680 510 700 490 760 460 C820 430 850 420 920 380 C990 340 1020 330 1080 300 C1140 270 1180 250 1240 220 C1300 190 1340 170 1400 140 C1440 120 1470 100 1520 70"
              stroke={light ? 'rgba(80,160,240,0.12)' : 'rgba(100,200,255,0.20)'}
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
              filter="url(#glow20)"
              style={{ filter: 'blur(4px) brightness(1.8)' }}
            />
            {/* 20SMA — neon cyan-blue */}
            <path
              d="M-50 820 C60 800 100 780 180 750 C240 730 280 700 340 680 C400 660 430 640 480 610 C530 580 560 570 620 540 C680 510 700 490 760 460 C820 430 850 420 920 380 C990 340 1020 330 1080 300 C1140 270 1180 250 1240 220 C1300 190 1340 170 1400 140 C1440 120 1470 100 1520 70"
              stroke={light ? 'rgba(80,160,240,0.30)' : 'rgba(100,200,255,0.55)'}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#glow20)"
            />
            {/* 200SMA bloom layer — soft background glow */}
            <path
              d="M-50 760 C200 740 400 700 600 640 C800 580 1000 480 1200 360 C1350 280 1450 220 1520 180"
              stroke={light ? 'rgba(220,80,80,0.10)' : 'rgba(255,120,80,0.15)'}
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
              filter="url(#glow200)"
              style={{ filter: 'blur(4px) brightness(1.8)' }}
            />
            {/* 200SMA — neon warm red-orange */}
            <path
              d="M-50 760 C200 740 400 700 600 640 C800 580 1000 480 1200 360 C1350 280 1450 220 1520 180"
              stroke={light ? 'rgba(220,80,80,0.22)' : 'rgba(255,120,80,0.40)'}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              filter="url(#glow200)"
            />
          </svg>
        </div>

        {/* ─── AI Coach Showcase — rotating insights ─── */}
        <CoachShowcase light={light} />

        <h1 className="relative z-10 text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.15] mb-6 tracking-tight text-center max-w-3xl">
          <span className={light ? 'text-[#999]' : 'text-[#999]'}>Your trades. Your rules.</span><br />
          <span className={`underline decoration-[#30C48B] decoration-2 underline-offset-8 ${light ? 'text-[#1a1a1a]' : 'text-white'}`}>Real accountability.</span>
        </h1>

        <p className={`relative z-10 text-lg max-w-lg mx-auto leading-relaxed text-center ${light ? 'text-[#888]' : 'text-[#aaa]'}`}>
          Journal X doesn&apos;t just track your trades — it holds you to the goals you set.
        </p>

        <p className={`relative z-10 text-sm mt-16 ${light ? 'text-[#bbb]' : 'text-[#777]'}`}>One-time payment &middot; Full access forever &middot; No subscriptions</p>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 py-32">
        <h2 className={`text-center text-4xl font-light mb-5 tracking-tight ${light ? 'text-[#1a1a1a]' : ''}`}>Not just a journal. A trading coach.</h2>
        <p className={`text-center text-base mb-20 max-w-lg mx-auto ${light ? 'text-[#999]' : 'text-[#aaa]'}`}>AI that knows your trading history, your goals, and your tendencies.</p>

        {/* ─── Trader Attribute Wheel Showcase ─── */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 mb-28">
          {/* Attribute wheel with trader rating */}
          <div className="relative flex-shrink-0">
            {/* Trader rating label at top */}
            <div className="text-center mb-4">
              <div className={`text-[10px] font-bold tracking-[0.3em] uppercase ${light ? 'text-[#999]' : 'text-[#777]'}`}>Trader Rating</div>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-3xl font-light text-[#30C48B]">67</span>
                <span className={`text-sm font-medium ${light ? 'text-[#999]' : 'text-[#666]'}`}>/ 99</span>
                <span className="text-xs font-bold tracking-wider uppercase text-[#f59e0b] ml-2">Developing</span>
              </div>
            </div>

            <div className="relative w-[340px] h-[340px] sm:w-[400px] sm:h-[400px]">
              {/* Ambient glow */}
              <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(48,196,139,0.08) 0%, transparent 70%)' }} />
              <svg viewBox="0 0 400 400" className="w-full h-full relative z-10">
                <defs>
                  <filter id="wheelGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                {/* Concentric guide circles */}
                {[60, 100, 140].map((r) => (
                  <circle key={r} cx="200" cy="200" r={r} fill="none" stroke={light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'} strokeWidth="0.5" strokeDasharray="2 4" />
                ))}
                {/* 8 spokes — simplified for landing page */}
                {(() => {
                  const attrs = [
                    { label: 'Discipline', score: 82, color: '#30C48B' },
                    { label: 'Risk Mgmt', score: 75, color: '#30C48B' },
                    { label: 'Patience', score: 68, color: '#60a5fa' },
                    { label: 'Entry Timing', score: 71, color: '#60a5fa' },
                    { label: 'Psychology', score: 48, color: '#f59e0b' },
                    { label: 'Consistency', score: 73, color: '#30C48B' },
                    { label: 'Loss Handling', score: 38, color: '#f59e0b' },
                    { label: 'Execution', score: 70, color: '#60a5fa' },
                  ];
                  const cx = 200, cy = 200;
                  return attrs.map((a, i) => {
                    const angle = (i * 360 / attrs.length - 90) * Math.PI / 180;
                    const len = (a.score / 100) * 150;
                    const x2 = cx + Math.cos(angle) * len;
                    const y2 = cy + Math.sin(angle) * len;
                    const lx = cx + Math.cos(angle) * 172;
                    const ly = cy + Math.sin(angle) * 172;
                    const deg = i * 360 / attrs.length;
                    let anchor: 'middle' | 'start' | 'end' = 'middle';
                    if (deg > 20 && deg < 160) anchor = 'start';
                    if (deg > 200 && deg < 340) anchor = 'end';
                    const halfW = 12;
                    const perpAngle = angle + Math.PI / 2;
                    const bx1 = cx + Math.cos(perpAngle) * halfW;
                    const by1 = cy + Math.sin(perpAngle) * halfW;
                    const bx2 = cx - Math.cos(perpAngle) * halfW;
                    const by2 = cy - Math.sin(perpAngle) * halfW;
                    return (
                      <g key={a.label}>
                        <polygon
                          points={`${bx1},${by1} ${x2},${y2} ${bx2},${by2}`}
                          fill={a.color}
                          opacity={0.7}
                          filter="url(#wheelGlow)"
                        />
                        <text
                          x={lx} y={ly}
                          textAnchor={anchor}
                          dominantBaseline="central"
                          fill={light ? '#777' : '#aaa'}
                          fontSize="11"
                          fontWeight="600"
                          letterSpacing="0.04em"
                          style={{ textTransform: 'uppercase' as const }}
                        >
                          {a.label}
                        </text>
                      </g>
                    );
                  });
                })()}
                {/* Center OVR */}
                <circle cx="200" cy="200" r="18" fill={light ? '#e5e5e0' : '#111'} stroke={light ? 'rgba(0,0,0,0.08)' : 'rgba(48,196,139,0.25)'} strokeWidth="1.5" />
                <text x="200" y="196" textAnchor="middle" dominantBaseline="central" fill="#30C48B" fontSize="8" fontWeight="bold">OVR</text>
                <text x="200" y="210" textAnchor="middle" dominantBaseline="central" fill="#30C48B" fontSize="12" fontWeight="bold">67</text>
              </svg>
            </div>
          </div>

          {/* Floating tagline text */}
          <div className="max-w-md text-center lg:text-left">
            <h3 className={`text-3xl sm:text-4xl font-light leading-snug tracking-tight mb-5 ${light ? 'text-[#1a1a1a]' : 'text-[#ddd]'}`}>
              Understand your trading strengths and weaknesses from new perspectives
            </h3>
            <p className={`text-lg leading-relaxed ${light ? 'text-[#999]' : 'text-[#888]'}`}>
              Your Trader Profile is built from real data and AI-driven observations — showing you exactly where you excel and where you need to grow.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { title: 'Weekly Check-ins', desc: 'Start each week with intention. Set goals, reflect, trade with a plan.', num: '01' },
            { title: 'AI Accountability', desc: 'Break a rule? The AI asks why. Not punishment — reflection.', num: '02' },
            { title: 'AI Pattern Recognition', desc: 'Your AI coach detects patterns in your trading — what setups work, when you perform best, and where you leak edge.', num: '03' },
            { title: 'Real-time Coach', desc: 'Chat with an AI modeled after Mark Douglas\' trading psychology.', num: '04' },
            { title: 'Trade Logging', desc: 'Fast, clean, zero friction. Log trades in seconds.', num: '05' },
            { title: 'Works with Existing Logbooks', desc: 'Upload any form of trading record or journal — screenshots, CSVs, broker statements. The AI will use it to build your profile.', num: '06' },
          ].map((f) => (
            <div
              key={f.title}
              className={`rounded-2xl p-7 transition-all duration-300 ${light ? '' : 'glass glass-hover'}`}
              style={light ? { ...lightGlass } : {
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(60px) saturate(180%)',
                WebkitBackdropFilter: 'blur(60px) saturate(180%)',
                boxShadow: '0 4px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(255,255,255,0.03)',
              }}
              onMouseEnter={(e) => {
                if (light) {
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)';
                } else {
                  e.currentTarget.style.boxShadow = '0 4px 30px rgba(0,0,0,0.3), 0 0 30px rgba(48,196,139,0.06), inset 0 1px 0 rgba(255,255,255,0.25)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)';
                }
              }}
              onMouseLeave={(e) => {
                if (light) {
                  e.currentTarget.style.boxShadow = lightGlass.boxShadow as string;
                } else {
                  e.currentTarget.style.boxShadow = '0 4px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                }
              }}
            >
              <div className="text-sm text-[#30C48B] mb-4 font-medium">{f.num}.</div>
              <h3 className={`font-medium text-lg mb-2 ${light ? 'text-[#1a1a1a]' : ''}`}>{f.title}</h3>
              <p className={`text-[15px] leading-relaxed ${light ? 'text-[#777]' : 'text-[#999]'}`}>{f.desc}</p>
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
          <h2 className={`text-4xl font-light mb-5 tracking-tight ${light ? 'text-[#1a1a1a]' : ''}`}>Stop trading without accountability.</h2>
          <p className={`mb-10 max-w-md mx-auto text-base leading-relaxed ${light ? 'text-[#888]' : 'text-[#888]'}`}>
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
      <footer className={`relative z-10 border-t py-10 text-center text-sm ${light ? 'border-[rgba(0,0,0,0.06)] text-[#bbb]' : 'border-[rgba(255,255,255,0.06)] text-[#555]'}`}>
        Journal X — The first AI-powered accountability journal for traders.
      </footer>

      {showHowItWorks && <HowItWorksModal onSelectPlan={openPricingFromSteps} onClose={() => setShowHowItWorks(false)} light={light} />}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} light={light} />}
    </div>
  );
}
