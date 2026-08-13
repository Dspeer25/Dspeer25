'use client';
import React, { useEffect, useRef, useState } from 'react';
import { fm, fd, Trade, Goal, NumberGoalRule, buildTraderStats, computeAnalytics, TradeClassification, ClassificationBatchSummary, readClassifications, writeClassifications, readClassificationSummary, writeClassificationSummary, buildGoalsContext, buildProfileContext, buildDateContext, QuantitativeTarget, readQuantTargets, RegressionResult, resolveTradeVariable, resolveTradeFilter, linearRegression, REGRESSION_VARIABLE_ALIASES, startOfWeek, toISODate, readAllGoals, getGoalsForWeek, getCurrentWeekStart, getCurrentTradingWeekStart, getQuantTargetsForWeek, parseLocalDate, CLASSIFICATION_STORE_KEY, CLASSIFY_PROMPT_VERSION, formatNumber, parseRr, getEffectiveKind, scoreNumberGoal, readAccountSize, computeExpectancy, computeProfitFactor, computeExpectancyR, computeLossGrowth, EXPECTANCY_R_MIN, LOSS_GROWTH_MIN, timeToMinutes } from './shared';
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

// Adherence color bands for the Psychology view — a bad week should
// read red at a glance and a strong week green, instead of everything
// rendering in the same flat teal. Applied to the bar fill and the
// percentage readout, not the structural accent.
function adherenceColor(pct: number): string {
  if (pct < 50) return '#ff4444';   // red
  if (pct < 60) return '#ff7a2f';   // orange
  if (pct < 75) return '#ffb347';   // lighter orange
  if (pct < 90) return '#b6e34d';   // green-yellow
  return '#00d4a0';                 // green
}

// Pulls the decisive evidence out of a citation reason — quoted
// journal phrases or numeric values (R-multiple, %, $) — so a citation
// can show just the incriminating/affirming words instead of the full
// explanatory sentence. The single-quote branch uses look-arounds so
// contractions (can't, doesn't) aren't mistaken for quote delimiters.
// Returns [] when the reason carries no quotable evidence (e.g. a pass
// with no violation language).
const EVIDENCE_RE = /("[^"]+"|“[^”]+”|‘[^’]+’|(?<![A-Za-z])'[^']+'(?![A-Za-z])|\$[\d,]+(?:\.\d+)?|\d+(?:\.\d+)?R\b|\d+(?:\.\d+)?%)/g;
function extractEvidence(text: string): string[] {
  const out: string[] = [];
  EVIDENCE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = EVIDENCE_RE.exec(text)) !== null) out.push(m[0]);
  return out;
}

