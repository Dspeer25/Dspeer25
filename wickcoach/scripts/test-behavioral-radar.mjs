// Standalone test harness for the 5 behavioral-radar axes in
// shared.ts. Mirrors the scoreNumberGoal + KPI test patterns:
// re-implements the scoring inline so we can verify without a
// TS runner.
// Run: node scripts/test-behavioral-radar.mjs

// ── Mirror of parseRr ──
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

// ── Keyword sets — exact copy from shared.ts ──
const IMPULSE_KEYWORDS = [
  'fomo', 'chase', 'chasing', 'chased', 'impulse', 'impulsive',
  'revenge', 'angry', 'frustrated', 'tilted', 'tilt', 'yolo',
  'forced', 'emotional', 'broke rules', 'ignored rules', "shouldn't have",
  'missed', 'jumped in', "didn't wait", 'rushed',
];
const PROCESS_KEYWORDS = [
  'patient', 'waited', 'patience', 'setup', 'clean', 'textbook',
  'plan', 'planned', 'rules', 'discipline', 'disciplined',
  'confirmed', 'confirmation', 'process', 'trusted', 'trusting',
  'stuck to', 'honored', 'stopped out', 'on plan',
];
const PATTERN_KEYWORDS = {
  ignoringRules:    ['broke rules', 'ignored rules', 'against my rules', "shouldn't have", 'broke my', 'violated'],
  impulseEntries:   ['impulse', 'impulsive', 'jumped in', "didn't wait", 'rushed', 'quick', 'no setup'],
  revengeTrading:   ['revenge', 'frustrated', 'angry', 'tilt', 'tilted', 'got back', 'pissed'],
  fomoChasing:      ['fomo', 'chase', 'chasing', 'chased', 'missed', 'scared to miss'],
  patience:         ['patient', 'patience', 'waited', "didn't chase", 'watched', 'waiting'],
  cleanExecution:   ['clean', 'textbook', 'as planned', 'on plan', 'executed'],
  stopDiscipline:   ['stopped out', 'honored stop', 'took stop', 'clean stop', 'cut'],
  trustingProcess:  ['trusted', 'stuck to', 'followed rules', 'disciplined', 'process worked'],
};
const BAD_PATIENCE_KEYWORDS = [
  ...PATTERN_KEYWORDS.impulseEntries,
  ...PATTERN_KEYWORDS.fomoChasing,
  ...PATTERN_KEYWORDS.revengeTrading,
];
function journalMatches(journal, keywords) {
  const t = (journal || '').toLowerCase();
  return keywords.some(k => t.includes(k));
}
function classifyTrade(t) {
  const j = t.journal || '';
  const isImpulse = journalMatches(j, IMPULSE_KEYWORDS);
  const isProcess = journalMatches(j, PROCESS_KEYWORDS);
  if (isImpulse && !isProcess) return 'impulse';
  if (isProcess && !isImpulse) return 'process';
  if (isImpulse && isProcess) return 'impulse';
  return 'neutral';
}

// ── Mirror of computeExpectancy + computeAvgR ──
function computeExpectancy(trades) {
  const wins   = trades.filter(t => t.result === 'WIN');
  const losses = trades.filter(t => t.result === 'LOSS');
  const decisive = wins.length + losses.length;
  const avgWin  = wins.length   > 0 ? wins.reduce((s, t) => s + t.pl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pl, 0) / losses.length) : 0;
  const winRate  = decisive > 0 ? wins.length   / decisive : 0;
  const lossRate = decisive > 0 ? losses.length / decisive : 0;
  return { wins: wins.length, losses: losses.length, decisive, avgWin, avgLoss, winRate, lossRate, expectancy: (winRate * avgWin) - (lossRate * avgLoss) };
}
function computeAvgR(trades) {
  const winsWithR = trades.filter(t => t.result === 'WIN').map(t => parseRr(t.riskReward)).filter(r => Number.isFinite(r) && r !== 0);
  const lossesWithR = trades.filter(t => t.result === 'LOSS').map(t => parseRr(t.riskReward)).filter(r => Number.isFinite(r) && r !== 0);
  const avgWinR  = winsWithR.length   > 0 ? winsWithR.reduce((s, r) => s + r, 0) / winsWithR.length : 0;
  const avgLossRRaw = lossesWithR.length > 0 ? lossesWithR.reduce((s, r) => s + r, 0) / lossesWithR.length : 0;
  const avgLossR = avgLossRRaw === 0 ? 0 : -Math.abs(avgLossRRaw);
  return { avgWinR, avgLossR };
}

