'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen text-[#f0f0f5] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[30%] w-[600px] h-[600px] rounded-full bg-[#6366f1]/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] rounded-full bg-[#818cf8]/[0.03] blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] backdrop-blur-xl flex items-center justify-center">
            <span className="text-[#6366f1] text-xs font-black">X</span>
          </div>
          <span className="text-base font-semibold tracking-tight">Journal X</span>
        </div>
        <div className="flex gap-3">
          {isSignedIn ? (
            <Link href="/dashboard" className="px-5 py-2.5 glass rounded-xl text-sm font-medium hover:bg-[rgba(255,255,255,0.08)] transition-all">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="px-4 py-2.5 text-sm text-[#8b8b9e] hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" className="px-5 py-2.5 glass rounded-xl text-sm font-medium hover:bg-[rgba(255,255,255,0.08)] transition-all">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero - centered orb */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-[#8b8b9e] mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse" />
          The first AI-powered accountability trading journal
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] mb-6 tracking-tight text-center">
          Your trades.<br />
          <span className="text-[#6366f1]">Your rules.</span><br />
          <span className="text-[#8b8b9e] text-4xl sm:text-5xl lg:text-6xl">Real accountability.</span>
        </h1>

        <p className="text-lg text-[#8b8b9e] max-w-xl mx-auto mb-14 leading-relaxed text-center">
          Journal X doesn&apos;t just track your trades — it holds you to the goals you set.
        </p>

        {/* THE ORB - main CTA */}
        <Link href="/sign-up" className="group relative">
          <div className="orb w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center text-center animate-pulse-glow cursor-pointer group-hover:scale-[1.04] transition-transform duration-500">
            <div className="text-[#8b8b9e] text-[10px] uppercase tracking-[0.2em] mb-2">Begin</div>
            <div className="text-xl sm:text-2xl font-bold mb-1">Start Your</div>
            <div className="text-xl sm:text-2xl font-bold text-[#6366f1]">Journal</div>
            <div className="w-8 h-[1px] bg-[rgba(255,255,255,0.1)] my-3" />
            <div className="text-[10px] text-[#55556a] uppercase tracking-[0.15em]">Lifetime Access</div>
          </div>
          {/* Outer ring glow */}
          <div className="absolute inset-[-12px] rounded-full border border-[rgba(99,102,241,0.08)] group-hover:border-[rgba(99,102,241,0.15)] transition-all duration-500" />
          <div className="absolute inset-[-28px] rounded-full border border-[rgba(99,102,241,0.04)] group-hover:border-[rgba(99,102,241,0.08)] transition-all duration-700" />
        </Link>

        <p className="text-xs text-[#55556a] mt-10">One-time payment. Full access forever. No subscriptions.</p>
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
            { title: 'Real-time Coach', desc: 'Chat with an AI that knows your history, goals, and tendencies.', icon: '✦' },
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
          <Link
            href="/sign-up"
            className="inline-block px-10 py-4 glass rounded-2xl font-semibold text-lg transition-all hover:bg-[rgba(255,255,255,0.08)] glow-accent"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(255,255,255,0.04)] py-8 text-center text-xs text-[#55556a]">
        Journal X — The first AI-powered accountability journal for traders.
      </footer>
    </div>
  );
}
