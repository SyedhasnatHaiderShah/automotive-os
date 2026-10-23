'use client';

import React, { useState } from 'react';
import { DealerSidebar } from './dealer-sidebar';
import { DealerHeader } from './dealer-header';
import { VehicleIntakeModal } from './vehicle-intake-modal';
import { DealerVehicleItem, InventoryStats } from '../lib/api';

export interface InventoryMatrixViewProps {
  initialVehicles: DealerVehicleItem[];
  initialStats: InventoryStats;
  locale?: 'en' | 'ar';
}

export const InventoryMatrixView: React.FC<InventoryMatrixViewProps> = ({
  initialVehicles,
  initialStats,
  locale: defaultLocale = 'en',
}) => {
  const [vehicles, setVehicles] = useState<DealerVehicleItem[]>(initialVehicles);
  const [stats, setStats] = useState<InventoryStats>(initialStats);
  const [currentRole, setCurrentRole] = useState<'PRINCIPAL' | 'SALES_REP'>('PRINCIPAL');
  const [locale, setLocale] = useState<'en' | 'ar'>(defaultLocale);
  const isArabic = locale === 'ar';

  const [activeFilter, setActiveFilter] = useState<'all' | 'published' | 'review' | 'escrow' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set([vehicles[0]?.id || '']));
  const [revealedVins, setRevealedVins] = useState<Set<string>>(new Set());
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [rtaSyncStatus, setRtaSyncStatus] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredVehicles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVehicles.map((v) => v.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVinReveal = (id: string) => {
    setRevealedVins((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyVin = (vin: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(vin);
      alert(isArabic ? `تم نسخ رقم الشاسيه: ${vin}` : `Chassis VIN copied: ${vin}`);
    }
  };

  const handleForceRtaSync = () => {
    setRtaSyncStatus('RTA Unified Database synced at ' + new Date().toLocaleTimeString());
    setTimeout(() => setRtaSyncStatus(null), 4000);
  };

  const handleVehicleCreated = (newVehicle: DealerVehicleItem) => {
    setVehicles((prev) => [newVehicle, ...prev]);
    setStats((prev) => ({
      ...prev,
      totalUnits: prev.totalUnits + 1,
      floorValuationAed: prev.floorValuationAed + Math.round(Number(newVehicle.askingPriceFils) / 100),
      underReviewCount: newVehicle.listingStatus === 'PENDING_REVIEW' ? prev.underReviewCount + 1 : prev.underReviewCount,
      draftCount: newVehicle.listingStatus === 'DRAFT' ? prev.draftCount + 1 : prev.draftCount,
    }));
  };

  // Filter criteria
  const filteredVehicles = vehicles.filter((v) => {
    // Tab filter
    if (activeFilter === 'published' && v.listingStatus !== 'PUBLISHED') return false;
    if (activeFilter === 'review' && v.listingStatus !== 'PENDING_REVIEW') return false;
    if (activeFilter === 'escrow' && v.stockStatus !== 'RESERVED') return false;
    if (activeFilter === 'draft' && (v.listingStatus && v.listingStatus !== 'DRAFT')) return false;

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchMake = v.makeName.toLowerCase().includes(query);
      const matchModel = v.modelName.toLowerCase().includes(query);
      const matchVin = v.vin.toLowerCase().includes(query);
      const matchStock = v.stockNumber.toLowerCase().includes(query);
      if (!matchMake && !matchModel && !matchVin && !matchStock) return false;
    }

    return true;
  });

  const selectedVehicles = vehicles.filter((v) => selectedIds.has(v.id));
  const combinedSelectedValue = selectedVehicles.reduce(
    (sum, v) => sum + Math.round(Number(v.askingPriceFils) / 100),
    0
  );

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
          {/* Sub-Canvas Studio Ambient Layer */}
          <div className="relative w-full overflow-hidden rounded-2xl bg-surface-container-lowest p-6 mb-6 shadow-xl border border-white/[0.05] mt-4">
            <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 -bottom-32 w-80 h-80 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

            {/* Top Row: Operational Telemetry Bar & Role Switch Simulator */}
            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-label-caps text-xs uppercase text-primary tracking-widest flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    Live Vault Telemetry
                  </span>
                  <span className="font-body-sm text-xs text-on-surface-variant">/</span>
                  <span className="font-body-sm text-xs text-on-surface-variant">SilberArrows FZCO</span>
                  <span className="font-label-caps text-[10px] bg-surface-container-high px-2 py-0.5 rounded text-tertiary font-bold border border-tertiary/20">
                    Tenant Isolated #0829
                  </span>
                </div>
                <h1 className="font-headline-lg text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                  {isArabic ? 'مصفوفة وتيليمتري مخزون المركبات' : 'Vehicle Inventory & Telemetry Matrix'}
                </h1>
              </div>

              {/* Quick Action Controls & Role Switch Simulator */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="bg-surface-container-high/90 backdrop-blur-md p-1 rounded-xl flex items-center gap-1 text-on-surface border border-white/[0.06]">
                  <button
                    type="button"
                    id="view-principal-btn"
                    onClick={() => setCurrentRole('PRINCIPAL')}
                    className={`px-3 py-1.5 rounded-lg font-body-sm text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      currentRole === 'PRINCIPAL'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                    <span>Dealer Principal</span>
                  </button>
                  <button
                    type="button"
                    id="view-rep-btn"
                    onClick={() => setCurrentRole('SALES_REP')}
                    className={`px-3 py-1.5 rounded-lg font-body-sm text-xs transition-all flex items-center gap-1.5 ${
                      currentRole === 'SALES_REP'
                        ? 'bg-primary text-on-primary font-semibold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">badge</span>
                    <span>Sales Executive</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleForceRtaSync}
                  className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-3.5 py-2 rounded-xl font-body-sm text-xs font-medium flex items-center gap-1.5 transition-all border border-white/[0.05]"
                >
                  <span className="material-symbols-outlined text-[17px] text-tertiary">cloud_sync</span>
                  <span>Force RTA Sync</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsIntakeOpen(true)}
                  className="bg-primary hover:bg-primary-fixed-dim text-on-primary px-4 py-2 rounded-xl font-body-sm text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">add_box</span>
                  <span>Intake Vehicle</span>
                </button>
              </div>
            </div>

            {rtaSyncStatus && (
              <div className="relative z-10 mb-4 p-2.5 rounded-xl bg-tertiary-container/15 text-tertiary text-xs flex items-center gap-2 border border-tertiary/20 animate-fade-in">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{rtaSyncStatus}</span>
              </div>
            )}

            {/* Precision Studio Glass Cards */}
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {/* Card 1: Total Units */}
              <div className="bg-surface-container-high/70 backdrop-blur-lg p-4 rounded-xl flex flex-col justify-between border border-white/[0.05]">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-caps text-[10px] uppercase tracking-wider font-semibold">
                    Vault Stock
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-primary">warehouse</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-headline-xl text-2xl font-bold text-on-surface">
                    {stats.totalUnits}
                  </span>
                  <span className="font-body-sm text-xs text-on-surface-variant">Units Allocated</span>
                </div>
                <div className="mt-2 w-full bg-surface-container-highest rounded-full h-1 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '56%' }} />
                </div>
              </div>

              {/* Card 2: Floor Valuation */}
              <div className="bg-surface-container-high/70 backdrop-blur-lg p-4 rounded-xl flex flex-col justify-between border border-white/[0.05]">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-caps text-[10px] uppercase tracking-wider font-semibold">
                    Floor Valuation
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-tertiary">account_balance</span>
                </div>
                <div className="mt-2 flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-label-caps text-xs text-primary font-bold">AED</span>
                    <span
                      id="stat-floor-val"
                      className="font-headline-md text-base sm:text-lg font-bold text-on-surface font-data-mono-num"
                    >
                      {stats.floorValuationAed.toLocaleString('en-US')}
                    </span>
                  </div>
                  <span className="font-body-sm text-[11px] text-tertiary flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px]">trending_up</span> +3.8% vs last cycle
                  </span>
                </div>
              </div>

              {/* Card 3: Live Marketplace */}
              <div className="bg-surface-container-high/70 backdrop-blur-lg p-4 rounded-xl flex flex-col justify-between border border-white/[0.05]">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-caps text-[10px] uppercase tracking-wider font-semibold">
                    Live Marketplace
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary ring-4 ring-tertiary/20" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-headline-xl text-2xl font-bold text-on-surface">
                    {stats.publishedCount}
                  </span>
                  <span className="font-body-sm text-xs text-tertiary font-semibold">Active Feeds</span>
                </div>
                <div className="mt-2 font-body-sm text-[11px] text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">public</span> DubiCars & Portal
                </div>
              </div>

              {/* Card 4: Pending Review */}
              <div className="bg-surface-container-high/70 backdrop-blur-lg p-4 rounded-xl flex flex-col justify-between border border-white/[0.05]">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-caps text-[10px] uppercase tracking-wider font-semibold">
                    Pending Review
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-headline-xl text-2xl font-bold text-primary">
                    {stats.underReviewCount}
                  </span>
                  <span className="font-body-sm text-xs text-on-surface-variant">Units Held</span>
                </div>
                <div className="mt-2 font-body-sm text-[11px] text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">history_edu</span> Tasjeel 150-Point
                </div>
              </div>

              {/* Card 5: In Escrow */}
              <div className="bg-surface-container-high/70 backdrop-blur-lg p-4 rounded-xl flex flex-col justify-between col-span-2 lg:col-span-1 border border-white/[0.05]">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-caps text-[10px] uppercase tracking-wider font-semibold">
                    In Escrow
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-secondary">verified_user</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-headline-xl text-2xl font-bold text-secondary">
                    {stats.escrowCount}
                  </span>
                  <span className="font-body-sm text-xs text-on-surface-variant">Central Bank FAB</span>
                </div>
                <div className="mt-2 font-body-sm text-[11px] text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">lock</span> AED 6.9M Pending
                </div>
              </div>
            </div>
          </div>

          {/* Role Permission Alert Strip (Shows when in Sales Rep mode) */}
          {currentRole === 'SALES_REP' && (
            <div
              id="role-alert-banner"
              className="mb-4 p-4 rounded-2xl bg-surface-container-high border-l-4 border-primary flex items-center justify-between shadow-lg animate-fade-in border border-white/[0.06]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">visibility_off</span>
                </div>
                <div>
                  <div className="font-body-md text-xs sm:text-sm font-semibold text-on-surface">
                    Restricted Sales Representative Perspective
                  </div>
                  <div className="font-body-sm text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                    Acquisition cost ledgers and dealer markup spreads are encrypted. Financial clearance updates require Principal PIN #01-DXB.
                  </div>
                </div>
              </div>
              <span className="font-label-caps text-[10px] bg-surface-container px-3 py-1 rounded-full text-primary font-bold border border-primary/20 shrink-0">
                Access Level: Tier-2 Operational
              </span>
            </div>
          )}

          {/* Search & Multifaceted Filter Rail */}
          <div className="bg-surface-container-low rounded-2xl p-4 mb-4 flex flex-col gap-3.5 shadow-md border border-white/[0.06]">
            {/* Search and Direct Criteria Row */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Input Field */}
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  id="vin-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by Marque, VIN (WP0...), Model, Stock ID (#DXB-911) or Chassis..."
                  className="w-full h-10 pl-10 pr-9 rounded-xl bg-surface-container-high text-on-surface font-body-md text-xs sm:text-sm placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary border border-white/[0.06] transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    id="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

              {/* Quick Selector Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeFilter === 'all'
                      ? 'bg-on-surface text-surface shadow-sm'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-white/[0.05]'
                  }`}
                >
                  <span>All Units</span>
                  <span className="text-[10px] bg-surface-container-highest px-1.5 py-0.2 rounded-full text-on-surface">
                    {vehicles.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('published')}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-xs font-medium transition-all flex items-center gap-1.5 ${
                    activeFilter === 'published'
                      ? 'bg-on-surface text-surface font-semibold shadow-sm'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-white/[0.05]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                  <span>Published</span>
                  <span className="text-[10px] opacity-70">
                    {vehicles.filter((v) => v.listingStatus === 'PUBLISHED').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('review')}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-xs font-medium transition-all flex items-center gap-1.5 ${
                    activeFilter === 'review'
                      ? 'bg-on-surface text-surface font-semibold shadow-sm'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-white/[0.05]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Under Review</span>
                  <span className="text-[10px] opacity-70">
                    {vehicles.filter((v) => v.listingStatus === 'PENDING_REVIEW').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('escrow')}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-xs font-medium transition-all flex items-center gap-1.5 ${
                    activeFilter === 'escrow'
                      ? 'bg-on-surface text-surface font-semibold shadow-sm'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-white/[0.05]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>Sold / Escrow</span>
                  <span className="text-[10px] opacity-70">
                    {vehicles.filter((v) => v.stockStatus === 'RESERVED' || v.stockStatus === 'SOLD').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('draft')}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-xs font-medium transition-all flex items-center gap-1.5 ${
                    activeFilter === 'draft'
                      ? 'bg-on-surface text-surface font-semibold shadow-sm'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-white/[0.05]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                  <span>Draft</span>
                  <span className="text-[10px] opacity-70">
                    {vehicles.filter((v) => !v.listingStatus || v.listingStatus === 'DRAFT').length}
                  </span>
                </button>
              </div>
            </div>

            {/* Secondary Multifacet Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-white/[0.05]">
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-8 px-2.5 rounded-lg bg-surface-container-high text-on-surface font-body-sm text-xs flex items-center gap-1.5 border border-white/[0.05]">
                  <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
                  <span>Regional Spec: <strong>GCC Compliant</strong></span>
                </div>
                <div className="h-8 px-2.5 rounded-lg bg-surface-container-high text-on-surface font-body-sm text-xs flex items-center gap-1.5 border border-white/[0.05]">
                  <span className="material-symbols-outlined text-[15px] text-on-surface-variant">storefront</span>
                  <span>Hub: <strong>Al Quoz 1</strong></span>
                </div>
                <div className="h-8 px-2.5 rounded-lg bg-surface-container-high text-on-surface font-body-sm text-xs flex items-center gap-1.5 border border-white/[0.05]">
                  <span className="material-symbols-outlined text-[15px] text-tertiary">fact_check</span>
                  <span>Tasjeel Cert: <strong>Verified Only</strong></span>
                </div>
                <div className="h-8 px-2.5 rounded-lg bg-surface-container-high text-on-surface-variant font-body-sm text-xs flex items-center gap-1.5 border border-white/[0.05]">
                  <span>AED 350K - 4.5M</span>
                  <span className="material-symbols-outlined text-[14px]">tune</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('all');
                    setSearchQuery('');
                  }}
                  className="h-8 px-2.5 rounded-lg text-on-surface-variant hover:text-on-surface font-body-sm text-xs flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert('Exporting full canonical inventory CSV...')}
                  className="h-8 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-xs flex items-center gap-1.5 transition-colors border border-white/[0.05]"
                >
                  <span className="material-symbols-outlined text-[15px]">file_download</span>
                  <span>Export Sheet (CSV)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Action Bar (Surfaces when rows are checked) */}
          {selectedIds.size > 0 && (
            <div
              id="bulk-action-bar"
              className="mb-4 p-3.5 rounded-2xl bg-surface-container-high shadow-2xl flex flex-wrap items-center justify-between gap-3 border border-white/[0.07] animate-fade-in"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-primary/20 text-primary px-3 py-1 rounded-lg border border-primary/30">
                  <span className="material-symbols-outlined text-[17px]">check_box</span>
                  <span className="font-body-sm text-xs font-bold">
                    <span id="selected-count">{selectedIds.size}</span> Vehicles Selected
                  </span>
                </div>
                <div className="font-body-sm text-xs text-on-surface-variant">
                  Combined Value:{' '}
                  <strong className="text-on-surface font-data-mono-num font-bold">
                    AED {combinedSelectedValue.toLocaleString('en-US')}
                  </strong>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert('Adjusting prices for ' + selectedIds.size + ' units')}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface font-body-sm text-xs font-medium flex items-center gap-1.5 transition-all border border-white/[0.06]"
                >
                  <span className="material-symbols-outlined text-[15px] text-primary">percent</span>
                  <span>Bulk Price Adjustment</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert('Exporting official RTA compliance dossier for selected vehicles...')}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface font-body-sm text-xs font-medium flex items-center gap-1.5 transition-all border border-white/[0.06]"
                >
                  <span className="material-symbols-outlined text-[15px] text-tertiary">verified</span>
                  <span>Export RTA Compliance</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert('Batch publishing ' + selectedIds.size + ' listings to portal outbox')}
                  className="px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-fixed-dim font-body-sm text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-[15px]">rocket_launch</span>
                  <span>Batch Push to Marketplace</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVehicles((prev) =>
                      prev.map((v) =>
                        selectedIds.has(v.id)
                          ? { ...v, stockStatus: 'SOLD', listingStatus: 'UNPUBLISHED' }
                          : v
                      )
                    );
                    setSelectedIds(new Set());
                  }}
                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-error-container hover:text-on-error-container text-on-surface-variant font-body-sm text-xs transition-all flex items-center gap-1 border border-white/[0.05]"
                >
                  <span className="material-symbols-outlined text-[15px]">archive</span>
                  <span>Mark Sold / Archive</span>
                </button>
              </div>
            </div>
          )}

          {/* High-Density Telemetry Inventory Table Container */}
          <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-white/[0.07]">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                {/* Table Head */}
                <thead>
                  <tr className="bg-surface-container h-12 text-on-surface-variant font-label-caps text-[10px] uppercase tracking-wider select-none border-b border-white/[0.06]">
                    <th className="w-12 px-4 text-center">
                      <input
                        type="checkbox"
                        id="select-all-check"
                        checked={selectedIds.size === filteredVehicles.length && filteredVehicles.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded bg-surface-container-high border-0 accent-primary text-primary focus:ring-0 cursor-pointer w-4 h-4"
                      />
                    </th>
                    <th className="py-2.5 px-4">Vehicle Marque & Stock Unit</th>
                    <th className="py-2.5 px-4">Chassis VIN & RTA Status</th>
                    <th className="py-2.5 px-4">Engineering & GCC Compliance</th>
                    <th className="py-2.5 px-4">Market State</th>
                    <th className="py-2.5 px-4 text-right">Acquisition / Asking</th>
                    <th className="py-2.5 px-4 text-center">Inquiries</th>
                    <th className="py-2.5 px-4 text-right">Dossier Actions</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody
                  id="inventory-table-body"
                  className="font-body-md text-xs sm:text-sm text-on-surface divide-y divide-white/[0.04]"
                >
                  {filteredVehicles.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-on-surface-variant font-body-md">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <span className="material-symbols-outlined text-5xl text-outline/60">inventory_2</span>
                          <span className="text-base font-semibold text-on-surface">No vehicles found in dealership stock</span>
                          <span className="text-xs text-on-surface-variant max-w-sm">
                            The dealership stock ledger is empty or no vehicles match your active search filters.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {filteredVehicles.map((vehicle) => {
                    const isSelected = selectedIds.has(vehicle.id);
                    const isVinRevealed = revealedVins.has(vehicle.id);
                    const askingAed = Math.round(Number(vehicle.askingPriceFils) / 100);
                    const costAed = vehicle.purchaseCostFils ? Math.round(Number(vehicle.purchaseCostFils) / 100) : null;
                    const marginPercent = costAed ? Math.round(((askingAed - costAed) / costAed) * 100) : 0;

                    const maskedVinString = isVinRevealed
                      ? vehicle.vin
                      : `${vehicle.vin.slice(0, 10)}••••••`;

                    return (
                      <tr
                        key={vehicle.id}
                        className={`group hover:bg-surface-container/60 transition-colors ${
                          isSelected ? 'bg-surface-container/30' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="w-12 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(vehicle.id)}
                            className="rounded bg-surface-container-high accent-primary text-primary focus:ring-0 cursor-pointer w-4 h-4"
                          />
                        </td>

                        {/* Vehicle Info & Media */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-16 h-11 rounded-lg overflow-hidden shrink-0 bg-surface-container-high border border-white/[0.06]">
                              <img
                                src={vehicle.mediaUrl}
                                alt={vehicle.modelName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-surface-container-lowest/90 font-data-mono-num text-[9px] text-primary font-bold">
                                {vehicle.modelYear}
                              </span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="font-body-md text-xs sm:text-sm font-bold text-on-surface truncate flex items-center gap-1.5">
                                <span>{vehicle.makeName} {vehicle.modelName}</span>
                                {vehicle.trim && (
                                  <span className="text-[11px] font-normal text-on-surface-variant font-data-mono-num">
                                    {vehicle.trim}
                                  </span>
                                )}
                              </div>
                              <div className="font-label-caps text-[10px] text-on-surface-variant font-data-mono-num mt-0.5">
                                {vehicle.stockNumber} • {vehicle.colorExterior}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* VIN & RTA Status */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-data-mono-num text-xs text-on-surface font-semibold tracking-wider">
                                {maskedVinString}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleVinReveal(vehicle.id)}
                                className="p-0.5 rounded text-on-surface-variant hover:text-primary transition-colors"
                                title={isVinRevealed ? 'Mask VIN' : 'Reveal Full VIN'}
                              >
                                <span className="material-symbols-outlined text-[15px]">
                                  {isVinRevealed ? 'visibility_off' : 'visibility'}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => copyVin(vehicle.vin)}
                                className="p-0.5 rounded text-on-surface-variant hover:text-on-surface transition-colors"
                                title="Copy VIN"
                              >
                                <span className="material-symbols-outlined text-[15px]">content_copy</span>
                              </button>
                            </div>
                            {vehicle.rtaVerified ? (
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                                <span className="text-tertiary font-medium">RTA Verified</span>
                                <span className="text-on-surface-variant">{vehicle.tasjeelScore || 'Certified Pass'}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[11px] text-outline">
                                <span className="w-1.5 h-1.5 rounded-full bg-outline/40" />
                                <span className="font-normal text-on-surface-variant/80">RTA Inspection:</span>
                                <span className="italic">{vehicle.tasjeelScore || 'Not Certified'}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Engineering & GCC Compliance */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="text-xs text-on-surface flex items-center gap-1.5">
                              {vehicle.gccSpec && (
                                <span className="bg-surface-container-high px-1.5 py-0.5 rounded text-[10px] text-primary font-bold border border-primary/20">
                                  GCC Spec
                                </span>
                              )}
                              <span>Agency Stock</span>
                            </div>
                            <div className="text-[11px] text-on-surface-variant font-data-mono-num">
                              {vehicle.engineSpec || '4.0L Bi-Turbo'} • {vehicle.horsepower || '500+ HP'} •{' '}
                              {vehicle.mileageKm ? `${vehicle.mileageKm.toLocaleString()} KM` : 'New'}
                            </div>
                          </div>
                        </td>

                        {/* Status Pill */}
                        <td className="py-3 px-4">
                          {vehicle.listingStatus === 'PUBLISHED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-tertiary/15 text-tertiary border border-tertiary/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                              Published
                            </span>
                          )}
                          {vehicle.listingStatus === 'PENDING_REVIEW' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              Under Review
                            </span>
                          )}
                          {vehicle.stockStatus === 'RESERVED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                              In Escrow
                            </span>
                          )}
                          {vehicle.stockStatus === 'SOLD' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container-highest text-on-surface-variant">
                              Sold / Archived
                            </span>
                          )}
                          {vehicle.listingStatus === 'UNPUBLISHED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant border border-white/[0.05]">
                              Unpublished
                            </span>
                          )}
                          {(!vehicle.listingStatus || vehicle.listingStatus === 'DRAFT') && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container-high text-outline">
                              Draft
                            </span>
                          )}
                          <div className="font-label-caps text-[10px] text-on-surface-variant mt-1">
                            {vehicle.listingStatus === 'PUBLISHED' ? 'Live DubiCars & Portal' : 'Dealer Vault Only'}
                          </div>
                        </td>

                        {/* Acquisition vs Asking */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <div className="font-data-mono-num text-xs sm:text-sm font-bold text-on-surface">
                              <span className="text-xs font-normal text-on-surface-variant">AED</span>{' '}
                              {askingAed.toLocaleString('en-US')}
                            </div>
                            {currentRole === 'PRINCIPAL' && costAed && (
                              <div className="flex items-center gap-1 mt-0.5 text-[11px] font-data-mono-num">
                                <span className="text-on-surface-variant">
                                  Acq: AED {costAed.toLocaleString('en-US')}
                                </span>
                                <span className="text-tertiary bg-tertiary/10 px-1 rounded font-bold">
                                  +{marginPercent}%
                                </span>
                              </div>
                            )}
                            {currentRole === 'SALES_REP' && (
                              <div className="text-[10px] text-outline italic mt-0.5">
                                Cost encrypted
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Inquiries */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-data-mono-num text-xs font-bold text-on-surface">
                              {vehicle.inquiriesCount}
                            </span>
                            <span className="text-[10px] text-primary flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[12px]">sports_motorsports</span>
                              {vehicle.vipBookingsCount} Drives
                            </span>
                          </div>
                        </td>

                        {/* Dossier Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {vehicle.listingStatus === 'PUBLISHED' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setVehicles((prev) =>
                                    prev.map((v) =>
                                      v.id === vehicle.id ? { ...v, listingStatus: 'UNPUBLISHED' } : v
                                    )
                                  );
                                }}
                                className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[11px] font-medium"
                                title="Unpublish from live marketplace"
                              >
                                Unpublish
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setVehicles((prev) =>
                                    prev.map((v) =>
                                      v.id === vehicle.id ? { ...v, listingStatus: 'PENDING_REVIEW' } : v
                                    )
                                  );
                                }}
                                className="px-2 py-1 rounded bg-primary text-on-primary text-[11px] font-bold shadow-sm"
                                title="Submit to admin moderation"
                              >
                                Submit
                              </button>
                            )}
                            <a
                              href="/leads"
                              className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
                              title="View Leads for this stock"
                            >
                              <span className="material-symbols-outlined text-[17px]">filter_alt</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Intake Vehicle Modal */}
      <VehicleIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onVehicleCreated={handleVehicleCreated}
        locale={locale}
      />
    </div>
  );
};
