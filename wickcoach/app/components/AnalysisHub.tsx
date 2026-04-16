'use client';
import React, { useEffect, useState } from 'react';
import { fm, fd, Trade, Goal, buildTraderStats, computeAnalytics, TradeClassification, ClassificationBatchSummary, readClassifications, writeClassifications, readClassificationSummary, writeClassificationSummary, buildGoalsContext, buildProfileContext, QuantitativeTarget, readQuantTargets, RegressionResult, resolveTradeVariable, resolveTradeFilter, linearRegression, REGRESSION_VARIABLE_ALIASES } from './shared';
import AIChatWidget from './AIChatWidget';

const teal = '#00d4a0';
const red = '#ff4444';

// Logo-domain lookup — reference data, not stats.
const tickerDomains: Record<string, string> = {
  V: 'visa.com', META: 'meta.com', NVDA: 'nvidia.com', AMD: 'amd.com',
  BA: 'boeing.com', MSFT: 'microsoft.com', JPM: 'jpmorganchase.com',
  DIS: 'disney.com', NFLX: 'netflix.com', TSLA: 'tesla.com', AAPL: 'apple.com',
  GOOGL: 'google.com', GOOG: 'google.com', AMZN: 'amazon.com', COIN: 'coinbase.com',
  PLTR: 'palantir.com', CRM: 'salesforce.com', COST: 'costco.com', HD: 'homedepot.com',
};

// Blue used by "Trades vs. Goals" sliders — complementary to teal.
const blue = '#4a9eff';

// ─── Helpers ──────────────────────────────────────────────────
const fmtDollar = (n: number, withCents = false) => {
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  if (withCents) return sign + '$' + abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return sign + '$' + abs.toLocaleString();
};
const fmtR = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1) + 'R';
const fmtPct = (n: number) => n.toFixed(1) + '%';

// ─── Weekly goals snapshot ─────────────────────────────────────
// Real trades get bucketed into ISO weeks; real goals (from localStorage)
// are the cards shown per week. Compliance numbers are derived from the
// trade counts in that week. No hardcoded weekly stats.
interface WeekBucket {
  weekLabel: string;
  start: Date;
  end: Date;
  trades: Trade[];
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();              // Sun = 0
  const diff = (day === 0 ? -6 : 1) - day; // snap back to Monday
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() + diff);
  return s;
}

