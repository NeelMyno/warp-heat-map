import Papa from 'papaparse';
import type { Lane, ZipPoint } from '../state/store';
import { loadZipData, lookupZip, lookupZipWithFallback, normalizeZip, sanitizeZip } from '../utils/zip';
import type { ZipData } from '../utils/zip';
import { bearing, midpoint } from '../utils/geo';

export interface CsvRow {
  'Company Name': string;
  origin: string;
  destination: string;
}

export interface ProcessedData {
  lanes: Lane[];
  pointsAll: ZipPoint[];
  pointsOrigin: ZipPoint[];
  pointsDestination: ZipPoint[];
  originToCustomers: Record<string, Set<string>>;
  invalidZips: string[];
}

// Canonicalize headers: remove spaces/symbols and lowercase
const canonicalizeHeader = (header: string) => header.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const ORIGIN_KEYS = ['origin', 'originzip', 'originzipcode', 'fromzip', 'pickupzip', 'shipperzip', 'orig', 'origzip', 'from', 'pickup', 'shipper'];
const DEST_KEYS = ['destination', 'destinationzip', 'destinationzipcode', 'destzip', 'tozip', 'deliveryzip', 'consigneezip', 'dest', 'to', 'delivery', 'consignee'];
const COMPANY_KEYS = ['companyname', 'customer', 'customername', 'name', 'account', 'company', 'client', 'business'];

function pickFirst(row: any, keys: string[]): string | undefined {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim() !== '') return String(row[k]);
  }
  return undefined;
}

/**
 * Load and process CSV data from a file path
 * - Path resolution order:
 *   1) explicit csvPath argument
 *   2) URL query ?csv=filename.csv (served from /raw)
 *   3) Vite env VITE_CSV_PATH (absolute or under /raw)
 *   4) default: /raw/sample.csv
 */
export async function loadCsvData(csvPath?: string): Promise<ProcessedData> {
  // Resolve path
  let path = csvPath;
  try {
    if (!path) {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('csv');
      if (q) {
        // Sanitize filename
        const safe = q.replace(/[^a-zA-Z0-9_./-]/g, '');
        path = safe.startsWith('/raw/') ? safe : `/raw/${safe}`;
      }
    }
    if (!path) {
      const envPath = (import.meta as any).env?.VITE_CSV_PATH as string | undefined;
      if (envPath && typeof envPath === 'string') {
        path = envPath;
      }
    }
  } catch {}
  if (!path) path = '/raw/sample.csv';

  try {
    // Load ZIP code data
    const zipData = await loadZipData();

    // Load CSV data
    const csvResponse = await fetch(path);
    if (!csvResponse.ok) {
      throw new Error(`Failed to load CSV: ${csvResponse.statusText}`);
    }

    const csvText = await csvResponse.text();

    // Parse CSV
    const parseResult = Papa.parse<any>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: canonicalizeHeader,
    });

    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing errors:', parseResult.errors);
    }

    return await processCsvData(parseResult.data, zipData);
  } catch (error) {
    console.error('Error loading CSV data:', error);
    throw error;
  }
}

/**
 * Load and process CSV data from an uploaded file
 */
export async function loadCsvFromFile(file: File): Promise<ProcessedData> {
  try {
    // Load ZIP code data
    const zipData = await loadZipData();

    // Read file content
    const csvText = await file.text();

    // Parse CSV
    const parseResult = Papa.parse<any>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: canonicalizeHeader,
    });

    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing errors:', parseResult.errors);
    }

    return await processCsvData(parseResult.data, zipData);
  } catch (error) {
    console.error('Error loading CSV file:', error);
    throw error;
  }
}

/**
 * Process parsed CSV data into lanes and points
 */
