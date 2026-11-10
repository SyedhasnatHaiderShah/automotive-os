import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getDealerSession } from '../../lib/session';
import { capabilitiesFor } from '../../lib/permissions';
import { fetchAppointmentsPage } from '../../lib/dealer-api-server';
import {
  APPOINTMENT_STATUSES,
  formatDubaiDateTime,
  parsePaging,
  type AppointmentStatus,
} from '../../lib/dealer-api';
import { AppointmentRowActions } from '../../components/appointment-row-actions';
import { DealerServiceError } from '../../components/dealer-service-error';
import { DealerShell } from '../../components/dealer-shell';
import { AccessNotice, appointmentTone, isPageOutOfRange, PageOutOfRange, Pager, StatusPill } from '../../components/dealer-ui';
import { dealerStrings, statusLabel } from '../../lib/i18n';
import { getDealerLocale } from '../../lib/locale-server';

export const metadata: Metadata = {
  title: 'Test Drives | Automotive OS Dealer DMS',
  description: 'Test drive requests for this dealership, with consent-scoped buyer details.',
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DealerAppointmentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = await getDealerLocale();
  const t = dealerStrings(locale);
  try {
    const session = await getDealerSession();
    const identity = {
      tenantName: session.tenantName,
      displayName: session.displayName,
      role: session.role,
      hasMultipleTenants: session.hasMultipleTenants,
    };

    if (!capabilitiesFor(session.role).canManageAppointments) {
      return (
        <DealerShell identity={identity} locale={locale}>
          <h1 className="mt-6 font-headline-lg text-xl sm:text-2xl font-bold text-on-surface">{t.appointmentsTitle}</h1>
          <AccessNotice title={t.appointmentsRoleTitle} message={t.appointmentsRoleMessage} />
        </DealerShell>
      );
    }

    const { page, limit } = parsePaging(params);
    const rawStatus = Array.isArray(params.status) ? params.status[0] : params.status;
    const status = APPOINTMENT_STATUSES.includes(rawStatus as AppointmentStatus) ? (rawStatus as AppointmentStatus) : undefined;
    const appointments = await fetchAppointmentsPage(session.tenantId, session.token, { page, limit, status });
    const outOfRange = isPageOutOfRange(page, limit, appointments.total);

    const filterHref = (value?: AppointmentStatus) => {
      const query = new URLSearchParams({ page: '1', limit: String(limit) });
      if (value) query.set('status', value);
      return `/appointments?${query.toString()}`;
    };
    const chipClass = (active: boolean) =>
      `min-h-9 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
        active
          ? 'bg-on-surface text-surface shadow-sm'
          : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-white/[0.05]'
      }`;

    return (
      <DealerShell identity={identity} locale={locale}>
        <div className="relative w-full overflow-hidden rounded-2xl bg-surface-container-lowest p-6 mb-6 mt-4 shadow-xl border border-white/[0.05]">
          <div className="absolute -end-20 -top-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-1">
            <span className="font-label-caps text-xs uppercase text-primary tracking-widest font-bold">{session.tenantName}</span>
            <h1 className="font-headline-lg text-xl sm:text-2xl font-bold text-on-surface tracking-tight">{t.appointmentsTitle}</h1>
            <p className="text-sm text-on-surface-variant">
              {t.appointmentsSummary(appointments.total, status ? statusLabel(t, 'appointmentStatus', status) : null)}
            </p>
          </div>
        </div>

        <nav aria-label={t.filterAppointments} className="mb-4 flex flex-wrap items-center gap-1.5">
          <Link href={filterHref()} className={chipClass(!status)} aria-current={!status ? 'true' : undefined}>
            {t.all}
          </Link>
          {APPOINTMENT_STATUSES.map((value) => (
            <Link key={value} href={filterHref(value)} className={chipClass(status === value)} aria-current={status === value ? 'true' : undefined}>
              {statusLabel(t, 'appointmentStatus', value)}
            </Link>
          ))}
        </nav>

        <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-white/[0.07]">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-start border-collapse">
              <caption className="sr-only">{t.appointmentsCaption}</caption>
              <thead>
                <tr className="bg-surface-container h-12 text-on-surface-variant font-label-caps text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
                  <th scope="col" className="py-2.5 px-4 text-start">{t.colWhen}</th>
                  <th scope="col" className="py-2.5 px-4 text-start">{t.colBuyer}</th>
                  <th scope="col" className="py-2.5 px-4 text-start">{t.colListing}</th>
                  <th scope="col" className="py-2.5 px-4 text-start">{t.colNote}</th>
                  <th scope="col" className="py-2.5 px-4 text-start">{t.colStatus}</th>
                  <th scope="col" className="py-2.5 px-4 text-end">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-xs sm:text-sm text-on-surface divide-y divide-white/[0.04]">
                {appointments.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-on-surface-variant">
                      {outOfRange ? (
                        <PageOutOfRange basePath="/appointments" page={page} limit={limit} total={appointments.total} params={{ status }} t={t} />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-5xl text-outline/60" aria-hidden="true">event_busy</span>
                          <span className="text-base font-semibold text-on-surface">{status ? t.noAppointmentsWithStatus : t.noAppointmentsYet}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
                {appointments.items.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-surface-container/60 transition-colors align-top">
                    <td className="py-3 px-4 whitespace-nowrap font-data-mono-num text-xs">
                      <div>{formatDubaiDateTime(appointment.startsAt)}</div>
                      <div className="text-on-surface-variant">{t.appointmentEnds(formatDubaiDateTime(appointment.endsAt))}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold">{appointment.buyerDisplayName}</td>
                    <td className="py-3 px-4">{appointment.listingTitle}</td>
                    <td className="py-3 px-4 text-xs text-on-surface-variant max-w-[260px]">{appointment.note ?? '—'}</td>
                    <td className="py-3 px-4">
                      <StatusPill label={statusLabel(t, 'appointmentStatus', appointment.status)} tone={appointmentTone(appointment.status)} />
                    </td>
                    <td className="py-3 px-4 text-end">
                      <AppointmentRowActions tenantId={session.tenantId} appointmentId={appointment.id} status={appointment.status} locale={locale} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager basePath="/appointments" page={page} limit={limit} total={appointments.total} params={{ status }} noun={t.nounAppointments} t={t} />
        </div>
      </DealerShell>
    );
  } catch (error: unknown) {
    return (
      <DealerServiceError
        title={t.errAppointmentsTitle}
        error={error}
        fallbackMessage={t.errAppointmentsFallback}
        retryPath="/dealer/appointments"
        locale={locale}
      />
    );
  }
}
