'use client';

import { useState, useEffect } from 'react';
import { getDailyPnl, getSettings } from '@/lib/store';

export default function RiskOverlay() {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const check = async () => {
      const today = new Date().toISOString().split('T')[0];
      const [pnl, settings] = await Promise.all([getDailyPnl(today), getSettings()]);
      setLocked(pnl <= -settings.maxDailyLoss && settings.maxDailyLoss > 0);
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!locked) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl font-black text-accent-red mb-4">LOCKED</div>
        <p className="text-text-secondary text-lg mb-2">Max daily loss reached.</p>
        <p className="text-text-muted text-sm">Step away. Review your trades tomorrow.</p>
        <button onClick={() => setLocked(false)} className="mt-8 text-xs text-text-muted hover:text-text-secondary underline">
          Override (not recommended)
        </button>
      </div>
    </div>
  );
}
