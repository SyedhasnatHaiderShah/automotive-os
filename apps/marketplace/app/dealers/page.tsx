'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MarketplaceHeader, MarketplaceFooter } from '@automotive-os/ui';

interface ShowroomItem {
  id: string;
  slug: string;
  name: string;
  location: string;
  licenseNumber: string;
  rating: number;
  reviewCount: number;
  activeCars: number;
  status: string;
  emirate: string;
  tagline: string;
}

const ACCREDITED_DEALERS: ShowroomItem[] = [
  {
    id: 'silberarrows',
    slug: 'silberarrows',
    name: 'SilberArrows Luxury & Classic Cars',
    location: 'Street 4B, Al Quoz Industrial 1, Dubai',
    licenseNumber: 'DED #612048',
    rating: 4.98,
    reviewCount: 342,
    activeCars: 28,
    status: 'Active License',
    emirate: 'Dubai',
    tagline: 'Official Mercedes-Benz Classic & Modern Specialist',
  },
  {
    id: 'al-quoz',
    slug: 'al-quoz',
    name: 'Al Quoz Showroom 4',
    location: 'Al Quoz Industrial 3, Dubai',
    licenseNumber: 'DED #894102',
    rating: 4.96,
    reviewCount: 128,
    activeCars: 42,
    status: 'Active License',
    emirate: 'Dubai',
    tagline: 'Tier-1 Institutional Partner | Hypercar Vault',
  },
  {
    id: 'yas-marina',
    slug: 'yas-marina',
    name: 'Yas Marina Luxury Motors',
    location: 'Yas Marina Circuit, Abu Dhabi',
    licenseNumber: 'AD-DED #44109',
    rating: 4.98,
    reviewCount: 94,
    activeCars: 31,
    status: 'Active License',
    emirate: 'Abu Dhabi',
    tagline: 'Trackside Performance & Trackday Allocations',
  },
  {
    id: 'sheikh-zayed',
    slug: 'sheikh-zayed',
    name: 'Sheikh Zayed Rd Gallery',
    location: 'Between 3rd & 4th Interchange, Dubai',
    licenseNumber: 'DED #772910',
    rating: 4.92,
    reviewCount: 210,
    activeCars: 68,
    status: 'Active License',
    emirate: 'Dubai',
    tagline: 'Premier Collector Showroom on SZR Corridor',
  },
  {
    id: 'sharjah-oasis',
    slug: 'sharjah-oasis',
    name: 'Sharjah Auto Oasis Hub',
    location: 'Al Souq Al Haraj, Sector 1, Sharjah',
    licenseNumber: 'SHJ-LIC #30198',
    rating: 4.89,
    reviewCount: 88,
    activeCars: 26,
    status: 'Active License',
    emirate: 'Sharjah',
    tagline: 'Northern Emirates Premier Automotive Exchange',
  },
  {
    id: 'al-futtaim-prestige',
    slug: 'al-futtaim-prestige',
    name: 'Al Futtaim Prestige Motors',
    location: 'Sheikh Zayed Rd, Exit 45, Dubai',
    licenseNumber: 'DED #987654',
    rating: 4.95,
    reviewCount: 176,
    activeCars: 54,
    status: 'Active License',
    emirate: 'Dubai',
    tagline: 'Exotic Vehicles & Sovereign Delivery Suite',
  },
];

export default function DealersDirectoryPage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [selectedEmirate, setSelectedEmirate] = useState('All Emirates');
  const [searchQuery, setSearchQuery] = useState('');

  const isArabic = locale === 'ar';

  const filteredDealers = ACCREDITED_DEALERS.filter((dealer) => {
    if (selectedEmirate !== 'All Emirates' && dealer.emirate !== selectedEmirate) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        dealer.name.toLowerCase().includes(q) ||
        dealer.location.toLowerCase().includes(q) ||
        dealer.licenseNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-background text-on-surface flex flex-col selection:bg-primary selection:text-on-primary"
    >
      <MarketplaceHeader
        activePath="/dealers"
        selectedEmirate={selectedEmirate}
        onEmirateChange={setSelectedEmirate}
        favoritesCount={0}
        locale={locale}
        onLocaleToggle={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      />

      <main className="w-full pt-20 flex-1">
        {/* Header Hero */}
        <section className="relative w-full overflow-hidden pt-12 pb-16 bg-surface-container-lowest border-b border-outline-variant/30">
          <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-xs text-primary uppercase tracking-widest font-semibold">
                {isArabic ? 'حوكمة صالات العرض' : 'Showroom Governance'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="font-label-caps text-xs text-outline uppercase tracking-wider">
                {isArabic ? 'شركاء مؤسسيون فئة أولى' : 'Tier-1 Institutional Partners'}
              </span>
            </div>

            <h1 className="font-display-hero text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-on-surface">
              {isArabic ? 'صالات عرض الإمارات المعتمدة' : 'Verified UAE Dealerships'}
            </h1>

            <p className="font-body-lg text-sm sm:text-base text-outline max-w-2xl leading-relaxed">
              {isArabic
                ? 'دليل صالات العرض والوكالات الحاصلة على فحص السجل التجاري المعتمد وتدقيق الهوية المؤسسية (KYB) مع التراخيص الصادرة من دوائر التنمية الاقتصادية في دولة الإمارات.'
                : 'Directory of institutional dealerships operating under strict commercial KYB verification, physical vehicle grounding standards, and RTA/TAMM compliant digital escrow settlement.'}
            </p>

            {/* Filters Row */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {['All Emirates', 'Dubai', 'Abu Dhabi', 'Sharjah'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setSelectedEmirate(em)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                      selectedEmirate === em
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {em === 'All Emirates' && isArabic ? 'كافة الإمارات' : em}
                  </button>
                ))}
              </div>

              <div className="w-full sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isArabic ? 'ابحث باسم المعرض أو الموقع...' : 'Search showroom or license...'}
                  className="w-full h-10 px-4 rounded-lg bg-surface-container border border-outline-variant/30 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Dealership Grid */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDealers.map((dealer) => (
              <div
                key={dealer.id}
                className="bg-surface-container p-6 rounded-xl border border-outline-variant/30 shadow-md hover:border-primary/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center p-2 text-primary shadow-inner">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-tertiary/15 text-tertiary font-label-caps text-[10px] uppercase font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                      {dealer.status}
                    </span>
                  </div>

                  <h3 className="font-headline-sm text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                    {dealer.name}
                  </h3>
                  <p className="font-body-sm text-xs text-outline mt-1">{dealer.location} • {dealer.licenseNumber}</p>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-2 line-clamp-2">{dealer.tagline}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-primary">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-bold text-on-surface font-data-mono-num">{dealer.rating.toFixed(2)}</span>
                      <span className="text-outline">({dealer.reviewCount})</span>
                    </div>
                    <span className="font-data-mono-num font-semibold text-secondary">
                      {dealer.activeCars} {isArabic ? 'سيارة متاحة' : 'Active Cars'}
                    </span>
                  </div>

                  <Link
                    href={`/dealers/${dealer.slug}`}
                    className="w-full py-2 px-3 rounded bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>{isArabic ? 'زيارة صالة العرض' : 'Visit Showroom Storefront'}</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <MarketplaceFooter locale={locale} />
    </div>
  );
}
