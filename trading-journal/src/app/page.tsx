'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e4e4e7]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-lg font-bold">Trading Journal</span>
        <div className="flex gap-3">
          {isSignedIn ? (
            <Link href="/dashboard" className="px-4 py-2 bg-[#3b82f6] hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="px-4 py-2 text-sm text-[#a1a1aa] hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" className="px-4 py-2 bg-[#3b82f6] hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block px-3 py-1 bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-full text-xs text-[#3b82f6] font-medium mb-6">
          Built by a trader. For traders.
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
          Your edge,<br />
          <span className="text-[#3b82f6]">systemized.</span>
        </h1>
        <p className="text-lg text-[#a1a1aa] max-w-2xl mx-auto mb-10">
          Stop guessing. Start tracking. The fastest, cleanest trading journal that actually helps you find what works — and cut what doesn&apos;t.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="px-8 py-3 bg-[#3b82f6] hover:bg-blue-600 rounded-lg font-semibold text-lg transition-colors"
          >
            Start Journaling — $10
          </Link>
        </div>
        <p className="text-xs text-[#71717a] mt-3">One-time payment. No subscription. Yours forever.</p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Fast Trade Logging', desc: 'Log trades in seconds. Compact form, smart defaults, zero friction.', icon: '⚡' },
            { title: 'Calendar PnL', desc: 'See your month at a glance. Green days, red days, patterns emerge.', icon: '▦' },
            { title: 'Custom Fields', desc: 'Your setups, your edge. Define your own fields and dropdowns.', icon: '⚙' },
            { title: 'Grouped Stats', desc: 'Which setup makes you money? Filter stats by any field to find out.', icon: '◈' },
            { title: 'Daily Journal', desc: 'Pre-market observations. Post-market review. Weekly goals.', icon: '✎' },
            { title: 'Risk Lockout', desc: 'Hit your daily loss limit? Screen locks. Protect your capital.', icon: '🔒' },
          ].map((f) => (
            <div key={f.title} className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-5">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-[#a1a1aa]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-8">How it works</h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Set up your system', desc: 'Define your setups, grades, and risk rules in Settings.' },
            { step: '2', title: 'Log every trade', desc: 'Takes 10 seconds. Date, ticker, result, PnL. Done.' },
            { step: '3', title: 'Find your edge', desc: 'Grouped stats show exactly which setups make you money.' },
          ].map((s) => (
            <div key={s.step}>
              <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6] font-bold text-sm flex items-center justify-center mx-auto mb-3">
                {s.step}
              </div>
              <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
              <p className="text-xs text-[#a1a1aa]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-3">Ready to trade with a system?</h2>
          <p className="text-[#a1a1aa] mb-6">One payment. Full access. No monthly fees eating into your PnL.</p>
          <Link
            href="/sign-up"
            className="inline-block px-8 py-3 bg-[#3b82f6] hover:bg-blue-600 rounded-lg font-semibold transition-colors"
          >
            Get Trading Journal — $10
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a2a3e] py-6 text-center text-xs text-[#71717a]">
        Trading Journal — Built for real traders.
      </footer>
    </div>
  );
}
