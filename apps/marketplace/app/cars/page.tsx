'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

  const isArabic = locale === 'ar';

  useEffect(() => {
    // Read initial URL params if present
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      const em = params.get('emirate');
      const cond = params.get('condition');
      const make = params.get('make');
      if (q) setSearchQuery(q);
      if (em) setSelectedEmirate(em);
      if (cond) setSelectedCondition(cond);
      if (make) setSelectedMake(make);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetchPublicListings({
        emirate: selectedEmirate !== 'All Emirates' ? selectedEmirate : undefined,
        make: selectedMake !== 'ALL' ? selectedMake : undefined,
        condition: selectedCondition !== 'ALL' ? selectedCondition : undefined,
        gccSpec: gccOnly ? true : undefined,
        maxPriceFils: maxPriceAed * 100,
      });
      setVehicles(res.items);
      setLoading(false);
    }
    loadData();
  }, [selectedEmirate, selectedMake, selectedCondition, gccOnly, maxPriceAed]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleResetFilters = () => {
    setSelectedEmirate('All Emirates');
    setSearchQuery('');
    setSelectedMake('ALL');
    setSelectedCondition('ALL');
    setGccOnly(true);
    setMaxPriceAed(2000000);
  };

  // Filter & sort list in-memory
  const filteredVehicles = useMemo(() => {
    let list = [...vehicles];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.seller.displayName.toLowerCase().includes(q) ||
          v.emirate.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => Number(a.price.amountFils) - Number(b.price.amountFils));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => Number(b.price.amountFils) - Number(a.price.amountFils));
    }

    return list;
  }, [vehicles, searchQuery, sortBy]);

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
        onEmirateChange={setSelectedEmirate}
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
                {isArabic
                  ? `سيارات الوكلاء المعتمدة في الإمارات (${filteredVehicles.length})`
                  : `Verified Showroom Stock (${filteredVehicles.length})`}
              </h1>
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
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="recent">
                    {isArabic ? 'أحدث المعروض أولاً' : 'Recently Published'}
                  </option>
                  <option value="price-asc">
                    {isArabic ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}
                  </option>
                  <option value="price-desc">
                    {isArabic ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}
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
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                        onClick={() => setSelectedMake(m)}
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
                    onChange={(e) => setSelectedEmirate(e.target.value)}
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
                        onClick={() => setSelectedCondition(cond.key)}
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
                    onChange={(e) => setGccOnly(e.target.checked)}
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
                    onChange={(e) => setMaxPriceAed(Number(e.target.value))}
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
                  <Badge variant="outline" className="gap-1 cursor-pointer" onClick={() => setSelectedEmirate('All Emirates')}>
                    <span>{selectedEmirate}</span>
                    <span className="text-outline">×</span>
                  </Badge>
                )}
                {selectedMake !== 'ALL' && (
                  <Badge variant="gold" className="gap-1 cursor-pointer" onClick={() => setSelectedMake('ALL')}>
                    <span>{selectedMake}</span>
                    <span className="text-on-primary">×</span>
                  </Badge>
                )}
                {selectedCondition !== 'ALL' && (
                  <Badge variant="condition" className="gap-1 cursor-pointer" onClick={() => setSelectedCondition('ALL')}>
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
              {loading ? (
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
                    onChange={(e) => setSelectedMake(e.target.value)}
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
                    onChange={(e) => setSelectedEmirate(e.target.value)}
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
                    onChange={(e) => setMaxPriceAed(Number(e.target.value))}
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
