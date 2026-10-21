'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';

const ALL_QUEUE_ITEMS = [
  {
    id: 'mod-9921',
    auditCode: '#MOD-9921',
    priority: 'P1-Regulatory',
    title: '2024 Porsche 911 GT3 RS Weissach',
    dealer: 'Apex GT Motors FZCO',
    flag: 'Cooling Code Mismatch (C00 Retrofit)',
    flagSeverity: 'MODERATE',
    status: 'PENDING_AUDIT',
    price: 'AED 1,420,000',
    received: '22 Feb 2025 • 14:18 GST',
    slaRemaining: '01h 42m',
  },
  {
    id: 'mod-9922',
    auditCode: '#MOD-9922',
    priority: 'P2-Market',
    title: '2024 Ferrari 296 GTB Assetto Fiorano',
    dealer: 'Ferrari DXB Official',
    flag: 'High Price Variance (+18.4% above median)',
    flagSeverity: 'LOW',
    status: 'PENDING_AUDIT',
    price: 'AED 1,890,000',
    received: '22 Feb 2025 • 13:05 GST',
    slaRemaining: '02h 55m',
  },
  {
    id: 'mod-9923',
    auditCode: '#MOD-9923',
    priority: 'P1-Regulatory',
    title: '2023 Mercedes-AMG G63 4x4²',
    dealer: 'Royal Motors LLC',
    flag: 'Missing Tasjeel 150-Pt PDF Dossier',
    flagSeverity: 'HIGH',
    status: 'INCOMPLETE_DOCS',
    price: 'AED 1,350,000',
    received: '22 Feb 2025 • 11:40 GST',
    slaRemaining: '03h 10m',
  },
  {
    id: 'mod-9924',
    auditCode: '#MOD-9924',
    priority: 'P3-Standard',
    title: '2022 Rolls-Royce Cullinan Black Badge',
    dealer: 'Exotic Line Motors',
    flag: 'Clean • All 5 Registry Checks Passed',
    flagSeverity: 'CLEAN',
    status: 'READY_TO_PUBLISH',
    price: 'AED 2,150,000',
    received: '22 Feb 2025 • 10:15 GST',
    slaRemaining: '04h 30m',
  },
  {
    id: 'mod-9925',
    auditCode: '#MOD-9925',
    priority: 'P2-Market',
    title: '2024 Lamborghini Revuelto V12 Hybrid',
    dealer: 'VIP Performance Automobiles',
    flag: 'Hybrid High-Voltage Battery Telemetry Ingest',
    flagSeverity: 'LOW',
    status: 'PENDING_AUDIT',
    price: 'AED 2,650,000',
    received: '22 Feb 2025 • 09:20 GST',
    slaRemaining: '05h 15m',
  },
];