// ── Mirror of the 5 axis scoring functions ──
function scoreDiscipline(trades) {
  let process = 0, impulse = 0;
  for (const t of trades) {
    const k = classifyTrade(t);
    if (k === 'process') process++;
    else if (k === 'impulse') impulse++;
  }
  const denom = process + impulse;
  return denom === 0 ? 0 : (process / denom) * 100;
}
function scorePatience(trades) {
  let withJournal = 0, impatient = 0;
  for (const t of trades) {
    const j = t.journal || '';
    if (j.trim().length === 0) continue;
    withJournal++;
    if (journalMatches(j, BAD_PATIENCE_KEYWORDS)) impatient++;
  }
  return withJournal === 0 ? 0 : ((withJournal - impatient) / withJournal) * 100;
}
function scoreRiskControl(trades, opts = {}) {
  const amounts = trades.map(t => t.riskAmount).filter(r => typeof r === 'number' && r > 0);
  if (amounts.length === 0) return 0;
  const mean = amounts.reduce((s, r) => s + r, 0) / amounts.length;
  if (mean === 0) return 0;
  const variance = amounts.reduce((s, r) => s + (r - mean) ** 2, 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  let score = (1 - Math.min(cv, 1)) * 100;
  const acct = opts.accountSize;
  if (typeof acct === 'number' && acct > 0) {
    const threshold = acct * 0.03;
    const oversize = amounts.filter(r => r > threshold).length;
    const penaltyRatio = oversize / amounts.length;
    score -= penaltyRatio * 50;
  }
  return Math.max(0, Math.min(100, score));
}
function scoreEdge(trades) {
  const exp = computeExpectancy(trades);
  if (exp.decisive === 0) return 0;
  const r = computeAvgR(trades);
  const rExp = exp.winRate * r.avgWinR + exp.lossRate * r.avgLossR;
  return Math.max(0, Math.min(100, 50 + rExp * 50));
}
function scoreExitDiscipline(trades) {
  const r = computeAvgR(trades);
  const winR  = r.avgWinR;
  const lossR = Math.abs(r.avgLossR);
  const denom = winR + lossR;
  return denom === 0 ? 0 : (winR / denom) * 100;
}

// ── Test helpers ──
function t(result, pl, opts = {}) {
  return {
    id: 'x', result, pl,
    journal: opts.journal || '',
    riskAmount: opts.riskAmount,
    riskReward: opts.riskReward || '',
  };
}
function near(a, b, eps = 1e-6) { return Math.abs(a - b) < eps; }
let pass = 0, fail = 0;
function check(name, got, expected) {
  const ok = near(got, expected);
  console.log((ok ? 'PASS' : 'FAIL').padEnd(5), name.padEnd(64));
  if (!ok) console.log('       got     :', got, '\n       expected:', expected);
  ok ? pass++ : fail++;
}

// ── Test cases ──

// Empty input: every axis 0
check('empty · discipline',     scoreDiscipline([]),     0);
check('empty · patience',       scorePatience([]),       0);
check('empty · risk control',   scoreRiskControl([]),    0);
check('empty · edge',           scoreEdge([]),           0);
check('empty · exit discipline',scoreExitDiscipline([]), 0);

// Discipline — all-process
{
  const trades = [
    t('WIN', 100, { journal: 'patient and on plan' }),
    t('LOSS', -50, { journal: 'stopped out clean' }),
    t('WIN', 80,  { journal: 'waited for the setup' }),
  ];
  check('discipline · all-process → 100', scoreDiscipline(trades), 100);
}
// Discipline — all-impulse
{
  const trades = [
    t('WIN', 100, { journal: 'fomo trade' }),
    t('LOSS', -50, { journal: 'revenge after the last one' }),
    t('LOSS', -75, { journal: 'jumped in chasing' }),
  ];
  check('discipline · all-impulse → 0', scoreDiscipline(trades), 0);
}
// Discipline — mixed 3 process / 2 impulse → 60%
{
  const trades = [
    t('WIN',  100, { journal: 'patient' }),
    t('WIN',   80, { journal: 'on plan' }),
    t('LOSS', -50, { journal: 'stopped out' }),
    t('LOSS', -50, { journal: 'fomo' }),
    t('LOSS', -50, { journal: 'rushed' }),
  ];
  check('discipline · 3p/2i → 60', scoreDiscipline(trades), 60);
}
// Discipline — neutral excluded
{
  const trades = [
    t('WIN',  100, { journal: 'patient' }),
    t('LOSS', -50, { journal: 'meh' }),     // neutral — excluded
    t('LOSS', -50, { journal: 'rushed' }),
  ];
  check('discipline · neutrals excluded → 50', scoreDiscipline(trades), 50);
}

// Patience — all patient (no impulse keywords)
{
  const trades = [
    t('WIN',  100, { journal: 'waited for the pullback' }),
    t('LOSS', -50, { journal: 'on plan, took the stop' }),
  ];
  check('patience · clean journals → 100', scorePatience(trades), 100);
}
// Patience — all impatient
{
  const trades = [
    t('WIN', 100, { journal: 'fomo entry' }),
    t('LOSS', -50, { journal: 'revenge trade' }),
    t('LOSS', -50, { journal: 'jumped in too quick' }),
  ];
  check('patience · all impatient → 0', scorePatience(trades), 0);
}
// Patience — 1 impatient in 4 → 75
{
  const trades = [
    t('WIN',  100, { journal: 'patient' }),
    t('WIN',   80, { journal: 'clean entry' }),
    t('LOSS', -50, { journal: 'just a stop' }),
    t('LOSS', -50, { journal: 'fomo this one' }),
  ];
  check('patience · 1/4 impatient → 75', scorePatience(trades), 75);
}
// Patience — empty journals excluded from denominator
{
  const trades = [
    t('WIN',  100, { journal: '' }),
    t('WIN',   80, { journal: '' }),
    t('LOSS', -50, { journal: 'fomo' }),
  ];
  check('patience · empty journals excluded → 0/1 patient = 0', scorePatience(trades), 0);
}

// Risk Control — perfect sizing (10 trades all $100)
{
  const trades = Array.from({length: 10}, () => t('WIN', 100, { riskAmount: 100 }));
  check('risk control · perfect sizing → 100', scoreRiskControl(trades), 100);
}
// Risk Control — wild variance
{
  const trades = [
    t('WIN', 100, { riskAmount: 50 }),
    t('WIN', 100, { riskAmount: 100 }),
    t('WIN', 100, { riskAmount: 200 }),
    t('WIN', 100, { riskAmount: 500 }),
    t('LOSS', -50, { riskAmount: 25 }),
  ];
  // mean = 175, stdDev ≈ 169.55, CV ≈ 0.969 → score ≈ 3.1
  const score = scoreRiskControl(trades);
  check('risk control · wild variance → low (< 10)', score < 10 ? 1 : 0, 1);
}
// Risk Control — oversize penalty
{
  // 5 trades all $100, account = $1000. 3% of $1000 = $30. All 5 oversize.
  // CV = 0 → 100. Penalty: 5/5 = 100% × 50 = 50. Final = 50.
  const trades = Array.from({length: 5}, () => t('WIN', 100, { riskAmount: 100 }));
  check('risk control · all oversize, perfect CV → 50', scoreRiskControl(trades, { accountSize: 1000 }), 50);
}
// Risk Control — no oversize, account size set
{
  // 5 trades all $20, account = $1000. 3% = $30. None oversize.
  const trades = Array.from({length: 5}, () => t('WIN', 100, { riskAmount: 20 }));
  check('risk control · no oversize, perfect CV → 100', scoreRiskControl(trades, { accountSize: 1000 }), 100);
}
// Risk Control — trades without riskAmount excluded
{
  const trades = [
    t('WIN', 100, { riskAmount: 100 }),
    t('WIN', 100),                       // no riskAmount — excluded
    t('LOSS', -50, { riskAmount: 100 }),
  ];
  // 2 amounts both 100 → CV = 0 → 100
  check('risk control · missing riskAmount excluded → 100', scoreRiskControl(trades), 100);
}

// Edge — neutral expectancy → 50
{
  // 5W 1R / 5L 1R → expectancy 0
  const trades = [
    ...Array.from({length: 5}, () => t('WIN',  100, { riskReward: '1' })),
    ...Array.from({length: 5}, () => t('LOSS', -100, { riskReward: '-1' })),
  ];
  check('edge · neutral expectancy → 50', scoreEdge(trades), 50);
}
// Edge — positive expectancy +1R → 100
{
  // All winners 2R → winRate 1, avgWinR 2, rExp = 2 → score clamps to 100
  const trades = Array.from({length: 5}, () => t('WIN', 200, { riskReward: '2' }));
  check('edge · all 2R winners → 100', scoreEdge(trades), 100);
}
// Edge — negative expectancy −1R → 0
{
  const trades = Array.from({length: 5}, () => t('LOSS', -100, { riskReward: '-1' }));
  // All losers 1R → lossRate 1, avgLossR -1, rExp = -1 → score = 0
  check('edge · all 1R losers → 0', scoreEdge(trades), 0);
}
// Edge — modest positive +0.4R → 70
{
  // 6W 1R / 4L 1R → winRate 0.6, lossRate 0.4 → rExp = 0.6 - 0.4 = 0.2
  // score = 50 + 0.2 × 50 = 60
  const trades = [
    ...Array.from({length: 6}, () => t('WIN',  100, { riskReward: '1' })),
    ...Array.from({length: 4}, () => t('LOSS', -100, { riskReward: '-1' })),
  ];
  check('edge · 60% WR 1R/1R → 60', scoreEdge(trades), 60);
}

// Exit Discipline — winners > losers in R (2R win / 1R loss → ~67)
{
  const trades = [
    t('WIN',  200, { riskReward: '2' }),
    t('LOSS', -100, { riskReward: '-1' }),
  ];
  check('exit · 2R / 1R → 66.67', scoreExitDiscipline(trades), (2 / 3) * 100);
}
// Exit Discipline — symmetric → 50
{
  const trades = [
    t('WIN',  100, { riskReward: '1' }),
    t('LOSS', -100, { riskReward: '-1' }),
  ];
  check('exit · 1R / 1R → 50', scoreExitDiscipline(trades), 50);
}
// Exit Discipline — losers > winners (1R win / 2R loss → ~33)
{
  const trades = [
    t('WIN',  100, { riskReward: '1' }),
    t('LOSS', -200, { riskReward: '-2' }),
  ];
  check('exit · 1R / 2R → 33.33', scoreExitDiscipline(trades), (1 / 3) * 100);
}
// Exit Discipline — trades without R:R excluded
{
  const trades = [
    t('WIN',  100, { riskReward: '' }),     // excluded
    t('WIN',  100, { riskReward: '2' }),
    t('LOSS', -100, { riskReward: '-1' }),
  ];
  check('exit · unparseable R:R excluded → 66.67', scoreExitDiscipline(trades), (2 / 3) * 100);
}

console.log('─'.repeat(70));
console.log(`${pass} pass, ${fail} fail (${pass + fail} total)`);
process.exit(fail > 0 ? 1 : 0);
