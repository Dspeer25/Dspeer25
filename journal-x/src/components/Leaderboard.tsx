'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trade } from '@/lib/types';
import { getTrades } from '@/lib/store';

export default function Leaderboard({ refreshKey }: { refreshKey: number }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTrades().then((t) => { setTrades(t); setLoading(false); });
  }, [refreshKey]);

  const weeklyData = useMemo(() => {
    const weeks: Record<string, { pnl: number; trades: number; wins: number }> = {};
    trades.forEach((t) => {
      const d = new Date(t.date);
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay());
      const key = startOfWeek.toISOString().split('T')[0];
      if (!weeks[key]) weeks[key] = { pnl: 0, trades: 0, wins: 0 };
      weeks[key].pnl += t.dollarPnl;
      weeks[key].trades++;
      if (t.result === 'W') weeks[key].wins++;
    });
    return Object.entries(weeks)
      .map(([week, data]) => ({ week, ...data, winRate: (data.wins / data.trades) * 100 }))
      .sort((a, b) => b.week.localeCompare(a.week));
  }, [trades]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { pnl: number; trades: number; wins: number }> = {};
    trades.forEach((t) => {
      const key = t.date.slice(0, 7);
      if (!months[key]) months[key] = { pnl: 0, trades: 0, wins: 0 };
      months[key].pnl += t.dollarPnl;
      months[key].trades++;
      if (t.result === 'W') months[key].wins++;
    });
    return Object.entries(months)
      .map(([month, data]) => ({ month, ...data, winRate: (data.wins / data.trades) * 100 }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [trades]);

  const dailyData = useMemo(() => {
    const days: Record<string, number> = {};
    trades.forEach((t) => { days[t.date] = (days[t.date] || 0) + t.dollarPnl; });
    const sorted = Object.entries(days).map(([date, pnl]) => ({ date, pnl }));
    return {
      best: [...sorted].sort((a, b) => b.pnl - a.pnl).slice(0, 5),
      worst: [...sorted].sort((a, b) => a.pnl - b.pnl).slice(0, 5),
    };
  }, [trades]);

  const streak = useMemo(() => {
    const days = Array.from(new Set(trades.map((t) => t.date))).sort().reverse();
    let current = 0;
    for (const day of days) {
      const dayPnl = trades.filter((t) => t.date === day).reduce((s, t) => s + t.dollarPnl, 0);
      if (dayPnl > 0) current++;
      else break;
    }
    return current;
  }, [trades]);

  if (loading) return <div className="text-[#55556a] py-8 text-center">Loading...</div>;

  if (trades.length === 0) {
    return (
      <div className="animate-fade-in">
        <h2 className="text-xl font-semibold mb-6">Performance</h2>
        <div className="text-center py-12 text-[#55556a]">No trades logged yet.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold">Performance</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-[#55556a]">Green Day Streak</div>
          <div className="text-2xl font-bold text-[#34d399]">{streak}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-[#55556a]">Best Day</div>
          <div className="text-2xl font-bold text-[#34d399]">+${dailyData.best[0]?.pnl.toFixed(0) || '0'}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-[#55556a]">Worst Day</div>
          <div className="text-2xl font-bold text-[#f87171]">${dailyData.worst[0]?.pnl.toFixed(0) || '0'}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-[#55556a]">Trading Days</div>
          <div className="text-2xl font-bold">{Array.from(new Set(trades.map((t) => t.date))).length}</div>
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-medium mb-3">Monthly Performance</h3>
        <div className="space-y-2">
          {monthlyData.map((m) => (
            <div key={m.month} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.03)] last:border-0">
              <div>
                <div className="font-medium text-sm">{new Date(m.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                <div className="text-xs text-[#55556a]">{m.trades} trades / {m.winRate.toFixed(0)}% WR</div>
              </div>
              <div className={`text-lg font-bold ${m.pnl >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                {m.pnl >= 0 ? '+' : ''}${m.pnl.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-medium mb-3">Weekly Performance</h3>
        <div className="space-y-2">
          {weeklyData.slice(0, 8).map((w) => {
            const maxPnl = Math.max(...weeklyData.map((x) => Math.abs(x.pnl)), 1);
            const barWidth = Math.min(Math.abs(w.pnl) / maxPnl * 100, 100);
            return (
              <div key={w.week} className="flex items-center gap-3">
                <div className="w-24 text-xs text-[#55556a] shrink-0">{w.week}</div>
                <div className="flex-1 h-6 bg-[#0c0c14] rounded overflow-hidden relative">
                  <div className={`h-full rounded ${w.pnl >= 0 ? 'bg-[#34d399]/30' : 'bg-[#f87171]/30'}`} style={{ width: `${barWidth}%` }} />
                  <span className={`absolute inset-0 flex items-center px-2 text-xs font-medium ${w.pnl >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                    {w.pnl >= 0 ? '+' : ''}${w.pnl.toFixed(0)}
                  </span>
                </div>
                <div className="w-16 text-xs text-[#55556a] text-right">{w.winRate.toFixed(0)}% WR</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-medium mb-3 text-[#34d399]">Best Days</h3>
          {dailyData.best.map((d) => (
            <div key={d.date} className="flex items-center justify-between py-1 text-sm">
              <span className="text-[#55556a]">{d.date}</span>
              <span className="text-[#34d399] font-medium">+${d.pnl.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-medium mb-3 text-[#f87171]">Worst Days</h3>
          {dailyData.worst.map((d) => (
            <div key={d.date} className="flex items-center justify-between py-1 text-sm">
              <span className="text-[#55556a]">{d.date}</span>
              <span className="text-[#f87171] font-medium">${d.pnl.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
