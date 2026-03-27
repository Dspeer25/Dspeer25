'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-[#0c0c14] text-[#f0f0f5]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/30 flex items-center justify-center">
            <span className="text-[#6366f1] text-xs font-bold">X</span>
          </div>
          <span className="text-base font-semibold tracking-tight">Journal X</span>
        </div>
        <div className="flex gap-3">
          {isSignedIn ? (
            <Link href="/dashboard" className="px-5 py-2 bg-[#6366f1] hover:bg-[#5558e6] rounded-xl text-sm font-medium transition-all">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="px-4 py-2 text-sm text-[#8b8b9e] hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" className="px-5 py-2 bg-[#6366f1] hover:bg-[#5558e6] rounded-xl text-sm font-medium transition-all">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-[#8b8b9e] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse" />
          AI-powered accountability for traders
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] mb-6 tracking-tight">
          Your trades.<br />
          <span className="text-[#6366f1]">Your rules.</span><br />
          <span className="text-[#8b8b9e] text-4xl sm:text-5xl lg:text-6xl">Real accountability.</span>
        </h1>

        <p className="text-lg text-[#8b8b9e] max-w-xl mx-auto mb-12 leading-relaxed">
          Journal X doesn&apos;t just track your trades — it holds you to the goals you set. AI that knows your stats, your rules, and calls you out when you break them.
        </p>

        <Link
          href="/sign-up"
          className="inline-block px-10 py-4 bg-[#6366f1] hover:bg-[#5558e6] rounded-2xl font-semibold text-lg transition-all glow-accent"
        >
          Start Journal X — $10
        </Link>
        <p className="text-xs text-[#55556a] mt-4">One-time payment. Full access. No subscriptions.</p>
      </section>

      {/* The Orb Preview */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="orb rounded-3xl p-16 text-center mx-auto max-w-lg animate-pulse-glow">
          <div className="text-[#8b8b9e] text-sm mb-2 uppercase tracking-widest">Your Week</div>
          <div className="text-2xl font-bold mb-4">Start a new week</div>
          <p className="text-sm text-[#55556a]">Set your goals. Tell the AI where your head is at. Trade with intention.</p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-center text-2xl font-bold mb-12">Not just a journal. A trading coach.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Weekly Check-ins', desc: 'Start each week with intention. Set goals, tell the AI your focus, trade with a plan.', icon: '◎' },
            { title: 'AI Accountability', desc: 'Break a rule? The AI asks why. Not punishment — reflection. That\u2019s how you grow.', icon: '◈' },
            { title: 'Smart Stats', desc: 'Upload your data in any format. AI analyzes your patterns and tells you what\u2019s actually working.', icon: '▦' },
            { title: 'Real-time Coach', desc: 'Chat with an AI that knows your trading history, your goals, and your tendencies.', icon: '✦' },
            { title: 'Trade Logging', desc: 'Fast, clean, zero friction. Log trades in seconds with smart defaults.', icon: '⚡' },
            { title: 'Performance Insights', desc: 'AI-generated insights comparing your actual performance against stated goals.', icon: '◉' },
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
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold mb-12">How Journal X works</h2>
        <div className="space-y-8">
          {[
            { step: '01', title: 'Set up your profile', desc: 'Tell the AI who you are — account size, trading style, experience, risk rules.' },
            { step: '02', title: 'Start your week', desc: 'Each Monday, set goals and check in with the AI coach. Where\u2019s your head at?' },
            { step: '03', title: 'Log & be accountable', desc: 'Trade. Log. If you break a rule, the AI asks why. Upload stats in any format.' },
            { step: '04', title: 'Get real insights', desc: 'AI compares your performance to your goals. Not generic advice — your actual data.' },
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

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="glass rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">Stop trading without accountability.</h2>
          <p className="text-[#8b8b9e] mb-8 max-w-md mx-auto">The difference between profitable and unprofitable traders? Discipline. Journal X makes discipline automatic.</p>
          <Link
            href="/sign-up"
            className="inline-block px-10 py-4 bg-[#6366f1] hover:bg-[#5558e6] rounded-2xl font-semibold text-lg transition-all"
          >
            Get Journal X — $10
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] py-8 text-center text-xs text-[#55556a]">
        Journal X — The first AI-powered accountability journal for traders.
      </footer>
    </div>
  );
}
