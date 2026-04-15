export const fm = "'DM Mono', monospace";
export const fd = "'Chakra Petch', sans-serif";
export const teal = "#00d4a0";

export interface Trade {
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

export function formatDollar(n: number): string {
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  if (abs % 1 === 0) return sign + '$' + abs.toLocaleString();
  return sign + '$' + abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

function parseRr(rr: string): number {
  const parts = (rr || '').split(':');
  return parseFloat(parts[1]) || 0;
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
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] as string;
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

// ─── AI trade classification (Haiku-powered) ─────────────────
// Cached result per-trade, keyed by trade.id in localStorage under
// `wickcoach_trade_classifications`.
export interface TradeClassification {
  tradeId: string;
  goalScores: Array<{ goalIndex: number; compliance: 0 | 1; reason: string }>;
  psychScore: number;      // 0-100
  tradeType: 'process' | 'impulse' | 'neutral';
  psychReason: string;
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
  /** Latest completeness score (0-100) emitted by the goal-clarification coach. */
  completeness?: number;
  /** Structured scoring criteria emitted by the coach once the goal is understood. */
  scoringCriteria?: GoalScoringCriteria;
}

export const GOAL_TYPES = ['Trade Management', 'Entry Criteria', 'Patience / Setup', 'Risk Management', 'Psychology', 'General'];

export const DEFAULT_GOALS: Goal[] = [
  { id: 'g1', title: 'LET TRADES BREATHE 3+ WHEN AT BREAK-EVEN', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: new Date().toISOString(), goalType: 'Trade Management' },
  { id: 'g2', title: '5M AND 13/15M CONFIRMATION BEHIND ALL TRADES', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: new Date().toISOString(), goalType: 'Entry Criteria' },
  { id: 'g3', title: 'AT OR NEAR 20MA, WILL WAIT FOR PULLBACK IF FAR', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: new Date().toISOString(), goalType: 'Patience / Setup' },
];

