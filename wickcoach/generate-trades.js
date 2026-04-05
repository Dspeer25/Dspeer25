const fs = require('fs');

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

// Journals by month sentiment
const winJournals = {
  jan: [
    'Saw the color change on the 2min chart and jumped in immediately. Felt invincible today, took a bigger size than planned but it worked out.',
    'Power bar off VWAP confirmed the move. I went full send on this one, no hesitation. Confidence was through the roof.',
    'Clearing bars off the 2min 20 EMA looked textbook. Didnt wait for full confirmation but the momentum carried it. Lucky or skilled? Both.',
    'Gap fill to the halfway point played out perfectly. I sized up because I just knew this was going to work. Impulsive but profitable.',
    '5min and 13min 20 EMA confluence was clean. I added to the position aggressively on the pullback. Felt unstoppable today.',
    'The 2min 20 and 200 were wide, giving plenty of room to run. Entered early before the signal fully formed but it didnt matter.',
  ],
  feb: [
    'Waited patiently for the color change on the 2min chart before entering. Risk was defined, followed the plan exactly as written.',
    'Power bar off VWAP with the 5min 20 EMA as confluence. Textbook entry, textbook exit. Stayed disciplined on size.',
    'Clearing bars off the 2min 20 EMA confirmed direction. Took the trade at my pre-planned level and let it work. No emotions.',
    'Gap fill setup with the 2min 20 and 200 narrowing. Waited for the squeeze breakout confirmation. Patient execution paid off.',
    '13min 20 EMA held as support perfectly. Entered on the bounce with defined risk. Followed every rule in my playbook today.',
    'Halt trade setup — MA went from wide to narrow and I waited for the expansion. Clean entry, trailed stop methodically.',
  ],
  mar: [
    'Good read on the 2min color change. Took the entry clean, but almost didnt because I was still frustrated from yesterday loss.',
    'Power bar off VWAP played out. I followed my rules this time after revenge trading earlier in the week. Progress.',
    'Clearing bars off the 2min 20 EMA. Solid setup but I hesitated on entry because of my recent losing streak. Still caught the move.',
    '5min and 13min confluence was there. I took the trade even though my confidence was shaky from two straight losses. Glad I did.',
    'The 2min 20 and 200 were narrowing perfectly. Took the breakout clean. Starting to rebuild trust in my process after a rough week.',
    'Halt trade setup confirmed with the MA squeeze. Executed well despite wanting to skip it after getting stopped out twice today.',
  ],
};

const lossJournals = {
  jan: [
    'Saw the color change on the 2min but it was a fake signal. Didnt wait for confirmation because I was too eager. Paid the price.',
    'Tried to front-run the power bar off VWAP. The 2min 20 and 200 were too wide for this setup. Overconfident and reckless.',
    'FOMO entry after watching it run. No clearing bars, no confirmation. Just chased it because I was afraid to miss the move.',
    'Revenge trade after my last loss. Ignored the 5min 20 EMA resistance. Let emotions drive the decision completely.',
    'Doubled down on a losing position because I was sure it would bounce off the 13min 20 EMA. Stubborn and undisciplined.',
    'Gap fill setup but I entered on the wrong side. Was too impulsive to check the 2min chart direction. Careless mistake.',
  ],
  feb: [
    'Waited for the 2min color change but the signal failed. Risk was defined and I took the loss cleanly. Moved on.',
    'Power bar off VWAP looked good but the 5min 20 EMA rejected the move. Accepted the loss, plan was sound.',
    'Clearing bars off the 2min 20 EMA set up but volume dried up. Stopped out at my pre-defined level. No regrets on execution.',
    'The 2min 20 and 200 were narrow suggesting a squeeze, but it broke the wrong way. Took the loss per my rules.',
    'Gap fill to halfway point failed. The 13min structure was against me. Small loss, stayed within risk parameters.',
    'Halt trade didnt trigger the expansion I expected. Cut the loss quickly when the MA started widening again.',
  ],
  mar: [
    'Revenge traded after my morning loss. Ignored the 2min 20 EMA signal and paid for it. Need to stop this pattern.',
    'Color change on the 2min looked right but I was trading out of frustration. Size was too big. Loss was bigger than it should have been.',
    'Took a spite trade against the trend after getting stopped out. The 5min 20 EMA was clearly resistance. Emotional decision.',
    'Good setup on the gap fill but I moved my stop because I was desperate to make back my losses. Classic mistake.',
    'The clearing bars were there but I was shaken from a losing streak. Hesitated, then chased late. Bad timing, bad headspace.',
    'Power bar off VWAP but I added to the position out of frustration. When it reversed, the loss was 2x what it should have been.',
  ],
};

