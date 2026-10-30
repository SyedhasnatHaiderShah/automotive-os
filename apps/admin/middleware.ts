import { NextRequest, NextResponse } from 'next/server';

/**
 * Platform admin gate.
 *
 * Paths seen here are relative to the `/admin` basePath (request.nextUrl.pathname
 * has the basePath stripped). Static assets are excluded by the matcher so the
 * authoritative session check does not run for every chunk, image or font.
 *
 * The API stays the authority: every /api/v1/admin route re-validates the JWT,
 * the session row and `isPlatformAdmin`. This gate only keeps the console shell
 * away from non-admins.
 */
export const config = {
  matcher: [
    '/',
    '/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt|woff2?)$).*)',
  ],
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// In-memory JWKS cache if Cloudflare Access is configured
let cachedJwks: { keys: any[]; fetchedAt: number } | null = null;

async function verifyCloudflareAccessJwt(jwt: string, aud: string, certsUrl: string): Promise<boolean> {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return false;

    const headerB64 = parts[0];
    const payloadB64 = parts[1];
    const signatureB64 = parts[2];

    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    // 1. Verify audience
    if (!payload.aud || (Array.isArray(payload.aud) ? !payload.aud.includes(aud) : payload.aud !== aud)) {
      return false;
    }

    // 2. Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return false;
    }

    // 3. Fetch JWKS if not cached or expired (cache for 1 hour)
    if (!cachedJwks || Date.now() - cachedJwks.fetchedAt > 3600000) {
      const res = await fetch(certsUrl, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return false;
      const data = await res.json();
      cachedJwks = { keys: data.keys, fetchedAt: Date.now() };
    }

    const jwk = cachedJwks.keys.find((k: any) => k.kid === header.kid);
    if (!jwk) return false;

    // 4. Import public key via Web Crypto API
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // 5. Verify cryptographic signature
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(Buffer.from(signatureB64, 'base64url'));
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data);
  } catch (err) {
    console.error('[SECURITY_ADMIN_GATE] Cloudflare Access verification error:', err);
    return false;
  }
}

