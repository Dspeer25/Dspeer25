'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trade } from '@/lib/types';
import { getTrades } from '@/lib/store';

export default function CalendarPnl({ refreshKey }: { refreshKey: number }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    setLoading(true);
    getTrades().then((t) => { setTrades(t); setLoading(false); });
  }, [refreshKey]);

  const [year, monthNum] = month.split('-').map(Number);
  const firstDay = new Date(year, monthNum - 1, 1).getDay();
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const monthTrades = useMemo(() => trades.filter((t) => t.date.startsWith(month)), [trades, month]);

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

  if (loading) return <div className="text-[#55556a] py-8 text-center">Loading...</div>;

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-semibold mb-6 text-white">Calendar</h2>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-[#55556a] mb-1">Monthly PnL</div>
          <div className={`text-xl font-bold ${totalPnl >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-[#55556a] mb-1">Win Rate</div>
          <div className="text-xl font-bold text-white">{winRate}%</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-[#55556a] mb-1">Total Trades</div>
          <div className="text-xl font-bold text-white">{monthTrades.length}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="text-[#8b8b9e] hover:text-white px-3 py-1 rounded-xl glass transition-colors duration-200">&larr;</button>
        <span className="font-medium text-white">{monthName}</span>
        <button onClick={nextMonth} className="text-[#8b8b9e] hover:text-white px-3 py-1 rounded-xl glass transition-colors duration-200">&rarr;</button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs text-[#55556a] py-2 font-medium">{d}</div>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const data = dailyData[day];

          return (
            <div
              key={day}
              className={`rounded-xl p-2 min-h-[72px] transition-colors duration-200 ${
                data
                  ? data.pnl > 0
                    ? 'border border-[#34d399]/30 bg-[#34d399]/5'
                    : data.pnl < 0
                    ? 'border border-[#f87171]/30 bg-[#f87171]/5'
                    : 'border border-yellow-400/30 bg-yellow-400/5'
                  : 'glass'
              }`}
            >
              <div className="text-xs text-[#55556a]">{day}</div>
              {data && (
                <div className="mt-1">
                  <div className={`text-sm font-bold ${data.pnl > 0 ? 'text-[#34d399]' : data.pnl < 0 ? 'text-[#f87171]' : 'text-yellow-400'}`}>
                    {data.pnl > 0 ? '+' : ''}{data.pnl.toFixed(0)}
                  </div>
                  <div className="text-[10px] text-[#55556a] mt-0.5">{data.count} trade{data.count !== 1 ? 's' : ''}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
