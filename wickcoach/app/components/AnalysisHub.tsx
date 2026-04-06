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
        <p style={{ color: '#bbb', fontFamily: fd, fontSize: 20 }}>Log trades to unlock your Analysis Hub</p>
        <p style={{ color: '#999', fontSize: 14, marginTop: 8 }}>Your behavioral patterns will appear here after you&apos;ve logged enough trades.</p>
      </div>
    );
  }

  const hourLabels: Record<number, string> = { 9: '9AM', 10: '10AM', 11: '11AM', 12: '12PM', 13: '1PM', 14: '2PM', 15: '3PM' };

  return (
    <div style={{ background: '#1a1c23', padding: '32px 48px', minHeight: '100vh', fontFamily: fm }}>
      {/* ═══ HEADER ═══ */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>Analysis</h2>
        <p style={{ color: '#bbb', fontSize: 14, margin: '6px 0 0' }}>Behavioral pattern recognition across your trade history.</p>
        <p style={{ color: '#999', fontSize: 13, margin: '4px 0 0' }}>{analysis.total} executions analyzed</p>
      </div>

      {/* ═══ SECTION 1: HEADLINE ROW ═══ */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Card 1: Total Trades */}
        <div style={{ flex: 1, minWidth: 200, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Total Trades</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{analysis.total}</div>
          <div style={{ fontSize: 14, color: '#bbb', marginTop: 6 }}>Win Rate: {fmtPct(analysis.totalWinRate)}</div>
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
          <div style={{ fontSize: 12, color: teal, marginTop: 4 }}>{fmtR(analysis.abidingR)} total</div>
        </div>

        {/* Card 3: Rule-Breaking */}
        <div style={{ flex: 1, minWidth: 200, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '20px 24px', borderLeft: `3px solid ${red}` }}>
          <div style={{ fontSize: 11, color: red, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Rule-Breaking</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{analysis.ruleBreaking.length}</div>
          <div style={{ fontSize: 13, color: red, marginTop: 6 }}>Win Rate: {fmtPct(analysis.breakingWinRate)}</div>
          <div style={{ fontSize: 12, color: red, marginTop: 4 }}>{fmtR(analysis.breakingR)} total</div>
        </div>

        {/* Card 4: Discipline Dividend */}
        <div style={{ flex: 1, minWidth: 200, background: '#0e0f14', border: '1px solid rgba(0,212,160,0.3)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 0 20px rgba(0,212,160,0.08)' }}>
          <div style={{ fontSize: 11, color: teal, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>What If?</div>
          <div style={{ fontSize: 12, color: '#bbb', marginBottom: 8 }}>Your P/L if you only took disciplined trades</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#bbb' }}>Actual P/L</span>
            <span style={{ fontSize: 14, color: '#fff' }}>{fmtDollar(analysis.totalPL)}</span>
          </div>
          <div style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: teal }}>{fmtDollar(analysis.abidingPL)}</div>
          <div style={{ fontSize: 12, color: analysis.disciplineDividend > 0 ? red : '#bbb', marginTop: 4 }}>
            {analysis.disciplineDividend > 0
              ? `Indiscipline cost you $${Math.abs(analysis.disciplineDividend).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `Rule-breaking trades added $${Math.abs(analysis.disciplineDividend).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2: TIME-OF-DAY HEATMAP ═══ */}
      <div style={{ marginTop: 24, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Time-of-day performance</div>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>When your edge is sharpest — and when it bleeds</div>

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
                <span style={{ fontSize: 12, color: '#ccc' }}>{hourLabels[h]}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: d.count === 0 ? '#444' : '#fff' }}>
                  {d.count === 0 ? '—' : fmtDollar(pl)}
                </span>
                <span style={{ fontSize: 12, color: '#999' }}>{d.count} trade{d.count !== 1 ? 's' : ''}</span>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 13, color: '#bbb', marginTop: 14 }}>
          Best hour: <span style={{ color: teal }}>{hourLabels[analysis.bestHour]} ({fmtDollar(analysis.hourData[analysis.bestHour].pl)})</span>
          {' · '}
          Worst hour: <span style={{ color: red }}>{hourLabels[analysis.worstHour]} ({fmtDollar(analysis.hourData[analysis.worstHour].pl)})</span>
        </div>
      </div>

      {/* ═══ SECTION 3: STRATEGY BREAKDOWN ═══ */}
      <div style={{ marginTop: 24, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Strategy breakdown</div>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>Performance by setup type</div>

        {/* Table header */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e1f2a', padding: '12px 16px' }}>
          <div style={{ flex: 2, fontSize: 12, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>Strategy</div>
          <div style={{ flex: 1, fontSize: 12, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Trades</div>
          <div style={{ flex: 1, fontSize: 12, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Win Rate</div>
          <div style={{ flex: 1, fontSize: 12, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Avg P/L</div>
          <div style={{ flex: 1, fontSize: 12, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Total P/L</div>
          <div style={{ flex: 1, fontSize: 12, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Avg R</div>
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
              <div style={{ flex: 2, fontSize: 14, color: '#fff' }}>{s.name}</div>
              <div style={{ flex: 1, fontSize: 13, color: '#bbb', textAlign: 'right' }}>{s.count}</div>
              <div style={{ flex: 1, fontSize: 14, color: s.winRate >= 50 ? teal : red, textAlign: 'right' }}>{fmtPct(s.winRate)}</div>
              <div style={{ flex: 1, fontSize: 13, color: s.avgPL >= 0 ? teal : red, textAlign: 'right' }}>{fmtDollar(s.avgPL)}</div>
              <div style={{ flex: 1, fontSize: 14, color: s.totalPL >= 0 ? teal : red, textAlign: 'right', fontWeight: 700 }}>{fmtDollar(s.totalPL)}</div>
              <div style={{ flex: 1, fontSize: 13, color: s.avgR >= 0 ? teal : red, textAlign: 'right' }}>{fmtR(s.avgR)}</div>
            </div>
          );
        })}
      </div>

      {/* ═══ SECTION 4: TICKER PERFORMANCE GRID ═══ */}
      <div style={{ marginTop: 24, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Ticker performance</div>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>P/L by asset — find your kryptonite</div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {analysis.tickers.map(tk => {
            const domain = TICKER_DOMAINS[tk.name] || tk.name.toLowerCase() + '.com';
            const positive = tk.totalPL >= 0;
            return (
              <div key={tk.name} style={{
                minWidth: 90,
                maxWidth: 140,
                flex: '1 1 calc(16.66% - 12px)',
                background: '#1a1c23',
                borderRadius: 8,
                padding: '12px 16px',
                textAlign: 'center',
                borderLeft: `3px solid ${positive ? teal : red}`,
              }}>
                <img
                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                  width={32}
                  height={32}
                  style={{ borderRadius: 6, marginBottom: 6, display: 'block', marginLeft: 'auto', marginRight: 'auto', background: '#1e1f2a', objectFit: 'cover' }}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                  alt={tk.name}
                />
                <div style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: '#fff' }}>{tk.name}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: positive ? teal : red, marginTop: 4 }}>{fmtDollar(tk.totalPL)}</div>
                <div style={{ fontSize: 13, color: '#bbb', marginTop: 2 }}>{fmtPct(tk.winRate)} win</div>
                <div style={{ fontSize: 12, color: '#999' }}>{tk.count} trade{tk.count !== 1 ? 's' : ''}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ SECTION 5: FORENSIC DISSECTION ═══ */}
      <div style={{ marginTop: 24, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Forensic dissection</div>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>Your best executions vs your worst violations</div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {/* Left: High Integrity */}
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ color: teal, fontSize: 10 }}>●</span>
              <span style={{ fontSize: 12, color: teal, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>High Integrity Executions</span>
            </div>

            {analysis.topWins.length === 0 && (
              <div style={{ fontSize: 12, color: '#555', padding: '12px 0' }}>No qualifying trades found</div>
            )}

            {analysis.topWins.map(t => {
              const r = t.riskAmount ? t.pl / t.riskAmount : 0;
              return (
                <div key={t.id} style={{ background: '#1a1c23', borderLeft: `3px solid ${teal}`, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={`https://www.google.com/s2/favicons?domain=${TICKER_DOMAINS[t.ticker] || t.ticker.toLowerCase() + '.com'}&sz=64`} width={24} height={24} style={{ borderRadius: 4, background: '#1e1f2a', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} alt={t.ticker} />
                      <span style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff' }}>{t.ticker}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: teal }}>{fmtDollar(t.pl)}</span>
                      <span style={{ fontSize: 12, color: '#bbb', marginLeft: 8 }}>{fmtR(r)}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{t.date} · {t.time}</div>
                  <div style={{ fontSize: 13, color: '#bbb', marginTop: 4 }}>{t.strategy}</div>
                  <span style={{
                    display: 'inline-block', marginTop: 6,
                    background: 'rgba(0,212,160,0.15)', color: teal,
                    padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '1px',
                  }}>{getSetupTag(t.journal)}</span>
                  <div style={{ fontSize: 12, color: '#aaa', fontStyle: 'italic', marginTop: 8, maxHeight: 80, overflow: 'hidden' }}>
                    &quot;{t.journal.length > 150 ? t.journal.slice(0, 150) + '...' : t.journal}&quot;
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Protocol Violations */}
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ color: red, fontSize: 10 }}>▲</span>
              <span style={{ fontSize: 12, color: red, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>Protocol Violations</span>
            </div>

            {analysis.worstLosses.length === 0 && (
              <div style={{ fontSize: 12, color: '#555', padding: '12px 0' }}>No violations detected</div>
            )}

            {analysis.worstLosses.map(t => {
              const r = t.riskAmount ? t.pl / t.riskAmount : 0;
              return (
                <div key={t.id} style={{ background: '#1a1c23', borderLeft: `3px solid ${red}`, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={`https://www.google.com/s2/favicons?domain=${TICKER_DOMAINS[t.ticker] || t.ticker.toLowerCase() + '.com'}&sz=64`} width={24} height={24} style={{ borderRadius: 4, background: '#1e1f2a', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} alt={t.ticker} />
                      <span style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff' }}>{t.ticker}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: red }}>{fmtDollar(t.pl)}</span>
                      <span style={{ fontSize: 12, color: '#bbb', marginLeft: 8 }}>{fmtR(r)}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{t.date} · {t.time}</div>
                  <div style={{ fontSize: 13, color: '#bbb', marginTop: 4 }}>{t.strategy}</div>
                  <span style={{
                    display: 'inline-block', marginTop: 6,
                    background: 'rgba(255,68,68,0.15)', color: red,
                    padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '1px',
                  }}>{getViolationTag(t.journal)}</span>
                  <div style={{ fontSize: 12, color: '#aaa', fontStyle: 'italic', marginTop: 8, maxHeight: 80, overflow: 'hidden' }}>
                    &quot;{t.journal.length > 150 ? t.journal.slice(0, 150) + '...' : t.journal}&quot;
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ SECTION 6: PSYCH PROFILE + WICKCOACH AI ═══ */}
      <div style={{ marginTop: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>

        {/* Left: Psych Profile Radar */}
        <div style={{ flex: 1, minWidth: 300, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '24px 28px' }}>
          <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Psych profile</div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width={280} height={280} viewBox="-30 -30 340 340">
              {(() => {
                const cx = 140, cy = 140, maxR = 120;
                const scores = analysis.psychScores;
                const n = scores.length;
                const angleStep = (2 * Math.PI) / n;
                const startAngle = -Math.PI / 2;

                const pt = (i: number, pct: number) => {
                  const a = startAngle + i * angleStep;
                  const d = (pct / 100) * maxR;
                  return { x: cx + d * Math.cos(a), y: cy + d * Math.sin(a) };
                };

                const gridLevels = [33, 66, 100];
                const elements: React.ReactNode[] = [];

                // Grid pentagons
                gridLevels.forEach(level => {
                  const pts = scores.map((_, i) => pt(i, level));
                  elements.push(
                    <polygon key={`grid-${level}`} points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#1e1f2a" strokeWidth={0.5} />
                  );
                });

                // Axis lines
                scores.forEach((_, i) => {
                  const p = pt(i, 100);
                  elements.push(<line key={`axis-${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#1e1f2a" strokeWidth={0.5} />);
                });

                // Data polygon
                const dataPts = scores.map((s, i) => pt(i, s.value));
                elements.push(
                  <polygon key="data" points={dataPts.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(0,212,160,0.15)" stroke={teal} strokeWidth={1.5} />
                );

                // Data dots
                dataPts.forEach((p, i) => {
                  elements.push(<circle key={`dot-${i}`} cx={p.x} cy={p.y} r={3} fill={teal} />);
                });

                // Labels
                scores.forEach((s, i) => {
                  const p = pt(i, 130);
                  elements.push(
                    <text key={`label-${i}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={12} fontFamily={fm}>{s.label}</text>
                  );
                });

                return elements;
              })()}
            </svg>
          </div>

          <div style={{ textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 12 }}>
            {analysis.psychScores.map((s, i) => (
              <span key={s.abbr}>{s.abbr}: {s.value}{i < analysis.psychScores.length - 1 ? ' | ' : ''}</span>
            ))}
          </div>
        </div>

        {/* Right: WickCoach AI */}
        <div style={{
          flex: 1, minWidth: 300,
          background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '24px 28px',
          backgroundImage: 'radial-gradient(rgba(0,212,160,0.07) 1px, transparent 1px)',
          backgroundSize: '4px 4px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: teal, fontSize: 16 }}>✦</span>
            <span style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>WickCoach AI</span>
          </div>
          <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 6 }}>
            Dataset Analysis ({analysis.total} Executions)
          </div>

          {/* AI Summary */}
          <div style={{
            background: 'rgba(0,212,160,0.05)', border: '1px solid rgba(0,212,160,0.15)',
            borderRadius: 8, padding: 16, marginTop: 16,
            fontSize: 13, color: '#ccc', lineHeight: '1.6',
          }}>
            I&apos;ve reviewed your latest {analysis.total} trades. Your isolated edge is highly profitable: <span style={{ color: teal, fontWeight: 700 }}>{analysis.topSetupTag}</span> and <span style={{ color: teal, fontWeight: 700 }}>{analysis.secondSetupTag}</span> entries yield a {fmtPct(analysis.abidingWinRate)} win rate. However, total expectancy is bleeding out due to poor discipline when wrong — {analysis.ruleBreaking.length} rule-breaking trades account for <span style={{ color: red, fontWeight: 700 }}>{fmtR(analysis.breakingR)}</span> in capital destruction.
          </div>

          {/* Critical Behavioral Flag */}
          <div style={{
            marginTop: 20, borderLeft: `4px solid ${red}`,
            background: 'rgba(255,68,68,0.05)', padding: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: red, marginBottom: 8 }}>
              The &quot;{analysis.dominantFlawName}&quot; Pattern
            </div>
            <div style={{ fontSize: 13, color: '#ccc', lineHeight: '1.6' }}>
              Your journals repeatedly flag <span style={{ fontWeight: 700 }}>{analysis.dominantFlawName}</span>. This pattern appears most frequently on {analysis.dominantTickers.length > 0 ? (
                <>{analysis.dominantTickers.map((tk, i) => (
                  <span key={tk} style={{ fontWeight: 700 }}>{tk}{i < analysis.dominantTickers.length - 1 ? ' and ' : ''}</span>
                ))}</>
              ) : 'multiple tickers'}, accounting for <span style={{ color: red, fontWeight: 700 }}>{fmtR(analysis.dominantFlawData.totalR)}</span> in capital destruction.
            </div>
          </div>

          {/* Dominant Flaw */}
          <div style={{
            marginTop: 16, background: '#1a1c23', border: '1px solid rgba(255,68,68,0.3)',
            borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ color: red, fontSize: 14, fontWeight: 700 }}>!</span>
            </div>
            <span style={{ fontSize: 12, color: '#bbb' }}>Dominant flaw</span>
            <span style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: red }}>{analysis.dominantFlawName}</span>
            <span style={{
              background: 'rgba(255,68,68,0.15)', color: red,
              padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '1px',
            }}>CRITICAL LEAK</span>
          </div>

          {/* Chat Input (non-functional) */}
          <div style={{ marginTop: 20, display: 'flex' }}>
            <input
              readOnly
              placeholder="Ask WickCoach..."
              style={{
                flex: 1, background: '#1a1c23', border: '1px solid #2a2b32',
                borderRadius: '8px 0 0 8px', padding: '10px 14px',
                color: '#fff', fontSize: 13, fontFamily: fm, outline: 'none',
              }}
            />
            <div style={{
              background: teal, borderRadius: '0 8px 8px 0', padding: '10px 16px',
              color: '#0e0f14', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}>→</div>
          </div>
        </div>
      </div>
    </div>
  );
}
