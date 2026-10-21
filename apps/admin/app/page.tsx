'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminHeader } from '../components/AdminHeader';

export default function AdminOverviewPage() {
  const [isRtl, setIsRtl] = useState(false);

  return (
    <div className={`min-h-screen bg-background font-body-md text-on-surface ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminSidebar isRtl={isRtl} />
      <div className={isRtl ? 'pr-60' : 'pl-60'}>
        <AdminHeader isRtl={isRtl} onToggleRtl={() => setIsRtl(!isRtl)} />

        <main className="w-full pt-16 bg-background px-gutter py-space-lg">
          <div className="flex flex-col gap-space-lg">
            {/* Top Operations Command Banner */}
            <div className="p-space-lg rounded-xl bg-surface-container-low shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-space-lg relative overflow-hidden border border-surface-container-high/40">
              <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none blur-3xl" />

              <div className="flex flex-col gap-space-xs z-10 max-w-2xl">
                <div className="flex flex-wrap items-center gap-space-sm">
                  <span className="px-2.5 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary font-body-sm font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                    All Sovereign Gateways Operational
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-secondary font-data-mono-num text-body-sm">
                    DED Live • RTA Shamil 9ms
                  </span>
                </div>

                <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight mt-1">
                  {isRtl ? 'مركز قيادة العمليات والرقابة السيادية' : 'Operations Command & Sovereign Trust Hub'}
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Platform oversight terminal for UAE verified-dealer marketplace integrity, VIN discrepancy triage, and institutional dealer accreditation.
                </p>
              </div>

              {/* Direct Quick Actions */}
              <div className="flex flex-wrap items-center gap-space-sm z-10">
                <Link
                  href="/moderation/listings/mod-9921"
                  className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm font-medium transition-all flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">policy</span>
                  <span>Inspect Flares (#MOD-9921)</span>
                </Link>
                <Link
                  href="/verifications/kyb-2025-0842"
                  className="h-10 px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-fixed-dim font-body-sm font-semibold transition-all flex items-center gap-2 shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>Sign KYB (#KYB-0842)</span>
                </Link>
              </div>
            </div>

            {/* Quick Metrics Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              <Link
                href="/moderation"
                className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col justify-between gap-space-xs border border-surface-container-high/40 group shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                    Listing Moderation
                  </span>
                  <span className="material-symbols-outlined text-primary text-[20px] group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline-xl text-headline-xl text-primary font-bold">14</span>
                  <span className="font-body-sm text-outline">vehicles pending</span>
                </div>
                <span className="font-body-sm text-error font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" /> 4 Discrepancy Flares
                </span>
              </Link>

              <Link
                href="/verifications"
                className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col justify-between gap-space-xs border border-surface-container-high/40 group shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                    KYB Verifications
                  </span>
                  <span className="material-symbols-outlined text-secondary text-[20px] group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline-xl text-headline-xl text-secondary font-bold">6</span>
                  <span className="font-body-sm text-outline">dealers pending</span>
                </div>
                <span className="font-body-sm text-tertiary font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> 1 Ready for Dual-Sign
                </span>
              </Link>

              <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-xs border border-surface-container-high/40 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                    DIFC HSM Node
                  </span>
                  <span className="material-symbols-outlined text-tertiary text-[20px]">
                    lock_open
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline-xl text-headline-xl text-tertiary font-bold">99.98%</span>
                  <span className="font-body-sm text-outline">uptime</span>
                </div>
                <span className="font-body-sm text-outline font-data-mono-num">
                  Auto-lock in 12m • 0 Anomalies
                </span>
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-xs border border-surface-container-high/40 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider font-semibold">
                    Regulatory Compliance
                  </span>
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    shield
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline-xl text-headline-xl text-on-surface font-bold">100%</span>
                  <span className="font-body-sm text-outline">Res. 58/2020</span>
                </div>
                <span className="font-body-sm text-tertiary font-medium">
                  Central Bank goAML Linked
                </span>
              </div>
            </div>

            {/* Quick Priority Review Deck */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
              {/* Box 1: Urgent Vehicle Moderation Cases */}
              <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md flex flex-col gap-space-md border border-surface-container-high/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-primary text-[22px]">policy</span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Urgent Listing Moderation Cases
                    </h2>
                  </div>
                  <Link href="/moderation" className="text-body-sm text-primary hover:underline">
                    View All 14 →
                  </Link>
                </div>

                <div className="flex flex-col gap-space-xs">
                  <Link
                    href="/moderation/listings/mod-9921"
                    className="p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between cursor-pointer border-l-2 border-primary"
                  >
                    <div>
                      <span className="font-body-sm font-semibold text-on-surface block">
                        2024 Porsche 911 GT3 RS Weissach
                      </span>
                      <span className="text-[11px] text-primary flex items-center gap-1 font-data-mono-num">
                        #MOD-9921 • Cooling Code Mismatch (C00 Retrofit)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-error-container/30 text-error font-data-mono-num text-[11px] font-semibold">
                      P1-Regulatory
                    </span>
                  </Link>

                  <Link
                    href="/moderation/listings/mod-9922"
                    className="p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between cursor-pointer border-l-2 border-secondary"
                  >
                    <div>
                      <span className="font-body-sm font-semibold text-on-surface block">
                        2024 Ferrari 296 GTB Assetto Fiorano
                      </span>
                      <span className="text-[11px] text-outline flex items-center gap-1 font-data-mono-num">
                        #MOD-9922 • High Price Variance (±18.4%)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-data-mono-num text-[11px] font-semibold">
                      P2-Market
                    </span>
                  </Link>

                  <Link
                    href="/moderation/listings/mod-9923"
                    className="p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between cursor-pointer border-l-2 border-error"
                  >
                    <div>
                      <span className="font-body-sm font-semibold text-on-surface block">
                        2023 Mercedes-AMG G63 4x4²
                      </span>
                      <span className="text-[11px] text-error flex items-center gap-1 font-data-mono-num">
                        #MOD-9923 • Missing Tasjeel 150-Point PDF
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-error/15 text-error font-data-mono-num text-[11px] font-semibold">
                      Action Required
                    </span>
                  </Link>
                </div>
              </div>

              {/* Box 2: Institutional KYB Dealership Applications */}
              <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md flex flex-col gap-space-md border border-surface-container-high/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-secondary text-[22px]">
                      verified_user
                    </span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Dealer KYB Accreditation Queue
                    </h2>
                  </div>
                  <Link href="/verifications" className="text-body-sm text-primary hover:underline">
                    View All 6 →
                  </Link>
                </div>

                <div className="flex flex-col gap-space-xs">
                  <Link
                    href="/verifications/kyb-2025-0842"
                    className="p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between cursor-pointer border-l-2 border-primary"
                  >
                    <div>
                      <span className="font-body-sm font-semibold text-on-surface block">
                        Royal Apex Luxury Motor Vehicles FZCO
                      </span>
                      <span className="text-[11px] text-tertiary flex items-center gap-1 font-data-mono-num">
                        DET #984120 • 100% UBO Pass • Score: 12/100
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-data-mono-num text-[11px] font-semibold">
                      Awaiting Sign
                    </span>
                  </Link>

                  <Link
                    href="/verifications/kyb-2025-0843"
                    className="p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between cursor-pointer border-l-2 border-tertiary"
                  >
                    <div>
                      <span className="font-body-sm font-semibold text-on-surface block">
                        Emirates Prestige Auto Trading LLC
                      </span>
                      <span className="text-[11px] text-outline flex items-center gap-1 font-data-mono-num">
                        DED #771209 • Capital AED 15M • Score: 18/100
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-data-mono-num text-[11px] font-semibold">
                      Under Review
                    </span>
                  </Link>

                  <Link
                    href="/verifications/kyb-2025-0844"
                    className="p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between cursor-pointer border-l-2 border-error"
                  >
                    <div>
                      <span className="font-body-sm font-semibold text-on-surface block">
                        Gulf Hypercar Concierge FZCO
                      </span>
                      <span className="text-[11px] text-error flex items-center gap-1 font-data-mono-num">
                        DET #881204 • Watchlist Match • Score: 68/100
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-error/15 text-error font-data-mono-num text-[11px] font-semibold">
                      PEP Flagged
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
