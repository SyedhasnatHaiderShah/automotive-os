import { NextRequest, NextResponse } from 'next/server';
import { publicOrigin } from './lib/public-origin';

/**
 * Dealer console gate. This is a presence check for the unified `ao_session`
 * cookie only; the API remains the authority and re-validates the session,
 * membership, tenant status and role on every tenant route.
 *
 * Paths here are relative to the `/dealer` basePath (request.nextUrl.pathname
 * has the basePath stripped).
 */
export const config = {
  matcher: [
    '/',
    '/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|map|woff2?)$).*)',
  ],
};

export function middleware(request: NextRequest) {
  const isLocalhost =
    request.nextUrl.hostname === 'localhost' ||
    request.nextUrl.hostname === '127.0.0.1' ||
    request.nextUrl.hostname === '::1';

  // Local development bypass, mirroring apps/admin/middleware.ts.
  if (
    process.env.NODE_ENV === 'development' &&
    isLocalhost &&
    process.env.DEALER_AUTH_ENFORCED !== 'true'
  ) {
    return NextResponse.next();
  }

  if (request.cookies.get('ao_session')?.value) {
    return NextResponse.next();
  }

  const accept = request.headers.get('accept') || '';
  if (!accept.includes('text/html')) {
    return new NextResponse(
      JSON.stringify({ error: { code: 'Unauthorized', message: 'Dealer sign-in required' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // `/auth` lives on the marketplace gateway origin, outside the /dealer basePath.
  const originalPath = `${request.nextUrl.basePath}${request.nextUrl.pathname === '/' ? '' : request.nextUrl.pathname}${request.nextUrl.search}`;
  // Middleware requires an absolute Location; build it on the origin the
  // browser is on, not this service's internal host (see lib/public-origin.ts).
  const params = new URLSearchParams({ tab: 'login', redirect: originalPath || '/dealer' });
  return NextResponse.redirect(new URL(`/auth?${params.toString()}`, publicOrigin(request)), 307);
}
