'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trade, UserSettings } from '@/lib/types';
import { getTrades, getSettings } from '@/lib/store';

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-xs text-[#55556a] mb-1">{label}</div>
      <div className={`text-xl font-bold ${color || 'text-white'}`}>{value}</div>
    </div>
  );
}

export default function Stats({ refreshKey }: { refreshKey: number }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [groupBy, setGroupBy] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getTrades(), getSettings()]).then(([t, s]) => {
      setTrades(t);
      setSettings(s);
      if (s.customFields.length > 0 && !groupBy) setGroupBy(s.customFields[0].id);
      setLoading(false);
    });
  }, [refreshKey]);

  const basicStats = useMemo(() => {
    if (trades.length === 0) return null;
    const totalPnl = trades.reduce((s, t) => s + t.dollarPnl, 0);
    const wins = trades.filter((t) => t.result === 'W');
    const losses = trades.filter((t) => t.result === 'L');
    const winRate = (wins.length / trades.length) * 100;
    const avgR = trades.reduce((s, t) => s + t.rr, 0) / trades.length;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.dollarPnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.dollarPnl, 0) / losses.length : 0;
    const profitFactor = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : 0;
    const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => t.dollarPnl)) : 0;

    return { totalPnl, winRate, avgR, avgWin, avgLoss, profitFactor, largestWin, totalTrades: trades.length };
  }, [trades]);

  const groupedStats = useMemo(() => {
    if (!groupBy || !settings) return [];
    const groups: Record<string, Trade[]> = {};
    trades.forEach((t) => {
      const val = t.customFields[groupBy] || 'Unset';
      if (!groups[val]) groups[val] = [];
      groups[val].push(t);
    });

    return Object.entries(groups).map(([name, grpTrades]) => {
      const wins = grpTrades.filter((t) => t.result === 'W').length;
      const totalPnl = grpTrades.reduce((s, t) => s + t.dollarPnl, 0);
      const avgR = grpTrades.reduce((s, t) => s + t.rr, 0) / grpTrades.length;
      return { name, count: grpTrades.length, winRate: (wins / grpTrades.length) * 100, avgR, totalPnl };
    }).sort((a, b) => b.totalPnl - a.totalPnl);
  }, [trades, groupBy, settings]);

  if (loading || !settings) return <div className="text-[#55556a] py-8 text-center">Loading...</div>;

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-semibold mb-6">Stats</h2>
      {basicStats ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard label="Total PnL" value={`$${basicStats.totalPnl.toFixed(2)}`} color={basicStats.totalPnl >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'} />
            <StatCard label="Win Rate" value={`${basicStats.winRate.toFixed(1)}%`} color={basicStats.winRate >= 50 ? 'text-[#34d399]' : 'text-[#f87171]'} />
            <StatCard label="Avg R" value={`${basicStats.avgR.toFixed(2)}R`} />
            <StatCard label="Total Trades" value={String(basicStats.totalTrades)} />
            <StatCard label="Avg Win" value={`$${basicStats.avgWin.toFixed(2)}`} color="text-[#34d399]" />
            <StatCard label="Avg Loss" value={`$${basicStats.avgLoss.toFixed(2)}`} color="text-[#f87171]" />
            <StatCard label="Profit Factor" value={basicStats.profitFactor.toFixed(2)} />
            <StatCard label="Largest Win" value={`$${basicStats.largestWin.toFixed(2)}`} color="text-[#34d399]" />
          </div>

          {settings.customFields.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-medium">Performance by</h3>
                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="text-sm py-1.5">
                  {settings.customFields.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                {groupedStats.map((group) => (
                  <div key={group.name} className="glass rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{group.name}</div>
                      <div className="text-xs text-[#55556a]">{group.count} trades</div>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-xs text-[#55556a]">Win Rate</div>
                        <div className={`font-bold ${group.winRate >= 50 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>{group.winRate.toFixed(1)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-[#55556a]">Avg R</div>
                        <div className="font-bold">{group.avgR.toFixed(2)}R</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-[#55556a]">PnL</div>
                        <div className={`font-bold ${group.totalPnl >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                          {group.totalPnl >= 0 ? '+' : ''}${group.totalPnl.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {groupedStats.length === 0 && <div className="text-center py-8 text-[#55556a]">No data yet</div>}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-[#55556a]">No trades logged yet. Start trading to see your stats.</div>
      )}
    </div>
  );
}
