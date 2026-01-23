import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { pool } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { geocodeAddress } from "@/lib/geocode";
import { toDisplayPhotos } from "@/lib/s3photos";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!session || !isAdminEmail(email)) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, session };
}

function has(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function strFrom(body, key) {
  if (!has(body, key)) return undefined;
  const v = body[key];
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function numFrom(body, key) {
  if (!has(body, key)) return undefined;
  const v = body[key];
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function dateFrom(body, key) {
  if (!has(body, key)) return undefined;
  const v = body[key];
  if (v === null || v === "") return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? NaN : d;
}

// photos are keys now
function normalizePhotos(body) {
  if (!has(body, "photos")) return null; // don't change
  if (!Array.isArray(body.photos)) return [];
  return body.photos.map((x) => String(x || "").trim()).filter(Boolean);
}

function isValidHttpUrl(s) {
  if (!s) return true;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function normStr(x) {
  if (x === undefined || x === null) return "";
  return String(x).trim();
}

function photosToArray(v) {
  if (Array.isArray(v)) return v;
  // sometimes pg can give json as string depending on config
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function fetchListingWithPhotos(clientOrPool, id) {
  const { rows } = await clientOrPool.query(
    `
    SELECT
      l.id,
      l.title,
      l.price,
      l.beds,
      l.baths,
      l.status,
      l.latitude,
      l.longitude,
      l.sold_at,
      l.address1,
      l.city,
      l.state,
      l.zip,
      l.neighborhood,
      l.description,
      l.property_type,
      l.sqft,
      l.lot_sqft,
      l.year_built,
      l.zillow_url,
      l.updated_at,
      COALESCE(
        json_agg(lp.url ORDER BY lp.sort_order) FILTER (WHERE lp.url IS NOT NULL),
        '[]'
      ) AS photos
    FROM listings l
    LEFT JOIN listing_photos lp ON lp.listing_id = l.id
    WHERE l.id = $1
    GROUP BY l.id
    `,
    [id]
  );

  const listing = rows[0] || null;
  if (!listing) return null;

  const keys = photosToArray(listing.photos);
  listing.photo_keys = keys;
  listing.photos = await toDisplayPhotos(keys);

  return listing;
}

export async function GET(req, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  const id = params?.id ? String(params.id) : "";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const listing = await fetchListingWithPhotos(pool, id);
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ listing });
  } catch (err) {
    console.error("GET /api/admin/listings/[id] failed:", err);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  const id = params?.id ? String(params.id) : "";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const client = await pool.connect();

  try {
    const body = await req.json().catch(() => ({}));

    const existing = await fetchListingWithPhotos(client, id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const title = strFrom(body, "title");
    const status = strFrom(body, "status");
    const price = numFrom(body, "price");
    const beds = numFrom(body, "beds");
    const baths = numFrom(body, "baths");

    const lat = has(body, "latitude") ? numFrom(body, "latitude") : has(body, "lat") ? numFrom(body, "lat") : undefined;
    const lng = has(body, "longitude") ? numFrom(body, "longitude") : has(body, "lng") ? numFrom(body, "lng") : undefined;

    const soldAt = dateFrom(body, "sold_at");

    const address1 = strFrom(body, "address1");
    const city = strFrom(body, "city");
    const state = strFrom(body, "state");
    const zip = strFrom(body, "zip");

    const neighborhood = strFrom(body, "neighborhood");
    const description = strFrom(body, "description");

    const propertyType =
      has(body, "property_type") ? strFrom(body, "property_type") :
      has(body, "propertyType") ? strFrom(body, "propertyType") :
      undefined;

    const sqft = numFrom(body, "sqft");

    const lotSqft =
      has(body, "lot_sqft") ? numFrom(body, "lot_sqft") :
      has(body, "lotSqft") ? numFrom(body, "lotSqft") :
      undefined;

    const yearBuilt =
      has(body, "year_built") ? numFrom(body, "year_built") :
      has(body, "yearBuilt") ? numFrom(body, "yearBuilt") :
      undefined;

    const zillowUrl =
      has(body, "zillow_url") ? strFrom(body, "zillow_url") :
      has(body, "zillowUrl") ? strFrom(body, "zillowUrl") :
      undefined;

    const photos = normalizePhotos(body); // null = don't change, [] = clear, otherwise array of keys

    const badNum = (x) => x !== undefined && x !== null && Number.isNaN(x);

    if (badNum(price)) return NextResponse.json({ error: "Price must be a number" }, { status: 400 });
    if (badNum(beds) || badNum(baths)) return NextResponse.json({ error: "Beds and baths must be numbers" }, { status: 400 });
    if (badNum(lat)) return NextResponse.json({ error: "Latitude must be a number" }, { status: 400 });
    if (badNum(lng)) return NextResponse.json({ error: "Longitude must be a number" }, { status: 400 });
    if (badNum(sqft)) return NextResponse.json({ error: "Sqft must be a number" }, { status: 400 });
    if (badNum(lotSqft)) return NextResponse.json({ error: "Lot sqft must be a number" }, { status: 400 });
    if (badNum(yearBuilt)) return NextResponse.json({ error: "Year built must be a number" }, { status: 400 });

    if (soldAt !== undefined && soldAt !== null && Number.isNaN(soldAt?.getTime?.())) {
      return NextResponse.json({ error: "Sold date is invalid" }, { status: 400 });
    }
    if (zillowUrl !== undefined && zillowUrl !== null && !isValidHttpUrl(zillowUrl)) {
      return NextResponse.json({ error: "Zillow URL must be a valid http(s) link." }, { status: 400 });
    }

    const changingLat = lat !== undefined;
    const changingLng = lng !== undefined;
    if ((changingLat && !changingLng) || (!changingLat && changingLng)) {
      return NextResponse.json({ error: "Please provide both latitude and longitude together" }, { status: 400 });
    }

    const coordsProvided = changingLat && changingLng;

    const nextAddress1 = address1 === undefined ? existing.address1 : address1;
    const nextCity = city === undefined ? existing.city : city;
    const nextState = state === undefined ? existing.state : state;
    const nextZip = zip === undefined ? existing.zip : zip;

    const addressActuallyChanged =
      (address1 !== undefined && normStr(existing.address1) !== normStr(address1)) ||
      (city !== undefined && normStr(existing.city) !== normStr(city)) ||
      (state !== undefined && normStr(existing.state) !== normStr(state)) ||
      (zip !== undefined && normStr(existing.zip) !== normStr(zip));

    let geoLat = undefined;
    let geoLng = undefined;

    if (!coordsProvided && addressActuallyChanged) {
      if (nextAddress1 && nextCity && nextState) {
        const geo = await geocodeAddress({ address1: nextAddress1, city: nextCity, state: nextState, zip: nextZip }).catch(() => null);
        if (geo && Number.isFinite(geo.latitude) && Number.isFinite(geo.longitude)) {
          geoLat = geo.latitude;
          geoLng = geo.longitude;
        } else {
          return NextResponse.json(
            { error: "Could not geocode that updated address. Please double-check it, or enter latitude/longitude manually." },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Address changed but is incomplete. Include street, city, state (ZIP optional), or enter latitude/longitude." },
          { status: 400 }
        );
      }
    }

    await client.query("BEGIN");

    const sets = [];
    const vals = [id];
    let i = 1;

    const add = (col, val) => {
      i += 1;
      sets.push(`${col} = $${i}`);
      vals.push(val);
    };

    if (title !== undefined) add("title", title);
    if (status !== undefined) add("status", status);
    if (price !== undefined) add("price", price);
    if (beds !== undefined) add("beds", beds);
    if (baths !== undefined) add("baths", baths);

    if (coordsProvided) {
      add("latitude", lat);
      add("longitude", lng);
    } else if (geoLat !== undefined && geoLng !== undefined) {
      add("latitude", geoLat);
      add("longitude", geoLng);
    }

    if (soldAt !== undefined) add("sold_at", soldAt);

    if (address1 !== undefined) add("address1", address1);
    if (city !== undefined) add("city", city);
    if (state !== undefined) add("state", state);
    if (zip !== undefined) add("zip", zip);

    if (neighborhood !== undefined) add("neighborhood", neighborhood);
    if (description !== undefined) add("description", description);
    if (propertyType !== undefined) add("property_type", propertyType);
    if (sqft !== undefined) add("sqft", sqft);
    if (lotSqft !== undefined) add("lot_sqft", lotSqft);
    if (yearBuilt !== undefined) add("year_built", yearBuilt);
    if (zillowUrl !== undefined) add("zillow_url", zillowUrl);

    if (sets.length) {
      await client.query(`UPDATE listings SET ${sets.join(", ")} WHERE id = $1`, vals);
    }

    if (photos !== null) {
      await client.query(`DELETE FROM listing_photos WHERE listing_id = $1`, [id]);

      for (let p = 0; p < photos.length; p++) {
        await client.query(
          `INSERT INTO listing_photos (listing_id, url, sort_order) VALUES ($1,$2,$3)`,
          [id, photos[p], p]
        );
      }
    }

    const updated = await fetchListingWithPhotos(client, id);

    await client.query("COMMIT");
    return NextResponse.json({ listing: updated });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("PATCH /api/admin/listings/[id] failed:", err);
    return NextResponse.json({ error: "Failed to save listing" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  const id = params?.id ? String(params.id) : "";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const result = await pool.query(`DELETE FROM listings WHERE id = $1`, [id]);
    if (result.rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/listings/[id] failed:", err);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}