// lib/geocode.js

export function buildFullAddress({ address1, city, state, zip }) {
  const st = String(state || "").trim().toUpperCase();
  const base = [address1, city, st, zip]
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(", ");

  // Photon often needs a country hint for US addresses
  // Only append if it doesn't already look like it has a country
  const hasCountry = /,\s*(usa|united states|us)\s*$/i.test(base);
  return hasCountry ? base : `${base}, USA`;
}

async function photonSearch(q) {
  const url =
    "https://photon.komoot.io/api/?" +
    new URLSearchParams({
      q,
      limit: "1",
      lang: "en",
    }).toString();

  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Photon geocode failed:", res.status, text.slice(0, 250));
    return null;
  }

  const json = await res.json().catch(() => null);
  const first = json?.features?.[0];
  const coords = first?.geometry?.coordinates; // [lng, lat]

  if (!Array.isArray(coords) || coords.length < 2) return null;

  const longitude = Number(coords[0]);
  const latitude = Number(coords[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { latitude, longitude };
}

export async function geocodeAddress({ address1, city, state, zip }) {
  // 1) Try full query (street + city/state/zip + USA)
  const full = buildFullAddress({ address1, city, state, zip });
  if (!full) return null;

  const hit1 = await photonSearch(full);
  if (hit1) return hit1;

  // 2) Fallback: sometimes Photon misses street, but can find the city/zip area
  const st = String(state || "").trim().toUpperCase();
  const fallback = [city, st, zip].filter(Boolean).join(", ");
  const fallbackWithCountry = fallback ? `${fallback}, USA` : "";

  if (fallbackWithCountry) {
    console.warn("Photon: no hit for full address, trying fallback:", full, "->", fallbackWithCountry);
    const hit2 = await photonSearch(fallbackWithCountry);
    if (hit2) return hit2;
  }

  console.warn("Photon: no hit for:", full);
  return null;
}