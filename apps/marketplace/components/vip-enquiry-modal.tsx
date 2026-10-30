'use client';

import React, { useEffect, useState } from 'react';
import {
  PublicListingDetail,
  submitVehicleLeadEnquiry,
  LeadEnquiryResponse,
  CreateLeadEnquiryPayload,
  fetchBuyerMe,
  BuyerMe,
} from '../lib/api';
import { BuyerAuthRequiredError } from '../lib/buyer-api-client';

export interface VipEnquiryModalProps {
  vehicle: PublicListingDetail;
  isOpen: boolean;
  onClose: () => void;
  locale?: 'en' | 'ar';
}

type ViewState = 'default' | 'loading' | 'success' | 'error';
type PreferredChannel = 'WHATSAPP' | 'PHONE' | 'EMAIL';
type Intent = 'TEST_DRIVE' | 'OFFER';

const CONSENT_TEXT_VERSION = 'buyer-lead-disclosure-en-AE-v1';

/** Tomorrow's date in Asia/Dubai as YYYY-MM-DD. */
function dubaiTomorrow(): string {
  return new Date(Date.now() + 4 * 3600 * 1000 + 24 * 3600 * 1000).toISOString().slice(0, 10);
}

export const VipEnquiryModal: React.FC<VipEnquiryModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  locale = 'en',
}) => {
  const isArabic = locale === 'ar';
  const [viewState, setViewState] = useState<ViewState>('default');
  const [intent, setIntent] = useState<Intent>('TEST_DRIVE');
  const [targetDate, setTargetDate] = useState<string>(dubaiTomorrow);
  const [targetTime, setTargetTime] = useState<string>('');
  const [preferredChannel, setPreferredChannel] = useState<PreferredChannel>('PHONE');
  const [note, setNote] = useState('');

  // Explicit, opt-in data grants (PDPL): nothing is pre-selected.
  const [grantName, setGrantName] = useState(false);
  const [grantPhone, setGrantPhone] = useState(false);
  const [grantEmail, setGrantEmail] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [me, setMe] = useState<BuyerMe | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [leadResult, setLeadResult] = useState<LeadEnquiryResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetchBuyerMe()
      .then((data) => {
        if (!cancelled) {
          setMe(data);
          setSignedOut(false);
        }
      })
      .catch((err) => {
        if (!cancelled && err instanceof BuyerAuthRequiredError) setSignedOut(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formattedPrice = (Number(vehicle.price.amountFils) / 100).toLocaleString('en-US');
  const loginHref =
    typeof window !== 'undefined'
      ? `/auth?tab=login&redirect=${encodeURIComponent(window.location.pathname)}`
      : '/auth?tab=login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const fieldsToShare: string[] = [];
    if (grantName) fieldsToShare.push('name');
    if (grantPhone) fieldsToShare.push('phone');
    if (grantEmail) fieldsToShare.push('email');

    if (fieldsToShare.length === 0) {
      setValidationError(
        isArabic
          ? 'اختر حقلًا واحدًا على الأقل لمشاركته مع الوكيل.'
          : 'Select at least one detail the dealer may use to contact you.'
      );
      return;
    }
    if (!consentAccepted) {
      setValidationError(
        isArabic ? 'يجب الموافقة على مشاركة البيانات للمتابعة.' : 'Please confirm consent to share the selected details.'
      );
      return;
    }

    const preferred = [targetDate && `date ${targetDate}`, targetTime && `time ${targetTime} GST`]
      .filter(Boolean)
      .join(', ');
    const message = [preferred ? `Preferred ${preferred}.` : '', note.trim()].filter(Boolean).join(' ');

    const payload: CreateLeadEnquiryPayload = {
      intent,
      preferredContact: preferredChannel,
      message: message || undefined,
      fieldsToShare,
      consentTextVersion: CONSENT_TEXT_VERSION,
    };

    setViewState('loading');
    setErrorMessage('');
    try {
      const res = await submitVehicleLeadEnquiry(vehicle.id, payload);
      setLeadResult(res);
      setViewState('success');
    } catch (err) {
      if (err instanceof BuyerAuthRequiredError) {
        setSignedOut(true);
        setErrorMessage(
          isArabic ? 'يرجى تسجيل الدخول لإرسال الاستفسار. لم يتم إرسال أي شيء.' : 'Please sign in to send an enquiry. Nothing was submitted.'
        );
      } else {
        setErrorMessage(
          err instanceof Error && err.message
            ? err.message
            : 'The enquiry could not be submitted. No data was shared with the dealer.'
        );
      }
      setViewState('error');
    }
  };

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      active ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant hover:text-on-surface'
    }`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-vip-title"
      dir={isArabic ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      <div className="relative w-full max-w-3xl bg-surface-container-low/95 backdrop-blur-2xl rounded-2xl border border-white/[0.08] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.9)] overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-surface-container px-4 sm:px-6 md:px-8 py-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-surface-container-lowest border border-white/[0.07]">
                {vehicle.media[0]?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vehicle.media[0].url} alt={vehicle.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <h2 id="modal-vip-title" className="font-headline-sm text-base md:text-lg text-on-surface font-semibold truncate">
                  {vehicle.title}
                </h2>
                <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant truncate">
                  {vehicle.seller.displayName} • {vehicle.emirate} •{' '}
                  <span className="font-data-mono-num font-semibold text-primary">AED {formattedPrice}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
              aria-label={isArabic ? 'إغلاق' : 'Close dialog'}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
            </button>
          </div>

          {viewState === 'default' && (
            <div className="mt-4 grid grid-cols-2 gap-1.5 bg-surface-container-lowest p-1 rounded-xl" role="radiogroup" aria-label="Enquiry type">
              {(
                [
                  ['TEST_DRIVE', isArabic ? 'معاينة / تجربة قيادة' : 'Viewing / test drive', 'sports_score'],
                  ['OFFER', isArabic ? 'تقديم عرض' : 'Make an offer', 'request_quote'],
                ] as const
              ).map(([value, label, icon]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={intent === value}
                  onClick={() => setIntent(value)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-body-md text-xs sm:text-sm transition-all font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    intent === value
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-md'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{icon}</span>
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {viewState === 'default' && (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 flex flex-col gap-6 max-h-[75vh] overflow-y-auto" noValidate>
            {signedOut && (
              <div role="status" className="rounded-xl bg-surface-container p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/[0.06]">
                <span className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
                  {isArabic ? 'يجب تسجيل الدخول لإرسال استفسار.' : 'You need to sign in to send an enquiry.'}
                </span>
                <a
                  href={loginHref}
                  className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-xs font-bold text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {isArabic ? 'تسجيل الدخول' : 'Sign in'}
                </a>
              </div>
            )}

            {/* Identity */}
            <div className="flex flex-col gap-3">
              <h3 className="font-headline-sm text-base text-on-surface font-semibold">
                {isArabic ? 'بياناتك' : 'Your details'}
              </h3>
              <div className="rounded-xl bg-surface-container-lowest p-4 border border-white/[0.06] flex flex-col gap-1">
                <span className="text-sm text-on-surface font-semibold">{me?.displayName || '—'}</span>
                <span className="text-xs text-on-surface-variant">{me?.email || '—'}</span>
                <span className="text-[11px] text-outline mt-1">
                  {isArabic
                    ? 'تُستخدم بيانات حسابك. يمكنك تعديلها من الإعدادات.'
                    : 'Details come from your account. You can change them in account settings.'}
                </span>
              </div>
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="self-start px-4 py-2 rounded-lg border border-white/[0.08] text-outline text-xs font-semibold cursor-not-allowed"
              >
                {isArabic ? 'تسجيل الدخول عبر UAE PASS — قريبًا' : 'Sign in with UAE PASS — Coming soon'}
              </button>
            </div>

            {/* Logistics */}
            <div className="flex flex-col gap-3">
              <h3 className="font-headline-sm text-base text-on-surface font-semibold">
                {isArabic ? 'الموعد المفضل (اختياري)' : 'Preferred time (optional)'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="enq-date" className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                    {isArabic ? 'التاريخ' : 'Date'}
                  </label>
                  <input
                    id="enq-date"
                    type="date"
                    min={dubaiTomorrow()}
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-data-mono-num text-xs border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary-container [color-scheme:dark]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="enq-time" className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                    {isArabic ? 'الوقت (بتوقيت الخليج)' : 'Time (GST)'}
                  </label>
                  <input
                    id="enq-time"
                    type="time"
                    value={targetTime}
                    onChange={(e) => setTargetTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-data-mono-num text-xs border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary-container [color-scheme:dark]"
                  />
                </div>
              </div>
              <p className="text-[11px] text-outline">
                {isArabic
                  ? 'هذا طلب فقط؛ يؤكد الوكيل الموعد لاحقًا.'
                  : 'This is a request only; the dealer confirms the actual appointment.'}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-container-lowest rounded-xl border border-white/[0.06]">
                <span id="enq-channel" className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                  {isArabic ? 'طريقة التواصل المفضلة' : 'Preferred contact channel'}
                </span>
                <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg" role="radiogroup" aria-labelledby="enq-channel">
                  {(['PHONE', 'WHATSAPP', 'EMAIL'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={preferredChannel === c}
                      onClick={() => setPreferredChannel(c)}
                      className={chip(preferredChannel === c)}
                    >
                      {c === 'PHONE' ? (isArabic ? 'هاتف' : 'Phone') : c === 'WHATSAPP' ? 'WhatsApp' : isArabic ? 'بريد' : 'Email'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="enq-note" className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                  {isArabic ? 'رسالة إلى الوكيل (اختياري)' : 'Message to the dealer (optional)'}
                </label>
                <textarea
                  id="enq-note"
                  rows={3}
                  maxLength={1000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-sm border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
            </div>

            {/* Consent */}
            <fieldset className="rounded-xl bg-surface-container p-4 flex flex-col gap-3.5 border border-white/[0.06]">
              <legend className="sr-only">{isArabic ? 'مشاركة البيانات' : 'Data sharing'}</legend>
              <h4 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
                {isArabic ? 'ما الذي تشاركه مع الوكيل' : 'What you share with this dealer'}
              </h4>
              <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                {isArabic
                  ? `يرى ${vehicle.seller.displayName} فقط الحقول التي تختارها أدناه، لغرض الرد على هذا الاستفسار. يمكنك سحب الصلاحية لاحقًا من صفحة استفساراتك.`
                  : `${vehicle.seller.displayName} only sees the fields you select below, to respond to this enquiry. You can revoke access later from My enquiries.`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    [grantName, setGrantName, isArabic ? 'الاسم' : 'Name'],
                    [grantPhone, setGrantPhone, isArabic ? 'الهاتف' : 'Phone'],
                    [grantEmail, setGrantEmail, isArabic ? 'البريد الإلكتروني' : 'Email'],
                  ] as const
                ).map(([checked, setter, label]) => (
                  <label key={label} className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-lowest border border-white/[0.05] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setter(e.target.checked)}
                      className="rounded bg-surface-container accent-[#d4af37] w-4 h-4 cursor-pointer"
                    />
                    <span className="font-body-sm text-xs text-on-surface">{label}</span>
                  </label>
                ))}
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-white/[0.06]">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 rounded bg-surface-container-lowest accent-[#d4af37] w-4 h-4 cursor-pointer"
                />
                <span className="font-body-sm text-xs text-on-surface leading-snug">
                  {isArabic
                    ? `أوافق على مشاركة الحقول المحددة مع ${vehicle.seller.displayName} لهذا الاستفسار.`
                    : `I consent to sharing the selected details with ${vehicle.seller.displayName} for this enquiry.`}
                </span>
              </label>
            </fieldset>

            {validationError && (
              <p role="alert" className="text-xs text-error">
                {validationError}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-variant font-body-md text-xs sm:text-sm text-on-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={signedOut}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-xs sm:text-sm font-bold hover:bg-primary transition-all shadow-[0_4px_24px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-primary"
              >
                <span>{isArabic ? 'إرسال الاستفسار' : 'Send enquiry'}</span>
                <span className="material-symbols-outlined text-[18px] rtl:rotate-180" aria-hidden="true">arrow_forward</span>
              </button>
            </div>
          </form>
        )}

        {viewState === 'loading' && (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-4" role="status">
            <div className="w-14 h-14 rounded-full border-4 border-surface-container-high border-t-primary-container animate-spin" />
            <p className="font-body-md text-sm text-on-surface-variant">
              {isArabic ? 'جارٍ إرسال الاستفسار…' : 'Sending your enquiry…'}
            </p>
          </div>
        )}

        {viewState === 'success' && (
          <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-6">
            <div className="bg-gradient-to-r from-tertiary-container/30 via-surface-container to-surface-container rounded-xl p-4 sm:p-5 flex items-center gap-3.5 border border-tertiary/20" role="status">
              <div className="w-12 h-12 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]" aria-hidden="true">check_circle</span>
              </div>
              <div>
                <span className="font-data-mono-num text-xs text-outline">
                  {isArabic ? 'المرجع' : 'Reference'} #{leadResult?.referenceCode}
                </span>
                <h3 className="font-headline-lg text-lg sm:text-xl text-on-surface font-semibold">
                  {isArabic ? 'تم إرسال الاستفسار' : 'Enquiry sent'}
                </h3>
                <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
                  {isArabic
                    ? `سيتواصل ${vehicle.seller.displayName} معك لتأكيد التفاصيل.`
                    : `${vehicle.seller.displayName} will contact you to confirm details. No appointment is booked until the dealer confirms it.`}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <a
                href="/account/enquiries"
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-xs sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {isArabic ? 'استفساراتي' : 'View my enquiries'}
              </a>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-xs sm:text-sm font-bold shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        )}

        {viewState === 'error' && (
          <div className="p-6 sm:p-8 flex flex-col gap-4">
            <div role="alert" className="rounded-xl bg-error-container/20 p-4 flex items-start gap-3.5 border border-error/30">
              <span className="material-symbols-outlined text-error text-[24px] shrink-0 mt-0.5" aria-hidden="true">warning</span>
              <div className="flex-1">
                <h3 className="font-headline-sm text-sm sm:text-base font-bold text-error">
                  {isArabic ? 'لم يتم إرسال الاستفسار' : 'Enquiry not sent'}
                </h3>
                <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              {signedOut && (
                <a
                  href={loginHref}
                  className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-xs sm:text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {isArabic ? 'تسجيل الدخول' : 'Sign in'}
                </a>
              )}
              <button
                type="button"
                onClick={() => setViewState('default')}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-xs sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {isArabic ? 'رجوع' : 'Back'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
