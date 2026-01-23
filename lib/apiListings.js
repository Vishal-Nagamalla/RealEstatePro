// Public listings API (served by Next.js on the same origin)
// If NEXT_PUBLIC_API_BASE is set (e.g., for a deployed API domain), we will use it.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || '';

export async function fetchListings(status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';

  const res = await fetch(`${BASE_URL}/api/listings${qs}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch listings: ${res.status}`);
  }

  const data = await res.json();

  // Support both shapes:
  // 1) { listings: [...] } (our Next.js API)
  // 2) [...] (legacy/plain array)
  if (Array.isArray(data?.listings)) return data.listings;
  if (Array.isArray(data)) return data;
  return [];
}

export async function fetchListingById(id) {
  const res = await fetch(`${BASE_URL}/api/listings/${encodeURIComponent(id)}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch listing ${id}: ${res.status}`);
  }

  const data = await res.json();

  // Support both shapes:
  // 1) listing object
  // 2) { listing: {...} }
  return data?.listing ?? data;
}