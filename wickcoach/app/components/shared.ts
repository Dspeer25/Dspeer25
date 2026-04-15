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

