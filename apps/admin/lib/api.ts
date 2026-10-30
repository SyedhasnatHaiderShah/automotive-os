/**
 * Platform admin API client.
 *
 * Every call goes through `adminFetch`, which uses an origin-relative
 * `/api/v1/...` path (served by the gateway on the same origin as the console)
 * and sends the httpOnly `ao_session` cookie via `credentials: 'include'`.
 * No token is ever read from or written to localStorage.
 *
 * Failures always throw. There is no success-on-failure path and no fixture or
 * mock merge: if the API cannot confirm an action, the UI must say so.
 *
 * A 401 sends the browser to `/auth?tab=login&redirect=<admin path>`; a 403
 * throws AdminForbiddenError ("Your account is not a platform admin.").
 *
 * Endpoints that do NOT exist yet (and therefore have no client function):
 *   - moderation queue list, KYB verification queue list
 *   - KYB verification decision
 *   - disputes / escrow adjudication
 *   - platform metrics (escrow, trade volume, gateway telemetry)
 */

export class AdminApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.code = code;
  }
}

export const NOT_PLATFORM_ADMIN_MESSAGE = 'Your account is not a platform admin.';

/**
 * Thrown for HTTP 403 from the platform API: the session is valid but the
 * account is not (or is no longer) a platform administrator (AD-06).
 */
export class AdminForbiddenError extends AdminApiError {
  /** Raw server message, kept for diagnostics only. */
  readonly detail?: string;

  constructor(detail?: string, code?: string) {
    super(NOT_PLATFORM_ADMIN_MESSAGE, 403, code ?? 'NOT_PLATFORM_ADMIN');
    this.name = 'AdminForbiddenError';
    this.detail = detail;
  }
}

let loginRedirectStarted = false;

/**
 * AD-06: a 401 mid-session means the admin session is gone. Send the browser
 * to the unified sign-in page (served by the gateway outside the /admin
 * basePath) with a redirect back to the current console path.
 */
function redirectToLogin(): void {
  if (typeof window === 'undefined' || loginRedirectStarted) return;
  loginRedirectStarted = true;
  const { pathname, search } = window.location;
  const current = pathname.startsWith('/admin') ? `${pathname}${search}` : '/admin';
  const params = new URLSearchParams({ tab: 'login', redirect: current });
  window.location.assign(`/auth?${params.toString()}`);
}

function extractErrorMessage(body: unknown, status: number): { message: string; code?: string } {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const nested = record.error && typeof record.error === 'object' ? (record.error as Record<string, unknown>) : null;
    const raw = nested?.message ?? record.message;
    const code = typeof nested?.code === 'string' ? nested.code : typeof record.error === 'string' ? record.error : undefined;
    if (Array.isArray(raw) && raw.length > 0) return { message: raw.map(String).join('; '), code };
    if (typeof raw === 'string' && raw.trim()) return { message: raw, code };
  }
  if (status === 401) return { message: 'Your admin session is missing or expired. Sign in again.' };
  if (status === 403) return { message: 'Platform administrator permission is required for this action.' };
  if (status === 404) return { message: 'The requested record was not found.' };
  return { message: `Request failed (HTTP ${status}).` };
}

