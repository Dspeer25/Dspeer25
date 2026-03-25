'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trade } from '@/lib/types';
import { getTrades } from '@/lib/store';

export default function CalendarPnl({ refreshKey }: { refreshKey: number }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    setTrades(getTrades());
  }, [refreshKey]);

  const [year, monthNum] = month.split('-').map(Number);
  const firstDay = new Date(year, monthNum - 1, 1).getDay();
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const monthTrades = useMemo(() => {
    return trades.filter((t) => t.date.startsWith(month));
  }, [trades, month]);

  const dailyData = useMemo(() => {
    const data: Record<number, { pnl: number; count: number }> = {};
    monthTrades.forEach((t) => {
      const day = parseInt(t.date.split('-')[2]);
      if (!data[day]) data[day] = { pnl: 0, count: 0 };
      data[day].pnl += t.dollarPnl;
      data[day].count++;
    });
    return data;
  }, [monthTrades]);

  const totalPnl = monthTrades.reduce((s, t) => s + t.dollarPnl, 0);
  const wins = monthTrades.filter((t) => t.result === 'W').length;
  const winRate = monthTrades.length > 0 ? ((wins / monthTrades.length) * 100).toFixed(1) : '0';

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const prevMonth = () => {
    const d = new Date(year, monthNum - 2, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const d = new Date(year, monthNum, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthName = new Date(year, monthNum - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Calendar</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
          <div className="text-xs text-text-muted mb-1">Monthly PnL</div>
          <div className={`text-xl font-bold ${totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </div>
        </div>
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
          <div className="text-xs text-text-muted mb-1">Win Rate</div>
          <div className="text-xl font-bold text-text-primary">{winRate}%</div>
        </div>
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
          <div className="text-xs text-text-muted mb-1">Total Trades</div>
          <div className="text-xl font-bold text-text-primary">{monthTrades.length}</div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="text-text-secondary hover:text-text-primary px-3 py-1 rounded bg-bg-secondary">←</button>
        <span className="font-medium">{monthName}</span>
        <button onClick={nextMonth} className="text-text-secondary hover:text-text-primary px-3 py-1 rounded bg-bg-secondary">→</button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs text-text-muted py-2 font-medium">{d}</div>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const data = dailyData[day];

          return (
            <div
              key={day}
              className={`rounded-lg border p-2 min-h-[72px] transition-colors ${
                data
                  ? data.pnl > 0
                    ? 'border-accent-green/30 bg-accent-green/5'
                    : data.pnl < 0
                    ? 'border-accent-red/30 bg-accent-red/5'
                    : 'border-accent-yellow/30 bg-accent-yellow/5'
                  : 'border-border-primary/20 bg-bg-secondary/20'
              }`}
            >
              <div className="text-xs text-text-muted">{day}</div>
              {data && (
                <div className="mt-1">
                  <div className={`text-sm font-bold ${data.pnl > 0 ? 'text-accent-green' : data.pnl < 0 ? 'text-accent-red' : 'text-accent-yellow'}`}>
                    {data.pnl > 0 ? '+' : ''}{data.pnl.toFixed(0)}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">{data.count} trade{data.count !== 1 ? 's' : ''}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
