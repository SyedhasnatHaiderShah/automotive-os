'use client';

import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  dealerClientRequest,
  type DealerCatalogOption,
  type DealerTenantContext,
  type DealerVehicle,
} from '../lib/dealer-api';
import { dealerStrings, type DealerLocale } from '../lib/i18n';
import { useModalFocus } from '@automotive-os/ui';

export interface VehicleIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (stockNumber: string) => void;
  tenantId: string;
  /** Only roles the API lets set purchase cost see that field. */
  canSetCost: boolean;
  locale?: DealerLocale;
}

const CONDITIONS = ['NEW', 'USED', 'CERTIFIED_USED'] as const;
const FUELS = ['PETROL', 'DIESEL', 'HYBRID', 'PLUG_IN_HYBRID', 'ELECTRIC', 'OTHER'] as const;
const TRANSMISSIONS = ['AUTOMATIC', 'MANUAL', 'OTHER'] as const;
const MIN_MODEL_YEAR = 1990;
const MAX_MODEL_YEAR = 2030;

const emptyForm = () => ({
  branchId: '',
  makeId: '',
  modelId: '',
  stockNumber: '',
  vin: '',
  trim: '',
  modelYear: String(new Date().getFullYear()),
  condition: 'USED',
  mileageKm: '',
  colorExterior: '',
  fuel: '',
  transmission: '',
  gccSpec: '',
  askingPriceAed: '',
  purchaseCostAed: '',
});

function aedToFils(value: string): number | null {
  const aed = Number(value);
  return value.trim() !== '' && Number.isFinite(aed) && aed >= 0 ? Math.round(aed * 100) : null;
}

