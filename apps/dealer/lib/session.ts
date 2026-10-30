import { cookies } from 'next/headers';

/**
 * Server-side dealer session resolution.
 *
 * The unified auth flow sets the httpOnly `ao_session` cookie on the gateway
 * origin. Dealer pages are served through the marketplace `/dealer/*` rewrite,
 * so the cookie reaches this app. We forward it to the API (`/api/v1/auth/me`)
 * and derive the active tenant from the caller's memberships. The API stays
 * the authority: every tenant route re-checks membership and role.
 */

export interface DealerMembership {
  tenantId: string;
  role: string;
  active: boolean;
  tenantStatus: string;
  tenantSlug: string;
  tenantName: string;
}

export interface DealerSession {
  token: string;
  userId: string;
  displayName: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  role: string;
  /** True when the user has more than one usable membership; the first is used. */
  hasMultipleTenants: boolean;
}

export class DealerSessionError extends Error {
  constructor(
    public readonly code: 'NOT_SIGNED_IN' | 'SESSION_INVALID' | 'NO_DEALER_MEMBERSHIP' | 'API_UNAVAILABLE',
    message: string,
  ) {
    super(`${code}: ${message}`);
  }
}

export function serverApiBaseUrl(): string {
  return (
    process.env.API_SERVICE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000'
  ).replace(/\/+$/, '');
}

export async function getDealerSession(): Promise<DealerSession> {
  const cookieStore = await cookies();
  const token = cookieStore.get('ao_session')?.value;
  if (!token) {
    throw new DealerSessionError('NOT_SIGNED_IN', 'Sign in with a dealer account to open the dealer console.');
  }

  let response: Response;
  try {
    response = await fetch(`${serverApiBaseUrl()}/api/v1/auth/me`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new DealerSessionError('API_UNAVAILABLE', 'Identity service is unreachable.');
  }

  if (response.status === 401 || response.status === 403) {
    throw new DealerSessionError('SESSION_INVALID', 'Your session has expired or was revoked. Sign in again.');
  }
  if (!response.ok) {
    throw new DealerSessionError('API_UNAVAILABLE', `Identity service returned HTTP ${response.status}.`);
  }

  const me = await response.json();
  const usable: DealerMembership[] = (Array.isArray(me.memberships) ? me.memberships : []).filter(
    (m: DealerMembership) => m.active && m.tenantStatus === 'ACTIVE',
  );
  const membership = usable[0];
  if (!membership) {
    throw new DealerSessionError(
      'NO_DEALER_MEMBERSHIP',
      'This account has no active dealership membership.',
    );
  }

  return {
    token,
    userId: me.id,
    displayName: me.displayName,
    tenantId: membership.tenantId,
    tenantSlug: membership.tenantSlug,
    tenantName: membership.tenantName,
    role: membership.role,
    hasMultipleTenants: usable.length > 1,
  };
}
