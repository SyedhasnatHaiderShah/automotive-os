import React from 'react';
import type { Metadata } from 'next';
import { getDealerSession } from '../lib/session';
import { capabilitiesFor } from '../lib/permissions';
import { countLeads, countVehicles, fetchLeadsPage, fetchVehiclesPage } from '../lib/dealer-api-server';
import { PAGE_LIMIT_MAX } from '../lib/dealer-api';
import { DealerServiceError } from '../components/dealer-service-error';
import { DealerShell } from '../components/dealer-shell';
import { DashboardCockpitView, type DashboardLeadData } from '../components/dashboard-cockpit-view';

export const metadata: Metadata = {
  title: 'Dealership Overview | Automotive OS Dealer DMS',
  description: 'Live stock and lead counts for this dealership.',
};

export default async function DealerDashboardPage() {
  try {
    const session = await getDealerSession();
    const caps = capabilitiesFor(session.role);
    const { tenantId, token } = session;

    const loadLeads = async (): Promise<DashboardLeadData | null> => {
      if (!caps.canReadLeads) return null;
      const [recent, NEW, CONTACTED, QUALIFIED, TEST_DRIVE_NEGOTIATION, WON] = await Promise.all([
        fetchLeadsPage(tenantId, token, { page: 1, limit: 5 }),
        countLeads(tenantId, token, 'NEW'),
        countLeads(tenantId, token, 'CONTACTED'),
        countLeads(tenantId, token, 'QUALIFIED'),
        countLeads(tenantId, token, 'TEST_DRIVE_NEGOTIATION'),
        countLeads(tenantId, token, 'WON'),
      ]);
      return {
        total: recent.total,
        byStatus: { NEW, CONTACTED, QUALIFIED, TEST_DRIVE_NEGOTIATION, WON },
        recent: recent.items,
      };
    };

    const [vehicles, available, reserved, sold, leads] = await Promise.all([
      fetchVehiclesPage(tenantId, token, { page: 1, limit: PAGE_LIMIT_MAX }),
      countVehicles(tenantId, token, 'AVAILABLE'),
      countVehicles(tenantId, token, 'RESERVED'),
      countVehicles(tenantId, token, 'SOLD'),
      loadLeads(),
    ]);

    return (
      <DealerShell
        identity={{
          tenantName: session.tenantName,
          displayName: session.displayName,
          role: session.role,
          hasMultipleTenants: session.hasMultipleTenants,
        }}
      >
        <DashboardCockpitView
          tenantName={session.tenantName}
          capabilities={caps}
          stock={{ total: vehicles.total, available, reserved, sold, recent: vehicles.items }}
          leads={leads}
        />
      </DealerShell>
    );
  } catch (error: unknown) {
    return (
      <DealerServiceError
        title="Dealership overview unavailable"
        error={error}
        fallbackMessage="Unable to load stock and lead data from the API."
        retryPath="/dealer"
      />
    );
  }
}
