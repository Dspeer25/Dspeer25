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
  'trade duration, time in trade, hold time (in minutes; requires exit time on the trade)',
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

  // ── Loss size (absolute P/L for losing trades, null otherwise) ─
  //    Classification by t.result, not pl sign: a BE-intent trade
  //    that slipped to -$12 is not a "loss" for size purposes.
  if (/loss.?(size|amount)|^losses?$/.test(n))
    return t => t.result === 'LOSS' ? Math.abs(t.pl) : null;

  // ── Win size (P/L for winning trades, null otherwise) ──────
  if (/win.?(size|amount)|^wins$/.test(n))
    return t => t.result === 'WIN' ? t.pl : null;

  // ── Win rate (1 for win, 0 for loss, null for BE — BE drops
  //    out of the regression instead of polluting the rate). ──
  if (/win.?rate/.test(n))
    return t => t.result === 'WIN' ? 1 : t.result === 'LOSS' ? 0 : null;

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
  // Computes exit minute-of-day minus entry minute-of-day. Returns
  // null when either timestamp is missing (older trades + imported
  // records from Trading Tracker don't have exitTime) so the
  // regression skips those rows instead of using bogus zeros.
  if (/trade.?duration|time.?in.?trade|hold.?time|how.?long|^duration$/.test(n))
    return t => {
      const toMinutes = (s: string | undefined): number | null => {
        if (!s) return null;
        const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!m) return null;
        let h = parseInt(m[1], 10);
        const mins = parseInt(m[2], 10);
        const ap = (m[3] || '').toUpperCase();
        if (ap === 'PM' && h !== 12) h += 12;
        if (ap === 'AM' && h === 12) h = 0;
        return h * 60 + mins;
      };
      const e = toMinutes(t.time);
      const x = toMinutes(t.exitTime);
      if (e === null || x === null) return null;
      const d = x - e;
      return d >= 0 ? d : null; // guard against overnight / data errors
    };

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

/**
 * Result of parsing a user-typed filter condition. Separating the
 * three outcomes is what prevents the Regression Lab from silently
 * running unfiltered when the user typed a condition the parser
 * didn't recognise — that was the old failure mode.
 *
 *  - 'empty' → user typed nothing. Run against all trades.
 *  - 'ok'    → condition parsed; apply `predicate` to trades.
 *  - 'error' → condition was typed but unparseable; surface `message`
 *              and refuse to run, never fall back to unfiltered.
 */
export type FilterParseResult =
  | { kind: 'empty' }
  | { kind: 'ok'; predicate: (t: Trade) => boolean }
  | { kind: 'error'; message: string };

