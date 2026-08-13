// Standalone test harness for the futures contract table and the
// futures math in shared.ts. Follows the test-kpi-metrics pattern:
// the math functions are mirrored inline so we can verify them without
// a TS runner. The CONTRACT TABLE, however, is parsed straight out of
// shared.ts source text — so this test validates the data that actually
// ships, and a typo in any tick spec fails the run.
// Run: node scripts/test-futures-math.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SHARED = readFileSync(join(here, '..', 'app', 'components', 'shared.ts'), 'utf8');

let failures = 0;
function check(label, actual, expected, tolerance = 1e-9) {
  const ok = typeof expected === 'number'
    ? Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected))
    : actual === expected;
  if (!ok) {
    failures++;
    console.log(`  FAIL  ${label}\n        expected ${expected}, got ${actual}`);
  }
  return ok;
}

// ── Mirror of tickDecimals / roundToTick / isOnTick ──
function tickDecimals(tickSize) {
  if (!isFinite(tickSize) || tickSize <= 0) return 2;
  const [mantissa, expPart] = tickSize.toExponential().split('e');
  const exp = parseInt(expPart, 10);
  const mantissaDecimals = (mantissa.split('.')[1] || '').length;
  return Math.max(0, mantissaDecimals - exp);
}
function roundToTick(price, tickSize) {
  if (!isFinite(price) || !isFinite(tickSize) || tickSize <= 0) return price;
  const snapped = Math.round(price / tickSize) * tickSize;
  return parseFloat(snapped.toFixed(tickDecimals(tickSize)));
}
function isOnTick(price, tickSize) {
  if (!isFinite(price) || !isFinite(tickSize) || tickSize <= 0) return true;
  return Math.abs(price - roundToTick(price, tickSize)) < tickSize * 1e-6;
}
function futuresRiskPerContract(entry, stop, tickSize, tickValue) {
  const distance = Math.abs(entry - stop);
  if (!isFinite(distance) || distance <= 0 || !isFinite(tickSize) || tickSize <= 0) return 0;
  return (distance / tickSize) * tickValue;
}
function futuresTickDistance(entry, stop, tickSize) {
  const distance = Math.abs(entry - stop);
  if (!isFinite(distance) || distance <= 0 || !isFinite(tickSize) || tickSize <= 0) return 0;
  return Math.round(distance / tickSize);
}
function futuresMaxContracts(maxRisk, riskPerContract) {
  if (!isFinite(maxRisk) || maxRisk <= 0 || !isFinite(riskPerContract) || riskPerContract <= 0) return 0;
  return Math.floor(maxRisk / riskPerContract);
}
function isStopSideValid(direction, entry, stop) {
  return direction === 'LONG' ? stop < entry : stop > entry;
}
function futuresRTarget(entry, stop, direction, r, tickSize) {
  const distance = Math.abs(entry - stop);
  const raw = direction === 'LONG' ? entry + r * distance : entry - r * distance;
  return roundToTick(raw, tickSize);
}

// ── Parse the real FUTURES_CONTRACTS table out of shared.ts ──
const ROW = /\{\s*symbol:\s*'([^']+)',\s*name:\s*'([^']+)',\s*group:\s*'([^']+)',\s*tickSize:\s*([\d.eE+-]+),\s*tickValue:\s*([\d.eE+-]+),\s*pointValue:\s*([\d.eE+-]+)\s*\}/g;
const tableStart = SHARED.indexOf('export const FUTURES_CONTRACTS');
const tableEnd = SHARED.indexOf('\n];', tableStart);
if (tableStart < 0 || tableEnd < 0) {
  console.log('FAIL: could not locate FUTURES_CONTRACTS in shared.ts');
  process.exit(1);
}
const contracts = [];
for (const m of SHARED.slice(tableStart, tableEnd).matchAll(ROW)) {
  contracts.push({
    symbol: m[1], name: m[2], group: m[3],
    tickSize: parseFloat(m[4]), tickValue: parseFloat(m[5]), pointValue: parseFloat(m[6]),
  });
}

console.log(`\nParsed ${contracts.length} contracts from shared.ts\n`);
console.log('CONTRACT TABLE — pointValue must equal tickValue / tickSize');
console.log('─'.repeat(78));
console.log(
  'SYM'.padEnd(5) + 'NAME'.padEnd(24) + 'GROUP'.padEnd(14) +
  'TICK'.padStart(11) + 'TICK $'.padStart(9) + '$/PT'.padStart(13),
);
console.log('─'.repeat(78));

let lastGroup = null;
for (const c of contracts) {
  if (c.group !== lastGroup) { console.log(`\n  [${c.group}]`); lastGroup = c.group; }
  const derived = c.tickValue / c.tickSize;
  check(`${c.symbol} pointValue`, c.pointValue, derived);
  const flag = Math.abs(c.pointValue - derived) <= 1e-9 * Math.max(1, derived) ? ' ' : 'X';
  console.log(
    flag + ' ' + c.symbol.padEnd(5) + c.name.padEnd(24) + c.group.padEnd(14) +
    String(c.tickSize).padStart(11) +
    ('$' + c.tickValue).padStart(9) +
    ('$' + c.pointValue.toLocaleString()).padStart(13),
  );
}

// ── Invariant: risk via ticks == risk via points, for every contract ──
console.log('\n' + '─'.repeat(78));
console.log('INVARIANT — (dist/tickSize)*tickValue === dist*pointValue, all contracts');
for (const c of contracts) {
  for (const ticks of [1, 4, 37, 250]) {
    const dist = ticks * c.tickSize;
    const entry = roundToTick(100 * c.tickSize * 137, c.tickSize);
    const viaTicks = futuresRiskPerContract(entry, entry - dist, c.tickSize, c.tickValue);
    const viaPoints = dist * c.pointValue;
    check(`${c.symbol} risk @ ${ticks} ticks`, viaTicks, viaPoints, 1e-9);
    check(`${c.symbol} tick distance @ ${ticks}`, futuresTickDistance(entry, entry - dist, c.tickSize), ticks);
  }
}
console.log('  all contracts consistent across 1 / 4 / 37 / 250 tick distances');

