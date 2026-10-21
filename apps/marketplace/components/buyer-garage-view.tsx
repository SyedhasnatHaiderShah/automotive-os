'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BuyerAppointmentItem,
  BuyerGarageVehicle,
  DEFAULT_BUYER_APPOINTMENTS,
  DEFAULT_BUYER_GARAGE_VEHICLES,
  cancelBuyerAppointment,
} from '../lib/api';

interface BuyerGarageViewProps {
  initialAppointments?: BuyerAppointmentItem[];
  initialGarageVehicles?: BuyerGarageVehicle[];
}

export function BuyerGarageView({
  initialAppointments = DEFAULT_BUYER_APPOINTMENTS,
  initialGarageVehicles = DEFAULT_BUYER_GARAGE_VEHICLES,
}: BuyerGarageViewProps) {
  const [appointments, setAppointments] = useState<BuyerAppointmentItem[]>(initialAppointments);
  const [garageVehicles] = useState<BuyerGarageVehicle[]>(initialGarageVehicles);
  const [demoState, setDemoState] = useState<'populated' | 'empty' | 'banner'>('populated');

  // Cancellation Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [targetCancelAppt, setTargetCancelAppt] = useState<BuyerAppointmentItem | null>(null);
  const [cancelReason, setCancelReason] = useState('alternative');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancellationBanner, setShowCancellationBanner] = useState(false);
  const [cancelledCarTitle, setCancelledCarTitle] = useState('2024 Porsche 911 GT3 RS');

  // Add Vehicle (RTA Sync) Modal State
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [tcfInput, setTcfInput] = useState('70198201');
  const [syncMethod, setSyncMethod] = useState<'tcf' | 'vin'>('tcf');
  const [isSyncing, setIsSyncing] = useState(false);
  const [rtaSuccessNotice, setRtaSuccessNotice] = useState<string | null>(null);

  // Calendar and Reschedule Feedback State
  const [calendarToast, setCalendarToast] = useState<string | null>(null);
  const [rescheduleModalCar, setRescheduleModalCar] = useState<string | null>(null);

  // Language state (en / ar)
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  // Handle Cancel Appointment click
  const handleOpenCancelModal = (appt: BuyerAppointmentItem) => {
    setTargetCancelAppt(appt);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!targetCancelAppt) return;
    setIsCancelling(true);

    try {
      await cancelBuyerAppointment(targetCancelAppt.id, cancelReason);
      setCancelledCarTitle(targetCancelAppt.carName);
      setAppointments((prev) => prev.filter((a) => a.id !== targetCancelAppt.id));
      setIsCancelModalOpen(false);
      setShowCancellationBanner(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (_err) {
      // Graceful fallback
      setIsCancelModalOpen(false);
      setShowCancellationBanner(true);
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle Add Vehicle via RTA
  const handleExecuteRtaSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setIsAddVehicleModalOpen(false);
      setRtaSuccessNotice(
        `RTA Gateway Connected: Traffic File #${tcfInput} synchronized. Vehicle title registered in collector fleet.`
      );
      setTimeout(() => setRtaSuccessNotice(null), 5000);
    }, 700);
  };

  // Sync to calendar
  const handleSyncToCalendar = (appt: BuyerAppointmentItem) => {
    setCalendarToast(`Calendar Event Exported: "${appt.sessionType} - ${appt.carName}" synced with Apple/Google Calendar.`);
    setTimeout(() => setCalendarToast(null), 4000);
  };

  // Reschedule
  const handleOpenReschedule = (appt: BuyerAppointmentItem) => {
    setRescheduleModalCar(`${appt.carName} (${appt.scheduledDate})`);
  };

  // Interactive Demo State switcher
  const handleSetState = (mode: 'populated' | 'empty' | 'banner') => {
    setDemoState(mode);
    if (mode === 'empty') {
      setShowCancellationBanner(false);
    } else if (mode === 'banner') {
      setShowCancellationBanner(true);
    } else {
      setShowCancellationBanner(false);
    }
  };

  const activeBookingsCount =
    demoState === 'empty' ? 0 : appointments.length;

  return (
    <div
      className={`min-h-screen bg-[#101419] text-[#e0e2ea] flex flex-col justify-between selection:bg-[#d4af37] selection:text-[#3c2f00] font-sans ${
        lang === 'ar' ? 'rtl' : 'ltr'
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Toast Notification */}
      {(calendarToast || rtaSuccessNotice) && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl bg-[#1c2025] border border-[#d4af37]/40 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <span className="material-symbols-outlined text-[#f2ca50] text-[24px]">verified</span>
          <p className="text-sm text-[#e0e2ea] font-medium">
            {calendarToast || rtaSuccessNotice}
          </p>
        </div>
      )}

      {/* Reschedule Confirmation Dialog */}
      {rescheduleModalCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-xl bg-[#181c21] border border-[#31353b] p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#f2ca50] text-[24px]">edit_calendar</span>
              <h3 className="text-lg font-bold text-[#e0e2ea]">Reschedule Appointment</h3>
            </div>
            <p className="text-sm text-[#d0c5af]">
              Connecting to dealership VIP concierge for: <br />
              <strong className="text-white">{rescheduleModalCar}</strong>
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase text-[#d0c5af] font-semibold">Select New Proposed Slot</label>
              <select className="w-full h-11 px-3 rounded-lg bg-[#262a30] text-[#e0e2ea] border border-[#4d4635] text-sm focus:outline-none focus:ring-1 focus:ring-[#f2ca50]">
                <option>Thursday, 22 May 2025 • 05:00 PM GST</option>
                <option>Friday, 23 May 2025 • 11:00 AM GST</option>
                <option>Saturday, 24 May 2025 • 04:30 PM GST (Golden Hour)</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-[#262a30] text-[#e0e2ea] text-sm hover:bg-[#31353b]"
                onClick={() => setRescheduleModalCar(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-[#d4af37] text-[#241a00] font-semibold text-sm hover:brightness-110"
                onClick={() => {
                  setCalendarToast(`Reschedule Request Broadcast: Concierge slot re-allocated for ${rescheduleModalCar}.`);
                  setRescheduleModalCar(null);
                  setTimeout(() => setCalendarToast(null), 4000);
                }}
              >
                Confirm Slot Change
              </button>
            </div>
          </div>
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
              className="relative p-2 rounded-lg bg-[#181c21] hover:bg-[#262a30] text-[#d0c5af] hover:text-[#e0e2ea] transition-colors flex items-center justify-center"
              title="Saved Inventory"
            >
              <span className="material-symbols-outlined text-[20px]">bookmark</span>
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#f2ca50] text-[#241a00] text-[10px] font-bold flex items-center justify-center leading-none">
                4
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
              href="/account/enquiries"
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
          {/* Subtle Ambient Glow Backdrop */}
          <div className="relative w-full overflow-hidden">
            <div className="absolute -top-32 left-1/4 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-[140px] pointer-events-none"></div>
            <div className="absolute top-96 right-10 w-80 h-80 bg-[#7bd0ff]/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-8">
              {/* Breadcrumbs & Telemetry Status Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#d0c5af]">
                  <Link href="/account" className="hover:text-[#f2ca50] transition-colors">
                    Buyer Portal
                  </Link>
                  <span className="text-[#4d4635]">/</span>
                  <Link href="/account/enquiries" className="hover:text-[#f2ca50] transition-colors">
                    Operations
                  </Link>
                  <span className="text-[#4d4635]">/</span>
                  <span className="text-[#f2ca50] font-medium">Appointments & Virtual Garage</span>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#262a30]/60 backdrop-blur-md border border-[#31353b]">
                    <span className="w-2 h-2 rounded-full bg-[#58e7aa] animate-pulse"></span>
                    <span className="text-xs font-mono text-[#e0e2ea]">RTA Telemetry Sync: Connected</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#262a30]/60 backdrop-blur-md font-mono text-xs text-[#f2ca50] border border-[#31353b]">
                    TCF #701982-DXB
                  </div>
                </div>
              </div>

              {/* Hero Title Header Block */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
                <div className="flex flex-col gap-1 max-w-4xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#f2ca50]/10 text-[#f2ca50] text-[11px] font-bold uppercase tracking-widest">
                      Client Console • VIP Tier 1
                    </span>
                    <span className="text-[#4d4635]">|</span>
                    <span className="text-[11px] text-[#d0c5af] font-mono">UTC+04:00 GST</span>
                  </div>
                  <h1 className="text-3xl lg:text-5xl font-extrabold text-[#e0e2ea] tracking-tight leading-tight">
                    Appointments, Test Drives & Virtual Garage
                  </h1>
                  <h2
                    className="text-lg lg:text-xl text-[#d0c5af] font-light tracking-wide text-right lg:text-left rtl"
                    dir="rtl"
                  >
                    المواعيد والتجارب الحركية والمرآب الرقمي الموثق
                  </h2>
                  <p className="text-base text-[#d0c5af]/90 max-w-2xl mt-1">
                    Coordinate private showroom viewings, Dubai Autodrome track runs, and manage your authenticated
                    digital collection under direct RTA title synchronization.
                  </p>
                </div>

                {/* Quick Summary Mini-Widget */}
                <div className="flex items-center gap-6 p-4 rounded-xl bg-[#181c21]/70 backdrop-blur-xl border border-[#262a30] shadow-lg">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#d0c5af] uppercase tracking-wider font-semibold">
                      Active Bookings
                    </span>
                    <span className="text-2xl text-[#f2ca50] font-bold">
                      {String(activeBookingsCount).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="w-px h-10 bg-[#31353b]"></div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#d0c5af] uppercase tracking-wider font-semibold">
                      Garage Fleet
                    </span>
                    <span className="text-2xl text-[#e0e2ea] font-bold">03 Units</span>
                  </div>
                  <div className="w-px h-10 bg-[#31353b]"></div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#d0c5af] uppercase tracking-wider font-semibold">
                      Escrow Holds
                    </span>
                    <span className="text-2xl text-[#58e7aa] font-bold">AED 0.00</span>
                  </div>
                </div>
              </div>

              {/* State Notification Banner (Dismissable upon cancellation) */}
              {(showCancellationBanner || demoState === 'banner') && (
                <div
                  className="flex flex-row items-center justify-between p-4 rounded-xl bg-[#262a30]/90 border border-[#93000a]/50 shadow-xl transition-all"
                  id="cancellationSuccessBanner"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#ffb4ab]/15 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#ffb4ab] text-[24px]">event_busy</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-semibold text-[#e0e2ea]">
                        Appointment Cancelled Successfully
                      </span>
                      <span className="text-sm text-[#d0c5af]">
                        The reservation slot for {cancelledCarTitle} has been released. Holding escrow AED 5,000 has
                        been returned to your vault.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-1.5 rounded-lg bg-[#1c2025] hover:bg-[#31353b] text-[#d0c5af] hover:text-[#e0e2ea] text-xs transition-colors"
                    onClick={() => setShowCancellationBanner(false)}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* SECTION 1: APPOINTMENTS & TEST DRIVES */}
              <section className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-6 rounded-full bg-[#f2ca50]"></div>
                    <h3 className="text-xl font-bold text-[#e0e2ea]">
                      Upcoming Showroom Appointments & Dynamic Track Runs
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#d0c5af] font-semibold">
                    <span>{activeBookingsCount} SESSIONS SCHEDULED</span>
                    <span className="text-[#4d4635]">•</span>
                    <span className="text-[#58e7aa]">ALL VIP ACCREDITED</span>
                  </div>
                </div>

                {/* Appointment Cards Grid */}
                {demoState !== 'empty' && appointments.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8" id="appointmentsGrid">
                    {appointments.map((appt) => (
                      <div
                        key={appt.id}
                        className="group relative flex flex-col justify-between rounded-xl bg-[#181c21]/90 backdrop-blur-xl border border-[#262a30] overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.7)]"
                        id={`appointmentCard-${appt.id}`}
                      >
                        {/* Top Scrim Image */}
                        <div className="relative h-64 w-full overflow-hidden">
                          <img
                            src={appt.imageUrl}
                            alt={appt.carName}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#181c21] via-[#181c21]/40 to-black/60"></div>

                          {/* Badges floating over image */}
                          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md text-xs font-semibold shadow-sm ${
                                appt.statusBadgeVariant === 'confirmed'
                                  ? 'bg-[#58e7aa]/15 text-[#58e7aa] border border-[#58e7aa]/30'
                                  : 'bg-[#7bd0ff]/15 text-[#7bd0ff] border border-[#7bd0ff]/30'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  appt.statusBadgeVariant === 'confirmed'
                                    ? 'bg-[#58e7aa] animate-ping'
                                    : 'bg-[#7bd0ff] animate-pulse'
                                }`}
                              ></span>
                              {appt.statusText}
                            </span>
                            <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-[#0a0e13]/80 backdrop-blur-md text-[#f2ca50] border border-[#31353b]">
                              ID: {appt.bookingRef}
                            </span>
                          </div>

                          {/* Car Details overlay */}
                          <div className="absolute bottom-4 left-4 right-4 flex flex-col">
                            <span className="text-[11px] text-[#f2ca50] tracking-widest uppercase font-semibold">
                              {appt.dealerName}
                            </span>
                            <h4 className="text-xl font-bold text-[#e0e2ea] tracking-tight">
                              {appt.carName}
                            </h4>
                            <span className="text-xs text-[#d0c5af] font-mono">
                              {appt.vin}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 flex flex-col gap-5 flex-1">
                          {/* Session highlight block */}
                          <div className="p-4 rounded-lg bg-[#1c2025]/70 border border-[#262a30] flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[#e0e2ea]">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#f2ca50] text-[20px]">
                                  sports_score
                                </span>
                                <span className="text-sm font-semibold">{appt.sessionType}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-[#262a30] text-[10px] font-bold text-[#d0c5af] uppercase">
                                {appt.sessionDuration}
                              </span>
                            </div>
                            <p className="text-xs text-[#d0c5af] mt-1">{appt.sessionDescription}</p>
                          </div>

                          {/* Timing and Location Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="flex flex-col gap-1 p-3 rounded-lg bg-[#262a30]/40 border border-[#31353b]/40">
                              <span className="text-[11px] uppercase text-[#d0c5af] flex items-center gap-1 font-semibold">
                                <span className="material-symbols-outlined text-[15px] text-[#f2ca50]">schedule</span>
                                Date & Scheduled Slot
                              </span>
                              <span className="text-[#e0e2ea] font-semibold text-sm">
                                {appt.scheduledDate}
                              </span>
                              <span className="font-mono text-xs text-[#f2ca50]">
                                {appt.scheduledSlot}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1 p-3 rounded-lg bg-[#262a30]/40 border border-[#31353b]/40">
                              <span className="text-[11px] uppercase text-[#d0c5af] flex items-center gap-1 font-semibold">
                                <span className="material-symbols-outlined text-[15px] text-[#7bd0ff]">location_on</span>
                                Circuit Access / Venue
                              </span>
                              <span className="text-[#e0e2ea] font-semibold truncate">
                                {appt.venueName}
                              </span>
                              <span className="font-mono text-xs text-[#d0c5af]">
                                {appt.venueDetails}
                              </span>
                            </div>
                          </div>

                          {/* Instructor / Advisor Strip */}
                          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-[#0a0e13]/80 border border-[#262a30]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#262a30] flex items-center justify-center text-[#f2ca50] font-bold font-mono text-xs">
                                {appt.hostName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-[#e0e2ea] font-medium">{appt.hostName}</span>
                                <span className="text-[10px] text-[#d0c5af]">{appt.hostRole}</span>
                              </div>
                            </div>
                            {appt.gatePassPin && (
                              <div className="flex items-center gap-2 pl-3 sm:border-l sm:border-[#31353b]">
                                <span className="text-[10px] text-[#d0c5af] uppercase font-semibold">
                                  Gate Pass PIN:
                                </span>
                                <span className="font-mono text-xs text-[#f2ca50] font-bold tracking-wider px-2 py-0.5 rounded bg-[#1c2025] border border-[#4d4635]">
                                  {appt.gatePassPin}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Controls */}
                          <div className="pt-2 flex flex-wrap items-center gap-2 mt-auto">
                            <button
                              type="button"
                              className="flex-1 min-w-[160px] h-11 px-4 rounded-lg bg-[#d4af37] text-[#241a00] font-semibold text-sm flex items-center justify-center gap-1.5 hover:brightness-110 transition-all shadow-md"
                              onClick={() => handleSyncToCalendar(appt)}
                            >
                              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                              <span>Sync to Calendar</span>
                            </button>

                            <button
                              type="button"
                              className="px-4 h-11 rounded-lg bg-[#262a30] hover:bg-[#36393f] text-[#e0e2ea] text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                              onClick={() => handleOpenReschedule(appt)}
                            >
                              <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                              <span>Reschedule</span>
                            </button>

                            <button
                              type="button"
                              className="px-4 h-11 rounded-lg bg-[#93000a]/20 hover:bg-[#93000a]/40 text-[#ffb4ab] border border-[#ffb4ab]/20 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                              onClick={() => handleOpenCancelModal(appt)}
                            >
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                              <span>Cancel Session</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Empty Appointments State */
                  <div
                    className="flex flex-col items-center justify-center p-12 rounded-xl bg-[#181c21]/60 backdrop-blur-xl border border-[#262a30] text-center gap-4"
                    id="emptyAppointmentsState"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#262a30] flex items-center justify-center text-[#99907c]">
                      <span className="material-symbols-outlined text-[36px]">event_busy</span>
                    </div>
                    <div className="flex flex-col gap-1 max-w-md">
                      <h4 className="text-xl font-bold text-[#e0e2ea]">No Scheduled Viewings Active</h4>
                      <p className="text-sm text-[#d0c5af]">
                        You currently have no showroom viewings or Dubai Autodrome sessions booked. Browse our
                        authenticated vault stock to reserve a private dynamic inspection.
                      </p>
                    </div>
                    <Link
                      href="/cars"
                      className="mt-2 h-11 px-6 rounded-lg bg-[#d4af37] text-[#241a00] font-semibold text-sm flex items-center gap-2 hover:brightness-110 transition-all shadow-md"
                    >
                      <span className="material-symbols-outlined text-[18px]">explore</span>
                      <span>Explore Vault Allocations</span>
                    </Link>
                  </div>
                )}
              </section>

              {/* SECTION 2: VIRTUAL COLLECTOR GARAGE */}
              <section className="flex flex-col gap-6">
                {/* Section Header with Garage Totals */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 p-6 rounded-xl bg-[#181c21]/80 backdrop-blur-xl border border-[#262a30] shadow-xl">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-6 rounded-full bg-[#ffe088]"></div>
                      <h3 className="text-2xl font-bold text-[#e0e2ea]">Virtual Collector Garage</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#33ca90]/30 text-[#6ffbbe] text-[10px] font-bold uppercase tracking-wider border border-[#33ca90]/40">
                        RTA LINKED
                      </span>
                    </div>
                    <p className="text-xs text-[#d0c5af] max-w-xl">
                      Real-time asset telemetry, Mulkiya registration lifecycle monitoring, digital Salik pass tracking,
                      and secondary GCC market value indexation.
                    </p>
                  </div>

                  {/* Total Portfolio Valuation Display */}
                  <div className="flex flex-wrap items-center gap-6 bg-[#1c2025]/70 p-4 rounded-xl border border-[#262a30]">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#d0c5af] uppercase tracking-wider font-semibold">
                        Total Garage Estimated Value
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-[#f2ca50] font-bold">AED</span>
                        <span className="text-2xl font-bold text-[#e0e2ea]">4,950,000</span>
                      </div>
                    </div>

                    <div className="flex flex-col border-l border-[#31353b] pl-4">
                      <span className="text-[10px] text-[#d0c5af] uppercase tracking-wider font-semibold">
                        Indexed Gain (TTM)
                      </span>
                      <div className="flex items-center gap-1 text-[#58e7aa] font-mono text-xs font-bold">
                        <span className="material-symbols-outlined text-[16px]">trending_up</span>
                        <span>+6.4% (+AED 298,000)</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="h-10 px-4 rounded-lg bg-[#262a30] hover:bg-[#36393f] text-[#f2ca50] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      onClick={() => setIsAddVehicleModalOpen(true)}
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      <span>Sync New Vehicle</span>
                    </button>
                  </div>
                </div>

                {/* Garage Vehicle Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {garageVehicles.map((car) => (
                    <div
                      key={car.id}
                      className="group flex flex-col rounded-xl bg-[#181c21]/90 backdrop-blur-xl border border-[#262a30] overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl"
                    >
                      <div className="relative h-52 w-full overflow-hidden">
                        <img
                          src={car.imageUrl}
                          alt={car.makeModel}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#181c21] via-transparent to-black/50"></div>

                        {/* RTA Plate Badge */}
                        <div className="absolute top-4 left-4 flex items-center">
                          <div className="flex items-center px-3 py-1 rounded-md bg-[#0a0e13]/90 backdrop-blur-md shadow-md gap-2 border border-[#31353b]">
                            <span
                              className={`text-[10px] font-bold ${
                                car.plateEmirate === 'ABU DHABI' ? 'text-[#ffb4ab]' : 'text-[#f2ca50]'
                              }`}
                            >
                              {car.plateEmirate}
                            </span>
                            <span className="text-sm font-bold text-[#e0e2ea]">{car.plateNumber}</span>
                          </div>
                        </div>

                        {/* Status Tag */}
                        <div className="absolute top-4 right-4">
                          <span
                            className={`px-2.5 py-1 rounded-full backdrop-blur-md text-[10px] font-bold ${
                              car.statusVariant === 'active'
                                ? 'bg-[#58e7aa]/20 text-[#58e7aa] border border-[#58e7aa]/30'
                                : 'bg-[#f2ca50]/20 text-[#f2ca50] border border-[#f2ca50]/30'
                            }`}
                          >
                            {car.statusText}
                          </span>
                        </div>

                        <div className="absolute bottom-2 left-4 right-4 flex justify-between items-end">
                          <span className="text-[11px] text-[#d0c5af] font-mono">{car.specDetails}</span>
                          <span className="px-2 py-0.5 rounded bg-[#31353b]/80 font-mono text-[10px] text-[#e0e2ea]">
                            {car.mileageKm.toLocaleString()} KM
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex flex-col gap-4 flex-1 justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-[#f2ca50] uppercase font-bold tracking-wider">
                            Collector Asset #{car.assetNumber}
                          </span>
                          <h4 className="text-base font-bold text-[#e0e2ea]">{car.makeModel}</h4>
                          <span className="font-mono text-xs text-[#d0c5af]">VIN: {car.vin}</span>
                        </div>

                        {/* Telemetry indicators */}
                        <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-[#1c2025] border border-[#262a30]">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-[#d0c5af] uppercase font-semibold">Mulkiya Renewal</span>
                            <span
                              className={`font-mono text-xs font-semibold ${
                                car.statusVariant === 'expiring' ? 'text-[#ffb4ab]' : 'text-[#e0e2ea]'
                              }`}
                            >
                              {car.mulkiyaRenewalMonth}
                            </span>
                            <span
                              className={`text-[10px] ${
                                car.statusVariant === 'expiring' ? 'text-[#f2ca50]' : 'text-[#58e7aa]'
                              }`}
                            >
                              {car.mulkiyaStatus}
                            </span>
                          </div>

                          <div className="flex flex-col border-l border-[#31353b] pl-3">
                            <span className="text-[10px] text-[#d0c5af] uppercase font-semibold">Est. Market Value</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] text-[#f2ca50] font-bold">AED</span>
                              <span className="text-sm font-bold text-[#e0e2ea]">
                                {car.estMarketValueAed.toLocaleString()}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#58e7aa] flex items-center">
                              {car.quarterGainPct}
                            </span>
                          </div>
                        </div>

                        {/* Actions Strip */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#262a30]">
                          <button
                            type="button"
                            className="text-xs text-[#f2ca50] hover:underline flex items-center gap-1 font-semibold"
                            onClick={() => {
                              setCalendarToast(`Telemetry Vault Opened: Real-time RTA diagnostics active for ${car.makeModel}.`);
                              setTimeout(() => setCalendarToast(null), 3000);
                            }}
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            <span>View Telemetry Vault</span>
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="p-1.5 rounded bg-[#1c2025] hover:bg-[#262a30] text-[#d0c5af] hover:text-[#e0e2ea] transition-colors"
                              title="Request Appraisal"
                              onClick={() => {
                                setCalendarToast(`Appraisal Scheduled: TASJEEL pre-inspection queued for ${car.makeModel}.`);
                                setTimeout(() => setCalendarToast(null), 3000);
                              }}
                            >
                              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                            </button>
                            <button
                              type="button"
                              className="p-1.5 rounded bg-[#1c2025] hover:bg-[#262a30] text-[#d0c5af] hover:text-[#e0e2ea] transition-colors"
                              title="Export Documentation"
                              onClick={() => {
                                setCalendarToast(`Export Started: PDF ownership title & service passport generated.`);
                                setTimeout(() => setCalendarToast(null), 3000);
                              }}
                            >
                              <span className="material-symbols-outlined text-[16px]">download</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Vehicle to Digital Garage Promo / Action Card */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-[#181c21] via-[#1c2025] to-[#181c21] border border-[#262a30] flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#f2ca50]/10 flex items-center justify-center shrink-0 border border-[#f2ca50]/20">
                      <span className="material-symbols-outlined text-[#f2ca50] text-[28px]">garage_home</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-[#e0e2ea]">
                        Integrate New Asset via RTA Electronic Traffic File
                      </span>
                      <p className="text-xs text-[#d0c5af]">
                        Instant validation across Dubai RTA, Abu Dhabi ITC, and Sharjah Police traffic systems. Real-time
                        valuation updates and warranty tracking.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full md:w-auto shrink-0 h-11 px-6 rounded-lg bg-[#d4af37] text-[#241a00] font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md"
                    onClick={() => setIsAddVehicleModalOpen(true)}
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Sync Traffic File / VIN</span>
                  </button>
                </div>
              </section>

              {/* SECTION 4: INTERACTIVE STATE SWITCHER BAR */}
              <section className="p-4 rounded-xl bg-[#0a0e13]/90 backdrop-blur-md border border-[#262a30] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[#d0c5af] text-xs font-semibold">
                  <span className="material-symbols-outlined text-[#f2ca50] text-[18px]">developer_mode</span>
                  <span>INTERACTIVE DEMO STATES:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      demoState === 'populated'
                        ? 'bg-[#d4af37] text-[#241a00]'
                        : 'bg-[#1c2025] hover:bg-[#262a30] text-[#d0c5af]'
                    }`}
                    id="btnStatePopulated"
                    onClick={() => handleSetState('populated')}
                  >
                    Default: Populated Active View
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      demoState === 'empty'
                        ? 'bg-[#d4af37] text-[#241a00]'
                        : 'bg-[#1c2025] hover:bg-[#262a30] text-[#d0c5af]'
                    }`}
                    id="btnStateEmpty"
                    onClick={() => handleSetState('empty')}
                  >
                    Empty Appointments State
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      demoState === 'banner'
                        ? 'bg-[#d4af37] text-[#241a00]'
                        : 'bg-[#1c2025] hover:bg-[#262a30] text-[#d0c5af]'
                    }`}
                    id="btnStateBanner"
                    onClick={() => handleSetState('banner')}
                  >
                    Post-Cancellation Alert State
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* MODAL 1: APPOINTMENT CANCELLATION & ESCROW RELEASE */}
        {isCancelModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 transition-opacity duration-300"
            id="cancellationModal"
          >
            <div className="w-full max-w-xl rounded-xl bg-[#181c21] border border-[#31353b] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-6 bg-[#1c2025] border-b border-[#262a30] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#ffb4ab]/15 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-[22px]">event_busy</span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-[#e0e2ea]">Confirm Cancellation & Escrow Release</h3>
                    <span className="text-[10px] text-[#d0c5af] uppercase tracking-wider font-semibold">
                      Automotive OS Escrow Protocol #ES-9921
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-[#262a30] hover:bg-[#36393f] flex items-center justify-center text-[#d0c5af] hover:text-[#e0e2ea] transition-colors"
                  onClick={() => setIsCancelModalOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex flex-col gap-6">
                {/* Target Appointment Brief */}
                <div className="p-4 rounded-lg bg-[#0a0e13]/80 border border-[#262a30] flex flex-col gap-1">
                  <span className="text-[10px] text-[#d0c5af] uppercase font-semibold">Target Booking</span>
                  <span className="text-base font-bold text-[#e0e2ea]" id="modalTargetVehicle">
                    {targetCancelAppt?.carName || '2024 Porsche 911 GT3 RS'}
                  </span>
                  <span className="text-xs text-[#d0c5af]" id="modalTargetLocation">
                    {targetCancelAppt?.venueName} • {targetCancelAppt?.scheduledDate}
                  </span>
                </div>

                {/* Cancellation Reason Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-[#d0c5af] tracking-wider font-semibold">
                    Please Select Cancellation Reason
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'alternative', label: 'Found alternative vehicle' },
                      { id: 'conflict', label: 'Personal schedule conflict' },
                      { id: 'price', label: 'Price or terms reconsideration' },
                      { id: 'dealer', label: 'Dealer non-responsive' },
                    ].map((reason) => (
                      <label
                        key={reason.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          cancelReason === reason.id
                            ? 'bg-[#262a30] border-[#d4af37]'
                            : 'bg-[#1c2025] border-[#262a30] hover:bg-[#262a30]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="cancelReason"
                          value={reason.id}
                          checked={cancelReason === reason.id}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="accent-[#f2ca50]"
                        />
                        <span className="text-[#e0e2ea]">{reason.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Escrow and Privacy Assurance Pill */}
                <div className="p-4 rounded-lg bg-[#1c2025]/70 border border-[#262a30] flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#58e7aa] text-[22px] shrink-0">
                    verified_user
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-[#e0e2ea]">Automatic Escrow Safeguard</span>
                    <p className="text-xs text-[#d0c5af]">
                      Immediate release of holding slot. Contact info and personal telemetry will be purged from dealer
                      calendar within 60 seconds. Pre-authorized deposits are credited directly to your primary UAE IBAN.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-[#1c2025] border-t border-[#262a30] flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  className="w-full sm:w-auto h-11 px-5 rounded-lg bg-[#262a30] hover:bg-[#36393f] text-[#e0e2ea] text-xs font-medium transition-colors"
                  onClick={() => setIsCancelModalOpen(false)}
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  className="w-full sm:w-auto h-11 px-6 rounded-lg bg-[#93000a] hover:bg-[#ba1a1a] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  )}
                  <span>Confirm Cancellation & Release</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: ADD VEHICLE TO DIGITAL GARAGE (RTA SYNC) */}
        {isAddVehicleModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
            id="addVehicleModal"
          >
            <div className="w-full max-w-lg rounded-xl bg-[#181c21] border border-[#31353b] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-6 bg-[#1c2025] border-b border-[#262a30] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f2ca50]/10 flex items-center justify-center shrink-0 border border-[#f2ca50]/20">
                    <span className="material-symbols-outlined text-[#f2ca50] text-[24px]">garage_home</span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-[#e0e2ea]">Sync Vehicle to Digital Garage</h3>
                    <span className="text-[10px] text-[#f2ca50] uppercase font-bold tracking-wider">
                      RTA Electronic Title Sync
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-[#262a30] hover:bg-[#36393f] flex items-center justify-center text-[#d0c5af] hover:text-[#e0e2ea] transition-colors"
                  onClick={() => setIsAddVehicleModalOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex flex-col gap-4">
                <p className="text-xs text-[#d0c5af]">
                  Provide your UAE Traffic Code (TCF) or 17-digit Chassis VIN to instantly retrieve official Mulkiya
                  registration, mortgage clearance, and secondary market valuation.
                </p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase text-[#d0c5af] font-semibold">Registration Lookup Method</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                        syncMethod === 'tcf'
                          ? 'bg-[#d4af37] text-[#241a00]'
                          : 'bg-[#262a30] text-[#e0e2ea] hover:bg-[#36393f]'
                      }`}
                      onClick={() => setSyncMethod('tcf')}
                    >
                      Traffic File (TCF)
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                        syncMethod === 'vin'
                          ? 'bg-[#d4af37] text-[#241a00]'
                          : 'bg-[#262a30] text-[#e0e2ea] hover:bg-[#36393f]'
                      }`}
                      onClick={() => setSyncMethod('vin')}
                    >
                      Chassis VIN String
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase text-[#d0c5af] font-semibold">
                    {syncMethod === 'tcf'
                      ? 'Dubai RTA / Abu Dhabi ITC Traffic File #'
                      : '17-Character Chassis VIN String'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full h-11 px-4 rounded-lg bg-[#262a30] text-[#e0e2ea] font-mono text-sm border border-[#4d4635] focus:outline-none focus:ring-1 focus:ring-[#f2ca50]"
                      value={tcfInput}
                      onChange={(e) => setTcfInput(e.target.value)}
                      placeholder={syncMethod === 'tcf' ? 'e.g. 70198201' : 'e.g. WP0AF2A93RS189021'}
                    />
                    <span className="absolute right-3 top-3 text-[#58e7aa] material-symbols-outlined text-[18px]">
                      check_circle
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase text-[#d0c5af] font-semibold">
                    Emirates ID Verification (Linked)
                  </label>
                  <input
                    type="password"
                    readOnly
                    value="784-1985-1928371-1"
                    className="w-full h-11 px-4 rounded-lg bg-[#262a30] text-[#d0c5af] font-mono text-sm border border-[#31353b] cursor-not-allowed"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#1c2025] text-xs text-[#d0c5af] flex items-center gap-2 border border-[#262a30]">
                  <span className="material-symbols-outlined text-[#f2ca50] text-[20px]">info</span>
                  <span>Automatic Salik toll balance & Tasjeel technical test audit will be linked.</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-[#1c2025] border-t border-[#262a30] flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="h-11 px-5 rounded-lg bg-[#262a30] text-[#e0e2ea] text-xs font-medium hover:bg-[#36393f]"
                  onClick={() => setIsAddVehicleModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="h-11 px-6 rounded-lg bg-[#d4af37] text-[#241a00] font-bold text-xs flex items-center gap-2 hover:brightness-110 transition-all shadow-md"
                  onClick={handleExecuteRtaSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <span className="inline-block w-4 h-4 border-2 border-[#241a00] border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">sync</span>
                  )}
                  <span>Query RTA Gateway</span>
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
