'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarClock, CheckCircle2, Circle, Inbox, ShieldOff, XCircle, Loader2 } from 'lucide-react';
import { BuyerEnquiryItem, revokeBuyerEnquiryGrant } from '../lib/api';
import { BuyerAuthRequiredError } from '../lib/buyer-api-client';
import { AccountShell, AccountCard, StatusMessage, formatDubai, useAccountLocale } from './account-shell';

interface BuyerEnquiriesViewProps {
  initialEnquiries: BuyerEnquiryItem[];
  displayName?: string;
}

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  NEW: { en: 'Sent to dealer', ar: 'أُرسل إلى الوكيل' },
  CONTACTED: { en: 'Dealer contacted you', ar: 'تواصل الوكيل معك' },
  QUALIFIED: { en: 'Qualified by dealer', ar: 'تمت مراجعته من الوكيل' },
  TEST_DRIVE_NEGOTIATION: { en: 'Test drive / negotiation', ar: 'تجربة قيادة / تفاوض' },
  WON: { en: 'Completed', ar: 'مكتمل' },
  LOST: { en: 'Closed', ar: 'مغلق' },
  SPAM: { en: 'Closed', ar: 'مغلق' },
};

// Lead status pipeline (packages/database LeadStatus enum).
const PIPELINE = ['NEW', 'CONTACTED', 'QUALIFIED', 'TEST_DRIVE_NEGOTIATION', 'WON'];

const INTENT_LABELS: Record<string, string> = {
  TEST_DRIVE: 'Test drive',
  OFFER: 'Offer',
  INSPECTION: 'Inspection',
  FINANCING: 'Financing',
  EXPORT_INQUIRY: 'Export enquiry',
};

function statusLabel(status: string, isArabic: boolean) {
  const l = STATUS_LABELS[status];
  return l ? (isArabic ? l.ar : l.en) : status;
}

export function BuyerEnquiriesView({ initialEnquiries, displayName }: BuyerEnquiriesViewProps) {
  return (
    <AccountShell
      displayName={displayName}
      title="My enquiries"
      titleAr="استفساراتي"
      subtitle="Status of each enquiry you sent to a dealer, and the contact details you shared."
      subtitleAr="حالة كل استفسار أرسلته إلى وكيل والبيانات التي شاركتها."
    >
      <EnquiriesBody initialEnquiries={initialEnquiries} />
    </AccountShell>
  );
}

