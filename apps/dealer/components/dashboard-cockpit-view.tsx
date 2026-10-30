import React from 'react';
import Link from 'next/link';
import type { DealerCapabilities } from '../lib/permissions';
import {
  formatAed,
  formatDubaiDateTime,
  humanizeEnum,
  type DealerLeadSummary,
  type DealerVehicle,
} from '../lib/dealer-api';
import { INTAKE_UNAVAILABLE_MESSAGE } from '../lib/permissions';
import { AccessNotice, StatCard, StatusPill, leadTone, listingTone } from './dealer-ui';

export interface DashboardStockData {
  /** Exact counts from the API `total`. */
  total: number;
  available: number;
  reserved: number;
  sold: number;
  /** Most recently updated vehicles (one API page). */
  recent: DealerVehicle[];
}

export interface DashboardLeadData {
  /** Exact counts from the API `total`. */
  total: number;
  byStatus: Record<'NEW' | 'CONTACTED' | 'QUALIFIED' | 'TEST_DRIVE_NEGOTIATION' | 'WON', number>;
  recent: DealerLeadSummary[];
}

export interface DashboardCockpitViewProps {
  tenantName: string;
  capabilities: DealerCapabilities;
  stock: DashboardStockData;
  /** Null when the caller's role cannot read leads. */
  leads: DashboardLeadData | null;
}

/** Dealer overview built only from live inventory and lead data. */
export function DashboardCockpitView({ tenantName, capabilities, stock, leads }: DashboardCockpitViewProps) {
  const sample = stock.recent;
  const listingCounts = sample.reduce<Record<string, number>>((acc, vehicle) => {
    const key = vehicle.listingStatus ?? 'NONE';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const availableAskingFils = sample
    .filter((v) => v.stockStatus === 'AVAILABLE')
    .reduce((sum, v) => sum + (Number(v.askingPriceFils) || 0), 0);
  const sampleIsComplete = sample.length >= stock.total;
  const sampleNote = sampleIsComplete
    ? 'All vehicles in this dealership'
    : `Latest ${sample.length} of ${stock.total} vehicles only`;

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-4 mb-6">
        <div className="flex flex-col gap-1">
          <span className="font-label-caps text-xs uppercase text-primary tracking-widest font-bold">{tenantName}</span>
          <h1 className="font-headline-lg text-xl sm:text-2xl text-on-surface font-semibold tracking-tight">Dealership Overview</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/inventory"
            className="min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">garage</span>
            <span>Inventory</span>
          </Link>
          {capabilities.canReadLeads && (
            <Link
              href="/leads"
              className="min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">filter_alt</span>
              <span>Leads</span>
            </Link>
          )}
          {capabilities.canCreateVehicle && (
            <button
              type="button"
              disabled
              title={INTAKE_UNAVAILABLE_MESSAGE}
              aria-label={`Add vehicle — ${INTAKE_UNAVAILABLE_MESSAGE}`}
              className="min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-high/50 text-on-surface-variant text-sm cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add_box</span>
              <span>Add vehicle (unavailable)</span>
            </button>
          )}
        </div>
      </div>

      <section aria-labelledby="stock-heading" className="mb-8">
        <h2 id="stock-heading" className="mb-3 font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
          Stock
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <StatCard label="Total stock" value={stock.total} icon="warehouse" note="All vehicles" />
          <StatCard label="Available" value={stock.available} icon="check_circle" note="All vehicles" accent="text-tertiary" />
          <StatCard label="Reserved" value={stock.reserved} icon="lock" note="All vehicles" accent="text-secondary" />
          <StatCard label="Sold" value={stock.sold} icon="sell" note="All vehicles" />
          <StatCard
            label="Available asking value"
            value={availableAskingFils > 0 ? formatAed(String(availableAskingFils)) : 'AED 0'}
            icon="payments"
            note={sampleNote}
            accent="text-primary"
          />
        </div>
      </section>

      <section aria-labelledby="leads-heading" className="mb-8">
        <h2 id="leads-heading" className="mb-3 font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
          Leads
        </h2>
        {leads ? (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
            <StatCard label="All leads" value={leads.total} icon="inbox" note="All time" />
            <StatCard label="New" value={leads.byStatus.NEW} icon="fiber_new" note="Awaiting first contact" accent="text-primary" />
            <StatCard label="Contacted" value={leads.byStatus.CONTACTED} icon="call" note="All time" />
            <StatCard label="Qualified" value={leads.byStatus.QUALIFIED} icon="verified" note="All time" />
            <StatCard label="Test drive / negotiation" value={leads.byStatus.TEST_DRIVE_NEGOTIATION} icon="speed" note="All time" />
            <StatCard label="Won" value={leads.byStatus.WON} icon="emoji_events" note="All time" accent="text-tertiary" />
          </div>
        ) : (
          <AccessNotice title="Leads hidden for your role" message="Only owners, admins, sales managers and sales agents can view lead data." />
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section aria-labelledby="listing-heading" className="xl:col-span-5 p-5 rounded-xl bg-surface-container-low shadow-sm border border-outline-variant/10">
          <h2 id="listing-heading" className="font-headline-md text-base text-on-surface font-semibold">Listing status</h2>
          <p className="text-xs text-on-surface-variant mb-4">{sampleNote}.</p>
          {sample.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No vehicles yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {Object.entries(listingCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <li key={status} className="flex items-center justify-between rounded-lg bg-surface-container px-3 py-2">
                    <StatusPill
                      label={status === 'NONE' ? 'No listing' : humanizeEnum(status)}
                      tone={listingTone(status === 'NONE' ? null : status)}
                    />
                    <span className="font-data-mono-num font-bold text-on-surface">{count}</span>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-leads-heading" className="xl:col-span-7 p-5 rounded-xl bg-surface-container-low shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-between mb-4">
            <h2 id="recent-leads-heading" className="font-headline-md text-base text-on-surface font-semibold">Recent leads</h2>
            {leads && (
              <Link href="/leads" className="text-xs text-primary hover:underline">
                View all
              </Link>
            )}
          </div>
          {!leads ? (
            <p className="text-sm text-on-surface-variant">Not available for your role.</p>
          ) : leads.recent.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No leads yet.</p>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {leads.recent.map((lead) => (
                <li key={lead.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-on-surface truncate">{lead.listingTitle}</div>
                    <div className="text-[11px] text-on-surface-variant">
                      {lead.buyerDisplayName} • {humanizeEnum(lead.intent)} • {formatDubaiDateTime(lead.createdAt)}
                    </div>
                  </div>
                  <StatusPill label={humanizeEnum(lead.status)} tone={leadTone(lead.status)} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
