'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataConsoleShell } from './DataConsoleShell';
import { DataRecordForm } from './DataRecordForm';
import { useLocale } from '../lib/locale';
import { errorMessage } from '../lib/api';
import { createDataRow, getDataRow, getDataSchema, updateDataRow, type DataModelMeta, type DataRow } from '../lib/data-api';

/** Shared screen for `/data/[model]/new` and `/data/[model]/[id]`. */
export function DataRecordPage({ model, id }: { model: string; id?: string }) {
  const router = useRouter();
  const { t } = useLocale();
  const mode = id ? 'edit' : 'create';
  const [schema, setSchema] = useState<DataModelMeta | null>(null);
  const [row, setRow] = useState<DataRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getDataSchema(model, controller.signal), id ? getDataRow(model, id, controller.signal) : Promise.resolve(null)])
      .then(([s, r]) => {
        setSchema(s);
        setRow(r);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setLoadError(errorMessage(err, t('Record could not be loaded.', 'تعذر تحميل السجل.')));
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, id]);

  const submit = async (values: DataRow) => {
    setBusy(true);
    setSaveError(null);
    setSaved(null);
    try {
      if (mode === 'create') {
        const created = await createDataRow(model, values);
        const newId = String(created[schema!.idField]);
        router.push(`/data/${model}/${newId}?created=1`);
        return;
      }
      if (Object.keys(values).length === 0) {
        setSaveError(t('Nothing changed.', 'لم يتغير شيء.'));
        return;
      }
      const updated = await updateDataRow(model, id!, values);
      setRow(updated);
      setSaved(t('Saved. The change is in the audit ledger.', 'تم الحفظ وتسجيل التغيير في سجل التدقيق.'));
    } catch (err) {
      setSaveError(`${t('Not saved:', 'لم يُحفظ:')} ${errorMessage(err, t('Request failed', 'فشل الطلب'))}`);
    } finally {
      setBusy(false);
    }
  };

  const created = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('created') === '1';

  return (
    <DataConsoleShell
      title={mode === 'create' ? t(`New ${model}`, `${model} جديد`) : `${model} ${id!.slice(0, 8)}…`}
      subtitle={schema && row ? `${schema.labelField}: ${String(row[schema.labelField] ?? '—')}` : undefined}
      crumbs={[{ label: t('Data', 'البيانات'), href: '/data' }, { label: model, href: `/data/${model}` }, { label: mode === 'create' ? t('New', 'جديد') : id!.slice(0, 8) }]}
    >
      {loadError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {loadError}
        </div>
      )}
      {(saved || created) && !saveError && (
        <div role="status" className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {saved ?? t('Row created. The creation is in the audit ledger.', 'تم إنشاء الصف وتسجيله في سجل التدقيق.')}
        </div>
      )}
      {schema && (mode === 'create' || row) ? (
        <div className="rounded-xl border border-white/10 bg-surface-container-low p-5">
          <DataRecordForm
            key={`${model}-${id ?? 'new'}-${row ? String(row.updatedAt ?? '') : ''}`}
            schema={schema}
            initial={row ?? undefined}
            mode={mode}
            busy={busy}
            error={saveError}
            onSubmit={submit}
            onCancel={() => router.push(`/data/${model}`)}
          />
        </div>
      ) : (
        !loadError && <p className="text-xs font-mono text-outline">{t('Loading…', 'جارٍ التحميل…')}</p>
      )}
    </DataConsoleShell>
  );
}
