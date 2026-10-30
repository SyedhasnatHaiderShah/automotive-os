'use client';

import React from 'react';
import { INTAKE_UNAVAILABLE_MESSAGE } from '../lib/permissions';

export interface VehicleIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: 'en' | 'ar';
}

/**
 * Vehicle intake is blocked: POST /tenants/:tenantId/vehicles needs branchId,
 * makeId and modelId, and there is no catalogue/branch lookup API yet. This
 * dialog only explains that; it collects no data and sends nothing. Every
 * intake entry point is disabled, so it is not mounted today.
 */
export const VehicleIntakeModal: React.FC<VehicleIntakeModalProps> = ({ isOpen, onClose, locale = 'en' }) => {
  if (!isOpen) return null;
  const isArabic = locale === 'ar';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intake-unavailable-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <div className="relative w-full max-w-md bg-surface-container-low rounded-2xl border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
        <h3 id="intake-unavailable-title" className="font-headline-sm text-base text-on-surface font-semibold">
          {isArabic ? 'إدخال المركبات غير متاح' : 'Vehicle intake unavailable'}
        </h3>
        <p className="text-sm text-on-surface-variant">{INTAKE_UNAVAILABLE_MESSAGE}.</p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
