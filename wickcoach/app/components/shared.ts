export const fm = "'DM Mono', monospace";
export const fd = "'Chakra Petch', sans-serif";
export const teal = "#00d4a0";

// ─── Deterministic linear regression ─────────────────────────
// All math is done here in JavaScript — never by the AI. The AI
// only gets pre-computed results to explain in plain English.

export interface RegressionResult {
  n: number;
  slope: number;
  intercept: number;
  r_squared: number;
  adjusted_r_squared: number;
  p_value: number;
  f_stat: number;
  standard_error: number;
  ci_lower: number;   // 95% CI for slope
  ci_upper: number;
  equation: string;
  xLabel: string;
  yLabel: string;
}

/** Supported variable names for the Regression Lab. Shown in error messages. */
export const REGRESSION_VARIABLE_ALIASES = [
  'P/L, profit, pnl, gains, net, returns, profit amount',
  'loss size, loss amount, losses',
  'win size, win amount, wins',
  'R:R, risk reward, RR, risk to reward',
  'time of day, hour, entry time, time',
  'trade duration, time in trade, hold time (NOT AVAILABLE — data lacks exit timestamps)',
  'day of week, weekday, day',
  'entry price, entry, open',
  'exit price, exit, close',
  'position size, contracts, quantity, size',
  'risk, risk amount',
  'return %, return percent, % return',
  'expected value, EV, expectancy',
  'win rate',
];

