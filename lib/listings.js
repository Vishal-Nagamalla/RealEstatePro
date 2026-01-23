// lib/listings.js
import data from '@/data/mock-listings.json';

// Normalize a listing so maps can use it consistently
function normalizeListing(x) {
  if (!x) return x;

  const latitude = x.latitude ?? x.lat ?? null;
  const longitude = x.longitude ?? x.lng ?? null;

  const latNum = latitude === null || latitude === '' ? null : Number(latitude);
  const lngNum = longitude === null || longitude === '' ? null : Number(longitude);

  return {
    ...x,
    latitude: Number.isFinite(latNum) ? latNum : null,
    longitude: Number.isFinite(lngNum) ? lngNum : null,
    // keep backwards compatibility if any component still reads lat/lng
    lat: Number.isFinite(latNum) ? latNum : x.lat,
    lng: Number.isFinite(lngNum) ? lngNum : x.lng,
  };
}

// Server-safe fetch (works in server components too)
async function fetchDbListings(status /* 'Active' | 'Sold' | null */) {
  const base =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3000';

  const url = status
    ? `${base}/api/listings?status=${encodeURIComponent(status)}`
    : `${base}/api/listings`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch listings: ${res.status}`);
  const json = await res.json();
  const rows = Array.isArray(json?.listings) ? json.listings : [];
  return rows.map(normalizeListing);
}

/**
 * Async version (preferred): pulls from DB via /api/listings.
 * Falls back to mock data if API fails.
 */
export async function getAllListingsAsync() {
  try {
    const all = await fetchDbListings(null);
    return {
      active: all.filter((x) => x.status !== 'Sold'),
      sold: all.filter((x) => x.status === 'Sold'),
    };
  } catch (e) {
    // fallback to mock to avoid breaking dev/build
    return {
      active: (data?.active || []).map(normalizeListing),
      sold: (data?.sold || []).map(normalizeListing),
    };
  }
}

/**
 * Backwards-compatible sync version:
 * returns mock data ONLY (no network).
 * Keep this so old code doesn't crash during the transition.
 */
export function getAllListings() {
  return {
    active: (data?.active || []).map(normalizeListing),
    sold: (data?.sold || []).map(normalizeListing),
  };
}

export async function getListingByIdAsync(id) {
  const all = await fetchDbListings(null);
  return all.find((x) => String(x.id) === String(id)) || null;
}

export function getListingById(id) {
  const { active, sold } = getAllListings();
  return [...active, ...sold].find((x) => String(x.id) === String(id));
}