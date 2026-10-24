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

export async function middleware(request: NextRequest) {
  // Allow health checks unconditionally
  if (request.nextUrl.pathname.startsWith('/api/health')) {
    return NextResponse.next();
  }

  // 1. Cloudflare Access Verification (ONLY if explicitly configured)
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

  // 2. Strong Staging Basic Authentication
  // Reject arbitrary token headers - no fake 21-character bypass or hardcoded credentials
  const configuredUser = process.env.ADMIN_AUTH_USER;
  const configuredPass = process.env.ADMIN_AUTH_PASSWORD;

  // Fail closed if server credentials are not configured
  if (!configuredUser || !configuredPass) {
    return new NextResponse('Access Denied: Admin authentication credentials unconfigured on server', {
      status: 500,
    });
  }

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
        // Fall through to 401
      }
    }
  }

  // Reject missing, forged, or invalid credentials fail-closed
  return new NextResponse('Access Denied: Authentication Required for Platform Admin Console', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Automotive OS Admin Protected Gate"',
    },
  });
}