/** Resolve a plain-English filter condition to a predicate on Trade. */
export function resolveTradeFilter(condition: string): FilterParseResult {
  if (!condition || !condition.trim()) return { kind: 'empty' };
  // The Regression Lab renders an "if" label outside the input, but
  // users often type "if …" into the box anyway. Strip a single
  // leading "if" so the numeric parser (which anchors to ^ and $)
  // and the tail-anchored positive matchers agree on field bounds.
  const c = condition.toLowerCase().trim().replace(/^if\s+/, '');

  const DAY_NAMES: Record<string, number> = {
    sunday: 0, sun: 0,
    monday: 1, mon: 1,
    tuesday: 2, tue: 2, tues: 2,
    wednesday: 3, wed: 3,
    thursday: 4, thu: 4, thurs: 4,
    friday: 5, fri: 5,
    saturday: 6, sat: 6,
  };

  // ── Numeric comparison against a trade field ───────────────
  // Runs first because its operator tokens (>, <, >=, <=, =, !=)
  // are distinctive enough that no other branch should ever
  // legitimately fire. The field name is resolved through a
  // small alias table that mirrors the Regression Lab's variable
  // aliases — so "profit > 500" and "pl > 500" both work.
  const NUMERIC_FIELDS: Array<{ re: RegExp; get: (t: Trade) => number | null; label: string }> = [
    { label: 'pl',           re: /^(?:p\/?l|profit|pnl|gains|net|returns?)$/,                     get: t => t.pl },
    { label: 'return%',      re: /^(?:return\s*%|%\s*return|return\s*percent|pl\s*percent|%)$/,   get: t => t.plPercent },
    { label: 'riskAmount',   re: /^(?:risk(?:\s*amount)?)$/,                                       get: t => (typeof t.riskAmount === 'number' ? t.riskAmount : null) },
    { label: 'contracts',    re: /^(?:contracts?|position\s*size|size|quantity|qty)$/,             get: t => t.contracts },
    { label: 'riskReward',   re: /^(?:r\s*:\s*r|rr|risk\s*reward|r)$/,                             get: t => { const v = parseRr(t.riskReward); return v > 0 ? v : null; } },
    { label: 'entryPrice',   re: /^(?:entry(?:\s*price)?|open)$/,                                  get: t => t.entryPrice },
    { label: 'exitPrice',    re: /^(?:exit(?:\s*price)?|close)$/,                                  get: t => t.exitPrice },
  ];
  // Operators are tried in length-descending order so >= and <=
  // aren't partially consumed as > and <.
  const numericMatch = c.match(/^([a-z%:\/\s]+?)\s*(>=|<=|!=|>|<|=)\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (numericMatch) {
    const rawField = numericMatch[1].trim();
    const op = numericMatch[2];
    const threshold = parseFloat(numericMatch[3]);
    const field = NUMERIC_FIELDS.find(f => f.re.test(rawField));
    if (!field) {
      return { kind: 'error', message: `Unknown field "${rawField}" in numeric comparison. Supported fields: pl / profit, return %, risk, contracts / size, R:R, entry, exit.` };
    }
    const get = field.get;
    return {
      kind: 'ok',
      predicate: t => {
        const v = get(t);
        if (v === null || !isFinite(v)) return false;
        switch (op) {
          case '>':  return v > threshold;
          case '<':  return v < threshold;
          case '>=': return v >= threshold;
          case '<=': return v <= threshold;
          case '=':  return v === threshold;
          case '!=': return v !== threshold;
          default:   return false;
        }
      },
    };
  }

  // "day other than Wednesday" / "not Wednesday" / "exclude Wednesday" / "except Wednesday"
  const dayExcludeMatch = c.match(/(?:day\s+)?(?:other\s+than|not|except|exclude|excluding|!=)\s+(\w+)/);
  if (dayExcludeMatch) {
    const dayNum = DAY_NAMES[dayExcludeMatch[1].toLowerCase()];
    if (dayNum !== undefined) {
      return { kind: 'ok', predicate: t => new Date(t.date).getUTCDay() !== dayNum };
    }
  }

  // "day is Monday" / "on Monday" / "only Monday" / "Monday only"
  const dayIncludeMatch = c.match(/(?:day\s*(?:is|=|:)\s*|on\s+|only\s+)(\w+)|(\w+)\s+only$/);
  if (dayIncludeMatch) {
    const dayWord = (dayIncludeMatch[1] || dayIncludeMatch[2] || '').toLowerCase();
    const dayNum = DAY_NAMES[dayWord];
    if (dayNum !== undefined) {
      return { kind: 'ok', predicate: t => new Date(t.date).getUTCDay() === dayNum };
    }
  }

  // ── Field negation branches (must run BEFORE the positive
  // equivalents so "strategy is not 0DTE Call" isn't swallowed by
  // stratMatch's greedy `(.+)` capture).
  // Shared negation token: "is not", "isn't", "!=", or a bare
  // "not" immediately after the field name.
  const NEG_TOK = `(?:is\\s+not|isn'?t|!=|not)`;

  // "strategy is not X" / "strategy != X"
  const stratNegMatch = c.match(new RegExp(`strategy\\s*${NEG_TOK}\\s*(.+)`));
  if (stratNegMatch) {
    const strat = stratNegMatch[1].trim().toLowerCase();
    return { kind: 'ok', predicate: t => !t.strategy.toLowerCase().includes(strat) };
  }
  // "strategy is X" / "strategy = X"
  const stratMatch = c.match(/strategy\s*(?:is|=|==|:)\s*(.+)/);
  if (stratMatch) {
    const strat = stratMatch[1].trim().toLowerCase();
    return { kind: 'ok', predicate: t => t.strategy.toLowerCase().includes(strat) };
  }

  // "ticker is not SPY" / "ticker != SPY" / "ticker isn't SPY"
  const tickerNegMatch = c.match(new RegExp(`ticker\\s*${NEG_TOK}\\s*(.+)`));
  if (tickerNegMatch) {
    const tick = tickerNegMatch[1].trim().toUpperCase();
    return { kind: 'ok', predicate: t => t.ticker !== tick };
  }
  // "ticker is X" / "ticker = X"
  const tickerMatch = c.match(/ticker\s*(?:is|=|==|:)\s*(.+)/);
  if (tickerMatch) {
    const tick = tickerMatch[1].trim().toUpperCase();
    return { kind: 'ok', predicate: t => t.ticker === tick };
  }

  // "direction is not long" / "direction != short"
  const dirNegMatch = c.match(new RegExp(`direction\\s*${NEG_TOK}\\s*(long|short)`, 'i'));
  if (dirNegMatch) {
    const dir = dirNegMatch[1].toUpperCase();
    return { kind: 'ok', predicate: t => t.direction !== dir };
  }
  // "direction is long/short"
  const dirMatch = c.match(/direction\s*(?:is|=|==|:)\s*(long|short)/i);
  if (dirMatch) {
    const dir = dirMatch[1].toUpperCase();
    return { kind: 'ok', predicate: t => t.direction === dir };
  }

  // "wins only" / "losses only"
  if (/win/.test(c)) return { kind: 'ok', predicate: t => t.result === 'WIN' };
  if (/loss|losing/.test(c)) return { kind: 'ok', predicate: t => t.result === 'LOSS' };
  // "before 11" / "after 1pm"
  const timeMatch = c.match(/(before|after)\s*(\d{1,2})\s*(am|pm)?/i);
  if (timeMatch) {
    const dir = timeMatch[1].toLowerCase();
    let h = parseInt(timeMatch[2]);
    const ap = (timeMatch[3] || '').toUpperCase();
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return {
      kind: 'ok',
      predicate: t => {
        const m = (t.time || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!m) return false;
        let th = parseInt(m[1]);
        const tap = (m[3] || '').toUpperCase();
        if (tap === 'PM' && th !== 12) th += 12;
        if (tap === 'AM' && th === 12) th = 0;
        return dir === 'before' ? th < h : th >= h;
      },
    };
  }

  // Last resort: check if the condition contains a day name directly
  // e.g. just "wednesday" or "not on friday"
  for (const [name, num] of Object.entries(DAY_NAMES)) {
    if (c.includes(name)) {
      const isExclude = /not|other|except|exclud|!=/.test(c);
      return {
        kind: 'ok',
        predicate: isExclude
          ? t => new Date(t.date).getUTCDay() !== num
          : t => new Date(t.date).getUTCDay() === num,
      };
    }
  }

  return {
    kind: 'error',
    message: `Could not parse filter: "${condition.trim()}". Supported patterns: field operators ("pl > 500", "risk < 400", "contracts >= 10", "R:R > 2"), ticker/strategy/direction equality and negation ("ticker is not SPY"), day-of-week ("on Monday", "not on Friday"), wins/losses, time-of-day ("before 11", "after 1pm").`,
  };
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

// ─── Position type + per-type strategy storage ──────────────────
// Three position types: SHARES, OPTIONS (was 'DERIVATIVES'), FUTURES.
// Each has its own persistent strategy list in localStorage. The
// trader can add+delete strategies inside Log a Trade or the goal
// builder; both surfaces read+write the same per-type lists so a
// custom strategy added in one shows up in the other.

export type PositionType = 'SHARES' | 'OPTIONS' | 'FUTURES';

/** Seed defaults the first time a list is read. Trader can delete
 *  any of these to clean up the dropdown. */
export const STRATEGY_DEFAULTS: Record<PositionType, string[]> = {
  SHARES:  ['Buy & Hold', 'Swing', 'Day Trade', 'Mean Reversion', 'Position Trade'],
  OPTIONS: ['0DTE Call', '0DTE Put', 'Call Scalp', 'Put Scalp', 'Call Debit Spread', 'Put Debit Spread', 'Put Credit Spread', 'Call Credit Spread', 'Iron Condor', 'Naked Put', 'Naked Call'],
  FUTURES: ['Trend Follow', 'Breakout', 'Mean Reversion', 'Scalp', 'Swing', 'Range Fade'],
};

function strategiesKey(pt: PositionType): string {
  return `wickcoach_custom_strategies_${pt.toLowerCase()}`;
}

/** Reads the persisted strategy list for a position type. Seeds the
 *  defaults on first access so the dropdown is never empty. */
export function readCustomStrategies(pt: PositionType): string[] {
  if (typeof window === 'undefined') return STRATEGY_DEFAULTS[pt];
  try {
    const raw = localStorage.getItem(strategiesKey(pt));
    if (raw === null) {
      const defaults = STRATEGY_DEFAULTS[pt];
      try { localStorage.setItem(strategiesKey(pt), JSON.stringify(defaults)); } catch { /* ignore */ }
      return defaults;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : STRATEGY_DEFAULTS[pt];
  } catch {
    return STRATEGY_DEFAULTS[pt];
  }
}

export function writeCustomStrategies(pt: PositionType, list: string[]): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(strategiesKey(pt), JSON.stringify(list)); } catch { /* ignore */ }
}

/** Append a strategy if it's not already in the list. Returns the
 *  resulting list so callers can refresh state without a re-read. */
export function addCustomStrategy(pt: PositionType, name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) return readCustomStrategies(pt);
  const current = readCustomStrategies(pt);
  if (current.includes(trimmed)) return current;
  const next = [...current, trimmed];
  writeCustomStrategies(pt, next);
  return next;
}

