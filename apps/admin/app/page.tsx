'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminHeader } from '../components/AdminHeader';
import { AdminTenantSummary, errorMessage, listAuditLogs, listTenants, listUsers } from '../lib/api';

type Metric<T> = { status: 'loading' } | { status: 'ok'; value: T } | { status: 'error'; message: string };

interface TenantCounts {
  total: number;
  active: number;
  suspended: number;
  kybInReview: number;
}

function summarizeTenants(tenants: AdminTenantSummary[]): TenantCounts {
  return {
    total: tenants.length,
    active: tenants.filter((t) => t.status === 'ACTIVE').length,
    suspended: tenants.filter((t) => t.status === 'SUSPENDED').length,
    kybInReview: tenants.filter((t) => t.verificationStatus === 'IN_REVIEW').length,
  };
}

function settle<T>(promise: Promise<T>, set: (m: Metric<T>) => void) {
  promise
    .then((value) => set({ status: 'ok', value }))
    .catch((err: unknown) => set({ status: 'error', message: errorMessage(err, 'Unavailable') }));
}

function MetricValue<T>({ metric, render }: { metric: Metric<T>; render: (v: T) => React.ReactNode }) {
  if (metric.status === 'loading') return <span className="text-outline">…</span>;
  if (metric.status === 'error') {
    return (
      <span className="text-body-sm text-error" title={metric.message}>
        Unavailable
      </span>
    );
  }
  return <>{render(metric.value)}</>;
}