// ── Spot checks against hand-computed values ──
console.log('\n' + '─'.repeat(78));
console.log('SPOT CHECKS');
const spot = [
  // [symbol, entry, stop, expected risk/contract, note]
  ['ES',  5000,      4990,      500,    '10 pts = 40 ticks x $12.50'],
  ['MES', 5000,      4990,      50,     '10 pts = 40 ticks x $1.25'],
  ['NQ',  17500,     17475,     500,    '25 pts = 100 ticks x $5.00'],
  ['MNQ', 17500,     17475,     50,     '25 pts = 100 ticks x $0.50'],
  ['CL',  78.5,      78.2,      300,    '0.30 = 30 ticks x $10'],
  ['GC',  2400,      2395,      500,    '5.0 = 50 ticks x $10'],
  ['ZN',  110.5,     110.25,    250,    '0.25 = 16 ticks x $15.625'],
  ['ZB',  118,       117.75,    250,    '0.25 = 8 ticks x $31.25'],
  ['6J',  0.0068,    0.0067,    1250,   '0.0001 = 200 ticks x $6.25'],
  ['6E',  1.085,     1.084,     125,    '0.001 = 20 ticks x $6.25'],
  ['BTC', 60000,     59500,     2500,   '500 pts = 100 ticks x $25'],
  ['HG',  4.5,       4.45,      1250,   '0.05 = 100 ticks x $12.50'],
];
for (const [sym, entry, stop, expected, note] of spot) {
  const c = contracts.find(x => x.symbol === sym);
  const risk = futuresRiskPerContract(entry, stop, c.tickSize, c.tickValue);
  const ok = check(`${sym} risk/contract`, risk, expected);
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${sym.padEnd(4)} ${String(entry).padEnd(9)} -> ${String(stop).padEnd(9)} = $${risk.toLocaleString().padEnd(8)} (${note})`);
}

// ── Max contracts ──
console.log('\nMAX CONTRACTS — floor(maxRisk / riskPerContract)');
check('ES $500 budget, $500/contract', futuresMaxContracts(500, 500), 1);
check('ES $499 budget, $500/contract', futuresMaxContracts(499, 500), 0);
check('MES $500 budget, $50/contract', futuresMaxContracts(500, 50), 10);
check('MES $549 budget, $50/contract', futuresMaxContracts(549, 50), 10);
check('zero risk/contract', futuresMaxContracts(500, 0), 0);
console.log('  ok   1 / 0 / 10 / 10 / 0');

// ── Tick rounding ──
console.log('\nTICK ROUNDING');
check('tickDecimals 0.25', tickDecimals(0.25), 2);
check('tickDecimals 0.0000005', tickDecimals(0.0000005), 7);
check('tickDecimals 0.0078125', tickDecimals(0.0078125), 7);
check('tickDecimals 5', tickDecimals(5), 0);
check('tickDecimals 0.0005', tickDecimals(0.0005), 4);
check('roundToTick 4900.30 @0.25', roundToTick(4900.30, 0.25), 4900.25);
check('roundToTick 4900.13 @0.25', roundToTick(4900.13, 0.25), 4900.25);
check('roundToTick 110.30 @0.015625', roundToTick(110.30, 0.015625), 110.296875);
check('roundToTick 60002 @5', roundToTick(60002, 5), 60000);
check('isOnTick 4900.25 @0.25', isOnTick(4900.25, 0.25), true);
check('isOnTick 4900.30 @0.25', isOnTick(4900.30, 0.25), false);
check('isOnTick 110.296875 @0.015625', isOnTick(110.296875, 0.015625), true);
console.log('  ok   decimals, snapping, and on-tick detection');

// ── Direction-aware stop validity + R targets ──
console.log('\nDIRECTION');
check('LONG stop below entry', isStopSideValid('LONG', 5000, 4990), true);
check('LONG stop above entry', isStopSideValid('LONG', 5000, 5010), false);
check('SHORT stop above entry', isStopSideValid('SHORT', 5000, 5010), true);
check('SHORT stop below entry', isStopSideValid('SHORT', 5000, 4990), false);
check('LONG 2R target', futuresRTarget(5000, 4990, 'LONG', 2, 0.25), 5020);
check('SHORT 2R target', futuresRTarget(5000, 5010, 'SHORT', 2, 0.25), 4980);
check('LONG 1.5R target', futuresRTarget(5000, 4990, 'LONG', 1.5, 0.25), 5015);
check('SHORT 0.5R target', futuresRTarget(5000, 5010, 'SHORT', 0.5, 0.25), 4995);
// R target must always land on a valid tick, even for awkward distances.
check('LONG 1.5R snaps to tick (ZN)', isOnTick(futuresRTarget(110.5, 110.25, 'LONG', 1.5, 0.015625), 0.015625), true);
check('LONG 0.5R snaps to tick (HG)', isOnTick(futuresRTarget(4.5, 4.45, 'LONG', 0.5, 0.0005), 0.0005), true);
console.log('  ok   stop-side validity and R targets (both directions, tick-snapped)');

console.log('\n' + '='.repeat(78));
if (failures === 0) {
  console.log(`PASS — ${contracts.length} contracts, all specs internally consistent, all math checks green`);
} else {
  console.log(`FAIL — ${failures} check(s) failed`);
  process.exit(1);
}
