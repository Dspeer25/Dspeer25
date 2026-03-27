import { Trade, UserSettings, DailyJournalEntry } from './types';

// ─── Trades ───

export async function getTrades(): Promise<Trade[]> {
  const res = await fetch('/api/trades');
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((row: Record<string, unknown>) => ({
    id: row.id,
    date: (row.date as string)?.split('T')[0] || row.date,
    ticker: row.ticker,
    time: row.time,
    tradeType: row.trade_type,
    direction: row.direction || 'Long',
    entryPrice: Number(row.entry_price) || 0,
    exitPrice: Number(row.exit_price) || 0,
    positionSize: Number(row.position_size) || 0,
    initialRisk: Number(row.initial_risk),
    result: row.result,
    dollarPnl: Number(row.dollar_pnl),
    rr: Number(row.rr),
    notes: row.notes || '',
    starred: row.starred || false,
    grade: row.grade || '',
    customFields: (row.custom_fields as Record<string, string>) || {},
  })) as Trade[];
}

export async function addTrade(trade: Omit<Trade, 'id'>): Promise<Trade | null> {
  const res = await fetch('/api/trades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(trade),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function updateTrade(trade: Trade): Promise<void> {
  await fetch('/api/trades', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(trade),
  });
}

export async function deleteTrade(id: string): Promise<void> {
  await fetch('/api/trades', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
}

// ─── Settings ───

export async function getSettings(): Promise<UserSettings> {
  const res = await fetch('/api/settings');
  if (!res.ok) return defaultSettings;
  return res.json();
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
}

// ─── Journal ───

export async function getJournalEntry(date: string): Promise<DailyJournalEntry> {
  const res = await fetch(`/api/journal?date=${date}`);
  if (!res.ok) return { date, observations: '', endOfDayReview: '', weeklyGoals: [] };
  const data = await res.json();
  return {
    date: data.date?.split('T')[0] || date,
    observations: data.observations || '',
    endOfDayReview: data.end_of_day_review || '',
    weeklyGoals: data.weekly_goals || [],
  };
}

export async function saveJournalEntry(entry: DailyJournalEntry): Promise<void> {
  await fetch('/api/journal', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
}

// ─── Helpers ───

export async function getDailyPnl(date: string): Promise<number> {
  const trades = await getTrades();
  return trades
    .filter((t) => t.date === date)
    .reduce((sum, t) => sum + t.dollarPnl, 0);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const defaultSettings: UserSettings = {
  customFields: [
    { id: 'setup', label: 'Setup', type: 'select', options: ['Breakout', 'Pullback', 'Reversal', 'Momentum', 'Range'], description: 'The trade setup pattern' },
    { id: 'market_condition', label: 'Market Condition', type: 'select', options: ['Trending', 'Ranging', 'Volatile', 'Low Volume'], description: 'Overall market environment' },
    { id: 'confidence', label: 'Confidence', type: 'select', options: ['High', 'Medium', 'Low'], description: 'Pre-trade confidence level' },
  ],
  gradeDefinitions: [
    { grade: 'A', description: 'Perfect execution. Followed plan exactly.' },
    { grade: 'B', description: 'Good execution. Minor deviations.' },
    { grade: 'C', description: 'Average. Some rules broken.' },
    { grade: 'D', description: 'Poor execution. Major deviations.' },
    { grade: 'F', description: 'No plan followed. Revenge/impulse trade.' },
  ],
  maxDailyLoss: 500,
  maxRiskPerTrade: 100,
  focusVideoUrl: '',
};
