// ═══════════════════════════════════════════════════════════════════
// WickCoach ← Trading Tracker importer
// v3 — afternoon-aware time rule + loss-sign fix + W/L diagnostic split
// ═══════════════════════════════════════════════════════════════════
//
// One-time devtools-console importer that takes a Trading Tracker
// (separate Claude Code project) localStorage dump and writes the
// equivalent records into WickCoach's wickcoach_trades key.
//
// Workflow:
//   1. In Trading Tracker tab, devtools console:
//        copy(JSON.stringify(JSON.parse(localStorage.getItem('trading-entries')||'[]')))
//      This copies the exported array to clipboard.
//   2. In WickCoach tab, devtools console: paste this entire script.
//   3. Paste clipboard contents in place of the empty [] on the
//      SOURCE_DATA line below.
//   4. Hit Enter. Inspect the summary log.
//   5. If happy, set DRY_RUN = false at the top, paste again, run.
//
// On commit (DRY_RUN = false), the script:
//   - backs up the current wickcoach_trades to a timestamped key (undo)
//   - writes mapped trades to wickcoach_trades
//   - sets wickcoach_trades_version so the demo-fake auto-seed in
//     app/page.tsx doesn't overwrite on reload
//   - clears wickcoach_trade_classifications + summary because the
//     AI cache references trade IDs that no longer exist after wipe
//
// ─── Source schema (Trading Tracker) ────────────────────────────────
//
//   { id, date, ticker, time, tradeType, event, location, state,
//     initialRisk, result, amount, rrRatio, notes }
//
// ─── Target schema (WickCoach Trade — see app/components/shared.ts) ─
//
//   { id, ticker, companyName, date, time, strategy, direction,
//     contracts, entryPrice, exitPrice, pl, plPercent, riskAmount,
//     riskReward, journal, screenshot?, aiScore?, result }
//
// ─── Field mapping decisions ────────────────────────────────────────
//
//   id           → id                            (UUID, direct)
//   date         → date                          ("YYYY-MM-DD", direct)
//   ticker       → ticker                        (uppercased)
//   time         → time                          (normalized — see below)
//   event        → strategy                      (closest analog)
//   initialRisk  → riskAmount                    (string $ → number)
//   result       → result                        (W/L/BE → WIN/LOSS/BREAKEVEN)
//   amount       → pl                            (sign reconstructed from result)
//   rrRatio      → riskReward                    ("1.68" → "1.68R", "0" → "0R")
//   notes        → journal                       (with metadata prefix)
//   tradeType    → journal prefix                ([Day · …])
//   location     → journal prefix                ([… · Loc: At · …])
//   state        → journal prefix                ([… · State: Neutral])
//   —            → companyName                   (empty; not in source)
//   —            → direction                     (LONG; user trades long options)
//   —            → contracts                     (0; not in source)
//   —            → entryPrice                    (0; not in source)
//   —            → exitPrice                     (0; not in source)
//   —            → plPercent                     (0; not in source)
//
// ─── Loss-sign reconstruction ───────────────────────────────────────
//
// Trading Tracker stores `amount` as positive magnitude for both wins
// and losses; the sign is implied by `result`. We apply Math.abs()
// first so a stray "-50" in the source doesn't double-flip into a
// fake win.
//
// ═══════════════════════════════════════════════════════════════════

const DRY_RUN = true;

const SOURCE_DATA = []; // ← PASTE EXPORTED ARRAY HERE

// ─── Helpers ────────────────────────────────────────────────────────

function normalizeTime(raw) {
  // Target output: "8:12 AM" / "2:30 PM" — matches the regex in
  // shared.ts parseHourBucket / parseHourNumber so this time string
  // round-trips through WickCoach's hourly-bucket analytics.
  //
  // Trading Tracker stores time free-form: "8:12", "14:30", "8:12am".
  // When AM/PM is explicit, normalize spacing/case and pass through.
  // When AM/PM is absent, infer per day-trader convention:
  //
  //   hour  0      → 12:MM AM   (early-morning, rare)
  //   hour  1- 6   → H:MM PM    (afternoon — 1:06, 2:30, 3:24)
  //   hour  7-11   → H:MM AM    (premarket / market open)
  //   hour 12      → 12:MM PM   (noon)
  //   hour 13-23   → H:MM PM    (24-hour input, subtract 12)
  if (!raw || typeof raw !== 'string') return '';
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!m) return raw.trim();
  const h = parseInt(m[1], 10);
  const min = m[2];
  const ap = (m[3] || '').toUpperCase();
  if (ap) return `${h}:${min} ${ap}`;
  if (h === 0)           return `12:${min} AM`;
  if (h >= 1 && h <= 6)  return `${h}:${min} PM`;
  if (h >= 7 && h <= 11) return `${h}:${min} AM`;
  if (h === 12)          return `12:${min} PM`;
  return `${h - 12}:${min} PM`;
}

function mapResult(r) {
  switch ((r || '').toUpperCase().trim()) {
    case 'W':  return 'WIN';
    case 'L':  return 'LOSS';
    case 'BE': return 'BREAKEVEN';
    default:   return 'BREAKEVEN';
  }
}

