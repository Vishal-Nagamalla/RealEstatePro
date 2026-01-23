import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { toDisplayPhotos } from "@/lib/s3photos";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  try {
    const id = String(params?.id || "").trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { rows } = await pool.query(
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
        COALESCE(
          array_agg(lp.url ORDER BY lp.sort_order) FILTER (WHERE lp.url IS NOT NULL),
          ARRAY[]::text[]
        ) AS photos
      FROM listings l
      LEFT JOIN listing_photos lp ON lp.listing_id = l.id
      WHERE l.id = $1
      GROUP BY l.id
      LIMIT 1
      `,
      [id]
    );

    const listing = rows[0];
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // photos in DB are keys now
    listing.photo_keys = Array.isArray(listing.photos) ? listing.photos : [];
    listing.photos = await toDisplayPhotos(listing.photo_keys);

    return NextResponse.json({ listing });
  } catch (err) {
    console.error("GET /api/listings/[id] failed:", err);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}