import React from 'react';
import type { Metadata } from 'next';
import { fetchDealerInventory } from '../../lib/api';
import { InventoryMatrixView } from '../../components/inventory-matrix-view';

export const metadata: Metadata = {
  title: 'Vehicle Inventory & Telemetry Matrix | Automotive OS Dealer DMS',
  description: 'Tenant-isolated vehicle stock management, RTA Tasjeel compliance, and listing submission.',
};

export default async function DealerInventoryPage() {
  try {
    const { items: vehicles, stats } = await fetchDealerInventory();

    return (
      <InventoryMatrixView
        initialVehicles={vehicles}
        initialStats={stats}
      />
    );
  } catch (error: any) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface">
        <div className="bg-surface-container-high border border-error/30 rounded-2xl p-8 max-w-lg text-center flex flex-col items-center gap-4 shadow-2xl">
          <span className="material-symbols-outlined text-5xl text-error">cloud_off</span>
          <h2 className="text-xl font-bold font-headline">Dealer Inventory Service Unavailable</h2>
          <p className="text-sm text-on-surface-variant font-body-md">
            {error?.message || 'Unable to load real-time dealership inventory telemetry. Backend API may be unreachable.'}
          </p>
          <a
            href="/inventory"
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md font-semibold hover:opacity-90 transition-opacity"
          >
            Retry Connection
          </a>
        </div>
      </div>
    );
  }
}
