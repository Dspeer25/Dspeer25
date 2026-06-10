// Standalone test harness for the KPI metric functions in
// shared.ts (computeExpectancy / computeProfitFactor / computeAvgR).
// Mirrors the scoreNumberGoal test pattern: re-implements the
// scoring inline so we can verify the math without a TS runner.
// Run: node scripts/test-kpi-metrics.mjs

// ── Mirror of parseRr from shared.ts ──
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

// ── Mirror of computeExpectancy ──
function computeExpectancy(trades) {
  const wins   = trades.filter(t => t.result === 'WIN');
  const losses = trades.filter(t => t.result === 'LOSS');
  const breakeven = trades.filter(t => t.result === 'BREAKEVEN');
  const decisive = wins.length + losses.length;
  const avgWin  = wins.length   > 0 ? wins.reduce((s, t) => s + t.pl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pl, 0) / losses.length) : 0;
  const winRate  = decisive > 0 ? wins.length   / decisive : 0;
  const lossRate = decisive > 0 ? losses.length / decisive : 0;
  const expectancy = (winRate * avgWin) - (lossRate * avgLoss);
  return { wins: wins.length, losses: losses.length, breakeven: breakeven.length, decisive, avgWin, avgLoss, winRate, lossRate, expectancy };
}

// ── Mirror of computeProfitFactor ──
function computeProfitFactor(trades) {
  const wins   = trades.filter(t => t.result === 'WIN');
  const losses = trades.filter(t => t.result === 'LOSS');
  const grossProfit = wins.reduce((s, t) => s + t.pl, 0);
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + t.pl, 0));
  let ratio;
  if (grossLoss === 0) ratio = grossProfit > 0 ? Number.POSITIVE_INFINITY : 0;
  else ratio = grossProfit / grossLoss;
  return { grossProfit, grossLoss, ratio };
}

// ── Mirror of lossEffectiveR + computeAvgR ──
function lossEffectiveR(t) {
  const logged = parseRr(t.riskReward);
  if (Number.isFinite(logged) && logged !== 0) return { magnitude: Math.abs(logged), source: 'logged' };
  if (typeof t.riskAmount === 'number' && t.riskAmount > 0 && Number.isFinite(t.pl) && t.pl !== 0) {
    return { magnitude: Math.abs(t.pl) / t.riskAmount, source: 'computed' };
  }
  return { magnitude: 1, source: 'assumed' };
}
function computeAvgR(trades) {
  const winsWithR = trades.filter(t => t.result === 'WIN').map(t => parseRr(t.riskReward)).filter(r => Number.isFinite(r) && r !== 0);
  const lossMags = trades.filter(t => t.result === 'LOSS').map(t => lossEffectiveR(t).magnitude);
  const avgWinR  = winsWithR.length > 0 ? winsWithR.reduce((s, r) => s + r, 0) / winsWithR.length : 0;
  const avgLossR = lossMags.length  > 0 ? -(lossMags.reduce((s, r) => s + r, 0) / lossMags.length) : 0;
  return { avgWinR, avgLossR, winRCount: winsWithR.length, lossRCount: lossMags.length };
}

// ── Test helpers ──
function trade(result, pl, riskReward = '', riskAmount) {
  return { id: 't', result, pl, riskReward, riskAmount };
}
function near(a, b, eps = 1e-6) {
  if (a === Infinity && b === Infinity) return true;
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return Math.abs(a - b) < eps;
}

let pass = 0, fail = 0;
function check(name, got, expected) {
  let ok;
  if (typeof expected === 'object' && expected !== null) {
    ok = Object.keys(expected).every(k => near(got[k], expected[k]));
  } else {
    ok = near(got, expected);
  }
  console.log((ok ? 'PASS' : 'FAIL').padEnd(5), name.padEnd(60));
  if (!ok) console.log('       got     :', JSON.stringify(got));
  if (!ok) console.log('       expected:', JSON.stringify(expected));
  ok ? pass++ : fail++;
}

// ── Test cases ──

