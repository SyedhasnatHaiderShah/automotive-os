import React from 'react';
import type { Metadata } from 'next';
import { fetchDealerInventory, fetchDealerLeads } from '../lib/api';
import { DashboardCockpitView } from '../components/dashboard-cockpit-view';

export const metadata: Metadata = {
  title: 'Executive Operations Cockpit | Automotive OS Dealer DMS',
  description: 'Dealership operations overview, inventory telemetry, and active CRM funnel.',
};

export default async function DealerDashboardPage() {
  try {
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
  } catch (error: any) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface">
        <div className="bg-surface-container-high border border-error/30 rounded-2xl p-8 max-w-lg text-center flex flex-col items-center gap-4 shadow-2xl">
          <span className="material-symbols-outlined text-5xl text-error">cloud_off</span>
          <h2 className="text-xl font-bold font-headline">Dealership Operations Dashboard Unavailable</h2>
          <p className="text-sm text-on-surface-variant font-body-md">
            {error?.message || 'Unable to load live dealership telemetry and leads funnel from API backend.'}
          </p>
          <a
            href="/"
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md font-semibold hover:opacity-90 transition-opacity"
          >
            Retry Connection
          </a>
        </div>
      </div>
    );
  }
}
