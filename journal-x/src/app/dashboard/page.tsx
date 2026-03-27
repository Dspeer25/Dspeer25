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
  const [selectedTier, setSelectedTier] = useState<'full' | 'journal' | null>(null);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const handleNavigate = useCallback((tab: TabId) => setActiveTab(tab), []);
  const handleStartWeek = useCallback(() => setActiveTab('journal'), []);
  const handleSaved = useCallback(() => refresh(), [refresh]);

  useEffect(() => {
    if (!isLoaded || !user) return;

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
      <div className="flex h-screen items-center justify-center">
        <div className="orb w-20 h-20 rounded-full flex items-center justify-center animate-pulse-glow">
          <div className="w-6 h-6 border-2 border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Payment gate - two tier orbs, no prices visible
  if (paid === false) {
    return (
      <div className="flex h-screen items-center justify-center">
        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-[40%] w-[500px] h-[500px] rounded-full bg-[#6366f1]/[0.03] blur-[120px]" />
        </div>

        <div className="text-center max-w-2xl animate-fade-in relative z-10 px-6">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Unlock Journal X</h2>
          <p className="text-[#8b8b9e] mb-14 max-w-md mx-auto">Choose your path. One-time payment. Lifetime access.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* Tier 1: Journal + AI */}
            <button
              onClick={async () => {
                setSelectedTier('full');
                const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier: 'full' }) });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
                else setSelectedTier(null);
              }}
              className="group relative"
            >
              <div className={`orb w-52 h-52 rounded-full flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-500 ${selectedTier === 'full' ? 'animate-pulse-glow scale-105' : 'group-hover:scale-[1.03]'}`}>
                <div className="text-[10px] text-[#8b8b9e] uppercase tracking-[0.2em] mb-2">Complete</div>
                <div className="text-lg font-bold mb-0.5">Journal X</div>
                <div className="text-lg font-bold text-[#6366f1]">+ AI Coach</div>
                <div className="w-8 h-[1px] bg-[rgba(255,255,255,0.1)] my-2.5" />
                <div className="text-[10px] text-[#55556a] uppercase tracking-[0.12em]">Lifetime Access</div>
              </div>
              <div className="absolute inset-[-10px] rounded-full border border-[rgba(99,102,241,0.1)] group-hover:border-[rgba(99,102,241,0.2)] transition-all duration-500" />
            </button>

            {/* Divider */}
            <div className="text-[#55556a] text-xs uppercase tracking-widest sm:rotate-0">or</div>

            {/* Tier 2: Journal only */}
            <button
              onClick={async () => {
                setSelectedTier('journal');
                const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier: 'journal' }) });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
                else setSelectedTier(null);
              }}
              className="group relative"
            >
              <div className={`glass w-44 h-44 rounded-full flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-500 ${selectedTier === 'journal' ? 'animate-pulse-glow scale-105' : 'group-hover:scale-[1.03]'}`}>
                <div className="text-[10px] text-[#8b8b9e] uppercase tracking-[0.2em] mb-2">Essential</div>
                <div className="text-lg font-bold mb-0.5">Journal X</div>
                <div className="w-8 h-[1px] bg-[rgba(255,255,255,0.1)] my-2.5" />
                <div className="text-[10px] text-[#55556a] uppercase tracking-[0.12em]">Lifetime Access</div>
              </div>
              <div className="absolute inset-[-10px] rounded-full border border-[rgba(255,255,255,0.04)] group-hover:border-[rgba(255,255,255,0.08)] transition-all duration-500" />
            </button>
          </div>

          <p className="text-xs text-[#55556a] mt-10">Powered by Stripe. Secure checkout.</p>
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
        return <HomeOrb onStartWeek={handleStartWeek} />;
      case 'journal':
        return <DailyJournal />;
      case 'log':
        return <TradeEntry onSaved={handleSaved} />;
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
    <div className="flex h-screen overflow-hidden">
      <RiskOverlay />
      <Sidebar active={activeTab} onNavigate={handleNavigate} />
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
