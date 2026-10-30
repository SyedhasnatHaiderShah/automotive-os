'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarketplaceHeader, MarketplaceFooter } from '@automotive-os/ui';
import { fetchPublicDealers, PublicDealerSummary } from '../../lib/api';

export default function DealersDirectoryPage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [selectedEmirate, setSelectedEmirate] = useState('All Emirates');
  const [searchQuery, setSearchQuery] = useState('');

  const [dealers, setDealers] = useState<PublicDealerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const isArabic = locale === 'ar';

  const changeEmirate = (em: string) => {
    setSelectedEmirate(em);
    setPage(1);
  };

  // Emirate and paging are applied server-side; the API has no name search,
  // so the text box only filters the dealerships on the current page.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    fetchPublicDealers({ emirate: selectedEmirate, page, limit: PAGE_SIZE })
      .then((res) => {
        if (!active) return;
        setDealers(res.items);
        setTotal(typeof res.total === 'number' ? res.total : res.items.length);
      })
      .catch((err) => {
        if (!active) return;
        setDealers([]);
        setTotal(0);
        setLoadError(err instanceof Error ? err.message : 'Unable to load dealerships');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedEmirate, page]);

  const locationLabel = (dealer: PublicDealerSummary) =>
    [...dealer.cities, ...dealer.emirates.filter((e) => !dealer.cities.includes(e))].join(', ') || 'UAE';

  const filteredDealers = dealers.filter((dealer) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return dealer.displayName.toLowerCase().includes(q) || locationLabel(dealer).toLowerCase().includes(q);
  });

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-background text-on-surface flex flex-col selection:bg-primary selection:text-on-primary"
    >
      <MarketplaceHeader
        activePath="/dealers"
        selectedEmirate={selectedEmirate}
        onEmirateChange={changeEmirate}
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
                {isArabic ? 'تحقق KYB يدوي' : 'Manual KYB Review'}
              </span>
            </div>

            <h1 className="font-display-hero text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-on-surface">
              {isArabic ? 'صالات عرض الإمارات المعتمدة' : 'Verified UAE Dealerships'}
            </h1>

            <p className="font-body-lg text-sm sm:text-base text-outline max-w-2xl leading-relaxed">
              {isArabic
                ? 'دليل صالات العرض التي اجتازت مراجعة التحقق من النشاط التجاري (KYB) على المنصة.'
                : 'Directory of dealerships that passed the platform’s business verification (KYB) review.'}
            </p>

            {/* Filters Row */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {['All Emirates', 'Dubai', 'Abu Dhabi', 'Sharjah'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => changeEmirate(em)}
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
                <label htmlFor="dealer-filter" className="sr-only">
                  {isArabic ? 'تصفية هذه الصفحة' : 'Filter this page'}
                </label>
                <input
                  id="dealer-filter"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isArabic ? 'تصفية هذه الصفحة بالاسم أو الموقع...' : 'Filter this page by name or location...'}
                  className="w-full h-10 px-4 rounded-lg bg-surface-container border border-outline-variant/30 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Dealership Grid */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-12">
          {loadError ? (
            <p role="alert" className="text-sm text-error">
              {isArabic ? 'تعذر تحميل دليل صالات العرض.' : 'The dealership directory could not be loaded.'} {loadError}
            </p>
          ) : !loading && filteredDealers.length === 0 ? (
            <p className="text-sm text-outline">
              {isArabic ? 'لا توجد صالات عرض معتمدة مطابقة.' : 'No verified dealerships match these filters.'}
            </p>
          ) : loading ? (
            <p role="status" className="mb-6 text-sm text-outline">
              {isArabic ? 'جارٍ تحميل صالات العرض المعتمدة…' : 'Loading verified dealerships…'}
            </p>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy={loading}>
            {/* Skeleton cards while the first page (or a new filter) loads (MK-20) */}
            {loading && !loadError && Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`dealer-skeleton-${i}`}
                aria-hidden="true"
                className="bg-surface-container p-6 rounded-xl border border-outline-variant/30 animate-pulse flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high" />
                  <div className="h-5 w-20 rounded-full bg-surface-container-high" />
                </div>
                <div className="h-5 w-2/3 rounded bg-surface-container-highest" />
                <div className="h-3 w-1/3 rounded bg-surface-container-high" />
                <div className="mt-4 h-8 w-full rounded bg-surface-container-high" />
              </div>
            ))}
            {!loading && filteredDealers.map((dealer) => (
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
                      {isArabic ? 'موثق KYB' : 'KYB Verified'}
                    </span>
                  </div>

                  <h3 className="font-headline-sm text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                    {dealer.displayName}
                  </h3>
                  <p className="font-body-sm text-xs text-outline mt-1">{locationLabel(dealer)}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-col gap-3">
                  <div className="flex items-center justify-end text-xs">
                    <span className="font-data-mono-num font-semibold text-secondary">
                      {dealer.liveGroundedStock} {isArabic ? 'سيارة منشورة' : 'Published listings'}
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

          {!loadError && total > PAGE_SIZE && (
            <nav aria-label={isArabic ? 'ترقيم الصفحات' : 'Pagination'} className="mt-10 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-semibold border border-outline-variant/30 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {isArabic ? 'السابق' : 'Previous'}
              </button>
              <span className="text-xs font-data-mono-num text-outline">
                {isArabic ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`} · {total}{' '}
                {isArabic ? 'معرض' : 'dealerships'}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-semibold border border-outline-variant/30 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {isArabic ? 'التالي' : 'Next'}
              </button>
            </nav>
          )}
        </section>
      </main>

      <MarketplaceFooter locale={locale} />
    </div>
  );
}
