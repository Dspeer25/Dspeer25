'use client';
import React, { useEffect, useState } from 'react';
import { fm, fd, Trade, Goal, buildTraderStats, computeAnalytics, TradeClassification, ClassificationBatchSummary, readClassifications, writeClassifications, readClassificationSummary, writeClassificationSummary, buildGoalsContext, buildProfileContext, QuantitativeTarget, readQuantTargets, RegressionResult, resolveTradeVariable, resolveTradeFilter, linearRegression, REGRESSION_VARIABLE_ALIASES, startOfWeek, toISODate, readAllGoals, getGoalsForWeek, getCurrentWeekStart, getCurrentTradingWeekStart, getQuantTargetsForWeek, parseLocalDate, CLASSIFICATION_STORE_KEY, CLASSIFY_PROMPT_VERSION, formatNumber, parseRr, getEffectiveKind, scoreNumberGoal, readAccountSize } from './shared';
import AIChatWidget from './AIChatWidget';
import { MiniStickFigure } from './Logo';

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
// Thin wrappers around the site-wide formatter so every caller in
// this file prints the same shape: no trailing zeros, thousands
// commas, explicit sign for positives.
const fmtDollar = (n: number, withCents = false) =>
  formatNumber(n, { currency: true, explicitSign: true, decimals: withCents ? 2 : 0, trailingZeros: false });
const fmtR = (n: number) => {
  const body = formatNumber(n, { trailingZeros: false, commas: false, decimals: 1, explicitSign: true });
  return body === '—' ? '—' : body + 'R';
};
const fmtPct = (n: number) => {
  const body = formatNumber(n, { trailingZeros: false, decimals: 1 });
  return body === '—' ? '—' : body + '%';
};

// Small info-icon button with hover tooltip. Replaces the inline
// description copy on each stat card — the definition is one hover
// away, but the card itself stays visual and number-forward.
function InfoTip({ text }: { text: string }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}
    >
      <div
        aria-label="What is this?"
        style={{
          width: 18, height: 18, borderRadius: '50%',
          border: '1px solid #2A3143',
          background: hover ? 'rgba(255,255,255,0.06)' : 'transparent',
          color: hover ? '#e0e0e0' : '#7e818a',
          fontFamily: fm, fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'help', userSelect: 'none' as const,
          transition: 'color 0.15s ease, background 0.15s ease',
        }}
      >
        i
      </div>
      {hover && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 240,
          background: '#0e0f14',
          border: '1px solid #2A3143',
          borderRadius: 8,
          padding: '10px 12px',
          fontFamily: fm, fontSize: 13, lineHeight: 1.45,
          color: '#e0e0e0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 50,
          pointerEvents: 'none' as const,
        }}>
          {text}
        </div>
      )}
    </div>
  );
}

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

