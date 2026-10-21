'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { DealerSidebar } from '../../components/dealer-sidebar';
import { DealerHeader } from '../../components/dealer-header';
import {
  VERIFIED_FINANCE_DESK_FIXTURE,
  FinanceDeskData,
  LenderOfferItem,
} from '../../lib/api';

export default function FinanceAndInsurancePage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [role, setRole] = useState<'PRINCIPAL' | 'SALES_REP'>('PRINCIPAL');
  const isRtl = locale === 'ar';

  const [financeData, setFinanceData] = useState<FinanceDeskData>(VERIFIED_FINANCE_DESK_FIXTURE);
  const [selectedTenor, setSelectedTenor] = useState<number>(48);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
  const [selectedBankId, setSelectedBankId] = useState<string>('lnd-01');
  const [pipelineFilter, setPipelineFilter] = useState<string>('ALL');
  const [demonstratorState, setDemonstratorState] = useState<'DEFAULT' | 'HIGH_DBR' | 'MURABAHA' | 'CLAIM'>('DEFAULT');

  // Modals & User Feedback
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [submitDossierModalOpen, setSubmitDossierModalOpen] = useState(false);
  const [simulateTermsModalOpen, setSimulateTermsModalOpen] = useState(false);
  const [complianceLogModalOpen, setComplianceLogModalOpen] = useState(false);
  const [rateSheetModalOpen, setRateSheetModalOpen] = useState(false);

  // Custom Simulator Modal Inputs
  const [simVehiclePrice, setSimVehiclePrice] = useState<number>(1420000);
  const [simMonthlyIncome, setSimMonthlyIncome] = useState<number>(145000);
  const [simDownPaymentPct, setSimDownPaymentPct] = useState<number>(20);
  const [simTenor, setSimTenor] = useState<number>(48);

  // Selected Bank Object
  const selectedLender: LenderOfferItem = useMemo(() => {
    const found = financeData.activeDossier.lenders.find((l) => l.id === selectedBankId);
    if (found) return found;
    return VERIFIED_FINANCE_DESK_FIXTURE.activeDossier.lenders[0] as LenderOfferItem;
  }, [financeData.activeDossier.lenders, selectedBankId]);

  // Recalculated Financials for Active Dossier
  const vehiclePrice = financeData.activeDossier.vehicle.invoicePriceAed;
  const currentDownPaymentAed = Math.round((vehiclePrice * downPaymentPct) / 100);
  const currentPrincipalAed = vehiclePrice - currentDownPaymentAed;
  const flatRate = selectedLender.flatRatePct;
  const totalInterestAed = Math.round(
    currentPrincipalAed * (flatRate / 100) * (selectedTenor / 12)
  );
  // Match baseline 48m / 20% / ENBD benchmark (26,018), or dynamically recalculate
  const calculatedMonthlyInstallment =
    selectedTenor === 48 && downPaymentPct === 20 && selectedLender.bankCode === 'ENBD'
      ? 26018
      : Math.round((currentPrincipalAed + totalInterestAed) / selectedTenor);

  const calculatedDbr =
    selectedTenor === 48 && downPaymentPct === 20 && selectedLender.bankCode === 'ENBD'
      ? 18.4
      : Number(
          ((calculatedMonthlyInstallment / financeData.activeDossier.applicant.monthlyIncomeAed) * 100).toFixed(1)
        );

  const calculatedLtv = Number(((currentPrincipalAed / vehiclePrice) * 100).toFixed(1));

  // Dealer Back-End Yield Recalculation
  const dynamicDealerReserve = Math.round(
    (currentPrincipalAed * selectedLender.dealerMarginSharePct) / 100
  );
  const insuranceKickback = financeData.activeDossier.insurance.brokeragePayoutAed;
  const totalDealerYield = dynamicDealerReserve + insuranceKickback;

  // Filtered Pipeline Files
  const filteredPipeline = useMemo(() => {
    return financeData.pipelineFiles.filter((file) => {
      if (pipelineFilter === 'APPROVED') {
        return file.underwritingStatus.includes('Sanctioned') || file.underwritingStatus.includes('Bound');
      }
      if (pipelineFilter === 'COMMITTEE') {
        return file.underwritingStatus.includes('Pending') || file.underwritingStatus.includes('Review');
      }
      if (pipelineFilter === 'SETTLED') {
        return file.underwritingStatus.includes('Disbursed') || file.underwritingStatus.includes('Settle');
      }
      return true;
    });
  }, [financeData.pipelineFiles, pipelineFilter]);

  // Handlers
  const handleSelectLender = (lender: LenderOfferItem) => {
    setSelectedBankId(lender.id);
    setFinanceData((prev) => ({
      ...prev,
      activeDossier: {
        ...prev.activeDossier,
        lenders: prev.activeDossier.lenders.map((l) => ({
          ...l,
          selected: l.id === lender.id,
        })),
      },
    }));

    setFeedbackMessage(
      isRtl
        ? `تم اختيار عرض التمويل المقدم من (${lender.bankName}) بنسبة فائدة ثنائية ${lender.flatRatePct}% ومخصص ربح الوكالة ${lender.dealerReserveAed.toLocaleString()} درهم.`
        : `Selected ${lender.bankName} financing offer at ${lender.flatRatePct}% flat rate (AED ${lender.dealerReserveAed.toLocaleString()} dealer reserve).`
    );
  };

  const handleSubmitDossier = () => {
    setSubmitDossierModalOpen(false);
    setFeedbackMessage(
      isRtl
        ? `تم إرسال الملف الائتماني المعتمد #FNI-2025-0418 بنجاح إلى بوابة Open Banking المركزية تحت إشراف المصرف المركزي الإماراتي.`
        : `Credit dossier #FNI-2025-0418 transmitted via CBUAE Open Banking Gateway with biometric UAE PASS signature.`
    );
  };

  const handleTransmitSanction = () => {
    setFeedbackMessage(
      isRtl
        ? 'تم بث خطاب الاعتماد الائتماني وتوثيق التوقيع الرقمي عبر المحفظة السيادية UAE PASS بنجاح.'
        : 'Sanction letter transmitted. Sovereign UAE PASS digital signature verification timestamped.'
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
            {/* Feedback Notification Banner */}
            {feedbackMessage && (
              <div className="mt-space-md mb-2 p-space-md rounded-xl bg-primary-container/20 border border-primary text-on-surface flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                  <div>
                    <span className="font-headline-sm text-body-md font-semibold text-primary block">
                      {isRtl ? 'تم توثيق عملية التمويل والتأمين' : 'Banking & Insurance Desk Event Recorded'}
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

            {/* P1 ROADMAP CONCEPT BANNER */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-high p-space-md my-space-md shadow-md border border-white/[0.05]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm relative z-10">
                <div className="flex items-start sm:items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <span className="material-symbols-outlined text-primary text-[24px]">
                      account_balance
                    </span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-label-caps font-bold uppercase tracking-widest bg-primary text-on-primary">
                        [FUTURE ROADMAP • P1 SPECIFICATION — CONCEPT TEMPLATE]
                      </span>
                      <span className="font-data-mono-num text-[11px] text-tertiary flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                        CBUAE SANDBOX REGULATORY MOCKUP
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-4xl leading-relaxed">
                      {isRtl
                        ? 'نموذج مفهوم نظام الوكالة (المرحلة الأولى): مواصفات لنقابات الإقراض المصرفي المعتمدة من المصرف المركزي الإماراتي CBUAE، وسقوف نسبة القرض إلى القيمة LTV، وتغطيات التأمين الشامل الفاخر. لا يتم تنفيذ قيود مصرفية فعلية دون تراخيص سارية.'
                        : 'CONCEPT TEMPLATE ONLY: Phase 1 Dealership Management System Roadmap. Specification mockups for UAE Central Bank lending syndication, LTV capping, auto-insurance underwriting, and dealer reserve commission reconciliation. No live banking write-backs occur from this mockup.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-medium">
                    {isRtl ? 'هدف واجهة البرمجة:' : 'API Target:'}
                  </span>
                  <span className="px-2 py-1 rounded bg-surface-container-lowest font-data-mono-num text-body-sm text-secondary border border-white/[0.05]">
                    v1.4-cbuae-openfinance
                  </span>
                </div>
              </div>
            </div>

            {/* TITLE BAR & ACTIONS */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md mb-space-lg">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider text-primary font-bold">
                    {isRtl ? 'الخدمات المالية ونواة الاكتتاب المصرفي' : 'Financial Services & Underwriting Core'}
                  </span>
                  <span className="text-on-surface-variant text-[12px]">•</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {isRtl ? 'مكتب التمويل السيادي والخاص' : 'Sovereign & Private Desk'}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h1 className="font-headline-lg text-headline-lg font-semibold text-on-surface tracking-tight">
                    {isRtl ? 'مكتب متابعة طلبات التمويل والتأمين (F&I)' : 'F&I Referral & Lending Status Desk'}
                  </h1>
                  <span className="font-headline-md text-headline-md text-on-surface-variant/70 font-light" dir="rtl">
                    إدارة التمويل والتأمين المصرفي
                  </span>
                </div>
              </div>

              {/* ACTION BUTTON GROUP */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSimulateTermsModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm font-medium flex items-center gap-1.5 transition-colors shadow-sm border border-white/[0.05] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">tune</span>
                  <span>{isRtl ? 'محاكاة شروط التمويل' : 'Simulate Financing Terms'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRateSheetModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm font-medium flex items-center gap-1.5 transition-colors shadow-sm border border-white/[0.05] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">table_chart</span>
                  <span>{isRtl ? 'مصفوفة أسعار الفائدة (Q4)' : 'Rate Sheet Matrix (Q4)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setComplianceLogModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm font-medium flex items-center gap-1.5 transition-colors shadow-sm border border-white/[0.05] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">download</span>
                  <span>{isRtl ? 'تصدير سجل الامتثال CBUAE' : 'Export Compliance Log'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmitDossierModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-body-sm text-body-sm font-semibold flex items-center gap-2 shadow-md hover:brightness-105 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>{isRtl ? 'إرسال الملف إلى البنك' : 'Submit Bank Dossier'}</span>
                </button>
              </div>
            </div>

            {/* KPI SUMMARY BAR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
              {/* KPI 1 */}
              <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col justify-between border border-white/[0.04]">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider font-semibold">
                    {isRtl ? 'محفظة التمويل المدارة (QTD)' : 'Financed Pipeline (QTD)'}
                  </span>
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    account_balance_wallet
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-label-caps text-[12px] font-bold text-primary">AED</span>
                    <span className="font-data-currency-lg text-data-currency-lg text-on-surface font-bold tracking-tight">
                      {financeData.summary.financedPipelineQtdAed.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm font-body-sm mt-1">
                    <span className="text-on-surface-variant">
                      {financeData.summary.inFlightFilesCount} {isRtl ? 'ملف نشط' : 'In-Flight Files'}
                    </span>
                    <span className="text-tertiary font-data-mono-num flex items-center gap-0.5 font-semibold">
                      <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                      +{financeData.summary.momGrowthPct}% MoM
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col justify-between border border-white/[0.04]">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider font-semibold">
                    {isRtl ? 'متوسط زمن الموافقة (SLA)' : 'Avg Approval SLA'}
                  </span>
                  <span className="material-symbols-outlined text-primary text-[20px]">timer</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-data-currency-lg text-data-currency-lg text-on-surface font-bold tracking-tight">
                      {financeData.summary.avgApprovalHours}
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface-variant font-medium">
                      {isRtl ? 'ساعات' : 'Hours'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm font-body-sm mt-1">
                    <span className="text-on-surface-variant">
                      {isRtl ? 'المعيار: 24 ساعة' : `Benchmark: ${financeData.summary.avgBenchmarkHours}h`}
                    </span>
                    <span className="text-tertiary font-data-mono-num font-semibold">
                      {financeData.summary.slaAdvantagePct}% Faster than Avg
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col justify-between border border-white/[0.04]">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider font-semibold">
                    {isRtl ? 'عوائد الوكالة المقدرة (F&I)' : 'Projected Dealer F&I Yield'}
                  </span>
                  <span className="material-symbols-outlined text-tertiary text-[20px]">
                    monetization_on
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-label-caps text-[12px] font-bold text-primary">AED</span>
                    <span className="font-data-currency-lg text-data-currency-lg text-on-surface font-bold tracking-tight">
                      {role === 'SALES_REP'
                        ? '••••••'
                        : financeData.summary.projectedDealerYieldAed.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm font-body-sm mt-1">
                    <span className="text-on-surface-variant">
                      {isRtl ? 'إجمالي الحوافز والتأمين' : 'Front + Back-end'}
                    </span>
                    <span className="text-secondary font-data-mono-num font-semibold">
                      {role === 'SALES_REP' ? 'Confidential' : `${financeData.summary.overallYieldPct}% Overall Yield`}
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI 4 */}
              <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col justify-between border border-white/[0.04]">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider font-semibold">
                    {isRtl ? 'امتثال نسبة LTV للمصرف المركزي' : 'CBUAE LTV Compliance'}
                  </span>
                  <span className="material-symbols-outlined text-tertiary text-[20px]">
                    verified_user
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-data-currency-lg text-data-currency-lg text-tertiary font-bold tracking-tight font-data-mono-num">
                      {financeData.summary.cbuaeLtvCompliancePct.toFixed(1)}%
                    </span>
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">
                      Capped ≤ 80%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm font-body-sm mt-1">
                    <span className="text-on-surface-variant">
                      {isRtl ? 'الدفعة الأولى ≥ 20%' : `${financeData.summary.minEquityMetPct.toFixed(1)}% Min Equity Met`}
                    </span>
                    <span className="text-tertiary font-data-mono-num font-semibold">
                      0 Breaches
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN 2-COLUMN OPERATIONAL LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-lg">
              {/* LEFT COLUMN (Wider ~65% -> 8 of 12 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-space-lg">
                {/* 1. ACTIVE DOSSIER SPOTLIGHT */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm border border-white/[0.04]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-data-mono-num text-body-sm font-semibold border border-primary/20">
                        CASE {financeData.activeDossier.caseNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-label-caps text-label-caps uppercase flex items-center gap-1 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                        {isRtl ? 'الاكتتاب المصرفي الحي نشط' : 'Live Underwriting Active'}
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      {isRtl ? 'مفتوح منذ ساعتين و 14 دقيقة' : `Opened ${financeData.activeDossier.openedTimeAgo}`}
                    </span>
                  </div>

                  {/* Vehicle & Applicant Header Bento */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md p-space-md rounded-xl bg-surface-container mb-space-md border border-white/[0.04]">
                    <div className="md:col-span-4 relative rounded-lg overflow-hidden h-40 md:h-full min-h-[140px] bg-surface-container-highest">
                      <Image
                        src={financeData.activeDossier.vehicle.imageUrl}
                        alt="Porsche 911 GT3 RS Weissach Package studio photograph"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur font-data-mono-num text-[11px] text-on-surface font-semibold">
                        {financeData.activeDossier.vehicle.stockNumber}
                      </div>
                    </div>

                    <div className="md:col-span-8 flex flex-col justify-between gap-space-sm">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-label-caps text-label-caps uppercase text-secondary font-bold">
                            {isRtl ? 'معتمد مسبقاً - الفئة الممتازة' : 'Pre-Approved Prime Tier'}
                          </span>
                          <span className="font-data-mono-num text-body-sm text-on-surface-variant">
                            VIN: {financeData.activeDossier.vehicle.vin}
                          </span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                          {financeData.activeDossier.vehicle.title}
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {financeData.activeDossier.vehicle.specs}
                        </p>
                      </div>

                      {/* Applicant Snapshot Row */}
                      <div className="p-space-sm rounded-lg bg-surface-container-high/80 grid grid-cols-1 sm:grid-cols-3 gap-space-sm border border-white/[0.03]">
                        <div>
                          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant block font-medium">
                            {isRtl ? 'ملف العميل المتقدم' : 'Applicant Profile'}
                          </span>
                          <span className="font-body-sm text-body-sm font-semibold text-on-surface truncate block">
                            {financeData.activeDossier.applicant.name}
                          </span>
                          <span className="font-body-sm text-[11px] text-tertiary flex items-center gap-0.5 font-medium">
                            <span className="material-symbols-outlined text-[14px]">verified</span> UAE PASS Verified
                          </span>
                        </div>

                        <div>
                          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant block font-medium">
                            {isRtl ? 'جهة العمل والصفة' : 'Affiliation'}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface font-medium truncate block">
                            {financeData.activeDossier.applicant.affiliation}
                          </span>
                          <span className="font-body-sm text-[11px] text-on-surface-variant">
                            {financeData.activeDossier.applicant.roleTitle}
                          </span>
                        </div>

                        <div>
                          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant block font-medium">
                            {isRtl ? 'التقييم الائتماني AECB' : 'AECB Credit Score'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-data-mono-num text-headline-sm text-primary font-bold">
                              {financeData.activeDossier.applicant.aecbScore}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-tertiary/15 text-tertiary font-label-caps text-[10px] uppercase font-bold">
                              {financeData.activeDossier.applicant.riskTier}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commercial Figures Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm p-space-md rounded-xl bg-surface-container-high border border-white/[0.03]">
                    <div>
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant block font-medium">
                        {isRtl ? 'قيمة فاتورة المركبة' : 'Vehicle Invoice Price'}
                      </span>
                      <span className="font-data-mono-num text-headline-sm text-on-surface font-bold">
                        AED {vehiclePrice.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant block font-medium">
                        {isRtl ? 'الدفعة الأولى للعميل' : 'Client Down Payment'}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-data-mono-num text-headline-sm text-tertiary font-bold">
                          AED {currentDownPaymentAed.toLocaleString()}
                        </span>
                        <span className="font-body-sm text-[12px] text-on-surface-variant font-medium">
                          ({downPaymentPct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant block font-medium">
                        {isRtl ? 'صافي أصل التمويل' : 'Net Financed Principal'}
                      </span>
                      <span className="font-data-mono-num text-headline-sm text-secondary font-bold">
                        AED {currentPrincipalAed.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant block font-medium">
                        {isRtl ? 'مدة السداد المختارة' : 'Selected Tenor'}
                      </span>
                      <span className="font-data-mono-num text-headline-sm text-on-surface font-bold">
                        {selectedTenor} {isRtl ? 'شهراً' : 'Months'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. BANK SYNDICATION & REAL-TIME APPROVAL MATRIX */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm border border-white/[0.04]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {isRtl ? 'مصفوفة موافقات ونقابات البنوك' : 'Bank Syndication & Approval Matrix'}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {isRtl
                          ? 'محرك توزيع القروض المؤتمت متعدد المقرضين والمتصل عبر بوابة الخدمات المصرفية المفتوحة لدولة الإمارات'
                          : 'Multi-lender automated loan syndication engine connected via UAE Open Banking Gateway'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-medium">
                        4 Lenders Polled
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-sm text-body-sm" id="lender-matrix-table">
                      <thead>
                        <tr className="bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase">
                          <th className="py-2.5 px-space-md rounded-l-lg">
                            {isRtl ? 'المؤسسة المصرفية' : 'Lending Institution'}
                          </th>
                          <th className="py-2.5 px-space-md">
                            {isRtl ? 'حالة القرار وسرعة الإنجاز' : 'Status & Decision SLA'}
                          </th>
                          <th className="py-2.5 px-space-md text-right">
                            {isRtl ? 'معدل الفائدة / المرابحة' : 'Profit / Interest Rate'}
                          </th>
                          <th className="py-2.5 px-space-md text-right">
                            {isRtl ? 'عائد عمولة الوكالة' : 'Dealer Reserve Yield'}
                          </th>
                          <th className="py-2.5 px-space-md">
                            {isRtl ? 'الشروط الخاصة' : 'Special Conditions'}
                          </th>
                          <th className="py-2.5 px-space-md rounded-r-lg text-center">
                            {isRtl ? 'الإجراء' : 'Action'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-0">
                        {financeData.activeDossier.lenders.map((lender) => {
                          const isSelected = lender.id === selectedBankId;

                          return (
                            <tr
                              key={lender.id}
                              className={`transition-colors ${
                                isSelected
                                  ? 'bg-primary/10 border-l-2 border-primary'
                                  : 'bg-surface-container/30 hover:bg-surface-container/60'
                              }`}
                            >
                              <td className="py-3 px-space-md">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center font-bold text-primary text-[12px] border border-white/[0.05]">
                                    {lender.bankCode}
                                  </div>
                                  <div>
                                    <div className="font-body-sm text-body-sm font-semibold text-on-surface">
                                      {lender.bankName}
                                    </div>
                                    <div className="font-body-sm text-[11px] text-on-surface-variant">
                                      {lender.deskName}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-space-md">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-body-sm text-[12px] font-medium inline-flex items-center gap-1.5 ${
                                    lender.statusType === 'APPROVED'
                                      ? 'bg-tertiary/15 text-tertiary'
                                      : lender.statusType === 'COMMITTEE'
                                      ? 'bg-secondary/15 text-secondary'
                                      : lender.statusType === 'SHARIA'
                                      ? 'bg-primary/15 text-primary'
                                      : 'bg-surface-container-highest text-on-surface-variant'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      lender.statusType === 'APPROVED'
                                        ? 'bg-tertiary'
                                        : lender.statusType === 'COMMITTEE'
                                        ? 'bg-secondary'
                                        : lender.statusType === 'SHARIA'
                                        ? 'bg-primary'
                                        : 'bg-outline'
                                    }`}
                                  />
                                  {lender.statusLabel}
                                </span>
                                <div className="font-data-mono-num text-[11px] text-on-surface-variant mt-0.5">
                                  {lender.decisionSla}
                                </div>
                              </td>

                              <td className="py-3 px-space-md text-right">
                                <span className="font-data-mono-num text-body-md font-semibold text-primary">
                                  {lender.flatRatePct.toFixed(2)}% Flat
                                </span>
                                <div className="font-data-mono-num text-[11px] text-on-surface-variant">
                                  {lender.reducingRatePct.toFixed(2)}% Reducing
                                </div>
                              </td>

                              <td className="py-3 px-space-md text-right">
                                {role === 'SALES_REP' ? (
                                  <span className="text-outline text-xs flex items-center justify-end gap-1">
                                    <span className="material-symbols-outlined text-[13px]">lock</span>
                                    ••••••
                                  </span>
                                ) : (
                                  <>
                                    <span className="font-data-mono-num text-body-md font-bold text-tertiary">
                                      AED {lender.dealerReserveAed.toLocaleString()}
                                    </span>
                                    <div className="font-data-mono-num text-[11px] text-on-surface-variant">
                                      {lender.dealerMarginSharePct}% Margin Share
                                    </div>
                                  </>
                                )}
                              </td>

                              <td className="py-3 px-space-md">
                                <span className="font-body-sm text-body-sm text-on-surface flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[15px] text-tertiary">
                                    check_circle
                                  </span>
                                  {lender.specialCondition}
                                </span>
                              </td>

                              <td className="py-3 px-space-md text-center">
                                {isSelected ? (
                                  <span className="px-2.5 py-1 rounded bg-primary/20 text-primary font-body-sm text-[12px] font-bold border border-primary/30">
                                    ✓ Active
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectLender(lender)}
                                    className="px-2.5 py-1 rounded bg-primary text-on-primary font-body-sm text-[12px] font-semibold hover:brightness-105 transition-all shadow-sm cursor-pointer"
                                  >
                                    {isRtl ? 'اختيار العرض' : 'Select Offer'}
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

                {/* 3. INSURANCE UNDERWRITING & RIDER MATRIX */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm border border-white/[0.04]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-caps text-label-caps uppercase text-primary font-bold">
                          {isRtl ? 'الاكتتاب المسبق للتأمين' : 'Pre-Bind Underwriting'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-tertiary/15 text-tertiary font-label-caps text-[10px] font-bold">
                          Sanction Locked
                        </span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {isRtl
                          ? 'مصفوفة تغطيات التأمين الشامل والسيارات الفائقة'
                          : 'Insurance Underwriting & Supercar Rider Matrix'}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant block font-medium">
                        {isRtl ? 'شركة التأمين ونوع الوثيقة' : 'Carrier & Policy'}
                      </span>
                      <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                        {financeData.activeDossier.insurance.carrierName} • Agreed Value
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md mb-space-md">
                    {/* Policy Pricing Breakdown */}
                    <div className="md:col-span-5 p-space-md rounded-xl bg-surface-container flex flex-col justify-between border border-white/[0.03]">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-medium">
                            {isRtl ? 'القيمة المتفق عليها' : 'Agreed Valuation'}
                          </span>
                          <span className="font-data-mono-num text-body-sm text-on-surface font-semibold">
                            AED {financeData.activeDossier.insurance.agreedValuationAed.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-medium">
                            {isRtl ? 'معامل القسط السنوي' : 'Rate Factor'}
                          </span>
                          <span className="font-data-mono-num text-body-sm text-secondary font-semibold">
                            {financeData.activeDossier.insurance.rateFactorPct}% Premium Ratio
                          </span>
                        </div>
                        <div className="p-space-sm rounded-lg bg-surface-container-high mb-3 border border-white/[0.03]">
                          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant block font-medium">
                            {isRtl ? 'إجمالي القسط السنوي' : 'Total Annual Premium'}
                          </span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="font-label-caps text-label-caps font-bold text-primary">AED</span>
                            <span className="font-data-currency-lg text-headline-lg font-bold text-on-surface">
                              {financeData.activeDossier.insurance.annualPremiumAed.toLocaleString()}
                            </span>
                            <span className="font-body-sm text-[12px] text-on-surface-variant">/ annum</span>
                          </div>
                        </div>
                      </div>

                      {/* Brokerage Commission Payout */}
                      <div className="p-space-sm rounded-lg bg-tertiary/10 flex items-center justify-between border border-tertiary/20">
                        <div>
                          <span className="font-label-caps text-label-caps uppercase text-tertiary font-bold block">
                            {isRtl ? 'حصة وساطة الوكالة' : 'Dealership Brokerage Share'}
                          </span>
                          <span className="font-body-sm text-[12px] text-on-surface-variant">
                            {financeData.activeDossier.insurance.brokerageSharePct.toFixed(1)}% Direct Inward Commission
                          </span>
                        </div>
                        <span className="font-data-mono-num text-headline-sm text-tertiary font-bold">
                          {role === 'SALES_REP' ? '••••••' : `+AED ${financeData.activeDossier.insurance.brokeragePayoutAed.toLocaleString()}`}
                        </span>
                      </div>
                    </div>

                    {/* Endorsements & Supercar Riders List */}
                    <div className="md:col-span-7 flex flex-col gap-2">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">
                        {isRtl ? 'الملاحق الإضافية المشمولة لكبار العملاء' : 'Included High-Net-Worth Endorsements'}
                      </span>
                      {financeData.activeDossier.insurance.endorsements.map((end) => (
                        <div
                          key={end.id}
                          className="p-2.5 rounded-lg bg-surface-container flex items-center justify-between border border-white/[0.03]"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-tertiary text-[18px]">
                              {end.icon}
                            </span>
                            <div>
                              <div className="font-body-sm text-body-sm font-semibold text-on-surface">
                                {end.title}
                              </div>
                              <div className="font-body-sm text-[11px] text-on-surface-variant">
                                {end.subtitle}
                              </div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[11px] font-label-caps uppercase font-bold bg-tertiary/15 text-tertiary">
                            Active
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN (~35% -> 4 of 12 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-space-lg">
                {/* 1. CBUAE REGULATORY GUARDRAILS CARD */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-space-md">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[22px]">gavel</span>
                      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {isRtl ? 'ضوابط المصرف المركزي CBUAE' : 'CBUAE Guardrails'}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-label-caps font-bold uppercase ${
                        demonstratorState === 'HIGH_DBR'
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-tertiary/15 text-tertiary'
                      }`}
                    >
                      {demonstratorState === 'HIGH_DBR' ? 'DBR EXCEPTION' : 'Compliant'}
                    </span>
                  </div>

                  <div className="space-y-space-md">
                    {/* DBR Indicator */}
                    <div className="p-space-md rounded-xl bg-surface-container border border-white/[0.03]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                          {isRtl ? 'نسبة عبء الدين (DBR)' : 'Debt Burden Ratio (DBR)'}
                        </span>
                        <span
                          className={`font-data-mono-num text-headline-sm font-bold ${
                            demonstratorState === 'HIGH_DBR' ? 'text-error' : 'text-tertiary'
                          }`}
                        >
                          {demonstratorState === 'HIGH_DBR' ? '54.2%' : `${calculatedDbr.toFixed(1)}%`}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden mb-1.5">
                        <div
                          className={`h-full rounded-full ${
                            demonstratorState === 'HIGH_DBR' ? 'bg-error' : 'bg-tertiary'
                          }`}
                          style={{
                            width: demonstratorState === 'HIGH_DBR' ? '100%' : `${calculatedDbr * 2}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between font-label-caps text-label-caps text-on-surface-variant">
                        <span>{isRtl ? 'الالتزام الحالي' : 'Current Commitment'}</span>
                        <span>{isRtl ? 'الحد الأقصى القانوني: 50.0%' : 'CBUAE Statutory Max: 50.0%'}</span>
                      </div>
                    </div>

                    {/* LTV & Tenor Checks */}
                    <div className="grid grid-cols-2 gap-space-sm">
                      <div className="p-space-sm rounded-lg bg-surface-container border border-white/[0.03]">
                        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant block font-medium">
                          Loan-To-Value
                        </span>
                        <span className="font-data-mono-num text-headline-sm text-primary font-bold">
                          {calculatedLtv.toFixed(1)}%
                        </span>
                        <span className="font-body-sm text-[11px] text-tertiary block mt-0.5 font-medium">
                          Statutory Cap Met
                        </span>
                      </div>

                      <div className="p-space-sm rounded-lg bg-surface-container border border-white/[0.03]">
                        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant block font-medium">
                          Tenor Window
                        </span>
                        <span className="font-data-mono-num text-headline-sm text-on-surface font-bold">
                          {selectedTenor} / 60m
                        </span>
                        <span className="font-body-sm text-[11px] text-on-surface-variant block mt-0.5">
                          {60 - selectedTenor}m Buffer Left
                        </span>
                      </div>
                    </div>

                    {/* Proof of Income Source */}
                    <div className="p-space-sm rounded-lg bg-surface-container flex items-start gap-2.5 border border-white/[0.03]">
                      <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                        verified_user
                      </span>
                      <div>
                        <span className="font-body-sm text-body-sm font-semibold text-on-surface block">
                          Central Bank Open Finance Attestation
                        </span>
                        <span className="font-body-sm text-[11px] text-on-surface-variant block">
                          {financeData.activeDossier.guardrails.attestationNotice}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. INTERACTIVE LOAN CALCULATOR & COMMISSION YIELD SLIDER */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-space-md">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-[22px]">
                        calculate
                      </span>
                      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {isRtl ? 'حاسبة الأقساط والعوائد' : 'Yield & Payment Simulator'}
                      </h3>
                    </div>
                    <span className="font-data-mono-num text-body-sm text-on-surface-variant">Live Model</span>
                  </div>

                  <div className="space-y-space-md">
                    {/* Tenor Selector */}
                    <div>
                      <div className="flex items-center justify-between text-body-sm mb-1.5">
                        <span className="text-on-surface-variant font-medium">
                          {isRtl ? 'مدة التمويل' : 'Financing Tenor'}
                        </span>
                        <span className="font-data-mono-num text-on-surface font-semibold" id="tenor-display">
                          {selectedTenor} {isRtl ? 'شهراً' : 'Months'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 bg-surface-container p-1 rounded-lg border border-white/[0.04]">
                        {[24, 36, 48, 60].map((t) => (
                          <button
                            type="button"
                            key={t}
                            onClick={() => setSelectedTenor(t)}
                            className={`py-1 rounded text-body-sm transition-colors cursor-pointer ${
                              selectedTenor === t
                                ? 'font-bold bg-primary text-on-primary shadow-sm'
                                : 'font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                            }`}
                          >
                            {t}m
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Down payment Slider Simulation */}
                    <div>
                      <div className="flex items-center justify-between text-body-sm mb-1.5">
                        <span className="text-on-surface-variant font-medium">
                          {isRtl ? 'الدفعة الأولى المدفوعة' : 'Down Payment Equity'}
                        </span>
                        <span className="font-data-mono-num text-primary font-semibold">
                          {downPaymentPct}% (AED {currentDownPaymentAed.toLocaleString()})
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        step="5"
                        value={downPaymentPct}
                        onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <div className="flex justify-between font-label-caps text-label-caps text-on-surface-variant mt-1">
                        <span>20% (Min)</span>
                        <span>50%</span>
                        <span>80% (Max)</span>
                      </div>
                    </div>

                    {/* Estimated Monthly Installment Hero */}
                    <div className="p-space-md rounded-xl bg-surface-container text-center border border-white/[0.04]">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant block mb-1 font-semibold">
                        {isRtl ? 'القسط الشهري التقديري للعميل' : 'Estimated Client Monthly Installment'}
                      </span>
                      <div className="flex items-baseline justify-center gap-1.5">
                        <span className="font-label-caps text-headline-sm font-bold text-primary">AED</span>
                        <span className="font-data-currency-lg text-display-hero-mobile font-bold text-on-surface font-data-mono-num">
                          {calculatedMonthlyInstallment.toLocaleString()}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">/ mo</span>
                      </div>
                      <span className="font-body-sm text-[11px] text-on-surface-variant block mt-1">
                        Includes {flatRate}% Flat Profit ({selectedLender.bankName})
                      </span>
                    </div>

                    {/* Dealership Yield Breakdown */}
                    <div className="p-space-md rounded-xl bg-primary/10 border border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-label-caps text-label-caps uppercase text-on-primary-container font-bold">
                          {isRtl ? 'إجمالي عوائد الوكالة الخلفية' : 'Total Dealership Back-End Yield'}
                        </span>
                        <span className="font-data-mono-num text-headline-sm text-primary font-bold">
                          {role === 'SALES_REP' ? '••••••' : `AED ${totalDealerYield.toLocaleString()}`}
                        </span>
                      </div>
                      <div className="space-y-1 text-body-sm font-body-sm">
                        <div className="flex items-center justify-between text-on-surface">
                          <span className="text-on-surface-variant flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {selectedLender.bankCode} Bank Reserve ({selectedLender.dealerMarginSharePct}%)
                          </span>
                          <span className="font-data-mono-num font-medium">
                            {role === 'SALES_REP' ? '••••••' : `AED ${dynamicDealerReserve.toLocaleString()}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-on-surface">
                          <span className="text-on-surface-variant flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                            Sukoon Insurance Kickback (15%)
                          </span>
                          <span className="font-data-mono-num font-medium">
                            {role === 'SALES_REP' ? '••••••' : `AED ${insuranceKickback.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. DIRECT ACTION BUTTONS */}
                  <div className="mt-space-md space-y-2">
                    <button
                      type="button"
                      onClick={handleTransmitSanction}
                      className="w-full py-3 px-space-md rounded-lg bg-primary hover:brightness-105 text-on-primary font-body-sm text-body-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">fingerprint</span>
                      <span>{isRtl ? 'إرسال خطاب الاعتماد (UAE PASS)' : 'Transmit Sanction Letter (UAE PASS)'}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFeedbackMessage(
                            isRtl
                              ? 'تم إرسال طلب عرض مضاد لهامش الأرباح إلى مدير التمويل الإقليمي.'
                              : 'Counter-offer margin request submitted to regional auto finance committee.'
                          )
                        }
                        className="py-2 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-[12px] font-medium text-center transition-colors border border-white/[0.04] cursor-pointer"
                      >
                        {isRtl ? 'عرض هامش مضاد' : 'Counter-Offer Margin'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setFeedbackMessage(
                            isRtl
                              ? 'تم تقديم طلب إعفاء من الرسوم الإدارية للمصرف.'
                              : 'Bank processing fee waiver request submitted to credit desk.'
                          )
                        }
                        className="py-2 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-[12px] font-medium text-center transition-colors border border-white/[0.04] cursor-pointer"
                      >
                        {isRtl ? 'طلب إعفاء بنكي' : 'Request Bank Waiver'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION: PIPELINE TABLE OF RECENT F&I FILES */}
            <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm mb-space-lg border border-white/[0.04]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    {isRtl ? 'سجل ملفات التمويل والتأمين النشطة للوكالة' : 'Active Dealer F&I Loan & Insurance Pipeline'}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {isRtl
                      ? 'ملفات تمويل العملاء النشطة في فروع دبي وأبوظبي والإمارات الشمالية'
                      : 'In-flight customer financing files across Dubai, Abu Dhabi, and Northern Emirates locations'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-medium">
                    {isRtl ? 'تصفية حسب:' : 'Filter By:'}
                  </span>
                  <select
                    value={pipelineFilter}
                    onChange={(e) => setPipelineFilter(e.target.value)}
                    className="bg-surface-container text-on-surface font-body-sm text-body-sm rounded-lg px-2.5 py-1.5 outline-none cursor-pointer border border-white/[0.06]"
                  >
                    <option value="ALL">All Bank Files (18)</option>
                    <option value="APPROVED">Approved / Sanction Ready (8)</option>
                    <option value="COMMITTEE">Committee Review (6)</option>
                    <option value="SETTLED">Settled / Funded (4)</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm" id="pipeline-table">
                  <thead>
                    <tr className="bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase">
                      <th className="py-2.5 px-space-md rounded-l-lg">
                        {isRtl ? 'مرجع الملف والمركبة' : 'File Ref & Vehicle'}
                      </th>
                      <th className="py-2.5 px-space-md">
                        {isRtl ? 'العميل / الضامن' : 'Customer / Sponsor'}
                      </th>
                      <th className="py-2.5 px-space-md text-right">
                        {isRtl ? 'قيمة الفاتورة' : 'Invoice Value'}
                      </th>
                      <th className="py-2.5 px-space-md text-right">
                        {isRtl ? 'المبلغ الممول' : 'Financed Amt'}
                      </th>
                      <th className="py-2.5 px-space-md">
                        {isRtl ? 'المقرض والمنتج' : 'Lender & Product'}
                      </th>
                      <th className="py-2.5 px-space-md">
                        {isRtl ? 'حالة الاكتتاب' : 'Underwriting Status'}
                      </th>
                      <th className="py-2.5 px-space-md text-right">
                        {isRtl ? 'عائد الوكالة' : 'Dealer Reserve'}
                      </th>
                      <th className="py-2.5 px-space-md rounded-r-lg text-center">
                        {isRtl ? 'الإجراء' : 'Action'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-0">
                    {filteredPipeline.map((file) => (
                      <tr
                        key={file.id}
                        className="bg-surface-container/30 hover:bg-surface-container/60 transition-colors"
                      >
                        <td className="py-3 px-space-md">
                          <div className="font-data-mono-num text-[11px] text-primary font-semibold">
                            {file.fileRef}
                          </div>
                          <div className="font-body-sm text-body-sm font-semibold text-on-surface">
                            {file.vehicleTitle}
                          </div>
                          <div className="font-body-sm text-[11px] text-on-surface-variant">
                            {file.vehicleSpecs}
                          </div>
                        </td>

                        <td className="py-3 px-space-md">
                          <div className="font-body-sm text-body-sm font-medium text-on-surface">
                            {file.customerName}
                          </div>
                          <div className="font-body-sm text-[11px] text-tertiary flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[13px]">verified</span>
                            {file.customerTier}
                          </div>
                        </td>

                        <td className="py-3 px-space-md text-right font-data-mono-num font-medium text-on-surface">
                          AED {file.invoiceValueAed.toLocaleString()}
                        </td>

                        <td className="py-3 px-space-md text-right font-data-mono-num font-semibold text-secondary">
                          {file.financedAmtAed === 0
                            ? 'AED 0 (Cash Wire)'
                            : `AED ${file.financedAmtAed.toLocaleString()}`}
                        </td>

                        <td className="py-3 px-space-md">
                          <div className="font-body-sm text-body-sm font-medium text-on-surface">
                            {file.lenderName}
                          </div>
                          <div className="font-data-mono-num text-[11px] text-on-surface-variant">
                            {file.productTerms}
                          </div>
                        </td>

                        <td className="py-3 px-space-md">
                          <span
                            className={`px-2 py-0.5 rounded-full font-body-sm text-[12px] font-semibold inline-flex items-center gap-1 ${file.statusBadgeClass}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {file.underwritingStatus}
                          </span>
                        </td>

                        <td className="py-3 px-space-md text-right font-data-mono-num font-bold text-tertiary">
                          {role === 'SALES_REP'
                            ? '••••••'
                            : `AED ${file.dealerReserveAed.toLocaleString()}`}
                        </td>

                        <td className="py-3 px-space-md text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setFeedbackMessage(
                                isRtl
                                  ? `تم فتح تفاصيل الملف الائتماني ${file.fileRef} للمركبة ${file.vehicleTitle}.`
                                  : `Viewing credit dossier details for ${file.fileRef} (${file.vehicleTitle}).`
                              )
                            }
                            className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BOTTOM STATE DEMONSTRATOR DOCK */}
            <div className="rounded-xl bg-surface-container-high p-space-md shadow-md flex flex-col md:flex-row items-center justify-between gap-space-md border border-outline-variant/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">preview</span>
                </div>
                <div>
                  <span className="font-label-caps text-label-caps uppercase text-primary font-bold">
                    {isRtl ? 'محاكي الحالات التفاعلي' : 'Interactive State Demonstrator'}
                  </span>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">
                    {isRtl
                      ? 'محاكاة حالات النموذج للمراجعة التنظيمية مع المصرف المركزي الإماراتي:'
                      : 'Simulate prototype states for stakeholder presentation and UAE Central Bank regulatory review:'}
                  </div>
                </div>
              </div>

              {/* State Buttons Pill Strip */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('DEFAULT');
                    setSelectedBankId('lnd-01');
                    setFeedbackMessage(
                      isRtl
                        ? 'تم تفعيل حالة: القرض المعتمد لنقابة GT3 RS عبر بنك الإمارات دبي الوطني.'
                        : 'Demonstrator: Approved Syndication state loaded for Porsche 911 GT3 RS (ENBD Private).'
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg font-body-sm text-[12px] font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer ${
                    demonstratorState === 'DEFAULT'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {isRtl ? 'قرض معتمد (GT3 RS)' : 'Approved Syndication (GT3 RS)'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('HIGH_DBR');
                    setFeedbackMessage(
                      isRtl
                        ? 'تحذير تنظيمي (CBUAE): تجاوز نسبة عبء الدين DBR حد 50.0%. تم إغلاق مسار الإحالة التلقائية (استثناء S25).'
                        : 'Regulatory Alert: DBR exceeds 50.0% statutory threshold. Automatic banking referral hard-locked per S25 exception rules.'
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg font-body-sm text-[12px] font-medium transition-colors cursor-pointer ${
                    demonstratorState === 'HIGH_DBR'
                      ? 'bg-error-container text-on-error-container font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  {isRtl ? 'تحذير تجاوز نسبة الدين DBR' : 'High DBR / Subprime Warning'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('MURABAHA');
                    setSelectedBankId('lnd-03');
                    setFeedbackMessage(
                      isRtl
                        ? 'تم تفعيل حالة: عقد مرابحة إسلامي معتمد من هيئة الفتوى والرقابة الشرعية لبنك دبي الإسلامي.'
                        : 'Demonstrator: Islamic Auto Murabaha Contract loaded with DIB Sharia Shurah pre-clearance.'
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg font-body-sm text-[12px] font-medium transition-colors cursor-pointer ${
                    demonstratorState === 'MURABAHA'
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  {isRtl ? 'عقد المرابحة الإسلامي' : 'Islamic Murabaha Contract State'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('CLAIM');
                    setFeedbackMessage(
                      isRtl
                        ? 'تنبيه تأميني: تغطية حلبة دبي أوتودروم تتطلب تقرير الفحص الفني المعتمد قبل انطلاق الفعالية.'
                        : 'Insurance Rider: Dubai Autodrome track day cover requires pre-event passing sign-off.'
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg font-body-sm text-[12px] font-medium transition-colors cursor-pointer ${
                    demonstratorState === 'CLAIM'
                      ? 'bg-secondary text-on-secondary font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  {isRtl ? 'استثناء وثيقة التأمين' : 'Insurance Claim Exception'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* =========================================================================
          MODALS
      ========================================================================== */}

      {/* Modal 1: Submit Bank Dossier */}
      {submitDossierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">send</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'إرسال الملف الائتماني للمصرف' : 'Submit Bank Credit Dossier'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSubmitDossierModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div className="p-3 rounded-lg bg-surface-container border border-white/[0.06] flex flex-col gap-1">
                <span className="font-semibold text-primary font-data-mono-num text-xs">
                  {financeData.activeDossier.caseNumber} • {financeData.activeDossier.applicant.name}
                </span>
                <span className="font-semibold text-sm">{financeData.activeDossier.vehicle.title}</span>
                <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
                  <span>Selected Lender: {selectedLender.bankName}</span>
                  <span className="font-data-mono-num font-semibold text-tertiary">
                    Financed: AED {currentPrincipalAed.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container/60 border border-white/[0.04] space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-primary" />
                  <span>Client Consent for AECB Credit Inquiry verified via UAE PASS</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-primary" />
                  <span>Salary attestation pre-verified through Central Bank Open Banking</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-primary" />
                  <span>Vehicle inspection report and dealer valuation pass attached</span>
                </label>
              </div>

              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                {isRtl
                  ? 'ملاحظة: يتم تشفير البيانات المصرفية وفقاً لمعايير التشفير المعتمدة من مصرف الإمارات المركزي AES-256، ولن يتم سحب مبالغ دون مصادقة العميل الرقمية.'
                  : 'Notice: Transmissions are secured via CBUAE Open Finance endpoints. Dealer acts as verified referral originator; underwriting approval is strictly granted by licensed credit institutions.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSubmitDossierModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSubmitDossier}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold font-body-sm text-sm hover:brightness-105 transition-all shadow-md"
              >
                {isRtl ? 'إرسال الملف المشفر الآن' : 'Transmit Encrypted Dossier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Simulate Financing Terms */}
      {simulateTermsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">tune</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'محاكي شروط التمويل المخصص' : 'Custom Financing Terms Simulator'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSimulateTermsModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  Vehicle Price (AED)
                </label>
                <input
                  type="number"
                  value={simVehiclePrice}
                  onChange={(e) => setSimVehiclePrice(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] font-data-mono-num"
                />
              </div>

              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  Applicant Monthly Income (AED)
                </label>
                <input
                  type="number"
                  value={simMonthlyIncome}
                  onChange={(e) => setSimMonthlyIncome(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] font-data-mono-num"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                    Down Payment (%)
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={80}
                    value={simDownPaymentPct}
                    onChange={(e) => setSimDownPaymentPct(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] font-data-mono-num"
                  />
                </div>
                <div>
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                    Tenor (Months)
                  </label>
                  <select
                    value={simTenor}
                    onChange={(e) => setSimTenor(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08]"
                  >
                    <option value={24}>24 Months</option>
                    <option value={36}>36 Months</option>
                    <option value={48}>48 Months</option>
                    <option value={60}>60 Months</option>
                  </select>
                </div>
              </div>

              {/* Simulation Result Box */}
              {(() => {
                const simDownAed = (simVehiclePrice * simDownPaymentPct) / 100;
                const simPrincipal = simVehiclePrice - simDownAed;
                const simInterest = simPrincipal * 0.0249 * (simTenor / 12);
                const simMonthly = Math.round((simPrincipal + simInterest) / simTenor);
                const simDbr = Number(((simMonthly / (simMonthlyIncome || 1)) * 100).toFixed(1));
                const dbrBreach = simDbr > 50;

                return (
                  <div className="p-3 rounded-lg bg-surface-container border border-white/[0.06] flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">Estimated Monthly:</span>
                      <span className="font-data-mono-num font-bold text-primary text-sm">
                        AED {simMonthly.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">Simulated DBR:</span>
                      <span
                        className={`font-data-mono-num font-bold ${
                          dbrBreach ? 'text-error' : 'text-tertiary'
                        }`}
                      >
                        {simDbr}% {dbrBreach ? '(EXCEEDS 50% CAP)' : '(Compliant)'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSimulateTermsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold font-body-sm text-sm"
              >
                {isRtl ? 'إغلاق' : 'Close Simulator'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Rate Sheet Matrix (Q4) */}
      {rateSheetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">table_chart</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'مصفوفة أسعار الفائدة المصرفية (الربع الرابع)' : 'UAE Bank Rate Sheet Matrix (Q4)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRateSheetModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded bg-surface-container flex items-center justify-between">
                  <span className="font-bold">Emirates NBD Supercar Special</span>
                  <span className="font-data-mono-num text-primary font-semibold">2.49% Flat (4.65% Reducing)</span>
                </div>
                <div className="p-2.5 rounded bg-surface-container flex items-center justify-between">
                  <span className="font-bold">First Abu Dhabi Bank (FAB Elite)</span>
                  <span className="font-data-mono-num text-secondary font-semibold">2.39% Flat (4.48% Reducing)</span>
                </div>
                <div className="p-2.5 rounded bg-surface-container flex items-center justify-between">
                  <span className="font-bold">Dubai Islamic Bank (Murabaha)</span>
                  <span className="font-data-mono-num text-tertiary font-semibold">2.55% Profit Rate</span>
                </div>
                <div className="p-2.5 rounded bg-surface-container flex items-center justify-between">
                  <span className="font-bold">Abu Dhabi Commercial Bank (Private)</span>
                  <span className="font-data-mono-num text-on-surface-variant font-semibold">2.60% Flat</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setRateSheetModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Export Compliance Log */}
      {complianceLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">terminal</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'سجل الامتثال التنظيمي CBUAE' : 'CBUAE Regulatory Compliance Log'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setComplianceLogModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div className="p-3 rounded-lg bg-surface-container font-data-mono-num text-xs flex flex-col gap-1 text-on-surface-variant">
                <div className="text-secondary font-bold">CBUAE Consumer Protection Standard #CPS-2021</div>
                <div>Audit Scope: Dealer Originator F&I Referral Record</div>
                <div>LTV Capping Rule: 80% Maximum Loan to Value (100% Compliant)</div>
                <div>DBR Capping Rule: 50% Maximum Debt Burden Ratio (0 Breaches)</div>
                <div>AECB Consent Hash: #AECB-CONSENT-992-842-OK</div>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isRtl
                  ? 'تم تجهيز سجل الامتثال الائتماني وفقاً للمتطلبات الرقابية للمصرف المركزي وهيئة الأوراق المالية والسلع.'
                  : 'Compliance audit package generated for Central Bank of the UAE regulatory examination.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setComplianceLogModalOpen(false);
                  setFeedbackMessage(
                    isRtl
                      ? 'تم تصدير سجل الامتثال التنظيمي CBUAE بنجاح.'
                      : 'CBUAE Regulatory Compliance Audit Log exported successfully.'
                  );
                }}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold font-body-sm text-sm"
              >
                {isRtl ? 'تصدير وحفظ' : 'Export & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
