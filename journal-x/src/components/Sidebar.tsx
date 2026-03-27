'use client';

import { TabId } from '@/lib/types';

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '◎' },
  { id: 'journal', label: 'Journal', icon: '✎' },
  { id: 'log', label: 'Log Trade', icon: '＋' },
  { id: 'entries', label: 'Entries', icon: '☰' },
  { id: 'calendar', label: 'Calendar', icon: '▦' },
  { id: 'stats', label: 'Stats', icon: '◈' },
  { id: 'toolkit', label: 'Toolkit', icon: '⚡' },
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
    <aside className="w-14 lg:w-52 glass border-r border-[rgba(255,255,255,0.04)] flex flex-col h-screen shrink-0">
      <div className="p-3 lg:p-4 border-b border-[rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#6366f1]/15 border border-[#6366f1]/25 flex items-center justify-center shrink-0">
            <span className="text-[#6366f1] text-[10px] font-black">X</span>
          </div>
          <span className="text-sm font-semibold tracking-tight hidden lg:block">Journal X</span>
        </div>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 text-sm transition-all ${
              active === tab.id
                ? 'bg-[#6366f1]/10 text-[#6366f1] border-r-2 border-[#6366f1]'
                : 'text-[#8b8b9e] hover:text-[#f0f0f5] hover:bg-[rgba(255,255,255,0.03)]'
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
