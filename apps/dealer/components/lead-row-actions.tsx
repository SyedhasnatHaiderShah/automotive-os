'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { dealerClientRequest, humanizeEnum, LEAD_STATUSES } from '../lib/dealer-api';

export interface StaffOption {
  membershipId: string;
  name: string;
}

export interface LeadRowActionsProps {
  tenantId: string;
  leadId: string;
  status: string;
  assignedMembershipId: string | null;
  canChangeStatus: boolean;
  canAssign: boolean;
  /** Staff already seen on this page; there is no staff directory API yet. */
  staffOptions: StaffOption[];
}

/** Status and assignment controls for one lead, rendered only for permitted roles. */
export function LeadRowActions({
  tenantId,
  leadId,
  status,
  assignedMembershipId,
  canChangeStatus,
  canAssign,
  staffOptions,
}: LeadRowActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<'status' | 'assignment' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const base = `/api/v1/tenants/${encodeURIComponent(tenantId)}/leads/${encodeURIComponent(leadId)}`;

  const patch = async (kind: 'status' | 'assignment', body: unknown) => {
    setPending(kind);
    setError(null);
    try {
      await dealerClientRequest(`${base}/${kind}`, { method: 'PATCH', body });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The lead was not changed.');
    } finally {
      setPending(null);
    }
  };

  const selectClass =
    'min-h-9 rounded-lg bg-surface-container-high text-on-surface text-xs px-2 border border-white/[0.06] focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50';

  return (
    <div className="flex flex-col items-end gap-1.5">
      {canChangeStatus && (
        <label className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
          <span>Status</span>
          <select
            className={selectClass}
            value={status}
            disabled={pending !== null}
            onChange={(event) => {
              if (event.target.value !== status) void patch('status', { status: event.target.value });
            }}
          >
            {LEAD_STATUSES.map((value) => (
              <option key={value} value={value}>
                {humanizeEnum(value)}
              </option>
            ))}
          </select>
        </label>
      )}
      {canAssign && (
        <label className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
          <span>Assigned</span>
          <select
            className={selectClass}
            value={assignedMembershipId ?? ''}
            disabled={pending !== null}
            onChange={(event) => {
              const next = event.target.value || null;
              if (next !== assignedMembershipId) void patch('assignment', { assignedMembershipId: next });
            }}
          >
            <option value="">Unassigned</option>
            {staffOptions.map((staff) => (
              <option key={staff.membershipId} value={staff.membershipId}>
                {staff.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {pending && (
        <span className="text-[11px] text-on-surface-variant" aria-live="polite">
          Saving…
        </span>
      )}
      {error && (
        <span role="alert" className="max-w-[240px] text-right text-[11px] text-error">
          {error}
        </span>
      )}
    </div>
  );
}
