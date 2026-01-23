// app/api/admin/uploads/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isAdminEmail } from "@/lib/admin";

import { s3, S3_BUCKET } from "@/lib/s3";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function safeName(name) {
  const base = String(name || "image").trim();
  return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!session || !isAdminEmail(email)) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, session };
}

export async function POST(req) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  if (!S3_BUCKET) {
    return NextResponse.json({ error: "Missing S3_BUCKET_NAME" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const fileName = safeName(body?.fileName);
  const contentType = String(body?.contentType || "").trim() || "application/octet-stream";
  const listingId = String(body?.listingId || "").trim() || "unassigned";

  // Optional, prevent weird uploads
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 });
  }

  const key = `listings/${listingId}/${Date.now()}-${Math.random().toString(16).slice(2)}-${fileName}`;

  const putCmd = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, putCmd, { expiresIn: 60 });

  // This is only for immediate preview in admin, it expires quickly
  const getCmd = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  const previewUrl = await getSignedUrl(s3, getCmd, { expiresIn: 60 * 10 });

  return NextResponse.json({ key, uploadUrl, previewUrl });
}