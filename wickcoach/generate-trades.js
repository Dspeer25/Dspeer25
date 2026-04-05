const fs = require('fs');
const path = require('path');

function rand(min, max) { return Math.random() * (max - min) + min; }

const tickers = ['QQQ', 'NVDA', 'AAPL', 'TSLA', 'SPY', 'AMZN', 'META', 'MSFT', 'GOOGL', 'AMD', 'NFLX', 'BA', 'DIS', 'JPM', 'V', 'WMT', 'COIN'];

function pickStrategy() {
  const r = Math.random();
  if (r < 0.35) return '0DTE Call';
  if (r < 0.70) return '0DTE Put';
  if (r < 0.775) return 'Call Scalp';
  if (r < 0.85) return 'Put Scalp';
  if (r < 0.925) return 'Call Debit Spread';
  return 'Put Debit Spread';
}

// Read screenshots
let screenshots = [];
const ssDir = './public/trade-screenshots';
if (fs.existsSync(ssDir)) {
  screenshots = fs.readdirSync(ssDir).filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
  console.log(`Found ${screenshots.length} screenshots in ${ssDir}`);
}

// WIN journals by month
const winJournals = {
  jan: [
    'Saw color change on the 2min chart and jumped in fast. Power bar off VWAP confirmed the direction. Felt invincible, sized up bigger than planned but it paid off.',
    'Clearing bars off the 2min 20 EMA looked textbook. The 5min and 13min 20 EMA confluence was clean. Went full send, no hesitation.',
    'Gap fill to the halfway point played out perfectly. The 2min 20 and 200 were wide giving room to run. Added aggressively on the pullback.',
    'Halt trade setup — MA went from wide to narrow then expanded hard. Entered early before full confirmation but momentum carried it through.',
    'Power bar off VWAP with the 13min structure supporting. Doubled my normal size because I felt unstoppable today. Lucky and skilled.',
    'Color change on the 2min with clearing bars off the 20 EMA. The gap fill target was obvious. Took the trade with maximum conviction.',
  ],
  feb: [
    'Waited patiently for the color change on the 2min chart. Power bar off VWAP confirmed with 5min 20 EMA confluence. Textbook execution, defined risk.',
    'Clearing bars off the 2min 20 EMA confirmed direction. Entered at pre-planned level, trailed stop methodically. Zero emotions, pure process.',
    'Gap fill setup with the 2min 20 and 200 narrowing into a squeeze. Waited for the breakout confirmation before entering. Patient discipline.',
    'The 13min 20 EMA held as support perfectly. Entered on the bounce with the 5min confirming. Followed every rule in my playbook today.',
    'Halt trade — MA compressed from wide to narrow then expanded. Waited for the full signal. Clean entry, clean exit, clean mind.',
    'Power bar off VWAP with the 2min 20 and 200 EMA both supporting. Risk was defined, position sized correctly. Let the edge play out.',
  ],
  mar: [
    'Good read on the 2min color change. The clearing bars were clean. Almost did not take it because I was frustrated from yesterday, but I followed my rules.',
    'Power bar off VWAP played out nicely. I stuck to my process this time after revenge trading earlier in the week. Progress feels good.',
    'Clearing bars off the 2min 20 EMA with 5min and 13min confluence. Hesitated on entry due to recent losing streak but glad I took it.',
    'The gap fill to halfway point was there. Took the trade despite shaky confidence from two straight losses. Trusting the process works.',
    'Halt trade setup confirmed with the MA squeeze expanding. The 2min 20 and 200 were narrowing perfectly. Starting to rebuild trust in myself.',
    'Color change confirmed on 2min chart. Power bar off VWAP provided clean entry. Executed well despite wanting to skip after getting stopped out earlier.',
  ],
};

