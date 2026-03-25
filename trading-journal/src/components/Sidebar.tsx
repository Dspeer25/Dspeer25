'use client';

import { TabId } from '@/lib/types';

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'entry', label: 'New Trade', icon: '＋' },
  { id: 'entries', label: 'Entries', icon: '☰' },
  { id: 'calendar', label: 'Calendar', icon: '▦' },
  { id: 'journal', label: 'Journal', icon: '✎' },
  { id: 'stats', label: 'Stats', icon: '◈' },
  { id: 'leaderboard', label: 'Performance', icon: '▲' },
  { id: 'focus', label: 'Focus', icon: '▶' },
  { id: 'analysis', label: 'Analysis', icon: '◉' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar({
  active,
  onNavigate,
}: {
  active: TabId;
  onNavigate: (tab: TabId) => void;
}) {
  return (
    <aside className="w-16 lg:w-52 bg-bg-secondary border-r border-border-primary flex flex-col h-screen shrink-0">
      <div className="p-4 border-b border-border-primary">
        <h1 className="text-lg font-bold text-text-primary hidden lg:block">TJ</h1>
        <h1 className="text-lg font-bold text-text-primary lg:hidden text-center">T</h1>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              active === tab.id
                ? 'bg-accent-blue/10 text-accent-blue border-r-2 border-accent-blue'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            <span className="text-base w-5 text-center shrink-0">{tab.icon}</span>
            <span className="hidden lg:inline">{tab.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