// 1. All wins — expectancy = avgWin, lossRate = 0, PF = ∞
{
  const trades = [trade('WIN', 100), trade('WIN', 200), trade('WIN', 300)];
  check('all wins · expectancy',     computeExpectancy(trades).expectancy, 200);
  check('all wins · winRate',        computeExpectancy(trades).winRate, 1);
  check('all wins · profit factor',  computeProfitFactor(trades).ratio, Infinity);
}

// 2. All losses — expectancy = -avgLoss, PF = 0 (zero gross profit / nonzero gross loss)
{
  const trades = [trade('LOSS', -100), trade('LOSS', -200), trade('LOSS', -300)];
  check('all losses · expectancy',     computeExpectancy(trades).expectancy, -200);
  check('all losses · winRate',        computeExpectancy(trades).winRate, 0);
  check('all losses · profit factor',  computeProfitFactor(trades).ratio, 0);
}

// 3. Mixed — verifies the canonical formula. 4W avg +$200, 6L avg -$80
//    winRate = 0.4, lossRate = 0.6 → EV = (0.4 × 200) - (0.6 × 80) = 80 - 48 = +32
{
  const wins   = Array.from({length: 4}, () => trade('WIN', 200));
  const losses = Array.from({length: 6}, () => trade('LOSS', -80));
  const trades = [...wins, ...losses];
  check('mixed 4W/6L · expectancy',       computeExpectancy(trades).expectancy, 32);
  check('mixed 4W/6L · winRate',          computeExpectancy(trades).winRate, 0.4);
  check('mixed 4W/6L · profit factor',    computeProfitFactor(trades).ratio, 800 / 480);   // ≈ 1.667
  check('mixed 4W/6L · gross profit',     computeProfitFactor(trades).grossProfit, 800);
  check('mixed 4W/6L · gross loss',       computeProfitFactor(trades).grossLoss, 480);
}

// 4. Empty set — every field 0, no infinities, no NaN
{
  const trades = [];
  check('empty set · expectancy',     computeExpectancy(trades).expectancy, 0);
  check('empty set · decisive',       computeExpectancy(trades).decisive, 0);
  check('empty set · profit factor',  computeProfitFactor(trades).ratio, 0);
  check('empty set · avgWinR',        computeAvgR(trades).avgWinR, 0);
  check('empty set · avgLossR',       computeAvgR(trades).avgLossR, 0);
}

// 5. BE-only — BE is excluded from every metric input
{
  const trades = [trade('BREAKEVEN', 0), trade('BREAKEVEN', 0)];
  check('BE only · expectancy',     computeExpectancy(trades).expectancy, 0);
  check('BE only · breakeven',      computeExpectancy(trades).breakeven, 2);
  check('BE only · decisive',       computeExpectancy(trades).decisive, 0);
  check('BE only · profit factor',  computeProfitFactor(trades).ratio, 0);
}

// 6. BE excluded from a mixed set — adding 5 BEs shouldn't change expectancy
{
  const base = [trade('WIN', 100), trade('WIN', 100), trade('LOSS', -50)];
  const withBE = [...base, trade('BREAKEVEN', 0), trade('BREAKEVEN', 0), trade('BREAKEVEN', 0), trade('BREAKEVEN', 0), trade('BREAKEVEN', 0)];
  const evBase   = computeExpectancy(base).expectancy;
  const evWithBE = computeExpectancy(withBE).expectancy;
  check('BE excluded · expectancy invariant',  evWithBE, evBase);
  check('BE excluded · winRate invariant',     computeExpectancy(withBE).winRate, computeExpectancy(base).winRate);
}

// 7. Profit-factor divide-by-zero: wins only with no losses → ∞
{
  const trades = [trade('WIN', 500), trade('BREAKEVEN', 0)];
  check('PF wins-only with BE · ratio',  computeProfitFactor(trades).ratio, Infinity);
  check('PF wins-only with BE · gross loss', computeProfitFactor(trades).grossLoss, 0);
}

