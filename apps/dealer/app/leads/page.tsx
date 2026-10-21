import React from 'react';
import type { Metadata } from 'next';
import { fetchDealerInventory, fetchDealerLeads } from '../../lib/api';
import { DashboardCockpitView } from '../../components/dashboard-cockpit-view';

export const metadata: Metadata = {
  title: 'CRM Lead Pipeline & Purpose-Scoped Inbox | Automotive OS Dealer DMS',
  description: 'Manage buyer enquiries, purpose-scoped data grants, and appointment scheduling.',
};

export default async function DealerLeadsPage() {
  const [{ items: vehicles, stats }, leads] = await Promise.all([
    fetchDealerInventory(),
    fetchDealerLeads(),
  ]);

  return (
    <DashboardCockpitView
      initialVehicles={vehicles}
      initialLeads={leads}
      stats={stats}
    />
  );
}
