'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarClock, CalendarX, Car, Loader2 } from 'lucide-react';
import { BuyerAppointmentItem, cancelBuyerAppointment, rescheduleBuyerAppointment } from '../lib/api';
import { BuyerAuthRequiredError } from '../lib/buyer-api-client';
import { AccountShell, AccountCard, StatusMessage, formatDubai, useAccountLocale } from './account-shell';

interface BuyerGarageViewProps {
  initialAppointments: BuyerAppointmentItem[];
  displayName?: string;
}

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  REQUESTED: { en: 'Awaiting dealer confirmation', ar: 'بانتظار تأكيد الوكيل' },
  PENDING: { en: 'Awaiting dealer confirmation', ar: 'بانتظار تأكيد الوكيل' },
  CONFIRMED: { en: 'Confirmed', ar: 'مؤكد' },
  CANCELLED: { en: 'Cancelled', ar: 'ملغى' },
  COMPLETED: { en: 'Completed', ar: 'مكتمل' },
  NO_SHOW: { en: 'Missed', ar: 'لم يحضر' },
};

/** `datetime-local` value (entered as Gulf Standard Time, UTC+4, no DST) to UTC ISO. */
function dubaiLocalToUtcIso(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const d = new Date(`${local}:00+04:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Current Dubai wall-clock time as a `datetime-local` min value. */
function dubaiNowLocal(): string {
  const d = new Date(Date.now() + 4 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

export function BuyerGarageView({ initialAppointments, displayName }: BuyerGarageViewProps) {
  return (
    <AccountShell
      displayName={displayName}
      title="Appointments & test drives"
      titleAr="المواعيد والتجارب"
      subtitle="Viewings and test drives you requested through dealer enquiries. Times are shown in Gulf Standard Time."
      subtitleAr="المعاينات والتجارب التي طلبتها. الأوقات بتوقيت الخليج."
    >
      <GarageBody initialAppointments={initialAppointments} />
    </AccountShell>
  );
}

function GarageBody({ initialAppointments }: { initialAppointments: BuyerAppointmentItem[] }) {
  const { isArabic } = useAccountLocale();
  const router = useRouter();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState('');
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  // Appointment ids whose thumbnail failed to load; they fall back to the car icon (MK-10).
  const [brokenImages, setBrokenImages] = useState<Set<string>>(() => new Set());

  const handleAuthError = (err: unknown) => {
    if (err instanceof BuyerAuthRequiredError) {
      router.push(`/auth?tab=login&redirect=${encodeURIComponent('/account/garage')}`);
      return true;
    }
    return false;
  };

  const handleCancel = async (appt: BuyerAppointmentItem) => {
    if (!window.confirm(isArabic ? 'هل تريد إلغاء هذا الموعد؟' : 'Cancel this appointment?')) return;
    setBusyId(appt.id);
    setMessage(null);
    try {
      await cancelBuyerAppointment(appt.id);
      setAppointments((prev) => prev.map((a) => (a.id === appt.id ? { ...a, status: 'CANCELLED' } : a)));
      setMessage({ kind: 'success', text: isArabic ? 'تم إلغاء الموعد.' : 'Appointment cancelled.' });
    } catch (err) {
      if (handleAuthError(err)) return;
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Cancellation failed.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleReschedule = async (appt: BuyerAppointmentItem) => {
    const startsAt = dubaiLocalToUtcIso(rescheduleValue);
    if (!startsAt || new Date(startsAt).getTime() <= Date.now()) {
      setMessage({ kind: 'error', text: isArabic ? 'اختر وقتًا مستقبليًا صالحًا.' : 'Choose a valid future date and time.' });
      return;
    }
    const originalMs = new Date(appt.endsAt).getTime() - new Date(appt.startsAt).getTime();
    const durationMs = Number.isFinite(originalMs) && originalMs > 0 ? originalMs : 60 * 60 * 1000;
    const endsAt = new Date(new Date(startsAt).getTime() + durationMs).toISOString();

    setBusyId(appt.id);
    setMessage(null);
    try {
      const updated = await rescheduleBuyerAppointment(appt.id, startsAt, endsAt);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appt.id
            ? { ...a, startsAt: updated.startsAt, endsAt: updated.endsAt, status: updated.status || a.status }
            : a
        )
      );
      setRescheduleId(null);
      setRescheduleValue('');
      setMessage({
        kind: 'success',
        text: isArabic ? 'تم إرسال طلب إعادة الجدولة.' : 'Reschedule request sent to the dealer.',
      });
    } catch (err) {
      if (handleAuthError(err)) return;
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Reschedule failed.' });
    } finally {
      setBusyId(null);
    }
  };

  const upcoming = appointments.filter((a) => a.status !== 'CANCELLED');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-[#181c21]/70 backdrop-blur-xl border border-[#262a30] shadow-lg self-start">
        <div className="flex flex-col">
          <span className="text-[11px] text-[#d0c5af] uppercase tracking-wider font-semibold">
            {isArabic ? 'مواعيد نشطة' : 'Active bookings'}
          </span>
          <span className="text-2xl text-[#f2ca50] font-bold">{upcoming.length}</span>
        </div>
      </div>

      {message && <StatusMessage kind={message.kind}>{message.text}</StatusMessage>}

      {appointments.length === 0 ? (
        <AccountCard className="flex flex-col items-center text-center py-16 gap-4">
          <CalendarClock className="w-10 h-10 text-[#f2ca50]" aria-hidden="true" />
          <h2 className="text-xl font-bold text-[#e0e2ea]">{isArabic ? 'لا توجد مواعيد' : 'No appointments yet'}</h2>
          <p className="text-sm text-[#d0c5af] max-w-md">
            {isArabic
              ? 'اطلب معاينة أو تجربة قيادة من صفحة أي سيارة.'
              : 'Request a viewing or test drive from any vehicle page.'}
          </p>
          <Link
            href="/cars"
            className="px-6 py-3 rounded-xl bg-[#f2ca50] text-[#241a00] font-bold text-sm uppercase tracking-wider hover:bg-[#e9c349] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]"
          >
            {isArabic ? 'تصفح السيارات' : 'Browse vehicles'}
          </Link>
        </AccountCard>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {appointments.map((appt) => {
            const label = STATUS_LABELS[appt.status];
            const cancellable = appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && appt.status !== 'NO_SHOW';
            return (
              <li key={appt.id}>
                <AccountCard className="flex flex-col gap-4 h-full">
                  <div className="flex gap-4">
                    <div className="w-28 h-20 rounded-lg bg-[#0a0e13] overflow-hidden shrink-0 flex items-center justify-center">
                      {appt.listing?.imageUrl && !brokenImages.has(appt.id) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={appt.listing.imageUrl}
                          alt={appt.listing.title}
                          className="w-full h-full object-cover"
                          onError={() => setBrokenImages((prev) => new Set(prev).add(appt.id))}
                        />
                      ) : (
                        <Car className="w-8 h-8 text-[#4d4635]" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h2 className="text-base font-bold text-[#e0e2ea] truncate">{appt.listing?.title || '—'}</h2>
                      <p className="text-xs text-[#d0c5af] truncate">{appt.listing?.dealershipName}</p>
                      {appt.listing?.vinMasked && (
                        <p className="text-[11px] font-mono text-[#99907c]">VIN {appt.listing.vinMasked}</p>
                      )}
                      <p className="text-[11px] font-mono text-[#99907c]">#{appt.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#0a0e13]/60 border border-[#262a30]">
                    <span className="text-sm font-mono text-[#e0e2ea]">{formatDubai(appt.startsAt)} GST</span>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        appt.status === 'CONFIRMED' ? 'text-[#58e7aa]' : appt.status === 'CANCELLED' ? 'text-[#ffb4ab]' : 'text-[#f2ca50]'
                      }`}
                    >
                      {label ? (isArabic ? label.ar : label.en) : appt.status}
                    </span>
                  </div>

                  {appt.note && <p className="text-sm text-[#d0c5af]">{appt.note}</p>}

                  {cancellable && rescheduleId === appt.id && (
                    <div className="flex flex-col gap-2">
                      <label htmlFor={`resched-${appt.id}`} className="text-xs font-semibold uppercase tracking-wider text-[#d0c5af]">
                        {isArabic ? 'الوقت الجديد (بتوقيت الخليج)' : 'New date & time (GST)'}
                      </label>
                      <input
                        id={`resched-${appt.id}`}
                        type="datetime-local"
                        min={dubaiNowLocal()}
                        value={rescheduleValue}
                        onChange={(e) => setRescheduleValue(e.target.value)}
                        className="px-4 py-2.5 rounded-xl bg-[#0a0e13] border border-[#31353b] text-[#e0e2ea] text-sm focus:outline-none focus:border-[#f2ca50] focus-visible:ring-2 focus-visible:ring-[#f2ca50]/40 [color-scheme:dark]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleReschedule(appt)}
                          disabled={busyId === appt.id || !rescheduleValue}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f2ca50] text-[#241a00] text-xs font-bold disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]"
                        >
                          {busyId === appt.id && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                          {isArabic ? 'إرسال' : 'Submit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRescheduleId(null)}
                          className="px-4 py-2 rounded-lg bg-[#1c2025] text-[#d0c5af] text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]"
                        >
                          {isArabic ? 'تراجع' : 'Back'}
                        </button>
                      </div>
                    </div>
                  )}

                  {cancellable && rescheduleId !== appt.id && (
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleId(appt.id);
                          setRescheduleValue('');
                          setMessage(null);
                        }}
                        disabled={busyId === appt.id}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#181c21] border border-[#31353b] text-[#e0e2ea] text-xs font-semibold hover:border-[#f2ca50] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]"
                      >
                        <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
                        {isArabic ? 'إعادة جدولة' : 'Reschedule'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(appt)}
                        disabled={busyId === appt.id}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ffb4ab]/50 text-[#ffb4ab] text-xs font-semibold hover:bg-[#93000a]/20 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb4ab]"
                      >
                        {busyId === appt.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <CalendarX className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        {isArabic ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </AccountCard>
              </li>
            );
          })}
        </ul>
      )}

      <AccountCard>
        <h2 className="text-lg font-bold text-[#e0e2ea] mb-1">{isArabic ? 'المرآب الرقمي' : 'Virtual garage'}</h2>
        <p className="text-sm text-[#99907c]">
          {isArabic ? 'إدارة السيارات المملوكة غير متاحة بعد.' : 'Owned-vehicle management is not available yet.'}
        </p>
      </AccountCard>
    </div>
  );
}
