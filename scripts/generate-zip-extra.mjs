#!/usr/bin/env node
// Generate public/assets/us-zips-extra.json for ZIPs found in a CSV under public/raw
// Usage: node scripts/generate-zip-extra.mjs [csvFilename]
// Defaults to public/raw/sample.csv

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const csvRel = process.argv[2] || 'public/raw/sample.csv';
const csvPath = resolve(csvRel);

function extractZips(csvText) {
  const zips = new Set();
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return zips;
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/,\s*([^,\s]+)\s*,\s*([^,\s]+)\s*$/);
    if (m) {
      const a = m[1].replace(/[^0-9]/g, '');
      const b = m[2].replace(/[^0-9]/g, '');
      if (a.length >= 4) zips.add(a.padStart(5, '0').slice(0,5));
      if (b.length >= 4) zips.add(b.padStart(5, '0').slice(0,5));
    }
  }
  return zips;
}

async function lookupZip(zip) {
  const url = `https://api.zippopotam.us/us/${zip}`;
  try {
    const res = await fetch(url, { headers: { 'accept': 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const place = data.places && data.places[0];
    if (!place) return null;
    return {
      lat: Number(place.latitude),
      lon: Number(place.longitude),
      city: String(place["place name"]) || '',
      state: String(place["state abbreviation"]) || '',
    };
  } catch (e) {
    return null;
  }
}

async function main() {
  const csvText = readFileSync(csvPath, 'utf8');
  const zips = Array.from(extractZips(csvText));
  console.log(`Found ${zips.length} unique ZIPs in ${csvRel}`);

  const out = {};
  for (let i = 0; i < zips.length; i++) {
    const z = zips[i];
    const info = await lookupZip(z);
    if (info) {
      out[z] = info;
    } else {
      console.warn(`Failed to resolve ${z}`);
    }
    // Small delay to be polite
    await new Promise(r => setTimeout(r, 120));
  }

  const outPath = resolve('public/assets/us-zips-extra.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${Object.keys(out).length} ZIPs to ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

