'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { DataConsoleShell } from '../../components/DataConsoleShell';
import { useLocale } from '../../lib/locale';
import { errorMessage } from '../../lib/api';
import { listDataModels, type DataModelSummary } from '../../lib/data-api';

export default function DataConsoleIndexPage() {
  const { t } = useLocale();
  const [models, setModels] = useState<DataModelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listDataModels(controller.signal)
      .then((rows) => setModels(rows))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setModels([]);
        setError(errorMessage(err, t('Tables could not be loaded.', 'تعذر تحميل الجداول.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  return (
    <DataConsoleShell
      title={t('Data Console', 'وحدة البيانات')}
      subtitle={t('Every table in the platform database, with audited create, edit and delete.', 'كل جداول قاعدة البيانات مع إنشاء وتعديل وحذف مسجّل.')}
      crumbs={[{ label: t('Data', 'البيانات') }]}
      actions={
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-xs text-on-surface flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{t('Refresh counts', 'تحديث الأعداد')}</span>
        </button>
      }
    >
      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
      <div className="relative rounded-xl border border-white/10 bg-surface-container-low overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-lowest text-[11px] uppercase tracking-wider text-outline">
            <tr>
              <th scope="col" className="py-2.5 px-4 text-start">{t('Table', 'الجدول')}</th>
              <th scope="col" className="py-2.5 px-4 text-start">{t('Database name', 'اسم قاعدة البيانات')}</th>
              <th scope="col" className="py-2.5 px-4 text-end">{t('Rows', 'الصفوف')}</th>
              <th scope="col" className="py-2.5 px-4 text-end">{t('Fields', 'الحقول')}</th>
              <th scope="col" className="py-2.5 px-4 text-end"><span className="sr-only">{t('Open', 'فتح')}</span></th>
            </tr>
          </thead>
          <tbody>
            {loading && models.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-outline text-xs font-mono">{t('Loading tables…', 'جارٍ تحميل الجداول…')}</td>
              </tr>
            ) : models.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-outline text-xs font-mono">{t('No tables returned.', 'لم تُرجع أي جداول.')}</td>
              </tr>
            ) : (
              models.map((m) => (
                <tr key={m.name} className="border-t border-white/[0.06] hover:bg-surface-container-high/60">
                  <td className="py-2.5 px-4 font-semibold text-white">
                    <Link href={`/data/${m.name}`} className="inline-flex min-h-6 items-center hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                      {m.name}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs text-on-surface-variant">{m.table}</td>
                  <td className="py-2.5 px-4 text-end font-mono text-xs">{m.rowCount.toLocaleString('en-US')}</td>
                  <td className="py-2.5 px-4 text-end font-mono text-xs">{m.fieldCount}</td>
                  <td className="py-2.5 px-4 text-end">
                    <Link
                      href={`/data/${m.name}`}
                      className="px-2.5 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-white text-xs"
                    >
                      {t('Browse', 'استعراض')}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DataConsoleShell>
  );
}
