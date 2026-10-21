'use client';

import React, { useState } from 'react';
import { DealerSidebar } from './dealer-sidebar';
import { DealerHeader } from './dealer-header';
import { VehicleIntakeModal } from './vehicle-intake-modal';
import { DealerLeadItem, DealerVehicleItem, InventoryStats } from '../lib/api';

export interface DashboardCockpitViewProps {
  initialVehicles: DealerVehicleItem[];
  initialLeads: DealerLeadItem[];
  stats: InventoryStats;
  locale?: 'en' | 'ar';
}

export const DashboardCockpitView: React.FC<DashboardCockpitViewProps> = ({
  initialVehicles,
  initialLeads,
  stats,
  locale: defaultLocale = 'en',
}) => {
  const [vehicles, setVehicles] = useState<DealerVehicleItem[]>(initialVehicles);
  const [leads, setLeads] = useState<DealerLeadItem[]>(initialLeads);
  const [currentRole, setCurrentRole] = useState<'PRINCIPAL' | 'SALES_REP'>('PRINCIPAL');
  const [locale, setLocale] = useState<'en' | 'ar'>(defaultLocale);
  const isArabic = locale === 'ar';

  const [timeRange, setTimeRange] = useState<'Today' | '7D' | '30D' | 'Q3 FY24'>('Today');
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [activeLeadFilter, setActiveLeadFilter] = useState<'ALL' | 'TEST_DRIVE' | 'OFFER' | 'INSPECTION'>('ALL');

  const updateLeadStatus = (leadId: string, newStatus: DealerLeadItem['status']) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, status: newStatus } : lead))
    );
  };

  const assignLeadStaff = (leadId: string, staffName: string) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, assignedStaffName: staffName } : lead))
    );
  };

  const filteredLeads = leads.filter((lead) => {
    if (activeLeadFilter === 'ALL') return true;
    return lead.intent === activeLeadFilter;
  });

  return (
    <div className={`min-h-screen bg-background text-on-surface flex ${isArabic ? 'rtl' : 'ltr'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Sidebar Navigation */}
      <DealerSidebar
        onIntakeClick={() => setIsIntakeOpen(true)}
        locale={locale}
      />

      <div className="pl-64 min-h-screen flex flex-col flex-1">
        {/* Header Strip */}
        <DealerHeader
          currentRole={currentRole}
          onRoleToggle={() =>
            setCurrentRole((prev) => (prev === 'PRINCIPAL' ? 'SALES_REP' : 'PRINCIPAL'))
          }
          locale={locale}
          onLocaleToggle={() => setLocale((prev) => (prev === 'en' ? 'ar' : 'en'))}
        />

        {/* Main Content Workspace */}
        <main className="w-full pt-16 bg-surface px-6 pb-12 flex-1">
          {/* Operational Telemetry Header / Top Utility Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-4 mb-4 mt-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[10px] font-label-caps uppercase tracking-wider font-semibold border border-white/[0.05]">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                  Tenant ID: SLB-DXB-612048
                </span>
                <span className="text-on-surface-variant font-label-caps text-xs">•</span>
                <span className="text-on-surface-variant font-body-sm text-xs">
                  Multi-Tenant Vault Isolation
                </span>
                <span className="text-on-surface-variant font-label-caps text-xs">•</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-primary font-data-mono-num text-xs border border-primary/20">
                  <span className="material-symbols-outlined text-[13px]">payments</span>
                  AED (UAE Dirham)
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <h1 className="font-headline-lg text-xl sm:text-2xl text-on-surface font-semibold tracking-tight">
                  {isArabic ? 'لوحة القيادة والعمليات التنفيذية' : 'Executive Operations Cockpit'}
                </h1>
                <span className="text-on-surface-variant font-body-sm text-xs hidden sm:inline-block">
                  Al Quoz 1 Vault & Autodrome Logistics Hub
                </span>
              </div>
            </div>

            {/* Actions & Filter Rails */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center bg-surface-container-low p-1 rounded-xl border border-white/[0.06]">
                {(['Today', '7D', '30D', 'Q3 FY24'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-lg font-body-sm text-xs transition-colors ${
                      timeRange === range
                        ? 'bg-surface-container-highest text-on-surface font-semibold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => alert('Generating official RTA/DED Compliance Audit dossier...')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-xs transition-all border border-white/[0.05]"
              >
                <span className="material-symbols-outlined text-[17px]">sim_card_download</span>
                <span>Export RTA/DED Audit</span>
              </button>

              <button
                type="button"
                onClick={() => setIsIntakeOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-xs transition-all border border-white/[0.05]"
              >
                <span className="material-symbols-outlined text-[17px] text-primary">add_box</span>
                <span>Add Unit</span>
              </button>

              <button
                type="button"
                onClick={() => alert('Opening VIP Concierge Lead Creation modal...')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-body-sm text-xs font-bold shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-[17px]">person_add</span>
                <span>Create VIP Lead</span>
              </button>
            </div>
          </div>

          {/* Operational Action Bar / RTA & Tasjeel Active Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Alert 1 */}
            <div className="relative overflow-hidden p-4 rounded-2xl bg-surface-container-low shadow-sm flex items-start gap-3.5 border border-primary/20">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-primary/5 blur-xl pointer-events-none" />
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <span className="material-symbols-outlined text-primary text-[22px]">verified_user</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-label-caps text-[10px] uppercase text-primary tracking-wider font-bold">
                    RTA Title Transfer Queue
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-body-sm text-[11px] font-semibold">
                    1 Digital Signoff Ready
                  </span>
                </div>
                <p className="font-body-md text-xs sm:text-sm text-on-surface font-semibold truncate">
                  2024 Porsche 911 GT3 RS (Weissach Package)
                </p>
                <p className="font-body-sm text-xs text-on-surface-variant flex items-center gap-2 mt-0.5 truncate">
                  <span className="font-data-mono-num">VIN: WP0AF2A97RS289012</span>
                  <span>•</span>
                  <span>Buyer: Sheikh K. Al-Nahyan (DIFC Trust)</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert('Opening RTA Electronic Title Seal review...')}
                className="shrink-0 self-center px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-xs font-semibold transition-all border border-white/[0.05]"
              >
                Review RTA Seal
              </button>
            </div>

            {/* Alert 2 */}
            <div className="relative overflow-hidden p-4 rounded-2xl bg-surface-container-low shadow-sm flex items-start gap-3.5 border border-secondary/20">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-secondary/5 blur-xl pointer-events-none" />
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20">
                <span className="material-symbols-outlined text-secondary text-[22px]">car_repair</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-label-caps text-[10px] uppercase text-secondary tracking-wider font-bold">
                    Tasjeel Al Quoz Bay 3
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-body-sm text-[11px] font-semibold">
                    Hoist Audit In Progress
                  </span>
                </div>
                <p className="font-body-md text-xs sm:text-sm text-on-surface font-semibold truncate">
                  2023 Ferrari 296 GTB Assetto Fiorano
                </p>
                <p className="font-body-sm text-xs text-on-surface-variant flex items-center gap-2 mt-0.5 truncate">
                  <span>ECU Telemetry Diagnostics</span>
                  <span>•</span>
                  <span className="font-data-mono-num text-secondary">142/150 Points Verified</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert('Accessing live Tasjeel hoist inspection bay camera...')}
                className="shrink-0 self-center px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-secondary hover:text-on-secondary text-on-surface text-xs font-semibold transition-all border border-white/[0.05]"
              >
                Live Bay Telemetry
              </button>
            </div>
          </div>

          {/* Executive KPI Metrics Grid (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Metric 1: Grounded Vault Value */}
            <div className="p-4 rounded-2xl bg-surface-container-low shadow-sm flex flex-col justify-between border border-white/[0.06] hover:bg-surface-container transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider font-semibold">
                  Grounded Vault Inventory
                </span>
                <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary border border-white/[0.05]">
                  <span className="material-symbols-outlined text-[18px]">warehouse</span>
                </span>
              </div>
              <div>
                <div className="font-headline-xl text-2xl font-bold text-on-surface tracking-tight leading-none mb-1">
                  AED {(stats.floorValuationAed / 1000000).toFixed(2)}M
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.05]">
                  <span className="text-xs font-body-sm text-on-surface-variant">
                    {vehicles.length} Vault Allocated Units
                  </span>
                  <span className="inline-flex items-center gap-1 font-data-mono-num text-xs text-tertiary font-bold">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span> +4.8% MoM
                  </span>
                </div>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '72%' }} />
              </div>
            </div>

            {/* Metric 2: Active VIP Leads */}
            <div className="p-4 rounded-2xl bg-surface-container-low shadow-sm flex flex-col justify-between border border-white/[0.06] hover:bg-surface-container transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider font-semibold">
                  Active VIP Inquiries
                </span>
                <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary border border-white/[0.05]">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-headline-xl text-2xl font-bold text-on-surface tracking-tight leading-none">
                    {leads.length}
                  </span>
                  <span className="font-body-md text-xs text-tertiary font-semibold">Under Negotiation</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.05]">
                  <span className="text-xs font-body-sm text-on-surface-variant">Avg Response SLA</span>
                  <span className="font-data-mono-num text-xs text-on-surface font-bold">18 mins</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-label-caps text-on-surface-variant mt-2 pt-1">
                <span>UAE PDPL Compliance</span>
                <span className="text-tertiary font-data-mono-num font-bold">98.2% Secure</span>
              </div>
            </div>

            {/* Metric 3: Escrow In-Flight */}
            <div className="p-4 rounded-2xl bg-surface-container-low shadow-sm flex flex-col justify-between border border-white/[0.06] hover:bg-surface-container transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider font-semibold">
                  Central Bank / FAB Escrow
                </span>
                <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary border border-white/[0.05]">
                  <span className="material-symbols-outlined text-[18px]">lock_clock</span>
                </span>
              </div>
              <div>
                <div className="font-headline-xl text-2xl font-bold text-on-surface tracking-tight leading-none mb-1">
                  AED 3.46M
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.05]">
                  <span className="text-xs font-body-sm text-on-surface-variant">3 In-Flight Deeds</span>
                  <span className="inline-flex items-center gap-1 font-body-sm text-xs text-secondary font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> Bank Locked
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-label-caps text-on-surface-variant mt-2 pt-1">
                <span>Settlement Target</span>
                <span className="font-data-mono-num text-xs text-on-surface">T+24 Hours</span>
              </div>
            </div>

            {/* Metric 4: VIP Test Drives Today */}
            <div className="p-4 rounded-2xl bg-surface-container-low shadow-sm flex flex-col justify-between border border-white/[0.06] hover:bg-surface-container transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider font-semibold">
                  VIP Test Drives Today
                </span>
                <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary border border-white/[0.05]">
                  <span className="material-symbols-outlined text-[18px]">sports_motorsports</span>
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-headline-xl text-2xl font-bold text-on-surface tracking-tight leading-none">
                    4
                  </span>
                  <span className="font-body-md text-xs text-on-surface-variant">Confirmed Slots</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.05]">
                  <span className="text-xs font-body-sm text-on-surface-variant">Dubai Autodrome</span>
                  <span className="font-data-mono-num text-xs text-primary font-bold">2 Slots</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-label-caps text-on-surface-variant mt-2 pt-1">
                <span>Al Quoz Private Lounge</span>
                <span className="font-data-mono-num text-xs text-on-surface">2 Slots</span>
              </div>
            </div>
          </div>

          {/* High-Density Analytics & Pipeline Section (2-Column Grid) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-8">
            {/* Left Column: Active Sales & Escrow Pipeline (7 Cols) */}
            <div className="xl:col-span-7 flex flex-col gap-4">
              <div className="p-5 rounded-2xl bg-surface-container-low shadow-sm flex flex-col gap-4 border border-white/[0.06]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="font-headline-md text-base sm:text-lg text-on-surface font-semibold tracking-tight">
                      Active Deal & Escrow Flow
                    </h2>
                    <p className="font-body-sm text-xs text-on-surface-variant">
                      Live telemetry tracking client verification, dynamic road tests, and escrow disbursements.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-surface-container-high text-[10px] font-label-caps uppercase text-tertiary font-bold flex items-center gap-1 border border-tertiary/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> 23 Deals in Funnel
                  </span>
                </div>

                {/* Funnel Progression Visualizer */}
                <div className="grid grid-cols-5 gap-1.5 p-1.5 rounded-xl bg-surface-container text-center border border-white/[0.04]">
                  <div className="p-2 rounded-lg bg-surface-container-high flex flex-col items-center">
                    <span className="font-data-mono-num text-xs font-bold text-on-surface">6</span>
                    <span className="font-label-caps text-[9px] text-on-surface-variant mt-0.5 uppercase">Enquiry</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-high flex flex-col items-center">
                    <span className="font-data-mono-num text-xs font-bold text-secondary">4</span>
                    <span className="font-label-caps text-[9px] text-on-surface-variant mt-0.5 uppercase">Drive Slot</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-high flex flex-col items-center">
                    <span className="font-data-mono-num text-xs font-bold text-on-surface">3</span>
                    <span className="font-label-caps text-[9px] text-on-surface-variant mt-0.5 uppercase">Tasjeel</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-high flex flex-col items-center">
                    <span className="font-data-mono-num text-xs font-bold text-primary">2</span>
                    <span className="font-label-caps text-[9px] text-on-surface-variant mt-0.5 uppercase">Escrow</span>
                  </div>
                  <div className="p-2 rounded-lg bg-tertiary-container/30 flex flex-col items-center border border-tertiary/30">
                    <span className="font-data-mono-num text-xs font-bold text-tertiary">8</span>
                    <span className="font-label-caps text-[9px] text-tertiary mt-0.5 uppercase font-bold">Dispatched</span>
                  </div>
                </div>

                {/* Pipeline Mini Lead Cards */}
                <div className="flex flex-col gap-2.5">
                  {leads.map((lead) => {
                    const askingAed = Math.round(Number(lead.askingPriceFils) / 100).toLocaleString('en-US');

                    return (
                      <div
                        key={lead.id}
                        className="p-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/[0.04]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-surface-container-highest overflow-hidden shrink-0 relative border border-white/[0.06]">
                            <img
                              src="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=300&q=80"
                              alt={lead.listingTitle}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-surface-container-lowest/90 font-data-mono-num text-[8px] text-primary font-bold">
                              {lead.intent === 'TEST_DRIVE' ? 'VIP' : 'DEAL'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-headline-sm text-xs sm:text-sm font-semibold text-on-surface truncate">
                                {lead.listingTitle}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-caps text-[9px] uppercase font-bold border border-primary/20">
                                {lead.status}
                              </span>
                            </div>
                            <div className="font-body-sm text-xs text-on-surface-variant flex items-center gap-2 mt-0.5">
                              <span className="font-medium text-on-surface truncate">
                                {lead.buyerContact.name || lead.buyerDisplayName}
                              </span>
                              <span>•</span>
                              <span className="font-data-mono-num text-primary font-semibold">
                                AED {askingAed}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 shrink-0 text-right">
                          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">
                            SLA Timeline
                          </span>
                          <span className="font-data-mono-num text-xs text-tertiary font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">timer</span>
                            02h : 14m left
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Lead Management & Field-Level Consent Inbox (5 Cols) */}
            <div className="xl:col-span-5 flex flex-col gap-4">
              <div className="p-5 rounded-2xl bg-surface-container-low shadow-sm flex flex-col gap-4 border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline-md text-base text-on-surface font-semibold">
                      CRM Lead Protocol & PDPL Inbox
                    </h3>
                    <p className="font-body-sm text-xs text-on-surface-variant">
                      Dealers may only read fields authorized by buyer consent grant.
                    </p>
                  </div>
                  <a href="/leads" className="text-xs text-primary hover:underline font-semibold">
                    View All
                  </a>
                </div>

                {/* Filter pills */}
                <div className="flex items-center gap-1.5">
                  {(['ALL', 'TEST_DRIVE', 'OFFER', 'INSPECTION'] as const).map((intent) => (
                    <button
                      key={intent}
                      type="button"
                      onClick={() => setActiveLeadFilter(intent)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        activeLeadFilter === intent
                          ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {intent === 'ALL' ? 'All Leads' : intent.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* Leads Detailed Cards */}
                <div className="flex flex-col gap-3">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3.5 rounded-xl bg-surface-container flex flex-col gap-2.5 border border-white/[0.05]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-body-md text-xs sm:text-sm font-bold text-on-surface">
                          {lead.buyerContact.name || lead.buyerDisplayName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-[10px] font-label-caps uppercase text-secondary font-semibold">
                          {lead.intent}
                        </span>
                      </div>

                      {/* Field-level Grant Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-outline font-label-caps uppercase">Granted:</span>
                        {lead.buyerContact.name ? (
                          <span className="px-1.5 py-0.5 rounded bg-tertiary/15 text-tertiary text-[10px] font-medium flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[11px]">check</span> Name
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-outline text-[10px]">
                            Name Masked
                          </span>
                        )}
                        {lead.buyerContact.phone ? (
                          <span className="px-1.5 py-0.5 rounded bg-tertiary/15 text-tertiary text-[10px] font-medium flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[11px]">check</span> Phone
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-outline text-[10px]">
                            Phone Masked
                          </span>
                        )}
                        {lead.buyerContact.email ? (
                          <span className="px-1.5 py-0.5 rounded bg-tertiary/15 text-tertiary text-[10px] font-medium flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[11px]">check</span> Email
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-outline text-[10px]">
                            Email Masked
                          </span>
                        )}
                      </div>

                      {/* Contact Channels */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.04]">
                        <span className="text-on-surface-variant font-data-mono-num">
                          {lead.buyerContact.phone || 'Protected Contact'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {lead.buyerContact.phone && (
                            <a
                              href={`https://wa.me/${lead.buyerContact.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] font-semibold text-[11px] flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[13px]">chat</span>
                              <span>WhatsApp</span>
                            </a>
                          )}
                          <select
                            value={lead.assignedStaffName || ''}
                            onChange={(e) => assignLeadStaff(lead.id, e.target.value)}
                            className="bg-surface-container-high text-on-surface font-body-sm text-[11px] px-2 py-1 rounded border border-white/[0.06] cursor-pointer"
                            title="Assign Dealership Staff"
                          >
                            <option value="">Unassigned</option>
                            <option value="Marc Ackermann">Marc Ackermann</option>
                            <option value="Tariq Mansoor">Tariq Mansoor</option>
                          </select>
                          <select
                            value={lead.status}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value as any)}
                            className="bg-surface-container-high text-on-surface font-body-sm text-[11px] px-2 py-1 rounded border border-white/[0.06] cursor-pointer"
                          >
                            <option value="NEW">NEW</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="QUALIFIED">QUALIFIED</option>
                            <option value="DEPOSIT_TAKEN">DEPOSIT TAKEN</option>
                            <option value="LOST">LOST</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Intake Vehicle Modal */}
      <VehicleIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onVehicleCreated={(v) => setVehicles((prev) => [v, ...prev])}
        locale={locale}
      />
    </div>
  );
};