function mapRR(raw) {
  if (raw === null || raw === undefined) return '0R';
  const n = parseFloat(String(raw).trim());
  if (isNaN(n)) return '0R';
  return parseFloat(n.toFixed(2)) + 'R';
}

function parseDollar(raw) {
  if (raw === null || raw === undefined) return 0;
  const n = parseFloat(String(raw).replace(/[$,]/g, '').trim());
  return isNaN(n) ? 0 : n;
}

function buildJournal(e) {
  // Trading Tracker has 3 setup-context fields (tradeType / location /
  // state) that WickCoach's schema has no slot for. Rather than drop
  // them, prepend a one-line tag block above the original notes so
  // the structured setup info stays inspectable in the journal.
  const tags = [];
  if (e.tradeType) tags.push(e.tradeType);
  if (e.location)  tags.push(`Loc: ${e.location}`);
  if (e.state)     tags.push(`State: ${e.state}`);
  const prefix = tags.length ? `[${tags.join(' · ')}]\n\n` : '';
  return prefix + (e.notes || '');
}

// ─── Mapping ────────────────────────────────────────────────────────

const mapped = SOURCE_DATA.map((e, i) => ({
  id:          e.id || `imported-${Date.now()}-${i}`,
  ticker:      String(e.ticker || '').toUpperCase(),
  companyName: '',
  date:        String(e.date || ''),
  time:        normalizeTime(e.time),
  strategy:    String(e.event || ''),
  direction:   'LONG',
  contracts:   0,
  entryPrice:  0,
  exitPrice:   0,
  pl:          (e.result === 'L' ? -1 : 1) * Math.abs(parseDollar(e.amount)),
  plPercent:   0,
  riskAmount:  parseDollar(e.initialRisk),
  riskReward:  mapRR(e.rrRatio),
  journal:     buildJournal(e),
  result:      mapResult(e.result),
}));

// ─── Summary ────────────────────────────────────────────────────────

const wins   = mapped.filter(t => t.result === 'WIN');
const losses = mapped.filter(t => t.result === 'LOSS');
const bes    = mapped.filter(t => t.result === 'BREAKEVEN');

const sumPL = (arr) => arr.reduce((s, t) => s + t.pl, 0);
const winSum  = sumPL(wins);
const lossSum = sumPL(losses);
const beSum   = sumPL(bes);
const totalPL = winSum + lossSum + beSum;

// Hour-bucket distribution — quick sanity check on the time rule.
// A healthy day-trader distribution skews to 7-11 AM (open) and 1-3 PM
// (afternoon). If you see anomalous PM-side spikes at 4-5, those are
// the likely-misclassified pre-market entries to inspect.
const hourBucket = {};
mapped.forEach(t => {
  const m = (t.time || '').match(/^(\d{1,2}):\d{2}\s*(AM|PM)$/i);
  if (!m) { hourBucket['(unparsed)'] = (hourBucket['(unparsed)'] || 0) + 1; return; }
  let h = parseInt(m[1], 10);
  const ap = m[2].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  const key = `${String(h).padStart(2, '0')}:00`;
  hourBucket[key] = (hourBucket[key] || 0) + 1;
});

console.group('WickCoach import summary');
console.log('Input records :', SOURCE_DATA.length);
console.log('Mapped records:', mapped.length);
console.log('W / L / BE    :', `${wins.length} / ${losses.length} / ${bes.length}`);
console.log('Win rate      :', mapped.length ? ((wins.length / mapped.length) * 100).toFixed(1) + '%' : '—');
console.log('Wins total    : $' + winSum.toFixed(2));
console.log('Losses total  : $' + lossSum.toFixed(2));
console.log('BE total      : $' + beSum.toFixed(2));
console.log('Net P/L       : $' + totalPL.toFixed(2));
console.log('Avg win       : $' + (wins.length   ? (winSum  / wins.length).toFixed(2)   : '—'));
console.log('Avg loss      : $' + (losses.length ? (lossSum / losses.length).toFixed(2) : '—'));
console.log('Hour distribution (24h):');
console.table(hourBucket);
console.log('Sample wins   :');
console.log(wins.slice(0, 2));
console.log('Sample losses :');
console.log(losses.slice(0, 2));
console.groupEnd();

// ─── Write or dry-run ──────────────────────────────────────────────

if (DRY_RUN) {
  console.warn('DRY_RUN is true — nothing was written to localStorage.');
  console.warn('When ready, change DRY_RUN to false and run again.');
} else {
  const backupKey = `wickcoach_trades_backup_${Date.now()}`;
  const existing = localStorage.getItem('wickcoach_trades');
  if (existing) localStorage.setItem(backupKey, existing);
  localStorage.setItem('wickcoach_trades', JSON.stringify(mapped));
  localStorage.setItem('wickcoach_trades_version', 'v5');
  localStorage.removeItem('wickcoach_trade_classifications');
  localStorage.removeItem('wickcoach_classification_summary');
  console.log('Wrote', mapped.length, 'trades to wickcoach_trades.');
  if (existing) console.log('Backed up previous trades to', backupKey);
  console.log('Reload the page to see them in WickCoach.');
}
