'use client';

import React, { useMemo, useState } from 'react';
import { useLocale } from '../lib/locale';
import type { DataFieldMeta, DataModelMeta, DataRow } from '../lib/data-api';

/**
 * Create/edit form generated from a table's field metadata (AD-20).
 * Inputs are typed by Prisma type; the API re-validates every value.
 */
export function DataRecordForm({
  schema,
  initial,
  mode,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  schema: DataModelMeta;
  initial?: DataRow;
  mode: 'create' | 'edit';
  busy: boolean;
  error: string | null;
  onSubmit: (values: DataRow) => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const editable = useMemo(() => schema.fields.filter((f) => !f.readOnly), [schema]);
  const readOnly = useMemo(() => schema.fields.filter((f) => f.readOnly), [schema]);
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const init: Record<string, string | boolean> = {};
    for (const f of editable) init[f.name] = toInput(f, initial?.[f.name]);
    return init;
  });
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const set = (name: string, value: string | boolean) => {
    setValues((v) => ({ ...v, [name]: value }));
    setTouched((s) => new Set(s).add(name));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const out: DataRow = {};
    for (const f of editable) {
      if (mode === 'edit' && !touched.has(f.name)) continue;
      out[f.name] = fromInput(f, values[f.name]);
    }
    onSubmit(out);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {error && (
        <div role="alert" className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200 whitespace-pre-wrap">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {editable.map((f) => (
          <FieldInput key={f.name} field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} disabled={busy} />
        ))}
      </div>
      {mode === 'edit' && readOnly.length > 0 && (
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-white/[0.06] bg-surface-container-lowest p-4 text-xs">
          {readOnly.map((f) => (
            <div key={f.name} className="flex flex-col">
              <dt className="font-mono text-outline">{f.name} <span className="text-[10px]">({t('read-only', 'للقراءة فقط')})</span></dt>
              <dd className="text-on-surface break-all">{initial?.[f.name] == null ? '—' : String(initial?.[f.name])}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-sm font-bold disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {busy ? t('Saving…', 'جارٍ الحفظ…') : mode === 'create' ? t('Create row', 'إنشاء صف') : t('Save changes', 'حفظ التغييرات')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t('Cancel', 'إلغاء')}
        </button>
      </div>
    </form>
  );
}

function toInput(field: DataFieldMeta, value: unknown): string | boolean {
  if (field.type === 'Boolean' && !field.isList) return value === true;
  if (value === null || value === undefined) return '';
  if (field.isList) return Array.isArray(value) ? value.map(String).join(', ') : String(value);
  if (field.type === 'Json') return JSON.stringify(value, null, 2);
  if (field.type === 'DateTime') {
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }
  return String(value);
}

function fromInput(field: DataFieldMeta, value: string | boolean | undefined): unknown {
  if (field.type === 'Boolean' && !field.isList) return value === true;
  const s = typeof value === 'string' ? value.trim() : '';
  if (s === '') return null;
  if (field.isList) return s.split(',').map((x) => x.trim()).filter(Boolean);
  return s;
}

function FieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: DataFieldMeta;
  value: string | boolean | undefined;
  onChange: (v: string | boolean) => void;
  disabled: boolean;
}) {
  const id = `f-${field.name}`;
  const base =
    'w-full rounded-lg border border-white/10 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60';
  const label = (
    <label htmlFor={id} className="text-xs font-mono text-outline flex items-center gap-1.5">
      <span>{field.name}</span>
      <span className="text-[10px] text-on-surface-variant">
        {field.kind === 'enum' ? field.type : field.type}
        {field.isList ? '[]' : ''}
        {field.isForeignKey && field.references ? ` → ${field.references}` : ''}
      </span>
      {field.isRequired && !field.hasDefault && !field.isList && <span aria-hidden="true" className="text-primary">*</span>}
    </label>
  );

  if (field.type === 'Boolean' && !field.isList) {
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        <label className="inline-flex items-center gap-2 text-sm">
          <input id={id} type="checkbox" checked={value === true} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="h-6 w-6 accent-[#d4af37]" />
          <span>{value === true ? 'true' : 'false'}</span>
        </label>
      </div>
    );
  }

  if (field.kind === 'enum' && !field.isList) {
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        <select id={id} value={typeof value === 'string' ? value : ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={base}>
          <option value="">{field.isRequired ? '— select —' : '— none —'}</option>
          {field.enumValues?.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'Json' || field.isList) {
    return (
      <div className="flex flex-col gap-1.5 md:col-span-2">
        {label}
        <textarea
          id={id}
          value={typeof value === 'string' ? value : ''}
          disabled={disabled}
          rows={field.type === 'Json' ? 5 : 2}
          placeholder={field.isList ? 'value1, value2' : '{ }'}
          onChange={(e) => onChange(e.target.value)}
          className={`${base} font-mono text-xs`}
        />
      </div>
    );
  }

  const inputType = field.type === 'Int' || field.type === 'Float' ? 'number' : 'text';
  const placeholder =
    field.type === 'DateTime' ? '2026-11-06T10:00:00Z' : field.type === 'BigInt' ? 'integer fils' : field.isForeignKey || field.isId ? 'uuid' : '';
  return (
    <div className="flex flex-col gap-1.5">
      {label}
      <input
        id={id}
        type={inputType}
        value={typeof value === 'string' ? value : ''}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${base} ${field.isForeignKey || field.type === 'DateTime' || field.type === 'BigInt' ? 'font-mono text-xs' : ''}`}
      />
    </div>
  );
}