export interface AdminFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function adminFetch<T>(path: string, options: AdminFetchOptions = {}): Promise<T> {
  if (!path.startsWith('/api/v1/')) {
    throw new Error(`adminFetch only accepts origin-relative /api/v1/ paths (got "${path}")`);
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(path, {
      method: options.method ?? 'GET',
      headers,
      credentials: 'include',
      cache: 'no-store',
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new AdminApiError('The platform API could not be reached. Nothing was changed.', 0, 'NETWORK_ERROR');
  }

  const text = await res.text();
  let body: unknown = undefined;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const { message, code } = extractErrorMessage(body, res.status);
    if (res.status === 401) {
      redirectToLogin();
    } else if (res.status === 403) {
      throw new AdminForbiddenError(message, code);
    }
    throw new AdminApiError(message, res.status, code);
  }

  return body as T;
}

export function errorMessage(err: unknown, fallback = 'Request failed'): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

// -----------------------------------------------------------------------------
// Identity
// -----------------------------------------------------------------------------

export interface CurrentAdmin {
  id: string;
  email: string | null;
  displayName: string | null;
  isPlatformAdmin: boolean;
  status: string;
}

let currentAdminPromise: Promise<CurrentAdmin> | null = null;

/** GET /api/v1/auth/me, cached for the lifetime of the page. */
export function getCurrentAdmin(): Promise<CurrentAdmin> {
  if (!currentAdminPromise) {
    currentAdminPromise = adminFetch<CurrentAdmin>('/api/v1/auth/me').catch((err) => {
      currentAdminPromise = null;
      throw err;
    });
  }
  return currentAdminPromise;
}

/**
 * AD-07: POST /api/v1/auth/logout revokes the session row and clears the
 * httpOnly `ao_session` cookie, then the browser goes to the sign-in page.
 * Throws when the API cannot be reached or rejects the request (other than an
 * already-expired session), so the UI can report that sign-out did not happen.
 */
export async function signOutAdmin(): Promise<void> {
  let res: Response;
  try {
    res = await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    });
  } catch {
    throw new AdminApiError('The platform API could not be reached. You are still signed in.', 0, 'NETWORK_ERROR');
  }
  // 401 means the session is already gone, which is the goal of signing out.
  if (!res.ok && res.status !== 401) {
    throw new AdminApiError(`Sign out failed (HTTP ${res.status}). You may still be signed in.`, res.status);
  }
  currentAdminPromise = null;
  loginRedirectStarted = true;
  window.location.assign('/auth?tab=login');
}

// -----------------------------------------------------------------------------
// Dealerships (tenants)
// -----------------------------------------------------------------------------

export type TenantStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

export interface AdminTenantSummary {
  id: string;
  slug: string;
  legalName: string;
  displayName: string;
  status: TenantStatus | string;
  verificationStatus: string;
  staffCount: number;
  vehicleCount: number;
  createdAt: string;
}

export interface AdminTenantBranch {
  id: string;
  name: string;
  emirate?: string | null;
  city?: string | null;
  address?: string | null;
  isActive?: boolean;
}

/** Shape returned by GET /admin/tenants/:id and GET /admin/verifications/:id. */
export interface AdminTenantDetail {
  id: string;
  slug: string;
  legalName: string;
  displayName: string;
  status: TenantStatus | string;
  verificationStatus: string;
  tradeLicenseNumber: string | null;
  tradeLicenseExpiry: string | null;
  branches: AdminTenantBranch[];
  vehicleCount: number;
  listingCount: number;
  createdAt: string;
  updatedAt: string;
}

export function listTenants(): Promise<AdminTenantSummary[]> {
  return adminFetch<AdminTenantSummary[]>('/api/v1/admin/tenants');
}

/** Exact counts from GET /api/v1/admin/tenants/summary (COUNT/GROUP BY, not the capped list). */
export interface AdminTenantCounts {
  total: number;
  byStatus: Record<string, number>;
  byVerificationStatus: Record<string, number>;
}

export function getTenantCounts(): Promise<AdminTenantCounts> {
  return adminFetch<AdminTenantCounts>('/api/v1/admin/tenants/summary');
}

export function getTenant(idOrSlug: string): Promise<AdminTenantDetail> {
  return adminFetch<AdminTenantDetail>(`/api/v1/admin/verifications/${encodeURIComponent(idOrSlug)}`);
}

export function updateTenantStatus(tenantId: string, status: TenantStatus, reason: string): Promise<AdminTenantSummary> {
  return adminFetch<AdminTenantSummary>(`/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/status`, {
    method: 'PATCH',
    body: { status, reason },
  });
}

export interface CreateDealerInput {
  slug: string;
  legalName: string;
  displayName: string;
  adminEmail: string;
  adminName: string;
}

export function createDealer(input: CreateDealerInput): Promise<{ displayName?: string } & Record<string, unknown>> {
  return adminFetch('/api/v1/admin/dealers', { method: 'POST', body: input });
}

export function inviteDealerStaff(
  tenantId: string,
  input: { email: string; role: string },
): Promise<{ activationToken?: string } & Record<string, unknown>> {
  return adminFetch(`/api/v1/admin/dealers/${encodeURIComponent(tenantId)}/invite`, { method: 'POST', body: input });
}

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'PENDING_VERIFICATION';

export interface AdminUser {
  id: string;
  email: string | null;
  displayName: string;
  phoneE164: string | null;
  isPlatformAdmin: boolean;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  emailVerifiedAt: string | null;
  memberships: Array<{
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    role: string;
    active: boolean;
  }>;
  isBuyer: boolean;
}

