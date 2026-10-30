import React from 'react';
import type { Metadata } from 'next';
import { getDealerSession } from '../../lib/session';
import { capabilitiesFor } from '../../lib/permissions';
import { countVehicles, fetchVehiclesPage } from '../../lib/dealer-api-server';
import { parsePaging, STOCK_STATUSES, type StockStatus } from '../../lib/dealer-api';
import { DealerServiceError } from '../../components/dealer-service-error';
import { DealerShell } from '../../components/dealer-shell';
import { InventoryMatrixView } from '../../components/inventory-matrix-view';
import { dealerStrings } from '../../lib/i18n';
import { getDealerLocale } from '../../lib/locale-server';

export const metadata: Metadata = {
  title: 'Vehicle Inventory | Automotive OS Dealer DMS',
  description: 'Tenant-isolated vehicle stock and listing submission.',
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DealerInventoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = await getDealerLocale();
  const t = dealerStrings(locale);
  try {
    const session = await getDealerSession();
    const { page, limit } = parsePaging(params);
    const rawStock = Array.isArray(params.stockStatus) ? params.stockStatus[0] : params.stockStatus;
    const stockStatus = STOCK_STATUSES.includes(rawStock as StockStatus) ? (rawStock as StockStatus) : undefined;

    const [vehicles, allTotal, availableTotal, reservedTotal, soldTotal] = await Promise.all([
      fetchVehiclesPage(session.tenantId, session.token, { page, limit, stockStatus }),
      countVehicles(session.tenantId, session.token),
      countVehicles(session.tenantId, session.token, 'AVAILABLE'),
      countVehicles(session.tenantId, session.token, 'RESERVED'),
      countVehicles(session.tenantId, session.token, 'SOLD'),
    ]);

    return (
      <DealerShell
        identity={{
          tenantName: session.tenantName,
          displayName: session.displayName,
          role: session.role,
          hasMultipleTenants: session.hasMultipleTenants,
        }}
        locale={locale}
      >
        <InventoryMatrixView
          tenantId={session.tenantId}
          tenantName={session.tenantName}
          capabilities={capabilitiesFor(session.role)}
          vehicles={vehicles}
          stockStatus={stockStatus}
          totals={{ all: allTotal, available: availableTotal, reserved: reservedTotal, sold: soldTotal }}
          locale={locale}
        />
      </DealerShell>
    );
  } catch (error: unknown) {
    return (
      <DealerServiceError
        title={t.errInventoryTitle}
        error={error}
        fallbackMessage={t.errInventoryFallback}
        retryPath="/dealer/inventory"
        locale={locale}
      />
    );
  }
}

