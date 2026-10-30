import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getDealerSession } from '../../lib/session';
import { capabilitiesFor } from '../../lib/permissions';
import { fetchLeadsPage } from '../../lib/dealer-api-server';
import {
  formatDubaiDateTime,
  humanizeEnum,
  LEAD_STATUSES,
  parsePaging,
  type LeadStatus,
} from '../../lib/dealer-api';
import { DealerServiceError } from '../../components/dealer-service-error';
import { DealerShell } from '../../components/dealer-shell';
import { AccessNotice, isPageOutOfRange, PageOutOfRange, Pager, StatusPill, leadTone } from '../../components/dealer-ui';
import { dealerStrings, statusLabel } from '../../lib/i18n';
import { getDealerLocale } from '../../lib/locale-server';
import { LeadRowActions, type StaffOption } from '../../components/lead-row-actions';

export const metadata: Metadata = {
  title: 'Leads | Automotive OS Dealer DMS',
  description: 'Buyer enquiries for this dealership, with consent-scoped buyer details.',
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DealerLeadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
    const caps = capabilitiesFor(session.role);

    if (!caps.canReadLeads) {
      return (
        <DealerShell identity={identity} locale={locale}>
          <h1 className="mt-6 font-headline-lg text-xl sm:text-2xl font-bold text-on-surface">{t.leadsTitle}</h1>
          <AccessNotice title={t.leadsRoleTitle} message={t.leadsRoleMessage} />
        </DealerShell>
      );
    }

    const { page, limit } = parsePaging(params);
    const rawStatus = Array.isArray(params.status) ? params.status[0] : params.status;
    const status = LEAD_STATUSES.includes(rawStatus as LeadStatus) ? (rawStatus as LeadStatus) : undefined;
    const leads = await fetchLeadsPage(session.tenantId, session.token, { page, limit, status });
    const outOfRange = isPageOutOfRange(page, limit, leads.total);

    // There is no staff directory API yet, so assignment choices are limited to
    // staff already assigned to leads on this page.
    const staffOptions: StaffOption[] = [];
    for (const lead of leads.items) {
      if (lead.assignedMembershipId && !staffOptions.some((s) => s.membershipId === lead.assignedMembershipId)) {
        staffOptions.push({ membershipId: lead.assignedMembershipId, name: lead.assignedStaffName ?? (locale === 'ar' ? 'موظف معيّن' : 'Assigned staff') });
      }
    }
    const showActions = caps.canChangeLeadStatus || caps.canAssignLeads;

    const filterHref = (value?: LeadStatus) => {
      const query = new URLSearchParams({ page: '1', limit: String(limit) });
      if (value) query.set('status', value);
      return `/leads?${query.toString()}`;
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
            <h1 className="font-headline-lg text-xl sm:text-2xl font-bold text-on-surface tracking-tight">{t.leadsTitle}</h1>
            <p className="text-sm text-on-surface-variant">
              {t.leadsSummary(leads.total, status ? statusLabel(t, 'leadStatus', status) : null)}
            </p>
          </div>
        </div>

        <nav aria-label={t.filterLeads} className="mb-4 flex flex-wrap items-center gap-1.5">
          <Link href={filterHref()} className={chipClass(!status)} aria-current={!status ? 'true' : undefined}>
            {t.all}
          </Link>
          {LEAD_STATUSES.map((value) => (
            <Link key={value} href={filterHref(value)} className={chipClass(status === value)} aria-current={status === value ? 'true' : undefined}>
              {statusLabel(t, 'leadStatus', value)}
            </Link>
          ))}
        </nav>

        {caps.canAssignLeads && (
          <p className="mb-3 text-xs text-on-surface-variant">
            {t.assignmentNote}
          </p>
        )}

        <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-white/[0.07]">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-start border-collapse">
              <caption className="sr-only">{t.leadsCaption}</caption>
              <thead>
                <tr className="bg-surface-container h-12 text-on-surface-variant font-label-caps text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
                  <th scope="col" className="py-2.5 px-4">{t.colReceived}</th>
                  <th scope="col" className="py-2.5 px-4">{t.colBuyer}</th>
                  <th scope="col" className="py-2.5 px-4">{t.colListing}</th>
                  <th scope="col" className="py-2.5 px-4">{t.colIntent}</th>
                  <th scope="col" className="py-2.5 px-4">{t.colStatus}</th>
                  <th scope="col" className="py-2.5 px-4">{t.colAssigned}</th>
                  {showActions && <th scope="col" className="py-2.5 px-4 text-end">{t.colActions}</th>}
                </tr>
              </thead>
              <tbody className="font-body-md text-xs sm:text-sm text-on-surface divide-y divide-white/[0.04]">
                {leads.items.length === 0 && (
                  <tr>
                    <td colSpan={showActions ? 7 : 6} className="py-16 text-center text-on-surface-variant">
                      {outOfRange ? (
                        <PageOutOfRange basePath="/leads" page={page} limit={limit} total={leads.total} params={{ status }} t={t} />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-5xl text-outline/60" aria-hidden="true">inbox</span>
                          <span className="text-base font-semibold text-on-surface">{status ? t.noLeadsWithStatus : t.noLeadsYet}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
                {leads.items.map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface-container/60 transition-colors align-top">
                    <td className="py-3 px-4 whitespace-nowrap font-data-mono-num text-xs text-on-surface-variant">
                      {formatDubaiDateTime(lead.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-semibold">{lead.buyerDisplayName}</td>
                    <td className="py-3 px-4">{lead.listingTitle}</td>
                    <td className="py-3 px-4 text-xs">
                      <div>{humanizeEnum(lead.intent)}</div>
                      <div className="text-on-surface-variant">{t.prefers(humanizeEnum(lead.preferredContact))}</div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill label={statusLabel(t, 'leadStatus', lead.status)} tone={leadTone(lead.status)} />
                    </td>
                    <td className="py-3 px-4 text-xs">{lead.assignedStaffName ?? <span className="text-on-surface-variant">{t.unassigned}</span>}</td>
                    {showActions && (
                      <td className="py-3 px-4 text-end">
                        <LeadRowActions
                          tenantId={session.tenantId}
                          leadId={lead.id}
                          status={lead.status}
                          assignedMembershipId={lead.assignedMembershipId}
                          canChangeStatus={caps.canChangeLeadStatus}
                          canAssign={caps.canAssignLeads}
                          staffOptions={staffOptions}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager basePath="/leads" page={page} limit={limit} total={leads.total} params={{ status }} noun={t.nounLeads} t={t} />
        </div>
      </DealerShell>
    );
  } catch (error: unknown) {
    return (
      <DealerServiceError
        title={t.errLeadsTitle}
        error={error}
        fallbackMessage={t.errLeadsFallback}
        retryPath="/dealer/leads"
        locale={locale}
      />
    );
  }
}
