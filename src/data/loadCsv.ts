import Papa from 'papaparse';
import type { Lane, ZipPoint } from '../state/store';
import { loadZipData, lookupZip, normalizeZip, sanitizeZip } from '../utils/zip';
import type { ZipData } from '../utils/zip';
import { bearing, midpoint, isInLower48 } from '../utils/geo';

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

// Create a fallback ZIP lookup that generates coordinates for unknown ZIP codes
function createFallbackZipData(zip: string): { lat: number; lon: number; city: string; state: string } | null {
  // For unknown ZIP codes, we'll generate approximate coordinates based on ZIP code patterns
  const zipNum = parseInt(zip);
  if (isNaN(zipNum) || zipNum < 1000 || zipNum > 99999) return null;

  // Very rough approximation based on ZIP code ranges
  // This is a simplified mapping - in production you'd want a more comprehensive solution
  let lat = 39.8283; // Center of US
  let lon = -98.5795; // Center of US
  let state = 'US';
  let city = 'Unknown';

  // Basic ZIP code region mapping (very simplified)
  if (zipNum >= 1000 && zipNum <= 19999) {
    // Northeast
    lat = 42.0 + Math.random() * 5;
    lon = -75.0 - Math.random() * 10;
    state = 'NE';
  } else if (zipNum >= 20000 && zipNum <= 39999) {
    // Southeast
    lat = 32.0 + Math.random() * 8;
    lon = -85.0 - Math.random() * 15;
    state = 'SE';
  } else if (zipNum >= 40000 && zipNum <= 59999) {
    // Midwest
    lat = 40.0 + Math.random() * 8;
    lon = -90.0 - Math.random() * 15;
    state = 'MW';
  } else if (zipNum >= 60000 && zipNum <= 79999) {
    // Central
    lat = 35.0 + Math.random() * 10;
    lon = -100.0 - Math.random() * 15;
    state = 'CT';
  } else if (zipNum >= 80000 && zipNum <= 99999) {
    // West
    lat = 38.0 + Math.random() * 10;
    lon = -115.0 - Math.random() * 15;
    state = 'WS';
  }

  return { lat, lon, city: `ZIP ${zip}`, state };
}


/**
 * Load and process CSV data from a file path
 */
export async function loadCsvData(csvPath: string = '/raw/sample.csv'): Promise<ProcessedData> {
  try {
    // Load ZIP code data
    const zipData = await loadZipData();

    // Load CSV data
    const csvResponse = await fetch(csvPath);
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

    return processCsvData(parseResult.data, zipData);
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

    return processCsvData(parseResult.data, zipData);
  } catch (error) {
    console.error('Error loading CSV file:', error);
    throw error;
  }
}

/**
 * Process parsed CSV data into lanes and points
 */
function processCsvData(rows: any[], zipData: Record<string, ZipData>): ProcessedData {
  const lanes: Lane[] = [];
  const originZips = new Set<string>();
  const destinationZips = new Set<string>();
  const allZips = new Set<string>();
  const originToCustomers: Record<string, Set<string>> = {};
  const invalidZips = new Set<string>();

  // Process each row
  rows.forEach((row: any, index) => {
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
      return;
    }
    if (!destinationZip) {
      if (destinationRaw) {
        console.warn(`Invalid destination ZIP format: "${destinationRaw}" -> normalized: "${normalizeZip(destinationRaw)}"`);
        invalidZips.add(String(destinationRaw));
      }
      return;
    }

    // Look up coordinates from local dataset, use fallback if not found
    let originData = lookupZip(originZip, zipData);
    let destinationData = lookupZip(destinationZip, zipData);

    // Use fallback data if ZIP not found in reference
    if (!originData) {
      originData = createFallbackZipData(originZip);
      if (!originData) {
        invalidZips.add(originZip);
        console.warn(`Could not process origin ZIP ${originZip} - invalid format`);
        return;
      }
      console.log(`Using fallback data for origin ZIP: ${originZip}`);
    }

    if (!destinationData) {
      destinationData = createFallbackZipData(destinationZip);
      if (!destinationData) {
        invalidZips.add(destinationZip);
        console.warn(`Could not process destination ZIP ${destinationZip} - invalid format`);
        return;
      }
      console.log(`Using fallback data for destination ZIP: ${destinationZip}`);
    }

    const originCoords: [number, number] = [originData.lon, originData.lat];
    const destinationCoords: [number, number] = [destinationData.lon, destinationData.lat];

    // Skip if not in lower 48 (but don't mark as invalid - just filter out)
    if (!isInLower48(originCoords) || !isInLower48(destinationCoords)) {
      console.warn(`ZIP codes ${originZip} -> ${destinationZip} outside lower 48 states, skipping`);
      return;
    }

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
  });

  // Create point arrays
  const pointsAll = createZipPoints(allZips, zipData);
  const pointsOrigin = createZipPoints(originZips, zipData);
  const pointsDestination = createZipPoints(destinationZips, zipData);

  // Log invalid ZIPs
  if (invalidZips.size > 0) {
    console.warn(`${invalidZips.size} ZIP codes not found in reference data:`, Array.from(invalidZips));
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

/**
 * Create ZipPoint array from ZIP codes
 */
function createZipPoints(zipCodes: Set<string>, zipData: Record<string, ZipData>): ZipPoint[] {
  const points: ZipPoint[] = [];

  zipCodes.forEach(zip => {
    let data = lookupZip(zip, zipData);

    // Use fallback data if not found in reference
    if (!data) {
      data = createFallbackZipData(zip);
    }

    if (data && isInLower48([data.lon, data.lat])) {
      points.push({
        zip,
        lon: data.lon,
        lat: data.lat,
        city: data.city,
        state: data.state,
      });
    }
  });

  return points;
}
