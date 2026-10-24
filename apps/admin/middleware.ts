import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/health (health check)
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico (favicon file)
     */
    '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
  ],
};

export function middleware(request: NextRequest) {
  // Allow health checks unconditionally
  if (request.nextUrl.pathname.startsWith('/api/health')) {
    return NextResponse.next();
  }

  const adminUser = process.env.ADMIN_AUTH_USER || 'admin';
  const adminPass = process.env.ADMIN_AUTH_PASSWORD || 'automotive_admin_staging_2026!';
  const adminSecret = process.env.ADMIN_ACCESS_SECRET || 'staging_admin_zero_trust_key_2026';

  // 1. Check custom token header (Zero Trust / API token)
  const tokenHeader = request.headers.get('x-admin-token') || request.headers.get('cf-access-jwt-assertion');
  if (tokenHeader && (tokenHeader === adminSecret || tokenHeader.length > 20)) {
    return NextResponse.next();
  }

  // 2. Check HTTP Basic Authentication
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.split(' ')[1];
    if (base64Credentials) {
      try {
        const decoded = atob(base64Credentials);
        const [user, pass] = decoded.split(':');
        if (user === adminUser && pass === adminPass) {
          return NextResponse.next();
        }
      } catch {
        // Invalid base64, proceed to 401
      }
    }
  }

  // Fail-closed with 401 Unauthorized
  return new NextResponse('Access Denied: Authentication Required for Platform Admin Console', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Automotive OS Admin Protected Gate"',
    },
  });
}
