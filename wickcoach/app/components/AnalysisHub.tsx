'use client';
import React, { useMemo } from 'react';

const fm = "'DM Mono', monospace";
const fd = "'Chakra Petch', sans-serif";
const teal = '#00d4a0';
const red = '#ff4444';

interface Trade {
  id: string;
  ticker: string;
  companyName: string;
  date: string;
  time: string;
  strategy: string;
  direction: 'LONG' | 'SHORT';
  contracts: number;
  entryPrice: number;
  exitPrice: number;
  pl: number;
  plPercent: number;
  riskAmount: number;
  riskReward: string;
  journal: string;
  screenshot?: string;
  aiScore?: number;
  result: 'WIN' | 'LOSS' | 'BREAKEVEN';
}

const RULE_BREAK_KEYWORDS = [
  'revenge', 'fomo', 'spite', 'frustrated', 'impatient', 'stubborn',
  'doubled down', 'chased', 'ignored my own rule', 'ego', 'reckless',
  'anxiety', 'afraid to miss', 'shaken', 'front-run', 'froze instead of cutting',
  'held hoping', 'trading from frustration', 'sized up 3x', 'ignored'
];

function isRuleBreaking(journal: string): boolean {
  const lower = journal.toLowerCase();
  return RULE_BREAK_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

function getSetupTag(journal: string): string {
  const lower = journal.toLowerCase();
  if (lower.includes('ma squeeze') || lower.includes('squeeze')) return 'SQUEEZE EXPAND';
  if (lower.includes('halt trade')) return 'HALT SETUP';
  if (lower.includes('power bar off vwap')) return 'VWAP POWER BAR';
  if (lower.includes('clearing bar')) return 'CLEARING BARS';
  if (lower.includes('gap fill')) return 'GAP FILL';
  if (lower.includes('color change')) return 'COLOR CHANGE';
  return 'CLEAN ENTRY';
}

function getViolationTag(journal: string): string {
  const lower = journal.toLowerCase();
  if (lower.includes('stubborn') || lower.includes('doubled down')) return 'STUBBORN HOLD';
  if (lower.includes('fomo') || lower.includes('chased') || lower.includes('afraid to miss')) return 'FOMO CHASE';
  if (lower.includes('front-run')) return 'FRONT-RUNNING';
  if (lower.includes('revenge') || lower.includes('spite')) return 'REVENGE TRADE';
  if (lower.includes('frustrated') || lower.includes('impatient') || lower.includes('anxiety')) return 'IMPULSE ENTRY';
  if (lower.includes('ego')) return 'EGO TRADE';
  if (lower.includes('froze') || lower.includes('held hoping')) return 'FREEZE/HOLD';
  if (lower.includes('sized up 3x')) return 'OVERSIZE';
  return 'RULE BREAK';
}

function formatDollar(n: number): string {
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  if (abs % 1 === 0) return sign + '$' + abs.toLocaleString();
  return sign + '$' + abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// SVG Radar chart component
function RadarChart({ scores }: { scores: { label: string; value: number }[] }) {
  const cx = 110, cy = 110, r = 80;
  const n = scores.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep;
    const dist = (value / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <svg width={220} height={220} viewBox="0 0 220 220">
      {/* Grid pentagons */}
      {gridLevels.map(level => {
        const pts = scores.map((_, i) => getPoint(i, level));
        return (
          <polygon
            key={level}
            points={pts.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#1e1f2a"
            strokeWidth={1}
          />
        );
      })}
      {/* Axis lines */}
      {scores.map((_, i) => {
        const p = getPoint(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#1e1f2a" strokeWidth={1} />;
      })}
      {/* Data polygon */}
      <polygon
        points={scores.map((s, i) => {
          const p = getPoint(i, s.value);
          return `${p.x},${p.y}`;
        }).join(' ')}
        fill="rgba(0,212,160,0.15)"
        stroke={teal}
        strokeWidth={2}
      />
      {/* Data points */}
      {scores.map((s, i) => {
        const p = getPoint(i, s.value);
        return <circle key={i} cx={p.x} cy={p.y} r={3} fill={teal} />;
      })}
      {/* Labels */}
      {scores.map((s, i) => {
        const p = getPoint(i, 125);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#6b7280"
            fontSize={10}
            fontFamily={fm}
          >
            {s.label}
          </text>
        );
      })}
    </svg>
  );
}

export default function AnalysisContent({ trades }: { trades: Trade[] }) {
  const analysis = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    const ruleAbiding: Trade[] = [];
    const ruleBreaking: Trade[] = [];
    trades.forEach(t => {
      if (isRuleBreaking(t.journal)) ruleBreaking.push(t);
      else ruleAbiding.push(t);
    });

    const totalR = trades.reduce((sum, t) => sum + (t.riskAmount ? t.pl / t.riskAmount : 0), 0);
    const totalWins = trades.filter(t => t.result === 'WIN').length;
    const totalWinRate = trades.length > 0 ? (totalWins / trades.length) * 100 : 0;

    const abidingR = ruleAbiding.reduce((sum, t) => sum + (t.riskAmount ? t.pl / t.riskAmount : 0), 0);
    const abidingWins = ruleAbiding.filter(t => t.result === 'WIN').length;
    const abidingWinRate = ruleAbiding.length > 0 ? (abidingWins / ruleAbiding.length) * 100 : 0;

    const breakingR = ruleBreaking.reduce((sum, t) => sum + (t.riskAmount ? t.pl / t.riskAmount : 0), 0);
    const breakingWins = ruleBreaking.filter(t => t.result === 'WIN').length;
    const breakingWinRate = ruleBreaking.length > 0 ? (breakingWins / ruleBreaking.length) * 100 : 0;

    // Top rule-abiding wins (sorted by P/L desc)
    const topWins = [...ruleAbiding].filter(t => t.result === 'WIN').sort((a, b) => b.pl - a.pl).slice(0, 3);
    // Worst rule-breaking losses (sorted by P/L asc)
    const worstLosses = [...ruleBreaking].filter(t => t.result === 'LOSS').sort((a, b) => a.pl - b.pl).slice(0, 3);

    // Dominant flaw
    const violationCounts: Record<string, number> = {};
    ruleBreaking.forEach(t => {
      const tag = getViolationTag(t.journal);
      violationCounts[tag] = (violationCounts[tag] || 0) + 1;
    });
    const dominantFlaw = Object.entries(violationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'RULE BREAK';

    // Avg expectancy
    const avgExp = trades.length > 0 ? totalR / trades.length : 0;

    // Accuracy
    const accuracy = totalWinRate;

    // Psych scores (computed from journals)
    const patientCount = trades.filter(t => /waited|patient/i.test(t.journal)).length;
    const cleanEntryCount = trades.filter(t => /textbook|defined risk|pre-planned/i.test(t.journal)).length;
    const bailedCount = trades.filter(t => /breakeven.*fear|bailed|scared out/i.test(t.journal)).length;
    const stopsHonored = trades.filter(t => /took the loss cleanly|pre-planned level|defined risk|honored stop/i.test(t.journal)).length;

    const patience = Math.min(100, Math.max(15, Math.round((patientCount / Math.max(trades.length, 1)) * 300) + 25));
    const discipline = Math.min(100, Math.max(15, Math.round((ruleAbiding.length / Math.max(trades.length, 1)) * 100)));
    const execution = Math.min(100, Math.max(15, Math.round((cleanEntryCount / Math.max(trades.length, 1)) * 250) + 30));
    const conviction = Math.min(100, Math.max(15, 70 - Math.round((bailedCount / Math.max(trades.length, 1)) * 200)));
    const riskMgmt = Math.min(100, Math.max(15, Math.round((stopsHonored / Math.max(trades.length, 1)) * 250) + 30));

    return {
      total: trades.length,
      totalR,
      totalWinRate,
      ruleAbiding,
      ruleBreaking,
      abidingR,
      abidingWinRate,
      breakingR,
      breakingWinRate,
      topWins,
      worstLosses,
      dominantFlaw,
      avgExp,
      accuracy,
      psychScores: [
        { label: 'Patience', value: patience },
        { label: 'Discipline', value: discipline },
        { label: 'Execution', value: execution },
        { label: 'Conviction', value: conviction },
        { label: 'Risk Mgmt', value: riskMgmt },
      ],
    };
  }, [trades]);

  if (!analysis) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <p style={{ color: '#4b5563', fontFamily: fm, fontSize: 16 }}>Log trades to unlock your Analysis Hub</p>
      </div>
    );
  }

  const maxBarR = Math.max(Math.abs(analysis.abidingR), Math.abs(analysis.breakingR), 1);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: '16px 0', alignItems: 'flex-start' }}>

      {/* ═══ LEFT COLUMN ═══ */}
      <div style={{ minWidth: 280, maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* WickCoach AI Card */}
        <div style={{
          background: '#0e0f14',
          backgroundImage: 'radial-gradient(rgba(0,212,160,0.07) 1px, transparent 1px)',
          backgroundSize: '4px 4px',
          border: '1px solid #1e1f2a',
          borderRadius: 10,
          padding: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>✦</span>
            <span style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff' }}>WickCoach AI</span>
          </div>
          <div style={{ fontFamily: fm, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14 }}>
            Dataset Analysis ({analysis.total} Executions)
          </div>
          <div style={{
            background: '#13141a',
            borderRadius: 8,
            padding: 14,
            fontSize: 13,
            fontFamily: fm,
            color: '#c0c3cc',
            lineHeight: 1.7,
          }}>
            I&apos;ve reviewed your latest {analysis.total} trades. Your isolated edge is highly profitable: <span style={{ color: teal, fontWeight: 700 }}>&quot;MA Squeeze&quot;</span> and <span style={{ color: teal, fontWeight: 700 }}>&quot;Power Bar off VWAP&quot;</span> entries yield a massive {analysis.abidingWinRate.toFixed(0)}% win rate. However, total expectancy is bleeding out due to poor discipline when wrong.
          </div>

          {/* Critical Behavioral Flag */}
          <div style={{
            marginTop: 14,
            borderLeft: `4px solid ${red}`,
            paddingLeft: 14,
            paddingTop: 2,
          }}>
            <div style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: red, marginBottom: 6 }}>
              The &quot;Double Down&quot; Trap
            </div>
            <div style={{ fontFamily: fm, fontSize: 12, color: '#9ca3af', lineHeight: 1.7 }}>
              Your journals repeatedly flag <span style={{ color: '#fff', fontWeight: 600 }}>&quot;Stubborn&quot;</span> and <span style={{ color: '#fff', fontWeight: 600 }}>&quot;Doubled down on losing position&quot;</span> specifically on <span style={{ color: '#fff', fontWeight: 700 }}>COIN</span> and <span style={{ color: '#fff', fontWeight: 700 }}>AMZN</span>. These revenge vectors account for <span style={{ color: red, fontWeight: 700 }}>{analysis.breakingR.toFixed(1)}R</span> in capital destruction, wiping out your high-integrity gains.
            </div>
          </div>
        </div>

        {/* Chat Input (non-functional) */}
        <div style={{
          background: '#0e0f14',
          border: '1px solid #1e1f2a',
          borderRadius: 10,
          padding: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <input
            readOnly
            placeholder="Ask Wick Coach..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: fm,
              fontSize: 13,
              color: '#6b7280',
            }}
          />
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: teal,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>
      </div>

      {/* ═══ CENTER COLUMN ═══ */}
      <div style={{ flex: 1, minWidth: 400, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Discipline Matrix */}
        <div style={{
          background: '#0e0f14',
          border: '1px solid #1e1f2a',
          borderRadius: 10,
          padding: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff' }}>
              Discipline Matrix (Last {analysis.total} Trades)
            </span>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth={1.5} strokeLinecap="round">
              <path d="M12 3v1m0 16v1m-9-9h1m16 0h1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* Total Executions */}
            <div style={{
              flex: 1,
              minWidth: 140,
              background: '#13141a',
              borderRadius: 8,
              padding: 16,
              borderLeft: '3px solid #3a3b42',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: fm, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Total Executions</span>
                <span style={{ fontFamily: fm, fontSize: 9, color: '#9ca3af', background: '#2a2b32', borderRadius: 4, padding: '2px 6px' }}>ALL</span>
              </div>
              <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{analysis.total}</div>
              <div style={{ fontFamily: fm, fontSize: 11, color: '#6b7280', marginTop: 4 }}>{analysis.totalR >= 0 ? '+' : ''}{analysis.totalR.toFixed(1)}R Net Result</div>
              <div style={{ fontFamily: fm, fontSize: 11, color: '#6b7280', marginTop: 2 }}>Win Rate {analysis.totalWinRate.toFixed(1)}%</div>
            </div>

            {/* Rule-Abiding */}
            <div style={{
              flex: 1,
              minWidth: 140,
              background: '#13141a',
              borderRadius: 8,
              padding: 16,
              borderLeft: `3px solid ${teal}`,
            }}>
              <div style={{ fontFamily: fm, fontSize: 10, color: teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Rule-Abiding</div>
              <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{analysis.ruleAbiding.length}</div>
              <div style={{ fontFamily: fm, fontSize: 11, color: teal, marginTop: 4 }}>{analysis.abidingR >= 0 ? '+' : ''}{analysis.abidingR.toFixed(1)}R</div>
              <div style={{ fontFamily: fm, fontSize: 11, color: '#6b7280', marginTop: 2 }}>Win Rate {analysis.abidingWinRate.toFixed(1)}%</div>
            </div>

            {/* Rule-Breaking */}
            <div style={{
              flex: 1,
              minWidth: 140,
              background: '#13141a',
              borderRadius: 8,
              padding: 16,
              borderLeft: `3px solid ${red}`,
            }}>
              <div style={{ fontFamily: fm, fontSize: 10, color: red, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Rule-Breaking</div>
              <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{analysis.ruleBreaking.length}</div>
              <div style={{ fontFamily: fm, fontSize: 11, color: red, marginTop: 4 }}>{analysis.breakingR >= 0 ? '+' : ''}{analysis.breakingR.toFixed(1)}R</div>
              <div style={{ fontFamily: fm, fontSize: 11, color: '#6b7280', marginTop: 2 }}>Win Rate {analysis.breakingWinRate.toFixed(1)}%</div>
            </div>
          </div>

          {/* Net Expectancy Capital Shift */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: fm, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Net Expectancy Capital Shift</span>
              <span style={{ fontFamily: fm, fontSize: 10, color: '#6b7280' }}>Total R</span>
            </div>

            {/* Valid bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 65, flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: teal }} />
                <span style={{ fontFamily: fm, fontSize: 11, color: '#9ca3af' }}>Valid</span>
              </div>
              <div style={{ flex: 1, height: 24, background: '#13141a', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (Math.abs(analysis.abidingR) / maxBarR) * 100)}%`,
                  background: `linear-gradient(90deg, ${teal}, rgba(0,212,160,0.5))`,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 8,
                }} />
              </div>
              <span style={{ fontFamily: fm, fontSize: 12, color: teal, fontWeight: 700, width: 55, textAlign: 'right', flexShrink: 0 }}>
                +{analysis.abidingR.toFixed(1)}R
              </span>
            </div>

            {/* Impulse bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 65, flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: red }} />
                <span style={{ fontFamily: fm, fontSize: 11, color: '#9ca3af' }}>Impulse</span>
              </div>
              <div style={{ flex: 1, height: 24, background: '#13141a', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (Math.abs(analysis.breakingR) / maxBarR) * 100)}%`,
                  background: `linear-gradient(90deg, ${red}, rgba(255,68,68,0.5))`,
                  borderRadius: 4,
                }} />
              </div>
              <span style={{ fontFamily: fm, fontSize: 12, color: red, fontWeight: 700, width: 55, textAlign: 'right', flexShrink: 0 }}>
                {analysis.breakingR.toFixed(1)}R
              </span>
            </div>
          </div>
        </div>

        {/* Forensic Dissection */}
        <div style={{
          background: '#0e0f14',
          border: '1px solid #1e1f2a',
          borderRadius: 10,
          padding: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff' }}>Forensic Dissection</span>
            <span style={{
              fontFamily: fm,
              fontSize: 10,
              color: teal,
              background: '#13141a',
              border: `1px solid ${teal}33`,
              borderRadius: 4,
              padding: '4px 10px',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>Intelligent Sort</span>
          </div>

          {/* High Integrity Executions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={teal} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span style={{ fontFamily: fm, fontSize: 11, color: teal, textTransform: 'uppercase', letterSpacing: 1 }}>High Integrity Executions</span>
          </div>

          {analysis.topWins.length === 0 && (
            <div style={{ fontFamily: fm, fontSize: 12, color: '#4b5563', marginBottom: 16, paddingLeft: 4 }}>No qualifying trades found</div>
          )}

          {analysis.topWins.map(t => (
            <div key={t.id} style={{
              background: '#13141a',
              borderLeft: `3px solid ${teal}`,
              borderRadius: 6,
              padding: 14,
              marginBottom: 10,
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
            }}>
              <div style={{ minWidth: 90 }}>
                <div style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff' }}>{t.ticker}</div>
                <div style={{ fontFamily: fm, fontSize: 10, color: '#6b7280', marginTop: 2 }}>{t.date} • {t.time}</div>
                <div style={{ fontFamily: fm, fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{t.strategy}</div>
                <span style={{
                  display: 'inline-block',
                  marginTop: 6,
                  fontFamily: fm,
                  fontSize: 9,
                  color: teal,
                  background: `${teal}15`,
                  border: `1px solid ${teal}33`,
                  borderRadius: 3,
                  padding: '2px 7px',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>{getSetupTag(t.journal)}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                  <span style={{ fontFamily: fm, fontSize: 14, fontWeight: 700, color: teal }}>{formatDollar(t.pl)}</span>
                  <span style={{ fontFamily: fm, fontSize: 12, color: '#6b7280' }}>R {t.riskReward}</span>
                </div>
                <div style={{ fontFamily: fm, fontSize: 11, color: '#9ca3af', lineHeight: 1.6, fontStyle: 'italic' }}>
                  &quot;{t.journal.length > 160 ? t.journal.slice(0, 160) + '...' : t.journal}&quot;
                </div>
              </div>
            </div>
          ))}

          {/* Protocol Violations */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 12 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={red} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span style={{ fontFamily: fm, fontSize: 11, color: red, textTransform: 'uppercase', letterSpacing: 1 }}>Protocol Violations</span>
          </div>

          {analysis.worstLosses.length === 0 && (
            <div style={{ fontFamily: fm, fontSize: 12, color: '#4b5563', marginBottom: 8, paddingLeft: 4 }}>No violations detected</div>
          )}

          {analysis.worstLosses.map(t => (
            <div key={t.id} style={{
              background: '#13141a',
              borderLeft: `3px solid ${red}`,
              borderRadius: 6,
              padding: 14,
              marginBottom: 10,
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
            }}>
              <div style={{ minWidth: 90 }}>
                <div style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff' }}>{t.ticker}</div>
                <div style={{ fontFamily: fm, fontSize: 10, color: '#6b7280', marginTop: 2 }}>{t.date} • {t.time}</div>
                <div style={{ fontFamily: fm, fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{t.strategy}</div>
                <span style={{
                  display: 'inline-block',
                  marginTop: 6,
                  fontFamily: fm,
                  fontSize: 9,
                  color: red,
                  background: `${red}15`,
                  border: `1px solid ${red}33`,
                  borderRadius: 3,
                  padding: '2px 7px',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>{getViolationTag(t.journal)}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                  <span style={{ fontFamily: fm, fontSize: 14, fontWeight: 700, color: red }}>{formatDollar(t.pl)}</span>
                  <span style={{ fontFamily: fm, fontSize: 12, color: '#6b7280' }}>R {t.riskReward}</span>
                </div>
                <div style={{ fontFamily: fm, fontSize: 11, color: '#9ca3af', lineHeight: 1.6, fontStyle: 'italic' }}>
                  &quot;{t.journal.length > 160 ? t.journal.slice(0, 160) + '...' : t.journal}&quot;
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ RIGHT COLUMN ═══ */}
      <div style={{ minWidth: 280, maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Psych Profile Radar */}
        <div style={{
          background: '#0e0f14',
          border: '1px solid #1e1f2a',
          borderRadius: 10,
          padding: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round">
              <path d="M12 2a7 7 0 017 7c0 3-1.5 5.5-4 7.5V19H9v-2.5C6.5 14.5 5 12 5 9a7 7 0 017-7z" />
              <line x1="9" y1="22" x2="15" y2="22" />
              <line x1="10" y1="19" x2="10" y2="22" />
              <line x1="14" y1="19" x2="14" y2="22" />
            </svg>
            <span style={{ fontFamily: fd, fontSize: 15, fontWeight: 700, color: '#fff' }}>Psych Profile</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RadarChart scores={analysis.psychScores} />
          </div>
        </div>

        {/* 2x2 Stat Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 8, padding: 14 }}>
            <div style={{ fontFamily: fm, fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Accuracy</div>
            <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#fff' }}>{analysis.accuracy.toFixed(1)}%</div>
          </div>
          <div style={{ background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 8, padding: 14 }}>
            <div style={{ fontFamily: fm, fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Avg Exp</div>
            <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: analysis.avgExp >= 0 ? teal : red }}>
              {analysis.avgExp >= 0 ? '+' : ''}{analysis.avgExp.toFixed(2)}R
            </div>
          </div>
          <div style={{ background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 8, padding: 14 }}>
            <div style={{ fontFamily: fm, fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Avg Win Time</div>
            <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#fff' }}>28 min</div>
          </div>
          <div style={{ background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 8, padding: 14 }}>
            <div style={{ fontFamily: fm, fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Avg Loss Time</div>
            <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#fff' }}>14 min</div>
          </div>
        </div>

        {/* Dominant Flaw */}
        <div style={{
          background: '#0e0f14',
          border: '1px solid #1e1f2a',
          borderLeft: `4px solid ${red}`,
          borderRadius: 10,
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={red} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: '#fff' }}>Dominant Flaw</span>
          </div>
          <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: red, marginBottom: 8 }}>
            {analysis.dominantFlaw}
          </div>
          <span style={{
            fontFamily: fm,
            fontSize: 9,
            color: red,
            background: `${red}15`,
            border: `1px solid ${red}33`,
            borderRadius: 3,
            padding: '3px 8px',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>Critical Leak</span>
        </div>
      </div>
    </div>
  );
}
