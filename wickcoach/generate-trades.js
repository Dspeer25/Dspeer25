const fs = require('fs');

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const tickers = ['QQQ', 'NVDA', 'AAPL', 'TSLA', 'SPY', 'AMZN', 'META', 'MSFT', 'GOOGL', 'AMD', 'NFLX', 'BA', 'DIS', 'JPM', 'V', 'WMT', 'COIN'];

function pickStrategy() {
  const r = Math.random();
  if (r < 0.30) return '0DTE Call';
  if (r < 0.60) return '0DTE Put';
  if (r < 0.67) return 'Call Scalp';
  if (r < 0.74) return 'Put Scalp';
  if (r < 0.80) return 'Call Debit Spread';
  if (r < 0.86) return 'Put Debit Spread';
  if (r < 0.91) return 'Shares Long Swing';
  if (r < 0.96) return 'Shares Momentum';
  return 'Shares Breakout';
}

function isShares(s) { return s.startsWith('Shares'); }

// Generate placeholder candlestick chart SVGs
function generateChartSVG() {
  const numCandles = randInt(3, 5);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120"><rect width="200" height="120" fill="#13141a" rx="4"/>`;
  svg += `<line x1="10" y1="35" x2="190" y2="35" stroke="#1e1f2a" stroke-width="0.5"/>`;
  svg += `<line x1="10" y1="65" x2="190" y2="65" stroke="#1e1f2a" stroke-width="0.5"/>`;
  svg += `<line x1="10" y1="95" x2="190" y2="95" stroke="#1e1f2a" stroke-width="0.5"/>`;
  const spacing = 150 / (numCandles + 1);
  for (let i = 0; i < numCandles; i++) {
    const x = 25 + (i + 0.5) * spacing;
    const green = Math.random() > 0.45;
    const color = green ? '#00d4a0' : '#ef4444';
    const bodyTop = 20 + Math.random() * 40;
    const bodyH = 12 + Math.random() * 25;
    const wickTop = bodyTop - 4 - Math.random() * 10;
    const wickBot = bodyTop + bodyH + 4 + Math.random() * 10;
    const w = 8 + Math.random() * 6;
    svg += `<line x1="${x}" y1="${wickTop}" x2="${x}" y2="${wickBot}" stroke="${color}" stroke-width="1.5"/>`;
    svg += `<rect x="${x - w/2}" y="${bodyTop}" width="${w}" height="${bodyH}" fill="${color}" rx="1"/>`;
    // volume bars
    const volH = 4 + Math.random() * 12;
    svg += `<rect x="${x - w/2}" y="${115 - volH}" width="${w}" height="${volH}" fill="${color}" opacity="0.25" rx="1"/>`;
  }
  svg += `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
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
    'The 2min 20 EMA acted as a trampoline — price bounced right off it with volume. I was already in from the clearing bars signal. Rode it all the way to the gap fill target without hesitation.',
    'Spotted the power bar forming off VWAP before most people. The 5min 20 EMA was perfectly aligned with the 13min structure. Sized up because everything lined up, and it was the right call.',
    'MA squeeze was tightening on the 2min all morning. When it finally expanded I was ready. Entered on the first clearing bar and rode the momentum wave. Confidence was high today.',
  ],
  feb: [
    'Waited patiently for the color change on the 2min chart. Power bar off VWAP confirmed with 5min 20 EMA confluence. Textbook execution, defined risk.',
    'Clearing bars off the 2min 20 EMA confirmed direction. Entered at pre-planned level, trailed stop methodically. Zero emotions, pure process.',
    'Gap fill setup with the 2min 20 and 200 narrowing into a squeeze. Waited for the breakout confirmation before entering. Patient discipline.',
    'The 13min 20 EMA held as support perfectly. Entered on the bounce with the 5min confirming. Followed every rule in my playbook today.',
    'Halt trade — MA compressed from wide to narrow then expanded. Waited for the full signal. Clean entry, clean exit, clean mind.',
    'Power bar off VWAP with the 2min 20 and 200 EMA both supporting. Risk was defined, position sized correctly. Let the edge play out.',
    'Identified the 2min chart color change early and waited for the clearing bars to confirm before entering. The gap fill to halfway played out exactly as planned. Process over outcome.',
    'The 5min and 13min 20 EMA confluence gave me a high-probability setup. Entered with proper position size, set my stop at the defined level, and let the trade work. No anxiety, just execution.',
    'Noticed the MA squeeze tightening on the 2min chart during the first hour. Waited for the expansion signal, entered on the clearing bar with defined risk. Trailed my stop per the rules and locked in profit.',
  ],
  mar: [
    'Good read on the 2min color change. The clearing bars were clean. Almost did not take it because I was frustrated from yesterday, but I followed my rules.',
    'Power bar off VWAP played out nicely. I stuck to my process this time after revenge trading earlier in the week. Progress feels good.',
    'Clearing bars off the 2min 20 EMA with 5min and 13min confluence. Hesitated on entry due to recent losing streak but glad I took it.',
    'The gap fill to halfway point was there. Took the trade despite shaky confidence from two straight losses. Trusting the process works.',
    'Halt trade setup confirmed with the MA squeeze expanding. The 2min 20 and 200 were narrowing perfectly. Starting to rebuild trust in myself.',
    'Color change confirmed on 2min chart. Power bar off VWAP provided clean entry. Executed well despite wanting to skip after getting stopped out earlier.',
    'The 2min 20 EMA was holding perfectly as dynamic support all morning. Waited for the clearing bars to confirm, then took the trade with defined risk. Still fighting some hesitation from last week but pushed through.',
    'Saw the gap fill setup developing early. The 5min and 13min 20 EMA both confirmed the direction. Entered with smaller size because my confidence is still recovering, but at least I took the trade.',
    'MA squeeze expanded beautifully on the 2min chart. The power bar off VWAP was clean. I almost talked myself out of it because of my recent losses but followed the playbook. Discipline is slowly returning.',
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
    'Entered before the clearing bars completed because I was impatient. The 2min 20 EMA was flat, not supporting the direction I wanted. Forced the trade instead of waiting for the setup.',
    'Took a position right into the 13min 20 EMA resistance without waiting for a break. The 5min chart was showing weakness but I ignored it because I wanted to be right. Ego over process.',
    'Saw the power bar forming off VWAP and jumped in before volume confirmed. The move reversed immediately and I froze instead of cutting. Held through a stop level I already defined.',
  ],
  feb: [
    'Waited for the 2min color change but the signal failed at the 5min 20 EMA. Risk was defined and I took the loss cleanly. No regrets on execution.',
    'Power bar off VWAP looked good but the 13min structure was against me. Stopped out at my pre-planned level. Process was sound, outcome was not.',
    'Clearing bars off the 2min 20 EMA set up but volume dried up at the halfway gap fill target. Small loss, stayed within risk parameters.',
    'The 2min 20 and 200 were narrow suggesting a squeeze, but it broke the wrong direction. Took the loss per my rules immediately.',
    'Gap fill to halfway point failed when the 5min 20 EMA rejected the move. Cut the loss quickly. Discipline intact, just a losing trade.',
    'Halt trade did not trigger the expansion I expected. The MA started widening again. Cut it fast when my thesis was invalidated.',
    'The clearing bars off the 2min 20 EMA looked good but the overall market context was wrong. The 13min chart was trending against my trade. Accepted the loss at my predefined stop.',
    'Power bar off VWAP set up but failed at the gap fill resistance level. The 5min 20 EMA flattened out which should have been a warning. Took the loss cleanly and moved on.',
    'Entered on the MA squeeze expansion but the follow-through was weak. The 2min 200 EMA acted as a ceiling. Cut the position per my rules when it failed to make new highs.',
  ],
  mar: [
    'Revenge traded after my morning loss. Ignored the 2min 20 EMA signal and the clearing bars said wait. Paid for it. Need to stop this destructive pattern.',
    'Color change on the 2min looked right but I was trading from frustration not analysis. Position size was too big, loss was 2x what it should have been.',
    'Took a spite trade against the trend after getting stopped out. The 5min and 13min 20 EMA were both clearly resistance. Emotional garbage decision.',
    'Good setup on the gap fill but I moved my stop wider because I was desperate to make back my losses. Classic mistake, classic consequence.',
    'The clearing bars off the 2min 20 EMA were there but I was shaken. Hesitated, then chased late into the move. Bad timing, bad headspace.',
    'Power bar off VWAP set up but I added to the position out of frustration when it stalled. When it reversed the loss was double my planned risk.',
    'Saw the 2min color change but entered before the clearing bars finished because I was anxious about missing the move. The 5min 20 EMA rejected it and I held hoping for a reversal.',
    'MA squeeze expansion looked promising but I sized up 3x my normal because I was trying to dig out of the hole from this week. The trade went against me and the outsized loss put me deeper.',
    'Ignored my own rule about waiting for 5min and 13min 20 EMA confluence. Took the trade on the 2min signal alone because I was frustrated and impatient.',
  ],
};

const breakEvenJournals = {
  jan: [
    'Entered on the 2min color change but got chopped in the noise around the 5min 20 EMA. Managed to scratch it even. More luck than skill today.',
    'Power bar off VWAP but the move stalled at the halfway gap fill. Closed flat because sitting in chop was driving me crazy. Impatient exit.',
    'The clearing bars set up on the 2min 20 EMA but volume disappeared. Price just sat there doing nothing. Closed at breakeven to preserve capital.',
  ],
  feb: [
    'Waited for clearing bars off the 2min 20 EMA. Trade went my way then reversed at the 13min resistance. Moved stop to breakeven, it triggered. Good risk management.',
    'Gap fill setup played out to my entry but stalled. The 2min 20 and 200 started narrowing. Closed flat when momentum died. Disciplined decision.',
    'Halt trade setup with the MA squeezing but the breakout had no follow through on the 5min. Scratched at entry. Better to preserve capital.',
    'Power bar off VWAP confirmed with the 2min color change but the 13min 20 EMA acted as a wall. Moved stop to breakeven when momentum stalled. Smart capital preservation.',
  ],
  mar: [
    'Took the trade on the 5min and 13min confluence but panicked when it dipped to the 2min 200 EMA. Closed at breakeven instead of giving it room. Fear-based exit.',
    'Good entry on the halt trade setup but my confidence was shot from recent losses. Closed flat when it stalled. Probably left money on the table.',
    'Color change confirmed on the 2min chart with clearing bars. Exited at breakeven when I saw the 5min 20 EMA flattening. Mixed feelings about bailing early.',
    'The gap fill to halfway was developing but I could feel my anxiety building from the losing streak. Moved to breakeven the moment price came back to my entry. Playing scared right now.',
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
  const shares = isShares(strategy);
  const contracts = shares
    ? Math.floor(rand(50, 500) / 10) * 10
    : Math.floor(rand(1, 15)) + 1;
  const entryPrice = shares
    ? parseFloat(rand(50, 500).toFixed(2))
    : parseFloat(rand(0.50, 12.00).toFixed(2));
  const riskAmount = Math.round(rand(435, 565)); // avg $500, +/-13%

  let pl, rr, exitPrice;

  if (outcome === 'WIN') {
    // R:R biased toward 2.0-2.5, targeting avg ~2.04, median ~2.17
    rr = parseFloat((Math.random() < 0.6 ? rand(1.8, 2.5) : rand(1.4, 3.0)).toFixed(1));
    pl = parseFloat((riskAmount * rr).toFixed(2));
    const multiplier = shares ? 1 : 100;
    const diff = pl / (contracts * multiplier);
    exitPrice = direction === 'LONG'
      ? parseFloat((entryPrice + diff).toFixed(2))
      : parseFloat((entryPrice - diff).toFixed(2));
  } else if (outcome === 'LOSS') {
    rr = parseFloat(rand(0.4, 1.0).toFixed(1));
    pl = parseFloat((-riskAmount).toFixed(2));
    const multiplier = shares ? 1 : 100;
    const diff = riskAmount / (contracts * multiplier);
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

  // Attach placeholder screenshot SVG ~40% of the time
  if (Math.random() < 0.4) {
    trade.screenshot = generateChartSVG();
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
const sharesTrades = trades.filter(t => isShares(t.strategy));

fs.writeFileSync('./public/fake-trades.json', JSON.stringify(trades, null, 2));
console.log(`Generated ${trades.length} trades -> public/fake-trades.json`);
console.log(`  Wins: ${wins} | Losses: ${losses} | Breakeven: ${breakevens}`);
console.log(`  Win Rate: ${winRate}% (target: 46%)`);
console.log(`  Total P/L: $${totalPL.toFixed(2)} (should be positive)`);
console.log(`  Avg Winner R:R: ${avgRR} (target: ~2.04)`);
console.log(`  Median Winner R:R: ${medianRR} (target: ~2.17)`);
console.log(`  Screenshots attached: ${trades.filter(t => t.screenshot).length}`);
console.log(`  Shares trades: ${sharesTrades.length}`);
