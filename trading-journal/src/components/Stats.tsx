'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trade, UserSettings } from '@/lib/types';
import { getTrades, getSettings } from '@/lib/store';

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className={`text-xl font-bold ${color || 'text-text-primary'}`}>{value}</div>
    </div>
  );
}

export default function Stats({ refreshKey }: { refreshKey: number }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [groupBy, setGroupBy] = useState('');

  useEffect(() => {
    setTrades(getTrades());
    const s = getSettings();
    setSettings(s);
    if (s.customFields.length > 0 && !groupBy) {
      setGroupBy(s.customFields[0].id);
    }
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
    const largestLoss = losses.length > 0 ? Math.min(...losses.map((t) => t.dollarPnl)) : 0;

    return { totalPnl, winRate, avgR, avgWin, avgLoss, profitFactor, largestWin, largestLoss, totalTrades: trades.length };
  }, [trades]);

  // Grouped stats
  const groupedStats = useMemo(() => {
    if (!groupBy || !settings) return [];
    const field = settings.customFields.find((f) => f.id === groupBy);
    if (!field) return [];

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

  if (!settings) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Stats</h2>

      {basicStats ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard label="Total PnL" value={`$${basicStats.totalPnl.toFixed(2)}`} color={basicStats.totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'} />
            <StatCard label="Win Rate" value={`${basicStats.winRate.toFixed(1)}%`} color={basicStats.winRate >= 50 ? 'text-accent-green' : 'text-accent-red'} />
            <StatCard label="Avg R" value={`${basicStats.avgR.toFixed(2)}R`} />
            <StatCard label="Total Trades" value={String(basicStats.totalTrades)} />
            <StatCard label="Avg Win" value={`$${basicStats.avgWin.toFixed(2)}`} color="text-accent-green" />
            <StatCard label="Avg Loss" value={`$${basicStats.avgLoss.toFixed(2)}`} color="text-accent-red" />
            <StatCard label="Profit Factor" value={basicStats.profitFactor.toFixed(2)} />
            <StatCard label="Largest Win" value={`$${basicStats.largestWin.toFixed(2)}`} color="text-accent-green" />
          </div>

          {/* Grouped Stats */}
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
                  <div key={group.name} className="bg-bg-secondary border border-border-primary rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{group.name}</div>
                      <div className="text-xs text-text-muted">{group.count} trades</div>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-xs text-text-muted">Win Rate</div>
                        <div className={`font-bold ${group.winRate >= 50 ? 'text-accent-green' : 'text-accent-red'}`}>
                          {group.winRate.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-text-muted">Avg R</div>
                        <div className="font-bold">{group.avgR.toFixed(2)}R</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-text-muted">PnL</div>
                        <div className={`font-bold ${group.totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                          {group.totalPnl >= 0 ? '+' : ''}${group.totalPnl.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {groupedStats.length === 0 && (
                  <div className="text-center py-8 text-text-muted">No data yet</div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-text-muted">No trades logged yet. Start trading to see your stats.</div>
      )}
    </div>
  );
}