/** Creates a stock vehicle through POST /tenants/:tenantId/vehicles. It starts in Intake status. */
export const VehicleIntakeModal: React.FC<VehicleIntakeModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  tenantId,
  canSetCost,
  locale = 'en',
}) => {
  const t = dealerStrings(locale);
  const titleId = useId();
  const [form, setForm] = useState(emptyForm);
  const [branches, setBranches] = useState<DealerTenantContext['branches']>([]);
  const [makes, setMakes] = useState<DealerCatalogOption[]>([]);
  const [models, setModels] = useState<DealerCatalogOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let stale = false;
    setForm(emptyForm());
    setModels([]);
    setError(null);
    setLoadError(null);
    setLoading(true);
    Promise.all([
      dealerClientRequest<DealerTenantContext>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/context`, { method: 'GET' }),
      dealerClientRequest<DealerCatalogOption[]>('/api/v1/catalog/makes', { method: 'GET' }),
    ])
      .then(([context, makeOptions]) => {
        if (stale) return;
        setBranches(context.branches);
        setMakes(makeOptions);
        const onlyBranch = context.branches.length === 1 ? context.branches[0] : undefined;
        if (onlyBranch) {
          setForm((current) => ({ ...current, branchId: onlyBranch.id }));
        }
      })
      .catch(() => {
        if (!stale) setLoadError(t.intakeLoadFailed);
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
    // The translated message is read when the request fails; a language change must not reset the form.
  }, [isOpen, tenantId]);

  useEffect(() => {
    if (!form.makeId) {
      setModels([]);
      return;
    }
    let stale = false;
    setModelsLoading(true);
    dealerClientRequest<DealerCatalogOption[]>(`/api/v1/catalog/makes/${encodeURIComponent(form.makeId)}/models`, { method: 'GET' })
      .then((options) => {
        if (!stale) setModels(options);
      })
      .catch(() => {
        if (!stale) setError(t.intakeModelsFailed);
      })
      .finally(() => {
        if (!stale) setModelsLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [form.makeId]);

  // The form can open on first render (`?intake=1`), and `document` only exists after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Initial focus, Tab containment, scroll lock and focus return; Escape is ignored while saving.
  const dialogRef = useModalFocus<HTMLDivElement>(isOpen && mounted, { onClose, dismissible: !saving });

  if (!isOpen || !mounted) return null;

  const set = (field: keyof ReturnType<typeof emptyForm>) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value, ...(field === 'makeId' ? { modelId: '' } : {}) }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const askingPriceFils = aedToFils(form.askingPriceAed);
    if (askingPriceFils === null || askingPriceFils < 1) {
      setError(t.intakeInvalidPrice);
      return;
    }
    const purchaseCostFils = canSetCost && form.purchaseCostAed.trim() !== '' ? aedToFils(form.purchaseCostAed) : undefined;
    if (purchaseCostFils === null) {
      setError(t.intakeInvalidCost);
      return;
    }
    const stockNumber = form.stockNumber.trim();
    setSaving(true);
    try {
      await dealerClientRequest<DealerVehicle>(`/api/v1/tenants/${encodeURIComponent(tenantId)}/vehicles`, {
        method: 'POST',
        body: {
          branchId: form.branchId,
          makeId: form.makeId,
          modelId: form.modelId,
          stockNumber,
          modelYear: Number(form.modelYear),
          condition: form.condition,
          askingPriceFils,
          ...(form.vin.trim() ? { vin: form.vin.trim().toUpperCase() } : {}),
          ...(form.trim.trim() ? { trim: form.trim.trim() } : {}),
          ...(form.mileageKm.trim() ? { mileageKm: Number(form.mileageKm) } : {}),
          ...(form.colorExterior.trim() ? { colorExterior: form.colorExterior.trim() } : {}),
          ...(form.fuel ? { fuel: form.fuel } : {}),
          ...(form.transmission ? { transmission: form.transmission } : {}),
          ...(form.gccSpec ? { gccSpec: form.gccSpec === 'yes' } : {}),
          ...(purchaseCostFils !== undefined ? { purchaseCostFils } : {}),
        },
      });
      onCreated(stockNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.intakeSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  const labelClass = 'flex flex-col gap-1 text-xs font-medium text-on-surface-variant';
  const inputClass =
    'min-h-10 rounded-lg bg-surface-container-high text-on-surface text-sm px-3 border border-white/[0.06] focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50';
  const required = <span className="text-error" aria-hidden="true"> *</span>;

  // Portal out of the page header: its stacking context would leave the dialog under later page content.
  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-surface-container-low rounded-2xl border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4 text-start">
        <h2 id={titleId} className="font-headline-sm text-lg text-on-surface font-semibold">
          {t.intakeTitle}
        </h2>

        {loading && <p role="status" className="text-sm text-on-surface-variant">{t.intakeLoading}</p>}
        {loadError && <p role="alert" className="text-sm text-error">{loadError}</p>}
        {!loading && !loadError && branches.length === 0 && <p role="alert" className="text-sm text-error">{t.intakeNoBranches}</p>}
        {!loading && !loadError && makes.length === 0 && <p role="alert" className="text-sm text-error">{t.intakeNoMakes}</p>}

        {!loading && !loadError && branches.length > 0 && makes.length > 0 && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className={labelClass}>
                <span>{t.fieldBranch}{required}</span>
                <select className={inputClass} required value={form.branchId} onChange={set('branchId')} autoFocus>
                  <option value="">{t.selectPlaceholder}</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span>{t.fieldMake}{required}</span>
                <select className={inputClass} required value={form.makeId} onChange={set('makeId')}>
                  <option value="">{t.selectPlaceholder}</option>
                  {makes.map((make) => (
                    <option key={make.id} value={make.id}>{make.name}</option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span>{t.fieldModel}{required}</span>
                <select className={inputClass} required value={form.modelId} onChange={set('modelId')} disabled={!form.makeId || modelsLoading}>
                  <option value="">{modelsLoading ? t.intakeLoadingModels : t.selectPlaceholder}</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span>{t.fieldYear}{required}</span>
                <input className={inputClass} type="number" required min={MIN_MODEL_YEAR} max={MAX_MODEL_YEAR} value={form.modelYear} onChange={set('modelYear')} />
              </label>
              <label className={labelClass}>
                <span>{t.fieldCondition}{required}</span>
                <select className={inputClass} required value={form.condition} onChange={set('condition')}>
                  {CONDITIONS.map((value) => (
                    <option key={value} value={value}>{t.conditions[value]}</option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span>{t.fieldStockNumber}{required}</span>
                <input className={inputClass} required value={form.stockNumber} onChange={set('stockNumber')} />
              </label>
              <label className={labelClass}>
                <span>{t.fieldPrice}{required}</span>
                <input className={inputClass} type="number" required min="0.01" step="0.01" dir="ltr" value={form.askingPriceAed} onChange={set('askingPriceAed')} />
              </label>
              {canSetCost && (
                <label className={labelClass}>
                  <span>{t.fieldCost}</span>
                  <input className={inputClass} type="number" min="0" step="0.01" dir="ltr" value={form.purchaseCostAed} onChange={set('purchaseCostAed')} />
                </label>
              )}
              <label className={labelClass}>
                <span>{t.fieldVin}</span>
                <input className={inputClass} maxLength={17} dir="ltr" value={form.vin} onChange={set('vin')} />
              </label>
              <label className={labelClass}>
                <span>{t.fieldTrim}</span>
                <input className={inputClass} value={form.trim} onChange={set('trim')} />
              </label>
              <label className={labelClass}>
                <span>{t.fieldMileage}</span>
                <input className={inputClass} type="number" min="0" step="1" dir="ltr" value={form.mileageKm} onChange={set('mileageKm')} />
              </label>
              <label className={labelClass}>
                <span>{t.fieldColor}</span>
                <input className={inputClass} value={form.colorExterior} onChange={set('colorExterior')} />
              </label>
              <label className={labelClass}>
                <span>{t.fieldFuel}</span>
                <select className={inputClass} value={form.fuel} onChange={set('fuel')}>
                  <option value="">{t.optionNotSpecified}</option>
                  {FUELS.map((value) => (
                    <option key={value} value={value}>{t.fuels[value]}</option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span>{t.fieldTransmission}</span>
                <select className={inputClass} value={form.transmission} onChange={set('transmission')}>
                  <option value="">{t.optionNotSpecified}</option>
                  {TRANSMISSIONS.map((value) => (
                    <option key={value} value={value}>{t.transmissions[value]}</option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span>{t.fieldGcc}</span>
                <select className={inputClass} value={form.gccSpec} onChange={set('gccSpec')}>
                  <option value="">{t.optionNotSpecified}</option>
                  <option value="yes">{t.optionYes}</option>
                  <option value="no">{t.optionNo}</option>
                </select>
              </label>
            </div>

            <p className="text-xs text-on-surface-variant">{t.intakeNote}</p>
            {error && <p role="alert" className="text-sm text-error">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="min-h-10 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm disabled:opacity-60"
              >
                {t.intakeCancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                className="min-h-10 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold disabled:opacity-60"
              >
                {saving ? t.intakeSaving : t.intakeSubmit}
              </button>
            </div>
          </form>
        )}

        {(loading || loadError || branches.length === 0 || makes.length === 0) && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm"
            >
              {t.intakeCancel}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
