'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { DealerSidebar } from '../../components/dealer-sidebar';
import { DealerHeader } from '../../components/dealer-header';
import { previewSafeMessage } from '../../lib/preview';
import {
  VERIFIED_FLEET_CONSIGNMENT_FIXTURE,
  FleetAndConsignmentData,
  ConsignmentPipelineRow,
} from '../../lib/api';

export default function FleetAndConsignmentPage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [role] = useState<'PRINCIPAL' | 'SALES_REP'>('PRINCIPAL');
  const isRtl = locale === 'ar';

  const [fleetData, setFleetData] = useState<FleetAndConsignmentData>(VERIFIED_FLEET_CONSIGNMENT_FIXTURE);
  const [vaultFilter, setVaultFilter] = useState<'ALL' | 'ACTIVE' | 'OFFSITE' | 'SOLD'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [demonstratorState, setDemonstratorState] = useState<'ACTIVE' | 'SOLD_SETTLEMENT' | 'EXPIRATION_BATCH' | 'LEGAL_HOLD'>('ACTIVE');

  // Interactive Calculator State
  const [askingPriceInput, setAskingPriceInput] = useState<number>(1650000);
  const [consignorReserveInput, setConsignorReserveInput] = useState<number>(1480000);
  const [reconditioningDeductionInput, setReconditioningDeductionInput] = useState<number>(7200);

  // Modals & Feedback
  const [feedbackMessage, setFeedbackMessageState] = useState<string | null>(null);
  // Preview module: feedback never claims an external action happened.
  const setFeedbackMessage = (message: string | null) => setFeedbackMessageState(previewSafeMessage(message));
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [createFleetModalOpen, setCreateFleetModalOpen] = useState(false);
  const [bailmentPdfModalOpen, setBailmentPdfModalOpen] = useState(false);
  const [executeOfferModalOpen, setExecuteOfferModalOpen] = useState(false);

  // New Consignment Form State
  const [newClientName, setNewClientName] = useState('Al Qasimi Royal Holdings');
  const [newVehicleModel, setNewVehicleModel] = useState('2024 Lamborghini Revuelto');
  const [newVin, setNewVin] = useState('ZHWUA1ZE6RL002819');
  const [newReservePrice, setNewReservePrice] = useState(2450000);
  const [newAskingPrice, setNewAskingPrice] = useState(2680000);
  const [newMandatePeriod, setNewMandatePeriod] = useState('90');

  // Calculated Split
  const dynamicGrossSpread = Math.max(0, askingPriceInput - consignorReserveInput);
  const dynamicNetProfit = Math.max(0, dynamicGrossSpread - reconditioningDeductionInput);
  const dynamicNetMarginPct = askingPriceInput > 0 ? (dynamicNetProfit / askingPriceInput) * 100 : 0;

  // Filtered Pipeline Rows
  const filteredPipeline = useMemo(() => {
    return fleetData.pipeline.filter((row) => {
      if (searchFilter.trim() === '') return true;
      const q = searchFilter.toLowerCase();
      return (
        row.accountName.toLowerCase().includes(q) ||
        row.vehicleTitle.toLowerCase().includes(q) ||
        row.vin.toLowerCase().includes(q) ||
        row.plate.toLowerCase().includes(q)
      );
    });
  }, [fleetData.pipeline, searchFilter]);

  // Handlers
  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardModalOpen(false);

    const newSpread = Math.max(0, newAskingPrice - newReservePrice);
    const newMarginPct = newAskingPrice > 0 ? (newSpread / newAskingPrice) * 100 : 0;

    const newRow: ConsignmentPipelineRow = {
      id: `pipe-${Date.now()}`,
      accountName: newClientName,
      accountType: 'VIP Consignment Mandate',
      accountTypeBadgeClass: 'text-primary',
      vehicleTitle: newVehicleModel,
      vehicleSpecs: '2024 • GCC Specification • Fresh Mandate',
      vin: newVin,
      plate: 'Plate: In Transit',
      agreementType: `${newMandatePeriod}-Day Exclusive`,
      agreementBadgeClass: 'bg-primary/10 text-primary',
      agreedValueAed: newAskingPrice,
      commissionSplitLabel: `${newMarginPct.toFixed(1)}% (AED ${newSpread.toLocaleString()})`,
      mulkiyaStatus: 'Valid (2026)',
      mulkiyaValid: true,
      pipelineStatus: 'Vault Active',
      pipelineBadgeClass: 'bg-tertiary/15 text-tertiary',
    };

    setFleetData((prev) => ({
      ...prev,
      kpis: {
        ...prev.kpis,
        consignedUnitsCount: prev.kpis.consignedUnitsCount + 1,
        portfolioValueAed: prev.kpis.portfolioValueAed + newAskingPrice,
      },
      pipeline: [newRow, ...prev.pipeline],
    }));

    setFeedbackMessage(
      isRtl
        ? `تم تسجيل عقد الأمانة بنجاح للمركبة (${newVehicleModel}) تحت الحضانة القضائية المؤمنة.`
        : `Consignment agreement active for ${newVehicleModel} with AED ${newAskingPrice.toLocaleString()} valuation.`
    );
  };

  const handleBatchRenewal = () => {
    setFeedbackMessage(
      isRtl
        ? 'تم إرسال حزمة تجديد الملكية وفحص تسجيل المجمّعة (8 مركبات) مباشرة إلى بوابة هيئة الطرق والمواصلات RTA.'
        : 'Automated batch Mulkiya renewal for 8 fleet vehicles dispatched to Dubai RTA e-Services gateway.'
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
          locale={locale}
          onLocaleToggle={() => setLocale(locale === 'en' ? 'ar' : 'en')}
        />

        <main className="w-full pt-16 bg-surface px-space-lg pb-space-xl flex-1">
          <div className="flex flex-col w-full space-y-space-lg">
            {/* Feedback Notification Banner */}
            {feedbackMessage && (
              <div className="mt-space-md p-space-md rounded-xl bg-primary-container/20 border border-primary text-on-surface flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                  <div>
                    <span className="font-headline-sm text-body-md font-semibold text-primary block">
                      {isRtl ? 'عمليات الأسطول والحضانة المعتمدة' : 'Fleet & Bailment Action Recorded'}
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

            {/* Scope & P1 Roadmap Conceptual Header Banner */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-high/90 backdrop-blur-md p-space-lg shadow-xl border border-white/[0.04]">
              <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-primary/10 via-primary-container/5 to-transparent blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 -bottom-24 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg">
                <div className="flex flex-col space-y-2 max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary font-label-caps text-label-caps uppercase tracking-wider font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      [FUTURE ROADMAP • P1 SPECIFICATION — CONCEPT TEMPLATE]
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[13px] text-tertiary">gavel</span>
                      UAE Fed. Law No. 50 (2022) Bailment Compliant
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[13px] text-secondary">verified_user</span>
                      AED 100M Allianz Custody Floater
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 pt-1">
                    <h1 className="font-headline-xl text-headline-xl font-bold tracking-tight text-on-surface text-balance">
                      Corporate Fleet Accounts &amp; VIP Consignment Portfolio
                    </h1>
                    <span className="font-headline-md text-headline-md font-medium text-primary tracking-normal" dir="rtl">
                      إدارة أساطيل الشركات وعقود البيع بالأمانة
                    </span>
                  </div>

                  <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl leading-relaxed">
                    <span className="font-semibold text-primary">CONCEPT TEMPLATE ONLY:</span> Phase 1 Dealership Management System Roadmap. Specification mockups for VIP client consignment management, corporate fleet lifecycle tracking, RTA Mulkiya bulk renewal alerts, and tiered consignment commission splits.
                  </p>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start xl:self-center">
                  <button
                    type="button"
                    onClick={() => setOnboardModalOpen(true)}
                    className="h-11 px-4 rounded-lg bg-primary text-on-primary font-body-md text-body-md font-semibold flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    id="btnOnboardConsignment"
                  >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    <span>{isRtl ? 'تسجيل عقد أمانة جديد' : 'Onboard Consignment'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateFleetModalOpen(true)}
                    className="h-11 px-3.5 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface font-body-md text-body-md font-medium flex items-center gap-2 transition-all cursor-pointer border border-white/[0.05]"
                  >
                    <span className="material-symbols-outlined text-[19px] text-secondary">domain_add</span>
                    <span>{isRtl ? 'إنشاء حساب أسطول شركات' : 'Create Corporate Fleet'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchRenewal}
                    className="h-11 px-3.5 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface font-body-md text-body-md font-medium flex items-center gap-2 transition-all cursor-pointer border border-white/[0.05]"
                  >
                    <span className="material-symbols-outlined text-[19px] text-tertiary">autorenew</span>
                    <span>{isRtl ? 'تجديد الملكية بالجملة RTA' : 'Bulk Mulkiya Renewal'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFeedbackMessage(
                        isRtl
                          ? 'تم إنشاء كشف تصفية مستحقات الأمانة الضريبي بصيغة PDF.'
                          : 'Official Consignment Payout & Bailment Statement exported to PDF.'
                      )
                    }
                    className="h-11 px-3 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-all cursor-pointer border border-white/[0.05]"
                    title="Consignment Payout Statement"
                  >
                    <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                  </button>
                </div>
              </div>
            </div>

            {/* KPI Operational Telemetry Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
              {/* KPI 1 */}
              <div className="bg-surface-container-low rounded-xl p-space-md shadow-md relative overflow-hidden flex flex-col justify-between border border-white/[0.04]">
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold tracking-wider">
                      {isRtl ? 'قيمة محفظة البيع بالأمانة' : 'Consignment Portfolio Value'}
                    </span>
                    <div className="mt-1 font-data-currency-lg text-data-currency-lg font-bold text-on-surface flex items-baseline gap-1.5 font-data-mono-num">
                      <span className="text-xs font-label-caps font-semibold text-primary font-sans">AED</span>
                      <span>{fleetData.kpis.portfolioValueAed.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[22px]">diamond</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm pt-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                    <span>{fleetData.kpis.consignedUnitsCount} {isRtl ? 'سيارات فائقة مسجلة' : 'Consigned Exotics & Hypercars'}</span>
                  </span>
                  <span className="font-data-mono-num text-data-mono-num text-primary font-medium">
                    {fleetData.kpis.insuranceCoveragePct}% Insured
                  </span>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="bg-surface-container-low rounded-xl p-space-md shadow-md relative overflow-hidden flex flex-col justify-between border border-white/[0.04]">
                <div className="absolute top-0 left-0 right-0 h-1 bg-secondary" />
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold tracking-wider">
                      {isRtl ? 'مركبات الأساطيل المدارة' : 'Fleet Units Under Management'}
                    </span>
                    <div className="mt-1 font-data-currency-lg text-data-currency-lg font-bold text-on-surface flex items-baseline gap-1.5 font-data-mono-num">
                      <span>{fleetData.kpis.fleetUnitsUnderManagement}</span>
                      <span className="font-body-md text-body-md text-on-surface-variant font-normal font-sans">
                        {isRtl ? 'مركبة' : 'Vehicles'}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined text-[22px]">directions_car</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm pt-2">
                  <span>Across {fleetData.kpis.vipKeyAccountsCount} VIP Key Accounts</span>
                  <span className="font-data-mono-num text-data-mono-num text-secondary font-medium">
                    {fleetData.kpis.fleetUptimePct.toFixed(1)}% Uptime
                  </span>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="bg-surface-container-low rounded-xl p-space-md shadow-md relative overflow-hidden flex flex-col justify-between border border-white/[0.04]">
                <div className="absolute top-0 left-0 right-0 h-1 bg-tertiary" />
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold tracking-wider">
                      {isRtl ? 'عائد الأمانة المتوقع (شهرياً)' : 'Consignment Yield (MTD Projected)'}
                    </span>
                    <div className="mt-1 font-data-currency-lg text-data-currency-lg font-bold text-tertiary flex items-baseline gap-1.5 font-data-mono-num">
                      <span className="text-xs font-label-caps font-semibold text-on-surface-variant font-sans">AED</span>
                      <span>
                        {role === 'SALES_REP' ? '••••••' : fleetData.kpis.mtdProjectedYieldAed.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
                    <span className="material-symbols-outlined text-[22px]">trending_up</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm pt-2">
                  <span className="truncate">Avg {fleetData.kpis.avgMarginPct}% Consignment Margin</span>
                  <span className="font-data-mono-num text-data-mono-num text-tertiary font-medium">
                    {fleetData.kpis.closedSalesCount} Closes
                  </span>
                </div>
              </div>

              {/* KPI 4 */}
              <div className="bg-surface-container-low rounded-xl p-space-md shadow-md relative overflow-hidden flex flex-col justify-between border border-white/[0.04]">
                <div className="absolute top-0 left-0 right-0 h-1 bg-error" />
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold tracking-wider">
                      {isRtl ? 'التوافق مع فحص تسجيل وهيئة الطرق' : 'RTA Mulkiya & Tasjeel Compliance'}
                    </span>
                    <div className="mt-1 font-data-currency-lg text-data-currency-lg font-bold text-on-surface flex items-baseline gap-2 font-data-mono-num">
                      <span>{fleetData.kpis.mulkiyaCompliancePct.toFixed(1)}%</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-label-caps bg-error/15 text-error font-semibold font-sans">
                        {fleetData.kpis.expiringUnitsCount} EXPIRING
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center text-error shrink-0">
                    <span className="material-symbols-outlined text-[22px]">verified</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm pt-2">
                  <span>{fleetData.kpis.expiringUnitsCount} units &lt; 30d expiry</span>
                  <button
                    type="button"
                    onClick={handleBatchRenewal}
                    className="text-primary font-body-sm hover:underline cursor-pointer flex items-center gap-0.5 font-medium"
                  >
                    <span>{isRtl ? 'المسار السريع' : 'Fast-Track'}</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main 2-Column Workstation Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              {/* LEFT COLUMN: ~65% (8/12 Columns) */}
              <div className="lg:col-span-8 flex flex-col space-y-space-lg">
                {/* SUBSECTION 1: VIP Consignment Custody & Spotlight */}
                <div className="bg-surface-container-low rounded-xl shadow-lg p-space-lg flex flex-col space-y-space-md border border-white/[0.04]">
                  {/* Filter Bar and Custody Vault Tabs */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[24px]">vpn_key</span>
                      <h2 className="font-headline-md text-headline-md font-semibold text-on-surface tracking-tight">
                        {isRtl ? 'خزينة الحضانة القضائية للأمانة' : 'VIP Consignment Custody Vault'}
                      </h2>
                    </div>
                    <span className="font-data-mono-num text-data-mono-num text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded border border-white/[0.05]">
                      Vault Loc: Bay 01-12 Climate Wing
                    </span>
                  </div>

                  {/* Filter Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setVaultFilter('ALL')}
                      className={`px-3.5 py-1.5 rounded-full font-body-sm text-body-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        vaultFilter === 'ALL'
                          ? 'bg-on-surface text-surface'
                          : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                      }`}
                    >
                      <span>{isRtl ? 'جميع المركبات' : 'All Consignments'}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-surface/20 text-[11px] font-data-mono-num">
                        {fleetData.kpis.consignedUnitsCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVaultFilter('ACTIVE')}
                      className={`px-3.5 py-1.5 rounded-full font-body-sm text-body-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                        vaultFilter === 'ACTIVE'
                          ? 'bg-on-surface text-surface font-semibold'
                          : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-tertiary" />
                      <span>{isRtl ? 'نشط في صالة العرض' : 'Active on Showroom Floor'}</span>
                      <span className="font-data-mono-num text-on-surface-variant text-[11px]">22</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVaultFilter('OFFSITE')}
                      className={`px-3.5 py-1.5 rounded-full font-body-sm text-body-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                        vaultFilter === 'OFFSITE'
                          ? 'bg-on-surface text-surface font-semibold'
                          : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      <span>{isRtl ? 'المستودع المناخي المعتمد' : 'Off-Site Climate Storage'}</span>
                      <span className="font-data-mono-num text-on-surface-variant text-[11px]">8</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVaultFilter('SOLD')}
                      className={`px-3.5 py-1.5 rounded-full font-body-sm text-body-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                        vaultFilter === 'SOLD'
                          ? 'bg-on-surface text-surface font-semibold'
                          : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span>{isRtl ? 'تم البيع / بانتظار التصفية' : 'Sold / Payout Pending'}</span>
                      <span className="font-data-mono-num text-on-surface-variant text-[11px]">2</span>
                    </button>
                  </div>

                  {/* Featured Consignment Agreement Detail Card */}
                  <div className="bg-surface-container rounded-xl p-space-md shadow-inner flex flex-col space-y-space-md border border-white/[0.04]">
                    {/* Vehicle Top Header */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-space-sm pb-space-sm bg-surface-container-high/60 p-space-md rounded-lg">
                      <div className="flex items-center gap-space-md">
                        <div className="w-14 h-14 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0 shadow">
                          <span className="material-symbols-outlined text-[32px]">sports_score</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-label-caps text-label-caps uppercase bg-primary/20 text-primary font-bold">
                              {fleetData.featuredConsignment.mandateType}
                            </span>
                            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                              Chassis:{' '}
                              <span className="font-data-mono-num text-on-surface font-bold">
                                {fleetData.featuredConsignment.chassisVin}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setFeedbackMessage(
                                  isRtl
                                    ? `تم نسخ رقم الشاسيه ${fleetData.featuredConsignment.chassisVin}`
                                    : `Chassis VIN ${fleetData.featuredConsignment.chassisVin} copied to clipboard.`
                                )
                              }
                              className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                              title="Copy VIN"
                            >
                              <span className="material-symbols-outlined text-[15px]">content_copy</span>
                            </button>
                          </div>

                          <h3 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mt-0.5">
                            {fleetData.featuredConsignment.vehicleTitle}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-on-surface-variant font-body-sm text-body-sm">
                            <span className="flex items-center gap-1 text-on-surface font-medium">
                              <span className="material-symbols-outlined text-primary text-[16px]">person</span>
                              {fleetData.featuredConsignment.consignorName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-caps text-[10px] font-semibold">
                              {fleetData.featuredConsignment.consignorTier}
                            </span>
                            <span>•</span>
                            <span>
                              Physical Loc:{' '}
                              <strong className="text-on-surface">
                                {fleetData.featuredConsignment.physicalLocation}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Agreement Expiry Dial Badge */}
                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center p-2.5 rounded-lg bg-surface-container-lowest shrink-0 border border-white/[0.03]">
                        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                          {isRtl ? 'صلاحية التفويض' : 'Mandate Validity'}
                        </span>
                        <div className="font-data-mono-num text-headline-sm text-headline-sm font-bold text-primary flex items-center gap-1">
                          <span>{fleetData.featuredConsignment.mandateDaysRemaining} Days</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                            / {fleetData.featuredConsignment.mandateDaysTotal}d
                          </span>
                        </div>
                        <span className="font-label-caps text-label-caps text-tertiary">Active Exclusive</span>
                      </div>
                    </div>

                    {/* Grid: Financials & Inspection Telemetry */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
                      <div className="p-space-sm bg-surface-container-high rounded-lg flex flex-col justify-between border border-white/[0.04]">
                        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                          {isRtl ? 'الحد الأدنى المتفق عليه للمالك' : 'Agreed Reserve (Net to Consignor)'}
                        </span>
                        <div className="mt-2 font-data-currency-lg text-headline-md text-headline-md font-bold text-on-surface font-data-mono-num">
                          <span className="text-xs font-label-caps text-primary font-sans">AED</span>{' '}
                          {fleetData.featuredConsignment.agreedReserveAed.toLocaleString()}
                        </div>
                        <span className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                          Guaranteed escrow minimum
                        </span>
                      </div>

                      <div className="p-space-sm bg-surface-container-high rounded-lg flex flex-col justify-between border border-white/[0.04]">
                        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                          {isRtl ? 'سعر العرض في صالة العرض' : 'Showroom Asking List Price'}
                        </span>
                        <div className="mt-2 font-data-currency-lg text-headline-md text-headline-md font-bold text-primary font-data-mono-num">
                          <span className="text-xs font-label-caps text-on-surface-variant font-sans">AED</span>{' '}
                          {fleetData.featuredConsignment.askingPriceAed.toLocaleString()}
                        </div>
                        <span className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                          Market competitive list tier
                        </span>
                      </div>

                      <div className="p-space-sm bg-surface-container-high rounded-lg flex flex-col justify-between border border-white/[0.04]">
                        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                          {isRtl ? 'عمولة وهوامش الوكالة' : 'Dealership Spread / Commission'}
                        </span>
                        <div className="mt-2 font-data-currency-lg text-headline-md text-headline-md font-bold text-tertiary font-data-mono-num">
                          <span className="text-xs font-label-caps text-on-surface-variant font-sans">AED</span>{' '}
                          {role === 'SALES_REP'
                            ? '••••••'
                            : fleetData.featuredConsignment.grossSpreadAed.toLocaleString()}
                        </div>
                        <span className="mt-1 font-body-sm text-body-sm text-tertiary font-medium">
                          {fleetData.featuredConsignment.grossMarginTargetPct.toFixed(1)}% Gross Margin Target
                        </span>
                      </div>
                    </div>

                    {/* Detail Metrics and Absorbed Services */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-1">
                      {/* Tasjeel Certificate Box */}
                      <div className="flex items-center gap-space-md p-space-sm bg-surface-container-lowest rounded-lg border border-white/[0.03]">
                        <div className="w-12 h-12 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[28px]">verified</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-label-caps text-label-caps uppercase text-on-surface font-semibold">
                              Tasjeel 150-Point Inspection
                            </span>
                            <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-data-mono-num text-[11px] font-bold">
                              {fleetData.featuredConsignment.tasjeelGrade}
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">
                            {fleetData.featuredConsignment.tasjeelNotes}
                          </p>
                        </div>
                      </div>

                      {/* Maintenance & Detailing Absorption */}
                      <div className="flex items-center gap-space-md p-space-sm bg-surface-container-lowest rounded-lg border border-white/[0.03]">
                        <div className="w-12 h-12 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[28px]">auto_fix_high</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-label-caps text-label-caps uppercase text-on-surface font-semibold">
                              Absorbed Prep Detailing
                            </span>
                            <span className="font-data-mono-num text-data-mono-num text-on-surface font-bold">
                              AED {fleetData.featuredConsignment.prepDetailingAed.toLocaleString()}
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">
                            {fleetData.featuredConsignment.prepDetailingDescription}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Bar for Consignment */}
                    <div className="flex flex-wrap items-center justify-between gap-space-sm pt-2 bg-surface-container-lowest/50 p-space-sm rounded-lg border border-white/[0.03]">
                      <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                        <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                        <span>
                          Custody Bailment Contract:{' '}
                          <strong className="text-on-surface font-data-mono-num">
                            {fleetData.featuredConsignment.bailmentContractRef}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setBailmentPdfModalOpen(true)}
                          className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm transition-colors border border-white/[0.05] cursor-pointer"
                        >
                          {isRtl ? 'عرض عقد الحضانة PDF' : 'View Bailment PDF'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFeedbackMessage(
                              isRtl
                                ? 'تم تفعيل نافذة تعديل تسعير الأمانة ومزامنتها مع المالك.'
                                : 'Pricing revision module triggered for Ferrari 296 GTB mandate.'
                            )
                          }
                          className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm transition-colors border border-white/[0.05] cursor-pointer"
                        >
                          {isRtl ? 'تعديل السعر' : 'Update Pricing'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setExecuteOfferModalOpen(true)}
                          className="px-3.5 py-1.5 rounded bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
                        >
                          {isRtl ? 'تنفيذ عرض شراء المشتري' : 'Execute Buyer Offer'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SUBSECTION 2: Corporate Fleet Account Management & Operations Matrix */}
                <div className="bg-surface-container-low rounded-xl shadow-lg p-space-lg flex flex-col space-y-space-md border border-white/[0.04]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[24px]">corporate_fare</span>
                      <h2 className="font-headline-md text-headline-md font-semibold text-on-surface tracking-tight">
                        {isRtl ? 'مصفوفة أساطيل الشركات المعتمدة' : 'Corporate Fleet Account Matrix'}
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-secondary/10 text-secondary font-label-caps text-label-caps uppercase font-semibold">
                      6 Active Enterprise Contracts
                    </span>
                  </div>

                  {/* Corporate Account Spotlight */}
                  <div className="bg-surface-container rounded-xl p-space-md space-y-space-md border border-white/[0.04]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-sm bg-surface-container-high/50 p-space-md rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-label-caps text-label-caps uppercase px-2 py-0.5 rounded bg-secondary/20 text-secondary font-bold">
                            Spotlight Account
                          </span>
                          <span className="font-label-caps text-label-caps text-on-surface-variant font-data-mono-num">
                            TRN: {fleetData.spotlightFleet.trn}
                          </span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight mt-1">
                          {fleetData.spotlightFleet.accountName}
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          DED License {fleetData.spotlightFleet.dedLicense} • {fleetData.spotlightFleet.tier} • {fleetData.spotlightFleet.paymentTerms}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                            Active Managed Fleet
                          </span>
                          <div className="font-data-mono-num text-headline-sm text-headline-sm font-bold text-on-surface">
                            {fleetData.spotlightFleet.activeUnitsCount} Units
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined text-[22px]">hub</span>
                        </div>
                      </div>
                    </div>

                    {/* Fleet Composition Breakdown Strip */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
                      {fleetData.spotlightFleet.composition.map((comp) => (
                        <div
                          key={comp.model}
                          className="p-space-sm bg-surface-container-high rounded-lg flex items-center justify-between border border-white/[0.03]"
                        >
                          <div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">{comp.model}</span>
                            <div className="font-headline-sm text-headline-sm font-bold text-on-surface mt-0.5 font-data-mono-num">
                              {comp.units} Units
                            </div>
                          </div>
                          <span className={`font-label-caps text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${comp.badgeClass}`}>
                            {comp.statusLabel}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* SLA & Terms Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-space-sm p-space-sm bg-surface-container-lowest rounded-lg font-body-sm text-body-sm border border-white/[0.03]">
                      <div className="flex items-center gap-2 text-on-surface">
                        <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
                        <span>{fleetData.spotlightFleet.slaDescription}</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-secondary text-[18px]">receipt</span>
                        <span>Direct UAE Corporate Tax TRN integration active</span>
                      </div>
                    </div>

                    {/* Live Telemetry & Mulkiya Tracking Row Items */}
                    <div className="flex flex-col space-y-2">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold">
                        Priority Monitored Fleet Units
                      </span>

                      {fleetData.spotlightFleet.priorityUnits.map((u) => (
                        <div
                          key={u.unitId}
                          className="p-space-sm bg-surface-container-high/80 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-space-sm border border-white/[0.03]"
                        >
                          <div className="flex items-center gap-space-sm">
                            <span className="px-2 py-1 rounded bg-surface-container-highest font-data-mono-num text-[12px] font-bold text-on-surface">
                              {u.unitId}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-body-md text-body-md font-semibold text-on-surface">
                                  {u.model}
                                </span>
                                <span className="px-2 py-0.2 rounded bg-surface-container-lowest font-data-mono-num text-[11px] text-primary">
                                  Plate: {u.plate}
                                </span>
                              </div>
                              <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                                <span>
                                  Mulkiya: <strong className={u.isUrgent ? 'text-error font-medium' : 'text-tertiary'}>{u.mulkiyaValidUntil}</strong>
                                </span>
                                <span>•</span>
                                <span>Odometer: {u.odometerKm.toLocaleString()} KM</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">
                                Next 10,000 KM Interval
                              </span>
                              <div className="font-data-mono-num text-body-sm text-body-sm font-semibold text-on-surface">
                                In {u.nextIntervalKm.toLocaleString()} KM
                              </div>
                            </div>

                            {u.isUrgent ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setFeedbackMessage(
                                    isRtl
                                      ? `تم حجز فحص تسجيل السريع للمركبة ${u.unitId} لدى مركز القوز الفني.`
                                      : `Fast-track RTA inspection dispatched for unit ${u.unitId} at Al Quoz Tasjeel.`
                                  )
                                }
                                className="px-3 py-1 rounded bg-error/20 hover:bg-error/30 text-error font-body-sm text-body-sm font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px]">send</span>
                                <span>Dispatch</span>
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-tertiary/15 text-tertiary font-body-sm text-[12px] font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                                <span>Compliant</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: ~35% (4/12 Columns) */}
              <div className="lg:col-span-4 flex flex-col space-y-space-lg">
                {/* CARD 1: Legal Framework & Custody Ledger */}
                <div className="bg-surface-container-low rounded-xl shadow-lg p-space-lg flex flex-col space-y-space-md border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[22px]">policy</span>
                      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {isRtl ? 'سجل الحضانة والأمانة القانوني' : 'Custody & Bailment Ledger'}
                      </h3>
                    </div>
                    <span className="material-symbols-outlined text-tertiary text-[20px]">verified</span>
                  </div>

                  <div className="space-y-space-sm text-body-sm text-body-sm text-on-surface-variant">
                    <div className="p-space-sm bg-surface-container rounded-lg space-y-1 border border-white/[0.03]">
                      <div className="font-label-caps text-label-caps uppercase text-on-surface font-semibold flex items-center justify-between">
                        <span>UAE Legal Bailment Baseline</span>
                        <span className="text-tertiary">Verified</span>
                      </div>
                      <p className="text-[12px] leading-relaxed">
                        Fully compliant with UAE Commercial Transactions Law (Federal Decree-Law No. 50 of 2022). Consignor retains unencumbered legal title until electronic RTA title transfer.
                      </p>
                    </div>

                    <div className="p-space-sm bg-surface-container rounded-lg space-y-1 border border-white/[0.03]">
                      <div className="font-label-caps text-label-caps uppercase text-on-surface font-semibold flex items-center justify-between">
                        <span>Showroom Floater Insurance</span>
                        <span className="font-data-mono-num text-primary">AED 100M</span>
                      </div>
                      <p className="text-[12px] leading-relaxed">
                        Allianz Global Corporate &amp; Specialty underwritten policy #DXB-CUST-889. Full comprehensive loss coverage across test drives, storage, and detailing.
                      </p>
                    </div>

                    <div className="p-space-sm bg-surface-container rounded-lg space-y-1 border border-white/[0.03]">
                      <div className="font-label-caps text-label-caps uppercase text-on-surface font-semibold flex items-center justify-between">
                        <span>Lien &amp; Mortgage Status</span>
                        <span className="text-tertiary font-semibold">Zero Liens</span>
                      </div>
                      <p className="text-[12px] leading-relaxed">
                        Digital RTA verification cleared. No registered chattel mortgages with UAE Central Bank or local banking institutions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CARD 2: Consignment Commission Split Calculator */}
                <div className="bg-surface-container-low rounded-xl shadow-lg p-space-lg flex flex-col space-y-space-md relative overflow-hidden border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-[22px]">calculate</span>
                      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {isRtl ? 'محرك حاسبة عمولة الأمانة' : 'Commission Split Engine'}
                      </h3>
                    </div>
                    <span className="font-label-caps text-label-caps uppercase px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-bold">
                      Dynamic Math
                    </span>
                  </div>

                  <div className="bg-surface-container p-space-md rounded-lg space-y-space-sm border border-white/[0.03]">
                    <div className="flex items-center justify-between font-body-sm text-body-sm">
                      <span className="text-on-surface-variant">{isRtl ? 'سعر البيع المستهدف' : 'Target Sale Price (Asking)'}</span>
                      <span className="font-data-mono-num font-semibold text-on-surface">
                        AED {askingPriceInput.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-body-sm text-body-sm">
                      <span className="text-on-surface-variant">{isRtl ? 'حد المالك الأدنى (صافي الدفع)' : 'Consignor Reserve (Net Payout)'}</span>
                      <span className="font-data-mono-num font-semibold text-primary">
                        - AED {consignorReserveInput.toLocaleString()}
                      </span>
                    </div>

                    <div className="pt-2 flex items-center justify-between font-body-sm text-body-sm border-t border-white/[0.04]">
                      <span className="text-on-surface-variant">{isRtl ? 'إجمالي رسوم الوكالة' : 'Gross Dealership Fee'}</span>
                      <span className="font-data-mono-num font-semibold text-on-surface">
                        {role === 'SALES_REP' ? '••••••' : `AED ${dynamicGrossSpread.toLocaleString()}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-body-sm text-body-sm">
                      <span className="text-on-surface-variant flex items-center gap-1">
                        <span>{isRtl ? 'استقطاعات التجهيز والصيانة' : 'Reconditioning Deductions'}</span>
                        <span className="material-symbols-outlined text-[13px] text-on-surface-variant" title="Workshop Inspection & Detailing">
                          info
                        </span>
                      </span>
                      <span className="font-data-mono-num font-semibold text-error">
                        - AED {reconditioningDeductionInput.toLocaleString()}
                      </span>
                    </div>

                    {/* Total Calculation Result Highlight */}
                    <div className="pt-3 mt-1 bg-surface-container-high p-space-sm rounded-lg flex items-center justify-between border border-white/[0.03]">
                      <div>
                        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">
                          {isRtl ? 'صافي ربح الوكالة' : 'Net Dealership Profit'}
                        </span>
                        <div className="font-data-mono-num text-headline-sm text-headline-sm font-bold text-tertiary">
                          {role === 'SALES_REP' ? '••••••' : `AED ${dynamicNetProfit.toLocaleString()}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                          {isRtl ? 'صافي الهامش' : 'Net Margin'}
                        </span>
                        <div className="font-data-mono-num text-body-md text-body-md font-bold text-on-surface">
                          {role === 'SALES_REP' ? '••••••' : `${dynamicNetMarginPct.toFixed(2)}%`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Sliders / Adjuster Controls */}
                  <div className="flex flex-col gap-2 pt-1">
                    <label className="font-label-caps text-[11px] text-on-surface-variant uppercase flex justify-between">
                      <span>Asking Price Simulation:</span>
                      <span className="font-data-mono-num text-primary">AED {askingPriceInput.toLocaleString()}</span>
                    </label>
                    <input
                      type="range"
                      min={1500000}
                      max={2200000}
                      step={25000}
                      value={askingPriceInput}
                      onChange={(e) => setAskingPriceInput(Number(e.target.value))}
                      className="w-full accent-primary h-1.5 bg-surface-container rounded-lg cursor-pointer"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAskingPriceInput(1650000);
                      setConsignorReserveInput(1480000);
                      setReconditioningDeductionInput(7200);
                      setFeedbackMessage(
                        isRtl ? 'تمت إعادة ضبط حاسبة هوامش الأمانة إلى الإعدادات الافتراضية.' : 'Commission split tiers reset to baseline.'
                      );
                    }}
                    className="w-full h-10 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm font-medium flex items-center justify-center gap-2 transition-colors border border-white/[0.04] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                    <span>{isRtl ? 'إعادة ضبط شرائح العمولة' : 'Recalculate Split Tiers'}</span>
                  </button>
                </div>

                {/* CARD 3: Fleet Bulk Service & RTA Compliance Action Hub */}
                <div className="bg-surface-container-low rounded-xl shadow-lg p-space-lg flex flex-col space-y-space-md border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[22px]">bolt</span>
                      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {isRtl ? 'مركز الامتثال المجمّع RTA' : 'Bulk Compliance Hub'}
                      </h3>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                  </div>

                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Automated batch tasks for RTA direct API, corporate invoicing, and consignment escrow disbursements.
                  </p>

                  <div className="flex flex-col space-y-2.5">
                    {/* Primary Gold Action */}
                    <button
                      type="button"
                      onClick={handleBatchRenewal}
                      className="w-full py-3 px-4 rounded-lg bg-primary hover:brightness-110 text-on-primary font-body-md text-body-md font-semibold flex items-center justify-between shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">autorenew</span>
                        <span>{isRtl ? 'بدء تجديد الملكية المجمّعة' : 'Initiate Batch RTA Renewal'}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-on-primary/20 text-on-primary font-data-mono-num text-xs font-bold">
                        8 Units
                      </span>
                    </button>

                    {/* Secondary Actions */}
                    <button
                      type="button"
                      onClick={() =>
                        setFeedbackMessage(
                          isRtl
                            ? 'تم توليد فاتورة أسطول الشركات الشهرية لحساب فالكون للضيافة.'
                            : 'Monthly consolidated corporate fleet tax invoice generated for Falcon Hospitality.'
                        )
                      }
                      className="w-full py-2.5 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm font-medium flex items-center justify-between transition-colors border border-white/[0.03] cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-[18px]">request_quote</span>
                        <span>{isRtl ? 'إصدار فاتورة الأسطول الشهرية' : 'Generate Monthly Fleet Invoice'}</span>
                      </div>
                      <span className="text-on-surface-variant font-label-caps text-[10px]">Net-30</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFeedbackMessage(
                          isRtl
                            ? 'تم تفويض تحويل مستحقات الأمانة عبر نظام حماية الأجور والمصرف المركزي CBUAE.'
                            : 'Consignment escrow disbursement wire issued via CBUAE sovereign gateway.'
                        )
                      }
                      className="w-full py-2.5 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm font-medium flex items-center justify-between transition-colors border border-white/[0.03] cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-tertiary text-[18px]">account_balance</span>
                        <span>{isRtl ? 'صرف حوالة التسوية المصرفية (CBUAE)' : 'Issue Settlement Wire (WPS/CBUAE)'}</span>
                      </div>
                      <span className="text-on-surface-variant font-label-caps text-[10px]">2 Pending</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION: Consolidated Fleet & Consignment Pipeline Table */}
            <div className="bg-surface-container-low rounded-xl shadow-lg p-space-lg flex flex-col space-y-space-md border border-white/[0.04]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-1">
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface tracking-tight">
                    {isRtl ? 'سجل متابعة الأساطيل وعقود البيع بالأمانة الموحد' : 'Consolidated Fleet & Consignment Master Pipeline'}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Live telemetry, custody status, and financial obligations for all enrolled VIP units
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="h-9 w-64 rounded-lg bg-surface-container px-3 pl-8 text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary border border-white/[0.05]"
                      placeholder="Filter by Client, VIN, or Plate..."
                      type="text"
                    />
                    <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-on-surface-variant">
                      search
                    </span>
                  </div>

                  <button
                    type="button"
                    className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors border border-white/[0.05]"
                  >
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    <span>Columns</span>
                  </button>
                </div>
              </div>

              {/* Telemetry Table */}
              <div className="overflow-x-auto rounded-lg bg-surface-container border border-white/[0.03]">
                <table className="w-full text-left font-body-sm text-body-sm" id="fleet-pipeline-table">
                  <thead className="bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps uppercase">
                    <tr>
                      <th className="py-3 px-4">{isRtl ? 'الحساب / المالك المودع' : 'Account / Consignor'}</th>
                      <th className="py-3 px-4">{isRtl ? 'مواصفات المركبة' : 'Vehicle Specification'}</th>
                      <th className="py-3 px-4">{isRtl ? 'الشاسيه / اللوحة' : 'Chassis / Plate'}</th>
                      <th className="py-3 px-4">{isRtl ? 'نوع الاتفاقية' : 'Agreement Type'}</th>
                      <th className="py-3 px-4 text-right">{isRtl ? 'القيمة المتفق عليها' : 'Agreed Value'}</th>
                      <th className="py-3 px-4 text-right">{isRtl ? 'تقاسم العمولة' : 'Commission Split'}</th>
                      <th className="py-3 px-4">{isRtl ? 'فحص الملكية / تسجيل' : 'Mulkiya / Tasjeel'}</th>
                      <th className="py-3 px-4 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                      <th className="py-3 px-4 text-right">{isRtl ? 'الإجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-highest/40 font-body-sm">
                    {filteredPipeline.map((row) => (
                      <tr key={row.id} className="hover:bg-surface-container-high/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-on-surface">
                          <div>{row.accountName}</div>
                          <span className={`text-[11px] font-label-caps uppercase ${row.accountTypeBadgeClass}`}>
                            {row.accountType}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-on-surface">{row.vehicleTitle}</div>
                          <span className="text-on-surface-variant text-[12px]">{row.vehicleSpecs}</span>
                        </td>

                        <td className="py-3.5 px-4 font-data-mono-num text-[12px]">
                          <div>{row.vin}</div>
                          <span className="text-on-surface-variant text-[11px]">{row.plate}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded font-label-caps uppercase text-[10px] font-semibold ${row.agreementBadgeClass}`}>
                            {row.agreementType}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-data-mono-num font-semibold text-on-surface">
                          AED {row.agreedValueAed.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right font-data-mono-num text-tertiary font-medium">
                          {row.commissionSplitLabel}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className={`flex items-center gap-1.5 ${row.mulkiyaValid ? 'text-tertiary' : 'text-error font-medium'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${row.mulkiyaValid ? 'bg-tertiary' : 'bg-error animate-ping'}`} />
                            <span>{row.mulkiyaStatus}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${row.pipelineBadgeClass}`}>
                            {row.pipelineStatus}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setFeedbackMessage(
                                isRtl
                                  ? `تم فتح ملف الحضانة الشامل للمركبة ${row.vehicleTitle}.`
                                  : `Viewing full consignment dossier for ${row.vehicleTitle}.`
                              )
                            }
                            className="p-1 hover:text-primary transition-colors cursor-pointer"
                            title="View Record"
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

            {/* Bottom Interactive State Demonstrator Dock */}
            <div className="sticky bottom-4 z-30 p-2 rounded-xl bg-surface-container-high/95 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-space-sm border border-outline-variant/30">
              <div className="flex items-center gap-2 pl-2">
                <span className="material-symbols-outlined text-primary text-[20px]">toggle_on</span>
                <span className="font-label-caps text-label-caps uppercase text-on-surface font-semibold tracking-wider">
                  {isRtl ? 'محاكي الحالات التشغيلية' : 'Concept State Switcher'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('ACTIVE');
                    setFeedbackMessage(
                      isRtl
                        ? 'تم تفعيل حالة: محفظة الأساطيل وعقود الأمانة النشطة.'
                        : 'Demonstrator: Active Consignments & Fleets portfolio loaded.'
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg font-body-sm text-body-sm font-semibold flex items-center gap-1.5 shadow transition-all cursor-pointer ${
                    demonstratorState === 'ACTIVE'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-highest'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{isRtl ? 'الأساطيل والأمانة النشطة' : 'Populated Active Consignments & Fleets'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('SOLD_SETTLEMENT');
                    setFeedbackMessage(
                      isRtl
                        ? 'تم تفعيل سيناريو: تسوية مبيعات الأمانة وإيداع حصة المالك في حساب الضمان FAB.'
                        : 'Demonstrator: Consignment Sold / Settlement Reconciliation active with escrow disbursement.'
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg font-body-sm text-body-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                    demonstratorState === 'SOLD_SETTLEMENT'
                      ? 'bg-tertiary text-on-tertiary font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{isRtl ? 'تسوية مبيعات الأمانة' : 'Consignment Sold / Settlement Reconciliation'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('EXPIRATION_BATCH');
                    setFeedbackMessage(
                      isRtl
                        ? 'تم تفعيل سيناريو: تنبيهات تجديد الملكية العاجلة (8 مركبات أقل من 30 يوماً).'
                        : 'Demonstrator: Urgent Mulkiya Expiration Batch active with 8 vehicles scheduled.'
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg font-body-sm text-body-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                    demonstratorState === 'EXPIRATION_BATCH'
                      ? 'bg-error text-on-error font-bold'
                      : 'bg-surface-container text-error hover:bg-surface-container-highest'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{isRtl ? 'حزمة تجديد الملكية العاجلة' : 'Urgent Mulkiya Expiration Batch'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('LEGAL_HOLD');
                    setFeedbackMessage(
                      isRtl
                        ? 'تنبيه: تم فرض حظر قضائي تحفظي على وحدة الأمانة بموجب إشعار محاكم دبي #DXB-ORD-4910.'
                        : 'Legal Hold: Consignor legal dispute hold active under Dubai Courts order #DXB-ORD-4910.'
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg font-body-sm text-body-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                    demonstratorState === 'LEGAL_HOLD'
                      ? 'bg-outline text-surface font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{isRtl ? 'حظر قضائي تحفظي' : 'Consignor Legal Dispute Hold'}</span>
                </button>

                <Link
                  href="/fleet/exception"
                  className="px-3 py-1.5 rounded-lg font-body-sm text-body-sm transition-all flex items-center gap-1.5 bg-error/15 text-error hover:bg-error/25 font-bold border border-error/30"
                >
                  <span className="material-symbols-outlined text-[16px]">gavel</span>
                  <span>{isRtl ? 'فتح تفاصيل الحظر القضائي (S26)' : 'Open S26 Custody Freeze Drill-down'}</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* =========================================================================
          MODALS
      ========================================================================== */}

      {/* Modal 1: Onboard Consignment */}
      {onboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">add_circle</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'تسجيل عقد أمانة جديد (UAE Bailment)' : 'Onboard VIP Consignment Mandate'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOnboardModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  Consignor Entity / Client Name
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  Vehicle Specification / Model
                </label>
                <input
                  type="text"
                  required
                  value={newVehicleModel}
                  onChange={(e) => setNewVehicleModel(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08]"
                />
              </div>

              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  Chassis VIN (17 Digits)
                </label>
                <input
                  type="text"
                  required
                  value={newVin}
                  onChange={(e) => setNewVin(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] font-data-mono-num"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                    Agreed Reserve (AED)
                  </label>
                  <input
                    type="number"
                    required
                    value={newReservePrice}
                    onChange={(e) => setNewReservePrice(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] font-data-mono-num"
                  />
                </div>

                <div>
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                    Showroom Asking Price (AED)
                  </label>
                  <input
                    type="number"
                    required
                    value={newAskingPrice}
                    onChange={(e) => setNewAskingPrice(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] font-data-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  Mandate Validity Period
                </label>
                <select
                  value={newMandatePeriod}
                  onChange={(e) => setNewMandatePeriod(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08]"
                >
                  <option value="60">60 Days (Standard Exclusive)</option>
                  <option value="90">90 Days (Extended Exclusive)</option>
                  <option value="120">120 Days (Open Sovereign Mandate)</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-surface-container border border-white/[0.05] flex items-center justify-between text-xs">
                <span>Projected Gross Dealership Spread:</span>
                <span className="font-data-mono-num text-tertiary font-bold text-sm">
                  AED {Math.max(0, newAskingPrice - newReservePrice).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setOnboardModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold font-body-sm text-sm hover:brightness-105 transition-all shadow-md"
                >
                  {isRtl ? 'اعتماد العقد وإيداع الحضانة' : 'Enroll Consignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Corporate Fleet */}
      {createFleetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">domain_add</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'إنشاء حساب أسطول شركات جديد' : 'Create Corporate Fleet Enterprise Account'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateFleetModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  Enterprise Corporate Name
                </label>
                <input
                  type="text"
                  defaultValue="Armored Mobility Group UAE LLC"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                    Corporate TRN
                  </label>
                  <input
                    type="text"
                    defaultValue="100984920100003"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] font-data-mono-num"
                  />
                </div>
                <div>
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                    Initial Fleet Units
                  </label>
                  <input
                    type="number"
                    defaultValue={14}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] font-data-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  SLA Tier & Turnaround Guarantee
                </label>
                <select className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08]">
                  <option>Tier-1 Sovereign (2-Hour Workshop Emergency Turnaround)</option>
                  <option>Tier-2 Executive (4-Hour Scheduled Maintenance)</option>
                  <option>Tier-3 Commercial (24-Hour Fleet Rotational Pool)</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-surface-container border border-white/[0.05] text-xs text-on-surface-variant">
                Includes automated Tasjeel passing renewal sync, Allianz VIP floater rider, and direct monthly Net-30 FTA tax invoice generation.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setCreateFleetModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateFleetModalOpen(false);
                  setFeedbackMessage(
                    isRtl
                      ? 'تم تسجيل حساب الأسطول المؤسسي الجديد وتخصيص مسار فحص تسجيل وهيئة الطرق.'
                      : 'Corporate fleet account initialized with automated RTA service tracking.'
                  );
                }}
                className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-semibold font-body-sm text-sm hover:brightness-105 transition-all shadow-md"
              >
                {isRtl ? 'تأكيد إنشاء الحساب' : 'Establish Fleet Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: View Bailment PDF */}
      {bailmentPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">description</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'عقد الحضانة والبيع بالأمانة (UAE Bailment Deed)' : 'Consignment Bailment Agreement #CSG-2025-089A-DXB'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBailmentPdfModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-lowest font-body-sm text-on-surface flex flex-col gap-3 border border-white/[0.04]">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
                <div>
                  <div className="font-bold text-primary font-headline-sm">BAILMENT CONTRACT FOR VEHICLE SALE</div>
                  <div className="text-xs text-on-surface-variant">Under UAE Federal Decree-Law No. (50) of 2022</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-label-caps text-xs font-bold">
                  SOVEREIGN STAMP CLEARED
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-on-surface-variant leading-relaxed">
                <div><strong>Consignor:</strong> Sheikh Khalid Al-Nahyan (Private Collection Holding FZCO)</div>
                <div><strong>Custodian Dealership:</strong> SilberArrows Luxury Motor Cars FZCO (DED #612048)</div>
                <div><strong>Vehicle Asset:</strong> 2023 Ferrari 296 GTB Assetto Fiorano (VIN: ZFF98LHA0P0293108)</div>
                <div><strong>Guaranteed Reserve Price:</strong> AED 1,480,000.00 (Net Escrow Payout)</div>
                <div><strong>Insurance Floater:</strong> Allianz Global Underwritten Policy #DXB-CUST-889</div>
                <div className="pt-2 text-[11px] text-outline">
                  The Custodian undertakes fiduciary care under Article 492 of the Commercial Transactions Law. Chattel title remains unencumbered with the Consignor until completion of Dubai RTA title transfer.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setBailmentPdfModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Execute Buyer Offer */}
      {executeOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">payments</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'تنفيذ عرض شراء المشتري' : 'Execute Buyer Offer on Consigned Asset'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExecuteOfferModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div className="p-3 rounded-lg bg-surface-container border border-white/[0.04] flex flex-col gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Asset:</span>
                  <span className="font-semibold text-on-surface">Ferrari 296 GTB Assetto Fiorano</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Buyer Offer (Gross):</span>
                  <span className="font-data-mono-num font-bold text-primary">AED 1,650,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Consignor Net Reserve:</span>
                  <span className="font-data-mono-num font-semibold text-on-surface">AED 1,480,000.00</span>
                </div>
                <div className="flex justify-between border-t border-white/[0.05] pt-1 text-tertiary font-bold">
                  <span>Gross Dealership Profit:</span>
                  <span>AED 170,000.00</span>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                Executing offer triggers binding escrow hold with First Abu Dhabi Bank (FAB) and initiates Dubai RTA Title Transfer Deed generation.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setExecuteOfferModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setExecuteOfferModalOpen(false);
                  setFeedbackMessage(
                    isRtl
                      ? 'تم قبول وتنفيذ عرض الشراء وإصدار أمر تحويل الضمان المصرفي لدى بنك FAB.'
                      : 'Buyer offer executed: Escrow disbursement instructions logged for Ferrari 296 GTB.'
                  );
                }}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold font-body-sm text-sm hover:brightness-105 transition-all shadow-md"
              >
                {isRtl ? 'تأكيد العرض والتحويل لحساب الضمان' : 'Accept & Fund Escrow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
