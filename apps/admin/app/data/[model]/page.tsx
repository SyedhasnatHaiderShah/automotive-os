'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { DataConsoleShell } from '../../../components/DataConsoleShell';
import { ConfirmReasonModal } from '../../../components/ConfirmReasonModal';
import { useLocale } from '../../../lib/locale';
import { errorMessage } from '../../../lib/api';
import {
  deleteDataRow,
  formatCell,
  getDataSchema,
  listDataRows,
  type DataModelMeta,
  type DataRow,
} from '../../../lib/data-api';

const PAGE_SIZE = 25;
const MAX_COLUMNS = 8;

export default function DataModelListPage() {
  const params = useParams<{ model: string }>();
  const model = String(params?.model ?? '');
  const router = useRouter();
  const { isRtl, t } = useLocale();

  const [schema, setSchema] = useState<DataModelMeta | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<DataRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getDataSchema(model, controller.signal)
      .then(setSchema)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setSchemaError(errorMessage(err, t('Unknown table.', 'جدول غير معروف.')));
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  useEffect(() => {
    const h = window.setTimeout(() => {
      const next = searchInput.trim();
      if (next !== search) {
        setSearch(next);
        setPage(1);
      }
    }, 300);
    return () => window.clearTimeout(h);
  }, [searchInput, search]);

  useEffect(() => {
    if (!schema) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    listDataRows(model, { page, limit: PAGE_SIZE, q: search || undefined, sort, dir }, controller.signal)
      .then((data) => {
        setRows(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setRows([]);
        setTotal(0);
        setLoadError(errorMessage(err, t('Rows could not be loaded.', 'تعذر تحميل الصفوف.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, model, page, search, sort, dir, reloadKey]);

  const columns = schema
    ? [
        schema.fields.find((f) => f.name === schema.idField)!,
        ...schema.fields.filter((f) => f.name !== schema.idField && f.type !== 'Json' && !f.isList).slice(0, MAX_COLUMNS - 1),
      ].filter(Boolean)
    : [];

  const toggleSort = (name: string) => {
    if (sort === name) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(name);
      setDir('asc');
    }
    setPage(1);
  };

  const runDelete = async (reason: string) => {
    if (!pendingDelete || !schema) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const id = String(pendingDelete[schema.idField]);
      await deleteDataRow(model, id, reason);
      setPendingDelete(null);
      setToast(t(`Deleted ${model} ${id.slice(0, 8)}…`, `تم حذف ${model} ${id.slice(0, 8)}…`));
      setTimeout(() => setToast(null), 4000);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setDeleteError(errorMessage(err, t('Delete failed', 'فشل الحذف')));
    } finally {
      setDeleteBusy(false);
    }
  };

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <DataConsoleShell
      title={model}
      subtitle={schema ? `${schema.table} · ${schema.fields.length} ${t('fields', 'حقول')}` : undefined}
      crumbs={[{ label: t('Data', 'البيانات'), href: '/data' }, { label: model }]}
      actions={
        <>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-xs text-on-surface flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{t('Refresh', 'تحديث')}</span>
          </button>
          <Link
            href={`/data/${model}/new`}
            className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container text-xs font-bold flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('New row', 'صف جديد')}</span>
          </Link>
        </>
      }
    >
      {toast && (
        <div role="status" className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {toast}
        </div>
      )}
      {(schemaError || loadError) && (
        <div role="alert" className="mb-4 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {schemaError || loadError}
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="data-search" className="sr-only">
          {t('Search rows', 'بحث في الصفوف')}
        </label>
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-outline" aria-hidden="true" />
          <input
            id="data-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('Search text columns, an id or an enum value', 'ابحث في الأعمدة النصية أو بمعرّف أو قيمة')}
            className="w-full rounded-lg border border-white/10 bg-surface-container-lowest ps-9 pe-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="relative rounded-xl border border-white/10 bg-surface-container-low overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-surface-container-lowest text-[11px] uppercase tracking-wider text-outline">
            <tr>
              {columns.map((c) => (
                <th key={c.name} scope="col" className="py-2.5 px-3 text-start whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleSort(c.name)}
                    aria-sort={sort === c.name ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="inline-flex min-h-6 items-center min-w-6 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  >
                    {c.name}
                    {sort === c.name ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </th>
              ))}
              <th scope="col" className="py-2.5 px-3 text-end">
                <span className="sr-only">{t('Actions', 'إجراءات')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-8 text-center text-outline text-xs font-mono">
                  {t('Loading rows…', 'جارٍ تحميل الصفوف…')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-8 text-center text-outline text-xs font-mono">
                  {search ? t('No rows match this search.', 'لا توجد صفوف مطابقة.') : t('This table is empty.', 'هذا الجدول فارغ.')}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = String(row[schema!.idField]);
                return (
                  <tr key={id} className="border-t border-white/[0.06] hover:bg-surface-container-high/60">
                    {columns.map((c) => (
                      <td key={c.name} className={`py-2 px-3 ${c.name === schema!.idField ? 'font-mono text-[11px]' : 'text-xs'} max-w-[260px] truncate`}>
                        {c.name === schema!.idField ? (
                          <Link href={`/data/${model}/${id}`} className="inline-flex min-h-6 items-center text-primary hover:underline">
                            {id.slice(0, 8)}…
                          </Link>
                        ) : (
                          formatCell(row[c.name], c)
                        )}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-end whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => router.push(`/data/${model}/${id}`)}
                        className="px-2.5 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-white text-xs me-2"
                      >
                        {t('Edit', 'تعديل')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setPendingDelete(row);
                        }}
                        aria-label={t(`Delete ${model} ${id.slice(0, 8)}`, `حذف ${model} ${id.slice(0, 8)}`)}
                        className="px-2.5 py-1.5 rounded bg-red-900/40 hover:bg-red-900/70 text-red-200 text-xs inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" aria-hidden="true" />
                        <span>{t('Delete', 'حذف')}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-white/10 text-xs font-mono text-outline">
          <span>
            {t(`${total.toLocaleString('en-US')} rows · page ${page} of ${totalPages}`, `${total.toLocaleString('en-US')} صف · الصفحة ${page} من ${totalPages}`)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-white flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <PrevIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('Prev', 'السابق')}</span>
            </button>
            <button
              type="button"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-white flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{t('Next', 'التالي')}</span>
              <NextIcon className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmReasonModal
        open={pendingDelete !== null}
        title={t(`Delete this ${model} row?`, `حذف هذا الصف من ${model}؟`)}
        description={t(
          'The row and every row that depends on it (database cascade) will be removed. The deletion and your reason are written to the audit ledger.',
          'سيتم حذف الصف وكل الصفوف المعتمدة عليه. يُسجَّل الحذف وسببه في سجل التدقيق.',
        )}
        confirmLabel={t('Delete row', 'حذف الصف')}
        tone="danger"
        busy={deleteBusy}
        error={deleteError}
        onCancel={() => setPendingDelete(null)}
        onConfirm={runDelete}
      />
    </DataConsoleShell>
  );
}
