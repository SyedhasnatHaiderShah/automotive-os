'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminHeader } from '../components/AdminHeader';

export default function AdminOverviewPage() {
  const [isRtl, setIsRtl] = useState(false);
  const [cockpitMode, setCockpitMode] = useState<'normal' | 'circuit' | 'auditor'>('normal');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [triageItems] = useState([
    {
      id: 'triage-1',
      title: 'Apex GT Motors FZCO',
      meta: 'DED Lic #948211 • DIFC Prescribed',
      tag: '14 Days Left',
      tagColor: 'text-primary bg-primary/10',
      dotColor: 'bg-primary',
      description: 'Commercial Trade License due for statutory renewal. Automated DED verification webhook alerted imminent expiry.',
      impact: 'Impact: Tier-1 Escrow Lock',
      impactColor: 'text-outline',
      actionText: 'Request DED Renewal',
      actionType: 'primary',
      status: 'pending'
    },
    {
      id: 'triage-2',
      title: 'Bugatti Chiron Pur Sport',
      meta: 'Chassis #042 • Listed by Al-Ghanim Royal',
      tag: 'Spec Conflict',
      tagColor: 'text-on-error-container bg-error-container',
      dotColor: 'bg-error',
      description: 'Non-GCC tropicalized cooling detected in Molsheim manufacturer database vs GCC claimed in dealer listing.',
      impact: 'RTA Title Check Failed',
      impactColor: 'text-error',
      actionText: 'Escalate to Moderation',
      actionType: 'flag',
      status: 'pending'
    },
    {
      id: 'triage-3',
      title: 'SilberArrows Luxury FZCO',
      meta: 'Bulk Batch #1094 • 6x Porsche GT Series',
      tag: 'Auto-Cleared',
      tagColor: 'text-tertiary bg-tertiary/10',
      dotColor: 'bg-tertiary',
      description: 'Bulk asset onboarding passed biometric notary & automated Tasjeel Shamil RTA chassis inspection webhook.',
      impact: 'Signed by Merkle #8912401',
      impactColor: 'text-tertiary',
      actionText: 'View Certificate',
      actionType: 'neutral',
      status: 'cleared'
    },
    {
      id: 'triage-4',
      title: 'Gulf Prestige Motors',
      meta: 'Ferrari SF90 Stradale • VIN: ...88219',
      tag: 'Price Dump Risk',
      tagColor: 'text-on-error-container bg-error-container',
      dotColor: 'bg-error animate-pulse',
      description: 'Suspicious rapid price markdown (-AED 450,000 in 10 mins). Escrow settlement automatically put on protective lock.',
      impact: 'Anti-Market Fraud Alert',
      impactColor: 'text-error',
      actionText: 'Freeze Escrow',
      actionType: 'danger',
      status: 'pending'
    }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };


  return (
    <div className={`min-h-screen bg-background font-body-md text-on-surface ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminSidebar isRtl={isRtl} />
      <div className={isRtl ? 'pr-60' : 'pl-60'}>
        <AdminHeader isRtl={isRtl} onToggleRtl={() => setIsRtl(!isRtl)} />

        <main className="w-full pt-16 bg-background px-gutter py-space-lg">
          <div role="status" className="mb-5 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-on-surface">SYNTHETIC STAGING DEMO — External government, banking, escrow and compliance integrations are disabled. Figures and cases are design examples, not live operational telemetry.</div>
          <div className="flex flex-col w-full gap-space-lg">
            {/* Top Operations Command Banner */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-lg shadow-xl border border-surface-container-high/40">
              <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
              
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-space-md relative z-10">
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-sm flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-caps text-label-caps uppercase tracking-wider font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      {isRtl ? 'عمليات المقاصة السيادية' : 'Sovereign Clearinghouse Operations'}
                    </span>
                    <span className="text-outline font-data-mono-num text-body-sm">•</span>
                    <span className="text-on-surface-variant font-data-mono-num text-body-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-tertiary">verified</span>
                      {isRtl ? 'بوابة مركز دبي المالي العالمي واقتصادية دبي (مستوى 0)' : 'DIFC & Dubai DED Gateway Tier-0'}
                    </span>
                  </div>

                  <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                    {isRtl ? 'مركز قيادة العمليات والمخاطر السيادية' : 'Platform Operations & Risk Command'}
                  </h1>

                  <div className="flex items-center gap-space-sm flex-wrap text-body-sm text-on-surface-variant pt-1">
                    <span className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded">
                      <span className="text-outline">{isRtl ? 'الوكلاء المعتمدون:' : 'Accredited Dealers:'}</span>
                      <span className="font-data-mono-num text-on-surface font-semibold">48</span>
                    </span>
                    <span className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded">
                      <span className="text-outline">{isRtl ? 'الضمان قيد التنفيذ:' : 'In-Flight Escrow:'}</span>
                      <span className="font-data-mono-num text-primary font-semibold">
                        {cockpitMode === 'auditor' ? 'AED [REDACTED]' : 'AED 142.8M'}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded">
                      <span className="text-outline">{isRtl ? 'استعلامات هيئة الطرق يومياً:' : 'Daily RTA Title Queries:'}</span>
                      <span className="font-data-mono-num text-on-surface font-semibold">1,842</span>
                    </span>
                    <span className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded text-tertiary">
                      <span className="w-2 h-2 rounded-full bg-tertiary" />
                      <span className="text-outline">{isRtl ? 'مؤشر المخاطر:' : 'Risk Score:'}</span>
                      <span className="font-data-mono-num font-semibold text-tertiary">98.4% (Nominal)</span>
                    </span>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center gap-space-sm flex-wrap">
                  <button
                    id="btn-export-difc"
                    disabled
                    title="Export requires a real regulatory reporting service; unavailable in staging"
                    className="h-10 px-4 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm flex items-center gap-2 transition-colors shadow-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">download</span>
                    <span>{isRtl ? 'تصدير تقرير مركز دبي المالي' : 'Export DIFC Regulatory Report'}</span>
                  </button>

                  <button
                    id="btn-force-sync"
                    disabled
                    title="External integrations disabled; no synchronization will be triggered"
                    className="h-10 px-4 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm flex items-center gap-2 transition-colors shadow-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">sync</span>
                    <span>{isRtl ? 'مزامنة البوابات السيادية' : 'Force Sync Sovereign Gateways'}</span>
                  </button>

                  <button
                    id="circuit-breaker-btn"
                    disabled
                    title="Emergency circuit breaker is not connected to a live enforcement service"
                    className={`h-10 px-4 rounded font-body-sm font-medium flex items-center gap-2 transition-all shadow-sm ${
                      cockpitMode === 'circuit'
                        ? 'bg-error text-on-error font-semibold animate-pulse shadow-lg'
                        : cockpitMode === 'auditor'
                        ? 'bg-surface-container-highest text-outline cursor-not-allowed'
                        : 'bg-error-container/80 hover:bg-error hover:text-on-error text-error'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {cockpitMode === 'circuit' ? 'lock' : cockpitMode === 'auditor' ? 'visibility' : 'emergency_home'}
                    </span>
                    <span>
                      {cockpitMode === 'circuit'
                        ? (isRtl ? 'السوق معطل (قاطع الدائرة مقفل)' : 'MARKET HALTED (CIRCUIT LOCKED)')
                        : cockpitMode === 'auditor'
                        ? (isRtl ? 'وضع المدقق (العمليات معطلة)' : 'Auditor Mode (Actions Disabled)')
                        : (isRtl ? 'قاطع الدائرة الطارئ للسوق' : 'Emergency Market Circuit Breaker')}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* TOP TIER HIGH-DENSITY METRIC GRID (BENTO 4-COL) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
              {/* CARD 1: ESCROW UNDER CUSTODY */}
              <div className="rounded-xl bg-surface-container p-space-lg flex flex-col justify-between relative overflow-hidden shadow-md group border border-surface-container-high/40">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                      {isRtl ? 'الأموال في الحفظ الأمين' : 'Capital in Safe-Custody'}
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      {isRtl ? 'إجمالي أموال الضمان' : 'Total Escrow Under Custody'}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-[22px]">account_balance</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="font-label-caps text-label-caps text-primary uppercase font-bold">AED</span>
                    <span className="font-data-currency-lg text-data-currency-lg text-on-surface font-semibold tracking-tight">
                      {cockpitMode === 'auditor' ? '••••••••' : '142,850,000'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-on-surface-variant font-data-mono-num text-body-sm">
                    <span className="text-tertiary font-semibold">64</span> {isRtl ? 'عقد بيع نشط' : 'active transacting deeds'}
                  </div>
                </div>
                <div className="mt-4 pt-3 flex items-center justify-between text-body-sm bg-surface-container-lowest/60 -mx-space-lg -mb-space-lg px-space-lg py-2.5">
                  <span className="flex items-center gap-1.5 text-tertiary">
                    <span className="material-symbols-outlined text-[15px]">verified_user</span>
                    <span className="font-label-caps text-label-caps uppercase tracking-wider font-semibold">CBUAE Shielded</span>
                  </span>
                  <span className="font-data-mono-num text-body-sm text-on-surface-variant">100% Capital Adequacy</span>
                </div>
              </div>

              {/* CARD 2: KYB QUEUE */}
              <Link
                href="/verifications"
                className="rounded-xl bg-surface-container hover:bg-surface-container-high/80 transition-all p-space-lg flex flex-col justify-between relative overflow-hidden shadow-md group border border-surface-container-high/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                      {isRtl ? 'العناية الواجبة التجارية' : 'Commercial Due Diligence'}
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      {isRtl ? 'طابور اعتماد الوكلاء' : 'KYB Verification Queue'}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[22px]">badge</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="font-data-currency-lg text-data-currency-lg text-secondary font-semibold">6</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      {isRtl ? 'وكلاء قيد الاعتماد' : 'Dealerships Pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-body-sm">
                    <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-caps text-label-caps font-semibold">
                      2 Urgent Re-certs
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps">
                      4 Inbound
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 flex items-center justify-between text-body-sm bg-surface-container-lowest/60 -mx-space-lg -mb-space-lg px-space-lg py-2.5">
                  <span className="text-outline font-label-caps text-label-caps uppercase">{isRtl ? 'سرعة الإنجاز' : 'SLA Velocity'}</span>
                  <span className="font-data-mono-num text-body-sm text-tertiary">4.2h <span className="text-outline">/ 24h statutory</span></span>
                </div>
              </Link>

              {/* CARD 3: LISTING MODERATION */}
              <Link
                href="/moderation"
                className="rounded-xl bg-surface-container hover:bg-surface-container-high/80 transition-all p-space-lg flex flex-col justify-between relative overflow-hidden shadow-md group border border-surface-container-high/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                      {isRtl ? 'تدقيق سلامة الأصول' : 'Asset Integrity Scrutiny'}
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      {isRtl ? 'طابور مراجعة الإعلانات' : 'Listing Moderation Backlog'}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[22px]">fact_check</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="font-data-currency-lg text-data-currency-lg text-on-surface font-semibold">14</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                      {isRtl ? 'مركبة قيد التدقيق' : 'Vehicles in Review'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 font-data-mono-num text-body-sm text-on-surface-variant">
                    <span>8 Initial</span>
                    <span className="text-outline">•</span>
                    <span className="text-primary font-medium">4 Spec Alert</span>
                    <span className="text-outline">•</span>
                    <span className="text-error font-medium">2 VIN Collision</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 flex items-center justify-between text-body-sm bg-surface-container-lowest/60 -mx-space-lg -mb-space-lg px-space-lg py-2.5">
                  <span className="text-outline font-label-caps text-label-caps uppercase">{isRtl ? 'التيليمتري الآلي' : 'Automated Telemetry'}</span>
                  <span className="font-data-mono-num text-body-sm text-on-surface">Tasjeel Shamil sync ON</span>
                </div>
              </Link>

              {/* CARD 4: ACTIVE ENFORCEMENT ACTIONS */}
              <div className="rounded-xl bg-surface-container p-space-lg flex flex-col justify-between relative overflow-hidden shadow-md group border border-surface-container-high/40">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-label-caps text-label-caps text-error uppercase tracking-wider font-semibold">
                      {isRtl ? 'الامتثال السيادي' : 'Sovereign Compliance'}
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      {isRtl ? 'إجراءات الإنفاذ النشطة' : 'Enforcement Actions'}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center text-error flex-shrink-0">
                    <span className="material-symbols-outlined text-[22px]">gavel</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="font-data-currency-lg text-data-currency-lg text-error font-semibold">2</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      {isRtl ? 'تجميدات مشروطة' : 'Conditional Freezes'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 mt-1 text-body-sm">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-error" />
                      1 Escrow Disbursement Hold
                    </span>
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      1 Showroom Audit Required
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 flex items-center justify-between text-body-sm bg-surface-container-lowest/60 -mx-space-lg -mb-space-lg px-space-lg py-2.5">
                  <span className="text-outline font-label-caps text-label-caps uppercase">{isRtl ? 'حالة الجزاء' : 'Sanction State'}</span>
                  <span className="font-data-mono-num text-body-sm text-error font-medium">Tier-2 Operational Seal</span>
                </div>
              </div>
            </div>

            {/* SECONDARY HIGH-SIGNAL TELEMETRY SPLIT VIEW (2-COLUMN GRID) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
              {/* LEFT COLUMN: GATEWAY & THROUGHPUT TELEMETRY (7 COLS) */}
              <div className="lg:col-span-7 flex flex-col gap-space-md">
                {/* Real-time gateway nodes */}
                <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md border border-surface-container-high/40">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider font-semibold">
                        {isRtl ? 'نسيج البيانات السيادي' : 'Sovereign Data Fabric'}
                      </span>
                      <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                        {isRtl ? 'تغذية البوابات السيادية في الوقت الحقيقي' : 'Real-Time Sovereign Gateway Feeds'}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-tertiary animate-ping" />
                      <span className="font-data-mono-num text-body-sm text-tertiary font-semibold">Real-time (WSS)</span>
                    </div>
                  </div>

                  {/* Node Feed Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                    {/* Dubai RTA */}
                    <div className="rounded-lg bg-surface-container-high p-space-md flex flex-col justify-between gap-space-sm border border-surface-container-highest/60">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[20px]">directions_car</span>
                          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Dubai RTA Node</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-label-caps text-label-caps font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> LIVE
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-body-sm">
                        <span className="text-outline">Latency:</span>
                        <span className="font-data-mono-num text-on-surface font-semibold">12ms (Direct Fibre)</span>
                      </div>
                      <div className="flex items-baseline justify-between text-body-sm">
                        <span className="text-outline">Throughput:</span>
                        <span className="font-data-mono-num text-tertiary">1,420 checks/hr • 0 err</span>
                      </div>
                      <div className="w-full bg-surface-container-lowest h-1.5 rounded overflow-hidden">
                        <div className="bg-tertiary h-full rounded transition-all duration-500" style={{ width: '98%' }} />
                      </div>
                    </div>

                    {/* TAMM Abu Dhabi */}
                    <div className="rounded-lg bg-surface-container-high p-space-md flex flex-col justify-between gap-space-sm border border-surface-container-highest/60">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-[20px]">assured_workload</span>
                          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">TAMM Abu Dhabi</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-label-caps text-label-caps font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> CONNECTED
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-body-sm">
                        <span className="text-outline">Latency:</span>
                        <span className="font-data-mono-num text-on-surface font-semibold">16ms (Hub-ADX)</span>
                      </div>
                      <div className="flex items-baseline justify-between text-body-sm">
                        <span className="text-outline">Throughput:</span>
                        <span className="font-data-mono-num text-secondary">422 checks/hr</span>
                      </div>
                      <div className="w-full bg-surface-container-lowest h-1.5 rounded overflow-hidden">
                        <div className="bg-secondary h-full rounded transition-all duration-500" style={{ width: '94%' }} />
                      </div>
                    </div>

                    {/* UAE PASS Gold */}
                    <div className="rounded-lg bg-surface-container-high p-space-md flex flex-col justify-between gap-space-sm border border-surface-container-highest/60">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[20px]">fingerprint</span>
                          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">UAE PASS Gold</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-label-caps text-label-caps font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> AUTHENTICATED
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-body-sm">
                        <span className="text-outline">Biometric Pass:</span>
                        <span className="font-data-mono-num text-on-surface font-semibold">Level 4 Certified</span>
                      </div>
                      <div className="flex items-baseline justify-between text-body-sm">
                        <span className="text-outline">SLA Uptime:</span>
                        <span className="font-data-mono-num text-tertiary">99.98% 30-Day Avg</span>
                      </div>
                      <div className="w-full bg-surface-container-lowest h-1.5 rounded overflow-hidden">
                        <div className="bg-primary h-full rounded transition-all duration-500" style={{ width: '99.9%' }} />
                      </div>
                    </div>

                    {/* CBUAE Escrow Node */}
                    <div className="rounded-lg bg-surface-container-high p-space-md flex flex-col justify-between gap-space-sm border border-surface-container-highest/60">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-tertiary text-[20px]">lock</span>
                          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">CBUAE Clearing Node</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-label-caps text-label-caps font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> ACTIVE
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-body-sm">
                        <span className="text-outline">Settlement Rate:</span>
                        <span className="font-data-mono-num text-on-surface font-semibold">Zero Failures</span>
                      </div>
                      <div className="flex items-baseline justify-between text-body-sm">
                        <span className="text-outline">Batch Reconciliation:</span>
                        <span className="font-data-mono-num text-on-surface-variant">T+0 Real-Time Gross</span>
                      </div>
                      <div className="w-full bg-surface-container-lowest h-1.5 rounded overflow-hidden">
                        <div className="bg-tertiary h-full rounded transition-all duration-500" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* VISUAL TIMELINE CHART & REGIONAL BREAKDOWN */}
                <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md border border-surface-container-high/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                        {isRtl ? 'تيليمتري تسوية عقود البيع' : 'Deed Settlement Telemetry'}
                      </span>
                      <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                        {isRtl ? 'حجم التداول بالساعة على المنصة (مليون درهم)' : 'Hourly Platform Trade Volume (AED M)'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-space-sm font-label-caps text-label-caps">
                      <span className="flex items-center gap-1 text-primary"><span className="w-2 h-2 rounded-full bg-primary" /> Dubai 68%</span>
                      <span className="flex items-center gap-1 text-secondary"><span className="w-2 h-2 rounded-full bg-secondary" /> Abu Dhabi 24%</span>
                      <span className="flex items-center gap-1 text-tertiary"><span className="w-2 h-2 rounded-full bg-tertiary" /> Sharjah 8%</span>
                    </div>
                  </div>

                  {/* Inline SVG Volume Telemetry Graph */}
                  <div className="w-full h-44 relative bg-surface-container-lowest rounded-lg p-2 flex flex-col justify-end overflow-hidden border border-surface-container-highest/40">
                    <svg className="w-full h-36" fill="none" preserveAspectRatio="none" viewBox="0 0 680 140">
                      <line className="text-surface-container-highest" stroke="currentColor" strokeDasharray="3 3" strokeWidth="0.5" x1="0" x2="680" y1="35" y2="35" />
                      <line className="text-surface-container-highest" stroke="currentColor" strokeDasharray="3 3" strokeWidth="0.5" x1="0" x2="680" y1="70" y2="70" />
                      <line className="text-surface-container-highest" stroke="currentColor" strokeDasharray="3 3" strokeWidth="0.5" x1="0" x2="680" y1="105" y2="105" />
                      <defs>
                        <linearGradient id="dubaiGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#f2ca50" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#f2ca50" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="adGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#7bd0ff" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#7bd0ff" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,120 Q60,95 110,80 T220,50 T330,65 T440,25 T550,40 T680,15 L680,140 L0,140 Z" fill="url(#dubaiGrad)" />
                      <path d="M0,120 Q60,95 110,80 T220,50 T330,65 T440,25 T550,40 T680,15" fill="none" stroke="#f2ca50" strokeWidth="2" />
                      <path d="M0,130 Q70,120 140,110 T280,85 T420,70 T560,55 T680,45 L680,140 L0,140 Z" fill="url(#adGrad)" />
                      <path d="M0,130 Q70,120 140,110 T280,85 T420,70 T560,55 T680,45" fill="none" stroke="#7bd0ff" strokeWidth="1.5" />
                      <circle className="fill-primary stroke-background" cx="440" cy="25" r="4" strokeWidth="2" />
                      <circle className="fill-primary stroke-background" cx="680" cy="15" r="4" strokeWidth="2" />
                    </svg>

                    <div className="flex items-center justify-between px-2 pt-1 font-data-mono-num text-[11px] text-outline">
                      <span>08:00 GST</span>
                      <span>10:00</span>
                      <span>12:00 (Peak DED)</span>
                      <span>14:00</span>
                      <span>16:00 (RTA Clearing)</span>
                      <span>Now (17:42)</span>
                    </div>
                  </div>

                  {/* Regional Ratio Metrics Bar */}
                  <div className="grid grid-cols-3 gap-space-sm pt-1">
                    <div className="bg-surface-container-high rounded p-2.5 flex flex-col border border-surface-container-highest/40">
                      <span className="font-label-caps text-label-caps text-outline uppercase font-semibold">Dubai Volume</span>
                      <span className="font-data-mono-num text-body-lg text-primary font-semibold">AED 97.14M</span>
                      <span className="font-body-sm text-outline">44 Deeds Settled</span>
                    </div>
                    <div className="bg-surface-container-high rounded p-2.5 flex flex-col border border-surface-container-highest/40">
                      <span className="font-label-caps text-label-caps text-outline uppercase font-semibold">Abu Dhabi</span>
                      <span className="font-data-mono-num text-body-lg text-secondary font-semibold">AED 34.28M</span>
                      <span className="font-body-sm text-outline">15 Deeds Settled</span>
                    </div>
                    <div className="bg-surface-container-high rounded p-2.5 flex flex-col border border-surface-container-highest/40">
                      <span className="font-label-caps text-label-caps text-outline uppercase font-semibold">Sharjah & North</span>
                      <span className="font-data-mono-num text-body-lg text-tertiary font-semibold">AED 11.43M</span>
                      <span className="font-body-sm text-outline">5 Deeds Settled</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: URGENT COMPLIANCE & T&S ALERT MATRIX (5 COLS) */}
              <div className="lg:col-span-5 flex flex-col gap-space-md">
                <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md border border-surface-container-high/40">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-error uppercase tracking-wider font-semibold">
                        {isRtl ? 'تصعيدات ذات أولوية' : 'Priority Escalations'}
                      </span>
                      <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                        {isRtl ? 'مصفوفة فرز المشغلين العاجلة' : 'Urgent Operator Triage Matrix'}
                      </h2>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-data-mono-num text-body-sm font-semibold">
                      4 Action Required
                    </span>
                  </div>

                  <div className="flex flex-col gap-space-sm" id="triage-container">
                    {triageItems.map((item) => (
                      <div
                        key={item.id}
                        id={item.id}
                        className={`p-space-md rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors flex flex-col gap-space-sm shadow-sm border border-surface-container-highest/50 ${
                          item.status === 'resolved' ? 'opacity-60 bg-surface-container/50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${item.dotColor}`} />
                              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                                {item.title}
                              </span>
                            </div>
                            <span className="font-data-mono-num text-body-sm text-outline">
                              {item.meta}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded font-label-caps text-label-caps font-semibold uppercase ${item.tagColor}`}>
                            {item.tag}
                          </span>
                        </div>

                        <p className="font-body-sm text-on-surface-variant">
                          {item.description}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <span className={`font-label-caps text-label-caps ${item.impactColor} font-semibold`}>
                            {item.impact}
                          </span>
                          {item.status === 'resolved' ? (
                            <span className="text-tertiary font-data-mono-num text-body-sm flex items-center gap-1 font-semibold">
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              Resolved
                            </span>
                          ) : (
                            <button
                              disabled
                              title="Read-only synthetic case. No real regulatory action is available."
                              className={`px-3 py-1.5 rounded font-body-sm font-medium transition-colors flex items-center gap-1 ${
                                item.actionType === 'primary'
                                  ? 'bg-primary text-on-primary hover:bg-primary-fixed'
                                  : item.actionType === 'danger'
                                  ? 'bg-error text-on-error font-semibold hover:bg-error-container'
                                  : item.actionType === 'flag'
                                  ? 'bg-surface-bright text-on-surface hover:bg-surface-container-lowest'
                                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                              } ${cockpitMode === 'auditor' ? 'opacity-40 cursor-not-allowed' : ''}`}
                              type="button"
                            >
                              {item.actionType === 'primary' && <span className="material-symbols-outlined text-[15px]">send</span>}
                              {item.actionType === 'flag' && <span className="material-symbols-outlined text-[15px] text-error">flag</span>}
                              <span>{item.actionText}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PLATFORM HEALTH & NODE INFRASTRUCTURE STATUS BAR */}
            <div className="rounded-xl bg-surface-container-lowest p-space-md flex flex-col md:flex-row items-center justify-between gap-space-md shadow-lg border border-surface-container-high/40">
              <div className="flex items-center gap-space-md flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary" />
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    {isRtl ? 'بنية العقد التحتية' : 'Node Infrastructure'}
                  </span>
                </div>
                <div className="flex items-center gap-space-sm text-body-sm text-on-surface-variant flex-wrap">
                  <span className="flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded border border-surface-container-highest/50">
                    <span className="font-label-caps text-label-caps text-outline">DIFC Core:</span>
                    <span className="text-tertiary font-data-mono-num font-semibold">99.99% Nominal</span>
                  </span>
                  <span className="flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded border border-surface-container-highest/50">
                    <span className="font-label-caps text-label-caps text-outline">DXB-South Gateway:</span>
                    <span className="text-tertiary font-data-mono-num font-semibold">8ms Ultra-Low</span>
                  </span>
                  <span className="flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded border border-surface-container-highest/50">
                    <span className="font-label-caps text-label-caps text-outline">Vault HSM:</span>
                    <span className="text-primary font-data-mono-num font-semibold">FIPS 140-3 Active</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm font-data-mono-num text-body-sm text-outline">
                <span className="material-symbols-outlined text-[16px] text-tertiary">shield</span>
                <span>Merkle Root Pub: <span className="text-on-surface font-semibold">Block #8,912,404</span> (32s ago)</span>
              </div>
            </div>

            {/* SIMULATION / STATE TOGGLE DEMO BAR */}
            <div className="rounded-lg bg-surface-container p-space-sm flex flex-col sm:flex-row items-center justify-between gap-space-sm shadow-md border border-surface-container-high/50">
              <div className="flex items-center gap-2 px-space-sm">
                <span className="material-symbols-outlined text-outline text-[18px]">tune</span>
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                  {isRtl ? 'محاكي وضع القيادة:' : 'Cockpit Mode Simulator:'}
                </span>
              </div>
              <div className="flex items-center gap-1 w-full sm:w-auto">
                <button
                  id="btn-state-normal"
                  onClick={() => {
                    setCockpitMode('normal');
                    showToast(isRtl ? 'تم تفعيل الوضع التشغيلي المأهول' : 'Switched to Populated Operational State');
                  }}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded font-body-sm font-medium transition-colors ${
                    cockpitMode === 'normal'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  {isRtl ? 'الوضع التشغيلي المأهول' : 'Populated Operational State'}
                </button>
                <button
                  id="btn-state-circuit"
                  onClick={() => {
                    setCockpitMode('circuit');
                    showToast(isRtl ? 'تم تفعيل وضع قاطع الدائرة' : 'Circuit Breaker Triggered (Read-Only)');
                  }}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded font-body-sm font-medium transition-colors ${
                    cockpitMode === 'circuit'
                      ? 'bg-error text-on-error font-semibold'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  {isRtl ? 'قاطع الدائرة (للقراءة فقط)' : 'Circuit Breaker Triggered (Read-Only)'}
                </button>
                <button
                  id="btn-state-auditor"
                  onClick={() => {
                    setCockpitMode('auditor');
                    showToast(isRtl ? 'تم تفعيل وضع تصريح المدقق' : 'Auditor Clearance View (Financials Masked)');
                  }}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded font-body-sm font-medium transition-colors ${
                    cockpitMode === 'auditor'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  {isRtl ? 'وضع تصريح المدقق' : 'Auditor Clearance View'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-surface-container-highest border border-primary/40 text-on-surface shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-primary text-[18px]">info</span>
          <span className="font-body-sm text-body-sm">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
