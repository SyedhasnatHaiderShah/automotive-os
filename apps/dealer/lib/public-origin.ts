import type { NextRequest } from 'next/server';

/**
 * Origin the browser is actually on. Next.js middleware rejects relative
 * `Location` headers ("Invalid URL"), so redirects to the gateway-hosted
 * `/auth` page must be absolute. Behind the marketplace gateway rewrite,
 * request.url carries this service's own host, so prefer an explicit
 * PUBLIC_GATEWAY_URL, then the forwarded host, then the request origin.
 */
export function publicOrigin(request: NextRequest): string {
  const configured = process.env.PUBLIC_GATEWAY_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  if (forwardedHost) {
    const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
    return `${proto}://${forwardedHost}`;
  }
  return request.nextUrl.origin;
}
