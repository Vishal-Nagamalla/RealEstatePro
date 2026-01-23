// app/api/admin/listings/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { pool } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { geocodeAddress } from "@/lib/geocode"; // ✅ Step 4: auto lat/lng from address (free)

// Generate IDs like A1234 or S5678 if caller does not provide one
function generateListingId(status) {
  const prefix = status === "Sold" ? "S" : "A";
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${n}`;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!session || !isAdminEmail(email)) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, session };
}

function strOrNull(v) {
  if (v === undefined) return undefined; // signal: not provided
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function numOrNull(v) {
  if (v === undefined) return undefined; // signal: not provided
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function dateOrNull(v) {
  if (v === undefined) return undefined; // signal: not provided
  if (v === null || v === "") return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? NaN : d;
}

function normalizePhotos(body) {
  if (!Array.isArray(body?.photos)) return [];
  return body.photos
    .map((x) => String(x || "").trim())
    .filter(Boolean);
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

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  try {
    const { rows } = await pool.query(`
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
      GROUP BY l.id
      ORDER BY l.id DESC
    `);

    return NextResponse.json({ listings: rows });
  } catch (err) {
    console.error("GET /api/admin/listings failed:", err);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  const client = await pool.connect();

  try {
    const body = await req.json().catch(() => ({}));

    // Required
    const title = strOrNull(body?.title);
    const status = strOrNull(body?.status) ?? "Active";
    const price = numOrNull(body?.price);
    const beds = numOrNull(body?.beds);
    const baths = numOrNull(body?.baths);

    // Optional details (Step 4)
    const address1 = strOrNull(body?.address1);
    const city = strOrNull(body?.city);
    const state = strOrNull(body?.state);
    const zip = strOrNull(body?.zip);
    const neighborhood = strOrNull(body?.neighborhood);
    const description = strOrNull(body?.description);
    const propertyType = strOrNull(body?.property_type ?? body?.propertyType);
    const sqft = numOrNull(body?.sqft);
    const lotSqft = numOrNull(body?.lot_sqft ?? body?.lotSqft);
    const yearBuilt = numOrNull(body?.year_built ?? body?.yearBuilt);
    const zillowUrl = strOrNull(body?.zillow_url ?? body?.zillowUrl);

    const soldAt = dateOrNull(body?.sold_at);

    const photos = normalizePhotos(body);

    // Coords: can be provided OR derived from address (Step 4)
    const latitude = numOrNull(body?.latitude ?? body?.lat);
    const longitude = numOrNull(body?.longitude ?? body?.lng);

    // Validation
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!status) return NextResponse.json({ error: "Status is required" }, { status: 400 });

    if (!Number.isFinite(price)) return NextResponse.json({ error: "Price must be a number" }, { status: 400 });
    if (!Number.isFinite(beds) || !Number.isFinite(baths)) {
      return NextResponse.json({ error: "Beds and baths must be numbers" }, { status: 400 });
    }

    if (sqft !== undefined && sqft !== null && !Number.isFinite(sqft)) {
      return NextResponse.json({ error: "Sqft must be a number" }, { status: 400 });
    }
    if (lotSqft !== undefined && lotSqft !== null && !Number.isFinite(lotSqft)) {
      return NextResponse.json({ error: "Lot sqft must be a number" }, { status: 400 });
    }
    if (yearBuilt !== undefined && yearBuilt !== null && !Number.isFinite(yearBuilt)) {
      return NextResponse.json({ error: "Year built must be a number" }, { status: 400 });
    }

    if (soldAt !== undefined && soldAt !== null && Number.isNaN(soldAt?.getTime?.())) {
      return NextResponse.json({ error: "Sold date is invalid" }, { status: 400 });
    }

    if (zillowUrl && !isValidHttpUrl(zillowUrl)) {
      return NextResponse.json({ error: "Zillow URL must be a valid http(s) URL" }, { status: 400 });
    }

    // ✅ Step 4: If coords not provided, geocode from address (free)
    let finalLat = latitude;
    let finalLng = longitude;

    const coordsProvided = finalLat !== undefined || finalLng !== undefined; // they sent something
    const coordsComplete =
      finalLat !== undefined &&
      finalLng !== undefined &&
      finalLat !== null &&
      finalLng !== null;

    // If they sent coords, they must be valid + complete
    if (coordsProvided && !coordsComplete) {
      return NextResponse.json(
        { error: "Please provide both latitude and longitude together, or omit both to auto-geocode from address." },
        { status: 400 }
      );
    }
    if (coordsComplete && (!Number.isFinite(finalLat) || !Number.isFinite(finalLng))) {
      return NextResponse.json({ error: "Latitude and longitude must be numbers" }, { status: 400 });
    }

    // If they didn't provide coords, try address geocode (requires at least address1+city+state)
    if (!coordsComplete) {
      if (address1 && city && state) {
        const geo = await geocodeAddress({ address1, city, state, zip });
        if (geo) {
          finalLat = geo.latitude;
          finalLng = geo.longitude;
        }
      }
    }

    // Still no coords? We require them for pins.
    if (finalLat === undefined || finalLng === undefined || finalLat === null || finalLng === null) {
      return NextResponse.json(
        { error: "Latitude/longitude required. Provide them OR provide address1, city, state so we can auto-geocode." },
        { status: 400 }
      );
    }

    // IMPORTANT: listings.id is TEXT NOT NULL in your schema,
    // so we generate one if the client did not provide it.
    let id = String(body?.id ?? "").trim();
    if (!id) id = generateListingId(status);

    await client.query("BEGIN");

    await client.query(
      `
      INSERT INTO listings (
        id, title, price, beds, baths, status,
        latitude, longitude, sold_at,
        address1, city, state, zip, neighborhood,
        description, property_type, sqft, lot_sqft, year_built,
        zillow_url
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,
        $10,$11,$12,$13,$14,
        $15,$16,$17,$18,$19,
        $20
      )
      `,
      [
        id,
        title,
        price,
        beds,
        baths,
        status,
        finalLat,
        finalLng,
        soldAt ?? null,
        address1 ?? null,
        city ?? null,
        state ?? null,
        zip ?? null,
        neighborhood ?? null,
        description ?? null,
        propertyType ?? null,
        sqft === undefined ? null : sqft,
        lotSqft === undefined ? null : lotSqft,
        yearBuilt === undefined ? null : yearBuilt,
        zillowUrl ?? null,
      ]
    );

    if (photos.length) {
      for (let i = 0; i < photos.length; i++) {
        await client.query(
          `
          INSERT INTO listing_photos (listing_id, url, sort_order)
          VALUES ($1,$2,$3)
          `,
          [id, photos[i], i]
        );
      }
    }

    await client.query("COMMIT");

    return NextResponse.json({
      listing: {
        id,
        title,
        price,
        beds,
        baths,
        status,
        latitude: finalLat,
        longitude: finalLng,
        sold_at: soldAt ?? null,
        address1: address1 ?? null,
        city: city ?? null,
        state: state ?? null,
        zip: zip ?? null,
        neighborhood: neighborhood ?? null,
        description: description ?? null,
        property_type: propertyType ?? null,
        sqft: sqft === undefined ? null : sqft,
        lot_sqft: lotSqft === undefined ? null : lotSqft,
        year_built: yearBuilt === undefined ? null : yearBuilt,
        zillow_url: zillowUrl ?? null,
        photos,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("POST /api/admin/listings failed:", err);

    if (String(err?.code) === "23505") {
      return NextResponse.json({ error: "Listing ID already exists, try again" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  } finally {
    client.release();
  }
}