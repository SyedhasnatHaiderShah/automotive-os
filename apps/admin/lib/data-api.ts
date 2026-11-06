import { adminFetch } from './api';

/** Client for the platform-admin data console (`/api/v1/admin/data`, AD-20). */

export interface DataFieldMeta {
  name: string;
  column: string;
  kind: 'scalar' | 'enum';
  type: string;
  isList: boolean;
  isRequired: boolean;
  isId: boolean;
  readOnly: boolean;
  hasDefault: boolean;
  isForeignKey: boolean;
  references?: string;
  enumValues?: string[];
}

export interface DataModelMeta {
  name: string;
  table: string;
  idField: string;
  labelField: string;
  fields: DataFieldMeta[];
  searchableFields: string[];
}

export interface DataModelSummary {
  name: string;
  table: string;
  labelField: string;
  rowCount: number;
  fieldCount: number;
}

export type DataRow = Record<string, unknown>;

export interface DataListResponse {
  model: string;
  items: DataRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function listDataModels(signal?: AbortSignal): Promise<DataModelSummary[]> {
  return adminFetch<DataModelSummary[]>('/api/v1/admin/data/models', { signal });
}

export function getDataSchema(model: string, signal?: AbortSignal): Promise<DataModelMeta> {
  return adminFetch<DataModelMeta>(`/api/v1/admin/data/${encodeURIComponent(model)}/schema`, { signal });
}

export function listDataRows(
  model: string,
  query: { page: number; limit: number; q?: string; sort?: string; dir?: 'asc' | 'desc' },
  signal?: AbortSignal,
): Promise<DataListResponse> {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
  if (query.q) params.set('q', query.q);
  if (query.sort) params.set('sort', query.sort);
  if (query.dir) params.set('dir', query.dir);
  return adminFetch<DataListResponse>(`/api/v1/admin/data/${encodeURIComponent(model)}?${params.toString()}`, { signal });
}

export function getDataRow(model: string, id: string, signal?: AbortSignal): Promise<DataRow> {
  return adminFetch<DataRow>(`/api/v1/admin/data/${encodeURIComponent(model)}/${encodeURIComponent(id)}`, { signal });
}

export function createDataRow(model: string, body: DataRow): Promise<DataRow> {
  return adminFetch<DataRow>(`/api/v1/admin/data/${encodeURIComponent(model)}`, { method: 'POST', body });
}

export function updateDataRow(model: string, id: string, body: DataRow): Promise<DataRow> {
  return adminFetch<DataRow>(`/api/v1/admin/data/${encodeURIComponent(model)}/${encodeURIComponent(id)}`, { method: 'PATCH', body });
}

export function deleteDataRow(model: string, id: string, reason: string): Promise<{ deleted: true; id: string }> {
  return adminFetch<{ deleted: true; id: string }>(`/api/v1/admin/data/${encodeURIComponent(model)}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    body: { reason },
  });
}

/** Short, safe cell text for any serialized value. */
export function formatCell(value: unknown, field?: DataFieldMeta): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return value.length ? value.map(String).join(', ') : '—';
  if (typeof value === 'object') return JSON.stringify(value);
  const s = String(value);
  if (field?.type === 'DateTime') {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString('en-GB', { timeZone: 'Asia/Dubai', hour12: false });
    }
  }
  return s.length > 80 ? `${s.slice(0, 77)}…` : s;
}
