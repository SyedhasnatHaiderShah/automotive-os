'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AdminSidebar } from '../../../components/AdminSidebar';
import { AdminHeader } from '../../../components/AdminHeader';
import {
  MOCK_KYB_DOSSIER,
  fetchKybDossier,
  submitKybAccreditation,
  DealerKybDossierDetail,
  BeneficialOwner,
  ShowroomPhotoEvidence,
  KybQueueItem,
} from '../../../lib/api';

export default function KybVerificationDetailPage() {
  const params = useParams();
  const kybId = (params?.id as string) || 'kyb-2025-0842';

  const [isRtl, setIsRtl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dossier, setDossier] = useState<DealerKybDossierDetail>(MOCK_KYB_DOSSIER);

  // Form states
  const [selectedTier, setSelectedTier] = useState<'tier-1' | 'tier-2'>('tier-1');
  const [reasonCode, setReasonCode] = useState(
    'All DET & RTA criteria satisfied under Cabinet Resolution No. (58) of 2020 on Beneficial Ownership'
  );
  const [auditNote, setAuditNote] = useState(
    'Physical inspection report #DXB-INSP-2025 validated against municipal geofence. UBO and banking liquidity buffer cleared at AED 25,000,000. Recommend immediate Tier-1 sovereign minting.'
  );

  // Biometric Modal
  const [biometricModalOpen, setBiometricModalOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastingComplete, setBroadcastingComplete] = useState(false);

  // Rejection Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('INCOMPLETE_UBO');
  const [rejectionNotes, setRejectionNotes] = useState(
    'Ultimate Beneficial Ownership verification failed goAML check. Additional residency documents required.'
  );

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchKybDossier(kybId);
      setDossier(data);
      setLoading(false);
    }
    loadData();
  }, [kybId]);

  const handleExecuteBiometricSign = async () => {
    setIsBroadcasting(true);

    // Simulate smart contract broadcast & HSM signing
    setTimeout(async () => {
      setIsBroadcasting(false);
      setBroadcastingComplete(true);

      await submitKybAccreditation(dossier.id, {
        tier: selectedTier,
        reasonCode,
        operatorNote: auditNote,
        twoFactorConfirmed: true,
      });

      setTimeout(() => {
        setBiometricModalOpen(false);
        setBroadcastingComplete(false);
        setNotification(
          `Accreditation committed successfully. Royal Apex Motors is now minted as a Tier-1 Sovereign Dealer.`
        );
      }, 1000);
    }, 1200);
  };

  const handleConfirmReject = () => {
    setRejectModalOpen(false);
    setNotification(
      `Application rejected. Regulatory notice dispatched with reason code: [${rejectionReason}].`
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
            Accessing Sovereign KYB Vault & goAML Screening...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background font-body-md text-on-surface ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminSidebar isRtl={isRtl} />
      <div className={isRtl ? 'pr-60' : 'pl-60'}>
        <AdminHeader isRtl={isRtl} onToggleRtl={() => setIsRtl(!isRtl)} />

        <main className="w-full pt-16 bg-background px-gutter py-space-lg">
          <div className="flex flex-col w-full">
            {/* Success / Action Notification */}
            {notification && (
              <div className="mb-space-md p-space-md rounded-xl bg-tertiary-container/20 border border-tertiary text-on-surface flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-tertiary text-[24px]">verified</span>
                  <div>
                    <span className="font-body-md font-semibold text-tertiary block">
                      {isRtl ? 'تم تحديث حالة الاعتماد' : 'Sovereign Accreditation Updated'}
                    </span>
                    <span className="font-body-sm text-on-surface-variant">{notification}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNotification(null)}
                  className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-body-sm"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Top Command & Case Status Header */}
            <div className="flex flex-col gap-space-md mb-space-lg">
              {/* Breadcrumb Bar & Rapid Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-xs font-label-caps text-label-caps tracking-wider text-outline uppercase">
                  <Link href="/verifications" className="hover:text-primary transition-colors">
                    {isRtl ? 'حوكمة المنصة' : 'Platform Governance'}
                  </Link>
                  <span className="text-outline-variant">/</span>
                  <Link href="/verifications" className="hover:text-primary transition-colors">
                    {isRtl ? 'التحقق من الوكلاء والاعتماد' : 'KYB Verification & Onboarding'}
                  </Link>
                  <span className="text-outline-variant">/</span>
                  <span className="text-on-surface font-data-mono-num font-semibold text-secondary">
                    {dossier.caseNumber}
                  </span>
                </div>

                <div className="flex items-center gap-space-sm">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-data-mono-num text-body-sm shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                    <span>
                      RPC Gateway: <strong className="text-tertiary">DED-SYNC #994</strong> (38ms)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-data-mono-num text-body-sm shadow-sm">
                    <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                    <span>Cabinet Res. (58)/2020 Compliant</span>
                  </div>
                </div>
              </div>

              {/* Title & Action Command Center */}
              <div className="p-space-lg rounded-xl bg-surface-container-low shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg relative overflow-hidden border border-surface-container-high/40">
                <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none blur-3xl" />

                <div className="flex flex-col gap-space-xs z-10 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-space-sm">
                    <span className="px-2.5 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary font-body-sm font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                      {dossier.statusLabel}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-secondary-fixed font-data-mono-num text-body-sm">
                      SLA Remaining: {dossier.slaRemaining}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-caps text-label-caps uppercase">
                      {dossier.entityTypeTier}
                    </span>
                  </div>

                  <div className="flex items-center gap-space-sm mt-1">
                    <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                      {isRtl ? 'التحقق المؤسسي من الوكيل (KYB): رويال أبكس موتورز' : `Dealership KYB Verification: ${dossier.displayName}`}
                    </h1>
                    <span className="material-symbols-outlined text-primary text-[24px]">gpp_maybe</span>
                  </div>

                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Comprehensive compliance validation dossier for high-volume GCC exotic vehicle marketplace accreditation. Dual-signoff required for DIFC smart contract sovereign settlement enablement.
                  </p>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center gap-space-sm z-10">
                  <button
                    onClick={() => {
                      const msg = window.prompt(
                        'Specify additional evidence or enhanced due diligence (EDD) required from dealer:'
                      );
                      if (msg) alert(`Evidence request dispatched to dealer compliance contact: ${msg}`);
                    }}
                    className="h-10 px-4 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm font-medium transition-all shadow-sm flex items-center gap-1.5"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px] text-outline">
                      contact_support
                    </span>
                    <span>{isRtl ? 'طلب أدلة إضافية' : 'Request Evidence'}</span>
                  </button>

                  <button
                    onClick={() => setRejectModalOpen(true)}
                    className="h-10 px-4 rounded-lg bg-error-container/60 hover:bg-error-container text-on-error-container font-body-sm font-medium transition-all shadow-sm flex items-center gap-1.5"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">gavel</span>
                    <span>{isRtl ? 'رفض الطلب' : 'Reject Application'}</span>
                  </button>

                  <button
                    onClick={() => setBiometricModalOpen(true)}
                    className="h-10 px-5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary font-body-sm font-semibold tracking-wide transition-all shadow-lg flex items-center gap-2 group"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">
                      fingerprint
                    </span>
                    <span>{isRtl ? 'اعتماد وإصدار الترخيص' : 'Approve & Issue Accreditation'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Primary Workspace: Two-Column High-Signal Architecture */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-xl">
              {/* LEFT COLUMN (7.5 Cols): Evidence Inspection & Regulatory Vault */}
              <div className="xl:col-span-7 flex flex-col gap-space-lg">
                {/* Section 1: Commercial Registry & Legal Entity Validation */}
                <div className="p-space-lg rounded-xl bg-surface-container-low shadow-md flex flex-col gap-space-md border border-surface-container-high/30">
                  <div className="flex items-center justify-between pb-space-xs">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">domain_verification</span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {isRtl ? 'التحقق من السجل التجاري والكيان القانوني' : 'Commercial Registry & Legal Entity Validation'}
                        </h2>
                        <span className="font-body-sm text-body-sm text-outline">
                          Cross-referenced with DET / DED Federal Registry • Node DIFC-04
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-tertiary-container/15 text-tertiary font-label-caps text-label-caps uppercase font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Live Webhook Validated
                    </span>
                  </div>

                  {/* Entity Core Data Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm font-body-sm">
                    <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                        Registered Legal Entity
                      </span>
                      <span className="font-body-md text-body-md text-on-surface font-medium truncate mt-0.5">
                        {dossier.legalEntityName}
                      </span>
                      <span className="font-data-mono-num text-body-sm text-on-surface-variant">
                        Tax ID: {dossier.taxRegistrationNumber}
                      </span>
                    </div>

                    <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                        DET / DED Commercial License
                      </span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-data-mono-num text-body-md text-secondary font-semibold">
                          {dossier.dedCommercialLicense}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-tertiary font-label-caps text-label-caps uppercase">
                          {dossier.dedStatus}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-outline">
                        Verified via UAE FedReg sync 4m ago
                      </span>
                    </div>

                    <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                        Jurisdiction & Entity Type
                      </span>
                      <span className="font-body-md text-body-md text-on-surface font-medium mt-0.5">
                        {dossier.jurisdiction}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Dubai South Aviation & Logistics Free Zone
                      </span>
                    </div>

                    <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                        Showroom Physical Zoning
                      </span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-body-md text-body-md text-on-surface font-medium">
                          {dossier.showroomZoning}
                        </span>
                        <span className="font-data-mono-num text-body-sm text-primary">
                          {dossier.makani}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-outline truncate">
                        {dossier.showroomAddress}
                      </span>
                    </div>
                  </div>

                  {/* Embedded Document Preview Widget */}
                  <div className="mt-space-xs p-space-md rounded-lg bg-surface-container-lowest flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-secondary text-[18px]">
                          picture_as_pdf
                        </span>
                        <span className="font-body-md text-body-md text-on-surface font-medium">
                          {dossier.docPdfName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-outline font-data-mono-num text-body-sm">
                          {dossier.docPdfSize}
                        </span>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <button
                          className="px-2 py-1 rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-body-sm text-body-sm transition-colors flex items-center gap-1"
                          type="button"
                          onClick={() => alert(`DET QR Payload: https://ded.ae/verify?ref=${dossier.dedCommercialLicense}`)}
                        >
                          <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                          <span>Audit DED QR</span>
                        </button>
                        <button
                          className="px-2 py-1 rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-body-sm text-body-sm transition-colors flex items-center gap-1"
                          type="button"
                          onClick={() => alert(`Sha-256: ${dossier.docSha256}`)}
                        >
                          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                          <span>Full Ledger</span>
                        </button>
                      </div>
                    </div>

                    {/* Document Inspection Split Viewport */}
                    <div className="h-44 rounded-lg bg-surface-container-high p-space-md flex items-center justify-between gap-space-md relative overflow-hidden">
                      <div className="flex flex-col justify-between h-full z-10 max-w-sm">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-tertiary" />
                            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">
                              Government of Dubai • DET Validated
                            </span>
                          </div>
                          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                            Commercial Register Attestation
                          </span>
                          <span className="font-data-mono-num text-body-sm text-outline truncate">
                            Sha-256 Hash: {dossier.docSha256.slice(0, 10)}...{dossier.docSha256.slice(-8)}
                          </span>
                        </div>
                        <div className="flex items-center gap-space-sm">
                          <span className="px-2 py-0.5 rounded bg-surface-container text-tertiary font-data-mono-num text-body-sm font-medium">
                            Dubai Chamber Stamp {dossier.docDubaiChamberStamp}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-data-mono-num text-body-sm font-medium">
                            Expiry: {dossier.docExpiry}
                          </span>
                        </div>
                      </div>

                      {/* Stylized Certificate Preview Element */}
                      <div className="w-48 h-full bg-surface-container rounded p-3 flex flex-col justify-between shadow-md relative">
                        <div className="flex justify-between items-start">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[18px]">verified</span>
                          </div>
                          <div className="w-10 h-10 rounded bg-surface-container-highest p-1 flex items-center justify-center">
                            <span className="material-symbols-outlined text-outline text-[24px]">qr_code</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="h-1.5 w-3/4 rounded bg-surface-variant" />
                          <div className="h-1.5 w-1/2 rounded bg-surface-variant" />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-tertiary font-data-mono-num">
                          <span>RTA REGISTERED</span>
                          <span>PASSED</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Ultimate Beneficial Owner (UBO) & AML/CFT Screening */}
                <div className="p-space-lg rounded-xl bg-surface-container-low shadow-md flex flex-col gap-space-md border border-surface-container-high/30">
                  <div className="flex items-center justify-between pb-space-xs">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-[20px]">groups</span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {isRtl ? 'المستفيد الحقيقي (UBO) وفحص مكافحة غسل الأموال' : 'Ultimate Beneficial Owner (UBO) & AML/CFT Screening'}
                        </h2>
                        <span className="font-body-sm text-body-sm text-outline">
                          Verified against Interpol, OFAC, UN Sanctions, and Central Bank goAML
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-secondary font-data-mono-num text-body-sm font-semibold">
                      100% Equity Accounted
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    {dossier.beneficialOwners.map((ubo: BeneficialOwner) => (
                      <div
                        key={ubo.id}
                        className="p-space-md rounded-lg bg-surface-container flex flex-col justify-between gap-space-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-space-sm">
                            <div
                              className={`w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center font-headline-sm font-semibold ${
                                ubo.avatarColor === 'primary' ? 'text-primary' : 'text-secondary'
                              }`}
                            >
                              {ubo.initials}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-body-md text-body-md text-on-surface font-semibold">
                                  {ubo.name}
                                </span>
                                <span
                                  className="material-symbols-outlined text-tertiary text-[16px]"
                                  title="Biometrics Verified"
                                >
                                  check_circle
                                </span>
                              </div>
                              <span
                                className={`font-label-caps text-label-caps uppercase font-bold tracking-wider ${
                                  ubo.avatarColor === 'primary' ? 'text-primary' : 'text-secondary'
                                }`}
                              >
                                {ubo.role}
                              </span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary font-label-caps text-label-caps uppercase font-bold">
                            {ubo.statusBadge}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1.5 font-body-sm pt-1">
                          <div className="flex justify-between items-center py-1 border-t border-surface-container-high/30">
                            <span className="text-outline">Emirates ID / Passport</span>
                            <span className="font-data-mono-num text-on-surface">{ubo.emiratesId}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-t border-surface-container-high/30">
                            <span className="text-outline">Biometric Verification</span>
                            <span className="text-tertiary font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">badge</span>{' '}
                              {ubo.biometricVerification}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-t border-surface-container-high/30">
                            <span className="text-outline">PEP / Sanctions Search</span>
                            <span className="text-tertiary font-data-mono-num">{ubo.pepSanctionsSearch}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Physical Showroom Grounding & Facility Inspection Audit */}
                <div className="p-space-lg rounded-xl bg-surface-container-low shadow-md flex flex-col gap-space-md border border-surface-container-high/30">
                  <div className="flex items-center justify-between pb-space-xs">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">warehouse</span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {isRtl ? 'التدقيق الميداني لصالة العرض والمرفق' : 'Physical Showroom Grounding & Facility Audit'}
                        </h2>
                        <span className="font-body-sm text-body-sm text-outline">
                          Joint inspection by Dubai Municipality & Dubai Police Automotive Taskforce
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-tertiary font-data-mono-num text-body-sm font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">verified</span> Passed 18 Feb 2025
                    </span>
                  </div>

                  {/* Metric Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm font-body-sm">
                    <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                        Climate Storage Capacity
                      </span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-1">
                        {dossier.facility.capacityHypercars} Hypercars
                      </span>
                      <span className="font-body-sm text-body-sm text-tertiary">
                        {dossier.facility.climateSpec}
                      </span>
                    </div>

                    <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                        Tasjeel Shamil Dyno/Hoist
                      </span>
                      <span className="font-headline-sm text-headline-sm text-secondary font-semibold mt-1">
                        {dossier.facility.tasjeelBay}
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">
                        Direct RTA telemetry uplink active
                      </span>
                    </div>

                    <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                        Fire & Halon Suppression
                      </span>
                      <span className="font-headline-sm text-headline-sm text-tertiary font-semibold mt-1">
                        {dossier.facility.civilDefenseGrade}
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">
                        {dossier.facility.civilDefenseCert}
                      </span>
                    </div>
                  </div>

                  {/* Quad Photographic Evidence Grid */}
                  <div className="flex flex-col gap-space-xs mt-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                        Photographic Evidence Dossier (On-Premises Inspector Capture)
                      </span>
                      <span className="font-data-mono-num text-body-sm text-outline">
                        4 of 4 Verified High-Res Stamps
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
                      {dossier.facility.photos.map((photo: ShowroomPhotoEvidence) => (
                        <div
                          key={photo.id}
                          className="group relative rounded-lg overflow-hidden bg-surface-container aspect-video cursor-pointer"
                        >
                          <img
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            src={photo.url}
                            alt={photo.alt}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-transparent to-transparent flex flex-col justify-end p-2">
                            <span className="font-label-caps text-[10px] text-primary uppercase font-bold tracking-wider">
                              {photo.title}
                            </span>
                            <span className="font-data-mono-num text-[10px] text-outline">
                              {photo.subtitle}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN (4.5 Cols): Risk Matrix & Adjudication Terminal */}
              <div className="xl:col-span-5 flex flex-col gap-space-lg">
                {/* Card A: Automated Risk Scoring Engine */}
                <div className="p-space-lg rounded-xl bg-surface-container-low shadow-md flex flex-col gap-space-md border border-surface-container-high/30">
                  <div className="flex items-center justify-between pb-space-xs">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-tertiary">
                        <span className="material-symbols-outlined text-[20px]">analytics</span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          Automated Risk Scoring Engine
                        </h2>
                        <span className="font-body-sm text-body-sm text-outline">
                          Real-time Bayesian AML & Integrity Vector
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[18px]">info</span>
                  </div>

                  {/* High Signal Composite Score Banner */}
                  <div className="p-space-md rounded-xl bg-surface-container flex items-center justify-between shadow-inner">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                        Composite Trust Rating
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-headline-xl text-headline-xl text-tertiary font-bold tracking-tight">
                          {dossier.riskScore}
                        </span>
                        <span className="font-body-md text-body-md text-outline">/ 100 Risk</span>
                      </div>
                      <span className="font-body-sm text-body-sm text-tertiary font-medium">
                        {dossier.riskRatingLabel}
                      </span>
                    </div>

                    {/* Inline SVG Visual Progress Gauge */}
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-surface-container-highest"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        />
                        <path
                          className="text-tertiary"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeDasharray="88, 100"
                          strokeLinecap="round"
                          strokeWidth="3.5"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="material-symbols-outlined text-tertiary text-[20px]">shield</span>
                      </div>
                    </div>
                  </div>

                  {/* Granular Risk Metric Rows */}
                  <div className="flex flex-col gap-space-sm font-body-sm">
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-on-surface font-medium">Shell / Synthetic Entity Prob.</span>
                        <span className="text-outline text-body-sm">
                          Physical site inspection verified by taskforce
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-data-mono-num text-tertiary font-semibold text-body-md">
                          {dossier.shellEntityProb}
                        </span>
                        <span className="block text-[10px] text-tertiary uppercase font-bold">
                          Ultra Low
                        </span>
                      </div>
                    </div>

                    <div className="p-space-sm rounded-lg bg-surface-container-lowest flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-on-surface font-medium">Document Forgery / Tamper Risk</span>
                        <span className="text-outline text-body-sm">
                          Cryptographic handshake with Dubai DED API
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-data-mono-num text-tertiary font-semibold text-body-md">
                          {dossier.tamperRisk}
                        </span>
                        <span className="block text-[10px] text-tertiary uppercase font-bold">
                          Gov Verified
                        </span>
                      </div>
                    </div>

                    <div className="p-space-sm rounded-lg bg-surface-container-lowest flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-on-surface font-medium">Capital Proof & Liquidity Buffer</span>
                        <span className="text-outline text-body-sm">
                          Tier-1 Bank Letter ({dossier.bankReference})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-data-mono-num text-primary font-semibold text-body-md">
                          {dossier.paidUpCapital}
                        </span>
                        <span className="block text-[10px] text-outline uppercase font-bold">
                          Paid-up Capital
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card B: Adjudication Decision Panel & Multi-Signature Sign-off */}
                <div className="p-space-lg rounded-xl bg-surface-container-low shadow-xl flex flex-col gap-space-md relative overflow-hidden border border-surface-container-high/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          Adjudication & Sign-Off Panel
                        </h2>
                        <span className="font-body-sm text-body-sm text-outline">
                          Tier-0 Cryptographic Accreditation Terminal
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Element 1: Tier Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                      Select Dealer Accreditation Tier
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
                      <label
                        onClick={() => setSelectedTier('tier-1')}
                        className={`p-space-sm rounded-lg transition-colors cursor-pointer flex flex-col gap-1 ${
                          selectedTier === 'tier-1'
                            ? 'bg-surface-container ring-1 ring-primary'
                            : 'bg-surface-container/60 hover:bg-surface-container'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-body-sm text-body-sm text-primary font-semibold">
                            Tier-1 Sovereign
                          </span>
                          <input
                            type="radio"
                            name="dealer_tier"
                            value="tier-1"
                            checked={selectedTier === 'tier-1'}
                            onChange={() => setSelectedTier('tier-1')}
                            className="accent-primary"
                          />
                        </div>
                        <span className="text-[11px] text-on-surface-variant leading-tight">
                          Full Escrow API access, Unlimited Inventory, Direct RTA transfer integration.
                        </span>
                      </label>

                      <label
                        onClick={() => setSelectedTier('tier-2')}
                        className={`p-space-sm rounded-lg transition-colors cursor-pointer flex flex-col gap-1 ${
                          selectedTier === 'tier-2'
                            ? 'bg-surface-container ring-1 ring-primary'
                            : 'bg-surface-container-lowest hover:bg-surface-container opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                            Tier-2 Probationary
                          </span>
                          <input
                            type="radio"
                            name="dealer_tier"
                            value="tier-2"
                            checked={selectedTier === 'tier-2'}
                            onChange={() => setSelectedTier('tier-2')}
                            className="accent-primary"
                          />
                        </div>
                        <span className="text-[11px] text-outline leading-tight">
                          Escrow only, 5-vehicle active listing limit, manual transfer audits.
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Form Element 2: Reason Codes Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                      Regulatory Authority Reason Code
                    </label>
                    <div className="relative">
                      <select
                        value={reasonCode}
                        onChange={(e) => setReasonCode(e.target.value)}
                        className="w-full h-11 px-3 pr-8 rounded-lg bg-surface-container text-on-surface font-body-sm text-body-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary-container"
                      >
                        <option value="All DET & RTA criteria satisfied under Cabinet Resolution No. (58) of 2020 on Beneficial Ownership">
                          All DET & RTA criteria satisfied under Cabinet Resolution No. (58) of 2020 on Beneficial Ownership
                        </option>
                        <option value="Full UBO and Physical Showroom Compliance Verified (Direct Board Ratification)">
                          Full UBO and Physical Showroom Compliance Verified (Direct Board Ratification)
                        </option>
                        <option value="Conditional Pilot Authorization (Bond Guaranteed AED 50M)">
                          Conditional Pilot Authorization (Bond Guaranteed AED 50M)
                        </option>
                      </select>
                      <span className="material-symbols-outlined text-outline absolute right-2.5 top-3 pointer-events-none text-[18px]">
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Form Element 3: Mandatory Audit Log Note */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                        Mandatory Operator Audit Note
                      </label>
                      <span className="font-data-mono-num text-[11px] text-outline">
                        Immutable Ledger Entry
                      </span>
                    </div>
                    <textarea
                      value={auditNote}
                      onChange={(e) => setAuditNote(e.target.value)}
                      className="w-full p-space-sm rounded-lg bg-surface-container text-on-surface font-data-mono-num text-body-sm focus:outline-none focus:ring-1 focus:ring-primary-container resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Form Element 4: Two-Officer Cryptographic Key Sign-off Matrix */}
                  <div className="p-space-sm rounded-lg bg-surface-container-lowest flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between pb-1">
                      <span className="font-label-caps text-label-caps text-outline uppercase font-semibold">
                        Dual-Operator Protocol
                      </span>
                      <span className="font-data-mono-num text-[11px] text-primary">
                        Required Clearance: 2/2
                      </span>
                    </div>

                    {/* Signer 1 (Signed) */}
                    <div className="flex items-center justify-between p-2 rounded bg-surface-container">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-tertiary-container/30 text-tertiary flex items-center justify-center text-[12px]">
                          <span className="material-symbols-outlined text-[14px]">key</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                            {dossier.dualSigners[0]?.name || 'Dr. Maya Al-Falasi'}
                          </span>
                          <span className="font-data-mono-num text-[10px] text-outline truncate">
                            Key: {dossier.dualSigners[0]?.keyFingerprint || '0x8a92f09...d8a2'} (Signed at {dossier.dualSigners[0]?.timestamp || '14:22:09 UTC'})
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary font-label-caps text-label-caps uppercase font-bold shrink-0">
                        Signed
                      </span>
                    </div>

                    {/* Signer 2 (Pending) */}
                    <div className="flex items-center justify-between p-2 rounded bg-surface-container">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-surface-container-high text-outline flex items-center justify-center text-[12px]">
                          <span className="material-symbols-outlined text-[14px]">lock</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                            {dossier.dualSigners[1]?.name || 'Tariq Al-Nuaimi (Risk Officer)'}
                          </span>
                          <span className="font-data-mono-num text-[10px] text-outline truncate">
                            Smart Contract Key Awaiting Biometric Challenge
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-caps text-label-caps uppercase font-bold shrink-0 animate-pulse">
                        Pending
                      </span>
                    </div>
                  </div>

                  {/* Terminal Confirmation Trigger */}
                  <button
                    onClick={() => setBiometricModalOpen(true)}
                    className="w-full h-11 rounded-lg bg-primary text-on-primary hover:bg-primary-fixed-dim font-body-sm font-semibold tracking-wider uppercase transition-colors shadow-lg flex items-center justify-center gap-2 mt-1"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">security_update_good</span>
                    <span>Commit Sovereign Accreditation to Ledger</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Fast-Switch Secondary Context Drawer: Verification Queue Ribbon */}
            <div className="w-full rounded-xl bg-surface-container-low shadow-xl p-space-md flex flex-col gap-space-sm mb-space-lg border border-surface-container-high/30">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-secondary text-[20px]">queue</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Active Verification Queue
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary font-data-mono-num text-body-sm">
                    5 Pending Applications
                  </span>
                </div>
                <div className="flex items-center gap-space-sm font-body-sm">
                  <span className="text-outline">Sort: SLA Urgency</span>
                  <Link href="/verifications" className="text-primary hover:underline font-medium">
                    Expand Full Registry →
                  </Link>
                </div>
              </div>

              {/* Queue Ribbon Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm">
                {dossier.queueRibbon.map((item: KybQueueItem) => {
                  const isCurrent = item.id === dossier.id;
                  return (
                    <Link
                      key={item.id}
                      href={`/verifications/${item.id}`}
                      className={`p-space-sm rounded-lg flex flex-col gap-1 transition-all ${
                        isCurrent
                          ? 'bg-surface-container-high ring-1 ring-primary/40'
                          : 'bg-surface-container hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-data-mono-num text-[11px] ${
                            isCurrent ? 'text-secondary font-semibold' : 'text-outline'
                          }`}
                        >
                          {item.caseNumber}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-label-caps text-[10px] font-bold ${
                            item.statusBadgeType === 'active'
                              ? 'bg-primary/20 text-primary'
                              : item.statusBadgeType === 'review'
                              ? 'bg-tertiary-container/20 text-tertiary'
                              : item.statusBadgeType === 'flag'
                              ? 'bg-error-container/30 text-error'
                              : item.statusBadgeType === 'ok'
                              ? 'bg-secondary-container/20 text-secondary'
                              : 'bg-surface-container-highest text-outline'
                          }`}
                        >
                          {item.statusLabel}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface font-semibold truncate">
                        {item.dealerLegalName}
                      </span>
                      <div className="flex justify-between items-center text-[11px] text-outline mt-1 font-data-mono-num">
                        <span>Score: {item.score}</span>
                        <span className={isCurrent ? 'text-tertiary font-semibold' : ''}>
                          SLA: {item.sla}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Biometric Two-Factor Authorization Modal */}
      {biometricModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-space-md">
          <div className="w-full max-w-lg p-space-lg rounded-xl bg-surface-container-low shadow-2xl flex flex-col gap-space-md relative overflow-hidden border border-surface-container-high/40">
            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">fingerprint</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Tier-0 Biometric Attestation
                  </h3>
                  <span className="font-body-sm text-body-sm text-outline">
                    HSM Node: #DXB-ADM-9941
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBiometricModalOpen(false)}
                className="p-1 rounded text-outline hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              You are about to issue a sovereign dealer smart credential to{' '}
              <strong className="text-on-surface">{dossier.legalEntityName}</strong>. This grants automated RTA title transfers and DIFC custodial escrow privileges.
            </p>

            <div className="p-space-md rounded-lg bg-surface-container flex flex-col gap-space-xs font-data-mono-num text-body-sm">
              <div className="flex justify-between">
                <span className="text-outline">Assigned Tier:</span>
                <span className="text-primary font-bold">
                  {selectedTier === 'tier-1' ? 'Tier-1 Sovereign Dealer' : 'Tier-2 Probationary Dealer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Trade License ID:</span>
                <span className="text-on-surface">{dossier.dedCommercialLicense} (DET Dubai)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Smart Contract Hash:</span>
                <span className="text-secondary truncate max-w-[200px]">0x77d84f...c9012</span>
              </div>
            </div>

            {/* Biometric scanner simulation box */}
            <div
              onClick={handleExecuteBiometricSign}
              className="h-28 rounded-lg bg-surface-container-lowest flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-surface-container transition-all group border border-surface-container-high/40"
            >
              <span
                className={`material-symbols-outlined text-[36px] transition-transform ${
                  isBroadcasting
                    ? 'text-primary animate-spin'
                    : broadcastingComplete
                    ? 'text-tertiary'
                    : 'text-primary group-hover:scale-110'
                }`}
              >
                {broadcastingComplete ? 'verified' : isBroadcasting ? 'refresh' : 'fingerprint'}
              </span>
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider group-hover:text-primary transition-colors">
                {broadcastingComplete
                  ? 'Cryptographic Accreditation Minted!'
                  : isBroadcasting
                  ? 'Broadcasting to Sovereign Ledger...'
                  : 'Tap Hardware YubiKey or Sensor to Sign'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setBiometricModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-body-sm font-medium hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBiometricSign}
                disabled={isBroadcasting}
                className="px-5 py-2 rounded-lg bg-primary text-on-primary font-body-sm font-semibold hover:bg-primary-fixed-dim transition-colors flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">lock_open</span>
                <span>Execute Cryptographic Sign</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-space-md">
          <div className="w-full max-w-lg p-space-lg rounded-xl bg-surface-container-low shadow-2xl flex flex-col gap-space-md relative overflow-hidden border border-error/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm text-error">
                <span className="material-symbols-outlined text-[24px]">gavel</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Reject Dealer KYB Application
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              Rejecting this dealership will revoke their vehicle intake capabilities and prevent active marketplace listings.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-label-caps text-outline uppercase font-semibold">
                Select KYB Denial Code
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-surface-container text-on-surface font-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="INCOMPLETE_UBO">INCOMPLETE_UBO (Ultimate Beneficial Ownership &lt; 100% accounted)</option>
                <option value="SANCTIONS_OR_PEP">SANCTIONS_OR_PEP (OFAC/UN watch list positive hit)</option>
                <option value="EXPIRED_COMMERCIAL_LICENSE">EXPIRED_COMMERCIAL_LICENSE (DED/DET License invalid or expired)</option>
                <option value="INSUFFICIENT_LIQUIDITY">INSUFFICIENT_LIQUIDITY (Bank capital guarantee under AED 10M threshold)</option>
                <option value="FACILITY_NON_COMPLIANT">FACILITY_NON_COMPLIANT (Civil defense or showroom geofence failed)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-label-caps text-outline uppercase font-semibold">
                Regulatory Explanation & Appeal Instructions
              </label>
              <textarea
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-surface-container text-on-surface font-data-mono-num text-[12px] focus:outline-none focus:ring-1 focus:ring-primary"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-body-sm font-medium hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-lg bg-error text-on-error font-body-sm font-semibold hover:bg-error-container hover:text-on-error-container transition-colors flex items-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">gavel</span>
                <span>Confirm Denial & Audit Log</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