function EnquiriesBody({ initialEnquiries }: { initialEnquiries: BuyerEnquiryItem[] }) {
  const { isArabic } = useAccountLocale();
  const router = useRouter();
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [selectedId, setSelectedId] = useState<string | null>(initialEnquiries[0]?.id ?? null);
  const [revoking, setRevoking] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  if (enquiries.length === 0) {
    return (
      <AccountCard className="flex flex-col items-center text-center py-16 gap-4">
        <Inbox className="w-10 h-10 text-[#f2ca50]" aria-hidden="true" />
        <h2 className="text-xl font-bold text-[#e0e2ea]">
          {isArabic ? 'لا توجد استفسارات بعد' : 'No enquiries yet'}
        </h2>
        <p className="text-sm text-[#d0c5af] max-w-md">
          {isArabic
            ? 'عندما ترسل استفسارًا عن سيارة، سيظهر هنا مع حالته.'
            : 'When you enquire about a vehicle, it will appear here with its status.'}
        </p>
        <Link
          href="/cars"
          className="px-6 py-3 rounded-xl bg-[#f2ca50] text-[#241a00] font-bold text-sm uppercase tracking-wider hover:bg-[#e9c349] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]"
        >
          {isArabic ? 'تصفح السيارات' : 'Browse vehicles'}
        </Link>
      </AccountCard>
    );
  }

  const selected = enquiries.find((e) => e.id === selectedId) ?? enquiries[0]!;

  const handleRevoke = async () => {
    setRevoking(true);
    setMessage(null);
    try {
      await revokeBuyerEnquiryGrant(selected.id);
      const now = new Date().toISOString();
      setEnquiries((prev) =>
        prev.map((e) => (e.id === selected.id && e.grant ? { ...e, grant: { ...e.grant, revokedAt: now } } : e))
      );
      setMessage({ kind: 'success', text: isArabic ? 'تم سحب صلاحية الوصول.' : 'Dealer access to your details was revoked.' });
    } catch (err) {
      if (err instanceof BuyerAuthRequiredError) {
        router.push(`/auth?tab=login&redirect=${encodeURIComponent('/account/enquiries')}`);
        return;
      }
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Revoke failed.' });
    } finally {
      setRevoking(false);
    }
  };

  // Timeline built only from real data: creation, lead status and appointments.
  const timeline: { key: string; label: string; at: string | null; done: boolean; tone?: 'lost' }[] = [];
  timeline.push({ key: 'created', label: isArabic ? 'تم إرسال الاستفسار' : 'Enquiry sent', at: selected.createdAt, done: true });
  if (selected.status === 'LOST' || selected.status === 'SPAM') {
    timeline.push({ key: 'LOST', label: statusLabel('LOST', isArabic), at: selected.updatedAt, done: true, tone: 'lost' });
  } else {
    const idx = PIPELINE.indexOf(selected.status);
    PIPELINE.slice(1).forEach((s, i) => {
      timeline.push({
        key: s,
        label: statusLabel(s, isArabic),
        at: idx === i + 1 ? selected.updatedAt : null,
        done: idx >= i + 1,
      });
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <AccountCard className="p-0 overflow-hidden" aria-label={isArabic ? 'قائمة الاستفسارات' : 'Enquiry list'}>
        <ul className="divide-y divide-[#262a30]">
          {enquiries.map((e) => {
            const active = e.id === selected.id;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(e.id);
                    setMessage(null);
                  }}
                  aria-current={active ? 'true' : undefined}
                  className={`w-full text-start p-4 flex flex-col gap-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f2ca50] ${
                    active ? 'bg-[#262a30]' : 'hover:bg-[#1c2025]'
                  }`}
                >
                  <span className="text-sm font-semibold text-[#e0e2ea] truncate">{e.listing.title || '—'}</span>
                  <span className="text-xs text-[#d0c5af] truncate">{e.listing.dealershipName}</span>
                  <span className="text-[11px] font-mono text-[#f2ca50]">{statusLabel(e.status, isArabic)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </AccountCard>

      <div className="lg:col-span-2 flex flex-col gap-6">
        <AccountCard>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#e0e2ea]">{selected.listing.title || '—'}</h2>
              <p className="text-sm text-[#d0c5af]">{selected.listing.dealershipName}</p>
              <p className="text-xs font-mono text-[#99907c] mt-1">
                {isArabic ? 'المرجع' : 'Ref'} #{selected.id.slice(0, 8).toUpperCase()} ·{' '}
                {INTENT_LABELS[selected.intent] ?? selected.intent}
              </p>
            </div>
            {selected.listing.slug && (
              <Link
                href={`/cars/${selected.listing.slug}`}
                className="self-start px-4 py-2 rounded-lg bg-[#181c21] border border-[#31353b] text-xs font-semibold text-[#e0e2ea] hover:border-[#f2ca50] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]"
              >
                {isArabic ? 'عرض الإعلان' : 'View listing'}
              </Link>
            )}
          </div>

          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#d0c5af] mb-4">
            {isArabic ? 'الحالة' : 'Status timeline'}
          </h3>
          <ol className="flex flex-col gap-4">
            {timeline.map((t) => (
              <li key={t.key} className="flex items-start gap-3">
                {t.tone === 'lost' ? (
                  <XCircle className="w-5 h-5 text-[#ffb4ab] shrink-0" aria-hidden="true" />
                ) : t.done ? (
                  <CheckCircle2 className="w-5 h-5 text-[#58e7aa] shrink-0" aria-hidden="true" />
                ) : (
                  <Circle className="w-5 h-5 text-[#4d4635] shrink-0" aria-hidden="true" />
                )}
                <div className="flex flex-col">
                  <span className={`text-sm ${t.done ? 'text-[#e0e2ea] font-semibold' : 'text-[#99907c]'}`}>{t.label}</span>
                  {t.at && <span className="text-xs font-mono text-[#99907c]">{formatDubai(t.at)} GST</span>}
                </div>
              </li>
            ))}
          </ol>

          {selected.message && (
            <div className="mt-6 p-4 rounded-xl bg-[#0a0e13]/60 border border-[#262a30]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#d0c5af] mb-1">
                {isArabic ? 'رسالتك' : 'Your message'}
              </p>
              <p className="text-sm text-[#e0e2ea] whitespace-pre-wrap">{selected.message}</p>
            </div>
          )}
        </AccountCard>

        <AccountCard>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#d0c5af] mb-4 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#f2ca50]" aria-hidden="true" />
            {isArabic ? 'المواعيد' : 'Appointments'}
          </h3>
          {selected.appointments.length === 0 ? (
            <p className="text-sm text-[#99907c]">{isArabic ? 'لا توجد مواعيد.' : 'No appointments for this enquiry.'}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {selected.appointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#0a0e13]/60 border border-[#262a30]">
                  <span className="text-sm text-[#e0e2ea] font-mono">{formatDubai(a.startsAt)} GST</span>
                  <span className="text-xs font-semibold uppercase text-[#f2ca50]">{a.status}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/account/garage" className="inline-block mt-4 text-xs text-[#f2ca50] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50] rounded">
            {isArabic ? 'إدارة المواعيد' : 'Manage appointments'}
          </Link>
        </AccountCard>

        <AccountCard>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#d0c5af] mb-4 flex items-center gap-2">
            <ShieldOff className="w-4 h-4 text-[#f2ca50]" aria-hidden="true" />
            {isArabic ? 'البيانات المشاركة مع الوكيل' : 'Details shared with the dealer'}
          </h3>
          {!selected.grant ? (
            <p className="text-sm text-[#99907c]">{isArabic ? 'لم تتم مشاركة أي بيانات.' : 'No contact details were shared.'}</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {selected.grant.fields.length === 0 ? (
                  <span className="text-sm text-[#99907c]">—</span>
                ) : (
                  selected.grant.fields.map((f) => (
                    <span key={f} className="px-2.5 py-1 rounded-full bg-[#262a30] text-xs text-[#e0e2ea]">
                      {f}
                    </span>
                  ))
                )}
              </div>
              <p className="text-xs text-[#99907c]">
                {selected.grant.revokedAt
                  ? `${isArabic ? 'تم السحب في' : 'Revoked'} ${formatDubai(selected.grant.revokedAt)} GST`
                  : `${isArabic ? 'ممنوحة في' : 'Granted'} ${formatDubai(selected.grant.grantedAt)} GST`}
              </p>
              {message && <StatusMessage kind={message.kind}>{message.text}</StatusMessage>}
              {!selected.grant.revokedAt && (
                <button
                  type="button"
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ffb4ab]/50 text-[#ffb4ab] text-xs font-semibold hover:bg-[#93000a]/20 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb4ab]"
                >
                  {revoking && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                  {isArabic ? 'سحب صلاحية الوصول' : 'Revoke dealer access'}
                </button>
              )}
            </div>
          )}
        </AccountCard>
      </div>
    </div>
  );
}
