'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

/* ── Logo ── */
function JournalXLogo({ light = false }: { light?: boolean }) {
  const c = light ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.75)';
  const cl = light ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.65)';
  const leg = light ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)';
  return (
    <Link href="/" className="flex flex-col items-start">
      <svg width="52" height="52" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="12" r="4.5" stroke={c} strokeWidth="1.8" fill="none" />
        <line x1="18" y1="16.5" x2="18" y2="30" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="18" y1="21" x2="12" y2="27" stroke={cl} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="21" x2="32" y2="17" stroke={cl} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="30" x2="13" y2="40" stroke={leg} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="30" x2="23" y2="40" stroke={leg} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="35" y1="6" x2="35" y2="11" stroke="#30C48B" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="32" y="11" width="6" height="14" rx="1.5" fill="rgba(48,196,139,0.35)" stroke="#30C48B" strokeWidth="1" />
        <line x1="35" y1="25" x2="35" y2="32" stroke="#30C48B" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <div className="mt-[-2px] ml-[2px]">
        <span className="text-[11px] font-bold tracking-[0.35em] uppercase" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif", color: light ? '#3a3d48' : '#bbb' }}>
          Journal
        </span>
        <span className="text-[11px] font-bold tracking-[0.35em] uppercase text-[#30C48B] ml-[2px]" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}>
          X
        </span>
      </div>
    </Link>
  );
}

/* ── Mark Douglas icon (small bust for the coach section) ── */
function CoachIcon({ light = false }: { light?: boolean }) {
  const color = light ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)';
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="12" r="6" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M8 36 C8 26 14 22 20 22 C26 22 32 26 32 36" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="12" r="10" stroke="#30C48B" strokeWidth="0.5" opacity="0.3" fill="none" />
    </svg>
  );
}

/* ── Nav links ── */
const navItems = ['Log a Trade', 'Past Trades', 'Analysis', 'Trading Goals', 'Trader Profile'] as const;
const navPaths = ['/log-trade', '/past-trades', '/analysis', '/trading-goals', '/trader-profile'] as const;

/* ── Fake AI coach responses for demo ── */
const coachResponses: Record<string, string> = {
  default: "Tell me about this trade. What was your setup, and what rules from your trading plan did this trade follow?",
  breakout: "A breakout trade — solid. Did you wait for confirmation before entering, or did you anticipate? Remember: the market doesn't know your position. Every trade is simply a unique edge being expressed. What made you confident in this particular breakout?",
  revenge: "I hear some frustration in that. Let me ask you something important: were you trading the market, or were you trading your P&L? If this trade was about making back what you lost, that's your ego trading, not your edge. The market doesn't owe you anything from the last trade.",
  fomo: "FOMO is your mind telling you that THIS opportunity is unique and special. But is it? If your edge plays out over hundreds of trades, missing one is statistically irrelevant. The damage from forcing a trade outside your plan is far greater than the regret of missing one winner.",
  impulse: "An impulse trade. No judgment — but let's examine it. Mark Douglas would say: 'The best traders have learned to accept the risk.' You accepted the risk of this trade, but did you define it before entry? If not, you weren't trading — you were gambling. There's a difference.",
  good: "That sounds like a well-executed trade. You followed your process, and that's what matters. Remember — a losing trade executed perfectly is still a good trade. An A+ setup with A+ execution. The outcome is just probability expressing itself. Keep doing this.",
};

function getCoachResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('revenge') || lower.includes('mad') || lower.includes('angry') || lower.includes('frustrated') || lower.includes('make it back')) return coachResponses.revenge;
  if (lower.includes('fomo') || lower.includes('chase') || lower.includes('missed') || lower.includes('jumped in')) return coachResponses.fomo;
  if (lower.includes('impulse') || lower.includes('didn\'t plan') || lower.includes('no plan') || lower.includes('just took it')) return coachResponses.impulse;
  if (lower.includes('breakout') || lower.includes('break out') || lower.includes('broke out')) return coachResponses.breakout;
  if (lower.includes('followed') || lower.includes('plan') || lower.includes('setup') || lower.includes('patient') || lower.includes('waited')) return coachResponses.good;
  return coachResponses.default;
}

