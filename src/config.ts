// Global configuration for the app
// Toggle online ZIP geocoding fallback (browser fetch to third-party APIs)
// Disabled by default to avoid CORS issues and ensure deterministic behavior.
// Can be enabled via Vite env: VITE_ENABLE_ONLINE_ZIP_FALLBACK=true

export const ENABLE_ONLINE_ZIP_FALLBACK: boolean =
  String(import.meta.env?.VITE_ENABLE_ONLINE_ZIP_FALLBACK ?? '').toLowerCase() === 'true';

// Optional additional dataset path. If present, it will be merged over the base dataset.
export const ZIP_EXTRA_PATH = '/assets/us-zips-extra.json';
export const ZIP_BASE_PATH = '/assets/us-zips.json';

