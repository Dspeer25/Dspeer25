'use client';
import React, { useState, useMemo, useEffect } from 'react';

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
  'doubled down', 'chased', 'ignored my own rule', 'ignored the', 'ego',
  'reckless', 'anxiety', 'afraid to miss', 'afraid', 'shaken', 'front-run',
  'froze instead', 'held hoping', 'trading from frustration', 'sized up 3x',
  'too eager', 'forced the trade', 'overconfident', 'emotional', 'garbage decision',
];

function isRuleBreaking(journal: string): boolean {
  const lower = journal.toLowerCase();
  return RULE_BREAK_KEYWORDS.some(kw => lower.includes(kw));
}

function getSetupTag(journal: string): string {
  const l = journal.toLowerCase();
  if (l.includes('ma squeeze') || l.includes('squeeze')) return 'SQUEEZE EXPAND';
  if (l.includes('halt trade')) return 'HALT SETUP';
  if (l.includes('power bar off vwap')) return 'VWAP POWER BAR';
  if (l.includes('clearing bar')) return 'CLEARING BARS';
  if (l.includes('gap fill')) return 'GAP FILL';
  if (l.includes('color change')) return 'COLOR CHANGE';
  if (l.includes('13min') && l.includes('confluence')) return 'MULTI-TF CONFLUENCE';
  return 'CLEAN ENTRY';
}

function getViolationTag(journal: string): string {
  const l = journal.toLowerCase();
  if (l.includes('stubborn') || l.includes('doubled down')) return 'STUBBORN HOLD';
  if (l.includes('fomo') || l.includes('chased') || l.includes('afraid to miss')) return 'FOMO CHASE';
  if (l.includes('front-run')) return 'FRONT-RUNNING';
  if (l.includes('revenge') || l.includes('spite')) return 'REVENGE TRADE';
  if (l.includes('frustrated') || l.includes('impatient') || l.includes('anxiety') || l.includes('eager')) return 'IMPULSE ENTRY';
  if (l.includes('ego')) return 'EGO TRADE';
  if (l.includes('froze') || l.includes('held hoping')) return 'FREEZE / HOLD';
  if (l.includes('sized up 3x')) return 'OVERSIZE';
  if (l.includes('overconfident') || l.includes('reckless')) return 'RECKLESS ENTRY';
  if (l.includes('emotional') || l.includes('garbage')) return 'EMOTIONAL';
  return 'RULE BREAK';
}

const TICKER_DOMAINS: Record<string, string> = {
  AAPL: 'apple.com', MSFT: 'microsoft.com', GOOGL: 'google.com', GOOG: 'google.com',
  AMZN: 'amazon.com', META: 'meta.com', NVDA: 'nvidia.com', TSLA: 'tesla.com',
  AMD: 'amd.com', NFLX: 'netflix.com', SPY: 'ssga.com', QQQ: 'invesco.com',
  DIS: 'disney.com', BA: 'boeing.com', JPM: 'jpmorganchase.com', V: 'visa.com',
  WMT: 'walmart.com', COIN: 'coinbase.com', PLTR: 'palantir.com', SOFI: 'sofi.com',
  CRM: 'salesforce.com', COST: 'costco.com', HD: 'homedepot.com', UNH: 'unitedhealthgroup.com',
};

