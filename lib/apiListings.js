// lib/apiListings.js

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

// Get a list of listings (optionally filtered by status)
export async function fetchListings(status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`${BASE_URL}/api/listings${qs}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch listings: ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// Get ONE listing by id – this MUST call /api/listings/:id
export async function fetchListingById(id) {
  const res = await fetch(
    `${BASE_URL}/api/listings/${encodeURIComponent(id)}`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch listing ${id}: ${res.status}`);
  }

  return res.json(); // this should include { photos: [...] }
}