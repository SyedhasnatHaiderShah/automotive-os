'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { APPOINTMENT_TRANSITIONS, dealerClientRequest, type AppointmentStatus } from '../lib/dealer-api';
import { dealerStrings, type DealerLocale } from '../lib/i18n';

/** Moves that end the appointment for good and ask for confirmation first. */
const NEEDS_CONFIRMATION: readonly AppointmentStatus[] = ['CANCELLED', 'NO_SHOW'];

export interface AppointmentRowActionsProps {
  tenantId: string;
  appointmentId: string;
  status: string;
  locale: DealerLocale;
}

/** Status buttons for one appointment; only moves the API accepts are offered. */
export function AppointmentRowActions({ tenantId, appointmentId, status, locale }: AppointmentRowActionsProps) {
  const router = useRouter();
  const t = dealerStrings(locale);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = APPOINTMENT_TRANSITIONS[status as AppointmentStatus] ?? [];

  if (next.length === 0) {
    return <span className="text-[11px] text-on-surface-variant">{t.apptFinal}</span>;
  }

  const move = async (target: AppointmentStatus) => {
    if (NEEDS_CONFIRMATION.includes(target) && !window.confirm(t.apptConfirmFinal(t.apptActions[target]))) return;
    setPending(true);
    setError(null);
    try {
      await dealerClientRequest(
        `/api/v1/tenants/${encodeURIComponent(tenantId)}/appointments/${encodeURIComponent(appointmentId)}/status`,
        { method: 'PATCH', body: { status: target } },
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.apptFailed);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-1.5">
        {next.map((target) => (
          <button
            key={target}
            type="button"
            disabled={pending}
            onClick={() => void move(target)}
            className={`min-h-9 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
              target === 'CONFIRMED' || target === 'COMPLETED'
                ? 'bg-primary text-on-primary hover:brightness-110'
                : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-white/[0.06]'
            }`}
          >
            {t.apptActions[target]}
          </button>
        ))}
      </div>
      {pending && <span className="text-[11px] text-on-surface-variant" aria-live="polite">{t.apptSaving}</span>}
      {error && <span role="alert" className="max-w-[240px] text-end text-[11px] text-error">{error}</span>}
    </div>
  );
}
