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
function weightedMean(items) {
  const avail = items.filter(x => x.score !== null);
  if (avail.length === 0) return null;
  const total = avail.reduce((s, x) => s + x.weight, 0);
  if (total === 0) return null;
  return avail.reduce((s, x) => s + x.score * x.weight / total, 0);
}

function computeGoalAdherence(trades, goals, accountSize) {
  const hasAccount = typeof accountSize === 'number' && accountSize > 0;
  const matching = [];
  for (const g of goals) {
    if (g.kind !== 'number') continue;
    const r = g.numberRule;
    if (!r) continue;
    if (r.field !== 'riskAmount' && r.field !== 'riskPctOfAccount') continue;
    if (r.operator !== '<=' && r.operator !== '<') continue;
    matching.push(r);
  }
  if (matching.length === 0) return { score: null };
  const anyPctRule = matching.some(r => r.field === 'riskPctOfAccount');
  if (anyPctRule && !hasAccount) return { score: null };
  let strictest = null;
  let strictestKey = Infinity;
  for (const r of matching) {
    const v = typeof r.value === 'number' ? r.value : parseFloat(String(r.value));
    if (!Number.isFinite(v)) continue;
    const key = r.field === 'riskPctOfAccount' ? v : (hasAccount ? (v / accountSize) * 100 : v);
    if (key < strictestKey) { strictestKey = key; strictest = r; }
  }
  if (!strictest) return { score: null };
  const tradesWithRisk = trades.filter(t => typeof t.riskAmount === 'number' && t.riskAmount > 0);
  if (tradesWithRisk.length === 0) return { score: null };
  const ruleValue = typeof strictest.value === 'number' ? strictest.value : parseFloat(String(strictest.value));
  const op = strictest.operator;
  let within = 0;
  for (const t of tradesWithRisk) {
    const actual = strictest.field === 'riskPctOfAccount' ? (t.riskAmount / accountSize) * 100 : t.riskAmount;
    const ok = op === '<=' ? actual <= ruleValue : actual < ruleValue;
    if (ok) within++;
  }
  return { score: (within / tradesWithRisk.length) * 100 };
}

function computeDataSizing(trades, accountSize) {
  const withRisk = trades.filter(t => typeof t.riskAmount === 'number' && t.riskAmount > 0);
  if (withRisk.length === 0) return { score: null, revenge: null, stability: null, oversize: null };
  const sorted = [...withRisk].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.time || '').localeCompare(b.time || '');
  });
  let postLossCount = 0, revengeCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1].result !== 'LOSS') continue;
    postLossCount++;
    if (sorted[i].riskAmount > sorted[i - 1].riskAmount * 1.20) revengeCount++;
  }
  const revenge = postLossCount > 0 ? Math.max(0, Math.min(100, (1 - revengeCount / postLossCount) * 100)) : null;
  const amounts = [...withRisk.map(t => t.riskAmount)].sort((a, b) => a - b);
  const median = amounts.length % 2 === 1
    ? amounts[(amounts.length - 1) / 2]
    : (amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2;
  let deviated = 0;
  if (median > 0) for (const r of amounts) if (r > median * 2 || r < median * 0.5) deviated++;
  const stability = (1 - deviated / withRisk.length) * 100;
  let oversize = null;
  if (typeof accountSize === 'number' && accountSize > 0) {
    const threshold = accountSize * 0.03;
    const over = withRisk.filter(t => t.riskAmount > threshold).length;
    oversize = Math.max(0, Math.min(100, (1 - over / withRisk.length) * 100));
  }
  const score = weightedMean([
    { score: revenge, weight: 0.5 },
    { score: stability, weight: 0.3 },
    { score: oversize, weight: 0.2 },
  ]);
  return { score, revenge, stability, oversize };
}

function computeJournalLanguage(trades, classifications) {
  if (!classifications) return null;
  let pos = 0, neg = 0;
  for (const t of trades) {
    const v = classifications[t.id]?.riskLanguage;
    if (v === 'positive') pos++;
    else if (v === 'negative') neg++;
  }
  const mentions = pos + neg;
  if (mentions === 0) return null;
  return (pos / mentions) * 100;
}

