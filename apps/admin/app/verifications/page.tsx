'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';

const ALL_KYB_APPLICATIONS = [
  {
    id: 'kyb-2025-0842',
    caseNumber: '#KYB-2025-0842',
    displayName: 'Royal Apex Motors FZCO',
    legalName: 'Royal Apex Luxury Motor Vehicles Trading FZCO',
    license: 'DET #984120',
    jurisdiction: 'Dubai South FZ-LLC',
    riskScore: 12,
    status: 'AWAITING_OPERATOR_SIGN',
    statusLabel: 'Awaiting Operator Sign',
    slaRemaining: '02h 14m',
    paidUpCapital: 'AED 25,000,000',
    uboStatus: '100% Accounted (Clear)',
  },
  {
    id: 'kyb-2025-0843',
    caseNumber: '#KYB-2025-0843',
    displayName: 'Emirates Prestige Auto LLC',
    legalName: 'Emirates Prestige Auto Trading LLC',
    license: 'DED #771209',
    jurisdiction: 'Mainland Dubai',
    riskScore: 18,
    status: 'IN_REVIEW',
    statusLabel: 'Under Review',
    slaRemaining: '04h 30m',
    paidUpCapital: 'AED 15,000,000',
    uboStatus: 'Clear • Tier 1',
  },
  {
    id: 'kyb-2025-0844',
    caseNumber: '#KYB-2025-0844',
    displayName: 'Gulf Hypercar Concierge',
    legalName: 'Gulf Hypercar Concierge FZCO',
    license: 'DET #881204',
    jurisdiction: 'DIFC Gateway Zone',
    riskScore: 68,
    status: 'PEP_FLAGGED',
    statusLabel: 'PEP Alert Raised',
    slaRemaining: '05h 02m',
    paidUpCapital: 'AED 50,000,000',
    uboStatus: 'Watchlist Review Required',
  },
  {
    id: 'kyb-2025-0845',
    caseNumber: '#KYB-2025-0845',
    displayName: 'Al Marmoom Classics Co',
    legalName: 'Al Marmoom Historic & Classic Cars LLC',
    license: 'DED #661092',
    jurisdiction: 'Mainland Dubai',
    riskScore: 15,
    status: 'DOCS_INGESTION',
    statusLabel: 'Docs Ingestion',
    slaRemaining: '08h 15m',
    paidUpCapital: 'AED 10,000,000',
    uboStatus: 'Pending UAE Pass Sync',
  },
  {
    id: 'kyb-2025-0846',
    caseNumber: '#KYB-2025-0846',
    displayName: 'Oasis Boulevard Exotic LLC',
    legalName: 'Oasis Boulevard Exotic Motor Trading LLC',
    license: 'DED #901452',
    jurisdiction: 'Mainland Dubai',
    riskScore: 24,
    status: 'SITE_VISIT_OK',
    statusLabel: 'Site Visit Passed',
    slaRemaining: '11h 40m',
    paidUpCapital: 'AED 20,000,000',
    uboStatus: 'Civil Defense Passed',
  },
];

export default function KybVerificationListPage() {
  const [isRtl, setIsRtl] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const filteredItems = ALL_KYB_APPLICATIONS.filter((item) => {
    const matchesSearch =
      item.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.license.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.caseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedFilter === 'ALL') return matchesSearch;
    if (selectedFilter === 'ACTION_REQUIRED')
      return matchesSearch && (item.riskScore > 50 || item.status === 'AWAITING_OPERATOR_SIGN');
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
                  {isRtl ? 'اعتماد الوكلاء المؤسسي (KYB)' : 'Dealer KYB Accreditation & Verification Registry'}
                </h1>
                <p className="font-body-sm text-body-sm text-outline mt-0.5">
                  {isRtl
                    ? 'فحص المستفيد الحقيقي (UBO) ومكافحة غسل الأموال وتفتيش صالات العرض للوكلاء المعتمدين'
                    : 'Institutional beneficial ownership, AML screening, and showroom facilities certification under UAE Cabinet Resolution (58)/2020'}
                </p>
              </div>

              <div className="flex items-center gap-space-sm">
                <div className="px-3 py-1.5 rounded-lg bg-surface-container flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-tertiary" />
                  <span className="font-body-sm font-semibold text-tertiary">DED Live Sync OK</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-surface-container flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-body-sm font-semibold text-primary">5 Pending Dossiers</span>
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
                  All Active (5)
                </button>
                <button
                  onClick={() => setSelectedFilter('ACTION_REQUIRED')}
                  className={`px-3 py-1.5 rounded-lg font-body-sm font-medium transition-colors ${
                    selectedFilter === 'ACTION_REQUIRED'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  Immediate Sign-off Required (2)
                </button>
              </div>

              <div className="relative min-w-[280px]">
                <span className="material-symbols-outlined text-outline absolute left-3 top-2.5 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter by Dealership, License, Case #..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-container text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Applications Table */}
            <div className="rounded-xl bg-surface-container-low shadow-xl overflow-hidden border border-surface-container-high/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm">
                  <thead>
                    <tr className="text-outline font-label-caps text-label-caps bg-surface-container-lowest/60 border-b border-surface-container-high/40">
                      <th className="py-3 px-4">CASE / LICENSE</th>
                      <th className="py-3 px-4">DEALER LEGAL ENTITY</th>
                      <th className="py-3 px-4">JURISDICTION</th>
                      <th className="py-3 px-4">COMPOSITE RISK</th>
                      <th className="py-3 px-4">CAPITAL BUFFER</th>
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
                        <td className="py-3.5 px-4 font-data-mono-num font-semibold text-secondary">
                          <Link href={`/verifications/${item.id}`} className="hover:underline">
                            {item.caseNumber}
                          </Link>
                          <span className="block font-body-sm text-[11px] text-outline">
                            {item.license}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-on-surface">
                          <Link href={`/verifications/${item.id}`} className="hover:text-primary">
                            {item.displayName}
                          </Link>
                          <span className="block text-outline text-[11px] truncate max-w-sm">
                            {item.legalName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant font-medium">
                          {item.jurisdiction}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-data-mono-num font-bold text-body-md ${
                                item.riskScore < 30
                                  ? 'text-tertiary'
                                  : item.riskScore < 60
                                  ? 'text-primary'
                                  : 'text-error'
                              }`}
                            >
                              {item.riskScore}/100
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-label-caps text-[10px] ${
                                item.riskScore < 30
                                  ? 'bg-tertiary/10 text-tertiary'
                                  : item.riskScore < 60
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-error/10 text-error'
                              }`}
                            >
                              {item.statusLabel}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-data-mono-num font-semibold text-on-surface">
                          {item.paidUpCapital}
                        </td>
                        <td className="py-3.5 px-4 font-data-mono-num text-outline">
                          {item.slaRemaining}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/verifications/${item.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-body-sm font-medium transition-colors"
                          >
                            <span>Inspect Dossier</span>
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
