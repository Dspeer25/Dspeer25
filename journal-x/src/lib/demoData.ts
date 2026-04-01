import { Trade } from './types';

/* ── Demo Trades ── */
const tickerList = ['AAPL', 'TSLA', 'NVDA', 'SPY', 'AMZN', 'META', 'MSFT', 'QQQ', 'AMD', 'GOOGL'];
const instruments = ['0DTE Call', '0DTE Put', 'Stock Long', 'Call Spread', 'Scalp', 'Swing Call', 'Put Spread', 'Stock Short'];
const strategies = [
  'VWAP reclaim', 'Breakout', 'Opening range', 'Mean reversion', 'Gap fill',
  'Trend continuation', 'Reversal', 'Momentum scalp', 'Support bounce', 'Breakdown fade',
  'Pullback', 'Impulse', 'FOMO chase', 'Revenge trade', 'A+ setup',
  'Range breakout', 'Earnings play', 'Dip buy',
];
const results: ('W' | 'L' | 'BE')[] = ['W', 'W', 'W', 'L', 'L', 'W', 'BE', 'W', 'L', 'W', 'W', 'L', 'W', 'L', 'W', 'W', 'W', 'BE'];

function buildDemoTrades(): Trade[] {
  const trades: Trade[] = [];
  for (let i = 0; i < 18; i++) {
    const ticker = tickerList[i % tickerList.length];
    const r = results[i % results.length];
    const risk = Math.round((50 + ((i * 37) % 200)) * 100) / 100;
    const adjRisk = Math.round((risk + ((i * 13) % 40) - 20) * 100) / 100;
    const pnl = r === 'W' ? Math.round((risk * (1 + ((i * 23) % 300) / 100)) * 100) / 100
      : r === 'L' ? -Math.round((risk * (0.5 + ((i * 17) % 80) / 100)) * 100) / 100 : 0;
    const rr = r === 'W' && risk > 0 ? Math.round((pnl / risk) * 100) / 100 : 0;

    const d = new Date();
    d.setDate(d.getDate() - i * 2);

    trades.push({
      id: `demo-${i}`,
      date: d.toISOString().split('T')[0],
      ticker,
      tickerLogo: undefined,
      time: `${9 + (i % 6)}:${String((i * 7) % 60).padStart(2, '0')}`,
      tradeType: i % 4 === 0 ? 'Swing' : 'Day',
      direction: i % 5 === 0 ? 'Short' : 'Long',
      instrument: instruments[i % instruments.length],
      strategy: strategies[i % strategies.length],
      entryPrice: 100 + ((i * 41) % 300),
      exitPrice: 100 + ((i * 41) % 300) + (r === 'W' ? 5 : r === 'L' ? -3 : 0),
      positionSize: Math.floor(10 + ((i * 19) % 190)),
      initialRisk: risk,
      adjustedRisk: adjRisk,
      result: r,
      dollarPnl: pnl,
      rr,
      notes: '',
      starred: false,
      grade: '',
      customFields: {},
    });
  }
  return trades;
}

export const demoTrades: Trade[] = buildDemoTrades();

/* ── Compute attribute scores from trades (20 attributes) ── */
export interface AttributeScore {
  name: string;
  value: number;
  color: string;
}

