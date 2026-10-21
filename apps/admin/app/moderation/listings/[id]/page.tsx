'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AdminSidebar } from '../../../../components/AdminSidebar';
import { AdminHeader } from '../../../../components/AdminHeader';
import {
  MOCK_MODERATION_DETAIL,
  fetchModerationListing,
  submitModerationDecision,
  AdminListingModerationDetail,
} from '../../../../lib/api';

export default function ListingModerationPage() {
  const params = useParams();
  const listingId = (params?.id as string) || 'mod-9921';

  const [isRtl, setIsRtl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<AdminListingModerationDetail>(MOCK_MODERATION_DETAIL);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [citationText, setCitationText] = useState(
    'Article 14-C UAE Consumer Protection: Vehicle has been approved with mandatory label [GCC Agency Retrofit (Ali & Sons 2024)] based on Factory Build Sheet (C00 Germany) cooling kit upgrade verification.'
  );
  const [attestation1, setAttestation1] = useState(true);
  const [attestation2, setAttestation2] = useState(true);
  const [attestation3, setAttestation3] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // Modal for Reject or Clarification
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('SPEC_MISMATCH');
  const [rejectNotes, setRejectNotes] = useState(
    'Factory build sheet confirms C00 German delivery. Please provide certified Ali & Sons retrofit documentation.'
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchModerationListing(listingId);
      setListing(data);
      setLoading(false);
    }
    loadData();
  }, [listingId]);

  const handleCommitAdjudication = async () => {
    setIsSubmitting(true);
    setSubmissionFeedback(null);

    const isReject = selectedOption === 'C';
    const res = await submitModerationDecision(listing.id, {
      decision: isReject ? 'REJECT' : 'APPROVE',
      reason: isReject ? citationText : undefined,
      discloseBadge: selectedOption === 'A' ? listing.discloseBadgeLabel : undefined,
      overrideFlag: selectedOption === 'B',
    });

    setIsSubmitting(false);
    setSubmissionFeedback(res.message);
  };

  const handleConfirmReject = async () => {
    setIsSubmitting(true);
    const res = await submitModerationDecision(listing.id, {
      decision: 'REJECT',
      reason: `[${rejectReason}] ${rejectNotes}`,
    });
    setIsSubmitting(false);
    setRejectModalOpen(false);
    setSubmissionFeedback(res.message);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[40px] animate-spin">
            progress_activity
          </span>
          <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
            Loading Sovereign Telemetry & Registry Attestations...
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
            {/* Notification Banner when Adjudication is committed */}
            {submissionFeedback && (
              <div className="mb-space-md p-space-md rounded-xl bg-tertiary-container/20 border border-tertiary text-on-surface flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-tertiary text-[24px]">verified</span>
                  <div>
                    <span className="font-headline-sm text-body-md font-semibold text-tertiary block">
                      {isRtl ? 'تم اعتماد القرار بنجاح' : 'Adjudication Recorded on Immutable Ledger'}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {submissionFeedback}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmissionFeedback(null)}
                  className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-body-sm"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Top Super-Governance Sticky Audit Strip */}
            <div className="relative w-full rounded-xl bg-surface-container-low shadow-xl p-space-lg mb-space-lg overflow-hidden border border-surface-container-high/40">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 -bottom-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

              {/* Header Tier: Breadcrumbs & Status Flag */}
              <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-md">
                <div className="flex items-center gap-space-xs font-label-caps text-label-caps text-outline tracking-wider">
                  <Link href="/moderation" className="hover:text-on-surface transition-colors">
                    {isRtl ? 'مراجعة وتدقيق الإعلانات' : 'LISTING MODERATION & VERIFICATION'}
                  </Link>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  <Link href="/moderation" className="hover:text-on-surface transition-colors">
                    {isRtl ? 'طابور التدقيق' : 'MODERATION QUEUE'}
                  </Link>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  <span className="text-primary font-data-mono-num font-semibold">{listing.auditCode}</span>
                </div>

                <div className="flex items-center gap-space-sm">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container/40 text-error font-data-mono-num text-body-sm font-semibold tracking-tight shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                    {isRtl ? 'إجراء مطلوب • تم رصد عدم تطابق آلي' : listing.priorityLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-data-mono-num text-body-sm text-on-surface-variant">
                    Priority: {listing.priority}
                  </span>
                </div>
              </div>

              {/* Primary Title & Dealer Metadata */}
              <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md pt-space-xs">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-space-sm">
                    <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                      {isRtl ? 'تدقيق إعلان المركبة: بورشه 911 جي تي 3 آر إس 2024 باقة فايساخ' : listing.title}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary font-data-mono-num text-body-sm">
                      {listing.generation}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-space-md text-body-sm text-outline">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[16px]">storefront</span>
                      <span className="text-on-surface">{isRtl ? 'مقدم من:' : 'Submitted by:'}</span>
                      <span className="text-primary font-semibold underline decoration-primary/40 underline-offset-4">
                        {listing.dealerName}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-label-caps text-label-caps">
                        {listing.dealerTier}
                      </span>
                    </div>
                    <span className="text-surface-variant">•</span>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      <span>
                        {isRtl ? 'تاريخ الاستلام:' : 'Received:'}{' '}
                        <span className="text-on-surface font-data-mono-num">{listing.receivedAt}</span>
                      </span>
                    </div>
                    <span className="text-surface-variant">•</span>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-tertiary text-[16px]">verified</span>
                      <span className="text-tertiary">{listing.dedLicense}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Controls */}
                <div className="flex flex-wrap items-center gap-space-sm pt-space-xs xl:pt-0">
                  <button
                    onClick={() => {
                      const msg = window.prompt(
                        'Enter clarification request to send directly to dealer principal:'
                      );
                      if (msg) {
                        alert(`Clarification dispatched: "${msg}"`);
                      }
                    }}
                    className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm font-medium transition-all flex items-center gap-2 shadow-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                    <span>{isRtl ? 'طلب استيضاح من الوكيل' : 'Request Dealer Clarification'}</span>
                  </button>

                  <button
                    id="btn-reject-delist"
                    onClick={() => setRejectModalOpen(true)}
                    className="h-10 px-4 rounded-lg bg-error-container hover:bg-error text-on-error-container hover:text-on-error font-body-sm font-medium transition-all flex items-center gap-2 shadow-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">block</span>
                    <span>{isRtl ? 'رفض وإلغاء القائمة' : 'Reject & De-list'}</span>
                  </button>

                  <button
                    id="btn-approve-publish"
                    onClick={() => {
                      setSelectedOption('A');
                      handleCommitAdjudication();
                    }}
                    className="h-10 px-5 rounded-lg bg-tertiary-container hover:bg-tertiary text-on-tertiary-container hover:text-on-tertiary font-body-sm font-semibold transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>{isRtl ? 'اعتماد ونشر في السوق' : 'Approve & Publish to Marketplace'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Asymmetric 2-Column Investigation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
              {/* LEFT COLUMN (7 cols): Submission, Photos, Media Metadata, Specs & Docs */}
              <div className="lg:col-span-7 flex flex-col gap-space-lg">
                {/* Photo Grid & EXIF / Tamper Assurance */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md flex flex-col gap-space-md border border-surface-container-high/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[18px]">photo_library</span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {isRtl ? 'تدقيق صور صالة العرض الفعلية' : 'Physical Showroom Media Audit'}
                        </h2>
                        <p className="font-body-sm text-body-sm text-outline">
                          {isRtl
                            ? 'تم التقاط 6 من أصل 24 لوحة تيليمترية عالية الدقة'
                            : '6 of 24 High-Resolution Telemetry Plates Captured'}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-tertiary/10 text-tertiary font-data-mono-num text-body-sm">
                      <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                      GPS & EXIF MATCHED
                    </span>
                  </div>

                  {/* 6-Photo Mosaic */}
                  <div className="grid grid-cols-3 gap-space-xs rounded-lg overflow-hidden bg-surface-container-lowest p-1.5">
                    {/* Primary Studio Hero Shot */}
                    <div className="col-span-2 row-span-2 relative group overflow-hidden rounded">
                      <img
                        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                        src={listing.images[0]?.url || ''}
                        alt={listing.images[0]?.alt || 'Studio Front 3/4'}
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-surface/90 text-on-surface font-label-caps text-label-caps flex items-center gap-1 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                        {listing.images[0]?.plate || 'Plate 01'} • {listing.images[0]?.label || 'Studio Shot'}
                      </div>
                    </div>

                    {/* Secondary detail plates */}
                    {listing.images.slice(1).map((img) => (
                      <div key={img.id} className="relative group overflow-hidden rounded">
                        <img
                          className="w-full h-31 object-cover transition-transform duration-500 group-hover:scale-105"
                          src={img.url}
                          alt={img.alt}
                        />
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-surface/80 text-on-surface font-label-caps text-label-caps">
                          {img.plate} • {img.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* EXIF & GPS Metadata Certificate Banner */}
                  <div className="rounded-lg bg-surface-container p-space-md grid grid-cols-1 md:grid-cols-3 gap-space-sm text-body-sm">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-tertiary text-[20px]">fmd_good</span>
                      <div className="min-w-0">
                        <span className="font-label-caps text-label-caps text-outline block">
                          GEOLOCATION VERIFICATION
                        </span>
                        <span className="text-on-surface font-data-mono-num truncate block">
                          {listing.exifGps}
                        </span>
                        <span className="text-tertiary font-body-sm text-[11px]">
                          {listing.exifVenue}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-secondary text-[20px]">camera</span>
                      <div className="min-w-0">
                        <span className="font-label-caps text-label-caps text-outline block">
                          CAMERA EXIF SIGNATURE
                        </span>
                        <span className="text-on-surface font-data-mono-num truncate block">
                          {listing.exifCamera}
                        </span>
                        <span className="text-outline font-body-sm text-[11px]">
                          No generative inpainting detected
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        history_toggle_off
                      </span>
                      <div className="min-w-0">
                        <span className="font-label-caps text-label-caps text-outline block">
                          CAPTURE TIMESTAMP
                        </span>
                        <span className="text-on-surface font-data-mono-num truncate block">
                          {listing.exifTimestamp}
                        </span>
                        <span className="text-tertiary font-body-sm text-[11px]">
                          {listing.exifFreshness}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Listed Specifications vs Regulatory Attestation Table */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md flex flex-col gap-space-md border border-surface-container-high/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[18px]">rule</span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {isRtl ? 'المواصفات وتوثيق القياسات الرسمية' : 'Specification & Telemetry Attestation'}
                        </h2>
                        <p className="font-body-sm text-body-sm text-outline">
                          {isRtl
                            ? 'مطابقة متقاطعة مع سجلات هيئة الطرق والمواصلات وفحص شامل وتسجيل وبورشه ألمانيا'
                            : 'Cross-referenced against RTA, Tasjeel Shamil, and Porsche AG records'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container font-data-mono-num text-body-sm text-primary">
                      4 of 5 Validated
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-sm">
                      <thead>
                        <tr className="text-outline font-label-caps text-label-caps bg-surface-container-lowest/50">
                          <th className="py-2.5 px-3">PARAMETER</th>
                          <th className="py-2.5 px-3">DEALER CLAIM</th>
                          <th className="py-2.5 px-3">OFFICIAL REGISTRY SOURCE</th>
                          <th className="py-2.5 px-3 text-right">AUDIT STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-high/40">
                        {listing.attestations.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              row.statusType === 'warning'
                                ? 'bg-primary/5 hover:bg-primary/10'
                                : 'hover:bg-surface-container/40'
                            }`}
                          >
                            <td className="py-3 px-3 font-medium text-on-surface flex items-center gap-1.5">
                              <span
                                className={`material-symbols-outlined text-[16px] ${
                                  row.statusType === 'warning' ? 'text-primary' : 'text-tertiary'
                                }`}
                              >
                                {row.icon}
                              </span>
                              {row.parameter}
                            </td>
                            <td
                              className={`py-3 px-3 font-data-mono-num ${
                                row.statusType === 'warning' ? 'font-semibold text-primary' : 'text-on-surface'
                              }`}
                            >
                              {row.dealerClaim}
                            </td>
                            <td className="py-3 px-3 text-outline font-data-mono-num">
                              {row.registrySource}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-caps text-label-caps ${
                                  row.statusType === 'warning'
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-tertiary/10 text-tertiary'
                                }`}
                              >
                                {row.statusType === 'warning' ? (
                                  <span className="material-symbols-outlined text-[12px]">warning</span>
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                                )}
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cryptographically Attached Dossier */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md flex flex-col gap-space-sm border border-surface-container-high/30">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    {isRtl ? 'الملف الرقابي المرفق مشفراً' : 'Cryptographically Attached Dossier'}
                  </h3>
                  <p className="font-body-sm text-body-sm text-outline">
                    {isRtl
                      ? 'موقع رقمياً من الجهات الحكومية والوكلاء المعتمدين'
                      : 'Signed by government authorities and OEM authorized distributors'}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm pt-space-xs">
                    {listing.attachedDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded-lg bg-surface-container p-space-sm hover:bg-surface-container-high transition-colors flex flex-col justify-between gap-space-xs cursor-pointer group"
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className={`material-symbols-outlined text-[24px] ${
                              doc.badgeType === 'tertiary'
                                ? 'text-tertiary'
                                : doc.badgeType === 'secondary'
                                ? 'text-secondary'
                                : 'text-primary'
                            }`}
                          >
                            {doc.icon}
                          </span>
                          <span
                            className={`font-data-mono-num text-[11px] px-1.5 py-0.5 rounded ${
                              doc.badgeType === 'tertiary'
                                ? 'bg-tertiary/10 text-tertiary'
                                : 'bg-surface-container-highest text-secondary'
                            }`}
                          >
                            {doc.badge}
                          </span>
                        </div>
                        <div>
                          <span className="font-body-sm font-semibold text-on-surface group-hover:text-primary transition-colors block">
                            {doc.title}
                          </span>
                          <span className="text-outline text-[11px] font-data-mono-num">{doc.ref}</span>
                        </div>
                        <div className="flex items-center justify-between text-outline text-[11px] pt-1">
                          <span>{doc.signedBy}</span>
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                            open_in_new
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN (5 cols): Discrepancy Engine, Fraud Risk Checks & Adjudication Terminal */}
              <div className="lg:col-span-5 flex flex-col gap-space-lg">
                {/* Critical Discrepancy Alert Card (Gold/Amber Halo) */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl relative overflow-hidden border border-primary/40">
                  <div className="flex items-start justify-between gap-space-sm mb-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">warning</span>
                      </div>
                      <div>
                        <span className="font-label-caps text-label-caps text-primary tracking-wider uppercase block font-semibold">
                          Discrepancy Engine Telemetry
                        </span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {listing.discrepancyTitle}
                        </h3>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-primary-container text-on-primary-container font-label-caps text-label-caps font-semibold">
                      {listing.discrepancySeverity}
                    </span>
                  </div>

                  <div className="space-y-space-sm text-body-sm text-on-surface-variant">
                    <p className="leading-relaxed">
                      Dealer declared <strong className="text-on-surface">&quot;{listing.discrepancyDealerClaim}&quot;</strong>. RTA Gateway confirms initial registration in UAE; however, the Porsche AG Factory Build Sheet records the vehicle as:
                    </p>

                    <div className="rounded-lg bg-surface-container-lowest p-space-sm font-data-mono-num text-[12px] space-y-1">
                      <div className="flex justify-between text-outline">
                        <span>Build Order:</span>
                        <span className="text-on-surface">{listing.discrepancyBuildSheetOrder}</span>
                      </div>
                      <div className="flex justify-between text-outline">
                        <span>Tropical Package (PR-8Z4):</span>
                        <span className="text-primary font-semibold">
                          {listing.discrepancyTropicalAttest}
                        </span>
                      </div>
                      <div className="flex justify-between text-outline">
                        <span>Radiator Dual-Core Code:</span>
                        <span className="text-tertiary">{listing.discrepancyRadiatorCode}</span>
                      </div>
                    </div>

                    <div className="p-space-sm rounded-lg bg-surface-container flex items-start gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                        policy
                      </span>
                      <div className="text-[12px] text-on-surface-variant leading-tight">
                        <span className="font-semibold text-on-surface block">
                          Mandatory Adjudication Guideline:
                        </span>
                        {listing.discrepancyGuideline}
                      </div>
                    </div>
                  </div>
                </div>

                {/* VIN Cloning, Phantom Listing & Financial Encumbrance Checks */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md flex flex-col gap-space-md border border-surface-container-high/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          Integrity & Anti-Fraud Scans
                        </h2>
                        <p className="font-body-sm text-body-sm text-outline">
                          Multi-registry syndicated checks
                        </p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                  </div>

                  <div className="flex flex-col gap-space-xs">
                    {listing.scans.map((scan, i) => (
                      <div
                        key={i}
                        className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between gap-space-sm"
                      >
                        <div className="flex items-center gap-space-sm min-w-0">
                          <div className="w-7 h-7 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[16px]">{scan.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="font-body-sm font-medium text-on-surface block truncate">
                              {scan.title}
                            </span>
                            <span className="text-[11px] text-outline block truncate">
                              {scan.subtitle}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-data-mono-num text-[11px] shrink-0 font-semibold">
                          {scan.resultBadge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sovereign Adjudication Terminal */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl flex flex-col gap-space-md border border-surface-container-high/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-7 h-7 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[18px]">gavel</span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          Adjudication Determination
                        </h2>
                        <p className="font-body-sm text-body-sm text-outline">
                          Operator clearance execution
                        </p>
                      </div>
                    </div>
                    <span className="font-data-mono-num text-[11px] text-outline">Tier-0 Gate</span>
                  </div>

                  {/* Radio Decision Matrix */}
                  <div className="flex flex-col gap-space-xs">
                    {/* Option A (Recommended) */}
                    <label
                      onClick={() => setSelectedOption('A')}
                      className={`p-space-sm rounded-lg cursor-pointer flex items-start gap-space-sm transition-colors group ${
                        selectedOption === 'A'
                          ? 'bg-surface-container ring-1 ring-primary'
                          : 'bg-surface-container/60 hover:bg-surface-container'
                      }`}
                    >
                      <input
                        id="option-a-radio"
                        type="radio"
                        name="adjudication_choice"
                        checked={selectedOption === 'A'}
                        onChange={() => setSelectedOption('A')}
                        className="mt-1 accent-primary focus:ring-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-body-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                            Option A: Approve with Mandatory Disclose Badge
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-label-caps text-label-caps">
                            RECOMMENDED
                          </span>
                        </div>
                        <p className="text-[12px] text-outline mt-0.5">
                          Automatically appends &quot;GCC Retrofit Verified&quot; badge to the buyer specification dossier and adjusts the listing search filters.
                        </p>
                      </div>
                    </label>

                    {/* Option B */}
                    <label
                      onClick={() => setSelectedOption('B')}
                      className={`p-space-sm rounded-lg cursor-pointer flex items-start gap-space-sm transition-colors ${
                        selectedOption === 'B'
                          ? 'bg-surface-container ring-1 ring-primary'
                          : 'bg-surface-container/60 hover:bg-surface-container'
                      }`}
                    >
                      <input
                        id="option-b-radio"
                        type="radio"
                        name="adjudication_choice"
                        checked={selectedOption === 'B'}
                        onChange={() => setSelectedOption('B')}
                        className="mt-1 accent-primary focus:ring-0"
                      />
                      <div className="min-w-0">
                        <span className="font-body-sm font-medium text-on-surface block">
                          Option B: Approve as Full GCC Spec (Override Flag)
                        </span>
                        <p className="text-[12px] text-outline mt-0.5">
                          Requires manual high-clearance override reason; logs entry into immutable audit activity ledger.
                        </p>
                      </div>
                    </label>

                    {/* Option C */}
                    <label
                      onClick={() => setSelectedOption('C')}
                      className={`p-space-sm rounded-lg cursor-pointer flex items-start gap-space-sm transition-colors ${
                        selectedOption === 'C'
                          ? 'bg-surface-container ring-1 ring-error'
                          : 'bg-surface-container/60 hover:bg-surface-container'
                      }`}
                    >
                      <input
                        id="option-c-radio"
                        type="radio"
                        name="adjudication_choice"
                        checked={selectedOption === 'C'}
                        onChange={() => setSelectedOption('C')}
                        className="mt-1 accent-error focus:ring-0"
                      />
                      <div className="min-w-0">
                        <span className="font-body-sm font-medium text-error block">
                          Option C: Reject Submission (Inaccurate Specification)
                        </span>
                        <p className="text-[12px] text-outline mt-0.5">
                          Returns listing draft back to dealer inventory with 48h deadline to update documentation.
                        </p>
                      </div>
                    </label>

                    {/* Option D */}
                    <label
                      onClick={() => setSelectedOption('D')}
                      className={`p-space-sm rounded-lg cursor-pointer flex items-start gap-space-sm transition-colors ${
                        selectedOption === 'D'
                          ? 'bg-surface-container ring-1 ring-outline'
                          : 'bg-surface-container/60 hover:bg-surface-container'
                      }`}
                    >
                      <input
                        id="option-d-radio"
                        type="radio"
                        name="adjudication_choice"
                        checked={selectedOption === 'D'}
                        onChange={() => setSelectedOption('D')}
                        className="mt-1 accent-outline focus:ring-0"
                      />
                      <div className="min-w-0">
                        <span className="font-body-sm font-medium text-on-surface block">
                          Option D: Temporary Freeze Pending Physical Inspector Dispatch
                        </span>
                        <p className="text-[12px] text-outline mt-0.5">
                          Dispatches a Sovereign Field Auditor to Bay 3 Al Quoz for live ECU port interrogation.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Citation Reason Box */}
                  <div className="space-y-1">
                    <label className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">
                      Generated Regulatory Citation Notice to Dealer
                    </label>
                    <textarea
                      id="citation-textarea"
                      value={citationText}
                      onChange={(e) => setCitationText(e.target.value)}
                      className="w-full rounded-lg bg-surface-container-highest/60 p-space-sm font-data-mono-num text-[12px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                      rows={3}
                    />
                  </div>

                  {/* Operator Mandatory Attestation Checklist */}
                  <div className="space-y-1.5 pt-space-xs">
                    <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider block">
                      SuperAdmin Compliance Attestation
                    </span>
                    <div className="space-y-1 text-body-sm text-on-surface-variant">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          id="attest-beacon"
                          type="checkbox"
                          checked={attestation1}
                          onChange={(e) => setAttestation1(e.target.checked)}
                          className="rounded accent-tertiary"
                        />
                        <span className="text-[12px]">Photos verified physically on premise via Al Quoz beacon</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          id="attest-lien"
                          type="checkbox"
                          checked={attestation2}
                          onChange={(e) => setAttestation2(e.target.checked)}
                          className="rounded accent-tertiary"
                        />
                        <span className="text-[12px]">Central Bank mortgage and hypothecation registry cleared</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          id="attest-stolen"
                          type="checkbox"
                          checked={attestation3}
                          onChange={(e) => setAttestation3(e.target.checked)}
                          className="rounded accent-tertiary"
                        />
                        <span className="text-[12px]">VIN cryptographically cleared against Dubai Police Stolen Database</span>
                      </label>
                    </div>
                  </div>

                  {/* Final Execution Button */}
                  <button
                    id="btn-commit-adjudication"
                    onClick={handleCommitAdjudication}
                    disabled={isSubmitting || !attestation1 || !attestation2 || !attestation3}
                    className="w-full h-11 rounded-lg bg-primary hover:bg-primary-fixed-dim text-on-primary font-body-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    {isSubmitting ? (
                      <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                    )}
                    <span>Commit Adjudication & Sign with HSM Key</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Pipeline Horizon: Moderation Queue Pipeline */}
            <div className="w-full rounded-xl bg-surface-container-low p-space-lg shadow-md flex flex-col gap-space-md border border-surface-container-high/30">
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">queue</span>
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Moderation Queue Pipeline
                    </h2>
                    <p className="font-body-sm text-body-sm text-outline">
                      13 other vehicles pending cryptographic and regulatory clearance
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-space-sm">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container font-label-caps text-label-caps text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span>4 Critical Flares</span>
                  </div>
                  <Link
                    href="/moderation"
                    className="px-3 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm flex items-center gap-1 transition-colors"
                  >
                    <span>View All 14 Items</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>

              {/* Horizontal Fast-Triage Strip */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-sm">
                {listing.queuePipeline.map((q) => (
                  <Link
                    key={q.id}
                    href={`/moderation/listings/${q.id}`}
                    className={`p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-all flex flex-col justify-between gap-space-sm cursor-pointer border-l-2 ${
                      q.accentBorder === 'primary'
                        ? 'border-primary'
                        : q.accentBorder === 'error'
                        ? 'border-error'
                        : q.accentBorder === 'tertiary'
                        ? 'border-tertiary'
                        : 'border-secondary'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-label-caps text-label-caps text-outline block font-data-mono-num">
                          {q.code}
                        </span>
                        <span className="font-body-sm font-semibold text-on-surface block">
                          {q.vehicleTitle}
                        </span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded font-data-mono-num text-[11px] font-semibold ${
                          q.accentBorder === 'error'
                            ? 'bg-error/10 text-error'
                            : q.accentBorder === 'tertiary'
                            ? 'bg-tertiary/10 text-tertiary'
                            : q.accentBorder === 'secondary'
                            ? 'bg-secondary/10 text-secondary'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {q.metricBadge}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span
                        className={`flex items-center gap-1 ${
                          q.accentBorder === 'error'
                            ? 'text-error'
                            : q.accentBorder === 'tertiary'
                            ? 'text-tertiary'
                            : q.accentBorder === 'secondary'
                            ? 'text-secondary'
                            : 'text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">{q.issueIcon}</span>
                        {q.issueLabel}
                      </span>
                      <span className="text-outline font-data-mono-num">{q.priceOrKm}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-space-md">
          <div className="w-full max-w-lg p-space-lg rounded-xl bg-surface-container-low shadow-2xl flex flex-col gap-space-md relative overflow-hidden border border-error/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm text-error">
                <span className="material-symbols-outlined text-[24px]">block</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Reject Vehicle Listing
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
              Rejection will return this listing draft back to dealer inventory with an explicit cure notice. The vehicle will remain unlisted on the public marketplace.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-label-caps text-outline uppercase font-semibold">
                Select Regulatory Rejection Code
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-surface-container text-on-surface font-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="SPEC_MISMATCH">SPEC_MISMATCH (Regional specification claim disproven)</option>
                <option value="VIN_MISMATCH">VIN_MISMATCH (Physical chassis tag discrepancies)</option>
                <option value="UNVERIFIED_MILEAGE">UNVERIFIED_MILEAGE (Tasjeel telemetry delta exceeds threshold)</option>
                <option value="INSUFFICIENT_PHOTOS">INSUFFICIENT_PHOTOS (Missing studio or studio watermark detected)</option>
                <option value="FAKE_GCC_SPEC">FAKE_GCC_SPEC (Unauthorized aftermarket components)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-label-caps text-outline uppercase font-semibold">
                Mandatory Explanation & Evidence Notes
              </label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
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
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-error text-on-error font-body-sm font-semibold hover:bg-error-container hover:text-on-error-container transition-colors flex items-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">gavel</span>
                <span>Confirm Rejection & Dispatch Citation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
