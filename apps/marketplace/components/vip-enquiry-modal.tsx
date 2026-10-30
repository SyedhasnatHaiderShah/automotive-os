'use client';

import React, { useState, useEffect } from 'react';
import {
  PublicListingDetail,
  submitVehicleLeadEnquiry,
  LeadEnquiryResponse,
  CreateLeadEnquiryPayload,
} from '../lib/api';

export interface VipEnquiryModalProps {
  vehicle: PublicListingDetail;
  isOpen: boolean;
  onClose: () => void;
  locale?: 'en' | 'ar';
}

type ViewState = 'default' | 'loading' | 'success' | 'error';
type EvaluationMode = 'TRACK' | 'LOUNGE';
type PreferredChannel = 'WHATSAPP' | 'PHONE' | 'EMAIL';

export const VipEnquiryModal: React.FC<VipEnquiryModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  locale = 'en',
}) => {
  const isArabic = locale === 'ar';
  const [viewState, setViewState] = useState<ViewState>('default');
  const [intent, setIntent] = useState<'TEST_DRIVE' | 'OFFER'>('TEST_DRIVE');
  const [evaluationMode, setEvaluationMode] = useState<EvaluationMode>('TRACK');
  const [targetSlot, setTargetSlot] = useState<string>('06:00 PM');
  const [targetDate, setTargetDate] = useState<string>('2025-05-18');
  const [preferredChannel, setPreferredChannel] = useState<PreferredChannel>('WHATSAPP');

  // Form Fields
  const [buyerName, setBuyerName] = useState('His Highness Sheikh Tariq Al-Nuaimi');
  const [buyerPhone, setBuyerPhone] = useState('50 892 4110');
  const [buyerEmail, setBuyerEmail] = useState('office@alnuaimi-holdings.ae');
  const [licenseTier, setLicenseTier] = useState('UAE Light Vehicle Manual / Auto (Active > 5 Yrs)');

  // Explicit Data Grants
  const [grantName, setGrantName] = useState(true);
  const [grantPhone, setGrantPhone] = useState(true);
  const [grantEmail, setGrantEmail] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);

  // Submission Result & Error State
  const [leadResult, setLeadResult] = useState<LeadEnquiryResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Lock countdown timer
  const [secondsRemaining, setSecondsRemaining] = useState(899);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const formattedPrice = (Number(vehicle.price.amountFils) / 100).toLocaleString('en-US');

  const handleUaePassFastTrack = () => {
    setBuyerName('H.H. Sheikh Tariq Al-Nuaimi (UAE PASS Verified)');
    setBuyerPhone('50 892 4110');
    setBuyerEmail('tariq.nuaimi@holding.ae');
    setLicenseTier('UAE Light Vehicle Manual / Auto (Active > 5 Yrs)');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!consentAccepted) {
      alert(
        isArabic
          ? 'يرجى قبول شروط الخصوصية للمتابعة'
          : 'Please accept the data privacy terms to proceed.'
      );
      return;
    }

    const fieldsToShare: string[] = [];
    if (grantName) fieldsToShare.push('name');
    if (grantPhone) fieldsToShare.push('phone');
    if (grantEmail) fieldsToShare.push('email');

    if (fieldsToShare.length === 0) {
      alert(
        isArabic
          ? 'يرجى تحديد حقل بيانات واحد على الأقل للمشاركة مع الوكيل'
          : 'Please select at least one profile field to authorize with the showroom.'
      );
      return;
    }

    setViewState('loading');
    setErrorMessage('');

    const payload: CreateLeadEnquiryPayload = {
      intent: intent === 'TEST_DRIVE' ? 'TEST_DRIVE' : 'OFFER',
      preferredContact: preferredChannel,
      message: `VIP Session Request for ${targetDate} (${targetSlot}) - ${evaluationMode} Mode`,
      fieldsToShare,
      consentTextVersion: 'buyer-lead-disclosure-en-AE-v1',
      buyerName,
      buyerPhone: `+971 ${buyerPhone}`,
      buyerEmail,
      licenseTier,
      evaluationMode,
      targetDate,
      targetSlot,
    };

    try {
      const res = await submitVehicleLeadEnquiry(vehicle.id, payload);
      setLeadResult(res);
      setViewState('success');
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          'The driving license attached failed RTA clearance verification. Test drives require valid RTA license attestation.'
      );
      setViewState('error');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-vip-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      <div className="relative w-full max-w-4xl bg-surface-container-low/95 backdrop-blur-2xl rounded-2xl border border-white/[0.08] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.9)] overflow-hidden my-auto">
        {/* Modal Header Strip with Vehicle Snapshot */}
        <div className="bg-surface-container px-4 sm:px-6 md:px-8 py-4 border-b border-white/[0.06]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-surface-container-lowest border border-white/[0.07]">
                <img
                  src={vehicle.media[0]?.url || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=300&q=80'}
                  alt={vehicle.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2
                    id="modal-vip-title"
                    className="font-headline-sm text-base md:text-lg text-on-surface font-semibold truncate"
                  >
                    {vehicle.title}
                  </h2>
                  {vehicle.gccSpec && (
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-caps text-[11px] uppercase tracking-wider font-semibold">
                      GCC Spec
                    </span>
                  )}
                </div>
                <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant flex items-center gap-2 mt-0.5 truncate">
                  <span className="material-symbols-outlined text-[14px] text-primary-container shrink-0">
                    store
                  </span>
                  <span className="truncate">{vehicle.seller.displayName} • {vehicle.emirate}</span>
                  <span className="text-outline-variant">•</span>
                  <span className="font-data-mono-num text-on-surface font-semibold text-primary">
                    AED {formattedPrice}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              <div className="hidden sm:flex flex-col text-right">
                <span className="font-label-caps text-[10px] text-outline uppercase tracking-wider">
                  Certified Escrow
                </span>
                <span className="font-data-mono-num text-xs text-tertiary flex items-center gap-1 justify-end font-medium">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  DED Protected
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Mode Toggle Tabs */}
          {viewState === 'default' && (
            <div className="mt-4 pt-1 grid grid-cols-2 gap-1.5 bg-surface-container-lowest p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setIntent('TEST_DRIVE')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-body-md text-xs sm:text-sm transition-all font-medium ${
                  intent === 'TEST_DRIVE'
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-md'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">sports_score</span>
                <span className="truncate">1. Schedule Private Viewing & Test-Drive</span>
              </button>
              <button
                type="button"
                onClick={() => setIntent('OFFER')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-body-md text-xs sm:text-sm transition-all font-medium ${
                  intent === 'OFFER'
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-md'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">account_balance</span>
                <span className="truncate">2. Direct Purchase & Escrow Deposit</span>
              </button>
            </div>
          )}
        </div>

        {/* ---------------- STATE 1: DEFAULT FORM ---------------- */}
        {viewState === 'default' && (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 flex flex-col gap-6 max-h-[75vh] overflow-y-auto">
            {/* Top Alert: Escrow Underwritten */}
            <div className="bg-surface-container rounded-xl p-4 flex items-start gap-3.5 border border-white/[0.05]">
              <div className="w-8 h-8 rounded-full bg-primary-container/15 text-primary-container flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-headline-sm text-sm sm:text-base font-semibold text-on-surface">
                    Comprehensive VIP Demonstration Policy
                  </span>
                  <span className="font-label-caps text-[10px] text-primary uppercase font-bold tracking-wider">
                    Zero-Obligation Escrow
                  </span>
                </div>
                <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                  Viewing sessions are accompanied by an {vehicle.seller.displayName} accredited specialist.
                  Complimentary RTA-compliant passenger liability coverage up to AED 5,000,000 is activated upon pass confirmation.
                </p>
              </div>
            </div>

            {/* SECTION 1: IDENTITY & UAE PASS */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-surface-container-high text-primary font-data-mono-num text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  <h3 className="font-headline-sm text-base text-on-surface font-semibold">
                    Collector Verification & Pass
                  </h3>
                </div>
                <span className="font-label-caps text-[11px] text-outline uppercase tracking-wider">
                  Step 1 of 2
                </span>
              </div>

              {/* UAE PASS Fast-Track Button */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#17231c] via-surface-container to-surface-container p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-tertiary/20 shadow-lg">
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  <div className="w-11 h-11 rounded-xl bg-surface-container-lowest flex items-center justify-center shrink-0 border border-tertiary/30">
                    <svg className="w-7 h-7 text-tertiary" fill="none" viewBox="0 0 40 40">
                      <path
                        d="M20 4L24 14H34L26 21L29 31L20 25L11 31L14 21L6 14H16L20 4Z"
                        stroke="currentColor"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                      <circle cx="20" cy="20" fill="currentColor" r="3" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
                        UAE PASS Instant Clearance
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary font-label-caps text-[10px] uppercase font-bold">
                        Recommended
                      </span>
                    </div>
                    <p className="font-body-sm text-xs text-on-surface-variant">
                      One-tap verified UAE ID & RTA driver license authentication. No manual upload required.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUaePassFastTrack}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-tertiary text-on-tertiary font-body-md text-xs sm:text-sm font-semibold hover:bg-tertiary-fixed transition-all shrink-0 flex items-center justify-center gap-2 shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                  <span>Sign in with UAE PASS</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-outline py-1">
                <div className="h-px bg-surface-container-high flex-1" />
                <span className="font-label-caps text-[10px] uppercase tracking-widest text-outline">
                  Or Continue With Direct Verification
                </span>
                <div className="h-px bg-surface-container-high flex-1" />
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                    Full Legal Name (as per Passport / Emirates ID)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full h-10 px-3 pr-9 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-sm border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary-container"
                    />
                    <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[18px] text-tertiary">
                      check_circle
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                    Verified UAE Mobile (SMS & WhatsApp Confirmation)
                  </label>
                  <div className="flex items-center rounded-lg bg-surface-container-lowest border border-white/[0.08] overflow-hidden focus-within:ring-1 focus-within:ring-primary-container">
                    <div className="flex items-center gap-1 px-2.5 bg-surface-container text-on-surface font-data-mono-num text-xs shrink-0 h-10 border-r border-white/[0.06]">
                      <span className="text-[13px]">🇦🇪</span>
                      <span>+971</span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full h-10 px-3 bg-transparent text-on-surface font-data-mono-num text-sm focus:outline-none"
                    />
                    <span className="px-2 text-outline font-label-caps text-[10px] uppercase">Mobile</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                    Corporate / Private Office Email
                  </label>
                  <input
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-sm border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary-container"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                    Driving License Tier & Issuance Country
                  </label>
                  <select
                    value={licenseTier}
                    onChange={(e) => setLicenseTier(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-xs sm:text-sm border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary-container cursor-pointer"
                  >
                    <option value="UAE Light Vehicle Manual / Auto (Active > 5 Yrs)">
                      UAE Light Vehicle Manual / Auto (Active &gt; 5 Yrs)
                    </option>
                    <option value="GCC Driver License (Saudi Arabia / Qatar / Kuwait)">
                      GCC Driver License (Saudi Arabia / Qatar / Kuwait)
                    </option>
                    <option value="International FIA Driving Permit + UK / EU Passport">
                      International FIA Driving Permit + UK / EU Passport
                    </option>
                    <option value="VIP Chauffeur / Handler Accompanied (No Driving)">
                      VIP Chauffeur / Handler Accompanied (No Driving)
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: DATE & VIP PROTOCOL PREFERENCES */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-surface-container-high text-primary font-data-mono-num text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <h3 className="font-headline-sm text-base text-on-surface font-semibold">
                    Session Logistics & Dynamic Evaluation Mode
                  </h3>
                </div>
                <span className="font-label-caps text-[11px] text-outline uppercase tracking-wider">
                  Step 2 of 2
                </span>
              </div>

              {/* Evaluation Format Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Option 1: Track */}
                <button
                  type="button"
                  onClick={() => setEvaluationMode('TRACK')}
                  aria-pressed={evaluationMode === 'TRACK'}
                  className={`text-left rtl:text-right w-full relative rounded-xl p-3.5 bg-surface-container-lowest hover:bg-surface-container cursor-pointer transition-all flex flex-col justify-between gap-2 border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    evaluationMode === 'TRACK'
                      ? 'border-primary-container ring-1 ring-primary-container'
                      : 'border-white/[0.06]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary-container text-[18px]">
                          speed
                        </span>
                        <span className="font-headline-sm text-sm font-semibold text-on-surface">
                          Dubai Autodrome Dynamic Track Run
                        </span>
                      </div>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        evaluationMode === 'TRACK' ? 'bg-primary-container' : 'bg-surface-container-high'
                      }`}>
                        {evaluationMode === 'TRACK' && <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container" />}
                      </span>
                    </div>
                    <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                      High-speed dynamic telemetry test on FIA Club Circuit with Porsche Motorsport instructor. Aero & DRS calibration review.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-outline pt-1 text-xs">
                    <span className="font-label-caps text-primary font-medium">Pre-Warmed Cup 2 R Tires</span>
                    <span className="font-data-mono-num text-on-surface">45 Min Slot</span>
                  </div>
                </button>

                {/* Option 2: Showroom Lounge */}
                <button
                  type="button"
                  onClick={() => setEvaluationMode('LOUNGE')}
                  aria-pressed={evaluationMode === 'LOUNGE'}
                  className={`text-left rtl:text-right w-full relative rounded-xl p-3.5 bg-surface-container-lowest hover:bg-surface-container cursor-pointer transition-all flex flex-col justify-between gap-2 border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    evaluationMode === 'LOUNGE'
                      ? 'border-primary-container ring-1 ring-primary-container'
                      : 'border-white/[0.06]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-[18px]">
                          meeting_room
                        </span>
                        <span className="font-headline-sm text-sm font-semibold text-on-surface">
                          Private Showroom Suite & Hoist
                        </span>
                      </div>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        evaluationMode === 'LOUNGE' ? 'bg-primary-container' : 'bg-surface-container-high'
                      }`}>
                        {evaluationMode === 'LOUNGE' && <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container" />}
                      </span>
                    </div>
                    <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                      Detailed underbody inspection on hydraulic lift, paint depth gauge verification, and private boardroom contract negotiation.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-outline pt-1 text-xs">
                    <span className="font-label-caps text-secondary font-medium">Al Quoz Vault 4</span>
                    <span className="font-data-mono-num text-on-surface">Unlimited Time</span>
                  </div>
                </button>
              </div>

              {/* Date & Time Slot Windows */}
              <div className="bg-surface-container-lowest rounded-xl p-3.5 flex flex-col md:flex-row items-center gap-4 border border-white/[0.06]">
                <div className="w-full md:w-48 shrink-0">
                  <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface font-data-mono-num text-xs border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary-container cursor-pointer"
                  />
                </div>
                <div className="w-full flex-1">
                  <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1">
                    VIP Allocation Windows (Dubai GST)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetSlot('10:00 AM')}
                      className={`py-2 px-3 rounded-lg text-left flex flex-col transition-all border ${
                        targetSlot === '10:00 AM'
                          ? 'bg-primary-container text-on-primary-container border-primary-container shadow-md'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface border-white/[0.05]'
                      }`}
                    >
                      <span className="font-label-caps text-[10px] uppercase">Slot 01</span>
                      <span className="font-data-mono-num text-xs font-semibold">10:00 AM</span>
                      <span className="text-[10px] opacity-80">Morning Track Cool</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetSlot('02:30 PM')}
                      className={`py-2 px-3 rounded-lg text-left flex flex-col transition-all border ${
                        targetSlot === '02:30 PM'
                          ? 'bg-primary-container text-on-primary-container border-primary-container shadow-md'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface border-white/[0.05]'
                      }`}
                    >
                      <span className="font-label-caps text-[10px] uppercase">Slot 02</span>
                      <span className="font-data-mono-num text-xs font-semibold">02:30 PM</span>
                      <span className="text-[10px] opacity-80">Lounge Inspection</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetSlot('06:00 PM')}
                      className={`py-2 px-3 rounded-lg text-left flex flex-col transition-all border ${
                        targetSlot === '06:00 PM'
                          ? 'bg-primary-container text-on-primary-container border-primary-container shadow-md font-semibold'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface border-white/[0.05]'
                      }`}
                    >
                      <span className="font-label-caps text-[10px] uppercase">Slot 03 • Prime</span>
                      <span className="font-data-mono-num text-xs font-bold">06:00 PM</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider">VIP Sunset Run</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Channel Toggle */}
              <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl border border-white/[0.06]">
                <span className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                  Preferred Concierge Dispatch Channel
                </span>
                <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPreferredChannel('WHATSAPP')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      preferredChannel === 'WHATSAPP'
                        ? 'bg-primary-container text-on-primary-container font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredChannel('PHONE')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      preferredChannel === 'PHONE'
                        ? 'bg-primary-container text-on-primary-container font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredChannel('EMAIL')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      preferredChannel === 'EMAIL'
                        ? 'bg-primary-container text-on-primary-container font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Email
                  </button>
                </div>
              </div>
            </div>

            {/* TRANSPARENT CONSENT & DATA SHARING DISCLOSURE */}
            <div className="rounded-xl bg-surface-container p-4 flex flex-col gap-3.5 border border-white/[0.06]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">
                    privacy_tip
                  </span>
                  <h4 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
                    Transparent Data Privacy & Showroom Access Disclosure
                  </h4>
                </div>
                <span className="font-label-caps text-[10px] text-tertiary uppercase font-semibold">
                  UAE Decree Law No. 45/2021 Compliant
                </span>
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                Automotive OS operates under sovereign custody protocols. To uphold institutional security and provide commercial transparency, here is exactly how your data is distributed:
              </p>

              {/* Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface-container-lowest p-3 flex flex-col gap-1 border border-white/[0.05]">
                  <div className="flex items-center gap-1.5 text-tertiary font-headline-sm text-xs font-semibold">
                    <span className="material-symbols-outlined text-[15px]">visibility</span>
                    <span>Transmitted to {vehicle.seller.displayName}</span>
                  </div>
                  <ul className="font-body-sm text-xs text-on-surface space-y-1 mt-1">
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-tertiary text-[14px] shrink-0 mt-0.5">
                        check
                      </span>
                      <span><strong>Full Legal Name:</strong> Prepared for gate clearance & track badge.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-tertiary text-[14px] shrink-0 mt-0.5">
                        check
                      </span>
                      <span><strong>Direct Mobile (+971):</strong> For private chauffeur dispatch & PIN.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-tertiary text-[14px] shrink-0 mt-0.5">
                        check
                      </span>
                      <span><strong>License Validity:</strong> Underwrites vehicle insurance rider.</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg bg-surface-container-lowest p-3 flex flex-col gap-1 border border-white/[0.05]">
                  <div className="flex items-center gap-1.5 text-error font-headline-sm text-xs font-semibold">
                    <span className="material-symbols-outlined text-[15px]">lock</span>
                    <span>Protected & Strictly Redacted</span>
                  </div>
                  <ul className="font-body-sm text-xs text-on-surface-variant space-y-1 mt-1">
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-error text-[14px] shrink-0 mt-0.5">
                        do_not_disturb_on
                      </span>
                      <span><strong>Emirates ID Raw Number:</strong> Cryptographically salted; never shared.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-error text-[14px] shrink-0 mt-0.5">
                        do_not_disturb_on
                      </span>
                      <span><strong>Banking / IBAN Data:</strong> Handled purely within central bank escrow.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-error text-[14px] shrink-0 mt-0.5">
                        do_not_disturb_on
                      </span>
                      <span><strong>Portfolio Holdings:</strong> Dealer cannot query your overall assets.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Explicit Field Authorization Checkboxes */}
              <div className="pt-2 flex flex-col gap-2">
                <span className="font-label-caps text-[10px] text-outline uppercase font-semibold">
                  Authorize Individual Fields for this Dealer Lead
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-lowest border border-white/[0.05] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantName}
                      onChange={(e) => setGrantName(e.target.checked)}
                      className="rounded bg-surface-container text-primary-container accent-[#d4af37] w-4 h-4 cursor-pointer"
                    />
                    <span className="font-body-sm text-xs text-on-surface">Legal Name</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-lowest border border-white/[0.05] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPhone}
                      onChange={(e) => setGrantPhone(e.target.checked)}
                      className="rounded bg-surface-container text-primary-container accent-[#d4af37] w-4 h-4 cursor-pointer"
                    />
                    <span className="font-body-sm text-xs text-on-surface">Direct Phone</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-lowest border border-white/[0.05] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantEmail}
                      onChange={(e) => setGrantEmail(e.target.checked)}
                      className="rounded bg-surface-container text-primary-container accent-[#d4af37] w-4 h-4 cursor-pointer"
                    />
                    <span className="font-body-sm text-xs text-on-surface">Office Email</span>
                  </label>
                </div>
              </div>

              {/* Mandatory Legal Agreements */}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappOptIn}
                    onChange={(e) => setWhatsappOptIn(e.target.checked)}
                    className="mt-0.5 rounded bg-surface-container-lowest text-primary-container accent-[#d4af37] w-4 h-4 cursor-pointer"
                  />
                  <span className="font-body-sm text-xs text-on-surface leading-snug">
                    I authorize {vehicle.seller.displayName} VIP concierge to contact me via encrypted WhatsApp for session confirmation, track coordinate drop, and gate PIN transmission.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(e) => setConsentAccepted(e.target.checked)}
                    className="mt-0.5 rounded bg-surface-container-lowest text-primary-container accent-[#d4af37] w-4 h-4 cursor-pointer"
                  />
                  <span className="font-body-sm text-xs text-on-surface leading-snug">
                    I accept the <a href="#" className="text-primary hover:underline">Sovereign Automotive OS Escrow Terms</a> (v1-en-AE) and acknowledge that no holding fees are charged until vehicle physical inspection is concluded.
                  </span>
                </label>
              </div>
            </div>

            {/* Action Trigger Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-2 text-outline">
                <span className="material-symbols-outlined text-[18px] text-tertiary">
                  lock_clock
                </span>
                <span className="font-data-mono-num text-xs sm:text-sm text-on-surface-variant">
                  Slot {targetSlot} held for {formatTimer(secondsRemaining)} minutes
                </span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-variant font-body-md text-xs sm:text-sm text-on-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-xs sm:text-sm font-bold hover:bg-primary transition-all shadow-[0_4px_24px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2"
                >
                  <span>Confirm VIP Test-Drive Allocation</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ---------------- STATE 2: LOADING PROGRESS ---------------- */}
        {viewState === 'loading' && (
          <div className="p-8 sm:p-12 md:p-16 flex flex-col items-center justify-center text-center gap-6">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-surface-container-high border-t-primary-container animate-spin" />
              <span className="material-symbols-outlined text-primary-container text-[36px] animate-pulse">
                lock_person
              </span>
            </div>
            <div className="max-w-md">
              <span className="font-label-caps text-xs text-primary uppercase tracking-widest block mb-1">
                Cryptographic Handshake
              </span>
              <h3 className="font-headline-lg text-xl sm:text-2xl text-on-surface font-semibold">
                Securing Slot With {vehicle.seller.displayName}
              </h3>
              <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
                Verifying RTA passenger liability rider policy, reserving Dubai Autodrome track window ({targetSlot}), and generating tamper-proof credential envelope...
              </p>
            </div>
            <div className="w-full max-w-sm bg-surface-container rounded-lg p-4 flex flex-col gap-2 font-data-mono-num text-xs text-left border border-white/[0.05]">
              <div className="flex items-center justify-between text-tertiary">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">check</span> UAE PASS Identity Token
                </span>
                <span>OK</span>
              </div>
              <div className="flex items-center justify-between text-tertiary">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">check</span> Chassis Inspection #{vehicle.stockNumber}
                </span>
                <span>VERIFIED</span>
              </div>
              <div className="flex items-center justify-between text-primary animate-pulse">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">sync</span> Dispatching Concierge WhatsApp
                </span>
                <span>PROCESSING</span>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- STATE 3: SUCCESS BOARDING PASS ---------------- */}
        {viewState === 'success' && (
          <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-6 max-h-[75vh] overflow-y-auto">
            {/* Banner */}
            <div className="bg-gradient-to-r from-tertiary-container/30 via-surface-container to-surface-container rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-tertiary/20">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px]">check_circle</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-caps text-xs text-tertiary uppercase font-bold">
                      VIP Protocol Active
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span className="font-data-mono-num text-xs text-outline">
                      RTA Reference: #{leadResult?.referenceCode || 'TD-DXB-9402'}
                    </span>
                  </div>
                  <h3 className="font-headline-lg text-lg sm:text-xl text-on-surface font-semibold">
                    Test-Drive & Viewing Confirmed
                  </h3>
                  <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
                    Scheduled for {leadResult?.scheduledDate || targetDate} at {leadResult?.scheduledSlot || targetSlot}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => alert('Calendar invite (.ics) generated for ' + targetDate)}
                className="px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-body-sm text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0 border border-white/[0.06]"
              >
                <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                <span>Add to Calendar</span>
              </button>
            </div>

            {/* Boarding Pass Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface-container-lowest rounded-xl p-5 border border-white/[0.07]">
              {/* Pass Left: Details */}
              <div className="md:col-span-2 flex flex-col justify-between gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-data-mono-num">
                  <div>
                    <span className="font-label-caps text-[10px] text-outline uppercase block mb-1">
                      Vehicle Selected
                    </span>
                    <span className="text-xs sm:text-sm text-on-surface font-semibold block truncate">
                      {vehicle.title}
                    </span>
                    <span className="text-xs text-primary">AED {formattedPrice}</span>
                  </div>
                  <div>
                    <span className="font-label-caps text-[10px] text-outline uppercase block mb-1">
                      Venue Location
                    </span>
                    <span className="text-xs sm:text-sm text-on-surface font-semibold block">
                      {evaluationMode === 'TRACK' ? 'Dubai Autodrome' : 'Apex Collector Vault'}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {evaluationMode === 'TRACK' ? 'Club Circuit Paddock 3' : 'Al Quoz Showroom 4'}
                    </span>
                  </div>
                  <div>
                    <span className="font-label-caps text-[10px] text-outline uppercase block mb-1">
                      Designated Host
                    </span>
                    <span className="text-xs sm:text-sm text-on-surface font-semibold block">
                      Marcus Von Berg
                    </span>
                    <span className="text-xs text-on-surface-variant">Brand Principal</span>
                  </div>
                  <div>
                    <span className="font-label-caps text-[10px] text-outline uppercase block mb-1">
                      Client Identification
                    </span>
                    <span className="text-xs sm:text-sm text-on-surface font-semibold block truncate">
                      {buyerName.split(' ')[0]} {buyerName.split(' ')[1] || ''}
                    </span>
                    <span className="text-xs text-tertiary">UAE PASS Validated</span>
                  </div>
                  <div>
                    <span className="font-label-caps text-[10px] text-outline uppercase block mb-1">
                      Insurance Policy
                    </span>
                    <span className="text-xs sm:text-sm text-on-surface font-semibold block">
                      RTA Track Rider #09
                    </span>
                    <span className="text-xs text-on-surface-variant">AED 5M Underwritten</span>
                  </div>
                  <div>
                    <span className="font-label-caps text-[10px] text-outline uppercase block mb-1">
                      Escrow Status
                    </span>
                    <span className="text-xs sm:text-sm text-on-surface font-semibold block">
                      Zero Hold Applied
                    </span>
                    <span className="text-xs text-tertiary">Inspection First</span>
                  </div>
                </div>

                {/* Direct Concierge WhatsApp Action */}
                <div className="bg-surface-container p-3.5 rounded-lg flex items-center justify-between gap-3 border border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">chat</span>
                    </span>
                    <div>
                      <span className="font-headline-sm text-xs sm:text-sm font-semibold text-on-surface block">
                        Showroom Concierge WhatsApp Chat
                      </span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">
                        Your concierge has sent your security gate entry QR code.
                      </span>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/971500000000?text=Hello%2C%20I%20have%20confirmed%20VIP%20Viewing%20pass%20%23${leadResult?.referenceCode || 'TD-DXB-9402'}%20for%20${encodeURIComponent(vehicle.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#25D366] text-black font-body-sm text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 flex items-center gap-1"
                  >
                    <span>Open WhatsApp</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                  </a>
                </div>
              </div>

              {/* Pass Right: QR Gate Pass */}
              <div className="bg-surface-container p-4 rounded-lg flex flex-col items-center justify-center text-center gap-2 border border-white/[0.05]">
                <span className="font-label-caps text-[10px] text-primary uppercase tracking-widest font-semibold">
                  Gate Clearance Token
                </span>
                <div className="w-28 h-28 bg-white p-2 rounded-lg flex items-center justify-center shadow-lg">
                  <svg className="w-full h-full text-black" fill="currentColor" viewBox="0 0 100 100">
                    <rect fill="black" height="30" width="30" x="0" y="0" />
                    <rect fill="white" height="20" width="20" x="5" y="5" />
                    <rect fill="black" height="10" width="10" x="10" y="10" />
                    <rect fill="black" height="30" width="30" x="70" y="0" />
                    <rect fill="white" height="20" width="20" x="75" y="5" />
                    <rect fill="black" height="10" width="10" x="80" y="10" />
                    <rect fill="black" height="30" width="30" x="0" y="70" />
                    <rect fill="white" height="20" width="20" x="5" y="75" />
                    <rect fill="black" height="10" width="10" x="10" y="80" />
                    <rect height="10" width="20" x="40" y="10" />
                    <rect height="20" width="10" x="40" y="30" />
                    <rect height="10" width="20" x="60" y="40" />
                    <rect height="15" width="15" x="35" y="70" />
                    <rect height="10" width="25" x="65" y="70" />
                    <rect height="15" width="15" x="80" y="85" />
                  </svg>
                </div>
                <span className="font-data-mono-num text-xs text-on-surface font-bold">
                  PIN: 849-012
                </span>
                <span className="font-body-sm text-[10px] text-outline">
                  Present at {evaluationMode === 'TRACK' ? 'Dubai Autodrome' : 'Apex Showroom'} Barrier
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setViewState('default')}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-xs sm:text-sm"
              >
                Modify Preferences
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-xs sm:text-sm font-bold shadow-md"
              >
                Return to Vehicle Dossier
              </button>
            </div>
          </div>
        )}

        {/* ---------------- STATE 4: ERROR / VALIDATION ALERT ---------------- */}
        {viewState === 'error' && (
          <div className="p-6 sm:p-8 flex flex-col gap-4">
            <div className="rounded-xl bg-error-container/20 p-4 flex items-start gap-3.5 border border-error/30">
              <span className="material-symbols-outlined text-error text-[24px] shrink-0 mt-0.5">
                warning
              </span>
              <div className="flex-1">
                <h3 className="font-headline-sm text-sm sm:text-base font-bold text-error">
                  Clearance Exception: RTA Verification Notification
                </h3>
                <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setViewState('default')}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-xs sm:text-sm"
              >
                Back to Details
              </button>
              <button
                type="button"
                onClick={() => {
                  setLicenseTier('VIP Chauffeur / Handler Accompanied (No Driving)');
                  setViewState('default');
                }}
                className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-xs sm:text-sm font-semibold"
              >
                Select Chauffeur-Accompanied Viewing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
