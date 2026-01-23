import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { pool } from "@/lib/db";

async function requireUserEmail() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return { email: null, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { email, res: null };
}

export async function GET() {
  const { email, res } = await requireUserEmail();
  if (res) return res;

  try {
    const { rows } = await pool.query(
      "select listing_id from favorites where user_email = $1 order by created_at desc",
      [email]
    );

    return NextResponse.json({ ids: rows.map((r) => r.listing_id) });
  } catch (e) {
    console.error("GET /api/favorites failed:", e);
    return NextResponse.json({ error: "Failed to load favorites" }, { status: 500 });
  }
}

export async function POST(req) {
  const { email, res } = await requireUserEmail();
  if (res) return res;

  try {
    const body = await req.json().catch(() => ({}));
    const listingId = body?.listingId;

    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }

    await pool.query(
      "insert into favorites (user_email, listing_id) values ($1, $2) on conflict do nothing",
      [email, listingId]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/favorites failed:", e);
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const { email, res } = await requireUserEmail();
  if (res) return res;

  try {
    const body = await req.json().catch(() => ({}));
    const listingId = body?.listingId;

    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }

    await pool.query(
      "delete from favorites where user_email = $1 and listing_id = $2",
      [email, listingId]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/favorites failed:", e);
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }
}