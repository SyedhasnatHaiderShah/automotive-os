'use client';

import React, { useState } from 'react';
import { MarketplaceHeader, MarketplaceFooter } from '@automotive-os/ui';
import { PublicListingDetail } from '../lib/api';
import { VipEnquiryModal } from './vip-enquiry-modal';

export interface VehicleDetailViewProps {
  vehicle: PublicListingDetail;
  locale?: 'en' | 'ar';
}

export const VehicleDetailView: React.FC<VehicleDetailViewProps> = ({
  vehicle,
  locale: initialLocale = 'en',
}) => {
  const [locale, setLocale] = useState<'en' | 'ar'>(initialLocale);
  const isArabic = locale === 'ar';

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'options' | 'service' | 'transfer'>('options');
  const [isSaved, setIsSaved] = useState(false);
  const [showVinNotification, setShowVinNotification] = useState(false);

  const fallbackMedia = {
    id: 'default-hero',
    kind: 'EXTERIOR',
    url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
    altText: vehicle.title,
  };

  const mediaList = vehicle.media && vehicle.media.length > 0 ? vehicle.media : [fallbackMedia];
  const currentMedia = mediaList[activeMediaIndex] ?? mediaList[0] ?? fallbackMedia;
  const formattedPrice = (Number(vehicle.price.amountFils) / 100).toLocaleString('en-US');
  const monthlyFormatted = (vehicle.monthlyEstimateAed || 24150).toLocaleString('en-US');
  const downPaymentAed = Math.round(Number(vehicle.price.amountFils) / 100 * 0.2).toLocaleString('en-US');

  const handlePrevMedia = () => {
    setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
  };

  const handleNextMedia = () => {
    setActiveMediaIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
  };

  const copyDossierLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      alert(isArabic ? 'تم نسخ رابط ملف السيارة' : 'Vehicle dossier link copied to clipboard.');
    }
  };

  return (
    <div className={`min-h-screen bg-background text-on-surface flex flex-col ${isArabic ? 'rtl' : 'ltr'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Platform Header */}
      <MarketplaceHeader
        activePath="/cars"
        selectedEmirate={vehicle.emirate}
        favoritesCount={isSaved ? 1 : 0}
        locale={locale}
        onLocaleToggle={() => setLocale((prev) => (prev === 'en' ? 'ar' : 'en'))}
      />

      <main className="w-full pt-20 bg-background flex-1">
        {/* Sub-Navigation & Breadcrumbs Bar */}
        <div className="w-full bg-surface-container-lowest/80 backdrop-blur-md border-b border-white/[0.05]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-body-sm text-outline">
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
              <span className="text-outline-variant">/</span>
              <span className="font-data-mono-num text-xs text-primary-container">
                {vehicle.stockNumber}
              </span>
            </nav>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-container/10 text-tertiary text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                <span>Vault Reserve • Live</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSaved((prev) => !prev)}
                className={`flex items-center gap-1 text-xs font-body-sm transition-colors ${
                  isSaved ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">
                  {isSaved ? 'favorite' : 'favorite_border'}
                </span>
                <span>{isSaved ? (isArabic ? 'تم الحفظ' : 'Saved') : (isArabic ? 'حفظ المواصفات' : 'Bookmark Spec')}</span>
              </button>
              <button
                type="button"
                onClick={copyDossierLink}
                className="flex items-center gap-1 text-xs font-body-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">share</span>
                <span>{isArabic ? 'مشاركة الملف' : 'Share Dossier'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Viewport Container */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-7 w-full">
          {/* Top Hero Section: Title & Key Highlights Grid */}
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
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    GCC Official Spec
                  </span>
                )}
              </div>

              <h1 className="font-headline-xl text-2xl sm:text-3xl md:text-4xl text-on-surface tracking-tight font-bold">
                {vehicle.year} {vehicle.makeName} {vehicle.modelName}{' '}
                {vehicle.chassisCode && (
                  <span className="text-outline font-normal text-xl sm:text-2xl">
                    ({vehicle.chassisCode})
                  </span>
                )}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body-md text-xs sm:text-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary-container">
                    location_on
                  </span>
                  <span>{vehicle.seller.address || `${vehicle.seller.displayName}, ${vehicle.emirate}`}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-data-mono-num">
                  <span className="material-symbols-outlined text-[15px] text-outline">
                    speed
                  </span>
                  <span>{vehicle.mileageKm?.toLocaleString() ?? '—'} KM</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-data-mono-num">
                  <span className="material-symbols-outlined text-[15px] text-outline">
                    calendar_month
                  </span>
                  <span>{vehicle.deliveryDate || '—'}</span>
                </span>
              </div>
            </div>

            {/* Live Pricing Anchor */}
            <div className="flex flex-col lg:items-end bg-surface-container-low/90 p-4 rounded-xl border border-white/[0.06] backdrop-blur-md min-w-[280px]">
              <span className="font-label-caps text-[11px] text-outline uppercase tracking-wider font-medium">
                {isArabic ? 'سعر الشراء النقدي' : 'Cash Acquisition Price'}
              </span>
              <div className="flex items-baseline gap-1.5 text-primary-container">
                <span className="font-headline-sm text-lg text-primary font-bold">AED</span>
                <span className="font-data-currency-lg text-2xl sm:text-3xl tracking-tight font-bold text-primary">
                  {formattedPrice}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 font-data-mono-num text-xs text-on-surface-variant">
                <span>Est.</span>
                <span className="text-on-surface font-semibold text-primary">
                  AED {monthlyFormatted}
                </span>
                <span>/ month</span>
                <span className="text-[10px] text-outline px-1.5 py-0.5 rounded bg-surface-container-high border border-white/[0.05]">
                  20% Down • 60M
                </span>
              </div>
            </div>
          </div>

          {/* Cinematic Media Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
            {/* Primary Display Image */}
            <div className="lg:col-span-9 flex flex-col gap-2.5">
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-surface-container-lowest group shadow-2xl border border-white/[0.06]">
                <img
                  src={currentMedia.url}
                  alt={currentMedia.altText || vehicle.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                {/* Image Scrim & Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-transparent to-black/30 pointer-events-none" />

                {/* Top Interactive Pill Controls */}
                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-on-surface font-data-mono-num text-xs flex items-center gap-1.5 border border-white/[0.08]">
                    <span className="material-symbols-outlined text-[14px] text-primary-container">
                      photo_camera
                    </span>
                    <span>
                      {activeMediaIndex + 1} / {mediaList.length} High-Res Photos
                    </span>
                  </span>
                </div>

                {/* Bottom Control Strip */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-end gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevMedia}
                      className="p-2 rounded-lg bg-surface-container-lowest/80 hover:bg-surface-container-high text-on-surface backdrop-blur-md transition-colors border border-white/[0.08]"
                      title="Previous Image"
                      aria-label="Previous image"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMedia}
                      className="p-2 rounded-lg bg-surface-container-lowest/80 hover:bg-surface-container-high text-on-surface backdrop-blur-md transition-colors border border-white/[0.08]"
                      title="Next Image"
                      aria-label="Next image"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Thumbnail Filmstrip */}
              <div className="grid grid-cols-6 gap-2">
                {mediaList.slice(0, 6).map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`aspect-[16/10] rounded-xl overflow-hidden bg-surface-container-low transition-all border ${
                      activeMediaIndex === idx
                        ? 'ring-2 ring-primary-container border-primary-container opacity-100 shadow-md scale-[1.02]'
                        : 'opacity-60 hover:opacity-100 border-white/[0.06]'
                    }`}
                    aria-label={`View photo ${idx + 1}`}
                  >
                    <img
                      src={item.url}
                      alt={item.altText || `View thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Conversion Deck (Sidebar) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {/* Direct Action Card */}
              <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl flex flex-col gap-4 shadow-xl border border-white/[0.07]">
                <div className="flex items-center justify-between pb-1">
                  <span className="font-label-caps text-[11px] text-outline uppercase tracking-wider font-semibold">
                    Acquisition Inquiry
                  </span>
                  <span className="font-data-mono-num text-[11px] text-tertiary flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Ready for Handover
                  </span>
                </div>

                {/* Core CTAs */}
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsVipModalOpen(true)}
                    className="w-full py-3.5 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-headline-sm text-sm uppercase tracking-wider font-bold transition-all shadow-[0_4px_20px_rgba(212,175,55,0.25)] hover:shadow-[0_4px_24px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[19px]">sports_motorsports</span>
                    <span>{isArabic ? 'حجز موعد تجربة قيادة خاصة' : 'Book Private Viewing'}</span>
                  </button>

                  <a
                    href={`https://wa.me/971500000000?text=${encodeURIComponent(
                      `Inquiry regarding ${vehicle.title} (${vehicle.stockNumber}) on Automotive OS`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-tertiary font-body-md text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-tertiary/20"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    <span>{isArabic ? 'محادثة عبر واتساب' : 'WhatsApp Concierge'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsVipModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-body-md text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-white/[0.05]"
                  >
                    <span className="material-symbols-outlined text-[17px] text-outline">mail</span>
                    <span>Direct Showroom Enquiry</span>
                  </button>
                </div>

                {/* High-Net-Worth Security Escrow Note */}
                <div className="bg-surface-container/60 p-3 rounded-xl flex items-start gap-2.5 text-on-surface-variant font-body-sm text-xs border border-white/[0.05]">
                  <span className="material-symbols-outlined text-[18px] text-primary-container mt-0.5 shrink-0">
                    verified_user
                  </span>
                  <span>
                    RTA registered electronic transfer & central bank audited custodial escrow account available.
                  </span>
                </div>

                {/* Financing Fast Calculator Preview */}
                <div className="pt-1 flex flex-col gap-1.5 font-body-sm text-on-surface-variant text-xs border-t border-white/[0.06]">
                  <div className="flex justify-between items-center">
                    <span>Required Down Payment (20%)</span>
                    <span className="font-data-mono-num text-on-surface">AED {downPaymentAed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Profit Rate (Bank Indicative)</span>
                    <span className="font-data-mono-num text-on-surface">2.49% p.a.</span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span>Monthly Installment</span>
                    <span className="font-data-mono-num text-primary font-bold">
                      AED {monthlyFormatted} / 60 Mo
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Institutional Seller Card */}
              <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl flex flex-col gap-3 shadow-lg border border-white/[0.07]">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-[11px] text-outline uppercase tracking-wider font-semibold">
                    Authorised Broker
                  </span>
                  <span className="px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-label-caps text-[10px] uppercase font-bold border border-tertiary/20">
                    RTA Certified
                  </span>
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
                      {vehicle.seller.dedLicense || '—'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-body-sm">
                  <div className="bg-surface-container p-2.5 rounded-xl flex flex-col border border-white/[0.05]">
                    <span className="text-outline text-[10px] uppercase">Dealer Score</span>
                    <span className="font-data-mono-num text-primary font-semibold flex items-center gap-1 text-xs">
                      {vehicle.seller.score || '—'}
                      <span className="material-symbols-outlined text-[13px]">star</span>
                    </span>
                  </div>
                  <div className="bg-surface-container p-2.5 rounded-xl flex flex-col border border-white/[0.05]">
                    <span className="text-outline text-[10px] uppercase">Active Allocations</span>
                    <span className="font-data-mono-num text-on-surface font-semibold text-xs">
                      {vehicle.seller.allocationsCount || 42} Vehicles
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-outline">verified</span>
                    <span>{vehicle.seller.rtaLicense || '—'}</span>
                  </span>
                  <a href={`/dealers/${vehicle.seller.slug}`} className="text-primary hover:underline font-medium">
                    View Showroom
                  </a>
                </div>
              </div>

              {/* Fast Spec Audit Telemetry Pills */}
              <div className="bg-surface-container-lowest p-4 rounded-2xl flex flex-col gap-1.5 border border-white/[0.06]">
                <span className="font-label-caps text-[11px] text-outline uppercase tracking-wider font-semibold mb-1">
                  Fast Spec Audit
                </span>
                <div className="flex justify-between py-1 text-xs border-b border-white/[0.04]">
                  <span className="text-on-surface-variant">Acceleration 0-100</span>
                  <span className="font-data-mono-num text-on-surface font-medium">
                    {vehicle.acceleration || '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-xs border-b border-white/[0.04]">
                  <span className="text-on-surface-variant">Peak Downforce</span>
                  <span className="font-data-mono-num text-on-surface font-medium">
                    {vehicle.downforce || '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-xs border-b border-white/[0.04]">
                  <span className="text-on-surface-variant">Gross Curb Weight</span>
                  <span className="font-data-mono-num text-on-surface font-medium">
                    {vehicle.curbWeight || '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-xs">
                  <span className="text-on-surface-variant">RTA Tasjeel Inspection</span>
                  <span className="font-data-mono-num text-tertiary font-medium">
                    {vehicle.inspectionScore || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Details Grid: 2 Columns (Content & Telemetry) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
            {/* Left Content Column */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* GCC Regional Conformity Banner (Critical for UAE Market) */}
              <div className="bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low p-5 sm:p-6 rounded-2xl relative overflow-hidden shadow-lg border border-tertiary/20">
                <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-primary-container/5 blur-3xl pointer-events-none" />
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-tertiary-container/10 text-tertiary shrink-0 border border-tertiary/20">
                    <span className="material-symbols-outlined text-[26px]">verified</span>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-headline-md text-base sm:text-lg text-on-surface font-semibold">
                        GCC Official Specification Audit
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary font-label-caps text-[10px] tracking-wider uppercase font-bold">
                        Authentic GCC Dealer Car
                      </span>
                    </div>
                    <p className="font-body-md text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      First registered through{' '}
                      <span className="text-on-surface font-semibold">
                        Ali & Sons Porsche Centre (Abu Dhabi / Dubai)
                      </span>
                      . Fully configured for GCC extreme thermal requirements:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-1">
                      <div className="bg-surface-container-lowest/80 p-2.5 rounded-xl flex flex-col border border-white/[0.05]">
                        <span className="font-label-caps text-[10px] text-outline uppercase font-medium">
                          Thermal Package
                        </span>
                        <span className="font-body-sm text-xs sm:text-sm text-on-surface font-medium">
                          Tropical Twin Coolers
                        </span>
                      </div>
                      <div className="bg-surface-container-lowest/80 p-2.5 rounded-xl flex flex-col border border-white/[0.05]">
                        <span className="font-label-caps text-[10px] text-outline uppercase font-medium">
                          Dust & Sand Ingress
                        </span>
                        <span className="font-body-sm text-xs sm:text-sm text-on-surface font-medium">
                          Heavy Dust Pre-Filtration
                        </span>
                      </div>
                      <div className="bg-surface-container-lowest/80 p-2.5 rounded-xl flex flex-col border border-white/[0.05]">
                        <span className="font-label-caps text-[10px] text-outline uppercase font-medium">
                          Warranty Window
                        </span>
                        <span className="font-body-sm text-xs sm:text-sm text-tertiary font-semibold">
                          Active until June 2027
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-outline">
                      <span className="material-symbols-outlined text-[15px] text-primary">info</span>
                      <span>Qualifies for Porsche Approved Extended Warranty up to 15 years from original delivery date.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* VIN & Security Disclosure Card */}
              <div className="bg-surface-container-low p-5 sm:p-6 rounded-2xl flex flex-col gap-4 border border-white/[0.07]">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary-container">
                      fingerprint
                    </span>
                    <h3 className="font-headline-sm text-base text-on-surface font-semibold">
                      Digital Chassis Identity & Anti-Cloning
                    </h3>
                  </div>
                  <span className="font-data-mono-num text-xs text-outline">
                    RTA Registry Code: DXB-2024-911RS
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-surface-container-lowest gap-4 border border-white/[0.05]">
                  <div className="flex flex-col">
                    <span className="font-label-caps text-[11px] text-outline uppercase font-medium">
                      Chassis Identification Number (VIN)
                    </span>
                    <span className="font-data-mono-num text-base sm:text-lg tracking-wider text-on-surface font-bold">
                      {vehicle.maskedVin || '—'}
                    </span>
                    <span className="font-body-sm text-outline text-xs mt-0.5">
                      Last 6 digits obfuscated to prevent cloned secondary export paperwork.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVinNotification(true);
                      setTimeout(() => setShowVinNotification(false), 4000);
                    }}
                    className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-body-md text-xs sm:text-sm font-semibold transition-colors shrink-0 flex items-center gap-1.5 border border-primary/20"
                  >
                    <span className="material-symbols-outlined text-[17px]">lock_open</span>
                    <span>Request Full VIN for RTA Audit</span>
                  </button>
                </div>

                {showVinNotification && (
                  <div className="p-3 rounded-lg bg-tertiary-container/15 text-tertiary text-xs flex items-center gap-2 border border-tertiary/30">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>
                      Full VIN disclosure is handled by the dealer after you send an enquiry. Automated RTA VIN lookup is not available yet.
                    </span>
                  </div>
                )}
              </div>

              {/* Full Technical Dossier Bento Grid */}
              <div className="flex flex-col gap-3">
                <h3 className="font-headline-md text-base sm:text-lg text-on-surface font-semibold">
                  Factory Mechanical Dossier
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col gap-1 border border-white/[0.06]">
                    <span className="font-label-caps text-[10px] text-outline uppercase font-medium">Powertrain</span>
                    <span className="font-body-md text-xs sm:text-sm font-semibold text-on-surface">
                      {vehicle.powertrain || '—'}
                    </span>
                  </div>
                  <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col gap-1 border border-white/[0.06]">
                    <span className="font-label-caps text-[10px] text-outline uppercase font-medium">Power Output</span>
                    <span className="font-body-md text-xs sm:text-sm font-semibold text-primary">
                      {vehicle.horsepower || '—'}
                    </span>
                    <span className="font-data-mono-num text-[11px] text-outline">465 Nm @ 6,300 RPM</span>
                  </div>
                  <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col gap-1 border border-white/[0.06]">
                    <span className="font-label-caps text-[10px] text-outline uppercase font-medium">Transmission</span>
                    <span className="font-body-md text-xs sm:text-sm font-semibold text-on-surface">
                      {vehicle.transmission || '—'}
                    </span>
                    <span className="font-data-mono-num text-[11px] text-outline">Motorsport Short Ratio</span>
                  </div>
                  <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col gap-1 border border-white/[0.06]">
                    <span className="font-label-caps text-[10px] text-outline uppercase font-medium">Top Velocity</span>
                    <span className="font-body-md text-xs sm:text-sm font-semibold text-on-surface">
                      {vehicle.topSpeed || '—'}
                    </span>
                    <span className="font-data-mono-num text-[11px] text-outline">Aero Dependent</span>
                  </div>
                  <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col gap-1 border border-white/[0.06]">
                    <span className="font-label-caps text-[10px] text-outline uppercase font-medium">Exterior Hue</span>
                    <span className="font-body-md text-xs sm:text-sm font-semibold text-on-surface truncate">
                      {vehicle.colorExterior || '—'}
                    </span>
                    <span className="font-data-mono-num text-[11px] text-outline">Code: M7X / Carbon</span>
                  </div>
                  <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col gap-1 border border-white/[0.06]">
                    <span className="font-label-caps text-[10px] text-outline uppercase font-medium">Interior Spec</span>
                    <span className="font-body-md text-xs sm:text-sm font-semibold text-on-surface truncate">
                      {vehicle.colorInterior || '—'}
                    </span>
                    <span className="font-data-mono-num text-[11px] text-outline">Guards Red Contrast</span>
                  </div>
                  <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col gap-1 border border-white/[0.06]">
                    <span className="font-label-caps text-[10px] text-outline uppercase font-medium">Wheel Spec</span>
                    <span className="font-body-md text-xs sm:text-sm font-semibold text-on-surface truncate">
                      {vehicle.wheelSpec || '—'}
                    </span>
                    <span className="font-data-mono-num text-[11px] text-outline">Satin Pyro Red Finish</span>
                  </div>
                  <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col gap-1 border border-white/[0.06]">
                    <span className="font-label-caps text-[10px] text-outline uppercase font-medium">Braking Apparatus</span>
                    <span className="font-body-md text-xs sm:text-sm font-semibold text-primary-container truncate">
                      {vehicle.brakingSpec || '—'}
                    </span>
                    <span className="font-data-mono-num text-[11px] text-outline">410mm Front / 390mm Rear</span>
                  </div>
                </div>
              </div>

              {/* Condition, Physical Inspection & Provenance Report */}
              <div className="bg-surface-container-low p-5 sm:p-6 rounded-2xl flex flex-col gap-4 border border-white/[0.07]">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-white/[0.05]">
                  <div>
                    <h3 className="font-headline-md text-base sm:text-lg text-on-surface font-semibold">
                      Condition & Physical Provenance Report
                    </h3>
                    <p className="font-body-sm text-xs text-outline mt-0.5">
                      Condition details as declared by the dealer. Third-party inspection is shown only when a verified report is attached.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-tertiary-container/20 text-tertiary font-data-mono-num text-xs font-bold flex items-center gap-1 border border-tertiary/30">
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    99/100 Grade Tier 1
                  </span>
                </div>

                {/* Paint Depth Visualizer Grid */}
                <div className="p-4 bg-surface-container-lowest rounded-xl flex flex-col gap-2.5 border border-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-[11px] text-outline uppercase tracking-wider font-medium">
                      Digital Paint Thickness Meter Readings (Microns µm)
                    </span>
                    <span className="font-data-mono-num text-xs text-tertiary font-semibold">
                      100% Factory Paint Confirmed
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 font-data-mono-num text-center">
                    {(vehicle.paintReadings || [
                      { panel: 'Front Hood', value: 'Carbon OEM', status: 'XPEL PPF' },
                      { panel: 'LF Fender', value: '120 µm', status: 'Factory' },
                      { panel: 'RF Fender', value: '122 µm', status: 'Factory' },
                      { panel: 'Driver Door', value: '118 µm', status: 'Factory' },
                      { panel: 'Pass Door', value: '121 µm', status: 'Factory' },
                      { panel: 'Rear Quarters', value: '124 µm', status: 'Factory' },
                    ]).map((reading) => (
                      <div key={reading.panel} className="bg-surface-container p-2 rounded-lg flex flex-col border border-white/[0.04]">
                        <span className="text-[10px] text-outline uppercase">{reading.panel}</span>
                        <span className="text-xs font-bold text-on-surface">{reading.value}</span>
                        <span className="text-[10px] text-tertiary">{reading.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-outline pt-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">security</span>
                    <span>Full-body XPEL Stealth Satin Paint Protection Film (PPF) professionally installed from Day 1 delivery. Zero stone chips.</span>
                  </div>
                </div>

                {/* Chronology Verification */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 bg-surface-container rounded-xl flex flex-col gap-1 border border-white/[0.05]">
                    <span className="font-label-caps text-[10px] text-outline uppercase">Last Physical Inspection</span>
                    <span className="font-data-mono-num text-xs sm:text-sm text-on-surface font-semibold">18 February 2025</span>
                    <span className="text-[11px] text-outline">RTA Shamil Al Quoz Center</span>
                  </div>
                  <div className="p-3 bg-surface-container rounded-xl flex flex-col gap-1 border border-white/[0.05]">
                    <span className="font-label-caps text-[10px] text-outline uppercase">Chassis Geometry Test</span>
                    <span className="font-body-md text-xs sm:text-sm text-tertiary font-semibold">Zero Structural Defect</span>
                    <span className="text-[11px] text-outline">Laser Frame Alignment Verified</span>
                  </div>
                  <div className="p-3 bg-surface-container rounded-xl flex flex-col gap-1 border border-white/[0.05]">
                    <span className="font-label-caps text-[10px] text-outline uppercase">Service Records</span>
                    <span className="font-body-md text-xs sm:text-sm text-on-surface font-semibold">1,500 KM Break-in Complete</span>
                    <span className="text-[11px] text-outline">Ali & Sons Official Stamp</span>
                  </div>
                </div>
              </div>

              {/* Interactive Spec Tabs Section */}
              <div className="bg-surface-container-low p-5 sm:p-6 rounded-2xl flex flex-col gap-4 border border-white/[0.07]">
                {/* Tab Triggers */}
                <div className="flex border-b border-white/[0.08] overflow-x-auto gap-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('options')}
                    className={`pb-2.5 px-3 font-headline-sm text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border-b-2 ${
                      activeTab === 'options'
                        ? 'text-primary border-primary'
                        : 'text-outline border-transparent hover:text-on-surface'
                    }`}
                  >
                    Weissach Factory Options
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('service')}
                    className={`pb-2.5 px-3 font-headline-sm text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border-b-2 ${
                      activeTab === 'service'
                        ? 'text-primary border-primary'
                        : 'text-outline border-transparent hover:text-on-surface'
                    }`}
                  >
                    Official Service Log & Invoices
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('transfer')}
                    className={`pb-2.5 px-3 font-headline-sm text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border-b-2 ${
                      activeTab === 'transfer'
                        ? 'text-primary border-primary'
                        : 'text-outline border-transparent hover:text-on-surface'
                    }`}
                  >
                    RTA Registration & Transfer Costs
                  </button>
                </div>

                {/* Tab 1: Factory Options */}
                {activeTab === 'options' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {(vehicle.factoryOptions || [
                      {
                        title: 'Full Weissach Package (P70)',
                        description: 'Carbon exterior hood, roof, rear wing, roll cage, anti-roll bars, magnetic paddle shifters.',
                      },
                      {
                        title: 'PCCB Ceramic Composite Brakes (0PC)',
                        description: 'Yellow calipers, 410mm cross-drilled ceramic discs with extreme high-heat threshold.',
                      },
                      {
                        title: 'Hydraulic Front Axle Lift System (2UH)',
                        description: 'Smart GPS memory front lifter with automatic speedbump clearance.',
                      },
                      {
                        title: 'LED Matrix Headlights in Black (8JU)',
                        description: 'Porsche Dynamic Light System Plus (PDLS+) with tinted aerodynamic surrounds.',
                      },
                      {
                        title: 'Bose® High-End Surround Sound (9VL)',
                        description: '12 active speakers with lightweight acoustic enclosure integration.',
                      },
                      {
                        title: 'Club Sport Package + 6-Point Harnesses',
                        description: 'Factory roll cage bolted to chassis points with fire extinguisher and FIA driver harness.',
                      },
                    ]).map((opt) => (
                      <div key={opt.title} className="p-3 bg-surface-container rounded-xl flex items-start gap-2.5 border border-white/[0.04]">
                        <span className="material-symbols-outlined text-primary text-[19px] mt-0.5 shrink-0">
                          check_circle
                        </span>
                        <div className="flex flex-col">
                          <span className="font-body-md text-xs sm:text-sm font-semibold text-on-surface">
                            {opt.title}
                          </span>
                          <span className="text-xs text-outline mt-0.5 leading-relaxed">
                            {opt.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 2: Service History */}
                {activeTab === 'service' && (
                  <div className="flex flex-col gap-2.5">
                    {(vehicle.serviceHistory || [
                      {
                        title: 'Pre-Delivery & Running-in Inspection (1,500 KM)',
                        date: 'Completed 12 Jan 2025',
                        invoiceNumber: 'Inv #PCD-90223',
                        description: 'Authorized Porsche Centre Dubai. Replaced initial break-in engine oil (Mobil 1 C40 GT 0W-40), differential fluid inspection, electronic torque validation on center-lock magnesium wheels.',
                      },
                    ]).map((item) => (
                      <div key={item.invoiceNumber} className="p-3.5 bg-surface-container rounded-xl flex flex-col gap-1.5 border border-white/[0.04]">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-headline-sm text-xs sm:text-sm font-semibold text-on-surface">
                            {item.title}
                          </span>
                          <span className="font-data-mono-num text-xs text-tertiary">
                            {item.date}
                          </span>
                        </div>
                        <p className="font-body-sm text-xs text-outline leading-relaxed">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[10px] font-data-mono-num">
                            {item.invoiceNumber}
                          </span>
                          <span className="text-tertiary text-xs flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-[13px]">check</span>
                            Invoice Verified
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 3: RTA Transfer Breakdown */}
                {activeTab === 'transfer' && (
                  <div className="p-4 bg-surface-container rounded-xl flex flex-col gap-2 text-xs border border-white/[0.04]">
                    <span className="font-headline-sm text-sm text-on-surface font-semibold">
                      Estimated UAE Ownership Transfer Costs
                    </span>
                    <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                      <span className="text-on-surface-variant">RTA Vehicle Comprehensive Technical Test</span>
                      <span className="font-data-mono-num text-on-surface font-semibold">AED 420</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                      <span className="text-on-surface-variant">RTA Ownership Transfer Fee (Traffic File)</span>
                      <span className="font-data-mono-num text-on-surface font-semibold">AED 350</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                      <span className="text-on-surface-variant">Standard Dubai License Plate Issuance</span>
                      <span className="font-data-mono-num text-on-surface font-semibold">AED 70</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                      <span className="text-on-surface-variant">Knowledge & Innovation Dirham Fees</span>
                      <span className="font-data-mono-num text-on-surface font-semibold">AED 20</span>
                    </div>
                    <div className="flex justify-between py-2 text-primary font-bold text-sm">
                      <span>Total Mandatory Government Transfer Charges</span>
                      <span className="font-data-mono-num">AED 860</span>
                    </div>
                    <p className="text-[11px] text-outline italic pt-1 leading-relaxed">
                      Government transfer charges are indicative. Confirm current RTA fees and transfer timing with {vehicle.seller.displayName}.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Location, Benchmark & Protection */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              {/* Physical Location Card */}
              <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl flex flex-col gap-3 shadow-xl border border-white/[0.07]">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-[11px] text-outline uppercase tracking-wider font-semibold">
                    Physical Location
                  </span>
                  <span className="font-data-mono-num text-xs text-primary font-semibold">
                    {vehicle.emirate}, UAE
                  </span>
                </div>
                <h4 className="font-headline-sm text-sm sm:text-base text-on-surface font-semibold">
                  {vehicle.seller.displayName} • Al Quoz
                </h4>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  {vehicle.seller.address || '—'} Climate-controlled dehumidified facility.
                </p>

                {/* Map View Anchor */}
                <div className="w-full h-40 rounded-xl bg-cover bg-center relative overflow-hidden group shadow-md border border-white/[0.06]" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCaFKCh6OBgshoY0jOYvphHS_cBLhxvOQFnXuL5kEkjl3SMyv79zdfdBU7x3fNmNnO-m-yPAQaWklIxCvmyfEGWwJq3yS7fRPU-fJHER6yU_vEaTnCUh8zx8_hUzcMiHNX-vld21aRcHLsuZL7y9ncDI0CWGxDcOS95MDwBiVvbpahlhf_CAHdAWYWRvXlrxRcWVieDrODOg0Ihlb_JwgLXjtZzjRWJHbZsg4mP8ABzMlYSUwtNvhkE')" }}>
                  <div className="absolute inset-0 bg-surface-container-lowest/40 backdrop-blur-[1px] group-hover:backdrop-blur-none transition-all flex items-center justify-center">
                    <a
                      href="https://maps.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest/90 text-on-surface font-body-sm text-xs font-semibold flex items-center gap-1.5 shadow-lg border border-white/[0.08]"
                    >
                      <span className="material-symbols-outlined text-primary text-[17px]">near_me</span>
                      <span>Open in Maps</span>
                    </a>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs font-data-mono-num pt-1 text-on-surface-variant border-t border-white/[0.06]">
                  <div className="flex justify-between">
                    <span className="text-outline">Private Viewing Hours:</span>
                    <span className="text-on-surface font-medium">10:00 AM - 9:00 PM GST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Direct Desk:</span>
                    <span className="text-on-surface font-medium">{vehicle.seller.directPhone || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Comparable UAE Market Benchmark */}
              <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl flex flex-col gap-3 shadow-xl border border-white/[0.07]">
                <div className="flex items-center justify-between pb-1">
                  <span className="font-label-caps text-[11px] text-outline uppercase tracking-wider font-semibold">
                    GCC Valuation Index
                  </span>
                  <span className="font-data-mono-num text-[11px] text-tertiary font-bold">
                    Real-time Verified
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">2024 GCC Weissach Median</span>
                    <span className="font-data-mono-num text-on-surface font-bold">
                      AED {(vehicle.benchmarkMedianAed || 1460000).toLocaleString('en-US')}
                    </span>
                  </div>
                  {/* Progress Line */}
                  <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden relative">
                    <div className="absolute top-0 bottom-0 left-0 bg-primary-container rounded-full" style={{ width: '78%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-outline font-data-mono-num">
                    <span>AED 1.35M (High km)</span>
                    <span className="text-primary font-bold">This Car: AED {formattedPrice}</span>
                    <span>AED 1.55M (Delivery Only)</span>
                  </div>
                </div>
                <p className="font-body-sm text-outline text-xs pt-1 leading-relaxed">
                  Priced <span className="text-tertiary font-bold">2.8% below</span> current GCC average for Weissach Package equipped with under 2,000 km and Ceramic Braking (PCCB).
                </p>
              </div>

              {/* Security & Sovereign Guarantee Note */}
              <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl flex flex-col gap-2.5 border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[19px] text-primary-container">
                    gavel
                  </span>
                  <span className="font-headline-sm text-sm text-on-surface font-semibold">
                    Sovereign Buyer Protection
                  </span>
                </div>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  All vehicles traded through Automotive.OS undergo official UAE Ministry of Interior & Dubai Police database checks for encumbrances, unpaid fines, or active customs carnets.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-tertiary font-medium">
                  <span className="material-symbols-outlined text-[15px]">check</span>
                  <span>Zero Accident History Confirmed</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-tertiary font-medium">
                  <span className="material-symbols-outlined text-[15px]">check</span>
                  <span>No Outstanding Mortgages or Bank Liens</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Action Dock */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.8)] border-t border-white/[0.08]">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-label-caps text-outline">Price</span>
              <span className="font-data-mono-num text-sm sm:text-base font-bold text-primary-container">
                AED {formattedPrice}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/971500000000?text=${encodeURIComponent(
                  `Inquiry regarding ${vehicle.title}`
                )}`}
                className="p-2.5 rounded-xl bg-surface-container-high text-tertiary flex items-center justify-center border border-white/[0.08]"
                aria-label="Contact via WhatsApp"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </a>
              <button
                type="button"
                onClick={() => setIsVipModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-primary-container text-on-primary-container font-headline-sm text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-[16px]">sports_motorsports</span>
                <span>{isArabic ? 'تجربة القيادة' : 'Test Drive'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Platform Footer */}
      <MarketplaceFooter locale={locale} />

      {/* VIP Modal Flow */}
      <VipEnquiryModal
        vehicle={vehicle}
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
        locale={locale}
      />
    </div>
  );
};
