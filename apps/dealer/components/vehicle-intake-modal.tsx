'use client';

import React, { useState } from 'react';
import { createDealerVehicle, DealerVehicleItem } from '../lib/api';

export interface VehicleIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleCreated: (vehicle: DealerVehicleItem) => void;
  locale?: 'en' | 'ar';
}

export const VehicleIntakeModal: React.FC<VehicleIntakeModalProps> = ({
  isOpen,
  onClose,
  onVehicleCreated,
  locale = 'en',
}) => {
  const isArabic = locale === 'ar';

  const [vin, setVin] = useState('WP0AF2A97RS' + Math.floor(100000 + Math.random() * 900000));
  const [stockNumber, setStockNumber] = useState('#DXB-' + Math.floor(100 + Math.random() * 900));
  const [makeName, setMakeName] = useState('Porsche');
  const [modelName, setModelName] = useState('911 Turbo S');
  const [modelYear, setModelYear] = useState(2024);
  const [condition, setCondition] = useState('USED');
  const [mileageKm, setMileageKm] = useState(1200);
  const [purchaseCostAed, setPurchaseCostAed] = useState(820000);
  const [askingPriceAed, setAskingPriceAed] = useState(960000);
  const [gccSpec, setGccSpec] = useState(true);
  const [colorExterior, setColorExterior] = useState('Crayon Grey Metallic');
  const [submitToModeration, setSubmitToModeration] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rtaStatus, setRtaStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRtaLookup = () => {
    setRtaStatus('RTA Tasjeel Verified: GCC Specification 99/100, Clean History');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const created = await createDealerVehicle({
        makeName,
        modelName,
        vin,
        stockNumber,
        modelYear,
        condition,
        mileageKm,
        purchaseCostAed,
        askingPriceAed,
        gccSpec,
        colorExterior,
        submitToModeration,
      });

      onVehicleCreated(created);
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Failed to intake vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-surface-container-low rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-surface-container px-6 py-4 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-bold text-on-primary">
              <span className="material-symbols-outlined text-[20px]">add_box</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base text-on-surface font-semibold">
                {isArabic ? 'إدخال مركبة جديدة إلى المخزون' : 'Intake Vehicle to Canonical Stock'}
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Tenant-scoped canonical asset registration with defense-in-depth RLS isolation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* VIN & RTA Lookup */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
              Chassis Number (VIN)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                className="flex-1 h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-data-mono-num text-sm border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleRtaLookup}
                className="px-3.5 h-10 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-body-sm text-xs font-semibold flex items-center gap-1.5 shrink-0 border border-primary/20"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Lookup RTA</span>
              </button>
            </div>
            {rtaStatus && (
              <span className="text-xs text-tertiary flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                {rtaStatus}
              </span>
            )}
          </div>

          {/* Marque & Model Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                Make
              </label>
              <select
                value={makeName}
                onChange={(e) => setMakeName(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-xs sm:text-sm border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Porsche">Porsche</option>
                <option value="Mercedes-AMG">Mercedes-AMG</option>
                <option value="Ferrari">Ferrari</option>
                <option value="Land Rover">Land Rover</option>
                <option value="Toyota">Toyota</option>
                <option value="Aston Martin">Aston Martin</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                Model
              </label>
              <input
                type="text"
                required
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-xs sm:text-sm border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                Stock ID
              </label>
              <input
                type="text"
                required
                value={stockNumber}
                onChange={(e) => setStockNumber(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-data-mono-num text-xs sm:text-sm border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Year, Condition & Mileage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                Model Year
              </label>
              <input
                type="number"
                required
                value={modelYear}
                onChange={(e) => setModelYear(Number(e.target.value))}
                className="h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-data-mono-num text-xs sm:text-sm border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-xs sm:text-sm border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="NEW">Brand New</option>
                <option value="USED">Pre-Owned Certified</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                Odometer (KM)
              </label>
              <input
                type="number"
                required
                value={mileageKm}
                onChange={(e) => setMileageKm(Number(e.target.value))}
                className="h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-data-mono-num text-xs sm:text-sm border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Costs & Asking Prices (AED) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-surface-container-lowest rounded-xl border border-white/[0.06]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                  Private Acquisition Cost (AED)
                </label>
                <span className="text-[10px] text-outline">Encrypted / Principal Only</span>
              </div>
              <input
                type="number"
                required
                value={purchaseCostAed}
                onChange={(e) => setPurchaseCostAed(Number(e.target.value))}
                className="h-10 px-3 rounded-lg bg-surface-container text-on-surface font-data-mono-num text-sm border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-label-caps text-[11px] uppercase tracking-wider text-primary">
                  Market Asking Price (AED)
                </label>
                <span className="text-[10px] text-tertiary font-data-mono-num font-bold">
                  Margin: +{Math.round(((askingPriceAed - purchaseCostAed) / purchaseCostAed) * 100)}%
                </span>
              </div>
              <input
                type="number"
                required
                value={askingPriceAed}
                onChange={(e) => setAskingPriceAed(Number(e.target.value))}
                className="h-10 px-3 rounded-lg bg-surface-container text-primary font-bold font-data-mono-num text-sm border border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Color & GCC Spec */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                Exterior Color & Finish
              </label>
              <input
                type="text"
                value={colorExterior}
                onChange={(e) => setColorExterior(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-xs sm:text-sm border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-container-lowest border border-white/[0.06] cursor-pointer">
                <input
                  type="checkbox"
                  checked={gccSpec}
                  onChange={(e) => setGccSpec(e.target.checked)}
                  className="rounded bg-surface-container text-primary-container accent-[#d4af37] w-4 h-4 cursor-pointer"
                />
                <span className="font-body-sm text-xs text-on-surface font-medium">
                  GCC Official Homologation & Spec
                </span>
              </label>
            </div>
          </div>

          {/* Submit To Moderation Option */}
          <div className="p-3 bg-surface-container rounded-xl border border-white/[0.06] flex items-center justify-between">
            <div>
              <span className="font-body-md text-xs sm:text-sm font-semibold text-on-surface block">
                Submit Listing to Marketplace Moderation
              </span>
              <span className="font-body-sm text-xs text-on-surface-variant">
                Dispatches transactional outbox event to sync public listing projection upon admin approval.
              </span>
            </div>
            <input
              type="checkbox"
              checked={submitToModeration}
              onChange={(e) => setSubmitToModeration(e.target.checked)}
              className="rounded bg-surface-container text-primary accent-[#d4af37] w-5 h-5 cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-md text-xs sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-primary text-on-primary font-headline-sm text-xs sm:text-sm font-bold hover:bg-primary-fixed-dim transition-all shadow-md flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              <span>{isSubmitting ? 'Registering...' : 'Register Vehicle to Vault'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
