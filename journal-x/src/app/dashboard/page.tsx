'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { TabId } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import HomeOrb from '@/components/HomeOrb';
import TradeEntry from '@/components/TradeEntry';
import EntriesTable from '@/components/EntriesTable';
import CalendarPnl from '@/components/CalendarPnl';
import DailyJournal from '@/components/DailyJournal';
import Stats from '@/components/Stats';
import Settings from '@/components/Settings';
import VisualAnalysis from '@/components/VisualAnalysis';
import Toolkit from '@/components/Toolkit';
import RiskOverlay from '@/components/RiskOverlay';
import AiChat from '@/components/AiChat';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [refreshKey, setRefreshKey] = useState(0);
  const [paid, setPaid] = useState<boolean | null>(null);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Check payment and onboarding status
    Promise.all([
      fetch('/api/user/status').then((r) => r.json()),
      fetch('/api/profile').then((r) => r.json()),
    ]).then(([status, profile]) => {
      setPaid(status.paid ?? false);
      setProfileComplete(profile.onboarding_complete ?? profile.onboardingComplete ?? false);
    }).catch(() => {
      setPaid(false);
      setProfileComplete(false);
    });
  }, [isLoaded, user]);

  if (!isLoaded || paid === null || profileComplete === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0c0c14]">
        <div className="orb w-20 h-20 rounded-full flex items-center justify-center animate-pulse-glow">
          <div className="w-6 h-6 border-2 border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Payment gate
  if (paid === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0c0c14]">
        <div className="text-center max-w-md animate-fade-in">
          <div className="orb w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse-glow">
            <span className="text-2xl font-black text-[#6366f1]/60">X</span>
          </div>
          <h2 className="text-2xl font-bold mb-3">Unlock Journal X</h2>
          <p className="text-[#8b8b9e] mb-6">One-time payment. Full access. AI coaching included.</p>
          <button
            onClick={async () => {
              const res = await fetch('/api/checkout', { method: 'POST' });
              const data = await res.json();
              if (data.url) window.location.href = data.url;
            }}
            className="px-8 py-3 bg-[#6366f1] hover:bg-[#5558e6] rounded-xl font-semibold transition-all glow-accent"
          >
            Get Full Access — $10
          </button>
          <p className="text-xs text-[#55556a] mt-3">Powered by Stripe. Secure checkout.</p>
        </div>
      </div>
    );
  }

  // Onboarding gate
  if (!profileComplete) {
    router.push('/onboarding');
    return null;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeOrb onStartWeek={() => setActiveTab('journal')} />;
      case 'journal':
        return <DailyJournal />;
      case 'log':
        return <TradeEntry onSaved={refresh} />;
      case 'entries':
        return <EntriesTable refreshKey={refreshKey} />;
      case 'calendar':
        return <CalendarPnl refreshKey={refreshKey} />;
      case 'stats':
        return <Stats refreshKey={refreshKey} />;
      case 'toolkit':
        return <Toolkit />;
      case 'analysis':
        return <VisualAnalysis />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0c14]">
      <RiskOverlay />
      <Sidebar active={activeTab} onNavigate={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-end px-6 py-3 border-b border-[rgba(255,255,255,0.04)]">
          <UserButton />
        </div>
        <div className="p-6 lg:p-8">
          {renderTab()}
        </div>
      </main>
      <AiChat />
    </div>
  );
}
