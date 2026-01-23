import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { toDisplayPhotos } from "@/lib/s3photos";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const values = [];
    let where = "";

    if (status) {
      values.push(status);
      where = `WHERE l.status = $${values.length}`;
    }

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
      ${where}
      GROUP BY l.id
      ORDER BY l.id DESC
      `,
      values
    );

    // photos from DB are S3 keys (or legacy urls). Convert to display urls.
    for (const l of rows) {
      l.photo_keys = Array.isArray(l.photos) ? l.photos : [];
      l.photos = await toDisplayPhotos(l.photo_keys);
    }

    return NextResponse.json({ listings: rows });
  } catch (err) {
    console.error("GET /api/listings failed:", err);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}