'use client';

import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import Link from 'next/link';

function HowItWorksModal({ onSelectPlan, onClose }: { onSelectPlan: () => void; onClose: () => void }) {
  const steps = [
    {
      num: '01',
      title: 'Sign Up',
      desc: 'Create your account in seconds. You\'re already here.',
      icon: '→',
    },
    {
      num: '02',
      title: 'Tell Us Your Story',
      desc: 'Share your experience, goals, and trading rules. Our AI listens and evaluates — it becomes your personal coach.',
      icon: '◎',
    },
    {
      num: '03',
      title: 'Log & Analyze in Real-Time',
      desc: 'Log trades, track performance, and let AI hold you accountable when you\'re falling short of your stated goals and metrics.',
      icon: '◈',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative glass rounded-3xl p-8 sm:p-10 max-w-2xl w-full animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-5 text-[#55556a] hover:text-white text-xl transition-colors bg-transparent">x</button>

        <h2 className="text-2xl font-bold text-center mb-2">How Journal X Works</h2>
        <p className="text-[#8b8b9e] text-center text-sm mb-10">Three steps to trading with real accountability.</p>

        <div className="space-y-6 mb-10">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-start gap-5">
              <div className="shrink-0 w-12 h-12 rounded-full glass flex items-center justify-center">
                <span className="text-[#6366f1] font-black text-sm">{s.num}</span>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-semibold text-lg mb-1">{s.title}</h3>
                <p className="text-sm text-[#8b8b9e] leading-relaxed">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="absolute left-[calc(2rem+24px)] mt-12 w-[1px] h-6 bg-[rgba(255,255,255,0.06)]" />
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
    { name: 'Real-time AI Chat', essential: false, full: true },
    { name: 'AI Weekly Check-in Reviews', essential: false, full: true },
    { name: 'AI Rule Violation Detection', essential: false, full: true },
  ];

  const [showTooltip, setShowTooltip] = useState(false);

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
        <button onClick={onClose} className="absolute top-4 right-5 text-[#55556a] hover:text-white text-xl transition-colors bg-transparent">x</button>

        <h2 className="text-2xl font-bold text-center mb-2">Choose Your Plan</h2>
        <p className="text-[#8b8b9e] text-center text-sm mb-8">One-time payment. Lifetime access. No subscriptions ever.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {/* Essential - $25 */}
          <div className="glass rounded-2xl p-6 flex flex-col">
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
          <div className="glass rounded-2xl p-6 flex flex-col relative overflow-hidden" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
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
                    <span
                      className="relative"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      <span className="w-4 h-4 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-[9px] inline-flex items-center justify-center text-[#8b8b9e] cursor-help">?</span>
                      {showTooltip && (
                        <span className="absolute right-6 bottom-0 w-80 glass rounded-xl p-4 text-xs text-[#c0c0d0] leading-relaxed z-50 pointer-events-none animate-fade-in whitespace-normal">
                          <strong className="text-white block mb-1">AI Accountability Coach</strong>
                          Modeled after Mark Douglas&apos; trading psychology (&quot;Trading in the Zone&quot;). Has full access to your past stats, logged trades, and stated goals — holds you accountable in real time. When you break a rule, it asks why. Not punishment — reflection. It knows who you are as a trader and coaches you toward consistency and discipline.
                        </span>
                      )}
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
      {/* Colored blobs behind glass elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[800px] h-[800px] rounded-full bg-[#6366f1]/[0.08] blur-[200px]" />
        <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#818cf8]/[0.06] blur-[180px]" />
        <div className="absolute bottom-[-5%] left-[40%] w-[700px] h-[700px] rounded-full bg-[#4f46e5]/[0.07] blur-[200px]" />
        <div className="absolute top-[60%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#7c3aed]/[0.05] blur-[150px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl glass flex items-center justify-center">
            <span className="text-[#6366f1] text-xs font-black">X</span>
          </div>
          <span className="text-base font-semibold tracking-tight">Journal X</span>
        </div>
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

        {/* THE ORB - opens how it works first */}
        <button onClick={() => setShowHowItWorks(true)} className="group relative bg-transparent">
          <div className="orb w-72 h-72 sm:w-96 sm:h-96 rounded-full flex flex-col items-center justify-center text-center animate-pulse-glow cursor-pointer group-hover:scale-[1.04] transition-transform duration-500">
            <div className="text-[#8b8b9e] text-[11px] uppercase tracking-[0.25em] mb-4">Begin</div>
            <div className="text-3xl sm:text-4xl font-bold mb-1">Start Your</div>
            <div className="text-3xl sm:text-4xl font-bold text-[#6366f1]">Journal</div>
          </div>
          <div className="absolute inset-[-20px] rounded-full border border-[rgba(255,255,255,0.08)] group-hover:border-[rgba(255,255,255,0.15)] transition-all duration-500" />
          <div className="absolute inset-[-44px] rounded-full border border-[rgba(255,255,255,0.04)] group-hover:border-[rgba(255,255,255,0.1)] transition-all duration-700" />
          <div className="absolute inset-[-72px] rounded-full border border-[rgba(255,255,255,0.02)] group-hover:border-[rgba(255,255,255,0.06)] transition-all duration-1000" />
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

      {/* How It Works Modal (shows first) */}
      {showHowItWorks && (
        <HowItWorksModal
          onSelectPlan={openPricingFromSteps}
          onClose={() => setShowHowItWorks(false)}
        />
      )}

      {/* Pricing Modal (shows after how it works) */}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </div>
  );
}
