

import { LaneControls } from './LaneControls';
import { HeatmapTabs } from './HeatmapTabs';
import { HeatmapControls } from './HeatmapControls';
import { FileInfo } from './FileInfo';
import { loadCsvFromFile } from '../data/loadCsv';
import { useAppStore } from '../state/store';

export function Sidebar() {
  const {
    setLanes,
    setPoints,
    setOriginToCustomers,
    setCurrentFileName,
    setLoading,
    setError,
  } = useAppStore();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await loadCsvFromFile(file);

      setLanes(data.lanes);
      setPoints(data.pointsAll, data.pointsOrigin, data.pointsDestination);
      setOriginToCustomers(data.originToCustomers);
      setCurrentFileName(file.name);

      console.log(`Successfully loaded ${data.lanes.length} lanes from ${file.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CSV file');
    } finally {
      setLoading(false);
    }
  };

  const resetView = () => {
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
      {/* File Information */}
      <div className="section">
        <div className="section-title">File Information</div>
        <FileInfo />
      </div>

      {/* Action Buttons */}
      <div className="section">
        <div className="section-title">Actions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            id="sidebar-csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="sidebar-csv-upload"
            className="btn btn-ghost"
            style={{ cursor: 'pointer' }}
          >
            Load CSV
          </label>
          <button
            onClick={resetView}
            className="btn btn-ghost"
          >
            Reset View
          </button>
        </div>
      </div>

      {/* Lane Controls */}
      <div className="section">
        <div className="section-title">Lane Controls</div>
        <LaneControls />
      </div>

      {/* Heatmap Tabs */}
      <div className="section">
        <div className="section-title">Heatmap</div>
        <HeatmapTabs />
      </div>

      {/* Heatmap Controls */}
      <div className="section">
        <div className="section-title">Heatmap Settings</div>
        <HeatmapControls />
      </div>
    </div>
  );
}