/** Map a human-readable variable name to a numeric extractor on Trade. */
export function resolveTradeVariable(name: string): ((t: Trade) => number | null) | null {
  const n = name.toLowerCase().trim();

  // ── P/L / profit ────────────────────────────────────────────
  if (/p\/?l|profit|pnl|gains(?!.*loss)|net(?!.*loss)|^returns?$|profit.?amount/.test(n))
    return t => t.pl;

  // ── Return % ────────────────────────────────────────────────
  if (/return.?%|return.?percent|%.?return|pl.?percent/.test(n))
    return t => t.plPercent;

  // ── Loss size (absolute P/L for losers, null for winners) ───
  if (/loss.?(size|amount)|^losses?$/.test(n))
    return t => t.pl < 0 ? Math.abs(t.pl) : null;

  // ── Win size (P/L for winners, null for losers) ─────────────
  if (/win.?(size|amount)|^wins$/.test(n))
    return t => t.pl > 0 ? t.pl : null;

  // ── Win rate (1 for win, 0 for loss — regress to see rates) ─
  if (/win.?rate/.test(n))
    return t => t.pl > 0 ? 1 : 0;

  // ── R:R / risk reward ───────────────────────────────────────
  if (/r:r|risk.?reward|^rr$|risk.?to.?reward|avg.?r|^r$/.test(n))
    return t => { const v = parseRr(t.riskReward); return v > 0 ? v : null; };

  // ── Expected value / EV / expectancy ────────────────────────
  // Per-trade EV = P/L (the realized expectancy for that trade).
  // Across many trades the regression slope shows how EV shifts
  // with the X variable.
  if (/expected.?value|^ev$|expectancy/.test(n))
    return t => t.pl;

  // ── Time of day → hour as a number (9, 10, 11, …) ──────────
  if (/time.?of.?day|^hour$|entry.?time|^time$|^tod$/.test(n))
    return t => {
      const m = (t.time || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!m) return null;
      let h = parseInt(m[1]);
      const ap = (m[3] || '').toUpperCase();
      if (ap === 'PM' && h !== 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      return h;
    };

  // ── Trade duration / hold time ──────────────────────────────
  // We only have entry time, not exit time. Return null so the
  // regression shows a clear error instead of using bogus values.
  if (/trade.?duration|time.?in.?trade|hold.?time|how.?long|^duration$/.test(n))
    return null; // data lacks exit timestamps

  // ── Day of week → 0-6 ──────────────────────────────────────
  if (/day.?of.?week|weekday|^day$|^dow$/.test(n))
    return t => new Date(t.date).getUTCDay();

  // ── Entry / exit price ──────────────────────────────────────
  if (/entry.?price|^entry$|^open$/.test(n))  return t => t.entryPrice;
  if (/exit.?price|^exit$|^close$/.test(n))   return t => t.exitPrice;

  // ── Position size / contracts ───────────────────────────────
  if (/position.?size|contract|^size$|quantity|^qty$/.test(n))
    return t => t.contracts;

  // ── Risk amount ─────────────────────────────────────────────
  if (/risk.?amount|^risk$/.test(n)) return t => t.riskAmount;

  return null; // unknown — caller shows alias list
}

/** Resolve a plain-English filter condition to a predicate on Trade. */
export function resolveTradeFilter(condition: string): ((t: Trade) => boolean) | null {
  if (!condition || !condition.trim()) return null;
  const c = condition.toLowerCase().trim();

  const DAY_NAMES: Record<string, number> = {
    sunday: 0, sun: 0,
    monday: 1, mon: 1,
    tuesday: 2, tue: 2, tues: 2,
    wednesday: 3, wed: 3,
    thursday: 4, thu: 4, thurs: 4,
    friday: 5, fri: 5,
    saturday: 6, sat: 6,
  };

  // "day other than Wednesday" / "not Wednesday" / "exclude Wednesday" / "except Wednesday"
  const dayExcludeMatch = c.match(/(?:day\s+)?(?:other\s+than|not|except|exclude|excluding|!=)\s+(\w+)/);
  if (dayExcludeMatch) {
    const dayNum = DAY_NAMES[dayExcludeMatch[1].toLowerCase()];
    if (dayNum !== undefined) {
      return t => new Date(t.date).getUTCDay() !== dayNum;
    }
  }

  // "day is Monday" / "on Monday" / "only Monday" / "Monday only"
  const dayIncludeMatch = c.match(/(?:day\s*(?:is|=|:)\s*|on\s+|only\s+)(\w+)|(\w+)\s+only$/);
  if (dayIncludeMatch) {
    const dayWord = (dayIncludeMatch[1] || dayIncludeMatch[2] || '').toLowerCase();
    const dayNum = DAY_NAMES[dayWord];
    if (dayNum !== undefined) {
      return t => new Date(t.date).getUTCDay() === dayNum;
    }
  }

  // "strategy is X" / "strategy = X"
  const stratMatch = c.match(/strategy\s*(?:is|=|==|:)\s*(.+)/);
  if (stratMatch) {
    const strat = stratMatch[1].trim().toLowerCase();
    return t => t.strategy.toLowerCase().includes(strat);
  }
  // "ticker is X" / "ticker = X"
  const tickerMatch = c.match(/ticker\s*(?:is|=|==|:)\s*(.+)/);
  if (tickerMatch) {
    const tick = tickerMatch[1].trim().toUpperCase();
    return t => t.ticker === tick;
  }
  // "direction is long/short"
  const dirMatch = c.match(/direction\s*(?:is|=|==|:)\s*(long|short)/i);
  if (dirMatch) {
    const dir = dirMatch[1].toUpperCase();
    return t => t.direction === dir;
  }
  // "wins only" / "losses only"
  if (/win/.test(c)) return t => t.pl > 0;
  if (/loss|losing/.test(c)) return t => t.pl < 0;
  // "before 11" / "after 1pm"
  const timeMatch = c.match(/(before|after)\s*(\d{1,2})\s*(am|pm)?/i);
  if (timeMatch) {
    const dir = timeMatch[1].toLowerCase();
    let h = parseInt(timeMatch[2]);
    const ap = (timeMatch[3] || '').toUpperCase();
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return t => {
      const m = (t.time || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!m) return false;
      let th = parseInt(m[1]);
      const tap = (m[3] || '').toUpperCase();
      if (tap === 'PM' && th !== 12) th += 12;
      if (tap === 'AM' && th === 12) th = 0;
      return dir === 'before' ? th < h : th >= h;
    };
  }

  // Last resort: check if the condition contains a day name directly
  // e.g. just "wednesday" or "not on friday"
  for (const [name, num] of Object.entries(DAY_NAMES)) {
    if (c.includes(name)) {
      const isExclude = /not|other|except|exclud|!=/.test(c);
      return isExclude
        ? t => new Date(t.date).getUTCDay() !== num
        : t => new Date(t.date).getUTCDay() === num;
    }
  }

  return null;
}

/**
 * Run an OLS linear regression on two numeric arrays.
 * Returns all statistics deterministically — no AI involved.
 * Uses the t-distribution approximation for p-value and CI.
 */
export function linearRegression(
  xVals: number[],
  yVals: number[],
  xLabel: string,
  yLabel: string,
): RegressionResult | null {
  if (xVals.length !== yVals.length || xVals.length < 3) return null;

  const n = xVals.length;
  const sumX = xVals.reduce((a, b) => a + b, 0);
  const sumY = yVals.reduce((a, b) => a + b, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let ssXX = 0, ssXY = 0, ssYY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xVals[i] - meanX;
    const dy = yVals[i] - meanY;
    ssXX += dx * dx;
    ssXY += dx * dy;
    ssYY += dy * dy;
  }

  if (ssXX === 0) return null; // no variance in X

  const slope = ssXY / ssXX;
  const intercept = meanY - slope * meanX;

  // Residuals
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * xVals[i];
    const resid = yVals[i] - predicted;
    ssRes += resid * resid;
  }
  const ssTot = ssYY;
  const r_squared = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const adjusted_r_squared = n > 2 ? 1 - ((1 - r_squared) * (n - 1)) / (n - 2) : r_squared;

  // Standard error of the slope
  const mse = ssRes / (n - 2);
  const se_slope = Math.sqrt(mse / ssXX);
  const standard_error = Math.sqrt(mse);

  // t-statistic and p-value (two-tailed, using approximation for t-dist)
  const t_stat = se_slope > 0 ? slope / se_slope : 0;
  const f_stat = t_stat * t_stat;
  // Approximate two-tailed p-value from t-distribution using a rational
  // approximation (Abramowitz & Stegun). Good enough for n > 10.
  const df = n - 2;
  const p_value = tDistPValue(Math.abs(t_stat), df);

  // 95% confidence interval for slope (t_crit ≈ 1.96 for large n, use lookup for small n)
  const t_crit = tCritical(df);
  const ci_lower = slope - t_crit * se_slope;
  const ci_upper = slope + t_crit * se_slope;

  const fmtCoeff = (v: number) => v >= 0 ? `+ ${v.toFixed(4)}` : `- ${Math.abs(v).toFixed(4)}`;
  const equation = `${yLabel} = ${slope.toFixed(4)} × ${xLabel} ${fmtCoeff(intercept)}`.replace('+ -', '- ');

  return {
    n, slope, intercept, r_squared, adjusted_r_squared,
    p_value, f_stat, standard_error, ci_lower, ci_upper,
    equation, xLabel, yLabel,
  };
}

// Approximate two-tailed p-value from t-distribution.
function tDistPValue(t: number, df: number): number {
  // Use the regularized incomplete beta function approximation.
  const x = df / (df + t * t);
  return betaIncomplete(df / 2, 0.5, x);
}

// Regularized incomplete beta function Ix(a, b) via continued fraction.
function betaIncomplete(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lnBeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;
  // Lentz's continued fraction
  let f = 1, c = 1, d = 1 - (a + b) * x / (a + 1);
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  f = d;
  for (let m = 1; m <= 200; m++) {
    // even step
    let num = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1 + num * d; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d;
    c = 1 + num / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    f *= d * c;
    // odd step
    num = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + num * d; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d;
    c = 1 + num / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    f *= d * c;
    if (Math.abs(d * c - 1) < 1e-8) break;
  }
  return front * f;
}