/** Remove a strategy from this position type's list. Existing trades
 *  that referenced the strategy are left alone — only the future
 *  selection list is affected. */
export function removeCustomStrategy(pt: PositionType, name: string): string[] {
  const current = readCustomStrategies(pt);
  const next = current.filter(s => s !== name);
  writeCustomStrategies(pt, next);
  return next;
}

/** Union of all three lists, deduped + sorted. Used by the NUMBER
 *  goal builder's "Strategy name" dropdown where the goal isn't
 *  scoped to a specific position type. */
export function readAllCustomStrategies(): string[] {
  const set = new Set<string>();
  for (const pt of ['SHARES', 'OPTIONS', 'FUTURES'] as PositionType[]) {
    for (const s of readCustomStrategies(pt)) set.add(s);
  }
  return Array.from(set).sort();
}

/** Delete a strategy name from every position-type list that contains
 *  it. Idempotent. Used by the goal builder's delete control where
 *  the name isn't scoped to one type. */
export function removeCustomStrategyEverywhere(name: string): void {
  for (const pt of ['SHARES', 'OPTIONS', 'FUTURES'] as PositionType[]) {
    removeCustomStrategy(pt, name);
  }
}

export interface Trade {
  id: string;
  ticker: string;
  companyName: string;
  /** Local calendar date of the trade in "YYYY-MM-DD" format.
   *  Always produced by toLocalYMD() and consumed by parseLocalDate().
   *  Never use `new Date(t.date)` or `new Date().toISOString()` on this field. */
  date: string;
  /** Trade entry time. Free-form display string, typically "H:MM AM/PM"
   *  or "HH:MM" 24-hour. parseHourNumber() handles both formats. */
  time: string;
  /** Trade exit time, same format as `time`. Optional for backward
   *  compatibility with trades logged before the field existed and
   *  with imported records (Trading Tracker doesn't capture it). */
  exitTime?: string;
  strategy: string;
  /** Position type of the trade. Optional for backward compat —
   *  legacy trades without this field are inferred as SHARES when
   *  strategy === 'Shares', otherwise OPTIONS (matches the historical
   *  SHARES / DERIVATIVES split). */
  positionType?: PositionType;
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
    // Strip "2.00" → "2" but preserve "2.50" as-is. The leading dot is
    // MANDATORY in the pattern — without it the regex chews trailing
    // zeros off integers too ("350" → "35", "13735" → "1373"), which
    // was the long-standing META display bug ($350 rendering as $35).
    // We also intentionally do NOT strip partial-zero tails like
    // ".50" → ".5"; currency values keep their second decimal so
    // "$1,200.50" never becomes "$1,200.5".
    str = str.replace(/\.0+$/, '');
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

// Per-pattern keyword sets. These power both the in-Analysis
// Strengths / Areas-to-improve lists and the behavioral-radar
// Patience axis.
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

// ─── Deterministic KPI metrics ────────────────────────────────────
// Pure JS, same architecture as scoreNumberGoal. Same trade set in →
// same numbers out, always. No Haiku, no caching, no surprises. Used
// by the Analysis tab's KPI header row and verified by the test
// harness at scripts/test-kpi-metrics.mjs.

export interface ExpectancySnapshot {
  /** wins.length */
  wins: number;
  /** losses.length */
  losses: number;
  /** breakeven.length — excluded from all the math below */
  breakeven: number;
  /** wins + losses (denominator for winRate / lossRate) */
  decisive: number;
  /** Mean dollar P/L of winning trades. 0 when wins.length === 0. */
  avgWin: number;
  /** Mean absolute dollar P/L of losing trades. Positive number.
   *  0 when losses.length === 0. */
  avgLoss: number;
  /** wins / decisive (0..1). 0 when decisive === 0. */
  winRate: number;
  /** losses / decisive (0..1). 0 when decisive === 0. */
  lossRate: number;
  /** (winRate × avgWin) − (lossRate × avgLoss). 0 when no decisive
   *  trades, by construction. */
  expectancy: number;
}

export function computeExpectancy(trades: Trade[]): ExpectancySnapshot {
  const wins   = trades.filter(t => t.result === 'WIN');
  const losses = trades.filter(t => t.result === 'LOSS');
  const breakeven = trades.filter(t => t.result === 'BREAKEVEN');
  const decisive = wins.length + losses.length;
  const avgWin  = wins.length   > 0 ? wins.reduce((s, t)   => s + t.pl, 0) / wins.length   : 0;
  // Losing trades have negative pl; we want the average MAGNITUDE.
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pl, 0) / losses.length) : 0;
  const winRate  = decisive > 0 ? wins.length   / decisive : 0;
  const lossRate = decisive > 0 ? losses.length / decisive : 0;
  const expectancy = (winRate * avgWin) - (lossRate * avgLoss);
  return {
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    decisive,
    avgWin,
    avgLoss,
    winRate,
    lossRate,
    expectancy,
  };
}

export interface ProfitFactorSnapshot {
  /** Sum of pl across all winning trades. >= 0. */
  grossProfit: number;
  /** Absolute sum of pl across all losing trades. >= 0. */
  grossLoss: number;
  /** grossProfit / grossLoss. Number.POSITIVE_INFINITY when grossLoss
   *  is 0 (and grossProfit > 0); 0 when both are 0. The display layer
   *  formats infinity as the ∞ glyph. */
  ratio: number;
}

export function computeProfitFactor(trades: Trade[]): ProfitFactorSnapshot {
  const wins   = trades.filter(t => t.result === 'WIN');
  const losses = trades.filter(t => t.result === 'LOSS');
  const grossProfit = wins.reduce((s, t) => s + t.pl, 0);
  // Use Math.abs because losing trades carry negative pl.
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + t.pl, 0));
  let ratio: number;
  if (grossLoss === 0) {
    ratio = grossProfit > 0 ? Number.POSITIVE_INFINITY : 0;
  } else {
    ratio = grossProfit / grossLoss;
  }
  return { grossProfit, grossLoss, ratio };
}

export interface AvgRSnapshot {
  /** Average R-multiple of winning trades with an R:R logged. 0 when
   *  no qualifying winners. */
  avgWinR: number;
  /** Average R-multiple of losing trades with an R:R logged (returned
   *  as a NEGATIVE number — the convention is "−1.0R" for a one-R
   *  loss). 0 when no qualifying losers. */
  avgLossR: number;
  /** Count of winners that contributed to avgWinR. */
  winRCount: number;
  /** Count of losers that contributed to avgLossR. */
  lossRCount: number;
}

