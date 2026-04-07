'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';

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
  DIS: 'disney.com', BA: 'boeing.com', JPM: 'jpmorgan.com', V: 'visa.com',
  WMT: 'walmart.com', COIN: 'coinbase.com', PLTR: 'palantir.com', SOFI: 'sofi.com',
  CRM: 'salesforce.com', COST: 'costco.com', HD: 'homedepot.com', UNH: 'unitedhealthgroup.com',
  INTC: 'intel.com', PYPL: 'paypal.com', UBER: 'uber.com', SQ: 'squareup.com',
  SHOP: 'shopify.com', SNAP: 'snap.com', ROKU: 'roku.com', ZM: 'zoom.us',
  ABNB: 'airbnb.com', LYFT: 'lyft.com', PINS: 'pinterest.com', RBLX: 'roblox.com',
  NET: 'cloudflare.com', CRWD: 'crowdstrike.com', DDOG: 'datadoghq.com', SNOW: 'snowflake.com',
  RIVN: 'rivian.com', LCID: 'lucidmotors.com', NIO: 'nio.com', HOOD: 'robinhood.com',
  MARA: 'mara.com', RIOT: 'riotplatforms.com', IWM: 'ishares.com', ARKK: 'ark-invest.com',
  XOM: 'exxonmobil.com', CVX: 'chevron.com', KO: 'coca-cola.com', PEP: 'pepsico.com',
  MCD: 'mcdonalds.com', NKE: 'nike.com', SBUX: 'starbucks.com', TGT: 'target.com',
  BABA: 'alibaba.com', JD: 'jd.com', PDD: 'pinduoduo.com', LI: 'lixiang.com',
  F: 'ford.com', GM: 'gm.com', AAL: 'aa.com', DAL: 'delta.com', UAL: 'united.com',
  GS: 'goldmansachs.com', MS: 'morganstanley.com', C: 'citigroup.com', BAC: 'bankofamerica.com',
  WFC: 'wellsfargo.com', SCHW: 'schwab.com', T: 'att.com', VZ: 'verizon.com',
  TMUS: 't-mobile.com', PANW: 'paloaltonetworks.com', ZS: 'zscaler.com',
  SMCI: 'supermicro.com', ARM: 'arm.com', AVGO: 'broadcom.com', MU: 'micron.com',
  QCOM: 'qualcomm.com', TXN: 'ti.com', MRVL: 'marvell.com', ON: 'onsemi.com',
};