// Log-gamma (Stirling approximation + Lanczos for small values)
function lgamma(x: number): number {
  if (x <= 0) return 0;
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

// Approximate t-critical value for 95% CI (two-tailed, alpha=0.05).
function tCritical(df: number): number {
  if (df >= 120) return 1.96;
  if (df >= 60) return 2.00;
  if (df >= 40) return 2.021;
  if (df >= 30) return 2.042;
  if (df >= 25) return 2.060;
  if (df >= 20) return 2.086;
  if (df >= 15) return 2.131;
  if (df >= 10) return 2.228;
  if (df >= 5)  return 2.571;
  if (df >= 3)  return 3.182;
  return 4.303;
}

// ─── Trade date helpers ──────────────────────────────────────
// Trade.date is stored as a local-calendar "YYYY-MM-DD" string.
// The two helpers below are the ONLY approved way to parse and
// produce that field. Direct `new Date(t.date)` parses as UTC
// midnight, which renders as the previous calendar day in
// timezones west of UTC; `new Date().toISOString().split('T')[0]`
// produces the UTC date, which is off by one after local evening.
// Using these helpers keeps all display + bucketing on a single
// local-calendar interpretation.

/**
 * Parse a "YYYY-MM-DD" calendar date string into a Date object
 * at LOCAL midnight. Use this for every read of Trade.date.
 *
 * Do NOT use `new Date(str)` directly — it parses as UTC midnight,
 * which renders as the previous day in timezones west of UTC.
 */
export function parseLocalDate(ymd: string): Date {
  if (!ymd || typeof ymd !== 'string') return new Date(NaN);
  return new Date(ymd + 'T00:00:00');
}

/**
 * Format a Date (defaults to now) as a "YYYY-MM-DD" string using
 * LOCAL calendar fields. Use this for every write to Trade.date.
 *
 * Do NOT use `.toISOString().split('T')[0]` — it returns the UTC
 * calendar date, which is off by one after local evening in
 * timezones west of UTC.
 */
export function toLocalYMD(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface Trade {
  id: string;
  ticker: string;
  companyName: string;
  /** Local calendar date of the trade in "YYYY-MM-DD" format.
   *  Always produced by toLocalYMD() and consumed by parseLocalDate().
   *  Never use `new Date(t.date)` or `new Date().toISOString()` on this field. */
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

export function formatDollar(n: number): string {
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  if (abs % 1 === 0) return sign + '$' + abs.toLocaleString();
  return sign + '$' + abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Site-wide number formatter ──────────────────────────────
// Single source of truth for how numbers render in the UI. Callers
// opt in to commas, currency, explicit sign, trailing zeros, and
// decimal precision. Nulls / NaN / undefined all collapse to '—'.
export interface FormatNumberOptions {
  /** Include thousands separator commas. Default: true. */
  commas?: boolean;
  /** Keep trailing zeros after decimal. Default: false — so 2.50 → "2.5" and 2.00 → "2". */
  trailingZeros?: boolean;
  /** Max decimal places. Default: 2. */
  decimals?: number;
  /** Prepend "$" for currency. Default: false. */
  currency?: boolean;
  /** Include explicit "+"/"-" sign (native "-" for negatives, "+" prepended for positives). Default: false. */
  explicitSign?: boolean;
}

export function formatNumber(
  n: number | null | undefined,
  opts: FormatNumberOptions = {}
): string {
  if (n === null || n === undefined || isNaN(n)) return '—';

  const {
    commas = true,
    trailingZeros = false,
    decimals = 2,
    currency = false,
    explicitSign = false,
  } = opts;

  const abs = Math.abs(n);
  let str = abs.toFixed(decimals);
  if (!trailingZeros) {
    // Strip "2.50" → "2.5", "2.00" → "2"
    str = str.replace(/\.?0+$/, '');
  }

  if (commas) {
    const [intPart, decPart] = str.split('.');
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    str = decPart ? `${withCommas}.${decPart}` : withCommas;
  }

  let sign = '';
  if (n < 0) sign = '-';
  else if (explicitSign && n > 0) sign = '+';

  const prefix = currency ? '$' : '';
  return `${sign}${prefix}${str}`;
}

/** Canonical R:R display: drops legacy "1:" prefix, stores as
 *  "N.NR" with trailing zeros stripped. Returns '—' for unset,
 *  empty, or non-numeric inputs. */
export function formatRR(rr: string | number | null | undefined): string {
  if (rr === null || rr === undefined) return '—';
  if (typeof rr === 'number') {
    if (isNaN(rr)) return '—';
    return formatNumber(rr, { trailingZeros: false, commas: false }) + 'R';
  }
  const s = String(rr).trim();
  if (s === '' || s === '—' || s === '\u2014') return '—';
  // Legacy "1:2.30" format — strip the redundant "1:" and parse
  const raw = s.startsWith('1:') ? s.slice(2) : s;
  // Already formatted like "2.7R" — just re-run through formatter
  // so styling stays consistent
  const n = parseFloat(raw);
  if (isNaN(n)) return '—';
  return formatNumber(n, { trailingZeros: false, commas: false }) + 'R';
}

// ─── Shared AI-context builder ──────────────────────────────────
// Produces a dense summary of the trader's history suitable for the
// coach system prompts. Every number is computed from the real trades
// array — no hardcoded mocks. Includes aggregates (totals, strategy,
// ticker, hour, direction breakdowns) and a per-trade log so the coach
// can reference specific dates/tickers.

function parseHourBucket(time: string): string {
  // Accepts "10:07 AM", "12:02 PM", "14:30" etc.
  const m = time?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return 'Unknown';
  let h = parseInt(m[1], 10);
  const ampm = (m[3] || '').toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const fmt = (n: number) => {
    const twelve = ((n % 12) === 0) ? 12 : (n % 12);
    const suffix = n < 12 ? 'AM' : 'PM';
    return `${twelve}${suffix}`;
  };
  return `${fmt(h)}-${fmt((h + 1) % 24)}`;
}

/** Numeric R:R extractor. Handles all formats the app has shipped:
 *  legacy "1:2.30", current raw "2.30", new display "2.3R", and
 *  em-dash / empty / null. Returns 0 for any non-parseable value so
 *  downstream math reductions stay safe. */
export function parseRr(rr: string | null | undefined): number {
  if (rr === null || rr === undefined) return 0;
  const s = String(rr).trim();
  if (s === '' || s === '—' || s === '\u2014') return 0;
  // Strip trailing "R" or " R"
  let core = s.replace(/\s*R\s*$/i, '');
  // Strip legacy "1:" prefix
  if (core.startsWith('1:')) core = core.slice(2);
  // Some older data used "1 : 2.3" with spaces around the colon
  if (core.startsWith('1 :')) core = core.slice(3);
  const n = parseFloat(core);
  return isNaN(n) ? 0 : n;
}

// ─── Derived analytics shared by every stats surface ──────────────
// One compute pass that returns everything the Analysis and Trader
// Profile tabs render. No hardcoded numbers live in those components
// any more — they all come from here.

export interface TraderAnalytics {
  totals: {
    n: number;
    wins: number;
    losses: number;
    breakeven: number;
    totalPL: number;
    winRate: number;
    avgR: number;
  };
  strategies: Array<{ name: string; trades: number; wr: number; avg: number; total: number; r: number }>;
  tickers: Array<{ t: string; color: string; trades: number; wr: number; pl: number }>;
  tickerLosses: Array<{ t: string; color: string; trades: number; wr: number; pl: number }>;
  hours: Array<{ h: string; pl: number; count: number }>;
  processSplit: {
    process: { n: number; wr: number; rTotal: number; plSum: number };
    impulse: { n: number; wr: number; rTotal: number; plSum: number };
  };
  /** 0-100 composite of win rate + process-trade ratio. */
  psychScore: number;
  /** Total P/L if only process trades were kept (impulse trades removed). */
  whatIfPL: number;
  /** $ amount indiscipline cost relative to the what-if. */
  indisciplineCost: number;
  /** Raw counts for the four friction/momentum pattern rows. */
  patterns: {
    ignoringRules: number;
    impulseEntries: number;
    revengeTrading: number;
    fomoChasing: number;
    patience: number;
    cleanExecution: number;
    stopDiscipline: number;
    trustingProcess: number;
  };
}

// Brand-color palette for tickers so bars keep their identity across pages.
const TICKER_COLORS: Record<string, string> = {
  V: '#1a1f71', META: '#0668E1', NVDA: '#76b900', AMD: '#ed1c24',
  BA: '#0039a6', MSFT: '#00a4ef', JPM: '#006cb7', DIS: '#113ccf',
  NFLX: '#e50914', TSLA: '#cc0000', AAPL: '#555555',
  GOOGL: '#4285F4', GOOG: '#4285F4', AMZN: '#FF9900', COIN: '#0052FF',
  PLTR: '#000000', CRM: '#00A1E0', COST: '#E31837', HD: '#F96302',
};

// Journal-keyword classifier. With no explicit process/impulse tag on
// the Trade, we infer intent from what the trader wrote about the trade.
const IMPULSE_KEYWORDS = [
  'fomo', 'chase', 'chasing', 'chased', 'impulse', 'impulsive',
  'revenge', 'angry', 'frustrated', 'tilted', 'tilt', 'yolo',
  'forced', 'emotional', 'broke rules', 'ignored rules', 'shouldn\'t have',
  'missed', 'jumped in', 'didn\'t wait', 'rushed',
];
const PROCESS_KEYWORDS = [
  'patient', 'waited', 'patience', 'setup', 'clean', 'textbook',
  'plan', 'planned', 'rules', 'discipline', 'disciplined',
  'confirmed', 'confirmation', 'process', 'trusted', 'trusting',
  'stuck to', 'honored', 'stopped out', 'on plan',
];

// Per-pattern keyword sets for the Trader Profile observations board.
const PATTERN_KEYWORDS = {
  ignoringRules:    ['broke rules', 'ignored rules', 'against my rules', 'shouldn\'t have', 'broke my', 'violated'],
  impulseEntries:   ['impulse', 'impulsive', 'jumped in', 'didn\'t wait', 'rushed', 'quick', 'no setup'],
  revengeTrading:   ['revenge', 'frustrated', 'angry', 'tilt', 'tilted', 'got back', 'pissed'],
  fomoChasing:      ['fomo', 'chase', 'chasing', 'chased', 'missed', 'scared to miss'],
  patience:         ['patient', 'patience', 'waited', 'didn\'t chase', 'watched', 'waiting'],
  cleanExecution:   ['clean', 'textbook', 'as planned', 'on plan', 'executed'],
  stopDiscipline:   ['stopped out', 'honored stop', 'took stop', 'clean stop', 'cut'],
  trustingProcess:  ['trusted', 'stuck to', 'followed rules', 'disciplined', 'process worked'],
};

function journalMatches(journal: string, keywords: string[]): boolean {
  const t = (journal || '').toLowerCase();
  return keywords.some(k => t.includes(k));
}

function classifyTrade(t: Trade): 'process' | 'impulse' | 'neutral' {
  const j = t.journal || '';
  const isImpulse = journalMatches(j, IMPULSE_KEYWORDS);
  const isProcess = journalMatches(j, PROCESS_KEYWORDS);
  if (isImpulse && !isProcess) return 'impulse';
  if (isProcess && !isImpulse) return 'process';
  if (isImpulse && isProcess) return 'impulse';
  return 'neutral';
}

function parseHourNumber(time: string): number | null {
  const m = (time || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const ampm = (m[3] || '').toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h;
}

const HOUR_BUCKETS = [
  { label: '9-10AM', start: 9 },
  { label: '10-11AM', start: 10 },
  { label: '11-12PM', start: 11 },
  { label: '12-1PM', start: 12 },
  { label: '1-2PM', start: 13 },
  { label: '2-3PM', start: 14 },
  { label: '3-4PM', start: 15 },
];

const EMPTY_ANALYTICS: TraderAnalytics = {
  totals: { n: 0, wins: 0, losses: 0, breakeven: 0, totalPL: 0, winRate: 0, avgR: 0 },
  strategies: [],
  tickers: [],
  tickerLosses: [],
  hours: HOUR_BUCKETS.map(b => ({ h: b.label, pl: 0, count: 0 })),
  processSplit: {
    process: { n: 0, wr: 0, rTotal: 0, plSum: 0 },
    impulse: { n: 0, wr: 0, rTotal: 0, plSum: 0 },
  },
  psychScore: 0,
  whatIfPL: 0,
  indisciplineCost: 0,
  patterns: {
    ignoringRules: 0, impulseEntries: 0, revengeTrading: 0, fomoChasing: 0,
    patience: 0, cleanExecution: 0, stopDiscipline: 0, trustingProcess: 0,
  },
};

export function computeAnalytics(trades: Trade[]): TraderAnalytics {
  if (!trades || trades.length === 0) return EMPTY_ANALYTICS;

  const n = trades.length;
  const wins = trades.filter(t => t.pl > 0);
  const losses = trades.filter(t => t.pl < 0);
  const breakeven = trades.filter(t => t.pl === 0);
  const totalPL = trades.reduce((s, t) => s + t.pl, 0);
  const winRate = (wins.length / n) * 100;
  const avgR = trades.reduce((s, t) => s + parseRr(t.riskReward), 0) / n;

  // Strategy breakdown — sorted by total $ P/L descending
  const stratMap = new Map<string, { trades: number; wins: number; pl: number; rSum: number }>();
  trades.forEach(t => {
    const s = stratMap.get(t.strategy) || { trades: 0, wins: 0, pl: 0, rSum: 0 };
    s.trades++;
    if (t.pl > 0) s.wins++;
    s.pl += t.pl;
    s.rSum += parseRr(t.riskReward);
    stratMap.set(t.strategy, s);
  });
  const strategies = [...stratMap.entries()]
    .map(([name, v]) => ({
      name,
      trades: v.trades,
      wr: (v.wins / v.trades) * 100,
      avg: v.pl / v.trades,
      total: v.pl,
      r: v.rSum / v.trades,
    }))
    .sort((a, b) => b.total - a.total);

  // Ticker breakdown — both winners (desc by P/L) and losers (asc by P/L)
  const tickerMap = new Map<string, { trades: number; wins: number; pl: number }>();
  trades.forEach(t => {
    const s = tickerMap.get(t.ticker) || { trades: 0, wins: 0, pl: 0 };
    s.trades++;
    if (t.pl > 0) s.wins++;
    s.pl += t.pl;
    tickerMap.set(t.ticker, s);
  });
  const allTickers = [...tickerMap.entries()].map(([t, v]) => ({
    t,
    color: TICKER_COLORS[t] || '#6b7280',
    trades: v.trades,
    wr: (v.wins / v.trades) * 100,
    pl: v.pl,
  }));
  const tickers = [...allTickers].sort((a, b) => b.pl - a.pl);
  const tickerLosses = [...allTickers].filter(t => t.pl < 0).sort((a, b) => a.pl - b.pl);

  // Hourly distribution parsed from the time field (e.g. "10:07 AM")
  const hours = HOUR_BUCKETS.map(b => {
    const bucket = trades.filter(t => parseHourNumber(t.time) === b.start);
    return {
      h: b.label,
      pl: bucket.reduce((s, t) => s + t.pl, 0),
      count: bucket.length,
    };
  });

  // Process vs impulse via journal keyword classification
  const processTrades = trades.filter(t => classifyTrade(t) === 'process');
  const impulseTrades = trades.filter(t => classifyTrade(t) === 'impulse');
  const processSplit = {
    process: {
      n: processTrades.length,
      wr: processTrades.length ? (processTrades.filter(t => t.pl > 0).length / processTrades.length) * 100 : 0,
      rTotal: processTrades.reduce((s, t) => s + parseRr(t.riskReward), 0),
      plSum: processTrades.reduce((s, t) => s + t.pl, 0),
    },
    impulse: {
      n: impulseTrades.length,
      wr: impulseTrades.length ? (impulseTrades.filter(t => t.pl > 0).length / impulseTrades.length) * 100 : 0,
      rTotal: impulseTrades.reduce((s, t) => s + parseRr(t.riskReward), 0),
      plSum: impulseTrades.reduce((s, t) => s + t.pl, 0),
    },
  };

  // Composite 0-100 score: half win rate, half process ratio.
  const processRatio = n ? (processTrades.length / n) * 100 : 0;
  const psychScore = Math.round(0.5 * winRate + 0.5 * processRatio);

  // What the book would look like with only process trades kept.
  const whatIfPL = totalPL - processSplit.impulse.plSum;
  const indisciplineCost = whatIfPL - totalPL;

  const count = (kws: string[]) => trades.filter(t => journalMatches(t.journal || '', kws)).length;

  return {
    totals: { n, wins: wins.length, losses: losses.length, breakeven: breakeven.length, totalPL, winRate, avgR },
    strategies,
    tickers,
    tickerLosses,
    hours,
    processSplit,
    psychScore,
    whatIfPL,
    indisciplineCost,
    patterns: {
      ignoringRules:   count(PATTERN_KEYWORDS.ignoringRules),
      impulseEntries:  count(PATTERN_KEYWORDS.impulseEntries),
      revengeTrading:  count(PATTERN_KEYWORDS.revengeTrading),
      fomoChasing:     count(PATTERN_KEYWORDS.fomoChasing),
      patience:        count(PATTERN_KEYWORDS.patience),
      cleanExecution:  count(PATTERN_KEYWORDS.cleanExecution),
      stopDiscipline:  count(PATTERN_KEYWORDS.stopDiscipline),
      trustingProcess: count(PATTERN_KEYWORDS.trustingProcess),
    },
  };
}

export function buildTraderStats(trades: Trade[]): string {
  if (!trades || trades.length === 0) return 'No trades logged yet.';

  const n = trades.length;
  const wins = trades.filter(t => t.pl > 0);
  const losses = trades.filter(t => t.pl < 0);
  const be = trades.filter(t => t.pl === 0);
  const totalPL = trades.reduce((s, t) => s + t.pl, 0);
  const winRate = (wins.length / n) * 100;
  const avgR = trades.reduce((s, t) => s + parseRr(t.riskReward), 0) / n;

  const longs = trades.filter(t => t.direction === 'LONG');
  const shorts = trades.filter(t => t.direction === 'SHORT');

  const group = <K extends string>(key: (t: Trade) => K) => {
    const m = new Map<K, { count: number; wins: number; pl: number; rSum: number }>();
    trades.forEach(t => {
      const k = key(t);
      const cur = m.get(k) || { count: 0, wins: 0, pl: 0, rSum: 0 };
      cur.count++;
      if (t.pl > 0) cur.wins++;
      cur.pl += t.pl;
      cur.rSum += parseRr(t.riskReward);
      m.set(k, cur);
    });
    return m;
  };

  const byStrategy = group(t => t.strategy);
  const byTicker = group(t => t.ticker);
  const byHour = group(t => parseHourBucket(t.time));
  const byDay = group(t => {
    const d = new Date(t.date);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()] as string;
  });

  const fmtAgg = (label: string, entries: [string, { count: number; wins: number; pl: number; rSum: number }][]) => {
    const sorted = entries.sort((a, b) => b[1].pl - a[1].pl);
    return `${label}: ` + sorted.map(([k, v]) =>
      `${k} ${v.count}t ${(v.wins / v.count * 100).toFixed(1)}%WR $${v.pl.toFixed(0)} avgR${(v.rSum / v.count).toFixed(2)}`
    ).join('; ');
  };

  const tickerEntries = [...byTicker.entries()].sort((a, b) => b[1].pl - a[1].pl);
  const topTickers = tickerEntries.slice(0, 8);
  const bottomTickers = tickerEntries.slice(-5).reverse();

  // Per-trade log — mirrors every visible Past Trades column so the coach
  // can reference individual executions by date/ticker/journal content.
  const tradeLog = trades
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(t => (
      `Date:${t.date} Time:${t.time} ` +
      `Asset:${t.ticker} Strategy:${t.strategy} Direction:${t.direction} Qty:${t.contracts} ` +
      `Entry:$${t.entryPrice} Exit:$${t.exitPrice} ` +
      `NetPL:$${t.pl} Result:${t.result} R:R:${t.riskReward} ` +
      `Notes:"${t.journal}"`
    ))
    .join('\n');

  return [
    `TOTALS: ${n} trades, ${wins.length}W ${losses.length}L ${be.length}BE, total P/L $${totalPL.toFixed(2)}, win rate ${winRate.toFixed(1)}%, avg R:R 1:${avgR.toFixed(2)}.`,
    `DIRECTION: ${longs.length} LONG (${longs.filter(t => t.pl > 0).length} wins, $${longs.reduce((s, t) => s + t.pl, 0).toFixed(0)}); ${shorts.length} SHORT (${shorts.filter(t => t.pl > 0).length} wins, $${shorts.reduce((s, t) => s + t.pl, 0).toFixed(0)}).`,
    fmtAgg('BY STRATEGY', [...byStrategy.entries()]),
    `TOP TICKERS: ${topTickers.map(([k, v]) => `${k} $${v.pl.toFixed(0)} (${v.count}t ${(v.wins / v.count * 100).toFixed(1)}%WR)`).join('; ')}.`,
    `BOTTOM TICKERS: ${bottomTickers.map(([k, v]) => `${k} $${v.pl.toFixed(0)} (${v.count}t ${(v.wins / v.count * 100).toFixed(1)}%WR)`).join('; ')}.`,
    fmtAgg('BY HOUR', [...byHour.entries()]),
    fmtAgg('BY DAY-OF-WEEK', [...byDay.entries()]),
    `\nPER-TRADE LOG (oldest to newest):\n${tradeLog}`,
  ].join('\n');
}

// ─── Quantitative weekly targets ─────────────────────────────
// Stored inside wickcoach_trader_profile alongside onboarding fields.
// target-rr and target-wr are always present; traders can add custom
// targets (dollar, number, or percent). `value: null` means unset.

export type QuantTargetType = 'number' | 'percent' | 'dollar';

export interface QuantitativeTarget {
  id: string;
  label: string;
  value: number | null;
  type: QuantTargetType;
}

export const DEFAULT_QUANT_TARGETS: QuantitativeTarget[] = [
  { id: 'target-rr', label: 'Target Risk:Reward', value: null, type: 'number' },
  { id: 'target-wr', label: 'Target Win Rate',    value: null, type: 'percent' },
];

export function readQuantTargets(): { quantitativeTargets: QuantitativeTarget[]; customQuantTargets: QuantitativeTarget[] } {
  if (typeof window === 'undefined') return { quantitativeTargets: DEFAULT_QUANT_TARGETS.map(t => ({ ...t })), customQuantTargets: [] };
  try {
    const raw = localStorage.getItem('wickcoach_trader_profile');
    const profile = raw ? JSON.parse(raw) : {};
    const quantitativeTargets = Array.isArray(profile.quantitativeTargets) && profile.quantitativeTargets.length > 0
      ? profile.quantitativeTargets as QuantitativeTarget[]
      : DEFAULT_QUANT_TARGETS.map(t => ({ ...t }));
    const customQuantTargets = Array.isArray(profile.customQuantTargets)
      ? profile.customQuantTargets as QuantitativeTarget[]
      : [];
    return { quantitativeTargets, customQuantTargets };
  } catch {
    return { quantitativeTargets: DEFAULT_QUANT_TARGETS.map(t => ({ ...t })), customQuantTargets: [] };
  }
}

function writeProfileFields(fields: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('wickcoach_trader_profile');
    const profile = raw ? JSON.parse(raw) : {};
    Object.assign(profile, fields);
    localStorage.setItem('wickcoach_trader_profile', JSON.stringify(profile));
  } catch { /* ignore quota errors */ }
}

// ─── Per-week quantitative target history ────────────────────
// A separate key from the profile so past-week target values stay
// frozen at whatever the user had set *during* that week. Editing
// current-week targets in the UI mirrors into this map under the
// current weekStart. Viewing a past week lazy-snapshots the live
// profile targets into that week's slot on first access.
//
// Shape: Record<weekStart (YYYY-MM-DD), TargetsSnapshot>
export const QUANT_TARGETS_HISTORY_KEY = 'wickcoach_quant_targets_history';

export interface TargetsSnapshot {
  quantitativeTargets: QuantitativeTarget[];
  customQuantTargets: QuantitativeTarget[];
}

function readQuantTargetsHistory(): Record<string, TargetsSnapshot> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(QUANT_TARGETS_HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeQuantTargetsHistory(history: Record<string, TargetsSnapshot>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUANT_TARGETS_HISTORY_KEY, JSON.stringify(history));
  } catch { /* ignore quota errors */ }
}

/**
 * Returns the quantitative target snapshot for a given week.
 *
 * First call for a week that isn't in the history lazy-stamps the
 * current live profile targets into that slot and returns them. After
 * that the slot is frozen: later edits to the profile never
 * retroactively change past weeks.
 */
export function getQuantTargetsForWeek(weekStart: string): TargetsSnapshot {
  const history = readQuantTargetsHistory();
  if (history[weekStart]) return history[weekStart];
  const live = readQuantTargets();
  const snap: TargetsSnapshot = {
    quantitativeTargets: live.quantitativeTargets.map(t => ({ ...t })),
    customQuantTargets: live.customQuantTargets.map(t => ({ ...t })),
  };
  history[weekStart] = snap;
  writeQuantTargetsHistory(history);
  return snap;
}

/** Mirror the current live targets into this week's history slot — called after every edit of current-week targets. */
function syncCurrentWeekHistory(): void {
  const ws = getCurrentWeekStart();
  const live = readQuantTargets();
  const history = readQuantTargetsHistory();
  history[ws] = {
    quantitativeTargets: live.quantitativeTargets.map(t => ({ ...t })),
    customQuantTargets: live.customQuantTargets.map(t => ({ ...t })),
  };
  writeQuantTargetsHistory(history);
}

export function updateQuantTarget(id: string, value: number | null): void {
  const { quantitativeTargets, customQuantTargets } = readQuantTargets();
  const nextQuant  = quantitativeTargets.map(t => t.id === id ? { ...t, value } : t);
  const nextCustom = customQuantTargets.map(t => t.id === id ? { ...t, value } : t);
  writeProfileFields({ quantitativeTargets: nextQuant, customQuantTargets: nextCustom });
  syncCurrentWeekHistory();
}

export function addCustomQuantTarget(label: string, type: QuantTargetType = 'number'): QuantitativeTarget {
  const { quantitativeTargets, customQuantTargets } = readQuantTargets();
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const target: QuantitativeTarget = { id, label, value: null, type };
  writeProfileFields({ quantitativeTargets, customQuantTargets: [...customQuantTargets, target] });
  syncCurrentWeekHistory();
  return target;
}

export function removeCustomQuantTarget(id: string): void {
  const { quantitativeTargets, customQuantTargets } = readQuantTargets();
  writeProfileFields({ quantitativeTargets, customQuantTargets: customQuantTargets.filter(t => t.id !== id) });
  syncCurrentWeekHistory();
}

// ─── Shared AI context — read from localStorage at call time ─────
// Every /api/coach caller uses these so every bot sees the same picture
// of who the trader is, what goals they've set, and what they've said
// about those goals. Without this, each chat lives in its own silo.

export function buildGoalsContext(): string {
  if (typeof window === 'undefined') return '';
  try {
    const saved = localStorage.getItem('wickcoach_goals');
    if (!saved) return '';
    const goals: Goal[] = JSON.parse(saved);
    const real = (goals || []).filter(g => g.title);
    if (real.length === 0) return '';
    return real.map((g, i) => {
      const lines: string[] = [];
      lines.push(`${i + 1}. "${g.title}" [type: ${g.goalType}]`);
      if (typeof g.completeness === 'number') lines.push(`   understood: ${g.completeness}%`);
      if (g.scoringCriteria) {
        lines.push(`   measure: ${g.scoringCriteria.measure}`);
        lines.push(`   compliance looks like: ${g.scoringCriteria.compliance}`);
        lines.push(`   violation looks like: ${g.scoringCriteria.violation}`);
        lines.push(`   scope: ${g.scoringCriteria.scope}`);
      }
      if (g.context && g.context.length > 0) {
        lines.push(`   trader's own words about this goal: ${g.context.join(' | ')}`);
      }
      if (g.actionItems && g.actionItems.length > 0) {
        lines.push(`   committed action items: ${g.actionItems.join('; ')}`);
      }
      return lines.join('\n');
    }).join('\n\n');
  } catch {
    return '';
  }
}

export function buildProfileContext(): string {
  if (typeof window === 'undefined') return '';
  try {
    const saved = localStorage.getItem('wickcoach_trader_profile');
    if (!saved) return '';
    const p = JSON.parse(saved);
    const lines: string[] = [];
    if (p.instruments)         lines.push(`Instruments traded: ${p.instruments}`);
    if (p.strategy)            lines.push(`Primary strategy: ${p.strategy}`);
    if (p.experience)          lines.push(`Experience: ${p.experience}`);
    if (p.biggestStruggle)     lines.push(`Biggest struggle (self-reported): ${p.biggestStruggle}`);
    if (p.goodDayDescription)  lines.push(`What a good day looks like to them: ${p.goodDayDescription}`);

    // Quantitative targets — included so every bot can compare real
    // stats (win rate, avg R:R, custom metrics) to what the trader said
    // they're aiming for.
    const quant  = (Array.isArray(p.quantitativeTargets) ? p.quantitativeTargets : []) as QuantitativeTarget[];
    const custom = (Array.isArray(p.customQuantTargets)  ? p.customQuantTargets  : []) as QuantitativeTarget[];
    const setTargets = [...quant, ...custom].filter(t => t && t.value !== null && t.value !== undefined);
    if (setTargets.length > 0) {
      lines.push('Weekly quantitative targets the trader has set:');
      setTargets.forEach(t => {
        const suffix = t.type === 'percent' ? '%' : t.type === 'dollar' ? ' USD' : '';
        lines.push(`- ${t.label}: ${t.value}${suffix}`);
      });
    }

    return lines.join('\n');
  } catch {
    return '';
  }
}

// ─── AI trade classification (Haiku-powered) ─────────────────
// Cached result per-trade, keyed by trade.id in localStorage under
// `wickcoach_trade_classifications`.

/** Bump when the classify system prompt in app/api/coach/route.ts
 *  changes its schema or scoring rules. Cached entries stamped with
 *  a different version are re-scored on next Analysis mount. */
export const CLASSIFY_PROMPT_VERSION = 'v2-2026-04';

export interface TradeClassification {
  tradeId: string;
  /** Which prompt version produced this entry — see CLASSIFY_PROMPT_VERSION. */
  promptVersion: string;
  /**
   * Per-goal compliance.
   *  - `1`    = journal explicitly shows the goal was followed
   *  - `0`    = journal explicitly shows the goal was violated
   *  - `null` = journal says nothing about this goal's subject
   *             (classifier must pick null rather than fabricate a 0 or 1)
   */
  goalScores: Array<{ goalIndex: number; compliance: 0 | 1 | null; reason: string }>;
  psychScore: number;      // 0-100
  tradeType: 'process' | 'impulse' | 'neutral';
  psychReason: string;
  /** Per-trade numeric targets scored by Haiku (target-rr, custom numerics). */
  targetScores?: Array<{ targetId: string; met: boolean; actual: number; target: number }>;
}

/** Batch-level classification summary returned by Haiku alongside per-trade results. */
export interface ClassificationBatchSummary {
  winRateActual?: number;
  winRateTarget?: number | null;
  customTargetsNote?: string;
}

export const CLASSIFICATION_SUMMARY_KEY = 'wickcoach_classification_summary';

export function readClassificationSummary(): ClassificationBatchSummary {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CLASSIFICATION_SUMMARY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeClassificationSummary(s: ClassificationBatchSummary): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLASSIFICATION_SUMMARY_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

export const CLASSIFICATION_STORE_KEY = 'wickcoach_trade_classifications';

export function readClassifications(): Record<string, TradeClassification> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CLASSIFICATION_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeClassifications(map: Record<string, TradeClassification>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLASSIFICATION_STORE_KEY, JSON.stringify(map));
  } catch { /* ignore quota errors */ }
}

export interface GoalScoringCriteria {
  measure: string;
  compliance: string;
  violation: string;
  scope: string;
}

export interface Goal {
  id: string;
  title: string;
  context: string[];
  aiResponses: string[];
  contextComplete: boolean;
  actionItems: string[];
  createdAt: string;
  goalType: string;
  /** ISO date (YYYY-MM-DD) of the Monday that starts the week this goal was active for. */
  weekStart: string;
  /** Latest completeness score (0-100) emitted by the goal-clarification coach. */
  completeness?: number;
  /** Structured scoring criteria emitted by the coach once the goal is understood. */
  scoringCriteria?: GoalScoringCriteria;
}

export const GOAL_TYPES = ['Trade Management', 'Entry Criteria', 'Patience / Setup', 'Risk Management', 'Psychology', 'General'];

// Week helpers — shared by the Weekly Goals page and the Analysis
// week selector so both see the same Monday-aligned boundaries.
export function startOfWeek(d: Date): Date {
  const day = d.getDay();              // Sun = 0
  const diff = (day === 0 ? -6 : 1) - day; // snap back to Monday
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() + diff);
  return s;
}

