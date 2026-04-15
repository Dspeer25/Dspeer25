'use client';
import React from 'react';
import { fm, fd } from './shared';

const teal = '#00d4a0';
const red = '#ff4444';

interface PatternRow {
  friction: { name: string; trades: string; pct: number };
  middle: React.ReactNode;
  momentum: { name: string; trades: string; pct: number };
}

const patternRows: PatternRow[] = [
  {
    friction: { name: 'Ignoring Rules', trades: '19 trades', pct: 56 },
    middle: <><strong style={{ color: '#fff' }}>+0.5R</strong> vs <strong style={{ color: teal }}>+1.1R</strong> expectancy gap</>,
    momentum: { name: 'Patience', trades: '39 trades · 56% win rate when you wait', pct: 68 },
  },
  {
    friction: { name: 'Impulse Entries', trades: '16 trades', pct: 34 },
    middle: <><strong style={{ color: red }}>19%</strong> win rate vs <strong style={{ color: '#fff' }}>61%</strong> patient</>,
    momentum: { name: 'Clean Execution', trades: '31 trades · Avg +1.6R per textbook trade', pct: 66 },
  },
  {
    friction: { name: 'Revenge Trading', trades: '15 trades', pct: 50 },
    middle: <>Cost you <strong style={{ color: red }}>+$35.90</strong> this window</>,
    momentum: { name: 'Stop Discipline', trades: '15 trades · Clean losses avg $492', pct: 50 },
  },
  {
    friction: { name: 'FOMO / Chasing', trades: '12 trades', pct: 46 },
    middle: <>Win rate drops to <strong style={{ color: red }}>0%</strong> when chasing</>,
    momentum: { name: 'Trusting Process', trades: '14 trades · 14 entries, resilience building', pct: 54 },
  },
];

const timeframes = ['5', '10', '15', '30', '50', '100', 'All'];

const rowGrad = 'linear-gradient(90deg, rgba(255,68,68,0.03) 0%, rgba(26,28,35,1) 40%, rgba(26,28,35,1) 60%, rgba(0,212,160,0.03) 100%)';

export default function TraderProfileContent() {
  return (
    <div style={{ background: 'transparent', padding: '32px 40px', minHeight: '100vh', fontFamily: fm, display: 'flex', flexDirection: 'column', gap: 32, overflowX: 'hidden' }}>

      {/* ═══ HEADER ═══ */}
      <div>
        <h2 style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>Trader Profile</h2>
        <p style={{ color: '#bbb', fontSize: 14, margin: '6px 0 0' }}>Your psychological profile — WickCoach observations across your trading history.</p>
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
              background: `radial-gradient(circle at center, #141822 58%, transparent 59%), conic-gradient(${teal} 0% 61%, #3e4252 61% 100%)`,
              boxShadow: 'inset 0 0 20px rgba(0,212,160,0.1), 0 0 30px rgba(0,0,0,0.5)',
            }}>
              <span style={{ fontFamily: fd, fontWeight: 700, fontSize: 32, color: '#fff' }}>61</span>
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

        {/* Goals relation inside the board */}
        <div style={{ padding: '20px 40px 0', marginTop: 8 }}>
          <h4 style={{ fontFamily: fd, fontSize: 16, color: '#fff', margin: '0 0 12px' }}>How these patterns relate to your goals</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${teal}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: teal, flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <span style={{ color: '#ccc', fontSize: 13, letterSpacing: 0.5 }}>LET TRADES BREATHE 3+ WHEN AT BREAK-EVEN</span>
            <span style={{ marginLeft: 'auto', background: 'rgba(0,212,160,0.1)', color: teal, padding: '4px 10px', borderRadius: 4, fontSize: 11 }}>On track</span>
          </div>
        </div>
      </div>
    </div>
  );
}
