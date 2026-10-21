import React from 'react';
import type { Metadata } from 'next';
import { fetchDealerInventory } from '../../lib/api';
import { InventoryMatrixView } from '../../components/inventory-matrix-view';

export const metadata: Metadata = {
  title: 'Vehicle Inventory & Telemetry Matrix | Automotive OS Dealer DMS',
  description: 'Tenant-isolated vehicle stock management, RTA Tasjeel compliance, and listing submission.',
};

export default async function DealerInventoryPage() {
  const { items: vehicles, stats } = await fetchDealerInventory();

  return (
    <InventoryMatrixView
      initialVehicles={vehicles}
      initialStats={stats}
    />
  );
}
