'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AdminSidebar } from '../../../components/AdminSidebar';
import { AdminHeader } from '../../../components/AdminHeader';
import { useLocale } from '../../../lib/locale';
import { ConfirmReasonModal } from '../../../components/ConfirmReasonModal';
import {
  AdminTenantDetail,
  TenantStatus,
  errorMessage,
  formatDubaiDateTime,
  getTenant,
  updateTenantStatus,
} from '../../../lib/api';

/**
 * Dealer KYB dossier.
 *
 * Renders exactly what GET /admin/verifications/:id returns (tenant summary,
 * stored verification status, trade licence ref/expiry, branches, counts).
 * Beneficial owners, facility audits, risk scores and dual signers are not
 * provided by the API and are therefore not shown. There is no KYB decision
 * endpoint, so approve/reject are disabled. Tenant suspension uses the real
 * PATCH /admin/tenants/:id/status endpoint with a required reason.
 */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function KybVerificationPage() {
  const params = useParams();
  const rawId = params?.id;
  const tenantRef = typeof rawId === 'string' ? safeDecode(rawId) : '';

  const { isRtl, toggleLocale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dossier, setDossier] = useState<AdminTenantDetail | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [pendingStatus, setPendingStatus] = useState<TenantStatus | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(() => setRetryCount((n) => n + 1), []);

  useEffect(() => {
    if (!tenantRef) {
      setLoading(false);
      setLoadError('No dealership identifier was provided.');
      return;
    }
    let active = true;
    setLoading(true);
    setLoadError(null);
    getTenant(tenantRef)
      .then((data) => { if (active) setDossier(data); })
      .catch((err: unknown) => {
        if (!active) return;
        setDossier(null);
        setLoadError(errorMessage(err, 'Dealer dossier could not be loaded.'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tenantRef, retryCount]);

  const confirmStatus = async (reason: string) => {
    if (!dossier || !pendingStatus) return;
    setStatusBusy(true);
    setStatusError(null);
    try {
      const updated = await updateTenantStatus(dossier.id, pendingStatus, reason);
      setFeedback(`API confirmed tenant status ${updated?.status ?? pendingStatus}.`);
      setPendingStatus(null);
      load();
    } catch (err) {
      setStatusError(`Not saved: ${errorMessage(err, 'Status update failed')}`);
    } finally {
      setStatusBusy(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background font-body-md text-on-surface ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminSidebar isRtl={isRtl} />
      <div className={isRtl ? 'pr-60' : 'pl-60'}>
        <AdminHeader isRtl={isRtl} onToggleRtl={toggleLocale} />

        <main className="w-full pt-16 bg-background px-gutter py-space-lg">
          <div className="flex flex-col gap-space-lg">
            <Link href="/verifications" className="inline-flex items-center gap-1 text-body-sm text-outline hover:text-primary w-fit">
              <span className="material-symbols-outlined text-[16px]">{isRtl ? 'chevron_right' : 'chevron_left'}</span>
              <span>{isRtl ? 'العودة إلى السجل' : 'Back to KYB registry'}</span>
            </Link>

            {loading && (
              <div role="status" className="flex items-center gap-3 text-outline">
                <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
                <span className="font-label-caps text-label-caps uppercase tracking-wider">Loading dealer dossier…</span>
              </div>
            )}

            {!loading && loadError && (
              <section role="alert" className="max-w-xl rounded-xl border border-error/50 bg-surface-container p-6 space-y-4">
                <h1 className="text-xl font-semibold">Dealer dossier unavailable</h1>
                <p className="text-on-surface-variant">{loadError}</p>
                <p className="text-sm text-on-surface-variant">No verification or dealer approval has occurred.</p>
                <button type="button" className="rounded-lg bg-primary px-4 py-2 text-on-primary" onClick={load}>
                  Retry
                </button>
              </section>
            )}

            {!loading && dossier && (
              <>
                {feedback && (
                  <div role="status" className="rounded-lg border border-tertiary/40 bg-tertiary/10 p-3 text-body-sm text-on-surface">
                    {feedback}
                  </div>
                )}

                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl border border-surface-container-high/40 flex flex-col gap-space-sm">
                  <div className="flex items-center gap-space-sm flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-caps text-label-caps uppercase">
                      KYB: {dossier.verificationStatus}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps uppercase">
                      Tenant: {dossier.status}
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                    {isRtl ? `التحقق المؤسسي من الوكيل: ${dossier.displayName}` : `Dealership KYB Verification: ${dossier.displayName}`}
                  </h1>
                  <p className="font-body-sm text-body-sm text-outline">{dossier.legalName}</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-space-md">
                  {/* Registry facts */}
                  <section className="xl:col-span-2 rounded-xl bg-surface-container p-space-lg border border-surface-container-high/40">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-space-md">
                      {isRtl ? 'بيانات السجل' : 'Registry record'}
                    </h2>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-space-lg gap-y-space-sm font-body-sm text-body-sm">
                      {[
                        ['Tenant UUID', dossier.id],
                        ['Slug', `/${dossier.slug}`],
                        ['Legal name', dossier.legalName],
                        ['Display name', dossier.displayName],
                        ['Trade licence ref', dossier.tradeLicenseNumber ?? 'Not on file'],
                        ['Trade licence expiry', dossier.tradeLicenseExpiry ? formatDubaiDateTime(dossier.tradeLicenseExpiry) : 'Not on file'],
                        ['Vehicles', String(dossier.vehicleCount ?? 0)],
                        ['Listings', String(dossier.listingCount ?? 0)],
                        ['Created', formatDubaiDateTime(dossier.createdAt)],
                        ['Updated', formatDubaiDateTime(dossier.updatedAt)],
                      ].map(([label, value]) => (
                        <div key={label} className="flex flex-col">
                          <dt className="font-label-caps text-label-caps text-outline uppercase">{label}</dt>
                          <dd className="text-on-surface font-data-mono-num break-all">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-space-md text-[11px] text-outline">
                      Trade licence details are as stored by the platform; no live DED/registry check is performed.
                    </p>
                  </section>

                  {/* Decision panel */}
                  <section className="rounded-xl bg-surface-container p-space-lg border border-surface-container-high/40 flex flex-col gap-space-sm">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      {isRtl ? 'قرار الاعتماد' : 'Accreditation decision'}
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {isRtl
                        ? 'نقطة نهاية قرار التحقق غير متاحة بعد.'
                        : 'Decision endpoint not available yet. KYB approval and rejection cannot be recorded from the console.'}
                    </p>
                    <button
                      type="button"
                      disabled
                      title="Not available yet: no KYB decision endpoint"
                      className="h-10 px-4 rounded bg-primary text-on-primary font-body-sm font-semibold opacity-50 cursor-not-allowed"
                    >
                      Approve KYB (not available yet)
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Not available yet: no KYB decision endpoint"
                      className="h-10 px-4 rounded bg-error-container text-on-error-container font-body-sm opacity-50 cursor-not-allowed"
                    >
                      Reject KYB (not available yet)
                    </button>

                    <div className="mt-space-sm pt-space-sm border-t border-surface-container-high/40 flex flex-col gap-space-xs">
                      <span className="font-label-caps text-label-caps text-outline uppercase">Tenant status</span>
                      {dossier.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => { setStatusError(null); setPendingStatus('SUSPENDED'); }}
                          className="h-10 px-4 rounded bg-error-container/80 hover:bg-error hover:text-on-error text-error font-body-sm font-medium transition-colors"
                        >
                          Suspend dealership
                        </button>
                      ) : dossier.status === 'SUSPENDED' ? (
                        <button
                          type="button"
                          onClick={() => { setStatusError(null); setPendingStatus('ACTIVE'); }}
                          className="h-10 px-4 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm font-medium transition-colors"
                        >
                          {isRtl ? 'إعادة تفعيل الوكالة' : 'Reactivate dealership'}
                        </button>
                      ) : (
                        // AD-04: activation is offered only from SUSPENDED. PENDING
                        // dealerships need an APPROVED KYB decision first (enforced
                        // by the API); CLOSED is terminal.
                        <p className="font-body-sm text-body-sm text-outline">
                          {dossier.status === 'CLOSED'
                            ? isRtl
                              ? 'الوكالة مغلقة؛ لا يمكن تغيير حالتها.'
                              : 'This dealership is closed; its status cannot be changed.'
                            : isRtl
                            ? `الوكالة قيد الانتظار. يتطلب التفعيل اعتماد التحقق (الحالة الحالية: ${dossier.verificationStatus}).`
                            : `This dealership is pending. Activation requires an APPROVED KYB verification (current: ${dossier.verificationStatus}).`}
                        </p>
                      )}
                    </div>
                  </section>
                </div>

                {/* Branches */}
                <section className="rounded-xl bg-surface-container-low p-space-lg border border-surface-container-high/40">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-space-md">
                    {isRtl ? 'الفروع' : 'Branches'}
                  </h2>
                  {dossier.branches?.length ? (
                    <ul className="divide-y divide-surface-container-high/30 font-body-sm text-body-sm">
                      {dossier.branches.map((b) => (
                        <li key={b.id} className="py-2 flex flex-wrap justify-between gap-2">
                          <span className="text-on-surface font-medium">{b.name}</span>
                          <span className="text-outline">
                            {[b.address, b.city, b.emirate].filter(Boolean).join(', ') || '—'}
                            {b.isActive === false ? ' · inactive' : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-body-sm text-body-sm text-outline">No branches on file.</p>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      <ConfirmReasonModal
        open={pendingStatus !== null}
        title={pendingStatus === 'SUSPENDED' ? 'Suspend this dealership?' : 'Reactivate this dealership?'}
        description={
          dossier
            ? pendingStatus === 'SUSPENDED'
              ? `${dossier.displayName} will be suspended. The API unpublishes its active listings.`
              : `${dossier.displayName} will be set to ACTIVE.`
            : ''
        }
        confirmLabel={pendingStatus === 'SUSPENDED' ? 'Suspend dealership' : 'Reactivate dealership'}
        tone={pendingStatus === 'SUSPENDED' ? 'danger' : 'neutral'}
        busy={statusBusy}
        error={statusError}
        onCancel={() => setPendingStatus(null)}
        onConfirm={confirmStatus}
      />
    </div>
  );
}
