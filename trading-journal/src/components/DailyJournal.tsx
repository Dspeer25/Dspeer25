'use client';

import { useState, useEffect } from 'react';
import { DailyJournalEntry, UserSettings } from '@/lib/types';
import { getJournalEntry, saveJournalEntry, getSettings, getTrades, generateId } from '@/lib/store';

export default function DailyJournal() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [entry, setEntry] = useState<DailyJournalEntry | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [newGoal, setNewGoal] = useState('');

  // Calculator state
  const [calc, setCalc] = useState({ accountSize: '', riskPercent: '', entryPrice: '', stopLoss: '' });

  useEffect(() => {
    setEntry(getJournalEntry(date));
    setSettings(getSettings());
  }, [date]);

  const save = (updates: Partial<DailyJournalEntry>) => {
    if (!entry) return;
    const updated = { ...entry, ...updates };
    setEntry(updated);
    saveJournalEntry(updated);
  };

  const addGoal = () => {
    if (!newGoal.trim() || !entry) return;
    const goals = [...entry.weeklyGoals, { id: generateId(), text: newGoal.trim(), completed: false }];
    save({ weeklyGoals: goals });
    setNewGoal('');
  };

  const toggleGoal = (id: string) => {
    if (!entry) return;
    const goals = entry.weeklyGoals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g));
    save({ weeklyGoals: goals });
  };

  const removeGoal = (id: string) => {
    if (!entry) return;
    save({ weeklyGoals: entry.weeklyGoals.filter((g) => g.id !== id) });
  };

  // Calculator
  const positionSize = (() => {
    const acct = parseFloat(calc.accountSize);
    const risk = parseFloat(calc.riskPercent);
    const ep = parseFloat(calc.entryPrice);
    const sl = parseFloat(calc.stopLoss);
    if (!acct || !risk || !ep || !sl || ep === sl) return null;
    const riskAmount = acct * (risk / 100);
    const priceDiff = Math.abs(ep - sl);
    const shares = Math.floor(riskAmount / priceDiff);
    return { riskAmount: riskAmount.toFixed(2), shares, totalCost: (shares * ep).toFixed(2) };
  })();

  // Daily trades summary
  const dayTrades = getTrades().filter((t) => t.date === date);
  const dayPnl = dayTrades.reduce((s, t) => s + t.dollarPnl, 0);

  if (!entry || !settings) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Daily Journal</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm" />
      </div>

      {/* Daily Summary */}
      {dayTrades.length > 0 && (
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-text-muted">Day PnL</div>
              <div className={`text-lg font-bold ${dayPnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {dayPnl >= 0 ? '+' : ''}${dayPnl.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Trades</div>
              <div className="text-lg font-bold">{dayTrades.length}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Wins</div>
              <div className="text-lg font-bold text-accent-green">{dayTrades.filter((t) => t.result === 'W').length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Position Size Calculator */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">Position Calculator</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Account Size</label>
            <input
              type="number"
              value={calc.accountSize}
              onChange={(e) => setCalc({ ...calc, accountSize: e.target.value })}
              placeholder="25000"
              className="w-full text-sm py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Risk %</label>
            <input
              type="number"
              step="0.1"
              value={calc.riskPercent}
              onChange={(e) => setCalc({ ...calc, riskPercent: e.target.value })}
              placeholder="1"
              className="w-full text-sm py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Entry Price</label>
            <input
              type="number"
              step="0.01"
              value={calc.entryPrice}
              onChange={(e) => setCalc({ ...calc, entryPrice: e.target.value })}
              placeholder="150.00"
              className="w-full text-sm py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Stop Loss</label>
            <input
              type="number"
              step="0.01"
              value={calc.stopLoss}
              onChange={(e) => setCalc({ ...calc, stopLoss: e.target.value })}
              placeholder="148.00"
              className="w-full text-sm py-1.5"
            />
          </div>
        </div>
        {positionSize && (
          <div className="mt-3 flex gap-4 text-sm">
            <div><span className="text-text-muted">Risk $:</span> <span className="font-medium text-accent-yellow">${positionSize.riskAmount}</span></div>
            <div><span className="text-text-muted">Shares:</span> <span className="font-medium">{positionSize.shares}</span></div>
            <div><span className="text-text-muted">Cost:</span> <span className="font-medium">${positionSize.totalCost}</span></div>
          </div>
        )}
      </div>

      {/* Weekly Goals */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">Weekly Goals</h3>
        <div className="space-y-2">
          {entry.weeklyGoals.map((goal) => (
            <div key={goal.id} className="flex items-center gap-2">
              <button
                onClick={() => toggleGoal(goal.id)}
                className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 ${
                  goal.completed ? 'bg-accent-green border-accent-green text-white' : 'border-border-secondary'
                }`}
              >
                {goal.completed && '✓'}
              </button>
              <span className={`text-sm flex-1 ${goal.completed ? 'text-text-muted line-through' : ''}`}>{goal.text}</span>
              <button onClick={() => removeGoal(goal.id)} className="text-text-muted hover:text-accent-red text-xs">✕</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGoal()}
            placeholder="Add goal..."
            className="flex-1 text-sm py-1.5"
          />
          <button onClick={addGoal} className="px-3 py-1.5 bg-accent-blue rounded text-sm text-white">Add</button>
        </div>
      </div>

      {/* Observations */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">Observations & Actions</h3>
        <textarea
          value={entry.observations}
          onChange={(e) => save({ observations: e.target.value })}
          rows={4}
          placeholder="Market observations, key levels, patterns noticed..."
          className="w-full text-sm resize-none"
        />
      </div>

      {/* End of Day Review */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">End of Day Review</h3>
        <textarea
          value={entry.endOfDayReview}
          onChange={(e) => save({ endOfDayReview: e.target.value })}
          rows={4}
          placeholder="What went well? What to improve? Key takeaways..."
          className="w-full text-sm resize-none"
        />
      </div>
    </div>
  );
}
