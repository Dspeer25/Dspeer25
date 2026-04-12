'use client';
import React from 'react';
import { fm, fd } from './shared';

interface PatternRow {
  friction: { name: string; trades: string; pct: number };
  middle: React.ReactNode;
  momentum: { name: string; trades: string; pct: number };
}

const rows: PatternRow[] = [
  {
    friction: { name: 'Ignoring Rules', trades: '19 trades', pct: 56 },
    middle: <><strong style={{ color: '#fff' }}>+0.5R</strong> vs <strong style={{ color: '#39ff85' }}>+1.1R</strong> expectancy gap</>,
    momentum: { name: 'Patience', trades: '39 trades | 56% win rate when you wait', pct: 68 },
  },
  {
    friction: { name: 'Impulse Entries', trades: '16 trades', pct: 34 },
    middle: <><strong style={{ color: '#ff4444' }}>19%</strong> win rate vs <strong style={{ color: '#fff' }}>61%</strong> patient</>,
    momentum: { name: 'Clean Execution', trades: '31 trades | Avg +1.6R per textbook trade', pct: 66 },
  },
  {
    friction: { name: 'Revenge Trading', trades: '15 trades', pct: 50 },
    middle: <>Cost you <strong style={{ color: '#ff4444' }}>+$35.90</strong> this window</>,
    momentum: { name: 'Stop Discipline', trades: '15 trades | Clean losses avg $492', pct: 50 },
  },
  {
    friction: { name: 'FOMO / Chasing', trades: '12 trades', pct: 46 },
    middle: <>Win rate drops to <strong style={{ color: '#ff4444' }}>0%</strong> when chasing</>,
    momentum: { name: 'Trusting Process', trades: '14 trades | 14 entries, resilience building', pct: 54 },
  },
];

const timeframes = ['5', '10', '15', '30', '50', '100', 'All'];

export default function AnalysisContent() {
  const rowBg = 'linear-gradient(90deg, rgba(255,68,68,0.03) 0%, rgba(26,28,35,1) 40%, rgba(26,28,35,1) 60%, rgba(57,255,133,0.03) 100%)';

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', padding: '32px 40px', backgroundColor: '#131318', minHeight: '100vh', fontFamily: fm, display: 'flex', flexDirection: 'column', gap: 40, overflowX: 'hidden' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>
            WickCoach observations
          </h1>
          <p style={{ color: '#888888', fontSize: 14, margin: '0 0 4px 0' }}>
            AI-detected behavioral themes vs your stated goals
          </p>
          <p style={{ color: '#666666', fontSize: 12, margin: 0 }}>
            200 executions analyzed
          </p>
        </div>

        {/* TIMEFRAME FILTERS */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: '1px solid #2a2d38', borderRadius: 6, padding: 4, gap: 2 }}>
          {timeframes.map(t => {
            const active = t === 'All';
            return (
              <span
                key={t}
                style={{
                  color: active ? '#fff' : '#666',
                  background: active ? '#3e4252' : 'transparent',
                  fontSize: 13,
                  padding: '4px 12px',
                  cursor: 'pointer',
                  borderRadius: 4,
                  fontWeight: active ? 500 : 400,
                }}
              >{t}</span>
            );
          })}
        </div>
      </div>

      {/* BEHAVIORAL PATTERN BOARD */}
      <div style={{ background: '#1a1c23', border: '1px solid #2a2d38', borderRadius: 12, padding: '40px 0', position: 'relative' }}>

        {/* Center axis line */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />

        {/* SCORE + AXIS LABELS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 60px', marginBottom: 40, position: 'relative', zIndex: 2 }}>
          <div style={{ flex: 1, textAlign: 'right', paddingRight: 80 }}>
            <span style={{ color: '#ff4444', fontFamily: fd, fontWeight: 700, fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>Friction</span>
            <div style={{ height: 2, width: 60, background: '#ff4444', marginLeft: 'auto', marginTop: 8, opacity: 0.5 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              background: 'radial-gradient(circle at center, #131318 58%, transparent 59%), conic-gradient(#39ff85 0% 61%, #3e4252 61% 100%)',
              boxShadow: 'inset 0 0 20px rgba(57, 255, 133, 0.1), 0 0 30px rgba(0,0,0,0.5)',
            }}>
              <span style={{ fontFamily: fd, fontWeight: 700, fontSize: 32, color: '#ffffff' }}>61</span>
            </div>
            <span style={{ color: '#888', fontSize: 11, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1, background: '#131318', padding: '2px 8px', borderRadius: 4 }}>Psychology Score</span>
          </div>

          <div style={{ flex: 1, textAlign: 'left', paddingLeft: 80 }}>
            <span style={{ color: '#39ff85', fontFamily: fd, fontWeight: 700, fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>Momentum</span>
            <div style={{ height: 2, width: 60, background: '#39ff85', marginTop: 8, opacity: 0.5 }} />
          </div>
        </div>

        {/* ROWS */}
        {rows.map((row, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            minHeight: 80,
            padding: '16px 40px',
            position: 'relative',
            zIndex: 2,
            background: rowBg,
            borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
          }}>
            {/* Friction side */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: 48 }}>
              <span style={{ color: '#ff4444', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{row.friction.name}</span>
              <span style={{ color: '#666', fontSize: 11 }}>{row.friction.trades}</span>
              <div style={{ width: 180, height: 6, background: '#2a2d38', borderRadius: 3, marginTop: 8, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: `${row.friction.pct}%`, background: '#ff4444', height: '100%' }} />
              </div>
            </div>

            {/* Middle callout */}
            <div style={{ width: 280, background: '#23252e', border: '1px solid #333642', borderRadius: 6, padding: '10px 16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <p style={{ color: '#aaa', fontSize: 11, margin: 0 }}>{row.middle}</p>
            </div>

            {/* Momentum side (with white wick) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: 48 }}>
              <span style={{ color: '#39ff85', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{row.momentum.name}</span>
              <span style={{ color: '#666', fontSize: 11 }}>{row.momentum.trades}</span>
              <div style={{ width: 180, height: 6, background: '#2a2d38', borderRadius: 3, marginTop: 8, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${row.momentum.pct}%`, background: '#39ff85', height: '100%' }} />
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', height: '100%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* GOALS RELATION SECTION */}
      <div style={{ background: '#1a1c23', border: '1px solid #2a2d38', borderRadius: 12, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontFamily: fd, fontSize: 18, color: '#fff', margin: 0 }}>
          How these patterns relate to your goals
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #39ff85', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#39ff85' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <span style={{ color: '#ccc', fontSize: 13, letterSpacing: 0.5 }}>LET TRADES BREATHE 3+ WHEN AT BREAK-EVEN</span>
          <span style={{ marginLeft: 'auto', background: 'rgba(57, 255, 133, 0.1)', color: '#39ff85', padding: '4px 10px', borderRadius: 4, fontSize: 11 }}>On track</span>
        </div>
      </div>
    </div>
  );
}
