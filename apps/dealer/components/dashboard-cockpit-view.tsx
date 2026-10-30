'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DealerSidebar } from './dealer-sidebar';
import { DealerHeader } from './dealer-header';
import { VehicleIntakeModal } from './vehicle-intake-modal';
import { DealerLeadItem, DealerVehicleItem, InventoryStats } from '../lib/api';

export interface DashboardCockpitViewProps {
  initialVehicles: DealerVehicleItem[];
  initialLeads: DealerLeadItem[];
  stats: InventoryStats;
  /** Active tenant resolved from the signed-in session. */
  tenantId?: string;
  locale?: 'en' | 'ar';
}

export const DashboardCockpitView: React.FC<DashboardCockpitViewProps> = ({
  initialVehicles,
  initialLeads,
  stats,
  tenantId,
  locale: defaultLocale = 'en',
}) => {
  const [vehicles, setVehicles] = useState<DealerVehicleItem[]>(initialVehicles);
  const [leads] = useState<DealerLeadItem[]>(initialLeads);
  const [currentRole, setCurrentRole] = useState<'PRINCIPAL' | 'SALES_REP'>('PRINCIPAL');
  const [locale, setLocale] = useState<'en' | 'ar'>(defaultLocale);
  const isArabic = locale === 'ar';

  const [timeRange, setTimeRange] = useState<'Today' | '7D' | '30D' | 'Q3 FY24'>('Today');
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [viewState, setViewState] = useState<'live' | 'restricted' | 'skeleton'>('live');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  const isRestricted = viewState === 'restricted' || currentRole === 'SALES_REP';

  return (
    <div
      className={`min-h-screen bg-background text-on-surface flex ${
        isArabic ? 'rtl' : 'ltr'
      }`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Sidebar Navigation */}
      <DealerSidebar
        onIntakeClick={() => setIsIntakeOpen(true)}
        locale={locale}
      />

      <div className="pl-64 min-h-screen flex flex-col flex-1">
        {/* Header Strip */}
        <DealerHeader
          currentRole={currentRole}
          onRoleToggle={() => {
            const nextRole = currentRole === 'PRINCIPAL' ? 'SALES_REP' : 'PRINCIPAL';
            setCurrentRole(nextRole);
            showToast(
              nextRole === 'SALES_REP'
                ? 'Role switched: Sales Executive (Purchase costs & private margins redacted).'
                : 'Role switched: Dealership Principal (Full fiscal access).'
            );
          }}
          locale={locale}
          onLocaleToggle={() => setLocale((prev) => (prev === 'en' ? 'ar' : 'en'))}
        />

        {/* Main Content Workspace */}
        <main className="w-full pt-16 bg-surface px-space-lg pb-space-xl flex-1">
          <div role="status" className="mb-4 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm text-on-surface">STAGING UI PREVIEW — RTA, Tasjeel, financial and escrow panels below contain synthetic design data. They are not live external integrations.</div>
          {/* Notification Toast */}
          {feedbackToast && (
            <div className="my-space-md p-space-md rounded-xl bg-primary/10 border border-primary/30 text-on-surface flex items-center justify-between gap-space-md animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  verified
                </span>
                <span className="font-body-sm text-body-sm font-medium">
                  {feedbackToast}
                </span>
              </div>
              <button
                onClick={() => setFeedbackToast(null)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {/* Operational Telemetry Header / Top Utility Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md py-space-sm mb-space-lg">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-label-caps font-label-caps uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                  Tenant ID: SLB-DXB-612048
                </span>
                <span className="text-on-surface-variant font-label-caps text-label-caps">•</span>
                <span className="text-on-surface-variant font-body-sm text-body-sm">
                  Multi-Tenant Vault Isolation
                </span>
                <span className="text-on-surface-variant font-label-caps text-label-caps">•</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-primary font-data-mono-num text-data-mono-num">
                  <span className="material-symbols-outlined text-[14px]">payments</span> AED (UAE Dirham)
                </span>
              </div>
              <div className="flex items-baseline gap-space-sm mt-1">
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                  {isArabic ? 'لوحة القيادة والعمليات التنفيذية' : 'Executive Operations Cockpit'}
                </h1>
                <span className="text-on-surface-variant font-body-sm text-body-sm">
                  Al Quoz 1 Vault & Autodrome Logistics Hub
                </span>
              </div>
            </div>

            {/* Actions & Filter Rails */}
            <div className="flex items-center gap-space-sm flex-wrap">
              <div className="inline-flex items-center bg-surface-container-low p-1 rounded-lg">
                {(['Today', '7D', '30D', 'Q3 FY24'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => {
                      setTimeRange(range);
                      showToast(`Audit timeframe filtered to: ${range}`);
                    }}
                    className={`px-3 py-1 rounded font-body-sm text-body-sm transition-colors ${
                      timeRange === range
                        ? 'bg-surface-container-highest text-on-surface font-medium shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              <button
                type="button"
                id="exportReportBtn"
                onClick={() =>
                  showToast('This regulated integration is disabled in staging. No external action was performed.')
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">sim_card_download</span>
                <span>Export RTA/DED Audit</span>
              </button>

              <button
                type="button"
                id="addVehicleModalTrigger"
                onClick={() => setIsIntakeOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">add_box</span>
                <span>Add Unit</span>
              </button>

              <button
                type="button"
                id="createLeadModalTrigger"
                onClick={() => setIsLeadModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-fixed-dim text-on-primary font-body-sm text-body-sm font-semibold shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Create VIP Lead</span>
              </button>
            </div>
          </div>

          {/* Operational Action Bar / RTA & Tasjeel Active Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mb-space-xl">
            <div className="relative overflow-hidden p-space-md rounded-xl bg-surface-container-low shadow-sm flex items-start gap-space-md border border-primary/20">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-primary/5 blur-xl pointer-events-none"></div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[24px]">verified_user</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-label-caps text-label-caps uppercase text-primary tracking-wider">
                    RTA Title Transfer Queue
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-body-sm text-body-sm font-semibold">
                    1 Digital Signoff Ready
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface font-medium truncate">
                  2024 Porsche 911 GT3 RS (Weissach Package)
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                  <span className="font-data-mono-num text-data-mono-num">VIN: WP0AF2A97RS289012</span>
                  <span>•</span>
                  <span>Buyer: Sheikh K. Al-Nahyan (DIFC Private Trust)</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => showToast('This regulated integration is disabled in staging. No external action was performed.')}
                className="shrink-0 self-center px-3 py-1.5 rounded-md bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-body-sm font-medium transition-all shadow-sm"
              >
                Review RTA Seal
              </button>
            </div>

            <div className="relative overflow-hidden p-space-md rounded-xl bg-surface-container-low shadow-sm flex items-start gap-space-md border border-secondary/20">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-secondary/5 blur-xl pointer-events-none"></div>
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-[24px]">car_repair</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">
                    Tasjeel Al Quoz Bay 3
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-body-sm text-body-sm font-semibold">
                    Hoist Audit In Progress
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface font-medium truncate">
                  2023 Ferrari 296 GTB Assetto Fiorano
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                  <span>Stage: Suspension & ECU Telemetry Diagnostics</span>
                  <span>•</span>
                  <span className="font-data-mono-num text-data-mono-num text-secondary">142/150 Points Verified</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => showToast('This regulated integration is disabled in staging. No external action was performed.')}
                className="shrink-0 self-center px-3 py-1.5 rounded-md bg-surface-container-high hover:bg-secondary hover:text-on-secondary text-on-surface text-body-sm font-medium transition-all shadow-sm"
              >
                Live Bay Telemetry
              </button>
            </div>
          </div>

          {/* Executive KPI Metrics Grid (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-xl" id="kpiContainer">
            {/* Metric 1: Grounded Vault Value */}
            <div className="p-space-lg rounded-xl bg-surface-container-low shadow-sm flex flex-col justify-between relative group hover:bg-surface-container transition-all border border-outline-variant/10">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
                  Grounded Vault Inventory
                </span>
                <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">warehouse</span>
                </span>
              </div>
              <div>
                <div className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight leading-none mb-1">
                  {viewState === 'skeleton' ? (
                    <span className="inline-block w-36 h-8 bg-surface-container-highest animate-pulse rounded"></span>
                  ) : isRestricted ? (
                    'AED ••••••••'
                  ) : (
                    `AED ${(stats.floorValuationAed / 1000000 || 42.85).toFixed(2)}M`
                  )}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-container-highest/30">
                  <span className="text-body-sm font-body-sm text-on-surface-variant">
                    {vehicles.length || 28} Vault Allocated Units
                  </span>
                  <span className="inline-flex items-center gap-1 font-data-mono-num text-data-mono-num text-tertiary font-semibold">
                    <span className="material-symbols-outlined text-[15px]">trending_up</span> +4.8% MoM
                  </span>
                </div>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>

            {/* Metric 2: Active VIP Leads & PDPL SLA */}
            <div className="p-space-lg rounded-xl bg-surface-container-low shadow-sm flex flex-col justify-between relative group hover:bg-surface-container transition-all border border-outline-variant/10">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
                  Active VIP Inquiries
                </span>
                <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight leading-none">
                    {viewState === 'skeleton' ? (
                      <span className="inline-block w-16 h-8 bg-surface-container-highest animate-pulse rounded"></span>
                    ) : (
                      leads.length || 14
                    )}
                  </span>
                  <span className="font-body-md text-body-md text-tertiary font-medium">
                    Under Negotiation
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-container-highest/30">
                  <span className="text-body-sm font-body-sm text-on-surface-variant">Avg Response SLA</span>
                  <span className="font-data-mono-num text-data-mono-num text-on-surface font-semibold">
                    18 mins
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-label-caps font-label-caps text-on-surface-variant mt-2 pt-1">
                <span>UAE PDPL Compliance</span>
                <span className="text-tertiary font-data-mono-num">98.2% Secure</span>
              </div>
            </div>

            {/* Metric 3: Escrow In-Flight */}
            <div className="p-space-lg rounded-xl bg-surface-container-low shadow-sm flex flex-col justify-between relative group hover:bg-surface-container transition-all border border-outline-variant/10">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
                  Central Bank / FAB Escrow
                </span>
                <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-[18px]">lock_clock</span>
                </span>
              </div>
              <div>
                <div className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight leading-none mb-1">
                  {viewState === 'skeleton' ? (
                    <span className="inline-block w-36 h-8 bg-surface-container-highest animate-pulse rounded"></span>
                  ) : isRestricted ? (
                    'AED [RESTRICTED]'
                  ) : (
                    'AED 3.46M'
                  )}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-container-highest/30">
                  <span className="text-body-sm font-body-sm text-on-surface-variant">3 In-Flight Deeds</span>
                  <span className="inline-flex items-center gap-1 font-body-sm text-body-sm text-secondary font-medium">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span> Bank Locked
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-label-caps font-label-caps text-on-surface-variant mt-2 pt-1">
                <span>Settlement Target</span>
                <span className="font-data-mono-num text-on-surface">T+24 Hours</span>
              </div>
            </div>

            {/* Metric 4: VIP Test Drives Scheduled Today */}
            <div className="p-space-lg rounded-xl bg-surface-container-low shadow-sm flex flex-col justify-between relative group hover:bg-surface-container transition-all border border-outline-variant/10">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
                  VIP Test Drives Today
                </span>
                <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">sports_motorsports</span>
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight leading-none">
                    {viewState === 'skeleton' ? (
                      <span className="inline-block w-12 h-8 bg-surface-container-highest animate-pulse rounded"></span>
                    ) : (
                      '4'
                    )}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface-variant">Confirmed Slots</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-container-highest/30">
                  <span className="text-body-sm font-body-sm text-on-surface-variant">Dubai Autodrome Track</span>
                  <span className="font-data-mono-num text-data-mono-num text-primary font-semibold">2 Slots</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-label-caps font-label-caps text-on-surface-variant mt-2 pt-1">
                <span>Al Quoz Private Lounge</span>
                <span className="font-data-mono-num text-on-surface">2 Slots</span>
              </div>
            </div>
          </div>

          {/* High-Density Analytics & Pipeline Section (2-Column Grid) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-xl">
            {/* Left Column: Active Sales & Escrow Pipeline (7 Cols) */}
            <div className="xl:col-span-7 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-space-md border border-outline-variant/10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                      Active Deal & Escrow Flow
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Live telemetry tracking client verification, dynamic road tests, and escrow disbursements.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-surface-container-high text-label-caps font-label-caps uppercase text-tertiary font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span> 23 Deals in Funnel
                    </span>
                  </div>
                </div>

                {/* Funnel Progression Visualizer */}
                <div className="grid grid-cols-5 gap-1.5 p-1.5 rounded-lg bg-surface-container text-center">
                  <div className="p-2 rounded bg-surface-container-high flex flex-col items-center">
                    <span className="font-data-mono-num text-data-mono-num font-bold text-on-surface">6</span>
                    <span className="font-label-caps text-label-caps text-on-surface-variant mt-0.5 truncate w-full">
                      Enquiry
                    </span>
                  </div>
                  <div className="p-2 rounded bg-surface-container-high flex flex-col items-center">
                    <span className="font-data-mono-num text-data-mono-num font-bold text-secondary">4</span>
                    <span className="font-label-caps text-label-caps text-on-surface-variant mt-0.5 truncate w-full">
                      Drive Slot
                    </span>
                  </div>
                  <div className="p-2 rounded bg-surface-container-high flex flex-col items-center">
                    <span className="font-data-mono-num text-data-mono-num font-bold text-on-surface">3</span>
                    <span className="font-label-caps text-label-caps text-on-surface-variant mt-0.5 truncate w-full">
                      Tasjeel
                    </span>
                  </div>
                  <div className="p-2 rounded bg-surface-container-high flex flex-col items-center">
                    <span className="font-data-mono-num text-data-mono-num font-bold text-primary">2</span>
                    <span className="font-label-caps text-label-caps text-on-surface-variant mt-0.5 truncate w-full">
                      Escrow
                    </span>
                  </div>
                  <div className="p-2 rounded bg-tertiary-container/30 flex flex-col items-center">
                    <span className="font-data-mono-num text-data-mono-num font-bold text-tertiary">8</span>
                    <span className="font-label-caps text-label-caps text-tertiary-fixed-dim mt-0.5 truncate w-full">
                      Dispatched
                    </span>
                  </div>
                </div>

                {/* Pipeline Mini Deal Cards */}
                <div className="flex flex-col gap-space-sm" id="dealCardList">
                  {viewState === 'skeleton' ? (
                    [1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-space-md rounded-lg bg-surface-container flex items-center gap-space-md animate-pulse"
                      >
                        <div className="w-14 h-14 bg-surface-container-highest rounded-lg shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-surface-container-highest rounded w-1/3"></div>
                          <div className="h-3 bg-surface-container-highest rounded w-1/2"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {/* Card 1 */}
                      <div className="p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border border-outline-variant/10">
                        <div className="flex items-center gap-space-md">
                          <div className="w-14 h-14 rounded-lg bg-surface-container-highest overflow-hidden shrink-0 relative">
                            <img
                              className="w-full h-full object-cover"
                              alt="Porsche 911 GT3 RS Weissach Package"
                              src="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=300&q=80"
                            />
                            <span className="absolute bottom-1 right-1 px-1 rounded bg-surface-container-lowest/90 font-data-mono-num text-[9px] text-primary">
                              2024
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate">
                                Porsche 911 GT3 RS
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-caps text-label-caps uppercase">
                                Escrow Locked
                              </span>
                            </div>
                            <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                              <span className="font-medium text-on-surface truncate">
                                Sheikh K. A. • VIP Family Office
                              </span>
                              <span>•</span>
                              <span className="text-primary font-data-mono-num">
                                {isRestricted ? 'AED •••••••• (Requires GM Override)' : 'AED 1,480,000'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 shrink-0">
                          <span className="font-label-caps text-label-caps text-on-surface-variant">
                            SLA Countdown
                          </span>
                          <span className="font-data-mono-num text-data-mono-num text-tertiary font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">timer</span>
                            02h : 14m remaining
                          </span>
                        </div>
                      </div>

                      {/* Card 2 */}
                      <div className="p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border border-outline-variant/10">
                        <div className="flex items-center gap-space-md">
                          <div className="w-14 h-14 rounded-lg bg-surface-container-highest overflow-hidden shrink-0 relative">
                            <img
                              className="w-full h-full object-cover"
                              alt="Mercedes-AMG G63 UAE 50th"
                              src="https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=300&q=80"
                            />
                            <span className="absolute bottom-1 right-1 px-1 rounded bg-surface-container-lowest/90 font-data-mono-num text-[9px] text-secondary">
                              2023
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate">
                                Mercedes-AMG G63 UAE 50th
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-label-caps text-label-caps uppercase">
                                Track Scheduled
                              </span>
                            </div>
                            <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                              <span className="font-medium text-on-surface truncate">
                                Dr. Julian Vance • Geneva Fleet Account
                              </span>
                              <span>•</span>
                              <span className="text-primary font-data-mono-num">
                                {isRestricted ? 'AED •••••••• (Requires GM Override)' : 'AED 1,190,000'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 shrink-0">
                          <span className="font-label-caps text-label-caps text-on-surface-variant">
                            Autodrome Slot
                          </span>
                          <span className="font-data-mono-num text-data-mono-num text-on-surface font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-secondary">flag</span>
                            Today 16:30 GST
                          </span>
                        </div>
                      </div>

                      {/* Card 3 */}
                      <div className="p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border border-outline-variant/10">
                        <div className="flex items-center gap-space-md">
                          <div className="w-14 h-14 rounded-lg bg-surface-container-highest overflow-hidden shrink-0 relative">
                            <img
                              className="w-full h-full object-cover"
                              alt="Ferrari 296 GTB Assetto"
                              src="https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=300&q=80"
                            />
                            <span className="absolute bottom-1 right-1 px-1 rounded bg-surface-container-lowest/90 font-data-mono-num text-[9px] text-tertiary">
                              2023
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate">
                                Ferrari 296 GTB Assetto
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-label-caps text-label-caps uppercase">
                                Tasjeel Hoist
                              </span>
                            </div>
                            <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                              <span className="font-medium text-on-surface truncate">
                                Fahad M. Al-Otaibi • Riyadh Consignment
                              </span>
                              <span>•</span>
                              <span className="text-primary font-data-mono-num">
                                {isRestricted ? 'AED •••••••• (Requires GM Override)' : 'AED 1,650,000'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 shrink-0">
                          <span className="font-label-caps text-label-caps text-on-surface-variant">
                            Inspection Progress
                          </span>
                          <span className="font-data-mono-num text-data-mono-num text-on-surface font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-tertiary">checklist</span>
                            94% Hoist Check
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-body-sm font-body-sm text-on-surface-variant">
                    Showing 3 of 14 priority operations
                  </span>
                  <Link
                    href="/leads"
                    className="text-body-sm font-body-sm text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>View Complete CRM Pipeline</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Live Marketplace & Telemetry Demand (5 Cols) */}
            <div className="xl:col-span-5 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-space-md border border-outline-variant/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                      Market Demand & Telemetry
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Live views & inquiries across SilberArrows digital endpoints.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-data-mono-num text-label-caps">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span> Real-time
                  </span>
                </div>

                {/* Top Vehicles Leaderboard */}
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
                    Top Vehicles Leaderboard
                  </span>
                  <span className="font-data-mono-num text-xs text-primary font-semibold">
                    7-Day Velocity
                  </span>
                </div>
                <div className="flex flex-col gap-space-sm">
                  {/* Item 1 */}
                  <div className="p-space-sm rounded-lg bg-surface-container flex flex-col gap-2 border border-outline-variant/10">
                    <div className="flex items-center justify-between">
                      <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                        Porsche 911 GT3 RS (992)
                      </span>
                      <span className="font-data-mono-num text-data-mono-num text-primary font-bold">
                        1,240 views
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: '88%' }}></div>
                    </div>
                    <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                      <span>18 Inquiries (7 VIP Qualified)</span>
                      <span className="text-tertiary font-data-mono-num">+32% interest surge</span>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="p-space-sm rounded-lg bg-surface-container flex flex-col gap-2 border border-outline-variant/10">
                    <div className="flex items-center justify-between">
                      <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                        Mercedes-AMG G63 UAE 50th
                      </span>
                      <span className="font-data-mono-num text-data-mono-num text-primary font-bold">
                        940 views
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: '68%' }}></div>
                    </div>
                    <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                      <span>12 Inquiries (3 Track Requests)</span>
                      <span className="text-on-surface-variant font-data-mono-num">Steady traffic</span>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="p-space-sm rounded-lg bg-surface-container flex flex-col gap-2 border border-outline-variant/10">
                    <div className="flex items-center justify-between">
                      <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                        Ferrari 296 GTB Assetto
                      </span>
                      <span className="font-data-mono-num text-data-mono-num text-primary font-bold">
                        810 views
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                      <div className="bg-tertiary h-full rounded-full" style={{ width: '54%' }}></div>
                    </div>
                    <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                      <span>9 Inquiries (Consignment Offer)</span>
                      <span className="text-tertiary font-data-mono-num">+14% GCC views</span>
                    </div>
                  </div>
                </div>

                {/* Regional Spec & Geography Ratio Chart */}
                <div className="p-space-md rounded-lg bg-surface-container flex flex-col gap-space-sm mt-1 border border-outline-variant/10">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
                      Buyer Regional Segmentation
                    </span>
                    <span className="font-data-mono-num text-data-mono-num text-on-surface font-semibold">
                      GCC Spec vs International
                    </span>
                  </div>

                  {/* Ratio Visual Bar */}
                  <div className="h-3 w-full rounded-full overflow-hidden flex">
                    <div className="bg-primary h-full" style={{ width: '64%' }} title="UAE Local (64%)"></div>
                    <div className="bg-secondary h-full" style={{ width: '22%' }} title="Saudi Arabia & Qatar (22%)"></div>
                    <div className="bg-surface-container-highest h-full" style={{ width: '14%' }} title="UK / European Export (14%)"></div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center font-label-caps text-label-caps">
                    <div className="flex flex-col">
                      <span className="text-primary font-bold">64% UAE Resident</span>
                      <span className="text-on-surface-variant font-data-mono-num">Al Quoz / Abu Dhabi</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-secondary font-bold">22% KSA & Qatar</span>
                      <span className="text-on-surface-variant font-data-mono-num">Cross-border customs</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-on-surface-variant font-bold">14% EU & UK</span>
                      <span className="text-on-surface-variant font-data-mono-num">Export bonded</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Dealership Activity & RTA Telemetry Log */}
          <div className="p-space-lg rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-space-md mb-space-xl border border-outline-variant/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                  System & Telemetry Audit Log
                </h2>
                <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-caps text-label-caps">
                  Immutable DIFC Ledger
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Autosaved to DIFC Cloud 8s ago
                </span>
              </div>
            </div>

            {/* High-Density DMS Log Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-container-highest text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                    <th className="py-2.5 px-3">Timestamp (GST)</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3">Action Description</th>
                    <th className="py-2.5 px-3">Asset Affected</th>
                    <th className="py-2.5 px-3">Compliance & Hash</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-surface-container-highest/40">
                  <tr className="hover:bg-surface-container/60 transition-colors">
                    <td className="py-3 px-3 font-data-mono-num text-on-surface-variant whitespace-nowrap">14:28:12</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[11px]">
                          MA
                        </span>
                        <span className="font-medium text-on-surface">Marc Ackermann</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">Digital Bill of Sale executed via UAE PASS authentication</td>
                    <td className="py-3 px-3 font-data-mono-num text-primary">WP0AF2A97RS289012</td>
                    <td className="py-3 px-3 font-data-mono-num text-on-surface-variant text-[11px]">
                      RTA-DED-HASH: 9e4a..b12c
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary font-medium text-body-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Verified
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-surface-container/60 transition-colors">
                    <td className="py-3 px-3 font-data-mono-num text-on-surface-variant whitespace-nowrap">13:54:02</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold text-[11px]">
                          TM
                        </span>
                        <span className="font-medium text-on-surface">Tariq Mansoor</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">Tasjeel Technical Inspection certificate uploaded (150-Point Pass)</td>
                    <td className="py-3 px-3 font-data-mono-num text-secondary">ZFF92NHA4P0293108</td>
                    <td className="py-3 px-3 font-data-mono-num text-on-surface-variant text-[11px]">
                      TASJEEL-DXB-98421
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary font-medium text-body-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Approved
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-surface-container/60 transition-colors">
                    <td className="py-3 px-3 font-data-mono-num text-on-surface-variant whitespace-nowrap">12:15:44</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-bold text-[11px]">
                          SYS
                        </span>
                        <span className="font-medium text-on-surface">DMS Central Bank Gateway</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      First Abu Dhabi Bank (FAB) Escrow confirmation received (AED 350K deposit)
                    </td>
                    <td className="py-3 px-3 font-data-mono-num text-primary">W1K4632761X492019</td>
                    <td className="py-3 px-3 font-data-mono-num text-on-surface-variant text-[11px]">
                      FAB-ESC-2024-884
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium text-body-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Locked
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-surface-container/60 transition-colors">
                    <td className="py-3 px-3 font-data-mono-num text-on-surface-variant whitespace-nowrap">11:02:18</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[11px]">
                          MA
                        </span>
                        <span className="font-medium text-on-surface">Marc Ackermann</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      Autodrome Track Booking security clearance approved with VIP Liaison
                    </td>
                    <td className="py-3 px-3 font-data-mono-num text-secondary">DXB-TRACK-2024-09</td>
                    <td className="py-3 px-3 font-data-mono-num text-on-surface-variant text-[11px]">
                      AUTODROME-PASS-A1
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary font-medium text-body-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Scheduled
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive State Control Bar (DMS Operational Persona Switcher) */}
          <div className="p-space-md rounded-xl bg-surface-container-high/60 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-space-md mb-space-xl border border-outline-variant/10">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
              <div>
                <div className="font-body-md text-body-md font-semibold text-on-surface">
                  Executive View State Simulation
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  Switch role and connection states to evaluate visual ergonomics and RBAC behavior.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-lg">
              <button
                type="button"
                id="stateBtnLive"
                onClick={() => {
                  setViewState('live');
                  showToast('Live DMS telemetry active: Full financial metrics and active pipelines.');
                }}
                className={`px-3 py-1.5 rounded font-body-sm text-body-sm transition-all ${
                  viewState === 'live'
                    ? 'font-semibold bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Populated Live Telemetry
              </button>
              <button
                type="button"
                id="stateBtnRestricted"
                onClick={() => {
                  setViewState('restricted');
                  showToast('Permission-Restricted Mode: Financial totals masked for Junior Sales Executive roles.');
                }}
                className={`px-3 py-1.5 rounded font-body-sm text-body-sm transition-all ${
                  viewState === 'restricted'
                    ? 'font-semibold bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Permission-Restricted View (Junior Sales)
              </button>
              <button
                type="button"
                id="stateBtnSkeleton"
                onClick={() => {
                  setViewState('skeleton');
                  showToast('Loading skeleton preview activated.');
                }}
                className={`px-3 py-1.5 rounded font-body-sm text-body-sm transition-all ${
                  viewState === 'skeleton'
                    ? 'font-semibold bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Loading Skeleton
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Intake Vehicle Modal */}
      <VehicleIntakeModal
        tenantId={tenantId}
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onVehicleCreated={(v) => {
          setVehicles((prev) => [v, ...prev]);
          showToast(`Vehicle ${v.makeName} ${v.modelName} ingested into dealer vault.`);
        }}
        locale={locale}
      />

      {/* VIP Lead Modal */}
      {isLeadModalOpen && (
        <div
          id="vip-lead-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-surface-container max-w-md w-full rounded-2xl p-space-xl border border-outline-variant/30 shadow-2xl flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">person_add</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    VIP Lead Intake
                  </h3>
                  <span className="font-label-caps text-label-caps text-primary uppercase">
                    Client Acquisition Desk
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLeadModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Register high-net-worth buyer allocation or track-day session with UAE PASS biometric verification and UAE PDPL 45/2021 purpose-scoped data agreement.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-label-caps uppercase text-on-surface-variant text-[10px] mb-1">
                  Client Full Legal Name / Office
                </label>
                <input
                  type="text"
                  defaultValue="Sheikh K. Al-Nahyan (DIFC Trust)"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-body-sm border border-outline-variant/20 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-label-caps uppercase text-on-surface-variant text-[10px] mb-1">
                  Target Allocation
                </label>
                <select
                  defaultValue="2024 Porsche 911 GT3 RS"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-body-sm border border-outline-variant/20 focus:border-primary focus:outline-none"
                >
                  <option>2024 Porsche 911 GT3 RS (Weissach Package)</option>
                  <option>2023 Mercedes-AMG G63 UAE 50th Edition</option>
                  <option>2023 Ferrari 296 GTB Assetto Fiorano</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => {
                  setIsLeadModalOpen(false);
                  showToast('This is a UI preview only. No UAE PASS handshake or persisted lead was created.');
                }}
                className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-headline-sm text-headline-sm font-semibold hover:opacity-95 transition-opacity"
              >
                Register Allocation
              </button>
              <button
                type="button"
                onClick={() => setIsLeadModalOpen(false)}
                className="px-4 py-2.5 rounded-lg bg-surface-container-high text-on-surface font-body-sm hover:bg-surface-bright transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
