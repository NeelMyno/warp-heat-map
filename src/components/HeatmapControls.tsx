import { useAppStore } from '../state/store';

export function HeatmapControls() {
  const { heatmap, setHeatmap } = useAppStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Enable/Disable Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ color: 'var(--text-1)', fontSize: '12px' }}>Show Heatmap</label>
        <label className="switch">
          <input
            type="checkbox"
            checked={heatmap.enabled}
            onChange={(e) => setHeatmap({ enabled: e.target.checked })}
          />
          <div className="track">
            <div className="thumb"></div>
          </div>
        </label>
      </div>

      {/* Radius Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ color: 'var(--text-1)', fontSize: '12px' }}>Radius</label>
          <span style={{ color: 'var(--accent)', fontSize: '12px' }}>
            {heatmap.radiusPixels}px
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="200"
          value={heatmap.radiusPixels}
          onChange={(e) => setHeatmap({ radiusPixels: Number(e.target.value) })}
          className="range"
        />
      </div>

      {/* Intensity Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ color: 'var(--text-1)', fontSize: '12px' }}>Intensity</label>
          <span style={{ color: 'var(--accent)', fontSize: '12px' }}>
            {heatmap.intensity.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={heatmap.intensity}
          onChange={(e) => setHeatmap({ intensity: Number(e.target.value) })}
          className="range"
        />
      </div>
    </div>
  );
}