export function computeAvgR(trades: Trade[]): AvgRSnapshot {
  const winsWithR = trades
    .filter(t => t.result === 'WIN')
    .map(t => parseRr(t.riskReward))
    .filter(r => Number.isFinite(r) && r !== 0);
  const lossesWithR = trades
    .filter(t => t.result === 'LOSS')
    .map(t => parseRr(t.riskReward))
    .filter(r => Number.isFinite(r) && r !== 0);
  const avgWinR  = winsWithR.length   > 0 ? winsWithR.reduce((s, r) => s + r, 0) / winsWithR.length   : 0;
  // Losing trades' R values can be stored either as positive (just the
  // magnitude) or negative depending on the trader's logging habit.
  // We force the displayed value to NEGATIVE so the card always reads
  // "+W.WR / −L.LR" without callers having to remember the convention.
  const avgLossRRaw = lossesWithR.length > 0 ? lossesWithR.reduce((s, r) => s + r, 0) / lossesWithR.length : 0;
  const avgLossR = avgLossRRaw === 0 ? 0 : -Math.abs(avgLossRRaw);
  return {
    avgWinR,
    avgLossR,
    winRCount:  winsWithR.length,
    lossRCount: lossesWithR.length,
  };
}

// ─── Behavioral Radar (5 axes, deterministic) ────────────────────
// Same engine philosophy as scoreNumberGoal. Each axis returns 0-100
// from a pure function; computeBehavioralRadar bundles all 5. 0 means
// "no signal here" (empty input or no data). Higher = better. Used by
// the Analysis tab's pentagon chart. Test harness:
// scripts/test-behavioral-radar.mjs.

export interface BehavioralRadarSnapshot {
  /** 0-100. riskControl can be null when no risk rule is set, account
   *  size needed but missing, or no trades have a logged riskAmount. */
  discipline: number;
  patience: number;
  riskControl: number | null;
  edge: number;
  exitDiscipline: number;
  /** Per-axis array for the renderer. score === null indicates a
   *  no-signal axis; hint carries the inline guidance to show on the
   *  spoke (e.g. "set a risk goal to score this"). */
  axes: {
    key: 'discipline' | 'patience' | 'riskControl' | 'edge' | 'exitDiscipline';
    label: string;
    score: number | null;
    hint?: string;
  }[];
  /** Full result detail for the Risk Control axis so the UI can show
   *  rule-specific tooltips ("within 87/123 trades of riskAmount ≤ 200"). */
  riskControlDetail: RiskControlResult;
}

const BAD_PATIENCE_KEYWORDS = [
  ...PATTERN_KEYWORDS.impulseEntries,
  ...PATTERN_KEYWORDS.fomoChasing,
  ...PATTERN_KEYWORDS.revengeTrading,
];

/** Discipline = process trades / (process + impulse) × 100. Neutral
 *  trades (no plan/no-impulse keywords) are excluded from both the
 *  numerator and the denominator. */
export function scoreDiscipline(trades: Trade[]): number {
  let process = 0;
  let impulse = 0;
  for (const t of trades) {
    const kind = classifyTrade(t);
    if (kind === 'process') process++;
    else if (kind === 'impulse') impulse++;
  }
  const denom = process + impulse;
  if (denom === 0) return 0;
  return (process / denom) * 100;
}

/** Patience = (1 − impatientShare) × 100. A trade is "impatient" when
 *  its journal contains any impulse-entry / FOMO / revenge keyword.
 *  Denominator = trades with any journal text (we can only judge
 *  patience from what the trader wrote). */
export function scorePatience(trades: Trade[]): number {
  let withJournal = 0;
  let impatient = 0;
  for (const t of trades) {
    const j = t.journal || '';
    if (j.trim().length === 0) continue;
    withJournal++;
    if (journalMatches(j, BAD_PATIENCE_KEYWORDS)) impatient++;
  }
  if (withJournal === 0) return 0;
  return ((withJournal - impatient) / withJournal) * 100;
}

/** Risk Control evaluation result. Holds the blended score plus a
 *  per-subscore breakdown so the UI can tooltip the exact mix. */
export type RiskControlReason = 'scored' | 'no_signal';
export interface RiskControlResult {
  score: number | null;
  reason: RiskControlReason;
  /** Goal adherence subscore: % of trades within the strictest matching
   *  risk rule. Null when no rule is set, the rule needs account size
   *  that isn't set, or no trades have riskAmount logged. */
  goalScore: number | null;
  /** Data sizing subscore: weighted blend of revenge-sizing, median-
   *  deviation, and account-oversize sub-signals. Null when no trades
   *  have riskAmount logged. */
  dataScore: number | null;
  /** Journal language subscore: positive / (positive + negative) × 100
   *  where verdicts come from Haiku's per-trade riskLanguage tag.
   *  Null when no trade was tagged positive or negative. */
  journalScore: number | null;
  /** Goal-side breakdown when goalScore was computed. */
  within?: number;
  applicable?: number;
  winningRule?: NumberGoalRule;
  /** Data-side breakdown when dataScore was computed. */
  revengeSubscore?: number | null;
  stabilitySubscore?: number | null;
  oversizeSubscore?: number | null;
}

// Renormalizing weighted mean — drops null components and rescales the
// remaining weights to sum to 1. Returns null when nothing scores.
function weightedMean(items: { score: number | null; weight: number }[]): number | null {
  const avail = items.filter((x): x is { score: number; weight: number } => x.score !== null);
  if (avail.length === 0) return null;
  const total = avail.reduce((s, x) => s + x.weight, 0);
  if (total === 0) return null;
  return avail.reduce((s, x) => s + x.score * x.weight / total, 0);
}

// ─── Subscore #1: Goal adherence (pure JS) ────────────────────────
interface GoalAdherenceResult {
  score: number | null;
  within?: number;
  applicable?: number;
  winningRule?: NumberGoalRule;
}
function computeGoalAdherence(
  trades: Trade[],
  goals: Goal[],
  accountSize: number | null | undefined,
): GoalAdherenceResult {
  const hasAccount = typeof accountSize === 'number' && accountSize > 0;
  const matchingRules: NumberGoalRule[] = [];
  for (const g of goals) {
    if (getEffectiveKind(g) !== 'number') continue;
    const r = g.numberRule;
    if (!r) continue;
    if (r.field !== 'riskAmount' && r.field !== 'riskPctOfAccount') continue;
    if (r.operator !== '<=' && r.operator !== '<') continue;
    matchingRules.push(r);
  }
  if (matchingRules.length === 0) return { score: null };

  const anyPctRule = matchingRules.some(r => r.field === 'riskPctOfAccount');
  if (anyPctRule && !hasAccount) return { score: null };

  let strictest: NumberGoalRule | null = null;
  let strictestKey = Infinity;
  for (const r of matchingRules) {
    const v = typeof r.value === 'number' ? r.value : parseFloat(String(r.value));
    if (!Number.isFinite(v)) continue;
    const key = r.field === 'riskPctOfAccount'
      ? v
      : (hasAccount ? (v / (accountSize as number)) * 100 : v);
    if (key < strictestKey) { strictestKey = key; strictest = r; }
  }
  if (!strictest) return { score: null };

  const tradesWithRisk = trades.filter(t => typeof t.riskAmount === 'number' && (t.riskAmount as number) > 0);
  if (tradesWithRisk.length === 0) return { score: null, winningRule: strictest };

  const ruleValue = typeof strictest.value === 'number' ? strictest.value : parseFloat(String(strictest.value));
  const op = strictest.operator;
  let within = 0;
  for (const t of tradesWithRisk) {
    const actual = strictest.field === 'riskPctOfAccount'
      ? ((t.riskAmount as number) / (accountSize as number)) * 100
      : (t.riskAmount as number);
    const ok = op === '<=' ? actual <= ruleValue : actual < ruleValue;
    if (ok) within++;
  }
  return {
    score: Math.max(0, Math.min(100, (within / tradesWithRisk.length) * 100)),
    within,
    applicable: tradesWithRisk.length,
    winningRule: strictest,
  };
}

