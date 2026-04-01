'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trade, UserSettings } from '@/lib/types';
import { getTrades, updateTrade, deleteTrade, getSettings } from '@/lib/store';

export default function EntriesTable({ refreshKey }: { refreshKey: number }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [filter, setFilter] = useState({ ticker: '', result: '', tradeType: '', customField: '', customValue: '' });
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getTrades(), getSettings()]).then(([t, s]) => {
      setTrades(t);
      setSettings(s);
      setLoading(false);
    });
  }, [refreshKey]);

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (filter.ticker && !t.ticker.toLowerCase().includes(filter.ticker.toLowerCase())) return false;
      if (filter.result && t.result !== filter.result) return false;
      if (filter.tradeType && t.tradeType !== filter.tradeType) return false;
      if (filter.customField && filter.customValue) {
        if (t.customFields[filter.customField] !== filter.customValue) return false;
      }
      return true;
    });
  }, [trades, filter]);

  const toggleStar = async (trade: Trade) => {
    const updated = { ...trade, starred: !trade.starred };
    await updateTrade(updated);
    setTrades(await getTrades());
  };

  const handleDelete = async (id: string) => {
    await deleteTrade(id);
    setTrades(await getTrades());
  };

  const calendarData = useMemo(() => {
    const grouped: Record<string, Trade[]> = {};
    filtered.forEach((t) => {
      if (!grouped[t.date]) grouped[t.date] = [];
      grouped[t.date].push(t);
    });
    return grouped;
  }, [filtered]);

  const calendarMonth = useMemo(() => {
    const dates = Object.keys(calendarData).sort();
    if (dates.length === 0) return new Date().toISOString().slice(0, 7);
    return dates[dates.length - 1].slice(0, 7);
  }, [calendarData]);

  if (loading || !settings) return <div className="text-text-muted py-8 text-center">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Entries</h2>
        <div className="flex gap-1 bg-bg-secondary rounded-lg p-1">
          {(['table', 'calendar'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === v ? 'bg-accent-blue text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {v === 'table' ? 'Table' : 'Calendar'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Ticker..."
          value={filter.ticker}
          onChange={(e) => setFilter({ ...filter, ticker: e.target.value })}
          className="w-28 text-xs py-1.5"
        />
        <select value={filter.result} onChange={(e) => setFilter({ ...filter, result: e.target.value })} className="text-xs py-1.5">
          <option value="">All Results</option>
          <option value="W">Win</option>
          <option value="L">Loss</option>
          <option value="BE">Break Even</option>
        </select>
        <select value={filter.tradeType} onChange={(e) => setFilter({ ...filter, tradeType: e.target.value })} className="text-xs py-1.5">
          <option value="">All Types</option>
          <option value="Day">Day</option>
          <option value="Swing">Swing</option>
        </select>
        {settings.customFields.filter((f) => f.type === 'select').map((f) => (
          <select
            key={f.id}
            value={filter.customField === f.id ? filter.customValue : ''}
            onChange={(e) => setFilter({ ...filter, customField: f.id, customValue: e.target.value })}
            className="text-xs py-1.5"
          >
            <option value="">All {f.label}</option>
            {f.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ))}
      </div>

      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-primary text-text-secondary text-xs">
                <th className="py-2 px-2 text-left w-8"></th>
                <th className="py-2 px-2 text-left">Date</th>
                <th className="py-2 px-2 text-left">Ticker</th>
                <th className="py-2 px-2 text-left">Type</th>
                {settings.customFields.map((f) => (
                  <th key={f.id} className="py-2 px-2 text-left hidden lg:table-cell">{f.label}</th>
                ))}
                <th className="py-2 px-2 text-left">Risk</th>
                <th className="py-2 px-2 text-left">Result</th>
                <th className="py-2 px-2 text-right">PnL</th>
                <th className="py-2 px-2 text-right">R:R</th>
                <th className="py-2 px-2 text-center">Grade</th>
                <th className="py-2 px-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trade) => (
                <tr key={trade.id} className="border-b border-border-primary/50 hover:bg-bg-secondary/50 transition-colors">
                  <td className="py-2 px-2">
                    <button onClick={() => toggleStar(trade)} className={`text-sm ${trade.starred ? 'text-accent-yellow' : 'text-text-muted hover:text-text-secondary'}`}>
                      {trade.starred ? '\u2605' : '\u2606'}
                    </button>
                  </td>
                  <td className="py-2 px-2 text-text-secondary">{trade.date}</td>
                  <td className="py-2 px-2 font-medium">{trade.ticker}</td>
                  <td className="py-2 px-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${trade.tradeType === 'Day' ? 'bg-accent-blue/10 text-accent-blue' : 'bg-accent-purple/10 text-accent-purple'}`}>
                      {trade.tradeType}
                    </span>
                  </td>
                  {settings.customFields.map((f) => (
                    <td key={f.id} className="py-2 px-2 text-text-secondary hidden lg:table-cell">{trade.customFields[f.id] || '\u2014'}</td>
                  ))}
                  <td className="py-2 px-2 text-text-secondary">${trade.initialRisk}</td>
                  <td className="py-2 px-2">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      trade.result === 'W' ? 'bg-accent-green/10 text-accent-green' : trade.result === 'L' ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-yellow/10 text-accent-yellow'
                    }`}>
                      {trade.result}
                    </span>
                  </td>
                  <td className={`py-2 px-2 text-right font-medium ${trade.dollarPnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {trade.dollarPnl >= 0 ? '+' : ''}{trade.dollarPnl.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-right text-text-secondary">{trade.rr.toFixed(1)}R</td>
                  <td className="py-2 px-2 text-center text-xs font-bold">{trade.grade || '\u2014'}</td>
                  <td className="py-2 px-2">
                    <button onClick={() => handleDelete(trade.id)} className="text-text-muted hover:text-accent-red text-xs">\u2715</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-text-muted">No trades found</div>
          )}
        </div>
      ) : (
        <EntriesCalendar calendarData={calendarData} month={calendarMonth} />
      )}
    </div>
  );
}

function EntriesCalendar({ calendarData, month }: { calendarData: Record<string, Trade[]>; month: string }) {
  const [year, monthNum] = month.split('-').map(Number);
  const firstDay = new Date(year, monthNum - 1, 1).getDay();
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div className="grid grid-cols-7 gap-1">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
        <div key={d} className="text-center text-xs text-text-muted py-1">{d}</div>
      ))}
      {days.map((day, i) => {
        if (day === null) return <div key={`e-${i}`} />;
        const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTrades = calendarData[dateStr] || [];
        const pnl = dayTrades.reduce((s, t) => s + t.dollarPnl, 0);
        const hasTrades = dayTrades.length > 0;

        return (
          <div
            key={day}
            className={`p-2 rounded-lg border text-center min-h-[60px] ${
              hasTrades
                ? pnl >= 0
                  ? 'border-accent-green/20 bg-accent-green/5'
                  : 'border-accent-red/20 bg-accent-red/5'
                : 'border-border-primary/30 bg-bg-secondary/30'
            }`}
          >
            <div className="text-xs text-text-muted">{day}</div>
            {hasTrades && (
              <>
                <div className={`text-xs font-bold mt-1 ${pnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {pnl >= 0 ? '+' : ''}{pnl.toFixed(0)}
                </div>
                <div className="text-[10px] text-text-muted">{dayTrades.length}t</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
