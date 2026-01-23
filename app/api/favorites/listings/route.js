import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { pool } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await pool.query(
      `
      select l.*
      from favorites f
      join listings l on l.id = f.listing_id
      where f.user_email = $1
      order by f.created_at desc
      `,
      [email]
    );

    return NextResponse.json({ listings: rows });
  } catch (e) {
    console.error("GET /api/favorites/listings failed:", e);
    return NextResponse.json({ error: "Failed to load favorite listings" }, { status: 500 });
  }
}