// ─── Subscore #2: Data sizing (pure JS) ───────────────────────────
interface DataSizingResult {
  score: number | null;
  revenge: number | null;
  stability: number | null;
  oversize: number | null;
}
function computeDataSizing(
  trades: Trade[],
  accountSize: number | null | undefined,
): DataSizingResult {
  const withRisk = trades.filter(t => typeof t.riskAmount === 'number' && (t.riskAmount as number) > 0);
  if (withRisk.length === 0) {
    return { score: null, revenge: null, stability: null, oversize: null };
  }

  // A. Revenge-sizing. Chronological order matters — date then time.
  const sorted = [...withRisk].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.time || '').localeCompare(b.time || '');
  });
  let postLossCount = 0;
  let revengeCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1].result !== 'LOSS') continue;
    postLossCount++;
    if ((sorted[i].riskAmount as number) > (sorted[i - 1].riskAmount as number) * 1.20) revengeCount++;
  }
  const revenge: number | null = postLossCount > 0
    ? Math.max(0, Math.min(100, (1 - revengeCount / postLossCount) * 100))
    : null;

  // B. Median deviation. Trades > 2× median OR < 0.5× median count
  //    as "erratic". Single-trade edge case → no deviation possible.
  const amounts = [...withRisk.map(t => t.riskAmount as number)].sort((a, b) => a - b);
  const median = amounts.length % 2 === 1
    ? amounts[(amounts.length - 1) / 2]
    : (amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2;
  let deviated = 0;
  if (median > 0) {
    for (const r of amounts) {
      if (r > median * 2 || r < median * 0.5) deviated++;
    }
  }
  const stability: number | null = (1 - deviated / withRisk.length) * 100;

  // C. Account oversize. Only when account size is set.
  let oversize: number | null = null;
  if (typeof accountSize === 'number' && accountSize > 0) {
    const threshold = accountSize * 0.03;
    const over = withRisk.filter(t => (t.riskAmount as number) > threshold).length;
    oversize = Math.max(0, Math.min(100, (1 - over / withRisk.length) * 100));
  }

  const score = weightedMean([
    { score: revenge,   weight: 0.50 },
    { score: stability, weight: 0.30 },
    { score: oversize,  weight: 0.20 },
  ]);
  return { score, revenge, stability, oversize };
}

// ─── Subscore #3: Journal language (Haiku via classifications cache) ─
function computeJournalLanguage(
  trades: Trade[],
  classifications: Record<string, TradeClassification> | undefined,
): number | null {
  if (!classifications) return null;
  let pos = 0;
  let neg = 0;
  for (const t of trades) {
    const verdict = classifications[t.id]?.riskLanguage;
    if (verdict === 'positive') pos++;
    else if (verdict === 'negative') neg++;
  }
  const mentions = pos + neg;
  if (mentions === 0) return null;
  return (pos / mentions) * 100;
}

/** Risk Control = blended adherence + sizing-behavior + journal-language
 *  score. Each subscore is independently optional; available ones blend
 *  via renormalizing weights (goal 0.50, data 0.30, journal 0.20). The
 *  axis only goes silent when ALL three subscores are null — i.e., no
 *  goal, no riskAmount on any trade, and no Haiku verdict tagging any
 *  journal positive or negative on sizing. */
export function scoreRiskControl(
  trades: Trade[],
  opts: {
    goals?: Goal[];
    accountSize?: number | null;
    classifications?: Record<string, TradeClassification>;
  } = {}
): RiskControlResult {
  const goals = opts.goals || [];
  const accountSize = opts.accountSize;

  const goal    = computeGoalAdherence(trades, goals, accountSize);
  const data    = computeDataSizing(trades, accountSize);
  const journal = computeJournalLanguage(trades, opts.classifications);

  const blended = weightedMean([
    { score: goal.score,   weight: 0.50 },
    { score: data.score,   weight: 0.30 },
    { score: journal,      weight: 0.20 },
  ]);

  if (blended === null) {
    return {
      score: null,
      reason: 'no_signal',
      goalScore: null,
      dataScore: null,
      journalScore: null,
    };
  }

  return {
    score: Math.max(0, Math.min(100, blended)),
    reason: 'scored',
    goalScore:   goal.score,
    dataScore:   data.score,
    journalScore: journal,
    within:      goal.within,
    applicable:  goal.applicable,
    winningRule: goal.winningRule,
    revengeSubscore:   data.revenge,
    stabilitySubscore: data.stability,
    oversizeSubscore:  data.oversize,
  };
}

/** Edge = expectancy expressed as R-multiples, mapped to 0-100.
 *  rExpectancy = (winRate × avgWinR) + (lossRate × avgLossR) — note
 *  that avgLossR is already negative from computeAvgR, so adding it
 *  subtracts the loss side. 0R → 50, +1R → 100, −1R → 0, clamped. */
export function scoreEdge(trades: Trade[]): number {
  const exp = computeExpectancy(trades);
  if (exp.decisive === 0) return 0;
  const r = computeAvgR(trades);
  const rExp = exp.winRate * r.avgWinR + exp.lossRate * r.avgLossR;
  const score = 50 + rExp * 50;
  return Math.max(0, Math.min(100, score));
}

/** Exit Discipline = avgWinR / (avgWinR + |avgLossR|) × 100. A trader
 *  whose winners average 2R and losers average 1R scores ~67 (winners
 *  bigger than losers). 50 means symmetric. Below 50 means losers
 *  outsize winners. Trades without R:R logged are excluded. */
export function scoreExitDiscipline(trades: Trade[]): number {
  const r = computeAvgR(trades);
  const winR  = r.avgWinR;
  const lossR = Math.abs(r.avgLossR);
  const denom = winR + lossR;
  if (denom === 0) return 0;
  return (winR / denom) * 100;
}

