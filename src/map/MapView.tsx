
import React, { useState, useCallback, useRef } from 'react';
import { Map } from 'react-map-gl/maplibre';
import { DeckGL } from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
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
  const [highlightFeature, setHighlightFeature] = useState<any | null>(null);
  const zctaCacheRef = useRef<Map<string, any>>(new globalThis.Map<string, any>());

  // Debounced tooltip setter to avoid flickering
  const debouncedSetTooltip = useCallback(
    debounce((tooltipInfo: typeof tooltip) => {
      setTooltip(tooltipInfo);
    }, 50),
    []
  );

  // State code -> full name (lowercase) for OpenDataDE filenames
  const stateNameByCode: Record<string, string> = {
    AL: 'alabama', AK: 'alaska', AZ: 'arizona', AR: 'arkansas', CA: 'california', CO: 'colorado',
    CT: 'connecticut', DE: 'delaware', FL: 'florida', GA: 'georgia', HI: 'hawaii', ID: 'idaho',
    IL: 'illinois', IN: 'indiana', IA: 'iowa', KS: 'kansas', KY: 'kentucky', LA: 'louisiana',
    ME: 'maine', MD: 'maryland', MA: 'massachusetts', MI: 'michigan', MN: 'minnesota',
    MS: 'mississippi', MO: 'missouri', MT: 'montana', NE: 'nebraska', NV: 'nevada',
    NH: 'new_hampshire', NJ: 'new_jersey', NM: 'new_mexico', NY: 'new_york', NC: 'north_carolina',
    ND: 'north_dakota', OH: 'ohio', OK: 'oklahoma', OR: 'oregon', PA: 'pennsylvania',
    RI: 'rhode_island', SC: 'south_carolina', SD: 'south_dakota', TN: 'tennessee', TX: 'texas',
    UT: 'utah', VT: 'vermont', VA: 'virginia', WA: 'washington', WV: 'west_virginia',
    WI: 'wisconsin', WY: 'wyoming', DC: 'district_of_columbia'
  };

  const fetchZctaFeature = useCallback(async (zip: string, stateCode?: string | null) => {
    if (!stateCode) return null;
    const upper = stateCode.toUpperCase();
    const fullname = stateNameByCode[upper];
    if (!fullname) return null;

    // Cache by ZIP to avoid repeated downloads
    const cached = zctaCacheRef.current.get(zip);
    if (cached) return cached;

    const url = `https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/${upper.toLowerCase()}_${fullname}_zip_codes_geo.min.json`;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const fc = await res.json();
      if (fc && Array.isArray(fc.features)) {
        const feat = fc.features.find((f: any) =>
          (f.properties?.ZCTA5CE10 === zip) || (f.properties?.ZCTA5CE20 === zip)
        );
        if (feat) {
          zctaCacheRef.current.set(zip, feat);
          return feat;
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }, []);

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

  // Handle origin hover (and destination hover)
  const handleOriginHover = useCallback((info: any) => {
    if (info.object && info.x !== undefined && info.y !== undefined) {
      const zipPoint = info.object;
      const customers = originToCustomers[zipPoint.zip];

      // Tooltip
      if (customers && customers.size > 0) {
        const content = createOriginTooltip(zipPoint, customers);
        debouncedSetTooltip({
          x: info.x,
          y: info.y,
          content: (
            <div className="text-white rounded-lg border border-[#333] shadow-2xl bg-[#121212]">
              {content}
            </div>
          ),
        });
      }

      // Highlight ZCTA polygon (best-effort; async)
      fetchZctaFeature(zipPoint.zip, zipPoint.state).then((feat) => {
        setHighlightFeature(feat || null);
      });
    } else {
      debouncedSetTooltip(null);
      setHighlightFeature(null);
    }
  }, [originToCustomers, debouncedSetTooltip, fetchZctaFeature]);

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

  if (highlightFeature) {
    layers.push(new GeoJsonLayer({
      id: 'zcta-highlight',
      data: highlightFeature,
      stroked: true,
      filled: true,
      pickable: false,
      getFillColor: [0, 255, 51, 40],
      getLineColor: [0, 255, 51, 180],
      lineWidthMinPixels: 2,
    }) as any);
  }

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
