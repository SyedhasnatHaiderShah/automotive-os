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
  /**
   * True when the user has more than one usable membership. The first one is
   * used; the API returns memberships oldest first, so the choice is stable.
   */
  hasMultipleTenants: boolean;
}

export type DealerSessionErrorCode =
  | 'NOT_SIGNED_IN'
  | 'SESSION_INVALID'
  | 'ACCOUNT_RESTRICTED'
  | 'NO_DEALER_MEMBERSHIP'
  | 'TENANT_SUSPENDED'
  | 'API_UNAVAILABLE';

/**
 * Session failure with a machine-readable `code`. The message is kept free of
 * the code prefix so it can be shown to the user as-is (DL-10).
 */
export class DealerSessionError extends Error {
  constructor(
    public readonly code: DealerSessionErrorCode,
    message: string,
  ) {
    super(message);
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

  if (response.status === 401) {
    throw new DealerSessionError('SESSION_INVALID', 'Your session has expired or was revoked. Sign in again.');
  }
  if (response.status === 403) {
    // The API returns 403 from /auth/me for suspended or disabled accounts.
    throw new DealerSessionError('ACCOUNT_RESTRICTED', 'This account is suspended or disabled.');
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
    const suspended = (Array.isArray(me.memberships) ? me.memberships : []).some(
      (m: DealerMembership) => m.active && m.tenantStatus !== 'ACTIVE',
    );
    if (suspended) {
      throw new DealerSessionError('TENANT_SUSPENDED', 'Your dealership account is suspended.');
    }
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
