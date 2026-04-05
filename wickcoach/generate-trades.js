const fs = require('fs');

const tickers = ['QQQ', 'NVDA', 'AAPL', 'TSLA', 'SPY', 'AMZN', 'META', 'MSFT', 'GOOGL', 'AMD', 'NFLX', 'BA', 'DIS', 'JPM', 'V', 'WMT', 'COIN'];
const strategies = ['0DTE Call', '0DTE Put', 'Call Scalp', 'Put Scalp', 'Call Debit Spread', 'Put Debit Spread', 'Put Credit Spread', 'Call Credit Spread', 'Iron Condor'];
const directions = ['LONG', 'SHORT'];
const journals = [
  'Waited for VWAP reclaim before entry. Clean setup.',
  'Took the trade too early, should have waited for confirmation.',
  'Perfect execution on the breakdown. Followed rules.',
  'Revenge trade after a loss. Need to be more disciplined.',
  'Size was right, entry was clean. Let the trade work.',
  'Got shaken out on a wick. Need wider stops.',
  'Scaled in at support. Good patience.',
  'FOMO entry, chased the move. Bad decision.',
  'Pre-market plan executed perfectly.',
  'Held too long, gave back profits. Set tighter targets.',
  'Textbook setup. Identified the pattern and waited.',
  'Overtraded today. This was trade #5, should have stopped at 3.',
  'Good read on volume. Entry confirmed by tape.',
  'Emotional entry after watching it run without me.',
  'Risk was defined, followed the plan. Accepted the outcome.',
  'Broke my own rules on position size. Too much risk.',
  'Clean break of resistance. Trailed stop well.',
  'Should have taken profits at first target.',
  'Solid R:R setup. Let the edge play out.',
  'Choppy day, probably should have sat out.',
];

function randomDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d.toISOString().split('T')[0];
}

function randomTime() {
  const h = 9 + Math.floor(Math.random() * 7); // 9-15
  const m = Math.floor(Math.random() * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

const trades = [];
for (let i = 0; i < 200; i++) {
  const ticker = tickers[Math.floor(Math.random() * tickers.length)];
  const strategy = strategies[Math.floor(Math.random() * strategies.length)];
  const direction = directions[Math.floor(Math.random() * directions.length)];
  const contracts = Math.floor(Math.random() * 20) + 1;
  const entryPrice = parseFloat((Math.random() * 15 + 0.5).toFixed(2));
  const multiplier = strategy.includes('Spread') || strategy === 'Iron Condor' ? 100 : 100;

  // Win rate ~55%
  const isWin = Math.random() < 0.55;
  let exitPrice;
  if (direction === 'LONG') {
    exitPrice = isWin
      ? parseFloat((entryPrice * (1 + Math.random() * 0.8 + 0.05)).toFixed(2))
      : parseFloat((entryPrice * (1 - Math.random() * 0.5 - 0.05)).toFixed(2));
  } else {
    exitPrice = isWin
      ? parseFloat((entryPrice * (1 - Math.random() * 0.5 - 0.02)).toFixed(2))
      : parseFloat((entryPrice * (1 + Math.random() * 0.8 + 0.05)).toFixed(2));
  }
  if (exitPrice < 0.01) exitPrice = 0.01;

  const diff = direction === 'SHORT'
    ? entryPrice - exitPrice
    : exitPrice - entryPrice;
  const pl = parseFloat((diff * contracts * multiplier).toFixed(2));
  const riskAmount = parseFloat((entryPrice * contracts * multiplier * (Math.random() * 0.3 + 0.1)).toFixed(2));
  const rr = riskAmount > 0 ? (Math.abs(pl) / riskAmount).toFixed(1) : '0.0';
  const plPercent = parseFloat(((diff / entryPrice) * 100).toFixed(2));

  trades.push({
    id: `fake-${i}-${Date.now()}`,
    ticker,
    companyName: ticker,
    date: randomDate(90),
    time: randomTime(),
    strategy,
    direction,
    contracts,
    entryPrice,
    exitPrice,
    pl,
    plPercent,
    riskAmount,
    riskReward: `1:${rr}`,
    journal: journals[Math.floor(Math.random() * journals.length)],
    aiScore: Math.floor(Math.random() * 40) + 60,
    result: pl >= 0 ? 'WIN' : 'LOSS',
  });
}

fs.writeFileSync('./public/fake-trades.json', JSON.stringify(trades, null, 2));
console.log(`Generated ${trades.length} fake trades → public/fake-trades.json`);
