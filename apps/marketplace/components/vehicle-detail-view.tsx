'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MarketplaceHeader, MarketplaceFooter } from '@automotive-os/ui';
import { PublicListingDetail, addFavoriteApi, fetchFavorites, removeFavoriteApi } from '../lib/api';
import { BuyerAuthRequiredError } from '../lib/buyer-api-client';
import dynamic from 'next/dynamic';

// PF-06: the enquiry modal is large; load it only when the buyer opens it.
const VipEnquiryModal = dynamic(() => import('./vip-enquiry-modal').then((m) => m.VipEnquiryModal), {
  ssr: false,
});

export interface VehicleDetailViewProps {
  vehicle: PublicListingDetail;
  locale?: 'en' | 'ar';
}

// Indicative finance assumptions only; not a lender offer.
const FINANCE_DOWN_PCT = 0.2;
const FINANCE_TERM_MONTHS = 60;
const FINANCE_FLAT_RATE_PA = 0.0249;

function whatsappDigits(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, '');
  return digits.length >= 8 ? digits : null;
}

function coordinates(vehicle: PublicListingDetail): { lat: number; lng: number } | null {
  const lat = Number(vehicle.seller.latitude);
  const lng = Number(vehicle.seller.longitude);
  if (vehicle.seller.latitude == null || vehicle.seller.longitude == null) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export const VehicleDetailView: React.FC<VehicleDetailViewProps> = ({
  vehicle,
  locale: initialLocale = 'en',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocale] = useState<'en' | 'ar'>(initialLocale);
  const isArabic = locale === 'ar';

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  // Real favourites total for the header badge (MK-07); 0 hides the badge for signed-out visitors.
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  // Reflect real favorite state for signed-in buyers; signed-out visitors simply see "Save".
  useEffect(() => {
    let cancelled = false;
    fetchFavorites()
      .then((favs) => {
        if (cancelled) return;
        setIsSaved(favs.some((f) => f.listingId === vehicle.id));
        setFavoritesCount(favs.length);
      })
      .catch(() => {
        // Not signed in or API unavailable: leave as not saved.
      });
    return () => {
      cancelled = true;
    };
  }, [vehicle.id]);

  const mediaList = vehicle.media ?? [];
  const currentMedia = mediaList[activeMediaIndex] ?? mediaList[0];
  const priceAed = Number(vehicle.price.amountFils) / 100;
  const formattedPrice = priceAed.toLocaleString('en-US');
  const downPaymentAed = Math.round(priceAed * FINANCE_DOWN_PCT);
  const principal = priceAed - downPaymentAed;
  const monthlyAed = Math.round(
    (principal * (1 + FINANCE_FLAT_RATE_PA * (FINANCE_TERM_MONTHS / 12))) / FINANCE_TERM_MONTHS
  );
  const whatsapp = whatsappDigits(vehicle.seller.whatsappNumber);
  const coords = coordinates(vehicle);

  const specs: { label: string; value: string | null | undefined }[] = [
    { label: isArabic ? 'نوع المحرك' : 'Powertrain', value: vehicle.powertrain },
    { label: isArabic ? 'القوة' : 'Power output', value: vehicle.horsepower },
    { label: isArabic ? 'العزم' : 'Torque', value: vehicle.torque },
    { label: isArabic ? 'ناقل الحركة' : 'Transmission', value: vehicle.transmission },
    { label: isArabic ? 'الوقود' : 'Fuel', value: vehicle.fuel },
    { label: isArabic ? 'التسارع 0-100' : 'Acceleration 0-100', value: vehicle.acceleration },
    { label: isArabic ? 'السرعة القصوى' : 'Top speed', value: vehicle.topSpeed },
    { label: isArabic ? 'اللون الخارجي' : 'Exterior colour', value: vehicle.colorExterior },
    { label: isArabic ? 'اللون الداخلي' : 'Interior colour', value: vehicle.colorInterior },
    { label: isArabic ? 'العجلات' : 'Wheels', value: vehicle.wheelSpec },
    { label: isArabic ? 'المكابح' : 'Brakes', value: vehicle.brakingSpec },
    { label: isArabic ? 'الوزن' : 'Curb weight', value: vehicle.curbWeight },
  ].filter((s) => s.value);

  const handlePrevMedia = () => {
    setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
  };

  const handleNextMedia = () => {
    setActiveMediaIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice({ kind: 'ok', text: isArabic ? 'تم نسخ الرابط.' : 'Link copied to clipboard.' });
    } catch {
      setNotice({ kind: 'error', text: isArabic ? 'تعذر نسخ الرابط.' : 'Could not copy the link.' });
    }
  };

  const handleToggleSave = async () => {
    setSaving(true);
    setNotice(null);
    try {
      if (isSaved) {
        await removeFavoriteApi(vehicle.id);
        setIsSaved(false);
        setFavoritesCount((n) => Math.max(0, n - 1));
        setNotice({ kind: 'ok', text: isArabic ? 'أزيلت من المفضلة.' : 'Removed from favorites.' });
      } else {
        await addFavoriteApi(vehicle.id);
        setIsSaved(true);
        setFavoritesCount((n) => n + 1);
        setNotice({ kind: 'ok', text: isArabic ? 'أضيفت إلى المفضلة.' : 'Saved to favorites.' });
      }
    } catch (err) {
      if (err instanceof BuyerAuthRequiredError) {
        router.push(`/auth?tab=login&redirect=${encodeURIComponent(pathname || `/cars/${vehicle.slug}`)}`);
        return;
      }
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Could not update favorites.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background text-on-surface flex flex-col ${isArabic ? 'rtl' : 'ltr'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <MarketplaceHeader
        activePath="/cars"
        selectedEmirate={vehicle.emirate}
        favoritesCount={favoritesCount}
        locale={locale}
        onLocaleToggle={() => setLocale((prev) => (prev === 'en' ? 'ar' : 'en'))}
      />

      <main className="w-full pt-20 bg-background flex-1">
        {/* Sub-Navigation & Breadcrumbs Bar */}
        <div className="w-full bg-surface-container-lowest/80 backdrop-blur-md border-b border-white/[0.05]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-body-sm text-outline flex-wrap">
              <a href="/cars" className="hover:text-primary transition-colors">
                {isArabic ? 'المعرض' : 'Marketplace'}
              </a>
              <span className="text-outline-variant">/</span>
              <a href={`/cars?emirate=${encodeURIComponent(vehicle.emirate)}`} className="hover:text-primary transition-colors">
                {vehicle.emirate}
              </a>
              <span className="text-outline-variant">/</span>
              <a href={`/cars?make=${encodeURIComponent(vehicle.makeName)}`} className="hover:text-primary transition-colors">
                {vehicle.makeName}
              </a>
              <span className="text-outline-variant">/</span>
              <span className="text-on-surface font-medium truncate max-w-[180px] sm:max-w-none">
                {vehicle.modelName}
              </span>
              {vehicle.stockNumber && (
                <>
                  <span className="text-outline-variant">/</span>
                  <span className="font-data-mono-num text-xs text-primary-container">{vehicle.stockNumber}</span>
                </>
              )}
            </nav>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleToggleSave}
                disabled={saving}
                aria-pressed={isSaved}
                className={`flex items-center gap-1 text-xs font-body-sm transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${
                  isSaved ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                  {isSaved ? 'favorite' : 'favorite_border'}
                </span>
                <span>{isSaved ? (isArabic ? 'محفوظة' : 'Saved') : isArabic ? 'حفظ' : 'Save'}</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1 text-xs font-body-sm text-on-surface-variant hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                <span className="material-symbols-outlined text-[17px]" aria-hidden="true">share</span>
                <span>{isArabic ? 'مشاركة' : 'Share'}</span>
              </button>
            </div>
          </div>
          {notice && (
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 pb-2.5">
              <p
                role={notice.kind === 'error' ? 'alert' : 'status'}
                className={`text-xs ${notice.kind === 'error' ? 'text-error' : 'text-tertiary'}`}
              >
                {notice.text}
              </p>
            </div>
          )}
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-7 w-full">
          {/* Title & Price */}
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-5 mb-6">
            <div className="flex flex-col gap-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                {vehicle.trim && (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-caps text-[11px] uppercase tracking-wider font-semibold">
                    {vehicle.trim}
                  </span>
                )}
                {vehicle.gccSpec && (
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-tertiary font-label-caps text-[11px] uppercase tracking-wider flex items-center gap-1 border border-tertiary/20 font-semibold">
                    GCC Spec
                  </span>
                )}
              </div>

              <h1 className="font-headline-xl text-2xl sm:text-3xl md:text-4xl text-on-surface tracking-tight font-bold">
                {vehicle.year} {vehicle.makeName} {vehicle.modelName}{' '}
                {vehicle.chassisCode && (
                  <span className="text-outline font-normal text-xl sm:text-2xl">({vehicle.chassisCode})</span>
                )}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body-md text-xs sm:text-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary-container" aria-hidden="true">location_on</span>
                  <span>{[vehicle.seller.city, vehicle.emirate].filter(Boolean).join(', ')}</span>
                </span>
                {vehicle.mileageKm != null && (
                  <>
                    <span aria-hidden="true">•</span>
                    <span className="flex items-center gap-1 font-data-mono-num">
                      <span className="material-symbols-outlined text-[15px] text-outline" aria-hidden="true">speed</span>
                      <span>{vehicle.mileageKm.toLocaleString('en-US')} KM</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col lg:items-end bg-surface-container-low/90 p-4 rounded-xl border border-white/[0.06] backdrop-blur-md min-w-[280px]">
              <span className="font-label-caps text-[11px] text-outline uppercase tracking-wider font-medium">
                {isArabic ? 'السعر المطلوب' : 'Asking price'}
              </span>
              <div className="flex items-baseline gap-1.5 text-primary-container">
                <span className="font-headline-sm text-lg text-primary font-bold">AED</span>
                <span className="font-data-currency-lg text-2xl sm:text-3xl tracking-tight font-bold text-primary">
                  {formattedPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Media Deck + Conversion */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
            <div className="lg:col-span-9 flex flex-col gap-2.5">
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-surface-container-lowest group shadow-2xl border border-white/[0.06] flex items-center justify-center">
                {currentMedia ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentMedia.url}
                    alt={currentMedia.altText || vehicle.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                ) : (
                  <span className="text-sm text-outline">{isArabic ? 'لا توجد صور' : 'No photos provided'}</span>
                )}
                {mediaList.length > 1 && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-transparent to-black/30 pointer-events-none" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-on-surface font-data-mono-num text-xs border border-white/[0.08]">
                        {activeMediaIndex + 1} / {mediaList.length}
                      </span>
                    </div>
                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrevMedia}
                        className="p-2 rounded-lg bg-surface-container-lowest/80 hover:bg-surface-container-high text-on-surface backdrop-blur-md transition-colors border border-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="Previous image"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_left</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMedia}
                        className="p-2 rounded-lg bg-surface-container-lowest/80 hover:bg-surface-container-high text-on-surface backdrop-blur-md transition-colors border border-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="Next image"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {mediaList.length > 1 && (
                <div className="grid grid-cols-6 gap-2">
                  {mediaList.slice(0, 6).map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`aspect-[16/10] rounded-xl overflow-hidden bg-surface-container-low transition-all border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        activeMediaIndex === idx
                          ? 'ring-2 ring-primary-container border-primary-container opacity-100 shadow-md'
                          : 'opacity-60 hover:opacity-100 border-white/[0.06]'
                      }`}
                      aria-label={`View photo ${idx + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt={item.altText || `Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl flex flex-col gap-4 shadow-xl border border-white/[0.07]">
                <span className="font-label-caps text-[11px] text-outline uppercase tracking-wider font-semibold">
                  {isArabic ? 'استفسار' : 'Enquiry'}
                </span>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsVipModalOpen(true)}
                    className="w-full py-3.5 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-headline-sm text-sm uppercase tracking-wider font-bold transition-all shadow-[0_4px_20px_rgba(212,175,55,0.25)] flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-primary"
                  >
                    <span className="material-symbols-outlined text-[19px]" aria-hidden="true">sports_motorsports</span>
                    <span>{isArabic ? 'طلب معاينة أو تجربة قيادة' : 'Request viewing / test drive'}</span>
                  </button>

                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Enquiry about ${vehicle.title} on Automotive OS`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-tertiary font-body-md text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-tertiary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
                      <span>{isArabic ? 'واتساب الوكيل' : 'WhatsApp dealer'}</span>
                    </a>
                  )}
                </div>

                {/* Indicative finance estimate: assumptions, not a lender offer */}
                <div className="pt-3 flex flex-col gap-1.5 font-body-sm text-on-surface-variant text-xs border-t border-white/[0.06]">
                  <span className="font-label-caps text-[10px] text-outline uppercase tracking-wider">
                    {isArabic ? 'تقدير تمويل استرشادي' : 'Indicative finance estimate'}
                  </span>
                  <div className="flex justify-between items-center">
                    <span>{isArabic ? 'دفعة أولى (20%)' : 'Down payment (20%)'}</span>
                    <span className="font-data-mono-num text-on-surface">AED {downPaymentAed.toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{isArabic ? 'معدل افتراضي' : 'Assumed flat rate'}</span>
                    <span className="font-data-mono-num text-on-surface">2.49% p.a.</span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span>{isArabic ? 'القسط الشهري' : 'Monthly'}</span>
                    <span className="font-data-mono-num text-primary font-bold">
                      AED {monthlyAed.toLocaleString('en-US')} / {FINANCE_TERM_MONTHS} mo
                    </span>
                  </div>
                  <p className="text-[10px] text-outline leading-relaxed pt-1">
                    {isArabic
                      ? 'افتراض توضيحي فقط وليس عرضًا من بنك. يخضع لموافقة الجهة الممولة.'
                      : 'Illustrative assumption only, not a bank offer. Actual terms are set by the lender.'}
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl flex flex-col gap-3 shadow-lg border border-white/[0.07]">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-[11px] text-outline uppercase tracking-wider font-semibold">
                    {isArabic ? 'الوكيل' : 'Dealer'}
                  </span>
                  {vehicle.seller.verified && (
                    <span className="px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-label-caps text-[10px] uppercase font-bold border border-tertiary/20">
                      {isArabic ? 'وكيل موثق' : 'Verified dealer'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-11 h-11 rounded-xl bg-surface-container-highest flex items-center justify-center font-headline-md text-primary-container font-bold shadow-inner border border-white/[0.06]">
                    {vehicle.seller.displayName.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline-sm text-sm sm:text-base text-on-surface font-semibold truncate">
                      {vehicle.seller.displayName}
                    </span>
                    <span className="font-body-sm text-outline text-xs truncate">
                      {[vehicle.seller.city, vehicle.seller.emirate].filter(Boolean).join(', ')}
                    </span>
                  </div>
                </div>
                <a href={`/dealers/${vehicle.seller.slug}`} className="text-primary hover:underline font-medium text-xs self-end">
                  {isArabic ? 'عرض المعرض' : 'View showroom'}
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
            <div className="lg:col-span-8 flex flex-col gap-6">
              {vehicle.description && (
                <div className="bg-surface-container-low p-5 sm:p-6 rounded-2xl flex flex-col gap-3 border border-white/[0.07]">
                  <h2 className="font-headline-md text-base sm:text-lg text-on-surface font-semibold">
                    {isArabic ? 'الوصف' : 'Description'}
                  </h2>
                  <p className="font-body-md text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                    {vehicle.description}
                  </p>
                  <p className="text-[11px] text-outline">
                    {isArabic ? 'الوصف مقدم من الوكيل.' : 'Description provided by the dealer.'}
                  </p>
                </div>
              )}

              {vehicle.maskedVin && (
                <div className="bg-surface-container-low p-5 sm:p-6 rounded-2xl flex flex-col gap-2 border border-white/[0.07]">
                  <span className="font-label-caps text-[11px] text-outline uppercase font-medium">
                    {isArabic ? 'رقم الهيكل (مخفي جزئيًا)' : 'VIN (partially hidden)'}
                  </span>
                  <span className="font-data-mono-num text-base sm:text-lg tracking-wider text-on-surface font-bold">
                    {vehicle.maskedVin}
                  </span>
                  <span className="font-body-sm text-outline text-xs">
                    {isArabic
                      ? 'يشارك الوكيل رقم الهيكل الكامل بعد إرسال الاستفسار.'
                      : 'The dealer can share the full VIN after you send an enquiry.'}
                  </span>
                </div>
              )}

              {specs.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h2 className="font-headline-md text-base sm:text-lg text-on-surface font-semibold">
                    {isArabic ? 'المواصفات' : 'Specifications'}
                  </h2>
                  <dl className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {specs.map((s) => (
                      <div key={s.label} className="bg-surface-container-low p-3.5 rounded-xl flex flex-col gap-1 border border-white/[0.06]">
                        <dt className="font-label-caps text-[10px] text-outline uppercase font-medium">{s.label}</dt>
                        <dd className="font-body-md text-xs sm:text-sm font-semibold text-on-surface">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {(vehicle.inspectionScore || (vehicle.paintReadings && vehicle.paintReadings.length > 0)) && (
                <div className="bg-surface-container-low p-5 sm:p-6 rounded-2xl flex flex-col gap-4 border border-white/[0.07]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-headline-md text-base sm:text-lg text-on-surface font-semibold">
                        {isArabic ? 'الحالة' : 'Condition'}
                      </h2>
                      <p className="font-body-sm text-xs text-outline mt-0.5">
                        {isArabic ? 'كما صرح بها الوكيل.' : 'As declared by the dealer.'}
                      </p>
                    </div>
                    {vehicle.inspectionScore && (
                      <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-data-mono-num text-xs font-bold border border-white/[0.06]">
                        {vehicle.inspectionScore}
                      </span>
                    )}
                  </div>
                  {vehicle.paintReadings && vehicle.paintReadings.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 font-data-mono-num text-center">
                      {vehicle.paintReadings.map((reading) => (
                        <div key={reading.panel} className="bg-surface-container p-2 rounded-lg flex flex-col border border-white/[0.04]">
                          <span className="text-[10px] text-outline uppercase">{reading.panel}</span>
                          <span className="text-xs font-bold text-on-surface">{reading.value}</span>
                          <span className="text-[10px] text-tertiary">{reading.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {vehicle.factoryOptions && vehicle.factoryOptions.length > 0 && (
                <div className="bg-surface-container-low p-5 sm:p-6 rounded-2xl flex flex-col gap-3 border border-white/[0.07]">
                  <h2 className="font-headline-md text-base sm:text-lg text-on-surface font-semibold">
                    {isArabic ? 'الإضافات' : 'Factory options'}
                  </h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {vehicle.factoryOptions.map((opt) => (
                      <li key={opt.title} className="p-3 bg-surface-container rounded-xl flex flex-col border border-white/[0.04]">
                        <span className="font-body-md text-xs sm:text-sm font-semibold text-on-surface">{opt.title}</span>
                        {opt.description && <span className="text-xs text-outline mt-0.5 leading-relaxed">{opt.description}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {vehicle.serviceHistory && vehicle.serviceHistory.length > 0 && (
                <div className="bg-surface-container-low p-5 sm:p-6 rounded-2xl flex flex-col gap-3 border border-white/[0.07]">
                  <h2 className="font-headline-md text-base sm:text-lg text-on-surface font-semibold">
                    {isArabic ? 'سجل الصيانة' : 'Service history'}
                  </h2>
                  <ul className="flex flex-col gap-2.5">
                    {vehicle.serviceHistory.map((item) => (
                      <li key={`${item.invoiceNumber}-${item.date}`} className="p-3.5 bg-surface-container rounded-xl flex flex-col gap-1.5 border border-white/[0.04]">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-headline-sm text-xs sm:text-sm font-semibold text-on-surface">{item.title}</span>
                          <span className="font-data-mono-num text-xs text-outline">{item.date}</span>
                        </div>
                        {item.description && <p className="font-body-sm text-xs text-outline leading-relaxed">{item.description}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 flex flex-col gap-5">
              <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl flex flex-col gap-3 shadow-xl border border-white/[0.07]">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-[11px] text-outline uppercase tracking-wider font-semibold">
                    {isArabic ? 'الموقع' : 'Location'}
                  </span>
                  <span className="font-data-mono-num text-xs text-primary font-semibold">{vehicle.emirate}, UAE</span>
                </div>
                <h3 className="font-headline-sm text-sm sm:text-base text-on-surface font-semibold">
                  {vehicle.seller.displayName}
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  {vehicle.seller.address || [vehicle.seller.city, vehicle.seller.emirate].filter(Boolean).join(', ')}
                </p>
                {coords && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start px-3.5 py-1.5 rounded-lg bg-surface-container-lowest/90 text-on-surface font-body-sm text-xs font-semibold flex items-center gap-1.5 border border-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="material-symbols-outlined text-primary text-[17px]" aria-hidden="true">near_me</span>
                    <span>{isArabic ? 'فتح في الخرائط' : 'Open in Maps'}</span>
                  </a>
                )}
                {vehicle.seller.directPhone && (
                  <div className="flex justify-between text-xs font-data-mono-num pt-1 border-t border-white/[0.06]">
                    <span className="text-outline">{isArabic ? 'هاتف' : 'Phone'}</span>
                    <a href={`tel:${vehicle.seller.directPhone}`} className="text-on-surface font-medium hover:text-primary">
                      {vehicle.seller.directPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Action Dock */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.8)] border-t border-white/[0.08]">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-label-caps text-outline">{isArabic ? 'السعر' : 'Price'}</span>
              <span className="font-data-mono-num text-sm sm:text-base font-bold text-primary-container">AED {formattedPrice}</span>
            </div>
            <div className="flex items-center gap-2">
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Enquiry about ${vehicle.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-surface-container-high text-tertiary flex items-center justify-center border border-white/[0.08]"
                  aria-label="Contact dealer via WhatsApp"
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chat</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setIsVipModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-primary-container text-on-primary-container font-headline-sm text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">sports_motorsports</span>
                <span>{isArabic ? 'استفسار' : 'Enquire'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <MarketplaceFooter locale={locale} />

      {isVipModalOpen && (
        <VipEnquiryModal
          vehicle={vehicle}
          isOpen={isVipModalOpen}
          onClose={() => setIsVipModalOpen(false)}
          locale={locale}
        />
      )}
    </div>
  );
};