// djb2 string hash → base36. Used to key the cached Weekly Summary on
// the selected week's trade/journal/adherence content so the panel only
// re-hits Haiku when that data actually changes, not on every page load.
function hashStr(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
const WEEK_SUMMARY_CACHE_KEY = 'wickcoach_week_summaries';
const WEEK_SUMMARY_VERSION = 'ws-v1';

// ── Number-goal labeling ───────────────────────────────────────────
// Number goals are often saved with an empty title (the builder lets
// the rule stand on its own), which used to render as "(untitled)".
// describeNumberRule turns the rule into a short human label so every
// goal row shows what it actually measures.
const NUMBER_FIELD_LABEL: Record<NumberGoalRule['field'], string> = {
  riskAmount:       'Risk',
  riskReward:       'R:R',
  riskPctOfAccount: 'Risk % of account',
  time:             'Entry time',
  direction:        'Direction',
  contracts:        'Size',
  strategy:         'Strategy',
  result:           'Result',
  tradesPerDay:     'Trades/day',
  dailyLoss:        'Daily loss',
};
const NUMBER_OP_SYMBOL: Record<NumberGoalRule['operator'], string> = {
  '<=': '≤', '>=': '≥', '==': '=', '<': '<', '>': '>', '!=': '≠',
};
const describeNumberRule = (rule: NumberGoalRule): string => {
  const label = NUMBER_FIELD_LABEL[rule.field] || rule.field;
  const op = NUMBER_OP_SYMBOL[rule.operator] || rule.operator;
  let value = String(rule.value);
  if (typeof rule.value === 'number') {
    if (rule.field === 'riskPctOfAccount') value = `${rule.value}%`;
    else if (rule.field === 'riskAmount' || rule.field === 'dailyLoss') value = `$${rule.value}`;
  }
  return `${label} ${op} ${value}`;
};
// Title shown on goal-compliance rows. Falls back to the rule itself
// for number goals so they never read "(untitled)".
const goalDisplayTitle = (g: Goal): string => {
  if (g.title && g.title.trim()) return g.title.trim();
  if (g.numberRule) return describeNumberRule(g.numberRule);
  return '(untitled)';
};

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
export default function AnalysisContent({ trades = [], onShowTrade }: { trades?: Trade[]; onShowTrade?: (tradeId: string) => void }) {
  const [showAllStrategies, setShowAllStrategies] = useState(false);
  const [showAllTickers, setShowAllTickers] = useState(false);
  const [tickerView, setTickerView] = useState<'wins' | 'losses' | 'net'>('net');
  // (hoveredSlice state retired with the OUTCOME CANDLES section.)
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);
  // Only one row at a time expands. null = everything collapsed.
  const [expandedRow, setExpandedRow] = useState<{ section: 'trades' | 'psych'; goalIdx: number } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<{ section: 'trades' | 'psych'; goalIdx: number } | null>(null);
  // Rule-adherence toggle: 'numerical' = trade-data view (hero candles +
  // Trades-vs-Goals), 'psych' = journal-language view (Psych-vs-Goals).
  const [analysisView, setAnalysisView] = useState<'numerical' | 'psych'>('numerical');
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
  // Weekly Summary (Haiku) — short Mark-Douglas read on the selected
  // week. Cached per week + data-hash so it only regenerates on change.
  const [weekSummary, setWeekSummary] = useState('');
  const [weekSummaryLoading, setWeekSummaryLoading] = useState(false);
  const [weekSummaryError, setWeekSummaryError] = useState<string | null>(null);

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
  const { totals, strategies, tickers, processSplit } = a;

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
          dateContext: buildDateContext(),
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
  // (winPct / lossPct / bePct retired — the candle bar that consumed
  // them was removed when the KPI header row replaced the Outcome
  // Candles section. Win rate is now derived from computeExpectancy.)
  const circ = 2 * Math.PI * 40; // r=40

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

    // Build the current-week goal list exactly as Haiku will see it.
    // Number goals never reach Haiku (scored in JS) so they collapse to
    // an index-preserving sentinel. This string doubles as the
    // scoring-basis fingerprint below: title, type, context, and
    // scoring criteria all feed into it, so if the MEANING of any goal
    // changes, the string — and the hash — change with it.
    const currentWeekGoals = getGoalsForWeek(getCurrentWeekStart());
    const goalsList = currentWeekGoals.slice(0, 10).map((g, i) => {
      const ctx = g.context && g.context.length > 0 ? ` — context: ${g.context.join(' | ')}` : '';
      const crit = g.scoringCriteria
        ? ` — compliance: ${g.scoringCriteria.compliance}; violation: ${g.scoringCriteria.violation}; scope: ${g.scoringCriteria.scope}`
        : '';
      const k = getEffectiveKind(g);
      if (k === 'number') {
        return `${i}. (number goal — not scored by Haiku) measurability=skip`;
      }
      return `${i}. "${g.title || '(untitled)'}" [${g.goalType}] measurability=journal${ctx}${crit}`;
    }).join('\n');
    // Fingerprint of what the AI knows about this week's goals. Stamped
    // onto every cached score; a mismatch forces a re-score so adding or
    // editing a goal's context/criteria can't leave a stale verdict
    // frozen (the bug where goal #15 kept its pre-context citations).
    const goalsHash = hashStr(CLASSIFY_PROMPT_VERSION + '\n' + goalsList);

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
      // Goal MEANING changed since this trade was scored (new/edited
      // context or criteria, a retitle, or reordering) — the cached
      // verdicts reflect a stale understanding, so re-score.
      if (cached.goalsHash !== goalsHash) return true;
      return false;
    });
    if (unscored.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        // goalsList + goalsHash + currentWeekGoals were built above and
        // hoisted out of the async block so the hash can gate the
        // unscored filter. Reuse the same goalsList here — it's the
        // exact goal text the fingerprint was taken over.

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
          if (r && r.tradeId) next[r.tradeId] = { ...r, promptVersion: CLASSIFY_PROMPT_VERSION, goalsHash };
        });
        writeClassifications(next);
        setClassifications(next);

        // Per-goal evaluation summary — printed once per classify pass.
        // Use this to see whether the "bias toward evaluation" prompt
        // change is actually reducing null rates. Any goal with >20%
        // nulls indicates the prompt is still bailing for that
        // category and needs further tightening.
        try {
          // currentWeekGoals is in scope from the effect body above.
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
          title: goalDisplayTitle(g),
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

  const selectedWeekPsychGoals = buildGoalRows('psych');

  const selectedWeek = { weekLabel: selectedWeekBucket?.weekLabel || '—' };
  const hasGoalsForSelectedWeek = weekGoals.length > 0;

  // ── Weekly Summary (Haiku) ─────────────────────────────────
  // Build the data block fed to the summary model for the SELECTED
  // week: every trade with its outcome + journal, the rules set that
  // week, and the per-trade Psych-vs-Goals verdicts (mirroring the
  // drilldown's null+journal=pass fallback). The week itself is already
  // bucketed Monday-start in the trader's local timezone by
  // buildWeekBuckets, so no extra date logic is needed here.
  const goalLabel = (g: Goal): string =>
    (g.title || '').trim() || (g.numberRule ? describeNumberRule(g.numberRule) : '(untitled rule)');
  const weekSummaryTrades = selectedWeekBucket?.trades || [];
  const weekSummaryContext = (() => {
    const lines: string[] = [];
    lines.push(`Week: ${selectedWeek.weekLabel}`);
    lines.push('');
    if (weekGoals.length > 0) {
      lines.push('Rules/goals the trader set for this week:');
      weekGoals.forEach((g, i) => lines.push(`${i + 1}. ${goalLabel(g)} [${g.goalType || 'General'}]`));
    } else {
      lines.push('No goals were set for this week.');
    }
    lines.push('');
    lines.push(`Trades this week (${weekSummaryTrades.length}):`);
    if (weekSummaryTrades.length === 0) lines.push('(none logged)');
    weekSummaryTrades.forEach(t => {
      lines.push(`- ${t.ticker} ${t.date} ${t.time} | ${t.result} | ${formatNumber(t.pl, { currency: true, explicitSign: true, decimals: 0 })} | R:R ${t.riskReward || 'n/a'} | ${t.strategy || 'n/a'}`);
      const j = (t.journal || '').trim();
      lines.push(`  Journal: ${j ? `"${j}"` : '(no journal)'}`);
      const psych = classifications[t.id]?.psychScores;
      if (Array.isArray(psych)) {
        psych.forEach(s => {
          const g = weekGoals[s.goalIndex];
          if (!g) return;
          const verdict = s.compliance === 1 ? 'FOLLOWED'
            : s.compliance === 0 ? 'BROKE'
            : j.length > 0 ? 'FOLLOWED'
            : 'unscored';
          lines.push(`  Rule "${goalLabel(g)}": ${verdict}${s.reason ? ` — ${s.reason}` : ''}`);
        });
      }
    });
    return lines.join('\n');
  })();
  const weekSummaryHash = hashStr(WEEK_SUMMARY_VERSION + '\n' + weekSummaryContext);
  // Don't burn a Haiku call before this week's trades have been scored —
  // the verdicts are part of the summary's input. Weeks with no goals
  // have nothing to wait on.
  const weekClassifiedCount = weekSummaryTrades.filter(t => classifications[t.id]).length;
  const weekSummaryCanGenerate =
    weekSummaryTrades.length > 0 && (weekGoals.length === 0 || weekClassifiedCount > 0);

  useEffect(() => {
    if (!selectedWeekStartISO || !weekSummaryCanGenerate) {
      setWeekSummary('');
      setWeekSummaryError(null);
      setWeekSummaryLoading(false);
      return;
    }
    // Cache hit — same week, same data hash → no network call.
    let cache: Record<string, { hash: string; text: string }> = {};
    try { cache = JSON.parse(localStorage.getItem(WEEK_SUMMARY_CACHE_KEY) || '{}'); } catch { cache = {}; }
    const cached = cache[selectedWeekStartISO];
    if (cached && cached.hash === weekSummaryHash) {
      setWeekSummary(cached.text);
      setWeekSummaryError(null);
      setWeekSummaryLoading(false);
      return;
    }
    let cancelled = false;
    setWeekSummaryLoading(true);
    setWeekSummaryError(null);
    (async () => {
      try {
        const res = await fetch('/api/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'weeklySummary',
            messages: [{ role: 'user', content: weekSummaryContext }],
            profileContext: buildProfileContext(),
            dateContext: buildDateContext(),
          }),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        const text = (data.reply || '').trim();
        if (!text) throw new Error('empty response');
        if (cancelled) return;
        setWeekSummary(text);
        setWeekSummaryLoading(false);
        try {
          cache[selectedWeekStartISO] = { hash: weekSummaryHash, text };
          localStorage.setItem(WEEK_SUMMARY_CACHE_KEY, JSON.stringify(cache));
        } catch { /* ignore quota */ }
      } catch {
        if (cancelled) return;
        setWeekSummary('');
        setWeekSummaryError("Couldn't generate this week's summary. Try again in a moment.");
        setWeekSummaryLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeekStartISO, weekSummaryHash, weekSummaryCanGenerate]);

  // Render the Haiku bullets as clean teal dash-bullets, mirroring the
  // AI chat widget's formatAiText bullet styling. Inline **bold** spans
  // are lifted to white the same way the chat does.
  const renderInlineBold = (text: string, keyPrefix: string): React.ReactNode[] =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      const m = part.match(/^\*\*([^*]+)\*\*$/);
      return m
        ? <strong key={`${keyPrefix}-b${i}`} style={{ color: '#fff', fontWeight: 700 }}>{m[1]}</strong>
        : <React.Fragment key={`${keyPrefix}-t${i}`}>{part}</React.Fragment>;
    });
  const renderSummaryBullets = (text: string): React.ReactNode[] =>
    text.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .map(l => l.replace(/^\s*(?:[-•*])\s+/, ''))
      .map((content, i) => (
        <div key={`ws-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ color: teal, flexShrink: 0, fontFamily: fm, fontSize: 15, lineHeight: 1.6 }}>•</span>
          <span style={{ color: '#d0d4dc', fontFamily: fm, fontSize: 15, lineHeight: 1.6 }}>{renderInlineBold(content, `ws-${i}`)}</span>
        </div>
      ));

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
                      gridTemplateColumns: '32px 22px 70px 60px 1fr',
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
                    </div>
                    {showReason && (() => {
                      // Strip the citation to just the decisive evidence:
                      // the quoted phrase(s) or numeric token(s) the scorer
                      // keyed on. Green when the trade complied, red when it
                      // violated. The explanatory prose is dropped entirely.
                      const evidence = extractEvidence(reason);
                      if (evidence.length > 0) {
                        const color = status === 'violated' ? red : teal;
                        return (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginLeft: 66, marginTop: 6 }}>
                            {evidence.map((q, qi) => (
                              <span key={qi} style={{ fontFamily: fm, fontSize: 15, fontWeight: 700, color, lineHeight: 1.4 }}>{q}</span>
                            ))}
                          </div>
                        );
                      }
                      // No quotable evidence (e.g. a clean winner that passed
                      // because the journal carried no violation language) —
                      // show a short muted tag instead of a blank row.
                      const tag = status === 'violated' ? 'flagged off-plan'
                        : status === 'passed' ? 'no violation language'
                        : 'not evaluated';
                      return (
                        <div style={{ fontFamily: fm, fontSize: 13, color: '#a0a3ab', fontStyle: 'italic', marginLeft: 66, marginTop: 6 }}>
                          {tag}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Horizontal compliance bar — the readable replacement for the old
  // per-goal candlesticks. Same row data (actual / target / nullCount)
  // and the same click-to-expand drilldown; only the visual changed.
  // Shared by the Numerical (trades) and Psychology (psych) sections.
  const renderGoalBar = (section: 'trades' | 'psych', i: number, row: GoalComplianceRow) => {
    const evaluable = row.target;
    const allNull = evaluable === 0;
    const pct = allNull ? 0 : Math.min(100, Math.round((row.actual / evaluable) * 100));
    const isExpanded = expandedRow?.section === section && expandedRow.goalIdx === row.goalIdx;
    const isHovered = hoveredRow?.section === section && hoveredRow.goalIdx === row.goalIdx;
    const accent = section === 'trades' ? blue : teal;
    // Psych adherence drives a red→green band; trades keep the flat accent.
    const bandColor = section === 'psych' && !allNull ? adherenceColor(pct) : accent;
    // Psych goals are graded by Haiku from journal text; with no context
    // or scoring criteria set, it's working from the bare title and
    // grading on generic vibes — the root cause of mismatched citations.
    // Number goals score deterministically in JS and need no context, so
    // they're never flagged.
    const goalForRow = section === 'psych' ? weekGoals[row.goalIdx] : undefined;
    const noContext = !!goalForRow && (goalForRow.context?.length ?? 0) === 0 && !goalForRow.scoringCriteria;
    return (
      <div key={`${section}-bar-${row.goalIdx}`} style={{ marginBottom: 10 }}>
        <div
          onClick={() => setExpandedRow(prev => prev && prev.section === section && prev.goalIdx === row.goalIdx ? null : { section, goalIdx: row.goalIdx })}
          onMouseEnter={() => setHoveredRow({ section, goalIdx: row.goalIdx })}
          onMouseLeave={() => setHoveredRow(null)}
          style={{
            cursor: 'pointer',
            padding: '14px 16px',
            borderRadius: 10,
            background: isHovered || isExpanded ? '#161a24' : '#12151d',
            border: `1px solid ${isExpanded ? accent : '#2A3143'}`,
            transition: 'background 0.15s ease, border-color 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, marginBottom: 10 }}>
            <div style={{ fontFamily: fm, fontSize: 15, fontWeight: 600, color: '#e8e8f0', lineHeight: 1.35, minWidth: 0 }}>
              <span style={{ color: accent, fontWeight: 700 }}>{i + 1}. </span>{row.title}
              {noContext && (
                <span style={{ display: 'inline-block', marginLeft: 10, fontFamily: fm, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.12)', color: '#f5d27c', border: '1px solid rgba(245,158,11,0.35)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>NO CONTEXT</span>
              )}
            </div>
            <div style={{ flexShrink: 0, fontFamily: fm, fontSize: 14, fontWeight: 700, color: allNull ? '#a0a3ab' : bandColor, whiteSpace: 'nowrap' }}>
              {allNull ? 'Not yet scored' : `${row.actual} / ${evaluable} trades · ${pct}%`}
            </div>
          </div>
          <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden', border: allNull ? '1px dashed #2A3143' : 'none', boxSizing: 'border-box' }}>
            {!allNull && (
              <div style={{ width: `${pct}%`, height: '100%', background: bandColor, borderRadius: 6, transition: 'width 0.3s ease' }} />
            )}
          </div>
          {noContext && (
            <div style={{ fontFamily: fm, fontSize: 12, color: '#f5d27c', marginTop: 8, lineHeight: 1.4 }}>
              No context set for this goal — scoring may be inaccurate. Add context on the Weekly Goals tab so WickCoach grades against what the rule actually means.
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontFamily: fm, fontSize: 12, color: '#a0a3ab' }}>
              {row.nullCount > 0 && !allNull ? `${row.nullCount} not evaluated` : ' '}
            </span>
            <span style={{ fontFamily: fm, fontSize: 12, color: accent }}>{isExpanded ? '▴ hide trades cited' : '▾ Trades Cited'}</span>
          </div>
        </div>
        {isExpanded && renderDrilldown(section, row.goalIdx)}
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

      {/* ═══ KPI HEADER ROW — 4 deterministic metrics ═══
          Pure-JS computed from the trade set. No Haiku, same input =
          same output. Test harness: scripts/test-kpi-metrics.mjs. */}
      {(() => {
        const exp  = computeExpectancy(trades);   // dollar expectancy — Expectancy card support line
        const expR = computeExpectancyR(trades);  // R expectancy (hero) — strict, no −1R fallback
        const pf   = computeProfitFactor(trades);
        const lg   = computeLossGrowth(trades);   // loss escalation slope

        // ── Formatters scoped to this block ────────────────────────
        const fmtMoney2 = (v: number) => {
          const sign = v > 0 ? '+' : v < 0 ? '-' : '';
          const abs = Math.abs(v);
          return `${sign}$${abs.toFixed(2).replace(/\B(?=(\d{3})+(?=\.))/g, ',')}`;
        };
        const fmtMoneyInt = (v: number) => {
          const sign = v > 0 ? '+' : v < 0 ? '-' : '';
          const abs = Math.round(Math.abs(v));
          return `${sign}$${abs.toLocaleString()}`;
        };
        const fmtPF = (ratio: number) => {
          if (!Number.isFinite(ratio)) return '—';
          return ratio.toFixed(2);
        };
        const fmtExpR = (v: number) => {
          const sign = v > 0 ? '+' : v < 0 ? '−' : '';
          return `${sign}${Math.abs(v).toFixed(2)}R`;
        };
        const fmtSlope = (v: number) => {
          const sign = v > 0 ? '+' : v < 0 ? '−' : '';
          const abs = Math.round(Math.abs(v));
          return `${sign}$${abs.toLocaleString()}/trade`;
        };

        // Card chrome shared by all four cards.
        const kpiCard: React.CSSProperties = {
          flex: 1,
          minWidth: 200,
          background: '#141822',
          border: '1px solid #2A3143',
          borderRadius: 12,
          padding: '18px 22px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          position: 'relative',
        };
        const kpiLabel: React.CSSProperties = {
          fontFamily: fd,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: 'uppercase' as const,
          color: '#9a9da5',
        };
        const kpiHero: React.CSSProperties = {
          fontFamily: fd,
          fontSize: 44,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: '-0.5px',
          marginTop: 4,
        };
        const kpiSupport: React.CSSProperties = {
          fontFamily: fm,
          fontSize: 12,
          color: '#a0a3ab',
          marginTop: 4,
          lineHeight: 1.4,
        };

        // Expectancy hero is the R-multiple; teal when the system pays out.
        const expColor = expR.expectancyR > 0 ? teal : expR.expectancyR < 0 ? red : '#aab0bd';
        const noLosses = pf.grossLoss === 0;
        const pfColor  = noLosses ? '#aab0bd' : pf.ratio >= 1 ? teal : red;
        // Loss-growth: red only when losses are climbing; teal otherwise.
        const lgColor  = lg.direction === 'up' ? red : teal;
        const lgWord   = lg.direction === 'up' ? 'Trending up'
                       : lg.direction === 'down' ? 'Shrinking'
                       : 'Controlled';

        return (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>

            {/* ── 1. Expectancy (R) — the headline edge metric ─────────
                  R-multiple per decisive risk-logged trade. NOT win rate:
                  a low win rate can still be a positive edge. */}
            <div style={kpiCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={kpiLabel}>Expectancy (R)</div>
                <InfoTip text="Average R you keep per decisive trade: (winRate × avgWinR) − (lossRate × avgLossR), each R = profit ÷ risk. This is your EDGE, not your win rate — a low win rate can still be a positive edge if winners outrun losers. Only trades with a logged risk amount count; breakeven trades are excluded." />
              </div>
              {expR.sufficient ? (
                <>
                  <div style={{ ...kpiHero, color: expColor }}>{fmtExpR(expR.expectancyR)}</div>
                  <div style={kpiSupport}>{fmtMoney2(exp.expectancy)} per trade · {expR.decisive} risk-logged</div>
                </>
              ) : (
                <>
                  <div style={{ ...kpiHero, color: '#5a5f6b', fontSize: 26 }}>—</div>
                  <div style={kpiSupport}>Log more trades with risk to unlock</div>
                </>
              )}
            </div>

            {/* ── 2. Profit Factor ─────────────────────────────────── */}
            <div style={kpiCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={kpiLabel}>Profit Factor</div>
                <InfoTip text="Gross winnings divided by gross losses. ≥ 1 means you take more in than you give back; under 1 means the system is net-negative regardless of win rate. Shows a dash until there is at least one logged loss to divide by." />
              </div>
              <div style={{ ...kpiHero, color: pfColor, fontSize: noLosses ? 26 : 44 }}>{noLosses ? '—' : fmtPF(pf.ratio)}</div>
              <div style={kpiSupport}>{noLosses ? 'no losses logged' : `${fmtMoneyInt(pf.grossProfit)} won / ${fmtMoneyInt(-pf.grossLoss)} lost`}</div>
            </div>

            {/* ── 3. Win Rate (reuses computeExpectancy's denominator
                  so the number can't drift from the candle math) ──── */}
            <div style={kpiCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={kpiLabel}>Win Rate</div>
                <InfoTip text="Wins divided by decisive trades (wins + losses). Breakeven trades are excluded from the denominator — the standard trading convention." />
              </div>
              <div style={{ ...kpiHero, color: '#fff' }}>{Math.round(exp.winRate * 100)}%</div>
              <div style={kpiSupport}>{exp.wins}W / {exp.losses}L · {exp.breakeven}BE</div>
            </div>

            {/* ── 4. Loss Growth — are your losses escalating? ─────────
                  OLS slope across losing trades in chronological order.
                  Pure magnitude trend — no psychological inference. */}
            <div style={kpiCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={kpiLabel}>Loss Growth</div>
                <InfoTip text={`Fits a straight line through the dollar size of your losing trades in the order they happened. A rising line means each loss tends to be bigger than the last; flat or falling means they are steady or shrinking. Needs at least ${LOSS_GROWTH_MIN} losses to measure. Pure size trend — it draws no conclusion about why.`} />
              </div>
              {lg.sufficient ? (
                <>
                  <div style={{ ...kpiHero, color: lgColor, fontSize: 26 }}>{lgWord}</div>
                  <div style={kpiSupport}>{fmtSlope(lg.slope ?? 0)} · {lg.lossCount} losses</div>
                </>
              ) : (
                <>
                  <div style={{ ...kpiHero, color: '#5a5f6b', fontSize: 26 }}>—</div>
                  <div style={kpiSupport}>Need more losing trades to measure</div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════
          RULE ADHERENCE · toggle (Numerical / Psychology)
          Two tab buttons swap one clean view at a time. Numerical =
          trade-data view (three hero candles + Trades-vs-Goals bars).
          Psychology = journal-language view (Psych-vs-Goals bars +
          weekly-summary placeholder). The week selector is shared
          across both views via selectedWeekIdx. The four deterministic
          KPI cards sit above, outside this block. All scoring/bot logic
          unchanged — this is layout only.
          ═══════════════════════════════════════════════════════════ */}
      <div style={{
        background: '#0d1017',
        border: '1px solid #1c2330',
        borderRadius: 16,
        padding: '28px 28px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        {/* Toggle buttons + shared week selector */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid #1c2330', paddingBottom: 20 }}>
          <div style={{ display: 'flex', gap: 6, background: '#12151d', border: '1px solid #2A3143', borderRadius: 12, padding: 5 }}>
            {([['numerical', 'Numerical'], ['psych', 'Psychology']] as const).map(([key, label]) => {
              const active = analysisView === key;
              return (
                <button
                  key={key}
                  onClick={() => setAnalysisView(key)}
                  style={{
                    fontFamily: fd, fontSize: 15, fontWeight: 700, letterSpacing: 0.5,
                    padding: '10px 28px', borderRadius: 9, cursor: 'pointer',
                    border: 'none', transition: 'background 0.15s ease, color 0.15s ease',
                    background: active ? teal : 'transparent',
                    color: active ? '#0A0D14' : '#a0a3ab',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {/* Week selector — Psychology only. Numerical is all-time and
              has no week concept, so the dropdown is hidden there. */}
          {analysisView === 'psych' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: fm, fontSize: 11, color: '#a0a3ab', letterSpacing: 1, textTransform: 'uppercase' }}>Week</span>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedWeekIdx}
                onChange={e => setSelectedWeekIdx(parseInt(e.target.value))}
                style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', background: '#1f2430', border: '1px solid #2A3143', color: '#e8e8f0', fontFamily: fm, fontSize: 14, fontWeight: 600, padding: '10px 40px 10px 18px', borderRadius: 8, cursor: 'pointer', letterSpacing: 0.5, outline: 'none' }}
              >
                {weekBuckets.map((w, i) => (<option key={i} value={i} style={{ background: '#1f2430', color: '#e8e8f0' }}>{w.weekLabel}</option>))}
              </select>
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: teal, pointerEvents: 'none', fontSize: 13 }}>▼</span>
            </div>
          </div>
          )}
        </div>

      {/* ═══════════════ NUMERICAL VIEW ═══════════════ */}
      {analysisView === 'numerical' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ═══ HERO · three candlesticks (In Plan / Broke Rules / R Gap) ═══
          The one place candlesticks survive. In Plan = teal, Broke =
          red, R Gap = the differential between their R/trade (red when
          breaking rules costs you edge). Body height encodes the value;
          the number + a clean label sit beneath each. Same deterministic
          processSplit data as before — only the visual changed. */}
      {(() => {
        const plan  = processSplit.process;
        const broke = processSplit.impulse;
        const MIN_SAMPLE = 5;

        const fmtRpt = (v: number) => {
          const sign = v > 0 ? '+' : v < 0 ? '−' : '';
          return `${sign}${Math.abs(v).toFixed(2)}R`;
        };

        const planRpt  = plan.n  ? plan.rTotal  / plan.n  : 0;
        const brokeRpt = broke.n ? broke.rTotal / broke.n : 0;
        const gap = planRpt - brokeRpt;
        const haveSample = plan.n >= MIN_SAMPLE && broke.n >= MIN_SAMPLE;
        // gap > 0 → in-plan trades earn more R, so breaking rules costs
        // you edge. That's the warning case → red.
        const gapCostly = gap > 0;

        const maxCount = Math.max(plan.n, broke.n, 1);
        const gapRef = Math.max(Math.abs(planRpt), Math.abs(brokeRpt), Math.abs(gap), 0.5);

        const PLOT_H = 148;
        const BODY_W = 54;
        const MIN_FRAC = 0.07; // never collapse a candle to nothing

        // One candlestick: short wick, gradient body sized by `frac`.
        const Candle = ({ frac, color, dim }: { frac: number; color: string; dim?: boolean }) => {
          const bodyH = Math.max(MIN_FRAC, Math.min(1, frac)) * (PLOT_H - 26);
          return (
            <div style={{ height: PLOT_H, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
              <div style={{ width: 2, height: 13, background: color, opacity: dim ? 0.25 : 0.5 }} />
              <div style={{
                width: BODY_W, height: bodyH, borderRadius: 3,
                background: dim ? 'rgba(255,255,255,0.05)' : `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
                border: dim ? '1px dashed #2A3143' : 'none',
                boxShadow: dim ? 'none' : `0 0 16px ${color}44, inset 0 1px 0 rgba(255,255,255,0.18)`,
              }} />
              <div style={{ width: 2, height: 9, background: color, opacity: dim ? 0.25 : 0.5 }} />
            </div>
          );
        };

        // Shared column chrome — title + candle + big number + sublabel.
        const Col = ({ label, color, info, candle, value, valueColor, sub }: {
          label: string; color: string; info: string; candle: React.ReactNode;
          value: string; valueColor?: string; sub: string;
        }) => (
          <div style={{ flex: 1, minWidth: 200, background: '#141822', border: '1px solid #2A3143', borderTop: `3px solid ${color}`, borderRadius: 12, padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', marginBottom: 6 }}>
              <span style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color }}>{label}</span>
              <InfoTip text={info} />
            </div>
            {candle}
            <div style={{ fontFamily: fd, fontSize: 46, fontWeight: 700, lineHeight: 1, letterSpacing: '-1px', color: valueColor || '#fff', marginTop: 14 }}>{value}</div>
            <div style={{ fontFamily: fm, fontSize: 13, color: '#a0a3ab', marginTop: 8, textAlign: 'center' }}>{sub}</div>
          </div>
        );

        return (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>
            <Col
              label="In Plan" color={teal}
              info="Trades where your journal shows patience, a clean setup, or following your rules."
              candle={<Candle frac={plan.n / maxCount} color={teal} />}
              value={plan.n.toLocaleString()}
              sub={`${fmtPct(plan.wr)} win rate`}
            />
            <Col
              label="Broke Rules" color={red}
              info="Trades where your journal mentions FOMO, revenge, impulse, or skipping your setup."
              candle={<Candle frac={broke.n / maxCount} color={red} />}
              value={broke.n.toLocaleString()}
              sub={`${fmtPct(broke.wr)} win rate`}
            />
            <Col
              label="R Gap" color={gapCostly ? red : teal}
              info="Your in-plan R per trade minus your rule-breakers'. Red when in-plan trades earn more R per trade — the edge you give up by breaking rules. Needs 5+ trades in each bucket."
              candle={haveSample
                ? <Candle frac={Math.abs(gap) / gapRef} color={gapCostly ? red : teal} />
                : <Candle frac={0.2} color={teal} dim />}
              value={haveSample ? fmtRpt(gapCostly ? -Math.abs(gap) : Math.abs(gap)) : '—'}
              valueColor={haveSample ? (gapCostly ? red : teal) : '#7e818a'}
              sub={haveSample
                ? `In plan ${fmtRpt(planRpt)} · broke ${fmtRpt(brokeRpt)}`
                : `Need 5+ each · plan ${plan.n}, broke ${broke.n}`}
            />
          </div>
        );
      })()}

        {/* Time of Day — bucket ALL timestamped trades by entry-time
            window and surface count / win rate / net P/L / per-trade
            expectancy across the full track record. Uses timeToMinutes
            (AM/PM-safe). A window losing money over a meaningful sample
            is flagged red. */}
        {(() => {
          const tradesAll = trades;
          // Session windows are US market hours (Eastern). Trade times
          // are stored in the user's local wall clock, so we shift the
          // Eastern boundaries into the browser's local timezone before
          // bucketing — otherwise a Denver 7:36 AM open trade (9:36 ET)
          // misses the Open window entirely. The ET→local offset is the
          // same year-round for DST-observing zones (Mountain is always
          // 2h behind Eastern), so today's date gives an exact shift for
          // the full all-time history.
          const zoneOffset = (tz: string, d: Date) => {
            const parts = new Intl.DateTimeFormat('en-US', {
              timeZone: tz, hour12: false,
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
            }).formatToParts(d);
            const m: Record<string, string> = {};
            parts.forEach(p => { m[p.type] = p.value; });
            const asUTC = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour % 24, +m.minute, +m.second);
            return (asUTC - d.getTime()) / 60000;
          };
          const refDate = new Date();
          // Round to whole minutes: zoneOffset carries the sub-second
          // remainder of Date.now() (asUTC is second-precision, getTime()
          // is ms), which would otherwise leak a float like 450.0007 into
          // the boundary labels. Timezone offsets are always whole minutes.
          const tzShift = Math.round((-refDate.getTimezoneOffset()) - zoneOffset('America/New_York', refDate));
          const clockParts = (min: number) => {
            const norm = ((Math.round(min) % 1440) + 1440) % 1440;
            const h = Math.floor(norm / 60);
            const mm = norm % 60;
            const h12 = h % 12 === 0 ? 12 : h % 12;
            return { label: `${h12}:${String(mm).padStart(2, '0')}`, mer: h >= 12 ? 'PM' : 'AM' };
          };
          // "7:30 – 8:30 AM" when both sides share a meridiem, else
          // "11:30 AM – 12:30 PM" across the noon boundary.
          const rangeLabel = (startMin: number, endMin: number) => {
            const a = clockParts(startMin);
            const b = clockParts(endMin);
            return a.mer === b.mer
              ? `${a.label} – ${b.label} ${b.mer}`
              : `${a.label} ${a.mer} – ${b.label} ${b.mer}`;
          };
          const WINDOWS = [
            { name: 'Open',            start: 570, end: 630 },
            { name: 'Late Morning',    start: 630, end: 690 },
            { name: 'Midday',          start: 690, end: 810 },
            { name: 'Early Afternoon', start: 810, end: 870 },
            { name: 'Power Hour',      start: 870, end: 960 },
          ].map(w => {
            const start = w.start + tzShift;
            const end = w.end + tzShift;
            return { name: w.name, range: rangeLabel(start, end), start, end };
          });
          const FLAG_MIN = 3;

          const rows = WINDOWS.map(w => {
            const inWin = tradesAll.filter(t => {
              const m = timeToMinutes(t.time);
              return m >= w.start && m < w.end;
            });
            const exp = computeExpectancy(inWin);
            const netPL = inWin.reduce((s, t) => s + t.pl, 0);
            return {
              ...w,
              n: inWin.length,
              winRate: exp.decisive ? exp.winRate * 100 : null,
              netPL,
              expectancy: inWin.length ? exp.expectancy : null,
              flagged: inWin.length >= FLAG_MIN && exp.expectancy < 0,
            };
          });

          const bucketed = rows.reduce((s, r) => s + r.n, 0);
          const maxAbsPL = Math.max(...rows.map(r => Math.abs(r.netPL)), 1);

          const Stat = ({ label, value, color }: { label: string; value: string; color?: string }) => (
            <div style={{ minWidth: 72, textAlign: 'right' }}>
              <div style={{ fontFamily: fm, fontSize: 10.5, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: '#a0a3ab' }}>{label}</div>
              <div style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: color || '#e8e8f0', marginTop: 3 }}>{value}</div>
            </div>
          );

          return (
            <div style={{ background: '#141822', border: '1px solid #2A3143', borderLeft: `3px solid ${teal}`, borderRadius: 12, padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ width: 10, height: 10, background: teal, borderRadius: 2, display: 'inline-block' }} />
                <h4 style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: 0.5 }}>Time of Day</h4>
              </div>
              <p style={{ color: '#a0a3ab', fontSize: 14, margin: '0 0 18px', lineHeight: 1.5 }}>
                When you trade across your full history, and what each session earns. The bar scales net P/L across windows; a window losing money over {FLAG_MIN}+ trades is flagged.
              </p>
              {bucketed === 0 ? (
                <div style={{ padding: '28px 20px', textAlign: 'center', color: '#a0a3ab', fontFamily: fm, fontSize: 13 }}>
                  No timestamped trades logged yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {rows.map(r => {
                    const empty = r.n === 0;
                    const plColor = r.netPL > 0 ? teal : r.netPL < 0 ? red : '#7e818a';
                    const barW = empty ? 0 : Math.max(4, (Math.abs(r.netPL) / maxAbsPL) * 100);
                    return (
                      <div key={r.name} style={{ opacity: empty ? 0.5 : 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                          <div style={{ minWidth: 150 }}>
                            <div style={{ fontFamily: fd, fontSize: 14.5, fontWeight: 600, color: '#e8e8f0' }}>{r.name}</div>
                            <div style={{ fontFamily: fm, fontSize: 11, color: '#a0a3ab', marginTop: 2 }}>{r.range}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end' }}>
                            <Stat label="Trades" value={empty ? '—' : String(r.n)} />
                            <Stat label="Win" value={r.winRate === null ? '—' : `${r.winRate.toFixed(0)}%`} />
                            <Stat label="Net P/L" value={empty ? '—' : formatNumber(r.netPL, { currency: true, explicitSign: true, decimals: 0 })} color={empty ? undefined : plColor} />
                            <Stat label="Exp/Trade" value={r.expectancy === null ? '—' : formatNumber(r.expectancy, { currency: true, explicitSign: true, decimals: 0 })} color={r.expectancy === null ? undefined : (r.expectancy > 0 ? teal : r.expectancy < 0 ? red : '#7e818a')} />
                          </div>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${barW}%`, background: plColor, borderRadius: 999, transition: 'width 240ms ease' }} />
                        </div>
                        {r.flagged && (
                          <div style={{ fontFamily: fm, fontSize: 12, color: red, marginTop: 6 }}>
                            Negative expectancy over {r.n} trades — review this window.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

      </div>
      )}

      {/* ═══════════════ PSYCHOLOGY VIEW ═══════════════ */}
      {analysisView === 'psych' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Psych vs. Goals — journal-language adherence per goal. Same
            Haiku scoring + drilldown as before; the candlesticks are
            replaced by the readable compliance bars. */}
        {(() => {
          const emptyStyle: React.CSSProperties = { padding: '32px 20px', textAlign: 'center', color: '#a0a3ab', fontFamily: fm, fontSize: 13 };
          return (
            <div style={{ background: '#12151d', border: '1px solid #2A3143', borderLeft: `3px solid ${teal}`, borderRadius: 12, padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ width: 10, height: 10, background: teal, borderRadius: 2, display: 'inline-block' }} />
                <h4 style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: 0.5 }}>Psych vs. Goals</h4>
              </div>
              <p style={{ color: '#a0a3ab', fontSize: 14, margin: '0 0 18px', lineHeight: 1.5 }}>
                Did what you wrote in each journal match the rule? Read and scored from your own words.
              </p>
              {!hasGoalsForSelectedWeek ? (
                <div style={emptyStyle}>No goals were set for this week.</div>
              ) : selectedWeekPsychGoals.length === 0 ? (
                <div style={emptyStyle}>No psychology goals this week.</div>
              ) : selectedWeekPsychGoals.some(g => g.empty) ? (
                <div style={emptyStyle}>No trades logged this week yet.</div>
              ) : (
                <div>{selectedWeekPsychGoals.map((row, i) => renderGoalBar('psych', i, row))}</div>
              )}
            </div>
          );
        })()}
      </div>
      )}

      </div>
      {/* end RULE ADHERENCE · toggle */}

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

      {/* ═══ 3 · REGRESSION LAB ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,212,160,0.05) 0%, rgba(0,212,160,0.02) 50%, #141822 100%)',
        border: '1px solid rgba(0,212,160,0.2)',
        borderRadius: 12,
        padding: '28px 32px 32px',
        position: 'relative',
      }}>
        <SectionNum n={3} />
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

      {/* ═══ 4 · ADVANCED ANALYSIS TOOLS ═══ */}
      <div style={{ position: 'relative' }}>
        <SectionNum n={4} />

        {/* Section title */}
        <div style={{ paddingLeft: 40, marginBottom: 16 }}>
          <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>Advanced Analysis Tools</div>
        </div>

        {/* WickCoach Weekly Summary — always visible, regardless of the
            Numerical/Psychology toggle. Sits where the old Time of Day
            line graph used to (that breakdown now lives in the Numerical
            toggle). Reads the selected week's trades, journals, outcomes,
            and Psych-vs-Goals verdicts; cached per week + data hash. */}
        <div style={{ background: '#12151d', border: '1px solid #2A3143', borderLeft: `3px solid ${teal}`, borderRadius: 12, padding: '22px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, background: teal, borderRadius: 2, display: 'inline-block' }} />
            <h4 style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: 0.5 }}>WickCoach Weekly Summary</h4>
            <span style={{ fontFamily: fm, fontSize: 13, color: '#a0a3ab', marginLeft: 'auto' }}>{selectedWeek.weekLabel}</span>
          </div>
          <p style={{ color: '#a0a3ab', fontSize: 14, margin: '0 0 16px', lineHeight: 1.5 }}>
            A short read on how you followed — or fought — your own rules this week.
          </p>
          {weekSummaryLoading ? (
            <div style={{ fontFamily: fm, fontSize: 14, color: '#a0a3ab' }}>Reading your week&hellip;</div>
          ) : weekSummaryError ? (
            <div style={{ fontFamily: fm, fontSize: 14, color: red }}>{weekSummaryError}</div>
          ) : weekSummary ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{renderSummaryBullets(weekSummary)}</div>
          ) : (
            <div style={{ fontFamily: fm, fontSize: 14, color: '#a0a3ab' }}>
              {weekSummaryTrades.length === 0
                ? 'No trades logged this week yet.'
                : 'Waiting for this week to be scored…'}
            </div>
          )}
        </div>

        {/* Size Efficiency — the surviving Advanced tool. The Time of Day
            line graph was removed; its breakdown lives in the Numerical
            toggle now. */}
        <div style={{ background: '#141822', border: '1px solid #2A3143', borderRadius: 12, padding: '24px 28px' }}>

        {(() => {
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

