/**
 * Normalize or sanitize ZIP inputs.
 * - Strips non-digits (handles ZIP+4 like 12345-6789)
 * - Uses the first 5 digits if 5+ are present
 * - Pads with leading zeros if 4 digits (common for Northeast ZIP codes)
 * - Returns empty string when fewer than 4 digits are present
 */
export function normalizeZip(zip: string | number): string {
  const digits = String(zip ?? '')
    .match(/[0-9]/g)?.join('') ?? '';

  if (digits.length >= 5) return digits.slice(0, 5);
  if (digits.length === 4) return '0' + digits; // Pad with leading zero
  return ''; // Less than 4 digits is invalid
}

/**
 * Also expose a helper that returns null when invalid
 */
export function sanitizeZip(zip: string | number): string | null {
  const z = normalizeZip(zip);
  return z || null;
}

/**
 * ZIP code data interface
 */
export interface ZipData {
  lat: number;
  lon: number;
  city: string;
  state: string;
}

/**
 * Load and parse ZIP code data
 * - Loads base dataset
 * - Optionally merges an extra dataset if present (user-provided overrides)
 */
import { ZIP_BASE_PATH, ZIP_EXTRA_PATH, ENABLE_ONLINE_ZIP_FALLBACK } from '../config';

export async function loadZipData(): Promise<Record<string, ZipData>> {
  try {
    const [baseRes, extraRes] = await Promise.all([
      fetch(ZIP_BASE_PATH),
      // Try to load extra dataset; ignore if missing (404)
      fetch(ZIP_EXTRA_PATH).catch(() => new Response(null, { status: 404 }))
    ]);

    if (!baseRes.ok) {
      throw new Error(`Failed to load ZIP data: ${baseRes.status} ${baseRes.statusText}`);
    }

    // Helper: parse either a mapping object or an array of rows (e.g., OpenDataDE uszips.min.json)
    const parseSource = async (res: Response | null): Promise<Record<string, ZipData>> => {
      if (!res || !res.ok) return {};
      const text = await res.text();
      try {
        const json: any = JSON.parse(text);
        if (Array.isArray(json)) {
          const out: Record<string, ZipData> = {};
          for (const row of json) {
            const z = normalizeZip(row?.zip ?? row?.ZCTA5CE10 ?? row?.postalCode ?? row?.postcode ?? row?.code ?? '');
            const lat = Number(row?.lat ?? row?.latitude ?? row?.INTPTLAT ?? row?.y);
            const lon = Number(row?.lon ?? row?.lng ?? row?.longitude ?? row?.INTPTLON ?? row?.x);
            if (!z || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
            const city = String(row?.city ?? row?.place ?? row?.place_name ?? row?.placeName ?? row?.PO_NAME ?? '');
            const state = String(row?.state ?? row?.state_id ?? row?.state_code ?? row?.STUSPS ?? row?.STATE ?? '');
            out[z] = { lat, lon, city, state };
          }
          return out;
        }
        // Assume mapping already in the expected shape
        return json as Record<string, ZipData>;
      } catch (e) {
        console.warn('ZIP dataset parse error; ignoring this source.', e);
        return {};
      }
    };

    const base = await parseSource(baseRes);
    const extra = await parseSource(extraRes as any);

    // Merge, extra overrides base when keys collide
    return { ...base, ...extra };
  } catch (error) {
    console.error('Error loading ZIP data:', error);
    throw error;
  }
}

/**
 * Lookup ZIP code coordinates
 */
export function lookupZip(zip: string, zipData: Record<string, ZipData>): ZipData | null {
  const normalizedZip = normalizeZip(zip);
  if (!normalizedZip) return null;
  return zipData[normalizedZip] || null;
}

/**
 * Deterministic fallback: cached geocoding for unknown ZIPs
 * - If online fallback is disabled, returns null immediately (no network)
 * - Otherwise: checks localStorage first, then queries Nominatim (subject to CORS)
 */
export async function lookupZipWithFallback(zip: string, zipData: Record<string, ZipData>): Promise<ZipData | null> {
  const z = normalizeZip(zip);
  if (!z) return null;
  const local = lookupZip(z, zipData);
  if (local) return local;

  // Respect configuration: avoid online calls by default
  if (!ENABLE_ONLINE_ZIP_FALLBACK) {
    return null;
  }

  // LocalStorage cache key
  const cacheKey = `zipcache:${z}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as ZipData;
      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
        return parsed;
      }
    }
  } catch {}

  // Online geocode (once), with timeout
  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 4500);
    // Use dev proxy to avoid CORS in development; set up in vite.config.ts
    const url = `/nominatim/search?format=json&countrycodes=us&postalcode=${encodeURIComponent(z)}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'warp-heat-map/1.0 (ZIP centroid lookup)'
      },
      signal: controller.signal
    });
    clearTimeout(to);

    if (res.ok) {
      const arr = await res.json();
      if (Array.isArray(arr) && arr.length > 0) {
        // Pick the first result; Nominatim lat/lon are strings
        const best = arr[0];
        const lat = Number(best.lat);
        const lon = Number(best.lon);
        // Try to extract state code from display_name or address
        let state = '';
        try {
          if (best.address && typeof best.address.state === 'string') {
            state = best.address.state_code || best.address.state || '';
          }
        } catch {}
        const city = (best.address && (best.address.city || best.address.town || best.address.village)) || `ZIP ${z}`;
        const val: ZipData = { lat, lon, city: String(city), state: String(state || '') };
        try { localStorage.setItem(cacheKey, JSON.stringify(val)); } catch {}
        return val;
      }
    }
  } catch (e) {
    console.warn(`Geocode failed for ZIP ${z}:`, e);
  }

  return null;
}
