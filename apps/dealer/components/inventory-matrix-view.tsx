import React from 'react';
import Link from 'next/link';
import type { DealerCapabilities } from '../lib/permissions';
import {
  filsToAed,
  formatAed,
  humanizeEnum,
  publicMediaUrl,
  STOCK_STATUSES,
  type DealerVehicle,
  type Paged,
  type StockStatus,
} from '../lib/dealer-api';
import { ListingActions } from './listing-actions';
import { dealerStrings, statusLabel, type DealerLocale } from '../lib/i18n';
import { isPageOutOfRange, PageOutOfRange, Pager, StatCard, StatusPill, listingTone } from './dealer-ui';

export interface InventoryMatrixViewProps {
  tenantId: string;
  tenantName: string;
  capabilities: DealerCapabilities;
  vehicles: Paged<DealerVehicle>;
  stockStatus?: StockStatus;
  /** Exact counts from the API `total` for each stock status filter. */
  totals: { all: number; available: number; reserved: number; sold: number };
  locale: DealerLocale;
}

/** Server-rendered inventory table. Listing actions are the only client island. */
export function InventoryMatrixView({ tenantId, tenantName, capabilities, vehicles, stockStatus, totals, locale }: InventoryMatrixViewProps) {
  const t = dealerStrings(locale);
  const { items, page, limit, total } = vehicles;
  const outOfRange = isPageOutOfRange(page, limit, total);
  const publishedOnPage = items.filter((v) => v.listingStatus === 'PUBLISHED').length;
  const reviewOnPage = items.filter((v) => v.listingStatus === 'PENDING_REVIEW').length;
  const showActions = capabilities.canManageListings;
  const columns = 6 + (showActions ? 1 : 0);

  const filterHref = (value?: StockStatus) => {
    const query = new URLSearchParams({ page: '1', limit: String(limit) });
    if (value) query.set('stockStatus', value);
    return `/inventory?${query.toString()}`;
  };
  const chipClass = (active: boolean) =>
    `min-h-9 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
      active
        ? 'bg-on-surface text-surface shadow-sm'
        : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-white/[0.05]'
    }`;

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-2xl bg-surface-container-lowest p-6 mb-6 shadow-xl border border-white/[0.05] mt-4">
        <div className="absolute -end-20 -top-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute start-1/3 -bottom-32 w-80 h-80 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <span className="font-label-caps text-xs uppercase text-primary tracking-widest font-bold">{tenantName}</span>
            <h1 className="font-headline-lg text-xl sm:text-2xl font-bold text-on-surface tracking-tight">{t.inventoryTitle}</h1>
          </div>
          {capabilities.canCreateVehicle && (
            <div className="flex flex-col items-start xl:items-end gap-1">
              <button
                type="button"
                disabled
                aria-describedby="intake-unavailable"
                className="bg-primary/40 text-on-primary px-4 py-2 rounded-xl font-body-sm text-xs font-bold flex items-center gap-1.5 cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add_box</span>
                <span>{t.intakeVehicle}</span>
              </button>
              <span id="intake-unavailable" className="text-[11px] text-on-surface-variant">{t.intakeUnavailable}</span>
            </div>
          )}
        </div>

        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <StatCard label={t.totalStock} value={totals.all} icon="warehouse" note={t.allVehiclesInDealership} />
          <StatCard label={t.available} value={totals.available} icon="check_circle" note={t.allStockAvailable} accent="text-tertiary" />
          <StatCard label={t.reserved} value={totals.reserved} icon="lock" note={t.allStockReserved} accent="text-secondary" />
          <StatCard label={t.sold} value={totals.sold} icon="sell" note={t.allStockSold} />
          <StatCard
            label={t.listingsOnPage}
            value={`${publishedOnPage} / ${reviewOnPage}`}
            icon="public"
            note={t.listingsOnPageNote(items.length)}
            accent="text-primary"
          />
        </div>
      </div>

      <nav aria-label={t.filterByStock} className="mb-4 flex flex-wrap items-center gap-1.5">
        <Link href={filterHref()} className={chipClass(!stockStatus)} aria-current={!stockStatus ? 'true' : undefined}>
          {t.allStock}
        </Link>
        {STOCK_STATUSES.map((value) => (
          <Link key={value} href={filterHref(value)} className={chipClass(stockStatus === value)} aria-current={stockStatus === value ? 'true' : undefined}>
            {statusLabel(t, 'stockStatus', value)}
          </Link>
        ))}
      </nav>

      <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-white/[0.07]">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-start border-collapse">
            <caption className="sr-only">{t.vehiclesCaption}</caption>
            <thead>
              <tr className="bg-surface-container h-12 text-on-surface-variant font-label-caps text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
                <th scope="col" className="py-2.5 px-4">{t.colVehicle}</th>
                <th scope="col" className="py-2.5 px-4">{t.colVin}</th>
                <th scope="col" className="py-2.5 px-4">{t.colSpec}</th>
                <th scope="col" className="py-2.5 px-4">{t.colStock}</th>
                <th scope="col" className="py-2.5 px-4">{t.colListing}</th>
                <th scope="col" className="py-2.5 px-4 text-end">{capabilities.canSeeCost ? t.colCostAsking : t.colAsking}</th>
                {showActions && <th scope="col" className="py-2.5 px-4 text-end">{t.colActions}</th>}
              </tr>
            </thead>
            <tbody className="font-body-md text-xs sm:text-sm text-on-surface divide-y divide-white/[0.04]">
              {items.length === 0 && (
                <tr>
                  <td colSpan={columns} className="py-16 text-center text-on-surface-variant">
                    {outOfRange ? (
                      <PageOutOfRange basePath="/inventory" page={page} limit={limit} total={total} params={{ stockStatus }} t={t} />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-5xl text-outline/60" aria-hidden="true">inventory_2</span>
                        <span className="text-base font-semibold text-on-surface">
                          {/* "No vehicles in stock yet" only when the dealership truly has none (DL-02). */}
                          {stockStatus || totals.all > 0 ? t.noVehiclesWithStatus : t.noVehiclesInStock}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              )}
              {items.map((vehicle) => {
                const image = publicMediaUrl(vehicle);
                const askingAed = filsToAed(vehicle.askingPriceFils);
                const costAed = capabilities.canSeeCost ? filsToAed(vehicle.purchaseCostFils) : null;
                const marginPercent =
                  costAed && askingAed !== null && costAed > 0 ? Math.round(((askingAed - costAed) / costAed) * 100) : null;
                const spec = [
                  vehicle.gccSpec === null ? null : vehicle.gccSpec ? t.gccSpec : t.nonGcc,
                  vehicle.fuel ? humanizeEnum(vehicle.fuel) : null,
                  vehicle.transmission ? humanizeEnum(vehicle.transmission) : null,
                ].filter(Boolean);

                return (
                  <tr key={vehicle.id} className="hover:bg-surface-container/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-11 rounded-lg overflow-hidden shrink-0 bg-surface-container-high border border-white/[0.06] flex items-center justify-center">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt={`${vehicle.makeName} ${vehicle.modelName}`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-[20px] text-outline" aria-hidden="true">directions_car</span>
                          )}
                          <span className="absolute bottom-0.5 end-0.5 px-1 rounded bg-surface-container-lowest/90 font-data-mono-num text-[9px] text-primary font-bold">
                            {vehicle.modelYear}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="font-bold text-on-surface truncate">
                            {vehicle.makeName} {vehicle.modelName}
                            {vehicle.trim && <span className="ms-1.5 text-[11px] font-normal text-on-surface-variant">{vehicle.trim}</span>}
                          </div>
                          <div className="font-label-caps text-[10px] text-on-surface-variant font-data-mono-num mt-0.5">
                            {vehicle.stockNumber}
                            {vehicle.colorExterior ? ` • ${vehicle.colorExterior}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-data-mono-num text-xs tracking-wider">{vehicle.vin ?? '—'}</td>
                    <td className="py-3 px-4 text-xs">
                      <div>{spec.length > 0 ? spec.join(' • ') : '—'}</div>
                      <div className="text-[11px] text-on-surface-variant font-data-mono-num">
                        {humanizeEnum(vehicle.condition)} •{' '}
                        {vehicle.mileageKm === null ? '—' : `${vehicle.mileageKm.toLocaleString('en-US')} km`}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill label={statusLabel(t, 'stockStatus', vehicle.stockStatus)} tone={vehicle.stockStatus === 'AVAILABLE' ? 'good' : 'neutral'} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill
                        label={vehicle.listingStatus ? statusLabel(t, 'listingStatus', vehicle.listingStatus) : t.noListing}
                        tone={listingTone(vehicle.listingStatus)}
                      />
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex flex-col items-end">
                        <div className="font-data-mono-num font-bold text-on-surface">{formatAed(vehicle.askingPriceFils)}</div>
                        {capabilities.canSeeCost && (
                          <div className="text-[11px] font-data-mono-num text-on-surface-variant mt-0.5">
                            {t.cost} {formatAed(vehicle.purchaseCostFils)}
                            {marginPercent !== null && (
                              <span className="ms-1 text-tertiary bg-tertiary/10 px-1 rounded font-bold">
                                {marginPercent >= 0 ? '+' : ''}
                                {marginPercent}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    {showActions && (
                      <td className="py-3 px-4 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <ListingActions
                            tenantId={tenantId}
                            vehicleId={vehicle.id}
                            listingId={vehicle.listingId}
                            listingStatus={vehicle.listingStatus}
                            stockStatus={vehicle.stockStatus}
                            askingPriceFils={vehicle.askingPriceFils}
                          />
                          {capabilities.canReadLeads && vehicle.listingId && (
                            <Link href="/leads" className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors" title={t.viewLeads}>
                              <span className="material-symbols-outlined text-[17px]" aria-hidden="true">filter_alt</span>
                              <span className="sr-only">{t.viewLeads}</span>
                            </Link>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pager basePath="/inventory" page={page} limit={limit} total={total} params={{ stockStatus }} noun={t.nounVehicles} t={t} />
      </div>
    </>
  );
}