function fmtDollar(n: number): string {
  const sign = n >= 0 ? '+' : '-';
  return sign + '$' + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtR(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(1) + 'R';
}

function fmtPct(n: number): string {
  return n.toFixed(1) + '%';
}

function parseHour(time: string): number {
  const parts = time.split(':');
  return parseInt(parts[0], 10);
}

export default function AnalysisContent() {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('wickcoach_trades');
      if (stored) setTrades(JSON.parse(stored));
    } catch { /* empty */ }
  }, []);

  const analysis = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    const ruleAbiding: Trade[] = [];
    const ruleBreaking: Trade[] = [];
    trades.forEach(t => {
      if (isRuleBreaking(t.journal)) ruleBreaking.push(t);
      else ruleAbiding.push(t);
    });

    const totalPL = trades.reduce((s, t) => s + t.pl, 0);
    const totalWins = trades.filter(t => t.result === 'WIN').length;
    const totalLosses = trades.filter(t => t.result === 'LOSS').length;
    const totalBE = trades.filter(t => t.result === 'BREAKEVEN').length;
    const totalWinRate = (totalWins / trades.length) * 100;

    const abidingWins = ruleAbiding.filter(t => t.result === 'WIN').length;
    const abidingWinRate = ruleAbiding.length > 0 ? (abidingWins / ruleAbiding.length) * 100 : 0;
    const abidingR = ruleAbiding.reduce((s, t) => s + (t.riskAmount ? t.pl / t.riskAmount : 0), 0);
    const abidingPL = ruleAbiding.reduce((s, t) => s + t.pl, 0);

    const breakingWins = ruleBreaking.filter(t => t.result === 'WIN').length;
    const breakingWinRate = ruleBreaking.length > 0 ? (breakingWins / ruleBreaking.length) * 100 : 0;
    const breakingR = ruleBreaking.reduce((s, t) => s + (t.riskAmount ? t.pl / t.riskAmount : 0), 0);

    const disciplineDividend = abidingPL - totalPL;

    // Time-of-day data (hours 9-15)
    const hourData: Record<number, { pl: number; count: number }> = {};
    for (let h = 9; h <= 15; h++) hourData[h] = { pl: 0, count: 0 };
    trades.forEach(t => {
      const h = parseHour(t.time);
      if (h >= 9 && h <= 15) {
        hourData[h].pl += t.pl;
        hourData[h].count += 1;
      }
    });
    const maxAbsHourPL = Math.max(...Object.values(hourData).map(d => Math.abs(d.pl)), 1);
    let bestHour = 9, worstHour = 9;
    for (let h = 9; h <= 15; h++) {
      if (hourData[h].pl > hourData[bestHour].pl) bestHour = h;
      if (hourData[h].pl < hourData[worstHour].pl) worstHour = h;
    }

    // Strategy breakdown
    const stratMap: Record<string, { trades: Trade[]; wins: number; totalPL: number; totalR: number }> = {};
    trades.forEach(t => {
      if (!stratMap[t.strategy]) stratMap[t.strategy] = { trades: [], wins: 0, totalPL: 0, totalR: 0 };
      stratMap[t.strategy].trades.push(t);
      if (t.result === 'WIN') stratMap[t.strategy].wins++;
      stratMap[t.strategy].totalPL += t.pl;
      stratMap[t.strategy].totalR += t.riskAmount ? t.pl / t.riskAmount : 0;
    });
    const strategies = Object.entries(stratMap)
      .map(([name, d]) => ({
        name,
        count: d.trades.length,
        winRate: (d.wins / d.trades.length) * 100,
        avgPL: d.totalPL / d.trades.length,
        totalPL: d.totalPL,
        avgR: d.totalR / d.trades.length,
      }))
      .sort((a, b) => b.totalPL - a.totalPL);

    // Ticker breakdown
    const tickerMap: Record<string, { trades: Trade[]; wins: number; totalPL: number }> = {};
    trades.forEach(t => {
      if (!tickerMap[t.ticker]) tickerMap[t.ticker] = { trades: [], wins: 0, totalPL: 0 };
      tickerMap[t.ticker].trades.push(t);
      if (t.result === 'WIN') tickerMap[t.ticker].wins++;
      tickerMap[t.ticker].totalPL += t.pl;
    });
    const tickers = Object.entries(tickerMap)
      .map(([name, d]) => ({
        name,
        count: d.trades.length,
        winRate: (d.wins / d.trades.length) * 100,
        totalPL: d.totalPL,
      }))
      .sort((a, b) => b.totalPL - a.totalPL);

    // Top wins (rule-abiding) and worst losses (rule-breaking)
    const topWins = [...ruleAbiding].filter(t => t.result === 'WIN').sort((a, b) => b.pl - a.pl).slice(0, 3);
    const worstLosses = [...ruleBreaking].filter(t => t.result === 'LOSS').sort((a, b) => a.pl - b.pl).slice(0, 3);

    // Violation frequency
    const violationCounts: Record<string, { count: number; tickers: Record<string, number>; totalR: number }> = {};
    ruleBreaking.forEach(t => {
      const tag = getViolationTag(t.journal);
      if (!violationCounts[tag]) violationCounts[tag] = { count: 0, tickers: {}, totalR: 0 };
      violationCounts[tag].count++;
      violationCounts[tag].tickers[t.ticker] = (violationCounts[tag].tickers[t.ticker] || 0) + 1;
      violationCounts[tag].totalR += t.riskAmount ? t.pl / t.riskAmount : 0;
    });
    const dominantViolation = Object.entries(violationCounts).sort((a, b) => b[1].count - a[1].count)[0];
    const dominantFlawName = dominantViolation ? dominantViolation[0] : 'RULE BREAK';
    const dominantFlawData = dominantViolation ? dominantViolation[1] : { count: 0, tickers: {}, totalR: 0 };
    const dominantTickers = Object.entries(dominantFlawData.tickers).sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0]);

    // Setup tag frequency for AI summary
    const setupCounts: Record<string, number> = {};
    ruleAbiding.forEach(t => {
      const tag = getSetupTag(t.journal);
      setupCounts[tag] = (setupCounts[tag] || 0) + 1;
    });
    const topSetups = Object.entries(setupCounts).sort((a, b) => b[1] - a[1]);
    const topSetupTag = topSetups[0]?.[0] || 'Clean entries';
    const secondSetupTag = topSetups[1]?.[0] || 'disciplined setups';

    // Psych scores
    const patientCount = trades.filter(t => /waited|patient|patiently/i.test(t.journal)).length;
    const executionCount = trades.filter(t => /textbook|defined risk|pre-planned|clean entry|clean exit|followed every rule|followed my rules|per my rules|per the rules/i.test(t.journal)).length;
    const fearBECount = trades.filter(t => t.result === 'BREAKEVEN' && /fear|scared|panicked|bailed/i.test(t.journal)).length;
    const beCount = trades.filter(t => t.result === 'BREAKEVEN').length;
    const riskCount = trades.filter(t => /took the loss cleanly|pre-planned level|defined risk|risk was defined|stayed within risk|cut the loss|cut it fast|stopped out at/i.test(t.journal)).length;

    const patienceScore = Math.min(100, Math.round((patientCount / trades.length) * 100));
    const disciplineScore = Math.min(100, Math.round((ruleAbiding.length / trades.length) * 100));
    const executionScore = Math.min(100, Math.round((executionCount / trades.length) * 200));
    const convictionScore = beCount > 0 ? Math.min(100, Math.max(0, Math.round(100 - (fearBECount / beCount) * 100))) : 60;
    const riskMgmtScore = Math.min(100, Math.round((riskCount / trades.length) * 250));

    const psychScores = [
      { label: 'Patience', value: patienceScore, abbr: 'PAT' },
      { label: 'Discipline', value: disciplineScore, abbr: 'DIS' },
      { label: 'Execution', value: executionScore, abbr: 'EXE' },
      { label: 'Conviction', value: convictionScore, abbr: 'CON' },
      { label: 'Risk Mgmt', value: riskMgmtScore, abbr: 'RSK' },
    ];

    return {
      total: trades.length, totalPL, totalWins, totalLosses, totalBE, totalWinRate,
      ruleAbiding, ruleBreaking,
      abidingWinRate, abidingR, abidingPL,
      breakingWinRate, breakingR, disciplineDividend,
      hourData, maxAbsHourPL, bestHour, worstHour,
      strategies, tickers,
      topWins, worstLosses,
      dominantFlawName, dominantFlawData, dominantTickers,
      topSetupTag, secondSetupTag,
      psychScores,
    };
  }, [trades]);

  if (!analysis) {
    return (
      <div style={{ background: '#1a1c23', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: fm }}>
        <p style={{ color: '#888', fontFamily: fd, fontSize: 20 }}>Log trades to unlock your Analysis Hub</p>
        <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>Your behavioral patterns will appear here after you&apos;ve logged enough trades.</p>
      </div>
    );
  }

  const hourLabels: Record<number, string> = { 9: '9AM', 10: '10AM', 11: '11AM', 12: '12PM', 13: '1PM', 14: '2PM', 15: '3PM' };

  return (
    <div style={{ background: '#1a1c23', padding: '32px 48px', minHeight: '100vh', fontFamily: fm }}>
      {/* ═══ HEADER ═══ */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>Analysis Hub</h2>
        <p style={{ color: '#888', fontSize: 14, margin: '6px 0 0' }}>Behavioral pattern recognition across your trade history.</p>
        <p style={{ color: '#666', fontSize: 12, margin: '4px 0 0' }}>{analysis.total} executions analyzed</p>
      </div>

      {/* ═══ SECTION 1: HEADLINE ROW ═══ */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Card 1: Total Trades */}
        <div style={{ flex: 1, minWidth: 200, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 11, color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Total Trades</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{analysis.total}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>Win Rate: {fmtPct(analysis.totalWinRate)}</div>
          {/* Win/Loss/BE bar */}
          <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 10 }}>
            <div style={{ width: `${(analysis.totalWins / analysis.total) * 100}%`, background: teal }} />
            <div style={{ width: `${(analysis.totalLosses / analysis.total) * 100}%`, background: red }} />
            <div style={{ width: `${(analysis.totalBE / analysis.total) * 100}%`, background: '#4b5563' }} />
          </div>
        </div>

        {/* Card 2: Rule-Abiding */}
        <div style={{ flex: 1, minWidth: 200, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '20px 24px', borderLeft: `3px solid ${teal}` }}>
          <div style={{ fontSize: 11, color: teal, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Rule-Abiding</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{analysis.ruleAbiding.length}</div>
          <div style={{ fontSize: 13, color: teal, marginTop: 6 }}>Win Rate: {fmtPct(analysis.abidingWinRate)}</div>
          <div style={{ fontSize: 11, color: teal, marginTop: 4 }}>{fmtR(analysis.abidingR)} total</div>
        </div>

        {/* Card 3: Rule-Breaking */}
        <div style={{ flex: 1, minWidth: 200, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '20px 24px', borderLeft: `3px solid ${red}` }}>
          <div style={{ fontSize: 11, color: red, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Rule-Breaking</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{analysis.ruleBreaking.length}</div>
          <div style={{ fontSize: 13, color: red, marginTop: 6 }}>Win Rate: {fmtPct(analysis.breakingWinRate)}</div>
          <div style={{ fontSize: 11, color: red, marginTop: 4 }}>{fmtR(analysis.breakingR)} total</div>
        </div>

        {/* Card 4: Discipline Dividend */}
        <div style={{ flex: 1, minWidth: 200, background: '#0e0f14', border: '1px solid rgba(0,212,160,0.3)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 0 20px rgba(0,212,160,0.08)' }}>
          <div style={{ fontSize: 11, color: teal, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Discipline Dividend</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#888' }}>Actual P/L</span>
            <span style={{ fontSize: 14, color: '#fff' }}>{fmtDollar(analysis.totalPL)}</span>
          </div>
          <div style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: teal }}>{fmtDollar(analysis.abidingPL)}</div>
          <div style={{ fontSize: 12, color: analysis.disciplineDividend > 0 ? red : '#888', marginTop: 4 }}>
            {analysis.disciplineDividend > 0
              ? `You left $${Math.abs(analysis.disciplineDividend).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} on the table`
              : `Rule-breaking trades added $${Math.abs(analysis.disciplineDividend).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2: TIME-OF-DAY HEATMAP ═══ */}
      <div style={{ marginTop: 24, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Time-of-day performance</div>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 20 }}>When your edge is sharpest — and when it bleeds</div>

        <div style={{ display: 'flex', gap: 8 }}>
          {[9, 10, 11, 12, 13, 14, 15].map(h => {
            const d = analysis.hourData[h];
            const pl = d.pl;
            const opacity = d.count === 0 ? 0 : 0.1 + (Math.abs(pl) / analysis.maxAbsHourPL) * 0.4;
            const bg = d.count === 0
              ? '#1a1c23'
              : pl >= 0
                ? `rgba(0,212,160,${opacity.toFixed(2)})`
                : `rgba(255,68,68,${opacity.toFixed(2)})`;

            return (
              <div key={h} style={{
                flex: 1,
                height: 80,
                borderRadius: 8,
                background: bg,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}>
                <span style={{ fontSize: 11, color: '#888' }}>{hourLabels[h]}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: d.count === 0 ? '#444' : pl >= 0 ? teal : red }}>
                  {d.count === 0 ? '—' : fmtDollar(pl)}
                </span>
                <span style={{ fontSize: 11, color: '#666' }}>{d.count} trade{d.count !== 1 ? 's' : ''}</span>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 12, color: '#888', marginTop: 14 }}>
          Best hour: <span style={{ color: teal }}>{hourLabels[analysis.bestHour]} ({fmtDollar(analysis.hourData[analysis.bestHour].pl)})</span>
          {' · '}
          Worst hour: <span style={{ color: red }}>{hourLabels[analysis.worstHour]} ({fmtDollar(analysis.hourData[analysis.worstHour].pl)})</span>
        </div>
      </div>

      {/* ═══ SECTION 3: STRATEGY BREAKDOWN ═══ */}
      <div style={{ marginTop: 24, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Strategy breakdown</div>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>Performance by setup type</div>

        {/* Table header */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e1f2a', padding: '12px 16px' }}>
          <div style={{ flex: 2, fontSize: 11, color: '#666', letterSpacing: '1px', textTransform: 'uppercase' }}>Strategy</div>
          <div style={{ flex: 1, fontSize: 11, color: '#666', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Trades</div>
          <div style={{ flex: 1, fontSize: 11, color: '#666', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Win Rate</div>
          <div style={{ flex: 1, fontSize: 11, color: '#666', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Avg P/L</div>
          <div style={{ flex: 1, fontSize: 11, color: '#666', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Total P/L</div>
          <div style={{ flex: 1, fontSize: 11, color: '#666', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Avg R</div>
        </div>

        {/* Table rows */}
        {analysis.strategies.map((s, i) => {
          const isTop = i === 0;
          const isBottom = i === analysis.strategies.length - 1 && analysis.strategies.length > 1;
          return (
            <div key={s.name} style={{
              display: 'flex',
              padding: '12px 16px',
              borderBottom: '1px solid #1e1f2a',
              background: i % 2 === 0 ? '#0e0f14' : '#12131a',
              borderLeft: isTop ? `3px solid ${teal}` : isBottom ? `3px solid ${red}` : '3px solid transparent',
            }}>
              <div style={{ flex: 2, fontSize: 13, color: '#fff' }}>{s.name}</div>
              <div style={{ flex: 1, fontSize: 13, color: '#888', textAlign: 'right' }}>{s.count}</div>
              <div style={{ flex: 1, fontSize: 13, color: s.winRate >= 50 ? teal : red, textAlign: 'right' }}>{fmtPct(s.winRate)}</div>
              <div style={{ flex: 1, fontSize: 13, color: s.avgPL >= 0 ? teal : red, textAlign: 'right' }}>{fmtDollar(s.avgPL)}</div>
              <div style={{ flex: 1, fontSize: 13, color: s.totalPL >= 0 ? teal : red, textAlign: 'right', fontWeight: 700 }}>{fmtDollar(s.totalPL)}</div>
              <div style={{ flex: 1, fontSize: 13, color: s.avgR >= 0 ? teal : red, textAlign: 'right' }}>{fmtR(s.avgR)}</div>
            </div>
          );
        })}
      </div>

      {/* ═══ SECTIONS 4-6 PLACEHOLDER — will be added in prompt 2 ═══ */}
    </div>
  );
}
