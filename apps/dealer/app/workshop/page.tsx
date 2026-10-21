'use client';

import React, { useState } from 'react';
import { DealerSidebar } from '../../components/dealer-sidebar';
import { DealerHeader } from '../../components/dealer-header';
import {
  VERIFIED_WORKSHOP_FIXTURE,
  WorkshopJobCardData,
} from '../../lib/api';

export default function WorkshopAndBaysPage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [role, setRole] = useState<'PRINCIPAL' | 'SALES_REP'>('PRINCIPAL');
  const isRtl = locale === 'ar';

  const [workshopData] = useState<WorkshopJobCardData>(VERIFIED_WORKSHOP_FIXTURE);
  const [selectedBayNumber, setSelectedBayNumber] = useState<number>(2);
  const [demonstratorState, setDemonstratorState] = useState<'DEFAULT' | 'CONGESTION' | 'MORNING' | 'TECHS'>('DEFAULT');

  // Modals & User Feedback
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [newRoModalOpen, setNewRoModalOpen] = useState(false);
  const [orderPartsModalOpen, setOrderPartsModalOpen] = useState(false);
  const [tasjeelModalOpen, setTasjeelModalOpen] = useState(false);
  const [clockOutModalOpen, setClockOutModalOpen] = useState(false);

  // New RO Form State
  const [newRoCustomer, setNewRoCustomer] = useState('Al Qasimi Royal Court');
  const [newRoVehicle, setNewRoVehicle] = useState('2024 Ferrari SF90 XX Stradale');
  const [newRoScope, setNewRoScope] = useState('Bespoke Titanium Exhaust & Corner Weight Tuning');
  const [newRoBay, setNewRoBay] = useState('Bay 01');

  const handleCreateRo = () => {
    setNewRoModalOpen(false);
    setFeedbackMessage(
      isRtl
        ? `تم إنشاء بطاقة الإصلاح رقم #RO-2025-${Math.floor(4100 + Math.random() * 50)} بنجاح وتم ربطها بالمنصة ${newRoBay}.`
        : `Repair Order RO #2025-${Math.floor(4100 + Math.random() * 50)} opened for ${newRoCustomer} in ${newRoBay}.`
    );
  };

  const handleClockOut = () => {
    setClockOutModalOpen(false);
    setFeedbackMessage(
      isRtl
        ? 'تم تسجيل انتهاء العمل وإغلاق بطاقة الإصلاح #RO-2025-4094 ونقل المركبة إلى منطقة التسليم النهائي.'
        : 'Repair Order #RO-2025-4094 clocked out and completed. Mulkiya passing certificate issued.'
    );
  };

  return (
    <div
      className={`min-h-screen bg-surface font-body-md text-on-surface antialiased ${
        isRtl ? 'rtl' : 'ltr'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <DealerSidebar locale={locale} />

      <div className={isRtl ? 'pr-64 min-h-screen flex flex-col' : 'pl-64 min-h-screen flex flex-col'}>
        <DealerHeader
          currentRole={role}
          onRoleToggle={() => setRole(role === 'PRINCIPAL' ? 'SALES_REP' : 'PRINCIPAL')}
          locale={locale}
          onLocaleToggle={() => setLocale(locale === 'en' ? 'ar' : 'en')}
        />

        <main className="w-full pt-16 bg-surface px-space-lg pb-space-xl flex-1">
          <div className="flex flex-col w-full">
            {/* Feedback Notification Banner */}
            {feedbackMessage && (
              <div className="mt-space-md mb-2 p-space-md rounded-xl bg-primary-container/20 border border-primary text-on-surface flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                  <div>
                    <span className="font-headline-sm text-body-md font-semibold text-primary block">
                      {isRtl ? 'عملية ورشة العمل موثقة بنجاح' : 'Workshop Dispatch Event Recorded'}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {feedbackMessage}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackMessage(null)}
                  className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-body-sm text-on-surface"
                >
                  {isRtl ? 'إغلاق' : 'Dismiss'}
                </button>
              </div>
            )}

            {/* P1 Specification & Concept Template Notice Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high p-space-md shadow-xl my-space-md border border-white/[0.06]">
              <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
              <div className="absolute left-1/3 -bottom-24 w-72 h-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none"></div>

              <div className="relative flex flex-col xl:flex-row items-start xl:items-center justify-between gap-space-md z-10">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/15 text-secondary font-label-caps text-label-caps tracking-widest font-semibold uppercase">
                      <span className="material-symbols-outlined text-[14px]">architecture</span>
                      [FUTURE ROADMAP • P1 SPECIFICATION — CONCEPT TEMPLATE]
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-bright text-on-surface-variant font-label-caps text-label-caps uppercase">
                      DMS Phase 1.4 Spec Preview
                    </span>
                    <span className="text-on-surface-variant font-data-mono-num text-body-sm">
                      DED #612048 • SilberArrows Workshop Hub (Al Quoz 1)
                    </span>
                  </div>

                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold flex items-center gap-2">
                    <span>{isRtl ? 'تقويم ورشة العمل وتوزيع المنصات' : 'Workshop Job Card & Bay Operations Calendar'}</span>
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase px-2 py-0.5 rounded bg-surface-container-highest">
                      {isRtl ? 'إدارة المنصات 6' : '6-Bay Dispatch Grid'}
                    </span>
                  </h1>

                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-4xl">
                    {isRtl
                      ? 'نموذج مواصفات المرحلة الأولى (P1) لأنظمة إدارة الورش: استقبال خدمات الصيانة، بطاقات الإصلاح الإلكترونية (RO)، مراقبة المنصات الهيدروليكية الست، وجدولة الفنيين المعتمدين.'
                      : 'CONCEPT TEMPLATE ONLY: Phase 1 Dealership Management System Roadmap. Specification mockups for service reception, electronic job cards (ROs), 6-bay hoist telemetry, and technician dispatch scheduling. No live production write-backs occur from this mockup.'}
                  </p>
                </div>

                <div className="flex items-center gap-space-sm shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFeedbackMessage('Telemetry sensors synchronizing with Al Quoz 1 workshop controllers.')}
                    className="flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-bright font-body-sm text-body-sm font-semibold transition-all shadow-md border border-white/[0.05]"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">sensors</span>
                    <span>{isRtl ? 'حساسات المنصات الحية' : 'Live Hoist Telemetry'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackMessage('Master diagnostic technician assignments dispatched to bay tablets.')}
                    className="flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-bright font-body-sm text-body-sm font-semibold transition-all shadow-md border border-white/[0.05]"
                  >
                    <span className="material-symbols-outlined text-[18px] text-tertiary">badge</span>
                    <span>{isRtl ? 'توزيع الفنيين' : 'Technician Dispatch'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRoModalOpen(true)}
                    className="flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-fixed-dim font-body-sm text-body-sm font-semibold transition-all shadow-lg shadow-primary/20"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>{isRtl ? 'فتح بطاقة إصلاح (RO)' : 'Create Repair Order (RO)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Real-Time Workshop KPI Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
              {/* KPI 1 */}
              <div className="relative overflow-hidden rounded-xl bg-surface-container-high p-space-md shadow-md flex items-center justify-between border border-white/[0.05]">
                <div className="flex flex-col gap-0.5">
                  <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                    {isRtl ? 'إشغال المنصات النشط' : 'Active Hoist Occupancy'}
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-headline-lg text-headline-lg font-bold text-on-surface">5 / 6</span>
                    <span className="font-label-caps text-label-caps text-tertiary bg-tertiary-container/20 px-1.5 py-0.5 rounded">
                      83% Utilization
                    </span>
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                    <span>{isRtl ? 'منصة واحدة جاهزة' : '1 Rapid Turn Bay Ready'}</span>
                    <span className="text-on-surface-variant/50">•</span>
                    <span className="text-tertiary font-data-mono-num text-data-mono-num">Bay 6 Green</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center shrink-0 border border-white/[0.04]">
                  <svg className="w-10 h-10 -rotate-90 text-surface-container-highest" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" fill="none" r="14" stroke="currentColor" strokeWidth="3"></circle>
                    <circle
                      cx="18"
                      cy="18"
                      fill="none"
                      r="14"
                      stroke="#58e7aa"
                      strokeDasharray="88"
                      strokeDashoffset="15"
                      strokeLinecap="round"
                      strokeWidth="3"
                    ></circle>
                  </svg>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="relative overflow-hidden rounded-xl bg-surface-container-high p-space-md shadow-md flex items-center justify-between border border-white/[0.05]">
                <div className="flex flex-col gap-0.5">
                  <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-primary">receipt_long</span>
                    {isRtl ? 'بطاقات الإصلاح المفتوحة' : 'Open Repair Orders (RO)'}
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-headline-lg text-headline-lg font-bold text-on-surface">14</span>
                    <span className="font-label-caps text-label-caps text-primary bg-primary-container/20 px-1.5 py-0.5 rounded">
                      In Progress
                    </span>
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                    <span className="text-error font-medium">{isRtl ? '4 بانتظار الشحن الجوي' : '4 Awaiting Air-Freight Parts'}</span>
                    <span className="text-on-surface-variant/50">•</span>
                    <span className="font-data-mono-num text-data-mono-num text-on-surface">Stuttgart</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center shrink-0 border border-white/[0.04]">
                  <span className="material-symbols-outlined text-primary text-[28px]">pending_actions</span>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="relative overflow-hidden rounded-xl bg-surface-container-high p-space-md shadow-md flex items-center justify-between border border-white/[0.05]">
                <div className="flex flex-col gap-0.5">
                  <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-secondary">pace</span>
                    {isRtl ? 'متوسط سرعة الإنجاز' : 'Average Bay Turn Time'}
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-headline-lg text-headline-lg font-bold text-on-surface">3.4</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface-variant">Hours</span>
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                    <span className="text-tertiary">▼ 18m faster</span>
                    <span className="text-on-surface-variant">vs GCC Supercar Benchmark</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center shrink-0 border border-white/[0.04]">
                  <span className="material-symbols-outlined text-secondary text-[28px]">timer</span>
                </div>
              </div>

              {/* KPI 4 */}
              <div className="relative overflow-hidden rounded-xl bg-surface-container-high p-space-md shadow-md flex items-center justify-between border border-white/[0.05]">
                <div className="flex flex-col gap-0.5">
                  <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-tertiary">engineering</span>
                    {isRtl ? 'كفاءة كبار الفنيين' : 'Master Tech Efficiency'}
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-headline-lg text-headline-lg font-bold text-tertiary font-data-mono-num">
                      104.2%
                    </span>
                    <span className="font-label-caps text-label-caps text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded">
                      Optimal
                    </span>
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                    <span>{isRtl ? '6 فنيين مسجلين' : '6 Techs Clocked-In'}</span>
                    <span className="text-on-surface-variant/50">•</span>
                    <span className="text-primary">{isRtl ? '1 كبير فاحصين' : '1 Lead Diagnostician'}</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center shrink-0 border border-white/[0.04]">
                  <span className="material-symbols-outlined text-tertiary text-[28px]">bolt</span>
                </div>
              </div>
            </div>

            {/* Primary Split Grid: Left 6-Bay Gantt Dispatcher + Right Electronic Job Card Spec */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              {/* LEFT PANEL: Dynamic 6-Bay Interactive Gantt Dispatch Calendar (7 Cols on xl) */}
              <section className="lg:col-span-7 xl:col-span-7 flex flex-col gap-space-md">
                {/* Calendar Header & Navigation Controls */}
                <div className="rounded-xl bg-surface-container-high p-space-md shadow-md flex flex-col gap-space-sm border border-white/[0.05]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shadow-sm border border-white/[0.04]">
                        <span className="material-symbols-outlined text-[20px]">calendar_view_week</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                            {isRtl ? 'جدول المنصات النشط' : 'Active Bay Schedule'}
                          </h2>
                          <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-caps text-label-caps uppercase">
                            08:00 – 18:00 GST
                          </span>
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">
                          {isRtl
                            ? 'شبكة توزيع ورشة العمل الحية • توقيت دبي القياسي (UTC+4)'
                            : 'Live Workshop Dispatch Grid • Dubai Standard Time (UTC+4)'}
                        </div>
                      </div>
                    </div>

                    {/* Date Selector & Quick Filters */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-surface-container rounded-lg p-1 text-on-surface-variant font-body-sm text-body-sm border border-white/[0.04]">
                        <button
                          type="button"
                          className="p-1 hover:text-on-surface rounded hover:bg-surface-container-high transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <span className="px-2.5 font-medium text-on-surface font-data-mono-num text-data-mono-num">
                          Today, 24 Oct
                        </span>
                        <button
                          type="button"
                          className="p-1 hover:text-on-surface rounded hover:bg-surface-container-high transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFeedbackMessage('Bay filter panel opened.')}
                        className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors border border-white/[0.04]"
                        title="Filter Bays"
                      >
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                      </button>
                    </div>
                  </div>

                  {/* Legend Ribbon */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2 bg-surface-container/40 p-2.5 rounded-lg border border-white/[0.03]">
                    <div className="flex items-center gap-3 text-body-sm flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
                        <span className="w-2.5 h-2.5 rounded-sm bg-tertiary"></span>
                        {isRtl ? 'قيد التنفيذ' : 'In Progress'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
                        <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span>
                        {isRtl ? 'فحص تسجيل RTA' : 'RTA Inspection'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
                        <span className="w-2.5 h-2.5 rounded-sm bg-secondary"></span>
                        {isRtl ? 'محجوز / في الانتظار' : 'Queued / Booked'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
                        <span className="w-2.5 h-2.5 rounded-sm bg-surface-bright"></span>
                        {isRtl ? 'منصة متاحة' : 'Available'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        {isRtl ? 'المؤشر الحالي:' : 'Current Marker:'}
                      </span>
                      <span className="font-data-mono-num text-data-mono-num text-error font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-error animate-ping"></span> 14:15 GST
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gantt Multi-Bay Matrix */}
                <div className="rounded-xl bg-surface-container-high p-space-md shadow-md overflow-x-auto border border-white/[0.05]">
                  <div className="min-w-[700px] flex flex-col gap-3">
                    {/* Timeline Header (08:00 - 18:00) */}
                    <div className="grid grid-cols-12 gap-1 pb-2 text-center text-on-surface-variant font-data-mono-num text-body-sm border-b border-surface-container">
                      <div className={`col-span-3 ${isRtl ? 'text-right pr-2' : 'text-left pl-2'} font-label-caps text-label-caps uppercase`}>
                        {isRtl ? 'المنصة / المواصفات' : 'Workshop Bay / Specs'}
                      </div>
                      <div className="col-span-9 grid grid-cols-10 text-center relative">
                        <span>08:00</span>
                        <span>09:00</span>
                        <span>10:00</span>
                        <span>11:00</span>
                        <span>12:00</span>
                        <span>13:00</span>
                        <span className="text-error font-bold relative">
                          14:00
                          <span className="absolute left-1/4 -bottom-3 w-2 h-2 bg-error rounded-full -translate-x-1/2"></span>
                        </span>
                        <span>15:00</span>
                        <span>16:00</span>
                        <span>17:00</span>
                      </div>
                    </div>

                    {/* Timeline Grid Body with Live Needle Container */}
                    <div className="relative flex flex-col gap-2.5">
                      {/* Global Vertical 14:15 Live Indicator Marker Overlay */}
                      <div
                        className={`absolute top-0 bottom-0 pointer-events-none z-30 ${
                          isRtl ? 'right-[65%]' : 'left-[65%]'
                        }`}
                      >
                        <div className="w-0.5 h-full bg-error shadow-[0_0_8px_rgba(255,180,171,0.8)] relative">
                          <div className="absolute -top-1.5 -left-1 w-2.5 h-2.5 rounded-full bg-error animate-pulse"></div>
                        </div>
                      </div>

                      {/* Render All 6 Bays */}
                      {workshopData.bays.map((bay) => {
                        const isSelected = selectedBayNumber === bay.bayNumber;

                        return (
                          <div
                            key={bay.bayNumber}
                            onClick={() => setSelectedBayNumber(bay.bayNumber)}
                            className={`grid grid-cols-12 gap-2 p-2.5 rounded-lg items-center cursor-pointer transition-colors border ${
                              isSelected
                                ? 'bg-surface-container-highest ring-1 ring-primary/40 border-primary/50'
                                : 'bg-surface-container border-white/[0.03] hover:bg-surface-container-highest'
                            }`}
                          >
                            <div className="col-span-3 flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${bay.statusDot}`}></span>
                                <span className={`font-headline-sm text-headline-sm font-semibold truncate ${
                                  isSelected ? 'text-primary' : 'text-on-surface'
                                }`}>
                                  {bay.bayCode}
                                </span>
                                <span className={`text-[10px] font-label-caps px-1 py-0.2 rounded font-semibold uppercase ${
                                  bay.specBadgeColor === 'primary'
                                    ? 'bg-primary-container text-on-primary-container'
                                    : bay.specBadgeColor === 'tertiary'
                                    ? 'bg-tertiary-container/30 text-tertiary'
                                    : bay.specBadgeColor === 'secondary'
                                    ? 'bg-secondary/20 text-secondary'
                                    : 'bg-surface-bright text-on-surface-variant'
                                }`}>
                                  {bay.specBadge}
                                </span>
                              </div>
                              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                                {bay.typeLabel}
                              </span>
                            </div>

                            {/* Bay Timeline Track */}
                            <div className="col-span-9 relative h-14 bg-surface-container-lowest/60 rounded-md overflow-hidden flex items-center border border-white/[0.02]">
                              {bay.tracks.map((track) => {
                                const isBlockSelected = track.status === 'ACTIVE_SELECTED';
                                const isBlockVacant = track.status === 'READY_VACANT';
                                const isBlockProgress = track.status === 'IN_PROGRESS';
                                const isBlockCompleted = track.status === 'COMPLETED';

                                return (
                                  <div
                                    key={track.id}
                                    style={{
                                      [isRtl ? 'right' : 'left']: `${track.leftPct}%`,
                                      width: `${track.widthPct}%`,
                                    }}
                                    className={`absolute h-11 rounded px-2.5 py-1 flex flex-col justify-center transition-all ${
                                      isBlockSelected
                                        ? 'bg-primary text-on-primary shadow-lg font-bold z-10'
                                        : isBlockVacant
                                        ? 'border border-dashed border-tertiary/40 bg-tertiary/5 text-tertiary items-center'
                                        : isBlockProgress
                                        ? 'bg-tertiary-container/30 text-on-surface hover:bg-tertiary-container/45'
                                        : isBlockCompleted
                                        ? 'bg-surface-bright/40 text-on-surface-variant'
                                        : 'bg-secondary/15 text-secondary'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-xs">
                                      <span className={`truncate font-medium ${
                                        isBlockSelected ? 'text-on-primary font-bold' : isBlockProgress ? 'text-tertiary' : ''
                                      }`}>
                                        {track.vehicleModel}
                                      </span>
                                      <span className="font-data-mono-num text-[10px] opacity-80">
                                        {isBlockSelected ? 'ACTIVE' : track.timeRange.split(' - ')[0]}
                                      </span>
                                    </div>
                                    <span className="truncate text-[10px] opacity-80">
                                      {track.scope}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Live Workshop Environmental & Bay Sensor Ribbon */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                  <div className="bg-surface-container p-space-sm rounded-lg flex items-center gap-space-sm border border-white/[0.04]">
                    <div className="w-8 h-8 rounded-md bg-surface-container-high flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[18px]">thermostat</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        {isRtl ? 'غرفة الداينو والتكييف' : 'HVAC Dyno Chamber'}
                      </span>
                      <span className="font-data-mono-num text-body-md font-semibold text-on-surface">
                        {workshopData.telemetryEnvironmental.hvacTempRh}
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface-container p-space-sm rounded-lg flex items-center gap-space-sm border border-white/[0.04]">
                    <div className="w-8 h-8 rounded-md bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px]">air</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        {isRtl ? 'سحب العادم المركزي' : 'Exhaust Extraction'}
                      </span>
                      <span className="font-data-mono-num text-body-md font-semibold text-on-surface">
                        {workshopData.telemetryEnvironmental.exhaustCfm}
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface-container p-space-sm rounded-lg flex items-center gap-space-sm border border-white/[0.04]">
                    <div className="w-8 h-8 rounded-md bg-surface-container-high flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined text-[18px]">mobile_arrow_right</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        {isRtl ? 'ضاغط الهواء الرئيسي' : 'Central Air Compressor'}
                      </span>
                      <span className="font-data-mono-num text-body-md font-semibold text-tertiary">
                        {workshopData.telemetryEnvironmental.centralAirBar}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* RIGHT PANEL: Active Selected Electronic Job Card Detail (RO-4094) (5 Cols on xl) */}
              <section className="lg:col-span-5 xl:col-span-5 flex flex-col gap-space-md">
                {/* Electronic Job Card Master Container */}
                <div className="rounded-xl bg-surface-container-high p-space-md shadow-xl flex flex-col gap-space-md relative overflow-hidden border border-white/[0.05]">
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>

                  {/* RO Header & Spec Strip */}
                  <div className="flex flex-col gap-space-xs border-b border-surface-container-highest pb-space-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-data-mono-num text-label-caps font-bold">
                          {workshopData.roNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary font-label-caps text-label-caps uppercase">
                          {isRtl ? 'نشط في المنصة 02' : workshopData.bayName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-variant font-label-caps text-label-caps uppercase">
                        <span className="material-symbols-outlined text-[14px] text-tertiary">lock</span>
                        {isRtl ? 'سجل بطاقة محمي' : 'Protected RO Record'}
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between mt-1">
                      <div>
                        <h3 className="font-headline-md text-headline-md font-bold text-on-surface leading-tight">
                          {workshopData.vehicle.model}
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {workshopData.vehicle.subModel}
                        </p>
                      </div>
                    </div>

                    {/* Vehicle Metadata Chips */}
                    <div className="grid grid-cols-3 gap-2 mt-2 bg-surface-container p-2.5 rounded-lg text-body-sm border border-white/[0.03]">
                      <div>
                        <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                          {isRtl ? 'اللوحة / التسجيل' : 'Plate / Reg'}
                        </div>
                        <div className="font-data-mono-num font-semibold text-primary">
                          {workshopData.vehicle.plate}
                        </div>
                      </div>

                      <div>
                        <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                          Stock / VIN
                        </div>
                        <div className="font-data-mono-num text-[11px] text-on-surface truncate" title={workshopData.vehicle.vin}>
                          ...{workshopData.vehicle.vin.substring(10)}
                        </div>
                      </div>

                      <div>
                        <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                          {isRtl ? 'المسافة' : 'Odometer'}
                        </div>
                        <div className="font-data-mono-num font-semibold text-on-surface">
                          {workshopData.vehicle.odometerKm.toLocaleString()} KM
                        </div>
                      </div>
                    </div>

                    {/* Stakeholders */}
                    <div className="flex items-center justify-between text-body-sm pt-1 text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">account_balance</span>
                        <span className="font-medium text-on-surface">{workshopData.client.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-secondary">support_agent</span>
                        <span>SA: {workshopData.client.serviceAdvisor}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-tertiary">verified_user</span>
                        <span>Master Tech: <strong className="text-on-surface">{workshopData.client.masterTechnician}</strong></span>
                      </div>
                      <span className="font-data-mono-num text-label-caps text-tertiary">
                        Clocked {workshopData.client.techClockedTime}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Point Digital Inspection (MPI) Health Matrix */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-secondary">checklist_rtl</span>
                        {isRtl ? 'فحص النقاط المتعددة الرقمي (MPI)' : 'Multi-Point Inspection (MPI) Telemetry'}
                      </span>
                      <span className="font-label-caps text-label-caps text-tertiary bg-tertiary/10 px-2 py-0.5 rounded font-semibold">
                        34 of 34 Checked
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* PCCB Carbon Discs */}
                      <div className="bg-surface-container p-2.5 rounded-lg flex flex-col justify-between border border-white/[0.03]">
                        <div className="flex items-center justify-between">
                          <span className="font-body-sm text-body-sm font-medium text-on-surface">PCCB Carbon Discs</span>
                          <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="font-data-mono-num text-body-md font-bold text-tertiary">
                            {workshopData.mpiTelemetry.carbonDiscsLife}% Life
                          </span>
                          <span className="font-label-caps text-[10px] text-on-surface-variant">Pass (Surface Clean)</span>
                        </div>
                        <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-tertiary h-full rounded-full" style={{ width: `${workshopData.mpiTelemetry.carbonDiscsLife}%` }}></div>
                        </div>
                      </div>

                      {/* Tires Michelin Cup 2 R */}
                      <div className="bg-surface-container p-2.5 rounded-lg flex flex-col justify-between border border-white/[0.03]">
                        <div className="flex items-center justify-between">
                          <span className="font-body-sm text-body-sm font-medium text-on-surface">Cup 2 R Tread</span>
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="font-data-mono-num text-body-md font-bold text-primary">
                            {workshopData.mpiTelemetry.tireTreadMm}
                          </span>
                          <span className="font-label-caps text-[10px] text-primary">Track Notice</span>
                        </div>
                        <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${workshopData.mpiTelemetry.tireTreadPct}%` }}></div>
                        </div>
                      </div>

                      {/* Oil Mobil 1 Supercar */}
                      <div className="bg-surface-container p-2.5 rounded-lg flex flex-col justify-between border border-white/[0.03]">
                        <div className="flex items-center justify-between">
                          <span className="font-body-sm text-body-sm font-medium text-on-surface">Supercar 0W-40</span>
                          <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="font-data-mono-num text-body-md font-bold text-tertiary">
                            {workshopData.mpiTelemetry.oilQualityPct}% Quality
                          </span>
                          <span className="font-label-caps text-[10px] text-on-surface-variant">Degradation Low</span>
                        </div>
                        <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-tertiary h-full rounded-full" style={{ width: `${workshopData.mpiTelemetry.oilQualityPct}%` }}></div>
                        </div>
                      </div>

                      {/* Aero Carbon Splitter */}
                      <div className="bg-surface-container p-2.5 rounded-lg flex flex-col justify-between border border-white/[0.03]">
                        <div className="flex items-center justify-between">
                          <span className="font-body-sm text-body-sm font-medium text-on-surface">Active Aero Wing</span>
                          <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="font-data-mono-num text-body-md font-bold text-tertiary">DRS Calibrated</span>
                          <span className="font-label-caps text-[10px] text-on-surface-variant">0 Delamination</span>
                        </div>
                        <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-tertiary h-full rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Stated Concerns & Approved Scope */}
                  <div className="flex flex-col gap-2">
                    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">assignment</span>
                      {isRtl ? 'نطاق العمل المطلوب من العميل' : 'Customer Requested Scope & Line Items'}
                    </span>

                    <div className="flex flex-col gap-2">
                      {workshopData.customerScope.map((scope) => (
                        <div key={scope.id} className="bg-surface-container p-2.5 rounded-lg flex items-start gap-2.5 border border-white/[0.03]">
                          <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">
                            {scope.status === 'VERIFIED' ? 'verified' : 'check_circle'}
                          </span>
                          <div className="flex flex-col">
                            <div className="font-body-sm text-body-sm font-medium text-on-surface">
                              {scope.title}
                            </div>
                            <div className="font-body-sm text-[12px] text-on-surface-variant">
                              {scope.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WhatsApp Business Digital Authorization Pill */}
                  <div className="bg-emerald-950/40 p-3 rounded-lg flex items-center justify-between border border-tertiary/20">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary">
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-body-sm text-body-sm font-semibold text-tertiary">
                          {isRtl ? 'تم اعتماد التفويض الرقمي' : 'Digital Approval Confirmed'}
                        </span>
                        <span className="font-body-sm text-[11px] text-on-surface-variant">
                          Dispatched via WhatsApp Business API ({workshopData.whatsappAuth.phoneMasked})
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-data-mono-num text-[11px] text-tertiary font-semibold block">
                        Signed: {workshopData.whatsappAuth.signedTimeGst}
                      </span>
                      <span className="font-label-caps text-[9px] text-on-surface-variant uppercase">
                        E-Signature Valid
                      </span>
                    </div>
                  </div>

                  {/* Real-Time Parts & Labor Cost Estimate Breakdown */}
                  <div className="bg-surface-container p-3 rounded-lg flex flex-col gap-2 border border-white/[0.03]">
                    <div className="flex items-center justify-between border-b border-surface-container-highest pb-2">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold">
                        {isRtl ? 'بنود التكلفة المالية' : 'Financial Line Items'}
                      </span>
                      <span className="font-label-caps text-label-caps uppercase text-primary font-semibold">
                        AED (UAE Dirham)
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 font-body-sm text-body-sm">
                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span>{isRtl ? 'أجور الفحص والعمل (3.5 ساعات)' : 'Labor (3.5 Hrs @ AED 450/hr Master Rate)'}</span>
                        <span className="font-data-mono-num text-on-surface">
                          {workshopData.financialSummary.laborTotalAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span>{isRtl ? 'سوائل السباق وباقة التبريد' : 'Porsche Motorsport Fluids & SRF Bleed Kit'}</span>
                        <span className="font-data-mono-num text-on-surface">
                          {workshopData.financialSummary.partsAndFluidsAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span>{isRtl ? 'معايرة الليزر هانتر ثلاثية الأبعاد' : 'Hunter 3D Laser Alignment Calibration Fee'}</span>
                        <span className="font-data-mono-num text-on-surface">
                          {workshopData.financialSummary.calibrationFeeAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-surface-container-highest text-on-surface-variant">
                        <span>{isRtl ? 'المجموع الصافي (قبل الضريبة)' : 'Subtotal (Net)'}</span>
                        <span className="font-data-mono-num text-on-surface">
                          {workshopData.financialSummary.subtotalNetAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-on-surface-variant text-[12px]">
                        <span>{isRtl ? 'ضريبة القيمة المضافة الاتحادية (5%)' : 'UAE Federal VAT (5%)'}</span>
                        <span className="font-data-mono-num text-on-surface">
                          {workshopData.financialSummary.vatAed.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-2 border-t border-surface-container-highest">
                        <div>
                          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                            {isRtl ? 'إجمالي أمر الإصلاح' : 'Total Repair Order'}
                          </span>
                          <span className="block font-label-caps text-[10px] text-on-surface-variant uppercase">
                            Pre-authorized card token on file
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-data-currency-lg text-data-currency-lg font-bold text-primary">
                            AED {workshopData.financialSummary.totalAed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bay Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setOrderPartsModalOpen(true)}
                      className="px-space-sm py-2.5 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface font-body-sm text-body-sm font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm border border-white/[0.04]"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">inventory_2</span>
                      <span>{isRtl ? 'طلب قطع الغيار' : 'Order Parts'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTasjeelModalOpen(true)}
                      className="px-space-sm py-2.5 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface font-body-sm text-body-sm font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm border border-white/[0.04]"
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">description</span>
                      <span>{isRtl ? 'شهادة فحص تسجيل' : 'Tasjeel Pass Sheet'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFeedbackMessage('RO #2025-4094 placed on hold pending customer technical clarification.')}
                      className="px-space-sm py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-highest text-error font-body-sm text-body-sm font-semibold transition-all flex items-center justify-center gap-1.5 border border-white/[0.04]"
                    >
                      <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                      <span>{isRtl ? 'تعليق / استفسار العميل' : 'Hold / Customer Query'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClockOutModalOpen(true)}
                      className="px-space-sm py-2.5 rounded-lg bg-tertiary text-on-tertiary hover:bg-tertiary-fixed font-body-sm text-body-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span className="material-symbols-outlined text-[18px]">timer_off</span>
                      <span>{isRtl ? 'إغلاق وإتمام العمل' : 'Clock Out & Complete'}</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Operational State Demonstrator (Prototype State Switcher) */}
            <div className="mt-space-lg rounded-xl bg-surface-container p-space-md flex flex-col md:flex-row items-center justify-between gap-space-md shadow-inner border border-white/[0.05]">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">developer_mode</span>
                </div>
                <div>
                  <span className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider">
                    {isRtl ? 'نماذج تشغيل ورشة العمل:' : 'Concept State Demonstrator'}
                  </span>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">
                    {isRtl
                      ? 'محددات النماذج التفاعلية لجدولة المنصات وتوزيع الفنيين.'
                      : 'P1 Specification interactive switchers for dealership operations preview.'}
                  </div>
                </div>
              </div>

              {/* State Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setDemonstratorState('DEFAULT')}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-body-sm font-semibold transition-colors shadow-sm ${
                    demonstratorState === 'DEFAULT'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface'
                  }`}
                >
                  Populated Live Bays (Default)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('CONGESTION');
                    setFeedbackMessage('Simulating Bay 02 Hunter alignment overrun (+35m delay alert dispatched).');
                  }}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-body-sm transition-colors ${
                    demonstratorState === 'CONGESTION'
                      ? 'bg-primary text-on-primary font-semibold'
                      : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface'
                  }`}
                >
                  Bay Congestion & Overrun Alert
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('MORNING');
                    setFeedbackMessage('Simulating morning 08:00 shift intake queue.');
                  }}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-body-sm transition-colors ${
                    demonstratorState === 'MORNING'
                      ? 'bg-primary text-on-primary font-semibold'
                      : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface'
                  }`}
                >
                  Empty Morning Shift (08:00)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemonstratorState('TECHS');
                    setFeedbackMessage('Showing technician shift check-in clock matrix.');
                  }}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-body-sm transition-colors ${
                    demonstratorState === 'TECHS'
                      ? 'bg-primary text-on-primary font-semibold'
                      : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface'
                  }`}
                >
                  Technician Clock-In Matrix
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Repair Order Modal */}
      {newRoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-surface-container p-space-lg shadow-2xl border border-white/[0.08] flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[24px]">add_circle</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {isRtl ? 'فتح بطاقة إصلاح جديدة (RO)' : 'Open New Repair Order (RO)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNewRoModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="font-label-caps text-label-caps uppercase text-outline block mb-1">
                  {isRtl ? 'العميل أو الجهة المالكة' : 'Customer / Registered Owner'}
                </label>
                <input
                  type="text"
                  value={newRoCustomer}
                  onChange={(e) => setNewRoCustomer(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-white/[0.06] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-label-caps text-label-caps uppercase text-outline block mb-1">
                  {isRtl ? 'طراز المركبة ورقم الهيكل' : 'Vehicle Model & VIN'}
                </label>
                <input
                  type="text"
                  value={newRoVehicle}
                  onChange={(e) => setNewRoVehicle(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-white/[0.06] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-label-caps text-label-caps uppercase text-outline block mb-1">
                  {isRtl ? 'نطاق الخدمة والفحص المطلوب' : 'Service Scope & Customer Notes'}
                </label>
                <input
                  type="text"
                  value={newRoScope}
                  onChange={(e) => setNewRoScope(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-white/[0.06] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-label-caps text-label-caps uppercase text-outline block mb-1">
                  {isRtl ? 'المنصة المخصصة' : 'Assigned Hoist Bay'}
                </label>
                <select
                  value={newRoBay}
                  onChange={(e) => setNewRoBay(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-white/[0.06] focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Bay 01">Bay 01 (Heavy Mechanical 5T)</option>
                  <option value="Bay 02">Bay 02 (Hunter 3D Alignment)</option>
                  <option value="Bay 03">Bay 03 (Tasjeel RTA Inspection)</option>
                  <option value="Bay 04">Bay 04 (Climate Dyno Cell)</option>
                  <option value="Bay 05">Bay 05 (PPF & Detailing Clean Room)</option>
                  <option value="Bay 06">Bay 06 (Quick Lube Fast Lane)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-space-sm pt-space-xs border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setNewRoModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleCreateRo}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:bg-primary-container"
              >
                {isRtl ? 'فتح البطاقة' : 'Create RO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Parts Modal */}
      {orderPartsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-surface-container p-space-lg shadow-2xl border border-white/[0.08] flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs text-secondary">
                <span className="material-symbols-outlined text-[24px]">inventory_2</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {isRtl ? 'طلب قطع غيار الصيانة السريعة' : 'Procure Supercar Parts & Fluids'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOrderPartsModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              {isRtl
                ? 'حجز القطع من مستودع القوز وإصدار أمر شراء فوري لقطع الغيار المستوردة من ألمانيا.'
                : 'Reserving stock from Al Quoz central warehouse and issuing procurement dispatch ticket for RO #2025-4094.'}
            </p>

            <div className="p-space-sm rounded-lg bg-surface-container-low font-data-mono-num text-body-sm text-outline border border-white/[0.04]">
              SKU: P-SRF-992-KIT • Castrol SRF Bleed Kit (x2) • Total AED 2,420.00
            </div>

            <div className="flex justify-end gap-space-sm pt-space-xs border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setOrderPartsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderPartsModalOpen(false);
                  setFeedbackMessage('Parts reserved and staged at Bay 02 parts cart.');
                }}
                className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-body-sm text-body-sm font-semibold hover:bg-secondary-container"
              >
                {isRtl ? 'تأكيد الحجز' : 'Reserve & Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasjeel Pass Sheet Modal */}
      {tasjeelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-surface-container p-space-lg shadow-2xl border border-white/[0.08] flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs text-primary">
                <span className="material-symbols-outlined text-[24px]">description</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {isRtl ? 'شهادة الفحص الفني المعتمد (تسجيل RTA)' : 'Tasjeel RTA Comprehensive Pass Sheet'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTasjeelModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              {isRtl
                ? 'فحص شامل 150 نقطة صادر عن تسجيل هيئة الطرق والمواصلات بدبي مع اعتماد صلاحية الفحص الفني لنقل الملكية أو تجديد الملكية.'
                : '150-Point RTA comprehensive inspection pass issued through Tasjeel Al Quoz hub. Ready for Mulkiya electronic renewal.'}
            </p>

            <div className="p-space-sm rounded-lg bg-surface-container-low font-data-mono-num text-body-sm text-tertiary border border-white/[0.04]">
              CERT: TAS-DXB-98104 • Status: 100% COMPLIANT • Inspector #404
            </div>

            <div className="flex justify-end gap-space-sm pt-space-xs border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setTasjeelModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTasjeelModalOpen(false);
                  setFeedbackMessage('Tasjeel Passing Certificate attached to digital vehicle dossier.');
                }}
                className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-body-sm text-body-sm font-semibold hover:brightness-110"
              >
                {isRtl ? 'طباعة وتوثيق' : 'Print & Attach'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clock Out & Complete Modal */}
      {clockOutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-surface-container p-space-lg shadow-2xl border border-tertiary/40 flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs text-tertiary">
                <span className="material-symbols-outlined text-[24px]">timer_off</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {isRtl ? 'تأكيد إنهاء أمر الإصلاح' : 'Confirm RO Completion & Clock-Out'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setClockOutModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              {isRtl
                ? 'تأكيد اكتمال كافة بنود العمل لسيارة بورش 911 جي تي 3 آر إس وتفريغ المنصة 02 لاستقبال المركبة التالية في الطابور.'
                : 'Confirming all 3 service scopes completed by Lead Tech Alex Mercer. Bay 02 will be marked ready for next queued unit.'}
            </p>

            <div className="p-space-sm rounded-lg bg-surface-container-low font-data-mono-num text-body-sm text-outline border border-white/[0.04]">
              Total Invoiced: AED 5,087.25 • Labor 3.5h • VAT 5% Cleared
            </div>

            <div className="flex justify-end gap-space-sm pt-space-xs border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setClockOutModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleClockOut}
                className="px-4 py-2 rounded-lg bg-tertiary text-on-tertiary font-body-sm text-body-sm font-bold hover:bg-tertiary-fixed"
              >
                {isRtl ? 'إتمام الإغلاق' : 'Confirm Clock-Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}