export function computeBehavioralRadar(
  trades: Trade[],
  opts: {
    goals?: Goal[];
    accountSize?: number | null;
    classifications?: Record<string, TradeClassification>;
  } = {}
): BehavioralRadarSnapshot {
  const discipline     = scoreDiscipline(trades);
  const patience       = scorePatience(trades);
  const riskControlDetail = scoreRiskControl(trades, opts);
  const edge           = scoreEdge(trades);
  const exitDiscipline = scoreExitDiscipline(trades);
  // Risk Control only goes silent when goal + data + journal are ALL
  // null. Single hint covers that case — the trader needs at least
  // one signal: a rule, a logged riskAmount, or a journal that
  // mentions sizing.
  let riskHint: string | undefined;
  if (riskControlDetail.reason === 'no_signal') {
    riskHint = 'log riskAmount or write about your sizing to score this';
  }
  return {
    discipline, patience,
    riskControl: riskControlDetail.score,
    edge, exitDiscipline,
    axes: [
      { key: 'discipline',     label: 'Discipline',      score: discipline },
      { key: 'patience',       label: 'Patience',        score: patience },
      { key: 'riskControl',    label: 'Risk Control',    score: riskControlDetail.score, hint: riskHint },
      { key: 'edge',           label: 'Edge',            score: edge },
      { key: 'exitDiscipline', label: 'Exit Discipline', score: exitDiscipline },
    ],
    riskControlDetail,
  };
}

