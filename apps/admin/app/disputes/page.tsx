'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import {
  MOCK_DISPUTE_CASE,
  fetchDisputeCase,
  executeDisputeAdjudication,
  DisputeCaseDetail,
} from '../../lib/api';

export default function DisputesAndSanctionsPage() {
  const [isRtl, setIsRtl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dispute, setDispute] = useState<DisputeCaseDetail>(MOCK_DISPUTE_CASE);
  const [activeTab, setActiveTab] = useState<'tasjeel' | 'chat' | 'listing'>('tasjeel');

  // Adjudication form state
  const [escrowDisposition, setEscrowDisposition] = useState<'FULL_RETURN' | 'PARTIAL_FEE_DEDUCTED' | 'HOLD_TRIBUNAL'>('FULL_RETURN');
  const [sanction1, setSanction1] = useState(true);
  const [sanction2, setSanction2] = useState(true);
  const [sanction3, setSanction3] = useState(true);
  const [sanction4, setSanction4] = useState(true);

  // Dual signer state
  const [secondSignerPin, setSecondSignerPin] = useState('');
  const [signer2Authorized, setSigner2Authorized] = useState(false);

  // Execution feedback & dialogs
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [copiedVin, setCopiedVin] = useState(false);
  const [difcModalOpen, setDifcModalOpen] = useState(false);
  const [suspensionModalOpen, setSuspensionModalOpen] = useState(false);
  const [escrowCautionModalOpen, setEscrowCautionModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchDisputeCase('DSP-2025-019');
      setDispute(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleCopyVin = () => {
    navigator.clipboard?.writeText(dispute.vehicleVin);
    setCopiedVin(true);
    setTimeout(() => setCopiedVin(false), 2000);
  };

  const handleAuthorizeSecondarySigner = () => {
    if (secondSignerPin.trim().length >= 4) {
      setSigner2Authorized(true);
    }
  };

  const handleExecuteAdjudication = async () => {
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const res = await executeDisputeAdjudication(dispute.caseNumber, {
      escrowDisposition,
      sanctions: {
        listingSuspension: sanction1,
        demoteAccreditation: sanction2,
        mandatoryReAudit: sanction3,
        transmitDED: sanction4,
      },
      secondSignerPin: signer2Authorized ? 'HSM-CERT-VALIDATED' : undefined,
    });

    setIsSubmitting(false);
    setFeedbackMessage(
      isRtl
        ? 'تم تنفيذ قرار التحكيم والعقوبات التنظيمية بنجاح. تم تقييد حساب الوكيل وتجميد المعاملات وإشعار سلطات الرقابة.'
        : res.message
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[40px] animate-spin">
            progress_activity
          </span>
          <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
            Loading Dispute Case Dossier & Sovereign Escrow Vault...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-background font-body-md text-on-surface ${
        isRtl ? 'rtl' : 'ltr'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <AdminSidebar isRtl={isRtl} />
      <div className={isRtl ? 'pr-60' : 'pl-60'}>
        <AdminHeader isRtl={isRtl} onToggleRtl={() => setIsRtl(!isRtl)} />

        <main className="w-full pt-16 bg-background px-gutter py-space-lg">
          <div className="flex flex-col w-full">
            {/* Feedback Notification Banner */}
            {feedbackMessage && (
              <div className="mb-space-md p-space-md rounded-xl bg-tertiary-container/20 border border-tertiary text-on-surface flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-tertiary text-[24px]">verified</span>
                  <div>
                    <span className="font-headline-sm text-body-md font-semibold text-tertiary block">
                      {isRtl ? 'تم إصدار وتوثيق أمر التحكيم' : 'Sovereign Enforcement Order Dispatched'}
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

            {/* Case Command Header Banner */}
            <div className="relative w-full rounded-xl bg-surface-container-low p-space-lg shadow-xl overflow-hidden mb-space-lg border border-surface-container-high/40">
              <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-error-container/20 blur-3xl pointer-events-none"></div>
              <div className="absolute right-1/3 -bottom-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col gap-space-md">
                {/* Breadcrumb Bar & Sovereign Clearance */}
                <div className="flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-xs font-label-caps text-label-caps text-outline uppercase tracking-wider">
                    <Link href="/" className="hover:text-on-surface transition-colors">
                      {isRtl ? 'الإنفاذ القانوني والمنصة' : 'Platform Enforcement & Legal'}
                    </Link>
                    <span className="text-outline-variant">/</span>
                    <Link href="/disputes" className="hover:text-on-surface transition-colors">
                      {isRtl ? 'النزاعات والعقوبات' : 'Disputes & Sanctions'}
                    </Link>
                    <span className="text-outline-variant">/</span>
                    <span className="text-primary font-data-mono-num font-semibold">
                      {isRtl ? `قضية رقم #${dispute.caseNumber}` : `Case #${dispute.caseNumber}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-space-xs px-2.5 py-1 rounded-full bg-surface-container-high border border-surface-container-highest/60">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                    <span className="font-data-mono-num text-body-sm text-tertiary">
                      {isRtl ? 'متوافق مع القانون الاتحادي رقم 15' : 'UAE Federal Law No. 15 Compliant'}
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span className="font-label-caps text-label-caps text-on-surface-variant">
                      {isRtl ? 'ربط سلطة محاكم مركز دبي المالي' : 'DIFC Civil Authority Interlock'}
                    </span>
                  </div>
                </div>

                {/* Main Title & Key Status */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg">
                  <div className="flex flex-col gap-space-xs max-w-3xl min-w-0">
                    <div className="flex flex-wrap items-center gap-space-sm">
                      <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                        {isRtl ? 'مراجعة النزاع وفرض العقوبات: ' : 'Dispute & Enforcement Review: '}
                        <span className="text-primary">{dispute.dealerName}</span>
                      </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-space-sm pt-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container/30 text-error font-body-sm text-body-sm font-semibold border border-error-container/50">
                        <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                        {isRtl ? 'عاجل • تجميد صرف حساب الضمان' : 'URGENT • Escrow Disbursement Frozen'}
                      </span>
                      <span className="font-data-mono-num text-body-md text-on-surface font-semibold px-2 py-0.5 rounded bg-surface-container-high border border-surface-container-highest/40">
                        {dispute.escrowAmountFormatted}
                      </span>
                      <span className="text-outline font-body-sm text-body-sm hidden md:inline">
                        {isRtl ? 'وصاية الخزينة: بنك أبوظبي الأول (FAB-SVR-091)' : `Vault Custody: ${dispute.vaultCustodyRef}`}
                      </span>
                    </div>
                  </div>

                  {/* Master Sovereign Action Triggers */}
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <button
                      type="button"
                      onClick={() => setDifcModalOpen(true)}
                      className="h-10 px-4 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm flex items-center gap-space-xs transition-colors shadow-sm border border-surface-container-highest/60"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">balance</span>
                      <span>{isRtl ? 'استدعاء لوساطة مركز دبي المالي' : 'Summon to DIFC Mediation'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEscrowCautionModalOpen(true)}
                      className="h-10 px-4 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm flex items-center gap-space-xs transition-colors shadow-sm border border-surface-container-highest/60"
                    >
                      <span className="material-symbols-outlined text-[18px] text-tertiary">assignment_return</span>
                      <span>{isRtl ? 'إرجاع الضمان للمشتري' : 'Release Escrow to Buyer'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEscrowCautionModalOpen(true)}
                      className="h-10 px-4 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm flex items-center gap-space-xs transition-colors shadow-sm border border-surface-container-highest/60"
                    >
                      <span className="material-symbols-outlined text-[18px]">payments</span>
                      <span>{isRtl ? 'صرف المبلغ للتاجر' : 'Disburse to Dealer'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSuspensionModalOpen(true)}
                      className="h-10 px-4 rounded-lg bg-error-container hover:bg-error text-on-error-container hover:text-on-error font-body-sm text-body-sm font-semibold flex items-center gap-space-xs transition-all shadow-md"
                    >
                      <span className="material-symbols-outlined text-[18px]">gavel</span>
                      <span>{isRtl ? 'تعليق نشاط الوكيل مؤقتاً' : 'Enact Temporary Dealer Suspension'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Incident Dossier & Enforcement Engine Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg w-full mb-space-lg">
              {/* LEFT COLUMN (60%): Dossier, Timeline & Evidence Vault */}
              <div className="lg:col-span-7 flex flex-col gap-space-lg">
                {/* Transaction Card with Vehicle Details */}
                <div className="rounded-xl bg-surface-container p-space-lg shadow-md relative overflow-hidden border border-surface-container-high/40">
                  <div className="flex flex-col sm:flex-row gap-space-md justify-between items-start sm:items-center pb-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary border border-surface-container-highest/40">
                        <span className="material-symbols-outlined text-[22px]">directions_car</span>
                      </div>
                      <div>
                        <span className="font-label-caps text-label-caps text-outline uppercase">
                          {isRtl ? 'الأصل الموثق محل النزاع' : 'Verified Transaction Asset'}
                        </span>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface">
                          {dispute.vehicleTitle}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-space-xs px-2.5 py-1 rounded bg-surface-container-highest border border-outline-variant/30">
                      <span className="font-label-caps text-label-caps text-outline">
                        {isRtl ? 'رقم الهيكل:' : 'VIN:'}
                      </span>
                      <span className="font-data-mono-num text-body-sm text-primary select-all">
                        {dispute.vehicleVin}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyVin}
                        className="text-outline hover:text-on-surface ml-1 transition-colors"
                        title={copiedVin ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ رقم الهيكل' : 'Copy VIN')}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {copiedVin ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 4-Grid Micro Telemetry */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm pt-space-xs">
                    <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-0.5 border border-surface-container-high/40">
                      <span className="font-label-caps text-label-caps text-outline uppercase">
                        {isRtl ? 'المشتري الشاكي' : 'Disputed Buyer'}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                        {dispute.buyerName}
                      </span>
                      <span className="font-data-mono-num text-body-sm text-tertiary">
                        {dispute.buyerUaePass}
                      </span>
                    </div>

                    <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-0.5 border border-surface-container-high/40">
                      <span className="font-label-caps text-label-caps text-outline uppercase">
                        {isRtl ? 'التاجر المشكو في حقه' : 'Respondent Seller'}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                        {dispute.dealerName}
                      </span>
                      <span className="font-data-mono-num text-body-sm text-outline">
                        {dispute.dealerDed}
                      </span>
                    </div>

                    <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-0.5 border border-surface-container-high/40">
                      <span className="font-label-caps text-label-caps text-outline uppercase">
                        {isRtl ? 'الضمان المجمد' : 'Locked Escrow'}
                      </span>
                      <span className="font-data-mono-num text-body-sm text-primary font-bold">
                        AED 1,650,000
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">
                        {isRtl ? 'خزينة بنك أبوظبي الأول' : 'FAB Sovereign Vault'}
                      </span>
                    </div>

                    <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-0.5 border border-surface-container-high/40">
                      <span className="font-label-caps text-label-caps text-outline uppercase">
                        {isRtl ? 'مركز الفحص المعتمد' : 'Inspection Hub'}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface font-medium">
                        {dispute.inspectionHub}
                      </span>
                      <span className="font-data-mono-num text-body-sm text-secondary">
                        {dispute.inspectionBay}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dispute Grounds & Sovereign Timeline */}
                <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md border border-surface-container-high/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[20px]">timeline</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        {isRtl ? 'التسلسل الزمني للواقعة والشهادات المودعة' : 'Escalation Chronology & Deposition'}
                      </h3>
                    </div>
                    <span className="font-data-mono-num text-body-sm text-outline">
                      {isRtl ? `مرجع السلسلة: ${dispute.chainRef}` : `Chain Ref: ${dispute.chainRef}`}
                    </span>
                  </div>

                  {/* Vertical Timeline Stepper */}
                  <div className={`relative ${isRtl ? 'pr-6 before:right-2' : 'pl-6 before:left-2'} flex flex-col gap-space-md before:content-[''] before:absolute before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-highest`}>
                    {/* Stage 01 */}
                    <div className="relative flex flex-col gap-1">
                      <div className={`absolute ${isRtl ? '-right-6' : '-left-6'} top-1 w-4 h-4 rounded-full bg-tertiary border-2 border-surface flex items-center justify-center`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-surface"></span>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <span className="font-data-mono-num text-body-sm text-tertiary font-semibold">
                          14 FEB 2025 • 11:40 GST
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-label-caps text-label-caps text-on-surface-variant uppercase">
                          {isRtl ? 'المرحلة الابتدائية' : 'Initial Milestone'}
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface">
                        {isRtl
                          ? 'إيداع عربون بمبلغ 330,000 درهم (20%) وتجميده في حساب الضمان السيادي لدى بنك أبوظبي الأول لحين التحقق من الفحص الفعلي والتسليم.'
                          : 'Deposit of AED 330,000 (20%) successfully locked into First Abu Dhabi Bank Sovereign Escrow Vault pending physical handover verification.'}
                      </p>
                    </div>

                    {/* Stage 02 */}
                    <div className="relative flex flex-col gap-1">
                      <div className={`absolute ${isRtl ? '-right-6' : '-left-6'} top-1 w-4 h-4 rounded-full bg-secondary border-2 border-surface flex items-center justify-center`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-surface"></span>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <span className="font-data-mono-num text-body-sm text-secondary font-semibold">
                          16 FEB 2025 • 09:15 GST
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-label-caps text-label-caps text-on-surface-variant uppercase">
                          {isRtl ? 'الفحص الميكانيكي الفعلي' : 'Physical Inspection'}
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface">
                        {isRtl
                          ? 'تسليم المركبة تحت ختم التتبع السيادي إلى تسجيل شامل الورسان لإجراء الفحص الهيكلي بالليزر واختبار التردد الصوتي للشاسيه.'
                          : 'Vehicle delivered under sovereign GPS transit seal to Tasjeel Shamil Al Warsan for pre-handover physical hoist audit and acoustic tub resonance testing.'}
                      </p>
                    </div>

                    {/* Stage 03 */}
                    <div className="relative flex flex-col gap-1">
                      <div className={`absolute ${isRtl ? '-right-6' : '-left-6'} top-1 w-4 h-4 rounded-full bg-error border-2 border-surface flex items-center justify-center`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-surface"></span>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <span className="font-data-mono-num text-body-sm text-error font-semibold">
                          18 FEB 2025 • 16:30 GST
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-caps text-label-caps uppercase font-semibold">
                          {isRtl ? 'رصد عيب جوهري مخفي' : 'Defect Detected'}
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface">
                        {isRtl
                          ? 'كبير مهندسي تسجيل يرصد إصلاحاً هيكلياً غير مصرح به في حوض الكربون فايبر السفلي. مقياس الموجات فوق الصوتية يظهر سماكة راتنج 480 ميكرون مقارنة بالمواصفة القياسية 110 ميكرون ±15 مع وجود رقعة لحام حراري سفلية.'
                          : 'Tasjeel Chief Structural Inspector flags non-disclosed underbody carbon composite tub repair. Ultrasonic paint depth gauge shows 480 µm (OEM specification is 110 µm ±15). Secondary resin patch noted at right undertray shear plate.'}
                      </p>
                    </div>

                    {/* Stage 04 */}
                    <div className="relative flex flex-col gap-1">
                      <div className={`absolute ${isRtl ? '-right-6' : '-left-6'} top-1 w-4 h-4 rounded-full bg-primary border-2 border-surface flex items-center justify-center`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-surface"></span>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <span className="font-data-mono-num text-body-sm text-primary font-semibold">
                          19 FEB 2025 • 08:22 GST
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase font-semibold">
                          {isRtl ? 'تفعيل المادة 12' : 'Article 12 Invoked'}
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface">
                        {isRtl
                          ? 'المشتري يفعل رسمياً المادة 12 من ميثاق حماية المشتري السيادية لتعمد إخفاء عيب جوهري بالهيكل، ويطالب بالاسترداد الفوري لكامل العربون وإحالة المخالفة لاقتصادية دبي.'
                          : 'Buyer officially invokes Zero-Leak Sovereign Protection Article 12, citing intentional concealment of critical chassis defect. Demands immediate 100% deposit return and DED commercial trade license citation.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Digital Forensic Vault Tabs */}
                <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md border border-surface-container-high/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-secondary text-[20px]">folder_special</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        {isRtl ? 'خزينة الأدلة الجنائية الرقمية' : 'Digital Forensic Vault'}
                      </h3>
                    </div>
                    <span className="font-label-caps text-label-caps text-outline uppercase">
                      {isRtl ? 'ختم حماية الأدلة ضد التلاعب: RSA-4096' : 'Evidence Tamper-Proof Seal: RSA-4096'}
                    </span>
                  </div>

                  {/* Evidence Tab Buttons */}
                  <div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setActiveTab('tasjeel')}
                      className={`flex-1 py-2 px-3 rounded-md font-body-sm text-body-sm transition-all flex items-center justify-center gap-space-xs ${
                        activeTab === 'tasjeel'
                          ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">troubleshoot</span>
                      <span>{isRtl ? 'تقرير فحص تسجيل (PDF)' : 'Tasjeel Scan (PDF)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className={`flex-1 py-2 px-3 rounded-md font-body-sm text-body-sm transition-all flex items-center justify-center gap-space-xs ${
                        activeTab === 'chat'
                          ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span>{isRtl ? 'سجل المحادثات الموثقة' : 'Concierge Chat Log'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('listing')}
                      className={`flex-1 py-2 px-3 rounded-md font-body-sm text-body-sm transition-all flex items-center justify-center gap-space-xs ${
                        activeTab === 'listing'
                          ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">fact_check</span>
                      <span>{isRtl ? 'إقرار الإعلان الأصلي' : 'Original Listing Proof'}</span>
                    </button>
                  </div>

                  {/* Tab 1: Tasjeel Hoist Scan Preview */}
                  {activeTab === 'tasjeel' && (
                    <div className="flex flex-col gap-space-md">
                      <div className="relative w-full h-72 rounded-lg bg-surface-container-lowest overflow-hidden flex items-center justify-center border border-surface-container-high/60">
                        {/* Technical mechanical chassis image */}
                        <img
                          className="w-full h-full object-cover opacity-80"
                          alt="Ferrari 296 GTB carbon chassis diagram"
                          src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/40 to-transparent"></div>

                        {/* Overlaid Forensic Point */}
                        <div className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} bg-surface-container-lowest/90 backdrop-blur px-3 py-1.5 rounded flex items-center gap-space-xs border border-error-container/40`}>
                          <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                          <span className="font-data-mono-num text-body-sm text-on-surface font-semibold">
                            {isRtl ? 'نقطة #F-42: رصد شرخ معاد ملؤه براتنج' : 'Point #F-42: Resin Fissure Repaired'}
                          </span>
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-surface-container-low/95 backdrop-blur p-space-sm rounded-lg border border-surface-container-high/60">
                          <div className="flex items-center gap-space-sm min-w-0">
                            <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">
                              picture_as_pdf
                            </span>
                            <div className="truncate min-w-0">
                              <div className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                                Tasjeel_Shamil_Inspection_Audit_Cert_99182.pdf
                              </div>
                              <div className="font-data-mono-num text-[11px] text-outline truncate">
                                {isRtl ? 'معتمد من كبير المفتشين طارق بن هويدن (#TS-404)' : 'Verified by Lead Inspector Tariq Bin Huwaiden (ID: #TS-404)'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => alert(isRtl ? 'جاري تحميل الشهادة المشفرة...' : 'Downloading cryptographically sealed Tasjeel Certificate...')}
                            className="px-3 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-caps text-label-caps uppercase flex items-center gap-1 transition-colors flex-shrink-0"
                          >
                            <span className="material-symbols-outlined text-[14px]">download</span>
                            <span>{isRtl ? 'تحميل النسخة المختومة' : 'Download Sealed Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm border border-surface-container-high/40">
                        <span className="material-symbols-outlined text-error text-[20px] flex-shrink-0 mt-0.5">
                          warning
                        </span>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          <strong className="text-on-surface">
                            {isRtl ? 'الملخص الجنائي الفني: ' : 'Forensic Summary: '}
                          </strong>
                          {isRtl
                            ? 'يظهر حوض الكربون فايبر الأحادي تصدعاً جانبياً بطول 140 مم تم حشوه براتنج معالج حرارياً نتيجة صدمة رصيف عنيفة سابقة. لا توجد شهادة إعادة اعتماد من مصنع مارانيللو. بينما تم الإعلان عن السيارة بأنها "حالة صالة عرض / دهان وكالة 100% بدون أي إصلاحات".'
                            : 'The carbon monocoque exhibits a 140mm lateral resin infill consistent with high-curb impact repair. No factory recertification plaque from Maranello is present. Listing status marked "Mint Collector Condition / Original Unpainted".'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: WhatsApp Concierge Official Chat Log */}
                  {activeTab === 'chat' && (
                    <div className="flex flex-col gap-space-sm">
                      <div className="h-72 rounded-lg bg-surface-container-lowest p-space-md overflow-y-auto flex flex-col gap-space-sm border border-surface-container-high/40">
                        <div className="text-center">
                          <span className="px-3 py-1 rounded-full bg-surface-container-high font-label-caps text-label-caps text-outline uppercase">
                            {isRtl
                              ? 'أرشيف غير قابل للتعديل • قانون المعاملات الإلكترونية الإماراتي 2021'
                              : 'Tamper-Evident Archive • UAE Electronic Transactions Law 2021'}
                          </span>
                        </div>

                        {/* Message from Dealer */}
                        <div className="flex flex-col items-start max-w-[85%] self-start">
                          <div className="px-3 py-2 rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-surface-container-highest/40">
                            {isRtl
                              ? '"عزيزي المشتري، نضمن لك دهان وكالة أصلي 100% ولا توجد أي ملاحظات ميكانيكية أو بالهيكل نهائياً. السيارة لم تدخل حلبة سباق أو تتعرض لأي صدمات."'
                              : '"Dear buyer, we guarantee 100% factory original paint and zero mechanical or chassis remarks. The car has never seen a circuit or experienced curb rash."'}
                          </div>
                          <span className="font-data-mono-num text-[10px] text-outline mt-0.5">
                            14 Feb 10:14 GST • Dealer Principal (T. Mansour)
                          </span>
                        </div>

                        {/* Message from Buyer Rep */}
                        <div className="flex flex-col items-end max-w-[85%] self-end">
                          <div className="px-3 py-2 rounded-lg bg-primary-container text-on-primary-container font-body-sm text-body-sm font-medium">
                            {isRtl
                              ? '"تم الاستلام. نقوم بحجز فحص الليزر لدى تسجيل شامل غداً وفق إطار حساب الضمان السيادي للمنصة."'
                              : '"Understood. We are booking the pre-handover laser hoist audit at Tasjeel Shamil tomorrow under the Platform Sovereign Escrow framework."'}
                          </div>
                          <span className="font-data-mono-num text-[10px] text-outline mt-0.5">
                            14 Feb 10:18 GST • Institutional Buyer Agent
                          </span>
                        </div>

                        {/* Follow up after inspection */}
                        <div className="flex flex-col items-end max-w-[85%] self-end">
                          <div className="px-3 py-2 rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
                            {isRtl
                              ? '"أكدت تسجيل وجود إصلاح غير معلن بحوض الكربون بسماكة 480 ميكرون. لقد ضمنتم سلامة الحوض الأصلية. نقوم بفتح نزاع لتجميد صرف الضمان فوراً."'
                              : '"Tasjeel confirmed an undeclared carbon tub repair with 480 micron resin depth. You explicitly guaranteed factory tub integrity. We are opening an escrow freeze dispute immediately."'}
                          </div>
                          <span className="font-data-mono-num text-[10px] text-outline mt-0.5">
                            18 Feb 17:02 GST • Institutional Buyer Agent
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Dealer's Original Listing Claim */}
                  {activeTab === 'listing' && (
                    <div className="flex flex-col gap-space-sm">
                      <div className="rounded-lg bg-surface-container-lowest p-space-md flex flex-col gap-space-sm border border-surface-container-high/40">
                        <div className="flex items-center justify-between pb-space-xs">
                          <span className="font-label-caps text-label-caps text-primary uppercase">
                            {isRtl ? 'معرف اللقطة الأرشيفية: #LST-296GTB-0081' : 'Snapshot ID: #LST-296GTB-0081'}
                          </span>
                          <span className="font-data-mono-num text-body-sm text-outline">
                            Published: 02 Feb 2025
                          </span>
                        </div>
                        <div className="p-space-sm rounded bg-surface-container-high text-on-surface font-body-sm text-body-sm leading-relaxed border border-surface-container-highest/40">
                          {isRtl
                            ? '"فيراري 296 جي تي بي أسيتو فيورانو 2023. لون خارجي بيانكو ساناي. بدون أي صبغ أو دهان، حوض كربون فايبر أصلي 100% بحالة الوكالة. صيانة كاملة لدى وكالة الطاير فيراري الإمارات. مواصفات خليجية مع ضمان الوكالة الشامل حتى 2028."'
                            : '"2023 Ferrari 296 GTB Assetto Fiorano. Finished in Bianco Sanae. Zero paintwork, 100% factory original carbon weave tub, pristine collector spec. Full Al Tayer Motors Ferrari UAE service history. GCC Specification with transferable factory power warranty until 2028."'}
                        </div>
                        <div className="grid grid-cols-2 gap-space-sm pt-space-xs font-body-sm text-body-sm">
                          <div className="flex items-center gap-1.5 text-error">
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                            <span>{isRtl ? 'إقرار غير صحيح: حوض كربون مصنعي 100%' : 'Claimed: 100% Factory Carbon Tub'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-error">
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                            <span>{isRtl ? 'إقرار غير صحيح: بدون أي دهان أو معالجة' : 'Claimed: Zero Paintwork / OEM Specs'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN (40%): Sanctions Decision Engine & Enforcement Matrix */}
              <div className="lg:col-span-5 flex flex-col gap-space-lg">
                {/* Violation Severity Assessment Card */}
                <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md border border-surface-container-high/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[22px]">policy</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        {isRtl ? 'محرك مصفوفة العقوبات' : 'Sanctions Matrix Engine'}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-caps text-label-caps font-semibold uppercase">
                      {isRtl ? 'مخالفة تنظيمية من المستوى الثاني' : 'Level 2 Regulatory Sanction'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-space-sm">
                    <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-0.5 border border-surface-container-high/40">
                      <span className="font-label-caps text-label-caps text-outline uppercase">
                        {isRtl ? 'المخالفة التشريعية' : 'Statutory Infraction'}
                      </span>
                      <span className="font-body-md text-body-md text-on-surface font-semibold">
                        {isRtl
                          ? 'المادة 4.2 - التضليل الجوهري لسلامة الهيكل في إعلان معتمد من المستوى الأول'
                          : 'Article 4.2 - Material Misrepresentation of Structural Integrity in Tier-1 Certified Listing'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-space-sm">
                      <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-0.5 border border-surface-container-high/40">
                        <span className="font-label-caps text-label-caps text-outline uppercase">
                          {isRtl ? 'المخالفات السابقة' : 'Prior Infractions'}
                        </span>
                        <span className="font-data-mono-num text-body-sm text-on-surface font-medium">
                          {dispute.dealerPriorInfractions}
                        </span>
                        <span className="font-body-sm text-body-sm text-outline">
                          {isRtl ? 'تأخر نقل ملكية هيئة الطرق' : 'Delayed RTA title transfer'}
                        </span>
                      </div>

                      <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-0.5 border border-surface-container-high/40">
                        <span className="font-label-caps text-label-caps text-outline uppercase">
                          {isRtl ? 'مؤشر الثقة بالمنصة' : 'Platform Trust Score'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-data-mono-num text-headline-sm text-error font-bold">
                            {dispute.dealerTrustScore}%
                          </span>
                          <span className="text-error font-body-sm text-body-sm">(-48 pts)</span>
                        </div>
                        <span className="font-body-sm text-body-sm text-outline">
                          {isRtl ? 'حد الاعتماد الأدنى 85%' : 'Tier-1 threshold is 85%'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Adjudication Action Controls */}
                  <div className="flex flex-col gap-space-md pt-space-xs">
                    <div>
                      <span className="font-label-caps text-label-caps text-primary uppercase font-semibold">
                        {isRtl ? '1. أمر تسوية حساب الضمان' : '1. Escrow Disposition Order'}
                      </span>
                      <div className="flex flex-col gap-space-xs mt-2">
                        <label className={`flex items-start gap-space-sm p-space-sm rounded-lg transition-colors cursor-pointer border ${
                          escrowDisposition === 'FULL_RETURN'
                            ? 'bg-surface-container-high border-primary/40'
                            : 'bg-surface-container-low border-surface-container-high/40 hover:bg-surface-container-high'
                        }`}>
                          <input
                            type="radio"
                            name="escrow_disposition"
                            checked={escrowDisposition === 'FULL_RETURN'}
                            onChange={() => setEscrowDisposition('FULL_RETURN')}
                            className="mt-1 accent-primary w-4 h-4"
                          />
                          <div className="flex flex-col">
                            <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                              {isRtl ? 'إرجاع كامل بنسبة 100% للمشتري' : '100% Full Return to Buyer'}
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              {isRtl ? 'تحرير 1,650,000 درهم خلال 60 ثانية وإلغاء رسوم إلغاء التاجر.' : 'Release AED 1,650,000 within 60s. Nullify dealer cancellation fee.'}
                            </span>
                          </div>
                        </label>

                        <label className={`flex items-start gap-space-sm p-space-sm rounded-lg transition-colors cursor-pointer border ${
                          escrowDisposition === 'PARTIAL_FEE_DEDUCTED'
                            ? 'bg-surface-container-high border-primary/40'
                            : 'bg-surface-container-low border-surface-container-high/40 hover:bg-surface-container-high'
                        }`}>
                          <input
                            type="radio"
                            name="escrow_disposition"
                            checked={escrowDisposition === 'PARTIAL_FEE_DEDUCTED'}
                            onChange={() => setEscrowDisposition('PARTIAL_FEE_DEDUCTED')}
                            className="mt-1 accent-primary w-4 h-4"
                          />
                          <div className="flex flex-col">
                            <span className="font-body-sm text-body-sm text-on-surface font-medium">
                              {isRtl ? 'تسوية جزئية / خصم رسوم فحص الليزر' : 'Partial Disbursement / Retain Inspection Fee'}
                            </span>
                            <span className="font-body-sm text-body-sm text-outline">
                              {isRtl ? 'المشتري يستلم 1,642,500 درهم مع خصم رسوم تسجيل (7,500 درهم).' : 'Buyer receives AED 1,642,500; deducts Tasjeel scan fee (AED 7,500).'}
                            </span>
                          </div>
                        </label>

                        <label className={`flex items-start gap-space-sm p-space-sm rounded-lg transition-colors cursor-pointer border ${
                          escrowDisposition === 'HOLD_TRIBUNAL'
                            ? 'bg-surface-container-high border-primary/40'
                            : 'bg-surface-container-low border-surface-container-high/40 hover:bg-surface-container-high'
                        }`}>
                          <input
                            type="radio"
                            name="escrow_disposition"
                            checked={escrowDisposition === 'HOLD_TRIBUNAL'}
                            onChange={() => setEscrowDisposition('HOLD_TRIBUNAL')}
                            className="mt-1 accent-primary w-4 h-4"
                          />
                          <div className="flex flex-col">
                            <span className="font-body-sm text-body-sm text-on-surface font-medium">
                              {isRtl ? 'إبقاء التجميد بالخزينة لحين جلسة محاكم مركز دبي المالي' : 'Hold in Vault Pending DIFC Tribunal'}
                            </span>
                            <span className="font-body-sm text-body-sm text-outline">
                              {isRtl ? 'استمرار التجميد السيادي لمدة 14 يوماً تقويمياً خلال المداولة.' : 'Maintain sovereign freeze for 14 calendar days during formal hearing.'}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <span className="font-label-caps text-label-caps text-error uppercase font-semibold">
                        {isRtl ? '2. العقوبات التنظيمية على التاجر' : '2. Dealer Regulatory Sanctions'}
                      </span>
                      <div className="flex flex-col gap-space-xs mt-2">
                        <label className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low cursor-pointer border border-surface-container-high/40">
                          <input
                            type="checkbox"
                            checked={sanction1}
                            onChange={(e) => setSanction1(e.target.checked)}
                            className="mt-0.5 accent-error w-4 h-4 rounded"
                          />
                          <span className="font-body-sm text-body-sm text-on-surface">
                            {isRtl ? 'تعليق فوري لمدة 30 يوماً لقوائم الإعلانات وقفل الكتالوج' : 'Immediate 30-Day Platform Listing Suspension & Catalog Lock'}
                          </span>
                        </label>

                        <label className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low cursor-pointer border border-surface-container-high/40">
                          <input
                            type="checkbox"
                            checked={sanction2}
                            onChange={(e) => setSanction2(e.target.checked)}
                            className="mt-0.5 accent-error w-4 h-4 rounded"
                          />
                          <span className="font-body-sm text-body-sm text-on-surface">
                            {isRtl ? 'تخفيض درجة الاعتماد: من معتمد فئة 1 إلى فئة 3 تحت المراقبة' : 'Demote Accreditation: Tier-1 Accredited → Tier-3 Probationary'}
                          </span>
                        </label>

                        <label className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low cursor-pointer border border-surface-container-high/40">
                          <input
                            type="checkbox"
                            checked={sanction3}
                            onChange={(e) => setSanction3(e.target.checked)}
                            className="mt-0.5 accent-error w-4 h-4 rounded"
                          />
                          <span className="font-body-sm text-body-sm text-on-surface">
                            {isRtl ? 'إلزامية إعادة الفحص الفعلي لجميع الـ 18 مركبة المتبقية في المخزون' : 'Mandatory Physical Re-audit of all 18 remaining inventory units'}
                          </span>
                        </label>

                        <label className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low cursor-pointer border border-surface-container-high/40">
                          <input
                            type="checkbox"
                            checked={sanction4}
                            onChange={(e) => setSanction4(e.target.checked)}
                            className="mt-0.5 accent-error w-4 h-4 rounded"
                          />
                          <span className="font-body-sm text-body-sm text-on-surface">
                            {isRtl ? 'إرسال تقرير المخالفة إلى دائرة الاقتصاد والسياحة بدبي (DET / DED)' : 'Transmit Violation Report to Dubai Economy & Tourism (DET / DED)'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Two-Person Authorization Cryptographic Handshake */}
                <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md border border-surface-container-high/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[20px]">encrypted</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        {isRtl ? 'مصادقة التوقيع المزدوج (HSM)' : 'Dual Key Hardware Handshake'}
                      </h3>
                    </div>
                    <span className="font-label-caps text-label-caps text-tertiary uppercase">
                      {isRtl ? 'مطلوب توقيعان من أصل توقيعين' : '2-of-2 Clearance Required'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-space-sm">
                    {/* Signer 1: Authorized */}
                    <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between border border-surface-container-high/40">
                      <div className="flex items-center gap-space-sm min-w-0">
                        <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container flex-shrink-0">
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                            Dr. Maya Al-Falasi
                          </span>
                          <span className="font-label-caps text-label-caps text-outline uppercase">
                            {isRtl ? 'مدير الامتثال والحوكمة' : 'Platform Compliance Director'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="font-label-caps text-label-caps text-tertiary font-bold uppercase">
                          {isRtl ? 'معتمد' : 'Authorized'}
                        </span>
                        <span className="font-data-mono-num text-[11px] text-outline">
                          14:22 GST • Biometric Token
                        </span>
                      </div>
                    </div>

                    {/* Signer 2: Secondary Handshake */}
                    <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-xs border border-surface-container-high/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-space-sm min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            signer2Authorized
                              ? 'bg-tertiary-container text-on-tertiary-container'
                              : 'bg-surface-container-high text-secondary'
                          }`}>
                            <span className="material-symbols-outlined text-[18px]">
                              {signer2Authorized ? 'verified' : 'key'}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                              Counselor Rashid Al-Nuaimi
                            </span>
                            <span className="font-label-caps text-label-caps text-outline uppercase">
                              {isRtl ? 'المستشار القانوني للمنصة' : 'Platform Legal Director'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                          <span className={`font-label-caps text-label-caps font-bold uppercase ${
                            signer2Authorized ? 'text-tertiary' : 'text-primary animate-pulse'
                          }`}>
                            {signer2Authorized
                              ? (isRtl ? 'معتمد' : 'Authorized')
                              : (isRtl ? 'في انتظار الرمز' : 'Pending PIN')}
                          </span>
                          <span className="font-data-mono-num text-[11px] text-outline">
                            {signer2Authorized ? 'HSM Signed' : 'HSM Challenge Sent'}
                          </span>
                        </div>
                      </div>

                      {/* Interactive PIN authorization for Signer 2 */}
                      {!signer2Authorized && (
                        <div className="flex items-center gap-2 pt-1 border-t border-surface-container-high/40">
                          <input
                            type="password"
                            maxLength={6}
                            value={secondSignerPin}
                            onChange={(e) => setSecondSignerPin(e.target.value)}
                            placeholder={isRtl ? 'أدخل رمز أمان HSM (4-6 أرقام)...' : 'Enter 4-6 digit HSM token...'}
                            className="flex-1 h-8 px-2.5 rounded bg-surface-container-high text-on-surface placeholder:text-outline font-data-mono-num text-body-sm focus:outline-none focus:ring-1 focus:ring-primary-container"
                          />
                          <button
                            type="button"
                            onClick={handleAuthorizeSecondarySigner}
                            className="h-8 px-3 rounded bg-surface-container-highest hover:bg-surface-bright text-primary font-label-caps text-label-caps uppercase transition-colors"
                          >
                            {isRtl ? 'توثيق' : 'Authorize'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning Callout */}
                  <div className="p-space-sm rounded-lg bg-error-container/20 flex items-start gap-space-xs border border-error-container/30">
                    <span className="material-symbols-outlined text-error text-[18px] flex-shrink-0 mt-0.5">
                      shield
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      {isRtl
                        ? 'تنفيذ هذا الإجراء يلغي على الفور صلاحيات الربط البرمجي لوكالة جلف بريستيج سوبركارز، ويلغي نشر كافة الإعلانات عبر بوابات دولة الإمارات، ويسجل قيد عقوبة غير قابل للمحو في سجل الثقة السيادي.'
                        : "Executing this enforcement action instantly revokes Gulf Prestige Supercars' API credentials, unpublishes all live listings across UAE portals, and writes an immutable sanction entry to the sovereign trust ledger."}
                    </p>
                  </div>

                  {/* Primary Trigger Button */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleExecuteAdjudication}
                    className="w-full h-12 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm font-semibold flex items-center justify-center gap-space-sm shadow-lg transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isSubmitting ? 'progress_activity' : 'lock_open'}
                    </span>
                    <span>
                      {isSubmitting
                        ? (isRtl ? 'جاري توثيق الأمر...' : 'Committing Sovereign Enforcement...')
                        : (isRtl ? 'تنفيذ أمر التحكيم والعقوبات' : 'Execute Adjudication & Sanctions Order')}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Historical Precedents & Audit Log Drawer */}
            <div className="rounded-xl bg-surface-container p-space-lg shadow-xl w-full flex flex-col gap-space-md border border-surface-container-high/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary border border-surface-container-highest/40">
                    <span className="material-symbols-outlined text-[20px]">history_edu</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      {isRtl ? 'سجل التدقيق التاريخي وسوابق العقوبات' : 'Historical Audit Log & Sanctions Precedents'}
                    </h3>
                    <p className="font-body-sm text-body-sm text-outline">
                      {isRtl
                        ? 'نزاعات سابقة تمت تسويتها بنسبة امتثال 100% بموجب قانون حماية المستهلك الإماراتي'
                        : 'Past adjudicated disputes with 100% compliance under UAE Consumer Protection Law'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-space-xs">
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-high font-data-mono-num text-body-sm text-tertiary border border-surface-container-highest/40">
                    {isRtl ? '32 سابقة تمت تسويتها • 0 نقض قضائي' : '32 Precedents Resolved • 0 Court Overturns'}
                  </span>
                </div>
              </div>

              {/* Precedents Telemetry Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse" dir={isRtl ? 'rtl' : 'ltr'}>
                  <thead>
                    <tr className="bg-surface-container-low font-label-caps text-label-caps text-outline uppercase tracking-wider border-b border-surface-container-high">
                      <th className={`py-2.5 px-4 font-semibold ${isRtl ? 'text-right' : 'text-left'}`}>
                        {isRtl ? 'مرجع القضية' : 'Case Reference'}
                      </th>
                      <th className={`py-2.5 px-4 font-semibold ${isRtl ? 'text-right' : 'text-left'}`}>
                        {isRtl ? 'الكيان المشكو في حقه' : 'Respondent Entity'}
                      </th>
                      <th className={`py-2.5 px-4 font-semibold ${isRtl ? 'text-right' : 'text-left'}`}>
                        {isRtl ? 'نوع المخالفة' : 'Infraction Type'}
                      </th>
                      <th className={`py-2.5 px-4 font-semibold ${isRtl ? 'text-right' : 'text-left'}`}>
                        {isRtl ? 'قيمة الضمان' : 'Escrow Value'}
                      </th>
                      <th className={`py-2.5 px-4 font-semibold ${isRtl ? 'text-right' : 'text-left'}`}>
                        {isRtl ? 'قرار التحكيم النهائي' : 'Adjudication Outcome'}
                      </th>
                      <th className={`py-2.5 px-4 font-semibold ${isRtl ? 'text-left' : 'text-right'}`}>
                        {isRtl ? 'تاريخ التسوية' : 'Settled Date'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm divide-y divide-surface-container-high">
                    {dispute.precedents.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container-high/50 transition-colors">
                        <td className="py-3 px-4 font-data-mono-num text-primary font-medium">
                          {item.caseRef}
                        </td>
                        <td className="py-3 px-4 font-medium text-on-surface">
                          {item.respondentEntity}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant">
                          {item.infractionType}
                        </td>
                        <td className="py-3 px-4 font-data-mono-num text-on-surface">
                          {item.escrowValueAed}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-caps text-label-caps uppercase font-semibold ${
                            item.outcomeBadgeType === 'tertiary'
                              ? 'bg-tertiary-container/30 text-tertiary'
                              : 'bg-secondary/20 text-secondary'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              item.outcomeBadgeType === 'tertiary' ? 'bg-tertiary' : 'bg-secondary'
                            }`}></span>
                            {item.outcome}
                          </span>
                        </td>
                        <td className={`py-3 px-4 font-data-mono-num text-outline ${isRtl ? 'text-left' : 'text-right'}`}>
                          {item.settledDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* DIFC Summon Modal */}
      {difcModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-surface-container p-space-lg shadow-2xl border border-surface-container-high flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[24px]">balance</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {isRtl ? 'استدعاء رسمي لوساطة محاكم مركز دبي المالي' : 'DIFC Courts Mediation Summon'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDifcModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              {isRtl
                ? 'سيتم إرسال إشعار استدعاء رسمي إلى الممثل القانوني لشركة جلف بريستيج سوبركارز والمشتري عبر بوابة محاكم مركز دبي المالي لحضور جلسة تسوية إلزامية خلال 72 ساعة.'
                : 'A formal subpoena notice will be dispatched to Gulf Prestige Supercars legal counsel and buyer representatives via the DIFC Courts Mediation e-portal for a mandatory hearing within 72 hours.'}
            </p>

            <div className="p-space-sm rounded-lg bg-surface-container-low font-data-mono-num text-body-sm text-outline border border-surface-container-high/40">
              DIFC Docket ID: DIFC-ARB-2025-0812 • Judge Assigned: Justice Al-Maktoum Chambers
            </div>

            <div className="flex justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setDifcModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDifcModalOpen(false);
                  setFeedbackMessage(
                    isRtl
                      ? 'تم تسجيل الاستدعاء القضائي بنجاح في بوابة مركز دبي المالي وأُرسلت الرسائل الرسمية للطرفين.'
                      : 'DIFC Mediation summon dispatched to both parties via DIFC Sovereign Registry.'
                  );
                }}
                className="px-4 py-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container font-body-sm text-body-sm font-semibold"
              >
                {isRtl ? 'تأكيد وإرسال الاستدعاء' : 'Dispatch Formal Summon'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Dealer Suspension Modal */}
      {suspensionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-surface-container p-space-lg shadow-2xl border border-error-container/40 flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs text-error">
                <span className="material-symbols-outlined text-[24px]">gavel</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {isRtl ? 'تأكيد التعليق الفوري للوكيل' : 'Enact Dealer Emergency Suspension'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSuspensionModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              {isRtl
                ? 'تحذير: سيؤدي هذا الإجراء فوراً إلى إلغاء نشر 18 إعلاناً نشطاً لشركة جلف بريستيج سوبركارز، وتعطيل مفاتيح الربط البرمجي API، وإشعار دائرة التنمية الاقتصادية بدبي.'
                : 'Warning: This will immediately unpublish all 18 active listings for Gulf Prestige Supercars, revoke their API gateway keys, and notify the Department of Economy and Tourism (DED).'}
            </p>

            <div className="p-space-sm rounded-lg bg-error-container/20 border border-error-container text-error font-body-sm text-body-sm">
              {isRtl
                ? 'هذا الإجراء مسجل في سجل التدقيق غير القابل للتعديل برمز الموظف Tier-0.'
                : 'This action is irreversibly recorded to the Immutable Audit Ledger with Tier-0 authorization.'}
            </div>

            <div className="flex justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setSuspensionModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuspensionModalOpen(false);
                  setFeedbackMessage(
                    isRtl
                      ? 'تم تعليق الوكيل بنجاح وحذف كافة الإعلانات من المنصة وإشعار دائرة التنمية الاقتصادية.'
                      : 'Dealership suspended. 18 listings unpublished from marketplace and DED violation ticket dispatched.'
                  );
                }}
                className="px-4 py-2 rounded-lg bg-error text-on-error hover:bg-error-container font-body-sm text-body-sm font-semibold"
              >
                {isRtl ? 'تأكيد التعليق الفوري' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escrow Caution Modal (Compliance Rule) */}
      {escrowCautionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-surface-container p-space-lg shadow-2xl border border-surface-container-high flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs text-primary">
                <span className="material-symbols-outlined text-[24px]">account_balance</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {isRtl ? 'تنبيه امتثال حساب الضمان المصرفي' : 'Licensed Banking Custody Notice'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEscrowCautionModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              {isRtl
                ? 'تنبيه تنظيمي (جدول تكامل الأنظمة الحقيقي): تخضع أموال الضمان لحفظ بنك أبوظبي الأول (FAB). يتطلب الصرف الفعلي مصادقة مصرفية ثنائية وتفويض المحكم المعتمد، ولا يجوز الصرف الآلي بدون الموافقة التنظيمية.'
                : 'Regulatory Notice (INTEGRATION_TRUTH_TABLE.md): Escrow funds are held in custody with First Abu Dhabi Bank (FAB-SVR-091). Actual fund release requires dual-officer banking authorization and licensed legal arbitration approval.'}
            </p>

            <div className="p-space-sm rounded-lg bg-surface-container-low font-data-mono-num text-body-sm text-outline border border-surface-container-high/40">
              Escrow Custody Vault: FAB-SVR-091 • Balance: AED 1,650,000.00 • Frozen
            </div>

            <div className="flex justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setEscrowCautionModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEscrowCautionModalOpen(false);
                  setFeedbackMessage(
                    isRtl
                      ? 'تم تسجيل طلب الإفراج التجريبي في بيئة الاختبار. يتطلب الصرف الحي تفعيل واجهة بنك أبوظبي الأول المعتمدة.'
                      : 'Simulated escrow release intent queued. In production, requires FAB live sovereign gateway activation.'
                  );
                }}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-body-sm text-body-sm font-semibold"
              >
                {isRtl ? 'متابعة في البيئة التجريبية' : 'Acknowledge & Queue Simulation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}