const lossJournals = {
  jan: [
    'Saw the color change on the 2min but it was a fake signal. The 2min 20 and 200 were too wide for this setup. Did not wait for clearing bars — too eager.',
    'Tried to front-run the power bar off VWAP before it formed. Ignored that the 5min 20 EMA was acting as resistance. Overconfident and reckless entry.',
    'FOMO entry after watching it run past my level. No clearing bars, no 2min confirmation. Just chased because I was afraid to miss the move.',
    'Revenge trade after my last loss wiped out my morning gains. Ignored the 13min 20 EMA resistance completely. Let emotions drive everything.',
    'Doubled down on a losing position because I was sure it would bounce off the 2min 200 EMA. Stubborn. Should have taken the initial stop.',
    'Gap fill setup but entered on the wrong side. Was too impulsive to check the 2min color change direction. Sloppy, careless mistake.',
  ],
  feb: [
    'Waited for the 2min color change but the signal failed at the 5min 20 EMA. Risk was defined and I took the loss cleanly. No regrets on execution.',
    'Power bar off VWAP looked good but the 13min structure was against me. Stopped out at my pre-planned level. Process was sound, outcome was not.',
    'Clearing bars off the 2min 20 EMA set up but volume dried up at the halfway gap fill target. Small loss, stayed within risk parameters.',
    'The 2min 20 and 200 were narrow suggesting a squeeze, but it broke the wrong direction. Took the loss per my rules immediately.',
    'Gap fill to halfway point failed when the 5min 20 EMA rejected the move. Cut the loss quickly. Discipline intact, just a losing trade.',
    'Halt trade did not trigger the expansion I expected. The MA started widening again. Cut it fast when my thesis was invalidated.',
  ],
  mar: [
    'Revenge traded after my morning loss. Ignored the 2min 20 EMA signal and the clearing bars said wait. Paid for it. Need to stop this destructive pattern.',
    'Color change on the 2min looked right but I was trading from frustration not analysis. Position size was too big, loss was 2x what it should have been.',
    'Took a spite trade against the trend after getting stopped out. The 5min and 13min 20 EMA were both clearly resistance. Emotional garbage decision.',
    'Good setup on the gap fill but I moved my stop wider because I was desperate to make back my losses. Classic mistake, classic consequence.',
    'The clearing bars off the 2min 20 EMA were there but I was shaken. Hesitated, then chased late into the move. Bad timing, bad headspace.',
    'Power bar off VWAP set up but I added to the position out of frustration when it stalled. When it reversed the loss was double my planned risk.',
  ],
};

const breakEvenJournals = {
  jan: [
    'Entered on the 2min color change but got chopped in the noise around the 5min 20 EMA. Managed to scratch it even. More luck than skill today.',
    'Power bar off VWAP but the move stalled at the halfway gap fill. Closed flat because sitting in chop was driving me crazy. Impatient exit.',
  ],
  feb: [
    'Waited for clearing bars off the 2min 20 EMA. Trade went my way then reversed at the 13min resistance. Moved stop to breakeven, it triggered. Good risk management.',
    'Gap fill setup played out to my entry but stalled. The 2min 20 and 200 started narrowing. Closed flat when momentum died. Disciplined decision.',
    'Halt trade setup with the MA squeezing but the breakout had no follow through on the 5min. Scratched at entry. Better to preserve capital.',
  ],
  mar: [
    'Took the trade on the 5min and 13min confluence but panicked when it dipped to the 2min 200 EMA. Closed at breakeven instead of giving it room. Fear-based exit.',
    'Good entry on the halt trade setup but my confidence was shot from recent losses. Closed flat when it stalled. Probably left money on the table.',
    'Color change confirmed on the 2min chart with clearing bars. Exited at breakeven when I saw the 5min 20 EMA flattening. Mixed feelings about bailing early.',
  ],
};

// Outcomes: exactly 92 WIN, 28 BREAKEVEN, 80 LOSS = 200 total
// Win rate = 92/200 = 46%
const outcomes = [];
for (let i = 0; i < 92; i++) outcomes.push('WIN');
for (let i = 0; i < 28; i++) outcomes.push('BREAKEVEN');
for (let i = 0; i < 80; i++) outcomes.push('LOSS');
// Shuffle
for (let i = outcomes.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [outcomes[i], outcomes[j]] = [outcomes[j], outcomes[i]];
}

function getMonth(dateStr) {
  const m = new Date(dateStr).getMonth();
  if (m === 0) return 'jan';
  if (m === 1) return 'feb';
  return 'mar';
}

function pickJournal(outcome, month) {
  const pools = { WIN: winJournals, LOSS: lossJournals, BREAKEVEN: breakEvenJournals };
  const pool = pools[outcome][month] || pools[outcome].mar;
  return pool[Math.floor(Math.random() * pool.length)];
}

