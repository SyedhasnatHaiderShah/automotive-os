'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DealerSidebar } from '../../../components/dealer-sidebar';
import { DealerHeader } from '../../../components/dealer-header';
import { previewSafeMessage } from '../../../lib/preview';
import {
  fetchCustodyFreezeData,
  CustodyFreezePageData,
  VERIFIED_CUSTODY_FREEZE_FIXTURE,
} from '../../../lib/api';

export default function CustodyFreezeExceptionPage() {
  const [data, setData] = useState<CustodyFreezePageData>(VERIFIED_CUSTODY_FREEZE_FIXTURE);
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const isRtl = locale === 'ar';
  const [role, setRole] = useState<'PRINCIPAL' | 'SALES_REP'>('PRINCIPAL');
  const [vaultFilter, setVaultFilter] = useState<'ALL' | 'SHOWROOM' | 'OFFSITE' | 'SOLD'>('ALL');
  const [feedbackMessage, setFeedbackMessageState] = useState<string | null>(null);
  // Preview module: feedback never claims an external action happened.
  const setFeedbackMessage = (message: string | null) => setFeedbackMessageState(previewSafeMessage(message));

  // Exception State & Judicial Relief
  const [isRelieved, setIsRelieved] = useState(false);

  // Modals
  const [interpleaderModalOpen, setInterpleaderModalOpen] = useState(false);
  const [interpleaderBondAed, setInterpleaderBondAed] = useState(1650000);
  const [interpleaderFiled, setInterpleaderFiled] = useState(false);

  const [courtOrderModalOpen, setCourtOrderModalOpen] = useState(false);
  const [quarantineLogModalOpen, setQuarantineLogModalOpen] = useState(false);
  const [counselModalOpen, setCounselModalOpen] = useState(false);
  const [immunityModalOpen, setImmunityModalOpen] = useState(false);
  const [escrowCertModalOpen, setEscrowCertModalOpen] = useState(false);

  useEffect(() => {
    fetchCustodyFreezeData().then(setData);
  }, []);

  const d = data.freezeDossier;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-surface font-body-md text-on-surface antialiased selection:bg-primary/20 selection:text-primary ${
        isRtl ? 'rtl' : 'ltr'
      }`}
    >
      <DealerSidebar locale={locale} />

      <div className={isRtl ? 'pr-64 min-h-screen flex flex-col' : 'pl-64 min-h-screen flex flex-col'}>
        <DealerHeader
          locale={locale}
          onLocaleToggle={() => setLocale(locale === 'en' ? 'ar' : 'en')}
        />

        <main className="w-full pt-16 bg-surface px-space-lg pb-space-xl flex-1 space-y-6">
          {/* BREADCRUMB & CONTEXT */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/30 pb-4 pt-4">
            <div className="flex items-center gap-2 text-[12px] font-label-caps text-on-surface-variant">
              <Link href="/dashboard" className="hover:text-primary transition-colors">
                {isRtl ? 'لوحة التحكم' : 'Dashboard'}
              </Link>
              <span>/</span>
              <Link href="/fleet" className="hover:text-primary transition-colors">
                {isRtl ? 'الأساطيل والبيع بالأمانة' : 'Fleet & Consignment'}
              </Link>
              <span>/</span>
              <span className="text-primary font-semibold">
                {isRtl ? 'الحظر القضائي والتحفظ القانوني (S26)' : 'Custody Dispute & Judicial Freeze (S26)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRole(role === 'PRINCIPAL' ? 'SALES_REP' : 'PRINCIPAL')}
                title="Click to toggle between Dealer Principal and Sales Executive RBAC mode"
                className={`px-3 py-1 rounded-full text-[11px] font-label-caps font-bold uppercase transition-colors border ${
                  role === 'PRINCIPAL'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-surface-container-highest border-outline-variant text-on-surface-variant'
                }`}
              >
                {role === 'PRINCIPAL'
                  ? isRtl
                    ? 'الدور: المدير العام (صلاحية كاملة)'
                    : 'Role: Dealer Principal (Legal Override)'
                  : isRtl
                    ? 'الدور: تنفيذي مبيعات (مقيد الصلاحيات)'
                    : 'Role: Sales Executive (Restricted)'}
              </button>
              <button
                type="button"
                onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
                aria-label="Toggle language"
                className="px-2.5 py-1 rounded-md text-[11px] font-label-caps font-medium bg-surface-container border border-outline-variant hover:border-primary text-on-surface"
              >
                {isRtl ? 'English' : 'عربي (RTL)'}
              </button>
            </div>
          </div>

          {/* FEEDBACK BANNER */}
          {feedbackMessage && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-primary text-[13px] flex items-center justify-between animate-fadeIn">
              <span>{feedbackMessage}</span>
              <button
                type="button"
                onClick={() => setFeedbackMessage(null)}
                className="text-on-surface-variant hover:text-on-surface text-[14px]"
              >
                ✕
              </button>
            </div>
          )}

          {/* REGULATORY COMPLIANCE CALLOUT STRIP */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface-container border border-outline-variant/30 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-label-caps font-bold tracking-wider px-2 py-0.5 rounded bg-surface text-on-surface uppercase">
                [FUTURE ROADMAP • P1 SPECIFICATION — LEGAL & CUSTODY FREEZE DRILL-DOWN]
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-on-surface-variant text-[11px] font-label-caps">
              <span className="flex items-center gap-1.5 text-tertiary">
                <span className="material-symbols-outlined text-[16px]">gavel</span>
                <span>{isRtl ? 'متوافق مع قانون المعاملات التجارية (50/2022)' : 'UAE Fed. Law No. 50 (2022) Bailment Compliant'}</span>
              </span>
              <span className="flex items-center gap-1.5 text-secondary">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>{isRtl ? 'تأمين الحراسة الشامل من أليانز 100 مليون درهم' : 'AED 100M Allianz Custody Floater'}</span>
              </span>
            </div>
          </div>

          {/* JUDICIAL INJUNCTION & CUSTODY DISPUTE FREEZE BANNER */}
          <div
            className={`p-space-md sm:p-space-lg rounded-xl border transition-colors ${
              isRelieved
                ? 'bg-tertiary/10 border-tertiary/30 text-tertiary'
                : 'bg-error-container/30 border-error/50 text-on-error-container'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span
                  className={`material-symbols-outlined text-[32px] mt-0.5 ${
                    isRelieved ? 'text-tertiary' : 'text-error animate-pulse'
                  }`}
                >
                  {isRelieved ? 'verified_user' : 'gavel'}
                </span>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[11px] font-label-caps font-bold px-2 py-0.5 rounded uppercase ${
                        isRelieved ? 'bg-tertiary/20 text-tertiary' : 'bg-error/20 text-error'
                      }`}
                    >
                      {isRelieved
                        ? isRtl
                          ? 'تم إيداع كفالة المحكمة • تم فك التحفظ المؤقت'
                          : 'INTERPLEADER ESCROW BOUND • CUSTODY QUARANTINE CLEARED'
                        : isRtl
                          ? 'أمر حجز قضائي تحفظي • محاكم دبي'
                          : 'CUSTODY DISPUTE FREEZE • DUBAI COURTS EXECUTION ORDER'}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-on-surface">
                      #{d.courtOrderNumber}
                    </span>
                  </div>
                  <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {isRelieved
                      ? isRtl
                        ? 'تم فك حظر الحراسة القضائية عبر إيداع كفالة النزاع لدى خزينة المحكمة'
                        : 'Judicial Custody Quarantine Lifted via Interpleader Escrow Deposit'
                      : isRtl
                        ? 'أمر حجز قضائي: حظر التصرف أو النقل أو الإفراج عن المركبة بالأمانة'
                        : `Dubai Courts Execution Order #${d.courtOrderNumber}`}
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-4xl">
                    {isRelieved
                      ? isRtl
                        ? 'تم إيداع مبلغ النزاع البالغ 1,650,000 درهم في حساب أمانات محكمة دبي التجارية. تم تحويل مسؤولية الحراسة وإلغاء التعليق في نظام المرور RTA.'
                        : 'Disputed consideration (AED 1,650,000) deposited into Dubai Commercial Court 4 escrow. Dealership discharged from bailment liability; RTA transfer restrictions cleared.'
                      : isRtl
                        ? `موقع المركبة: الحظيرة ${d.vehicle.vaultLocation} تحت الإغلاق التام. تعليق تجارب القيادة والعرض بموجب أحكام الوديعة في قانون المعاملات التجارية رقم 50 لسنة 2022.`
                        : `Vehicle Bay Location ${d.vehicle.vaultLocation} locked down. Showroom test drives and release strictly suspended under UAE Federal Decree-Law No. 50 of 2022.`}
                  </p>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuarantineLogModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant hover:border-error text-error text-[11px] font-label-caps font-bold uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    <span>{isRtl ? 'بروتوكول العزل والحراسة' : 'Enforce Quarantine Protocol'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCourtOrderModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-highest border border-outline-variant text-on-surface text-[11px] font-label-caps font-semibold uppercase flex items-center gap-1 hover:border-primary cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    <span>{isRtl ? 'عرض الأمر القضائي' : 'View Court Injunction'}</span>
                  </button>
                </div>

                {isRelieved && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRelieved(false);
                      setFeedbackMessage(
                        isRtl ? 'تمت إعادة ضبط حالة الحظر القضائي والتحفظ.' : 'Case reset to judicial freeze state.'
                      );
                    }}
                    className="text-[11px] text-error hover:underline cursor-pointer"
                  >
                    {isRtl ? 'إعادة فرض الحظر القضائي' : 'Revert to Freeze State'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* TOP HEADER & ACTION BUTTONS */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-label-caps uppercase tracking-wider text-primary font-semibold">
                  {isRtl
                    ? 'إدارة عقود الأمانة الفاخرة • الحراسة القضائية والنزاعات'
                    : 'VIP Consignment Custody & Fleet Operations • Judicial Disputes Desk'}
                </span>
              </div>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-3">
                <span>{isRtl ? 'إدارة أساطيل الشركات وعقود البيع بالأمانة' : 'Corporate Fleet Accounts & VIP Consignment Portfolio'}</span>
                <span className="text-body-sm font-normal text-on-surface-variant font-data-mono-num">
                  (S26 Custody Freeze)
                </span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFeedbackMessage(
                    isRtl
                      ? 'جاري فتح معالج إدخال عقد أمانة جديد...'
                      : 'Opening VIP Consignment Mandate Onboarding Wizard...'
                  );
                }}
                className="px-3.5 py-2 rounded-lg bg-surface-container border border-outline-variant hover:border-primary text-on-surface font-body-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">add_circle</span>
                <span>{isRtl ? 'إدخال عقد أمانة جديد' : 'Onboard Consignment'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedbackMessage(
                    isRtl
                      ? 'جاري فتح نافذة إنشاء حساب أسطول شركات جديد...'
                      : 'Opening Corporate Fleet Account Creation Wizard...'
                  );
                }}
                className="px-3.5 py-2 rounded-lg bg-surface-container border border-outline-variant hover:border-primary text-on-surface font-body-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">domain_add</span>
                <span>{isRtl ? 'إنشاء حساب أسطول شركات' : 'Create Corporate Fleet'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedbackMessage(
                    isRtl
                      ? 'تم إرسال طلب التجديد الجماعي للملكية إلى هيئة الطرق والمواصلات RTA.'
                      : 'Bulk Mulkiya Renewal batch dispatched to RTA electronic licensing gateway.'
                  );
                }}
                className="px-3.5 py-2 rounded-lg bg-surface-container border border-outline-variant hover:border-primary text-on-surface font-body-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">autorenew</span>
                <span>{isRtl ? 'تجديد الملكية الجماعي' : 'Bulk Mulkiya Renewal'}</span>
              </button>
            </div>
          </div>

          {/* 4 SUMMARY STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {/* 1. Consignment Portfolio Value */}
            <div className="rounded-xl bg-surface-container-low p-space-md border border-outline-variant/30 shadow-sm">
              <div className="flex items-center justify-between text-on-surface-variant mb-2 font-label-caps text-[11px] uppercase tracking-wider">
                <span>{isRtl ? 'إجمالي قيمة محفظة الأمانة' : 'Consignment Portfolio Value'}</span>
                <span className="material-symbols-outlined text-[18px] text-primary">diamond</span>
              </div>
              <div className="font-headline-sm text-headline-sm font-bold text-on-surface font-data-mono-num">
                AED {data.kpis.portfolioValueAed.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-2 text-[12px] text-on-surface-variant">
                <span>{data.kpis.consignedUnitsCount} {isRtl ? 'سيارة سوبركار بالأمانة' : 'Consigned Exotics & Hypercars'}</span>
                <span className="text-tertiary font-data-mono-num font-semibold">
                  {data.kpis.insuranceCoveragePct}% {isRtl ? 'مؤمنة بالكامل' : 'Insured'}
                </span>
              </div>
            </div>

            {/* 2. Fleet Units Under Management */}
            <div className="rounded-xl bg-surface-container-low p-space-md border border-outline-variant/30 shadow-sm">
              <div className="flex items-center justify-between text-on-surface-variant mb-2 font-label-caps text-[11px] uppercase tracking-wider">
                <span>{isRtl ? 'أساطيل الشركات المدارة' : 'Fleet Units Under Management'}</span>
                <span className="material-symbols-outlined text-[18px] text-secondary">directions_car</span>
              </div>
              <div className="font-headline-sm text-headline-sm font-bold text-on-surface font-data-mono-num">
                {data.kpis.fleetUnitsUnderManagement} {isRtl ? 'مركبة' : 'Vehicles'}
              </div>
              <div className="flex items-center justify-between mt-2 text-[12px] text-on-surface-variant">
                <span>{isRtl ? `عبر ${data.kpis.vipKeyAccountsCount} حسابات رئيسية` : `Across ${data.kpis.vipKeyAccountsCount} VIP Key Accounts`}</span>
                <span className="text-tertiary font-data-mono-num font-semibold">
                  {data.kpis.fleetUptimePct}% Uptime
                </span>
              </div>
            </div>

            {/* 3. Consignment Yield MTD */}
            <div className="rounded-xl bg-surface-container-low p-space-md border border-outline-variant/30 shadow-sm">
              <div className="flex items-center justify-between text-on-surface-variant mb-2 font-label-caps text-[11px] uppercase tracking-wider">
                <span>{isRtl ? 'عائد الأمانة المتوقع للشهر' : 'Consignment Yield (MTD Projected)'}</span>
                <span className="material-symbols-outlined text-[18px] text-primary">trending_up</span>
              </div>
              <div className="font-headline-sm text-headline-sm font-bold text-on-surface font-data-mono-num">
                {role === 'SALES_REP' ? '••••••' : `AED ${data.kpis.mtdProjectedYieldAed.toLocaleString()}`}
              </div>
              <div className="flex items-center justify-between mt-2 text-[12px] text-on-surface-variant">
                <span>{role === 'SALES_REP' ? '•••' : `Avg ${data.kpis.avgMarginPct}% Margin`}</span>
                <span className="text-primary font-data-mono-num font-semibold">
                  {data.kpis.closedSalesCount} {isRtl ? 'صفقات منجزة' : 'Closes'}
                </span>
              </div>
            </div>

            {/* 4. RTA Mulkiya Compliance */}
            <div className="rounded-xl p-space-md border border-outline-variant/30 shadow-sm bg-surface-container-low">
              <div className="flex items-center justify-between mb-2 font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                <span>{isRtl ? 'التوافق مع فحص تسجيل والملكية' : 'RTA Mulkiya & Tasjeel Compliance'}</span>
                <span className="material-symbols-outlined text-[18px] text-tertiary">verified</span>
              </div>
              <div className="font-headline-sm text-headline-sm font-bold font-data-mono-num text-on-surface flex items-center justify-between">
                <span>{data.kpis.mulkiyaCompliancePct}%</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-error/15 text-error">
                  {data.kpis.expiringUnitsCount} {isRtl ? 'تنتهي قريباً' : 'EXPIRING'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 text-[12px] text-on-surface-variant">
                <span>{data.kpis.expiringUnitsCount} {isRtl ? 'مركبات أقل من 30 يوماً' : 'units < 30d expiry'}</span>
                <span className="text-secondary font-semibold">{isRtl ? 'مسار سريع' : 'Fast-Track'} →</span>
              </div>
            </div>
          </div>

          {/* MAIN TWO-COLUMN WORKSPACE: 8 cols vs 4 cols */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            {/* ========================================================================= */}
            {/* LEFT COLUMN: 8 of 12 cols */}
            {/* ========================================================================= */}
            <div className="lg:col-span-8 flex flex-col gap-space-lg">
              {/* 1. VIP CONSIGNMENT CUSTODY VAULT (FROZEN SPOTLIGHT) */}
              <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">vpn_key</span>
                    <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      {isRtl ? 'خزينة الحفظ والأمانات الفاخرة' : 'VIP Consignment Custody Vault'}
                    </h3>
                  </div>
                  <span className="font-mono text-[11px] text-error font-bold px-2.5 py-1 rounded bg-error/10 border border-error/30 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    <span>{d.vehicle.vaultLocation}</span>
                  </span>
                </div>

                {/* Filter Sub-Tabs */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-outline-variant/20 pb-3 text-[11px] font-label-caps">
                  <button
                    type="button"
                    onClick={() => setVaultFilter('ALL')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      vaultFilter === 'ALL'
                        ? 'bg-surface-container-highest text-primary font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    All Consignments (32)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVaultFilter('SHOWROOM')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      vaultFilter === 'SHOWROOM'
                        ? 'bg-surface-container-highest text-primary font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Active on Showroom Floor (22)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVaultFilter('OFFSITE')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      vaultFilter === 'OFFSITE'
                        ? 'bg-surface-container-highest text-primary font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Off-Site Climate Storage (8)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVaultFilter('SOLD')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      vaultFilter === 'SOLD'
                        ? 'bg-surface-container-highest text-primary font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Sold / Payout Pending (2)
                  </button>
                </div>

                {/* Red Custody Lock Active Callout */}
                <div
                  className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isRelieved
                      ? 'bg-tertiary/10 border-tertiary/30 text-tertiary'
                      : 'bg-error-container/20 border-error/40 text-on-error-container'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        isRelieved ? 'text-tertiary' : 'text-error animate-pulse'
                      }`}
                    >
                      {isRelieved ? 'lock_open' : 'lock_clock'}
                    </span>
                    <span className="font-label-caps text-[11px] font-bold uppercase tracking-wide">
                      {isRelieved
                        ? isRtl
                          ? 'تم فك حظر العزل القضائي عبر إيداع الكفالة'
                          : 'CUSTODY QUARANTINE CLEARED • RELEASED UNDER BOND'
                        : isRtl
                          ? 'قفل الحراسة القضائية نشط • ممنوع البيع أو الإفراج'
                          : 'CUSTODY LOCK ACTIVE • NO SALE / NO RELEASE'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-label-caps text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-surface text-on-surface font-semibold uppercase">
                      {isRelieved ? 'Court Bond Active' : 'Court Attachment Order Active'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded uppercase font-bold ${
                        isRelieved ? 'bg-tertiary text-on-tertiary' : 'bg-error text-on-error'
                      }`}
                    >
                      {isRelieved ? 'Mandate Restored' : 'Mandate Suspended'}
                    </span>
                  </div>
                </div>

                {/* Spotlight Vehicle Bento Card */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md p-space-md rounded-xl bg-surface-container border border-outline-variant/20">
                  <div className="md:col-span-4 relative rounded-lg overflow-hidden h-44 md:h-full min-h-[160px] bg-surface-container-highest">
                    <img
                      src={d.vehicle.imageUrl}
                      alt={d.vehicle.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface/80 backdrop-blur-sm text-[10px] font-label-caps font-bold text-on-surface">
                      Chassis: {d.vehicle.chassisVin}
                    </div>
                    {!isRelieved && (
                      <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-error/90 backdrop-blur-sm text-[10px] font-label-caps font-bold text-on-error text-center uppercase flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">security</span>
                        <span>Judicial Impound Seal Applied</span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-8 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-label-caps uppercase text-error font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          <span>{d.consignor.status}</span>
                        </span>
                        <span className="font-data-mono-num text-[11px] text-on-surface-variant">
                          Chassis: {d.vehicle.chassisVin}
                        </span>
                      </div>

                      <h3 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight mt-0.5">
                        {isRtl ? d.vehicle.titleAr : d.vehicle.title}
                      </h3>
                      <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                        {d.vehicle.specs}
                      </p>
                      <div className="text-[11px] text-primary font-semibold mt-1">
                        {isRtl ? d.consignor.nameAr : d.consignor.name} ({d.consignor.entity})
                      </div>
                    </div>

                    {/* Operational & Legal Status Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-outline-variant/20 text-[12px]">
                      <div>
                        <div className="text-on-surface-variant font-label-caps text-[10px] uppercase">
                          {isRtl ? 'حالة التكليف' : 'Mandate Status'}
                        </div>
                        <div
                          className={`font-semibold font-label-caps text-[11px] uppercase ${
                            isRelieved ? 'text-tertiary' : 'text-error'
                          }`}
                        >
                          {isRelieved ? 'RELEASED' : d.mandate.status}
                        </div>
                        <div className="text-[10px] text-on-surface-variant">
                          {isRelieved ? 'Seal Cleared' : 'Judicial Seal Applied'}
                        </div>
                      </div>

                      <div>
                        <div className="text-on-surface-variant font-label-caps text-[10px] uppercase">
                          {isRtl ? 'سعر الحجز المتفق عليه' : 'Agreed Reserve'}
                        </div>
                        <div className="font-semibold text-on-surface font-data-mono-num">
                          {role === 'SALES_REP' ? '••••••' : `AED ${d.financials.consignorReserveAed.toLocaleString()}`}
                        </div>
                        <div className="text-[10px] text-error">
                          {isRelieved ? 'Escrow Cleared' : 'Payout frozen under court freeze'}
                        </div>
                      </div>

                      <div>
                        <div className="text-on-surface-variant font-label-caps text-[10px] uppercase">
                          {isRtl ? 'حالة العرض بالمعرض' : 'Showroom Listing'}
                        </div>
                        <div
                          className={`font-semibold font-label-caps text-[11px] uppercase ${
                            isRelieved ? 'text-tertiary' : 'text-error'
                          }`}
                        >
                          {isRelieved ? 'LISTED' : 'DELISTED'}
                        </div>
                        <div className="text-[10px] text-on-surface-variant">
                          {isRelieved ? 'Active on floor' : 'DELISTED FROM MARKETPLACE'}
                        </div>
                      </div>

                      <div>
                        <div className="text-on-surface-variant font-label-caps text-[10px] uppercase">
                          {isRtl ? 'عمولة المعرض' : 'Dealership Spread'}
                        </div>
                        <div className="font-semibold text-primary font-data-mono-num">
                          {role === 'SALES_REP' ? '••••••' : (isRelieved ? `AED ${d.financials.dealershipCommissionAed.toLocaleString()}` : 'AED 0 (HELD)')}
                        </div>
                        <div className="text-[10px] text-on-surface-variant truncate">
                          {isRelieved ? 'Commission Unlocked' : 'Subject to interpleader'}
                        </div>
                      </div>
                    </div>

                    {/* Inspection & Dual PIN Status Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/15 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                        <span className="font-semibold text-on-surface">Tasjeel 150-Point Inspection:</span>
                        <span className="font-mono text-tertiary font-bold">{d.vehicle.tasjeelGrade}</span>
                        <span className="text-[10px] text-on-surface-variant">
                          ({isRtl ? 'الشهادة محرزة كحراسة قضائية' : 'Certificate impounded for evidentiary custody'})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-primary">security</span>
                        <span>Custody Security:</span>
                        <span className="font-mono text-primary font-bold">DUAL PIN Biometric Seal</span>
                      </div>
                    </div>

                    {/* Action Row */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setCourtOrderModalOpen(true)}
                        className="px-3 py-1 rounded bg-surface-container hover:bg-surface-container-highest border border-outline-variant text-[11px] font-label-caps font-semibold flex items-center gap-1 text-on-surface cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">gavel</span>
                        <span>Court Bailment Injunction: {d.injunctionRef}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setQuarantineLogModalOpen(true)}
                        className="px-3 py-1 rounded bg-surface-container hover:bg-surface-container-highest border border-outline-variant text-[11px] font-label-caps font-semibold flex items-center gap-1 text-error cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        <span>Quarantine Bailment Log</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. CORPORATE FLEET ACCOUNT MATRIX */}
              <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">corporate_fare</span>
                      <span>{isRtl ? 'مصفوفة حسابات أساطيل الشركات (6 عقود نشطة)' : 'Corporate Fleet Account Matrix (6 Active Enterprise Contracts)'}</span>
                    </h3>
                    <p className="font-body-sm text-[12px] text-on-surface-variant">
                      Spotlight Account TRN: {data.fleetAccount.trn} • {data.fleetAccount.dedLicense}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-label-caps font-bold uppercase bg-surface-container border border-outline-variant text-tertiary">
                    {data.fleetAccount.tier}
                  </span>
                </div>

                {/* Spotlight Fleet Details */}
                <div className="p-space-md rounded-lg bg-surface-container border border-outline-variant/20 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-on-surface text-[14px]">
                        {data.fleetAccount.accountName}
                      </h4>
                      <p className="text-[12px] text-on-surface-variant">
                        VIP Hospitality Fleet • Guaranteed SLA: 2-Hour emergency turnaround in Workshop Bay 6
                      </p>
                    </div>
                    <span className="font-data-mono-num text-[12px] px-2.5 py-1 rounded bg-surface-container-highest font-bold text-primary">
                      {data.fleetAccount.activeUnitsCount} Managed Units
                    </span>
                  </div>

                  {/* 3 Categories Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-outline-variant/15 text-[12px]">
                    {data.fleetAccount.composition.map((cat, idx) => (
                      <div key={idx} className="p-2.5 rounded bg-surface-container-low border border-outline-variant/20">
                        <div className="text-on-surface font-semibold">{cat.model}</div>
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="font-mono text-primary font-bold">{cat.units} Units</span>
                          <span className="text-tertiary font-medium">{cat.statusLabel}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Priority Monitored Units Table */}
                  <div className="pt-2">
                    <div className="text-[11px] font-label-caps uppercase text-on-surface-variant mb-1 font-semibold">
                      Priority Monitored Fleet Units
                    </div>
                    <div className="space-y-1.5">
                      {data.fleetAccount.priorityUnits.map((u) => (
                        <div
                          key={u.unitId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-surface-container-highest/40 text-[12px] gap-2 border border-outline-variant/20"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-primary text-[11px]">{u.unitId}</span>
                            <span className="font-medium text-on-surface">{u.model}</span>
                            <span className="font-mono text-[11px] text-on-surface-variant">({u.plate})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-on-surface-variant">
                              Mulkiya: <span className={u.isUrgent ? 'text-error font-bold' : 'text-on-surface'}>{u.mulkiyaValidUntil}</span>
                            </span>
                            <span className="font-mono text-[11px] text-on-surface-variant">
                              Odo: {u.odometerKm.toLocaleString()} KM
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-label-caps font-bold uppercase ${u.statusBadgeClass}`}>
                              {u.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN: 4 of 12 cols */}
            {/* ========================================================================= */}
            <div className="lg:col-span-4 flex flex-col gap-space-lg">
              {/* 1. CUSTODY & BAILMENT LEDGER */}
              <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-[22px] ${
                        isRelieved ? 'text-tertiary' : 'text-error'
                      }`}
                    >
                      gavel
                    </span>
                    <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      {isRtl ? 'سجل الحراسة القضائية والوديعة' : 'Custody & Bailment Ledger'}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-label-caps font-bold uppercase ${
                      isRelieved ? 'bg-tertiary/15 text-tertiary' : 'bg-error/15 text-error'
                    }`}
                  >
                    {isRelieved ? (isRtl ? 'تم فك الحظر' : 'LIEN RELEASED') : (isRtl ? 'نزاع قضائي' : 'LEGAL DISPUTE')}
                  </span>
                </div>

                <div
                  className={`p-space-md rounded-xl border text-[12px] space-y-2 ${
                    isRelieved
                      ? 'bg-tertiary/10 border-tertiary/20 text-tertiary'
                      : 'bg-error/10 border-error/20'
                  }`}
                >
                  <div className="font-semibold text-on-surface">
                    {isRelieved
                      ? 'Dubai Courts Bailment Escrow Release Granted'
                      : 'Commercial Court Injunction Served on Consignor'}
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    {isRelieved
                      ? 'Court certified interpleader motion admitted under decree CSG-2025-089A. Dealership released from consignor cross-claims.'
                      : 'Commercial Court Injunction served on Consignor Sheikh Khalid Al-Nahyan (Private Collection Holding FZCO) regarding contested chattel mortgage from private mezzanine creditor.'}
                  </p>
                </div>

                {/* Insurance & Lien Status Grid */}
                <div className="space-y-2 text-[12px]">
                  <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-on-surface-variant font-medium">
                        {isRtl ? 'تأمين الحراسة للسيارات الفاخرة' : 'Dealership Floater Insurance'}
                      </span>
                      <span
                        className={`font-label-caps text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isRelieved ? 'bg-tertiary/15 text-tertiary' : 'bg-error/15 text-error'
                        }`}
                      >
                        {isRelieved ? 'FULLY ACTIVE' : 'RESTRICTED'}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      {isRelieved
                        ? 'Full road transit and showroom cover reinstated under Allianz policy #DXB-CUST-889.'
                        : 'SUSPENDED FOR ROAD USE — VAULT STORAGE ONLY under Allianz policy #DXB-CUST-889 special rider.'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-on-surface-variant font-medium">
                        {isRtl ? 'سجل الرهون وحقوق الامتياز' : 'Lien & Mortgage Registry'}
                      </span>
                      <span
                        className={`font-label-caps text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isRelieved ? 'bg-tertiary/15 text-tertiary' : 'bg-error/15 text-error'
                        }`}
                      >
                        {isRelieved ? 'LIEN DISCHARGED' : 'Contested Lien'}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      {isRelieved
                        ? 'Judicial discharge recorded on electronic RTA gateway. Title transfer unblocked.'
                        : 'Chattel lien registered by mezzanine lender via Dubai Courts Execution Dept. Title transfer locked on electronic RTA gateway.'}
                    </p>
                  </div>
                </div>

                {/* COMMISSION SPLIT ENGINE: FROZEN IN ESCROW */}
                <div className="p-space-md rounded-xl bg-surface-container border border-primary/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-label-caps text-[11px] uppercase text-primary font-bold">
                      <span className="material-symbols-outlined text-[16px]">lock_clock</span>
                      <span>Commission Split Engine</span>
                    </div>
                    <span
                      className={`font-label-caps text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        isRelieved ? 'bg-tertiary/20 text-tertiary' : 'bg-error/20 text-error'
                      }`}
                    >
                      {isRelieved ? 'DISBURSED VIA ESCROW' : 'FROZEN IN ESCROW'}
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[12px] pt-1">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Target Sale Price (Asking):</span>
                      <span className="text-on-surface font-bold">AED {d.financials.askingPriceAed.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Consignor Reserve (Disputed):</span>
                      <span className="text-error font-bold">
                        {role === 'SALES_REP' ? '••••••' : `AED ${d.financials.consignorReserveAed.toLocaleString()} (FROZEN)`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Dealership Commission:</span>
                      <span className="text-primary font-bold">
                        {role === 'SALES_REP' ? '••••••' : `AED ${d.financials.dealershipCommissionAed.toLocaleString()} (IN ESCROW)`}
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-outline-variant/20 pt-1">
                      <span className="text-on-surface-variant">Escrow Deposit State:</span>
                      <span className={isRelieved ? 'text-tertiary font-bold' : 'text-error font-bold'}>
                        {isRelieved ? 'AED 1,650,000 RELEASED' : 'AED 1,650,000 LOCKED'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-on-surface-variant border-t border-outline-variant/15">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">event</span>
                      <span>Hearing Date: {d.hearingDate}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEscrowCertModalOpen(true)}
                      className="text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Escrow Bond Cert
                    </button>
                  </div>
                </div>

                {/* 2. BULK COMPLIANCE & LEGAL RELIEF HUB */}
                <div className="space-y-2 pt-2 border-t border-outline-variant/20">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-[11px] uppercase text-on-surface-variant font-bold">
                      {isRtl ? 'مركز إجراءات الحماية القانونية' : 'Legal Relief & Compliance Hub'}
                    </span>
                    <span className="material-symbols-outlined text-secondary text-[16px]">balance</span>
                  </div>

                  <div className="p-2.5 rounded bg-error/10 border border-error/20 text-[11px] text-error flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">warning</span>
                    <span>
                      {isRelieved
                        ? 'Dubai Police Traffic clearance token issued (#DP-TC-2025-9921).'
                        : '1 Vehicle Barred from Mulkiya Renewal or Transfer via RTA Gateway (Black-listed by Dubai Police Traffic & Licensing Dept).'}
                    </span>
                  </div>

                  {/* 3 Urgent Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setInterpleaderModalOpen(true)}
                      disabled={role === 'SALES_REP'}
                      className={`w-full py-2.5 px-4 rounded-lg font-body-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        role === 'SALES_REP'
                          ? 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-60'
                          : 'bg-primary text-on-primary hover:bg-primary-fixed-dim shadow-md'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">balance</span>
                      <span>
                        {role === 'SALES_REP'
                          ? isRtl
                            ? 'مطلوب صلاحية المدير العام'
                            : 'Interpleader Motion (Restricted to Principal)'
                          : isRelieved
                            ? isRtl
                              ? 'معاينة مكتملة — لم يتم تقديم شيء'
                              : 'Preview completed — nothing was filed'
                            : isRtl
                              ? 'تقديم دعوى تنازع وإيداع قضائي (عاجل)'
                              : 'Submit Dealership Interpleader Motion'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCounselModalOpen(true)}
                      className="w-full py-2 px-3 rounded-lg bg-surface-container border border-outline-variant hover:border-primary text-on-surface font-body-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer text-[12px]"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">contact_phone</span>
                      <span>Contact Consignor Legal Counsel (Al Tamimi & Co)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImmunityModalOpen(true)}
                      className="w-full py-2 px-3 rounded-lg bg-surface-container border border-outline-variant hover:border-primary text-on-surface font-body-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer text-[12px]"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">description</span>
                      <span>RTA Impound Immunity Petition (Pending Filing)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FULL PIPELINE TABLE */}
          <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {isRtl ? 'محفظة الأساطيل والبيع بالأمانة الشاملة' : 'Consolidated Fleet & Consignment Master Pipeline'}
                </h3>
                <p className="font-body-sm text-[12px] text-on-surface-variant">
                  {isRtl
                    ? 'المتابعة الحية وحالة الحراسة والالتزامات المالية لجميع وحدات كبار الشخصيات'
                    : 'Live telemetry, custody status, and financial obligations for all enrolled VIP units'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-label-caps font-bold px-2.5 py-1 rounded bg-surface-container border border-outline-variant text-on-surface-variant">
                  3 Master Active Accounts
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-outline-variant/20">
              <table className="w-full text-left font-body-sm text-[13px] border-collapse">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant font-label-caps text-[11px] uppercase border-b border-outline-variant/30">
                    <th className="py-2.5 px-3">{isRtl ? 'الحساب / المالك' : 'Account / Consignor'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'المركبة والمواصفات' : 'Vehicle Specification'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'الشاسيه واللوحة' : 'Chassis / Plate'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'نوع الاتفاقية' : 'Agreement Type'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'القيمة المتفق عليها' : 'Agreed Value'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'نسبة العمولة' : 'Commission Split'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'حالة الملكية / الفحص' : 'Mulkiya / Tasjeel'}</th>
                    <th className="py-2.5 px-3 text-right">{isRtl ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {data.pipelineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-highest/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-on-surface">{item.accountName}</div>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-label-caps font-bold uppercase ${item.accountTypeBadgeClass}`}>
                          {item.accountType}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-on-surface">{item.vehicleTitle}</div>
                        <div className="text-[11px] text-on-surface-variant">{item.vehicleSpecs}</div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="text-on-surface">{item.vin}</div>
                        <div className="text-primary">{item.plate}</div>
                      </td>

                      <td className="py-3 px-3 text-[12px] text-on-surface-variant">
                        {item.agreementType}
                      </td>

                      <td className="py-3 px-3 font-data-mono-num font-semibold text-on-surface">
                        AED {item.agreedValueAed.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 font-data-mono-num">
                        {role === 'SALES_REP' ? (
                          <span className="text-on-surface-variant">••••••</span>
                        ) : (
                          <span className="text-primary font-bold">{item.commissionSplitLabel}</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-[12px]">
                        <span className={item.mulkiyaStatus.includes('Expiring') ? 'text-error font-bold' : 'text-on-surface-variant'}>
                          {item.mulkiyaStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-label-caps font-bold uppercase ${item.pipelineBadgeClass}`}>
                          {item.pipelineStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOTTOM CONCEPT STATE SWITCHER DOCK */}
          <div className="rounded-xl bg-surface-container-high p-space-md shadow-md flex flex-col md:flex-row items-center justify-between gap-space-md border border-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">toggle_on</span>
              </div>
              <div>
                <div className="font-label-caps text-[11px] font-bold uppercase text-primary">
                  {isRtl ? 'محاكي الحالات التشغيلية' : 'Concept State Switcher'}
                </div>
                <div className="text-[12px] text-on-surface-variant">
                  {isRtl
                    ? 'محاكاة الحالات التشغيلية للأمانات والأساطيل:'
                    : 'Switch prototype scenarios for UAE court and bailment review:'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/fleet"
                className="px-3 py-1.5 rounded-lg font-body-sm text-[12px] font-medium bg-surface-container text-on-surface-variant hover:bg-surface-container-highest border border-outline-variant/30 transition-colors"
              >
                {isRtl ? 'محفظة الأساطيل النشطة' : 'Populated Active Consignments & Fleets'}
              </Link>

              <button
                type="button"
                onClick={() => {
                  setFeedbackMessage(
                    isRtl
                      ? 'تم عرض تسوية بيع الأمانة ومطابقة الحسابات.'
                      : 'Consignment Sold / Settlement Reconciliation scenario loaded.'
                  );
                }}
                className="px-3 py-1.5 rounded-lg font-body-sm text-[12px] font-medium bg-surface-container text-on-surface-variant hover:bg-surface-container-highest border border-outline-variant/30 transition-colors cursor-pointer"
              >
                {isRtl ? 'تسوية مبيعات الأمانة' : 'Consignment Sold / Settlement Reconciliation'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedbackMessage(
                    isRtl
                      ? 'دفعة الملكيات العاجلة: 8 مركبات تتطلب حجز الفحص خلال 48 ساعة.'
                      : 'Urgent Mulkiya Expiration Batch: 8 vehicles booked for Tasjeel renewal.'
                  );
                }}
                className="px-3 py-1.5 rounded-lg font-body-sm text-[12px] font-medium bg-surface-container text-on-surface-variant hover:bg-surface-container-highest border border-outline-variant/30 transition-colors cursor-pointer"
              >
                {isRtl ? 'دفعة انتهاء الملكية العاجلة' : 'Urgent Mulkiya Expiration Batch'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRelieved(false);
                  setFeedbackMessage(
                    isRtl
                      ? 'الحظر القضائي نشط: أمر التنفيذ #DXB-EXEC-2025-8841 ساري المفعول.'
                      : 'Consignor Legal Dispute Hold (Active): Dubai Courts Execution Order #DXB-EXEC-2025-8841.'
                  );
                }}
                className="px-3 py-1.5 rounded-lg font-body-sm text-[12px] font-bold bg-error-container text-on-error-container transition-colors cursor-pointer shadow-sm"
              >
                {isRtl ? 'الحظر القضائي التحفظي (الحالي S26)' : 'Consignor Legal Dispute Hold (Active)'}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. INTERPLEADER MOTION MODAL */}
      {interpleaderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">balance</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {isRtl ? 'تقديم دعوى تنازع وإيداع قضائي (Interpleader Motion)' : 'Dealership Interpleader & Escrow Bond Motion'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInterpleaderModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px]"
              >
                ✕
              </button>
            </div>

            {interpleaderFiled ? (
              <div className="py-6 text-center space-y-3">
                <span className="material-symbols-outlined text-[48px] text-outline">info</span>
                <h4 className="font-headline-sm text-on-surface font-semibold">
                  {isRtl ? 'معاينة فقط — لم يتم إرسال أي شيء.' : 'Preview only — nothing was sent.'}
                </h4>
                <p className="text-[12px] text-on-surface-variant max-w-sm mx-auto">
                  {isRtl
                    ? 'هذه معاينة ببيانات تجريبية. لم يتم تقديم أي دعوى أو إيداع أي كفالة لدى أي محكمة أو جهة ضمان.'
                    : 'This is a sample-data preview. No motion was filed and no bond was deposited with any court or escrow agent.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInterpleaderModalOpen(false);
                    setIsRelieved(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-[13px]"
                >
                  {isRtl ? 'العودة لملف الحراسة' : 'Return to Custody Ledger'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-[13px]">
                <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/30 space-y-1">
                  <div className="flex justify-between text-[11px] font-label-caps text-on-surface-variant">
                    <span>COURT: {d.courtName}</span>
                    <span>ORDER: #{d.courtOrderNumber}</span>
                  </div>
                  <div className="text-on-surface font-semibold">
                    Disputed Unit: <span className="text-primary font-mono">{d.vehicle.title}</span> (Chassis: {d.vehicle.chassisVin})
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    {isRtl
                      ? 'بموجب المادة 99 من قانون الإجراءات المدنية، يقوم المعرض كحارس حسن النية بإيداع إجمالي ثمن السيارة المتنازع عليه في خزينة المحكمة، مما يعفي المعرض قانونياً من أي مسؤولية تقصيرية.'
                      : 'Under Article 99 of the UAE Civil Procedure Code, the dealership as innocent bailee deposits the full consideration in court escrow, releasing dealership from all bailment claims.'}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-label-caps uppercase text-on-surface-variant mb-1">
                    {isRtl ? 'مبلغ الوديعة القضائية المودعة' : 'Court Interpleader Bond Amount'}
                  </label>
                  <input
                    type="number"
                    value={interpleaderBondAed}
                    onChange={(e) => setInterpleaderBondAed(Number(e.target.value))}
                    className="w-full rounded-lg bg-surface-container border border-outline-variant p-2 text-on-surface font-mono font-bold text-[13px]"
                  />
                  <span className="text-[10px] text-on-surface-variant mt-0.5 block">
                    {isRtl ? 'يشمل القيمة الكاملة للأمانة (1,650,000 درهم)' : 'Matches total contracted asking value (AED 1,650,000)'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-surface-container border border-outline-variant/30 flex items-center justify-between text-[11px]">
                  <span className="text-on-surface-variant">Dealership Escrow Counsel:</span>
                  <span className="font-mono text-primary font-bold">Al Tamimi & Co (Filing Reference: AT-2025-081)</span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setInterpleaderModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface text-[12px] font-medium"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterpleaderFiled(true)}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-[12px] flex items-center gap-1.5 shadow"
                  >
                    <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                    <span>{isRtl ? 'إيداع الكفالة وفك التحفظ' : 'Deposit Bond & Lift Quarantine'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. COURT INJUNCTION ORDER MODAL */}
      {courtOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-[24px]">gavel</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {isRtl ? 'أمر التنفيذ والحجز القضائي التحفظي' : 'Dubai Commercial Court Execution Order'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCourtOrderModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[12px]">
              <div className="p-3 rounded-lg bg-surface-container font-mono space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Order Number:</span>
                  <span className="text-error font-bold">{d.courtOrderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Issuing Court:</span>
                  <span className="text-on-surface">{d.courtName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Hearing Date:</span>
                  <span className="text-primary">{d.hearingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Respondent / Consignor:</span>
                  <span className="text-on-surface">{d.consignor.name} ({d.consignor.entity})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Judicial Officer:</span>
                  <span className="text-on-surface">{d.mandate.custodianOfficer}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface-variant space-y-1 leading-relaxed">
                <div className="font-semibold text-on-surface">Decree Summary:</div>
                <p>
                  Pursuant to Dubai Commercial Court Execution Decree #{d.courtOrderNumber}, custody of Ferrari 296 GTB (Chassis: {d.vehicle.chassisVin}) is hereby sequestered under judicial attachment. SilberArrows Luxury FZCO is commanded to hold chattel in locked vault custody without title transfer, test drives, or physical removal pending final interpleader adjudication.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCourtOrderModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant text-[12px]"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCourtOrderModalOpen(false);
                    setFeedbackMessage('Downloaded certified court execution order PDF (#DXB-EXEC-2025-8841.pdf).');
                  }}
                  className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-[12px] flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>{isRtl ? 'تحميل الأمر الرسمي (PDF)' : 'Download Certified PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. QUARANTINE BAILMENT LOG MODAL */}
      {quarantineLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-[24px]">lock</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {isRtl ? 'سجل العزل والأختام الجمركية والقضائية' : 'Quarantine Bailment Security Log'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuarantineLogModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[12px]">
              <div className="p-3 rounded-lg bg-surface-container font-mono space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Location:</span>
                  <span className="text-primary font-bold">{d.vehicle.vaultLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Biometric Key:</span>
                  <span className="text-on-surface">GM-DUAL-PIN-ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Judicial Seal Hash:</span>
                  <span className="text-on-surface">0x7f20...ee19a</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Tasjeel Grade:</span>
                  <span className="text-tertiary font-bold">{d.vehicle.tasjeelGrade} (Impounded)</span>
                </div>
              </div>

              <p className="text-on-surface-variant text-[11px]">
                {isRtl
                  ? 'تم تأكيد عزل المركبة في حظيرة التخزين المغلقة 01-12. لا يمكن سحب المفاتيح إلا بتوقيع مشترك من مأمور التنفيذ والمدير العام.'
                  : 'Physical biometric lock engaged. Keys secured in dual-signatory time-lock vault. Any unauthorized physical displacement constitutes statutory bailment contempt.'}
              </p>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setQuarantineLogModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-[12px] font-semibold"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CONTACT CONSIGNOR LEGAL COUNSEL MODAL */}
      {counselModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">contact_phone</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {isRtl ? 'التواصل مع محامي المالك (التميمي ومشاركوه)' : 'Consignor Legal Counsel Channel'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCounselModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[12px]">
              <div className="p-3 rounded-lg bg-surface-container space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Retained Counsel:</span>
                  <span className="text-on-surface font-bold">{d.consignor.legalCounsel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Phone:</span>
                  <span className="text-primary font-bold">{d.consignor.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Case Docket:</span>
                  <span className="text-on-surface">AT-DIFC-8812</span>
                </div>
              </div>

              <p className="text-on-surface-variant text-[11px]">
                {isRtl
                  ? 'تم إرسال إشعار رسمي للمستشار القانوني للمالك بضرورة تقديم شهادة مخالصة الرهن أو الإيداع المشترك في المحكمة.'
                  : 'Official statutory notice dispatched to Consignor legal representatives regarding chattel mortgage settlement or consent to interpleader deposit.'}
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCounselModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-surface-container text-on-surface-variant text-[12px]"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCounselModalOpen(false);
                    setFeedbackMessage('Urgent legal notice dispatched to Al Tamimi & Co counsel.');
                  }}
                  className="px-4 py-1.5 rounded-lg bg-secondary text-on-secondary font-semibold text-[12px]"
                >
                  {isRtl ? 'إرسال الإشعار العاجل' : 'Dispatch Legal Notice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. RTA IMPOUND IMMUNITY PETITION MODAL */}
      {immunityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">description</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {isRtl ? 'عريضة الحصانة من الحجز لهيئة الطرق RTA' : 'RTA Impound Immunity Petition'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setImmunityModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[12px]">
              <p className="text-on-surface-variant text-[11px]">
                {isRtl
                  ? 'طلب رسمي موجه إلى شرطة دبي وهيئة الطرق لحماية المعرض المرخص من سحب المركبة إلى الشبك الحكومي، وتثبيت بقائها في حظيرة المعرض تحت الحراسة القضائية.'
                  : 'Petition to Dubai Police & RTA Licensing to grant on-premises bailment immunity, confirming the vehicle remains safely quarantined in dealer vault without government yard impound.'}
              </p>

              <div className="p-2.5 rounded bg-surface-container font-mono text-[11px] space-y-1">
                <div>Petition Ref: RTA-IMM-2025-0418</div>
                <div>Chassis: {d.vehicle.chassisVin}</div>
                <div>Status: Ready for e-filing</div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setImmunityModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-surface-container text-on-surface-variant text-[12px]"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImmunityModalOpen(false);
                    setFeedbackMessage('RTA impound immunity petition submitted to Dubai Police Licensing Dept.');
                  }}
                  className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-[12px]"
                >
                  {isRtl ? 'تقديم العريضة' : 'File Petition'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. ESCROW BOND CERTIFICATE MODAL */}
      {escrowCertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {isRtl ? 'شهادة ضمان الإيداع البنكي والقضائي' : 'Escrow Bond Certification'}
              </h3>
              <button
                type="button"
                onClick={() => setEscrowCertModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[12px]">
              <div className="p-3 rounded-lg bg-surface-container font-mono space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Escrow Bank:</span>
                  <span className="text-on-surface">First Abu Dhabi Bank (FAB Escrow)</span>
                </div>
                <div className="flex justify-between">
                  <span>Bond Deposit:</span>
                  <span className="text-primary font-bold">AED 1,650,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Hearing Date:</span>
                  <span className="text-on-surface">{d.hearingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Interpleader Docket:</span>
                  <span className="text-on-surface">#CSG-2025-089A</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setEscrowCertModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-[12px] font-semibold"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
