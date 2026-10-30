'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DealerSidebar } from '../../components/dealer-sidebar';
import { DealerHeader } from '../../components/dealer-header';
import { previewSafeMessage } from '../../lib/preview';
import {
  VERIFIED_SALES_ORDER_FIXTURE,
  SalesOrderStudioData,
  QuoteLineItem,
} from '../../lib/api';

export default function SalesOrdersStudioPage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [role] = useState<'PRINCIPAL' | 'SALES_REP'>('PRINCIPAL');
  const isRtl = locale === 'ar';

  const [orderData, setOrderData] = useState<SalesOrderStudioData>(VERIFIED_SALES_ORDER_FIXTURE);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DRAFT' | 'ESCROW' | 'TRADE_IN' | 'SCHEDULED'>('ALL');
  const [preset, setPreset] = useState<'POPULATED' | 'TRADE_IN' | 'BLANK' | 'COMPLIANCE'>('POPULATED');

  // Interactive state
  const [copiedVin, setCopiedVin] = useState(false);
  const [feedbackMessage, setFeedbackMessageState] = useState<string | null>(null);
  // Preview module: feedback never claims an external action happened.
  const setFeedbackMessage = (message: string | null) => setFeedbackMessageState(previewSafeMessage(message));
  const [step2State, setStep2State] = useState<'WAITING' | 'OVERRIDDEN' | 'PROMPTED'>('WAITING');

  // Modals
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [exportTaxModalOpen, setExportTaxModalOpen] = useState(false);
  const [scheduleHandoverModalOpen, setScheduleHandoverModalOpen] = useState(false);

  // New quote draft inputs
  const [newClientName, setNewClientName] = useState('Emirates Royal Investment LLC');
  const [newVehicleModel, setNewVehicleModel] = useState('2024 Mercedes-AMG GT Black Series');
  const [newAskingPrice, setNewAskingPrice] = useState('1650000');

  const handleCopyVin = (vin: string) => {
    navigator.clipboard?.writeText(vin);
    setCopiedVin(true);
    setTimeout(() => setCopiedVin(false), 2000);
  };

  const handleResendPrompt = () => {
    setStep2State('PROMPTED');
    setFeedbackMessage(
      isRtl
        ? 'تم إرسال إشعار التوقيع البيومتري عبر تطبيق الهوية الرقمية (UAE PASS) إلى هاتف المشتري بنجاح.'
        : 'Biometric authorization request re-dispatched to buyer UAE PASS mobile token.'
    );
  };

  const handleManualOverride = () => {
    setStep2State('OVERRIDDEN');
    setFeedbackMessage(
      isRtl
        ? 'تم تفعيل التجاوز الإداري الاستثنائي بتفويض المدير العام (Marc Ackermann).'
        : 'Executive override approved by General Manager. Recorded to immutable audit trail.'
    );
  };

  const handleAddCustomLine = () => {
    const newLine: QuoteLineItem = {
      id: `li-${Date.now()}`,
      itemCode: 'CUSTOM-STG',
      description: 'Ceramic Coating & Interior Leather Protection Seal',
      subDescription: 'Gyeon Quartz MOHS+ 5-Year Warranty Protection Package',
      taxStatus: 'Standard 5%',
      qty: 1,
      unitPriceAed: 6500,
      netLineTotalAed: 6500,
    };
    const updatedLines = [...orderData.lineItems, newLine];
    const newSubtotal = updatedLines.reduce((acc, curr) => acc + curr.netLineTotalAed, 0);
    const newVat = Math.round(newSubtotal * 0.05);
    const newGross = newSubtotal + newVat;
    const tradeInNet = orderData.tradeIn?.netEquityAed || 0;
    const newPayable = newGross - tradeInNet;

    setOrderData({
      ...orderData,
      lineItems: updatedLines,
      commercials: {
        ...orderData.commercials,
        subtotalTaxableAed: newSubtotal,
        uaeVatAed: newVat,
        grossTotalAed: newGross,
        netPayableAed: newPayable,
        escrowDepositAed: Math.round(newPayable * 0.2),
      },
    });

    setFeedbackMessage(
      isRtl
        ? 'تمت إضافة بند مخصص جديد وتحديث جدول الضريبة الإماراتي بنجاح.'
        : 'Custom quotation line item appended. FTA VAT matrix recalculated.'
    );
  };

  const handleCreateDraftOrder = () => {
    setNewOrderModalOpen(false);
    setFeedbackMessage(
      isRtl
        ? `تم إنشاء مسودة عرض السعر رقم #SO-2025-${Math.floor(1000 + Math.random() * 9000)} للعميل ${newClientName} بنجاح.`
        : `Quotation draft created for ${newClientName} (${newVehicleModel}). Staged for approval.`
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
          <div className="flex flex-col w-full">
            {/* Feedback Notification Banner */}
            {feedbackMessage && (
              <div className="mt-space-md mb-2 p-space-md rounded-xl bg-primary-container/20 border border-primary text-on-surface flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                  <div>
                    <span className="font-headline-sm text-body-md font-semibold text-primary block">
                      {isRtl ? 'عملية موثقة في النظام' : 'Sales Studio Operation Recorded'}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {feedbackMessage}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackMessage(null)}
                  className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-body-sm text-on-surface"
                >
                  {isRtl ? 'إغلاق' : 'Dismiss'}
                </button>
              </div>
            )}

            {/* P1 Specification & Concept Roadmap Hero Banner */}
            <div className="relative overflow-hidden bg-surface-container-low rounded-xl p-space-md shadow-xl my-space-md border border-white/[0.06]">
              <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
              <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-secondary/10 blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col gap-space-sm">
                <div className="flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                    <Link href="/" className="hover:text-on-surface transition-colors cursor-pointer">
                      {isRtl ? 'جناح الوكالة' : 'Dealership Suite'}
                    </Link>
                    <span className="text-outline">/</span>
                    <span className="text-secondary font-semibold">
                      {isRtl ? 'خطة نظام إدارة الوكالة (P1)' : 'Future DMS Roadmap (P1)'}
                    </span>
                    <span className="text-outline">/</span>
                    <span className="text-on-surface font-semibold">
                      {isRtl ? 'استوديو عروض الأسعار وأوامر البيع' : 'Sales Orders & Quotations Studio'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 text-secondary font-label-caps text-label-caps uppercase tracking-widest font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
                      [FUTURE ROADMAP • P1 SPECIFICATION — CONCEPT TEMPLATE]
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-label-caps text-label-caps uppercase">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      DED #612048 • FZCO
                    </span>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pt-space-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 text-primary">
                      <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                          {isRtl ? 'استوديو أوامر البيع وعروض الأسعار' : 'Sales Orders & Quotations Studio'}
                        </h1>
                        <span className="px-2 py-0.5 rounded text-[10px] font-label-caps font-semibold uppercase bg-surface-container-highest text-on-surface-variant">
                          v1.4 Spec Mockup
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 max-w-3xl">
                        {isRtl
                          ? 'نموذج مواصفات المرحلة الأولى (P1) لأنظمة إدارة الوكالة: سير عمل المبيعات التجارية، التوقيع الرقمي البيومتري عبر الهوية الرقمية، وامتثال ضريبة القيمة المضافة لهيئة الضرائب الاتحادية.'
                          : 'CONCEPT TEMPLATE ONLY: Phase 1 Dealership Management System Roadmap. Specification mockups for commercial sales workflows, biometric e-signature handshakes, and automated FTA UAE VAT compliance pipelines.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExportTaxModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm hover:bg-surface-container-highest transition-all shadow-sm border border-white/[0.05]"
                    >
                      <span className="material-symbols-outlined text-[17px] text-tertiary">file_download</span>
                      <span>{isRtl ? 'تصدير هيكل ضريبة القيمة المضافة' : 'Export FTA Tax Schema'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewOrderModalOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-body-sm text-body-sm font-semibold hover:brightness-110 transition-all shadow-md"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      <span>{isRtl ? 'إنشاء عرض سعر [مسودة]' : 'Create Quotation [Draft]'}</span>
                    </button>
                  </div>
                </div>

                {/* Live Pipeline State Filters */}
                <div className="flex flex-wrap items-center gap-2 pt-space-xs">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg font-body-sm text-body-sm font-medium flex items-center gap-2 shadow-sm transition-colors ${
                      activeFilter === 'ALL'
                        ? 'bg-surface-container-highest text-on-surface'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    <span>{isRtl ? 'جميع الطلبات' : 'All Orders'}</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface text-[11px] font-data-mono-num font-semibold text-primary">18</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter('DRAFT')}
                    className={`px-3 py-1.5 rounded-lg font-body-sm text-body-sm flex items-center gap-2 transition-colors ${
                      activeFilter === 'DRAFT'
                        ? 'bg-surface-container-highest text-on-surface'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span>{isRtl ? 'مسودة عرض سعر' : 'Quotation Draft'}</span>
                    <span className="font-data-mono-num text-[11px] text-on-surface-variant">5</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter('ESCROW')}
                    className={`px-3 py-1.5 rounded-lg font-body-sm text-body-sm flex items-center gap-2 transition-colors ${
                      activeFilter === 'ESCROW'
                        ? 'bg-surface-container-highest text-on-surface'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span>{isRtl ? 'قيد تدقيق الضمان' : 'In Escrow Review'}</span>
                    <span className="font-data-mono-num text-[11px] text-on-surface-variant">4</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter('TRADE_IN')}
                    className={`px-3 py-1.5 rounded-lg font-body-sm text-body-sm flex items-center gap-2 transition-colors ${
                      activeFilter === 'TRADE_IN'
                        ? 'bg-surface-container-highest text-on-surface'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-outline"></span>
                    <span>{isRtl ? 'تقييم الاستبدال' : 'Trade-in Valuation'}</span>
                    <span className="font-data-mono-num text-[11px] text-on-surface-variant">3</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter('SCHEDULED')}
                    className={`px-3 py-1.5 rounded-lg font-body-sm text-body-sm flex items-center gap-2 transition-colors ${
                      activeFilter === 'SCHEDULED'
                        ? 'bg-surface-container-highest text-on-surface'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    <span>{isRtl ? 'مجدول للتسليم' : 'Delivery Scheduled'}</span>
                    <span className="font-data-mono-num text-[11px] text-on-surface-variant">6</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dual-Column Studio Workspace */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-lg">
              {/* LEFT COLUMN: Order Builder & Vehicle Financials (8 cols) */}
              <div className="xl:col-span-8 flex flex-col gap-space-lg min-w-0">
                {/* Active Order Dossier Header */}
                <div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col gap-space-sm border border-white/[0.05]">
                  <div className="flex flex-wrap items-center justify-between gap-space-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-data-mono-num text-headline-sm font-bold text-primary">
                        {orderData.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-label-caps font-label-caps uppercase font-semibold">
                        {orderData.orderType}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-label-caps font-label-caps uppercase">
                        {orderData.specRegion}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        {isRtl ? 'وضع العملة:' : 'Currency Mode:'}
                      </span>
                      <span className="font-data-mono-num text-body-sm font-semibold text-on-surface bg-surface-container px-2 py-0.5 rounded">
                        {orderData.currencyMode}
                      </span>
                      <span className="text-outline-variant font-label-caps text-label-caps">| د.إ</span>
                    </div>
                  </div>

                  {/* Buyer Identity Bar */}
                  <div className="bg-surface-container rounded-lg p-space-sm flex flex-col md:flex-row md:items-center justify-between gap-space-sm border border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-headline-sm font-bold">
                        AM
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-body-lg text-body-lg font-semibold text-on-surface">
                            {orderData.client.name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-label-caps font-semibold uppercase bg-tertiary/15 text-tertiary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">fingerprint</span>
                            {orderData.client.badge}
                          </span>
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                          <span>
                            {isRtl ? 'المفوض الرئيسي: ' : 'Principal Rep: '}
                            {orderData.client.principalRep}
                          </span>
                          <span>•</span>
                          <span className="font-data-mono-num text-on-surface">{orderData.client.email}</span>
                          <span>•</span>
                          <span className="font-data-mono-num text-on-surface">{orderData.client.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        type="button"
                        onClick={() => alert(`Client Profile: ${orderData.client.name}`)}
                        className="px-2.5 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-body-sm font-body-sm transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px] text-tertiary">badge</span>
                        <span>CRM Card</span>
                      </button>
                    </div>
                  </div>

                  {/* Selected Vehicle Dossier Card */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md bg-surface-container-lowest p-space-md rounded-lg border border-white/[0.04]">
                    <div className="md:col-span-5 relative rounded-lg overflow-hidden h-48 bg-surface-container-high">
                      <img
                        className="w-full h-full object-cover"
                        alt={orderData.vehicle.title}
                        src={orderData.vehicle.imageUrl}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-transparent to-transparent"></div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-label-caps font-bold bg-primary text-on-primary uppercase">
                          {isRtl ? 'في صالة العرض (متاح)' : 'In Stock (Grounded)'}
                        </span>
                        <span className="font-data-mono-num text-body-sm font-semibold text-on-surface bg-surface-container-lowest/80 px-2 py-0.5 rounded">
                          {orderData.vehicle.stockId}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-7 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-label-caps text-label-caps uppercase text-primary font-semibold tracking-wider">
                              SilberArrows Prime Vault Allocation
                            </div>
                            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface leading-tight mt-0.5">
                              {orderData.vehicle.title}
                            </h3>
                          </div>
                          <span className="px-2 py-1 rounded bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps uppercase">
                            GCC Spec
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                          {orderData.vehicle.subTitle}
                        </p>
                      </div>

                      {/* Spec Grid Micro-Strip */}
                      <div className="grid grid-cols-3 gap-2 py-2 my-2 bg-surface-container-high/60 px-3 rounded-lg border border-white/[0.04]">
                        <div>
                          <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                            VIN Identifier
                          </div>
                          <div
                            onClick={() => handleCopyVin(orderData.vehicle.vin)}
                            className="font-data-mono-num text-body-sm text-on-surface font-semibold truncate hover:text-primary cursor-pointer flex items-center gap-1"
                            title={copiedVin ? (isRtl ? 'تم النسخ!' : 'Copied!') : orderData.vehicle.vin}
                          >
                            <span>{orderData.vehicle.vin.substring(0, 7)}...{orderData.vehicle.vin.substring(13)}</span>
                            <span className="material-symbols-outlined text-[13px] text-outline">
                              {copiedVin ? 'check' : 'content_copy'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                            {isRtl ? 'المسافة المقطوعة' : 'Odometer'}
                          </div>
                          <div className="font-data-mono-num text-body-sm text-on-surface font-semibold">
                            {orderData.vehicle.odometerKm.toLocaleString()} KM
                          </div>
                        </div>

                        <div>
                          <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                            {isRtl ? 'الضمان المصنعي' : 'Original Warranty'}
                          </div>
                          <div className="font-body-sm text-body-sm text-tertiary font-medium">
                            {orderData.vehicle.warranty}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-body-sm">
                        <span className="text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                          {orderData.vehicle.tasjeelScore}
                        </span>
                        <button
                          type="button"
                          onClick={() => alert(`Full OEM spec sheet for ${orderData.vehicle.vin}`)}
                          className="text-primary hover:underline font-label-caps text-label-caps uppercase font-semibold"
                        >
                          {isRtl ? 'عرض المواصفات الفنية ←' : 'Inspect Spec Sheet →'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Line-Item Costing Table */}
                <div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col gap-space-md border border-white/[0.05]">
                  <div className="flex flex-wrap items-center justify-between gap-space-xs pb-space-xs">
                    <div>
                      <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {isRtl ? 'جدول تسعير بنود المركبة والتجهيزات' : 'Vehicle Line-Item Commercial Costing'}
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {isRtl
                          ? 'جدول تفصيلي خاضع للائحة التنفيذية لضريبة القيمة المضافة بنسبة 5% الصادرة عن الهيئة الاتحادية للضرائب.'
                          : 'Itemized schedule subject to UAE Federal Tax Authority (FTA) 5% VAT governance.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddCustomLine}
                        className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-body-sm font-body-sm transition-colors flex items-center gap-1 border border-white/[0.05]"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary">add</span>
                        <span>{isRtl ? 'إضافة بند مخصص' : 'Add Custom Line'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Telemetry Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left" dir={isRtl ? 'rtl' : 'ltr'}>
                      <thead>
                        <tr className="bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                          <th className={`py-2.5 px-space-md rounded-l-lg ${isRtl ? 'text-right' : 'text-left'}`}>
                            {isRtl ? 'رمز البند والوصف' : 'Item Code & Description'}
                          </th>
                          <th className="py-2.5 px-space-sm text-center">
                            {isRtl ? 'الوضع الضريبي' : 'Tax Status'}
                          </th>
                          <th className={`py-2.5 px-space-sm ${isRtl ? 'text-left' : 'text-right'}`}>
                            {isRtl ? 'الكمية' : 'Qty'}
                          </th>
                          <th className={`py-2.5 px-space-sm ${isRtl ? 'text-left' : 'text-right'}`}>
                            {isRtl ? 'سعر الوحدة (درهم)' : 'Unit Price (AED)'}
                          </th>
                          <th className={`py-2.5 px-space-md rounded-r-lg ${isRtl ? 'text-left' : 'text-right'}`}>
                            {isRtl ? 'إجمالي البند (درهم)' : 'Net Line Total (AED)'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-high text-body-sm font-body-sm">
                        {orderData.lineItems.map((line) => (
                          <tr key={line.id} className="hover:bg-surface-container-high/40 transition-colors">
                            <td className="py-3 px-space-md">
                              <div className="font-semibold text-on-surface">{line.description}</div>
                              {line.subDescription && (
                                <div className="font-body-sm text-body-sm text-on-surface-variant">
                                  {line.subDescription}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-space-sm text-center">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-label-caps font-semibold uppercase ${
                                line.taxStatus === 'Standard 5%'
                                  ? 'bg-tertiary/15 text-tertiary'
                                  : 'bg-surface-container-highest text-on-surface-variant'
                              }`}>
                                {line.taxStatus}
                              </span>
                            </td>
                            <td className={`py-3 px-space-sm font-data-mono-num text-on-surface ${isRtl ? 'text-left' : 'text-right'}`}>
                              {line.qty}
                            </td>
                            <td className={`py-3 px-space-sm font-data-mono-num text-on-surface ${isRtl ? 'text-left' : 'text-right'}`}>
                              {line.unitPriceAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className={`py-3 px-space-md font-data-mono-num font-semibold text-on-surface ${isRtl ? 'text-left' : 'text-right'}`}>
                              {line.netLineTotalAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Subtotals & Tax Matrix Breakdown */}
                  <div className="bg-surface-container rounded-lg p-space-md flex flex-col md:flex-row justify-between gap-space-md border border-white/[0.04]">
                    <div className="flex flex-col justify-between max-w-sm">
                      <div className="flex flex-col gap-1">
                        <span className="font-label-caps text-label-caps uppercase text-secondary font-semibold">
                          {isRtl ? 'ختم الامتثال الضريبي (الهيئة الاتحادية)' : 'FTA Tax Compliance Stamp'}
                        </span>
                        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                          {isRtl
                            ? 'رقم التسجيل الضريبي: 100293847500003. جميع المبالغ بدرهم الإمارات. هذا العرض خاضع للمادة 59 من اللائحة التنفيذية لضريبة القيمة المضافة.'
                            : 'Registered TRN: 100293847500003. All amounts in United Arab Emirates Dirhams (AED). This quotation conforms to FTA Executive Regulations Article 59.'}
                        </p>
                      </div>
                      <div className="pt-2 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                        <span className="font-body-sm text-body-sm text-on-surface font-medium">
                          {isRtl ? 'الختم الرقمي المشفر نشط' : 'Digital Cryptographic Stamp Active'}
                        </span>
                      </div>
                    </div>

                    <div className="w-full md:w-80 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-body-sm">
                        <span className="text-on-surface-variant">
                          {isRtl ? 'المجموع الفرعي (الخاضع للضريبة)' : 'Subtotal (Taxable Supplies)'}
                        </span>
                        <span className="font-data-mono-num text-on-surface font-semibold">
                          AED {orderData.commercials.subtotalTaxableAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-body-sm">
                        <span className="text-on-surface-variant">
                          {isRtl ? 'ضريبة القيمة المضافة (5% FTA)' : 'UAE VAT (5.00% FTA Rate)'}
                        </span>
                        <span className="font-data-mono-num text-on-surface font-semibold">
                          AED {orderData.commercials.uaeVatAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-body-sm">
                        <span className="text-on-surface-variant">
                          {isRtl ? 'رسوم الجمارك والعبور الخليجي' : 'GCC Customs / Regional Surcharges'}
                        </span>
                        <span className="font-data-mono-num text-on-surface-variant">AED 0.00</span>
                      </div>

                      <div className="h-0.5 bg-surface-container-highest my-1"></div>

                      <div className="flex justify-between items-center">
                        <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                          {isRtl ? 'إجمالي أمر البيع' : 'Gross Sale Total'}
                        </span>
                        <span className="font-data-mono-num text-headline-sm font-bold text-primary">
                          AED {orderData.commercials.grossTotalAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trade-In Acquisition Offset Dossier */}
                {orderData.tradeIn && (
                  <div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col gap-space-md border border-white/[0.05]">
                    <div className="flex flex-wrap items-center justify-between gap-space-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined text-[20px]">swap_horizontal_circle</span>
                        </div>
                        <div>
                          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                            {isRtl ? 'تسوية استبدال المركبة (تقييم معتمد)' : 'Trade-In Acquisition Offset (Appraisal Approved)'}
                          </h2>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {isRtl
                              ? 'فحص وتسجيل معتمد من تسجيل مربوط بتفويض فك الرهن البنكي.'
                              : 'Tasjeel certified physical appraisal linked with bank settlement authorization.'}
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded bg-secondary/15 text-secondary font-label-caps text-label-caps uppercase font-semibold">
                        {isRtl ? 'تم تطبيق رصيد الاستبدال' : 'Credit Offset Applied'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md bg-surface-container p-space-md rounded-lg border border-white/[0.04]">
                      <div className="md:col-span-4 relative rounded-lg overflow-hidden h-36 bg-surface-container-high">
                        <img
                          className="w-full h-full object-cover"
                          alt={orderData.tradeIn.vehicleTitle}
                          src={orderData.tradeIn.imageUrl}
                        />
                        <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-surface-container-lowest/80 text-[10px] font-data-mono-num text-on-surface">
                          VIN: {orderData.tradeIn.vin.substring(0, 10)}...
                        </div>
                      </div>

                      <div className="md:col-span-8 flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                              {orderData.tradeIn.vehicleTitle}
                            </h4>
                            <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                              {orderData.tradeIn.spec}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary text-label-caps font-label-caps uppercase font-semibold">
                            Tier-1 Grade A
                          </span>
                        </div>

                        {/* Trade-In Equity Ledger */}
                        <div className="grid grid-cols-3 gap-2 pt-space-xs">
                          <div className="bg-surface-container-high p-2 rounded border border-white/[0.04]">
                            <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                              {isRtl ? 'التقييم المتفق عليه' : 'Agreed Valuation'}
                            </div>
                            <div className="font-data-mono-num text-body-lg font-bold text-tertiary mt-0.5">
                              AED {orderData.tradeIn.agreedValuationAed.toLocaleString()}
                            </div>
                          </div>

                          <div className="bg-surface-container-high p-2 rounded border border-white/[0.04]">
                            <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                              {isRtl ? 'فك الرهن (بنك الإمارات دبي الوطني)' : 'Lien Settle (Emirates NBD)'}
                            </div>
                            <div className="font-data-mono-num text-body-lg font-bold text-error mt-0.5">
                              -AED {orderData.tradeIn.lienSettlementAed.toLocaleString()}
                            </div>
                          </div>

                          <div className="bg-surface-container-high p-2 rounded border border-white/[0.04]">
                            <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                              {isRtl ? 'صافي قيمة الاستبدال' : 'Net Trade-In Equity'}
                            </div>
                            <div className="font-data-mono-num text-body-lg font-bold text-primary mt-0.5">
                              AED {orderData.tradeIn.netEquityAed.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Net Payable Calculation Bar */}
                    <div className="bg-surface-container-lowest p-space-md rounded-lg flex flex-col md:flex-row items-center justify-between gap-space-md border border-white/[0.05]">
                      <div className="flex items-center gap-space-md w-full md:w-auto">
                        <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[28px]">payments</span>
                        </div>
                        <div>
                          <div className="font-label-caps text-label-caps uppercase text-primary font-semibold tracking-wider">
                            {isRtl ? 'الموقف المالي النهائي للصفقة' : 'Final Deal Settlement Position'}
                          </div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">
                            {isRtl
                              ? `صافي المبلغ المستحق = إجمالي الطلب (${orderData.commercials.grossTotalAed.toLocaleString()} درهم) ناقصاً الاستبدال (${orderData.tradeIn.netEquityAed.toLocaleString()} درهم)`
                              : `Net Payable = Gross Order Total (AED ${orderData.commercials.grossTotalAed.toLocaleString()}) minus Trade-In Equity (AED ${orderData.tradeIn.netEquityAed.toLocaleString()})`}
                          </div>
                        </div>
                      </div>

                      <div className="text-right w-full md:w-auto flex md:flex-col justify-between items-end">
                        <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                          {isRtl ? 'المبلغ المطلوب سداده نقداً' : 'Net Customer Cash Outlay'}
                        </div>
                        <div className="font-data-currency-lg text-data-currency-lg font-bold text-primary">
                          AED {orderData.commercials.netPayableAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="font-body-sm text-body-sm text-secondary font-medium">
                          {isRtl ? 'عربون الضمان السيادي المطلوب (20%): ' : 'Req. 20% Sovereign Escrow Deposit: '}
                          <span className="font-data-mono-num font-semibold text-on-surface">
                            AED {orderData.commercials.escrowDepositAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Deal Orchestration & Milestone Sign-Off Gates (4 cols) */}
              <div className="xl:col-span-4 flex flex-col gap-space-lg min-w-0">
                {/* Multi-Party Cryptographic Sign-Off Gates */}
                <div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col gap-space-md border border-white/[0.05]">
                  <div className="flex items-center justify-between pb-space-xs">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {isRtl ? 'بوابات التوقيع وحساب الضمان' : 'Sign-Off Gates & Escrow'}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {isRtl ? 'مسار التوثيق القانوني المتسلسل' : 'Sequential legal authorization pipeline'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-label-caps font-semibold uppercase bg-primary/15 text-primary">
                      Gate 2 of 5
                    </span>
                  </div>

                  {/* Stepper Checklist */}
                  <div className="flex flex-col gap-space-md relative">
                    <div className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-4 bottom-4 w-0.5 bg-surface-container-highest`}></div>

                    {orderData.signOffGates.map((gate) => {
                      const isStep2 = gate.stepNumber === 2;
                      const isStep2Overridden = isStep2 && step2State === 'OVERRIDDEN';

                      return (
                        <div key={gate.stepNumber} className="relative flex items-start gap-3 z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                            gate.status === 'DONE' || isStep2Overridden
                              ? 'bg-tertiary text-on-tertiary'
                              : gate.status === 'ACTIVE'
                              ? 'bg-primary text-on-primary animate-pulse'
                              : 'bg-surface-container-highest text-outline'
                          }`}>
                            <span className="material-symbols-outlined text-[18px]">
                              {gate.status === 'DONE' || isStep2Overridden
                                ? 'done'
                                : isStep2
                                ? 'fingerprint'
                                : gate.stepNumber === 3
                                ? 'verified_user'
                                : gate.stepNumber === 4
                                ? 'account_balance'
                                : 'assignment_turned_in'}
                            </span>
                          </div>

                          <div className={`flex-1 bg-surface-container p-space-sm rounded-lg border border-white/[0.04] ${
                            gate.status === 'ACTIVE' && !isStep2Overridden ? 'ring-1 ring-primary/40' : ''
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-body-sm text-body-sm font-semibold ${
                                gate.status === 'ACTIVE' && !isStep2Overridden ? 'text-primary' : 'text-on-surface'
                              }`}>
                                {gate.title}
                              </span>
                              <span className={`font-label-caps text-label-caps uppercase ${
                                gate.status === 'DONE' || isStep2Overridden
                                  ? 'text-tertiary'
                                  : gate.status === 'ACTIVE'
                                  ? 'px-1.5 py-0.5 rounded bg-primary/20 text-[10px] text-primary font-semibold'
                                  : 'text-outline'
                              }`}>
                                {isStep2Overridden ? 'Overridden' : gate.badge}
                              </span>
                            </div>

                            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                              {isStep2Overridden
                                ? 'Executive override applied by GM Marc Ackermann.'
                                : gate.subtitle}
                            </p>

                            {gate.hashOrTimestamp && (
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-data-mono-num text-on-surface-variant">
                                <span className="material-symbols-outlined text-[13px] text-tertiary">lock</span>
                                <span>{gate.hashOrTimestamp}</span>
                              </div>
                            )}

                            {isStep2 && !isStep2Overridden && (
                              <div className="pt-2 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleResendPrompt}
                                  className="px-2.5 py-1 rounded bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:brightness-110 transition-all shadow-sm"
                                >
                                  {isRtl ? 'إعادة الإرسال' : 'Resend Prompt'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleManualOverride}
                                  className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-body-sm text-body-sm hover:bg-surface-container-highest transition-colors border border-white/[0.05]"
                                >
                                  {isRtl ? 'تجاوز إداري' : 'Manual Override'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Commercial Margin & Telemetry Widget (Subject to RBAC role masking) */}
                <div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col gap-space-sm border border-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold">
                      {isRtl ? 'مؤشرات ربحية الصفقة' : 'Deal Profitability Telemetry'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-label-caps font-semibold uppercase bg-tertiary/15 text-tertiary">
                      {isRtl ? 'يتجاوز الأهداف' : 'Exceeds Targets'}
                    </span>
                  </div>

                  {role === 'PRINCIPAL' ? (
                    <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                      <div className="bg-surface-container p-space-sm rounded-lg border border-white/[0.04]">
                        <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                          {isRtl ? 'هامش الربح المباشر' : 'Front-End Margin'}
                        </div>
                        <div className="font-data-mono-num text-headline-sm font-bold text-tertiary mt-1">
                          {orderData.commercials.frontEndMarginPct}%
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface font-semibold mt-0.5">
                          AED {orderData.commercials.frontEndMarginAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="bg-surface-container p-space-sm rounded-lg border border-white/[0.04]">
                        <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                          {isRtl ? 'عمولة التمويل والتأمين' : 'F&I Commission Proj.'}
                        </div>
                        <div className="font-data-mono-num text-headline-sm font-bold text-secondary mt-1">
                          AED {orderData.commercials.fiCommissionAed.toLocaleString()}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          Oman Insurance RSA
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-space-sm rounded-lg bg-surface-container text-outline font-body-sm text-body-sm flex items-center gap-2 border border-white/[0.04]">
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                      <span>
                        {isRtl
                          ? 'تفاصيل الهامش الربحي محجوبة في وضع المندوب وفق سياسة الخصوصية وتعدد المستأجرين.'
                          : 'Deal profitability masked in Sales Rep mode per tenant least-privilege security policy.'}
                      </span>
                    </div>
                  )}

                  {/* Telemetry Progress Bar */}
                  <div className="bg-surface-container p-space-sm rounded-lg flex flex-col gap-1.5 border border-white/[0.04]">
                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface-variant">
                        {isRtl ? 'النافذة المستهدفة للتسليم' : 'Target Handover Window'}
                      </span>
                      <span className="font-data-mono-num text-on-surface font-semibold">
                        48 Hours post-escrow
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary via-tertiary to-secondary rounded-full" style={{ width: '72%' }}></div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-label-caps text-on-surface-variant pt-0.5">
                      <span>PDI Cleared</span>
                      <span>RTA Bond Staged</span>
                      <span>Silk Bay Booked</span>
                    </div>
                  </div>
                </div>

                {/* Customer Handover & Logistics Specifications */}
                <div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col gap-space-sm border border-white/[0.05]">
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    {isRtl ? 'بروتوكول التسليم والخدمات اللوجستية' : 'Handover & Logistics Protocol'}
                  </h3>

                  <div className="flex flex-col gap-2 pt-space-xs text-body-sm">
                    <div className="flex items-start gap-2.5 p-2 rounded bg-surface-container border border-white/[0.04]">
                      <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">location_on</span>
                      <div>
                        <div className="font-semibold text-on-surface">SilberArrows Al Quoz Private Bay</div>
                        <div className="text-on-surface-variant text-body-sm">
                          {isRtl ? 'يشمل مراسم الكشف الحريري الخاصة ومصور تسليم محترف.' : 'Includes VIP Silk Reveal ceremony & professional delivery photographer.'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2 rounded bg-surface-container border border-white/[0.04]">
                      <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">shield</span>
                      <div>
                        <div className="font-semibold text-on-surface">Included Care Package</div>
                        <div className="text-on-surface-variant text-body-sm">
                          {isRtl ? 'ضمان ممتد لمدة سنتين + أول صيانة دورية مجانية عند 10,000 كم.' : '2-Year SilberArrows Concierge Extended Warranty + First 10,000 KM major service included.'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2 rounded bg-surface-container border border-white/[0.04]">
                      <span className="material-symbols-outlined text-[18px] text-tertiary shrink-0 mt-0.5">description</span>
                      <div>
                        <div className="font-semibold text-on-surface">Registration Documentation</div>
                        <div className="text-on-surface-variant text-body-sm">
                          {isRtl ? 'إصدار ملكية دبي فئة خصوصي مباشرة داخل المعرض.' : 'Dubai Private Mulkiya Plate (No export manifest required). Transfer completed in-house.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setScheduleHandoverModalOpen(true)}
                      className="w-full py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm font-semibold transition-all flex items-center justify-center gap-2 border border-white/[0.05]"
                    >
                      <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                      <span>{isRtl ? 'حجز موعد التسليم الحريري' : 'Schedule Silk Handover Slot'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECONDARY SECTION: Recent Sales Order Pipeline Table */}
            <div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col gap-space-md mb-space-lg border border-white/[0.05]">
              <div className="flex flex-wrap items-center justify-between gap-space-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      {isRtl ? 'قائمة أوامر البيع وعروض الأسعار الحديثة' : 'Recent Sales Order Pipeline (Phase 1 Active Mockup)'}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-label-caps font-semibold uppercase bg-surface-container-highest text-secondary">
                      Telemetry Sync Live
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {isRtl
                      ? 'العقود النشطة وعروض الأسعار التجارية وإيداعات الضمان في طابور مركز القوز.'
                      : 'Active contracts, commercial quotations, and escrow transfers in the Al Quoz Hub queue.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">search</span>
                    <input
                      className="h-9 pl-9 pr-3 rounded-lg bg-surface-container text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary w-64 border border-white/[0.05]"
                      placeholder={isRtl ? 'بحث بالهيكل، الطلب، العميل...' : 'Search VIN, Order ID, Client...'}
                      type="text"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left" dir={isRtl ? 'rtl' : 'ltr'}>
                  <thead>
                    <tr className="bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                      <th className={`py-2.5 px-space-md rounded-l-lg ${isRtl ? 'text-right' : 'text-left'}`}>
                        {isRtl ? 'رقم الطلب' : 'Order ID'}
                      </th>
                      <th className={`py-2.5 px-space-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                        {isRtl ? 'العميل / الجهة' : 'Client / Entity'}
                      </th>
                      <th className={`py-2.5 px-space-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                        {isRtl ? 'المركبة' : 'Vehicle Dossier'}
                      </th>
                      <th className={`py-2.5 px-space-sm ${isRtl ? 'text-left' : 'text-right'}`}>
                        {isRtl ? 'الصافي (درهم)' : 'Net Total (AED)'}
                      </th>
                      <th className={`py-2.5 px-space-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                        {isRtl ? 'آلية التسوية' : 'Settlement Mechanism'}
                      </th>
                      <th className="py-2.5 px-space-sm text-center">
                        {isRtl ? 'مرحلة الإجراء' : 'Lifecycle Stage'}
                      </th>
                      <th className={`py-2.5 px-space-md rounded-r-lg ${isRtl ? 'text-left' : 'text-right'}`}>
                        {isRtl ? 'الإجراء' : 'Action'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high text-body-sm font-body-sm">
                    {orderData.pipeline.map((row) => (
                      <tr key={row.orderId} className="hover:bg-surface-container-high/40 transition-colors">
                        <td className="py-3.5 px-space-md">
                          <span className="font-data-mono-num font-bold text-primary">{row.orderId}</span>
                          <div className="font-label-caps text-[10px] text-on-surface-variant mt-0.5">{row.timestamp}</div>
                        </td>

                        <td className="py-3.5 px-space-sm">
                          <div className="font-semibold text-on-surface">{row.clientEntity}</div>
                          <div className="text-on-surface-variant text-body-sm">{row.clientRep}</div>
                        </td>

                        <td className="py-3.5 px-space-sm">
                          <div className="font-semibold text-on-surface">{row.vehicleTitle}</div>
                          <div className="font-data-mono-num text-[11px] text-on-surface-variant">{row.vehicleVin}</div>
                        </td>

                        <td className={`py-3.5 px-space-sm font-data-mono-num font-bold text-on-surface ${isRtl ? 'text-left' : 'text-right'}`}>
                          {row.netTotalAed}
                        </td>

                        <td className="py-3.5 px-space-sm">
                          <div className="flex items-center gap-1.5 text-on-surface">
                            <span className="material-symbols-outlined text-[16px] text-secondary">account_balance</span>
                            <span>{row.settlementMechanism}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-space-sm text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-label-caps font-semibold uppercase ${
                            row.stageColor === 'primary'
                              ? 'bg-primary/20 text-primary'
                              : row.stageColor === 'secondary'
                              ? 'bg-secondary/20 text-secondary'
                              : row.stageColor === 'tertiary'
                              ? 'bg-tertiary/20 text-tertiary'
                              : 'bg-outline/20 text-on-surface-variant'
                          }`}>
                            {row.lifecycleStage}
                          </span>
                        </td>

                        <td className={`py-3.5 px-space-md ${isRtl ? 'text-left' : 'text-right'}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setFeedbackMessage(
                                isRtl
                                  ? `تم تحديد الطلب ${row.orderId} للمراجعة والتحميل.`
                                  : `Loaded order ${row.orderId} into active studio workspace.`
                              );
                            }}
                            className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm transition-colors border border-white/[0.05]"
                          >
                            {row.actionLabel}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interactive Template View Switcher Dock (Fixed at Bottom) */}
            <div className="sticky bottom-4 z-30 self-center max-w-4xl w-full">
              <div className="bg-surface-container-highest/95 backdrop-blur-xl p-2 rounded-xl shadow-2xl flex flex-wrap items-center justify-between gap-2 ring-1 ring-white/10">
                <div className="flex items-center gap-2 px-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">view_carousel</span>
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold">
                    {isRtl ? 'نماذج استوديو P1 الجاهزة:' : 'Interactive Roadmap Presets:'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPreset('POPULATED');
                      setOrderData(VERIFIED_SALES_ORDER_FIXTURE);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-body-sm text-body-sm font-semibold shadow-sm flex items-center gap-1.5 transition-colors ${
                      preset === 'POPULATED'
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">done</span>
                    <span>Populated Quotation (GT3 RS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPreset('TRADE_IN');
                      setFeedbackMessage('Switched to Trade-In Heavy quotation layout.');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-body-sm text-body-sm transition-colors ${
                      preset === 'TRADE_IN'
                        ? 'bg-primary-container text-on-primary-container font-semibold'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span>Trade-In Heavy Order (Ferrari 296)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportTaxModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-body-sm text-body-sm transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px] text-tertiary">verified</span>
                    <span>Compliance & FTA Export</span>
                  </button>
                </div>

                <div className="px-2 hidden md:block">
                  <span className="font-data-mono-num text-[11px] text-outline">P1.SPEC.2025.Q3</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create New Quotation Modal */}
      {newOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-surface-container p-space-lg shadow-2xl border border-white/[0.08] flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {isRtl ? 'إنشاء مسودة عرض سعر جديدة' : 'Create New Quotation Draft'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNewOrderModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="font-label-caps text-label-caps uppercase text-outline block mb-1">
                  {isRtl ? 'اسم المشتري / الكيان المؤسسي' : 'Client / Corporate Entity Name'}
                </label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-white/[0.06] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-label-caps text-label-caps uppercase text-outline block mb-1">
                  {isRtl ? 'المركبة المستهدفة من المخزون' : 'Target Inventory Vehicle'}
                </label>
                <input
                  type="text"
                  value={newVehicleModel}
                  onChange={(e) => setNewVehicleModel(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-white/[0.06] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-label-caps text-label-caps uppercase text-outline block mb-1">
                  {isRtl ? 'سعر البيع الأساسي (درهم)' : 'Base Asking Price (AED)'}
                </label>
                <input
                  type="number"
                  value={newAskingPrice}
                  onChange={(e) => setNewAskingPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-high text-on-surface font-data-mono-num text-body-sm border border-white/[0.06] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-space-sm pt-space-xs border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setNewOrderModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleCreateDraftOrder}
                className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-body-sm text-body-sm font-semibold hover:brightness-110"
              >
                {isRtl ? 'حفظ المسودة' : 'Save Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export FTA Tax Schema Modal */}
      {exportTaxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-surface-container p-space-lg shadow-2xl border border-white/[0.08] flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs text-tertiary">
                <span className="material-symbols-outlined text-[24px]">verified</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {isRtl ? 'تصدير هيكل الضريبة للهيئة الاتحادية' : 'FTA Electronic Tax Schema Export'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExportTaxModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              {isRtl
                ? 'تصدير إقرار ضريبة القيمة المضافة الإماراتي المتوافق مع اللائحة التنفيذية رقم 59 للهيئة الاتحادية للضرائب بصيغة XML / PDF المعتمدة.'
                : 'Exporting electronic UAE VAT invoice structure conforming to FTA Executive Regulation Article 59 XML/PDF format.'}
            </p>

            <div className="p-space-sm rounded-lg bg-surface-container-low font-data-mono-num text-body-sm text-outline border border-white/[0.04]">
              TRN: 100293847500003 • Order: {orderData.orderNumber} • Taxable: AED {orderData.commercials.subtotalTaxableAed.toLocaleString()} • VAT: AED {orderData.commercials.uaeVatAed.toLocaleString()}
            </div>

            <div className="flex justify-end gap-space-sm pt-space-xs border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setExportTaxModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setExportTaxModalOpen(false);
                  setFeedbackMessage('FTA Tax Schema XML/PDF exported successfully.');
                }}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:brightness-110"
              >
                {isRtl ? 'تنزيل الملف' : 'Download File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Handover Modal */}
      {scheduleHandoverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-surface-container p-space-lg shadow-2xl border border-white/[0.08] flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs text-primary">
                <span className="material-symbols-outlined text-[24px]">calendar_month</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {isRtl ? 'حجز موعد التسليم في جناح الحرير' : 'Schedule Silk Reveal Ceremony'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setScheduleHandoverModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              {isRtl
                ? 'تأكيد حجز صالة التسليم الخاصة في مركز القوز 1 مع تجهيز سيارة بورش 911 جي تي 3 آر إس وحضور المصور الخاص.'
                : 'Confirming VIP private delivery bay reservation at SilberArrows Al Quoz 1 for 2024 Porsche 911 GT3 RS.'}
            </p>

            <div className="p-space-sm rounded-lg bg-surface-container-low font-data-mono-num text-body-sm text-outline border border-white/[0.04]">
              Slot: 28 OCT 2025 • 17:00 GST • Al Quoz VIP Silk Reveal Bay #01
            </div>

            <div className="flex justify-end gap-space-sm pt-space-xs border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setScheduleHandoverModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setScheduleHandoverModalOpen(false);
                  setFeedbackMessage('Silk Handover Ceremony slot confirmed for Al Maktoum Family Office.');
                }}
                className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-body-sm text-body-sm font-semibold hover:brightness-110"
              >
                {isRtl ? 'تأكيد الحجز' : 'Confirm Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}