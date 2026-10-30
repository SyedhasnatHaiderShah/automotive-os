/**
 * Server-side fetchers for dealer pages. They call the API service directly
 * with the session bearer token and never fall back to sample data.
 */

import { serverApiBaseUrl } from './session';
import {
  DealerApiError,
  type DealerLeadSummary,
  type DealerVehicle,
  type LeadStatus,
  type Paged,
  type StockStatus,
} from './dealer-api';

async function serverGet<T>(path: string, token: string, what: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${serverApiBaseUrl()}${path}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new DealerApiError(0, `${what} service is unreachable.`);
  }
  if (!response.ok) {
    throw new DealerApiError(response.status, `${what} service returned HTTP ${response.status}.`);
  }
  return (await response.json()) as T;
}

function toPaged<T>(data: { items?: unknown; total?: unknown }, page: number, limit: number): Paged<T> {
  const items = Array.isArray(data.items) ? (data.items as T[]) : [];
  const total = typeof data.total === 'number' ? data.total : items.length;
  return { items, total, page, limit };
}

export async function fetchVehiclesPage(
  tenantId: string,
  token: string,
  options: { page: number; limit: number; stockStatus?: StockStatus },
): Promise<Paged<DealerVehicle>> {
  const query = new URLSearchParams({ page: String(options.page), limit: String(options.limit) });
  if (options.stockStatus) query.set('stockStatus', options.stockStatus);
  const data = await serverGet<{ items?: unknown; total?: unknown }>(
    `/api/v1/tenants/${encodeURIComponent(tenantId)}/vehicles?${query.toString()}`,
    token,
    'Dealer inventory',
  );
  return toPaged<DealerVehicle>(data, options.page, options.limit);
}

export async function fetchLeadsPage(
  tenantId: string,
  token: string,
  options: { page: number; limit: number; status?: LeadStatus },
): Promise<Paged<DealerLeadSummary>> {
  const query = new URLSearchParams({ page: String(options.page), limit: String(options.limit) });
  if (options.status) query.set('status', options.status);
  const data = await serverGet<{ items?: unknown; total?: unknown }>(
    `/api/v1/tenants/${encodeURIComponent(tenantId)}/leads?${query.toString()}`,
    token,
    'Dealer leads',
  );
  return toPaged<DealerLeadSummary>(data, options.page, options.limit);
}

/** Exact count of vehicles in a stock status (uses the API `total`). */
export async function countVehicles(tenantId: string, token: string, stockStatus?: StockStatus): Promise<number> {
  return (await fetchVehiclesPage(tenantId, token, { page: 1, limit: 1, stockStatus })).total;
}

/** Exact count of leads in a status (uses the API `total`). */
export async function countLeads(tenantId: string, token: string, status?: LeadStatus): Promise<number> {
  return (await fetchLeadsPage(tenantId, token, { page: 1, limit: 1, status })).total;
}
