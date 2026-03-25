import { Trade, UserSettings, DailyJournalEntry } from './types';

const KEYS = {
  trades: 'tj_trades',
  settings: 'tj_settings',
  journal: 'tj_journal',
};

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
  focusVideoUrl: '',
};

function get<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getTrades(): Trade[] {
  return get<Trade[]>(KEYS.trades, []);
}

export function saveTrades(trades: Trade[]): void {
  set(KEYS.trades, trades);
}

export function addTrade(trade: Trade): void {
  const trades = getTrades();
  trades.unshift(trade);
  saveTrades(trades);
}

export function updateTrade(updated: Trade): void {
  const trades = getTrades().map((t) => (t.id === updated.id ? updated : t));
  saveTrades(trades);
}

export function deleteTrade(id: string): void {
  saveTrades(getTrades().filter((t) => t.id !== id));
}

export function getSettings(): UserSettings {
  return get<UserSettings>(KEYS.settings, defaultSettings);
}

export function saveSettings(settings: UserSettings): void {
  set(KEYS.settings, settings);
}

export function getJournalEntry(date: string): DailyJournalEntry {
  const all = get<Record<string, DailyJournalEntry>>(KEYS.journal, {});
  return all[date] || { date, observations: '', endOfDayReview: '', weeklyGoals: [] };
}

export function saveJournalEntry(entry: DailyJournalEntry): void {
  const all = get<Record<string, DailyJournalEntry>>(KEYS.journal, {});
  all[entry.date] = entry;
  set(KEYS.journal, all);
}

export function getDailyPnl(date: string): number {
  return getTrades()
    .filter((t) => t.date === date)
    .reduce((sum, t) => sum + t.dollarPnl, 0);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