const breakevenJournals = {
  jan: [
    'Entered on the 2min color change but got chopped up. Managed to scratch the trade even. Got lucky it came back.',
    'Power bar off VWAP but the move stalled. Exited flat because I didnt want to sit in chop. Should have been more patient.',
  ],
  feb: [
    'Waited for clearing bars off the 2min 20 EMA. Trade went my way then reversed. Moved stop to breakeven and it triggered. Good risk management.',
    'Gap fill setup played out to my entry but stalled at the halfway point. Closed flat when momentum died. Disciplined exit.',
    'The 2min 20 and 200 were narrowing but the breakout had no follow through. Scratched the trade at entry. Right call.',
  ],
  mar: [
    'Took the trade on the 5min confluence but panicked when it dipped. Closed at breakeven instead of giving it room. Fear-based decision.',
    'Good entry on the halt trade setup but I was nervous from recent losses. Closed flat when it stalled. Probably left money on the table.',
    'Color change confirmed on 2min but I took profits too early at breakeven. The move continued without me. Mixed feelings.',
  ],
};

// Read screenshots directory
let screenshots = [];
const ssDir = './public/trade-screenshots';
if (fs.existsSync(ssDir)) {
  screenshots = fs.readdirSync(ssDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
}

// Build outcomes array: exactly 92 WIN, 28 BREAKEVEN, 80 LOSS
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
  if (outcome === 'WIN') {
    const pool = winJournals[month] || winJournals.mar;
    return pool[Math.floor(Math.random() * pool.length)];
  } else if (outcome === 'LOSS') {
    const pool = lossJournals[month] || lossJournals.mar;
    return pool[Math.floor(Math.random() * pool.length)];
  } else {
    const pool = breakevenJournals[month] || breakevenJournals.mar;
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

function randomDate() {
  // Jan 2 2026 through Mar 31 2026
  const start = new Date('2026-01-02');
  const end = new Date('2026-03-31');
  const diff = end.getTime() - start.getTime();
  const d = new Date(start.getTime() + Math.floor(Math.random() * diff));
  // Skip weekends
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
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
  const riskAmount = Math.round(rand(435, 565));

  let pl, rr, exitPrice;

  if (outcome === 'WIN') {
    // R:R biased toward 2.0-2.5, avg ~2.04
    rr = parseFloat((Math.random() < 0.6 ? rand(1.8, 2.5) : rand(1.4, 3.0)).toFixed(1));
    pl = parseFloat((riskAmount * rr).toFixed(2));
    const diff = pl / (contracts * 100);
    exitPrice = direction === 'LONG'
      ? parseFloat((entryPrice + diff).toFixed(2))
      : parseFloat((entryPrice - diff).toFixed(2));
  } else if (outcome === 'LOSS') {
    rr = parseFloat(rand(0.3, 1.0).toFixed(1));
    pl = -riskAmount;
    const diff = Math.abs(pl) / (contracts * 100);
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
    result: outcome === 'BREAKEVEN' ? 'WIN' : outcome, // breakeven counts as WIN for result field
  };

  if (screenshots.length > 0 && Math.random() < 0.4) {
    const ssFile = screenshots[Math.floor(Math.random() * screenshots.length)];
    trade.screenshot = `/trade-screenshots/${encodeURIComponent(ssFile)}`;
  }

  trades.push(trade);
}

// Sort by date
trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

const wins = trades.filter(t => t.pl > 0).length;
const losses = trades.filter(t => t.pl < 0).length;
const breakevens = trades.filter(t => t.pl === 0).length;
const winRRs = trades.filter(t => t.pl > 0).map(t => parseFloat(t.riskReward.split(':')[1]));
const avgRR = winRRs.length > 0 ? (winRRs.reduce((a, b) => a + b, 0) / winRRs.length).toFixed(2) : 0;
const medianRR = winRRs.sort((a, b) => a - b)[Math.floor(winRRs.length / 2)];

fs.writeFileSync('./public/fake-trades.json', JSON.stringify(trades, null, 2));
console.log(`Generated ${trades.length} trades → public/fake-trades.json`);
console.log(`  Wins: ${wins} | Losses: ${losses} | Breakeven: ${breakevens}`);
console.log(`  Total P/L: $${totalPL.toFixed(2)}`);
console.log(`  Avg Winner R:R: ${avgRR} | Median Winner R:R: ${medianRR}`);
console.log(`  Win Rate: ${((wins / trades.length) * 100).toFixed(1)}%`);
