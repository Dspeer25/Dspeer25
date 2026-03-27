'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass rounded-3xl p-8 sm:p-10 max-w-3xl w-full animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-5 text-[#55556a] hover:text-white text-xl transition-colors bg-transparent">x</button>

        <h2 className="text-2xl font-bold text-center mb-2">Choose Your Plan</h2>
        <p className="text-[#8b8b9e] text-center text-sm mb-8">One-time payment. Lifetime access. No subscriptions ever.</p>

        {/* Plans side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {/* Essential */}
          <div className="glass rounded-2xl p-6 flex flex-col">
            <div className="text-xs text-[#8b8b9e] uppercase tracking-[0.15em] mb-1">Essential</div>
            <div className="text-3xl font-black mb-1">$25</div>
            <div className="text-xs text-[#55556a] mb-5">one-time payment</div>
            <div className="text-xs text-[#8b8b9e] uppercase tracking-wider mb-3">Includes:</div>
            <ul className="space-y-2.5 flex-1">
              {features.map((f) => (
                <li key={f.name} className="flex items-center gap-2.5 text-sm">
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
            <Link
              href="/sign-up?tier=essential"
              className="mt-6 block text-center py-3 px-6 glass rounded-xl font-semibold text-sm hover:bg-[rgba(255,255,255,0.1)] transition-all"
            >
              Get Essential
            </Link>
          </div>

          {/* Full - highlighted */}
          <div className="glass rounded-2xl p-6 flex flex-col border-[#6366f1]/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6366f1] to-transparent" />
            <div className="text-xs text-[#6366f1] uppercase tracking-[0.15em] mb-1 font-semibold">Complete</div>
            <div className="text-3xl font-black mb-1">$50</div>
            <div className="text-xs text-[#55556a] mb-5">one-time payment</div>
            <div className="text-xs text-[#8b8b9e] uppercase tracking-wider mb-3">Includes:</div>
            <ul className="space-y-2.5 flex-1">
              {features.map((f) => (
                <li key={f.name} className="flex items-center gap-2.5 text-sm">
                  <span className="text-[#34d399] text-xs shrink-0">&#10003;</span>
                  <span className="text-[#e0e0ea]">{f.name}</span>
                  {f.hasInfo && (
                    <span
                      className="relative"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      <span className="w-4 h-4 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-[9px] flex items-center justify-center text-[#8b8b9e] cursor-help">?</span>
                      {showTooltip && (
                        <span className="absolute left-6 top-[-60px] w-72 glass rounded-xl p-3 text-xs text-[#c0c0d0] leading-relaxed z-50 pointer-events-none animate-fade-in">
                          Your AI coach is modeled after Mark Douglas&apos; trading psychology. It has full access to your past stats, logged trades, and stated goals — so it can hold you accountable in real time. When you break a rule, it asks why. Not punishment — reflection. That&apos;s how you grow as a trader.
                        </span>
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <Link
              href="/sign-up?tier=complete"
              className="mt-6 block text-center py-3 px-6 bg-[#6366f1] hover:bg-[#5558e6] rounded-xl font-semibold text-sm transition-all glow-accent"
            >
              Get Complete
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-[#55556a]">Secure checkout powered by Stripe.</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [showPricing, setShowPricing] = useState(false);

  return (
    <div className="min-h-screen text-[#f0f0f5] relative overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[25%] w-[700px] h-[700px] rounded-full bg-[#6366f1]/[0.06] blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] rounded-full bg-[#818cf8]/[0.04] blur-[120px]" />
        <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#6366f1]/[0.03] blur-[100px]" />
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
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-6">
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

        {/* THE ORB - big, centered, clickable */}
        <button onClick={() => setShowPricing(true)} className="group relative">
          <div className="orb w-64 h-64 sm:w-80 sm:h-80 rounded-full flex flex-col items-center justify-center text-center animate-pulse-glow cursor-pointer group-hover:scale-[1.04] transition-transform duration-500">
            <div className="text-[#8b8b9e] text-[10px] uppercase tracking-[0.25em] mb-3">Begin</div>
            <div className="text-2xl sm:text-3xl font-bold mb-1">Start Your</div>
            <div className="text-2xl sm:text-3xl font-bold text-[#6366f1]">Journal</div>
          </div>
          {/* Outer rings */}
          <div className="absolute inset-[-16px] rounded-full border border-[rgba(99,102,241,0.1)] group-hover:border-[rgba(99,102,241,0.2)] transition-all duration-500" />
          <div className="absolute inset-[-36px] rounded-full border border-[rgba(99,102,241,0.05)] group-hover:border-[rgba(99,102,241,0.1)] transition-all duration-700" />
          <div className="absolute inset-[-60px] rounded-full border border-[rgba(99,102,241,0.02)] group-hover:border-[rgba(99,102,241,0.05)] transition-all duration-1000" />
        </button>

        <p className="text-xs text-[#55556a] mt-12">One-time payment. Full access forever. No subscriptions.</p>
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

      {/* How it works */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold mb-12">How Journal X works</h2>
        <div className="space-y-8">
          {[
            { step: '01', title: 'Set up your profile', desc: 'Tell the AI who you are — account size, trading style, experience, risk rules.' },
            { step: '02', title: 'Start your week', desc: 'Each Monday, set goals and check in with the AI coach.' },
            { step: '03', title: 'Log & be accountable', desc: 'Trade. Log. If you break a rule, the AI asks why.' },
            { step: '04', title: 'Get real insights', desc: 'AI compares your performance to your goals. Your actual data, not generic advice.' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-6 text-left">
              <div className="text-2xl font-black text-[#6366f1]/30 shrink-0 w-12">{s.step}</div>
              <div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-[#8b8b9e]">{s.desc}</p>
              </div>
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
            onClick={() => setShowPricing(true)}
            className="inline-block px-10 py-4 glass rounded-2xl font-semibold text-lg transition-all glass-hover glow-accent"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(255,255,255,0.04)] py-8 text-center text-xs text-[#55556a]">
        Journal X — The first AI-powered accountability journal for traders.
      </footer>

      {/* Pricing Modal */}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </div>
  );
}