function getTickerLogoUrl(ticker: string, size: number = 64): string {
  const domain = TICKER_DOMAINS[ticker] || ticker.toLowerCase() + '.com';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

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
  const [heatmapMode, setHeatmapMode] = useState<'timeline' | 'best' | 'worst'>('timeline');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showAllStrategies, setShowAllStrategies] = useState(false);
  const [showAllTickers, setShowAllTickers] = useState(false);
  const [obsWindow, setObsWindow] = useState<number>(0); // 0 = All
  const [logoFails, setLogoFails] = useState<Record<string, number>>({});
  const [selectedPattern, setSelectedPattern] = useState<{ side: 'friction' | 'momentum'; name: string; key: string } | null>(null);
  const [evidenceLogoFails, setEvidenceLogoFails] = useState<Record<string, number>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
    const hourData: Record<number, { pl: number; count: number; wins: number; losses: number; ruleBreaking: number }> = {};
    for (let h = 9; h <= 15; h++) hourData[h] = { pl: 0, count: 0, wins: 0, losses: 0, ruleBreaking: 0 };
    trades.forEach(t => {
      const h = parseHour(t.time);
      if (h >= 9 && h <= 15) {
        hourData[h].pl += t.pl;
        hourData[h].count += 1;
        if (t.result === 'WIN') hourData[h].wins += 1;
        if (t.result === 'LOSS') hourData[h].losses += 1;
        if (isRuleBreaking(t.journal)) hourData[h].ruleBreaking += 1;
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

    // Top wins (process) and worst losses (impulse)
    const topWins = [...ruleAbiding].filter(t => t.result === 'WIN').sort((a, b) => b.pl - a.pl).slice(0, 2);
    const worstLosses = [...ruleBreaking].filter(t => t.result === 'LOSS').sort((a, b) => a.pl - b.pl).slice(0, 2);

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
    };
  }, [trades]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages.length, chatLoading]);

  const sendChatMessage = async (text: string) => {
    if (!text.trim() || chatLoading) return;
    const userMsg = text.trim();
    setChatInput('');
    const updatedMessages = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(updatedMessages);
    setChatLoading(true);
    try {
      // Build trades context string for the API
      const tradesContext = trades.map(t =>
        `${t.date} ${t.time} | ${t.ticker} ${t.direction} ${t.strategy} | ${t.contracts} contracts | Entry $${t.entryPrice} → Exit $${t.exitPrice} | P/L: $${t.pl.toFixed(2)} | R:R ${t.riskReward} | Journal: ${t.journal}`
      ).join('\n');
      const goals = JSON.parse(localStorage.getItem('wickcoach_goals') || '[]');
      const goalsContext = goals.length > 0 ? goals.map((g: { title: string }) => g.title).join(', ') : '';

      // Send only user/assistant messages (skip the pre-loaded initial message from the messages array)
      const apiMessages = updatedMessages
        .filter(m => m.role === 'user' || (m.role === 'assistant' && updatedMessages.indexOf(m) > 0))
        .map(m => ({ role: m.role, content: m.content }));
      // Always include at least the current user message
      if (apiMessages.length === 0 || apiMessages[apiMessages.length - 1].role !== 'user') {
        apiMessages.push({ role: 'user', content: userMsg });
      }

      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'trades',
          messages: apiMessages,
          tradesContext,
          goalsContext,
        }),
      });
      const data = await res.json();
      const reply = data.reply || 'No response received.';
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Unable to connect to WickCoach. Check your API key in .env.local' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!analysis) {
    return (
      <div style={{ background: '#1a1c23', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: fm }}>
        <p style={{ color: '#bbb', fontFamily: fd, fontSize: 20 }}>Log trades to unlock Analysis</p>
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
          <div style={{ fontSize: 12, color: '#aaa', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Total Trades</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{analysis.total}</div>
          <div style={{ fontSize: 14, color: '#bbb', marginTop: 6 }}>Win Rate: {fmtPct(analysis.totalWinRate)}</div>
          {/* Win/Loss/BE bar */}
          <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 10 }}>
            <div style={{ width: `${(analysis.totalWins / analysis.total) * 100}%`, background: teal }} />
            <div style={{ width: `${(analysis.totalLosses / analysis.total) * 100}%`, background: red }} />
            <div style={{ width: `${(analysis.totalBE / analysis.total) * 100}%`, background: '#4b5563' }} />
          </div>
        </div>

        {/* Card 2: Process */}
        <div style={{ flex: 1, minWidth: 200, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '20px 24px', borderLeft: `3px solid ${teal}` }}>
          <div style={{ fontSize: 12, color: teal, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Process</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{analysis.ruleAbiding.length}</div>
          <div style={{ fontSize: 13, color: teal, marginTop: 6 }}>Win Rate: {fmtPct(analysis.abidingWinRate)}</div>
          <div style={{ fontSize: 12, color: teal, marginTop: 4 }}>{fmtR(analysis.abidingR)} total</div>
        </div>

        {/* Card 3: Impulse */}
        <div style={{ flex: 1, minWidth: 200, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '20px 24px', borderLeft: `3px solid ${red}` }}>
          <div style={{ fontSize: 12, color: red, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Impulse</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{analysis.ruleBreaking.length}</div>
          <div style={{ fontSize: 13, color: red, marginTop: 6 }}>Win Rate: {fmtPct(analysis.breakingWinRate)}</div>
          <div style={{ fontSize: 12, color: red, marginTop: 4 }}>{fmtR(analysis.breakingR)} total</div>
        </div>

        {/* Card 4: What If? */}
        <div style={{ flex: 1, minWidth: 200, background: '#0e0f14', border: '1px solid rgba(0,212,160,0.3)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 0 20px rgba(0,212,160,0.08)' }}>
          <div style={{ fontSize: 12, color: teal, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>What If?</div>
          <div style={{ fontSize: 12, color: '#bbb', marginBottom: 8 }}>Your P/L if you only took process trades</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#bbb' }}>Actual P/L</span>
            <span style={{ fontSize: 14, color: '#fff' }}>{fmtDollar(analysis.totalPL)}</span>
          </div>
          <div style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: teal }}>{fmtDollar(analysis.abidingPL)}</div>
          <div style={{ fontSize: 12, color: analysis.disciplineDividend > 0 ? red : '#bbb', marginTop: 4 }}>
            {analysis.disciplineDividend > 0
              ? `Indiscipline cost you $${Math.abs(analysis.disciplineDividend).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `Impulse trades added $${Math.abs(analysis.disciplineDividend).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2: STRATEGY BREAKDOWN + TICKER PERFORMANCE ═══ */}
      <div style={{ marginTop: 24, display: 'flex', gap: 20, flexWrap: 'wrap' }}>

        {/* LEFT: Strategy Breakdown — 60% */}
        <div style={{ flex: '0 0 60%', minWidth: 300, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '24px 28px', boxSizing: 'border-box' }}>
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
          {(showAllStrategies ? analysis.strategies : analysis.strategies.slice(0, 6)).map((s, i) => {
            const isTop = i === 0;
            const visibleStrategies = showAllStrategies ? analysis.strategies : analysis.strategies.slice(0, 6);
            const isBottom = i === visibleStrategies.length - 1 && visibleStrategies.length > 1;
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
          {analysis.strategies.length > 6 && (
            <div onClick={() => setShowAllStrategies(!showAllStrategies)} style={{ color: teal, fontSize: 12, cursor: 'pointer', marginTop: 12, textAlign: 'center' }}>
              {showAllStrategies ? 'Show less ↑' : 'Show all ↓'}
            </div>
          )}
        </div>

        {/* RIGHT: Ticker Performance — 40% */}
        <div style={{ flex: 1, minWidth: 300, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '24px 28px', boxSizing: 'border-box' }}>
          <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Ticker performance</div>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>P/L by asset</div>

          {(showAllTickers ? analysis.tickers : analysis.tickers.slice(0, 8)).map((tk, i, arr) => {
            const positive = tk.totalPL >= 0;
            const failLevel = logoFails[tk.name] || 0;
            return (
              <div
                key={tk.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px',
                  borderBottom: i < arr.length - 1 ? '1px solid #1e1f2a' : 'none',
                  borderLeft: `3px solid ${positive ? teal : red}`,
                  borderRadius: 0,
                  cursor: 'default',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1a1c23'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Logo with fallback */}
                <div style={{ width: 28, height: 28, flexShrink: 0, position: 'relative' }}>
                  {failLevel < 1 && (
                    <img
                      src={getTickerLogoUrl(tk.name)}
                      width={28} height={28}
                      style={{ borderRadius: 6, objectFit: 'cover', display: 'block', background: '#1a1c23' }}
                      onError={() => setLogoFails(prev => ({ ...prev, [tk.name]: 1 }))}
                      alt={tk.name}
                    />
                  )}
                  {failLevel >= 1 && (
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: 'rgba(0,212,160,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: teal }}>{tk.name.charAt(0)}</span>
                    </div>
                  )}
                </div>

                <div style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: '#fff', width: 50, flexShrink: 0 }}>{tk.name}</div>
                <div style={{ fontSize: 12, color: '#999', flex: 1 }}>{tk.count} trades · {fmtPct(tk.winRate)} win</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: positive ? teal : red, textAlign: 'right', flexShrink: 0 }}>{fmtDollar(tk.totalPL)}</div>
              </div>
            );
          })}
          {analysis.tickers.length > 8 && (
            <div onClick={() => setShowAllTickers(!showAllTickers)} style={{ color: teal, fontSize: 12, cursor: 'pointer', marginTop: 12, textAlign: 'center' }}>
              {showAllTickers ? 'Show less ↑' : 'Show all ↓'}
            </div>
          )}
        </div>
      </div>

      {/* ═══ SECTION 3: TIME-OF-DAY HEATMAP ═══ */}
      <div style={{ marginTop: 24, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Time-of-day performance</div>
            <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>When your edge is sharpest — and when it bleeds</div>
          </div>
          <div style={{ display: 'flex', background: '#1a1c23', borderRadius: 8, padding: 3, gap: 2 }}>
            <button
              onClick={() => setHeatmapMode('timeline')}
              style={{
                padding: '6px 16px', borderRadius: 6, fontSize: 12, fontFamily: fm, cursor: 'pointer', border: 'none',
                transition: 'all 0.2s',
                background: heatmapMode === 'timeline' ? '#2a2b32' : 'transparent',
                color: heatmapMode === 'timeline' ? '#fff' : '#999',
                fontWeight: heatmapMode === 'timeline' ? 'bold' : 'normal',
              }}
            >Timeline</button>
            <button
              onClick={() => setHeatmapMode('best')}
              style={{
                padding: '6px 16px', borderRadius: 6, fontSize: 12, fontFamily: fm, cursor: 'pointer', border: 'none',
                transition: 'all 0.2s',
                background: heatmapMode === 'best' ? teal : 'transparent',
                color: heatmapMode === 'best' ? '#0e0f14' : '#999',
                fontWeight: heatmapMode === 'best' ? 'bold' : 'normal',
              }}
            >Best hours</button>
            <button
              onClick={() => setHeatmapMode('worst')}
              style={{
                padding: '6px 16px', borderRadius: 6, fontSize: 12, fontFamily: fm, cursor: 'pointer', border: 'none',
                transition: 'all 0.2s',
                background: heatmapMode === 'worst' ? red : 'transparent',
                color: heatmapMode === 'worst' ? '#fff' : '#999',
                fontWeight: heatmapMode === 'worst' ? 'bold' : 'normal',
              }}
            >Worst hours</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {(() => {
            const hours = [9, 10, 11, 12, 13, 14, 15];
            const sorted = heatmapMode === 'best'
              ? [...hours].sort((a, b) => analysis.hourData[b].pl - analysis.hourData[a].pl)
              : heatmapMode === 'worst'
                ? [...hours].sort((a, b) => analysis.hourData[a].pl - analysis.hourData[b].pl)
                : hours;

            return sorted.map(h => {
              const d = analysis.hourData[h];
              const pl = d.pl;
              const opacity = d.count === 0 ? 0 : 0.15 + (Math.abs(pl) / analysis.maxAbsHourPL) * 0.35;
              const bg = d.count === 0
                ? '#1a1c23'
                : heatmapMode === 'best'
                  ? `rgba(0,212,160,${opacity.toFixed(2)})`
                  : heatmapMode === 'worst'
                    ? `rgba(255,68,68,${opacity.toFixed(2)})`
                    : pl >= 0
                      ? `rgba(0,212,160,${opacity.toFixed(2)})`
                      : `rgba(255,68,68,${opacity.toFixed(2)})`;

              return (
                <div key={h} style={{
                  flex: 1, height: 65, borderRadius: 8, background: bg,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                }}>
                  <span style={{ fontSize: 12, color: '#ccc' }}>{hourLabels[h]}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: d.count === 0 ? '#444' : '#fff' }}>
                    {d.count === 0 ? '—' : fmtDollar(pl)}
                  </span>
                  <span style={{ fontSize: 12, color: '#999' }}>{d.count} trade{d.count !== 1 ? 's' : ''}</span>
                  {d.count > 0 && (
                    <span style={{ fontSize: 12, color: heatmapMode === 'worst' ? red : '#999' }}>
                      {d.wins}W / {d.losses}L
                    </span>
                  )}
                </div>
              );
            });
          })()}
        </div>

        {/* Session labels — only in timeline mode */}
        {heatmapMode === 'timeline' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '0 4px' }}>
            <span style={{ color: teal, fontSize: 12, letterSpacing: '1px' }}>OPEN</span>
            <span style={{ color: '#999', fontSize: 12, letterSpacing: '1px' }}>MIDDAY</span>
            <span style={{ color: '#ffb400', fontSize: 12, letterSpacing: '1px' }}>CLOSE</span>
          </div>
        )}

        <div style={{ fontSize: 13, color: '#bbb', marginTop: 14 }}>
          {heatmapMode === 'worst' ? (
            <>
              Biggest bleed: <span style={{ color: red }}>{hourLabels[analysis.worstHour]} ({fmtDollar(analysis.hourData[analysis.worstHour].pl)})</span>
              {' · '}
              <span style={{ color: red }}>{analysis.hourData[analysis.worstHour].ruleBreaking} of {analysis.hourData[analysis.worstHour].count}</span> trades were impulse
            </>
          ) : (
            <>
              Best hour: <span style={{ color: teal }}>{hourLabels[analysis.bestHour]} ({fmtDollar(analysis.hourData[analysis.bestHour].pl)})</span>
              {' · '}
              Worst hour: <span style={{ color: red }}>{hourLabels[analysis.worstHour]} ({fmtDollar(analysis.hourData[analysis.worstHour].pl)})</span>
            </>
          )}
        </div>
      </div>

      {/* ═══ SECTION 4: AI OBSERVATIONS — TENSION DIAGRAM ═══ */}
      {(() => {
        const windowOptions = [-1, 5, 10, 15, 30, 50, 100, 0] as const;
        const windowLabels: Record<number, string> = { '-1': 'This week', 5: '5', 10: '10', 15: '15', 30: '30', 50: '50', 100: '100', 0: 'All' };
        const sortedByDate = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const windowTrades = (() => {
          if (obsWindow === -1) {
            const today = new Date();
            const day = today.getDay();
            const monday = new Date(today);
            monday.setDate(today.getDate() - ((day === 0 ? 7 : day) - 1));
            monday.setHours(0, 0, 0, 0);
            return sortedByDate.filter(t => new Date(t.date) >= monday);
          }
          return obsWindow > 0 ? sortedByDate.slice(0, obsWindow) : sortedByDate;
        })();
        const isThisWeek = obsWindow === -1;

        const processTrades = windowTrades.filter(t => !isRuleBreaking(t.journal));
        const processWinRate = processTrades.length > 0 ? (processTrades.filter(t => t.result.toUpperCase() === 'WIN').length / processTrades.length) * 100 : 0;
        const processAvgR = processTrades.length > 0 ? processTrades.reduce((s, t) => s + (t.riskAmount ? t.pl / t.riskAmount : 0), 0) / processTrades.length : 0;

        const negPatterns: Array<{ name: string; key: string; keywords: string[]; trades: Trade[] }> = [
          { name: 'FOMO / Chasing', key: 'fomo', keywords: ['fomo', 'chased', 'afraid to miss', 'too eager'], trades: [] },
          { name: 'Revenge Trading', key: 'revenge', keywords: ['revenge', 'spite', 'after my last loss', 'dig out of the hole'], trades: [] },
          { name: 'Stubborn Holds', key: 'stubborn', keywords: ['stubborn', 'doubled down', 'held hoping', 'froze instead'], trades: [] },
          { name: 'Impulse Entries', key: 'impulse', keywords: ['frustrated', 'impatient', 'forced the trade', 'anxiety'], trades: [] },
          { name: 'Oversizing', key: 'oversize', keywords: ['sized up 3x', 'bigger than planned', 'doubled my normal size', 'outsized'], trades: [] },
          { name: 'Ignoring Rules', key: 'ignoring', keywords: ['ignored my own rule', 'ignored the', 'without waiting', 'before full confirmation'], trades: [] },
        ];
        negPatterns.forEach(p => { p.trades = windowTrades.filter(t => { const l = t.journal.toLowerCase(); return p.keywords.some(kw => l.includes(kw)); }); });
        const activeNeg = negPatterns.filter(p => p.trades.length >= 3).sort((a, b) => b.trades.length - a.trades.length).slice(0, 4);

        const posPatterns: Array<{ name: string; key: string; keywords: string[]; trades: Trade[] }> = [
          { name: 'Patience', key: 'patience', keywords: ['waited', 'patient', 'patiently', 'waited for the full signal', 'waited for clearing bars'], trades: [] },
          { name: 'Clean Execution', key: 'clean', keywords: ['textbook', 'defined risk', 'pre-planned', 'followed every rule', 'per my rules', 'zero emotions', 'pure process'], trades: [] },
          { name: 'Stop Discipline', key: 'stops', keywords: ['took the loss cleanly', 'stopped out at', 'cut the loss', 'cut it fast', 'stayed within risk'], trades: [] },
          { name: 'Trusting Process', key: 'trust', keywords: ['trusting the process', 'followed the playbook', 'discipline is slowly returning', 'rebuild trust'], trades: [] },
          { name: 'Emotional Awareness', key: 'awareness', keywords: ['no anxiety', 'no regrets', 'confidence was high', 'clean mind'], trades: [] },
        ];
        posPatterns.forEach(p => { p.trades = windowTrades.filter(t => { const l = t.journal.toLowerCase(); return p.keywords.some(kw => l.includes(kw)); }); });
        const activePos = posPatterns.filter(p => p.trades.length >= 3).sort((a, b) => b.trades.length - a.trades.length).slice(0, 4);

        const maxNegCount = Math.max(...activeNeg.map(p => p.trades.length), 1);
        const maxPosCount = Math.max(...activePos.map(p => p.trades.length), 1);
        const greenTotal = activePos.reduce((s, p) => s + p.trades.length, 0);
        const redTotal = activeNeg.reduce((s, p) => s + p.trades.length, 0);
        const psyScore = (greenTotal + redTotal) > 0 ? Math.round((greenTotal / (greenTotal + redTotal)) * 100) : 50;
        const balanceColor = psyScore >= 55 ? teal : psyScore <= 45 ? red : '#ffb400';
        const balanceFill = psyScore >= 55 ? 'rgba(0,212,160,0.3)' : psyScore <= 45 ? 'rgba(255,68,68,0.3)' : 'rgba(255,180,0,0.3)';

        // Helper: case-insensitive win check
        const isWin = (t: Trade) => t.result.toUpperCase() === 'WIN';
        // Helper: cost dollar (always positive, no sign prefix)
        const fmtCost = (n: number) => '$' + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Short insight generators
        const negShort = (p: { key: string; trades: Trade[] }) => {
          const count = p.trades.length;
          const wins = p.trades.filter(isWin).length;
          const winRate = count > 0 ? Math.round((wins / count) * 100) : 0;
          const totalPL = p.trades.reduce((s, t) => s + t.pl, 0);
          const losers = p.trades.filter(t => t.pl < 0);
          const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((s, t) => s + t.pl, 0) / losers.length) : 0;
          const cleanLosses = processTrades.filter(t => t.pl < 0);
          const cleanAvgLoss = cleanLosses.length > 0 ? Math.abs(cleanLosses.reduce((s, t) => s + t.pl, 0) / cleanLosses.length) : 0;
          const avgR = count > 0 ? p.trades.reduce((s, t) => s + (t.riskAmount ? t.pl / t.riskAmount : 0), 0) / count : 0;
          const ratio = cleanAvgLoss > 0 ? (avgLoss / cleanAvgLoss).toFixed(1) : '?';
          switch (p.key) {
            case 'fomo': return `Win rate drops to ${winRate}% when chasing`;
            case 'revenge': return totalPL <= 0 ? `Cost you ${fmtCost(totalPL)} this window` : `Made ${fmtCost(totalPL)} — but process was broken`;
            case 'stubborn': return `Avg loss ${ratio}x worse than clean exits`;
            case 'impulse': return `${winRate}% win rate vs ${Math.round(processWinRate)}% patient`;
            case 'oversize': return `Avg loss ${fmtCost(avgLoss)} when oversized`;
            case 'ignoring': return `${fmtR(avgR)} vs ${fmtR(processAvgR)} expectancy gap`;
            default: return '';
          }
        };
        const posShort = (p: { key: string; trades: Trade[] }) => {
          const count = p.trades.length;
          const wins = p.trades.filter(isWin).length;
          const winRate = count > 0 ? Math.round((wins / count) * 100) : 0;
          const avgR = count > 0 ? p.trades.reduce((s, t) => s + (t.riskAmount ? t.pl / t.riskAmount : 0), 0) / count : 0;
          const losers = p.trades.filter(t => t.pl < 0);
          const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((s, t) => s + t.pl, 0) / losers.length) : 0;
          switch (p.key) {
            case 'patience': return `${winRate}% win rate when you wait`;
            case 'clean': return `Avg ${fmtR(avgR)} per textbook trade`;
            case 'stops': return `Clean losses avg ${fmtCost(avgLoss)}`;
            case 'trust': return `${count} entries, resilience building`;
            case 'awareness': return `Self-aware on ${count} trades`;
            default: return '';
          }
        };

        // SVG layout constants
        const cx = 450, cy = 210;
        const negSpacing = activeNeg.length > 0 ? Math.min(70, 280 / activeNeg.length) : 70;
        const posSpacing = activePos.length > 0 ? Math.min(70, 280 / activePos.length) : 70;
        const negStartY = cy - ((activeNeg.length - 1) * negSpacing) / 2;
        const posStartY = cy - ((activePos.length - 1) * posSpacing) / 2;

        // Goals connection
        let goals: Array<{ id: string; title: string; goalType: string }> = [];
        try { const g = localStorage.getItem('wickcoach_goals'); if (g) goals = JSON.parse(g); } catch { /* empty */ }

        return (
          <div style={{ marginTop: 24, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, padding: '28px 32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>WickCoach observations</div>
                <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>AI-detected behavioral themes vs your stated goals</div>
              </div>
              <div style={{ display: 'flex', background: '#1a1c23', borderRadius: 8, padding: 3, gap: 2 }}>
                {windowOptions.map(w => {
                  const isActive = obsWindow === w;
                  const isWeekPill = w === -1;
                  return (
                    <button key={w} onClick={() => setObsWindow(w)} style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 12, fontFamily: fm, cursor: 'pointer', border: 'none', minWidth: 32, textAlign: 'center',
                      background: isActive ? (isWeekPill ? teal : '#2a2b32') : 'transparent',
                      color: isActive ? (isWeekPill ? '#0e0f14' : '#fff') : '#999',
                      fontWeight: isActive ? 'bold' : 'normal',
                    }}>{windowLabels[w]}</button>
                  );
                })}
              </div>
            </div>

            {/* Empty state for This week */}
            {isThisWeek && windowTrades.length === 0 && (
              <div style={{ marginTop: 24, padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ color: '#999', fontSize: 14 }}>No trades logged this week yet. Start trading and journaling to see your weekly psychology snapshot.</div>
              </div>
            )}

            {/* SVG Tension Diagram */}
            {(!isThisWeek || windowTrades.length > 0) && <svg width="100%" height="420" viewBox="0 0 900 420" style={{ marginTop: 24 }}>
              {/* Side labels */}
              <text x={100} y={30} fill={red} fontSize={12} fontFamily={fm} letterSpacing={2}>FRICTION</text>
              <text x={700} y={30} fill={teal} fontSize={12} fontFamily={fm} letterSpacing={2}>MOMENTUM</text>

              {/* Center line */}
              <line x1={100} y1={cy} x2={800} y2={cy} stroke="#2a2b32" strokeWidth={1} />

              {/* RED BARS — extend left from center */}
              {activeNeg.map((p, i) => {
                const barY = negStartY + i * negSpacing;
                const barW = Math.max((p.trades.length / maxNegCount) * 240, 30);
                const baseOpacity = 0.3 + (p.trades.length / maxNegCount) * 0.5;
                const barX = cx - 10 - barW;
                const isSelected = selectedPattern?.key === p.key && selectedPattern?.side === 'friction';
                const isDimmed = selectedPattern !== null && !isSelected;
                const gOpacity = isDimmed ? 0.3 : 1;
                return (
                  <g key={p.key} style={{ cursor: 'pointer', opacity: gOpacity }} onClick={() => setSelectedPattern(isSelected ? null : { side: 'friction', name: p.name, key: p.key })}>
                    <line x1={cx - 10} y1={barY + 14} x2={cx} y2={cy} stroke={red} strokeWidth={0.5} opacity={0.3} />
                    <rect x={barX} y={barY} width={barW} height={28} rx={4} fill={red} opacity={isSelected ? 1 : baseOpacity} stroke={isSelected ? red : 'none'} strokeWidth={isSelected ? 2 : 0} />
                    <text x={barX - 8} y={barY + 12} fill={red} fontSize={12} fontFamily={fd} fontWeight={700} textAnchor="end">{p.name}</text>
                    <text x={barX - 8} y={barY + 24} fill="#999" fontSize={12} fontFamily={fm} textAnchor="end">{p.trades.length} trades</text>
                    <text x={barX} y={barY + 46} fill="#bbb" fontSize={12} fontFamily={fm}>{negShort(p)}</text>
                  </g>
                );
              })}

              {/* GREEN BARS — extend right from center */}
              {activePos.map((p, i) => {
                const barY = posStartY + i * posSpacing;
                const barW = Math.max((p.trades.length / maxPosCount) * 240, 30);
                const baseOpacity = 0.3 + (p.trades.length / maxPosCount) * 0.5;
                const barX = cx + 10;
                const isSelected = selectedPattern?.key === p.key && selectedPattern?.side === 'momentum';
                const isDimmed = selectedPattern !== null && !isSelected;
                const gOpacity = isDimmed ? 0.3 : 1;
                return (
                  <g key={p.key} style={{ cursor: 'pointer', opacity: gOpacity }} onClick={() => setSelectedPattern(isSelected ? null : { side: 'momentum', name: p.name, key: p.key })}>
                    <line x1={cx + 10} y1={barY + 14} x2={cx} y2={cy} stroke={teal} strokeWidth={0.5} opacity={0.3} />
                    <rect x={barX} y={barY} width={barW} height={28} rx={4} fill={teal} opacity={isSelected ? 1 : baseOpacity} stroke={isSelected ? teal : 'none'} strokeWidth={isSelected ? 2 : 0} />
                    <text x={barX + barW + 8} y={barY + 12} fill={teal} fontSize={12} fontFamily={fd} fontWeight={700} textAnchor="start">{p.name}</text>
                    <text x={barX + barW + 8} y={barY + 24} fill="#999" fontSize={12} fontFamily={fm} textAnchor="start">{p.trades.length} trades</text>
                    <text x={barX + barW + 8} y={barY + 38} fill="#bbb" fontSize={12} fontFamily={fm}>{posShort(p)}</text>
                  </g>
                );
              })}

              {/* Empty state text */}
              {activeNeg.length === 0 && (
                <text x={cx - 120} y={cy - 10} fill="#999" fontSize={12} fontFamily={fm} textAnchor="middle" fontStyle="italic">No friction detected</text>
              )}
              {activePos.length === 0 && (
                <text x={cx + 120} y={cy - 10} fill="#999" fontSize={12} fontFamily={fm} textAnchor="middle" fontStyle="italic">Keep journaling for patterns</text>
              )}

              {/* Balance circle */}
              <circle cx={cx} cy={cy} r={24} fill={balanceFill} stroke={balanceColor} strokeWidth={2} />
              <text x={cx} y={cy + 5} fill="#fff" fontSize={14} fontFamily={fd} fontWeight={700} textAnchor="middle" dominantBaseline="middle">{psyScore}</text>
              <text x={cx} y={cy + 42} fill="#999" fontSize={12} fontFamily={fm} textAnchor="middle">Psychology score</text>
            </svg>}

            {/* Evidence panel — shown when a pattern bar is clicked */}
            {selectedPattern && (() => {
              const allPatterns = [...activeNeg.map(p => ({ ...p, side: 'friction' as const })), ...activePos.map(p => ({ ...p, side: 'momentum' as const }))];
              const match = allPatterns.find(p => p.key === selectedPattern.key && p.side === selectedPattern.side);
              if (!match) return null;
              const isFriction = selectedPattern.side === 'friction';
              const accentColor = isFriction ? red : teal;
              const matchedTrades = match.trades;
              const sorted = [...matchedTrades].sort((a, b) => isFriction ? a.pl - b.pl : b.pl - a.pl);
              const shown = sorted.slice(0, 5);
              const totalMatched = matchedTrades.length;

              // Compute stats for analysis paragraph
              const mWins = matchedTrades.filter(t => t.result.toUpperCase() === 'WIN').length;
              const mWinRate = totalMatched > 0 ? (mWins / totalMatched) * 100 : 0;
              const mAvgR = totalMatched > 0 ? matchedTrades.reduce((s, t) => s + (t.riskAmount ? t.pl / t.riskAmount : 0), 0) / totalMatched : 0;
              const mTotalPL = matchedTrades.reduce((s, t) => s + t.pl, 0);
              const pWins = processTrades.filter(t => t.result.toUpperCase() === 'WIN').length;
              const pWinRate = processTrades.length > 0 ? (pWins / processTrades.length) * 100 : 0;
              const pAvgR = processAvgR;

              // Stubborn hold stats for stop discipline comparison
              const stubbornPattern = negPatterns.find(np => np.key === 'stubborn');
              const stubbornTrades = stubbornPattern ? stubbornPattern.trades : [];
              const stubbornAvgLoss = stubbornTrades.length > 0 ? Math.abs(stubbornTrades.filter(t => t.pl < 0).reduce((s, t) => s + t.pl, 0) / Math.max(stubbornTrades.filter(t => t.pl < 0).length, 1)) : 0;
              const matchLosers = matchedTrades.filter(t => t.pl < 0);
              const matchAvgLoss = matchLosers.length > 0 ? Math.abs(matchLosers.reduce((s, t) => s + t.pl, 0) / matchLosers.length) : 0;

              // Overall stats for comparison
              const overallWins = windowTrades.filter(t => t.result.toUpperCase() === 'WIN').length;
              const overallWinRate = windowTrades.length > 0 ? (overallWins / windowTrades.length) * 100 : 0;
              const overallAvgR = windowTrades.length > 0 ? windowTrades.reduce((s, t) => s + (t.riskAmount ? t.pl / t.riskAmount : 0), 0) / windowTrades.length : 0;

              const dollarDiff = Math.abs(mTotalPL - (totalMatched * (processTrades.length > 0 ? processTrades.reduce((s, t) => s + t.pl, 0) / processTrades.length : 0)));

              const hl = (v: string) => <span style={{ color: accentColor, fontWeight: 'bold' }}>{v}</span>;

              const analysisMap: Record<string, React.ReactNode> = {
                ignoring: <>You entered {hl(String(totalMatched))} trades without waiting for confirmation. Expectancy drops to {hl(fmtR(mAvgR))} vs {hl(fmtR(pAvgR))} on confirmed entries. That gap represents {hl(fmtCost(dollarDiff))} across these trades.</>,
                impulse: <>Frustration drove {hl(String(totalMatched))} entries in this window. Win rate: {hl(fmtPct(mWinRate))} vs {hl(fmtPct(pWinRate))} on patient trades. Average R: {hl(fmtR(mAvgR))} vs {hl(fmtR(pAvgR))}. The market doesn&apos;t care that you&apos;re frustrated — it only rewards the setup.</>,
                revenge: <>Revenge trades appeared {hl(String(totalMatched))} times — trades taken to recover from recent losses. Cost you {hl(fmtCost(mTotalPL))} with a {hl(fmtPct(mWinRate))} win rate. These are trades where your journal admits you already knew it was wrong.</>,
                fomo: <>You chased {hl(String(totalMatched))} entries — jumping in before your setup confirmed. Win rate when chasing: {hl(fmtPct(mWinRate))} vs {hl(fmtPct(pWinRate))} when you wait. Every chase is a bet against your own edge.</>,
                stubborn: <>You held through your stop {hl(String(totalMatched))} times. Average loss on stubborn holds: {hl(fmtCost(matchAvgLoss))}. Holding past your stop isn&apos;t conviction — it&apos;s hope.</>,
                oversize: <>You oversized on {hl(String(totalMatched))} trades. When you size up emotionally, your average loss balloons to {hl(fmtCost(matchAvgLoss))}. Win rate: {hl(fmtPct(mWinRate))}. Size should follow conviction, not frustration.</>,
                patience: <>You waited for confirmation on {hl(String(totalMatched))} trades. Win rate: {hl(fmtPct(mWinRate))} with avg {hl(fmtR(mAvgR))}. Compare to your overall {hl(fmtPct(overallWinRate))} and {hl(fmtR(overallAvgR))}. This IS your edge.</>,
                clean: <>{hl(String(totalMatched))} textbook trades averaged {hl(fmtR(mAvgR))} with {hl(fmtPct(mWinRate))} win rate — your best category by expectancy. When you remove emotion and just execute, this is the result.</>,
                stops: <>Clean exits on {hl(String(totalMatched))} trades. Avg loss: {hl(fmtCost(matchAvgLoss))} vs {hl(fmtCost(stubbornAvgLoss))} when you hold past stops. Professional trading is about losing well.</>,
                trust: <>{hl(String(totalMatched))} entries where you trusted your system despite losses or shaky confidence. Win rate: {hl(fmtPct(mWinRate))}. This resilience compounds over time — it&apos;s not a single trade edge, it&apos;s a career edge.</>,
                awareness: <>You were self-aware on {hl(String(totalMatched))} trades — recognizing your emotional state before entering. Win rate: {hl(fmtPct(mWinRate))} with avg {hl(fmtR(mAvgR))}. Awareness is the foundation of discipline.</>,
              };

              return (
                <div style={{ marginTop: 16, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, overflow: 'hidden' }}>
                  {/* Top bar */}
                  <div style={{ padding: '14px 20px', background: '#1a1c23', borderBottom: '1px solid #1e1f2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: teal, fontSize: 14 }}>✦</span>
                      <span style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: '#fff' }}>WickCoach analysis: {selectedPattern.name}</span>
                    </div>
                    <span
                      onClick={() => setSelectedPattern(null)}
                      style={{ color: '#999', fontSize: 14, cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#2a2b32'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >✕</span>
                  </div>

                  {/* Content */}
                  <div style={{
                    padding: '20px 24px', display: 'flex', gap: 24,
                    backgroundImage: 'radial-gradient(rgba(0,212,160,0.12) 1px, transparent 1px)', backgroundSize: '4px 4px',
                  }}>
                    {/* Left: Cited trades */}
                    <div style={{ flex: '0 0 50%' }}>
                      <div style={{ color: '#999', fontSize: 12, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Trades cited</div>
                      {shown.map(t => {
                        const eFail = evidenceLogoFails[t.ticker] || 0;
                        return (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#1a1c23', borderRadius: 6, marginBottom: 6, borderLeft: `3px solid ${accentColor}` }}>
                            {/* Logo with fallback */}
                            <div style={{ width: 22, height: 22, flexShrink: 0, position: 'relative' }}>
                              {eFail < 1 && (
                                <img src={getTickerLogoUrl(t.ticker)} width={22} height={22} style={{ borderRadius: 4, objectFit: 'cover', display: 'block', background: '#1a1c23' }}
                                  onError={() => setEvidenceLogoFails(prev => ({ ...prev, [t.ticker]: 1 }))} alt={t.ticker} />
                              )}
                              {eFail >= 1 && (
                                <div style={{ width: 22, height: 22, borderRadius: 4, background: 'rgba(0,212,160,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontFamily: fd, fontSize: 12, fontWeight: 700, color: teal }}>{t.ticker.charAt(0)}</span>
                                </div>
                              )}
                            </div>
                            <span style={{ color: '#fff', fontFamily: fd, fontSize: 13, fontWeight: 700 }}>{t.ticker}</span>
                            <span style={{ color: '#999', fontSize: 12 }}>{t.date}</span>
                            <span style={{ color: '#999', fontSize: 12 }}>{t.strategy}</span>
                            <span style={{ color: t.pl >= 0 ? teal : red, fontSize: 13, fontWeight: 700, marginLeft: 'auto' }}>{fmtDollar(t.pl)}</span>
                          </div>
                        );
                      })}
                      <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>{shown.length} of {totalMatched} matching trades</div>
                    </div>

                    {/* Right: Pattern analysis */}
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#999', fontSize: 12, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Pattern analysis</div>
                      <div style={{ color: '#ccc', fontSize: 13, lineHeight: '1.8', fontFamily: fm }}>
                        {analysisMap[selectedPattern.key] || <>Analysis for {selectedPattern.name}: {hl(String(totalMatched))} trades detected with a {hl(fmtPct(mWinRate))} win rate and {hl(fmtR(mAvgR))} average R.</>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Goals alignment */}
            <div style={{ marginTop: 20, padding: '16px 20px', background: '#1a1c23', borderRadius: 8, border: '1px solid #1e1f2a' }}>
              <div style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: isThisWeek ? 4 : 12 }}>Goals alignment</div>
              {isThisWeek && <div style={{ color: '#999', fontSize: 12, marginBottom: 12 }}>Weekly goals vs this week&apos;s behavior</div>}
              {goals.length > 0 ? goals.map((g, i) => {
                const tl = (g.title || '').toLowerCase();
                const ignoringActive = activeNeg.some(p => p.key === 'ignoring' && p.trades.length >= 3);
                const stubbornActive = activeNeg.some(p => p.key === 'stubborn' && p.trades.length >= 3);
                const patienceActive = activePos.some(p => p.key === 'patience' && p.trades.length >= 3);
                let status: 'on-track' | 'at-risk' | 'monitoring' = 'monitoring';
                if ((/confirmation|5m|13m|13\/15m/i).test(tl) && ignoringActive) status = 'at-risk';
                else if ((/breathe|break-even|break even/i).test(tl) && stubbornActive) status = 'at-risk';
                else if ((/wait|patience|pullback|20ma/i).test(tl) && patienceActive) status = 'on-track';
                const badge = status === 'on-track'
                  ? { label: 'On track', bg: 'rgba(0,212,160,0.15)', color: teal }
                  : status === 'at-risk'
                    ? { label: 'At risk', bg: 'rgba(255,68,68,0.15)', color: red }
                    : { label: 'Monitoring', bg: 'rgba(255,255,255,0.05)', color: '#999' };
                return (
                  <div key={g.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < goals.length - 1 ? '1px solid #1e1f2a' : 'none' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${teal}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: teal, fontSize: 12, fontWeight: 'bold', fontFamily: fm }}>{i + 1}</span>
                    </div>
                    <span style={{ color: '#fff', fontSize: 13, flex: 1 }}>{g.title}</span>
                    <span style={{ fontSize: 12, fontWeight: 'bold', padding: '3px 12px', borderRadius: 4, background: badge.bg, color: badge.color }}>{badge.label}</span>
                  </div>
                );
              }) : (
                <div style={{ fontSize: 13, color: '#999', fontStyle: 'italic' }}>Set weekly goals in the Trading Goals tab to see alignment with your behavioral patterns.</div>
              )}
            </div>

            {/* WickCoach AI Chat */}
            <div style={{ marginTop: 20, background: '#0e0f14', border: '1px solid #1e1f2a', borderRadius: 12, overflow: 'hidden' }}>
              <style>{`@keyframes wickDotPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
              <div style={{ padding: '12px 20px', background: '#1a1c23', borderBottom: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: teal, fontSize: 14 }}>✦</span>
                  <span style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: '#fff' }}>Ask WickCoach</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: teal }} />
                  <span style={{ color: teal, fontSize: 12 }}>Active</span>
                </div>
              </div>
              <div ref={chatContainerRef} style={{
                padding: '16px 20px', minHeight: 80, maxHeight: 300, overflowY: 'auto',
                backgroundImage: 'radial-gradient(rgba(0,212,160,0.12) 1px, transparent 1px)', backgroundSize: '4px 4px',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                {chatMessages.length === 0 && !chatLoading && (() => {
                  const worstTicker = analysis.tickers.length > 0 ? analysis.tickers[analysis.tickers.length - 1].name : 'SPY';
                  const chips = [
                    `Why do I lose on ${worstTicker}?`,
                    "What's my best setup?",
                    `Analyze my ${analysis.dominantFlawName} pattern`,
                  ];
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {chips.map(chip => (
                        <button key={chip} onClick={() => sendChatMessage(chip)} style={{
                          background: '#1a1c23', border: '1px solid #2a2b32', borderRadius: 20,
                          padding: '6px 14px', color: '#bbb', fontSize: 12, cursor: 'pointer', fontFamily: fm,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = teal; e.currentTarget.style.color = teal; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2b32'; e.currentTarget.style.color = '#bbb'; }}
                        >{chip}</button>
                      ))}
                    </div>
                  );
                })()}
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: msg.role === 'user' ? '80%' : '90%' }}>
                    <div style={{
                      background: msg.role === 'assistant' ? 'rgba(0,212,160,0.08)' : '#1a1c23',
                      border: msg.role === 'assistant' ? '1px solid rgba(0,212,160,0.12)' : '1px solid #2a2b32',
                      borderRadius: 12, padding: '12px 16px',
                      color: msg.content.startsWith('Unable to connect') ? red : '#ccc',
                      fontSize: 13, fontFamily: fm, lineHeight: '1.6', whiteSpace: 'pre-wrap',
                    }}>{msg.content}</div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ alignSelf: 'flex-start' }}>
                    <div style={{
                      background: 'rgba(0,212,160,0.08)', border: '1px solid rgba(0,212,160,0.12)',
                      borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 4,
                    }}>
                      {[0, 1, 2].map(d => (
                        <span key={d} style={{ color: teal, fontSize: 18, fontWeight: 700, animation: `wickDotPulse 1.2s ${d * 0.2}s infinite` }}>.</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid #1e1f2a', display: 'flex', gap: 8 }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendChatMessage(chatInput); }}
                  placeholder="Ask about your patterns..."
                  style={{
                    flex: 1, background: '#1a1c23', border: '1px solid #2a2b32', borderRadius: 8,
                    padding: '10px 14px', color: '#fff', fontSize: 13, fontFamily: fm, outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = teal; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#2a2b32'; }}
                />
                <button
                  onClick={() => sendChatMessage(chatInput)}
                  style={{
                    background: teal, border: 'none', borderRadius: 8, width: 38, height: 38,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#0e0f14', fontSize: 16, flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >→</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