export default function AdminOverviewPage() {
  const [isRtl, setIsRtl] = useState(false);
  const [tenants, setTenants] = useState<Metric<TenantCounts>>({ status: 'loading' });
  const [users, setUsers] = useState<Metric<number>>({ status: 'loading' });
  const [auditEvents, setAuditEvents] = useState<Metric<number>>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setTenants({ status: 'loading' });
    setUsers({ status: 'loading' });
    setAuditEvents({ status: 'loading' });
    settle(listTenants().then(summarizeTenants), setTenants);
    settle(listUsers({ page: 1, limit: 1 }).then((p) => p.total ?? 0), setUsers);
    settle(listAuditLogs({ limit: 1, offset: 0 }).then((p) => p.total ?? 0), setAuditEvents);
  }, [reloadKey]);

  const cardClass =
    'rounded-xl bg-surface-container p-space-lg flex flex-col justify-between relative overflow-hidden shadow-md border border-surface-container-high/40';

  return (
    <div className={`min-h-screen bg-background font-body-md text-on-surface ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminSidebar isRtl={isRtl} />
      <div className={isRtl ? 'pr-60' : 'pl-60'}>
        <AdminHeader isRtl={isRtl} onToggleRtl={() => setIsRtl(!isRtl)} />

        <main className="w-full pt-16 bg-background px-gutter py-space-lg">
          <div className="flex flex-col w-full gap-space-lg">
            {/* Top Operations Command Banner */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-lg shadow-xl border border-surface-container-high/40">
              <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-space-md relative z-10">
                <div className="flex flex-col gap-space-xs">
                  <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                    {isRtl ? 'مركز قيادة عمليات المنصة' : 'Platform Operations Command'}
                  </h1>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {isRtl
                      ? 'الأرقام أدناه محسوبة من واجهات المنصة الحالية فقط.'
                      : 'Figures below are computed only from existing platform APIs.'}
                  </p>
                </div>
                <div className="flex items-center gap-space-sm flex-wrap">
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="h-10 px-4 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">refresh</span>
                    <span>{isRtl ? 'تحديث' : 'Refresh'}</span>
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Not available yet: no regulatory reporting API"
                    className="h-10 px-4 rounded bg-surface-container-high text-on-surface font-body-sm flex items-center gap-2 opacity-50 cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">download</span>
                    <span>{isRtl ? 'تصدير التقرير (غير متاح بعد)' : 'Export report (not available yet)'}</span>
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Not available yet: no market circuit-breaker API"
                    className="h-10 px-4 rounded bg-error-container/80 text-error font-body-sm font-medium flex items-center gap-2 opacity-50 cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[18px]">emergency_home</span>
                    <span>{isRtl ? 'قاطع الدائرة (غير متاح بعد)' : 'Circuit breaker (not available yet)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Real counts */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
              <Link href="/dealers" className={`${cardClass} hover:border-primary/40 transition-colors`}>
                <div className="flex items-start justify-between">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                    {isRtl ? 'الوكالات' : 'Dealerships'}
                  </span>
                  <span className="material-symbols-outlined text-[22px] text-primary">apartment</span>
                </div>
                <div className="mt-4 font-headline-lg text-headline-lg text-on-surface font-data-mono-num">
                  <MetricValue metric={tenants} render={(v) => v.total} />
                </div>
                <div className="mt-1 font-body-sm text-body-sm text-outline">
                  <MetricValue metric={tenants} render={(v) => `${v.active} active · ${v.suspended} suspended`} />
                </div>
              </Link>

              <Link href="/verifications" className={`${cardClass} hover:border-primary/40 transition-colors`}>
                <div className="flex items-start justify-between">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                    {isRtl ? 'التحقق قيد المراجعة' : 'KYB in review'}
                  </span>
                  <span className="material-symbols-outlined text-[22px] text-primary">verified_user</span>
                </div>
                <div className="mt-4 font-headline-lg text-headline-lg text-on-surface font-data-mono-num">
                  <MetricValue metric={tenants} render={(v) => v.kybInReview} />
                </div>
                <div className="mt-1 font-body-sm text-body-sm text-outline">
                  {isRtl ? 'محسوب من قائمة الوكالات' : 'Derived from the dealership list'}
                </div>
              </Link>

              <Link href="/users" className={`${cardClass} hover:border-primary/40 transition-colors`}>
                <div className="flex items-start justify-between">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                    {isRtl ? 'المستخدمون' : 'Platform users'}
                  </span>
                  <span className="material-symbols-outlined text-[22px] text-primary">manage_accounts</span>
                </div>
                <div className="mt-4 font-headline-lg text-headline-lg text-on-surface font-data-mono-num">
                  <MetricValue metric={users} render={(v) => v.toLocaleString('en-US')} />
                </div>
                <div className="mt-1 font-body-sm text-body-sm text-outline">
                  {isRtl ? 'إجمالي الحسابات المسجلة' : 'Total registered accounts'}
                </div>
              </Link>

              <Link href="/audit-logs" className={`${cardClass} hover:border-primary/40 transition-colors`}>
                <div className="flex items-start justify-between">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                    {isRtl ? 'أحداث التدقيق' : 'Audit events'}
                  </span>
                  <span className="material-symbols-outlined text-[22px] text-primary">lock_clock</span>
                </div>
                <div className="mt-4 font-headline-lg text-headline-lg text-on-surface font-data-mono-num">
                  <MetricValue metric={auditEvents} render={(v) => v.toLocaleString('en-US')} />
                </div>
                <div className="mt-1 font-body-sm text-body-sm text-outline">
                  {isRtl ? 'إجمالي السجل' : 'Total ledger entries'}
                </div>
              </Link>
            </div>

            {/* Metrics that have no API yet */}
            <section
              role="status"
              className="rounded-xl bg-surface-container-low p-space-lg border border-surface-container-high/40 flex flex-col gap-space-sm"
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-outline text-[22px]">monitoring</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  {isRtl ? 'معاينة — واجهة المقاييس غير متاحة' : 'Preview — metrics API not available'}
                </h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-3xl">
                {isRtl
                  ? 'أموال الضمان وحجم التداول وحالة البوابات الحكومية وتنبيهات الامتثال تتطلب واجهات غير موجودة بعد، لذلك لا تُعرض أي أرقام لها.'
                  : 'Escrow custody, trade volume, government gateway health and compliance alerts need APIs that do not exist yet, so no figures are shown for them. Listing-moderation queue size is also unavailable (no queue API).'}
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