function fmtWeekRange(start: Date, end: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const sameMonth = start.getMonth() === end.getMonth();
  const left = `${months[start.getMonth()]} ${start.getDate()}`;
  const right = sameMonth ? `${end.getDate()}, ${end.getFullYear()}` : `${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  return `${left} – ${right}`;
}

// Full rewrite (was: sliding 12-week window anchored on today's
// calendar week). The old version had two bugs:
//   1. On weekends, it anchored on the PRIOR calendar Monday — so on
//      Sun Jun 7, bucket 0 was Jun 1-7 and the upcoming Jun 8 week
//      was unreachable from the dropdown even when goals existed.
//   2. It only generated weeks within its sliding window — weeks that
//      had goals set but no trades yet (the common case for a fresh
//      planning week) were never offered as options.
//
// New behavior: the bucket set is the union of
//   (a) the current trading week  — getCurrentTradingWeekStart(),
//       weekend-aware so Sat/Sun rolls forward to upcoming Monday,
//   (b) every week that contains at least one trade,
//   (c) every week that has at least one goal stamped to it,
// deduped, sorted descending (most recent first), capped at 12.
// Index 0 is always the most recent, so the existing selectedWeekIdx
// default of 0 lands on the current trading week as the user expects.
function buildWeekBuckets(trades: Trade[], goalWeekStarts: string[]): WeekBucket[] {
  const weekStartSet = new Set<string>();

  // (a) Current trading week — always present, even with zero trades.
  weekStartSet.add(getCurrentTradingWeekStart());

  // (b) Weeks that contain logged trades. Each trade's date snaps to
  //     its calendar week's Monday — a Friday Jun 5 trade belongs to
  //     the Jun 1 week, not Jun 8. Backward-looking semantics here.
  trades.forEach(t => {
    const d = parseLocalDate(t.date);
    if (isNaN(d.getTime())) return;
    weekStartSet.add(toISODate(startOfWeek(d)));
  });

  // (c) Weeks that have goals. weekStart on Goal is already a
  //     "YYYY-MM-DD" ISO string from getCurrentTradingWeekStart() /
  //     getCurrentWeekStart() — no normalization needed.
  goalWeekStarts.forEach(ws => {
    if (ws) weekStartSet.add(ws);
  });

  // Sort descending and cap at 12. ISO date strings sort
  // lexicographically the same as chronologically.
  const sortedStarts = Array.from(weekStartSet)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 12);

  return sortedStarts.map(weekStartISO => {
    const start = parseLocalDate(weekStartISO); // Monday at local midnight
    const end = new Date(start.getTime() + 6 * 86400000);
    const inWeek = trades.filter(t => {
      const d = parseLocalDate(t.date);
      return d >= start && d <= new Date(end.getTime() + 86400000 - 1);
    });
    return { weekLabel: fmtWeekRange(start, end), start, end, trades: inWeek };
  });
}

// ─── Component ────────────────────────────────────────────────
export default function AnalysisContent({ trades = [] }: { trades?: Trade[] }) {
  const [showAllStrategies, setShowAllStrategies] = useState(false);
  const [showAllTickers, setShowAllTickers] = useState(false);
  const [tickerView, setTickerView] = useState<'wins' | 'losses' | 'net'>('net');
  const [hoveredSlice, setHoveredSlice] = useState<'wins' | 'losses' | 'breakeven' | null>(null);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);
  // Only one row at a time expands. null = everything collapsed.
  const [expandedRow, setExpandedRow] = useState<{ section: 'trades' | 'psych'; goalIdx: number } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<{ section: 'trades' | 'psych'; goalIdx: number } | null>(null);
  const [chartZoom, setChartZoom] = useState(1);
  const [sizeZoom, setSizeZoom] = useState(1);
  const [sizeResizeDrag, setSizeResizeDrag] = useState<{ startY: number; startZoom: number } | null>(null);

  // Reset drilldown state when the user picks a different week — the
  // goal indices belong to that bucket, so keeping an old expansion
  // would point at the wrong goal.
  useEffect(() => { setExpandedRow(null); }, [selectedWeekIdx]);

  // Size Efficiency chart resize: dragging the corner handle scales the
  // chart height. 1px of vertical drag = ~0.005 zoom units, clamped to
  // the same [0.6, 2] range the old ± buttons used.
  useEffect(() => {
    if (!sizeResizeDrag) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientY - sizeResizeDrag.startY;
      const next = sizeResizeDrag.startZoom + delta / 200;
      setSizeZoom(Math.min(2, Math.max(0.6, next)));
    };
    const onUp = () => setSizeResizeDrag(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [sizeResizeDrag]);
  const [section5Tab, setSection5Tab] = useState<'timeOfDay' | 'sizeEfficiency'>('timeOfDay');

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

    // Filter parser now returns a discriminated union so unparseable
    // conditions surface as an error instead of silently running the
    // regression unfiltered (the old `return null` fall-through).
    const parsedFilter = resolveTradeFilter(regCondition.trim());
    if (parsedFilter.kind === 'error') {
      setRegResult({
        stats: null,
        plainEnglish: parsedFilter.message,
        warning: 'Filter condition not recognized — no regression was run. Fix the condition and try again.',
      });
      setRegLoading(false);
      return;
    }
    const filtered = parsedFilter.kind === 'ok' ? trades.filter(parsedFilter.predicate) : trades;

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
    <span style={{ position: 'absolute', top: -1, left: -1, fontFamily: fd, fontSize: 22, fontWeight: 700, color: teal, lineHeight: 1, zIndex: 3, pointerEvents: 'none', background: '#1f2430', borderRadius: '0 0 8px 0', padding: '5px 10px 6px 8px', border: '1px solid #2A3143', borderTop: 'none', borderLeft: 'none' }}>{n}</span>
  );

  // ─── Analysis AI chat ───
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Live analytics derived from the trades prop. Every card, bar, pill,
  // and tooltip on this page reads from here — no hardcoded numbers.
  const a = computeAnalytics(trades);
  // whatIfPL / indisciplineCost intentionally NOT destructured — the
  // What If? card was rewritten to compare R-per-trade between
  // buckets instead of subtracting rule-breaker P/L from actual (the
  // old math broke when rule-breakers were net positive).
  // tickerLosses intentionally NOT destructured — the Ticker Performance
  // Losses view was rewritten to aggregate GROSS losing trades per
  // ticker instead of net-negative tickers. The old field filtered out
  // tickers whose winners outweighed their losers (e.g. NVDA), which
  // hid loss-worth-reviewing dollars.
  const { totals, strategies, tickers, hours, processSplit, patterns } = a;

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
    // Auto-measurability has been retired — the trader picks
    // JOURNAL / DATA / BOTH per goal via the goal-card pills. We
    // just read stored goals as-is.
    setRealGoals(readAllGoals());
  }, []);

  // ── AI-backed trade classifications (Haiku, cached per trade.id) ──
  // On mount we collect any current-week trades that haven't been scored
  // yet and batch-send them to /api/coach in classify mode. Results are
  // cached in localStorage; subsequent visits skip the API call.
  const [classifications, setClassifications] = useState<Record<string, TradeClassification>>({});
  const [classificationSummary, setClassificationSummary] = useState<ClassificationBatchSummary>({});
  const [quantTargetsSnapshot, setQuantTargetsSnapshot] = useState<{ quantitativeTargets: QuantitativeTarget[]; customQuantTargets: QuantitativeTarget[] }>({ quantitativeTargets: [], customQuantTargets: [] });
  useEffect(() => {
    // One-shot purge of stale classifications before the classify run
    // sees them. Any entry whose promptVersion is missing or doesn't
    // match the current prompt is dropped outright — it would otherwise
    // hang around with undefined tradeScores/psychScores arrays and
    // render useless grey candles until its week is re-classified.
    // This complements the in-effect version check (which only covers
    // current-week trades); purging wipes past-week residue too.
    const cache = readClassifications();
    let changed = false;
    for (const id of Object.keys(cache)) {
      const entry = cache[id];
      if (!entry?.promptVersion || entry.promptVersion !== CLASSIFY_PROMPT_VERSION) {
        delete cache[id];
        changed = true;
      }
    }
    if (changed) {
      try { localStorage.setItem(CLASSIFICATION_STORE_KEY, JSON.stringify(cache)); } catch { /* ignore */ }
    }
    setClassifications(cache);
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
      const d = parseLocalDate(t.date);
      if (d < weekStart) return false;
      const cached = cache[t.id];
      if (!cached) return true;
      // Entries produced by an older classify prompt are invalidated —
      // they get re-scored under the current rules (e.g. null
      // compliance for goals the journal doesn't address).
      if (cached.promptVersion !== CLASSIFY_PROMPT_VERSION) return true;
      return false;
    });
    // Diagnostic — promoted to console.warn so it can't be filtered
    // out of a default-level browser console. Tells you whether the
    // effect even fired, and how many trades it's about to send.
    const currentWeekGoalsForLog = getGoalsForWeek(getCurrentWeekStart());
    console.warn('[AnalysisHub.classify] effect fired:', {
      totalTrades: trades.length,
      currentWeekGoals: currentWeekGoalsForLog.length,
      unscoredCount: unscored.length,
      promptVersion: CLASSIFY_PROMPT_VERSION,
      goals: currentWeekGoalsForLog.map((g, i) => `${i}: "${g.title?.slice(0, 50)}" measurability=${g.measurability}`),
    });
    if (unscored.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        // Scope to current week's PSYCH goals only — number goals are
        // scored deterministically in JS and never round-trip through
        // Haiku. Keeping the goalIndex aligned to the full week list
        // matters for the rendered candle's goalIdx mapping, so we
        // keep that index but tag non-psych entries as "skip" so
        // Haiku still emits a per-goal entry shape that the renderer
        // can ignore.
        const currentWeekGoals = getGoalsForWeek(getCurrentWeekStart());
        const goalsList = currentWeekGoals.slice(0, 10).map((g, i) => {
          const ctx = g.context && g.context.length > 0 ? ` — context: ${g.context.join(' | ')}` : '';
          const crit = g.scoringCriteria
            ? ` — compliance: ${g.scoringCriteria.compliance}; violation: ${g.scoringCriteria.violation}; scope: ${g.scoringCriteria.scope}`
            : '';
          // Force measurability=journal for every goal we send.
          // Number goals never reach Haiku — they're scored in JS —
          // so we don't ask Haiku for a tradeScores entry on any
          // goal. Keeps the goalIndex contract intact for psych
          // goals while preventing stray cross-side emissions.
          const k = getEffectiveKind(g);
          // Skip number goals entirely — Haiku doesn't see them.
          // (Use a sentinel that the renderer can filter on.)
          if (k === 'number') {
            return `${i}. (number goal — not scored by Haiku) measurability=skip`;
          }
          return `${i}. "${g.title || '(untitled)'}" [${g.goalType}] measurability=journal${ctx}${crit}`;
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
        // Stamp each fresh result with the current prompt version so
        // we can tell if the prompt changes under us later.
        meta.results.forEach(r => {
          if (r && r.tradeId) next[r.tradeId] = { ...r, promptVersion: CLASSIFY_PROMPT_VERSION };
        });
        writeClassifications(next);
        setClassifications(next);

        // Per-goal evaluation summary — printed once per classify pass.
        // Use this to see whether the "bias toward evaluation" prompt
        // change is actually reducing null rates. Any goal with >20%
        // nulls indicates the prompt is still bailing for that
        // category and needs further tightening.
        try {
          const currentWeekGoals = getGoalsForWeek(getCurrentWeekStart());
          type Counts = { pass: number; fail: number; nul: number };
          const tradeStats = new Map<number, Counts>();
          const psychStats = new Map<number, Counts>();
          Object.values(next).forEach(c => {
            (c?.tradeScores || []).forEach(s => {
              const cur = tradeStats.get(s.goalIndex) || { pass: 0, fail: 0, nul: 0 };
              if (s.compliance === 1) cur.pass++;
              else if (s.compliance === 0) cur.fail++;
              else cur.nul++;
              tradeStats.set(s.goalIndex, cur);
            });
            (c?.psychScores || []).forEach(s => {
              const cur = psychStats.get(s.goalIndex) || { pass: 0, fail: 0, nul: 0 };
              if (s.compliance === 1) cur.pass++;
              else if (s.compliance === 0) cur.fail++;
              else cur.nul++;
              psychStats.set(s.goalIndex, cur);
            });
          });
          const rows = currentWeekGoals.map((g, i) => {
            const t = tradeStats.get(i);
            const p = psychStats.get(i);
            const fmt = (c?: Counts) => {
              if (!c) return '—';
              const total = c.pass + c.fail + c.nul;
              const nullPct = total ? Math.round((c.nul / total) * 100) : 0;
              return `${c.pass}✓ ${c.fail}✗ ${c.nul}∅ (${nullPct}% null)`;
            };
            return {
              goal: g.title?.slice(0, 50) || '(untitled)',
              measurability: g.measurability,
              trade: fmt(t),
              psych: fmt(p),
            };
          });
          console.warn('[Classify pass complete] per-goal evaluation summary:');
          console.table(rows);
        } catch { /* ignore — debug summary only */ }

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
  // Pass goal week starts so a planning week with no trades yet still
  // shows up in the dropdown (otherwise the trader can't view the
  // goals they just set for the upcoming week).
  const goalWeekStarts = realGoals.map(g => g.weekStart).filter(Boolean);
  const weekBuckets = buildWeekBuckets(trades, goalWeekStarts);
  const selectedWeekBucket = weekBuckets[selectedWeekIdx] || weekBuckets[0];

  // Per-goal slider values come entirely from Haiku's tradeScores and
  // psychScores. The old journal keyword fallback was removed in the
  // quantitative/qualitative split — a keyword proxy on the trade side
  // was meaningless, and keeping it only on the psych side would have
  // introduced asymmetric "defensible" numbers.
  // Pull goals specific to the SELECTED week, not the globally-active
  // set. Each goal carries a weekStart stamp; we match it against the
  // selected bucket's Monday (local ISO date). The ID string matches
  // `getCurrentWeekStart()` exactly when viewing the current week.
  const selectedWeekStartISO = selectedWeekBucket ? toISODate(selectedWeekBucket.start) : null;
  const weekGoals = selectedWeekStartISO ? realGoals.filter(g => g.weekStart === selectedWeekStartISO) : [];

  // Per-goal compliance rows for a single column of Rules vs. Execution.
  //   - `section = 'trades'` reads TradeClassification.tradeScores (quantitative)
  //   - `section = 'psych'`  reads TradeClassification.psychScores (qualitative)
  // Goals are filtered by their measurability flag — only goals whose
  // flag overlaps the requested section show up in that column. The
  // `goalIdx` stored on each row is the position within the full
  // weekGoals array, which is what Haiku's goalIndex field refers to.
  type GoalComplianceRow = {
    title: string;
    type: string;
    actual: number;
    target: number;
    nullCount: number;
    goalIdx: number;
    empty: boolean;
  };
  const buildGoalRows = (section: 'trades' | 'psych'): GoalComplianceRow[] => {
    return weekGoals
      .map((g, goalIdx) => ({ g, goalIdx }))
      .filter(({ g }) => {
        // Kind-based filter. Trades column = number goals only,
        // scored deterministically below. Psych column = psych goals
        // only, scored by Haiku. No goal appears on both sides.
        const k = getEffectiveKind(g);
        return section === 'trades' ? k === 'number' : k === 'psych';
      })
      .slice(0, 3)
      .map(({ g, goalIdx }) => {
        const base = {
          title: g.title || '(untitled)',
          type: (g.goalType || 'General').toUpperCase().split(' ')[0],
          goalIdx,
        };
        const weekTrades = selectedWeekBucket?.trades || [];

        // Empty-week short-circuit — surfaces the "No trades this week"
        // placeholder instead of a phantom 0/N compliance bar.
        if (weekTrades.length === 0) {
          return { ...base, actual: 0, target: 0, nullCount: 0, empty: true };
        }

        // ── NUMBER goals (trades column) — deterministic JS scoring.
        //    Same trade + same rule = same result. No Haiku, no cache.
        //    Account size is threaded in so risk-%-of-account rules
        //    can derive (riskAmount / accountSize) * 100.
        if (section === 'trades') {
          const rule = g.numberRule;
          if (!rule) {
            // Rule not built yet — hollow candle until the trader
            // finishes the builder.
            return { ...base, actual: 0, target: 0, nullCount: 0, empty: false };
          }
          const accountSize = readAccountSize();
          let pass = 0;
          let fail = 0;
          let na = 0;
          for (const t of weekTrades) {
            const r = scoreNumberGoal(t, rule, { allTrades: weekTrades, accountSize: accountSize ?? undefined });
            if (r === 'pass') pass++;
            else if (r === 'fail') fail++;
            else na++;
          }
          // 'na' trades are excluded from both numerator and denom —
          // matches the user spec for R-target rules where a loss
          // isn't a violation, just doesn't apply. Also covers the
          // risk-%-of-account gate when no account size is set.
          return { ...base, actual: pass, target: pass + fail, nullCount: na, empty: false };
        }

        // ── PSYCH goals (psych column) — Haiku scoring with the
        //    null → violation fallback, unchanged from before.
        const aiScoredTrades = weekTrades.filter(t => classifications[t.id]);
        if (aiScoredTrades.length >= 1) {
          type PairedScore = { trade: Trade; compliance: 0 | 1 | null };
          const paired: PairedScore[] = aiScoredTrades.map(t => {
            const arr = classifications[t.id]['psychScores'];
            const gs = Array.isArray(arr) ? arr.find(s => s.goalIndex === goalIdx) : undefined;
            return { trade: t, compliance: gs ? gs.compliance : null };
          });
          // Null + journal text → ✗ (default violation). Empty
          // journal stays null ("not evaluated").
          // Render-time fallback: when Haiku returns null but the
          // journal has text, treat as compliance=1 (PASS). Absence
          // of an explicit "I broke the rule" confession is not the
          // same as a violation — affirmative evidence is required.
          // This matches the prompt's AFFIRMATIVE EVIDENCE REQUIRED
          // rule and prevents over-inference from neutral logistics.
          // (Previously this fallback flipped to 0; that baked the
          // same over-inference into the renderer.)
          const resolved = paired.map(p => {
            if (p.compliance !== null) return p;
            const hasJournal = (p.trade.journal || '').trim().length > 0;
            return hasJournal ? { ...p, compliance: 1 as const } : p;
          });
          const evaluable = resolved.filter(p => p.compliance === 0 || p.compliance === 1);
          const complied  = evaluable.filter(p => p.compliance === 1).length;
          const nullCount = resolved.length - evaluable.length;
          return { ...base, actual: complied, target: evaluable.length, nullCount, empty: false };
        }

        // Pre-classify state for psych — hollow candle until Haiku
        // runs on the current week's trades.
        return { ...base, actual: 0, target: 0, nullCount: 0, empty: false };
      });
  };

  const selectedWeekTradeGoals = buildGoalRows('trades');
  const selectedWeekPsychGoals = buildGoalRows('psych');

  // Render-time diagnostic — fires whenever classifications or the
  // selected bucket changes so we can confirm in dev-server.log that
  // the candle math has the data it needs. Logged via console.warn
  // because Next.js forwards browser warns to the server log.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const wt = selectedWeekBucket?.trades || [];
    const scoredIds = wt.filter(t => classifications[t.id]).map(t => t.id);
    console.warn('[AnalysisHub.render] candle data:', {
      selectedWeekStartISO,
      bucketTradeCount: wt.length,
      bucketTradesScored: scoredIds.length,
      classificationsKnown: Object.keys(classifications).length,
      tradeRows: selectedWeekTradeGoals.map(r => `goalIdx=${r.goalIdx} "${r.title.slice(0, 30)}" target=${r.target} actual=${r.actual} null=${r.nullCount}`),
      psychRows: selectedWeekPsychGoals.map(r => `goalIdx=${r.goalIdx} "${r.title.slice(0, 30)}" target=${r.target} actual=${r.actual} null=${r.nullCount}`),
    });
  }, [classifications, selectedWeekBucket, selectedWeekStartISO, selectedWeekTradeGoals, selectedWeekPsychGoals]);
  const selectedWeek = { weekLabel: selectedWeekBucket?.weekLabel || '—' };
  const hasGoalsForSelectedWeek = weekGoals.length > 0;

  // ── Drilldown renderer ─────────────────────────────────────
  // Renders the inline detail panel shown beneath an expanded
  // slider row. `section` picks which score set to read:
  //   'trades' → TradeClassification.tradeScores (quantitative)
  //   'psych'  → TradeClassification.psychScores (qualitative)
  // Both read the same per-goal compliance field so a single rendering
  // path handles icons + reasons; only the source array differs.
  const renderDrilldown = (section: 'trades' | 'psych', goalIdx: number) => {
    const weekTrades = selectedWeekBucket?.trades || [];
    const classifiedCount = weekTrades.filter(t => classifications[t.id]).length;
    const anyClassified = classifiedCount > 0;
    // For NUMBER goals we score every trade deterministically in JS
    // — no Haiku, no "haven't been scored yet" gate. Pull the rule
    // from the matching weekGoal at goalIdx so the per-row status
    // lines up with the candle aggregate above.
    const numberGoal = section === 'trades' ? weekGoals[goalIdx] : undefined;
    const numberRule = numberGoal && getEffectiveKind(numberGoal) === 'number' ? numberGoal.numberRule : undefined;
    const isNumberSection = section === 'trades' && !!numberRule;
    // Read once per drilldown render — risk-%-of-account rules
    // need this to compute (riskAmount / accountSize) * 100.
    const accountSize = isNumberSection ? readAccountSize() : null;

    const fmtDate = (iso: string) => {
      // Trade.date is a local-calendar "YYYY-MM-DD" — parsing with
      // new Date() would treat it as UTC midnight and render the
      // previous day in timezones west of UTC.
      const d = parseLocalDate(iso);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    };
    const truncJournal = (j: string | undefined) => {
      const s = (j || '').trim();
      return s.length > 80 ? s.slice(0, 80).trimEnd() + '…' : s;
    };

    return (
      <div style={{
        background: '#0e0f14',
        borderLeft: `2px solid ${teal}`,
        padding: '12px 16px',
        marginTop: 4,
        marginBottom: 12,
        borderRadius: '0 6px 6px 0',
      }}>
        {!isNumberSection && !anyClassified ? (
          <div style={{ fontFamily: fm, fontSize: 11, color: '#7a7d85', padding: 12, textAlign: 'center' }}>
            Trades in this week haven&apos;t been scored yet. Re-open Analysis after the batch completes.
          </div>
        ) : weekTrades.length === 0 ? (
          <div style={{ fontFamily: fm, fontSize: 11, color: '#7a7d85', padding: 12, textAlign: 'center' }}>
            No trades in this week.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {weekTrades.map(t => {
              const c = classifications[t.id];
              const scoresArr = section === 'trades' ? c?.tradeScores : c?.psychScores;
              const gs = Array.isArray(scoresArr) ? scoresArr.find(s => s.goalIndex === goalIdx) : undefined;
              // Three-way status: passed / violated / not-evaluated. The
              // not-evaluated bucket covers no classification, no entry
              // for this goal (e.g. journal-only goal in the trades
              // column), and null compliance (no evidence in the
              // respective data source).
              // ── Compliance resolution ──
              // Trade section + number rule → score via JS scorer.
              // Psych section → Haiku compliance with null + journal
              // text → ✗ fallback. Missing entries treated as null.
              const hasJournalText = (t.journal || '').trim().length > 0;
              const haikuCompliance: 0 | 1 | null = gs ? gs.compliance : null;
              const numberResult = isNumberSection && numberRule
                ? scoreNumberGoal(t, numberRule, { allTrades: weekTrades, accountSize: accountSize ?? undefined })
                : null;
              const isNumberNa = numberResult === 'na';
              // Psych null + text → PASS (1). Absence of confession
              // is not a violation; affirmative evidence required.
              // Matches the prompt's AFFIRMATIVE EVIDENCE REQUIRED
              // rule and the candle aggregate above.
              const isPsychSideJournalFallback =
                section === 'psych' &&
                haikuCompliance === null &&
                hasJournalText;
              const effectiveCompliance: 0 | 1 | null = isNumberSection
                ? (numberResult === 'pass' ? 1 : numberResult === 'fail' ? 0 : null)
                : !c ? null
                  : haikuCompliance !== null ? haikuCompliance
                  : isPsychSideJournalFallback ? 1
                  : null;
              const status: 'passed' | 'violated' | 'none' =
                effectiveCompliance === null ? 'none'
                : effectiveCompliance === 1 ? 'passed'
                : 'violated';
              const icon: { glyph: string; color: string } =
                status === 'passed'   ? { glyph: '✓', color: teal }
                : status === 'violated' ? { glyph: '✗', color: red }
                : { glyph: '—', color: '#555' };
              // Left-edge status bar + subtle row tint give violations a
              // visible signal at scan distance. Passed rows get a barely-
              // there teal wash so the eye still parses them as positive
              // context; not-evaluated rows stay transparent (minimal).
              const barColor =
                status === 'passed'   ? teal
                : status === 'violated' ? red
                : '#2A3143';
              const bgTint =
                status === 'passed'   ? 'rgba(0, 212, 160, 0.04)'
                : status === 'violated' ? 'rgba(255, 68, 68, 0.06)'
                : 'transparent';
              // Reason text. Number goals build their reason from
              // the rule + the trade's field value. Psych goals use
              // Haiku's reason (or the fallback override).
              const reason = isNumberSection && numberRule
                ? (() => {
                    const opLabel = numberRule.operator;
                    const fieldLabel = numberRule.field;
                    if (numberResult === 'na') {
                      if (numberRule.field === 'riskReward') {
                        if (t.result === 'LOSS' || t.result === 'BREAKEVEN') {
                          return `Trade was a ${t.result === 'LOSS' ? 'loss' : 'breakeven'} — R-target rule doesn't apply. Excluded.`;
                        }
                        return `Win without R:R logged — can't tell if the ${numberRule.value}R target was met. Excluded.`;
                      }
                      if (numberRule.field === 'riskPctOfAccount') {
                        return 'Account size not set in the Position Size Calculator — risk-%-of-account rule can’t score this trade. Excluded.';
                      }
                      return 'Rule does not apply to this trade.';
                    }
                    if (numberResult === 'pass') {
                      return `${fieldLabel} satisfied ${opLabel} ${numberRule.value}.`;
                    }
                    // fail
                    return `${fieldLabel} did not satisfy ${opLabel} ${numberRule.value}.`;
                  })()
                : isPsychSideJournalFallback
                  ? "Journal present with no affirmative evidence of a violation — counted as a pass. (Violations require explicit mindset language; neutral or factual statements aren't evidence of impatience or rule-breaking.)"
                  : (gs?.reason || '');
              // Drop the "no evidence in journal" filler on not-evaluated
              // rows — those are informational, the reason line just adds
              // noise. Keep reasons on passed/violated rows.
              const showReason = reason && !(status === 'none' && /no evidence/i.test(reason));
              // Color reflects RESULT classification, not pl sign — so a
              // BE-intent trade with non-zero slippage reads amber, not
              // teal/red. Stays consistent with the Past Trades P/L cell.
              const plColor =
                t.result === 'BREAKEVEN' ? '#f59e0b'
                : t.result === 'WIN' ? teal
                : red;
              const logoDomain = tickerDomains[t.ticker];
              return (
                <div key={t.id} style={{
                  display: 'flex',
                  background: bgTint,
                  borderRadius: 6,
                  overflow: 'hidden',
                }}>
                  <div style={{ width: 5, background: barColor, flexShrink: 0 }} />
                  <div style={{ flex: 1, padding: '8px 14px', minWidth: 0 }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 22px 70px 60px 90px 1fr',
                      gap: 12,
                      alignItems: 'center',
                    }}>
                      {/* Ticker logo — same source/styling as Ticker
                          Performance so the visual language is consistent
                          across the page. */}
                      <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: '#ffffff', padding: 3,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {logoDomain ? (
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${logoDomain}&sz=64`}
                            alt={t.ticker}
                            width={22}
                            height={22}
                            style={{ width: 22, height: 22, objectFit: 'contain', borderRadius: 3 }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span style={{ fontFamily: fd, fontSize: 12, fontWeight: 700, color: '#0e0f14' }}>{t.ticker.charAt(0)}</span>
                        )}
                      </div>
                      <span style={{ fontFamily: fm, fontSize: 18, fontWeight: 700, color: icon.color, textAlign: 'center' }}>{icon.glyph}</span>
                      <span style={{ fontFamily: fm, fontSize: 14, color: '#fff', fontWeight: 700 }}>{t.ticker}</span>
                      <span style={{ fontFamily: fm, fontSize: 14, color: '#aab0bd' }}>{fmtDate(t.date)}</span>
                      <span style={{ fontFamily: fm, fontSize: 14, color: plColor, fontWeight: 700, textAlign: 'right' }}>
                        {formatNumber(t.pl, { currency: true, explicitSign: true, decimals: 0 })}
                      </span>
                      <span title={t.journal || ''} style={{
                        fontFamily: fm,
                        fontSize: 14,
                        color: '#a0a3ab',
                        fontStyle: 'italic',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: t.journal ? 'help' : 'default',
                      }}>
                        “{truncJournal(t.journal)}”
                      </span>
                    </div>
                    {showReason && (
                      status === 'violated' ? (
                        // Violations get high-contrast treatment: red
                        // label, white reason text at 15px, no italic.
                        // Indented to clear the ticker logo + status
                        // icon columns above.
                        <div style={{
                          fontFamily: fm,
                          fontSize: 15,
                          marginLeft: 66,
                          lineHeight: 1.5,
                          maxWidth: 720,
                          marginTop: 6,
                        }}>
                          <span style={{ color: red, fontWeight: 700 }}>Reason:</span>{' '}
                          <span style={{ color: '#fff' }}>{reason}</span>
                        </div>
                      ) : (
                        // Passed / surviving-null rows stay italic muted
                        // — supportive context — but at 15px so they read.
                        <div style={{
                          fontFamily: fm,
                          fontSize: 15,
                          color: '#d0d4dc',
                          fontStyle: 'italic',
                          marginLeft: 66,
                          lineHeight: 1.5,
                          maxWidth: 720,
                          marginTop: 6,
                        }}>
                          Reason: {reason}
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: 'transparent', padding: '32px 40px', minHeight: '100vh', fontFamily: fm, display: 'flex', flexDirection: 'column', gap: 32, overflowX: 'hidden' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>Analysis</h2>
          <p style={{ color: '#bbb', fontSize: 15, margin: '6px 0 0' }}>Behavioral pattern recognition across your trade history.</p>
          <p style={{ color: teal, fontSize: 14, fontWeight: 600, margin: '4px 0 0' }}>{totalTrades.toLocaleString()} execution{totalTrades === 1 ? '' : 's'} analyzed</p>
        </div>

        {/* WickCoach AI — Click for analysis */}
        <div
          onClick={() => setAiOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            padding: '20px 30px',
            background: 'rgba(0,212,160,0.08)',
            border: '1px solid rgba(0,212,160,0.4)',
            borderRadius: 14,
            cursor: 'pointer',
            transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.3s ease',
            boxShadow: '0 0 28px rgba(0,212,160,0.14)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,160,0.15)'; e.currentTarget.style.borderColor = '#00d4a0'; e.currentTarget.style.boxShadow = '0 0 38px rgba(0,212,160,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,212,160,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,212,160,0.4)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(0,212,160,0.14)'; }}
        >
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'rgba(0,212,160,0.12)', border: '2px solid rgba(0,212,160,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: -10, marginBottom: -10, boxShadow: '0 0 22px rgba(0,212,160,0.2)' }}>
            <svg width="42" height="52" viewBox="0 0 20 24" fill="none">
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
            <span style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>WickCoach AI</span>
            <span style={{ fontFamily: fm, fontSize: 14, color: teal, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 }}>Click for analysis</span>
          </div>
        </div>
      </div>

      {/* ═══ 1 · OUTCOME CANDLES ═══ */}
      <div style={{ background: '#141822', border: '1px solid #2A3143', borderRadius: 16, padding: '32px 28px', display: 'flex', alignItems: 'center', gap: 40, position: 'relative', flexWrap: 'wrap', justifyContent: 'center' }}>
        <SectionNum n={1} />

        {/* Candlestick trio — proportional to losses / breakeven / wins */}
        <div style={{ position: 'relative', width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{totalTrades}</div>
          <div style={{ fontFamily: fm, fontSize: 12, color: '#aab0bd', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4, marginBottom: 18 }}>Total Trades</div>
          {(() => {
            // Body height scales each candle to its share of the total, so
            // the tallest candle dominates visually and the two smaller ones
            // stay proportional. Minimum body height keeps zero/low counts
            // readable without dwarfing the rest.
            const maxCount = Math.max(wins, losses, be, 1);
            const maxBody = 150;
            const minBody = 6;
            const bodyFor = (n: number) => n === 0 ? 0 : Math.max(minBody, (n / maxCount) * maxBody);
            const wickH = 14;
            const baselineY = 180;
            const candle = (x: number, n: number, kind: 'wins' | 'losses' | 'breakeven') => {
              const h = bodyFor(n);
              const topY = baselineY - h;
              const active = hoveredSlice === kind;
              const color = kind === 'losses' ? red : teal;
              const filled = kind !== 'breakeven';
              return (
                <g
                  key={kind}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredSlice(kind)}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  {/* invisible hit target so the whole column is hoverable */}
                  <rect x={x - 18} y={baselineY - maxBody - wickH - 20} width={36} height={maxBody + wickH * 2 + 40} fill="transparent" />
                  {/* upper wick */}
                  {n > 0 && <line x1={x} y1={topY - wickH} x2={x} y2={topY} stroke={color} strokeWidth={2} strokeLinecap="round" />}
                  {/* body */}
                  {n > 0 && (
                    <rect
                      x={x - 14}
                      y={topY}
                      width={28}
                      height={h}
                      rx={2}
                      fill={filled ? color : 'rgba(0,212,160,0.12)'}
                      stroke={color}
                      strokeWidth={active ? 3 : filled ? 0 : 2}
                      style={{ transition: 'stroke-width 0.15s ease' }}
                    />
                  )}
                  {/* lower wick */}
                  {n > 0 && <line x1={x} y1={baselineY} x2={x} y2={baselineY + wickH} stroke={color} strokeWidth={2} strokeLinecap="round" />}
                  {/* count label above */}
                  <text x={x} y={topY - wickH - 6} textAnchor="middle" fontFamily="Chakra Petch, sans-serif" fontSize="15" fontWeight="700" fill={filled ? color : teal}>
                    {n}
                  </text>
                  {/* axis label below */}
                  <text x={x} y={baselineY + wickH + 16} textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="11" fill={active ? color : '#aab0bd'} letterSpacing="1">
                    {kind === 'wins' ? 'WINS' : kind === 'losses' ? 'LOSSES' : 'BE'}
                  </text>
                </g>
              );
            };
            return (
              <svg width="260" height="220" viewBox="0 0 260 220" style={{ display: 'block' }}>
                {/* baseline */}
                <line x1={20} y1={baselineY} x2={240} y2={baselineY} stroke="#2A3143" strokeWidth={1} strokeDasharray="2,3" />
                {candle(55, losses, 'losses')}
                {candle(130, be, 'breakeven')}
                {candle(205, wins, 'wins')}
              </svg>
            );
          })()}
        </div>

        {/* Legend + hover detail */}
        <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, background: teal, borderRadius: 2, display: 'inline-block' }} />
              <span style={{ color: '#ddd', fontSize: 13, fontFamily: fm }}>Wins</span>
              <span style={{ color: teal, fontSize: 13, fontFamily: fd, fontWeight: 700 }}>{wins}</span>
              <span style={{ color: '#aab0bd', fontSize: 13 }}>({fmtPct(winPct * 100)})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, background: red, borderRadius: 2, display: 'inline-block' }} />
              <span style={{ color: '#ddd', fontSize: 13, fontFamily: fm }}>Losses</span>
              <span style={{ color: red, fontSize: 13, fontFamily: fd, fontWeight: 700 }}>{losses}</span>
              <span style={{ color: '#aab0bd', fontSize: 13 }}>({fmtPct(lossPct * 100)})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, background: 'rgba(0,212,160,0.12)', border: `1.5px solid ${teal}`, borderRadius: 2, display: 'inline-block', boxSizing: 'border-box' }} />
              <span style={{ color: '#ddd', fontSize: 13, fontFamily: fm }}>Break Even</span>
              <span style={{ color: teal, fontSize: 13, fontFamily: fd, fontWeight: 700 }}>{be}</span>
              <span style={{ color: '#aab0bd', fontSize: 13 }}>({fmtPct(bePct * 100)})</span>
            </div>
          </div>

          {/* Hover tooltip — only visible while hovering a slice */}
          <div
            style={{
              background: hoveredSlice === 'wins' ? 'rgba(0,212,160,0.08)' : hoveredSlice === 'losses' ? 'rgba(255,68,68,0.08)' : hoveredSlice === 'breakeven' ? 'rgba(0,212,160,0.04)' : 'transparent',
              border: hoveredSlice === 'wins' ? '1px solid rgba(0,212,160,0.4)' : hoveredSlice === 'losses' ? '1px solid rgba(255,68,68,0.4)' : hoveredSlice === 'breakeven' ? '1px dashed rgba(0,212,160,0.4)' : '1px dashed #2A3143',
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
                  <div style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: teal, letterSpacing: 1.5 }}>MAJOR PSYCHOLOGICAL WINS</div>
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
                  <div style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: red, letterSpacing: 1.5 }}>MAJOR PSYCHOLOGICAL ISSUES</div>
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
            {hoveredSlice === 'breakeven' && (
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
                  <div style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: teal, letterSpacing: 1.5 }}>BREAKEVEN TRADES</div>
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li style={{ color: '#ddd', fontSize: 12, lineHeight: 1.5 }}>{be} trade{be === 1 ? '' : 's'} closed flat — setup neither validated nor invalidated</li>
                  <li style={{ color: '#ddd', fontSize: 12, lineHeight: 1.5 }}>Review whether you exited too early on moving setups, or held too long on stalled ones</li>
                  <li style={{ color: '#ddd', fontSize: 12, lineHeight: 1.5 }}>Breakeven counts as risk-controlled even without profit — that is still discipline</li>
                </ul>
              </>
            )}
            {!hoveredSlice && (
              <div style={{ color: '#aab0bd', fontSize: 14, fontFamily: fm, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 56, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
                <MiniStickFigure size={26} />
                <span>Hover a candle for WickCoach analysis</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ FOUR STAT CARDS — full rewrite ═══
          Hierarchy flipped: the metric is the hero (huge), labels and
          support metrics are small. Descriptive copy moved to hover
          tooltips on the info icon. Each card carries a single visual
          element so the row reads at a glance. */}
      {(() => {
        // ── Local helpers, scoped to this card block ───────────────
        const plan  = processSplit.process;
        const broke = processSplit.impulse;
        const MIN_SAMPLE = 5;

        const planShare  = totals.n > 0 ? plan.n  / totals.n : 0;
        const brokeShare = totals.n > 0 ? broke.n / totals.n : 0;

        // Format a per-trade R value with explicit sign and 2 decimals.
        const fmtRpt = (v: number) => {
          const sign = v > 0 ? '+' : v < 0 ? '−' : '';
          return `${sign}${Math.abs(v).toFixed(2)}R`;
        };

        // Reusable card chrome and hero-number style — keeps the four
        // cards visually identical except for accent color.
        const cardBase: React.CSSProperties = {
          flex: 1,
          minWidth: 210,
          background: '#141822',
          border: '1px solid #2A3143',
          borderRadius: 12,
          padding: '20px 22px 18px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 200,
        };
        const labelStyle: React.CSSProperties = {
          fontFamily: fd,
          fontSize: 12,
          letterSpacing: '1.5px',
          textTransform: 'uppercase' as const,
        };
        const heroStyle: React.CSSProperties = {
          fontFamily: fd,
          fontSize: 60,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '-1px',
        };
        const supportStyle: React.CSSProperties = {
          fontFamily: fm,
          fontSize: 13,
          color: '#9a9da5',
        };
        const trackBase: React.CSSProperties = {
          width: '100%',
          height: 8,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 4,
          overflow: 'hidden',
        };

        return (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

            {/* ── 1. Total Trades ─────────────────────────────────── */}
            <div style={cardBase}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ ...labelStyle, color: '#aab0bd' }}>Total Trades</div>
                <InfoTip text="Every executed trade in the current dataset, regardless of outcome or rule compliance." />
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ ...heroStyle, color: '#fff' }}>{totals.n.toLocaleString()}</div>
              </div>
              <div style={{ ...supportStyle, marginTop: 10, marginBottom: 12 }}>
                {fmtPct(totals.winRate)} win rate
              </div>
              {/* Full-width win/loss/BE bar — taller than before */}
              <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${(winPct  * 100).toFixed(2)}%`, background: teal,      transition: 'width 0.3s ease' }} />
                <div style={{ width: `${(lossPct * 100).toFixed(2)}%`, background: red,       transition: 'width 0.3s ease' }} />
                <div style={{ width: `${(bePct   * 100).toFixed(2)}%`, background: '#4b5563', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* ── 2. In Plan ──────────────────────────────────────── */}
            <div style={{ ...cardBase, borderLeft: `3px solid ${teal}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ ...labelStyle, color: teal }}>In Plan</div>
                <InfoTip text="Trades where your journal shows patience, a clean setup, or following your rules." />
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ ...heroStyle, color: '#fff' }}>{plan.n.toLocaleString()}</div>
              </div>
              <div style={{ ...supportStyle, marginTop: 10, marginBottom: 12 }}>
                {fmtPct(plan.wr)} win rate · {fmtR(plan.rTotal)} total
              </div>
              {/* Share-of-total bar — teal fill = in-plan share */}
              <div style={trackBase}>
                <div style={{ width: `${(planShare * 100).toFixed(2)}%`, height: '100%', background: teal, transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* ── 3. Broke Rules ──────────────────────────────────── */}
            <div style={{ ...cardBase, borderLeft: `3px solid ${red}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ ...labelStyle, color: red }}>Broke Rules</div>
                <InfoTip text="Trades where your journal mentions FOMO, revenge, impulse, or skipping your setup." />
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ ...heroStyle, color: '#fff' }}>{broke.n.toLocaleString()}</div>
              </div>
              <div style={{ ...supportStyle, marginTop: 10, marginBottom: 12 }}>
                {fmtPct(broke.wr)} win rate · {fmtR(broke.rTotal)} total
              </div>
              {/* Share-of-total bar — red fill = broke share */}
              <div style={trackBase}>
                <div style={{ width: `${(brokeShare * 100).toFixed(2)}%`, height: '100%', background: red, transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* ── 4. R Gap ────────────────────────────────────────── */}
            {(() => {
              // Sample size guard — small buckets give noisy R/trade.
              if (plan.n < MIN_SAMPLE || broke.n < MIN_SAMPLE) {
                return (
                  <div style={cardBase}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ ...labelStyle, color: teal }}>R Gap</div>
                      <InfoTip text="Difference in R per trade between in-plan trades and rule-breakers. Needs at least 5 in each bucket." />
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <div style={{ ...heroStyle, color: '#7e818a', fontSize: 30, lineHeight: 1.25 }}>
                        Need more<br />trades
                      </div>
                    </div>
                    <div style={{ ...supportStyle, marginTop: 10 }}>
                      In Plan: {plan.n} · Broke: {broke.n} (5+ each)
                    </div>
                  </div>
                );
              }

              const planRpt  = plan.rTotal  / plan.n;
              const brokeRpt = broke.rTotal / broke.n;
              const gap = planRpt - brokeRpt;
              // Unfavorable = rule-breakers underperform in-plan. Color
              // the gap red because it represents lost edge.
              const unfavorable = gap > 0;
              const gapColor = unfavorable ? red : '#fff';

              // Project lost dollars on the rule-breaker bucket. Hide
              // the line entirely if it's a trivial amount — per the
              // spec, anything under $100 is too noisy to show.
              const dollarPerR = broke.rTotal !== 0 ? broke.plSum / broke.rTotal : 0;
              const projectedGain = unfavorable ? gap * broke.n * dollarPerR : 0;
              const showDollar = unfavorable && Math.abs(projectedGain) >= 100;

              // Bar widths normalized to the larger magnitude so the
              // comparison reads visually.
              const maxAbs = Math.max(Math.abs(planRpt), Math.abs(brokeRpt), 0.01);
              const planBarPct  = (Math.abs(planRpt)  / maxAbs) * 100;
              const brokeBarPct = (Math.abs(brokeRpt) / maxAbs) * 100;

              return (
                <div style={{
                  ...cardBase,
                  border: `1px solid ${unfavorable ? 'rgba(255,68,68,0.3)' : '#2A3143'}`,
                  boxShadow: unfavorable ? '0 0 18px rgba(255,68,68,0.08)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ ...labelStyle, color: teal }}>R Gap</div>
                    <InfoTip text="Your in-plan R per trade minus your rule-breakers' R per trade. Red when in-plan trades earn more R per trade than rule-breakers." />
                  </div>

                  {/* Hero: the gap value. Sign forced negative when
                      unfavorable — visualizes lost edge. */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ ...heroStyle, color: gapColor }}>
                      {fmtRpt(unfavorable ? -Math.abs(gap) : Math.abs(gap))}
                    </div>
                    <div style={{ fontFamily: fm, fontSize: 13, color: '#9a9da5', alignSelf: 'flex-end', paddingBottom: 8 }}>
                      / trade
                    </div>
                  </div>

                  <div style={{ ...supportStyle, marginTop: 10, marginBottom: 14 }}>
                    In Plan {fmtRpt(planRpt)} vs Broke {fmtRpt(brokeRpt)}
                  </div>

                  {/* Two-bar comparison visual */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fm, fontSize: 11, color: '#9a9da5', marginBottom: 4 }}>
                        <span>IN PLAN</span>
                        <span style={{ color: teal, fontWeight: 600 }}>{fmtRpt(planRpt)}</span>
                      </div>
                      <div style={trackBase}>
                        <div style={{ width: `${planBarPct.toFixed(2)}%`, height: '100%', background: teal, transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fm, fontSize: 11, color: '#9a9da5', marginBottom: 4 }}>
                        <span>BROKE RULES</span>
                        <span style={{ color: unfavorable ? red : '#fff', fontWeight: 600 }}>{fmtRpt(brokeRpt)}</span>
                      </div>
                      <div style={trackBase}>
                        <div style={{ width: `${brokeBarPct.toFixed(2)}%`, height: '100%', background: unfavorable ? red : '#4b5563', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  </div>

                  {/* Dollar context — only when it's a meaningful amount.
                      Per spec: hide below $100 since the visual already
                      tells the story. */}
                  {showDollar && (
                    <div style={{ fontFamily: fm, fontSize: 12, color: red, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,68,68,0.15)', lineHeight: 1.4 }}>
                      ~{formatNumber(projectedGain, { currency: true, decimals: 0 })} lost vs in-plan rate
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        );
      })()}

      {/* ═══ 2 · STRATEGY BREAKDOWN + TICKER PERFORMANCE ═══ */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', position: 'relative' }}>
        <SectionNum n={2} />
        {/* Strategy Breakdown — clean table */}
        {(() => {
          const visible = showAllStrategies ? strategies : strategies.slice(0, 6);
          const colStyle: React.CSSProperties = { fontFamily: fm, fontSize: 14, color: '#aab0bd', textAlign: 'center', whiteSpace: 'nowrap' };
          return (
            <div style={{ flex: '0 0 60%', minWidth: 300, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '24px 28px', boxSizing: 'border-box' }}>
              <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Strategy Breakdown</div>
              <div style={{ fontFamily: fm, fontSize: 13, color: '#aab0bd', marginBottom: 14 }}>Sorted by total P/L</div>

              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.6fr 0.7fr 0.6fr 0.8fr 1fr', gap: 0, padding: '0 0 8px', borderBottom: '1px solid #2A3143' }}>
                {['Strategy', 'Trades', 'Win Rate', 'Avg R', 'Avg P/L', 'Total'].map(h => (
                  <div key={h} style={{ fontFamily: fm, fontSize: 13, color: '#aab0bd', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: h === 'Strategy' ? 'left' : 'center' }}>{h}</div>
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
                  <div style={{ ...colStyle, color: s.total >= 0 ? teal : red, fontFamily: fd, fontWeight: 700, fontSize: 15 }}>{fmtDollar(s.total)}</div>
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

        {/* Ticker Performance — full rewrite.
            The old version computed two views from the analytics
            output: `tickers` (every ticker, ranked by NET P/L) for
            Wins, and `tickerLosses` (filtered to NET P/L < 0) for
            Losses. The Losses filter hid any ticker whose winning
            trades outweighed its losing trades — so NVDA with a 38%
            win rate (62% losers) didn't appear because its winners
            were larger.
            New version computes GROSS wins and GROSS losses per
            ticker by iterating raw trades. A ticker shows up in the
            Wins view if it has any winning trade, in the Losses view
            if it has any losing trade. The two views are independent
            reports of gross-side performance, not net. */}
        {(() => {
          // Color lookup — reuse the existing `tickers` array (which
          // already maps ticker → brand color via TICKER_COLORS in
          // shared.ts) instead of duplicating the map.
          const colorOf = (t: string) =>
            tickers.find(x => x.t === t)?.color || '#6b7280';

          // Aggregate gross wins / losses per ticker from raw trades.
          // Skipping pl === 0 (breakevens) intentionally — they're
          // neither wins nor losses by definition.
          const winsByTicker   = new Map<string, { n: number; total: number }>();
          const lossesByTicker = new Map<string, { n: number; total: number }>();
          trades.forEach(t => {
            if (t.pl > 0) {
              const cur = winsByTicker.get(t.ticker) || { n: 0, total: 0 };
              winsByTicker.set(t.ticker, { n: cur.n + 1, total: cur.total + t.pl });
            } else if (t.pl < 0) {
              const cur = lossesByTicker.get(t.ticker) || { n: 0, total: 0 };
              lossesByTicker.set(t.ticker, { n: cur.n + 1, total: cur.total + t.pl }); // total stays negative
            }
          });

          type GrossRow = { t: string; color: string; n: number; total: number };
          const winsView: GrossRow[] = Array.from(winsByTicker.entries())
            .map(([t, v]) => ({ t, color: colorOf(t), n: v.n, total: v.total }))
            .sort((a, b) => b.total - a.total); // most won first

          const lossesView: GrossRow[] = Array.from(lossesByTicker.entries())
            .map(([t, v]) => ({ t, color: colorOf(t), n: v.n, total: v.total }))
            .sort((a, b) => a.total - b.total); // most lost (most negative) first

          // Net view — every ticker with any trade. n = total trade
          // count (wins + losses + BE), total = sum of all P/L. Sorted
          // most positive first so the "best" ticker is on top and the
          // bottom row is your biggest net bleed.
          const netByTicker = new Map<string, { n: number; total: number }>();
          trades.forEach(t => {
            const cur = netByTicker.get(t.ticker) || { n: 0, total: 0 };
            netByTicker.set(t.ticker, { n: cur.n + 1, total: cur.total + t.pl });
          });
          const netView: GrossRow[] = Array.from(netByTicker.entries())
            .map(([t, v]) => ({ t, color: colorOf(t), n: v.n, total: v.total }))
            .sort((a, b) => b.total - a.total);

          const source  = tickerView === 'wins' ? winsView : tickerView === 'losses' ? lossesView : netView;
          // Bar scale is per-view — the top row always renders full
          // width regardless of which view is active.
          const maxAbs  = Math.max(...source.map(s => Math.abs(s.total)), 1);
          const visible = showAllTickers ? source : source.slice(0, 4);

          const isWins      = tickerView === 'wins';
          const isNet       = tickerView === 'net';
          // accentColor / gradStart are only used for wins/losses
          // (single-color view). Net rows compute their own colors
          // per-row based on the sign of `total`.
          const accentColor = isWins ? teal : red;
          const gradStart   = isWins ? 'rgba(0,212,160,0.25)' : 'rgba(255,68,68,0.25)';
          const subtitle    = isNet
            ? 'Net P/L by ticker.'
            : isWins ? 'Where your wins came from' : 'Where your losses came from';
          const noun        = isWins ? 'winning' : 'losing';

          // Empty state — no trades on that side at all.
          if (source.length === 0) {
            return (
              <div style={{ flex: 1, minWidth: 300, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '24px 28px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
                  <div>
                    <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Ticker performance</div>
                    <div style={{ fontSize: 13, color: '#aab0bd', marginTop: 4 }}>{subtitle}</div>
                  </div>
                </div>
                <div style={{ fontFamily: fm, fontSize: 14, color: '#aab0bd', textAlign: 'center', padding: '24px 0' }}>
                  {isNet ? 'No trades in the dataset.' : `No ${noun} trades in the dataset.`}
                </div>
              </div>
            );
          }

          return (
            <div style={{ flex: 1, minWidth: 300, background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '24px 28px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>Ticker performance</div>
                  <div style={{ fontSize: 13, color: '#aab0bd', marginTop: 4 }}>{subtitle}</div>
                </div>
                {/* Wins / Losses / Net toggle */}
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
                  <button
                    onClick={() => setTickerView('net')}
                    style={{
                      padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                      fontFamily: fm, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                      background: tickerView === 'net' ? '#c9cdd4' : 'transparent',
                      color: tickerView === 'net' ? '#0A0D14' : '#aab0bd',
                      transition: 'all 0.2s ease',
                    }}
                  >Net</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {visible.map(tk => {
                  const barWidth = (Math.abs(tk.total) / maxAbs) * 100;
                  const domain = tickerDomains[tk.t];
                  // In Net view, each row picks its own color based on
                  // the sign of its net total — teal positive, red
                  // negative, muted grey exactly zero. Wins/Losses
                  // views keep the single accent color computed above.
                  const rowAccent = isNet
                    ? (tk.total > 0 ? teal : tk.total < 0 ? red : '#6b7280')
                    : accentColor;
                  const rowGradStart = isNet
                    ? (tk.total > 0 ? 'rgba(0,212,160,0.25)' : tk.total < 0 ? 'rgba(255,68,68,0.25)' : 'rgba(107,114,128,0.25)')
                    : gradStart;
                  const rowText = isNet
                    ? `${tk.n} total trade${tk.n === 1 ? '' : 's'}`
                    : `${tk.n} ${noun} trade${tk.n === 1 ? '' : 's'}`;
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
                            background: `linear-gradient(to right, ${rowGradStart}, ${rowAccent})`,
                            transition: 'width 0.5s ease',
                          }}
                        />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: fm, letterSpacing: 0.5, fontWeight: 500, textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
                          {rowText}
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: rowAccent, fontFamily: fd, width: 86, textAlign: 'right', flexShrink: 0 }}>{fmtDollar(tk.total)}</div>
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
      <div style={{ background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '56px 32px 32px', position: 'relative', marginTop: 22 }}>
        <SectionNum n={3} />

        {/* Header + week dropdown (centered) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28, gap: 10 }}>
          <h3 style={{ fontFamily: fd, fontSize: 30, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>Rules vs. Execution</h3>
          <p style={{ color: '#aab0bd', fontSize: 16, margin: '4px 0 0', textAlign: 'center', maxWidth: 620, lineHeight: 1.4 }}>How your trading and psychology compared to the rules you set</p>
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
                fontSize: 14,
                fontWeight: 600,
                padding: '10px 40px 10px 18px',
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
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: teal, pointerEvents: 'none', fontSize: 13 }}>▼</span>
          </div>
        </div>

        {/* Empty state — shown when the selected past week had no goals set. */}
        {!hasGoalsForSelectedWeek && (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#7a7d85',
            fontFamily: fm,
            fontSize: '12px',
            border: '1px dashed #1a1b22',
            borderRadius: '8px',
            backgroundColor: '#13141a'
          }}>
            No goals were set for this week.
          </div>
        )}

        {/* Goal cards (up to 3) — sit cleanly beneath the week dropdown
            row (the old `marginTop: -40` lift was causing the dropdown
            to overlap card #2). All 3 cards share a minHeight so they
            stay flush even when one title wraps to 2 lines. Titles
            line-clamp at 2 lines with ellipsis. Shows ALL of this
            week's goals regardless of measurability; the per-column
            panels below filter to trade-/journal-measurable subsets. */}
        {hasGoalsForSelectedWeek && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 32, flexWrap: 'wrap', alignItems: 'stretch' }}>
          {weekGoals.slice(0, 3).map((g, idx) => (
            <div key={g.id} style={{
              flex: '1 1 260px',
              minHeight: 96,
              background: '#1f2430',
              border: `1px solid ${teal}`,
              borderRadius: 12,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: '0 6px 18px rgba(0,212,160,0.15), 0 0 0 1px rgba(0,212,160,0.08)',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(0,212,160,0.15)',
                border: `1.5px solid ${teal}`,
                color: teal,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: fd, fontSize: 16, fontWeight: 700,
                flexShrink: 0,
              }}>{idx + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div title={g.title || '(untitled)'} style={{
                  fontSize: 15,
                  color: '#ffffff',
                  fontFamily: fm,
                  fontWeight: 600,
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                }}>{g.title || '(untitled)'}</div>
              </div>
              <span style={{
                background: 'rgba(0,212,160,0.15)', color: teal,
                fontSize: 10.5, letterSpacing: 1.5, fontWeight: 700,
                padding: '4px 10px', borderRadius: 999, fontFamily: fm, flexShrink: 0,
              }}>{(g.goalType || 'General').toUpperCase().split(' ')[0]}</span>
            </div>
          ))}
        </div>
        )}

        {/* Split panel: Trades vs. Goals (blue) | Psych vs. Goals (green)
            — each goal now renders as its own candlestick. Body fills from
            the bottom up to the compliance/alignment percentage. Hollow
            grey outline when no evidence exists. Click a candle to expand
            the per-trade drilldown beneath the row. Hidden when the week
            has no goals. */}
        {hasGoalsForSelectedWeek && (() => {
          // Candle geometry — shared by both panels.
          const CANDLE_H = 170;           // body height
          const CANDLE_W = 46;            // body width
          const WICK_EXT = 14;            // wick length above + below body
          const SVG_W = 90;
          const SVG_H = CANDLE_H + WICK_EXT * 2 + 20; // +room for pct label on top

          const renderGoalCandle = (
            section: 'trades' | 'psych',
            i: number,
            row: GoalComplianceRow,
          ) => {
            const evaluable = row.target;
            const nullCount = row.nullCount;
            const allNull = evaluable === 0;
            const pct = allNull ? 0 : Math.min(100, Math.round((row.actual / evaluable) * 100));
            // expanded/hovered state keys off the goal's original
            // index in weekGoals — so clicking a candle in the trade
            // column and the same goal in the psych column stay
            // independently expandable.
            const isExpanded = expandedRow?.section === section && expandedRow.goalIdx === row.goalIdx;
            const isHovered = hoveredRow?.section === section && hoveredRow.goalIdx === row.goalIdx;

            const accent = section === 'trades' ? blue : teal;
            const borderColor = allNull ? '#7a7d85' : accent;
            const fillRgba = section === 'trades' ? 'rgba(74,158,255,0.75)' : 'rgba(0,212,160,0.8)';

            const bodyX = (SVG_W - CANDLE_W) / 2;
            const bodyTop = WICK_EXT + 20;
            const filled = (pct / 100) * CANDLE_H;
            const fillY = bodyTop + (CANDLE_H - filled);

            return (
              <div
                key={`${section}-${row.goalIdx}`}
                onClick={() => setExpandedRow(prev => prev && prev.section === section && prev.goalIdx === row.goalIdx ? null : { section, goalIdx: row.goalIdx })}
                onMouseEnter={() => setHoveredRow({ section, goalIdx: row.goalIdx })}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  flex: '1 1 0',
                  cursor: 'pointer',
                  padding: '10px 4px 14px',
                  borderRadius: 8,
                  background: isHovered || isExpanded ? '#141620' : 'transparent',
                  transition: 'background 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  minWidth: 0,
                }}
              >
                <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }}>
                  {/* Percentage / fraction label above the candle */}
                  <text
                    x={SVG_W / 2}
                    y={14}
                    textAnchor="middle"
                    fontFamily="Chakra Petch, sans-serif"
                    fontSize="15"
                    fontWeight="700"
                    fill={allNull ? '#7a7d85' : accent}
                  >
                    {allNull ? '—' : `${pct}%`}
                  </text>
                  {/* Upper wick */}
                  <line
                    x1={SVG_W / 2} y1={bodyTop - WICK_EXT}
                    x2={SVG_W / 2} y2={bodyTop}
                    stroke={borderColor} strokeWidth="2" strokeLinecap="round"
                  />
                  {/* Body outline (always visible) */}
                  <rect
                    x={bodyX} y={bodyTop}
                    width={CANDLE_W} height={CANDLE_H}
                    rx={3}
                    fill={allNull ? 'transparent' : 'rgba(255,255,255,0.02)'}
                    stroke={borderColor} strokeWidth="2"
                    strokeDasharray={allNull ? '4 4' : undefined}
                  />
                  {/* Fill — teal/blue liquid growing from the bottom up */}
                  {!allNull && filled > 0 && (
                    <rect
                      x={bodyX} y={fillY}
                      width={CANDLE_W} height={filled}
                      rx={3}
                      fill={fillRgba}
                    />
                  )}
                  {/* Lower wick */}
                  <line
                    x1={SVG_W / 2} y1={bodyTop + CANDLE_H}
                    x2={SVG_W / 2} y2={bodyTop + CANDLE_H + WICK_EXT}
                    stroke={borderColor} strokeWidth="2" strokeLinecap="round"
                  />
                </svg>
                <div style={{ fontFamily: fm, fontSize: 13, fontWeight: 600, color: allNull ? '#7a7d85' : '#e8e8f0', textAlign: 'center' }}>
                  {allNull ? 'Not yet scored' : `${row.actual} / ${evaluable} trades`}
                </div>
                {nullCount > 0 && !allNull && (
                  <div style={{ fontFamily: fm, fontSize: 11, color: '#7a7d85', textAlign: 'center' }}>
                    {nullCount} not evaluated
                  </div>
                )}
                <div style={{
                  fontFamily: fm,
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#ffffff',
                  textAlign: 'center',
                  lineHeight: 1.4,
                  marginTop: 6,
                  maxWidth: 200,
                  // Full wrap — no line clamp, no truncation. Goal
                  // titles are the rule being scored; they need to
                  // read in full. The candle row gets enough vertical
                  // space below via marginBottom on the panel grid.
                  wordBreak: 'break-word',
                }}>
                  <span style={{ color: accent, fontWeight: 700 }}>{i + 1}. </span>{row.title}
                </div>
                <span style={{ fontFamily: fm, fontSize: 11, color: '#7a7d85', marginTop: 2 }}>{isExpanded ? '▴ hide' : '▾ details'}</span>
              </div>
            );
          };

          return (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {/* LEFT — Trades vs. Goals (BLUE) */}
              <div style={{
                flex: '1 1 340px',
                background: '#12151d',
                border: '1px solid #2A3143',
                borderLeft: `3px solid ${blue}`,
                borderRadius: 10,
                padding: '24px 26px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, background: blue, borderRadius: 2, display: 'inline-block' }} />
                  <h4 style={{ fontFamily: fd, fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: 0.5 }}>Trades vs. Goals</h4>
                </div>
                <p style={{ color: '#aab0bd', fontSize: 14, margin: '0 0 20px', letterSpacing: 0.3, lineHeight: 1.5 }}>
                  Did each trade&apos;s execution match the rule? Measured from the trade data itself — entry/exit prices, R:R, sizing.
                </p>
                {selectedWeekTradeGoals.length === 0 ? (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#7a7d85',
                    fontFamily: fm,
                    fontSize: 12,
                    fontStyle: 'italic',
                  }}>
                    No trade-measurable goals this week.
                  </div>
                ) : selectedWeekTradeGoals.some(g => g.empty) ? (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#7a7d85',
                    fontFamily: fm,
                    fontSize: 12,
                    fontStyle: 'italic',
                  }}>
                    No trades logged this week yet.
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      {selectedWeekTradeGoals.map((row, i) => renderGoalCandle('trades', i, row))}
                    </div>
                    {expandedRow?.section === 'trades' && (
                      <div style={{ marginTop: 14 }}>{renderDrilldown('trades', expandedRow.goalIdx)}</div>
                    )}
                  </>
                )}
              </div>

              {/* RIGHT — Psych vs. Goals (GREEN) */}
              <div style={{
                flex: '1 1 340px',
                background: '#12151d',
                border: '1px solid #2A3143',
                borderLeft: `3px solid ${teal}`,
                borderRadius: 10,
                padding: '24px 26px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, background: teal, borderRadius: 2, display: 'inline-block' }} />
                  <h4 style={{ fontFamily: fd, fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: 0.5 }}>Psych vs. Goals</h4>
                </div>
                <p style={{ color: '#aab0bd', fontSize: 14, margin: '0 0 20px', letterSpacing: 0.3, lineHeight: 1.5 }}>
                  Did the mindset and process behind each trade match the rule? Measured from your journal language — patience, discipline, impulse tells.
                </p>
                {selectedWeekPsychGoals.length === 0 ? (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#7a7d85',
                    fontFamily: fm,
                    fontSize: 12,
                    fontStyle: 'italic',
                  }}>
                    No journal-measurable goals this week.
                  </div>
                ) : selectedWeekPsychGoals.some(g => g.empty) ? (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#7a7d85',
                    fontFamily: fm,
                    fontSize: 12,
                    fontStyle: 'italic',
                  }}>
                    No trades logged this week yet.
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      {selectedWeekPsychGoals.map((row, i) => renderGoalCandle('psych', i, row))}
                    </div>
                    {expandedRow?.section === 'psych' && (
                      <div style={{ marginTop: 14 }}>{renderDrilldown('psych', expandedRow.goalIdx)}</div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* ═══ QUANTITATIVE TARGETS — glass candlestick indicators ═══ */}
        {(() => {
          // Per-week targets. If the selected week has never been viewed
          // before, getQuantTargetsForWeek lazy-stamps the current live
          // profile targets into that slot. Past-week slots stay frozen.
          const weekTargets = selectedWeekBucket
            ? getQuantTargetsForWeek(toISODate(selectedWeekBucket.start))
            : { quantitativeTargets: quantTargetsSnapshot.quantitativeTargets, customQuantTargets: quantTargetsSnapshot.customQuantTargets };
          const allTargets = [...weekTargets.quantitativeTargets, ...weekTargets.customQuantTargets];
          if (allTargets.length === 0) return null;

          const CANDLE_H = 130;
          const CANDLE_W = 36;
          const WICK_W = 2;
          const WICK_EXT = 14;

          // Actuals now come from the SELECTED week's bucket, not the
          // current week's. Switching the Rules vs Execution dropdown
          // moves this entire block along with it.
          const weekTrades = selectedWeekBucket?.trades || [];
          // Classification by t.result, denominator excludes BE-intent
          // trades — keeps in sync with the headline winRate formula
          // in shared.ts.
          const weekWins = weekTrades.filter(t => t.result === 'WIN');
          const weekDecisive = weekTrades.filter(t => t.result === 'WIN' || t.result === 'LOSS').length;
          const weekWR = weekDecisive > 0 ? (weekWins.length / weekDecisive) * 100 : 0;
          const weekRRValues = weekWins.map(t => parseRr(t.riskReward));
          const weekAvgR = weekRRValues.length > 0 ? weekRRValues.reduce((a, b) => a + b, 0) / weekRRValues.length : 0;
          const weekTradeCount = weekTrades.length;

          const subtitleLabel = selectedWeekIdx === 0
            ? 'This week'
            : (selectedWeekBucket?.weekLabel || 'This week');

          return (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #2A3143' }}>
              <h4 style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: 0.5 }}>Quantitative Targets</h4>
              <p style={{ fontSize: 14, margin: '6px 0 22px', letterSpacing: 0.3, fontFamily: fm }}>
                <strong style={{ color: teal }}>{subtitleLabel}</strong>
                <span style={{ color: '#aab0bd' }}> vs your </span>
                <span style={{ color: teal }}>weekly targets</span>
              </p>
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

                  // Empty week → no actual to show. Otherwise Win Rate
                  // would render 0.0% and Avg R would render R 0.00,
                  // which look like real-but-terrible results instead of
                  // "no data yet".
                  if (weekTradeCount === 0) actual = null;

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

      {/* ═══ 5 · ADVANCED ANALYSIS TOOLS ═══ */}
      <div style={{ position: 'relative' }}>
        <SectionNum n={5} />

        {/* Section title */}
        <div style={{ paddingLeft: 40, marginBottom: 16 }}>
          <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>Advanced Analysis Tools</div>
        </div>

        {/* Browser-style tabs */}
        <div style={{ display: 'flex', gap: 0, paddingLeft: 0 }}>
          {([
            { key: 'timeOfDay' as const, label: 'Time of Day' },
            { key: 'sizeEfficiency' as const, label: 'Size Efficiency' },
          ]).map(tab => {
            const active = section5Tab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSection5Tab(tab.key)}
                style={{
                  padding: '14px 28px',
                  cursor: 'pointer',
                  fontFamily: fd,
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  border: active ? '1px solid #2A3143' : '1px solid transparent',
                  borderBottom: active ? '1px solid #141822' : '1px solid #2A3143',
                  borderRadius: active ? '10px 10px 0 0' : '10px 10px 0 0',
                  background: active ? '#141822' : 'transparent',
                  color: active ? '#fff' : '#7db8e0',
                  transition: 'all 0.2s',
                  position: 'relative',
                  zIndex: active ? 2 : 1,
                  marginBottom: -1,
                }}
              >{tab.label}</button>
            );
          })}
        </div>

        {/* Tab content panel */}
        <div style={{ background: '#141822', border: '1px solid #2A3143', borderRadius: '0 12px 12px 12px', padding: '24px 28px' }}>

        {/* ── TIME OF DAY TAB ── */}
        {section5Tab === 'timeOfDay' && (() => {
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
          const numH = hours.length;
          const xStep = numH > 1 ? plotW / (numH - 1) : 0;

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
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontFamily: fm, fontSize: 14, color: '#aab0bd' }}>P/L by hour — green is winning trades, red is losing trades</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => setChartZoom(z => Math.max(0.6, z - 0.2))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #2A3143', background: '#0f1318', color: '#aab0bd', fontFamily: fm, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>−</button>
                  <span style={{ fontFamily: fm, fontSize: 13, color: '#aab0bd', minWidth: 36, textAlign: 'center' }}>{Math.round(chartZoom * 100)}%</span>
                  <button onClick={() => setChartZoom(z => Math.min(2, z + 0.2))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #2A3143', background: '#0f1318', color: '#aab0bd', fontFamily: fm, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</button>
                </div>
              </div>

              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
                {[-1, -0.5, 0, 0.5, 1].map(frac => {
                  const y = pad.top + plotH / 2 - frac * (plotH / 2);
                  return (
                    <g key={frac}>
                      <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke="rgba(42,49,67,0.4)" strokeWidth="1" />
                      <text x={pad.left - 8} y={y + 3} textAnchor="end" fill="#888" fontSize="10" fontFamily="DM Mono, monospace">{frac === 0 ? '$0' : fmtDollar(Math.round(frac * yMax))}</text>
                    </g>
                  );
                })}
                <path d={winPath} fill="none" stroke={teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {hourWinPL.map((v, i) => (<circle key={`w${i}`} cx={pad.left + i * xStep} cy={pad.top + plotH / 2 - (v / yMax) * (plotH / 2)} r="3.5" fill={teal} />))}
                <path d={lossPath} fill="none" stroke={red} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {hourLossPL.map((v, i) => (<circle key={`l${i}`} cx={pad.left + i * xStep} cy={pad.top + plotH / 2 - (v / yMax) * (plotH / 2)} r="3.5" fill={red} />))}
                <line x1={pad.left} x2={W - pad.right} y1={zeroY} y2={zeroY} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4,4" />
                {hours.map((h, i) => (<text key={h.h} x={pad.left + i * xStep} y={H - 6} textAnchor="middle" fill="#888" fontSize="10" fontFamily="DM Mono, monospace">{h.h}</text>))}
              </svg>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 3, background: teal, borderRadius: 2, display: 'inline-block' }} /><span style={{ fontFamily: fm, fontSize: 13, color: '#aab0bd' }}>Winning trades</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 3, background: red, borderRadius: 2, display: 'inline-block' }} /><span style={{ fontFamily: fm, fontSize: 13, color: '#aab0bd' }}>Losing trades</span></div>
              </div>
              <div style={{ fontFamily: fm, fontSize: 13, color: '#aab0bd', marginTop: 10, textAlign: 'center' }}>
                Best hour: <span style={{ color: teal }}>{bestHour.h} ({fmtDollar(bestHour.pl)})</span>
                {' · '}
                Worst hour: <span style={{ color: red }}>{worstHour.h} ({fmtDollar(worstHour.pl)})</span>
              </div>
            </>
          );
        })()}

        {/* ── SIZE EFFICIENCY TAB ── */}
        {section5Tab === 'sizeEfficiency' && (() => {
          // Grouped bar chart: trades bucketed by how much was risked
          const bucketDefs = [
            { label: 'Under $300', desc: 'Small risk trades', min: 0, max: 300 },
            { label: '$300 – $500', desc: 'Medium risk trades', min: 300, max: 500 },
            { label: '$500 – $700', desc: 'Larger risk trades', min: 500, max: 700 },
            { label: 'Over $700', desc: 'Biggest risk trades', min: 700, max: Infinity },
          ];

          const buckets = bucketDefs.map(b => {
            const inBucket = trades.filter(t => t.riskAmount >= b.min && t.riskAmount < b.max);
            // Classification by t.result alone — drops the old defensive
            // OR clauses that double-counted BE-intent trades with
            // non-zero slippage as wins or losses.
            const wins = inBucket.filter(t => t.result === 'WIN');
            const losses = inBucket.filter(t => t.result === 'LOSS');
            return {
              ...b,
              count: inBucket.length,
              winCount: wins.length,
              lossCount: losses.length,
              avgRisk: inBucket.length > 0 ? inBucket.reduce((s, t) => s + t.riskAmount, 0) / inBucket.length : 0,
              avgWin: wins.length > 0 ? wins.reduce((s, t) => s + t.pl, 0) / wins.length : 0,
              avgLoss: losses.length > 0 ? losses.reduce((s, t) => s + t.pl, 0) / losses.length : 0,
              winRate: inBucket.length > 0 ? (wins.length / inBucket.length) * 100 : 0,
            };
          });

          const allBarVals = buckets.flatMap(b => [b.avgRisk, b.avgWin, Math.abs(b.avgLoss)]);
          const barMax = Math.max(1, ...allBarVals);
          const yMax = barMax * 1.2;

          const W = 700;
          const H = Math.round(320 * sizeZoom);
          const pad = { top: 30, bottom: 50, left: 80, right: 20 };
          const plotW = W - pad.left - pad.right;
          const plotH = H - pad.top - pad.bottom;
          const groupW = plotW / buckets.length;
          const barW = groupW * 0.22;
          const barGap = groupW * 0.04;
          const barH = (v: number) => (Math.abs(v) / yMax) * plotH;
          const baselineY = pad.top + plotH;
          const toY = (v: number) => baselineY - (Math.abs(v) / yMax) * plotH;

          return (
            <>
              {/* Title */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Win Size vs. Increase in Risk</div>
                  <div style={{ fontFamily: fm, fontSize: 14, color: '#aab0bd', marginBottom: 16, lineHeight: 1.5 }}>
                    Trades grouped by risk amount. Each group shows avg risk (faded), avg win (green), avg loss (red).
                  </div>
                </div>
                <div style={{ fontFamily: fm, fontSize: 11, color: '#7a7d85', flexShrink: 0, marginTop: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                  Drag corner to resize · {Math.round(sizeZoom * 100)}%
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 22, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 12, background: teal, opacity: 0.15, borderRadius: 2, display: 'inline-block', border: `1px solid ${teal}` }} />
                  <span style={{ fontFamily: fm, fontSize: 13, color: '#aab0bd' }}>Avg risk</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 12, background: teal, borderRadius: 2, display: 'inline-block' }} />
                  <span style={{ fontFamily: fm, fontSize: 13, color: '#aab0bd' }}>Avg win</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 12, background: red, borderRadius: 2, display: 'inline-block' }} />
                  <span style={{ fontFamily: fm, fontSize: 13, color: '#aab0bd' }}>Avg loss</span>
                </div>
              </div>

              <div style={{ position: 'relative', userSelect: sizeResizeDrag ? 'none' : 'auto' }}>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                  {/* Y grid + labels */}
                  {[0, 0.25, 0.5, 0.75, 1.0].map(frac => {
                    const val = frac * yMax;
                    const y = baselineY - frac * plotH;
                    return (
                      <g key={frac}>
                        <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke="rgba(42,49,67,0.3)" strokeWidth="1" />
                        <text x={pad.left - 8} y={y + 3} textAnchor="end" fill="#888" fontSize="9" fontFamily="DM Mono, monospace">
                          ${Math.round(val).toLocaleString()}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bucket groups */}
                  {buckets.map((b, gi) => {
                    const groupX = pad.left + gi * groupW + groupW * 0.1;
                    return (
                      <g key={b.label}>
                        {/* Risk reference bar (faded) */}
                        <rect x={groupX} y={toY(b.avgRisk)} width={barW} height={barH(b.avgRisk)} rx={4} fill={teal} opacity={0.15} stroke={teal} strokeWidth={1} strokeOpacity={0.35} />
                        {/* Avg win bar */}
                        <rect x={groupX + barW + barGap} y={toY(b.avgWin)} width={barW} height={barH(b.avgWin)} rx={4} fill={teal} />
                        {/* Avg loss bar */}
                        <rect x={groupX + 2 * (barW + barGap)} y={toY(Math.abs(b.avgLoss))} width={barW} height={barH(b.avgLoss)} rx={4} fill={red} />

                        {/* Value labels above bars */}
                        {b.avgRisk > 0 && (
                          <text x={groupX + barW / 2} y={toY(b.avgRisk) - 5} textAnchor="middle" fill="#aab0bd" fontSize="9" fontWeight="500" fontFamily="DM Mono, monospace">${Math.round(b.avgRisk)}</text>
                        )}
                        {b.avgWin > 0 && (
                          <text x={groupX + barW + barGap + barW / 2} y={toY(b.avgWin) - 5} textAnchor="middle" fill={teal} fontSize="9" fontWeight="600" fontFamily="DM Mono, monospace">+${Math.round(b.avgWin)}</text>
                        )}
                        {b.avgLoss < 0 && (
                          <text x={groupX + 2 * (barW + barGap) + barW / 2} y={toY(Math.abs(b.avgLoss)) - 5} textAnchor="middle" fill={red} fontSize="9" fontWeight="600" fontFamily="DM Mono, monospace">-${Math.round(Math.abs(b.avgLoss))}</text>
                        )}

                        {/* X-axis bucket label */}
                        <text x={pad.left + gi * groupW + groupW / 2} y={baselineY + 18} textAnchor="middle" fill="#aab0bd" fontSize="10" fontFamily="DM Mono, monospace">{b.label}</text>
                      </g>
                    );
                  })}
                </svg>
                {/* Drag-to-resize handle: bottom-right corner of the chart */}
                <div
                  onMouseDown={e => { e.preventDefault(); setSizeResizeDrag({ startY: e.clientY, startZoom: sizeZoom }); }}
                  title="Drag to resize chart"
                  style={{
                    position: 'absolute',
                    right: 2,
                    bottom: 2,
                    width: 18,
                    height: 18,
                    cursor: 'ns-resize',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-end',
                    padding: 2,
                    borderRadius: 3,
                    background: sizeResizeDrag ? 'rgba(0,212,160,0.2)' : 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => { if (!sizeResizeDrag) e.currentTarget.style.background = 'rgba(0,212,160,0.1)'; }}
                  onMouseLeave={e => { if (!sizeResizeDrag) e.currentTarget.style.background = 'transparent'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <line x1="3" y1="13" x2="13" y2="3" stroke={teal} strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="7" y1="13" x2="13" y2="7" stroke={teal} strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="11" y1="13" x2="13" y2="11" stroke={teal} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Stat cards per bucket */}
              <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                {buckets.map(b => {
                  const winPerDollar = b.avgRisk > 0 && b.avgWin > 0 ? b.avgWin / b.avgRisk : 0;
                  const lossPerDollar = b.avgRisk > 0 && b.avgLoss < 0 ? Math.abs(b.avgLoss) / b.avgRisk : 0;
                  return (
                    <div key={b.label} style={{ flex: 1, background: '#0f1318', border: '1px solid #2A3143', borderRadius: 10, padding: '18px 20px' }}>
                      <div style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{b.label}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <span style={{ fontFamily: fm, fontSize: 14, color: '#aab0bd' }}>Trades</span>
                        <span style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: teal }}>{b.count}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <span style={{ fontFamily: fm, fontSize: 14, color: '#aab0bd' }}>Win rate</span>
                        <span style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff' }}>{b.winRate.toFixed(0)}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <span style={{ fontFamily: fm, fontSize: 14, color: '#aab0bd' }}>Record</span>
                        <span style={{ fontFamily: fm, fontSize: 14, fontWeight: 600, color: '#d0d0d8' }}><span style={{ color: teal }}>{b.winCount}W</span> / <span style={{ color: red }}>{b.lossCount}L</span></span>
                      </div>
                      {b.count > 0 && (
                        <div style={{ borderTop: '1px solid #2A3143', marginTop: 10, paddingTop: 10 }}>
                          <div style={{ fontFamily: fm, fontSize: 14, color: '#aab0bd', letterSpacing: 0.5, marginBottom: 5 }}>Per $1 risked</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontFamily: fm, fontSize: 14, color: teal, fontWeight: 600 }}>Win ${winPerDollar.toFixed(2)}</span>
                            <span style={{ fontFamily: fm, fontSize: 14, color: red, fontWeight: 600 }}>Lose ${lossPerDollar.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Interpretation */}
              <div style={{ marginTop: 16, background: '#12151d', borderLeft: `3px solid ${teal}`, borderRadius: '0 8px 8px 0', padding: '16px 20px', fontFamily: fm, fontSize: 14, color: '#ccc', lineHeight: 1.7 }}>
                <strong style={{ color: '#fff' }}>How to read this:</strong> If the green bar grows proportionally with the faded bar as you move right, sizing up is working. If green flattens while red grows, you are cutting winners short at higher size.
              </div>
            </>
          );
        })()}

        </div>
      </div>

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

