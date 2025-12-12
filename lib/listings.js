// lib/listings.js
import data from '@/data/mock-listings.json';

// Used at build time for static pages and map seeds
export function getAllListings() {
  return {
    active: data.active,
    sold: data.sold,
  };
}

export function getListingById(id) {
  const { active, sold } = getAllListings();
  return [...active, ...sold].find((x) => String(x.id) === String(id));
}