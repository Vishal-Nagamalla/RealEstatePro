import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isAdminEmail } from "@/lib/admin";

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!session || !isAdminEmail(email)) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, session };
}

function safeExtFromName(name = "") {
  const lower = String(name).toLowerCase();
  const m = lower.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  return m ? m[1] : null;
}

function contentTypeOk(ct = "") {
  return /^image\/(jpeg|png|webp|gif)$/i.test(String(ct));
}

function getPublicBaseUrl() {
  const custom = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
  if (custom) return custom.replace(/\/+$/, "");

  const bucket = process.env.S3_BUCKET;
  const region = process.env.AWS_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

function getS3() {
  const region = process.env.AWS_REGION;
  if (!region) throw new Error("Missing AWS_REGION");
  return new S3Client({ region });
}

export async function POST(req) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json().catch(() => ({}));
    const filename = String(body?.filename || "").trim();
    const contentType = String(body?.contentType || "").trim();
    const size = Number(body?.size || 0);

    if (!filename) return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    if (!contentTypeOk(contentType)) {
      return NextResponse.json({ error: "Only image uploads are allowed (jpeg/png/webp/gif)." }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= 0 || size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)." }, { status: 400 });
    }

    const bucket = process.env.S3_BUCKET;
    if (!bucket) return NextResponse.json({ error: "Missing S3_BUCKET env var" }, { status: 500 });

    const ext = safeExtFromName(filename) || (contentType.includes("jpeg") ? "jpg" : null);
    if (!ext) return NextResponse.json({ error: "Unsupported file extension." }, { status: 400 });

    const key = `public/listings/${crypto.randomUUID()}.${ext}`;
    const s3 = getS3();

    const putCmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, putCmd, { expiresIn: 60 });

    // Signed display URL (works even if bucket is private)
    const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const displayUrl = await getSignedUrl(s3, getCmd, { expiresIn: 60 * 10 });

    // Optional public-style URL if you later make it public / use CDN
    const publicBase = getPublicBaseUrl();
    const publicUrl = `${publicBase}/${key}`;

    return NextResponse.json({ uploadUrl, key, displayUrl, publicUrl });
  } catch (err) {
    console.error("POST /api/admin/uploads/s3 failed:", err);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  try {
    const { searchParams } = new URL(req.url);
    const key = String(searchParams.get("key") || "").trim();
    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

    const bucket = process.env.S3_BUCKET || process.env.S3_BUCKET_NAME;
    if (!bucket) return NextResponse.json({ error: "Missing S3_BUCKET env var" }, { status: 500 });

    const s3 = getS3();
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/uploads/s3 failed:", err);
    return NextResponse.json({ error: "Failed to delete object" }, { status: 500 });
  }
}