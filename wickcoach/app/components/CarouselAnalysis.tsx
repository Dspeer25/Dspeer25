'use client'
import React from "react"
import { fm, fd, teal } from "./shared"

export default function CarouselAnalysis() {
  const strategies = [
    { name: '0DTE Call', trades: 60, wr: '46.7%', avg: '+$325.84', total: '+$19,550', r: '+0.7R' },
    { name: '0DTE Put', trades: 54, wr: '42.6%', avg: '+$247.07', total: '+$13,341', r: '+0.5R' },
    { name: 'Call Debit', trades: 18, wr: '61.1%', avg: '+$493.94', total: '+$8,891', r: '+1.0R' },
    { name: 'Put Debit', trades: 19, wr: '52.6%', avg: '+$355.96', total: '+$6,763', r: '+0.7R' },
    { name: 'Call Scalp', trades: 16, wr: '56.3%', avg: '+$396.17', total: '+$6,339', r: '+0.8R' },
    { name: 'Put Scalp', trades: 8, wr: '50.0%', avg: '+$487.08', total: '+$3,897', r: '+1.0R' },
  ];
  const tickers = [
    { t: 'V', c: '#1a1f71', trades: 14, wr: '78.6%', pl: '+$10,391' },
    { t: 'META', c: '#0668E1', trades: 9, wr: '77.8%', pl: '+$6,288' },
    { t: 'NVDA', c: '#76b900', trades: 14, wr: '50.0%', pl: '+$6,129' },
    { t: 'AMD', c: '#007a33', trades: 11, wr: '54.5%', pl: '+$5,929' },
    { t: 'BA', c: '#1a6dff', trades: 9, wr: '66.7%', pl: '+$5,018' },
    { t: 'MSFT', c: '#737373', trades: 17, wr: '47.1%', pl: '+$5,805' },
  ];
  return (<div style={{ overflow: 'hidden' }}>
    {/* Header */}
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: '#fff' }}>Analysis</div>
      <div style={{ fontFamily: fm, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Behavioral pattern recognition across your trade history.</div>
      <div style={{ fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>200 executions analyzed</div>
    </div>
    {/* 4 Stat Cards */}
    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
        <div style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>TOTAL TRADES</div>
        <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>200</div>
        <div style={{ fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Win Rate: 46.0%</div>
        <div style={{ display: 'flex', height: 3, marginTop: 6 }}><div style={{ width: '46%', background: '#00d4a0' }} /><div style={{ width: '54%', background: '#ff4444' }} /></div>
      </div>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
        <div style={{ fontFamily: fm, fontSize: 10, color: '#00d4a0', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>PROCESS</div>
        <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>137</div>
        <div style={{ fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Win Rate: 61.3%</div>
        <div style={{ fontFamily: fm, fontSize: 10, color: '#00d4a0', marginTop: 4 }}>+150.9R total</div>
      </div>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
        <div style={{ fontFamily: fm, fontSize: 10, color: '#ff4444', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>IMPULSE</div>
        <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>63</div>
        <div style={{ fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Win Rate: 12.7%</div>
        <div style={{ fontFamily: fm, fontSize: 10, color: '#ff4444', marginTop: 4 }}>-31.3R total</div>
      </div>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
        <div style={{ fontFamily: fm, fontSize: 10, color: '#00d4a0', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4 }}>WHAT IF?</div>
        <div style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Your P/L if you only took process trades</div>
        <div style={{ fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Actual P/L: +$58,532</div>
        <div style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: '#00d4a0', lineHeight: 1, marginTop: 4 }}>+$74,792</div>
        <div style={{ fontFamily: fm, fontSize: 10, color: '#ff4444', marginTop: 4 }}>Indiscipline cost you $16,260</div>
      </div>
    </div>
    {/* Strategy Breakdown + Ticker Performance */}
    <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
      <div style={{ flex: '0 0 58%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
        <div style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Strategy breakdown</div>
        <div style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Performance by setup type</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 55px 70px 80px 45px', gap: 4, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontFamily: fm, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const }}>
          <span>STRATEGY</span><span>TRADES</span><span>WIN RATE</span><span>AVG P/L</span><span>TOTAL P/L</span><span>AVG R</span>
        </div>
        {strategies.map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 55px 70px 80px 45px', gap: 4, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: '2px solid #00d4a0', paddingLeft: 8, fontFamily: fm, fontSize: 11, alignItems: 'center' }}>
            <span style={{ color: '#fff' }}>{s.name}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{s.trades}</span>
            <span style={{ color: '#00d4a0' }}>{s.wr}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{s.avg}</span>
            <span style={{ color: '#00d4a0' }}>{s.total}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{s.r}</span>
          </div>
        ))}
        <div style={{ fontFamily: fm, fontSize: 10, color: '#00d4a0', marginTop: 8, cursor: 'pointer' }}>Show all ↓</div>
      </div>
      <div style={{ flex: '0 0 38%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
        <div style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Ticker performance</div>
        <div style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>P/L by asset</div>
        {tickers.map((tk, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: 24, height: 24, borderRadius: 4, background: tk.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: fm, flexShrink: 0 }}>{tk.t[0]}</div>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: fm, fontSize: 11, fontWeight: 700, color: '#fff' }}>{tk.t}</span>
              <span style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>{tk.trades} trades · {tk.wr} win</span>
            </div>
            <span style={{ fontFamily: fm, fontSize: 11, color: '#00d4a0', fontWeight: 700 }}>{tk.pl}</span>
          </div>
        ))}
        <div style={{ fontFamily: fm, fontSize: 10, color: '#00d4a0', marginTop: 8, cursor: 'pointer' }}>Show all ↓</div>
      </div>
    </div>
    {/* Time-of-day performance */}
    <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: '#fff' }}>Time-of-day performance</div>
          <div style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>When your edge is sharpest — and when it bleeds</div>
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: 2, gap: 2 }}>
          <span style={{ fontFamily: fm, fontSize: 9, padding: '3px 10px', background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 700 }}>Timeline</span>
          <span style={{ fontFamily: fm, fontSize: 9, padding: '3px 10px', color: '#00d4a0' }}>Best hours</span>
          <span style={{ fontFamily: fm, fontSize: 9, padding: '3px 10px', color: 'rgba(255,255,255,0.4)' }}>Worst hours</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { h: '9-10AM', pl: '+$18,500', c: 45, op: 0.22 },
          { h: '10-11AM', pl: '+$13,006', c: 38, op: 0.18 },
          { h: '11-12PM', pl: '+$9,781', c: 28, op: 0.15 },
          { h: '12-1PM', pl: '+$2,176', c: 22, op: 0.08 },
          { h: '1-2PM', pl: '+$7,653', c: 30, op: 0.14 },
          { h: '2-3PM', pl: '+$5,726', c: 25, op: 0.12 },
          { h: '3-4PM', pl: '+$3,124', c: 18, op: 0.09 },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, background: `rgba(0,255,136,${s.op})`, padding: '8px 4px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 }}>
            <span style={{ fontFamily: fm, fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>{s.h}</span>
            <span style={{ fontFamily: fd, fontSize: 11, fontWeight: 700, color: '#00d4a0' }}>{s.pl}</span>
            <span style={{ fontFamily: fm, fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>{s.c} trades</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, padding: '0 4px' }}>
        <span style={{ fontFamily: fm, fontSize: 8, color: '#00d4a0', letterSpacing: '1px' }}>OPEN</span>
        <span style={{ fontFamily: fm, fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>MIDDAY</span>
        <span style={{ fontFamily: fm, fontSize: 8, color: '#ffb400', letterSpacing: '1px' }}>CLOSE</span>
      </div>
      <div style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
        Best hour: <span style={{ color: '#00d4a0' }}>9AM (+$18,500)</span> · Worst hour: <span style={{ color: '#ff4444' }}>12PM (+$2,176)</span>
      </div>
    </div>
    {/* WickCoach observations */}
    <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: '#fff' }}>WickCoach observations</div>
          <div style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>AI-detected behavioral themes vs your stated goals</div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {['5','10','15','30','50','100','All'].map((w, i) => (
            <span key={i} style={{ fontFamily: fm, fontSize: 9, padding: '3px 8px', background: w === 'All' ? 'rgba(255,255,255,0.08)' : 'transparent', color: w === 'All' ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: w === 'All' ? 700 : 400 }}>{w}</span>
          ))}
        </div>
      </div>
      <svg width="100%" height="180" viewBox="0 0 700 180">
        <text x={80} y={16} fill="#ff4444" fontSize="10" fontFamily={fm} letterSpacing="2">FRICTION</text>
        <text x={540} y={16} fill="#00d4a0" fontSize="10" fontFamily={fm} letterSpacing="2">MOMENTUM</text>
        <line x1={80} y1={90} x2={620} y2={90} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        {[
          { name: 'Ignoring Rules', trades: 12, y: 32, w: 120 },
          { name: 'Revenge Trading', trades: 8, y: 62, w: 80 },
          { name: 'Premature Exit', trades: 6, y: 92, w: 60 },
          { name: 'Stubborn Hold', trades: 5, y: 122, w: 50 },
        ].map((p, i) => (
          <g key={'f'+i}>
            <line x1={345} y1={p.y + 10} x2={350} y2={90} stroke="#ff4444" strokeWidth={0.5} opacity={0.3} />
            <rect x={345 - p.w} y={p.y} width={p.w} height={20} rx={3} fill="#ff4444" opacity={0.5} />
            <text x={345 - p.w - 6} y={p.y + 10} fill="#ff4444" fontSize="9" fontFamily={fd} fontWeight="700" textAnchor="end">{p.name}</text>
            <text x={345 - p.w - 6} y={p.y + 20} fill="#999" fontSize="8" fontFamily={fm} textAnchor="end">{p.trades} trades</text>
          </g>
        ))}
        {[
          { name: 'Patience', trades: 15, y: 32, w: 150 },
          { name: 'Clean Entries', trades: 11, y: 62, w: 110 },
          { name: 'Trading Process', trades: 9, y: 92, w: 90 },
          { name: 'Position Building', trades: 7, y: 122, w: 70 },
        ].map((p, i) => (
          <g key={'m'+i}>
            <line x1={355} y1={p.y + 10} x2={350} y2={90} stroke="#00d4a0" strokeWidth={0.5} opacity={0.3} />
            <rect x={355} y={p.y} width={p.w} height={20} rx={3} fill="#00d4a0" opacity={0.5} />
            <text x={355 + p.w + 6} y={p.y + 10} fill="#00d4a0" fontSize="9" fontFamily={fd} fontWeight="700">{p.name}</text>
            <text x={355 + p.w + 6} y={p.y + 20} fill="#999" fontSize="8" fontFamily={fm}>{p.trades} trades</text>
          </g>
        ))}
        <circle cx={350} cy={90} r={18} fill="rgba(0,255,136,0.15)" stroke="#00d4a0" strokeWidth={1.5} />
        <text x={350} y={93} fill="#fff" fontSize="12" fontFamily={fd} fontWeight="700" textAnchor="middle" dominantBaseline="middle">72</text>
        <text x={350} y={155} fill="#999" fontSize="9" fontFamily={fm} textAnchor="middle">Psychology score</text>
      </svg>
    </div>
    {/* Goals alignment */}
    <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px' }}>
      <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Goals alignment</div>
      {[
        { text: 'LET TRADES BREATHE 3+ WHEN AT BREAK-EVEN', status: 'At risk', color: '#ff4444' },
        { text: '5M AND 13/15M CONFIRMATION BEHIND ALL TRADES', status: 'At risk', color: '#ff4444' },
        { text: 'AT OR NEAR 20MA, WILL WAIT FOR PULLBACK IF FAR', status: 'On track', color: '#00d4a0' },
      ].map((g, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid #00d4a0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: fm, fontSize: 10, color: '#00d4a0', fontWeight: 700 }}>{i + 1}</span>
          </div>
          <span style={{ fontFamily: fm, fontSize: 10, color: '#fff', flex: 1 }}>{g.text}</span>
          <span style={{ fontFamily: fm, fontSize: 9, fontWeight: 700, padding: '2px 10px', borderRadius: 3, background: g.color === '#ff4444' ? 'rgba(255,68,68,0.15)' : 'rgba(0,255,136,0.15)', color: g.color }}>{g.status}</span>
        </div>
      ))}
    </div>
  </div>);
}