export interface AdminUserPage {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function listUsers(query: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  role?: string;
}, signal?: AbortSignal): Promise<AdminUserPage> {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
  if (query.search) params.set('search', query.search);
  if (query.status) params.set('status', query.status);
  if (query.role) params.set('role', query.role);
  return adminFetch<AdminUserPage>(`/api/v1/admin/users?${params.toString()}`, { signal });
}

export function updateUserStatus(userId: string, status: UserStatus, reason: string): Promise<unknown> {
  return adminFetch(`/api/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: { status, reason },
  });
}

export function revokeUserSessions(userId: string): Promise<{ revokedCount?: number; success?: boolean }> {
  return adminFetch(`/api/v1/admin/users/${encodeURIComponent(userId)}/revoke-sessions`, { method: 'POST' });
}

// -----------------------------------------------------------------------------
// Audit log
// -----------------------------------------------------------------------------

export interface AuditEvent {
  id: string;
  action: string;
  tenantId: string | null;
  actorUserId: string | null;
  targetType: string;
  targetId: string;
  metadata: unknown;
  createdAt: string;
}

export interface AuditEventPage {
  events: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
}

export function listAuditLogs(query: { limit: number; offset: number; targetType?: string }): Promise<AuditEventPage> {
  const params = new URLSearchParams({ limit: String(query.limit), offset: String(query.offset) });
  if (query.targetType) params.set('targetType', query.targetType);
  return adminFetch<AuditEventPage>(`/api/v1/admin/audit-logs?${params.toString()}`);
}

// -----------------------------------------------------------------------------
// Listing moderation
// -----------------------------------------------------------------------------

export interface AdminListingMedia {
  id: string;
  kind?: string;
  objectKey?: string;
  altText?: string | null;
  sortOrder?: number;
  isPublic?: boolean;
  url?: string;
  /** Short-lived signed GET URL for moderators; null when storage is not configured. */
  previewUrl?: string | null;
  previewExpiresAt?: string | null;
}

/** Compact listing returned by GET /api/v1/admin/listings/:id. */
export interface AdminListingDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  /** Integer fils serialized as a string (BigInt). */
  askingPriceFils: string;
  status: string;
  qualityScore: number | null;
  tenant: {
    id: string;
    slug: string;
    displayName: string;
    verificationStatus: string;
  };
  vehicle: {
    id: string;
    vin: string | null;
    stockNumber: string | null;
    modelYear: number | null;
    makeName: string;
    modelName: string;
    trim: string | null;
    mileageKm: number | null;
    colorExterior: string | null;
    fuel: string | null;
    transmission: string | null;
    gccSpec: boolean | null;
    stockStatus: string | null;
    media: AdminListingMedia[];
  };
  createdAt: string;
  updatedAt: string;
}

export function getAdminListing(idOrSlug: string): Promise<AdminListingDetail> {
  return adminFetch<AdminListingDetail>(`/api/v1/admin/listings/${encodeURIComponent(idOrSlug)}`);
}

/** Body matches AdminListingDecisionDto exactly: { decision, reason? }. */
export function submitListingDecision(
  listingId: string,
  decision: 'APPROVE' | 'REJECT',
  reason?: string,
): Promise<{ id: string; status: string } & Record<string, unknown>> {
  const body: { decision: 'APPROVE' | 'REJECT'; reason?: string } = { decision };
  if (reason && reason.trim()) body.reason = reason.trim();
  return adminFetch(`/api/v1/admin/listings/${encodeURIComponent(listingId)}/decision`, {
    method: 'POST',
    body,
  });
}

// -----------------------------------------------------------------------------
// Formatting helpers
// -----------------------------------------------------------------------------

/** Format integer fils (string or number) as AED without floating-point maths. */
export function formatAedFromFils(fils: string | number | null | undefined): string {
  if (fils === null || fils === undefined || fils === '') return '—';
  let value: bigint;
  try {
    value = BigInt(typeof fils === 'number' ? Math.trunc(fils) : fils);
  } catch {
    return '—';
  }
  const negative = value < BigInt(0);
  const abs = negative ? -value : value;
  const dirhams = abs / BigInt(100);
  const fraction = (abs % BigInt(100)).toString().padStart(2, '0');
  const grouped = dirhams.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}AED ${grouped}.${fraction}`;
}

/** Display a UTC ISO timestamp in Asia/Dubai. */
export function formatDubaiDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date) + ' GST';
}
