'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DealerSidebar } from '../../../../components/dealer-sidebar';
import { DealerHeader } from '../../../../components/dealer-header';
import {
  VERIFIED_EXPORT_DISCREPANCY_FIXTURE,
  ExportDiscrepancyData,
  VERIFIED_ACCOUNTING_DESK_FIXTURE,
} from '../../../../lib/api';

export default function ExportDiscrepancyExceptionPage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [role, setRole] = useState<'PRINCIPAL' | 'SALES_REP'>('PRINCIPAL');
  const isRtl = locale === 'ar';

  const [discrepancyData, setDiscrepancyData] = useState<ExportDiscrepancyData>(VERIFIED_EXPORT_DISCREPANCY_FIXTURE);
  const [demonstratorState, setDemonstratorState] = useState<'AUDIT_FLAG' | 'STANDARD' | 'TRADE_IN' | 'ZERO_RATED'>('AUDIT_FLAG');

  // Modals & Feedback
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [uploadBayanModalOpen, setUploadBayanModalOpen] = useState(false);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [zatcaModalOpen, setZatcaModalOpen] = useState(false);
  const [inspectXmlModalOpen, setInspectXmlModalOpen] = useState(false);
  const [escrowDeedModalOpen, setEscrowDeedModalOpen] = useState(false);

  // Form state
  const [bayanUploadFile, setBayanUploadFile] = useState('ZATCA_EXIT_BILL_SA-981240.pdf');
  const [borderCrossingPost, setBorderCrossingPost] = useState('Batha Border Customs Terminal (KSA)');

  // Handlers
  const handleCureDiscrepancy = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadBayanModalOpen(false);

    setDiscrepancyData((prev) => ({
      ...prev,
      kpis: {
        ...prev.kpis,
        escrowLienHoldbackAed: 0,
      },
      dualLedger: {
        ...prev.dualLedger,
        varianceAed: 0,
        statutoryTaxHoldAed: 0,
        authorizedNetReleaseAed: 4200000,
        reconciled: true,
      },
      taxStatus: {
        ...prev.taxStatus,
        contingentTaxExposureAed: 0,
        customsComplianceScore: '100% Cleared (ZATCA Certified)',
        reconciledBayanRatio: '14 / 14 Reconciled',
      },
    }));

    setFeedbackMessage(
      isRtl
        ? 'تم رفع بيان الخروج الجمركي المعتمد #BAY-99812-25 بنجاح! تم فك الحجز عن مبلغ الضمان (210,000 درهم) واعتماد التصدير بنسبة الصفر (0%).'
        : 'Certified Port of Exit Bill of Lading verified by ZATCA gateway! Statutory VAT lien of AED 210,000.00 cleared and released to dealership account.'
    );
  };

  const handleArticle45Extension = () => {
    setExtensionModalOpen(false);
    setDiscrepancyData((prev) => ({
      ...prev,
      kpis: {
        ...prev.kpis,
        daysRemaining: prev.kpis.daysRemaining + 30,
        deadlineDate: '26 May 2025 (30-Day Extension Granted)',
      },
    }));

    setFeedbackMessage(
      isRtl
        ? 'تم قبول التماس تمديد مهلة التصدير وفق المادة 45 من اللائحة التنفيذية لضريبة القيمة المضافة. تم منح 30 يوماً إضافية.'
        : 'FTA Article 45 Extension Appeal approved: 30-day grace extension granted pursuant to UAE Tax Procedures Law.'
    );
  };

  const handleReleaseClearedFunds = () => {
    setFeedbackMessage(
      isRtl
        ? 'تم صرف الدفعة الأساسية غير المتنازع عليها بقيمة 3,990,000.00 درهم من حساب الضمان لدى بنك FAB إلى حساب الوكالة.'
        : 'Uncontested escrow principal of AED 3,990,000.00 disbursed from FAB Trust account to dealership operational account.'
    );
  };

  return (
    <div
      className={`min-h-screen bg-surface font-body-md text-on-surface antialiased ${
        isRtl ? 'rtl' : 'ltr'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <DealerSidebar locale={locale} />

      <div className={isRtl ? 'pr-64 min-h-screen flex flex-col' : 'pl-64 min-h-screen flex flex-col'}>
        <DealerHeader
          currentRole={role}
          onRoleToggle={() => setRole(role === 'PRINCIPAL' ? 'SALES_REP' : 'PRINCIPAL')}
          locale={locale}
          onLocaleToggle={() => setLocale(locale === 'en' ? 'ar' : 'en')}
        />

        <main className="w-full pt-16 bg-surface px-space-lg pb-space-xl flex-1">
          <div className="flex flex-col w-full">
            {/* Top Navigation Backlink */}
            <div className="pt-space-sm pb-space-xs flex items-center justify-between">
              <Link
                href="/accounting"
                className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors font-body-sm text-body-sm"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>{isRtl ? 'العودة إلى سجل الفواتير والمحاسبة الضريبية' : 'Return to Fiscal Accounting Desk'}</span>
              </Link>

              <span className="px-2 py-0.5 rounded bg-error/15 text-error font-data-mono-num text-xs font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                Case Ref: #DISC-GCC-2025-0140
              </span>
            </div>

            {/* Feedback Notification Banner */}
            {feedbackMessage && (
              <div className="my-space-sm p-space-md rounded-xl bg-primary-container/20 border border-primary text-on-surface flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                  <div>
                    <span className="font-headline-sm text-body-md font-semibold text-primary block">
                      {isRtl ? 'تحديث تسوية التدقيق الجمركي والضريبي' : 'Customs Discrepancy Action Executed'}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {feedbackMessage}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackMessage(null)}
                  className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-body-sm text-on-surface border border-white/[0.08]"
                >
                  {isRtl ? 'إغلاق' : 'Dismiss'}
                </button>
              </div>
            )}

            {/* P1 Specification Concept Notice & Roadmap Context Banner */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-high/90 p-space-md shadow-xl my-space-sm border border-white/[0.04]">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-error/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col gap-space-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
                  <div className="flex flex-col gap-1.5 max-w-4xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-error/15 text-error font-label-caps text-label-caps uppercase tracking-wider font-semibold">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        [FUTURE ROADMAP • P1 SPECIFICATION — AUDIT EXCEPTION DRILL-DOWN]
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-caps text-label-caps tracking-widest uppercase">
                        Federal Decree-Law No. (8) of 2017 &amp; Art. 45 Direct Export
                      </span>
                      <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary font-label-caps text-label-caps uppercase font-bold">
                        KSA ZATCA &amp; UAE FTA Cross-Border Protocol
                      </span>
                    </div>

                    <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1 flex flex-wrap items-baseline gap-3">
                      <span>Zero-Rated GCC Export &amp; Customs Bond Discrepancy</span>
                      <span className="font-body-md text-body-md text-error font-medium" dir="rtl">
                        فحص عدم تطابق بيان التصدير الجمركي وحساب الضمان المعلق
                      </span>
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      AUDIT EXCEPTION ACTIVE: JAFZA / DWC Bond Bayan #BAY-99812-25 Cross-Border Zero-Rated Export Mismatch with Saudi ZATCA electronic customs declaration. Escrow Hold Enforced by UAE CBUAE / FTA Compliance Gateway.
                    </p>
                  </div>

                  {/* Top Action Cluster */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setZatcaModalOpen(true)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors font-body-sm text-body-sm font-medium border border-white/[0.05] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">assignment_late</span>
                      <span>{isRtl ? 'ملف تدقيق ZATCA' : 'View ZATCA Audit Dossier'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExtensionModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-error text-black font-body-sm text-body-sm font-semibold shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">shield_with_heart</span>
                      <span>{isRtl ? 'طلب تمديد المادة 45' : 'FTA Article 45 Extension Appeal'}</span>
                    </button>
                  </div>
                </div>

                {/* Urgent Alert Clock Strip */}
                <div className="p-3 rounded-lg bg-error/10 border border-outline-variant/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-error text-[24px]">fmd_bad</span>
                    <div>
                      <div className="font-body-sm text-body-sm font-bold text-error uppercase tracking-wider">
                        CUSTOMS BOND DISCREPANCY &amp; VAT LIEN ENFORCED (DAY {discrepancyData.kpis.customsClockDay} / {discrepancyData.kpis.customsClockMaxDays})
                      </div>
                      <div className="font-body-sm text-[12px] text-on-surface-variant">
                        Port of Exit physical crossing certification not yet synchronized via GCC Customs Single-Window. Contingent tax lien of{' '}
                        <strong className="text-error">
                          {role === 'SALES_REP' ? '••••••' : `AED ${discrepancyData.kpis.escrowLienHoldbackAed.toLocaleString()}.00`}
                        </strong>{' '}
                        frozen in FAB Escrow.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-data-mono-num text-[12px] text-error font-bold bg-surface-container-high px-3 py-1.5 rounded border border-white/[0.05]">
                    <span className="material-symbols-outlined text-[16px] animate-pulse">timer</span>
                    <span>{discrepancyData.kpis.daysRemaining} Days Remaining to Cure Discrepancy</span>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Operational Telemetry Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-lg">
              {/* Total Cleared Revenue */}
              <div className="rounded-xl bg-surface-container-low p-space-md shadow-md flex flex-col justify-between relative overflow-hidden border border-white/[0.04]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                      Cleared Revenue (MTD)
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      {discrepancyData.kpis.clearedSalesCount} Fully Released • 1 Under Bond Hold
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-label-caps text-label-caps text-primary uppercase font-bold">AED</span>
                  <span className="font-data-currency-lg text-data-currency-lg text-on-surface tracking-tight font-bold font-data-mono-num">
                    {discrepancyData.kpis.clearedRevenueAed.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 font-body-sm text-body-sm text-tertiary">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  <span>Base volume cleared for disbursement</span>
                </div>
              </div>

              {/* Escrow Lien Holdback */}
              <div className="rounded-xl bg-surface-container-low p-space-md shadow-md flex flex-col justify-between relative overflow-hidden border border-white/[0.04]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-label-caps text-label-caps text-error uppercase tracking-wider font-semibold">
                      Escrow Lien Holdback
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      FAB / CBUAE Statutory VAT Reserve
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-error/15 flex items-center justify-center text-error">
                    <span className="material-symbols-outlined text-[20px]">lock_clock</span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-label-caps text-label-caps text-error uppercase font-bold">AED</span>
                  <span className="font-data-currency-lg text-data-currency-lg text-error tracking-tight font-bold font-data-mono-num">
                    {role === 'SALES_REP'
                      ? '••••••'
                      : discrepancyData.kpis.escrowLienHoldbackAed.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 font-body-sm text-body-sm text-error">
                  <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                  <span className="font-data-mono-num text-data-mono-num">
                    Quarantined: 5% VAT exposure lien
                  </span>
                </div>
              </div>

              {/* GCC 0% Zero-Rated Volume */}
              <div className="rounded-xl bg-surface-container-low p-space-md shadow-md flex flex-col justify-between relative overflow-hidden border border-white/[0.04]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                      GCC 0% Zero-Rated Volume
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Art. 45 UAE Tax Decree Law
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[20px]">flight_takeoff</span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-label-caps text-label-caps text-secondary uppercase font-bold">AED</span>
                  <span className="font-data-currency-lg text-data-currency-lg text-on-surface tracking-tight font-bold font-data-mono-num">
                    {discrepancyData.kpis.gccZeroRatedVolumeAed.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">Target Destination:</span>
                  <span className="font-data-mono-num text-data-mono-num text-secondary font-semibold">
                    Riyadh (KSA ZATCA)
                  </span>
                </div>
              </div>

              {/* Customs Clock Status */}
              <div className="rounded-xl bg-surface-container-low p-space-md shadow-md flex flex-col justify-between relative overflow-hidden border border-white/[0.04]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                      Customs Clock Status
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      90-Day Legal Exit Window
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-error/15 flex items-center justify-center text-error">
                    <span className="material-symbols-outlined text-[20px]">hourglass_bottom</span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-data-currency-lg text-data-currency-lg text-error tracking-tight font-bold font-data-mono-num">
                    Day {discrepancyData.kpis.customsClockDay}
                  </span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-medium">
                    / {discrepancyData.kpis.customsClockMaxDays} Max
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 font-body-sm text-body-sm text-error">
                  <span className="material-symbols-outlined text-[16px]">alarm</span>
                  <span>{discrepancyData.kpis.daysRemaining} Days until retroactive 5% default</span>
                </div>
              </div>
            </div>

            {/* Primary 2-Column High-Density Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-lg">
              {/* LEFT COLUMN: ~65% (Cols 1 to 8) */}
              <div className="lg:col-span-8 flex flex-col gap-space-lg">
                {/* 1. Interactive FTA Compliant Tax Invoice Preview */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl relative overflow-hidden border border-white/[0.04]">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-error via-primary to-secondary" />

                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-space-md mb-space-md bg-surface-container/40 -mx-space-lg -mt-space-lg px-space-lg pt-space-md border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded bg-secondary/20 text-secondary font-data-mono-num text-data-mono-num font-bold">
                        {discrepancyData.activeInvoice.invoiceNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-error/10 text-error text-body-sm font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />
                        Customs Exit Proof Pending (Day {discrepancyData.kpis.customsClockDay}/{discrepancyData.kpis.customsClockMaxDays})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFeedbackMessage(
                            isRtl
                              ? 'تم إرسال الفاتورة الضريبية للتصدير INV-2025-0140 لطابعة PDF.'
                              : 'Tax Invoice INV-2025-0140 sent to PDF printer spooler.'
                          )
                        }
                        className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-body-sm font-medium flex items-center gap-1.5 transition-colors border border-white/[0.05] cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">print</span>
                        <span>PDF Print</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInspectXmlModalOpen(true)}
                        className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-body-sm font-medium flex items-center gap-1.5 transition-colors border border-white/[0.05] cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">code</span>
                        <span>Inspect UBL 2.1 XML</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUploadBayanModalOpen(true)}
                        className="px-3 py-1.5 rounded bg-error text-black text-body-sm font-semibold flex items-center gap-1.5 transition-all shadow-md hover:brightness-105 active:scale-95 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                        <span>{isRtl ? 'رفع بيان الخروج المعتمد' : 'Upload Exit Bayan'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Bilingual Invoice Box */}
                  <div className="bg-surface-container-lowest/90 rounded-lg p-space-md text-on-surface flex flex-col gap-space-md shadow-inner border border-white/[0.03]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pb-space-sm border-b border-white/[0.04]">
                      {/* Left: Dealership Details (English) */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-headline-sm text-headline-sm text-secondary font-bold">TAX INVOICE</span>
                          <span className="font-label-caps text-label-caps uppercase text-secondary font-semibold tracking-wider bg-secondary/15 px-2 py-0.5 rounded">
                            ZERO-RATED GCC EXPORT (0%)
                          </span>
                        </div>
                        <div className="font-body-md text-body-md font-semibold text-on-surface">
                          {discrepancyData.activeInvoice.sellerNameEn}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                          Vault Hub 04, Sheikh Zayed Road, Al Quoz Industrial 1<br />
                          Dubai, United Arab Emirates • P.O. Box 49102
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 font-data-mono-num text-data-mono-num text-primary">
                          <span className="text-on-surface-variant text-[11px] font-sans">TRN:</span>
                          <span className="font-bold tracking-wider">{discrepancyData.activeInvoice.sellerTrn}</span>
                          <span className="material-symbols-outlined text-[14px] text-tertiary" title="Verified active with FTA Tax Registry">
                            verified
                          </span>
                        </div>
                      </div>

                      {/* Right: Arabic Mirror (RTL) */}
                      <div className="flex flex-col gap-1 md:text-right" dir="rtl">
                        <div className="flex items-center md:justify-start justify-end gap-2">
                          <span className="font-headline-sm text-headline-sm text-secondary font-bold">فاتورة ضريبية</span>
                          <span className="font-label-caps text-label-caps uppercase text-secondary font-semibold tracking-wider bg-secondary/15 px-2 py-0.5 rounded">
                            تصدير خليجي خاضع لنسبة الصفر
                          </span>
                        </div>
                        <div className="font-body-md text-body-md font-semibold text-on-surface">
                          {discrepancyData.activeInvoice.sellerNameAr}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                          صالة العرض ٠٤، شارع الشيخ زايد، القوز الصناعية الأولى<br />
                          دبي، الإمارات العربية المتحدة
                        </div>
                        <div className="mt-1 flex items-center md:justify-start justify-end gap-1.5 font-data-mono-num text-data-mono-num text-primary">
                          <span className="text-on-surface-variant text-[11px] font-sans">رقم التسجيل الضريبي:</span>
                          <span className="font-bold tracking-wider" dir="ltr">
                            {discrepancyData.activeInvoice.sellerTrn}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Clock Alert Box */}
                    <div className="p-3 rounded-lg bg-error/15 border border-outline-variant/40 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-error text-[20px] mt-0.5">crisis_alert</span>
                        <div>
                          <div className="font-label-caps text-label-caps text-error uppercase font-bold tracking-wider">
                            CUSTOMS EXIT PROOF PENDING — 90-DAY FTA STATUTORY CLOCK (DAY {discrepancyData.kpis.customsClockDay}/{discrepancyData.kpis.customsClockMaxDays})
                          </div>
                          <div className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                            Export to Kingdom of Saudi Arabia requires certified single-window exit bill of lading within 90 days. If uncertified by{' '}
                            <strong className="text-error">{discrepancyData.kpis.deadlineDate}</strong>, FTA auto-converts transaction to 5% standard VAT + 4% monthly penalty (
                            <strong className="text-error">
                              {role === 'SALES_REP' ? '••••••' : `AED ${discrepancyData.kpis.escrowLienHoldbackAed.toLocaleString()}.00`} contingent liability
                            </strong>
                            ).
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-error text-black font-data-mono-num text-[11px] font-bold shrink-0">
                        {discrepancyData.kpis.daysRemaining} DAYS LEFT
                      </span>
                    </div>

                    {/* Customer & Bayan Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg bg-surface-container-high/60 border border-white/[0.03]">
                      <div>
                        <div className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                          Buyer / العميل المستورد
                        </div>
                        <div className="font-body-sm text-body-sm font-semibold text-on-surface mt-0.5">
                          {discrepancyData.activeInvoice.buyerName}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">
                          King Fahd Road, Al Olaya District, Riyadh
                        </div>
                      </div>

                      <div>
                        <div className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                          Buyer KSA VAT TRN / الرقم الضريبي
                        </div>
                        <div className="font-data-mono-num text-data-mono-num font-semibold text-secondary mt-0.5">
                          {discrepancyData.activeInvoice.buyerTrn}
                        </div>
                        <div className="font-body-sm text-body-sm text-secondary flex items-center gap-1 mt-0.5 font-medium">
                          <span className="material-symbols-outlined text-[13px]">verified</span>
                          ZATCA GCC Tax Registry Confirmed
                        </div>
                      </div>

                      <div>
                        <div className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                          Transit Declaration &amp; Bayan
                        </div>
                        <div className="font-data-mono-num text-data-mono-num text-primary mt-0.5 font-bold">
                          {discrepancyData.activeInvoice.bayanRef} • {discrepancyData.activeInvoice.portOfExit}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">
                          Port of Entry: <span className="text-error font-mono font-bold">{discrepancyData.activeInvoice.portOfEntry}</span>
                        </div>
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-body-sm text-body-sm" id="export-invoice-lines-table">
                        <thead>
                          <tr className="bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                            <th className="py-2.5 px-3">Item Description / البيان</th>
                            <th className="py-2.5 px-2 text-center">Tax Category</th>
                            <th className="py-2.5 px-3 text-right">Unit Price (AED)</th>
                            <th className="py-2.5 px-2 text-right">Rate</th>
                            <th className="py-2.5 px-3 text-right">VAT (AED)</th>
                            <th className="py-2.5 px-3 text-right">Total Payable (AED)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y-0">
                          <tr className="hover:bg-surface-container/60 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-on-surface">
                                {discrepancyData.activeInvoice.vehicleTitle}
                              </div>
                              <div className="font-data-mono-num text-[11px] text-on-surface-variant flex items-center gap-2 mt-0.5">
                                <span>VIN / Chassis: {discrepancyData.activeInvoice.vin}</span>
                                <span className="text-secondary">{discrepancyData.activeInvoice.specs}</span>
                              </div>
                            </td>

                            <td className="py-3 px-2 text-center">
                              <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary font-label-caps text-[10px] font-semibold uppercase">
                                0% Zero-Rated Export
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right font-data-mono-num text-data-mono-num text-on-surface">
                              {discrepancyData.activeInvoice.grossSalePriceAed.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              })}
                            </td>

                            <td className="py-3 px-2 text-right font-data-mono-num text-data-mono-num text-secondary">
                              0.0%
                            </td>

                            <td className="py-3 px-3 text-right font-data-mono-num text-data-mono-num text-secondary font-medium">
                              0.00
                            </td>

                            <td className="py-3 px-3 text-right font-data-mono-num text-data-mono-num text-on-surface font-semibold">
                              {discrepancyData.activeInvoice.grossSalePriceAed.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>

                          <tr className="hover:bg-surface-container/60 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-on-surface">
                                GCC Bonded Carrier Transit &amp; Sealed Container Escort
                              </div>
                              <div className="font-body-sm text-[11px] text-on-surface-variant">
                                Sovereign Bond guarantee via Dubai Customs declaration #{discrepancyData.activeInvoice.bayanRef}
                              </div>
                            </td>

                            <td className="py-2.5 px-2 text-center">
                              <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary font-label-caps text-[10px] font-semibold uppercase">
                                0% Zero-Rated
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-right font-data-mono-num text-data-mono-num text-on-surface">
                              Included
                            </td>

                            <td className="py-2.5 px-2 text-right font-data-mono-num text-data-mono-num text-secondary">
                              0.0%
                            </td>

                            <td className="py-2.5 px-3 text-right font-data-mono-num text-data-mono-num text-secondary font-medium">
                              0.00
                            </td>

                            <td className="py-2.5 px-3 text-right font-data-mono-num text-data-mono-num text-on-surface font-semibold">
                              0.00
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Totals & Escrow Lien Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md pt-space-sm bg-surface-container/40 p-space-md rounded-lg border border-white/[0.03]">
                      <div className="md:col-span-6 flex flex-col justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-24 h-24 bg-white p-1 rounded shrink-0 flex items-center justify-center shadow">
                            <svg className="w-full h-full text-black" viewBox="0 0 100 100">
                              <rect fill="currentColor" height="28" width="28" x="5" y="5" />
                              <rect fill="white" height="20" width="20" x="9" y="9" />
                              <rect fill="currentColor" height="12" width="12" x="13" y="13" />
                              <rect fill="currentColor" height="28" width="28" x="67" y="5" />
                              <rect fill="white" height="20" width="20" x="71" y="9" />
                              <rect fill="currentColor" height="12" width="12" x="75" y="13" />
                              <rect fill="currentColor" height="28" width="28" x="5" y="67" />
                              <rect fill="white" height="20" width="20" x="9" y="71" />
                              <rect fill="currentColor" height="12" width="12" x="13" y="75" />
                              <rect fill="currentColor" height="6" width="6" x="38" y="10" />
                              <rect fill="currentColor" height="6" width="6" x="48" y="6" />
                              <rect fill="currentColor" height="6" width="6" x="58" y="14" />
                              <rect fill="currentColor" height="6" width="6" x="38" y="24" />
                              <rect fill="currentColor" height="6" width="6" x="48" y="20" />
                              <rect fill="currentColor" height="6" width="6" x="10" y="38" />
                              <rect fill="currentColor" height="6" width="6" x="20" y="44" />
                              <rect fill="currentColor" height="6" width="6" x="28" y="38" />
                              <rect fill="currentColor" height="6" width="6" x="14" y="52" />
                              <rect fill="currentColor" height="20" width="20" x="40" y="40" />
                              <rect fill="white" height="12" width="12" x="44" y="44" />
                              <rect fill="currentColor" height="4" width="4" x="48" y="48" />
                              <rect fill="currentColor" height="6" width="8" x="66" y="38" />
                              <rect fill="currentColor" height="6" width="6" x="80" y="44" />
                              <rect fill="currentColor" height="6" width="6" x="72" y="52" />
                              <rect fill="currentColor" height="6" width="6" x="86" y="54" />
                              <rect fill="currentColor" height="8" width="6" x="38" y="68" />
                              <rect fill="currentColor" height="6" width="6" x="50" y="72" />
                              <rect fill="currentColor" height="6" width="6" x="42" y="84" />
                              <rect fill="currentColor" height="6" width="8" x="54" y="82" />
                              <rect fill="currentColor" height="6" width="8" x="68" y="68" />
                              <rect fill="currentColor" height="8" width="6" x="82" y="72" />
                              <rect fill="currentColor" height="6" width="6" x="74" y="84" />
                              <rect fill="currentColor" height="8" width="6" x="86" y="82" />
                            </svg>
                          </div>

                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="font-label-caps text-label-caps text-secondary uppercase flex items-center gap-1 font-bold">
                              <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
                              FTA Phase 1 Export TLV Stamp
                            </div>
                            <div className="font-body-sm text-[11px] text-on-surface-variant leading-tight">
                              ZATCA Bilateral Cross-Border Tax Protocol. Zero-rated VAT conditional on final Port of Exit discharge certification.
                            </div>
                            <div
                              className="font-data-mono-num text-[10px] text-on-surface-variant truncate bg-surface-container-highest px-2 py-1 rounded mt-1 select-all"
                              title="Cryptographic Hash"
                            >
                              HASH: {discrepancyData.activeInvoice.tlvHash}
                            </div>
                          </div>
                        </div>

                        {/* Escrow Partial Holdback Callout */}
                        <div className="p-2.5 rounded bg-error/10 border border-outline-variant/40 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-error text-[18px]">pause_circle</span>
                            <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                              Escrow Partial Holdback Active
                            </span>
                          </div>
                          <span className="font-data-mono-num text-[11px] text-error font-bold">
                            {role === 'SALES_REP'
                              ? '••••••'
                              : `AED ${discrepancyData.kpis.escrowLienHoldbackAed.toLocaleString()} Quarantined`}
                          </span>
                        </div>
                      </div>

                      {/* Financial Reconciliation Breakdown */}
                      <div className="md:col-span-6 flex flex-col gap-2 font-body-sm text-body-sm pl-0 md:pl-2">
                        <div className="flex justify-between items-center text-on-surface-variant">
                          <span>Asset Sale Price / سعر المركبة الأساسي</span>
                          <span className="font-data-mono-num text-data-mono-num text-on-surface font-bold">
                            {discrepancyData.activeInvoice.grossSalePriceAed.toLocaleString('en-US', { minimumFractionDigits: 2 })} AED
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-secondary font-medium">
                          <span>VAT (0.00% Zero-Rated GCC Export)</span>
                          <span className="font-data-mono-num text-data-mono-num text-secondary font-bold">
                            0.00 AED
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-on-surface font-semibold pt-1 border-t border-white/[0.04]">
                          <span>Invoice Total / إجمالي الفاتورة</span>
                          <span className="font-data-mono-num text-data-mono-num text-on-surface font-bold text-headline-sm">
                            {discrepancyData.activeInvoice.grossSalePriceAed.toLocaleString('en-US', { minimumFractionDigits: 2 })} AED
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-2 rounded bg-error/15 text-error">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-error text-[16px]">lock</span>
                            <span>FTA Contingency VAT Lien (5%)</span>
                          </div>
                          <span className="font-data-mono-num text-data-mono-num text-error font-bold">
                            {role === 'SALES_REP'
                              ? '••••••'
                              : `${discrepancyData.activeInvoice.contingencyVatLienAed.toLocaleString('en-US', { minimumFractionDigits: 2 })} AED`}
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-2.5 rounded bg-primary/10 text-on-surface mt-1 border border-primary/20">
                          <div>
                            <div className="font-label-caps text-label-caps text-primary uppercase font-bold">
                              Net Released Escrow Principal
                            </div>
                            <div className="font-body-sm text-[11px] text-on-surface-variant">
                              Base dealer funds cleared via FAB Trust
                            </div>
                          </div>
                          <span className="font-data-currency-lg text-headline-md text-primary font-bold font-data-mono-num">
                            {discrepancyData.activeInvoice.netReleasedPrincipalAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                            <span className="text-xs font-sans">AED</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Dual-Ledger Escrow Settlement Matcher */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl border border-white/[0.04]">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-space-md">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-error/15 flex items-center justify-center text-error">
                        <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                      </div>
                      <div>
                        <div className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          Dual-Ledger Escrow Settlement Matcher
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">
                          Cross-Ledger Audit: FAB Escrow Sovereign Account vs Dealership GL (Asset: Ferrari SF90 XX)
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-error/15 text-error font-data-mono-num text-data-mono-num font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                      Variance: {role === 'SALES_REP' ? '••••••' : `AED ${discrepancyData.dualLedger.varianceAed.toLocaleString()} (FTA VAT Escrow Lien Held)`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    {/* Ledger A: FAB Escrow Trust Ledger */}
                    <div className="rounded-lg bg-surface-container p-space-md flex flex-col gap-3 border border-white/[0.04]">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-[20px]">account_balance</span>
                          <div>
                            <div className="font-body-sm text-body-sm font-semibold text-on-surface">
                              FAB Escrow Trust Ledger
                            </div>
                            <div className="font-label-caps text-label-caps text-on-surface-variant">
                              Account: AE020300... (Al-Rajhi LC Deposit)
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-secondary text-body-sm font-data-mono-num">
                          LC Funded
                        </span>
                      </div>

                      <div className="space-y-2 text-body-sm">
                        <div className="flex items-center justify-between p-2 rounded bg-surface-container-high/60">
                          <span className="text-on-surface-variant">Buyer Bank Guarantee (LC Confirmed):</span>
                          <span className="font-data-mono-num text-data-mono-num text-on-surface font-medium">
                            AED {discrepancyData.dualLedger.lcDepositAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded bg-error/15 text-error">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">lock</span>
                            Mandatory FTA Statutory Tax Hold:
                          </span>
                          <span className="font-data-mono-num text-data-mono-num font-bold">
                            {role === 'SALES_REP'
                              ? '••••••'
                              : `-AED ${discrepancyData.dualLedger.statutoryTaxHoldAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded bg-surface-container-high/60">
                          <span className="text-on-surface-variant">Authorized Net Release to Dealer:</span>
                          <span className="font-data-mono-num text-data-mono-num text-tertiary font-medium">
                            AED {discrepancyData.dualLedger.authorizedNetReleaseAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded bg-surface-container-highest font-semibold text-on-surface">
                          <span>Current Liquid Escrow Available:</span>
                          <span className="font-data-mono-num text-data-mono-num text-secondary">
                            AED {discrepancyData.dualLedger.authorizedNetReleaseAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ledger B: Dealership ERP General Ledger */}
                    <div className="rounded-lg bg-surface-container p-space-md flex flex-col gap-3 border border-white/[0.04]">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[20px]">dataset</span>
                          <div>
                            <div className="font-body-sm text-body-sm font-semibold text-on-surface">
                              Dealership ERP General Ledger
                            </div>
                            <div className="font-label-caps text-label-caps text-on-surface-variant">
                              ERP Sub-Account: 1040-05 (GCC Zero-Rated AR)
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-error/20 text-error text-body-sm font-data-mono-num font-bold">
                          Variance Alert
                        </span>
                      </div>

                      <div className="space-y-2 text-body-sm">
                        <div className="flex items-center justify-between p-2 rounded bg-surface-container-high/60">
                          <span className="text-on-surface-variant">Gross Export Invoice Target:</span>
                          <span className="font-data-mono-num text-data-mono-num text-on-surface font-medium">
                            AED {discrepancyData.dualLedger.lcDepositAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded bg-surface-container-high/60">
                          <span className="text-on-surface-variant">Calculated Output VAT (0% Export):</span>
                          <span className="font-data-mono-num text-data-mono-num text-secondary font-medium">
                            AED 0.00
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded bg-error/15 text-error">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">warning</span>
                            Unresolved Tax Escrow Variance:
                          </span>
                          <span className="font-data-mono-num text-data-mono-num font-bold">
                            {role === 'SALES_REP'
                              ? '••••••'
                              : `AED ${discrepancyData.dualLedger.varianceAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded bg-surface-container-highest font-semibold text-on-surface">
                          <span>Recognized Cash Flow Received:</span>
                          <span className="font-data-mono-num text-data-mono-num text-primary font-bold">
                            AED {discrepancyData.dualLedger.authorizedNetReleaseAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Escrow Lien Condition Banner */}
                  <div className="mt-space-md p-space-sm rounded-lg bg-error/10 border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-error text-[22px]">notification_important</span>
                      <div>
                        <div className="font-body-sm text-body-sm text-on-surface font-semibold">
                          Escrow Lien Condition: Port of Exit Bayan Discharge Required
                        </div>
                        <div className="font-body-sm text-[12px] text-on-surface-variant">
                          Upon single-window confirmation of vehicle crossing Batha/Salwa border, CBUAE clears the AED 210,000 lien automatically.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEscrowDeedModalOpen(true)}
                        className="px-3.5 py-2 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface font-body-sm text-body-sm font-medium transition-colors border border-white/[0.05] cursor-pointer"
                      >
                        {isRtl ? 'عرض صك الضمان' : 'View Escrow Deed'}
                      </button>

                      <button
                        type="button"
                        onClick={handleReleaseClearedFunds}
                        className="px-4 py-2 rounded-lg bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:brightness-105 active:scale-95 transition-all shadow-md cursor-pointer"
                      >
                        {isRtl ? 'صرف مبالغ 3.99 مليون درهم' : 'Release Cleared AED 3.99M'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: ~35% (Cols 9 to 12) */}
              <div className="lg:col-span-4 flex flex-col gap-space-lg">
                {/* 1. Corporate Tax & Bond Status */}
                <div className="rounded-xl bg-surface-container-low p-space-md shadow-xl flex flex-col gap-space-md border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">gavel</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        Corporate Tax &amp; Bond Status
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-label-caps text-label-caps uppercase font-bold">
                      FY2025
                    </span>
                  </div>

                  <div className="bg-surface-container p-3 rounded-lg flex flex-col gap-2 border border-white/[0.03]">
                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface-variant">GCC Bonded Re-Export:</span>
                      <span className="font-data-mono-num text-data-mono-num text-secondary font-bold">
                        AED {discrepancyData.taxStatus.bondedReExportAed.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface-variant">Applicable CT Rate:</span>
                      <span className="font-data-mono-num text-data-mono-num text-tertiary font-bold">
                        {discrepancyData.taxStatus.applicableCtRate}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface-variant">Contingent Tax Exposure:</span>
                      <span className="font-data-mono-num text-data-mono-num text-error font-bold">
                        {role === 'SALES_REP'
                          ? '••••••'
                          : `AED ${discrepancyData.taxStatus.contingentTaxExposureAed.toLocaleString()}`}
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden my-1">
                      <div className="h-full bg-error rounded-full" style={{ width: '86%' }} />
                    </div>

                    <div className="flex justify-between items-center font-body-sm text-body-sm pt-1 border-t border-white/[0.04]">
                      <span className="text-on-surface font-medium">Customs Compliance Score:</span>
                      <span className="font-data-mono-num text-data-mono-num text-error font-bold">
                        {discrepancyData.taxStatus.customsComplianceScore}
                      </span>
                    </div>
                  </div>

                  {/* Audit Flag Box */}
                  <div className="p-3 rounded-lg bg-error/15 border border-outline-variant/40 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-label-caps uppercase text-error font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        GCC Cross-Border Audit Flag
                      </span>
                      <span className="font-data-mono-num text-data-mono-num text-error font-bold">
                        Action Req.
                      </span>
                    </div>
                    <p className="font-body-sm text-[12px] text-on-surface-variant leading-relaxed">
                      Customs Bond Bayan #{discrepancyData.activeInvoice.bayanRef} requires certified stamp from Saudi ZATCA border crossing before 90-day grace expiry.
                    </p>
                  </div>

                  {/* Supply Split */}
                  <div className="bg-surface-container p-3 rounded-lg flex flex-col gap-2 border border-white/[0.03]">
                    <div className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold">
                      Jurisdiction Supply Split (MTD)
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 rounded-l-full bg-primary"
                        style={{ width: `${discrepancyData.taxStatus.mainlandSplitPct}%` }}
                        title={`${discrepancyData.taxStatus.mainlandSplitPct}% Mainland UAE`}
                      />
                      <div
                        className="h-3 rounded-r-full bg-secondary"
                        style={{ width: `${discrepancyData.taxStatus.bondedSplitPct}%` }}
                        title={`${discrepancyData.taxStatus.bondedSplitPct}% GCC Bonded Export`}
                      />
                    </div>
                    <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-primary inline-block" />
                        <span>{discrepancyData.taxStatus.mainlandSplitPct}% Mainland (5% VAT)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-secondary inline-block" />
                        <span>{discrepancyData.taxStatus.bondedSplitPct}% GCC Bonded (0% Export)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Customs Resolution Dossier */}
                <div className="rounded-xl bg-surface-container-low p-space-md shadow-xl flex flex-col gap-space-md border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        assignment_turned_in
                      </span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        Customs Resolution Dossier
                      </span>
                    </div>
                    <span className="font-data-mono-num text-data-mono-num text-error font-bold">
                      1 Pending Bayan
                    </span>
                  </div>

                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    UAE Federal Tax Authority &amp; Dubai Customs integration repository for zero-rated vehicle transfers.
                  </p>

                  <div className="p-3 rounded-lg bg-surface-container flex flex-col gap-2 border border-white/[0.03]">
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                        Exit Bayan Reconciliation
                      </span>
                      <span className="font-data-mono-num text-data-mono-num text-error font-bold">
                        {discrepancyData.taxStatus.reconciledBayanRatio}
                      </span>
                    </div>
                    <div className="font-body-sm text-[12px] text-on-surface-variant">
                      VIN {discrepancyData.activeInvoice.vin} ({discrepancyData.activeInvoice.vehicleTitle}) pending border crossing bill of lading document.
                    </div>
                    <div className="flex items-center gap-2 text-error font-body-sm text-[12px] mt-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      <span>1 open audit flag requires compliance cure</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadBayanModalOpen(true)}
                      className="w-full py-2.5 px-3 rounded-lg bg-primary text-on-primary font-body-sm text-body-sm font-semibold flex items-center justify-center gap-2 shadow hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">upload_file</span>
                      <span>{isRtl ? 'رفع بيان الخروج المعتمد' : 'Upload Certified Port of Exit Bill of Lading (Bayan)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExtensionModalOpen(true)}
                      className="w-full py-2.5 px-3 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface font-body-sm text-body-sm font-medium flex items-center justify-center gap-2 transition-colors border border-white/[0.04] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">schedule_send</span>
                      <span>{isRtl ? 'تقديم طلب تمديد مهلة التصدير (المادة 45)' : 'File FTA Article 45 Export Extension'}</span>
                    </button>
                  </div>
                </div>

                {/* 3. Escrow & Tax Operations */}
                <div className="rounded-xl bg-surface-container-low p-space-md shadow-xl flex flex-col gap-2.5 border border-white/[0.04]">
                  <div className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold tracking-wider mb-1">
                    Escrow &amp; Tax Operations
                  </div>

                  <button
                    type="button"
                    onClick={handleReleaseClearedFunds}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm font-medium transition-colors border border-white/[0.03] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">account_balance</span>
                      <span>Release Uncontested Funds (AED 3.99M)</span>
                    </span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFeedbackMessage(
                        isRtl
                          ? 'تم إيداع كفالة جمركية بنكية بقيمة 210,000 درهم لدى جمارك دبي.'
                          : 'Customs guarantee deposit of AED 210,000 submitted to Dubai Customs.'
                      )
                    }
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm font-medium transition-colors border border-white/[0.03] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-error">gavel</span>
                      <span>Submit Customs Guarantee Deposit</span>
                    </span>
                    <span className="font-data-mono-num text-[11px] text-error font-bold">AED 210K</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setZatcaModalOpen(true)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm font-medium transition-colors border border-white/[0.03] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-secondary">description</span>
                      <span>Generate ZATCA Bilateral Certificate</span>
                    </span>
                    <span className="font-data-mono-num text-[11px] text-secondary font-medium">XML Sync</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Section: Recent Invoices & Fiscal Settlement Journal */}
            <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl mb-space-lg border border-white/[0.04]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-space-md">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-[22px]">table_chart_view</span>
                  <div>
                    <div className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Recent Invoices &amp; Fiscal Settlement Journal
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      Live audit ledger of high-value transactions cleared through DIFC/CBUAE escrow channels
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container font-body-sm text-body-sm text-on-surface border border-white/[0.05]">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">filter_list</span>
                    <span>Showing Last 5 Sales</span>
                  </div>
                </div>
              </div>

              {/* Telemetry Density Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm" id="export-discrepancy-journal-table">
                  <thead>
                    <tr className="bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                      <th className="py-2.5 px-3">Tax Invoice #</th>
                      <th className="py-2.5 px-3">Buyer &amp; Entity TRN</th>
                      <th className="py-2.5 px-3">Vehicle / Asset Unit</th>
                      <th className="py-2.5 px-3 text-right">Gross Amount</th>
                      <th className="py-2.5 px-3 text-right">VAT (5%)</th>
                      <th className="py-2.5 px-3 text-center">Settlement Channel</th>
                      <th className="py-2.5 px-3 text-center">FTA Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-0">
                    {VERIFIED_ACCOUNTING_DESK_FIXTURE.recentJournal.map((row) => {
                      const isExceptionRow = row.invoiceNumber === 'INV-2025-0140';
                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-surface-container/60 transition-colors ${
                            isExceptionRow
                              ? 'bg-error/10 border-l-4 border-error'
                              : 'bg-surface-container/20 border-b border-white/[0.02]'
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="font-data-mono-num text-data-mono-num font-bold text-on-surface">
                              {row.invoiceNumber}
                            </div>
                            <div className="text-[11px] text-on-surface-variant">{row.issueDate}</div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-semibold text-on-surface">{row.buyerName}</div>
                            <div className="font-data-mono-num text-[11px] text-on-surface-variant">{row.buyerTrn}</div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="text-on-surface font-medium">{row.vehicleTitle}</div>
                            <div className="font-data-mono-num text-[11px] text-on-surface-variant">{row.vin}</div>
                          </td>

                          <td className="py-3 px-3 text-right font-data-mono-num text-data-mono-num font-semibold text-on-surface">
                            AED {row.grossAmountAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-3 px-3 text-right font-data-mono-num text-data-mono-num text-secondary font-medium">
                            {row.vatLabel}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${row.channelBadgeClass}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {row.settlementChannel}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-caps text-[10px] font-semibold uppercase ${row.ftaBadgeClass}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {row.ftaStatus}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setFeedbackMessage(
                                  isRtl
                                    ? `تم تحميل تفاصيل الفاتورة ${row.invoiceNumber} للتدقيق الجمركي.`
                                    : `Inspecting fiscal record for ${row.invoiceNumber}.`
                                )
                              }
                              className="p-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-white/[0.05] cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom State Demonstrator Dock */}
            <div className="rounded-xl bg-surface-container-high p-space-md shadow-2xl flex flex-col md:flex-row items-center justify-between gap-space-md border border-outline-variant/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">developer_board</span>
                </div>
                <div>
                  <div className="font-body-sm text-body-sm text-on-surface font-semibold">
                    Interactive Prototype State Switcher
                  </div>
                  <div className="font-body-sm text-[12px] text-on-surface-variant">
                    Switch template scenario to validate alternate fiscal compliance conditions
                  </div>
                </div>
              </div>

              {/* State Switcher Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('STANDARD');
                    setFeedbackMessage('Demonstrator: Standard Tax Invoice scenario active.');
                  }}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-body-sm transition-colors cursor-pointer ${
                    demonstratorState === 'STANDARD'
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface-container-highest text-on-surface hover:bg-surface-bright'
                  }`}
                >
                  Standard Tax Invoice (GT3 RS)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('TRADE_IN');
                    setFeedbackMessage('Demonstrator: Trade-in Offset & Credit Note scenario active.');
                  }}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-body-sm transition-colors cursor-pointer ${
                    demonstratorState === 'TRADE_IN'
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface-container-highest text-on-surface hover:bg-surface-bright'
                  }`}
                >
                  Trade-in Offset &amp; Credit Note
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('ZERO_RATED');
                    setFeedbackMessage('Demonstrator: GCC Cross-Border Zero-Rated Export cleared.');
                  }}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-body-sm font-semibold shadow transition-all flex items-center gap-1 cursor-pointer ${
                    demonstratorState === 'ZERO_RATED'
                      ? 'bg-secondary text-black font-bold'
                      : 'bg-surface-container-highest text-on-surface hover:bg-surface-bright'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">check</span>
                  GCC Cross-Border (0% Zero-Rated)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('AUDIT_FLAG');
                    setFeedbackMessage('Demonstrator: Customs Bond Discrepancy & 90-Day Clock active exception.');
                  }}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-body-sm font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    demonstratorState === 'AUDIT_FLAG'
                      ? 'bg-error text-black font-bold animate-pulse'
                      : 'bg-surface-container-highest text-error hover:bg-surface-bright'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">warning</span>
                  FTA Audit Discrepancy Flag (Active Exception)
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* =========================================================================
          MODALS
      ========================================================================== */}

      {/* Modal 1: Upload Certified Port of Exit Bayan */}
      {uploadBayanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-[24px]">upload_file</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'رفع بيان الخروج الجمركي المعتمد (Bayan)' : 'Upload Certified Port of Exit Bayan'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUploadBayanModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCureDiscrepancy} className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div className="p-3 rounded-lg bg-surface-container border border-white/[0.05] text-xs space-y-1">
                <div className="font-semibold text-on-surface">Target Export Transaction:</div>
                <div className="text-secondary font-mono">Invoice: INV-2025-0140 • Asset: Ferrari SF90 XX</div>
                <div className="text-error font-mono">Contingent VAT Escrow Lien: AED 210,000.00</div>
              </div>

              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  Customs Declaration File Name
                </label>
                <input
                  type="text"
                  required
                  value={bayanUploadFile}
                  onChange={(e) => setBayanUploadFile(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] font-data-mono-num text-xs"
                />
              </div>

              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  GCC Single-Window Exit Post
                </label>
                <input
                  type="text"
                  required
                  value={borderCrossingPost}
                  onChange={(e) => setBorderCrossingPost(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] text-xs"
                />
              </div>

              <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20 text-xs text-on-surface-variant leading-relaxed">
                Submitting verified Bayan automatically communicates with Saudi ZATCA electronic customs clearance and unlocks the AED 210,000 escrow hold.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setUploadBayanModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold font-body-sm text-sm hover:brightness-105 transition-all shadow-md"
                >
                  {isRtl ? 'تأكيد الرفع وفك حجز الضمان' : 'Cure Discrepancy & Release Escrow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: File FTA Article 45 Extension */}
      {extensionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">schedule_send</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'طلب تمديد مهلة التصدير (المادة 45)' : 'FTA Article 45 Export Extension Appeal'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExtensionModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Pursuant to Article 45 of Cabinet Decision No. (52) on the Executive Regulation of Federal Decree-Law No. (8) on Value Added Tax, the FTA may grant an extension exceeding the standard 90-day physical export window under certified logistical transit delay.
              </p>

              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  Extension Reason Code
                </label>
                <select className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] text-xs">
                  <option>EX-01: Bonded Carrier Port Clearance Bottleneck (Batha Terminal)</option>
                  <option>EX-02: ZATCA GCC Single-Window API System Desynchronization</option>
                  <option>EX-03: Sovereign Consignee Inspection Hold</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-surface-container border border-white/[0.04] text-xs font-mono text-tertiary">
                Requested Extension Period: +30 Calendar Days (New Deadline: 26 May 2025)
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setExtensionModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleArticle45Extension}
                className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-semibold font-body-sm text-sm hover:brightness-105 transition-all shadow-md"
              >
                {isRtl ? 'تقديم الالتماس لهيئة الضرائب' : 'Submit Extension Appeal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: View ZATCA Audit Dossier */}
      {zatcaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">assignment_late</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'ملف تدقيق ZATCA الجمركي والضريبي' : 'ZATCA Cross-Border Customs Audit Dossier'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setZatcaModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div className="p-3 rounded-lg bg-surface-container border border-white/[0.05] text-xs font-mono space-y-1.5 text-on-surface-variant">
                <div><strong>ZATCA Protocol Ref:</strong> GCC-KSA-ZATCA-2025-99812</div>
                <div><strong>Consignee KSA TRN:</strong> 300184918200003</div>
                <div><strong>Declaration Status:</strong> Inbound Port Declaration Registered (Batha)</div>
                <div className="text-error font-bold">Physical Exit Stamp: PENDING DISCHARGE</div>
                <div><strong>Associated Letter of Credit:</strong> Banque Saudi Fransi #LC-99812-DXB</div>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                UAE Federal Tax Authority requires bilateral matching between Dubai Customs declaration #BAY-99812-25 and Saudi ZATCA port exit clearance to sustain 0% zero-rated VAT classification.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setZatcaModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Inspect UBL 2.1 XML */}
      {inspectXmlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">code</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'فحص كود الفاتورة UBL 2.1 XML' : 'UBL 2.1 XML Export Invoice Inspector'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectXmlModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 font-body-sm text-on-surface">
              <div className="p-3 rounded-lg bg-surface-container font-data-mono-num text-[11px] flex flex-col gap-1 text-on-surface-variant overflow-x-auto max-h-56 border border-white/[0.06]">
                <div className="text-secondary font-bold">&lt;Invoice xmlns=&quot;urn:oasis:names:specification:ubl:schema:xsd:Invoice-2&quot;&gt;</div>
                <div className="pl-3">&lt;cbc:ID&gt;INV-2025-0140&lt;/cbc:ID&gt;</div>
                <div className="pl-3">&lt;cbc:InvoiceTypeCode name=&quot;0% Zero-Rated GCC Export&quot;&gt;380&lt;/cbc:InvoiceTypeCode&gt;</div>
                <div className="pl-3">&lt;cac:TaxTotal&gt;</div>
                <div className="pl-6 text-secondary">&lt;cbc:TaxAmount currencyID=&quot;AED&quot;&gt;0.00&lt;/cbc:TaxAmount&gt;</div>
                <div className="pl-3">&lt;/cac:TaxTotal&gt;</div>
                <div className="pl-3">&lt;cac:LegalMonetaryTotal&gt;</div>
                <div className="pl-6 text-primary">&lt;cbc:PayableAmount currencyID=&quot;AED&quot;&gt;4200000.00&lt;/cbc:PayableAmount&gt;</div>
                <div className="pl-3">&lt;/cac:LegalMonetaryTotal&gt;</div>
                <div className="text-secondary font-bold">&lt;/Invoice&gt;</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setInspectXmlModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: View Escrow Deed */}
      {escrowDeedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">account_balance</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'صك الضمان المصرفي السيادي (FAB Escrow)' : 'FAB Escrow Sovereign Trust Deed'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEscrowDeedModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-3 rounded-lg bg-surface-container border border-white/[0.04] text-xs font-mono space-y-1 text-on-surface-variant">
              <div><strong>Escrow Custodian:</strong> First Abu Dhabi Bank (FAB)</div>
              <div><strong>IBAN:</strong> AE020300000984920148102</div>
              <div><strong>Guaranteed Principal:</strong> AED 4,200,000.00 (LC Confirmed)</div>
              <div><strong>Statutory Tax Lien:</strong> AED 210,000.00 (Conditional CBUAE Hold)</div>
              <div><strong>Liquid Disbursement Ready:</strong> AED 3,990,000.00</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setEscrowDeedModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