// 8. AvgR happy path: 2.5R, 3.5R wins + -1.0R loss → +3.0R / -1.0R
{
  const trades = [
    trade('WIN',  200, '2.5'),
    trade('WIN',  300, '3.5'),
    trade('LOSS', -100, '-1.0'),
  ];
  check('avgR · avgWinR',  computeAvgR(trades).avgWinR, 3.0);
  check('avgR · avgLossR', computeAvgR(trades).avgLossR, -1.0);
  check('avgR · winRCount',  computeAvgR(trades).winRCount, 2);
  check('avgR · lossRCount', computeAvgR(trades).lossRCount, 1);
}

// 9. AvgR forces a negative sign on the loss side even if R:R was
//    logged as a positive magnitude (some traders log "2R loss" as "2.0").
{
  const trades = [
    trade('WIN',  200, '2'),
    trade('LOSS', -100, '1.5'),   // positive magnitude — should still display as -1.5R
  ];
  check('avgR · loss stored positive → forced negative', computeAvgR(trades).avgLossR, -1.5);
}

// 10. AvgR ignores WINS with no R:R logged; losses without R:R now
//     count via the assumed −1R fallback (a stopped-out loss is −1R
//     by definition, so blank loss R:R is expected, not missing data).
{
  const trades = [
    trade('WIN',  200, '2'),
    trade('WIN',  200, ''),         // no R:R — excluded
    trade('WIN',  200, '—'),        // em-dash placeholder — excluded
    trade('LOSS', -100, '-1'),
    trade('LOSS', -100, ''),        // assumed −1R
  ];
  check('avgR · unparseable win excluded · winRCount', computeAvgR(trades).winRCount, 1);
  check('avgR · blank loss assumed −1R · lossRCount',  computeAvgR(trades).lossRCount, 2);
  check('avgR · unparseable win excluded · avgWinR',   computeAvgR(trades).avgWinR, 2);
  check('avgR · blank loss assumed −1R · avgLossR',    computeAvgR(trades).avgLossR, -1);
}

// 10b. Loss R priority chain: logged R:R > computed pl/riskAmount >
//      assumed −1R. Wins never use the chain.
{
  const trades = [
    trade('LOSS', -200, '-2'),       // logged → 2R
    trade('LOSS', -40,  '', 100),    // computed |pl|/risk → 0.4R
    trade('LOSS', -100, ''),         // assumed → 1R
  ];
  check('avgR chain · lossRCount = all losses', computeAvgR(trades).lossRCount, 3);
  check('avgR chain · avgLossR = −(2+0.4+1)/3', computeAvgR(trades).avgLossR, -(3.4 / 3));
  check('avgR chain · logged beats pl/risk',    lossEffectiveR(trade('LOSS', -40, '-2', 100)).magnitude, 2);
  check('avgR chain · computed source',         lossEffectiveR(trade('LOSS', -40, '', 100)).source === 'computed' ? 1 : 0, 1);
  check('avgR chain · assumed source',          lossEffectiveR(trade('LOSS', -40, '')).source === 'assumed' ? 1 : 0, 1);
}

// 11. Real-world-ish dataset (sanity check against a manual computation)
//     5W $150 each, 7L -$60 each, 3BE
//     winRate = 5/12 = 0.4167, lossRate = 0.5833
//     avgWin = 150, avgLoss = 60
//     EV = (0.4167 × 150) - (0.5833 × 60) = 62.5 - 35 = +27.5
//     GP = 750, GL = 420, PF = 1.7857
{
  const trades = [
    ...Array.from({length: 5}, () => trade('WIN',  150)),
    ...Array.from({length: 7}, () => trade('LOSS', -60)),
    ...Array.from({length: 3}, () => trade('BREAKEVEN', 0)),
  ];
  check('realistic · expectancy',       computeExpectancy(trades).expectancy, 27.5);
  check('realistic · winRate',          computeExpectancy(trades).winRate, 5/12);
  check('realistic · gross profit',     computeProfitFactor(trades).grossProfit, 750);
  check('realistic · gross loss',       computeProfitFactor(trades).grossLoss, 420);
  check('realistic · profit factor',    computeProfitFactor(trades).ratio, 750/420);
}

console.log('─'.repeat(70));
console.log(`${pass} pass, ${fail} fail (${pass + fail} total)`);
process.exit(fail > 0 ? 1 : 0);
