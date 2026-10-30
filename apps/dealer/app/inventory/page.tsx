import React from 'react';
import type { Metadata } from 'next';
import { fetchDealerInventory } from '../../lib/api';
import { getDealerSession } from '../../lib/session';
import { DealerServiceError } from '../../components/dealer-service-error';
import { InventoryMatrixView } from '../../components/inventory-matrix-view';

export const metadata: Metadata = {
  title: 'Vehicle Inventory & Telemetry Matrix | Automotive OS Dealer DMS',
  description: 'Tenant-isolated vehicle stock management, RTA Tasjeel compliance, and listing submission.',
};

export default async function DealerInventoryPage() {
  try {
    const session = await getDealerSession();
    const { items: vehicles, stats } = await fetchDealerInventory(session.tenantId, session.token);

    return (
      <InventoryMatrixView
        initialVehicles={vehicles}
        initialStats={stats}
        tenantId={session.tenantId}
      />
    );
  } catch (error: unknown) {
    return (
      <DealerServiceError
        title="Dealer Inventory Service Unavailable"
        error={error}
        fallbackMessage="Unable to load real-time dealership inventory telemetry. Backend API may be unreachable."
        retryPath="/dealer/inventory"
      />
    );
  }
}
