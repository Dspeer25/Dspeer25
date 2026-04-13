'use client';
import React, { useState } from "react";
import { fm, fd, teal } from "./shared";
import Logo from "./Logo";

export default function CarouselPastTrades({ onAdvance }: { onAdvance?: () => void }) {
  React.useEffect(() => {
    if (!onAdvance) return;
    const t = setTimeout(onAdvance, 5000);
    return () => clearTimeout(t);
  }, [onAdvance]);
  const trades = [
    { ticker: 'DIS', letter: 'D', color: '#1a5276', date: '3/29/26', time: '12:02 PM', strat: 'Call Scalp', dir: 'SHORT' as const, qty: 6, entry: '$5.97', exit: '$6.73', pl: '-$457', rr: '1:0.7', note: 'Saw the 2min color chang...', win: false },
    { ticker: 'NFLX', letter: 'N', color: '#b20710', date: '3/29/26', time: '10:21 AM', strat: '0DTE Put', dir: 'SHORT' as const, qty: 11, entry: '$8.05', exit: '$8.46', pl: '-$456', rr: '1:0.6', note: 'Ignored my own rule abou...', win: false },
    { ticker: 'AMD', letter: 'A', color: '#007a33', date: '3/26/26', time: '10:06 AM', strat: '0DTE Call', dir: 'LONG' as const, qty: 5, entry: '$7.29', exit: '$9.83', pl: '+$1,269', rr: '1:2.3', note: 'MA squeeze expanded beau...', win: true },
    { ticker: 'DIS', letter: 'D', color: '#1a5276', date: '3/26/26', time: '3:12 PM', strat: 'Call Debit Spread', dir: 'LONG' as const, qty: 9, entry: '$8.52', exit: '$9.85', pl: '+$1,201', rr: '1:2.2', note: 'MA squeeze expanded beau...', win: true },
    { ticker: 'GOOGL', letter: 'G', color: '#34a853', date: '3/26/26', time: '1:38 PM', strat: 'Put Debit Spread', dir: 'LONG' as const, qty: 2, entry: '$3.27', exit: '$7.73', pl: '+$892', rr: '1:1.8', note: 'The 2min 20 EMA was hold...', win: true },
  ];
  return (<div>
    {/* Stat cards + HIGH LEVEL ANALYSIS */}
    <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', marginBottom: 16 }}>
    <div style={{ display: 'flex', flex: 1, border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ padding: '14px 18px', borderRight: '1px solid rgba(255,255,255,0.08)', flex: 1 }}>
        <div style={{ fontFamily: fm, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4 }}>TOTAL P/L</div>
        <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#00d4a0' }}>+$58,532</div>
      </div>
      <div style={{ padding: '14px 18px', borderRight: '1px solid rgba(255,255,255,0.08)', flex: 1 }}>
        <div style={{ fontFamily: fm, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4 }}>WIN RATE</div>
        <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#fff' }}>46%</div>
        <div style={{ display: 'flex', height: 3, marginTop: 4, marginBottom: 3 }}><div style={{ width: '46%', background: '#00d4a0' }} /><div style={{ width: '54%', background: '#ff4444' }} /></div>
        <div style={{ fontFamily: fm, fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>92W 80L 28E</div>
      </div>
      <div style={{ padding: '14px 18px', borderRight: '1px solid rgba(255,255,255,0.08)', flex: 1 }}>
        <div style={{ fontFamily: fm, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4 }}>TOTAL TRADES</div>
        <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#fff' }}>200</div>
      </div>
      <div style={{ padding: '14px 18px', borderRight: '1px solid rgba(255,255,255,0.08)', flex: 1 }}>
        <div style={{ fontFamily: fm, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4 }}>AVG R:R</div>
        <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#fff' }}>1 : 2.2</div>
      </div>
      <div style={{ padding: '14px 18px', flex: 1 }}>
        <div style={{ fontFamily: fm, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4 }}>EXPECTED VALUE</div>
        <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#00d4a0' }}>+$222</div>
        <div style={{ fontFamily: fm, fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>Per trade</div>
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, width: 60, flexShrink: 0, cursor: 'pointer' }}>
      <div style={{ fontFamily: fm, fontSize: 7, color: '#00d4a0', textTransform: 'uppercase' as const, letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.3, fontWeight: 600 }}>HIGH-LEVEL<br/>ANALYSIS</div>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="12" height="14" viewBox="0 0 20 24" fill="none"><circle cx="8" cy="4" r="2.8" stroke="#00d4a0" strokeWidth="1.2" fill="none" /><line x1="8" y1="6.8" x2="8" y2="15" stroke="#00d4a0" strokeWidth="1.2" /><line x1="8" y1="9.5" x2="3" y2="13" stroke="#00d4a0" strokeWidth="1.2" /><line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#00d4a0" strokeWidth="1.2" /><line x1="8" y1="15" x2="4.5" y2="21" stroke="#00d4a0" strokeWidth="1.2" /><line x1="8" y1="15" x2="11.5" y2="21" stroke="#00d4a0" strokeWidth="1.2" /><rect x="13.5" y="4" width="4" height="5" rx="0.5" fill="#00d4a0" opacity="0.9" /><line x1="15.5" y1="2" x2="15.5" y2="12" stroke="#00d4a0" strokeWidth="0.8" /></svg>
      </div>
    </div>
    </div>
    {/* Equity Curve */}
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Logo size={12} /><span style={{ fontFamily: fd, fontSize: 14, color: '#fff', fontWeight: 700 }}>Equity Curve</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: fm, fontSize: 9, padding: '3px 8px', background: 'rgba(0,255,136,0.15)', color: '#00d4a0', border: '1px solid rgba(0,255,136,0.3)', cursor: 'pointer' }}>🤖 AI Coach</span>
          <span style={{ fontFamily: fm, fontSize: 9, padding: '3px 8px', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>↗ Export CSV</span>
          <div style={{ display: 'flex', gap: 4 }}>{['1D','1W','1M','3M','YTD'].map(p => <span key={p} style={{ fontFamily: fm, fontSize: 9, padding: '3px 8px', color: p === 'YTD' ? '#000' : 'rgba(255,255,255,0.4)', background: p === 'YTD' ? '#00d4a0' : 'transparent', cursor: 'pointer', letterSpacing: '0.05em' }}>{p}</span>)}</div>
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 0', height: 100, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox="0 0 500 100" preserveAspectRatio="none">
          <polygon points="20,88 60,82 100,75 140,78 180,60 220,55 260,48 300,52 340,38 380,30 420,25 460,18 480,12 480,100 20,100" fill="rgba(0,255,136,0.05)" />
          <polyline points="20,88 60,82 100,75 140,78 180,60 220,55 260,48 300,52 340,38 380,30 420,25 460,18 480,12" fill="none" stroke="#00d4a0" strokeWidth="1.5" />
        </svg>
        <div style={{ position: 'absolute', left: 4, top: 4, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 'calc(100% - 8px)' }}>{['+$58.5k','+$43.9k','+$29.2k','+$14.6k','$-64'].map(l => <span key={l} style={{ fontFamily: fm, fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{l}</span>)}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 20px 0' }}>{['Jan 1','Jan 21','Feb 9','Mar 8','Mar 29'].map(l => <span key={l} style={{ fontFamily: fm, fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{l}</span>)}</div>
    </div>
    {/* Filter row */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' as const }}>
      <div style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px 12px' }}>🔍 Search Ticker...</div>
      <div style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px 12px' }}>▼ Strategy: All</div>
      <span style={{ fontFamily: fm, fontSize: 10, padding: '5px 12px', background: '#00d4a0', color: '#000', fontWeight: 600 }}>● All Trades</span>
      <span style={{ fontFamily: fm, fontSize: 10, padding: '5px 12px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>● Wins</span>
      <span style={{ fontFamily: fm, fontSize: 10, padding: '5px 12px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>● Losses</span>
      <span style={{ fontFamily: fm, fontSize: 10, padding: '5px 12px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>● Break Even</span>
      <span style={{ fontFamily: fm, fontSize: 10, padding: '5px 12px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>All Time</span>
    </div>
    {/* Table header */}
    <div style={{ display: 'grid', gridTemplateColumns: '30px 44px 62px 58px 1fr 52px 28px 86px 66px 42px 1fr', gap: 4, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontFamily: fm, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const }}>
      <span></span><span>TICKER</span><span>DATE</span><span>TIME</span><span>STRATEGY</span><span>DIR</span><span>QTY</span><span>ENTRY/EXIT</span><span>NET P/L</span><span>R:R</span><span>NOTES</span>
    </div>
    {/* Trade rows */}
    {trades.map((r, i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: '30px 44px 62px 58px 1fr 52px 28px 86px 66px 42px 1fr', gap: 4, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: fm, fontSize: 10, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: fm, flexShrink: 0 }}>{r.letter}</div>
        </div>
        <span style={{ color: '#fff', fontWeight: 700 }}>{r.ticker}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{r.date}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{r.time}</span>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>{r.strat}</span>
        <span style={{ background: r.dir === 'LONG' ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,68,0.15)', color: r.dir === 'LONG' ? '#00d4a0' : '#ff4444', fontFamily: fm, fontSize: 9, padding: '2px 8px', textAlign: 'center' }}>{r.dir}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{r.qty}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{r.entry}→{r.exit}</span>
        <span style={{ color: r.win ? '#00d4a0' : '#ff4444', fontWeight: 700 }}>{r.pl}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{r.rr}</span>
        <span style={{ color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.note}</span>
      </div>
    ))}
  </div>);
}