function scoreRiskControl(trades, opts = {}) {
  const goal = computeGoalAdherence(trades, opts.goals || [], opts.accountSize);
  const data = computeDataSizing(trades, opts.accountSize);
  const journal = computeJournalLanguage(trades, opts.classifications);
  const blended = weightedMean([
    { score: goal.score, weight: 0.5 },
    { score: data.score, weight: 0.3 },
    { score: journal, weight: 0.2 },
  ]);
  if (blended === null) return { score: null, reason: 'no_signal', goalScore: null, dataScore: null, journalScore: null };
  return {
    score: Math.max(0, Math.min(100, blended)),
    reason: 'scored',
    goalScore: goal.score,
    dataScore: data.score,
    journalScore: journal,
  };
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
let __idSeq = 0;
function t(result, pl, opts = {}) {
  __idSeq += 1;
  return {
    id: opts.id || `t${__idSeq}`,
    result, pl,
    journal: opts.journal || '',
    riskAmount: opts.riskAmount,
    riskReward: opts.riskReward || '',
    date: opts.date || '2026-06-09',
    time: opts.time || '09:30',
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
// empty input + no goals → null with no_signal reason
{
  const r = scoreRiskControl([]);
  check('empty · risk control · score null',     r.score === null ? 1 : 0, 1);
  check('empty · risk control · reason no_signal', r.reason === 'no_signal' ? 1 : 0, 1);
}
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

// ── Risk Control — blended (goal adherence + data sizing + journal) ──
function riskGoal(field, op, value) {
  return { kind: 'number', numberRule: { field, operator: op, value } };
}
// Build a classifications map keyed by trade id; verdicts is an array
// of 'positive' / 'negative' / 'neutral' aligned to trades order.
function classMap(trades, verdicts) {
  const m = {};
  trades.forEach((tr, i) => { m[tr.id] = { riskLanguage: verdicts[i] }; });
  return m;
}

// 1. Truly empty: no goal, no riskAmount, no journal tags → null/no_signal
{
  const trades = Array.from({length: 5}, (_, i) => t('WIN', 100, { id: `e${i}` }));
  const r = scoreRiskControl(trades, { goals: [], classifications: {} });
  check('risk control · truly empty → null', r.score === null ? 1 : 0, 1);
  check('risk control · truly empty · reason', r.reason === 'no_signal' ? 1 : 0, 1);
}

// 2. Data-only path: no goal, no journal tags, but every trade has
//    riskAmount and they're all near-median with no revenge → high
{
  const trades = Array.from({length: 6}, (_, i) => t(
    i % 2 === 0 ? 'WIN' : 'LOSS', i % 2 === 0 ? 100 : -50,
    { id: `d${i}`, riskAmount: 100, date: '2026-06-09', time: `09:${30 + i * 5}` },
  ));
  const r = scoreRiskControl(trades, { goals: [], classifications: {} });
  // revenge: 3 post-loss trades, none bumped → 100
  // stability: median 100, none deviated → 100
  // oversize: not applicable (no account)
  // data blend (no oversize): revenge 100 × 0.5 / 0.8 + stability 100 × 0.3 / 0.8 = 100
  // overall blend: only data → 100
  check('risk control · data-only · clean sizing → 100', r.score, 100);
  check('risk control · data-only · goalScore null', r.goalScore === null ? 1 : 0, 1);
  check('risk control · data-only · journalScore null', r.journalScore === null ? 1 : 0, 1);
}

// 3. Journal-only path: no goal, no riskAmount, but Haiku tagged
//    5 trades positive / 2 trades negative
{
  const trades = Array.from({length: 7}, (_, i) => t('WIN', 100, { id: `j${i}` }));
  const verdicts = ['positive','positive','positive','positive','positive','negative','negative'];
  const r = scoreRiskControl(trades, { goals: [], classifications: classMap(trades, verdicts) });
  // journalScore: 5 / (5+2) × 100 = 500/7 ≈ 71.43
  // only journal scored → final = ~71.43
  check('risk control · journal-only · 5p/2n → 71.43', r.score, (5/7) * 100);
}

// 4. All three present — blended math verification
{
  // goal: $200 cap, 8 of 10 within → 80
  // data: 10 trades, median 100, 2 trades 250 (outside 0.5-2× → deviation 2/10)
  //   revenge: 5 post-loss trades, 1 bumped >20% → revenge 80
  //   stability: 8/10 within range → 80
  //   no oversize
  //   data blend: 80×0.5/0.8 + 80×0.3/0.8 = 80
  // journal: 6 positive, 4 negative → 60
  // overall: 80×0.5 + 80×0.3 + 60×0.2 = 40 + 24 + 12 = 76
  const trades = [
    t('WIN',  100, { id: 'a0', riskAmount: 100, date: '2026-06-09', time: '09:30' }),
    t('LOSS', -50, { id: 'a1', riskAmount: 100, date: '2026-06-09', time: '09:35' }),
    t('WIN',  100, { id: 'a2', riskAmount: 130, date: '2026-06-09', time: '09:40' }), // post-loss, +30% → revenge
    t('LOSS', -50, { id: 'a3', riskAmount: 100, date: '2026-06-09', time: '09:45' }),
    t('WIN',  100, { id: 'a4', riskAmount: 100, date: '2026-06-09', time: '09:50' }), // post-loss, no bump
    t('LOSS', -50, { id: 'a5', riskAmount: 100, date: '2026-06-09', time: '09:55' }),
    t('WIN',  100, { id: 'a6', riskAmount: 250, date: '2026-06-09', time: '10:00' }), // post-loss, big bump (>20%) but ALSO over $200 cap
    t('LOSS', -50, { id: 'a7', riskAmount: 100, date: '2026-06-09', time: '10:05' }),
    t('WIN',  100, { id: 'a8', riskAmount: 100, date: '2026-06-09', time: '10:10' }), // post-loss, no bump
    t('WIN',  100, { id: 'a9', riskAmount: 250, date: '2026-06-09', time: '10:15' }), // not post-loss
  ];
  // Manual recount for the goal subscore (<=200): trades a0..a5,a7..a8 have 100; a6,a9 have 250.
  // 8 within / 10 → 80.
  // Revenge: 5 post-loss trades (a2,a4,a6,a8 — wait need to recount).
  //   post-loss trades = trades[i] where trades[i-1].result === 'LOSS'
  //   a1 LOSS → a2 (post-loss) 100→130 = +30% → revenge
  //   a3 LOSS → a4 (post-loss) 100→100 = 0% → no
  //   a5 LOSS → a6 (post-loss) 100→250 = +150% → revenge
  //   a7 LOSS → a8 (post-loss) 100→100 = 0% → no
  //   total: 4 post-loss, 2 revenge → revenge subscore = (1-2/4)×100 = 50
  // Stability: amounts sorted = [100×8, 250×2]. median = 100. >200 OR <50 → 2 deviated. (1-2/10)×100 = 80
  // Data blend (no oversize): revenge=50 × 0.5/0.8 + stability=80 × 0.3/0.8 = 31.25 + 30 = 61.25
  // Journal: 6 pos, 4 neg → 60
  // Final: 80×0.5 + 61.25×0.3 + 60×0.2 = 40 + 18.375 + 12 = 70.375
  const verdicts = ['positive','positive','positive','positive','positive','positive','negative','negative','negative','negative'];
  const r = scoreRiskControl(trades, {
    goals: [riskGoal('riskAmount', '<=', 200)],
    classifications: classMap(trades, verdicts),
  });
  check('risk control · all three present · goalScore = 80', r.goalScore, 80);
  check('risk control · all three present · dataScore ≈ 61.25', r.dataScore, 61.25);
  check('risk control · all three present · journalScore = 60', r.journalScore, 60);
  check('risk control · all three present · blended ≈ 70.375', r.score, 70.375);
}

// 5. Revenge-sizing detection: 4 post-loss trades, 3 bumped ≥ 20% → 25
{
  const trades = [
    t('LOSS', -50, { id: 'r0', riskAmount: 100, date: '2026-06-09', time: '09:30' }),
    t('WIN',  100, { id: 'r1', riskAmount: 150, date: '2026-06-09', time: '09:35' }), // bumped 50%
    t('LOSS', -50, { id: 'r2', riskAmount: 100, date: '2026-06-09', time: '09:40' }),
    t('WIN',  100, { id: 'r3', riskAmount: 130, date: '2026-06-09', time: '09:45' }), // bumped 30%
    t('LOSS', -50, { id: 'r4', riskAmount: 100, date: '2026-06-09', time: '09:50' }),
    t('WIN',  100, { id: 'r5', riskAmount: 100, date: '2026-06-09', time: '09:55' }), // no bump
    t('LOSS', -50, { id: 'r6', riskAmount: 100, date: '2026-06-09', time: '10:00' }),
    t('WIN',  100, { id: 'r7', riskAmount: 200, date: '2026-06-09', time: '10:05' }), // bumped 100%
  ];
  const r = scoreRiskControl(trades, { goals: [], classifications: {} });
  // 4 post-loss, 3 revenge → revenge subscore = (1-3/4)×100 = 25
  // stability: amounts [100×6, 130, 150, 200]. median = 100. >200 → only 200 is borderline (not strictly >200 if it's exactly 200; my code uses >median*2). 100×2 = 200. >200 means strictly >. So 200 doesn't count. None deviated. stability = 100.
  // data blend (no oversize): 25 × 0.5/0.8 + 100 × 0.3/0.8 = 15.625 + 37.5 = 53.125
  check('risk control · revenge bumps · data score ≈ 53.125', r.dataScore, 53.125);
}

// 6. Affirmative-evidence: many neutrals shouldn't move score
{
  const trades = Array.from({length: 10}, (_, i) => t('WIN', 100, { id: `n${i}` }));
  const verdicts = ['positive','neutral','neutral','neutral','neutral','neutral','neutral','neutral','neutral','negative'];
  const r = scoreRiskControl(trades, { goals: [], classifications: classMap(trades, verdicts) });
  // mentions = 1 pos + 1 neg = 2; journalScore = 1/2 × 100 = 50
  check('risk control · neutrals dropped from denominator → 50', r.journalScore, 50);
  check('risk control · neutrals dropped from denominator · final → 50', r.score, 50);
}

// 7. All neutral journals → journalScore null (axis only scores from
//    other available subscores, doesn't punish silence)
{
  const trades = Array.from({length: 5}, (_, i) => t('WIN', 100, { id: `q${i}`, riskAmount: 100, date: '2026-06-09', time: `09:${30 + i * 5}` }));
  const verdicts = ['neutral','neutral','neutral','neutral','neutral'];
  const r = scoreRiskControl(trades, { goals: [], classifications: classMap(trades, verdicts) });
  check('risk control · all-neutral journals · journalScore null', r.journalScore === null ? 1 : 0, 1);
  // dataScore is still computed; final = dataScore alone
  check('risk control · all-neutral · final = dataScore', r.score === r.dataScore ? 1 : 0, 1);
}

// 8. Boundary check on the goal subscore — strict `<` vs `<=`
{
  const trades = Array.from({length: 5}, (_, i) => t('WIN', 100, { id: `b${i}`, riskAmount: 100, date: '2026-06-09', time: `09:${30 + i * 5}` }));
  const rLE = scoreRiskControl(trades, { goals: [riskGoal('riskAmount', '<=', 100)], classifications: {} });
  const rLT = scoreRiskControl(trades, { goals: [riskGoal('riskAmount', '<', 100)],  classifications: {} });
  // Goal score: LE=100, LT=0. Data: 100 (clean). Blend (no journal): 100×0.5/0.8 + 100×0.3/0.8 = 100 for LE; 0×0.5/0.8 + 100×0.3/0.8 = 37.5 for LT.
  check('risk control · <=100 with exactly 100 → 100', rLE.score, 100);
  check('risk control · <100 with exactly 100, clean data → 37.5', rLT.score, 37.5);
}

// 9. Pct rule needs account size; without account, goal subscore is
//    null but data + journal still score
{
  const trades = Array.from({length: 5}, (_, i) => t('WIN', 100, { id: `p${i}`, riskAmount: 100, date: '2026-06-09', time: `09:${30 + i * 5}` }));
  const verdicts = ['positive','positive','positive','negative','negative'];
  const r = scoreRiskControl(trades, {
    goals: [riskGoal('riskPctOfAccount', '<=', 1)],
    classifications: classMap(trades, verdicts),
  });
  // goal: null (pct rule without account)
  // data: clean → 100
  // journal: 3/(3+2) × 100 = 60
  // blend (data + journal): 100×0.3/0.5 + 60×0.2/0.5 = 60 + 24 = 84
  check('risk control · pct rule no account · goalScore null', r.goalScore === null ? 1 : 0, 1);
  check('risk control · pct rule no account · blend = 84', r.score, 84);
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
