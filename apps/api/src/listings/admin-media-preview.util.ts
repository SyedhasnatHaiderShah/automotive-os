import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** Lifetime of a moderator preview URL. Kept short: it bypasses the public gate. */
export const ADMIN_MEDIA_PREVIEW_TTL_SECONDS = 300;

let cachedClient: S3Client | null | undefined;

function getStorageClient(): S3Client | null {
  if (cachedClient !== undefined) return cachedClient;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT;

  cachedClient =
    accessKeyId && secretAccessKey && endpoint
      ? new S3Client({
          region: process.env.R2_REGION || process.env.AWS_REGION || "auto",
          endpoint,
          credentials: { accessKeyId, secretAccessKey },
          forcePathStyle: true,
        })
      : null;
  return cachedClient;
}

/** Test hook: forget the cached client so env changes take effect. */
export function resetAdminMediaPreviewClient(): void {
  cachedClient = undefined;
}

/**
 * Returns a short-lived SigV4 GET URL so a platform moderator can view a
 * vehicle media object (public or private) before approving a listing.
 *
 * Fails closed: returns null when object storage is not configured or signing
 * fails. Errors are swallowed without logging so no credential material or
 * signed query string can reach logs.
 *
 * Legacy rows that store an absolute http(s) URL are returned unchanged.
 */
export async function signAdminMediaPreviewUrl(
  objectKey: string | null | undefined,
): Promise<string | null> {
  if (!objectKey) return null;
  if (/^https?:\/\//i.test(objectKey)) return objectKey;

  const key = objectKey.replace(/^\/+/, "");
  if (!key || key.includes("..") || key.includes("\\") || key.includes("\0")) {
    return null;
  }

  const bucket = process.env.R2_BUCKET_NAME || process.env.S3_BUCKET;
  const client = getStorageClient();
  if (!client || !bucket) return null;

  try {
    return await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: ADMIN_MEDIA_PREVIEW_TTL_SECONDS },
    );
  } catch {
    return null;
  }
}
