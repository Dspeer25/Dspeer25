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

  if (loading || !settings) return <div className="text-[#55556a] py-8 text-center">Loading...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Entries</h2>
        <div className="flex gap-1 glass rounded-xl p-1">
          {(['table', 'calendar'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === v ? 'bg-[#6366f1] text-white' : 'text-[#8b8b9e] hover:text-white'
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
              <tr className="border-b border-[rgba(255,255,255,0.06)] text-[#8b8b9e] text-xs">
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
                <tr key={trade.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(18,18,26,0.5)] transition-colors">
                  <td className="py-2 px-2">
                    <button onClick={() => toggleStar(trade)} className={`text-sm ${trade.starred ? 'text-[#fbbf24]' : 'text-[#55556a] hover:text-[#8b8b9e]'}`}>
                      {trade.starred ? '\u2605' : '\u2606'}
                    </button>
                  </td>
                  <td className="py-2 px-2 text-[#8b8b9e]">{trade.date}</td>
                  <td className="py-2 px-2 font-medium">{trade.ticker}</td>
                  <td className="py-2 px-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${trade.tradeType === 'Day' ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'bg-[#a78bfa]/10 text-[#a78bfa]'}`}>
                      {trade.tradeType}
                    </span>
                  </td>
                  {settings.customFields.map((f) => (
                    <td key={f.id} className="py-2 px-2 text-[#8b8b9e] hidden lg:table-cell">{trade.customFields[f.id] || '\u2014'}</td>
                  ))}
                  <td className="py-2 px-2 text-[#8b8b9e]">${trade.initialRisk}</td>
                  <td className="py-2 px-2">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      trade.result === 'W' ? 'bg-[#34d399]/10 text-[#34d399]' : trade.result === 'L' ? 'bg-[#f87171]/10 text-[#f87171]' : 'bg-[#fbbf24]/10 text-[#fbbf24]'
                    }`}>
                      {trade.result}
                    </span>
                  </td>
                  <td className={`py-2 px-2 text-right font-medium ${trade.dollarPnl >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                    {trade.dollarPnl >= 0 ? '+' : ''}{trade.dollarPnl.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-right text-[#8b8b9e]">{trade.rr.toFixed(1)}R</td>
                  <td className="py-2 px-2 text-center text-xs font-bold">{trade.grade || '\u2014'}</td>
                  <td className="py-2 px-2">
                    <button onClick={() => handleDelete(trade.id)} className="text-[#55556a] hover:text-[#f87171] text-xs">\u2715</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#55556a]">No trades found</div>
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
        <div key={d} className="text-center text-xs text-[#55556a] py-1">{d}</div>
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
            className={`p-2 rounded-xl border text-center min-h-[60px] ${
              hasTrades
                ? pnl >= 0
                  ? 'border-[#34d399]/20 bg-[#34d399]/5'
                  : 'border-[#f87171]/20 bg-[#f87171]/5'
                : 'border-[rgba(255,255,255,0.03)] bg-[rgba(18,18,26,0.3)]'
            }`}
          >
            <div className="text-xs text-[#55556a]">{day}</div>
            {hasTrades && (
              <>
                <div className={`text-xs font-bold mt-1 ${pnl >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                  {pnl >= 0 ? '+' : ''}{pnl.toFixed(0)}
                </div>
                <div className="text-[10px] text-[#55556a]">{dayTrades.length}t</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
