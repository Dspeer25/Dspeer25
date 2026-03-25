'use client';

import { useState, useCallback } from 'react';
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

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('entry');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

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
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {renderTab()}
      </main>
    </div>
  );
}
