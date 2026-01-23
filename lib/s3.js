// lib/s3.js
import { S3Client } from "@aws-sdk/client-s3";

export const S3_BUCKET = process.env.S3_BUCKET_NAME;
export const AWS_REGION = process.env.AWS_REGION || "us-east-1";

if (!S3_BUCKET) {
  console.warn("Missing S3_BUCKET_NAME in env");
}

export const s3 = new S3Client({
  region: AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      }
    : undefined,
});