import React from 'react';
import type { Metadata } from 'next';
import { fetchDealerInventory, fetchDealerLeads } from '../lib/api';
import { DashboardCockpitView } from '../components/dashboard-cockpit-view';

export const metadata: Metadata = {
  title: 'Executive Operations Cockpit | Automotive OS Dealer DMS',
  description: 'Dealership operations overview, inventory telemetry, and active CRM funnel.',
};

export default async function DealerDashboardPage() {
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
