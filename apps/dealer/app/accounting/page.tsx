'use client';

import React, { useState } from 'react';
import { DealerSidebar } from '../../components/dealer-sidebar';
import { DealerHeader } from '../../components/dealer-header';
import { previewSafeMessage } from '../../lib/preview';
import {
  VERIFIED_ACCOUNTING_DESK_FIXTURE,
  AccountingDeskData,
} from '../../lib/api';

export default function TaxInvoicesAndAccountingPage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [role] = useState<'PRINCIPAL' | 'SALES_REP'>('PRINCIPAL');
  const isRtl = locale === 'ar';

  const [accountingData, setAccountingData] = useState<AccountingDeskData>(VERIFIED_ACCOUNTING_DESK_FIXTURE);
  const [demonstratorState, setDemonstratorState] = useState<'STANDARD' | 'TRADE_IN' | 'ZERO_RATED' | 'AUDIT_FLAG'>('STANDARD');

  // Modals & Feedback
  const [feedbackMessage, setFeedbackMessageState] = useState<string | null>(null);
  // Preview module: feedback never claims an external action happened.
  const setFeedbackMessage = (message: string | null) => setFeedbackMessageState(previewSafeMessage(message));
  const [generateInvoiceModalOpen, setGenerateInvoiceModalOpen] = useState(false);
  const [exportFafModalOpen, setExportFafModalOpen] = useState(false);
  const [reconcileModalOpen, setReconcileModalOpen] = useState(false);
  const [inspectXmlModalOpen, setInspectXmlModalOpen] = useState(false);

  // New Invoice Form State
  const [newBuyerName, setNewBuyerName] = useState('Al Futtaim Private Enterprise LLC');
  const [newBuyerTrn, setNewBuyerTrn] = useState('100829102400003');
  const [newVehicleTitle, setNewVehicleTitle] = useState('2024 Ferrari SF90 XX Stradale');
  const [newVehiclePrice, setNewVehiclePrice] = useState(3800000);
  const [newVatCategory, setNewVatCategory] = useState<'STANDARD_5' | 'ZERO_RATED'>('STANDARD_5');

  // Handlers
  const handleAuthorizeDisbursement = () => {
    setFeedbackMessage(
      isRtl
        ? 'تم اعتماد تحويل أموال الضمان المصرفي بقيمة 1,054,235.00 درهم لحساب الوكالة لدى بنك أبوظبي الأول (FAB) بعد التحقق من نقل الملكية في RTA.'
        : 'Escrow settlement authorized: AED 1,054,235.00 disbursed to dealership account following RTA title transfer #DXB-PASS-2881 verification.'
    );
  };

  const handleCreateTaxInvoice = () => {
    setGenerateInvoiceModalOpen(false);
    const newInvNum = `INV-2025-${Math.floor(150 + Math.random() * 50)}`;
    const vatRate = newVatCategory === 'STANDARD_5' ? 0.05 : 0;
    const vatAmt = newVehiclePrice * vatRate;
    const grossAmt = newVehiclePrice + vatAmt;

    setAccountingData((prev) => ({
      ...prev,
      recentJournal: [
        {
          id: `inv-${Date.now()}`,
          invoiceNumber: newInvNum,
          issueDate: 'Just now',
          buyerName: newBuyerName,
          buyerTrn: `TRN: ${newBuyerTrn}`,
          vehicleTitle: newVehicleTitle,
          vin: 'VIN: WP0AF2A97RS991204',
          grossAmountAed: grossAmt,
          vatAmountAed: vatAmt,
          vatLabel: newVatCategory === 'STANDARD_5' ? `AED ${vatAmt.toLocaleString()}.00` : 'AED 0.00 (0%)',
          settlementChannel: 'FAB Escrow',
          channelBadgeClass: 'bg-secondary/15 text-secondary',
          ftaStatus: 'XML Filed & Cleared',
          ftaBadgeClass: 'bg-tertiary/15 text-tertiary',
        },
        ...prev.recentJournal,
      ],
    }));

    setFeedbackMessage(
      isRtl
        ? `تم إنشاء الفاتورة الضريبية ${newInvNum} بنجاح للعميل (${newBuyerName}) وتوليد رمز الاستجابة السريعة TLV وختم التوقيع الرقمي SHA-256.`
        : `Tax Invoice ${newInvNum} successfully issued with cryptographic TLV QR and SHA-256 digital signature.`
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
                      {isRtl ? 'تم توثيق عملية المحاسبة والفوترة الضريبية' : 'Tax & Accounting Event Cleared'}
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
            <div className="relative overflow-hidden rounded-xl bg-surface-container-high/90 p-space-md shadow-xl my-space-md border border-white/[0.05]">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
                <div className="flex flex-col gap-1.5 max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/15 text-primary font-label-caps text-label-caps uppercase tracking-wider font-semibold">
                      <span className="material-symbols-outlined text-[14px]">terminal</span>
                      [FUTURE ROADMAP • P1 SPECIFICATION — CONCEPT TEMPLATE]
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-caps text-label-caps tracking-widest uppercase font-semibold">
                      Federal Decree-Law No. (8) of 2017 & (47) of 2022
                    </span>
                    <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-label-caps text-label-caps uppercase font-bold">
                      Peppol BIS 3.0 / UAE E-Invoice Schema
                    </span>
                  </div>
                  <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1 flex flex-wrap items-baseline gap-3">
                    <span>Tax Invoices & Corporate Escrow Accounting</span>
                    <span className="font-body-md text-body-md text-primary font-medium" dir="rtl">
                      الفواتير الضريبية وتسوية حساب الضمان المصرفي
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {isRtl
                      ? 'نموذج مفهوم نظام الوكالة (المرحلة الأولى): مواصفات لنظام الفوترة الإلكترونية المعتمد من الهيئة الاتحادية للضرائب (FTA)، والفواتير الضريبية ثنائية اللغة، وتسوية دفاتر ضريبة الشركات، ومطابقة صرف حسابات الضمان المصرفي لدى DIFC والمصرف المركزي.'
                      : 'CONCEPT TEMPLATE ONLY: Phase 1 Dealership Management System Roadmap. Specification mockups for UAE Federal Tax Authority (FTA) e-invoicing schema, bilingual Arabic/English tax invoices, corporate tax ledger reconciliation, and DIFC/CBUAE escrow disbursement matching.'}
                  </p>
                </div>

                {/* Action Cluster */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExportFafModalOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors font-body-sm text-body-sm font-medium border border-white/[0.06] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">file_download</span>
                    <span>{isRtl ? 'تصدير FAF (XML)' : 'Export FAF (XML)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReconcileModalOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors font-body-sm text-body-sm font-medium border border-white/[0.06] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">account_balance</span>
                    <span>{isRtl ? 'تسوية حساب الضمان' : 'Reconcile Escrow'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenerateInvoiceModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-body-sm text-body-sm font-semibold shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                    <span>{isRtl ? 'إصدار فاتورة ضريبية FTA' : 'Generate FTA Tax Invoice'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* KPI Operational Telemetry Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-lg">
              {/* Total Cleared Revenue */}
              <div className="rounded-xl bg-surface-container-low p-space-md shadow-md flex flex-col justify-between relative overflow-hidden border border-white/[0.04]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
                      {isRtl ? 'الإيرادات المسواة (شهرياً)' : 'Cleared Revenue (MTD)'}
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      {accountingData.kpis.closedSalesCount} {isRtl ? 'صفقات بيع نهائية منجزة' : 'Closed Realized Sales Deeds'}
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-label-caps text-label-caps text-primary uppercase font-bold">AED</span>
                  <span className="font-data-currency-lg text-data-currency-lg text-on-surface tracking-tight font-bold font-data-mono-num">
                    {accountingData.kpis.clearedRevenueMtdAed.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 font-body-sm text-body-sm text-tertiary font-semibold">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  <span>+{accountingData.kpis.momRevenueGrowthPct}% vs last tax quarter (Q4)</span>
                </div>
              </div>

              {/* Escrow Disbursement Status */}
              <div className="rounded-xl bg-surface-container-low p-space-md shadow-md flex flex-col justify-between relative overflow-hidden border border-white/[0.04]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
                      {isRtl ? 'أموال الضمان المعلقة للإفراج' : 'Pending Escrow Release'}
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      FAB / CBUAE Sovereign Escrow
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-label-caps text-label-caps text-secondary uppercase font-bold">AED</span>
                  <span className="font-data-currency-lg text-data-currency-lg text-on-surface tracking-tight font-bold font-data-mono-num">
                    {accountingData.kpis.pendingEscrowReleaseAed.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                  <span className="font-data-mono-num text-data-mono-num text-on-surface font-medium">
                    {accountingData.kpis.pendingDisbursementsCount} {isRtl ? 'مدفوعات بانتظار نقل الملكية RTA' : 'disbursements awaiting RTA title clearance'}
                  </span>
                </div>
              </div>

              {/* Input / Output VAT Position */}
              <div className="rounded-xl bg-surface-container-low p-space-md shadow-md flex flex-col justify-between relative overflow-hidden border border-white/[0.04]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
                      {isRtl ? 'صافي ضريبة القيمة المضافة المستحقة (5%)' : 'Net VAT Payable (5%)'}
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      FTA Form 201 Return Provision
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-tertiary/15 flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[20px]">percent</span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-label-caps text-label-caps text-tertiary uppercase font-bold">AED</span>
                  <span className="font-data-currency-lg text-data-currency-lg text-on-surface tracking-tight font-bold font-data-mono-num">
                    {role === 'SALES_REP'
                      ? '••••••'
                      : accountingData.kpis.netVatPayableAed.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface-variant">{isRtl ? 'موعد التقديم:' : 'Filing Deadline:'}</span>
                  <span className="font-data-mono-num text-data-mono-num text-primary font-semibold">
                    {accountingData.kpis.filingDeadlineDescription}
                  </span>
                </div>
              </div>

              {/* E-Invoicing Cryptographic Compliance */}
              <div className="rounded-xl bg-surface-container-low p-space-md shadow-md flex flex-col justify-between relative overflow-hidden border border-white/[0.04]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
                      {isRtl ? 'سلامة التوقيع الضريبي FTA' : 'FTA E-Invoicing Integrity'}
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Peppol BIS XML + SHA-256 Signatures
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-tertiary/15 flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-data-currency-lg text-data-currency-lg text-tertiary tracking-tight font-bold font-data-mono-num">
                    {accountingData.kpis.eInvoicingIntegrityPct.toFixed(1)}%
                  </span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-medium">
                    Valid
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 font-body-sm text-body-sm text-tertiary font-medium">
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span>{accountingData.kpis.hsmStatusText}</span>
                </div>
              </div>
            </div>

            {/* Primary 2-Column High-Density Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-lg">
              {/* LEFT COLUMN: ~65% (Cols 1 to 8) */}
              <div className="lg:col-span-8 flex flex-col gap-space-lg">
                {/* 1. Interactive FTA Compliant Tax Invoice Preview */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl relative overflow-hidden border border-white/[0.04]">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-tertiary to-secondary" />

                  {/* Invoice Control / Top Metadata Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-space-md mb-space-md bg-surface-container/40 -mx-space-lg -mt-space-lg px-space-lg pt-space-md border-b border-white/[0.05]">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded bg-primary/20 text-primary font-data-mono-num text-data-mono-num font-bold">
                        {accountingData.activeInvoice.invoiceNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary text-body-sm font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                        {isRtl ? 'معتمدة وموقعة رقمياً لدى FTA' : 'Cryptographically Cleared by FTA API'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFeedbackMessage(
                            isRtl
                              ? 'تم إرسال الفاتورة الضريبية INV-2025-0142 إلى طابعة PDF الرسمية المعتمدة.'
                              : 'Official FTA bilingual tax invoice PDF rendering sent to printer spooler.'
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
                        onClick={() =>
                          setFeedbackMessage(
                            isRtl
                              ? 'تم نسخ رابط التحقق الضريبي الآمن للفاتورة.'
                              : 'Secure tax invoice verification share link copied to clipboard.'
                          )
                        }
                        className="p-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-white/[0.05] cursor-pointer"
                        title="Share Invoice"
                      >
                        <span className="material-symbols-outlined text-[18px]">share</span>
                      </button>
                    </div>
                  </div>

                  {/* Bilingual Tax Invoice Body Presentation */}
                  <div className="bg-surface-container-lowest/90 rounded-lg p-space-md text-on-surface flex flex-col gap-space-md shadow-inner border border-white/[0.04]">
                    {/* Bilingual Header Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pb-space-sm border-b border-white/[0.05]">
                      {/* Left: Dealership Details (English) */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-headline-sm text-headline-sm text-primary font-bold">TAX INVOICE</span>
                          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold tracking-wider">
                            STANDARD RATED
                          </span>
                        </div>
                        <div className="font-body-md text-body-md font-semibold text-on-surface">
                          {accountingData.activeInvoice.seller.nameEn}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                          {accountingData.activeInvoice.seller.addressEn}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 font-data-mono-num text-data-mono-num text-primary">
                          <span className="text-on-surface-variant text-[11px] font-sans">TRN:</span>
                          <span className="font-bold tracking-wider">{accountingData.activeInvoice.seller.trn}</span>
                          <span
                            className="material-symbols-outlined text-[14px] text-tertiary"
                            title="Verified active with FTA Tax Registry"
                          >
                            verified
                          </span>
                        </div>
                      </div>

                      {/* Right: Arabic Mirror & Meta (RTL Bilateral) */}
                      <div className="flex flex-col gap-1 md:text-right" dir="rtl">
                        <div className="flex items-center md:justify-start justify-end gap-2">
                          <span className="font-headline-sm text-headline-sm text-primary font-bold">فاتورة ضريبية</span>
                          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold tracking-wider">
                            خاضعة للنسبة الأساسية
                          </span>
                        </div>
                        <div className="font-body-md text-body-md font-semibold text-on-surface">
                          {accountingData.activeInvoice.seller.nameAr}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                          {accountingData.activeInvoice.seller.addressAr}
                        </div>
                        <div className="mt-1 flex items-center md:justify-start justify-end gap-1.5 font-data-mono-num text-data-mono-num text-primary">
                          <span className="text-on-surface-variant text-[11px] font-sans">رقم التسجيل الضريبي:</span>
                          <span className="font-bold tracking-wider" dir="ltr">
                            {accountingData.activeInvoice.seller.trn}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Tax Profile Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg bg-surface-container-high/60 border border-white/[0.03]">
                      <div>
                        <div className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                          Customer / العميل
                        </div>
                        <div className="font-body-sm text-body-sm font-semibold text-on-surface mt-0.5">
                          {accountingData.activeInvoice.buyer.nameEn}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">
                          {accountingData.activeInvoice.buyer.address}
                        </div>
                      </div>

                      <div>
                        <div className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                          Buyer TRN / رقم تسجيل المشتري
                        </div>
                        <div className="font-data-mono-num text-data-mono-num font-semibold text-secondary mt-0.5">
                          {accountingData.activeInvoice.buyer.trn}
                        </div>
                        <div className="font-body-sm text-body-sm text-tertiary flex items-center gap-1 mt-0.5 font-medium">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          {accountingData.activeInvoice.buyer.entityType}
                        </div>
                      </div>

                      <div>
                        <div className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                          Tax Point & Issue Date / تاريخ التوريد
                        </div>
                        <div className="font-data-mono-num text-data-mono-num text-on-surface mt-0.5">
                          {accountingData.activeInvoice.issueDate}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">
                          Payment Deed Ref: <span className="text-primary font-mono">{accountingData.activeInvoice.deedRef}</span>
                        </div>
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-body-sm text-body-sm" id="invoice-lines-table">
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
                          {accountingData.activeInvoice.lines.map((line) => (
                            <tr key={line.id} className="hover:bg-surface-container/60 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-on-surface">
                                  {isRtl ? line.descriptionAr : line.descriptionEn}
                                </div>
                                <div className="font-data-mono-num text-[11px] text-on-surface-variant flex items-center gap-2 mt-0.5">
                                  {line.subText}
                                </div>
                              </td>

                              <td className="py-2.5 px-2 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded font-label-caps text-[10px] font-semibold uppercase ${
                                    line.taxCategory === 'STANDARD_5'
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-secondary/15 text-secondary'
                                  }`}
                                >
                                  {line.taxCategory === 'STANDARD_5' ? '5% Standard' : 'Zero-Rated (0%)'}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 text-right font-data-mono-num text-data-mono-num text-on-surface">
                                {line.unitPriceAed.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>

                              <td className="py-2.5 px-2 text-right font-data-mono-num text-data-mono-num text-on-surface-variant">
                                {line.vatRatePct.toFixed(1)}%
                              </td>

                              <td className="py-2.5 px-3 text-right font-data-mono-num text-data-mono-num text-primary font-medium">
                                {line.vatAmountAed.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>

                              <td className="py-2.5 px-3 text-right font-data-mono-num text-data-mono-num text-on-surface font-semibold">
                                {line.totalPayableAed.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Totals & FTA Encoded Cryptographic Stamp */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md pt-space-sm bg-surface-container/40 p-space-md rounded-lg border border-white/[0.03]">
                      {/* Cryptographic TLV Stamp Section (Cols 1-6) */}
                      <div className="md:col-span-6 flex flex-col justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {/* High-Fidelity SVG TLV QR Code Representation */}
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
                            <div className="font-label-caps text-label-caps text-tertiary uppercase flex items-center gap-1 font-bold">
                              <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
                              FTA TLV Encoded Cryptographic Stamp
                            </div>
                            <div className="font-body-sm text-[11px] text-on-surface-variant leading-tight">
                              Compliant with UAE E-Invoicing Phase 1 Mandate. Contains UTF-8 Tag-Length-Value fields: Seller, TRN, ISO Timestamp, Total, and VAT.
                            </div>
                            <div
                              className="font-data-mono-num text-[10px] text-on-surface-variant truncate bg-surface-container-highest px-2 py-1 rounded mt-1 select-all"
                              title="SHA-256 Digital Signature"
                            >
                              SHA-256: {accountingData.activeInvoice.tlvQrData.sha256Hash}
                            </div>
                          </div>
                        </div>

                        {/* Settlement Verification Stamp */}
                        <div className="p-2.5 rounded bg-tertiary/10 flex items-center justify-between border border-tertiary/20">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                            <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                              CBUAE Settlement Cleared
                            </span>
                          </div>
                          <span className="font-data-mono-num text-[11px] text-tertiary font-medium">
                            Batch {accountingData.activeInvoice.tlvQrData.batchRef}
                          </span>
                        </div>
                      </div>

                      {/* Financial Reconciliation Ledger Breakdown (Cols 7-12) */}
                      <div className="md:col-span-6 flex flex-col gap-2 font-body-sm text-body-sm pl-0 md:pl-2">
                        <div className="flex justify-between items-center text-on-surface-variant">
                          <span>Total Excluding Tax / الإجمالي غير شامل الضريبة</span>
                          <span className="font-data-mono-num text-data-mono-num text-on-surface font-medium">
                            {accountingData.activeInvoice.reconciliation.subtotalExclVatAed.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            AED
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-primary font-medium">
                          <span>Total UAE VAT (5.00%) / إجمالي ضريبة القيمة المضافة</span>
                          <span className="font-data-mono-num text-data-mono-num font-bold">
                            {accountingData.activeInvoice.reconciliation.vatAmountAed.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            AED
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-on-surface font-semibold pt-1 border-t border-white/[0.05]">
                          <span>Gross Total Payable / إجمالي المبلغ المستحق</span>
                          <span className="font-data-mono-num text-data-mono-num text-on-surface font-bold text-headline-sm">
                            {accountingData.activeInvoice.reconciliation.grossTotalAed.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            AED
                          </span>
                        </div>

                        {/* Trade-in Deduction Line */}
                        <div className="flex justify-between items-center p-2 rounded bg-surface-container-high text-on-surface border border-white/[0.03]">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-tertiary text-[16px]">swap_horiz</span>
                            <span>Trade-in Offset: 2022 Mercedes-AMG G63 Equity</span>
                          </div>
                          <span className="font-data-mono-num text-data-mono-num text-tertiary font-bold">
                            {accountingData.activeInvoice.reconciliation.tradeInDeductionAed.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            AED
                          </span>
                        </div>

                        {/* Net Disbursement through Escrow */}
                        <div className="flex justify-between items-center p-2.5 rounded bg-primary/10 text-on-surface mt-1 border border-primary/20">
                          <div>
                            <div className="font-label-caps text-label-caps text-primary uppercase font-bold">
                              Net Disbursed via Sovereign Escrow
                            </div>
                            <div className="font-body-sm text-[11px] text-on-surface-variant">
                              {accountingData.activeInvoice.reconciliation.escrowAccountName}
                            </div>
                          </div>
                          <span className="font-data-currency-lg text-headline-md text-primary font-bold font-data-mono-num">
                            {accountingData.activeInvoice.reconciliation.netEscrowDisbursementAed.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            <span className="text-xs font-sans">AED</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Dual-Ledger Escrow Disbursement Matcher */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl border border-white/[0.04]">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-space-md">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-[18px]">balance</span>
                      </div>
                      <div>
                        <div className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {isRtl ? 'مطابقة قيود الضمان المصرفي ثنائية الدفاتر' : 'Dual-Ledger Escrow Settlement Matcher'}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">
                          Live cross-comparison: FAB Escrow Trust Account vs Dealership ERP General Ledger (GL)
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-tertiary/10 text-tertiary font-data-mono-num text-data-mono-num font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-tertiary" />
                      Variance: {accountingData.dualLedger.varianceAed.toFixed(2)} AED (Balanced)
                    </span>
                  </div>

                  {/* Split Ledger Comparison Card Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    {/* Ledger A: FAB Escrow Sovereign View */}
                    <div className="rounded-lg bg-surface-container p-space-md flex flex-col gap-3 border border-white/[0.04]">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            account_balance
                          </span>
                          <div>
                            <div className="font-body-sm text-body-sm font-semibold text-on-surface">
                              Platform Escrow Ledger
                            </div>
                            <div className="font-label-caps text-label-caps text-on-surface-variant">
                              First Abu Dhabi Bank (IBAN: AE020300...)
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-secondary text-body-sm font-data-mono-num">
                          Inflow Verified
                        </span>
                      </div>
                      <div className="space-y-2 text-body-sm">
                        <div className="flex items-center justify-between p-2 rounded bg-surface-container-high/60">
                          <span className="text-on-surface-variant">Initial Security Deposit (Wire):</span>
                          <span className="font-data-mono-num text-data-mono-num text-on-surface font-medium">
                            AED {accountingData.dualLedger.securityDepositWireAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-surface-container-high/60">
                          <span className="text-on-surface-variant">ADCB Auto Finance Proceeds:</span>
                          <span className="font-data-mono-num text-data-mono-num text-on-surface font-medium">
                            AED {accountingData.dualLedger.adcbFinanceProceedsAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-surface-container-high/60">
                          <span className="text-on-surface-variant">CBUAE Mandatory Escrow Holdback:</span>
                          <span className="font-data-mono-num text-data-mono-num text-error font-medium">
                            -AED {accountingData.dualLedger.escrowHoldbackAed.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded bg-surface-container-highest font-semibold text-on-surface">
                          <span>Total Liquid Escrow Balance:</span>
                          <span className="font-data-mono-num text-data-mono-num text-secondary font-bold">
                            AED {accountingData.dualLedger.escrowBalanceAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                              Dealership General Ledger
                            </div>
                            <div className="font-label-caps text-label-caps text-on-surface-variant">
                              ERP Sub-Account: 1040-02 (Vehicles Receivable)
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-primary text-body-sm font-data-mono-num font-bold">
                          GL Matched
                        </span>
                      </div>
                      <div className="space-y-2 text-body-sm">
                        <div className="flex items-center justify-between p-2 rounded bg-surface-container-high/60">
                          <span className="text-on-surface-variant">Gross Vehicle Invoice Total:</span>
                          <span className="font-data-mono-num text-data-mono-num text-on-surface font-medium">
                            AED {accountingData.dualLedger.glGrossInvoiceAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-surface-container-high/60">
                          <span className="text-on-surface-variant">Trade-In G63 Equity Realization:</span>
                          <span className="font-data-mono-num text-data-mono-num text-tertiary font-medium">
                            {accountingData.dualLedger.glTradeInOffsetAed.toLocaleString('en-US', { minimumFractionDigits: 2 })} AED
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-surface-container-high/60">
                          <span className="text-on-surface-variant">Tasjeel Internal Passed Absorption:</span>
                          <span className="font-data-mono-num text-data-mono-num text-on-surface-variant font-medium">
                            AED 0.00 (Zero variance)
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded bg-surface-container-highest font-semibold text-on-surface">
                          <span>Net Accounts Receivable Target:</span>
                          <span className="font-data-mono-num text-data-mono-num text-primary font-bold">
                            AED {accountingData.dualLedger.glTotalReceivableAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settlement Authorization Callout */}
                  <div className="mt-space-md p-space-sm rounded-lg bg-tertiary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-tertiary/20">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-[20px]">
                        sync_saved_locally
                      </span>
                      <div>
                        <div className="font-body-sm text-body-sm text-on-surface font-semibold">
                          T+0 Settlement Ready for Release
                        </div>
                        <div className="font-body-sm text-[12px] text-on-surface-variant">
                          Tasjeel title deed transfer {accountingData.dualLedger.rtaTransferRef} confirmed on Dubai RTA registry.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAuthorizeDisbursement}
                      className="px-4 py-2 rounded-lg bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:brightness-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-md"
                    >
                      {isRtl ? 'اعتماد صرف أموال الضمان' : 'Authorize Escrow Disbursement'}
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: ~35% (Cols 9 to 12) */}
              <div className="lg:col-span-4 flex flex-col gap-space-lg">
                {/* 1. UAE Corporate Tax & VAT Compliance Engine */}
                <div className="rounded-xl bg-surface-container-low p-space-md shadow-xl flex flex-col gap-space-md border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">gavel</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        {isRtl ? 'محرك ضريبة الشركات (9%)' : 'Corporate Tax (9%) Engine'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-label-caps text-label-caps uppercase font-bold">
                      FY2025
                    </span>
                  </div>

                  <div className="bg-surface-container p-3 rounded-lg flex flex-col gap-2 border border-white/[0.03]">
                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface-variant">{isRtl ? 'الحد القانوني المعفى:' : 'Statutory Threshold:'}</span>
                      <span className="font-data-mono-num text-data-mono-num text-on-surface font-semibold">
                        AED {accountingData.corporateTax.statutoryThresholdAed.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface-variant">{isRtl ? 'نسبة الضريبة المطبقة:' : 'Applicable Tax Rate:'}</span>
                      <span className="font-data-mono-num text-data-mono-num text-primary font-bold">
                        {accountingData.corporateTax.taxRatePct.toFixed(1)}% on excess
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface-variant">{isRtl ? 'صافي الدخل الخاضع للضريبة:' : 'YTD Taxable Net Income:'}</span>
                      <span className="font-data-mono-num text-data-mono-num text-on-surface font-medium">
                        {role === 'SALES_REP'
                          ? '••••••'
                          : `AED ${accountingData.corporateTax.ytdTaxableNetIncomeAed.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden my-1">
                      <div className="h-full bg-primary rounded-full" style={{ width: '78%' }} />
                    </div>
                    <div className="flex justify-between items-center font-body-sm text-body-sm pt-1 border-t border-white/[0.04]">
                      <span className="text-on-surface font-medium">{isRtl ? 'مخصص الضريبة المتراكم:' : 'Accrued CT Provision:'}</span>
                      <span className="font-data-mono-num text-data-mono-num text-primary font-bold">
                        {role === 'SALES_REP'
                          ? '••••••'
                          : `AED ${accountingData.corporateTax.accruedCtProvisionAed.toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  {/* Free Zone Qualified Status Check */}
                  <div className="p-3 rounded-lg bg-surface-container-high/60 flex flex-col gap-1.5 border border-white/[0.03]">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-label-caps uppercase text-tertiary font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        {accountingData.corporateTax.qfzpStatus}
                      </span>
                      <span className="font-data-mono-num text-data-mono-num text-tertiary font-bold">
                        0% Qualifying
                      </span>
                    </div>
                    <p className="font-body-sm text-[12px] text-on-surface-variant leading-relaxed">
                      {isRtl
                        ? 'مؤهل لنسبة ضريبة 0% على معاملات إعادة التصدير بالجملة عبر مستودعات الترانزيت المعتمدة خارج النطاق الجمركي المحلي.'
                        : 'Eligible for 0% Corporate Tax rate on designated bonded warehouse wholesale re-export transactions outside the UAE mainland customs boundary.'}
                    </p>
                  </div>

                  {/* Mainland vs Bonded Freezone Split Visualizer */}
                  <div className="bg-surface-container p-3 rounded-lg flex flex-col gap-2 border border-white/[0.03]">
                    <div className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold">
                      {isRtl ? 'توزيع التوريد حسب النطاق الجغرافي (شهرياً)' : 'Jurisdiction Supply Split (MTD)'}
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 rounded-l-full bg-primary"
                        style={{ width: `${accountingData.corporateTax.mainlandSupplyPct}%` }}
                        title={`${accountingData.corporateTax.mainlandSupplyPct}% Mainland Sales`}
                      />
                      <div
                        className="h-3 rounded-r-full bg-secondary"
                        style={{ width: `${accountingData.corporateTax.bondedExportPct}%` }}
                        title={`${accountingData.corporateTax.bondedExportPct}% Bonded Free Zone Transit`}
                      />
                    </div>
                    <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-primary inline-block" />
                        <span>{accountingData.corporateTax.mainlandSupplyPct}% Mainland UAE (5% VAT)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-secondary inline-block" />
                        <span>{accountingData.corporateTax.bondedExportPct}% GCC Bonded (0% Export)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Automated FTA Audit File (FAF) Generator */}
                <div className="rounded-xl bg-surface-container-low p-space-md shadow-xl flex flex-col gap-space-md border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        assignment_turned_in
                      </span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        {isRtl ? 'ملف تدقيق الضرائب (FAF)' : 'FTA Audit File (FAF)'}
                      </span>
                    </div>
                    <span className="font-data-mono-num text-data-mono-num text-secondary font-semibold">
                      XML Schema 1.0
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {isRtl
                      ? 'مستخرج بيانات محاسبية موحد متوافق مع المرسوم بقانون اتحادي رقم (8) في شأن ضريبة القيمة المضافة. جاهز للرفع الآلي على بوابة EmaraTax.'
                      : 'Standardized accounting data extract compliant with UAE Federal Decree-Law No. (8) on Value Added Tax. Ready for automated upload into EmaraTax portal.'}
                  </p>

                  {/* Bayan Declaration Matching Status */}
                  <div className="p-3 rounded-lg bg-surface-container flex flex-col gap-2 border border-white/[0.03]">
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                        Dubai Customs Bayan Reconciled
                      </span>
                      <span className="font-data-mono-num text-data-mono-num text-tertiary font-bold">
                        14 / 14 Passed
                      </span>
                    </div>
                    <div className="font-body-sm text-[12px] text-on-surface-variant">
                      All GCC cross-border consignments matched with verified Dubai Customs import/export declaration certificates.
                    </div>
                    <div className="flex items-center gap-2 text-tertiary font-body-sm text-[12px] mt-1 font-medium">
                      <span className="material-symbols-outlined text-[14px]">format_image_left</span>
                      <span>Zero open audit flags across all VIN records</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExportFafModalOpen(true)}
                    className="w-full py-2.5 px-3 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface font-body-sm text-body-sm font-medium flex items-center justify-center gap-2 transition-colors border border-white/[0.05] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">download</span>
                    <span>{isRtl ? 'تصدير دفتر FAF الكامل (.xml / .csv)' : 'Export Full FAF Tax Ledger (.xml / .csv)'}</span>
                  </button>
                </div>

                {/* 3. Quick Accounting & Settlement Actions */}
                <div className="rounded-xl bg-surface-container-low p-space-md shadow-xl flex flex-col gap-2.5 border border-white/[0.04]">
                  <div className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold tracking-wider mb-1">
                    {isRtl ? 'عمليات الضمان والضرائب' : 'Escrow & Tax Operations'}
                  </div>

                  <button
                    type="button"
                    onClick={handleAuthorizeDisbursement}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-primary-container text-on-primary-container font-body-sm text-body-sm font-semibold hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">account_balance</span>
                      <span>{isRtl ? 'صرف مبالغ الضمان لحساب الوكالة' : 'Release Escrow to Dealership Account'}</span>
                    </span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackMessage(
                        isRtl
                          ? 'تم تجهيز مسودة إشعار دائن/مدين وفقاً للمادة 61 من قانون الإجراءات الضريبية.'
                          : 'Credit/Debit note draft initialized pursuant to Article 61 of UAE Tax Procedures Law.'
                      );
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm font-medium transition-colors border border-white/[0.03] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">note_add</span>
                      <span>{isRtl ? 'إصدار إشعار دائن / مدين' : 'Issue Credit Note / Debit Note'}</span>
                    </span>
                    <span className="font-data-mono-num text-[11px] text-on-surface-variant font-medium">Art. 61 FTA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackMessage(
                        isRtl
                          ? 'تمت جدولة إقرار ضريبة القيمة المضافة Form 201 والمزامنة المباشرة مع بوابة الضرائب.'
                          : 'VAT Return Form 201 schedule synced with EmaraTax staging portal.'
                      );
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm font-medium transition-colors border border-white/[0.03] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-secondary">domain</span>
                      <span>{isRtl ? 'جدولة إقرار ضريبة القيمة المضافة 201' : 'Batch VAT Return Form 201 Schedule'}</span>
                    </span>
                    <span className="font-data-mono-num text-[11px] text-tertiary font-bold">Live Sync</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Section: Recent Invoices & Accounting Ledger */}
            <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl mb-space-lg border border-white/[0.04]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-space-md">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-[22px]">table_chart_view</span>
                  <div>
                    <div className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      {isRtl ? 'سجل الفواتير والتسويات المالية الأخيرة' : 'Recent Invoices & Fiscal Settlement Journal'}
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      Live audit ledger of high-value transactions cleared through DIFC/CBUAE escrow channels
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container font-body-sm text-body-sm text-on-surface border border-white/[0.05]">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">filter_list</span>
                    <span>Showing Last {accountingData.recentJournal.length} Sales</span>
                  </div>
                </div>
              </div>

              {/* Telemetry Density Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm" id="accounting-journal-table">
                  <thead>
                    <tr className="bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                      <th className="py-2.5 px-3">{isRtl ? 'رقم الفاتورة الضريبية' : 'Tax Invoice #'}</th>
                      <th className="py-2.5 px-3">{isRtl ? 'المشتري ورقم TRN' : 'Buyer & Entity TRN'}</th>
                      <th className="py-2.5 px-3">{isRtl ? 'المركبة / وحدة الأصل' : 'Vehicle / Asset Unit'}</th>
                      <th className="py-2.5 px-3 text-right">{isRtl ? 'المبلغ الإجمالي' : 'Gross Amount'}</th>
                      <th className="py-2.5 px-3 text-right">{isRtl ? 'ضريبة القيمة المضافة (5%)' : 'VAT (5%)'}</th>
                      <th className="py-2.5 px-3 text-center">{isRtl ? 'قناة التسوية' : 'Settlement Channel'}</th>
                      <th className="py-2.5 px-3 text-center">{isRtl ? 'حالة الاعتماد FTA' : 'FTA Status'}</th>
                      <th className="py-2.5 px-3 text-right">{isRtl ? 'الإجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-0">
                    {accountingData.recentJournal.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-surface-container/60 transition-colors bg-surface-container/20 border-b border-white/[0.02]"
                      >
                        <td className="py-3 px-3">
                          <div className="font-data-mono-num text-data-mono-num font-bold text-primary">
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

                        <td className="py-3 px-3 text-right font-data-mono-num text-data-mono-num text-primary font-medium">
                          {row.vatLabel}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${row.channelBadgeClass}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {row.settlementChannel}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-caps text-[10px] font-semibold uppercase ${row.ftaBadgeClass}`}
                          >
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
                                  ? `تم تحميل تفاصيل الفاتورة الضريبية ${row.invoiceNumber} للمعاينة والتدقيق.`
                                  : `Viewing full fiscal audit record for ${row.invoiceNumber}.`
                              )
                            }
                            className="p-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-white/[0.05] cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom State Demonstrator Dock (Roadmap Interactive States) */}
            <div className="rounded-xl bg-surface-container-high p-space-md shadow-2xl flex flex-col md:flex-row items-center justify-between gap-space-md border border-outline-variant/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">developer_board</span>
                </div>
                <div>
                  <div className="font-body-sm text-body-sm text-on-surface font-semibold">
                    {isRtl ? 'محاكي الحالات الضريبية التفاعلي' : 'Interactive Prototype State Switcher'}
                  </div>
                  <div className="font-body-sm text-[12px] text-on-surface-variant">
                    {isRtl
                      ? 'تبديل حالات النموذج للتحقق من مختلف سيناريوهات الامتثال الضريبي والمصرفي:'
                      : 'Switch template scenario to validate alternate fiscal compliance conditions:'}
                  </div>
                </div>
              </div>

              {/* State Switcher Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('STANDARD');
                    setFeedbackMessage(
                      isRtl
                        ? 'تم تفعيل سيناريو: الفاتورة الضريبية القياسية (بورشه GT3 RS).'
                        : 'Demonstrator: Standard Tax Invoice state active for Porsche 911 GT3 RS.'
                    );
                  }}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-body-sm font-semibold shadow transition-all cursor-pointer ${
                    demonstratorState === 'STANDARD'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-highest text-on-surface hover:bg-surface-bright'
                  }`}
                >
                  {isRtl ? 'فاتورة قياسية (GT3 RS)' : 'Standard Tax Invoice (GT3 RS)'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('TRADE_IN');
                    setFeedbackMessage(
                      isRtl
                        ? 'تم تفعيل سيناريو: خصم تسوية البدل (AMG G63) وإصدار الإشعار الضريبي المعتمد.'
                        : 'Demonstrator: Trade-in Offset & Credit Note state active (AED 490,000 equity offset).'
                    );
                  }}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-body-sm font-medium transition-colors cursor-pointer ${
                    demonstratorState === 'TRADE_IN'
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface-container-highest text-on-surface hover:bg-surface-bright'
                  }`}
                >
                  {isRtl ? 'تسوية البدل والإشعار الدائن' : 'Trade-in Offset & Credit Note'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('ZERO_RATED');
                    setFeedbackMessage(
                      isRtl
                        ? 'تم تفعيل سيناريو: التصدير الإقليمي الخاضع لنسبة الصفر (0%) بموجب البيان الجمركي #SA-981240-DXB.'
                        : 'Demonstrator: GCC Cross-Border Zero-Rated Export (0% VAT) pursuant to Bayan #SA-981240-DXB.'
                    );
                  }}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-body-sm font-medium transition-colors cursor-pointer ${
                    demonstratorState === 'ZERO_RATED'
                      ? 'bg-secondary text-on-secondary font-bold'
                      : 'bg-surface-container-highest text-on-surface hover:bg-surface-bright'
                  }`}
                >
                  {isRtl ? 'تصدير خليجي (نسبة الصفر 0%)' : 'GCC Cross-Border (0% Zero-Rated)'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('AUDIT_FLAG');
                    setFeedbackMessage(
                      isRtl
                        ? 'تنبيه تدقيق FTA: تم تسجيل فارق حسابي ضريبي في إقرار الربع الرابع يتطلب مراجعة المستشار الضريبي.'
                        : 'Audit Flag: Potential tax classification variance flagged for FTA specialist legal review.'
                    );
                  }}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-body-sm font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                    demonstratorState === 'AUDIT_FLAG'
                      ? 'bg-error-container text-on-error-container font-bold'
                      : 'bg-surface-container-highest text-error hover:bg-surface-bright'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  <span>{isRtl ? 'تنبيه تدقيق هيئة الضرائب' : 'FTA Audit Discrepancy Flag'}</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* =========================================================================
          MODALS
      ========================================================================== */}

      {/* Modal 1: Generate FTA Tax Invoice */}
      {generateInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'إصدار فاتورة ضريبية رسمية (FTA)' : 'Generate Official FTA Tax Invoice'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGenerateInvoiceModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  Buyer Entity Name / اسم المشتري
                </label>
                <input
                  type="text"
                  value={newBuyerName}
                  onChange={(e) => setNewBuyerName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  Buyer TRN / رقم التسجيل الضريبي للمشتري
                </label>
                <input
                  type="text"
                  value={newBuyerTrn}
                  onChange={(e) => setNewBuyerTrn(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] font-data-mono-num"
                />
              </div>

              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                  Vehicle / وحدة الأصل
                </label>
                <input
                  type="text"
                  value={newVehicleTitle}
                  onChange={(e) => setNewVehicleTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                    Invoice Amount (AED)
                  </label>
                  <input
                    type="number"
                    value={newVehiclePrice}
                    onChange={(e) => setNewVehiclePrice(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08] font-data-mono-num"
                  />
                </div>
                <div>
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold block mb-1">
                    Tax Category
                  </label>
                  <select
                    value={newVatCategory}
                    onChange={(e) => setNewVatCategory(e.target.value as 'STANDARD_5' | 'ZERO_RATED')}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-white/[0.08]"
                  >
                    <option value="STANDARD_5">Standard Rated (5% VAT)</option>
                    <option value="ZERO_RATED">Zero-Rated (0% GCC Export)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container border border-white/[0.05] flex items-center justify-between text-xs">
                <span>Calculated VAT ({newVatCategory === 'STANDARD_5' ? '5%' : '0%'}):</span>
                <span className="font-data-mono-num text-primary font-bold text-sm">
                  AED {(newVehiclePrice * (newVatCategory === 'STANDARD_5' ? 0.05 : 0)).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setGenerateInvoiceModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleCreateTaxInvoice}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold font-body-sm text-sm hover:brightness-105 transition-all shadow-md"
              >
                {isRtl ? 'توقيع وإصدار الفاتورة' : 'Sign & Generate Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Export FAF (XML) */}
      {exportFafModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">file_download</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'تصدير ملف تدقيق الضرائب FTA (FAF XML)' : 'Export FTA Audit File (FAF XML)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExportFafModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div className="p-3 rounded-lg bg-surface-container font-data-mono-num text-xs flex flex-col gap-1 text-on-surface-variant overflow-x-auto max-h-48 border border-white/[0.06]">
                <div className="text-secondary font-bold">&lt;?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?&gt;</div>
                <div className="text-primary">&lt;AuditFile xmlns=&quot;urn:fta:faf:v1.0&quot;&gt;</div>
                <div className="pl-3">&lt;Header&gt;</div>
                <div className="pl-6">&lt;TaxEntityTRN&gt;100293847500003&lt;/TaxEntityTRN&gt;</div>
                <div className="pl-6">&lt;PeriodStart&gt;2025-01-01&lt;/PeriodStart&gt;</div>
                <div className="pl-6">&lt;PeriodEnd&gt;2025-03-31&lt;/PeriodEnd&gt;</div>
                <div className="pl-3">&lt;/Header&gt;</div>
                <div className="pl-3">&lt;GeneralLedgerEntries totalRecords=&quot;14&quot;&gt;...&lt;/GeneralLedgerEntries&gt;</div>
                <div className="text-primary">&lt;/AuditFile&gt;</div>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isRtl
                  ? 'تم استخراج حزم البيانات المحاسبية المتوافقة مع معايير EmaraTax للتدقيق الضريبي الفوري.'
                  : 'Pre-validated against FTA FAF v1.0 XML schema with checksum SHA-256 for automated EmaraTax declaration.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setExportFafModalOpen(false);
                  setFeedbackMessage(
                    isRtl
                      ? 'تم تصدير ملف FAF بتنسيق XML بنجاح.'
                      : 'FTA Audit File (FAF) XML successfully generated and downloaded.'
                  );
                }}
                className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-semibold font-body-sm text-sm"
              >
                {isRtl ? 'تحميل ملف XML' : 'Download XML File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Reconcile Escrow */}
      {reconcileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">account_balance</span>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
                  {isRtl ? 'تسوية حساب الضمان المصرفي السيادي' : 'Sovereign Escrow Account Reconciliation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReconcileModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-sm text-on-surface">
              <div className="p-3 rounded-lg bg-surface-container border border-white/[0.06] flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between font-semibold text-primary">
                  <span>Trust Account: First Abu Dhabi Bank (FAB)</span>
                  <span>Batch #FAB-ESCR-00984</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant pt-1">
                  <span>Escrow Inflow Balance:</span>
                  <span className="font-data-mono-num font-bold text-on-surface">AED 1,054,235.00</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>General Ledger Target:</span>
                  <span className="font-data-mono-num font-bold text-on-surface">AED 1,054,235.00</span>
                </div>
                <div className="flex items-center justify-between text-tertiary pt-1 border-t border-white/[0.05] font-bold">
                  <span>Variance:</span>
                  <span>0.00 AED (Balanced)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container/60 border border-white/[0.04] text-xs text-on-surface-variant leading-relaxed">
                RTA title transfer Passing Certificate #DXB-PASS-2881 verified. Real-time bank notification received from CBUAE gateway.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setReconcileModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-sm"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReconcileModalOpen(false);
                  handleAuthorizeDisbursement();
                }}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold font-body-sm text-sm"
              >
                {isRtl ? 'تأكيد التسوية وصرف المبالغ' : 'Confirm Reconciliation'}
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
                  {isRtl ? 'فحص كود الفاتورة UBL 2.1 XML' : 'UBL 2.1 XML E-Invoice Inspector'}
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
                <div className="pl-3">&lt;cbc:CustomizationID&gt;urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0&lt;/cbc:CustomizationID&gt;</div>
                <div className="pl-3">&lt;cbc:ID&gt;INV-2025-0142&lt;/cbc:ID&gt;</div>
                <div className="pl-3">&lt;cbc:IssueDate&gt;2025-04-14&lt;/cbc:IssueDate&gt;</div>
                <div className="pl-3">&lt;cac:TaxTotal&gt;</div>
                <div className="pl-6 text-primary">&lt;cbc:TaxAmount currencyID=&quot;AED&quot;&gt;73535.00&lt;/cbc:TaxAmount&gt;</div>
                <div className="pl-3">&lt;/cac:TaxTotal&gt;</div>
                <div className="pl-3">&lt;cac:LegalMonetaryTotal&gt;</div>
                <div className="pl-6 text-tertiary">&lt;cbc:PayableAmount currencyID=&quot;AED&quot;&gt;1544235.00&lt;/cbc:PayableAmount&gt;</div>
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
    </div>
  );
}
