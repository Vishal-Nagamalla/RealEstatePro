export async function addFavorite(listingId) {
  const res = await fetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId }),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data?.error || "Failed to add favorite");
  return true;
}

export async function removeFavorite(listingId) {
  const res = await fetch("/api/favorites", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId }),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data?.error || "Failed to remove favorite");
  return true;
}

export async function getFavoriteIds() {
  const res = await fetch("/api/favorites", { cache: "no-store" });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data?.error || "Failed to load favorites");
  return Array.isArray(data?.ids) ? data.ids : [];
}