function fmtWeekRange(start: Date, end: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const sameMonth = start.getMonth() === end.getMonth();
  const left = `${months[start.getMonth()]} ${start.getDate()}`;
  const right = sameMonth ? `${end.getDate()}, ${end.getFullYear()}` : `${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  return `${left} – ${right}`;
}

// Build the 3 most recent week buckets that contain any trades. Falls
// back to the current week + previous two so the UI always has something.
function buildWeekBuckets(trades: Trade[]): WeekBucket[] {
  const today = new Date();
  const buckets: WeekBucket[] = [];
  for (let i = 0; i < 3; i++) {
    const start = startOfWeek(new Date(today.getTime() - i * 7 * 86400000));
    const end = new Date(start.getTime() + 6 * 86400000);
    const inWeek = trades.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= new Date(end.getTime() + 86400000 - 1);
    });
    buckets.push({ weekLabel: fmtWeekRange(start, end), start, end, trades: inWeek });
  }
  return buckets;
}

// ─── Component ────────────────────────────────────────────────
export default function AnalysisContent({ trades = [] }: { trades?: Trade[] }) {
  const [showAllStrategies, setShowAllStrategies] = useState(false);
  const [showAllTickers, setShowAllTickers] = useState(false);
  const [tickerView, setTickerView] = useState<'wins' | 'losses'>('wins');
  const [hoveredSlice, setHoveredSlice] = useState<'wins' | 'losses' | null>(null);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);
  const [hoveredPanel, setHoveredPanel] = useState<'trades' | 'psych' | null>(null);
  const [chartZoom, setChartZoom] = useState(1); // 0.5 to 2

  // Regression Lab state
  const [regVar1, setRegVar1] = useState('');
  const [regVar2, setRegVar2] = useState('');
  const [regCondition, setRegCondition] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regResult, setRegResult] = useState<{ stats: RegressionResult | null; plainEnglish: string; warning: string | null } | null>(null);

  const runRegression = async () => {
    if (!regVar1.trim() || !regVar2.trim() || regLoading) return;
    setRegLoading(true);
    setRegResult(null);

    // ── Phase 1: Deterministic math in JavaScript ──────────────
    // "test [var1] against [var2]" → var1 is the dependent (Y), var2 is the predictor (X).
    // "loss size against time of day" → Y = loss size, X = time of day.
    const yExtractor = resolveTradeVariable(regVar1.trim());
    const xExtractor = resolveTradeVariable(regVar2.trim());

    if (!yExtractor || !xExtractor) {
      const bad = !yExtractor ? regVar1 : regVar2;
      setRegResult({
        stats: null,
        plainEnglish: `Could not map "${bad}" to a trade data field. Supported variables:\n${REGRESSION_VARIABLE_ALIASES.join('\n')}`,
        warning: 'Variable not recognized. Try one of the aliases listed below.',
      });
      setRegLoading(false);
      return;
    }

    const filter = resolveTradeFilter(regCondition.trim());
    const filtered = filter ? trades.filter(filter) : trades;

    const pairs: { x: number; y: number }[] = [];
    for (const t of filtered) {
      const x = xExtractor(t);
      const y = yExtractor(t);
      if (x !== null && y !== null && isFinite(x) && isFinite(y)) {
        pairs.push({ x, y });
      }
    }

    if (pairs.length < 3) {
      setRegResult({
        stats: null,
        plainEnglish: `Only ${pairs.length} valid data points after filtering. Need at least 3 to run a regression.`,
        warning: 'Sample too small.',
      });
      setRegLoading(false);
      return;
    }

    const stats = linearRegression(
      pairs.map(p => p.x),
      pairs.map(p => p.y),
      regVar2.trim(),   // X label (predictor)
      regVar1.trim(),   // Y label (dependent / outcome)
    );

    if (!stats) {
      setRegResult({ stats: null, plainEnglish: 'Regression could not be computed — the X variable may have no variance.', warning: null });
      setRegLoading(false);
      return;
    }

    // ── Phase 2: Send pre-computed stats to AI for plain English ──
    try {
      const statsText = [
        `Variables: ${stats.xLabel} (X) vs ${stats.yLabel} (Y)`,
        `Sample size: n = ${stats.n}`,
        `Slope: ${stats.slope.toFixed(4)}`,
        `Intercept: ${stats.intercept.toFixed(4)}`,
        `R² = ${stats.r_squared.toFixed(4)}, Adjusted R² = ${stats.adjusted_r_squared.toFixed(4)}`,
        `p-value = ${stats.p_value.toFixed(6)}`,
        `F-statistic = ${stats.f_stat.toFixed(4)}`,
        `Standard error = ${stats.standard_error.toFixed(4)}`,
        `95% CI for slope: [${stats.ci_lower.toFixed(4)}, ${stats.ci_upper.toFixed(4)}]`,
        `Equation: ${stats.equation}`,
        regCondition.trim() ? `Filter applied: ${regCondition.trim()}` : 'No filter applied.',
      ].join('\n');

      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'regression',
          messages: [{ role: 'user', content: `Here are the pre-computed regression results. Explain them in plain English:\n\n${statsText}` }],
          profileContext: buildProfileContext(),
        }),
      });
      const data = await res.json();
      const meta = data.metadata as { plainEnglish?: string; warning?: string | null } | null;
      const plainEnglish = meta?.plainEnglish || data.reply || 'Explanation unavailable.';
      const warning = meta?.warning || (stats.n < 30 ? `Sample size is ${stats.n}, which is below the 30-trade threshold for reliable conclusions.` : null);
      const result = { stats, plainEnglish, warning };
      setRegResult(result);

      // Cache
      try {
        const query = `${regVar1} vs ${regVar2}${regCondition ? ` if ${regCondition}` : ''}`;
        const cache = JSON.parse(localStorage.getItem('wickcoach_regressions') || '[]');
        cache.unshift({ query, result, ts: new Date().toISOString() });
        localStorage.setItem('wickcoach_regressions', JSON.stringify(cache.slice(0, 10)));
      } catch { /* ignore */ }
    } catch {
      // Math succeeded even if AI explanation failed — still show stats
      setRegResult({
        stats,
        plainEnglish: 'Could not connect to AI for the explanation, but the statistics above are computed from your real data.',
        warning: null,
      });
    }
    setRegLoading(false);
  };

  // Section number badge — sits on the corner of each section box
  const SectionNum = ({ n }: { n: number }) => (
    <span style={{ position: 'absolute', top: -1, left: -1, fontFamily: fd, fontSize: 20, fontWeight: 700, color: '#ffffff', lineHeight: 1, zIndex: 3, pointerEvents: 'none', background: '#2A3143', borderRadius: '0 0 8px 0', padding: '4px 10px 5px 8px' }}>{n}</span>
  );

  // ─── Analysis AI chat ───
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Live analytics derived from the trades prop. Every card, bar, pill,
  // and tooltip on this page reads from here — no hardcoded numbers.
  const a = computeAnalytics(trades);
  const { totals, strategies, tickers, tickerLosses, hours, processSplit, whatIfPL, indisciplineCost, patterns } = a;

  // Top-4 tickers contribution for the welcome message
  const top4Tickers = tickers.slice(0, 4);
  const top4Pct = totals.totalPL !== 0
    ? (top4Tickers.reduce((s, t) => s + t.pl, 0) / totals.totalPL) * 100
    : 0;
  const bestStrategy = strategies[0];
  const analysisWelcome = totals.n === 0
    ? "No trades logged yet. Once you log a few, I'll have something to analyze."
    : `I've analyzed your ${totals.n} executions. Here's what the data is telling me:\n\n` +
      `Process trades: ${processSplit.process.n} at ${processSplit.process.wr.toFixed(1)}% win rate. Impulse trades: ${processSplit.impulse.n} at ${processSplit.impulse.wr.toFixed(1)}% win rate. The gap is your edge, the gap is your leak.\n\n` +
      (bestStrategy ? `${bestStrategy.name} carries your book (${fmtDollar(bestStrategy.total)} on ${bestStrategy.trades} trades, ${fmtPct(bestStrategy.wr)} WR, ${fmtR(bestStrategy.r)} avg).\n\n` : '') +
      (top4Tickers.length ? `Ticker concentration: ${top4Tickers.map(t => t.t).join(', ')} generate ${top4Pct.toFixed(0)}% of P/L across ${top4Tickers.reduce((s, t) => s + t.trades, 0)} trades.\n\n` : '') +
      `What would you like to dig into? I can slice by session, setup, or journal sentiment.`;

  async function sendToCoach() {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiLoading(true);
    try {
      const analysisContext = buildTraderStats(trades);
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...aiMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg },
          ],
          tradesContext: analysisContext,
          goalsContext: buildGoalsContext(),
          profileContext: buildProfileContext(),
          mode: 'analysis',
        }),
      });
      const data = await response.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Unable to analyze right now.' }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Try again.' }]);
    }
    setAiLoading(false);
  }

  // Pinwheel geometry — all counts come from analytics.
  const totalTrades = totals.n;
  const wins = totals.wins;
  const losses = totals.losses;
  const be = totals.breakeven;
  const winPct = totalTrades ? wins / totalTrades : 0;
  const lossPct = totalTrades ? losses / totalTrades : 0;
  const bePct = totalTrades ? be / totalTrades : 0;
  const circ = 2 * Math.PI * 40; // r=40

  const bestHour = [...hours].sort((a, b) => b.pl - a.pl)[0] || { h: '—', pl: 0, count: 0 };
  const worstHour = [...hours].sort((a, b) => a.pl - b.pl)[0] || { h: '—', pl: 0, count: 0 };

  // Load real goals from localStorage so Rules vs Execution reflects
  // whatever the trader has actually set, not mock text.
  const [realGoals, setRealGoals] = useState<Goal[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wickcoach_goals');
      if (saved) setRealGoals(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // ── AI-backed trade classifications (Haiku, cached per trade.id) ──
  // On mount we collect any current-week trades that haven't been scored
  // yet and batch-send them to /api/coach in classify mode. Results are
  // cached in localStorage; subsequent visits skip the API call.
  const [classifications, setClassifications] = useState<Record<string, TradeClassification>>({});
  const [classificationSummary, setClassificationSummary] = useState<ClassificationBatchSummary>({});
  const [quantTargetsSnapshot, setQuantTargetsSnapshot] = useState<{ quantitativeTargets: QuantitativeTarget[]; customQuantTargets: QuantitativeTarget[] }>({ quantitativeTargets: [], customQuantTargets: [] });
  useEffect(() => {
    setClassifications(readClassifications());
    setClassificationSummary(readClassificationSummary());
    setQuantTargetsSnapshot(readQuantTargets());
  }, []);
  useEffect(() => {
    if (!trades || trades.length === 0 || realGoals.length === 0) return;
    const cache = readClassifications();

    // Only re-score trades from the current calendar week that aren't cached.
    const today = new Date();
    const day = today.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const weekStart = new Date(today);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() + diff);

    const unscored = trades.filter(t => {
      const d = new Date(t.date);
      return d >= weekStart && !cache[t.id];
    });
    if (unscored.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const goalsList = realGoals.slice(0, 10).map((g, i) => {
          const ctx = g.context && g.context.length > 0 ? ` — context: ${g.context.join(' | ')}` : '';
          const crit = g.scoringCriteria
            ? ` — compliance: ${g.scoringCriteria.compliance}; violation: ${g.scoringCriteria.violation}; scope: ${g.scoringCriteria.scope}`
            : '';
          return `${i}. "${g.title || '(untitled)'}" [${g.goalType}]${ctx}${crit}`;
        }).join('\n');

        // Quantitative targets — sent so Haiku can score each trade against
        // target-rr and produce a batch winRateActual/winRateTarget summary.
        const { quantitativeTargets, customQuantTargets } = readQuantTargets();
        const allTargets = [...quantitativeTargets, ...customQuantTargets];
        const targetsList = allTargets.length > 0
          ? allTargets.map(t => {
              const valStr = t.value === null ? '(not set)' : String(t.value);
              return `- ${t.id}: ${t.label} = ${valStr} (${t.type})`;
            }).join('\n')
          : '(none set)';

        const tradesList = unscored.map(t => (
          `- ID: ${t.id} | Date: ${t.date} | Time: ${t.time} | ${t.ticker} | ${t.strategy} | ${t.direction} | Qty: ${t.contracts} | Entry/Exit: $${t.entryPrice}/$${t.exitPrice} | P/L: $${t.pl} | Result: ${t.result} | R:R: ${t.riskReward} | Journal: "${(t.journal || '').replace(/"/g, '\\"')}"`
        )).join('\n');

        const userMsg = `Goals:\n${goalsList || '(none set)'}\n\nQuantitative targets:\n${targetsList}\n\nTrades to classify:\n${tradesList}`;

        const res = await fetch('/api/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'classify',
            messages: [{ role: 'user', content: userMsg }],
            profileContext: buildProfileContext(),
          }),
        });
        const data = await res.json();
        const meta = data.metadata as {
          results?: TradeClassification[];
          winRateActual?: number;
          winRateTarget?: number | null;
          customTargetsNote?: string;
        } | null;
        if (cancelled || !meta?.results) return;

        const next = { ...cache };
        meta.results.forEach(r => { if (r && r.tradeId) next[r.tradeId] = r; });
        writeClassifications(next);
        setClassifications(next);

        const summary: ClassificationBatchSummary = {
          winRateActual: meta.winRateActual,
          winRateTarget: meta.winRateTarget ?? null,
          customTargetsNote: meta.customTargetsNote,
        };
        writeClassificationSummary(summary);
        setClassificationSummary(summary);
      } catch { /* ignore — keyword fallback handles UI */ }
    })();
    return () => { cancelled = true; };
  }, [trades, realGoals]);

  // Per-week trade buckets for the Rules vs Execution section.
  const weekBuckets = buildWeekBuckets(trades);
  const selectedWeekBucket = weekBuckets[selectedWeekIdx] || weekBuckets[0];

  // Derive per-goal slider values. Preferred source: AI classifications
  // from /api/coach (Haiku). Fallback: journal keyword matching so the
  // UI still renders defensible numbers when the API is unavailable or
  // when trades haven't been scored yet.
  const goalTypeKeywords: Record<string, string[]> = {
    'Trade Management': ['managed', 'held', 'breathe', 'exit'],
    'Entry Criteria':   ['entry', 'confirmation', 'confirmed', 'setup'],
    'Patience / Setup': ['patient', 'waited', 'setup'],
    'Risk Management':  ['risk', 'sized', 'size', 'stop', 'cap'],
    'Psychology':       ['calm', 'focused', 'discipline', 'mindset'],
    'General':          ['plan', 'rule', 'process'],
  };
  const selectedWeekGoals = realGoals.slice(0, 3).map((g, goalIdx) => {
    const weekTrades = selectedWeekBucket?.trades || [];
    const aiScoredTrades = weekTrades.filter(t => classifications[t.id]);

    // Primary: AI-scored per-goal compliance.
    if (aiScoredTrades.length >= 3) {
      const complied = aiScoredTrades.filter(t => {
        const gs = classifications[t.id].goalScores.find(s => s.goalIndex === goalIdx);
        return gs?.compliance === 1;
      }).length;
      const processCount = aiScoredTrades.filter(t => classifications[t.id].tradeType === 'process').length;
      return {
        title: g.title || '(untitled)',
        type: (g.goalType || 'General').toUpperCase().split(' ')[0],
        trades: { actual: complied, target: aiScoredTrades.length },
        psych:  { actual: processCount, target: aiScoredTrades.length },
      };
    }

    // Fallback: keyword proxy.
    const kws = goalTypeKeywords[g.goalType] || goalTypeKeywords['General'];
    const psychActual = weekTrades.filter(t => {
      const j = (t.journal || '').toLowerCase();
      return kws.some(k => j.includes(k));
    }).length;
    const tradesTarget = Math.max(5, weekTrades.length || 5);
    const tradesActual = weekTrades.length;
    const psychTarget = Math.max(5, Math.floor(weekTrades.length * 0.6));
    return {
      title: g.title || '(untitled)',
      type: (g.goalType || 'General').toUpperCase().split(' ')[0],
      trades: { actual: tradesActual, target: tradesTarget },
      psych:  { actual: psychActual,  target: psychTarget },
    };
  });
  const selectedWeek = { weekLabel: selectedWeekBucket?.weekLabel || '—', goals: selectedWeekGoals };

  return (
    <div style={{ background: 'transparent', padding: '32px 40px', minHeight: '100vh', fontFamily: fm, display: 'flex', flexDirection: 'column', gap: 32, overflowX: 'hidden' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>Analysis</h2>
          <p style={{ color: '#bbb', fontSize: 14, margin: '6px 0 0' }}>Behavioral pattern recognition across your trade history.</p>
          <p style={{ color: '#999', fontSize: 12, margin: '4px 0 0' }}>{totalTrades.toLocaleString()} execution{totalTrades === 1 ? '' : 's'} analyzed</p>
        </div>

        {/* WickCoach AI — Click for analysis */}
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
            <span style={{ fontFamily: fm, fontSize: 12, color: teal, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>Click for analysis</span>
          </div>
        </div>
      </div>

      {/* ═══ 1 · PINWHEEL ═══ */}
      <div style={{ background: '#141822', border: '1px solid #2A3143', borderRadius: 16, padding: '32px 28px', display: 'flex', alignItems: 'center', gap: 40, position: 'relative', flexWrap: 'wrap', justifyContent: 'center' }}>
        <SectionNum n={1} />

        {/* Pie chart */}
        <div style={{ position: 'relative', width: 220, height: 220, flexShrink: 0 }}>
          <svg width="220" height="220" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            {/* background track */}
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2A3143" strokeWidth="16" />
            {/* wins (green) */}
            <circle
              cx="50" cy="50" r="40" fill="transparent"
              stroke={teal} strokeWidth={hoveredSlice === 'wins' ? 20 : 16}
              strokeDasharray={`${(winPct * circ).toFixed(2)} ${circ.toFixed(2)}`}
              strokeDashoffset="0"
              style={{ cursor: 'pointer', transition: 'stroke-width 0.2s', pointerEvents: 'stroke' }}
              onMouseEnter={() => setHoveredSlice('wins')}
              onMouseLeave={() => setHoveredSlice(null)}
            />
            {/* losses (red) */}
            <circle
              cx="50" cy="50" r="40" fill="transparent"
              stroke={red} strokeWidth={hoveredSlice === 'losses' ? 20 : 16}
              strokeDasharray={`${(lossPct * circ).toFixed(2)} ${circ.toFixed(2)}`}
              strokeDashoffset={`${(-winPct * circ).toFixed(2)}`}
              style={{ cursor: 'pointer', transition: 'stroke-width 0.2s', pointerEvents: 'stroke' }}
              onMouseEnter={() => setHoveredSlice('losses')}
              onMouseLeave={() => setHoveredSlice(null)}
            />
            {/* break-even (grey) */}
            <circle
              cx="50" cy="50" r="40" fill="transparent"
              stroke="#6b7280" strokeWidth="16"
              strokeDasharray={`${(bePct * circ).toFixed(2)} ${circ.toFixed(2)}`}
              strokeDashoffset={`${(-(winPct + lossPct) * circ).toFixed(2)}`}
            />
          </svg>
          {/* Center label */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ fontFamily: fd, fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{totalTrades}</div>
            <div style={{ fontFamily: fm, fontSize: 10, color: '#999', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>Total Trades</div>
          </div>
        </div>

        {/* Legend + hover detail */}
        <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, background: teal, borderRadius: 2, display: 'inline-block' }} />
              <span style={{ color: '#ddd', fontSize: 13, fontFamily: fm }}>Wins</span>
              <span style={{ color: teal, fontSize: 13, fontFamily: fd, fontWeight: 700 }}>{wins}</span>
              <span style={{ color: '#888', fontSize: 12 }}>({fmtPct(winPct * 100)})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, background: red, borderRadius: 2, display: 'inline-block' }} />
              <span style={{ color: '#ddd', fontSize: 13, fontFamily: fm }}>Losses</span>
              <span style={{ color: red, fontSize: 13, fontFamily: fd, fontWeight: 700 }}>{losses}</span>
              <span style={{ color: '#888', fontSize: 12 }}>({fmtPct(lossPct * 100)})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, background: '#6b7280', borderRadius: 2, display: 'inline-block' }} />
              <span style={{ color: '#ddd', fontSize: 13, fontFamily: fm }}>Break Even</span>
              <span style={{ color: '#bbb', fontSize: 13, fontFamily: fd, fontWeight: 700 }}>{be}</span>
              <span style={{ color: '#888', fontSize: 12 }}>({fmtPct(bePct * 100)})</span>
            </div>
          </div>

          {/* Hover tooltip — only visible while hovering a slice */}
          <div
            style={{
              background: hoveredSlice === 'wins' ? 'rgba(0,212,160,0.08)' : hoveredSlice === 'losses' ? 'rgba(255,68,68,0.08)' : 'transparent',
              border: hoveredSlice === 'wins' ? '1px solid rgba(0,212,160,0.4)' : hoveredSlice === 'losses' ? '1px solid rgba(255,68,68,0.4)' : '1px dashed #2A3143',
              borderRadius: 10,
              padding: '14px 16px',
              minHeight: 160,
              transition: 'all 0.25s ease',
            }}
          >
            {hoveredSlice === 'wins' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="20" viewBox="0 0 20 24" fill="none">
                    <circle cx="8" cy="4" r="2.8" stroke="#7a7d88" strokeWidth="1.2" fill="none" />
                    <line x1="8" y1="6.8" x2="8" y2="15" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="9.5" x2="3" y2="13" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="15" x2="4.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="15" x2="11.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
                    <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={teal} opacity="0.9" />
                    <line x1="15.5" y1="2" x2="15.5" y2="12" stroke={teal} strokeWidth="0.8" />
                  </svg>
                  <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: teal, letterSpacing: 1.5 }}>MAJOR PSYCHOLOGICAL WINS</div>
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    `Patience: ${patterns.patience} trades journaled as patient waits`,
                    `Clean Execution: ${patterns.cleanExecution} textbook trades`,
                    `Stop Discipline: ${patterns.stopDiscipline} clean stop-outs`,
                    `Trusting Process: ${patterns.trustingProcess} entries kept you on plan`,
                  ].map(p => (
                    <li key={p} style={{ color: '#ddd', fontSize: 12, lineHeight: 1.5 }}>{p}</li>
                  ))}
                </ul>
              </>
            )}
            {hoveredSlice === 'losses' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="20" viewBox="0 0 20 24" fill="none">
                    <circle cx="8" cy="4" r="2.8" stroke="#7a7d88" strokeWidth="1.2" fill="none" />
                    <line x1="8" y1="6.8" x2="8" y2="15" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="9.5" x2="3" y2="13" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="15" x2="4.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="15" x2="11.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
                    <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={red} opacity="0.9" />
                    <line x1="15.5" y1="2" x2="15.5" y2="12" stroke={red} strokeWidth="0.8" />
                  </svg>
                  <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: red, letterSpacing: 1.5 }}>MAJOR PSYCHOLOGICAL ISSUES</div>
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    `Revenge Trading: ${patterns.revengeTrading} trades journaled as revenge`,
                    `Impulse Entries: ${patterns.impulseEntries} entries with no setup`,
                    `FOMO / Chasing: ${patterns.fomoChasing} trades chasing price`,
                    `Ignoring Rules: ${patterns.ignoringRules} trades broke your plan`,
                  ].map(p => (
                    <li key={p} style={{ color: '#ddd', fontSize: 12, lineHeight: 1.5 }}>{p}</li>
                  ))}
                </ul>
              </>
            )}
            {!hoveredSlice && (
              <div style={{ color: '#666', fontSize: 12, fontFamily: fm, textAlign: 'center', paddingTop: 60, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Hover a segment for WickCoach analysis
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ FOUR STAT CARDS ═══ */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Total Trades */}
        <div style={{ flex: 1, minWidth: 200, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Total Trades</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{totals.n.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: '#bbb', marginTop: 6 }}>Win Rate: {fmtPct(totals.winRate)}</div>
          <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 10 }}>
            <div style={{ width: `${(winPct * 100).toFixed(2)}%`, background: teal }} />
            <div style={{ width: `${(lossPct * 100).toFixed(2)}%`, background: red }} />
            <div style={{ width: `${(bePct * 100).toFixed(2)}%`, background: '#4b5563' }} />
          </div>
        </div>

        {/* Process — trades where the journal indicates discipline */}
        <div style={{ flex: 1, minWidth: 200, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '20px 24px', borderLeft: `3px solid ${teal}` }}>
          <div style={{ fontSize: 11, color: teal, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>Followed the Plan</div>
          <div style={{ fontSize: 10.5, color: '#888', marginBottom: 8 }}>Trades where your journal shows patience, a clean setup, or rule-following</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{processSplit.process.n.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: teal, marginTop: 6 }}>Win Rate: {fmtPct(processSplit.process.wr)}</div>
          <div style={{ fontSize: 12, color: teal, marginTop: 4 }}>{fmtR(processSplit.process.rTotal)} total</div>
        </div>

        {/* Impulse — trades where the journal indicates rule-breaking */}
        <div style={{ flex: 1, minWidth: 200, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '20px 24px', borderLeft: `3px solid ${red}` }}>
          <div style={{ fontSize: 11, color: red, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>Broke the Rules</div>
          <div style={{ fontSize: 10.5, color: '#888', marginBottom: 8 }}>Trades where your journal mentions FOMO, revenge, impulse, or skipping your setup</div>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff' }}>{processSplit.impulse.n.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: red, marginTop: 6 }}>Win Rate: {fmtPct(processSplit.impulse.wr)}</div>
          <div style={{ fontSize: 12, color: red, marginTop: 4 }}>{fmtR(processSplit.impulse.rTotal)} total</div>
        </div>

        {/* What If? — how much better your P/L would be without rule-breaking trades */}
        <div style={{ flex: 1, minWidth: 200, background: '#141822', border: '1px solid rgba(0,212,160,0.3)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 0 20px rgba(0,212,160,0.08)' }}>
          <div style={{ fontSize: 11, color: teal, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>What If?</div>
          <div style={{ fontSize: 12, color: '#bbb', marginBottom: 8 }}>Your total P/L if you removed every trade where you broke your own rules</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#bbb' }}>Actual P/L</span>
            <span style={{ fontSize: 13, color: '#fff' }}>{fmtDollar(totals.totalPL, true)}</span>
          </div>
          <div style={{ fontFamily: fd, fontSize: 26, fontWeight: 700, color: teal }}>{fmtDollar(whatIfPL, true)}</div>
          {indisciplineCost !== 0 && (
            <div style={{ fontSize: 12, color: red, marginTop: 4 }}>Indiscipline cost you ${Math.abs(indisciplineCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          )}
        </div>
      </div>

      {/* ═══ 2 · STRATEGY BREAKDOWN + TICKER PERFORMANCE ═══ */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', position: 'relative' }}>
        <SectionNum n={2} />
        {/* Strategy Breakdown — clean table */}
        {(() => {
          const visible = showAllStrategies ? strategies : strategies.slice(0, 6);
          const colStyle: React.CSSProperties = { fontFamily: fm, fontSize: 13, color: '#aab0bd', textAlign: 'right', whiteSpace: 'nowrap' };
          return (
            <div style={{ flex: '0 0 60%', minWidth: 300, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '24px 28px', boxSizing: 'border-box' }}>
              <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Strategy breakdown</div>
              <div style={{ fontSize: 13, color: '#aab0bd', marginBottom: 14 }}>Sorted by total P/L</div>

              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.6fr 0.7fr 0.6fr 0.8fr 1fr', gap: 0, padding: '0 0 8px', borderBottom: '1px solid #2A3143' }}>
                {['Strategy', 'Trades', 'Win Rate', 'Avg R', 'Avg P/L', 'Total'].map(h => (
                  <div key={h} style={{ fontFamily: fm, fontSize: 10, color: '#666', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: h === 'Strategy' ? 'left' : 'right' }}>{h}</div>
                ))}
              </div>

              {/* Table rows */}
              {visible.map((s, i) => (
                <div key={s.name} style={{
                  display: 'grid',
                  gridTemplateColumns: '1.8fr 0.6fr 0.7fr 0.6fr 0.8fr 1fr',
                  gap: 0,
                  padding: '12px 0',
                  borderBottom: i < visible.length - 1 ? '1px solid rgba(42,49,67,0.4)' : 'none',
                  borderLeft: i === 0 ? `3px solid ${teal}` : '3px solid transparent',
                  paddingLeft: 12,
                }}>
                  <div style={{ fontFamily: fm, fontSize: 14, color: '#fff', fontWeight: 600 }}>{s.name}</div>
                  <div style={{ ...colStyle }}>{s.trades}</div>
                  <div style={{ ...colStyle, color: teal, fontWeight: 700 }}>{fmtPct(s.wr)}</div>
                  <div style={{ ...colStyle, color: teal, fontWeight: 700 }}>R {s.r.toFixed(1)}</div>
                  <div style={{ ...colStyle, color: '#d0d0d8' }}>{fmtDollar(s.avg, true)}</div>
                  <div style={{ ...colStyle, color: s.total >= 0 ? teal : red, fontFamily: fd, fontWeight: 700, fontSize: 14 }}>{fmtDollar(s.total)}</div>
                </div>
              ))}

              {strategies.length > 6 && (
                <div
                  onClick={() => setShowAllStrategies(s => !s)}
                  style={{ color: teal, fontSize: 12, cursor: 'pointer', marginTop: 12, textAlign: 'center', fontFamily: fm, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}
                >
                  {showAllStrategies ? 'Show less' : `Show all ${strategies.length}`}
                </div>
              )}
            </div>
          );
        })()}

        {/* Ticker Performance — horizontal bar ranking with wins/losses toggle */}
        {(() => {
          const source = tickerView === 'wins' ? tickers : tickerLosses;
          const sorted = tickerView === 'wins'
            ? [...source].sort((a, b) => b.pl - a.pl)
            : [...source].sort((a, b) => a.pl - b.pl); // most negative first
          const maxPL = Math.max(...sorted.map(t => Math.abs(t.pl)));
          const visible = showAllTickers ? sorted : sorted.slice(0, 4);
          const subtitle = tickerView === 'wins'
            ? 'Top-profit tickers, sorted by total P/L'
            : 'Worst loss tickers, sorted by total loss';
          return (
            <div style={{ flex: 1, minWidth: 300, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '24px 28px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Ticker performance</div>
                  <div style={{ fontSize: 13, color: '#aab0bd', marginTop: 4 }}>{subtitle}</div>
                </div>
                {/* Wins/Losses toggle */}
                <div style={{ display: 'inline-flex', background: '#0f1318', border: '1px solid #2A3143', borderRadius: 999, padding: 3, flexShrink: 0 }}>
                  <button
                    onClick={() => setTickerView('wins')}
                    style={{
                      padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                      fontFamily: fm, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                      background: tickerView === 'wins' ? teal : 'transparent',
                      color: tickerView === 'wins' ? '#0A0D14' : '#aab0bd',
                      transition: 'all 0.2s ease',
                    }}
                  >Wins</button>
                  <button
                    onClick={() => setTickerView('losses')}
                    style={{
                      padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                      fontFamily: fm, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                      background: tickerView === 'losses' ? red : 'transparent',
                      color: tickerView === 'losses' ? '#fff' : '#aab0bd',
                      transition: 'all 0.2s ease',
                    }}
                  >Losses</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {visible.map((tk) => {
                  const positive = tk.pl >= 0;
                  const barWidth = (Math.abs(tk.pl) / maxPL) * 100;
                  const domain = tickerDomains[tk.t];
                  return (
                    <div key={tk.t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ffffff', padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {domain ? (
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                            alt={tk.t}
                            width={22}
                            height={22}
                            style={{ width: 22, height: 22, objectFit: 'contain', borderRadius: 3 }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span style={{ fontFamily: fd, fontSize: 11, fontWeight: 700, color: tk.color }}>{tk.t.charAt(0)}</span>
                        )}
                      </div>
                      <div style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: '#fff', width: 54, flexShrink: 0 }}>{tk.t}</div>
                      <div style={{ flex: 1, position: 'relative', height: 26, background: '#2A3143', borderRadius: 4, overflow: 'hidden' }}>
                        <div
                          style={{
                            position: 'absolute', top: 0, left: 0, bottom: 0,
                            width: `${barWidth}%`,
                            background: `linear-gradient(to right, ${positive ? 'rgba(0,212,160,0.25)' : 'rgba(255,68,68,0.25)'}, ${positive ? teal : red})`,
                            transition: 'width 0.5s ease',
                          }}
                        />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: fm, letterSpacing: 0.5, fontWeight: 500, textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
                          {tk.trades} trades · {fmtPct(tk.wr)} win
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: positive ? teal : red, fontFamily: fd, width: 86, textAlign: 'right', flexShrink: 0 }}>{fmtDollar(tk.pl)}</div>
                    </div>
                  );
                })}
              </div>

              <div
                onClick={() => setShowAllTickers(s => !s)}
                style={{ color: teal, fontSize: 12, cursor: 'pointer', marginTop: 14, textAlign: 'center', fontFamily: fm, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}
              >
                {showAllTickers ? 'Show less ↑' : `Show all ${source.length} ↓`}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ═══ 3 · RULES vs EXECUTION ═══ */}
      <div style={{ background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '28px 32px 32px', position: 'relative' }}>
        <SectionNum n={3} />

        {/* Header + week dropdown (centered) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, gap: 8 }}>
          <h3 style={{ fontFamily: fd, fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>Rules vs. Execution</h3>
          <p style={{ color: '#888', fontSize: 12, margin: 0 }}>How your trading and psychology compared to the rules you set</p>
          <div style={{ position: 'relative', marginTop: 10 }}>
            <select
              value={selectedWeekIdx}
              onChange={e => setSelectedWeekIdx(parseInt(e.target.value))}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                background: '#1f2430',
                border: '1px solid #2A3143',
                color: '#e8e8f0',
                fontFamily: fm,
                fontSize: 13,
                fontWeight: 600,
                padding: '10px 38px 10px 18px',
                borderRadius: 8,
                cursor: 'pointer',
                letterSpacing: 0.5,
                outline: 'none',
              }}
            >
              {weekBuckets.map((w, i) => (
                <option key={i} value={i} style={{ background: '#1f2430', color: '#e8e8f0' }}>{w.weekLabel}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: teal, pointerEvents: 'none', fontSize: 10 }}>▼</span>
          </div>
        </div>

        {/* Compact goal cards (3) */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {selectedWeek.goals.map((g, idx) => (
            <div key={idx} style={{
              flex: '1 1 240px',
              background: '#1f2430',
              border: '1px solid #2A3143',
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(0,212,160,0.12)',
                border: `1px solid ${teal}`,
                color: teal,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: fd, fontSize: 13, fontWeight: 700,
                flexShrink: 0,
              }}>{idx + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#e8e8f0', fontFamily: fm, fontWeight: 500, lineHeight: 1.35 }}>{g.title}</div>
              </div>
              <span style={{
                background: 'rgba(0,212,160,0.12)', color: teal,
                fontSize: 9.5, letterSpacing: 1.5, fontWeight: 700,
                padding: '3px 8px', borderRadius: 999, fontFamily: fm, flexShrink: 0,
              }}>{g.type}</span>
            </div>
          ))}
        </div>

        {/* Split panel: Trades vs. Goals (blue) | Psych vs. Goals (green) */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

          {/* LEFT — Trades vs. Goals (BLUE) */}
          <div
            onMouseEnter={() => setHoveredPanel('trades')}
            onMouseLeave={() => setHoveredPanel(null)}
            style={{
              flex: '1 1 320px',
              background: '#12151d',
              border: '1px solid #2A3143',
              borderLeft: `3px solid ${blue}`,
              borderRadius: 10,
              padding: '20px 22px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, background: blue, borderRadius: 2, display: 'inline-block' }} />
              <h4 style={{ fontFamily: fd, fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: 0.5 }}>Trades vs. Goals</h4>
            </div>
            <p style={{ color: '#888', fontSize: 11.5, margin: '0 0 18px', letterSpacing: 0.3, height: hoveredPanel === 'trades' ? 'auto' : 0, overflow: 'hidden', opacity: hoveredPanel === 'trades' ? 1 : 0, transition: 'opacity 0.2s ease' }}>Actual trading activity measured against the rules</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedWeek.goals.map((g, i) => {
                const pct = Math.round((g.trades.actual / g.trades.target) * 100);
                const clamped = Math.min(100, pct);
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, color: '#e8e8f0', fontFamily: fm, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '1 1 auto', minWidth: 0 }}>{i + 1} · {g.title}</span>
                      <span style={{ fontSize: 14, color: blue, fontFamily: fd, fontWeight: 700, flexShrink: 0 }}>{g.trades.actual}<span style={{ color: '#666' }}> / {g.trades.target}</span><span style={{ color: '#aab0bd', fontWeight: 400, fontSize: 11, marginLeft: 4 }}>trades</span></span>
                    </div>
                    <div style={{ position: 'relative', height: 8, background: '#2A3143', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${clamped}%`,
                        height: '100%',
                        background: `linear-gradient(to right, rgba(74,158,255,0.4), ${blue})`,
                        boxShadow: `0 0 8px rgba(74,158,255,0.4)`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#aab0bd', marginTop: 4, letterSpacing: 0.3 }}>{pct}% compliance</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Psych vs. Goals (GREEN) */}
          <div style={{
            flex: '1 1 320px',
            background: '#12151d',
            border: '1px solid #2A3143',
            borderLeft: `3px solid ${teal}`,
            borderRadius: 10,
            padding: '20px 22px',
          }}
            onMouseEnter={() => setHoveredPanel('psych')}
            onMouseLeave={() => setHoveredPanel(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, background: teal, borderRadius: 2, display: 'inline-block' }} />
              <h4 style={{ fontFamily: fd, fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: 0.5 }}>Psych vs. Goals</h4>
            </div>
            <p style={{ color: '#888', fontSize: 11.5, margin: '0 0 18px', letterSpacing: 0.3, height: hoveredPanel === 'psych' ? 'auto' : 0, overflow: 'hidden', opacity: hoveredPanel === 'psych' ? 1 : 0, transition: 'opacity 0.2s ease' }}>Psychological alignment with the rules — from journal & tags</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedWeek.goals.map((g, i) => {
                const pct = Math.round((g.psych.actual / g.psych.target) * 100);
                const clamped = Math.min(100, pct);
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, color: '#e8e8f0', fontFamily: fm, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '1 1 auto', minWidth: 0 }}>{i + 1} · {g.title}</span>
                      <span style={{ fontSize: 14, color: teal, fontFamily: fd, fontWeight: 700, flexShrink: 0 }}>{g.psych.actual}<span style={{ color: '#666' }}> / {g.psych.target}</span><span style={{ color: '#aab0bd', fontWeight: 400, fontSize: 11, marginLeft: 4 }}>trades</span></span>
                    </div>
                    <div style={{ position: 'relative', height: 8, background: '#2A3143', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${clamped}%`,
                        height: '100%',
                        background: `linear-gradient(to right, rgba(0,212,160,0.4), ${teal})`,
                        boxShadow: `0 0 8px rgba(0,212,160,0.4)`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#aab0bd', marginTop: 4, letterSpacing: 0.3 }}>{pct}% alignment</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ QUANTITATIVE TARGETS — glass candlestick indicators ═══ */}
        {(quantTargetsSnapshot.quantitativeTargets.length > 0 || quantTargetsSnapshot.customQuantTargets.length > 0) && (() => {
          const allTargets = [...quantTargetsSnapshot.quantitativeTargets, ...quantTargetsSnapshot.customQuantTargets];
          const CANDLE_H = 130;
          const CANDLE_W = 36;
          const WICK_W = 2;
          const WICK_EXT = 14;

          // Week-scoped stats for weekly targets — use the first (current) week bucket.
          const weekTrades = weekBuckets[0]?.trades || [];
          const weekWins = weekTrades.filter(t => t.pl > 0);
          const weekWR = weekTrades.length > 0 ? (weekWins.length / weekTrades.length) * 100 : 0;
          const weekRRValues = weekWins.map(t => parseFloat((t.riskReward || '').split(':')[1]) || 0);
          const weekAvgR = weekRRValues.length > 0 ? weekRRValues.reduce((a, b) => a + b, 0) / weekRRValues.length : 0;
          const weekTradeCount = weekTrades.length;

          return (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #2A3143' }}>
              <h4 style={{ fontFamily: fd, fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: 0.5 }}>Quantitative Targets</h4>
              <p style={{ color: '#888', fontSize: 11.5, margin: '4px 0 22px', letterSpacing: 0.3 }}>This week vs your weekly targets</p>
              <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
                {allTargets.map(t => {
                  // Compute actual from THIS WEEK's trades, not all-time.
                  let actual: number | null = null;
                  if (t.id === 'target-rr') actual = weekAvgR;
                  else if (t.id === 'target-wr') actual = weekWR;
                  else {
                    // Custom targets: infer actual from trade data when possible.
                    const lbl = (t.label || '').toLowerCase();
                    if (lbl.includes('trade') || lbl.includes('execution') || lbl.includes('entry') || lbl.includes('entries')) {
                      actual = weekTradeCount;
                    } else if (lbl.includes('win') && t.type === 'percent') {
                      actual = weekWR;
                    } else if (lbl.includes('p/l') || lbl.includes('profit') || lbl.includes('pnl')) {
                      actual = weekTrades.reduce((s, tr) => s + tr.pl, 0);
                    }
                    // If none of those match, actual stays null (grey candle).
                  }

                  const target = t.value;
                  const hasTarget = target !== null && target !== undefined;
                  const hasActual = actual !== null;

                  // Detect "max" / "cap" / "limit" targets where LOWER is better.
                  const lbl = (t.label || '').toLowerCase();
                  const isMaxType = lbl.includes('max') || lbl.includes('cap') || lbl.includes('limit') || lbl.includes('no more');

                  let fillPct = 0;
                  if (hasTarget && hasActual) {
                    fillPct = Math.max(0, Math.min(100, (actual! / target!) * 100));
                  }

                  // Color logic depends on whether this is a "max" (ceiling) or normal (floor) target.
                  // Floor (higher = better): green at target, red when far below.
                  // Ceiling (lower = better): green when under, red when at/over.
                  let candleColor = '#6b7280';
                  if (hasTarget && hasActual) {
                    if (isMaxType) {
                      if (fillPct <= 60) candleColor = teal;
                      else if (fillPct <= 80) candleColor = '#8dd47e';
                      else if (fillPct <= 100) candleColor = '#f59e0b';
                      else candleColor = '#ff4444';
                    } else {
                      if (fillPct >= 100) candleColor = teal;
                      else if (fillPct >= 90) candleColor = '#8dd47e';
                      else if (fillPct >= 75) candleColor = '#f59e0b';
                      else candleColor = '#ff4444';
                    }
                  } else if (hasActual) {
                    candleColor = teal;
                  }

                  const fmtVal = (n: number | null | undefined) => {
                    if (n === null || n === undefined) return '—';
                    const prefix = t.id === 'target-rr' ? 'R ' : t.type === 'dollar' ? '$' : '';
                    const suffix = t.type === 'percent' ? '%' : '';
                    return `${prefix}${Number(n).toFixed(t.type === 'percent' ? 1 : 2)}${suffix}`;
                  };
                  const shortLabel = t.id === 'target-rr' ? 'Avg R' : t.id === 'target-wr' ? 'Win Rate' : t.label;

                  return (
                    <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 70 }}>
                      {/* Actual value above */}
                      <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: hasActual ? candleColor : '#555' }}>
                        {fmtVal(actual)}
                      </div>

                      {/* Candle assembly: wick + body + wick */}
                      <div style={{ position: 'relative', width: CANDLE_W, height: CANDLE_H + WICK_EXT * 2 }}>
                        {/* Top wick */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          width: WICK_W,
                          height: WICK_EXT,
                          background: candleColor,
                          opacity: 0.5,
                          transform: 'translateX(-50%)',
                          borderRadius: 1,
                        }} />
                        {/* Candle body — glass look */}
                        <div style={{
                          position: 'absolute',
                          top: WICK_EXT,
                          left: 0,
                          width: CANDLE_W,
                          height: CANDLE_H,
                          border: `2px solid ${candleColor}`,
                          borderRadius: 4,
                          background: `${candleColor}0A`,
                          overflow: 'hidden',
                        }}>
                          {/* Glass fill from bottom */}
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: `${fillPct}%`,
                            background: `linear-gradient(to top, ${candleColor}40, ${candleColor}1A)`,
                            backdropFilter: 'blur(4px)',
                            WebkitBackdropFilter: 'blur(4px)',
                            transition: 'height 0.6s ease, background 0.4s ease',
                          }} />
                          {/* Subtle inner glow at the top of the fill */}
                          {fillPct > 0 && (
                            <div style={{
                              position: 'absolute',
                              bottom: `${fillPct}%`,
                              left: 0,
                              right: 0,
                              height: 1,
                              background: candleColor,
                              opacity: 0.4,
                              transform: 'translateY(0.5px)',
                            }} />
                          )}
                        </div>
                        {/* Bottom wick */}
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: '50%',
                          width: WICK_W,
                          height: WICK_EXT,
                          background: candleColor,
                          opacity: 0.5,
                          transform: 'translateX(-50%)',
                          borderRadius: 1,
                        }} />
                      </div>

                      {/* Target value */}
                      <div style={{ fontFamily: fm, fontSize: 13, color: candleColor }}>
                        {hasTarget ? `target ${fmtVal(target)}` : 'no target'}
                      </div>
                      {/* Label */}
                      <div style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: candleColor, letterSpacing: 0.5, textAlign: 'center' }}>
                        {shortLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ═══ 4 · REGRESSION LAB ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,212,160,0.05) 0%, rgba(0,212,160,0.02) 50%, #141822 100%)',
        border: '1px solid rgba(0,212,160,0.2)',
        borderRadius: 12,
        padding: '28px 32px 32px',
        position: 'relative',
      }}>
        <SectionNum n={4} />
        <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4, paddingLeft: 24 }}>Regression Lab</div>
        <div style={{ fontSize: 13, color: '#aab0bd', marginBottom: 20, paddingLeft: 24 }}>Test relationships in your trading data. Plain English in, statistics out.</div>

        {/* Input sentence */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, fontFamily: fm, fontSize: 16, color: '#d0d0d8', marginBottom: 20 }}>
          <span>I want to test</span>
          <input
            value={regVar1}
            onChange={e => setRegVar1(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runRegression(); }}
            placeholder="variable 1"
            style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${regVar1 ? teal : '#2A3143'}`, outline: 'none', fontFamily: fm, fontSize: 16, color: '#fff', padding: '4px 2px', width: 160, minWidth: 80, maxWidth: 220, transition: 'border-color 0.2s', overflowX: 'auto' }}
          />
          <span>against</span>
          <input
            value={regVar2}
            onChange={e => setRegVar2(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runRegression(); }}
            placeholder="variable 2"
            style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${regVar2 ? teal : '#2A3143'}`, outline: 'none', fontFamily: fm, fontSize: 16, color: '#fff', padding: '4px 2px', width: 160, minWidth: 80, maxWidth: 220, transition: 'border-color 0.2s', overflowX: 'auto' }}
          />
          <span style={{ color: '#888', fontStyle: 'italic' }}>, if</span>
          <input
            value={regCondition}
            onChange={e => setRegCondition(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runRegression(); }}
            placeholder="condition (optional)"
            style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${regCondition ? teal : '#1f2430'}`, outline: 'none', fontFamily: fm, fontSize: 16, color: '#aab0bd', fontStyle: 'italic', padding: '4px 2px', width: 200, minWidth: 100, maxWidth: 280, transition: 'border-color 0.2s', overflowX: 'auto' }}
          />
          <button
            onClick={runRegression}
            disabled={regLoading || !regVar1.trim() || !regVar2.trim()}
            style={{
              background: regVar1.trim() && regVar2.trim() ? teal : '#1a1b22',
              color: regVar1.trim() && regVar2.trim() ? '#0A0D14' : '#4a4d58',
              fontFamily: fm, fontSize: 12, fontWeight: 700, padding: '8px 18px', borderRadius: 6,
              border: 'none', cursor: regVar1.trim() && regVar2.trim() ? 'pointer' : 'default',
              letterSpacing: 1, textTransform: 'uppercase', marginLeft: 8,
            }}
          >{regLoading ? 'Running...' : 'Run'}</button>
        </div>

        {/* Loading */}
        {regLoading && (
          <div style={{ fontFamily: fm, fontSize: 14, color: teal, padding: '20px 0', textAlign: 'center' }}>Analyzing {totals.n} trades...</div>
        )}

        {/* Results */}
        {regResult && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 8 }}>
            {/* Warning */}
            {regResult.warning && (
              <div style={{ width: '100%', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 16px', fontFamily: fm, fontSize: 13, color: '#FCD34D', marginBottom: 4 }}>
                {regResult.warning}
              </div>
            )}

            {/* Statistics — computed in JavaScript, deterministic */}
            {regResult.stats ? (
              <div style={{ flex: '0 0 280px', background: '#0f1318', border: '1px solid #2A3143', borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>The Numbers</div>
                {[
                  ['Sample size (n)', String(regResult.stats.n)],
                  ['R\u00B2', regResult.stats.r_squared.toFixed(4)],
                  ['Adj R\u00B2', regResult.stats.adjusted_r_squared.toFixed(4)],
                  ['p-value', regResult.stats.p_value.toFixed(6)],
                  ['F-statistic', regResult.stats.f_stat.toFixed(4)],
                  ['Std Error', regResult.stats.standard_error.toFixed(4)],
                  ['Slope', regResult.stats.slope.toFixed(4)],
                  ['Intercept', regResult.stats.intercept.toFixed(4)],
                  ['95% CI', `[${regResult.stats.ci_lower.toFixed(3)}, ${regResult.stats.ci_upper.toFixed(3)}]`],
                  ['Equation', regResult.stats.equation],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(42,49,67,0.3)' }}>
                    <span style={{ fontFamily: fm, fontSize: 12, color: '#888' }}>{label}</span>
                    <span style={{ fontFamily: fm, fontSize: 12, color: '#e8e8f0', fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ flex: '0 0 280px', background: '#0f1318', border: '1px solid #2A3143', borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>The Numbers</div>
                <div style={{ fontFamily: fm, fontSize: 13, color: '#888' }}>Could not compute statistics. Try different variables.</div>
              </div>
            )}

            {/* Plain English — AI explains the pre-computed stats */}
            <div style={{ flex: 1, minWidth: 280, background: 'rgba(0,212,160,0.04)', border: '1px solid rgba(0,212,160,0.15)', borderRadius: 8, padding: '20px 24px' }}>
              <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: teal, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>What This Means</div>
              <div style={{ fontFamily: fm, fontSize: 15, color: '#d0d0d8', lineHeight: 1.8 }}>
                {regResult.plainEnglish}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ 5 · TIME-OF-DAY PERFORMANCE — line chart ═══ */}
      {(() => {
        // Compute per-hour P/L split: winners and losers separately.
        const hourLabels = hours.map(h => h.h.replace('AM', '').replace('PM', ''));
        const hourWinPL = hours.map(h => {
          const label = h.h;
          const startH = parseInt(label) + (label.includes('PM') && !label.startsWith('12') ? 12 : 0);
          const bucket = trades.filter(t => {
            const m = (t.time || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (!m) return false;
            let hr = parseInt(m[1]);
            const ap = (m[3] || '').toUpperCase();
            if (ap === 'PM' && hr !== 12) hr += 12;
            if (ap === 'AM' && hr === 12) hr = 0;
            return hr === startH;
          });
          return bucket.filter(t => t.pl > 0).reduce((s, t) => s + t.pl, 0);
        });
        const hourLossPL = hours.map(h => {
          const label = h.h;
          const startH = parseInt(label) + (label.includes('PM') && !label.startsWith('12') ? 12 : 0);
          const bucket = trades.filter(t => {
            const m = (t.time || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (!m) return false;
            let hr = parseInt(m[1]);
            const ap = (m[3] || '').toUpperCase();
            if (ap === 'PM' && hr !== 12) hr += 12;
            if (ap === 'AM' && hr === 12) hr = 0;
            return hr === startH;
          });
          return bucket.filter(t => t.pl < 0).reduce((s, t) => s + t.pl, 0);
        });

        const allVals = [...hourWinPL, ...hourLossPL];
        const yMax = Math.max(1, ...allVals.map(Math.abs));
        const W = 700;
        const H = Math.round(200 * chartZoom);
        const pad = { top: 20, bottom: 30, left: 60, right: 20 };
        const plotW = W - pad.left - pad.right;
        const plotH = H - pad.top - pad.bottom;
        const n = hours.length;
        const xStep = n > 1 ? plotW / (n - 1) : 0;

        const toPath = (vals: number[]) =>
          vals.map((v, i) => {
            const x = pad.left + i * xStep;
            const y = pad.top + plotH / 2 - (v / yMax) * (plotH / 2);
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(' ');

        const winPath = toPath(hourWinPL);
        const lossPath = toPath(hourLossPL);
        const zeroY = pad.top + plotH / 2;

        return (
          <div style={{ background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '24px 28px', position: 'relative' }}>
            <SectionNum n={5} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff', paddingLeft: 24 }}>Time-of-day performance</div>
                <div style={{ fontSize: 13, color: '#aab0bd', paddingLeft: 24 }}>P/L by hour — green is winning trades, red is losing trades</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => setChartZoom(z => Math.max(0.6, z - 0.2))}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #2A3143', background: '#0f1318', color: '#aab0bd', fontFamily: fm, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                >−</button>
                <span style={{ fontFamily: fm, fontSize: 11, color: '#888', minWidth: 36, textAlign: 'center' }}>{Math.round(chartZoom * 100)}%</span>
                <button
                  onClick={() => setChartZoom(z => Math.min(2, z + 0.2))}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #2A3143', background: '#0f1318', color: '#aab0bd', fontFamily: fm, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                >+</button>
              </div>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
              {/* Grid lines */}
              {[-1, -0.5, 0, 0.5, 1].map(frac => {
                const y = pad.top + plotH / 2 - frac * (plotH / 2);
                return (
                  <g key={frac}>
                    <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke="rgba(42,49,67,0.4)" strokeWidth="1" />
                    <text x={pad.left - 8} y={y + 4} textAnchor="end" fill="#666" fontSize="10" fontFamily="DM Mono, monospace">
                      {frac === 0 ? '$0' : fmtDollar(Math.round(frac * yMax))}
                    </text>
                  </g>
                );
              })}

              {/* Winner line (green) */}
              <path d={winPath} fill="none" stroke={teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Winner dots */}
              {hourWinPL.map((v, i) => (
                <circle key={`w${i}`} cx={pad.left + i * xStep} cy={pad.top + plotH / 2 - (v / yMax) * (plotH / 2)} r="4" fill={teal} />
              ))}

              {/* Loser line (red) */}
              <path d={lossPath} fill="none" stroke={red} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Loser dots */}
              {hourLossPL.map((v, i) => (
                <circle key={`l${i}`} cx={pad.left + i * xStep} cy={pad.top + plotH / 2 - (v / yMax) * (plotH / 2)} r="4" fill={red} />
              ))}

              {/* Zero line */}
              <line x1={pad.left} x2={W - pad.right} y1={zeroY} y2={zeroY} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4,4" />

              {/* X-axis labels */}
              {hours.map((h, i) => (
                <text key={h.h} x={pad.left + i * xStep} y={H - 6} textAnchor="middle" fill="#888" fontSize="11" fontFamily="DM Mono, monospace">
                  {h.h}
                </text>
              ))}
            </svg>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 3, background: teal, borderRadius: 2, display: 'inline-block' }} />
                <span style={{ fontFamily: fm, fontSize: 12, color: '#aab0bd' }}>Winning trades P/L</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 3, background: red, borderRadius: 2, display: 'inline-block' }} />
                <span style={{ fontFamily: fm, fontSize: 12, color: '#aab0bd' }}>Losing trades P/L</span>
              </div>
            </div>

            <div style={{ fontSize: 13, color: '#bbb', marginTop: 10, textAlign: 'center' }}>
              Best hour: <span style={{ color: teal }}>{bestHour.h} ({fmtDollar(bestHour.pl)})</span>
              {' · '}
              Worst hour: <span style={{ color: red }}>{worstHour.h} ({fmtDollar(worstHour.pl)})</span>
            </div>
          </div>
        );
      })()}

      {/* ═══ ANALYSIS AI CHAT WIDGET ═══ */}
      <AIChatWidget
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        messages={aiMessages}
        input={aiInput}
        setInput={setAiInput}
        onSend={sendToCoach}
        loading={aiLoading}
        welcomeMsg={analysisWelcome}
      />
    </div>
  );
}

