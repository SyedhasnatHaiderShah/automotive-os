'use client';

import React, { useState, useEffect } from 'react';
import {
  MarketplaceHeader,
  MarketplaceFooter,
  VehicleCard,
  VehicleGridSkeleton,
  Button,
} from '@automotive-os/ui';
import { fetchPublicListings, PublicListingItem } from '../lib/api';

export default function MarketplaceHomePage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [selectedEmirate, setSelectedEmirate] = useState('All Emirates');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('ALL');
  const [vehicles, setVehicles] = useState<PublicListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);

  const isArabic = locale === 'ar';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    fetchPublicListings({ emirate: selectedEmirate, page: 1, limit: 12 })
      .then((res) => {
        if (!active) return;
        setVehicles(res.items);
        setTotalCount(res.total);
      })
      .catch((err) => {
        if (!active) return;
        setVehicles([]);
        setTotalCount(0);
        setLoadError(err instanceof Error ? err.message : 'Unable to retrieve listings');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedEmirate]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedEmirate !== 'All Emirates') params.set('emirate', selectedEmirate);
    if (selectedCondition !== 'ALL') params.set('condition', selectedCondition);
    window.location.href = `/cars?${params.toString()}`;
  };

  const popularMakes = [
    { name: 'Porsche' },
    { name: 'Toyota' },
    { name: 'Mercedes-Benz' },
    { name: 'Land Rover' },
    { name: 'Ferrari' },
    { name: 'Bentley' },
  ];

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-background text-on-surface flex flex-col selection:bg-primary-container selection:text-on-primary-container"
    >
      <MarketplaceHeader
        activePath="/"
        selectedEmirate={selectedEmirate}
        onEmirateChange={setSelectedEmirate}
        favoritesCount={favorites.length}
        locale={locale}
        onLocaleToggle={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      />

      <main className="w-full pt-20 flex-1">
        {/* ==========================================
            HERO SECTION WITH CINEMATIC BLEED & GRID
            ========================================== */}
        <section className="relative w-full overflow-hidden pt-12 pb-16 lg:pb-24 bg-surface-container-lowest border-b border-outline-variant/30">
          {/* Atmospheric Ambient Lighting */}
          <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-1/2 right-[-100px] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[160px] pointer-events-none" />

          {/* SVG Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#f2ca50" strokeWidth="0.75" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-grid)" />
            </svg>
          </div>

          <div className="max-w-[1440px] mx-auto px-4 md:px-8 relative z-10 flex flex-col">
            {/* Top Operational Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2 bg-surface-container/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-outline-variant/30">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                <span className="font-label-caps text-xs text-on-surface uppercase tracking-wider font-semibold">
                  {isArabic ? 'بوابة وكلاء الإمارات المعتمدة' : 'Direct Dealer Exchange'}
                </span>
                <span className="text-outline text-xs font-data-mono-num">
                  • {totalCount.toLocaleString('en-US')} available listings
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-outline font-data-mono-num">
                <span>AED / UTC+4</span>
                <span>•</span>
                <span className="text-tertiary">KYB VERIFIED SHOWROOMS</span>
              </div>
            </div>

            {/* Hero Main Content & Search */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <h1 className="font-display-hero text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface leading-[1.1]">
                  {isArabic ? (
                    <>
                      سوق سيارات الوكلاء <br />
                      <span className="text-primary font-bold">المعتمدة في الإمارات.</span>
                    </>
                  ) : (
                    <>
                      Curated UAE <br />
                      <span className="text-primary font-bold">Dealership Exchange.</span>
                    </>
                  )}
                </h1>

                <p className="text-base lg:text-lg text-outline max-w-xl font-body-lg leading-relaxed">
                  {isArabic
                    ? 'سجل شفاف للأصول، ومطابقة صارمة للمواصفات الخليجية، وتواصل مباشر مع صالات العرض المعتمدة في دبي وأبوظبي والإمارات الشمالية بدون وسطاء.'
                    : 'Transparent provenance, verified GCC specifications, and direct showroom transactions across Dubai, Abu Dhabi, and Sharjah with zero broker inflation.'}
                </p>

                {/* Search & Filter Form */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="bg-surface-container/90 backdrop-blur-xl p-4 sm:p-5 rounded-xl border border-outline-variant/40 shadow-2xl shadow-black/80 flex flex-col gap-4 mt-2"
                >
                  {/* Condition Selector Tabs */}
                  <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                    {[
                      { key: 'ALL', label: isArabic ? 'كافة المعروض' : 'All Stock' },
                      { key: 'NEW', label: isArabic ? 'جديدة بالكامل' : 'Brand New' },
                      { key: 'USED', label: isArabic ? 'مستعملة معتمدة' : 'Certified Used' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setSelectedCondition(tab.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                          selectedCondition === tab.key
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Input Fields Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-7 relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                          isArabic
                            ? 'ابحث بالموديل، الفئة، أو رقم الهيكل...'
                            : 'Search make, model, or chassis keyword...'
                        }
                        className="w-full h-12 px-4 rounded-lg bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-5 relative">
                      <select
                        value={selectedEmirate}
                        onChange={(e) => setSelectedEmirate(e.target.value)}
                        className="w-full h-12 px-4 rounded-lg bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
                      >
                        <option value="All Emirates">
                          {isArabic ? 'كافة الإمارات' : 'All Emirates'}
                        </option>
                        <option value="Dubai">Dubai</option>
                        <option value="Abu Dhabi">Abu Dhabi</option>
                        <option value="Sharjah">Sharjah</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="text-xs text-outline font-data-mono-num hidden sm:inline-block">
                      {isArabic
                        ? 'فحص مباشر عبر قاعدة بيانات الوكلاء'
                        : 'Direct query to verified dealer network'}
                    </span>
                    <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
                      {isArabic ? 'البحث في المعروض' : 'Search Available Stock'}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Hero Feature Showcase (Porsche 911 GT3 RS) */}
              <div className="lg:col-span-5 relative">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-outline-variant/40 shadow-[0_20px_50px_rgba(0,0,0,0.9)] bg-surface-container">
                  <img
                    src="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80"
                    alt="Porsche 911 GT3 RS in Dark Void Studio"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-black/20" />

                  {/* Floating Badge Dossier */}
                  <div className="absolute bottom-4 left-4 right-4 p-4 rounded-lg bg-surface-container/90 backdrop-blur-md border border-outline-variant/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-label-caps text-secondary uppercase tracking-wider block">
                        Static concept showcase • Dubai
                      </span>
                      <h4 className="font-headline-sm text-sm font-bold text-on-surface">
                        2024 Porsche 911 GT3 RS
                      </h4>
                      <span className="text-xs text-outline font-data-mono-num">
                        Weissach Package • 420 km
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-data-currency-lg font-bold text-primary block">
                        AED 1,480,000
                      </span>
                      <a
                        href="/cars"
                        className="text-[11px] text-tertiary hover:underline font-medium"
                      >
                        {isArabic ? 'عرض السيارات المتاحة →' : 'Browse live stock →'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Makes Quick Pills */}
            <div className="mt-12 flex flex-wrap items-center gap-2">
              <span className="text-xs text-outline font-label-caps uppercase mr-2">
                {isArabic ? 'الماركات الشائعة:' : 'Explore Makes:'}
              </span>
              {popularMakes.map((make) => (
                <a
                  key={make.name}
                  href={`/cars?make=${encodeURIComponent(make.name)}`}
                  className="px-3.5 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/30 text-xs font-medium text-on-surface hover:border-primary/60 hover:text-primary transition-all flex items-center gap-1.5"
                >
                  <span>{make.name}</span>

                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================
            CURATED INVENTORY GRID SECTION
            ========================================== */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs font-label-caps uppercase text-outline tracking-wider">
                  {isArabic ? 'المعروض المعتمد حديثاً' : 'Audited Dealership Arrivals'}
                </span>
              </div>
              <h2 className="font-headline-lg text-2xl lg:text-3xl font-bold text-on-surface">
                {isArabic ? 'أحدث السيارات المعتمدة' : 'Verified Dealership Inventory'}
              </h2>
            </div>

            <a
              href="/cars"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-container transition-colors"
            >
              <span>{isArabic ? 'عرض كافة السيارات' : 'View All Available Stock'} ({totalCount.toLocaleString('en-US')})</span>
              <span>→</span>
            </a>
          </div>

          {/* Grid Render */}
          {loadError && !loading ? (
            <section role="alert" className="rounded-lg border border-error/40 bg-surface-container p-6">
              <h3 className="text-lg font-semibold">Vehicle inventory unavailable</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{loadError}</p>
              <a className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-on-primary" href="/">Retry loading</a>
            </section>
          ) : loading ? (
            <VehicleGridSkeleton count={6} />
          ) : vehicles.length === 0 ? (
            <div role="status" className="rounded-lg border border-outline-variant/40 bg-surface-container p-6">No published vehicles are available in this location yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => (
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
        </section>

        {/* ==========================================
            TRUST & PROVENANCE PILLARS
            ========================================== */}
        <section className="w-full bg-surface-container-low border-y border-outline-variant/30 py-16">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3 p-6 rounded-xl bg-surface-container border border-outline-variant/30">
              <div className="w-10 h-10 rounded-lg bg-tertiary-container/20 border border-tertiary/40 flex items-center justify-center text-tertiary font-bold">
                ✓
              </div>
              <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                {isArabic ? 'وكلاء معتمدون بنسبة 100%' : '100% Verified Dealerships'}
              </h3>
              <p className="text-xs text-outline leading-relaxed">
                {isArabic
                  ? 'يخضع جميع التجار لفحص السجل التجاري المعتمد وتدقيق الهوية المؤسسية (KYB) مع التراخيص الصادرة من دوائر التنمية الاقتصادية في دولة الإمارات.'
                  : 'Every seller undergoes commercial KYB trade license verification with UAE DED registry authentication prior to stock publication.'}
              </p>
            </div>

            <div className="flex flex-col gap-3 p-6 rounded-xl bg-surface-container border border-outline-variant/30">
              <div className="w-10 h-10 rounded-lg bg-secondary-container/20 border border-secondary/40 flex items-center justify-center text-secondary font-bold">
                GCC
              </div>
              <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                {isArabic ? 'مطابقة المواصفات الخليجية' : 'Verified GCC Specifications'}
              </h3>
              <p className="text-xs text-outline leading-relaxed">
                {isArabic
                  ? 'ضمان تدقيق دقيق للمواصفات الخليجية، فحص العدادات بالكيلومترات، وسجل الصيانة المعتمد مع استبعاد كامل للبيانات غير المصرح بها.'
                  : 'Odometer auditing in kilometers, Gulf climate specification verification, and transparent vehicle dossiers with chassis authenticity.'}
              </p>
            </div>

            <div className="flex flex-col gap-3 p-6 rounded-xl bg-surface-container border border-outline-variant/30">
              <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold">
                VIP
              </div>
              <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                {isArabic ? 'حماية خصوصية المشتري' : 'Purpose-Scoped Privacy Grants'}
              </h3>
              <p className="text-xs text-outline leading-relaxed">
                {isArabic
                  ? 'أنت من يحدد البيانات التي يراها الوكيل. لا مشاركة لأرقام الهواتف أو البيانات الشخصية دون موافقة صريحة، مع إمكانية إلغاء الإذن في أي وقت.'
                  : 'Field-level buyer consent grants. You choose what contact fields are shared with showrooms, and revoke access whenever you decide.'}
              </p>
            </div>
          </div>
        </section>
      </main>

      <MarketplaceFooter locale={locale} />
    </div>
  );
}
