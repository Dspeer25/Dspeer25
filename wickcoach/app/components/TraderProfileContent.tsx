'use client';
import React, { useEffect, useState } from 'react';
import { fm, fd, Trade, Goal, buildTraderStats, computeAnalytics } from './shared';
import AIChatWidget from './AIChatWidget';

const teal = '#00d4a0';
const red = '#ff4444';

const timeframes = ['5', '10', '15', '30', '50', '100', 'All'];

const rowGrad = 'linear-gradient(90deg, rgba(255,68,68,0.03) 0%, rgba(26,28,35,1) 40%, rgba(26,28,35,1) 60%, rgba(0,212,160,0.03) 100%)';

export default function TraderProfileContent({ trades = [] }: { trades?: Trade[] }) {
  // ─── Deep psych chat state ─────────────────────────────────
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Live analytics — everything on this page reads from here.
  const a = computeAnalytics(trades);
  const { totals, psychScore, processSplit, patterns } = a;

  // Load the trader's top goal from localStorage for the observations
  // board footer so "LET TRADES BREATHE 3+..." is real text.
  const [topGoal, setTopGoal] = useState<Goal | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wickcoach_goals');
      if (saved) {
        const parsed: Goal[] = JSON.parse(saved);
        const firstWithTitle = parsed.find(g => g.title);
        setTopGoal(firstWithTitle || null);
      }
    } catch { /* ignore */ }
  }, []);

  // Derived numbers for the observations-board middle callouts.
  const procR = processSplit.process.n ? processSplit.process.rTotal / processSplit.process.n : 0;
  const impR  = processSplit.impulse.n ? processSplit.impulse.rTotal / processSplit.impulse.n : 0;
  const fmtR = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}R`;
  const pct = (x: number) => totals.n ? Math.round((x / totals.n) * 100) : 0;

  // Revenge dollar cost — aggregate P/L of trades tagged as revenge in journal.
  const revengeCost = trades.reduce((s, t) => {
    const j = (t.journal || '').toLowerCase();
    if (/revenge|tilt|frustrat|angry|got back|pissed/.test(j)) return s + t.pl;
    return s;
  }, 0);
  // Chasing win rate
  const chasingTrades = trades.filter(t => /fomo|chas|missed|scared to miss/.test((t.journal || '').toLowerCase()));
  const chasingWR = chasingTrades.length
    ? (chasingTrades.filter(t => t.pl > 0).length / chasingTrades.length) * 100
    : 0;

  // Pattern rows built from real pattern counts + real derived metrics.
  const patternRows: Array<{
    friction: { name: string; trades: string; pct: number };
    middle: React.ReactNode;
    momentum: { name: string; trades: string; pct: number };
  }> = [
    {
      friction: { name: 'Ignoring Rules', trades: `${patterns.ignoringRules} trades`, pct: pct(patterns.ignoringRules) },
      middle: <><strong style={{ color: '#fff' }}>{fmtR(impR)}</strong> vs <strong style={{ color: teal }}>{fmtR(procR)}</strong> expectancy gap</>,
      momentum: { name: 'Patience', trades: `${patterns.patience} trades`, pct: pct(patterns.patience) },
    },
    {
      friction: { name: 'Impulse Entries', trades: `${patterns.impulseEntries} trades`, pct: pct(patterns.impulseEntries) },
      middle: <><strong style={{ color: red }}>{processSplit.impulse.wr.toFixed(0)}%</strong> win rate vs <strong style={{ color: '#fff' }}>{processSplit.process.wr.toFixed(0)}%</strong> patient</>,
      momentum: { name: 'Clean Execution', trades: `${patterns.cleanExecution} trades`, pct: pct(patterns.cleanExecution) },
    },
    {
      friction: { name: 'Revenge Trading', trades: `${patterns.revengeTrading} trades`, pct: pct(patterns.revengeTrading) },
      middle: <>Cost you <strong style={{ color: red }}>{revengeCost >= 0 ? '+' : '-'}${Math.abs(revengeCost).toFixed(0)}</strong> this window</>,
      momentum: { name: 'Stop Discipline', trades: `${patterns.stopDiscipline} trades`, pct: pct(patterns.stopDiscipline) },
    },
    {
      friction: { name: 'FOMO / Chasing', trades: `${patterns.fomoChasing} trades`, pct: pct(patterns.fomoChasing) },
      middle: <>Win rate drops to <strong style={{ color: red }}>{chasingWR.toFixed(0)}%</strong> when chasing</>,
      momentum: { name: 'Trusting Process', trades: `${patterns.trustingProcess} trades`, pct: pct(patterns.trustingProcess) },
    },
  ];

  // Welcome message built from real numbers, not canned stats.
  const deepPsychWelcome = totals.n === 0
    ? "You haven't logged any trades yet. Once you have some history on the board, I'll start showing you the trader you actually are."
    : `I've been watching your patterns. Here's what the data says about the trader you actually are, not the one you tell yourself you are.\n\n` +
      `Your **psychology score** is **${psychScore}**. ` +
      (processSplit.process.n && processSplit.impulse.n
        ? `Patient execution wins you ${fmtR(procR)} on average. Impulse entries drag you to ${fmtR(impR)}. That gap is who you are ${patterns.impulseEntries} trades out of every ${totals.n}.\n\n`
        : `Not enough journal detail yet to separate process trades from impulse ones — write more about *why* you took each trade and I'll have sharper observations.\n\n`) +
      `Where do you want to start? I can press on a specific pattern (revenge trading, FOMO, the losing-hour fade), or you can tell me what you think your problem actually is and I'll tell you whether the data agrees.`;

  async function sendToCoach() {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiLoading(true);
    try {
      // Computed from the real trades state so the coach can challenge
      // beliefs against actual data, not a frozen mock.
      const tradesContext = buildTraderStats(trades);

      let goalsContext = '';
      try {
        const savedGoals = localStorage.getItem('wickcoach_goals');
        if (savedGoals) {
          const parsed: { title: string; goalType: string; completeness?: number; context?: string[] }[] = JSON.parse(savedGoals);
          goalsContext = parsed
            .filter(g => g.title)
            .map(g => {
              const pct = typeof g.completeness === 'number' ? `, ${g.completeness}% understood` : '';
              const turns = g.context?.length ? `, ${g.context.length} clarification turns` : '';
              return `"${g.title}" [${g.goalType}${pct}${turns}]`;
            })
            .join('; ');
        }
      } catch { /* ignore storage errors */ }

      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...aiMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg },
          ],
          tradesContext,
          goalsContext,
          mode: 'deepPsych',
        }),
      });
      const data = await response.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Unable to respond right now.' }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Try again.' }]);
    }
    setAiLoading(false);
  }

  return (
    <div style={{ background: 'transparent', padding: '32px 40px', minHeight: '100vh', fontFamily: fm, display: 'flex', flexDirection: 'column', gap: 32, overflowX: 'hidden' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>Trader Profile</h2>
          <p style={{ color: '#bbb', fontSize: 14, margin: '6px 0 0' }}>Your psychological profile — WickCoach observations across your trading history.</p>
        </div>

        {/* WickCoach AI — tough love mentor */}
        <div
          onClick={() => setAiOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 20px',
            background: 'rgba(0,212,160,0.08)',
            border: '1px solid rgba(0,212,160,0.4)',
            borderRadius: 12,
            cursor: 'pointer',
            transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.3s ease',
            boxShadow: '0 0 24px rgba(0,212,160,0.12)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,160,0.15)'; e.currentTarget.style.borderColor = '#00d4a0'; e.currentTarget.style.boxShadow = '0 0 32px rgba(0,212,160,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,212,160,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,212,160,0.4)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(0,212,160,0.12)'; }}
        >
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,212,160,0.12)', border: '1px solid rgba(0,212,160,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="28" height="34" viewBox="0 0 20 24" fill="none">
              <circle cx="8" cy="4" r="2.8" stroke="#7a7d88" strokeWidth="1.2" fill="none" />
              <line x1="8" y1="6.8" x2="8" y2="15" stroke="#7a7d88" strokeWidth="1.2" />
              <line x1="8" y1="9.5" x2="3" y2="13" stroke="#7a7d88" strokeWidth="1.2" />
              <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#7a7d88" strokeWidth="1.2" />
              <line x1="8" y1="15" x2="4.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
              <line x1="8" y1="15" x2="11.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
              <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={teal} opacity="0.9" />
              <line x1="15.5" y1="2" x2="15.5" y2="12" stroke={teal} strokeWidth="0.8" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>WickCoach AI</span>
            <span style={{ fontFamily: fm, fontSize: 12, color: teal, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>Deep psychology</span>
          </div>
        </div>
      </div>

      {/* ═══ WICKCOACH OBSERVATIONS BOARD ═══ */}
      <div style={{ background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '32px 0 24px', position: 'relative' }}>

        {/* Board-level header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 40px 24px' }}>
          <div>
            <h3 style={{ fontFamily: fd, fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>WickCoach observations</h3>
            <p style={{ color: '#888', fontSize: 12, margin: '6px 0 0' }}>AI-detected behavioral themes vs your stated goals</p>
          </div>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: '1px solid #2A3143', borderRadius: 6, padding: 4, gap: 2 }}>
            {timeframes.map(t => {
              const active = t === 'All';
              return (
                <span key={t} style={{
                  color: active ? '#fff' : '#888',
                  background: active ? '#3e4252' : 'transparent',
                  fontSize: 12, padding: '4px 12px', cursor: 'pointer', borderRadius: 4,
                  fontWeight: active ? 500 : 400,
                }}>{t}</span>
              );
            })}
          </div>
        </div>

        {/* Center axis line */}
        <div style={{ position: 'absolute', top: 80, bottom: 0, left: '50%', width: 1, background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />

        {/* Friction / Score / Momentum row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 60px', marginBottom: 32, position: 'relative', zIndex: 2 }}>
          <div style={{ flex: 1, textAlign: 'right', paddingRight: 80 }}>
            <span style={{ color: red, fontFamily: fd, fontWeight: 700, fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>Friction</span>
            <div style={{ height: 2, width: 60, background: red, marginLeft: 'auto', marginTop: 8, opacity: 0.5 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
              background: `radial-gradient(circle at center, #141822 58%, transparent 59%), conic-gradient(${teal} 0% ${psychScore}%, #3e4252 ${psychScore}% 100%)`,
              boxShadow: 'inset 0 0 20px rgba(0,212,160,0.1), 0 0 30px rgba(0,0,0,0.5)',
            }}>
              <span style={{ fontFamily: fd, fontWeight: 700, fontSize: 32, color: '#fff' }}>{psychScore}</span>
            </div>
            <span style={{ color: '#888', fontSize: 11, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1, background: '#141822', padding: '2px 8px', borderRadius: 4 }}>Psychology Score</span>
          </div>

          <div style={{ flex: 1, textAlign: 'left', paddingLeft: 80 }}>
            <span style={{ color: teal, fontFamily: fd, fontWeight: 700, fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>Momentum</span>
            <div style={{ height: 2, width: 60, background: teal, marginTop: 8, opacity: 0.5 }} />
          </div>
        </div>

        {/* Pattern rows */}
        {patternRows.map((row, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', minHeight: 80,
            padding: '16px 40px', position: 'relative', zIndex: 2,
            background: rowGrad,
            borderBottom: i < patternRows.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
          }}>
            {/* Friction side */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: 48 }}>
              <span style={{ color: red, fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{row.friction.name}</span>
              <span style={{ color: '#888', fontSize: 12 }}>{row.friction.trades}</span>
              <div style={{ width: 180, height: 6, background: '#2A3143', borderRadius: 3, marginTop: 8, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: `${row.friction.pct}%`, background: red, height: '100%' }} />
              </div>
            </div>

            {/* Middle callout */}
            <div style={{ width: 280, background: '#23252e', border: '1px solid #333642', borderRadius: 6, padding: '10px 16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <p style={{ color: '#bbb', fontSize: 12, margin: 0 }}>{row.middle}</p>
            </div>

            {/* Momentum side with white wick */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: 48 }}>
              <span style={{ color: teal, fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{row.momentum.name}</span>
              <span style={{ color: '#888', fontSize: 12 }}>{row.momentum.trades}</span>
              <div style={{ width: 180, height: 6, background: '#2A3143', borderRadius: 3, marginTop: 8, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${row.momentum.pct}%`, background: teal, height: '100%' }} />
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', height: '100%' }} />
              </div>
            </div>
          </div>
        ))}

        {/* Goals relation inside the board — reads the trader's top goal from localStorage */}
        {topGoal && (
          <div style={{ padding: '20px 40px 0', marginTop: 8 }}>
            <h4 style={{ fontFamily: fd, fontSize: 16, color: '#fff', margin: '0 0 12px' }}>How these patterns relate to your goals</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${teal}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: teal, flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <span style={{ color: '#ccc', fontSize: 13, letterSpacing: 0.5 }}>{topGoal.title.toUpperCase()}</span>
              <span style={{ marginLeft: 'auto', background: 'rgba(0,212,160,0.1)', color: teal, padding: '4px 10px', borderRadius: 4, fontSize: 11 }}>
                {typeof topGoal.completeness === 'number' ? `${topGoal.completeness}% understood` : 'In progress'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ═══ DEEP PSYCH CHAT WIDGET ═══ */}
      <AIChatWidget
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        messages={aiMessages}
        input={aiInput}
        setInput={setAiInput}
        onSend={sendToCoach}
        loading={aiLoading}
        welcomeMsg={deepPsychWelcome}
      />
    </div>
  );
}
