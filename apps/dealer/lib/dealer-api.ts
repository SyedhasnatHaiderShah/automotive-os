/**
 * Dealer console API client for the real tenant-scoped endpoints.
 *
 * Types mirror the API DTOs (apps/api/src/inventory/dto/vehicle-response.dto.ts
 * and apps/api/src/leads/dto/dealer-lead.dto.ts). No fixture or fallback data
 * lives here: any failure is surfaced to the caller.
 *
 * Server pages call the API service directly with the session bearer token.
 * Browser code calls same-origin `/api/*` (rewritten to the API by the
 * marketplace gateway) with `credentials: 'include'` so the httpOnly
 * `ao_session` cookie is sent.
 */

export const LISTING_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'REJECTED',
  'PAUSED',
  'SOLD',
  'ARCHIVED',
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const STOCK_STATUSES = ['INTAKE', 'AVAILABLE', 'RESERVED', 'SOLD', 'TRANSFERRED', 'ARCHIVED'] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'TEST_DRIVE_NEGOTIATION',
  'WON',
  'LOST',
  'SPAM',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Listing statuses from which the API accepts a submit-for-review. */
export const SUBMITTABLE_LISTING_STATUSES: readonly ListingStatus[] = ['DRAFT', 'PAUSED', 'REJECTED'];

export const PAGE_LIMIT_MAX = 50;
export const DEFAULT_PAGE_LIMIT = 20;

export interface DealerVehicleMedia {
  id: string;
  kind: string;
  objectKey: string;
  altText: string | null;
  sortOrder: number;
  isPublic: boolean;
}

export interface DealerVehicle {
  id: string;
  tenantId: string;
  branchId: string;
  makeName: string;
  modelName: string;
  vin: string | null;
  stockNumber: string;
  trim: string | null;
  modelYear: number;
  condition: string;
  mileageKm: number | null;
  colorExterior: string | null;
  fuel: string | null;
  transmission: string | null;
  gccSpec: boolean | null;
  /** Null unless the caller's role may see cost (enforced by the API). */
  purchaseCostFils: string | null;
  askingPriceFils: string;
  stockStatus: string;
  createdAt: string;
  updatedAt: string;
  media: DealerVehicleMedia[];
  listingId: string | null;
  listingStatus: string | null;
}

export interface DealerLeadSummary {
  id: string;
  listingId: string;
  listingTitle: string;
  intent: string;
  status: string;
  preferredContact: string;
  /** Masked unless the buyer granted the name field. */
  buyerDisplayName: string;
  assignedMembershipId: string | null;
  assignedStaffName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export class DealerApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Parse `page`/`limit` search params into the bounds the API accepts. */
export function parsePaging(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  defaultLimit = DEFAULT_PAGE_LIMIT,
): { page: number; limit: number } {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const page = Number.parseInt(first(searchParams?.page) ?? '', 10);
  const limit = Number.parseInt(first(searchParams?.limit) ?? '', 10);
  return {
    page: Number.isFinite(page) && page >= 1 ? page : 1,
    limit: Number.isFinite(limit) && limit >= 1 ? Math.min(limit, PAGE_LIMIT_MAX) : defaultLimit,
  };
}

/** Browser-side call to the same-origin API with the session cookie. */
export async function dealerClientRequest<T>(
  path: string,
  init: { method: 'POST' | 'PATCH'; body?: unknown },
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: init.method,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: 'include',
      cache: 'no-store',
    });
  } catch {
    throw new DealerApiError(0, 'The API could not be reached. Nothing was changed.');
  }
  if (!response.ok) {
    let detail = '';
    try {
      const payload = await response.json();
      const message = payload?.message ?? payload?.error?.message;
      detail = Array.isArray(message) ? message.join('; ') : typeof message === 'string' ? message : '';
    } catch {
      // Non-JSON error body; the status code is still reported.
    }
    const reason =
      response.status === 401
        ? 'Your session has expired. Sign in again.'
        : response.status === 403
          ? 'Your role is not allowed to do this.'
          : detail || 'The API rejected the request.';
    throw new DealerApiError(response.status, `HTTP ${response.status}: ${reason} Nothing was changed.`);
  }
  return (await response.json()) as T;
}

export function filsToAed(fils: string | null | undefined): number | null {
  if (fils === null || fils === undefined || fils === '') return null;
  const value = Number(fils);
  return Number.isFinite(value) ? value / 100 : null;
}

export function formatAed(fils: string | null | undefined): string {
  const aed = filsToAed(fils);
  if (aed === null) return '—';
  return `AED ${aed.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/** Dates arrive as UTC ISO strings; display in Asia/Dubai. */
export function formatDubaiDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    timeZone: 'Asia/Dubai',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function humanizeEnum(value: string | null | undefined): string {
  if (!value) return '—';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Same-origin URL for a public vehicle image, or null for private media. */
export function publicMediaUrl(vehicle: Pick<DealerVehicle, 'media'>): string | null {
  const image = [...(vehicle.media ?? [])]
    .filter((m) => m.isPublic && (m.kind === 'EXTERIOR' || m.kind === 'INTERIOR'))
    .sort((a, b) => a.sortOrder - b.sortOrder)[0];
  if (!image) return null;
  const key = image.objectKey.split('/').map(encodeURIComponent).join('/');
  return `/api/v1/public/media/${key}`;
}
