/**
 * Builds the public URL for a vehicle media object key.
 *
 * - Absolute keys (legacy seed rows storing full URLs) are returned unchanged.
 * - When S3_PUBLIC_CDN_URL is configured, media is served from that CDN.
 * - Otherwise media is served through the API's own DB-gated proxy
 *   (`GET /api/v1/public/media/*`), prefixed with PUBLIC_API_URL when set or
 *   left origin-relative so the marketplace `/api/*` rewrite can serve it.
 *
 * There is intentionally no hardcoded CDN fallback: an unset CDN must never
 * produce links to a domain that does not exist.
 */
export function buildPublicMediaUrl(objectKey: string): string {
  if (/^https?:\/\//i.test(objectKey)) {
    return objectKey;
  }

  const key = objectKey.replace(/^\/+/, '');
  const cdnBase = process.env.S3_PUBLIC_CDN_URL?.trim().replace(/\/+$/, '');
  if (cdnBase) {
    return `${cdnBase}/${key}`;
  }

  const apiBase = (process.env.PUBLIC_API_URL?.trim() || '').replace(/\/+$/, '');
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `${apiBase}/api/v1/public/media/${encodedKey}`;
}
