
import React, { useState, useCallback } from 'react';
import { Map } from 'react-map-gl/maplibre';
import { DeckGL } from '@deck.gl/react';
import { useAppStore } from '../state/store';
import { getLayers } from './layers';
import { createLaneTooltip, createOriginTooltip, debounce } from './tooltips';
import { getInitialViewport } from '../utils/geo';

export function MapView() {
  const {
    getHeatmapPoints,
    getVisibleLanes,
    originToCustomers,
    heatmap,
    lanesVisible,
    pointsVisible,
    tab,
    toggleLane,
  } = useAppStore();

  const [viewState, setViewState] = useState(getInitialViewport());
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: React.ReactNode;
  } | null>(null);

  // Debounced tooltip setter to avoid flickering
  const debouncedSetTooltip = useCallback(
    debounce((tooltipInfo: typeof tooltip) => {
      setTooltip(tooltipInfo);
    }, 50),
    []
  );

  // Handle lane hover
  const handleLaneHover = useCallback((info: any) => {
    if (info.object && info.x !== undefined && info.y !== undefined) {
      const content = createLaneTooltip(info.object);
      debouncedSetTooltip({
        x: info.x,
        y: info.y,
        content: (
          <div className="text-[#00ff33] px-2 py-1 rounded text-xs bg-[#121212] border border-[#333] font-medium">
            {content}
          </div>
        ),
      });
    } else {
      debouncedSetTooltip(null);
    }
  }, [debouncedSetTooltip]);

  // Handle lane click
  const handleLaneClick = useCallback((info: any) => {
    if (info.object) {
      toggleLane(info.object.id);
    }
  }, [toggleLane]);

  // Handle origin hover
  const handleOriginHover = useCallback((info: any) => {
    if (info.object && info.x !== undefined && info.y !== undefined) {
      const zipPoint = info.object;
      const customers = originToCustomers[zipPoint.zip];
      
      if (customers && customers.size > 0) {
        const content = createOriginTooltip(zipPoint, customers);
        debouncedSetTooltip({
          x: info.x,
          y: info.y,
          content: (
            <div className="text-white rounded-lg border border-[#333] shadow-2xl
              bg-[#121212]">
              {content}
            </div>
          ),
        });
      }
    } else {
      debouncedSetTooltip(null);
    }
  }, [originToCustomers, debouncedSetTooltip]);

  // Get current data
  const heatmapPoints = getHeatmapPoints();
  const visibleLanes = getVisibleLanes();

  // Create layers
  const layers = getLayers(
    heatmapPoints,
    visibleLanes,
    tab,
    heatmap,
    lanesVisible,
    pointsVisible,
    handleLaneHover,
    handleLaneClick,
    handleOriginHover,
    handleOriginHover // Use same handler for destination hover for now
  );

  return (
    <div className="relative w-full h-full">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState as any)}
        controller={true}
        layers={layers}
        style={{ position: 'relative' }}
      >
        <Map
          // Dark Matter with labels (shows states and cities as you zoom), dark background per your preference
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          style={{ background: '#121212' }}
        />
      </DeckGL>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
