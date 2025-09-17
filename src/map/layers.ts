
import { LineLayer, ScatterplotLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import type { Lane, ZipPoint } from '../state/store';
import type { Color } from '@deck.gl/core';


const ACCENT_COLOR_NORMAL: Color = [0, 255, 51, 204]; // 80% opacity

// Colors for origin and destination points
const ORIGIN_COLOR: Color = [255, 100, 100, 200]; // Red for origins
const DESTINATION_COLOR: Color = [100, 150, 255, 200]; // Blue for destinations
const ORIGIN_COLOR_DIM: Color = [255, 100, 100, 100]; // Dimmed red
const DESTINATION_COLOR_DIM: Color = [100, 150, 255, 100]; // Dimmed blue

/**
 * Create heatmap layer
 */
export function createHeatmapLayer(
  points: ZipPoint[],
  radiusPixels: number,
  intensity: number,
  enabled: boolean
) {
  if (!enabled) return null;
  
  return new HeatmapLayer({
    id: 'heatmap',
    data: points,
    getPosition: (d: ZipPoint) => [d.lon, d.lat],
    getWeight: 1,
    radiusPixels,
    intensity,
    threshold: 0.03,
    // Blue → Green → Yellow → Orange → Red, similar to the screenshot
    colorRange: [
      [0, 0, 255, 0],     // deep blue, transparent at the very low end
      [0, 128, 255, 64],  // blue
      [0, 255, 255, 128], // cyan
      [0, 255, 0, 192],   // green
      [255, 255, 0, 224], // yellow
      [255, 165, 0, 240], // orange
      [255, 0, 0, 255],   // red
    ]
  });
}

/**
 * Create lane lines layer (2D straight lines)
 */
export function createLanesLayer(
  lanes: Lane[],
  onHover: (info: any) => void,
  onClick: (info: any) => void,
  lanesVisible: boolean = false
) {
  return new LineLayer({
    id: 'lanes',
    data: lanes,
    getSourcePosition: (d: Lane) => d.o,
    getTargetPosition: (d: Lane) => d.d,
    getColor: (d: Lane) => d.visible && lanesVisible ? ACCENT_COLOR_NORMAL : [0, 0, 0, 0],
    getWidth: 3,
    widthMinPixels: 2,
    widthMaxPixels: 6,
    pickable: true,
    onHover,
    onClick,
    updateTriggers: {
      getColor: [lanes.map(l => l.visible), lanesVisible],
      getSourcePosition: lanes,
      getTargetPosition: lanes,
    },
  });
}

/**
 * Create origin points layer
 */
export function createOriginPointsLayer(points: ZipPoint[], visible: boolean, onHover: (info: any) => void) {
  return new ScatterplotLayer({
    id: 'origin-points',
    data: points,
    getPosition: (d: ZipPoint) => [d.lon, d.lat],
    getRadius: 8,
    getFillColor: visible ? ORIGIN_COLOR : [0, 0, 0, 0],
    getLineColor: visible ? ORIGIN_COLOR_DIM : [0, 0, 0, 0],
    getLineWidth: 1,
    radiusMinPixels: 4,
    radiusMaxPixels: 12,
    pickable: visible,
    onHover: visible ? onHover : () => {},
    updateTriggers: {
      getPosition: points,
      getFillColor: [points, visible],
      getLineColor: [points, visible],
    },
  });
}

/**
 * Create destination points layer
 */
export function createDestinationPointsLayer(points: ZipPoint[], visible: boolean, onHover: (info: any) => void) {
  return new ScatterplotLayer({
    id: 'destination-points',
    data: points,
    getPosition: (d: ZipPoint) => [d.lon, d.lat],
    getRadius: 8,
    getFillColor: visible ? DESTINATION_COLOR : [0, 0, 0, 0],
    getLineColor: visible ? DESTINATION_COLOR_DIM : [0, 0, 0, 0],
    getLineWidth: 1,
    radiusMinPixels: 4,
    radiusMaxPixels: 12,
    pickable: visible,
    onHover: visible ? onHover : () => {},
    updateTriggers: {
      getPosition: points,
      getFillColor: [points, visible],
      getLineColor: [points, visible],
    },
  });
}



/**
 * Get all layers for the map
 */
export function getLayers(
  heatmapPoints: ZipPoint[],
  lanes: Lane[],
  tab: 'all' | 'origin' | 'destination',
  heatmapConfig: { radiusPixels: number; intensity: number; enabled: boolean },
  lanesVisible: boolean,
  pointsVisible: boolean,
  onLaneHover: (info: any) => void,
  onLaneClick: (info: any) => void,
  onOriginHover: (info: any) => void,
  onDestinationHover: (info: any) => void
) {
  const layers = [];

  // Heatmap layer (bottom)
  const heatmapLayer = createHeatmapLayer(
    heatmapPoints,
    heatmapConfig.radiusPixels,
    heatmapConfig.intensity,
    heatmapConfig.enabled
  );
  if (heatmapLayer) {
    layers.push(heatmapLayer);
  }

  // Lane arcs (hidden by default)
  layers.push(createLanesLayer(lanes, onLaneHover, onLaneClick, lanesVisible));

  // Show points that match the current heatmap data
  // This ensures the dots are at the center of heatmap circles
  if (tab === 'all' || tab === 'origin') {
    // Show origin points when viewing 'all' or 'origin' heatmap
    const originPointsToShow = tab === 'origin' ? heatmapPoints : heatmapPoints.filter(p =>
      lanes.some(lane => lane.origin_zip === p.zip)
    );
    layers.push(createOriginPointsLayer(originPointsToShow, pointsVisible, onOriginHover));
  }

  if (tab === 'all' || tab === 'destination') {
    // Show destination points when viewing 'all' or 'destination' heatmap
    const destinationPointsToShow = tab === 'destination' ? heatmapPoints : heatmapPoints.filter(p =>
      lanes.some(lane => lane.destination_zip === p.zip)
    );
    layers.push(createDestinationPointsLayer(destinationPointsToShow, pointsVisible, onDestinationHover));
  }

  return layers;
}
