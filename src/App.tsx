
import { useEffect, useState } from 'react';
import { useAppStore } from './state/store';
import { loadCsvData } from './data/loadCsv';

import { Sidebar } from './components/Sidebar';
import { MapView } from './map/MapView';

function App() {
  const {
    setLanes,
    setPoints,
    setOriginToCustomers,
    setLoading,
    setError,
    isLoading,
    error,
  } = useAppStore();

  const [invalidZipCount, setInvalidZipCount] = useState(0);
  const [showInvalidZipWarning, setShowInvalidZipWarning] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await loadCsvData();

        setLanes(data.lanes);
        setPoints(data.pointsAll, data.pointsOrigin, data.pointsDestination);
        setOriginToCustomers(data.originToCustomers);

        if (data.invalidZips.length > 0) {
          setInvalidZipCount(data.invalidZips.length);
          setShowInvalidZipWarning(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setLanes, setPoints, setOriginToCustomers, setLoading, setError]);



  if (isLoading) {
    return (
      <div className="app" style={{ placeItems: 'center' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
          <div style={{ color: 'var(--text-0)' }}>Loading lane data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app" style={{ placeItems: 'center' }}>
        <div className="text-center max-w-md">
          <div style={{ color: '#ff4444', fontSize: '18px', marginBottom: '16px' }}>Error Loading Data</div>
          <div style={{ color: 'var(--text-1)', marginBottom: '16px' }}>{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="title">Lane Heatmap</div>
      </header>

      {/* ZIP fallback info */}
      {showInvalidZipWarning && (
        <div className="chip" style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 50,
          background: 'rgba(0,255,51,0.1)',
          border: '1px solid rgba(0,255,51,0.35)'
        }}>
          <span style={{ color: 'var(--text-0)', fontSize: '12px' }}>
            ℹ️ {invalidZipCount} ZIP codes could not be resolved from the local dataset
          </span>
          <button
            onClick={() => setShowInvalidZipWarning(false)}
            className="icon-btn"
            style={{ width: '20px', height: '20px', marginLeft: '8px' }}
          >
            <svg style={{ width: '12px', height: '12px' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div className="sidebar">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="main">
        <div className="map-wrap">
          <MapView />
        </div>
      </main>
    </div>
  );
}

export default App;
