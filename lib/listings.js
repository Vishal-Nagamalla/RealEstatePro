import data from '@/data/mock-listings.json';
export function getAllListings(){ return { active: data.active, sold: data.sold }; }
export function getListingById(id){ const {active,sold}=getAllListings(); return active.concat(sold).find(x=>x.id===id); }
