'use client';

import React, { useState, useEffect } from 'react';
import {
  MarketplaceHeader,
  MarketplaceFooter,
  VehicleCard,
  VehicleGridSkeleton,
  EmptyState,
  Button,
  Badge,
} from '@automotive-os/ui';
import { fetchPublicListings, PublicListingItem } from '../../lib/api';

export default function SearchResultsPage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [selectedEmirate, setSelectedEmirate] = useState('All Emirates');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMake, setSelectedMake] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');
  const [gccOnly, setGccOnly] = useState(true);
  const [maxPriceAed, setMaxPriceAed] = useState<number>(2000000);
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc'>('recent');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [vehicles, setVehicles] = useState<PublicListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [urlReady, setUrlReady] = useState(false);
  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const isArabic = locale === 'ar';

  // URL is the source of truth for deep links and browser Back/Forward.
  useEffect(() => {
    const restoreUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setSearchQuery(params.get('q') || '');
      setSelectedEmirate(params.get('emirate') || 'All Emirates');
      setSelectedCondition(params.get('condition') || 'ALL');
      setSelectedMake(params.get('make') || 'ALL');
      setGccOnly(params.get('gcc') !== 'false');
      setMaxPriceAed(Number(params.get('maxPrice')) > 0 ? Number(params.get('maxPrice')) : 2000000);
      const sort = params.get('sort');
      setSortBy(sort === 'price-asc' || sort === 'price-desc' ? sort : 'recent');
      setPage(Math.max(1, Number(params.get('page')) || 1));
      setUrlReady(true);
    };
    restoreUrl();
    window.addEventListener('popstate', restoreUrl);
    return () => window.removeEventListener('popstate', restoreUrl);
  }, []);

  useEffect(() => {
    if (!urlReady) return;
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedEmirate !== 'All Emirates') params.set('emirate', selectedEmirate);
    if (selectedCondition !== 'ALL') params.set('condition', selectedCondition);
    if (selectedMake !== 'ALL') params.set('make', selectedMake);
    if (!gccOnly) params.set('gcc', 'false');
    if (maxPriceAed !== 2000000) params.set('maxPrice', String(maxPriceAed));
    if (sortBy !== 'recent') params.set('sort', sortBy);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    const nextUrl = window.location.pathname + (query ? '?' + query : '');
    window.history.replaceState(null, '', nextUrl);
  }, [urlReady, searchQuery, selectedEmirate, selectedCondition, selectedMake, gccOnly, maxPriceAed, sortBy, page]);

  useEffect(() => {
    if (!urlReady) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    fetchPublicListings({
      q: searchQuery.trim() || undefined,
      emirate: selectedEmirate !== 'All Emirates' ? selectedEmirate : undefined,
      make: selectedMake !== 'ALL' ? selectedMake : undefined,
      condition: selectedCondition !== 'ALL' ? selectedCondition : undefined,
      gccSpec: gccOnly ? true : undefined,
      maxPriceFils: maxPriceAed * 100,
      sort: sortBy,
      page,
      limit: PAGE_SIZE,
    }).then((result) => {
      if (!active) return;
      setVehicles(result.items);
      setTotal(result.total);
    }).catch((err) => {
      if (!active) return;
      setVehicles([]);
      setTotal(0);
      setLoadError(err instanceof Error ? err.message : 'Unable to load vehicle inventory');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [urlReady, selectedEmirate, selectedMake, selectedCondition, gccOnly, maxPriceAed, sortBy, searchQuery, page]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileFiltersOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileFiltersOpen]);

  // Favorites remain session-only until buyer authentication is available.
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const handleResetFilters = () => {
    setSelectedEmirate('All Emirates');
    setSearchQuery('');
    setSelectedMake('ALL');
    setSelectedCondition('ALL');
    setGccOnly(true);
    setMaxPriceAed(2000000);
    setSortBy('recent');
    setPage(1);
  };

  const goToPage = (next: number) => {
    const validPage = Math.max(1, Math.min(totalPages, next));
    const params = new URLSearchParams(window.location.search);
    if (validPage === 1) params.delete('page');
    else params.set('page', String(validPage));
    const suffix = params.toString();
    window.history.pushState(null, '', window.location.pathname + (suffix ? '?' + suffix : ''));
    setPage(validPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredVehicles = vehicles;

  const makesList = ['ALL', 'Porsche', 'Toyota', 'Mercedes-AMG', 'Land Rover', 'Ferrari'];
  const emiratesList = ['All Emirates', 'Dubai', 'Abu Dhabi', 'Sharjah'];

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-background text-on-surface flex flex-col selection:bg-primary-container selection:text-on-primary-container"
    >
      <MarketplaceHeader
        activePath="/cars"
        selectedEmirate={selectedEmirate}
        onEmirateChange={(v) => { setSelectedEmirate(v); setPage(1); }}
        favoritesCount={favorites.length}
        locale={locale}
        onLocaleToggle={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      />

      <main className="w-full pt-24 pb-16 flex-1">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          {/* Header & Sub-Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-outline-variant/30 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-label-caps text-outline uppercase mb-1">
                <span>{isArabic ? 'سوق السيارات' : 'Marketplace'}</span>
                <span>/</span>
                <span className="text-secondary">
                  {isArabic ? 'نتائج البحث' : 'Certified Dealer Inventory'}
                </span>
              </div>
              <h1 className="font-headline-lg text-2xl lg:text-3xl font-bold text-on-surface">
                {isArabic ? (
                  `نتائج البحث: ${filteredVehicles.length} سيارة معتمدة`
                ) : (
                  <>
                    Search Results: <span className="font-data-mono-num font-semibold text-primary">{filteredVehicles.length}</span> Verified Vehicles
                  </>
                )}
              </h1>
              <div className="flex items-center gap-1.5 font-data-mono-num text-xs text-outline mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                <span>{isArabic ? 'تزامن فوري مع سجلات RTA و TAMM' : 'RTA & TAMM Registry Sync: Real-Time'}</span>
              </div>
            </div>

            {/* Sorting & Mobile Filter Toggle */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface hover:border-primary/50"
              >
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>{isArabic ? 'تصفية وتحديد' : 'Filters & Refine'}</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-outline font-label-caps uppercase hidden sm:inline-block">
                  {isArabic ? 'الترتيب:' : 'Sort:'}
                </span>
                <select
                  value={sortBy}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setSortBy(e.target.value as 'recent' | 'price-asc' | 'price-desc'); setPage(1); }}
                  className="h-10 px-3 rounded-lg bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="recent">
                    {isArabic ? 'أحدث المعروض (مباشر الإمارات)' : 'Recently Listed (Live UAE)'}
                  </option>
                  <option value="price-desc">
                    {isArabic ? 'السعر: من الأعلى للأقل (مؤسسي)' : 'Price: High to Low (Institutional)'}
                  </option>
                  <option value="price-asc">
                    {isArabic ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Main 2-Column Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block lg:col-span-3 bg-surface-container p-6 rounded-xl border border-outline-variant/30 sticky top-28">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-6">
                <h3 className="font-headline-sm text-sm font-semibold uppercase text-on-surface">
                  {isArabic ? 'خيارات التصفية' : 'Filter Criteria'}
                </h3>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {isArabic ? 'إعادة ضبط' : 'Reset All'}
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {/* Search Keyword */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-label-caps uppercase text-outline">
                    {isArabic ? 'البحث بالنص' : 'Keywords'}
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    placeholder={isArabic ? 'مثال: GT3, VXR...' : 'e.g. GT3, GR-Sport...'}
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Make Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-label-caps uppercase text-outline">
                    {isArabic ? 'الماركة المصنعة' : 'Make'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {makesList.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setSelectedMake(m); setPage(1); }}
                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                          selectedMake === m
                            ? 'bg-primary text-on-primary font-bold'
                            : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        {m === 'ALL' ? (isArabic ? 'الكل' : 'All') : m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emirate Filter */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-label-caps uppercase text-outline">
                    {isArabic ? 'الإمارة' : 'UAE Emirate'}
                  </label>
                  <select
                    value={selectedEmirate}
                    onChange={(e) => { setSelectedEmirate(e.target.value); setPage(1); }}
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {emiratesList.map((em) => (
                      <option key={em} value={em}>
                        {em === 'All Emirates' && isArabic ? 'كافة الإمارات' : em}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Condition Filter */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-label-caps uppercase text-outline">
                    {isArabic ? 'حالة المركبة' : 'Condition'}
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { key: 'ALL', label: isArabic ? 'الكل' : 'All' },
                      { key: 'NEW', label: isArabic ? 'جديدة' : 'New' },
                      { key: 'USED', label: isArabic ? 'مستعملة' : 'Used' },
                    ].map((cond) => (
                      <button
                        key={cond.key}
                        type="button"
                        onClick={() => { setSelectedCondition(cond.key); setPage(1); }}
                        className={`flex-1 py-1 rounded text-xs text-center transition-colors ${
                          selectedCondition === cond.key
                            ? 'bg-primary text-on-primary font-bold'
                            : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        {cond.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* GCC Spec Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-on-surface">
                      {isArabic ? 'مواصفات خليجية فقط' : 'GCC Spec Only'}
                    </span>
                    <span className="text-[10px] text-outline">
                      {isArabic ? 'استبعاد الوارد غير المطابق' : 'Verified UAE specification'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={gccOnly}
                    onChange={(e) => { setGccOnly(e.target.checked); setPage(1); }}
                    className="w-4 h-4 rounded text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer"
                  />
                </div>

                {/* Max Price Slider */}
                <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-label-caps uppercase text-outline">
                      {isArabic ? 'أقصى سعر (درهم)' : 'Max Price (AED)'}
                    </label>
                    <span className="font-data-mono-num text-xs font-semibold text-primary">
                      AED {maxPriceAed.toLocaleString('en-US')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={100000}
                    max={3000000}
                    step={50000}
                    value={maxPriceAed}
                    onChange={(e) => { setMaxPriceAed(Number(e.target.value)); setPage(1); }}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
              </div>
            </aside>

            {/* Results Grid Column */}
            <div className="lg:col-span-9 flex flex-col gap-6">
              {/* Active Filter Chips */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedEmirate !== 'All Emirates' && (
                  <Badge variant="outline" className="gap-1 cursor-pointer" onClick={() => { setSelectedEmirate('All Emirates'); setPage(1); }}>
                    <span>{selectedEmirate}</span>
                    <span className="text-outline">×</span>
                  </Badge>
                )}
                {selectedMake !== 'ALL' && (
                  <Badge variant="gold" className="gap-1 cursor-pointer" onClick={() => { setSelectedMake('ALL'); setPage(1); }}>
                    <span>{selectedMake}</span>
                    <span className="text-on-primary">×</span>
                  </Badge>
                )}
                {selectedCondition !== 'ALL' && (
                  <Badge variant="condition" className="gap-1 cursor-pointer" onClick={() => { setSelectedCondition('ALL'); setPage(1); }}>
                    <span>{selectedCondition}</span>
                    <span className="text-outline">×</span>
                  </Badge>
                )}
                {gccOnly && (
                  <Badge variant="gcc">
                    <span>GCC SPEC</span>
                  </Badge>
                )}
              </div>

              {/* Grid or Empty State */}
              {loadError && !loading ? (
                <section role="alert" className="rounded-lg border border-error/40 bg-error-container/10 p-6">
                  <h2 className="font-headline-sm text-lg text-on-surface">Couldn't load vehicle results</h2>
                  <p className="mt-2 text-sm text-on-surface-variant">{loadError}</p>
                  <button type="button" onClick={() => { setUrlReady(false); window.location.reload(); }} className="mt-4 min-h-11 rounded-lg bg-primary px-5 font-semibold text-on-primary">Retry loading</button>
                </section>
              ) : loading ? (
                <VehicleGridSkeleton count={6} />
              ) : filteredVehicles.length === 0 ? (
                <EmptyState
                  title={isArabic ? 'لا توجد سيارات مطابقة' : 'No matching vehicles found'}
                  description={
                    isArabic
                      ? 'جرب توسيع نطاق السعر أو إزالة تحديد الماركة لرؤية المزيد من خيارات الوكلاء.'
                      : 'Try broadening your budget range or clearing make filters to view certified inventory.'
                  }
                  onAction={handleResetFilters}
                  locale={locale}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredVehicles.map((v) => (
                    <VehicleCard
                      key={v.id}
                      id={v.id}
                      slug={v.slug}
                      title={v.title}
                      priceFils={v.price.amountFils}
                      year={v.year}
                      mileageKm={v.mileageKm}
                      condition={v.condition}
                      gccSpec={v.gccSpec}
                      emirate={v.emirate}
                      seller={v.seller}
                      mediaUrl={v.media[0]?.url}
                      isFavorite={favorites.includes(v.id)}
                      onFavoriteToggle={toggleFavorite}
                      locale={locale}
                    />
                  ))}
                </div>
              )}
              {!loading && !loadError && total > 0 && (
                <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-outline-variant/30 bg-surface-container p-3 text-sm">
                  <span className="text-on-surface-variant">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)} className="min-h-11 rounded-lg border border-outline-variant/50 px-4 text-on-surface disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                    <span className="font-data-mono-num text-on-surface">Page {page} / {totalPages}</span>
                    <button type="button" disabled={page >= totalPages} onClick={() => goToPage(page + 1)} className="min-h-11 rounded-lg border border-outline-variant/50 px-4 text-on-surface disabled:cursor-not-allowed disabled:opacity-40">Next</button>
                  </div>
                </nav>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filter Overlay Drawer (Screen 28fac34d59ea40ed8e273e74e7dbe2a0) */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm h-full bg-surface-container p-6 overflow-y-auto flex flex-col justify-between shadow-2xl ml-auto border-l border-outline-variant/40">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    {isArabic ? 'تصفية السيارات' : 'Filters & Sort'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-1 rounded-full text-outline hover:text-on-surface"
                    aria-label="Close filters"
                  >
                    ✕
                  </button>
                </div>

                {/* Make */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-label-caps uppercase text-outline">
                    {isArabic ? 'الماركة' : 'Make'}
                  </label>
                  <select
                    value={selectedMake}
                    onChange={(e) => { setSelectedMake(e.target.value); setPage(1); }}
                    className="w-full h-10 px-3 rounded bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface"
                  >
                    {makesList.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Emirate */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-label-caps uppercase text-outline">
                    {isArabic ? 'الإمارة' : 'Emirate'}
                  </label>
                  <select
                    value={selectedEmirate}
                    onChange={(e) => { setSelectedEmirate(e.target.value); setPage(1); }}
                    className="w-full h-10 px-3 rounded bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface"
                  >
                    {emiratesList.map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Max Price */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-outline uppercase font-label-caps">Max Price</span>
                    <span className="text-primary font-bold">AED {maxPriceAed.toLocaleString('en-US')}</span>
                  </div>
                  <input
                    type="range"
                    min={100000}
                    max={3000000}
                    step={50000}
                    value={maxPriceAed}
                    onChange={(e) => { setMaxPriceAed(Number(e.target.value)); setPage(1); }}
                    className="w-full accent-primary"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-outline-variant/30 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleResetFilters}>
                  {isArabic ? 'إعادة ضبط' : 'Reset'}
                </Button>
                <Button variant="primary" className="flex-1" onClick={() => setMobileFiltersOpen(false)}>
                  {isArabic ? 'عرض النتائج' : 'Apply'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <MarketplaceFooter locale={locale} />
    </div>
  );
}
