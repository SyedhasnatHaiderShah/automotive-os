'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  SavedRadarItem,
  SavedVehicleFavorite,
  DEFAULT_SAVED_RADARS,
  DEFAULT_SAVED_FAVORITES,
  removeFavoriteApi,
  deleteSavedRadarApi,
} from '../lib/api';

interface BuyerSavedViewProps {
  initialRadars?: SavedRadarItem[];
  initialFavorites?: SavedVehicleFavorite[];
}

export function BuyerSavedView({
  initialRadars = DEFAULT_SAVED_RADARS,
  initialFavorites = DEFAULT_SAVED_FAVORITES,
}: BuyerSavedViewProps) {
  const [radars, setRadars] = useState<SavedRadarItem[]>(initialRadars);
  const [favorites, setFavorites] = useState<SavedVehicleFavorite[]>(initialFavorites);
  const [activeTab, setActiveTab] = useState<'favs' | 'searches' | 'archived'>('favs');
  const [demoState, setDemoState] = useState<'default' | 'empty' | 'loading'>('default');

  // Modal State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [modalCriteriaTitle, setModalCriteriaTitle] = useState('Porsche 911 GT3 / GT3 RS');
  const [modalMaxPrice, setModalMaxPrice] = useState('1,600,000');
  const [modalMaxMileage, setModalMaxMileage] = useState('10,000');
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [selectedSpec, setSelectedSpec] = useState<'gcc' | 'euro' | 'us'>('gcc');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIcon, setToastIcon] = useState('info');

  // Language state (en / ar)
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  // Show Toast
  const triggerToast = (msg: string, icon = 'info') => {
    setToastMessage(msg);
    setToastIcon(icon);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Remove Favorite
  const handleRemoveFavorite = async (favId: string, favTitle: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== favId));
    triggerToast(`Vehicle removed from Saved Garage: ${favTitle}`, 'bookmark_remove');
    try {
      await removeFavoriteApi(favId);
    } catch (_err) {
      // Graceful fallback
    }
  };

  // Toggle Pause Radar
  const handleTogglePauseRadar = (radarId: string) => {
    setRadars((prev) =>
      prev.map((r) => {
        if (r.id === radarId) {
          const nextPaused = !r.isPaused;
          triggerToast(
            nextPaused ? `Radar paused: ${r.title}` : `Radar resumed: ${r.title}`,
            nextPaused ? 'pause' : 'play_arrow'
          );
          return { ...r, isPaused: nextPaused };
        }
        return r;
      })
    );
  };

  // Delete Radar
  const handleDeleteRadar = async (radarId: string, radarTitle: string) => {
    setRadars((prev) => prev.filter((r) => r.id !== radarId));
    triggerToast(`Radar alert removed: ${radarTitle}`, 'delete');
    try {
      await deleteSavedRadarApi(radarId);
    } catch (_err) {
      // Graceful fallback
    }
  };

  // Open Alert Modal
  const handleOpenAlertModal = (criteriaName: string) => {
    setModalCriteriaTitle(criteriaName);
    setIsAlertModalOpen(true);
  };

  // Save Alert Modal
  const handleSaveAlertChanges = () => {
    setIsAlertModalOpen(false);
    triggerToast(`Radar telemetry updated for: ${modalCriteriaTitle}`, 'check_circle');
  };

  // Switch Main Tab
  const handleSwitchTab = (tab: 'favs' | 'searches' | 'archived') => {
    setActiveTab(tab);
    if (tab === 'favs') {
      setDemoState('default');
    } else if (tab === 'searches') {
      triggerToast('Active surveillance radars focused', 'radar');
    } else if (tab === 'archived') {
      triggerToast('Showing 2 historical allocations sold in GCC', 'history');
    }
  };

  // Set Demo State
  const handleSetDemoState = (state: 'default' | 'empty' | 'loading') => {
    setDemoState(state);
    if (state === 'default') {
      triggerToast('Restored default 4-vehicle collection', 'view_module');
    } else if (state === 'empty') {
      triggerToast('Switched to empty favorites state', 'bookmark_border');
    } else if (state === 'loading') {
      triggerToast('Simulating live TASJEEL feed query...', 'sync');
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#101419] text-[#e0e2ea] flex flex-col justify-between selection:bg-[#d4af37] selection:text-[#3c2f00] font-sans ${
        lang === 'ar' ? 'rtl' : 'ltr'
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl bg-[#1c2025] border-l-4 border-[#d4af37] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5"
          id="toast-notification"
        >
          <span className="material-symbols-outlined text-[#f2ca50] text-[22px]">{toastIcon}</span>
          <span className="text-sm font-medium text-[#e0e2ea]">{toastMessage}</span>
        </div>
      )}

      {/* Main Header strictly matching Stitch navigation */}
      <header className="fixed top-0 w-full z-50 bg-[#101419]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.40)] border-b border-[#262a30]/50">
        <div className="h-20 max-w-[1440px] mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded bg-[#262a30] flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-[#f2ca50] text-[22px]">token</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-[#e0e2ea] group-hover:text-[#f2ca50] transition-colors uppercase">
                  Automotive<span className="text-[#f2ca50] font-bold">OS</span>
                </span>
                <span className="text-[11px] text-[#d0c5af] uppercase tracking-wider font-semibold">
                  UAE Collector Exchange
                </span>
              </div>
            </Link>
            <div className="hidden xl:flex items-center">
              <div className="h-6 w-px bg-[#31353b] mx-2"></div>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181c21] hover:bg-[#262a30] transition-colors text-[#e0e2ea]"
              >
                <span className="material-symbols-outlined text-[#f2ca50] text-[18px]">location_on</span>
                <span className="text-xs text-[#e0e2ea] font-medium">Dubai</span>
                <span className="text-[11px] text-[#d0c5af] font-semibold">DXB</span>
                <span className="material-symbols-outlined text-[#d0c5af] text-[16px]">expand_more</span>
              </button>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1 p-1 bg-[#0a0e13]/80 rounded-xl">
            <Link
              href="/cars"
              className="px-4 py-2 text-sm text-[#d0c5af] hover:text-[#e0e2ea] hover:bg-[#262a30] transition-all rounded-lg"
            >
              Browse Stock
            </Link>
            <Link
              href="/dealers/apex-gt-motors"
              className="px-4 py-2 text-sm text-[#d0c5af] hover:text-[#e0e2ea] hover:bg-[#262a30] transition-all rounded-lg"
            >
              Verified Dealers
            </Link>
            <Link
              href="/account/enquiries"
              className="px-4 py-2 text-sm text-[#d0c5af] hover:text-[#e0e2ea] hover:bg-[#262a30] transition-all rounded-lg"
            >
              VIP Services
            </Link>
            <Link
              href="/compare"
              className="px-4 py-2 text-sm text-[#d0c5af] hover:text-[#e0e2ea] hover:bg-[#262a30] transition-all rounded-lg"
            >
              Compare Vehicles
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-[#0a0e13] rounded-lg">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded text-[11px] font-semibold ${
                  lang === 'en' ? 'text-[#f2ca50] bg-[#262a30]/60' : 'text-[#d0c5af]'
                }`}
              >
                EN
              </button>
              <span className="text-[#4d4635] text-[11px] px-0.5">|</span>
              <button
                type="button"
                onClick={() => setLang('ar')}
                className={`px-2 py-1 rounded text-[11px] font-semibold ${
                  lang === 'ar' ? 'text-[#f2ca50] bg-[#262a30]/60' : 'text-[#d0c5af]'
                }`}
              >
                العربية
              </button>
            </div>

            <Link
              href="/account/saved"
              className="relative p-2 rounded-lg bg-[#262a30] text-[#f2ca50] transition-colors flex items-center justify-center border border-[#d4af37]/40 shadow-sm"
              title="Saved Inventory"
            >
              <span className="material-symbols-outlined text-[20px]">bookmark</span>
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#f2ca50] text-[#241a00] text-[10px] font-bold flex items-center justify-center leading-none">
                {favorites.length}
              </span>
            </Link>

            <Link
              href="/account/notifications"
              className="relative p-2 rounded-lg bg-[#181c21] hover:bg-[#262a30] text-[#d0c5af] hover:text-[#e0e2ea] transition-colors flex items-center justify-center"
              title="Advisories & Alerts"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#58e7aa] ring-2 ring-[#101419]"></span>
            </Link>

            <Link
              href="/account/garage"
              className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-[#181c21] hover:bg-[#262a30] transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-[#f2ca50] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#241a00] text-[18px]">person</span>
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs text-[#e0e2ea] font-semibold group-hover:text-[#f2ca50] transition-colors">
                  Rashid Al Nuaimi
                </span>
                <span className="text-[10px] text-[#f2ca50] uppercase font-bold tracking-wider">
                  VIP Collector
                </span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full pt-20 bg-[#101419] flex-1">
        <div className="flex flex-col w-full">
          {/* Subtle Ambient Backdrop Atmosphere */}
          <div className="relative w-full overflow-hidden">
            <div className="absolute -top-32 left-1/4 w-[600px] h-[350px] bg-[#f2ca50]/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute top-48 right-12 w-[420px] h-[280px] bg-[#7bd0ff]/5 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-8">
              {/* Top Breadcrumbs & Surveillance Status Strip */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#262a30] pb-4">
                <div className="flex items-center gap-2 text-xs text-[#d0c5af]">
                  <Link href="/account" className="hover:text-[#f2ca50] transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">account_circle</span>
                    <span>Buyer Portal</span>
                  </Link>
                  <span className="text-[#4d4635]">/</span>
                  <span className="text-[#e0e2ea] font-medium">Saved Garage & Watchlist</span>
                  <span className="text-[#4d4635] text-[10px] px-1.5 py-0.5 rounded bg-[#262a30] ml-1 font-mono font-bold text-[#f2ca50]">
                    GCC LIVE
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#181c21] border border-[#262a30] shadow-sm">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#58e7aa] animate-pulse"></span>
                    <span className="font-mono text-[11px] text-[#e0e2ea]">
                      RTA & TASJEEL REGISTRY SYNC: ACTIVE
                    </span>
                  </div>
                  <div className="hidden md:flex items-center gap-1 font-mono text-[11px] text-[#d0c5af]">
                    <span className="material-symbols-outlined text-[14px] text-[#f2ca50]">schedule</span>
                    <span>T-00:04m ago</span>
                  </div>
                </div>
              </div>

              {/* Hero Header & Bilingual Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                <div className="lg:col-span-8 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-0.5 bg-[#f2ca50]"></span>
                    <span className="text-[11px] font-bold text-[#f2ca50] uppercase tracking-widest">
                      Collector Terminal v4.8
                    </span>
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-extrabold text-[#e0e2ea] tracking-tight flex flex-wrap items-baseline gap-x-3">
                    <span>Saved Searches & Vehicle Favorites</span>
                    <span
                      className="text-xl lg:text-2xl text-[#d0c5af] font-normal tracking-normal text-right rtl"
                      dir="rtl"
                    >
                      المركبات المحفوظة والتنبيهات المخصصة
                    </span>
                  </h1>
                  <p className="text-base text-[#d0c5af] max-w-3xl pt-1">
                    Real-time surveillance of certified UAE dealership allocations, GCC price shifts, and instant
                    WhatsApp/SMS match notifications.
                  </p>
                </div>

                {/* Telemetry Summary Metric Tile */}
                <div className="lg:col-span-4 flex items-center justify-start lg:justify-end">
                  <div className="p-4 rounded-xl bg-[#181c21] border border-[#262a30] shadow-lg flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#d0c5af] uppercase font-bold tracking-wider">
                        Portfolio Value Tracked
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-[#f2ca50] tracking-tight font-mono">
                          4,585,000
                        </span>
                        <span className="text-xs text-[#e0e2ea] font-semibold">AED</span>
                      </div>
                      <span className="text-xs text-[#58e7aa] flex items-center gap-1 mt-0.5 font-mono">
                        <span className="material-symbols-outlined text-[14px]">trending_down</span>
                        <span>-AED 25,000 net variance (7d)</span>
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-[#262a30] flex items-center justify-center text-[#f2ca50]">
                      <span className="material-symbols-outlined text-[26px]">monetization_on</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Navigation Tab Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-1.5 rounded-xl bg-[#0a0e13] border border-[#262a30]">
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                      activeTab === 'favs'
                        ? 'bg-[#d4af37] text-[#241a00] shadow-sm'
                        : 'text-[#d0c5af] hover:text-[#e0e2ea] hover:bg-[#181c21]'
                    }`}
                    id="tab-favs"
                    onClick={() => handleSwitchTab('favs')}
                  >
                    <span className="material-symbols-outlined text-[18px]">bookmark</span>
                    <span>Favorites / Bookmarked Cars</span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold font-mono ${
                        activeTab === 'favs'
                          ? 'bg-[#241a00]/20 text-[#241a00]'
                          : 'bg-[#181c21] text-[#e0e2ea]'
                      }`}
                    >
                      {favorites.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                      activeTab === 'searches'
                        ? 'bg-[#d4af37] text-[#241a00] shadow-sm'
                        : 'text-[#d0c5af] hover:text-[#e0e2ea] hover:bg-[#181c21]'
                    }`}
                    id="tab-searches"
                    onClick={() => handleSwitchTab('searches')}
                  >
                    <span className="material-symbols-outlined text-[18px]">manage_search</span>
                    <span>Automated Saved Searches</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#181c21] text-[#58e7aa] font-bold font-mono">
                      {radars.filter((r) => !r.isPaused).length} Active
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                      activeTab === 'archived'
                        ? 'bg-[#d4af37] text-[#241a00] shadow-sm'
                        : 'text-[#d0c5af] hover:text-[#e0e2ea] hover:bg-[#181c21]'
                    }`}
                    id="tab-archived"
                    onClick={() => handleSwitchTab('archived')}
                  >
                    <span className="material-symbols-outlined text-[18px]">archive</span>
                    <span>Archived & Sold</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#181c21] text-[#d0c5af] font-mono">
                      2
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pr-1">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-[#262a30] hover:bg-[#36393f] text-[#f2ca50] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm border border-[#4d4635]"
                    onClick={() => handleOpenAlertModal('New Alert Criteria')}
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>Create New Radar</span>
                  </button>
                </div>
              </div>

              {/* SECTION 1: Active Saved Searches & Telemetry Radar Bar */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f2ca50] animate-ping"></div>
                    <h2 className="text-xl font-bold text-[#e0e2ea] tracking-tight">Active Surveillance Radars</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#1c2025] text-[#d0c5af] font-bold uppercase tracking-wider border border-[#262a30]">
                      {radars.length} WATCHLISTS RUNNING
                    </span>
                  </div>
                  <span className="text-xs text-[#d0c5af] hidden md:inline">
                    Instant push via WhatsApp Business API (Emirates Gateway)
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="radarsGrid">
                  {radars.map((radar) => (
                    <div
                      key={radar.id}
                      className="p-5 rounded-xl bg-[#181c21] border border-[#262a30] shadow-md flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-[#31353b] transition-all"
                      id={`radarCard-${radar.id}`}
                    >
                      <div
                        className="absolute top-0 right-0 w-28 h-28 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110 opacity-10"
                        style={{ backgroundColor: radar.accentColor }}
                      ></div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-[10px] font-mono font-bold tracking-wider uppercase"
                            style={{ color: radar.accentColor }}
                          >
                            {radar.radarCode}
                          </span>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#33ca90]/15 text-[#58e7aa] font-semibold flex items-center gap-1 border border-[#33ca90]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#58e7aa]"></span>
                            {radar.matchCountLabel}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-[#e0e2ea] mt-1">{radar.title}</h3>

                        <div className="flex flex-wrap gap-1.5 mt-1 text-xs text-[#d0c5af]">
                          {radar.filters.map((f, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-[#262a30] text-[#e0e2ea] text-[11px]">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 pt-2 border-t border-[#262a30]">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-[#0a0e13]/80 text-[#e0e2ea] border border-[#262a30]">
                          <div className="flex items-center gap-2">
                            <span
                              className="material-symbols-outlined text-[18px]"
                              style={{ color: radar.accentColor }}
                            >
                              {radar.channelType === 'WHATSAPP'
                                ? 'chat'
                                : radar.channelType === 'SMS'
                                ? 'sms'
                                : 'verified_user'}
                            </span>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">{radar.channelLabel}</span>
                              <span className="font-mono text-[10px] text-[#d0c5af]">
                                {radar.channelDestination}
                              </span>
                            </div>
                          </div>
                          <span
                            className="text-[10px] font-bold uppercase"
                            style={{ color: radar.isPaused ? '#d0c5af' : radar.accentColor }}
                          >
                            {radar.isPaused ? 'Paused' : radar.statusBadge}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded bg-[#262a30] hover:bg-[#36393f] text-[#e0e2ea] text-xs font-medium transition-all flex items-center gap-1"
                            onClick={() => handleOpenAlertModal(radar.title)}
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                            <span>Edit Criteria</span>
                          </button>
                          <button
                            type="button"
                            className={`px-3 py-1.5 rounded bg-[#262a30] hover:bg-[#36393f] text-xs font-medium transition-all flex items-center gap-1 ${
                              radar.isPaused ? 'text-[#f2ca50]' : 'text-[#d0c5af] hover:text-[#e0e2ea]'
                            }`}
                            onClick={() => handleTogglePauseRadar(radar.id)}
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {radar.isPaused ? 'play_arrow' : 'pause_circle'}
                            </span>
                            <span>{radar.isPaused ? 'Resume' : 'Pause'}</span>
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded bg-[#262a30] hover:bg-[#93000a]/30 text-[#d0c5af] hover:text-[#ffb4ab] transition-all"
                            onClick={() => handleDeleteRadar(radar.id, radar.title)}
                            title="Delete Saved Query"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 2: Bookmarked Luxury Vehicle Grid */}
              <section className="flex flex-col gap-6" id="favorites-section">
                {/* Section Filter & Sorter Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#262a30] pb-2">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-[#e0e2ea] tracking-tight">Saved Garage Inventory</h2>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#262a30] text-[#d0c5af] font-mono text-xs">
                      <span className="text-[#f2ca50] font-bold">{favorites.length}</span> vehicles in watchlist
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#d0c5af] uppercase font-semibold">Sort By:</span>
                    <div className="relative">
                      <select className="appearance-none bg-[#181c21] text-[#e0e2ea] text-xs py-1.5 pl-3 pr-8 rounded-lg border border-[#262a30] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#f2ca50]">
                        <option>Recently Added</option>
                        <option>Price: High to Low</option>
                        <option>Price Drop Alert First</option>
                        <option>Mileage: Low to High</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-2 text-[#d0c5af] text-[16px] pointer-events-none">
                        expand_more
                      </span>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg bg-[#181c21] hover:bg-[#262a30] text-[#d0c5af] hover:text-[#f2ca50] transition-colors border border-[#262a30]"
                      onClick={() => triggerToast('Watchlist private link copied to clipboard', 'content_copy')}
                      title="Export Watchlist Link"
                    >
                      <span className="material-symbols-outlined text-[20px]">share</span>
                    </button>
                  </div>
                </div>

                {/* State Views */}
                {demoState === 'loading' ? (
                  /* Loading Skeleton */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="skeleton-state-view">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-[#181c21] border border-[#262a30] flex flex-col gap-4 animate-pulse"
                      >
                        <div className="w-full aspect-[16/10] rounded-lg bg-[#262a30]"></div>
                        <div className="h-4 w-1/2 bg-[#262a30] rounded"></div>
                        <div className="h-6 w-3/4 bg-[#262a30] rounded"></div>
                        <div className="h-10 w-full bg-[#262a30] rounded"></div>
                        <div className="h-8 w-1/3 bg-[#262a30] rounded"></div>
                        <div className="h-11 w-full bg-[#262a30] rounded mt-2"></div>
                      </div>
                    ))}
                  </div>
                ) : demoState === 'empty' || favorites.length === 0 ? (
                  /* Empty State View */
                  <div
                    className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl bg-[#181c21] border border-[#262a30]"
                    id="empty-state-view"
                  >
                    <div className="w-20 h-20 rounded-full bg-[#262a30] flex items-center justify-center mb-4 text-[#f2ca50]">
                      <span className="material-symbols-outlined text-[40px]">bookmark_border</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#e0e2ea]">No vehicles bookmarked yet</h3>
                    <p className="text-sm text-[#d0c5af] max-w-md mt-1 mb-6">
                      Browse certified GCC luxury inventory with 1-tap save to track real-time price drops, warranty
                      verifications, and VIP dealer allocations.
                    </p>
                    <Link
                      href="/cars"
                      className="px-6 py-3 rounded-lg bg-[#d4af37] text-[#241a00] font-bold text-sm hover:brightness-110 transition-colors flex items-center gap-2 shadow-lg"
                    >
                      <span className="material-symbols-outlined text-[20px]">search</span>
                      <span>Browse Certified Stock Now</span>
                    </Link>
                  </div>
                ) : (
                  /* Vehicle Grid: 4 Cards */
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    id="vehicle-grid-container"
                  >
                    {favorites.map((fav) => (
                      <article
                        key={fav.id}
                        className="vehicle-card flex flex-col rounded-xl bg-[#181c21] border border-[#262a30] overflow-hidden shadow-lg hover:shadow-2xl hover:translate-y-[-4px] transition-all duration-300 group"
                        id={`vehicleCard-${fav.id}`}
                      >
                        {/* Media Container */}
                        <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#262a30]">
                          <img
                            src={fav.imageUrl}
                            alt={fav.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#101419] via-transparent to-black/40"></div>

                          {/* Badges Over Media */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-[#0a0e13]/90 backdrop-blur-md text-[#f2ca50] font-mono text-[11px] font-bold border border-[#31353b]">
                              {fav.year}
                            </span>
                            {fav.badgeLabel && (
                              <span
                                className={`px-2 py-0.5 rounded-full backdrop-blur-md text-[10px] font-bold ${
                                  fav.badgeVariant === 'secondary'
                                    ? 'bg-[#33ca90]/80 text-[#003824]'
                                    : 'bg-[#262a30]/90 text-[#e0e2ea] border border-[#31353b]'
                                }`}
                              >
                                {fav.badgeLabel}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#0a0e13]/80 backdrop-blur-md text-[#f2ca50] hover:text-[#ffb4ab] hover:bg-[#262a30] transition-colors flex items-center justify-center shadow-md border border-[#31353b]"
                            onClick={() => handleRemoveFavorite(fav.id, fav.title)}
                            title="Remove from Saved Garage"
                          >
                            <span className="material-symbols-outlined text-[18px]">bookmark_remove</span>
                          </button>

                          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[#e0e2ea]">
                            <span className="font-mono text-[11px] text-[#d0c5af] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">speed</span>{' '}
                              {fav.mileageKm.toLocaleString()} KM
                            </span>
                            <span className="px-2 py-0.5 rounded bg-[#262a30]/90 text-[10px] font-mono text-[#e0e2ea] border border-[#31353b]">
                              {fav.specRegion}
                            </span>
                          </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-4 flex flex-col flex-1 justify-between gap-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[#d0c5af] text-xs">
                              <span className="material-symbols-outlined text-[#f2ca50] text-[14px]">storefront</span>
                              <span className="truncate">
                                {fav.dealerName} • {fav.dealerLocation}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-[#e0e2ea] group-hover:text-[#f2ca50] transition-colors">
                              {fav.title}
                            </h3>
                            <span className="text-xs text-[#d0c5af]">{fav.subtitle}</span>
                          </div>

                          {/* Spec Grid Strip */}
                          <div className="grid grid-cols-3 gap-1 py-2 px-2.5 rounded-lg bg-[#262a30]/60 text-center text-[11px] border border-[#31353b]/40">
                            <div className="flex flex-col">
                              <span className="text-[#d0c5af] text-[9px] uppercase font-semibold">Engine</span>
                              <span className="font-mono text-[#e0e2ea] font-semibold">{fav.engine}</span>
                            </div>
                            <div className="flex flex-col border-x border-[#31353b]">
                              <span className="text-[#d0c5af] text-[9px] uppercase font-semibold">Output</span>
                              <span className="font-mono text-[#e0e2ea] font-semibold">{fav.performance}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[#d0c5af] text-[9px] uppercase font-semibold">Warranty</span>
                              <span className="font-mono text-[#58e7aa] font-semibold">{fav.warranty}</span>
                            </div>
                          </div>

                          {/* Pricing & Trend Indicator */}
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#d0c5af] uppercase font-semibold">
                                Current Valuation
                              </span>
                              {fav.priceDropNote ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#33ca90]/20 text-[#58e7aa] font-bold flex items-center gap-0.5 border border-[#33ca90]/30 font-mono">
                                  <span className="material-symbols-outlined text-[12px]">arrow_downward</span>{' '}
                                  {fav.priceDropNote}
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#262a30] text-[#d0c5af] font-medium flex items-center gap-1 border border-[#31353b]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#99907c]"></span>{' '}
                                  {fav.marketTrendLabel}
                                </span>
                              )}
                            </div>

                            <div className="flex items-baseline justify-between">
                              <div className="flex items-baseline gap-1">
                                <span className="text-[10px] text-[#f2ca50] font-bold">AED</span>
                                <span className="text-xl font-bold text-[#e0e2ea] font-mono">
                                  {fav.currentValuationAed.toLocaleString()}
                                </span>
                              </div>
                              {fav.previousValuationAed ? (
                                <span className="font-mono text-xs text-[#d0c5af] line-through">
                                  AED {fav.previousValuationAed.toLocaleString()}
                                </span>
                              ) : (
                                <span className="font-mono text-[11px] text-[#d0c5af]">
                                  Est. AED {fav.monthlyEstimateAed.toLocaleString()}/mo
                                </span>
                              )}
                            </div>

                            <span className="text-right text-[10px] text-[#d0c5af] font-mono" dir="rtl">
                              درهم إماراتي {fav.currentValuationAed.toLocaleString('ar-AE')}
                            </span>
                          </div>

                          {/* Card Action CTA */}
                          <div className="flex flex-col gap-1.5 pt-1">
                            <button
                              type="button"
                              className={`w-full h-11 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm ${
                                fav.ctaIcon === 'verified' || fav.ctaIcon === 'lock'
                                  ? 'bg-[#d4af37] text-[#241a00] hover:brightness-110 font-bold'
                                  : 'bg-[#262a30] hover:bg-[#36393f] text-[#e0e2ea]'
                              }`}
                              onClick={() =>
                                triggerToast(
                                  `Action triggered: ${fav.ctaActionText} for ${fav.title}`,
                                  fav.ctaIcon
                                )
                              }
                            >
                              <span className="material-symbols-outlined text-[18px]">{fav.ctaIcon}</span>
                              <span>{fav.ctaActionText}</span>
                            </button>

                            <div className="flex items-center justify-between text-xs text-[#d0c5af] pt-1 px-1">
                              <Link
                                href="/compare"
                                className="hover:text-[#f2ca50] transition-colors flex items-center gap-0.5 text-[11px]"
                              >
                                <span className="material-symbols-outlined text-[14px]">compare_arrows</span>{' '}
                                Compare Telemetry
                              </Link>
                              <button
                                type="button"
                                className="hover:text-[#ffb4ab] transition-colors flex items-center gap-0.5 text-[11px]"
                                onClick={() => handleRemoveFavorite(fav.id, fav.title)}
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span> Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* SECTION 3: Interactive State Demonstrator Bar at Base */}
              <div className="w-full p-4 rounded-2xl bg-[#0a0e13] border border-[#262a30] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#262a30] flex items-center justify-center text-[#f2ca50]">
                    <span className="material-symbols-outlined text-[20px]">tune</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#e0e2ea]">Screen State Demonstrator</span>
                    <span className="text-xs text-[#d0c5af]">
                      Prototype harness for UX verification & edge testing
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      demoState === 'default'
                        ? 'bg-[#d4af37] text-[#241a00] shadow-sm font-bold'
                        : 'bg-[#262a30] text-[#d0c5af] hover:text-[#e0e2ea]'
                    }`}
                    id="btn-demo-default"
                    onClick={() => handleSetDemoState('default')}
                  >
                    Populated View (Default)
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      demoState === 'empty'
                        ? 'bg-[#d4af37] text-[#241a00] shadow-sm font-bold'
                        : 'bg-[#262a30] text-[#d0c5af] hover:text-[#e0e2ea]'
                    }`}
                    id="btn-demo-empty"
                    onClick={() => handleSetDemoState('empty')}
                  >
                    Empty State
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      demoState === 'loading'
                        ? 'bg-[#d4af37] text-[#241a00] shadow-sm font-bold'
                        : 'bg-[#262a30] text-[#d0c5af] hover:text-[#e0e2ea]'
                    }`}
                    id="btn-demo-loading"
                    onClick={() => handleSetDemoState('loading')}
                  >
                    Loading Skeleton
                  </button>
                  <button
                    type="button"
                    className="px-4 py-1.5 rounded-full bg-[#262a30] text-[#f2ca50] hover:bg-[#36393f] text-xs font-medium transition-all flex items-center gap-1 border border-[#4d4635]"
                    id="btn-demo-modal"
                    onClick={() => handleOpenAlertModal('Porsche 911 GT3 / GT3 RS')}
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span>Alert Edit Modal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL: Interactive Alert Criteria Modal Overlay */}
        {isAlertModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            id="alert-modal"
          >
            <div className="w-full max-w-xl rounded-2xl bg-[#181c21] border border-[#31353b] shadow-2xl p-6 flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-[#262a30] pb-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#f2ca50] uppercase font-bold tracking-wider">
                    Telemetry Radar Settings
                  </span>
                  <h3 className="text-xl font-bold text-[#e0e2ea]" id="modal-title">
                    Edit Watchlist Criteria
                  </h3>
                  <span className="text-xs text-[#d0c5af]">Emirates TASJEEL & Dealership Feed Sync</span>
                </div>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-[#262a30] hover:bg-[#36393f] text-[#d0c5af] hover:text-[#e0e2ea] flex items-center justify-center transition-colors"
                  onClick={() => setIsAlertModalOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Form Inputs */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase text-[#d0c5af] font-semibold">Target Model / Series</label>
                  <input
                    type="text"
                    value={modalCriteriaTitle}
                    onChange={(e) => setModalCriteriaTitle(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg bg-[#262a30] text-[#e0e2ea] text-sm border border-[#4d4635] focus:outline-none focus:ring-1 focus:ring-[#f2ca50]"
                    id="modal-model-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase text-[#d0c5af] font-semibold">Max Price (AED)</label>
                    <input
                      type="text"
                      value={modalMaxPrice}
                      onChange={(e) => setModalMaxPrice(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-[#262a30] text-[#e0e2ea] font-mono text-sm border border-[#31353b] focus:outline-none focus:ring-1 focus:ring-[#f2ca50]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase text-[#d0c5af] font-semibold">Max Mileage (KM)</label>
                    <input
                      type="text"
                      value={modalMaxMileage}
                      onChange={(e) => setModalMaxMileage(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-[#262a30] text-[#e0e2ea] font-mono text-sm border border-[#31353b] focus:outline-none focus:ring-1 focus:ring-[#f2ca50]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase text-[#d0c5af] font-semibold">
                    Regional Specifications
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'gcc', label: 'GCC Standard Spec' },
                      { id: 'euro', label: 'Euro Spec' },
                      { id: 'us', label: 'US Spec' },
                    ].map((spec) => (
                      <button
                        key={spec.id}
                        type="button"
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          selectedSpec === spec.id
                            ? 'bg-[#d4af37] text-[#241a00]'
                            : 'bg-[#262a30] text-[#d0c5af] hover:text-[#e0e2ea]'
                        }`}
                        onClick={() => setSelectedSpec(spec.id as any)}
                      >
                        {spec.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase text-[#d0c5af] font-semibold">Instant Push Channel</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`p-3 rounded-lg flex items-center justify-between cursor-pointer border transition-all ${
                        selectedChannel === 'whatsapp'
                          ? 'bg-[#262a30] border-[#d4af37]'
                          : 'bg-[#1c2025] border-[#262a30]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#58e7aa] text-[20px]">chat</span>
                        <span className="text-xs text-[#e0e2ea] font-medium">WhatsApp API</span>
                      </div>
                      <input
                        type="radio"
                        name="channel"
                        checked={selectedChannel === 'whatsapp'}
                        onChange={() => setSelectedChannel('whatsapp')}
                        className="accent-[#f2ca50]"
                      />
                    </label>

                    <label
                      className={`p-3 rounded-lg flex items-center justify-between cursor-pointer border transition-all ${
                        selectedChannel === 'sms'
                          ? 'bg-[#262a30] border-[#d4af37]'
                          : 'bg-[#1c2025] border-[#262a30]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#7bd0ff] text-[20px]">sms</span>
                        <span className="text-xs text-[#e0e2ea] font-medium">VIP SMS Route</span>
                      </div>
                      <input
                        type="radio"
                        name="channel"
                        checked={selectedChannel === 'sms'}
                        onChange={() => setSelectedChannel('sms')}
                        className="accent-[#f2ca50]"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262a30]">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-[#262a30] hover:bg-[#36393f] text-[#d0c5af] hover:text-[#e0e2ea] text-xs font-medium transition-colors"
                  onClick={() => setIsAlertModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-5 py-2 rounded-lg bg-[#d4af37] text-[#241a00] text-xs font-bold hover:brightness-110 transition-colors flex items-center gap-1.5 shadow-md"
                  onClick={handleSaveAlertChanges}
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Save Radar Preferences</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer strictly matching Stitch layout */}
      <footer className="w-full bg-[#0a0e13] border-t border-[#262a30] mt-16">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-[#262a30] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#f2ca50] text-[20px]">token</span>
                </div>
                <span className="text-lg font-bold tracking-tight text-[#e0e2ea] uppercase">
                  Automotive<span className="text-[#f2ca50] font-bold">OS</span>
                </span>
              </div>
              <p className="text-xs text-[#d0c5af] max-w-md">
                The ultra-luxury automotive transactional standard for the GCC. Direct custody, verified RTA telemetry,
                escrow settlement, and diplomatic transport across the Emirates.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181c21] border border-[#262a30]">
                  <span className="material-symbols-outlined text-[#58e7aa] text-[18px]">verified</span>
                  <span className="text-xs text-[#e0e2ea] font-medium">RTA Certified Dealer Portal</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181c21] border border-[#262a30]">
                  <span className="material-symbols-outlined text-[#f2ca50] text-[18px]">policy</span>
                  <span className="text-xs text-[#e0e2ea] font-medium">DED License #984210</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#f2ca50] uppercase tracking-wider">Collector Inventory</span>
              <nav className="flex flex-col gap-1.5 text-xs">
                <Link href="/cars" className="text-[#d0c5af] hover:text-[#e0e2ea] transition-colors">
                  Hypercars & Exotics
                </Link>
                <Link href="/cars" className="text-[#d0c5af] hover:text-[#e0e2ea] transition-colors">
                  Pristine Heritage & Classic
                </Link>
                <Link href="/cars" className="text-[#d0c5af] hover:text-[#e0e2ea] transition-colors">
                  Armored Presidential Fleet
                </Link>
                <Link href="/compare" className="text-[#d0c5af] hover:text-[#e0e2ea] transition-colors">
                  Telemetry Comparator
                </Link>
              </nav>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#f2ca50] uppercase tracking-wider">Emirates Hubs</span>
              <nav className="flex flex-col gap-1.5 text-xs">
                <Link href="/dealers" className="text-[#d0c5af] hover:text-[#e0e2ea] transition-colors">
                  Dubai International Financial Centre
                </Link>
                <Link href="/dealers" className="text-[#d0c5af] hover:text-[#e0e2ea] transition-colors">
                  Abu Dhabi Yas Marina Terminal
                </Link>
                <Link href="/dealers" className="text-[#d0c5af] hover:text-[#e0e2ea] transition-colors">
                  Sharjah Classic Auto Zone
                </Link>
                <Link href="/dealers" className="text-[#d0c5af] hover:text-[#e0e2ea] transition-colors">
                  Ras Al Khaimah Concours Logistics
                </Link>
              </nav>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#f2ca50] uppercase tracking-wider">Compliance & Advisory</span>
              <nav className="flex flex-col gap-1.5 text-xs">
                <Link href="/vip-services" className="text-[#d0c5af] hover:text-[#e0e2ea] transition-colors">
                  GCC Customs Clearance
                </Link>
                <Link href="/vip-services" className="text-[#d0c5af] hover:text-[#e0e2ea] transition-colors">
                  Escrow Vault Settlement
                </Link>
                <Link href="/vip-services" className="text-[#d0c5af] hover:text-[#e0e2ea] transition-colors">
                  TASJEEL Pre-Purchase Audit
                </Link>
                <Link href="/vip-services" className="text-[#d0c5af] hover:text-[#e0e2ea] transition-colors">
                  Concierge Air Freight (DXB/AUH)
                </Link>
              </nav>
            </div>
          </div>

          <div className="pt-6 border-t border-[#262a30] flex flex-col md:flex-row items-center justify-between gap-4 text-[#d0c5af] text-xs">
            <div className="flex items-center gap-4">
              <span>© 2025 Automotive OS FZ-LLC. All rights reserved.</span>
              <span>UAE Federal Law No. 15 Compliant</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-[#f2ca50] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[#f2ca50] transition-colors">
                Terms of Exchange
              </Link>
              <Link href="/aml" className="hover:text-[#f2ca50] transition-colors">
                AML Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
