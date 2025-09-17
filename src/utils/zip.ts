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
 */
export async function loadZipData(): Promise<Record<string, ZipData>> {
  try {
    const response = await fetch('/assets/us-zips.json');
    if (!response.ok) {
      throw new Error(`Failed to load ZIP data: ${response.statusText}`);
    }
    return await response.json();
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