async function verifyHs256Session(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const data = enc.encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(Buffer.from(signatureB64, 'base64url'));
    const isValid = await crypto.subtle.verify('HMAC', key, signature, data);
    if (!isValid) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

function isPrefetchRequest(request: NextRequest): boolean {
  if (request.headers.has('next-router-prefetch')) return true;
  const purpose = `${request.headers.get('purpose') || ''} ${request.headers.get('sec-purpose') || ''}`;
  return purpose.toLowerCase().includes('prefetch');
}

function resolveApiBaseUrl(isDevelopment: boolean): string | null {
  const configured = (process.env.API_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (configured) return configured.replace(/\/+$/, '');
  return isDevelopment ? 'http://localhost:4000' : null;
}

export async function middleware(request: NextRequest) {
  // Allow health checks unconditionally
  if (request.nextUrl.pathname.startsWith('/api/health')) {
    return NextResponse.next();
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  // Development bypass: explicit opt-in only, never on a non-local host.
  const isLocalhost =
    request.nextUrl.hostname === 'localhost' ||
    request.nextUrl.hostname === '127.0.0.1' ||
    request.nextUrl.hostname === '::1' ||
    request.nextUrl.hostname === '[::1]';
  if (isDevelopment && isLocalhost && process.env.ADMIN_DEV_BYPASS === 'true') {
    return NextResponse.next();
  }

  // Fail closed: there is no default signing secret outside local development.
  const jwtSecret = process.env.JWT_SECRET?.trim() || '';
  if (!jwtSecret && !isDevelopment) {
    console.error('[SECURITY_ADMIN_GATE] JWT_SECRET is not configured; refusing admin access.');
    return new NextResponse('Admin console unavailable: authentication is not configured.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // 1. Unified Auth Session Cookie Verification with Authoritative State Validation (S3 Security Gate)
  const sessionCookie = request.cookies.get('ao_session')?.value;
  let sessionTokenInvalid = false;

  if (sessionCookie && jwtSecret) {
    const payload = await verifyHs256Session(sessionCookie, jwtSecret);
    if (!payload) {
      sessionTokenInvalid = true;
    } else if (payload.isPlatformAdmin === true) {
      // Prefetches still need a valid admin cookie, but skip the authoritative
      // network round trip; the real navigation and every API call re-check it.
      if (isPrefetchRequest(request)) {
        return NextResponse.next();
      }

      // Authoritative validation against PostgreSQL/API: prevents stale JWT claims from authorizing demoted or revoked admins
      const apiBaseUrl = resolveApiBaseUrl(isDevelopment);
      if (apiBaseUrl) {
        try {
          const verifyRes = await fetch(`${apiBaseUrl}/api/v1/auth/verify-admin-session`, {
            headers: {
              Authorization: `Bearer ${sessionCookie}`,
              Cookie: `ao_session=${sessionCookie}`,
            },
            signal: AbortSignal.timeout(4000),
          });

          if (verifyRes.ok) {
            const data = await verifyRes.json();
            if (data && data.valid === true) {
              return NextResponse.next();
            }
          }
        } catch {
          // Fall through to authentication challenge if authoritative validation fails
        }
      }
    }
  }

  // 2. Cloudflare Access Verification (ONLY if explicitly configured)
  const cfAccessAud = process.env.CF_ACCESS_AUD;
  const cfAccessCertsUrl = process.env.CF_ACCESS_CERTS_URL;
  const cfToken = request.headers.get('cf-access-jwt-assertion');

  if (cfAccessAud && cfAccessCertsUrl) {
    if (!cfToken) {
      return new NextResponse('Access Denied: Cloudflare Access Assertion Required', {
        status: 403,
      });
    }

    const isValidCfAccess = await verifyCloudflareAccessJwt(cfToken, cfAccessAud, cfAccessCertsUrl);
    if (isValidCfAccess) {
      return NextResponse.next();
    }

    return new NextResponse('Access Denied: Invalid or Expired Cloudflare Access Assertion', {
      status: 403,
    });
  }

  // 3. Staging Basic Authentication Fallback
  const configuredUser = process.env.ADMIN_AUTH_USER;
  const configuredPass = process.env.ADMIN_AUTH_PASSWORD;
  const basicAuthConfigured = Boolean(configuredUser && configuredPass);

  if (configuredUser && configuredPass) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.slice(6).trim();
      if (base64Credentials) {
        try {
          const decoded = Buffer.from(base64Credentials, 'base64').toString('utf8');
          const colonIndex = decoded.indexOf(':');
          if (colonIndex !== -1) {
            const user = decoded.slice(0, colonIndex);
            const pass = decoded.slice(colonIndex + 1);
            if (timingSafeEqual(user, configuredUser) && timingSafeEqual(pass, configuredPass)) {
              return NextResponse.next();
            }
          }
        } catch {
          // Fall through
        }
      }
    }
  }

  // 4. No valid admin session: send browsers to the unified sign-in page.
  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('text/html')) {
    // `/auth` lives on the marketplace gateway origin, outside the /admin basePath.
    const basePath = request.nextUrl.basePath || '/admin';
    const subPath = request.nextUrl.pathname === '/' ? '' : request.nextUrl.pathname;
    const originalPath = `${basePath}${subPath}${request.nextUrl.search}` || '/admin';
    const params = new URLSearchParams({ tab: 'login', redirect: originalPath });
    // Behind the gateway rewrite request.url carries the admin service host, so
    // an absolute redirect would leave the gateway. A relative Location resolves
    // against the origin the browser is actually on.
    const redirectRes = new NextResponse(null, {
      status: 307,
      headers: { Location: `/auth?${params.toString()}`, 'Cache-Control': 'no-store' },
    });
    // Only clear a cookie that is cryptographically invalid or expired. A valid
    // non-admin session (buyer/dealer) must not be logged out by visiting /admin.
    if (sessionCookie && sessionTokenInvalid) {
      redirectRes.cookies.set('ao_session', '', { path: '/', maxAge: 0 });
    }
    return redirectRes;
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (basicAuthConfigured) {
    headers['WWW-Authenticate'] = 'Basic realm="Automotive OS Admin Protected Gate"';
  }
  return new NextResponse(
    JSON.stringify({ error: { code: 'Unauthorized', message: 'Platform administrator authentication required' } }),
    { status: 401, headers },
  );
}
