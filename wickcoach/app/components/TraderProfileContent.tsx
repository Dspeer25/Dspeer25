'use client';
import React, { useState } from 'react';
import { fm, fd, Trade, buildTraderStats, computeAnalytics, buildGoalsContext, buildProfileContext } from './shared';
import AIChatWidget from './AIChatWidget';

const teal = '#00d4a0';
const red = '#ff4444';


export default function TraderProfileContent({ trades = [] }: { trades?: Trade[] }) {
  // ─── Deep psych chat state ─────────────────────────────────
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Live analytics — everything on this page reads from here.
  const a = computeAnalytics(trades);
  const { totals, psychScore, processSplit, patterns } = a;


  // Avg R for plan-following vs rule-breaking trades
  const procR = processSplit.process.n ? processSplit.process.rTotal / processSplit.process.n : 0;
  const impR  = processSplit.impulse.n ? processSplit.impulse.rTotal / processSplit.impulse.n : 0;

  // Welcome message built from real numbers, not canned stats.
  const deepPsychWelcome = totals.n === 0
    ? "You haven't logged any trades yet. Once you have some history on the board, I'll start showing you the trader you actually are."
    : `I've been watching your patterns. Here's what the data says about the trader you actually are, not the one you tell yourself you are.\n\n` +
      `Your **psychology score** is **${psychScore}**. ` +
      (processSplit.process.n && processSplit.impulse.n
        ? `Patient execution wins you R ${procR.toFixed(1)} on average. Impulse entries drag you to R ${impR.toFixed(1)}. That gap is who you are ${patterns.impulseEntries} trades out of every ${totals.n}.\n\n`
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
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...aiMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg },
          ],
          tradesContext,
          goalsContext: buildGoalsContext(),
          profileContext: buildProfileContext(),
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

      {/* ═══ PSYCHOLOGY SCORE ═══ */}
      <div style={{ background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        {/* Score circle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(circle at center, #141822 55%, transparent 56%), conic-gradient(${teal} 0% ${psychScore}%, #3e4252 ${psychScore}% 100%)`,
            boxShadow: 'inset 0 0 16px rgba(0,212,160,0.1), 0 0 20px rgba(0,0,0,0.4)',
          }}>
            <span style={{ fontFamily: fd, fontWeight: 700, fontSize: 28, color: '#fff' }}>{psychScore}</span>
          </div>
          <span style={{ color: '#888', fontSize: 10, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1, fontFamily: fm }}>Psychology Score</span>
        </div>
        {/* Explanation */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Behavioral Profile</div>
          <div style={{ fontFamily: fm, fontSize: 13, color: '#aab0bd', lineHeight: 1.7 }}>
            Based on {totals.n > 0 ? `${totals.n} trade journal${totals.n === 1 ? '' : 's'}` : 'no trades yet'}. WickCoach reads what you wrote about each trade and classifies it as disciplined or impulsive. Your score blends your win rate ({totals.winRate.toFixed(0)}%) with how often you follow your plan ({totals.n > 0 ? `${processSplit.process.n} of ${totals.n} trades` : '—'}).
          </div>
        </div>
      </div>

      {/* ═══ STRENGTHS + WEAKNESSES ═══ */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Strengths */}
        <div style={{ flex: 1, minWidth: 280, background: '#141822', border: '1px solid #2A3143', borderLeft: `3px solid ${teal}`, borderRadius: 12, padding: '24px 28px' }}>
          <div style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: teal, marginBottom: 4, letterSpacing: 0.5 }}>Your strengths</div>
          <div style={{ fontFamily: fm, fontSize: 11, color: '#888', marginBottom: 16 }}>Patterns from your journal entries that show discipline</div>
          {[
            { name: 'Patience', count: patterns.patience, desc: 'Waited for the setup' },
            { name: 'Clean Execution', count: patterns.cleanExecution, desc: 'Followed the plan' },
            { name: 'Stop Discipline', count: patterns.stopDiscipline, desc: 'Honored your stop' },
            { name: 'Trusting Process', count: patterns.trustingProcess, desc: 'Stuck to your rules' },
          ].filter(p => p.count > 0).map(p => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(42,49,67,0.4)' }}>
              <div>
                <div style={{ fontFamily: fm, fontSize: 14, color: '#e8e8f0', fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontFamily: fm, fontSize: 11, color: '#888', marginTop: 2 }}>{p.desc}</div>
              </div>
              <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: teal, flexShrink: 0, marginLeft: 16 }}>{p.count}</div>
            </div>
          ))}
          {[patterns.patience, patterns.cleanExecution, patterns.stopDiscipline, patterns.trustingProcess].every(c => c === 0) && (
            <div style={{ fontFamily: fm, fontSize: 13, color: '#666', padding: '20px 0', textAlign: 'center' }}>
              No strength patterns detected yet. Write more about why you took each trade.
            </div>
          )}
        </div>

        {/* Weaknesses */}
        <div style={{ flex: 1, minWidth: 280, background: '#141822', border: '1px solid #2A3143', borderLeft: `3px solid ${red}`, borderRadius: 12, padding: '24px 28px' }}>
          <div style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: red, marginBottom: 4, letterSpacing: 0.5 }}>Areas to improve</div>
          <div style={{ fontFamily: fm, fontSize: 11, color: '#888', marginBottom: 16 }}>Patterns from your journal entries that show rule-breaking</div>
          {[
            { name: 'Ignoring Rules', count: patterns.ignoringRules, desc: 'Traded against your own plan' },
            { name: 'Impulse Entries', count: patterns.impulseEntries, desc: 'Entered without a setup' },
            { name: 'Revenge Trading', count: patterns.revengeTrading, desc: 'Traded to recover a loss' },
            { name: 'FOMO / Chasing', count: patterns.fomoChasing, desc: 'Chased price instead of waiting' },
          ].filter(p => p.count > 0).map(p => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(42,49,67,0.4)' }}>
              <div>
                <div style={{ fontFamily: fm, fontSize: 14, color: '#e8e8f0', fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontFamily: fm, fontSize: 11, color: '#888', marginTop: 2 }}>{p.desc}</div>
              </div>
              <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: red, flexShrink: 0, marginLeft: 16 }}>{p.count}</div>
            </div>
          ))}
          {[patterns.ignoringRules, patterns.impulseEntries, patterns.revengeTrading, patterns.fomoChasing].every(c => c === 0) && (
            <div style={{ fontFamily: fm, fontSize: 13, color: '#666', padding: '20px 0', textAlign: 'center' }}>
              No weakness patterns detected yet. Write more about why you took each trade.
            </div>
          )}
        </div>
      </div>

      {/* ═══ KEY INSIGHT — expectancy gap ═══ */}
      {processSplit.process.n > 0 && processSplit.impulse.n > 0 && (
        <div style={{ background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '24px 28px' }}>
          <div style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10 }}>The gap that matters</div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: fm, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>When you follow the plan</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontFamily: fd, fontSize: 24, fontWeight: 700, color: teal }}>R {procR.toFixed(1)}</span>
                <span style={{ fontFamily: fm, fontSize: 13, color: teal }}>avg · {processSplit.process.wr.toFixed(0)}% WR · {processSplit.process.n} trades</span>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: fm, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>When you break the rules</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontFamily: fd, fontSize: 24, fontWeight: 700, color: red }}>R {impR.toFixed(1)}</span>
                <span style={{ fontFamily: fm, fontSize: 13, color: red }}>avg · {processSplit.impulse.wr.toFixed(0)}% WR · {processSplit.impulse.n} trades</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