export function computeAnalytics(trades: Trade[]): TraderAnalytics {
  if (!trades || trades.length === 0) return EMPTY_ANALYTICS;

  const n = trades.length;
  // Win/loss/BE classification by t.result (not pl sign) so a BE-
  // intent trade with non-zero slippage is correctly excluded from
  // win-rate and from win/loss filters everywhere downstream.
  const wins = trades.filter(t => t.result === 'WIN');
  const losses = trades.filter(t => t.result === 'LOSS');
  const breakeven = trades.filter(t => t.result === 'BREAKEVEN');
  const totalPL = trades.reduce((s, t) => s + t.pl, 0);
  // Win rate excludes BE-intent trades from the denominator —
  // standard trading convention is wins / (wins + losses).
  const decisive = wins.length + losses.length;
  const winRate = decisive > 0 ? (wins.length / decisive) * 100 : 0;
  const avgR = trades.reduce((s, t) => s + parseRr(t.riskReward), 0) / n;

  // Strategy breakdown — sorted by total $ P/L descending
  const stratMap = new Map<string, { trades: number; wins: number; pl: number; rSum: number }>();
  trades.forEach(t => {
    const s = stratMap.get(t.strategy) || { trades: 0, wins: 0, pl: 0, rSum: 0 };
    s.trades++;
    if (t.result === 'WIN') s.wins++;
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
    if (t.result === 'WIN') s.wins++;
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
  // Process/impulse win-rate denominators exclude BE-intent trades
  // to match the headline winRate above.
  const decisiveProcess = processTrades.filter(t => t.result === 'WIN' || t.result === 'LOSS').length;
  const decisiveImpulse = impulseTrades.filter(t => t.result === 'WIN' || t.result === 'LOSS').length;
  const processSplit = {
    process: {
      n: processTrades.length,
      wr: decisiveProcess ? (processTrades.filter(t => t.result === 'WIN').length / decisiveProcess) * 100 : 0,
      rTotal: processTrades.reduce((s, t) => s + parseRr(t.riskReward), 0),
      plSum: processTrades.reduce((s, t) => s + t.pl, 0),
    },
    impulse: {
      n: impulseTrades.length,
      wr: decisiveImpulse ? (impulseTrades.filter(t => t.result === 'WIN').length / decisiveImpulse) * 100 : 0,
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
  // Classification by t.result, not pl sign — see computeAnalytics.
  const wins = trades.filter(t => t.result === 'WIN');
  const losses = trades.filter(t => t.result === 'LOSS');
  const be = trades.filter(t => t.result === 'BREAKEVEN');
  const totalPL = trades.reduce((s, t) => s + t.pl, 0);
  // Win rate excludes BE from the denominator — kept in sync with
  // computeAnalytics so the AI context and the UI agree.
  const decisive = wins.length + losses.length;
  const winRate = decisive > 0 ? (wins.length / decisive) * 100 : 0;
  const avgR = trades.reduce((s, t) => s + parseRr(t.riskReward), 0) / n;

  const longs = trades.filter(t => t.direction === 'LONG');
  const shorts = trades.filter(t => t.direction === 'SHORT');

  const group = <K extends string>(key: (t: Trade) => K) => {
    const m = new Map<K, { count: number; wins: number; pl: number; rSum: number }>();
    trades.forEach(t => {
      const k = key(t);
      const cur = m.get(k) || { count: 0, wins: 0, pl: 0, rSum: 0 };
      cur.count++;
      if (t.result === 'WIN') cur.wins++;
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
    `DIRECTION: ${longs.length} LONG (${longs.filter(t => t.result === 'WIN').length} wins, $${longs.reduce((s, t) => s + t.pl, 0).toFixed(0)}); ${shorts.length} SHORT (${shorts.filter(t => t.result === 'WIN').length} wins, $${shorts.reduce((s, t) => s + t.pl, 0).toFixed(0)}).`,
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
export const CLASSIFY_PROMPT_VERSION = 'v3.7-2026-06-risk-language-tag';

export interface TradeClassification {
  tradeId: string;
  /** Which prompt version produced this entry — see CLASSIFY_PROMPT_VERSION. */
  promptVersion: string;
  /**
   * Quantitative compliance — scored from the numeric trade record
   * only (entry/exit price, R:R, contracts, etc.). Populated only for
   * goals whose measurability is 'trade' or 'both'.
   *  - `1`    = trade data shows the rule was followed
   *  - `0`    = trade data shows the rule was violated
   *  - `null` = trade data doesn't address this rule's subject
   */
  tradeScores: Array<{ goalIndex: number; compliance: 0 | 1 | null; reason: string }>;
  /**
   * Qualitative compliance — scored from journal language only.
   * Populated for goals whose measurability is 'journal' or 'both'.
   * Values mean the same thing as tradeScores but reasoning cites
   * the journal text, not the numbers.
   */
  psychScores: Array<{ goalIndex: number; compliance: 0 | 1 | null; reason: string }>;
  psychScore: number;      // 0-100
  tradeType: 'process' | 'impulse' | 'neutral';
  psychReason: string;
  /** Per-trade verdict on the journal's stance toward the trader's
   *  sizing / risk decisions. Powers the Risk Control radar axis's
   *  journal subscore. Affirmative-evidence doctrine: neutral is the
   *  default; non-neutral requires explicit sizing language. Optional
   *  for backward compat with cache entries produced before v3.7. */
  riskLanguage?: 'positive' | 'negative' | 'neutral';
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

/**
 * Trade fields that a NUMBER goal can be scored against.
 * Per-trade fields:
 *   riskAmount   — dollars risked on the trade (Trade.riskAmount)
 *   riskReward   — achieved R:R ratio, parsed from Trade.riskReward
 *   time         — entry time as "HH:MM" 24h (Trade.time)
 *   direction    — 'LONG' | 'SHORT'
 *   contracts    — position size (units / contracts)
 *   strategy     — strategy label (Trade.strategy)
 *   result       — 'WIN' | 'LOSS' | 'BREAKEVEN'
 * Sequence / aggregate fields (need the day's trade set):
 *   tradesPerDay — count of trades sharing this trade's date
 *   dailyLoss    — sum of pl across trades sharing this trade's date
 */
export type GoalField =
  | 'riskAmount'
  | 'riskReward'
  | 'riskPctOfAccount'
  | 'time'
  | 'direction'
  | 'contracts'
  | 'strategy'
  | 'result'
  | 'tradesPerDay'
  | 'dailyLoss';

/** Account-size source for risk-%-of-account rules. Returns null when
 *  the Position Size Calculator hasn't been used yet, so the UI knows
 *  to disable any rule that depends on it. */
export const ACCOUNT_SIZE_STORE_KEY = 'wickcoach_position_size_account';
export function readAccountSize(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACCOUNT_SIZE_STORE_KEY);
    if (!raw) return null;
    const n = parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export type GoalOperator = '<=' | '>=' | '==' | '<' | '>' | '!=';

export interface NumberGoalRule {
  field: GoalField;
  operator: GoalOperator;
  /** numeric for amounts/counts, "HH:MM" for time, enum literal for direction/strategy/result */
  value: number | string;
}

export type GoalKind = 'psych' | 'number';

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
  /**
   * NEW model: kind discriminates how the goal is scored.
   *  - 'psych'  → free text, scored by Haiku via /api/coach classify mode.
   *  - 'number' → deterministic JS scoring via scoreNumberGoal(trade, numberRule).
   *
   * Legacy goals (pre-rebuild) have `kind` undefined; the load-time
   * migration maps them to 'psych' by default since the old default
   * measurability was 'journal'.
   */
  kind?: GoalKind;
  /** Required when kind === 'number'. Ignored otherwise. */
  numberRule?: NumberGoalRule;
  /**
   * Legacy field — retained for migration compat. Replaced by `kind`
   * in the new model. 'trade' / 'both' map to 'number'; 'journal' maps
   * to 'psych'. Read via getEffectiveKind() helper which prefers `kind`
   * when present.
   */
  measurability: 'trade' | 'journal' | 'both';
  /** Latest completeness score (0-100) emitted by the goal-clarification coach. */
  completeness?: number;
  /** Structured scoring criteria emitted by the coach once the goal is understood. */
  scoringCriteria?: GoalScoringCriteria;
}

/**
 * Resolve a goal's effective kind, preferring the new `kind` field and
 * falling back to the legacy `measurability` flag. Centralized so the
 * UI and scoring paths agree on which side a goal renders on without
 * each duplicating the mapping.
 */
export function getEffectiveKind(g: Goal): GoalKind {
  if (g.kind) return g.kind;
  if (g.measurability === 'trade') return 'number';
  // 'journal' and the retired 'both' both fall to psych.
  return 'psych';
}

// ─── Deterministic number-goal scoring ─────────────────────────────
// Pure JS. Same trade + same rule = same result, always. No model
// calls, no caching, no prompt versions. Returns one of three
// outcomes:
//   'pass' — trade satisfied the rule
//   'fail' — trade violated the rule (or missing required field on a
//            constraint goal)
//   'na'   — rule doesn't apply to this trade (e.g. R-target on a loss,
//            or sequence rule with no day context)

export type GoalScoreResult = 'pass' | 'fail' | 'na';

/** Context for sequence/aggregate fields. allTrades should be the full
 *  week (or full dataset) so dailyLoss / tradesPerDay can find peers. */
export interface ScoreNumberGoalContext {
  allTrades?: Trade[];
  /** Account size for risk-%-of-account style rules. Read from
   *  `wickcoach_position_size_account` upstream. */
  accountSize?: number;
}

function compareValues(a: number | string, op: GoalOperator, b: number | string): boolean {
  switch (op) {
    case '<=': return a <= b;
    case '>=': return a >= b;
    case '<':  return a < b;
    case '>':  return a > b;
    case '==': return a === b;
    case '!=': return a !== b;
  }
}

function getPerTradeFieldValue(t: Trade, field: GoalField): number | string | null {
  switch (field) {
    case 'riskAmount': return typeof t.riskAmount === 'number' ? t.riskAmount : null;
    case 'time':       return t.time && t.time.length > 0 ? t.time : null;
    case 'direction':  return t.direction;
    case 'contracts':  return typeof t.contracts === 'number' ? t.contracts : null;
    case 'strategy':   return t.strategy || null;
    case 'result':     return t.result;
    default:           return null;
  }
}

export function scoreNumberGoal(
  trade: Trade,
  rule: NumberGoalRule,
  ctx: ScoreNumberGoalContext = {}
): GoalScoreResult {
  const { field, operator, value } = rule;

  // ── Sequence / aggregate fields — need the day's trade set ──
  if (field === 'tradesPerDay' || field === 'dailyLoss') {
    if (!ctx.allTrades) return 'na';
    const sameDay = ctx.allTrades.filter(x => x.date === trade.date);
    if (field === 'tradesPerDay') {
      return compareValues(sameDay.length, operator, value) ? 'pass' : 'fail';
    }
    // dailyLoss — sum of pl across the day. Convention: pass when
    // dailyLoss is "better than" the rule's threshold.
    const dayPl = sameDay.reduce((s, x) => s + x.pl, 0);
    return compareValues(dayPl, operator, value) ? 'pass' : 'fail';
  }

  // ── R-target — only WIN trades with R:R logged can be evaluated.
  //    LOSS / BE / WIN-without-rr → na (not a violation).
  if (field === 'riskReward') {
    if (trade.result === 'LOSS' || trade.result === 'BREAKEVEN') return 'na';
    const rr = parseRr(trade.riskReward);
    if (!Number.isFinite(rr) || rr === 0) return 'na';
    return compareValues(rr, operator, value) ? 'pass' : 'fail';
  }

  // ── Risk-%-of-account — derived field, requires account size in
  //    ctx. Without account size, the rule can't be evaluated at all,
  //    so we return 'na' (and the UI disables the option upstream so
  //    a goal can't even be created in this state). If the trade has
  //    no riskAmount logged, treat as 'fail' (constraint rules expect
  //    the trader to log what they need).
  if (field === 'riskPctOfAccount') {
    if (typeof ctx.accountSize !== 'number' || ctx.accountSize <= 0) return 'na';
    if (typeof trade.riskAmount !== 'number') return 'fail';
    const pct = (trade.riskAmount / ctx.accountSize) * 100;
    return compareValues(pct, operator, value) ? 'pass' : 'fail';
  }

  // ── Per-trade constraint fields — missing value = 'fail' (the
  //    trader didn't log the data the rule needs).
  const tradeValue = getPerTradeFieldValue(trade, field);
  if (tradeValue === null) return 'fail';
  return compareValues(tradeValue, operator, value) ? 'pass' : 'fail';
}

export const GOAL_TYPES = ['Trade Management', 'Entry Criteria', 'Patience / Setup', 'Risk Management', 'Psychology', 'General'];

/**
 * Conservative type-based fallback when a goal's title is empty or the
 * heuristic classifier (see classifyGoalMeasurability) doesn't have
 * enough language to decide. Defaults all categories to 'journal' — the
 * structured trade record almost never contains the kind of evidence
 * needed to score psychology/setup-quality rules, so "when in doubt,
 * score from the journal" is the right bias. The trader can still flip
 * a goal to TRADE or BOTH on the goal card.
 */
export function defaultMeasurabilityForType(_goalType: string): 'trade' | 'journal' | 'both' {
  return 'journal';
}

/**
 * Decide a goal's measurability from its title plus its type. The title
 * is the primary signal — qualitative language ("5 event", "patience",
 * "discipline", "off phone", FOMO/revenge/chase/impulse, A+ setup,
 * conviction, mindset) forces 'journal' regardless of type because the
 * trade record alone can't verify any of those. Explicit numeric
 * criteria (R:R floors, max risk %, hold-time limits, position sizing,
 * stop-loss rules) promote to 'both' so the trader gets both a number
 * and a journal-language reading. If nothing matches, fall back to
 * defaultMeasurabilityForType.
 *
 * This is the single source of truth for goal measurability and is
 * called by the new-goal path and the one-time stored-goal migration.
 */
export function classifyGoalMeasurability(title: string, goalType: string): 'trade' | 'journal' | 'both' {
  const t = (title || '').toLowerCase();

  // Qualitative language — wins over numeric language if both appear.
  // "Nx event" is trading-psychology shorthand for setup grade
  // ("5 event" = top-quality setup), not a literal count. The bare
  // \bevents?\b catches phrasings without a leading digit ("only A+
  // events", "the event was clean") — event(s) isn't a trade-data
  // field, it's always setup-grade jargon in this domain.
  const qualitative = [
    /\b\d+\s*-?\s*events?\b/,
    /\bevents?\b/,
    /\ba\+?\s*set ?up/, /\bgrade\b/, /quality/,
    /patien(?:t|ce)/, /\bwait/, /\bpicky\b/, /\bpick\b/,
    /disciplin/, /\bfomo\b/, /revenge/,
    /impuls/, /chase/, /forc(?:e|ing|ed)/,
    /convict/, /hesitat/,
    /phone/, /emotion/, /\bcalm\b/, /\btilt\b/,
    /\bfeel/, /panic/, /\bmindset\b/, /focus/,
  ];
  if (qualitative.some(re => re.test(t))) return 'journal';

  // Numeric criteria the trade record alone can verify.
  const numeric = [
    /\d+\s*r\b/i,                  // "3R"
    /\d+\s*:\s*\d/,                // "3:1"
    /max(?:imum)?\s+risk/, /risk\s+max/, /risk\s+per/,
    /position\s+siz/, /siz.+position/,
    /hold(?:ing)?\s+time/, /max\s+hold/,
    /\bcontracts?\b/, /\bshares?\b/,
    /stop\s+loss/, /trail/,
  ];
  if (numeric.some(re => re.test(t))) return 'both';

  return defaultMeasurabilityForType(goalType);
}

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

// Stock-market-aware variant of "today" — returns today if today is
// Mon-Fri, otherwise the upcoming Monday. Used by surfaces where the
// trader is reasoning about the next trading session rather than the
// calendar week they're sitting in (journal, weekly-goal planning).
// Don't use this for analytics that look BACKWARD at trades — those
// should keep using the plain calendar-week helpers so a trade dated
// Friday still files under that Friday's week, not next Monday's.
export function nextTradingDay(d: Date): Date {
  const out = new Date(d);
  const day = out.getDay(); // 0=Sun, 6=Sat
  if (day === 6) out.setDate(out.getDate() + 2);     // Sat → Mon
  else if (day === 0) out.setDate(out.getDate() + 1); // Sun → Mon
  return out;
}

// Forward-looking "current trading week" — Monday of the trading week
// we're in or about to enter. On weekends, snaps to the upcoming
// Monday rather than the prior one. Use this in goal-setting flows
// where the trader is planning the next session.
export function getCurrentTradingWeekStart(): string {
  const target = nextTradingDay(new Date());
  // target is now guaranteed Mon-Fri. Snap back to Monday of its week.
  const day = target.getDay();
  const diff = 1 - day; // 1 for Sun was already handled; here day is 1-5
  const monday = new Date(target);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + diff);
  return toISODate(monday);
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

/**
 * One-time re-classification of stored goals against the current
 * title-aware classifier. Bumping GOAL_MEASURABILITY_MIGRATION_KEY
 * forces a re-run so qualitative goals like "Only take 5 events"
 * get demoted from trade/both to journal without requiring the user
 * to visit Weekly Goals first. Idempotent — safe to call from any
 * mount effect. Returns the (possibly updated) goal list.
 */
export const GOAL_MEASURABILITY_MIGRATION_KEY = 'wickcoach_goal_measurability_reclassified_v2';
export function migrateGoalMeasurabilityOnce(): Goal[] {
  const goals = readAllGoals();
  if (typeof window === 'undefined') return goals;
  try {
    if (localStorage.getItem(GOAL_MEASURABILITY_MIGRATION_KEY)) return goals;
  } catch { return goals; }

  let migrated = false;
  const next = goals.map(g => {
    const inferred = classifyGoalMeasurability(g.title || '', g.goalType || 'General');
    if (inferred !== g.measurability) {
      migrated = true;
      return { ...g, measurability: inferred };
    }
    return g;
  });
  if (migrated) writeAllGoals(next);
  try { localStorage.setItem(GOAL_MEASURABILITY_MIGRATION_KEY, '1'); } catch { /* ignore */ }
  return next;
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
    { id: 'g1', title: 'LET TRADES BREATHE 3+ WHEN AT BREAK-EVEN', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: new Date().toISOString(), goalType: 'Trade Management', weekStart: ws, measurability: defaultMeasurabilityForType('Trade Management') },
    { id: 'g2', title: '5M AND 13/15M CONFIRMATION BEHIND ALL TRADES', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: new Date().toISOString(), goalType: 'Entry Criteria', weekStart: ws, measurability: defaultMeasurabilityForType('Entry Criteria') },
    { id: 'g3', title: 'AT OR NEAR 20MA, WILL WAIT FOR PULLBACK IF FAR', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: new Date().toISOString(), goalType: 'Patience / Setup', weekStart: ws, measurability: defaultMeasurabilityForType('Patience / Setup') },
  ];
}