export function computeAttributes(trades: Trade[]): AttributeScore[] {
  const totalTrades = trades.length;
  if (totalTrades === 0) return defaultAttributes;

  const wins = trades.filter(t => t.result === 'W');
  const losses = trades.filter(t => t.result === 'L');
  const winRate = wins.length / totalTrades;
  const avgWinRR = wins.length > 0 ? wins.reduce((s, t) => s + t.rr, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + Math.abs(t.dollarPnl), 0) / losses.length : 0;

  const revengeCount = trades.filter(t => t.strategy.toLowerCase().includes('revenge')).length;
  const fomoCount = trades.filter(t => t.strategy.toLowerCase().includes('fomo') || t.strategy.toLowerCase().includes('impulse') || t.strategy.toLowerCase().includes('chase')).length;
  const plannedCount = trades.filter(t =>
    t.strategy.toLowerCase().includes('breakout') ||
    t.strategy.toLowerCase().includes('pullback') ||
    t.strategy.toLowerCase().includes('a+ setup') ||
    t.strategy.toLowerCase().includes('vwap') ||
    t.strategy.toLowerCase().includes('range breakout')
  ).length;
  const plannedRate = totalTrades > 0 ? plannedCount / totalTrades : 0;

  // Win rate on planned strategies specifically
  const plannedTrades = trades.filter(t =>
    t.strategy.toLowerCase().includes('breakout') ||
    t.strategy.toLowerCase().includes('pullback') ||
    t.strategy.toLowerCase().includes('a+ setup') ||
    t.strategy.toLowerCase().includes('vwap')
  );
  const plannedWinRate = plannedTrades.length > 0
    ? plannedTrades.filter(t => t.result === 'W').length / plannedTrades.length
    : 0.5;

  // Avg R on wins
  const avgROnWins = wins.length > 0 ? wins.reduce((s, t) => s + t.rr, 0) / wins.length : 1;

  // Losses exceeding initial risk
  const overRiskLosses = losses.filter(t => Math.abs(t.dollarPnl) > t.initialRisk * 1.5).length;

  const clamp = (v: number) => Math.max(10, Math.min(99, Math.round(v)));

  return [
    // Mapped from win rate on planned strategies
    { name: 'Consistency', value: clamp(plannedWinRate * 100 + 5), color: '#30C48B' },
    { name: 'Plan Following', value: clamp(plannedRate * 130 - fomoCount * 8), color: '#30C48B' },
    // Mapped from avg R on wins
    { name: 'R:R Quality', value: clamp(avgROnWins * 30 + 20), color: '#4A9EFF' },
    { name: 'Exit Timing', value: clamp(avgROnWins * 25 + winRate * 30 + 10), color: '#4A9EFF' },
    // Mapped from impulse/revenge count (inverse)
    { name: 'FOMO Resistance', value: clamp(90 - fomoCount * 18), color: '#f59e0b' },
    { name: 'Revenge Control', value: clamp(90 - revengeCount * 22), color: '#f59e0b' },
    // Core attributes
    { name: 'Discipline', value: clamp(plannedRate * 120 - revengeCount * 15 + 30), color: '#30C48B' },
    { name: 'Risk Mgmt', value: clamp(75 - overRiskLosses * 12), color: '#30C48B' },
    { name: 'Patience', value: clamp(60 - fomoCount * 12 + plannedRate * 30), color: '#4A9EFF' },
    { name: 'Entry Timing', value: clamp(winRate * 90 + 10), color: '#4A9EFF' },
    { name: 'Psychology', value: clamp(60 - revengeCount * 18 - fomoCount * 8), color: '#f59e0b' },
    { name: 'Loss Handling', value: clamp(50 - revengeCount * 20 + (losses.length > 0 ? 20 : 0)), color: '#f59e0b' },
    { name: 'Execution', value: clamp(avgWinRR * 25 + winRate * 40 + 10), color: '#4A9EFF' },
    { name: 'Position Sizing', value: clamp(70 - overRiskLosses * 8 + plannedRate * 20), color: '#30C48B' },
    { name: 'Market Reading', value: clamp(winRate * 80 + avgWinRR * 10), color: '#4A9EFF' },
    { name: 'Adaptability', value: clamp(55 + plannedRate * 30 - fomoCount * 5), color: '#30C48B' },
    { name: 'Trade Selection', value: clamp(plannedRate * 100 + winRate * 20), color: '#4A9EFF' },
    { name: 'Emotional Control', value: clamp(70 - revengeCount * 15 - fomoCount * 10), color: '#f59e0b' },
    { name: 'Pattern Recognition', value: clamp(winRate * 70 + plannedRate * 30), color: '#4A9EFF' },
    { name: 'Session Mgmt', value: clamp(60 + plannedRate * 25 - (avgLoss > 150 ? 15 : 0)), color: '#30C48B' },
  ];
}

