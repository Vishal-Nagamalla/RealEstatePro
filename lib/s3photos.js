// lib/s3photos.js
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET } from "@/lib/s3";

function isHttpUrl(s) {
  const v = String(s || "").trim();
  return v.startsWith("http://") || v.startsWith("https://");
}

export async function toDisplayPhotos(photos) {
  const arr = Array.isArray(photos) ? photos : [];
  if (!S3_BUCKET) return arr.filter(Boolean);

  const out = await Promise.all(
    arr.filter(Boolean).map(async (p) => {
      if (isHttpUrl(p)) return p;
      const key = String(p).trim();

      try {
        const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
        return await getSignedUrl(s3, cmd, { expiresIn: 60 * 10 });
      } catch {
        return null;
      }
    })
  );

  return out.filter(Boolean);
}