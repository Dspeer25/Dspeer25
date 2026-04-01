'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'welcome' | 'profile' | 'rules' | 'intro' | 'loading';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [form, setForm] = useState({
    name: '',
    accountSize: '',
    tradingStyle: '',
    experience: '',
    markets: [] as string[],
    maxRiskPerTrade: '',
    maxDailyLoss: '',
    personalNote: '',
  });

  const update = (key: string, value: string | string[]) => setForm((p) => ({ ...p, [key]: value }));

  const toggleMarket = (m: string) => {
    const markets = form.markets.includes(m) ? form.markets.filter((x) => x !== m) : [...form.markets, m];
    update('markets', markets);
  };

  const finish = async () => {
    setStep('loading');
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        accountSize: parseFloat(form.accountSize) || 0,
        maxRiskPerTrade: parseFloat(form.maxRiskPerTrade) || 0,
        maxDailyLoss: parseFloat(form.maxDailyLoss) || 0,
        onboardingComplete: true,
      }),
    });
    // Simulate AI processing
    await new Promise((r) => setTimeout(r, 2500));
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0c0c14] flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-in">

        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="text-center">
            <div className="orb w-32 h-32 rounded-full mx-auto mb-8 flex items-center justify-center animate-pulse-glow">
              <span className="text-3xl font-black text-[#6366f1]/60">X</span>
            </div>
            <h1 className="text-3xl font-bold mb-3">Welcome to WickCoach</h1>
            <p className="text-[#8b8b9e] mb-8 max-w-sm mx-auto">Before you start, let&apos;s set up your profile so the AI knows who you are as a trader.</p>
            <button onClick={() => setStep('profile')} className="px-8 py-3 bg-[#6366f1] hover:bg-[#5558e6] rounded-xl font-medium transition-all">
              Let&apos;s Go
            </button>
          </div>
        )}

        {/* Step: Profile */}
        {step === 'profile' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">About You</h2>
              <p className="text-sm text-[#8b8b9e]">The AI uses this to personalize your experience.</p>
            </div>
            <div>
              <label className="block text-xs text-[#8b8b9e] mb-1.5">What should we call you?</label>
              <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your first name" className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-[#8b8b9e] mb-1.5">Account Size ($)</label>
              <input type="number" value={form.accountSize} onChange={(e) => update('accountSize', e.target.value)} placeholder="25000" className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-[#8b8b9e] mb-2">Trading Style</label>
              <div className="flex gap-2">
                {['Day Trading', 'Swing Trading', 'Both'].map((s) => (
                  <button key={s} onClick={() => update('tradingStyle', s)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${form.tradingStyle === s ? 'bg-[#6366f1] text-white' : 'glass text-[#8b8b9e] glass-hover'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#8b8b9e] mb-2">Experience Level</label>
              <div className="flex gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map((e) => (
                  <button key={e} onClick={() => update('experience', e)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${form.experience === e ? 'bg-[#6366f1] text-white' : 'glass text-[#8b8b9e] glass-hover'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#8b8b9e] mb-2">Markets You Trade</label>
              <div className="flex flex-wrap gap-2">
                {['Stocks', 'Options', 'Futures', 'Forex', 'Crypto'].map((m) => (
                  <button key={m} onClick={() => toggleMarket(m)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${form.markets.includes(m) ? 'bg-[#6366f1] text-white' : 'glass text-[#8b8b9e] glass-hover'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep('rules')} disabled={!form.name}
              className="w-full py-3 bg-[#6366f1] hover:bg-[#5558e6] disabled:opacity-30 rounded-xl font-medium transition-all">
              Continue
            </button>
          </div>
        )}

        {/* Step: Rules */}
        {step === 'rules' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Your Rules</h2>
              <p className="text-sm text-[#8b8b9e]">These are the rules the AI will hold you to. Be honest.</p>
            </div>
            <div>
              <label className="block text-xs text-[#8b8b9e] mb-1.5">Max Risk Per Trade ($)</label>
              <input type="number" value={form.maxRiskPerTrade} onChange={(e) => update('maxRiskPerTrade', e.target.value)} placeholder="100" className="w-full" />
              <p className="text-xs text-[#55556a] mt-1">If a trade exceeds this, the AI will ask why.</p>
            </div>
            <div>
              <label className="block text-xs text-[#8b8b9e] mb-1.5">Max Daily Loss ($)</label>
              <input type="number" value={form.maxDailyLoss} onChange={(e) => update('maxDailyLoss', e.target.value)} placeholder="500" className="w-full" />
              <p className="text-xs text-[#55556a] mt-1">Hit this limit and WickCoach locks trading for the day.</p>
            </div>
            <button onClick={() => setStep('intro')} className="w-full py-3 bg-[#6366f1] hover:bg-[#5558e6] rounded-xl font-medium transition-all">
              Continue
            </button>
          </div>
        )}

        {/* Step: Intro */}
        {step === 'intro' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Tell the AI about yourself</h2>
              <p className="text-sm text-[#8b8b9e]">Where are you in your trading journey? What are your biggest challenges? The more you share, the better the AI can help.</p>
            </div>
            <textarea
              value={form.personalNote}
              onChange={(e) => update('personalNote', e.target.value)}
              rows={6}
              placeholder="I've been trading for about a year, mostly small cap momentum plays. My biggest issue is revenge trading after a loss. I tend to size up when I'm emotional and that's where most of my big drawdowns come from..."
              className="w-full resize-none"
            />
            <button onClick={finish} disabled={!form.personalNote}
              className="w-full py-3 bg-[#6366f1] hover:bg-[#5558e6] disabled:opacity-30 rounded-xl font-medium transition-all">
              Launch WickCoach
            </button>
          </div>
        )}

        {/* Step: Loading */}
        {step === 'loading' && (
          <div className="text-center py-12">
            <div className="orb w-28 h-28 rounded-full mx-auto mb-8 flex items-center justify-center animate-pulse-glow">
              <div className="w-10 h-10 border-2 border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-bold mb-2">Building your profile...</h2>
            <p className="text-sm text-[#8b8b9e]">AI is analyzing your trading profile and setting up your accountability system.</p>
          </div>
        )}

        {/* Step indicator */}
        {step !== 'loading' && step !== 'welcome' && (
          <div className="flex justify-center gap-2 mt-8">
            {['profile', 'rules', 'intro'].map((s) => (
              <div key={s} className={`w-8 h-1 rounded-full transition-all ${s === step ? 'bg-[#6366f1]' : 'bg-[rgba(255,255,255,0.06)]'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
