'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import { useLocale } from '../../lib/locale';
import { AdminTenantSummary, errorMessage, listTenants } from '../../lib/api';
import { kybBadgeClass } from '../../lib/kyb';

/**
 * Dealer KYB registry.
 *
 * There is no dedicated verification-queue API and no KYB decision endpoint.
 * This page lists real dealerships from GET /admin/tenants with their stored
 * verification status, so an operator can open each dossier. No case numbers,
 * risk scores or SLA timers are shown because the API does not provide them.
 */
const STATUS_ORDER: Record<string, number> = {
  IN_REVIEW: 0,
  NOT_SUBMITTED: 1,
  EXPIRED: 2,
  REJECTED: 3,
  APPROVED: 4,
};

export default function KybApplicationsListPage() {
  const { isRtl, toggleLocale } = useLocale();
  const [tenants, setTenants] = useState<AdminTenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    listTenants()
      .then((data) => { if (active) setTenants(Array.isArray(data) ? data : []); })
      .catch((err: unknown) => {
        if (!active) return;
        setTenants([]);
        setLoadError(errorMessage(err, 'Dealerships could not be loaded.'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const rows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return tenants
      .filter((t) => statusFilter === 'ALL' || t.verificationStatus === statusFilter)
      .filter((t) =>
        !q ||
        t.displayName.toLowerCase().includes(q) ||
        t.legalName.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q),
      )
      .sort((a, b) => (STATUS_ORDER[a.verificationStatus] ?? 9) - (STATUS_ORDER[b.verificationStatus] ?? 9));
  }, [tenants, searchTerm, statusFilter]);

  const statusOptions = useMemo(
    () => Array.from(new Set(tenants.map((t) => t.verificationStatus))).sort(),
    [tenants],
  );

  return (
    <div className={`min-h-screen bg-background font-body-md text-on-surface ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminSidebar isRtl={isRtl} />
      <div className={isRtl ? 'pr-60' : 'pl-60'}>
        <AdminHeader isRtl={isRtl} onToggleRtl={toggleLocale} />

        <main className="w-full pt-16 bg-background px-gutter py-space-lg">
          <div className="flex flex-col gap-space-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                  {isRtl ? 'اعتماد الوكلاء المؤسسي (KYB)' : 'Dealer KYB Accreditation & Verification Registry'}
                </h1>
                <p className="font-body-sm text-body-sm text-outline mt-0.5">
                  {isRtl
                    ? 'حالة التحقق المخزنة لكل وكالة. لا توجد واجهة طابور مخصصة بعد.'
                    : 'Stored verification status per dealership. No dedicated verification queue API exists yet.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="self-start px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-body-sm flex items-center gap-2"
              >
                <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                <span>{isRtl ? 'تحديث' : 'Refresh'}</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-space-md rounded-xl bg-surface-container-low shadow-md flex flex-wrap items-center justify-between gap-space-md border border-surface-container-high/40">
              <div className="flex items-center gap-2">
                <label htmlFor="kyb-status" className="font-body-sm text-body-sm text-outline">
                  {isRtl ? 'حالة التحقق:' : 'Verification status:'}
                </label>
                <select
                  id="kyb-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-container text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">{isRtl ? 'الكل' : 'All'}</option>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="relative min-w-[280px]">
                <span className="material-symbols-outlined text-outline absolute left-3 top-2.5 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Filter by dealer name or slug..."
                  aria-label="Filter dealerships by name or slug"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-container text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl bg-surface-container-low shadow-xl overflow-hidden border border-surface-container-high/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm">
                  <thead>
                    <tr className="text-outline font-label-caps text-label-caps bg-surface-container-lowest/60 border-b border-surface-container-high/40">
                      <th className="py-3 px-4">DEALERSHIP</th>
                      <th className="py-3 px-4">SLUG</th>
                      <th className="py-3 px-4">VERIFICATION</th>
                      <th className="py-3 px-4">TENANT STATUS</th>
                      <th className="py-3 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/30">
                    {loadError ? (
                      <tr>
                        <td colSpan={5} className="py-8 px-4 text-center">
                          <div role="alert" className="inline-flex flex-col items-center gap-2 text-error">
                            <span>{loadError}</span>
                            <button
                              type="button"
                              onClick={() => setReloadKey((k) => k + 1)}
                              className="px-3 py-1 rounded bg-surface-container-high text-on-surface"
                            >
                              Retry
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : loading && tenants.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 px-4 text-center text-outline">Loading dealerships…</td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 px-4 text-center text-outline">No dealerships match.</td>
                      </tr>
                    ) : (
                      rows.map((t) => (
                        <tr key={t.id} className="hover:bg-surface-container/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <Link href={`/verifications/${t.id}`} className="font-medium text-on-surface hover:text-primary">
                              {t.displayName}
                            </Link>
                            <span className="block text-outline text-[11px]">{t.legalName}</span>
                          </td>
                          <td className="py-3.5 px-4 font-data-mono-num text-primary">/{t.slug}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-caps text-label-caps ${kybBadgeClass(
                                t.verificationStatus,
                              )}`}
                            >
                              {t.verificationStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-data-mono-num text-on-surface-variant">{t.status}</td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/verifications/${t.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-body-sm font-medium transition-colors"
                            >
                              <span>Open dossier</span>
                              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
