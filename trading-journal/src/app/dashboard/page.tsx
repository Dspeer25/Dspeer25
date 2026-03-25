'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { TabId } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import TradeEntry from '@/components/TradeEntry';
import EntriesTable from '@/components/EntriesTable';
import CalendarPnl from '@/components/CalendarPnl';
import DailyJournal from '@/components/DailyJournal';
import Stats from '@/components/Stats';
import Leaderboard from '@/components/Leaderboard';
import FocusTracks from '@/components/FocusTracks';
import VisualAnalysis from '@/components/VisualAnalysis';
import Settings from '@/components/Settings';
import RiskOverlay from '@/components/RiskOverlay';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('entry');
  const [refreshKey, setRefreshKey] = useState(0);
  const [paid, setPaid] = useState<boolean | null>(null);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Check payment status
  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch('/api/user/status')
      .then((r) => r.json())
      .then((data) => {
        if (data.paid) {
          setPaid(true);
        } else {
          setPaid(false);
        }
      })
      .catch(() => setPaid(false));
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="text-[#71717a]">Loading...</div>
      </div>
    );
  }

  // Payment gate
  if (paid === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-3">Unlock Your Journal</h2>
          <p className="text-[#a1a1aa] mb-6">One-time payment. Full access forever. No subscriptions.</p>
          <button
            onClick={async () => {
              const res = await fetch('/api/checkout', { method: 'POST' });
              const data = await res.json();
              if (data.url) window.location.href = data.url;
            }}
            className="px-8 py-3 bg-[#3b82f6] hover:bg-blue-600 rounded-lg font-semibold transition-colors"
          >
            Get Full Access — $10
          </button>
          <p className="text-xs text-[#71717a] mt-3">Powered by Stripe. Secure checkout.</p>
        </div>
      </div>
    );
  }

  if (paid === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="text-[#71717a]">Loading...</div>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'entry':
        return <TradeEntry onSaved={refresh} />;
      case 'entries':
        return <EntriesTable refreshKey={refreshKey} />;
      case 'calendar':
        return <CalendarPnl refreshKey={refreshKey} />;
      case 'journal':
        return <DailyJournal />;
      case 'stats':
        return <Stats refreshKey={refreshKey} />;
      case 'leaderboard':
        return <Leaderboard refreshKey={refreshKey} />;
      case 'focus':
        return <FocusTracks />;
      case 'analysis':
        return <VisualAnalysis />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <RiskOverlay />
      <Sidebar active={activeTab} onNavigate={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-end px-6 py-3 border-b border-[#2a2a3e]">
          <UserButton />
        </div>
        <div className="p-6 lg:p-8">
          {renderTab()}
        </div>
      </main>
    </div>
  );
}
