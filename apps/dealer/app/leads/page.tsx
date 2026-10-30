import React from 'react';
import type { Metadata } from 'next';
import { fetchDealerInventory, fetchDealerLeads } from '../../lib/api';
import { getDealerSession } from '../../lib/session';
import { DealerServiceError } from '../../components/dealer-service-error';
import { DashboardCockpitView } from '../../components/dashboard-cockpit-view';

export const metadata: Metadata = {
  title: 'CRM Lead Pipeline & Purpose-Scoped Inbox | Automotive OS Dealer DMS',
  description: 'Manage buyer enquiries, purpose-scoped data grants, and appointment scheduling.',
};

export default async function DealerLeadsPage() {
  try {
    const session = await getDealerSession();
    const [{ items: vehicles, stats }, leads] = await Promise.all([
      fetchDealerInventory(session.tenantId, session.token),
      fetchDealerLeads(session.tenantId, session.token),
    ]);

    return (
      <DashboardCockpitView
        initialVehicles={vehicles}
        initialLeads={leads}
        stats={stats}
        tenantId={session.tenantId}
      />
    );
  } catch (error: unknown) {
    return (
      <DealerServiceError
        title="CRM Leads Service Unavailable"
        error={error}
        fallbackMessage="Unable to load CRM leads from API backend."
        retryPath="/dealer/leads"
      />
    );
  }
}