function randomDate() {
  const start = new Date('2026-01-02');
  const end = new Date('2026-03-31');
  const diff = end.getTime() - start.getTime();
  const d = new Date(start.getTime() + Math.floor(Math.random() * diff));
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function randomTime() {
  const h = 9 + Math.floor(Math.random() * 7);
  const m = Math.floor(Math.random() * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

const trades = [];
let totalPL = 0;

for (let i = 0; i < 200; i++) {
  const outcome = outcomes[i];
  const ticker = tickers[Math.floor(Math.random() * tickers.length)];
  const strategy = pickStrategy();
  const direction = Math.random() < 0.5 ? 'LONG' : 'SHORT';
  const contracts = Math.floor(rand(1, 15)) + 1;
  const entryPrice = parseFloat(rand(0.50, 12.00).toFixed(2));
  const riskAmount = Math.round(rand(435, 565)); // avg $500, ±13%

  let pl, rr, exitPrice;

  if (outcome === 'WIN') {
    // R:R biased toward 2.0-2.5, targeting avg ~2.04, median ~2.17
    rr = parseFloat((Math.random() < 0.6 ? rand(1.8, 2.5) : rand(1.4, 3.0)).toFixed(1));
    pl = parseFloat((riskAmount * rr).toFixed(2));
    const diff = pl / (contracts * 100);
    exitPrice = direction === 'LONG'
      ? parseFloat((entryPrice + diff).toFixed(2))
      : parseFloat((entryPrice - diff).toFixed(2));
  } else if (outcome === 'LOSS') {
    rr = parseFloat(rand(0.4, 1.0).toFixed(1));
    pl = parseFloat((-riskAmount).toFixed(2));
    const diff = riskAmount / (contracts * 100);
    exitPrice = direction === 'LONG'
      ? parseFloat((entryPrice - diff).toFixed(2))
      : parseFloat((entryPrice + diff).toFixed(2));
  } else {
    // BREAKEVEN
    rr = 0;
    pl = 0;
    exitPrice = entryPrice;
  }

  if (exitPrice < 0.01) exitPrice = 0.01;
  totalPL += pl;

  const date = randomDate();
  const month = getMonth(date);
  const plPercent = entryPrice > 0 ? parseFloat(((exitPrice - entryPrice) / entryPrice * 100 * (direction === 'SHORT' ? -1 : 1)).toFixed(2)) : 0;

  const trade = {
    id: `fake-${i}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    ticker,
    companyName: ticker,
    date,
    time: randomTime(),
    strategy,
    direction,
    contracts,
    entryPrice,
    exitPrice,
    pl,
    plPercent,
    riskAmount,
    riskReward: outcome === 'BREAKEVEN' ? '1:0.0' : `1:${rr}`,
    journal: pickJournal(outcome, month),
    aiScore: Math.floor(rand(60, 100)),
    result: outcome === 'BREAKEVEN' ? 'BREAKEVEN' : outcome,
  };

  // Attach screenshot if available
  if (screenshots.length > 0 && Math.random() < 0.4) {
    const ssFile = screenshots[Math.floor(Math.random() * screenshots.length)];
    trade.screenshot = `/trade-screenshots/${encodeURIComponent(ssFile)}`;
  }

  trades.push(trade);
}

// Sort by date
trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

// Verify stats
const wins = trades.filter(t => t.pl > 0).length;
const losses = trades.filter(t => t.pl < 0).length;
const breakevens = trades.filter(t => t.pl === 0).length;
const winRate = ((wins / trades.length) * 100).toFixed(1);
const winRRs = trades.filter(t => t.pl > 0).map(t => parseFloat(t.riskReward.split(':')[1]));
const avgRR = winRRs.length > 0 ? (winRRs.reduce((a, b) => a + b, 0) / winRRs.length).toFixed(2) : '0';
const sortedRR = winRRs.slice().sort((a, b) => a - b);
const medianRR = sortedRR[Math.floor(sortedRR.length / 2)];

fs.writeFileSync('./public/fake-trades.json', JSON.stringify(trades, null, 2));
console.log(`Generated ${trades.length} trades → public/fake-trades.json`);
console.log(`  Wins: ${wins} | Losses: ${losses} | Breakeven: ${breakevens}`);
console.log(`  Win Rate: ${winRate}% (target: 46%)`);
console.log(`  Total P/L: $${totalPL.toFixed(2)} (should be positive)`);
console.log(`  Avg Winner R:R: ${avgRR} (target: ~2.04)`);
console.log(`  Median Winner R:R: ${medianRR} (target: ~2.17)`);
console.log(`  Screenshots attached: ${trades.filter(t => t.screenshot).length}`);
