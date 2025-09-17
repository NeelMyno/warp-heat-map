/**
 * Calculate the bearing (direction) from point A to point B in degrees
 */
export function bearing([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

/**
 * Calculate the midpoint between two coordinates
 */
export function midpoint([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]): [number, number] {
  return [(lon1 + lon2) / 2, (lat1 + lat2) / 2];
}

/**
 * Bounds for the lower 48 US states
 */
export const LOWER_48_BOUNDS: [[number, number], [number, number]] = [
  [-125, 24.5], // Southwest corner [lon, lat]
  [-66, 49.5]   // Northeast corner [lon, lat]
];

/**
 * Check if coordinates are within the lower 48 states
 */
export function isInLower48([lon, lat]: [number, number]): boolean {
  const [[minLon, minLat], [maxLon, maxLat]] = LOWER_48_BOUNDS;
  return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
}

/**
 * Calculate the initial viewport for the map to fit the lower 48
 */
export function getInitialViewport() {
  const [[minLon, minLat], [maxLon, maxLat]] = LOWER_48_BOUNDS;
  
  return {
    longitude: (minLon + maxLon) / 2,
    latitude: (minLat + maxLat) / 2,
    zoom: 3.5,
    minZoom: 3,
    maxZoom: 10,
  };
}
