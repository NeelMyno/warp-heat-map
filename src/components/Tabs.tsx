
import React from 'react';
import type { TabType } from '../state/store';
import { useAppStore } from '../state/store';

const tabs: { id: TabType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'origin', label: 'Origin' },
  { id: 'destination', label: 'Destination' },
];

export function Tabs() {
  const { tab, setTab } = useAppStore();

  return (
    <div className="flex bg-[#242424] border border-[#2a2a2a] rounded-xl p-1">
      {tabs.map((tabItem) => (
        <button
          key={tabItem.id}
          onClick={() => setTab(tabItem.id)}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${tab === tabItem.id
              ? 'bg-[#00ff33] text-black'
              : 'text-[#888] hover:text-white hover:bg-[#2a2a2a]'
            }
          `}
        >
          {tabItem.label}
        </button>
      ))}
    </div>
  );
}
