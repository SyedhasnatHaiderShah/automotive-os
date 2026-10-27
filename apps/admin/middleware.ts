import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match root and all request paths except:
     * 1. /api/health (health check)
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico (favicon file)
     */
    '/',
    '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
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

export async function middleware(request: NextRequest) {
  // Allow health checks unconditionally
  if (request.nextUrl.pathname.startsWith('/api/health')) {
    return NextResponse.next();
  }

  // Development bypass
  const isLocalhost =
    request.nextUrl.hostname === 'localhost' ||
    request.nextUrl.hostname === '127.0.0.1' ||
    request.nextUrl.hostname === '::1';
  if (
    process.env.NODE_ENV === 'development' &&
    isLocalhost &&
    process.env.ADMIN_AUTH_ENFORCED !== 'true'
  ) {
    return NextResponse.next();
  }

  // 1. Unified Auth Session Cookie Verification with Authoritative State Validation (S3 Security Gate)
  const sessionCookie = request.cookies.get('ao_session')?.value;
  const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret-replace-in-production-min-32-chars-long';

  if (sessionCookie) {
    const payload = await verifyHs256Session(sessionCookie, jwtSecret);
    if (payload && payload.isPlatformAdmin === true) {
      // Authoritative validation against PostgreSQL/API: prevents stale JWT claims from authorizing demoted or revoked admins
      try {
        const apiBaseUrl = process.env.API_SERVICE_URL || 'http://localhost:4000';
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

  // 4. If neither valid session nor basic auth, redirect browser requests to /auth
  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('text/html')) {
    const authUrl = new URL('/auth?tab=login', request.url);
    authUrl.searchParams.set('redirect', request.nextUrl.pathname);
    const redirectRes = NextResponse.redirect(authUrl);
    if (sessionCookie) {
      redirectRes.cookies.delete('ao_session');
    }
    return redirectRes;
  }

  return new NextResponse('Access Denied: Platform Administrator Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Automotive OS Admin Protected Gate"',
    },
  });
}
