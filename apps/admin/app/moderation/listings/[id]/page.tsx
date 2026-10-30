'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AdminSidebar } from '../../../../components/AdminSidebar';
import { AdminHeader } from '../../../../components/AdminHeader';
import { ConfirmReasonModal } from '../../../../components/ConfirmReasonModal';
import {
  AdminListingDetail,
  AdminListingMedia,
  errorMessage,
  formatAedFromFils,
  formatDubaiDateTime,
  getAdminListing,
  submitListingDecision,
} from '../../../../lib/api';

/**
 * Listing moderation review.
 *
 * Renders exactly the compact DTO returned by GET /admin/listings/:id.
 * Registry attestations, EXIF forensics, duplicate scans and lien checks are
 * not provided by the API and are therefore not shown. Decisions post only the
 * fields in AdminListingDecisionDto: { decision, reason? }.
 */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function mediaPreviewUrl(media: AdminListingMedia): string | null {
  if (typeof media.url === 'string' && /^https?:\/\//i.test(media.url)) return media.url;
  if (typeof media.objectKey === 'string' && /^https?:\/\//i.test(media.objectKey)) return media.objectKey;
  return null;
}

export default function ListingModerationPage() {
  const params = useParams();
  const rawId = params?.id;
  const listingRef = typeof rawId === 'string' ? safeDecode(rawId) : '';

  const [isRtl, setIsRtl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [listing, setListing] = useState<AdminListingDetail | null>(null);
  const [pendingDecision, setPendingDecision] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  const reload = useCallback(() => setRetryCount((n) => n + 1), []);

  useEffect(() => {
    if (!listingRef) {
      setLoading(false);
      setLoadError('No listing identifier was provided.');
      return;
    }
    let active = true;
    setLoading(true);
    setLoadError(null);
    getAdminListing(listingRef)
      .then((data) => { if (active) setListing(data); })
      .catch((err: unknown) => {
        if (!active) return;
        setListing(null);
        setLoadError(errorMessage(err, 'Listing could not be loaded.'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [listingRef, retryCount]);

  const confirmDecision = async (reason: string) => {
    if (!listing || !pendingDecision || isSubmitting) return;
    setIsSubmitting(true);
    setDecisionError(null);
    try {
      const result = await submitListingDecision(listing.id, pendingDecision, reason);
      if (!result || typeof result.status !== 'string') {
        throw new Error('The API did not confirm a persisted listing status.');
      }
      setSubmissionFeedback(`API saved the decision. Listing status is now ${result.status}.`);
      setPendingDecision(null);
      reload();
    } catch (err) {
      setDecisionError(`Decision was NOT saved. ${errorMessage(err, 'Please retry.')}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const vehicle = listing?.vehicle;
  const media = Array.isArray(vehicle?.media) ? [...vehicle!.media].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) : [];
  const vehicleName = vehicle
    ? [vehicle.modelYear, vehicle.makeName, vehicle.modelName, vehicle.trim].filter(Boolean).join(' ')
    : '';
  const canDecide = listing?.status === 'PENDING_REVIEW';

  return (
    <div className={`min-h-screen bg-background font-body-md text-on-surface ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminSidebar isRtl={isRtl} />
      <div className={isRtl ? 'pr-60' : 'pl-60'}>
        <AdminHeader isRtl={isRtl} onToggleRtl={() => setIsRtl(!isRtl)} />

        <main className="w-full pt-16 bg-background px-gutter py-space-lg">
          <div className="flex flex-col gap-space-lg">
            <Link href="/moderation" className="inline-flex items-center gap-1 text-body-sm text-outline hover:text-primary w-fit">
              <span className="material-symbols-outlined text-[16px]">{isRtl ? 'chevron_right' : 'chevron_left'}</span>
              <span>{isRtl ? 'العودة إلى طابور المراجعة' : 'Back to moderation'}</span>
            </Link>

            {loading && (
              <div role="status" className="flex items-center gap-3 text-outline">
                <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
                <span className="font-label-caps text-label-caps uppercase tracking-wider">Loading listing…</span>
              </div>
            )}

            {!loading && loadError && (
              <section role="alert" className="max-w-xl rounded-xl border border-error/50 bg-surface-container p-6 space-y-4">
                <h1 className="text-xl font-semibold">Listing unavailable</h1>
                <p className="text-on-surface-variant">{loadError}</p>
                <p className="text-sm text-on-surface-variant">No moderation decision has been made.</p>
                <button type="button" className="rounded-lg bg-primary px-4 py-2 text-on-primary" onClick={reload}>
                  Retry
                </button>
              </section>
            )}

            {!loading && listing && vehicle && (
              <>
                {submissionFeedback && (
                  <div role="status" className="rounded-lg border border-tertiary/40 bg-tertiary/10 p-3 text-body-sm text-on-surface">
                    {submissionFeedback}
                  </div>
                )}

                {/* Header */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl border border-surface-container-high/40 flex flex-col gap-space-sm">
                  <div className="flex items-center gap-space-sm flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-caps text-label-caps uppercase">
                      {listing.status}
                    </span>
                    {typeof listing.qualityScore === 'number' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps uppercase">
                        Quality score {listing.qualityScore}
                      </span>
                    )}
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                    {listing.title}
                  </h1>
                  <p className="font-body-sm text-body-sm text-outline">
                    {vehicleName} · {listing.tenant.displayName} (KYB {listing.tenant.verificationStatus})
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-space-md">
                  {/* Listing & vehicle facts */}
                  <section className="xl:col-span-2 rounded-xl bg-surface-container p-space-lg border border-surface-container-high/40">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-space-md">
                      {isRtl ? 'بيانات الإعلان والمركبة' : 'Listing & vehicle record'}
                    </h2>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-space-lg gap-y-space-sm font-body-sm text-body-sm">
                      {[
                        ['Asking price', formatAedFromFils(listing.askingPriceFils)],
                        ['Dealership', `${listing.tenant.displayName} (/${listing.tenant.slug})`],
                        ['VIN', vehicle.vin || 'Not on file'],
                        ['Stock number', vehicle.stockNumber || '—'],
                        ['Mileage', typeof vehicle.mileageKm === 'number' ? `${vehicle.mileageKm.toLocaleString('en-US')} km` : '—'],
                        ['GCC spec (dealer declared)', vehicle.gccSpec === null || vehicle.gccSpec === undefined ? '—' : vehicle.gccSpec ? 'Yes' : 'No'],
                        ['Fuel', vehicle.fuel || '—'],
                        ['Transmission', vehicle.transmission || '—'],
                        ['Exterior colour', vehicle.colorExterior || '—'],
                        ['Stock status', vehicle.stockStatus || '—'],
                        ['Listing slug', listing.slug],
                        ['Listing UUID', listing.id],
                        ['Created', formatDubaiDateTime(listing.createdAt)],
                        ['Updated', formatDubaiDateTime(listing.updatedAt)],
                      ].map(([label, value]) => (
                        <div key={label} className="flex flex-col">
                          <dt className="font-label-caps text-label-caps text-outline uppercase">{label}</dt>
                          <dd className="text-on-surface font-data-mono-num break-all">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    {listing.description && (
                      <div className="mt-space-md">
                        <h3 className="font-label-caps text-label-caps text-outline uppercase mb-1">Description</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant whitespace-pre-wrap">{listing.description}</p>
                      </div>
                    )}
                    <p className="mt-space-md text-[11px] text-outline">
                      Values are dealer-submitted and stored by the platform; no external registry, VIN or lien check is performed.
                    </p>
                  </section>

                  {/* Decision panel */}
                  <section className="rounded-xl bg-surface-container p-space-lg border border-surface-container-high/40 flex flex-col gap-space-sm">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      {isRtl ? 'قرار المراجعة' : 'Moderation decision'}
                    </h2>
                    {!canDecide && (
                      <p className="font-body-sm text-body-sm text-outline">
                        Decisions apply to listings in PENDING_REVIEW. This listing is {listing.status}.
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={!canDecide || isSubmitting}
                      onClick={() => { setDecisionError(null); setPendingDecision('APPROVE'); }}
                      className="h-10 px-4 rounded bg-primary text-on-primary font-body-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve & publish
                    </button>
                    <button
                      type="button"
                      disabled={!canDecide || isSubmitting}
                      onClick={() => { setDecisionError(null); setPendingDecision('REJECT'); }}
                      className="h-10 px-4 rounded bg-error-container text-on-error-container font-body-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject with reason
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Not available yet: no clarification-request API"
                      className="h-10 px-4 rounded bg-surface-container-high text-on-surface-variant font-body-sm opacity-50 cursor-not-allowed"
                    >
                      Request clarification (not available yet)
                    </button>
                  </section>
                </div>

                {/* Media */}
                <section className="rounded-xl bg-surface-container-low p-space-lg border border-surface-container-high/40">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-space-md">
                    {isRtl ? 'الوسائط' : 'Media'} ({media.length})
                  </h2>
                  {media.length === 0 ? (
                    <p className="font-body-sm text-body-sm text-outline">No media attached to this vehicle.</p>
                  ) : (
                    <ul className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
                      {media.map((m, idx) => {
                        const url = mediaPreviewUrl(m);
                        return (
                          <li key={m.id ?? idx} className="rounded-lg bg-surface-container overflow-hidden border border-surface-container-high/40">
                            {url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={url} alt={m.altText || `${vehicleName} media ${idx + 1}`} className="w-full aspect-[4/3] object-cover" />
                            ) : (
                              <div className="w-full aspect-[4/3] flex items-center justify-center text-center p-2 text-[11px] text-outline">
                                Preview not available (private object, no admin media URL)
                              </div>
                            )}
                            <div className="px-2 py-1 text-[11px] text-outline flex justify-between">
                              <span>{m.kind || 'MEDIA'}</span>
                              <span>{m.isPublic ? 'public' : 'private'}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      <ConfirmReasonModal
        open={pendingDecision !== null}
        title={pendingDecision === 'REJECT' ? 'Reject this listing?' : 'Approve and publish this listing?'}
        description={
          listing
            ? pendingDecision === 'REJECT'
              ? `"${listing.title}" will be rejected. The reason is stored with the decision.`
              : `"${listing.title}" will be approved for marketplace publication.`
            : ''
        }
        confirmLabel={pendingDecision === 'REJECT' ? 'Reject listing' : 'Approve listing'}
        tone={pendingDecision === 'REJECT' ? 'danger' : 'neutral'}
        minReasonLength={pendingDecision === 'REJECT' ? 5 : 0}
        reasonLabel={pendingDecision === 'REJECT' ? 'Rejection reason (required, sent to the API)' : 'Review notes (optional, sent to the API)'}
        busy={isSubmitting}
        error={decisionError}
        onCancel={() => setPendingDecision(null)}
        onConfirm={confirmDecision}
      />
    </div>
  );
}
