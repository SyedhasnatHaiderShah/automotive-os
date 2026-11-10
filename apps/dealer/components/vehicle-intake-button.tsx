'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { dealerStrings, type DealerLocale } from '../lib/i18n';
import { VehicleIntakeModal } from './vehicle-intake-modal';

export interface VehicleIntakeButtonProps {
  tenantId: string;
  canSetCost: boolean;
  locale: DealerLocale;
  /** Opened from a link elsewhere in the console (`/inventory?intake=1`). */
  openOnLoad: boolean;
}

/** Inventory entry point for vehicle intake; refreshes the table after a create. */
export function VehicleIntakeButton({ tenantId, canSetCost, locale, openOnLoad }: VehicleIntakeButtonProps) {
  const router = useRouter();
  const t = dealerStrings(locale);
  const [open, setOpen] = useState(openOnLoad);
  const [created, setCreated] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    // Drop the query so a page refresh does not open the form again.
    if (openOnLoad) router.replace('/inventory');
  };

  return (
    <div className="flex flex-col items-start xl:items-end gap-1">
      <button
        type="button"
        onClick={() => { setCreated(null); setOpen(true); }}
        className="min-h-10 bg-primary text-on-primary px-4 py-2 rounded-xl font-body-sm text-xs font-bold flex items-center gap-1.5 hover:brightness-110 transition-all"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add_box</span>
        <span>{t.intakeVehicle}</span>
      </button>
      {created && <span role="status" className="text-[11px] text-tertiary">{t.intakeAdded(created)}</span>}
      <VehicleIntakeModal
        isOpen={open}
        onClose={close}
        onCreated={(stockNumber) => {
          setCreated(stockNumber);
          close();
          router.refresh();
        }}
        tenantId={tenantId}
        canSetCost={canSetCost}
        locale={locale}
      />
    </div>
  );
}
