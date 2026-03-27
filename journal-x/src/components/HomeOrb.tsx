'use client';

import { useState, useEffect } from 'react';
import { getTrades, getSettings } from '@/lib/store';
import { Trade } from '@/lib/types';

export default function HomeOrb({ onStartWeek }: { onStartWeek: () => void }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrades().then((t) => { setTrades(t); setLoading(false); });
  }, []);

  // Current week info
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  const weekLabel = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 4); // Friday
  const weekEndLabel = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // This week's trades
  const weekStart = startOfWeek.toISOString().split('T')[0];
  const weekTrades = trades.filter((t) => t.date >= weekStart);
  const weekPnl = weekTrades.reduce((s, t) => s + t.dollarPnl, 0);
  const weekWins = weekTrades.filter((t) => t.result === 'W').length;
  const weekWinRate = weekTrades.length > 0 ? ((weekWins / weekTrades.length) * 100).toFixed(0) : '0';

  // Today's trades
  const today = now.toISOString().split('T')[0];
  const todayTrades = trades.filter((t) => t.date === today);
  const todayPnl = todayTrades.reduce((s, t) => s + t.dollarPnl, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="orb w-48 h-48 rounded-full flex items-center justify-center animate-pulse-glow">
          <div className="w-8 h-8 border-2 border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] animate-fade-in">
      {/* The Orb */}
      <button onClick={onStartWeek} className="orb w-56 h-56 sm:w-64 sm:h-64 rounded-full flex flex-col items-center justify-center mb-10 animate-pulse-glow cursor-pointer">
        {weekTrades.length > 0 ? (
          <>
            <div className="text-[10px] text-[#8b8b9e] uppercase tracking-[0.2em] mb-1">Week of</div>
            <div className="text-lg font-bold mb-3">{weekLabel} — {weekEndLabel}</div>
            <div className={`text-2xl font-black ${weekPnl >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
              {weekPnl >= 0 ? '+' : ''}${weekPnl.toFixed(0)}
            </div>
            <div className="text-xs text-[#8b8b9e] mt-1">{weekTrades.length} trades / {weekWinRate}% WR</div>
          </>
        ) : (
          <>
            <div className="text-[10px] text-[#8b8b9e] uppercase tracking-[0.2em] mb-2">Tap to begin</div>
            <div className="text-xl font-bold">New Week</div>
            <div className="text-xs text-[#55556a] mt-2">Set your goals</div>
          </>
        )}
      </button>

      {/* Quick stats below orb */}
      <div className="flex gap-6 text-center">
        <div>
          <div className="text-xs text-[#55556a] mb-1">Today</div>
          <div className={`text-lg font-bold ${todayPnl >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
            {todayTrades.length > 0 ? `${todayPnl >= 0 ? '+' : ''}$${todayPnl.toFixed(0)}` : '—'}
          </div>
        </div>
        <div className="w-px bg-[rgba(255,255,255,0.06)]" />
        <div>
          <div className="text-xs text-[#55556a] mb-1">Trades Today</div>
          <div className="text-lg font-bold">{todayTrades.length}</div>
        </div>
        <div className="w-px bg-[rgba(255,255,255,0.06)]" />
        <div>
          <div className="text-xs text-[#55556a] mb-1">Week Trades</div>
          <div className="text-lg font-bold">{weekTrades.length}</div>
        </div>
      </div>
    </div>
  );
}