async function processCsvData(rows: any[], zipData: Record<string, ZipData>): Promise<ProcessedData> {
  const lanes: Lane[] = [];
  const originZips = new Set<string>();
  const destinationZips = new Set<string>();
  const allZips = new Set<string>();
  const originToCustomers: Record<string, Set<string>> = {};
  const invalidZips = new Set<string>();
  const resolvedZip = new Map<string, ZipData>();

  // Process each row
  for (let index = 0; index < rows.length; index++) {
    const row: any = rows[index];
    // Support a variety of header names
    const originRaw = pickFirst(row, ORIGIN_KEYS);
    const destinationRaw = pickFirst(row, DEST_KEYS);
    const customerName = (pickFirst(row, COMPANY_KEYS) ?? 'Unknown').trim();

    const originZip = sanitizeZip(originRaw ?? '');
    const destinationZip = sanitizeZip(destinationRaw ?? '');

    if (!originZip) {
      if (originRaw) {
        console.warn(`Invalid origin ZIP format: "${originRaw}" -> normalized: "${normalizeZip(originRaw)}"`);
        invalidZips.add(String(originRaw));
      }
      continue;
    }
    if (!destinationZip) {
      if (destinationRaw) {
        console.warn(`Invalid destination ZIP format: "${destinationRaw}" -> normalized: "${normalizeZip(destinationRaw)}"`);
        invalidZips.add(String(destinationRaw));
      }
      continue;
    }

    // Look up coordinates from local dataset, deterministically fall back to cached geocoding
    let originData = lookupZip(originZip, zipData) || resolvedZip.get(originZip) || await lookupZipWithFallback(originZip, zipData);
    let destinationData = lookupZip(destinationZip, zipData) || resolvedZip.get(destinationZip) || await lookupZipWithFallback(destinationZip, zipData);

    if (!originData) {
      invalidZips.add(originZip);
      console.warn(`Could not resolve origin ZIP ${originZip}`);
      continue;
    }
    if (!destinationData) {
      invalidZips.add(destinationZip);
      console.warn(`Could not resolve destination ZIP ${destinationZip}`);
      continue;
    }

    resolvedZip.set(originZip, originData);
    resolvedZip.set(destinationZip, destinationData);

    const originCoords: [number, number] = [originData.lon, originData.lat];
    const destinationCoords: [number, number] = [destinationData.lon, destinationData.lat];

    // Calculate bearing and midpoint
    const laneId = `${originZip}-${destinationZip}-${index}`;
    const laneBearing = bearing(originCoords, destinationCoords);
    const laneMidpoint = midpoint(originCoords, destinationCoords);

    // Create lane
    const lane: Lane = {
      id: laneId,
      origin_zip: originZip,
      destination_zip: destinationZip,
      customer_name: customerName,
      o: originCoords,
      d: destinationCoords,
      bearing: laneBearing,
      midpoint: laneMidpoint,
      visible: true,
    };

    lanes.push(lane);

    // Track ZIP codes
    originZips.add(originZip);
    destinationZips.add(destinationZip);
    allZips.add(originZip);
    allZips.add(destinationZip);

    // Track customers per origin
    if (!originToCustomers[originZip]) {
      originToCustomers[originZip] = new Set();
    }
    originToCustomers[originZip].add(customerName);
  }

  // Create point arrays from resolved data (no randomness, no online calls)
  const toPoint = (zip: string): ZipPoint | null => {
    const d = resolvedZip.get(zip) || lookupZip(zip, zipData);
    if (!d) return null;
    return { zip, lon: d.lon, lat: d.lat, city: d.city, state: d.state };
  };

  const pointsAll: ZipPoint[] = Array.from(allZips).map(toPoint).filter(Boolean) as ZipPoint[];
  const pointsOrigin: ZipPoint[] = Array.from(originZips).map(toPoint).filter(Boolean) as ZipPoint[];
  const pointsDestination: ZipPoint[] = Array.from(destinationZips).map(toPoint).filter(Boolean) as ZipPoint[];

  // Log invalid ZIPs
  if (invalidZips.size > 0) {
    console.warn(`${invalidZips.size} ZIP codes could not be resolved:`, Array.from(invalidZips));
  }

  return {
    lanes,
    pointsAll,
    pointsOrigin,
    pointsDestination,
    originToCustomers,
    invalidZips: Array.from(invalidZips),
  };
}