const defaultAttributes: AttributeScore[] = [
  { name: 'Consistency', value: 67, color: '#30C48B' },
  { name: 'Plan Following', value: 72, color: '#30C48B' },
  { name: 'R:R Quality', value: 58, color: '#4A9EFF' },
  { name: 'Exit Timing', value: 62, color: '#4A9EFF' },
  { name: 'FOMO Resistance', value: 54, color: '#f59e0b' },
  { name: 'Revenge Control', value: 46, color: '#f59e0b' },
  { name: 'Discipline', value: 72, color: '#30C48B' },
  { name: 'Risk Mgmt', value: 75, color: '#30C48B' },
  { name: 'Patience', value: 58, color: '#4A9EFF' },
  { name: 'Entry Timing', value: 71, color: '#4A9EFF' },
  { name: 'Psychology', value: 48, color: '#f59e0b' },
  { name: 'Loss Handling', value: 38, color: '#f59e0b' },
  { name: 'Execution', value: 70, color: '#4A9EFF' },
  { name: 'Position Sizing', value: 65, color: '#30C48B' },
  { name: 'Market Reading', value: 60, color: '#4A9EFF' },
  { name: 'Adaptability', value: 55, color: '#30C48B' },
  { name: 'Trade Selection', value: 63, color: '#4A9EFF' },
  { name: 'Emotional Control', value: 42, color: '#f59e0b' },
  { name: 'Pattern Recognition', value: 68, color: '#4A9EFF' },
  { name: 'Session Mgmt', value: 57, color: '#30C48B' },
];

/* ── Coach observations derived from trade data ── */
export function getCoachObservations(trades: Trade[]): string[] {
  const obs: string[] = [];
  const wins = trades.filter(t => t.result === 'W');
  const losses = trades.filter(t => t.result === 'L');
  const winRate = trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : 0;
  const revengeCount = trades.filter(t => t.strategy.toLowerCase().includes('revenge')).length;
  const fomoCount = trades.filter(t => t.strategy.toLowerCase().includes('fomo') || t.strategy.toLowerCase().includes('chase') || t.strategy.toLowerCase().includes('impulse')).length;

  if (revengeCount > 0) obs.push(`You revenge-traded ${revengeCount} time${revengeCount > 1 ? 's' : ''} this period. Each one resulted in a loss. The data is clear \u2014 step away after a losing trade.`);
  if (fomoCount > 0) obs.push(`${fomoCount} FOMO/impulse trade${fomoCount > 1 ? 's' : ''} detected. These have a significantly lower win rate than your planned setups.`);
  if (winRate > 60) obs.push(`Win rate at ${winRate}% \u2014 above your baseline. Your planned setups are working. Stay disciplined.`);
  if (losses.length > 0) {
    const avgLoss = Math.round(losses.reduce((s, t) => s + Math.abs(t.dollarPnl), 0) / losses.length);
    obs.push(`Average loss is $${avgLoss}. ${avgLoss > 150 ? 'Consider tightening your stops.' : 'Risk management looks solid.'}`);
  }
  return obs.length > 0 ? obs : ['No significant patterns detected yet. Keep logging trades consistently.'];
}

/* ── Weekly Goals (demo) — variety: swing, risk, psychology, consistency ── */
export const demoWeeklyGoals = [
  { goal: 'Only take A+ pullback setups off narrow MAs', status: 'on-track' as const, progress: 80 },
  { goal: 'Max 3 trades per day \u2014 no overtrading', status: 'on-track' as const, progress: 100 },
  { goal: 'No revenge trades after a loss', status: 'at-risk' as const, progress: 60 },
  { goal: 'Hold swing trades for minimum 2 days', status: 'behind' as const, progress: 35 },
  { goal: 'Review pre-market levels before first trade', status: 'on-track' as const, progress: 90 },
  { goal: 'Keep max daily drawdown under $300', status: 'on-track' as const, progress: 85 },
  { goal: 'Journal emotional state before each session', status: 'at-risk' as const, progress: 55 },
];
