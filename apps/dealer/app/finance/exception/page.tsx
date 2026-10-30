'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DealerSidebar } from '../../../components/dealer-sidebar';
import { DealerHeader } from '../../../components/dealer-header';
import { previewSafeMessage } from '../../../lib/preview';
import {
  fetchSubprimeDbrExceptionData,
  SubprimeDbrExceptionData,
  VERIFIED_SUBPRIME_DBR_EXCEPTION_FIXTURE,
} from '../../../lib/api';

export default function SubprimeDbrExceptionPage() {
  const [data, setData] = useState<SubprimeDbrExceptionData>(VERIFIED_SUBPRIME_DBR_EXCEPTION_FIXTURE);
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const isRtl = locale === 'ar';
  const [role, setRole] = useState<'PRINCIPAL' | 'SALES_REP'>('PRINCIPAL');
  const [pipelineFilter, setPipelineFilter] = useState<'ALL' | 'APPROVED' | 'COMMITTEE' | 'SETTLED'>('ALL');
  const [feedbackMessage, setFeedbackMessageState] = useState<string | null>(null);
  // Preview module: feedback never claims an external action happened.
  const setFeedbackMessage = (message: string | null) => setFeedbackMessageState(previewSafeMessage(message));

  // Exception State Cures
  const [isCured, setIsCured] = useState(false);
  const [cureType, setCureType] = useState<'NONE' | 'EQUITY_30' | 'GUARANTOR_ESCROW'>('NONE');

  // Modals
  const [croModalOpen, setCroModalOpen] = useState(false);
  const [croJustification, setCroJustification] = useState('');
  const [croSignatory, setCroSignatory] = useState('Marc Ackermann (General Manager)');
  const [croSubmitted, setCroSubmitted] = useState(false);

  const [guarantorModalOpen, setGuarantorModalOpen] = useState(false);
  const [guarantorName, setGuarantorName] = useState('H.E. Sultan Bin Butti Al-Maktoum');
  const [guarantorType, setGuarantorType] = useState('Sovereign Wealth Asset Pledge');
  const [guarantorAttached, setGuarantorAttached] = useState(false);

  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [simulateModalOpen, setSimModalOpen] = useState(false);
  const [rateSheetModalOpen, setRateSheetModalOpen] = useState(false);
  const [exportLogModalOpen, setExportLogModalOpen] = useState(false);
  const [submitDossierModalOpen, setSubmitDossierModalOpen] = useState(false);
  const [selectedOfferModal, setSelectedOfferModal] = useState<string | null>(null);

  // Simulation Sliders
  const [simPrice, setSimPrice] = useState(1890000);
  const [simDownPct, setSimDownPct] = useState(30);
  const [simTenor, setSimTenor] = useState(60);

  useEffect(() => {
    fetchSubprimeDbrExceptionData().then(setData);
  }, []);

  // Curing calculations
  const currentDbr = isCured ? 48.2 : 58.4;
  const currentLtv = isCured ? 70.0 : 85.0;
  const currentDownPayment = isCured ? 567000 : 283500;
  const currentNetPrincipal = isCured ? 1323000 : 1606500;
  const currentMonthlyPayment = isCured ? 24980 : 30240;

  // Filter pipeline files
  const filteredPipeline = data.pipelineFiles.filter((file) => {
    if (pipelineFilter === 'ALL') return true;
    if (pipelineFilter === 'APPROVED') return file.underwritingStatus.toLowerCase().includes('sanction');
    if (pipelineFilter === 'COMMITTEE') return file.underwritingStatus.toLowerCase().includes('pending') || file.underwritingStatus.toLowerCase().includes('committee');
    if (pipelineFilter === 'SETTLED') return file.underwritingStatus.toLowerCase().includes('disbursed') || file.underwritingStatus.toLowerCase().includes('settle');
    return true;
  });

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
              <Link href="/finance" className="hover:text-primary transition-colors">
                {isRtl ? 'التمويل والتأمين' : 'Finance & Insurance'}
              </Link>
              <span>/</span>
              <span className="text-primary font-semibold">
                {isRtl ? 'استثناء نسبة عبء الدين (DBR) وتجميد الاكتتاب' : 'DBR Exception & Underwriting Hard-Lock'}
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
                    ? 'الدور: المدير العام (F&I Director)'
                    : 'Role: Dealer Principal (CRO Override)'
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

          {/* REGULATORY BREACH HARD-LOCK BANNER */}
          <div
            className={`p-space-md sm:p-space-lg rounded-xl border transition-colors ${
              isCured
                ? 'bg-tertiary/10 border-tertiary/30 text-tertiary'
                : 'bg-error-container/30 border-error/50 text-on-error-container'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span
                  className={`material-symbols-outlined text-[28px] mt-0.5 ${
                    isCured ? 'text-tertiary' : 'text-error animate-pulse'
                  }`}
                >
                  {isCured ? 'verified_user' : 'warning'}
                </span>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-label-caps font-bold tracking-wider px-2 py-0.5 rounded bg-surface-container text-on-surface uppercase">
                      [FUTURE ROADMAP • P1 SPECIFICATION — UNDERWRITING EXCEPTION DRILL-DOWN]
                    </span>
                    <span
                      className={`text-[11px] font-label-caps font-bold px-2 py-0.5 rounded uppercase ${
                        isCured ? 'bg-tertiary/20 text-tertiary' : 'bg-error/20 text-error'
                      }`}
                    >
                      {isCured
                        ? isRtl
                          ? 'تمت التسوية والتوافق مع المصرف المركزي'
                          : 'EXCEPTION RESOLVED • CBUAE COMPLIANT'
                        : isRtl
                          ? 'تحذير مخالفة تنظيمية: تعميم المصرف المركزي 29/2011'
                          : 'REGULATORY BREACH WARNING: CBUAE NOTICE NO. 29/2011'}
                    </span>
                  </div>
                  <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {isCured
                      ? isRtl
                        ? 'تم معالجة نسبة عبء الدين بنجاح — جاهز للتحويل المصرفي المباشر'
                        : 'Statutory DBR Cured to 48.2% — Automated Syndication Cleared'
                      : isRtl
                        ? 'تجاوز نسبة عبء الدين (DBR) الحد الأقصى الإلزامي 50.0% للمصرف المركزي'
                        : 'Applicant Debt Burden Ratio (DBR) exceeds CBUAE 50.0% Statutory Ceiling'}
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-4xl">
                    {isCured
                      ? isRtl
                        ? `تم تطبيق تسوية ${cureType === 'EQUITY_30' ? 'دفعة أولى 30%' : 'كفالة محفظة سيادية'}. انخفضت نسبة DBR إلى 48.2% وأصبح القرض متوافقاً مع ضوابط حماية المستهلك للمصرف المركزي.`
                        : `Exception cured via ${cureType === 'EQUITY_30' ? '30% Equity Injection (AED 567,000)' : 'Sovereign Custody Pledge'}. DBR reduced to 48.2%, unlocking Open Banking syndication gateways.`
                      : isRtl
                        ? 'تم تجميد التحويل المصرفي الآلي. يتطلب تحويل الملف موافقة استثنائية من المدير التنفيذي للمخاطر (CRO) أو إرفاق كفيل سيادي معتمد عبر الهوية الرقمية UAE PASS.'
                        : 'Automated syndication locked. Manual Sovereign Exception or Co-Signer Required. API State: breach-flagged-openfinance.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                <span className="font-data-mono-num text-[11px] px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface-variant">
                  API State: {isCured ? 'syndication-unlocked' : data.apiState}
                </span>
                {isCured && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCured(false);
                      setCureType('NONE');
                      setFeedbackMessage(
                        isRtl ? 'تمت إعادة ضبط حالة الملف إلى وضع المخالفة.' : 'Case reset to regulatory breach state.'
                      );
                    }}
                    className="text-[11px] text-error hover:underline cursor-pointer"
                  >
                    {isRtl ? 'إعادة ضبط المخالفة' : 'Revert to Breach State'}
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
                    ? 'جوهر الخدمات التمويلية والاكتتاب • مكتب المعاملات السيادية والخاصة'
                    : 'Financial Services & Underwriting Core • Sovereign & Private Desk'}
                </span>
              </div>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-3">
                <span>{isRtl ? 'إدارة التمويل والتأمين المصرفي' : 'F&I Referral & Lending Status Desk'}</span>
                <span className="text-body-sm font-normal text-on-surface-variant font-data-mono-num">
                  (S25 Underwriting Hard-Lock)
                </span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSimModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-surface-container border border-outline-variant hover:border-primary text-on-surface font-body-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
                <span>{isRtl ? 'محاكاة شروط التمويل' : 'Simulate Financing Terms'}</span>
              </button>

              <button
                type="button"
                onClick={() => setRateSheetModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-surface-container border border-outline-variant hover:border-primary text-on-surface font-body-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">table_chart</span>
                <span>{isRtl ? 'جدول أسعار البنوك (Q4)' : 'Rate Sheet Matrix (Q4)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setExportLogModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-surface-container border border-outline-variant hover:border-primary text-on-surface font-body-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>{isRtl ? 'تصدير سجل الامتثال' : 'Export Compliance Log'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isCured && role !== 'PRINCIPAL') {
                    setFeedbackMessage(
                      isRtl
                        ? 'محظور: التحويل المصرفي الآلي مجمد بسبب تجاوز DBR. يتطلب موافقة CRO.'
                        : 'Blocked: Automated banking submission locked due to statutory DBR breach. CRO override required.'
                    );
                  } else {
                    setSubmitDossierModalOpen(true);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-body-sm font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  isCured
                    ? 'bg-primary text-on-primary hover:bg-primary-fixed-dim'
                    : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/50 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>{isRtl ? 'إرسال الملف المصرفي' : 'Submit Bank Dossier'}</span>
              </button>
            </div>
          </div>

          {/* 4 SUMMARY STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {/* 1. Financed Pipeline */}
            <div className="rounded-xl bg-surface-container-low p-space-md border border-outline-variant/30 shadow-sm">
              <div className="flex items-center justify-between text-on-surface-variant mb-2 font-label-caps text-[11px] uppercase tracking-wider">
                <span>{isRtl ? 'خط التمويل قيد التنفيذ (الربع الحالي)' : 'Financed Pipeline (QTD)'}</span>
                <span className="material-symbols-outlined text-[18px] text-primary">account_balance_wallet</span>
              </div>
              <div className="font-headline-sm text-headline-sm font-bold text-on-surface font-data-mono-num">
                AED {data.summary.financedPipelineQtdAed.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-2 text-[12px] text-on-surface-variant">
                <span>{data.summary.inFlightFilesCount} {isRtl ? 'ملفاً قيد المعالجة' : 'In-Flight Files'}</span>
                <span className="text-tertiary flex items-center gap-0.5 font-data-mono-num font-semibold">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                  +{data.summary.momGrowthPct}% MoM
                </span>
              </div>
            </div>

            {/* 2. Avg Approval SLA */}
            <div className="rounded-xl bg-surface-container-low p-space-md border border-outline-variant/30 shadow-sm">
              <div className="flex items-center justify-between text-on-surface-variant mb-2 font-label-caps text-[11px] uppercase tracking-wider">
                <span>{isRtl ? 'متوسط وقت الموافقة (SLA)' : 'Avg Approval SLA'}</span>
                <span className="material-symbols-outlined text-[18px] text-secondary">timer</span>
              </div>
              <div className="font-headline-sm text-headline-sm font-bold text-on-surface font-data-mono-num">
                {data.summary.avgApprovalHours} {isRtl ? 'ساعات' : 'Hours'}
              </div>
              <div className="flex items-center justify-between mt-2 text-[12px] text-on-surface-variant">
                <span>{isRtl ? 'المعيار المرجعي: 24 ساعة' : `Benchmark: ${data.summary.avgBenchmarkHours}.0h`}</span>
                <span className="text-tertiary font-data-mono-num font-semibold">
                  {data.summary.slaAdvantagePct}% {isRtl ? 'أسرع من المتوسط' : 'Faster than Avg'}
                </span>
              </div>
            </div>

            {/* 3. Projected Dealer Yield */}
            <div className="rounded-xl bg-surface-container-low p-space-md border border-outline-variant/30 shadow-sm">
              <div className="flex items-center justify-between text-on-surface-variant mb-2 font-label-caps text-[11px] uppercase tracking-wider">
                <span>{isRtl ? 'عائد الوكالة المتوقع (F&I)' : 'Projected Dealer F&I Yield'}</span>
                <span className="material-symbols-outlined text-[18px] text-primary">monetization_on</span>
              </div>
              <div className="font-headline-sm text-headline-sm font-bold text-on-surface font-data-mono-num">
                {role === 'SALES_REP' ? '••••••' : `AED ${data.summary.projectedDealerYieldAed.toLocaleString()}`}
              </div>
              <div className="flex items-center justify-between mt-2 text-[12px] text-on-surface-variant">
                <span>{isRtl ? 'شامل العمولات المباشرة والتأمين' : 'Front + Back-end'}</span>
                <span className="text-primary font-data-mono-num font-semibold">
                  {role === 'SALES_REP' ? '•••' : `${data.summary.overallYieldPct}% Overall Yield`}
                </span>
              </div>
            </div>

            {/* 4. CBUAE LTV Compliance */}
            <div
              className={`rounded-xl p-space-md border shadow-sm ${
                isCured
                  ? 'bg-tertiary/10 border-tertiary/30'
                  : 'bg-error-container/20 border-error/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2 font-label-caps text-[11px] uppercase tracking-wider">
                <span className={isCured ? 'text-tertiary' : 'text-error'}>
                  {isRtl ? 'الامتثال لنسبة التمويل للقيمة (LTV)' : 'CBUAE LTV Compliance'}
                </span>
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isCured ? 'text-tertiary' : 'text-error'
                  }`}
                >
                  {isCured ? 'gpp_good' : 'gpp_bad'}
                </span>
              </div>
              <div
                className={`font-headline-sm text-headline-sm font-bold font-data-mono-num ${
                  isCured ? 'text-tertiary' : 'text-error'
                }`}
              >
                {currentLtv.toFixed(1)}% {isCured ? 'Compliant' : 'Breach (> 80%)'}
              </div>
              <div className="flex items-center justify-between mt-2 text-[12px] text-on-surface-variant">
                <span>{isCured ? '30% Equity (Req: 20%)' : '15% Equity (Req: 20%)'}</span>
                <span
                  className={`font-data-mono-num font-semibold ${
                    isCured ? 'text-tertiary' : 'text-error'
                  }`}
                >
                  {isCured ? (isRtl ? '0 مخالفات' : '0 Statutory Breaches') : (isRtl ? '1 مخالفة نظامية' : '1 Statutory Breach')}
                </span>
              </div>
            </div>
          </div>

          {/* MAIN TWO-COLUMN WORKSPACE: 8 cols vs 4 cols */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            {/* LEFT COLUMN: 8 of 12 cols */}
            <div className="lg:col-span-8 flex flex-col gap-space-lg">
              {/* 1. ACTIVE DOSSIER SPOTLIGHT */}
              <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/30 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-error/15 text-error font-data-mono-num text-body-sm font-semibold">
                      CASE {data.caseNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-label-caps text-[11px] uppercase flex items-center gap-1 ${
                        isCured
                          ? 'bg-tertiary/15 text-tertiary font-bold'
                          : 'bg-error/15 text-error font-bold'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isCured ? 'bg-tertiary' : 'bg-error animate-pulse'
                        }`}
                      ></span>
                      {isCured
                        ? isRtl
                          ? 'تم فك التجميد وتجهيز الإرسال'
                          : 'Syndication Unlocked'
                        : isRtl
                          ? 'تجميد التحويل الآلي'
                          : 'Automated Syndication Locked'}
                    </span>
                    <span className="font-label-caps text-[11px] text-on-surface-variant font-mono">
                      {data.stockNumber}
                    </span>
                  </div>
                  <span className="font-body-sm text-[12px] text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {isRtl ? 'تم الرصد قبل 28 دقيقة' : `Flagged ${data.flaggedTimeAgo}`}
                  </span>
                </div>

                {/* Vehicle & Applicant Banner Card */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md p-space-md rounded-xl bg-surface-container mb-space-md border border-outline-variant/20">
                  <div className="md:col-span-4 relative rounded-lg overflow-hidden h-40 md:h-full min-h-[140px] bg-surface-container-highest">
                    <img
                      src={data.vehicle.imageUrl}
                      alt={data.vehicle.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface/80 backdrop-blur-sm text-[10px] font-label-caps font-bold text-on-surface">
                      VIN: {data.vehicle.vin}
                    </div>
                  </div>

                  <div className="md:col-span-8 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-label-caps uppercase text-error font-bold">
                          {isRtl ? 'ملف عالي المخاطر / نسبة عبء دين مرتفعة' : 'Subprime / High DBR Risk File'}
                        </span>
                        <span className="font-data-mono-num text-[11px] text-on-surface-variant">
                          VIN: {data.vehicle.vin}
                        </span>
                      </div>
                      <h3 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight mt-0.5">
                        {isRtl ? data.vehicle.titleAr : data.vehicle.title}
                      </h3>
                      <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">
                        {data.vehicle.specs}
                      </p>
                    </div>

                    {/* Applicant Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-outline-variant/20 text-[12px]">
                      <div>
                        <div className="text-on-surface-variant font-label-caps text-[10px] uppercase">
                          {isRtl ? 'اسم العميل' : 'Applicant'}
                        </div>
                        <div className="font-semibold text-on-surface flex items-center gap-1">
                          <span>{isRtl ? data.applicant.nameAr : data.applicant.name}</span>
                          <span className="material-symbols-outlined text-[14px] text-secondary" title="UAE PASS Verified">
                            verified
                          </span>
                        </div>
                        <div className="text-[10px] text-on-surface-variant truncate">{data.applicant.affiliation}</div>
                      </div>

                      <div>
                        <div className="text-on-surface-variant font-label-caps text-[10px] uppercase">
                          {isRtl ? 'التقييم الائتماني (AECB)' : 'AECB Score'}
                        </div>
                        <div className="font-semibold text-error font-data-mono-num flex items-center gap-1">
                          <span>{data.applicant.aecbScore}</span>
                          <span className="text-[10px] font-normal px-1 rounded bg-error/15 text-error">
                            {data.applicant.riskTier}
                          </span>
                        </div>
                        <div className="text-[10px] text-on-surface-variant">
                          {role === 'SALES_REP' ? '••••••' : `Liab: AED ${data.applicant.monthlyLiabilitiesAed.toLocaleString()}`}
                        </div>
                      </div>

                      <div>
                        <div className="text-on-surface-variant font-label-caps text-[10px] uppercase">
                          {isRtl ? 'سعر المركبة بالفاتورة' : 'Invoice Price'}
                        </div>
                        <div className="font-semibold text-on-surface font-data-mono-num">
                          AED {data.vehicle.invoicePriceAed.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-on-surface-variant">
                          {isRtl ? 'صافي التمويل' : 'Net Financed'}: AED {currentNetPrincipal.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <div className="text-on-surface-variant font-label-caps text-[10px] uppercase">
                          {isRtl ? 'الدفعة الأولى النقدية' : 'Down Payment'}
                        </div>
                        <div
                          className={`font-semibold font-data-mono-num ${
                            isCured ? 'text-tertiary' : 'text-error'
                          }`}
                        >
                          AED {currentDownPayment.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-on-surface-variant">
                          {isCured ? '30.0% (Cured)' : '15.0% (Min 20%)'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. BANK SYNDICATION & APPROVAL MATRIX */}
              <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
                      <span>{isRtl ? 'مصفوفة العروض البنكية والاكتتاب المشترك' : 'Bank Syndication & Approval Matrix'}</span>
                    </h3>
                    <p className="font-body-sm text-[12px] text-on-surface-variant">
                      {isRtl
                        ? 'محرك تحويل القروض الآلي متعدد البنوك متصل عبر بوابة المصرف المفتوح (4 بنوك تم استطلاعها)'
                        : 'Multi-lender automated loan syndication engine connected via UAE Open Banking Gateway (4 Lenders Polled)'}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-label-caps font-bold uppercase bg-surface-container border border-outline-variant text-on-surface-variant">
                    {isRtl ? '4 جهات تمويل' : '4 Lenders Polled'}
                  </span>
                </div>

                {/* Bank Offers Table */}
                <div className="overflow-x-auto rounded-lg border border-outline-variant/20">
                  <table className="w-full text-left font-body-sm text-[13px] border-collapse">
                    <thead>
                      <tr className="bg-surface-container text-on-surface-variant font-label-caps text-[11px] uppercase border-b border-outline-variant/30">
                        <th className="py-2.5 px-3">{isRtl ? 'المؤسسة المالية' : 'Lending Institution'}</th>
                        <th className="py-2.5 px-3">{isRtl ? 'الحالة والقرار' : 'Status & Decision'}</th>
                        <th className="py-2.5 px-3">{isRtl ? 'نسبة الفائدة / المرابحة' : 'Profit / Interest Rate'}</th>
                        <th className="py-2.5 px-3">{isRtl ? 'عائد الوكالة (Reserve)' : 'Dealer Reserve Yield'}</th>
                        <th className="py-2.5 px-3">{isRtl ? 'الشروط الخاصة' : 'Special Conditions'}</th>
                        <th className="py-2.5 px-3 text-right">{isRtl ? 'الإجراء' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15">
                      {data.lenders.map((lender) => {
                        const isDib = lender.bankCode === 'DIB';
                        const isEnbd = lender.bankCode === 'ENBD';
                        const isFab = lender.bankCode === 'FAB';
                        const isAdcb = lender.bankCode === 'ADCB';

                        let displayStatus = lender.statusLabel;
                        let badgeClass = 'bg-error/15 text-error border border-error/30';

                        if (isEnbd || isFab) {
                          badgeClass = 'bg-error/15 text-error border border-error/30';
                        } else if (isDib) {
                          badgeClass = isCured
                            ? 'bg-tertiary/15 text-tertiary border border-tertiary/30'
                            : 'bg-primary/15 text-primary border border-primary/30';
                          displayStatus = isCured ? 'APPROVED (MURABAHA READY)' : lender.statusLabel;
                        } else if (isAdcb) {
                          badgeClass = guarantorAttached
                            ? 'bg-tertiary/15 text-tertiary border border-tertiary/30'
                            : 'bg-secondary/15 text-secondary border border-secondary/30';
                          displayStatus = guarantorAttached ? 'APPROVED (PLEDGE BOUND)' : lender.statusLabel;
                        }

                        return (
                          <tr
                            key={lender.id}
                            className="hover:bg-surface-container-highest/30 transition-colors"
                          >
                            <td className="py-3 px-3">
                              <div className="font-semibold text-on-surface flex items-center gap-1.5">
                                <span className="font-mono text-primary font-bold text-[12px]">{lender.bankCode}</span>
                                <span>{lender.bankName}</span>
                              </div>
                              <div className="text-[11px] text-on-surface-variant">{lender.deskName}</div>
                            </td>

                            <td className="py-3 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-label-caps font-bold uppercase ${badgeClass}`}>
                                {displayStatus}
                              </span>
                              <div className="text-[11px] text-on-surface-variant mt-0.5 font-mono">
                                {lender.statusDescription}
                              </div>
                            </td>

                            <td className="py-3 px-3 font-data-mono-num font-semibold text-on-surface">
                              {lender.profitRateDisplay}
                            </td>

                            <td className="py-3 px-3 font-data-mono-num">
                              {role === 'SALES_REP' ? (
                                <span className="text-on-surface-variant">••••••</span>
                              ) : (
                                <span className={lender.dealerReserveAed > 0 ? 'text-primary font-bold' : 'text-on-surface-variant line-through'}>
                                  {lender.dealerReserveDisplay}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-[12px] text-on-surface-variant max-w-[220px]">
                              {lender.specialCondition}
                            </td>

                            <td className="py-3 px-3 text-right">
                              {isDib && (
                                <button
                                  type="button"
                                  onClick={() => setStructureModalOpen(true)}
                                  className={`px-2.5 py-1 rounded text-[11px] font-label-caps font-bold uppercase transition-colors cursor-pointer ${
                                    isCured
                                      ? 'bg-tertiary text-on-tertiary'
                                      : 'bg-primary text-on-primary hover:bg-primary-fixed-dim'
                                  }`}
                                >
                                  {isCured ? (isRtl ? 'تمت الهيكلة' : 'Structured') : lender.actionLabel}
                                </button>
                              )}

                              {isAdcb && (
                                <button
                                  type="button"
                                  onClick={() => setGuarantorModalOpen(true)}
                                  className="px-2.5 py-1 rounded text-[11px] font-label-caps font-bold uppercase bg-secondary text-on-secondary hover:bg-secondary-fixed transition-colors cursor-pointer"
                                >
                                  {guarantorAttached ? (isRtl ? 'تمت الكفالة' : 'Pledged') : lender.actionLabel}
                                </button>
                              )}

                              {(isEnbd || isFab) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOfferModal(lender.id);
                                  }}
                                  className="px-2.5 py-1 rounded text-[11px] font-label-caps font-bold uppercase bg-surface-container text-on-surface-variant border border-outline-variant hover:text-on-surface cursor-pointer"
                                >
                                  {lender.actionLabel}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. INSURANCE UNDERWRITING & SUPERCAR RIDER MATRIX */}
              <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">shield</span>
                      <span>{isRtl ? 'اكتتاب التأمين ومصفوفة ملحقات السيارات الفارهة' : 'Insurance Underwriting & Supercar Rider Matrix'}</span>
                    </h3>
                    <p className="font-body-sm text-[12px] text-on-surface-variant">
                      {data.insurance.carrierName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-data-mono-num text-[12px] px-2 py-0.5 rounded bg-surface-container border border-outline-variant text-primary font-semibold">
                      {role === 'SALES_REP' ? '••••••' : `+AED ${data.insurance.brokeragePayoutAed.toLocaleString()} Inward Share (15%)`}
                    </span>
                  </div>
                </div>

                {/* Insurance Summary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm p-space-sm rounded-lg bg-surface-container border border-outline-variant/20">
                  <div>
                    <div className="text-[10px] font-label-caps uppercase text-on-surface-variant">
                      {isRtl ? 'القيمة المتفق عليها' : 'Agreed Valuation'}
                    </div>
                    <div className="font-data-mono-num font-bold text-on-surface">
                      AED {data.insurance.agreedValuationAed.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-label-caps uppercase text-on-surface-variant">
                      {isRtl ? 'معامل القسط السنوي' : 'Rate Factor'}
                    </div>
                    <div className="font-data-mono-num font-bold text-secondary">
                      {data.insurance.rateFactorPct.toFixed(2)}% Premium
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-label-caps uppercase text-on-surface-variant">
                      {isRtl ? 'إجمالي القسط السنوي' : 'Total Annual Premium'}
                    </div>
                    <div className="font-data-mono-num font-bold text-on-surface">
                      AED {data.insurance.annualPremiumAed.toLocaleString()} / yr
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-label-caps uppercase text-on-surface-variant">
                      {isRtl ? 'حصة الوكالة' : 'Dealership Share'}
                    </div>
                    <div className="font-data-mono-num font-bold text-primary">
                      {role === 'SALES_REP' ? '••••••' : `AED ${data.insurance.brokeragePayoutAed.toLocaleString()}`}
                    </div>
                  </div>
                </div>

                {/* 4 Endorsement Riders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-2">
                  {data.insurance.endorsements.map((end) => (
                    <div
                      key={end.id}
                      className="p-3 rounded-lg bg-surface-container border border-outline-variant/20 flex items-start gap-3"
                    >
                      <span className="material-symbols-outlined text-[20px] text-primary mt-0.5">
                        {end.icon}
                      </span>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-on-surface text-[13px] flex items-center gap-1.5">
                          <span>{end.title}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-label-caps font-bold bg-tertiary/15 text-tertiary uppercase">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant leading-tight">
                          {end.subtitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: 4 of 12 cols */}
            <div className="lg:col-span-4 flex flex-col gap-space-lg">
              {/* 1. CBUAE REGULATORY GUARDRAILS CARD */}
              <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-[22px] ${
                        isCured ? 'text-tertiary' : 'text-error'
                      }`}
                    >
                      gavel
                    </span>
                    <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      {isRtl ? 'ضوابط المصرف المركزي (CBUAE)' : 'CBUAE Guardrails'}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-label-caps font-bold uppercase ${
                      isCured ? 'bg-tertiary/15 text-tertiary' : 'bg-error/15 text-error'
                    }`}
                  >
                    {isCured ? (isRtl ? 'متوافق نظامياً' : 'COMPLIANT') : (isRtl ? 'مخالف للشروط' : 'NON-COMPLIANT')}
                  </span>
                </div>

                {/* DBR Progress Box */}
                <div
                  className={`p-space-md rounded-xl border ${
                    isCured
                      ? 'bg-tertiary/10 border-tertiary/20'
                      : 'bg-error/10 border-error/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`font-body-sm font-semibold ${
                        isCured ? 'text-tertiary' : 'text-error'
                      }`}
                    >
                      {isRtl ? 'نسبة عبء الدين (DBR)' : 'Debt Burden Ratio (DBR)'}
                    </span>
                    <span
                      className={`font-data-mono-num text-headline-sm font-bold ${
                        isCured ? 'text-tertiary' : 'text-error'
                      }`}
                    >
                      {currentDbr.toFixed(1)}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCured ? 'bg-tertiary' : 'bg-error'
                      }`}
                      style={{ width: `${Math.min(currentDbr * 1.5, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between font-label-caps text-[11px]">
                    <span className={isCured ? 'text-tertiary' : 'text-error'}>
                      {isCured
                        ? isRtl
                          ? 'ضمن السقف القانوني (-1.8%)'
                          : 'Within Ceiling (-1.8%)'
                        : isRtl
                          ? 'تجاوز: +8.4% فوق السقف'
                          : 'Breach: +8.4% Over Ceiling'}
                    </span>
                    <span className="text-on-surface-variant">
                      {isRtl ? 'الحد الأقصى للمصرف: 50.0%' : 'CBUAE Statutory Max: 50.0%'}
                    </span>
                  </div>
                </div>

                {/* LTV & Tenor Status */}
                <div className="space-y-2 text-[12px]">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container border border-outline-variant/20">
                    <span className="text-on-surface-variant font-medium">
                      {isRtl ? 'نسبة القرض إلى القيمة (LTV)' : 'Loan-To-Value (LTV)'}
                    </span>
                    <div className="text-right">
                      <span
                        className={`font-data-mono-num font-bold ${
                          currentLtv <= 80 ? 'text-tertiary' : 'text-error'
                        }`}
                      >
                        {currentLtv.toFixed(1)}%
                      </span>
                      <span className="text-on-surface-variant text-[11px] block">
                        {isRtl ? 'الحد الأقصى (فوق مليون): 80.0%' : 'Cap: 80.0% (AED > 1M)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container border border-outline-variant/20">
                    <span className="text-on-surface-variant font-medium">
                      {isRtl ? 'مدة التمويل (الأشهر)' : 'Tenor Window'}
                    </span>
                    <div className="text-right">
                      <span className="font-data-mono-num font-bold text-on-surface">60 / 60m</span>
                      <span className="text-on-surface-variant text-[11px] block">
                        {isRtl ? 'أقصى مدة نظامية' : 'Max Allowed Tenor'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Policy Regulation Callout */}
                <div
                  className={`p-3 rounded-lg border text-[12px] space-y-1 ${
                    isCured
                      ? 'bg-tertiary/10 border-tertiary/30 text-tertiary'
                      : 'bg-surface-container border-error/30 text-on-surface-variant'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-label-caps font-bold text-[11px] uppercase">
                    <span className="material-symbols-outlined text-[16px] text-error">policy</span>
                    <span className={isCured ? 'text-tertiary' : 'text-error'}>
                      {isCured
                        ? isRtl
                          ? 'مستوفى لمعايير نظام 29/2011'
                          : 'COMPLIANT UNDER REGULATION 29/2011'
                        : isRtl
                          ? 'غير متوافق وفق نظام رقم 29/2011'
                          : 'NON-COMPLIANT UNDER REGULATION 29/2011'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {isCured
                      ? isRtl
                        ? 'تم خفض القسط الشهري إلى 24,980 درهماً مما يشكل 48.2% من الدخل المثبت، وهو أقل من السقف الإلزامي 50%.'
                        : 'Monthly debt reduced to AED 24,980, representing 48.2% of attested salary. Automatic Open Banking referral cleared.'
                      : isRtl
                        ? data.guardrails.regulationNoticeAr
                        : data.guardrails.regulationNoticeEn}
                  </p>
                </div>
              </div>

              {/* 2. RESTRUCTURE & EXCEPTION DESK CARD */}
              <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">tune</span>
                    <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      {isRtl ? 'مكتب إعادة الهيكلة والاستثناءات' : 'Restructure & Exception Desk'}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-label-caps font-bold uppercase bg-surface-container border border-outline-variant text-on-surface-variant">
                    {isRtl ? 'معالجة فورية' : 'Breach State'}
                  </span>
                </div>

                {/* Recommended Cure Path Callout */}
                <div className="p-space-md rounded-xl bg-surface-container border border-primary/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-label-caps uppercase text-primary font-bold">
                      {isRtl ? 'المسار الموصى به للعلاج' : 'Recommended Cure Path'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary font-data-mono-num text-[10px] font-bold">
                      {data.restructure.recommendedCurePath}
                    </span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    {isRtl
                      ? 'زيادة الدفعة الأولى إلى 567,000 درهم يخفض مبلغ التمويل إلى 1,323,000 درهم ويهبط بنسبة DBR إلى 48.2% (تحت سقف الـ 50% الإلزامي).'
                      : data.restructure.optionADesc}
                  </p>

                  {/* Cure Option Buttons */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCured(true);
                        setCureType('EQUITY_30');
                        setFeedbackMessage(
                          isRtl
                            ? 'تم تطبيق هيكلة دفعة 30% بنجاح. انخفض DBR إلى 48.2% وأصبح الملف متوافقاً مع ضوابط المصرف المركزي!'
                            : 'Successfully applied 30% Down Payment restructure. DBR cured to 48.2% and automated syndication is unlocked!'
                        );
                      }}
                      className={`w-full py-2 px-3 rounded-lg text-[12px] font-semibold flex items-center justify-between transition-all cursor-pointer border ${
                        cureType === 'EQUITY_30'
                          ? 'bg-tertiary text-on-tertiary border-tertiary'
                          : 'bg-primary/10 hover:bg-primary/20 border-primary/40 text-primary'
                      }`}
                    >
                      <span>{isRtl ? 'الخيار (أ): هيكلة دفعة أولى 30%' : 'Option A: Structure 30% Down'}</span>
                      <span className="font-label-caps text-[10px] font-bold uppercase">
                        {cureType === 'EQUITY_30' ? (isRtl ? 'مطبق حالياً' : 'Active / Cured') : (isRtl ? 'يعالج DBR' : 'Cures DBR')}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGuarantorModalOpen(true)}
                      className={`w-full py-2 px-3 rounded-lg text-[12px] font-semibold flex items-center justify-between transition-all cursor-pointer border ${
                        cureType === 'GUARANTOR_ESCROW'
                          ? 'bg-tertiary text-on-tertiary border-tertiary'
                          : 'bg-surface-container-highest hover:bg-surface-container-highest/80 border-outline-variant text-on-surface'
                      }`}
                    >
                      <span>{isRtl ? 'الخيار (ب): كفيل ثروات سيادية' : 'Option B: Sovereign Wealth Guarantor'}</span>
                      <span className="font-label-caps text-[10px] font-bold uppercase text-secondary">
                        {cureType === 'GUARANTOR_ESCROW' ? (isRtl ? 'مطبق حالياً' : 'Active / Cured') : (isRtl ? 'استثناء DBR' : 'Exempts DBR')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Financial Impact Comparison */}
                <div className="space-y-2 text-[12px]">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container border border-outline-variant/20">
                    <span className="text-on-surface-variant font-medium">
                      {isRtl ? 'القسط الشهري المتوقع' : 'Projected Payment at 85% LTV'}
                    </span>
                    <div className="text-right">
                      <span className="font-data-mono-num font-bold text-on-surface">
                        AED {currentMonthlyPayment.toLocaleString()} / mo
                      </span>
                      <span className="text-error text-[10px] block">
                        {isCured ? (isRtl ? 'ضمن النطاق المالي المتاح' : 'Within disposable surplus') : (isRtl ? 'يتجاوز الحد المتاح بـ 13,240 درهم' : 'Exceeds disposable limit by AED 13,240')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container border border-outline-variant/20">
                    <span className="text-on-surface-variant font-medium">
                      {isRtl ? 'عائد الوكالة المحتمل (في حال التسوية)' : 'Potential Reserve Yield (If Cured)'}
                    </span>
                    <div className="text-right">
                      <span className="font-data-mono-num font-bold text-primary">
                        {role === 'SALES_REP' ? '••••••' : `AED ${data.restructure.potentialReserveYieldAed.toLocaleString()}`}
                      </span>
                      <span className="text-on-surface-variant text-[10px] block">
                        {isRtl ? 'تنفيذ دبي الإسلامي أو أبوظبي التجاري' : 'Subject to DIB or ADCB execution'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Escalation & Override Actions */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => setCroModalOpen(true)}
                    disabled={role === 'SALES_REP'}
                    className={`w-full py-2.5 px-4 rounded-lg font-body-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === 'SALES_REP'
                        ? 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-60'
                        : 'bg-primary text-on-primary hover:bg-primary-fixed-dim shadow-md'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">security</span>
                    <span>
                      {role === 'SALES_REP'
                        ? isRtl
                          ? 'مطلوب صلاحية المدير العام (F&I Director)'
                          : 'CRO Escalation (Restricted to Principal)'
                        : isRtl
                          ? 'تصعيد لطلب استثناء المدير التنفيذي للمخاطر (CRO)'
                          : 'Escalate to Chief Risk Officer (CRO) Review'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGuarantorModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-lg bg-surface-container border border-outline-variant hover:border-primary text-on-surface font-body-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">verified_user</span>
                    <span>
                      {guarantorAttached
                        ? isRtl
                          ? 'تم إرفاق الكفيل السيادي (عرض الملف)'
                          : 'Sovereign Dossier Attached (View)'
                        : isRtl
                          ? 'إرفاق كفيل معتمد / ملف الثروات السيادية'
                          : 'Attach Co-Signer / Sovereign Wealth Dossier'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* FULL PIPELINE TABLE */}
          <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {isRtl ? 'محفظة التمويل والتأمين النشطة بالمعرض' : 'Active Dealer F&I Loan & Insurance Pipeline'}
                </h3>
                <p className="font-body-sm text-[12px] text-on-surface-variant">
                  {isRtl
                    ? 'ملفات التمويل قيد التنفيذ للعملاء عبر دبي وأبوظبي والإمارات الشمالية'
                    : 'In-flight customer financing files across Dubai, Abu Dhabi, and Northern Emirates locations'}
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setPipelineFilter('ALL')}
                  className={`px-3 py-1 rounded text-[11px] font-label-caps font-medium transition-colors cursor-pointer ${
                    pipelineFilter === 'ALL'
                      ? 'bg-surface-container-highest text-primary font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {isRtl ? 'جميع الملفات (18)' : 'All Bank Files (18)'}
                </button>
                <button
                  type="button"
                  onClick={() => setPipelineFilter('APPROVED')}
                  className={`px-3 py-1 rounded text-[11px] font-label-caps font-medium transition-colors cursor-pointer ${
                    pipelineFilter === 'APPROVED'
                      ? 'bg-surface-container-highest text-tertiary font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {isRtl ? 'معتمدة / جاهزة (8)' : 'Approved / Sanction Ready (8)'}
                </button>
                <button
                  type="button"
                  onClick={() => setPipelineFilter('COMMITTEE')}
                  className={`px-3 py-1 rounded text-[11px] font-label-caps font-medium transition-colors cursor-pointer ${
                    pipelineFilter === 'COMMITTEE'
                      ? 'bg-surface-container-highest text-secondary font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {isRtl ? 'مراجعة اللجنة (6)' : 'Committee Review (6)'}
                </button>
                <button
                  type="button"
                  onClick={() => setPipelineFilter('SETTLED')}
                  className={`px-3 py-1 rounded text-[11px] font-label-caps font-medium transition-colors cursor-pointer ${
                    pipelineFilter === 'SETTLED'
                      ? 'bg-surface-container-highest text-on-surface font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {isRtl ? 'تم الصرف (4)' : 'Settled / Funded (4)'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-outline-variant/20">
              <table className="w-full text-left font-body-sm text-[13px] border-collapse">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant font-label-caps text-[11px] uppercase border-b border-outline-variant/30">
                    <th className="py-2.5 px-3">{isRtl ? 'رقم الملف والمركبة' : 'File Ref & Vehicle'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'العميل / الكفيل' : 'Customer / Sponsor'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'سعر الفاتورة' : 'Invoice Value'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'المبلغ الممول' : 'Financed Amt'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'البنك والمنتج' : 'Lender & Product'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'حالة الاكتتاب' : 'Underwriting Status'}</th>
                    <th className="py-2.5 px-3">{isRtl ? 'عائد المعرض' : 'Dealer Reserve'}</th>
                    <th className="py-2.5 px-3 text-right">{isRtl ? 'الإجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {filteredPipeline.map((file) => (
                    <tr key={file.id} className="hover:bg-surface-container-highest/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-on-surface flex items-center gap-1.5 font-data-mono-num">
                          <span className="text-primary">{file.fileRef}</span>
                          <span>{file.vehicleTitle}</span>
                        </div>
                        <div className="text-[11px] text-on-surface-variant">{file.vehicleSpecs}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-on-surface flex items-center gap-1">
                          <span>{file.customerName}</span>
                          <span className="material-symbols-outlined text-[13px] text-secondary">verified</span>
                        </div>
                        <div className="text-[11px] text-on-surface-variant">{file.customerTier}</div>
                      </td>

                      <td className="py-3 px-3 font-data-mono-num text-on-surface font-semibold">
                        AED {file.invoiceValueAed.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 font-data-mono-num text-on-surface">
                        AED {file.financedAmtAed.toLocaleString()}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-on-surface">{file.lenderName}</div>
                        <div className="text-[11px] text-on-surface-variant">{file.productTerms}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-label-caps font-bold uppercase ${file.statusBadgeClass}`}>
                          {file.underwritingStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-data-mono-num">
                        {role === 'SALES_REP' ? (
                          <span className="text-on-surface-variant">••••••</span>
                        ) : (
                          <span className="text-primary font-bold">
                            AED {file.dealerReserveAed.toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setFeedbackMessage(
                              isRtl
                                ? `تم استعراض تفاصيل ملف التمويل: ${file.fileRef}`
                                : `Opening dossier details for ${file.fileRef}`
                            );
                          }}
                          className="px-2 py-1 rounded text-[11px] font-label-caps bg-surface-container hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-outline-variant/40 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px] align-middle">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOTTOM INTERACTIVE STATE DEMONSTRATOR DOCK */}
          <div className="rounded-xl bg-surface-container-high p-space-md shadow-md flex flex-col md:flex-row items-center justify-between gap-space-md border border-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">preview</span>
              </div>
              <div>
                <div className="font-label-caps text-[11px] font-bold uppercase text-primary">
                  {isRtl ? 'محاكي الحالات التفاعلي' : 'Interactive State Demonstrator'}
                </div>
                <div className="text-[12px] text-on-surface-variant">
                  {isRtl
                    ? 'محاكاة حالات النظام للعرض على الجهات التنظيمية والمصرف المركزي:'
                    : 'Simulate prototype states for stakeholder presentation and UAE Central Bank regulatory review:'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/finance"
                className="px-3 py-1.5 rounded-lg font-body-sm text-[12px] font-medium bg-surface-container text-on-surface-variant hover:bg-surface-container-highest border border-outline-variant/30 transition-colors"
              >
                {isRtl ? 'التمويل المعتمد (GT3 RS)' : 'Approved Syndication (GT3 RS)'}
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsCured(false);
                  setCureType('NONE');
                  setFeedbackMessage(
                    isRtl
                      ? 'تنبيه تنظيمي: نسبة DBR تتجاوز 50.0%. تم تجميد التحويل الآلي وفق ضوابط S25.'
                      : 'Regulatory Alert: DBR exceeds 50.0% statutory threshold. Automatic banking referral hard-locked per S25 exception rules.'
                  );
                }}
                className="px-3 py-1.5 rounded-lg font-body-sm text-[12px] font-bold bg-error-container text-on-error-container transition-colors cursor-pointer shadow-sm"
              >
                {isRtl ? 'تحذير تجاوز DBR (الحالي S25)' : 'High DBR / Subprime Warning'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCured(true);
                  setCureType('EQUITY_30');
                  setFeedbackMessage(
                    isRtl
                      ? 'تم تنشيط عقد المرابحة الإسلامية: موافقة بنك دبي الإسلامي المسبقة جاهزة.'
                      : 'Islamic Auto Murabaha Contract loaded with DIB Sharia Shurah pre-clearance.'
                  );
                }}
                className="px-3 py-1.5 rounded-lg font-body-sm text-[12px] font-medium bg-surface-container text-on-surface-variant hover:bg-surface-container-highest border border-outline-variant/30 transition-colors cursor-pointer"
              >
                {isRtl ? 'عقد المرابحة الإسلامية' : 'Islamic Murabaha Contract State'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedbackMessage(
                    isRtl
                      ? 'ملحق التأمين: تغطية حلبة دبي أوتودروم معتمدة وفق اشتراطات الاتحاد الدولي للسيارات.'
                      : 'Insurance Rider: Dubai Autodrome track day cover validated for FIA sanctioned events.'
                  );
                }}
                className="px-3 py-1.5 rounded-lg font-body-sm text-[12px] font-medium bg-surface-container text-on-surface-variant hover:bg-surface-container-highest border border-outline-variant/30 transition-colors cursor-pointer"
              >
                {isRtl ? 'استثناء وثيقة التأمين' : 'Insurance Claim Exception'}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. CRO ESCALATION MODAL */}
      {croModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">security</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {isRtl ? 'طلب استثناء من المدير التنفيذي للمخاطر (CRO)' : 'Chief Risk Officer (CRO) Override Request'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCroModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px]"
              >
                ✕
              </button>
            </div>

            {croSubmitted ? (
              <div className="py-6 text-center space-y-3">
                <span className="material-symbols-outlined text-[48px] text-tertiary">check_circle</span>
                <h4 className="font-headline-sm text-on-surface font-semibold">
                  {isRtl ? 'معاينة فقط — لم يتم إرسال أي شيء.' : 'Preview only — nothing was sent.'}
                </h4>
                <p className="text-[12px] text-on-surface-variant max-w-sm mx-auto">
                  {isRtl
                    ? 'تم تسجيل الاستثناء برقم CBUAE-OVR-2025-0812 وإرسال الإشعار لجهات التمويل لفك تجميد الاكتتاب.'
                    : 'Override logged as CBUAE-OVR-2025-0812 with SHA-256 digital stamp. Automated syndication lock cleared under bilateral protocol.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCroModalOpen(false);
                    setIsCured(true);
                    setCureType('GUARANTOR_ESCROW');
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-[13px]"
                >
                  {isRtl ? 'العودة للملف' : 'Return to Case Dossier'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-[13px]">
                <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/30 space-y-1">
                  <div className="flex justify-between text-[11px] font-label-caps text-on-surface-variant">
                    <span>CASE: {data.caseNumber}</span>
                    <span>APPLICANT: {data.applicant.name}</span>
                  </div>
                  <div className="text-on-surface font-semibold">
                    Current DBR: <span className="text-error font-bold font-mono">58.4%</span> (Statutory Max: 50.0%)
                  </div>
                  <div className="text-[11px] text-on-surface-variant">
                    {isRtl
                      ? 'ملاحظة: هذا الإجراء يتطلب توقيعين معتمدين ويتم تدوينه في تقرير التفتيش الدوري للمصرف المركزي.'
                      : 'Notice: This override requires dual-signatory committee authorization and is recorded in statutory CBUAE quarterly inspection logs.'}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-label-caps uppercase text-on-surface-variant mb-1">
                    {isRtl ? 'المسوغ الائتماني والضمانات الإضافية' : 'Credit Justification & Mitigating Assets'}
                  </label>
                  <textarea
                    rows={3}
                    value={croJustification}
                    onChange={(e) => setCroJustification(e.target.value)}
                    placeholder={
                      isRtl
                        ? 'مثال: العميل يمتلك محفظة عقارية مدرة للدخل، مع التزام الشريك التجاري بتقديم كفالة غارمة...'
                        : 'e.g. High-net-worth client with substantial unencumbered liquid real estate portfolio; cross-corporate guarantee provided...'
                    }
                    className="w-full rounded-lg bg-surface-container border border-outline-variant p-2.5 text-on-surface focus:outline-none focus:border-primary text-[12px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-label-caps uppercase text-on-surface-variant mb-1">
                    {isRtl ? 'المفوض بالتوقيع والاعتماد' : 'Authorizing CRO Signatory'}
                  </label>
                  <select
                    value={croSignatory}
                    onChange={(e) => setCroSignatory(e.target.value)}
                    className="w-full rounded-lg bg-surface-container border border-outline-variant p-2 text-on-surface focus:outline-none focus:border-primary text-[12px]"
                  >
                    <option value="Marc Ackermann (General Manager)">Marc Ackermann (General Manager / CRO Delegated)</option>
                    <option value="Tariq Al-Hashimi (Chief Risk Officer)">Tariq Al-Hashimi (Chief Risk Officer)</option>
                    <option value="Executive Credit Committee (Level 3)">Executive Credit Committee (Level 3 Panel)</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCroModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface text-[12px] font-medium"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCroSubmitted(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-[12px] flex items-center gap-1.5 shadow"
                  >
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>{isRtl ? 'اعتماد الاستثناء الرسمي' : 'Authorize Statutory Override'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ATTACH CO-SIGNER / SOVEREIGN WEALTH GUARANTOR MODAL */}
      {guarantorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">verified_user</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {isRtl ? 'إرفاق كفيل سيادي / محفظة أصول مضمونة' : 'Attach Sovereign Wealth Guarantor'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGuarantorModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-[13px]">
              <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/30 space-y-1">
                <div className="text-[11px] font-label-caps uppercase text-secondary font-bold">
                  {isRtl ? 'إعفاء DBR بموجب المادة 14 (مكتب الثروات)' : 'Article 14 Sovereign Wealth Exemption'}
                </div>
                <p className="text-[12px] text-on-surface-variant">
                  {isRtl
                    ? 'إرفاق كفيل ذو ملاءة سيادية معتمد بالهوية الرقمية UAE PASS يعفي المعاملة من سقف عبء الدين البالغ 50.0%.'
                    : 'Attaching an attested Tier-1 sovereign guarantor or liquid custody pledge exempts the financing from standard retail 50% DBR limits.'}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-label-caps uppercase text-on-surface-variant mb-1">
                  {isRtl ? 'اسم الكفيل أو الجهة الضامنة' : 'Guarantor / Sovereign Entity'}
                </label>
                <input
                  type="text"
                  value={guarantorName}
                  onChange={(e) => setGuarantorName(e.target.value)}
                  className="w-full rounded-lg bg-surface-container border border-outline-variant p-2 text-on-surface text-[12px] font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-label-caps uppercase text-on-surface-variant mb-1">
                  {isRtl ? 'نوع الضمانة المودعة' : 'Pledge / Guarantee Structure'}
                </label>
                <select
                  value={guarantorType}
                  onChange={(e) => setGuarantorType(e.target.value)}
                  className="w-full rounded-lg bg-surface-container border border-outline-variant p-2 text-on-surface text-[12px]"
                >
                  <option value="Sovereign Wealth Asset Pledge">Sovereign Wealth Asset Pledge (AED 2.0M Liquid Escrow)</option>
                  <option value="Joint UAE Pass Cross-Guarantee">Joint UAE Pass Personal Guarantee (Affidavit Attested)</option>
                  <option value="Corporate Holding Standby LC">Corporate Holding Standby Letter of Credit (FAB Custody)</option>
                </select>
              </div>

              <div className="p-2.5 rounded bg-surface-container border border-outline-variant/30 flex items-center justify-between text-[11px]">
                <span className="text-on-surface-variant">UAE PASS Attestation Hash:</span>
                <span className="font-mono text-primary font-bold">0x8a92...cf3b (Verified)</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGuarantorModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface text-[12px] font-medium"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGuarantorAttached(true);
                    setIsCured(true);
                    setCureType('GUARANTOR_ESCROW');
                    setGuarantorModalOpen(false);
                    setFeedbackMessage(
                      isRtl
                        ? `تم اعتماد الكفيل السيادي: ${guarantorName}. تم فك التجميد وتأكيد أهلية ADCB Private.`
                        : `Sovereign guarantor ${guarantorName} attached. Syndication lock cleared.`
                    );
                  }}
                  className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-semibold text-[12px] flex items-center gap-1.5 shadow"
                >
                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                  <span>{isRtl ? 'ربط واعتماد الكفيل' : 'Bind & Authorize Guarantor'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. STRUCTURE 30% DOWN CONFIRMATION MODAL */}
      {structureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">handshake</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {isRtl ? 'هيكلة دفعة أولى 30% (حل DIB)' : 'Structure 30% Equity Injection'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStructureModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <p className="text-on-surface-variant text-[12px]">
                {isRtl
                  ? 'بناءً على اشتراطات بنك دبي الإسلامي (DIB Al Islami)، يؤدي حقن 567,000 درهم كدفعة أولى (30%) إلى معالجة سقف عبء الدين بالكامل:'
                  : 'Injecting AED 567,000 cash equity (30.0%) satisfies Dubai Islamic Bank conditional Murabaha terms and reduces statutory DBR:'}
              </p>

              <div className="p-3 rounded-lg bg-surface-container space-y-1.5 font-mono text-[12px]">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">New Down Payment:</span>
                  <span className="text-tertiary font-bold">AED 567,000 (30.0%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Net Financed Principal:</span>
                  <span className="text-on-surface font-bold">AED 1,323,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">New Monthly Payment:</span>
                  <span className="text-on-surface font-bold">AED 24,980 / mo</span>
                </div>
                <div className="flex justify-between border-t border-outline-variant/30 pt-1.5">
                  <span className="text-on-surface-variant">Recalculated DBR:</span>
                  <span className="text-tertiary font-bold">48.2% (Under 50% Cap)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStructureModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface text-[12px] font-medium"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCured(true);
                    setCureType('EQUITY_30');
                    setStructureModalOpen(false);
                    setFeedbackMessage(
                      isRtl
                        ? 'تم تطبيق هيكلة دفعة 30%. تم خفض DBR إلى 48.2% وفك تجميد الاكتتاب لبنك دبي الإسلامي.'
                        : '30% Equity Restructure applied. DBR cured to 48.2% and DIB Murabaha ready for issuance.'
                    );
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-[12px] flex items-center gap-1.5 shadow"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>{isRtl ? 'تأكيد وحقن الدفعة' : 'Confirm & Apply Cure'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SIMULATE FINANCING TERMS MODAL */}
      {simulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">tune</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {isRtl ? 'محاكاة شروط التمويل ونسبة DBR' : 'Financing Terms & DBR Simulator'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSimModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-[13px]">
              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-on-surface-variant">Vehicle Invoice Price:</span>
                  <span className="font-mono font-bold text-on-surface">AED {simPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={1000000}
                  max={3000000}
                  step={50000}
                  value={simPrice}
                  onChange={(e) => setSimPrice(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-on-surface-variant">Down Payment Percentage:</span>
                  <span className="font-mono font-bold text-primary">{simDownPct}% (AED {Math.round((simPrice * simDownPct) / 100).toLocaleString()})</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={50}
                  step={5}
                  value={simDownPct}
                  onChange={(e) => setSimDownPct(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-on-surface-variant">Loan Tenor:</span>
                  <span className="font-mono font-bold text-on-surface">{simTenor} Months</span>
                </div>
                <input
                  type="range"
                  min={24}
                  max={60}
                  step={12}
                  value={simTenor}
                  onChange={(e) => setSimTenor(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              {/* Dynamic Calculation Output */}
              {(() => {
                const financed = simPrice * (1 - simDownPct / 100);
                const interestRate = 0.0275;
                const totalInterest = financed * interestRate * (simTenor / 12);
                const monthlyPayment = Math.round((financed + totalInterest) / simTenor);
                const monthlyLiabilities = 92000;
                const monthlyIncome = 157500;
                const calcDbr = ((monthlyLiabilities + monthlyPayment) / monthlyIncome) * 100;
                const isUnderCap = calcDbr <= 50.0;

                return (
                  <div className={`p-3 rounded-lg border space-y-1.5 font-mono text-[12px] ${isUnderCap ? 'bg-tertiary/10 border-tertiary/30' : 'bg-error/10 border-error/30'}`}>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Monthly Payment:</span>
                      <span className="font-bold text-on-surface">AED {monthlyPayment.toLocaleString()} / mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Calculated DBR:</span>
                      <span className={`font-bold ${isUnderCap ? 'text-tertiary' : 'text-error'}`}>
                        {calcDbr.toFixed(1)}% {isUnderCap ? '(COMPLIANT)' : '(BREACH)'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSimModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-[12px] font-semibold"
                >
                  {isRtl ? 'إغلاق' : 'Close Simulator'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. RATE SHEET MATRIX MODAL */}
      {rateSheetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">table_chart</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {isRtl ? 'جدول أسعار الفائدة والربح للربع الرابع (Q4 Rate Sheet)' : 'Q4 Automotive Lending Rate Sheet Matrix'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRateSheetModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[12px]">
              <p className="text-on-surface-variant">
                {isRtl
                  ? 'أسعار الفائدة المتفق عليها مع البنوك المعتمدة لعملاء الفئات (Tier 1 - Subprime):'
                  : 'Contracted Tier-1 to Subprime profit spreads across accredited UAE auto finance desks:'}
              </p>

              <div className="overflow-x-auto rounded border border-outline-variant/30">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-surface-container uppercase text-on-surface-variant">
                    <tr>
                      <th className="p-2">Bank</th>
                      <th className="p-2">Tier-1 Flat</th>
                      <th className="p-2">Subprime Flat</th>
                      <th className="p-2">Dealer Reserve</th>
                      <th className="p-2">DBR Max</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    <tr>
                      <td className="p-2 font-bold text-primary">ENBD</td>
                      <td className="p-2">2.25%</td>
                      <td className="p-2 text-error">2.49% (Hard-Lock)</td>
                      <td className="p-2">1.15%</td>
                      <td className="p-2">50.0%</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-primary">FAB</td>
                      <td className="p-2">2.19%</td>
                      <td className="p-2 text-error">2.39% (Hard-Lock)</td>
                      <td className="p-2">1.25%</td>
                      <td className="p-2">50.0%</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-primary">DIB (Sharia)</td>
                      <td className="p-2">2.35%</td>
                      <td className="p-2 text-tertiary">2.85% (30% Down)</td>
                      <td className="p-2">1.00%</td>
                      <td className="p-2">50.0%</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-primary">ADCB Private</td>
                      <td className="p-2">2.40%</td>
                      <td className="p-2 text-secondary">2.75% (Escrow Pledge)</td>
                      <td className="p-2">1.20%</td>
                      <td className="p-2">Exempt (Article 14)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setRateSheetModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-[12px] font-semibold"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. EXPORT COMPLIANCE LOG MODAL */}
      {exportLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {isRtl ? 'سجل الامتثال والتدقيق التنظيمي للمصرف المركزي' : 'CBUAE Compliance Audit Dossier'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExportLogModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[12px]">
              <div className="p-3 rounded-lg bg-surface-container font-mono space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Statutory Standard:</span>
                  <span className="text-on-surface">CBUAE Notice No. 29/2011</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Case Reference:</span>
                  <span className="text-primary">{data.caseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Audit Stamp:</span>
                  <span className="text-on-surface">SHA256: 9b20...a814c</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Compliance Status:</span>
                  <span className={isCured ? 'text-tertiary font-bold' : 'text-error font-bold'}>
                    {isCured ? 'RESOLVED & CURED' : 'LOCKED_BREACH_FLAGGED'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExportLogModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant text-[12px]"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportLogModalOpen(false);
                    setFeedbackMessage(
                      isRtl
                        ? 'تم تصدير ملف الامتثال الرسمي (CBUAE-FNI-LOG-2025.pdf) بنجاح.'
                        : 'CBUAE compliance audit log exported successfully.'
                    );
                  }}
                  className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-[12px] flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>{isRtl ? 'تحميل ملف التدقيق' : 'Download Audit PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. SUBMIT DOSSIER MODAL */}
      {submitDossierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">send</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {isRtl ? 'إرسال الملف عبر بوابة المصرف المفتوح' : 'Open Banking Syndication Dispatch'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSubmitDossierModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <p className="text-on-surface-variant text-[12px]">
                {isRtl
                  ? 'سيتم بث ملف التمويل المعتمد لشبكة البنوك المشاركة في الاتحاد الائتماني:'
                  : 'Ready to broadcast sanctioned dossier to accredited lending syndication nodes:'}
              </p>

              <div className="p-3 rounded-lg bg-surface-container space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Lender:</span>
                  <span className="text-primary font-bold">{cureType === 'EQUITY_30' ? 'Dubai Islamic Bank' : 'ADCB Private'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Financed Principal:</span>
                  <span className="text-on-surface font-bold">AED {currentNetPrincipal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Statutory DBR:</span>
                  <span className="text-tertiary font-bold">{currentDbr.toFixed(1)}% (Approved)</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitDossierModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-surface-container text-on-surface-variant text-[12px]"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitDossierModalOpen(false);
                    setFeedbackMessage(
                      isRtl
                        ? 'تم بث الملف المصرفي بنجاح إلى شبكة البنوك عبر بوابة المصرف المفتوح.'
                        : 'Bank dossier successfully transmitted via UAE Open Banking gateway.'
                    );
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-[12px] flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>{isRtl ? 'تأكيد البث المصرفي' : 'Confirm Dispatch'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. DECLINE / BOUNDS DETAIL MODAL */}
      {selectedOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {selectedOfferModal === 'sub-lnd-01' ? 'Emirates NBD Decline Notice' : 'FAB Bounds Discrepancy'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOfferModal(null)}
                className="text-on-surface-variant hover:text-on-surface text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[12px] text-on-surface-variant">
              {selectedOfferModal === 'sub-lnd-01' ? (
                <>
                  <p>
                    {isRtl
                      ? 'تم رفض الطلب آلياً نظراً لأن نسبة عبء الدين المحسوبة (58.4%) تتجاوز الحد الأقصى المصرح به من المصرف المركزي (50.0%).'
                      : 'Application rejected automatically: Calculated DBR of 58.4% exceeds CBUAE statutory 50.0% ceiling. Debt consolidation or co-borrower mandatory.'}
                  </p>
                  <div className="p-2.5 rounded bg-surface-container font-mono text-[11px] text-error">
                    Rejection Code: ENBD-AUTO-DBR-CEILING-BREACH
                  </div>
                </>
              ) : (
                <>
                  <p>
                    {isRtl
                      ? 'تم تعليق الطلب نظراً لتجاوز نسبة التمويل للقيمة (85.0% مقابل سقف 80.0% للمركبات التي تتجاوز قيمتها مليون درهم).'
                      : 'Application bounds out of range: Requested LTV is 85.0% against CBUAE cap of 80.0% for luxury vehicles over AED 1M.'}
                  </p>
                  <div className="p-2.5 rounded bg-surface-container font-mono text-[11px] text-error">
                    Rejection Code: FAB-LTV-STATUTORY-CAP-BREACH
                  </div>
                </>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOfferModal(null)}
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