export default function LogTradePage() {
  const { isSignedIn } = useAuth();
  const [light, setLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('jx-theme');
    if (saved === 'light') setLight(true);
  }, []);
  useEffect(() => {
    localStorage.setItem('jx-theme', light ? 'light' : 'dark');
  }, [light]);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    ticker: '',
    time: new Date().toTimeString().slice(0, 5),
    tradeType: 'Day' as 'Day' | 'Swing',
    direction: 'Long' as 'Long' | 'Short',
    entryPrice: '',
    exitPrice: '',
    positionSize: '',
    initialRisk: '',
    result: '' as '' | 'W' | 'L' | 'BE',
    dollarPnl: '',
    rr: '',
    strategy: '',
    confidence: '',
  });

  // AI Coach state
  const [coachMessages, setCoachMessages] = useState<{ role: 'coach' | 'user'; text: string }[]>([
    { role: 'coach', text: coachResponses.default },
  ]);
  const [coachInput, setCoachInput] = useState('');
  const [coachTyping, setCoachTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  // Auto-calculate P&L and R:R
  useEffect(() => {
    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);
    const size = parseFloat(form.positionSize);
    const risk = parseFloat(form.initialRisk);

    if (entry && exit && size) {
      const raw = form.direction === 'Long' ? (exit - entry) * size : (entry - exit) * size;
      const pnl = Math.round(raw * 100) / 100;
      setForm(p => ({ ...p, dollarPnl: pnl.toString() }));
      if (pnl > 0) setForm(p => ({ ...p, result: 'W' }));
      else if (pnl < 0) setForm(p => ({ ...p, result: 'L' }));
      else setForm(p => ({ ...p, result: 'BE' }));
    }

    if (risk && risk > 0 && form.dollarPnl) {
      const rr = Math.round((parseFloat(form.dollarPnl) / risk) * 100) / 100;
      setForm(p => ({ ...p, rr: rr.toString() }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.entryPrice, form.exitPrice, form.positionSize, form.direction, form.initialRisk]);

  // Scroll coach chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [coachMessages]);

  const sendCoachMessage = () => {
    if (!coachInput.trim()) return;
    const userMsg = coachInput.trim();
    setCoachMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setCoachInput('');
    setCoachTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const response = getCoachResponse(userMsg);
      setCoachMessages(prev => [...prev, { role: 'coach', text: response }]);
      setCoachTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) return;
    if (!form.ticker || !form.result || saving) return;

    setSaving(true);
    try {
      await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date,
          ticker: form.ticker.toUpperCase(),
          time: form.time,
          tradeType: form.tradeType,
          direction: form.direction,
          entryPrice: parseFloat(form.entryPrice) || 0,
          exitPrice: parseFloat(form.exitPrice) || 0,
          positionSize: parseFloat(form.positionSize) || 0,
          initialRisk: parseFloat(form.initialRisk) || 0,
          result: form.result,
          dollarPnl: parseFloat(form.dollarPnl) || 0,
          rr: parseFloat(form.rr) || 0,
          notes: coachMessages.filter(m => m.role === 'user').map(m => m.text).join('\n'),
          starred: false,
          grade: '',
          customFields: {
            ...(form.strategy ? { strategy: form.strategy } : {}),
            ...(form.confidence ? { confidence: form.confidence } : {}),
          },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setForm(p => ({
        ...p,
        ticker: '', entryPrice: '', exitPrice: '', positionSize: '',
        initialRisk: '', result: '', dollarPnl: '', rr: '',
        strategy: '', confidence: '',
      }));
      setCoachMessages([{ role: 'coach', text: coachResponses.default }]);
    } catch { /* TODO */ }
    setSaving(false);
  };

  // ── Style helpers ──
  const labelCls = `block text-[12px] font-bold tracking-[0.2em] uppercase mb-2 ${light ? 'text-[#8a8d98]' : 'text-[#8a8d98]'}`;
  const inputCls = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 ${
    light
      ? 'bg-white/80 border border-[rgba(0,0,0,0.10)] text-[#1a1c2e] placeholder-[#bbb] focus:border-[#30C48B] focus:ring-1 focus:ring-[#30C48B]/20'
      : 'bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-[#eee] placeholder-[#8a8d98] focus:border-[#30C48B] focus:ring-1 focus:ring-[#30C48B]/20'
  }`;
  const glassPanelCls = light
    ? 'bg-white/60 border border-[rgba(0,0,0,0.06)] shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
    : 'glass';

  return (
    <div
      className="min-h-screen relative transition-colors duration-500"
      style={light ? { background: '#f5f5f0', color: '#1a1c2e' } : {}}
    >
      {light && (
        <style>{`
          body { background: #f5f5f0 !important; color: #1a1c2e !important; }
          body::before { opacity: 0.04 !important; }
        `}</style>
      )}

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <JournalXLogo light={light} />
        <div className="flex items-center gap-5">
          {isSignedIn && (
            <Link href="/dashboard" className={`text-sm transition-colors ${light ? 'text-[#8a8d98] hover:text-black' : 'text-[#8a8d98] hover:text-white'}`}>
              Dashboard
            </Link>
          )}
          <button
            onClick={() => setLight(!light)}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${light ? 'bg-[#222] text-white hover:bg-[#3a3d48]' : 'glass text-[#8a8d98] hover:text-white'}`}
          >
            {light ? '\u{1F319}' : '\u{2600}\u{FE0F}'}
          </button>
        </div>
      </nav>

      {/* Product nav */}
      <div className="relative z-10 flex items-center justify-center gap-10 sm:gap-14 px-8 pt-2 pb-4 max-w-7xl mx-auto">
        {navItems.map((item, i) => (
          <Link
            key={item}
            href={navPaths[i]}
            className={`text-[11px] font-bold tracking-[0.35em] uppercase transition-colors ${
              i === 0
                ? 'text-[#30C48B]'
                : light ? 'text-[#e0e0e8] hover:text-[#3a3d48]' : 'text-[#8a8d98] hover:text-[#e0e0e8]'
            }`}
            style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}
          >
            {item}
          </Link>
        ))}
      </div>

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-8 pt-8 pb-24">
        <div className="mb-10">
          <h1 className={`text-3xl font-light tracking-tight mb-2 ${light ? 'text-[#1a1c2e]' : 'text-white'}`}>Log a Trade</h1>
          <p className={`text-sm ${light ? 'text-[#8a8d98]' : 'text-[#8a8d98]'}`}>Record the bones of every trade. The stats calculate themselves.</p>
        </div>

        {saved && (
          <div className="mb-6 px-5 py-3 rounded-xl bg-[#30C48B]/10 border border-[#30C48B]/20 text-[#30C48B] text-sm animate-fade-in">
            Trade logged successfully.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ─── THE BASICS ─── */}
          <div className={`${glassPanelCls} rounded-2xl p-8 mb-5`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <h2 className="text-[18px] font-bold tracking-[0.3em] uppercase mb-6 text-[#30C48B]">The Basics</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={form.date} onChange={e => update('date', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ticker</label>
                <input type="text" value={form.ticker} onChange={e => update('ticker', e.target.value)} placeholder="AAPL" className={`${inputCls} uppercase`} />
              </div>
              <div>
                <label className={labelCls}>Time</label>
                <input type="time" value={form.time} onChange={e => update('time', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Strategy</label>
                <input type="text" value={form.strategy} onChange={e => update('strategy', e.target.value)} placeholder="Breakout, Reversal..." className={inputCls} />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div>
                <label className={labelCls}>Type</label>
                <div className={`flex gap-1 rounded-xl p-1 ${glassPanelCls}`}>
                  {(['Day', 'Swing'] as const).map(t => (
                    <button key={t} type="button" onClick={() => update('tradeType', t)}
                      className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        form.tradeType === t
                          ? 'bg-[#30C48B] text-black'
                          : light ? 'text-[#8a8d98] hover:text-[#3a3d48]' : 'text-[#8a8d98] hover:text-white'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Direction</label>
                <div className={`flex gap-1 rounded-xl p-1 ${glassPanelCls}`}>
                  {(['Long', 'Short'] as const).map(d => (
                    <button key={d} type="button" onClick={() => update('direction', d)}
                      className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        form.direction === d
                          ? d === 'Long' ? 'bg-[#30C48B] text-black' : 'bg-[#f87171] text-white'
                          : light ? 'text-[#8a8d98] hover:text-[#3a3d48]' : 'text-[#8a8d98] hover:text-white'
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Confidence</label>
                <div className={`flex gap-1 rounded-xl p-1 ${glassPanelCls}`}>
                  {['Low', 'Med', 'High'].map(c => (
                    <button key={c} type="button" onClick={() => update('confidence', form.confidence === c ? '' : c)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        form.confidence === c
                          ? c === 'High' ? 'bg-[#30C48B] text-black' : c === 'Med' ? 'bg-[#fbbf24] text-black' : 'bg-[#f87171] text-white'
                          : light ? 'text-[#8a8d98] hover:text-[#3a3d48]' : 'text-[#8a8d98] hover:text-white'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── NUMBERS ─── */}
          <div className={`${glassPanelCls} rounded-2xl p-8 mb-5`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <h2 className="text-[18px] font-bold tracking-[0.3em] uppercase mb-6 text-[#30C48B]">Numbers</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div>
                <label className={labelCls}>Entry Price</label>
                <input type="number" step="0.01" value={form.entryPrice} onChange={e => update('entryPrice', e.target.value)} placeholder="150.25" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Exit Price</label>
                <input type="number" step="0.01" value={form.exitPrice} onChange={e => update('exitPrice', e.target.value)} placeholder="155.50" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Position Size</label>
                <input type="number" step="1" value={form.positionSize} onChange={e => update('positionSize', e.target.value)} placeholder="100 shares" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Risk ($)</label>
                <input type="number" step="0.01" value={form.initialRisk} onChange={e => update('initialRisk', e.target.value)} placeholder="200" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Result</label>
                <div className={`flex gap-1 rounded-xl p-1 ${glassPanelCls}`}>
                  {(['W', 'L', 'BE'] as const).map(r => (
                    <button key={r} type="button" onClick={() => update('result', r)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                        form.result === r
                          ? r === 'W' ? 'bg-[#30C48B] text-black' : r === 'L' ? 'bg-[#f87171] text-white' : 'bg-[#fbbf24] text-black'
                          : light ? 'text-[#8a8d98] hover:text-[#3a3d48]' : 'text-[#8a8d98] hover:text-white'
                      }`}>
                      {r === 'W' ? 'Win' : r === 'L' ? 'Loss' : 'B/E'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>P&L ($)</label>
                <input type="number" step="0.01" value={form.dollarPnl} onChange={e => update('dollarPnl', e.target.value)} placeholder="Auto-calculated"
                  className={`${inputCls} ${
                    parseFloat(form.dollarPnl) > 0 ? '!text-[#30C48B]' : parseFloat(form.dollarPnl) < 0 ? '!text-[#f87171]' : ''
                  }`}
                />
              </div>
              <div>
                <label className={labelCls}>R Multiple</label>
                <input type="number" step="0.01" value={form.rr} onChange={e => update('rr', e.target.value)} placeholder="Auto-calculated"
                  className={`${inputCls} ${
                    parseFloat(form.rr) > 0 ? '!text-[#30C48B]' : parseFloat(form.rr) < 0 ? '!text-[#f87171]' : ''
                  }`}
                />
              </div>
            </div>
          </div>

          {/* ─── AI TRADING COACH ─── */}
          <div className={`${glassPanelCls} rounded-2xl p-8 mb-5`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <div className="flex items-center gap-3 mb-6">
              <CoachIcon light={light} />
              <div>
                <h2 className="text-[18px] font-bold tracking-[0.3em] uppercase text-[#30C48B]">Trading Coach</h2>
                <p className={`text-[12px] mt-0.5 ${light ? 'text-[#8a8d98]' : 'text-[#8a8d98]'}`}>
                  Modeled after Mark Douglas &middot; Trading in the Zone
                </p>
              </div>
            </div>

            {/* Chat area */}
            <div className={`rounded-xl p-4 mb-4 max-h-[320px] overflow-y-auto ${
              light
                ? 'bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)]'
                : 'bg-[rgba(0,0,0,0.25)] border border-[rgba(255,255,255,0.04)]'
            }`}>
              <div className="space-y-4">
                {coachMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#30C48B]/15 text-[#30C48B] rounded-br-md'
                        : light
                          ? 'bg-white/80 text-[#5a5d68] border border-[rgba(0,0,0,0.06)] rounded-bl-md'
                          : 'bg-[rgba(255,255,255,0.06)] text-[#e0e0e8] border border-[rgba(255,255,255,0.06)] rounded-bl-md'
                    }`}>
                      {msg.role === 'coach' && (
                        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#30C48B] block mb-1.5">Coach</span>
                      )}
                      {msg.text}
                    </div>
                  </div>
                ))}
                {coachTyping && (
                  <div className="flex justify-start">
                    <div className={`rounded-2xl rounded-bl-md px-4 py-3 ${
                      light ? 'bg-white/80 border border-[rgba(0,0,0,0.06)]' : 'bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)]'
                    }`}>
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#30C48B] block mb-1.5">Coach</span>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#30C48B]/40 animate-pulse" />
                        <span className="w-2 h-2 rounded-full bg-[#30C48B]/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <span className="w-2 h-2 rounded-full bg-[#30C48B]/40 animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Chat input */}
            <div className="flex gap-3">
              <input
                type="text"
                value={coachInput}
                onChange={e => setCoachInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendCoachMessage(); } }}
                placeholder="Tell the coach about this trade..."
                className={`flex-1 ${inputCls}`}
              />
              <button
                type="button"
                onClick={sendCoachMessage}
                disabled={!coachInput.trim() || coachTyping}
                className="px-5 py-3 rounded-xl font-medium text-sm bg-[#30C48B] hover:bg-[#28A876] text-black transition-all disabled:opacity-40"
              >
                Send
              </button>
            </div>
            <p className={`text-[12px] mt-3 ${light ? 'text-[#bbb]' : 'text-[#5a5d68]'}`}>
              The coach analyzes your trade rationale against Mark Douglas&apos; principles. Your conversation is saved with the trade.
            </p>
          </div>

          {/* Submit */}
          {isSignedIn ? (
            <button
              type="submit"
              disabled={saving || !form.ticker || !form.result}
              className="w-full py-4 rounded-2xl font-medium text-base transition-all duration-300 bg-[#30C48B] hover:bg-[#28A876] text-black disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 0 40px rgba(48,196,139,0.15)' }}
            >
              {saving ? 'Logging...' : 'Log Trade'}
            </button>
          ) : (
            <div className={`${glassPanelCls} rounded-2xl p-8 text-center`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
              <p className={`text-sm mb-4 ${light ? 'text-[#8a8d98]' : 'text-[#bbb]'}`}>Sign up to start logging trades and tracking your performance.</p>
              <Link
                href="/"
                className="inline-block px-8 py-3 rounded-full font-medium text-sm bg-[#30C48B] hover:bg-[#28A876] text-black transition-all"
                style={{ boxShadow: '0 0 30px rgba(48,196,139,0.15)' }}
              >
                Get Started
              </Link>
            </div>
          )}
        </form>

        {/* Quick stats preview */}
        {(form.entryPrice && form.exitPrice && form.positionSize) ? (
          <div className={`mt-6 ${glassPanelCls} rounded-2xl p-6`} style={light ? { backdropFilter: 'blur(40px)' } : {}}>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className={`text-[12px] font-bold tracking-[0.2em] uppercase mb-1 ${light ? 'text-[#8a8d98]' : 'text-[#8a8d98]'}`}>P&L</div>
                <div className={`text-xl font-light ${parseFloat(form.dollarPnl) >= 0 ? 'text-[#30C48B]' : 'text-[#f87171]'}`}>
                  {parseFloat(form.dollarPnl) >= 0 ? '+' : ''}${form.dollarPnl || '0'}
                </div>
              </div>
              <div>
                <div className={`text-[12px] font-bold tracking-[0.2em] uppercase mb-1 ${light ? 'text-[#8a8d98]' : 'text-[#8a8d98]'}`}>R Multiple</div>
                <div className={`text-xl font-light ${parseFloat(form.rr) >= 0 ? 'text-[#30C48B]' : 'text-[#f87171]'}`}>
                  {parseFloat(form.rr) >= 0 ? '+' : ''}{form.rr || '0'}R
                </div>
              </div>
              <div>
                <div className={`text-[12px] font-bold tracking-[0.2em] uppercase mb-1 ${light ? 'text-[#8a8d98]' : 'text-[#8a8d98]'}`}>Direction</div>
                <div className={`text-xl font-light ${form.direction === 'Long' ? 'text-[#30C48B]' : 'text-[#f87171]'}`}>
                  {form.direction}
                </div>
              </div>
              <div>
                <div className={`text-[12px] font-bold tracking-[0.2em] uppercase mb-1 ${light ? 'text-[#8a8d98]' : 'text-[#8a8d98]'}`}>Position</div>
                <div className={`text-xl font-light ${light ? 'text-[#1a1c2e]' : 'text-white'}`}>
                  {form.positionSize} sh
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className={`relative z-10 border-t py-10 text-center text-[14px] ${light ? 'border-[rgba(0,0,0,0.06)] text-[#bbb]' : 'border-[rgba(255,255,255,0.06)] text-[#8a8d98]'}`}>
        Journal X — The first AI-powered accountability journal for traders.
      </footer>
    </div>
  );
}
