import { useAppStore } from '../state/store';
import type { TabType } from '../state/store';

export function HeatmapTabs() {
  const { tab, setTab, heatmap, setHeatmap, pointsVisible, setPointsVisible } = useAppStore();

  const tabs: { id: TabType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'origin', label: 'Origin' },
    { id: 'destination', label: 'Destination' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Tab Selection */}
      <div className="tabs">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`tab ${tab === tabItem.id ? 'is-active' : ''}`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Visibility Controls */}
      <div className="tabs">
        <button
          onClick={() => setHeatmap({ enabled: !heatmap.enabled })}
          className={`tab ${heatmap.enabled ? 'is-active' : ''}`}
        >
          Heatmap
        </button>
        <button
          onClick={() => setPointsVisible(!pointsVisible)}
          className={`tab ${pointsVisible ? 'is-active' : ''}`}
        >
          Points
        </button>
      </div>
    </div>
  );
}
