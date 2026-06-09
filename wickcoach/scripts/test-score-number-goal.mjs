// Standalone test harness for scoreNumberGoal. Mirrors the
// implementation in app/components/shared.ts so we can verify the
// scoring table without spinning up a TS runner.
// Run with: node scripts/test-score-number-goal.mjs

// ── Helpers (mirror parseRr from shared.ts) ──
function parseRr(rr) {
  if (rr === null || rr === undefined) return 0;
  if (typeof rr === 'number') return rr;
  const s = String(rr).trim();
  if (!s || s === '—') return 0;
  const m = s.match(/^([+-]?\d*\.?\d+)/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : 0;
}

// ── Mirror of scoreNumberGoal ──
function compareValues(a, op, b) {
  switch (op) {
    case '<=': return a <= b;
    case '>=': return a >= b;
    case '<':  return a < b;
    case '>':  return a > b;
    case '==': return a === b;
    case '!=': return a !== b;
  }
}

function getPerTradeFieldValue(t, field) {
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

function scoreNumberGoal(trade, rule, ctx = {}) {
  const { field, operator, value } = rule;
  if (field === 'tradesPerDay' || field === 'dailyLoss') {
    if (!ctx.allTrades) return 'na';
    const sameDay = ctx.allTrades.filter(x => x.date === trade.date);
    if (field === 'tradesPerDay') {
      return compareValues(sameDay.length, operator, value) ? 'pass' : 'fail';
    }
    const dayPl = sameDay.reduce((s, x) => s + x.pl, 0);
    return compareValues(dayPl, operator, value) ? 'pass' : 'fail';
  }
  if (field === 'riskReward') {
    if (trade.result === 'LOSS' || trade.result === 'BREAKEVEN') return 'na';
    const rr = parseRr(trade.riskReward);
    if (!Number.isFinite(rr) || rr === 0) return 'na';
    return compareValues(rr, operator, value) ? 'pass' : 'fail';
  }
  const tradeValue = getPerTradeFieldValue(trade, field);
  if (tradeValue === null) return 'fail';
  return compareValues(tradeValue, operator, value) ? 'pass' : 'fail';
}

// ── Test data ──
const baseTrade = {
  id: 't1', date: '2026-06-08', time: '09:35',
  ticker: 'AMD', strategy: '0DTE Call', direction: 'LONG',
  contracts: 1, entryPrice: 1.0, exitPrice: 3.0,
  pl: 200, plPercent: 100, result: 'WIN',
  riskAmount: 100, riskReward: '2.5', journal: ''
};

const t_win_2_5r        = baseTrade;
const t_win_1r          = { ...baseTrade, id: 't2', riskReward: '1.0', exitPrice: 2.0, pl: 100 };
const t_win_no_rr       = { ...baseTrade, id: 't3', riskReward: '' };
const t_loss            = { ...baseTrade, id: 't4', result: 'LOSS', pl: -100, exitPrice: 0.0, riskReward: '' };
const t_be              = { ...baseTrade, id: 't5', result: 'BREAKEVEN', pl: 0, exitPrice: 1.0, riskReward: '' };
const t_no_risk_amt     = { ...baseTrade, id: 't6', riskAmount: undefined };
const t_late_entry      = { ...baseTrade, id: 't7', time: '14:30' };
const t_no_time         = { ...baseTrade, id: 't8', time: '' };
const t_short           = { ...baseTrade, id: 't9', direction: 'SHORT' };
const t_big_size        = { ...baseTrade, id: 't10', contracts: 20 };
const t_other_strategy  = { ...baseTrade, id: 't11', strategy: 'Scalp' };

// ── Day context for sequence-rule tests ──
const day3Trades = [t_win_2_5r, t_win_1r, t_be]; // 3 trades on 2026-06-08, day pl = 300
const day5Trades = [
  t_win_2_5r, t_win_1r, t_be,
  { ...baseTrade, id: 'd4', pl: 50 },
  { ...baseTrade, id: 'd5', pl: 75 }
]; // 5 trades, day pl = 425
const dayBigLoss = [
  { ...baseTrade, id: 'l1', result: 'LOSS', pl: -200 },
  { ...baseTrade, id: 'l2', result: 'LOSS', pl: -150 }
]; // day pl = -350

// ── Test cases ──
const cases = [
  // R-target goals
  ['win 2.5R vs riskReward>=2',     t_win_2_5r,  { field:'riskReward', operator:'>=', value:2 }, {}, 'pass'],
  ['win 1R vs riskReward>=2',       t_win_1r,    { field:'riskReward', operator:'>=', value:2 }, {}, 'fail'],
  ['win no rr vs riskReward>=2',    t_win_no_rr, { field:'riskReward', operator:'>=', value:2 }, {}, 'na'],
  ['loss vs riskReward>=2',         t_loss,      { field:'riskReward', operator:'>=', value:2 }, {}, 'na'],
  ['BE vs riskReward>=2',           t_be,        { field:'riskReward', operator:'>=', value:2 }, {}, 'na'],
  ['win 2.5R vs riskReward<=3',     t_win_2_5r,  { field:'riskReward', operator:'<=', value:3 }, {}, 'pass'],
  ['win 2.5R vs riskReward>3',      t_win_2_5r,  { field:'riskReward', operator:'>',  value:3 }, {}, 'fail'],

  // Risk amount (constraint)
  ['$100 risk vs riskAmount<=150',  t_win_2_5r,    { field:'riskAmount', operator:'<=', value:150 }, {}, 'pass'],
  ['$100 risk vs riskAmount<=50',   t_win_2_5r,    { field:'riskAmount', operator:'<=', value:50 },  {}, 'fail'],
  ['no risk amt logged',            t_no_risk_amt, { field:'riskAmount', operator:'<=', value:150 }, {}, 'fail'],

  // Time (constraint)
  ['09:35 vs time<=11:00',          t_win_2_5r,  { field:'time', operator:'<=', value:'11:00' }, {}, 'pass'],
  ['14:30 vs time<=11:00',          t_late_entry,{ field:'time', operator:'<=', value:'11:00' }, {}, 'fail'],
  ['no time logged',                t_no_time,   { field:'time', operator:'<=', value:'11:00' }, {}, 'fail'],
  ['09:35 vs time>=09:30',          t_win_2_5r,  { field:'time', operator:'>=', value:'09:30' }, {}, 'pass'],

  // Direction
  ['LONG vs direction==LONG',       t_win_2_5r,  { field:'direction', operator:'==', value:'LONG' },  {}, 'pass'],
  ['SHORT vs direction==LONG',      t_short,     { field:'direction', operator:'==', value:'LONG' },  {}, 'fail'],
  ['SHORT vs direction!=LONG',      t_short,     { field:'direction', operator:'!=', value:'LONG' },  {}, 'pass'],

  // Contracts
  ['1 contract vs contracts<=10',   t_win_2_5r,  { field:'contracts', operator:'<=', value:10 }, {}, 'pass'],
  ['20 contracts vs contracts<=10', t_big_size,  { field:'contracts', operator:'<=', value:10 }, {}, 'fail'],

  // Strategy
  ['0DTE Call vs strategy==0DTE Call',  t_win_2_5r,     { field:'strategy', operator:'==', value:'0DTE Call' }, {}, 'pass'],
  ['Scalp vs strategy==0DTE Call',      t_other_strategy,{ field:'strategy', operator:'==', value:'0DTE Call' }, {}, 'fail'],

  // Result
  ['WIN vs result!=LOSS',           t_win_2_5r,  { field:'result', operator:'!=', value:'LOSS' }, {}, 'pass'],
  ['LOSS vs result!=LOSS',          t_loss,      { field:'result', operator:'!=', value:'LOSS' }, {}, 'fail'],

  // Sequence — tradesPerDay
  ['3 trades on day vs tradesPerDay<=3', t_win_2_5r, { field:'tradesPerDay', operator:'<=', value:3 }, { allTrades: day3Trades }, 'pass'],
  ['5 trades on day vs tradesPerDay<=3', t_win_2_5r, { field:'tradesPerDay', operator:'<=', value:3 }, { allTrades: day5Trades }, 'fail'],
  ['no allTrades context',               t_win_2_5r, { field:'tradesPerDay', operator:'<=', value:3 }, {}, 'na'],

  // Sequence — dailyLoss
  ['day +$300 vs dailyLoss>=-200',  t_win_2_5r,           { field:'dailyLoss', operator:'>=', value:-200 }, { allTrades: day3Trades }, 'pass'],
  ['day -$350 vs dailyLoss>=-200',  { ...baseTrade, id:'l1', result:'LOSS', pl:-200 }, { field:'dailyLoss', operator:'>=', value:-200 }, { allTrades: dayBigLoss }, 'fail'],
];

let pass = 0, fail = 0;
for (const [name, trade, rule, ctx, expected] of cases) {
  const got = scoreNumberGoal(trade, rule, ctx);
  const ok = got === expected;
  console.log((ok ? 'PASS' : 'FAIL').padEnd(5), name.padEnd(46), '→', got, ok ? '' : `(expected ${expected})`);
  ok ? pass++ : fail++;
}
console.log('─'.repeat(70));
console.log(`${pass} pass, ${fail} fail (${cases.length} total)`);
process.exit(fail > 0 ? 1 : 0);