/** Format a Date as "YYYY-MM-DD" using *local* calendar fields — never UTC — so day/DST shifts don't silently move the week. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getCurrentWeekStart(): string {
  return toISODate(startOfWeek(new Date()));
}

/** Human label for a week starting on the given ISO date, e.g. "Apr 20 - 26" or "Apr 28 - May 4". */
export function formatWeekRange(weekStart: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(start.getTime() + 6 * 86400000);
  const sameMonth = start.getMonth() === end.getMonth();
  const left = `${months[start.getMonth()]} ${start.getDate()}`;
  const right = sameMonth ? `${end.getDate()}` : `${months[end.getMonth()]} ${end.getDate()}`;
  return `${left} - ${right}`;
}

export const GOALS_STORE_KEY = 'wickcoach_goals';

export function readAllGoals(): Goal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GOALS_STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeAllGoals(goals: Goal[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GOALS_STORE_KEY, JSON.stringify(goals));
  } catch { /* ignore quota errors */ }
}

export function getGoalsForWeek(weekStart: string): Goal[] {
  return readAllGoals().filter(g => g.weekStart === weekStart);
}

/** Unique weekStart values from stored goals, sorted descending (most recent first). */
export function getAllWeekStarts(): string[] {
  const goals = readAllGoals();
  const set = new Set<string>();
  for (const g of goals) {
    if (g.weekStart) set.add(g.weekStart);
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

/** Returns the default seeded goals for a fresh install, stamped with the current week. */
export function getDefaultGoals(): Goal[] {
  const ws = getCurrentWeekStart();
  return [
    { id: 'g1', title: 'LET TRADES BREATHE 3+ WHEN AT BREAK-EVEN', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: new Date().toISOString(), goalType: 'Trade Management', weekStart: ws },
    { id: 'g2', title: '5M AND 13/15M CONFIRMATION BEHIND ALL TRADES', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: new Date().toISOString(), goalType: 'Entry Criteria', weekStart: ws },
    { id: 'g3', title: 'AT OR NEAR 20MA, WILL WAIT FOR PULLBACK IF FAR', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: new Date().toISOString(), goalType: 'Patience / Setup', weekStart: ws },
  ];
}

