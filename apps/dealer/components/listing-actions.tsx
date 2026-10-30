'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { dealerClientRequest, SUBMITTABLE_LISTING_STATUSES, type ListingStatus } from '../lib/dealer-api';

export interface ListingActionsProps {
  tenantId: string;
  vehicleId: string;
  listingId: string | null;
  listingStatus: string | null;
  stockStatus: string;
  askingPriceFils: string;
}

/**
 * Submit-for-review / unpublish controls for one vehicle. Only rendered for
 * roles that may manage listings; the API re-checks role and tenant.
 */
export function ListingActions({ tenantId, vehicleId, listingId, listingStatus, stockStatus, askingPriceFils }: ListingActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stockAllowsListing = stockStatus === 'AVAILABLE';
  const canSubmit =
    stockAllowsListing &&
    (listingStatus === null || SUBMITTABLE_LISTING_STATUSES.includes(listingStatus as ListingStatus));
  const canUnpublish = listingStatus === 'PUBLISHED';

  const run = async (action: 'submit' | 'unpublish') => {
    setPending(true);
    setError(null);
    try {
      const base = `/api/v1/tenants/${encodeURIComponent(tenantId)}`;
      let id = listingId;
      if (action === 'submit' && !id) {
        const draft = await dealerClientRequest<{ id: string }>(`${base}/vehicles/${encodeURIComponent(vehicleId)}/listing`, {
          method: 'POST',
          body: { askingPriceFils: Number(askingPriceFils) },
        });
        id = draft.id;
      }
      if (!id) throw new Error('This vehicle has no listing yet. Nothing was changed.');
      await dealerClientRequest(`${base}/listings/${encodeURIComponent(id)}/${action}`, { method: 'POST' });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The listing was not changed.');
    } finally {
      setPending(false);
    }
  };

  if (!canSubmit && !canUnpublish) {
    return <span className="text-[11px] text-on-surface-variant">—</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {canUnpublish ? (
        <button
          type="button"
          onClick={() => void run('unpublish')}
          disabled={pending}
          className="min-h-9 px-3 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[11px] font-medium disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Unpublish'}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void run('submit')}
          disabled={pending}
          className="min-h-9 px-3 py-1 rounded bg-primary text-on-primary text-[11px] font-bold shadow-sm disabled:opacity-50"
          title="Submit to marketplace moderation"
        >
          {pending ? 'Saving…' : 'Submit for review'}
        </button>
      )}
      {error && (
        <span role="alert" className="max-w-[220px] text-right text-[11px] text-error">
          {error}
        </span>
      )}
    </div>
  );
}