export default function ModerationQueueListPage() {
  const [isRtl, setIsRtl] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const filteredItems = ALL_QUEUE_ITEMS.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.dealer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.auditCode.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedFilter === 'ALL') return matchesSearch;
    if (selectedFilter === 'P1') return matchesSearch && item.priority.startsWith('P1');
    if (selectedFilter === 'ACTION_REQUIRED')
      return matchesSearch && item.flagSeverity !== 'CLEAN';
    return matchesSearch;
  });

  return (
    <div className={`min-h-screen bg-background font-body-md text-on-surface ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminSidebar isRtl={isRtl} />
      <div className={isRtl ? 'pr-60' : 'pl-60'}>
        <AdminHeader isRtl={isRtl} onToggleRtl={() => setIsRtl(!isRtl)} />

        <main className="w-full pt-16 bg-background px-gutter py-space-lg">
          <div className="flex flex-col gap-space-lg">
            {/* Header & Metric Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                  {isRtl ? 'طابور مراجعة وتدقيق الإعلانات' : 'Vehicle Listing Moderation Queue'}
                </h1>
                <p className="font-body-sm text-body-sm text-outline mt-0.5">
                  {isRtl
                    ? 'التحقق السيادي متعدد السجلات لإعلانات المركبات قبل النشر في السوق'
                    : 'Syndicated multi-registry verification & discrepancy clearance before marketplace publication'}
                </p>
              </div>

              <div className="flex items-center gap-space-sm">
                <div className="px-3 py-1.5 rounded-lg bg-surface-container flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                  <span className="font-body-sm font-semibold text-error">4 Flares</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-surface-container flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-body-sm font-semibold text-primary">14 Active in Queue</span>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="p-space-md rounded-xl bg-surface-container-low shadow-md flex flex-wrap items-center justify-between gap-space-md border border-surface-container-high/40">
              <div className="flex items-center gap-space-xs">
                <button
                  onClick={() => setSelectedFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-body-sm font-medium transition-colors ${
                    selectedFilter === 'ALL'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  All (14)
                </button>
                <button
                  onClick={() => setSelectedFilter('P1')}
                  className={`px-3 py-1.5 rounded-lg font-body-sm font-medium transition-colors ${
                    selectedFilter === 'P1'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  P1 Regulatory Flares (2)
                </button>
                <button
                  onClick={() => setSelectedFilter('ACTION_REQUIRED')}
                  className={`px-3 py-1.5 rounded-lg font-body-sm font-medium transition-colors ${
                    selectedFilter === 'ACTION_REQUIRED'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  Discrepancy Action (4)
                </button>
              </div>

              <div className="relative min-w-[280px]">
                <span className="material-symbols-outlined text-outline absolute left-3 top-2.5 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter by VIN, dealer, title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-container text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl bg-surface-container-low shadow-xl overflow-hidden border border-surface-container-high/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm">
                  <thead>
                    <tr className="text-outline font-label-caps text-label-caps bg-surface-container-lowest/60 border-b border-surface-container-high/40">
                      <th className="py-3 px-4">AUDIT CASE</th>
                      <th className="py-3 px-4">VEHICLE TITLE</th>
                      <th className="py-3 px-4">DEALERSHIP</th>
                      <th className="py-3 px-4">FLAGGED TELEMETRY / DISCREPANCY</th>
                      <th className="py-3 px-4">VALUATION</th>
                      <th className="py-3 px-4">SLA TIME</th>
                      <th className="py-3 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/30">
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-surface-container/50 transition-colors group cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-data-mono-num font-semibold text-primary">
                          <Link href={`/moderation/listings/${item.id}`} className="hover:underline">
                            {item.auditCode}
                          </Link>
                          <span className="block font-body-sm text-[11px] text-outline">
                            {item.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-on-surface">
                          <Link href={`/moderation/listings/${item.id}`} className="hover:text-primary">
                            {item.title}
                          </Link>
                          <span className="block text-outline text-[11px] font-data-mono-num">
                            {item.received}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant font-medium">
                          {item.dealer}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-caps text-label-caps ${
                              item.flagSeverity === 'HIGH'
                                ? 'bg-error-container/40 text-error'
                                : item.flagSeverity === 'MODERATE'
                                ? 'bg-primary/20 text-primary'
                                : item.flagSeverity === 'CLEAN'
                                ? 'bg-tertiary/15 text-tertiary'
                                : 'bg-surface-container-high text-secondary'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.flagSeverity === 'HIGH'
                                  ? 'bg-error'
                                  : item.flagSeverity === 'MODERATE'
                                  ? 'bg-primary'
                                  : item.flagSeverity === 'CLEAN'
                                  ? 'bg-tertiary'
                                  : 'bg-secondary'
                              }`}
                            />
                            {item.flag}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-data-mono-num font-semibold text-on-surface">
                          {item.price}
                        </td>
                        <td className="py-3.5 px-4 font-data-mono-num text-outline">
                          {item.slaRemaining}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/moderation/listings/${item.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-body-sm font-medium transition-colors"
                          >
                            <span>Inspect</span>
                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
