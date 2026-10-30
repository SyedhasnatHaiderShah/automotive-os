'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MarketplaceFooter } from '@automotive-os/ui';
import type { PublicDealerProfile, PublicListingItem } from '../lib/api';

interface DealerStorefrontViewProps {
  dealer: PublicDealerProfile;
}

/** Parses "lat,lng" coordinates; returns null when absent or invalid. */
function parseCoordinates(raw: string | null): { lat: number; lng: number } | null {
  if (!raw) return null;
  const [a, b] = raw.split(',').map((p) => Number(p.trim()));
  if (a === undefined || b === undefined || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (Math.abs(a) > 90 || Math.abs(b) > 180) return null;
  return { lat: a, lng: b };
}

export function DealerStorefrontView({ dealer }: DealerStorefrontViewProps) {
  const [isRtl, setIsRtl] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'GCC'>('ALL');
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const totalStock = dealer.inventoryTotal ?? dealer.stats.liveGroundedStock;
  const coords = parseCoordinates(dealer.contact.gpsCoordinates);
  const whatsapp = dealer.contact.whatsappNumber?.replace(/[^0-9]/g, '') || null;
  const inventoryValueFils = Number(dealer.stats.inventoryValueFils);
  const branch = dealer.branches[0];

  const copy = async (text: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice({ kind: 'ok', text: ok });
    } catch {
      setNotice({ kind: 'error', text: isRtl ? 'تعذر النسخ.' : 'Could not copy to clipboard.' });
    }
  };

  const filteredInventory = dealer.inventory.filter((item) => (activeFilter === 'GCC' ? item.gccSpec === true : true));

  const stats: { label: string; value: React.ReactNode }[] = [
    {
      label: isRtl ? 'السيارات المعروضة' : 'Published listings',
      value: <span className="text-2xl font-bold text-white">{totalStock}</span>,
    },
  ];
  if (Number.isFinite(inventoryValueFils) && inventoryValueFils > 0) {
    stats.push({
      label: isRtl ? 'قيمة المخزون المعروض' : 'Listed inventory value',
      value: (
        <span className="flex items-baseline gap-1">
          <span className="text-xs text-[#d4af37] font-bold">AED</span>
          <span className="text-2xl font-bold text-white">{(inventoryValueFils / 100 / 1_000_000).toFixed(1)}M</span>
        </span>
      ),
    });
  }
  if (dealer.stats.collectorRating !== null) {
    stats.push({
      label: isRtl ? 'التقييم' : 'Rating',
      value: <span className="text-2xl font-bold text-white">★ {dealer.stats.collectorRating}</span>,
    });
  }
  if (dealer.stats.facilitySqFt !== null) {
    stats.push({
      label: isRtl ? 'مساحة المنشأة' : 'Facility',
      value: (
        <span className="text-2xl font-bold text-white">
          {dealer.stats.facilitySqFt.toLocaleString('en-US')} <span className="text-xs text-[#99907c]">SQ. FT</span>
        </span>
      ),
    });
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#101419] font-sans text-[#e0e2ea] antialiased selection:bg-[#d4af37] selection:text-[#101419] flex flex-col ${
        isRtl ? 'font-arabic' : ''
      }`}
    >
      {notice && (
        <div
          role={notice.kind === 'error' ? 'alert' : 'status'}
          className="fixed bottom-6 right-6 z-50 rounded-lg bg-[#262a30] px-4 py-3 text-sm text-[#f2ca50] shadow-2xl border border-[#d4af37]/30"
        >
          {notice.text}
          <button type="button" onClick={() => setNotice(null)} className="ms-3 text-[#99907c] hover:text-white" aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e13]/90 backdrop-blur-xl border-b border-white/[0.07] shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        <div className="h-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded-lg">
            <div className="w-9 h-9 rounded-lg bg-[#1c2025] border border-white/10 flex items-center justify-center text-[#d4af37] font-bold">
              AO
            </div>
            <span className="text-base uppercase tracking-wider text-white font-semibold">
              Automotive<span className="text-[#d4af37]">.OS</span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden lg:flex items-center gap-6">
            <Link href="/cars" className="text-sm text-[#d0c5af] hover:text-white transition-colors py-2">
              {isRtl ? 'تصفح السيارات' : 'Browse Stock'}
            </Link>
            <Link href="/dealers" className="text-sm text-[#f2ca50] font-semibold py-2 border-b-2 border-[#d4af37]">
              {isRtl ? 'المعارض المعتمدة' : 'Verified Dealers'}
            </Link>
            <Link href="/compare" className="text-sm text-[#d0c5af] hover:text-white transition-colors py-2">
              {isRtl ? 'مقارنة السيارات' : 'Compare Vehicles'}
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setIsRtl((v) => !v)}
            className="px-3 py-1.5 rounded-lg bg-[#181c21] border border-white/[0.07] text-[#d0c5af] hover:text-white transition-all text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
            aria-label={isRtl ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            {isRtl ? 'EN' : 'العربية'}
          </button>
        </div>
      </header>

      <main className="w-full pt-20 bg-[#101419] flex-1">
        <div className="relative w-full overflow-hidden">
          <div className="absolute -top-40 right-1/4 w-[620px] h-[340px] bg-[#d4af37]/10 rounded-full blur-[140px] pointer-events-none" aria-hidden="true" />

          <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#99907c]">
                <Link href="/dealers" className="hover:text-white transition-colors">
                  {isRtl ? 'المعارض' : 'Dealers'}
                </Link>
                {branch?.emirate && (
                  <>
                    <span>/</span>
                    <span className="text-white">{[branch.emirate, branch.city].filter(Boolean).join(' / ')}</span>
                  </>
                )}
                <span>/</span>
                <span className="text-[#d4af37] font-medium">{dealer.displayName}</span>
              </nav>

              <div className="flex items-center gap-2 flex-wrap">
                {dealer.verification?.isKybVerified && (
                  <span className="px-3 py-1 rounded-full bg-[#262a30] flex items-center gap-1.5 border border-white/5 font-mono text-[11px] text-[#58e7aa] uppercase tracking-wider font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#58e7aa]" aria-hidden="true" />
                    {isRtl ? 'وكيل موثق' : 'Verified dealer'}
                  </span>
                )}
                {dealer.verification?.tradeLicenseRef && (
                  <span className="px-3 py-1 rounded-full bg-[#262a30] border border-white/5 font-mono text-[11px] text-[#d0c5af] uppercase tracking-wider">
                    {dealer.verification.tradeLicenseRef}
                  </span>
                )}
                {dealer.verification?.jurisdiction && (
                  <span className="px-3 py-1 rounded-full bg-[#262a30] border border-white/5 font-mono text-[11px] text-[#d0c5af] uppercase tracking-wider">
                    {dealer.verification.jurisdiction}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-[#181c21] rounded-2xl p-6 lg:p-8 shadow-2xl relative overflow-hidden border border-white/[0.07]">
              <div className="flex flex-col lg:flex-row items-start justify-between gap-8 relative z-10">
                <div className="flex flex-col sm:flex-row items-start gap-6 max-w-3xl">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#0a0e13] flex items-center justify-center p-3 shadow-md border border-white/10 shrink-0">
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#262a30] to-[#101419] flex items-center justify-center text-[#d4af37] font-bold text-2xl tracking-widest border border-[#d4af37]/30">
                      {dealer.displayName.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">{dealer.displayName}</h1>
                    {dealer.tagline && <p className="text-base text-[#d4af37] mt-1.5 font-medium leading-relaxed">{dealer.tagline}</p>}
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-4 text-[#d0c5af] text-xs">
                      {dealer.contact.address && <span>{dealer.contact.address}</span>}
                      {dealer.stats.establishedYears !== null && (
                        <span>
                          {dealer.stats.establishedYears} {isRtl ? 'سنوات' : 'years established'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
                  <a
                    href="#inventory"
                    className="px-6 py-3.5 rounded-xl bg-[#d4af37] text-[#101419] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#f2ca50] transition-all shadow-lg shadow-[#d4af37]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#181c21] focus-visible:ring-[#d4af37]"
                  >
                    {isRtl ? 'اختر سيارة لطلب معاينة' : 'Choose a vehicle to request a viewing'}
                  </a>
                  {(dealer.contact.directPhone || whatsapp) && (
                    <div className="grid grid-cols-2 gap-2">
                      {dealer.contact.directPhone && (
                        <a
                          href={`tel:${dealer.contact.directPhone}`}
                          className="px-4 py-2.5 rounded-lg bg-[#262a30] text-white text-xs hover:bg-[#31353b] transition-colors flex items-center justify-center gap-1.5 border border-white/5"
                        >
                          {isRtl ? 'اتصال' : 'Call'}
                        </a>
                      )}
                      {whatsapp && (
                        <a
                          href={`https://wa.me/${whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-lg bg-[#262a30] text-[#58e7aa] text-xs hover:bg-[#31353b] transition-colors flex items-center justify-center gap-1.5 border border-white/5"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => copy(window.location.href, isRtl ? 'تم نسخ الرابط' : 'Storefront link copied.')}
                    className="px-4 py-2 rounded-lg bg-[#1c2025] text-[#99907c] hover:text-white transition-colors text-xs flex items-center justify-center gap-1.5 border border-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
                  >
                    {isRtl ? 'مشاركة' : 'Share storefront'}
                  </button>
                </div>
              </div>

              <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/[0.07] bg-[#0a0e13]/60 rounded-xl p-4">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col ps-2">
                    <dt className="text-[11px] uppercase tracking-wider text-[#99907c] font-semibold">{s.label}</dt>
                    <dd className="mt-1">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full pb-16 flex flex-col gap-12">
          {(dealer.description || branch) && (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-8 bg-[#1c2025] rounded-2xl p-6 lg:p-8 shadow-xl border border-white/[0.07]">
                <h2 className="text-xl font-bold text-white uppercase tracking-wide mb-4">
                  {branch?.name || (isRtl ? 'عن المعرض' : 'About the showroom')}
                </h2>
                <p className="text-sm text-[#d0c5af] max-w-2xl leading-relaxed whitespace-pre-line">
                  {dealer.description || (isRtl ? 'لم يقدم الوكيل وصفًا بعد.' : 'The dealer has not added a description yet.')}
                </p>
              </div>

              <div className="lg:col-span-4 bg-[#1c2025] rounded-2xl p-6 shadow-xl flex flex-col gap-4 border border-white/[0.07]">
                <span className="text-[11px] uppercase tracking-wider text-[#99907c] font-semibold">
                  {isRtl ? 'العنوان' : 'Showroom address'}
                </span>
                <p className="text-base font-bold text-white">
                  {dealer.contact.address || (isRtl ? 'العنوان غير متوفر' : 'Address not provided')}
                </p>
                {dealer.contact.makaniNumber && (
                  <p className="text-xs text-[#d0c5af]">Makani: {dealer.contact.makaniNumber}</p>
                )}
                <div className="mt-auto grid grid-cols-2 gap-2">
                  {coords && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2.5 rounded-lg bg-[#262a30] text-white text-xs text-center hover:bg-[#31353b] transition-colors font-medium border border-white/5"
                    >
                      {isRtl ? 'الاتجاهات' : 'Get directions'}
                    </a>
                  )}
                  {dealer.contact.address && (
                    <button
                      type="button"
                      onClick={() => copy(dealer.contact.address, isRtl ? 'تم نسخ العنوان' : 'Address copied.')}
                      className="px-3 py-2.5 rounded-lg bg-[#262a30] text-white text-xs text-center hover:bg-[#31353b] transition-colors font-medium border border-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
                    >
                      {isRtl ? 'نسخ العنوان' : 'Copy address'}
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          <section id="inventory" aria-labelledby="inventory-title" className="flex flex-col gap-6 scroll-mt-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <h2 id="inventory-title" className="text-2xl lg:text-3xl font-bold text-white">
                {isRtl ? 'السيارات المتاحة' : 'Available vehicles'}
              </h2>
              <p className="text-xs font-mono text-[#99907c]">
                {isRtl ? 'عرض' : 'Showing'} <span className="text-white font-bold">{filteredInventory.length}</span>{' '}
                {isRtl ? 'من' : 'of'} <span className="text-white font-bold">{totalStock}</span>
              </p>
            </div>

            <div className="bg-[#181c21] p-2 rounded-xl flex items-center gap-2 flex-wrap border border-white/5" role="group" aria-label="Filter">
              {(
                [
                  ['ALL', isRtl ? 'الكل' : `All loaded (${dealer.inventory.length})`],
                  ['GCC', isRtl ? 'مواصفات خليجية' : `GCC spec (${dealer.inventory.filter((i) => i.gccSpec === true).length})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={activeFilter === key}
                  onClick={() => setActiveFilter(key)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] ${
                    activeFilter === key ? 'bg-[#d4af37] text-[#101419]' : 'bg-[#1c2025] text-[#d0c5af] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {filteredInventory.length === 0 ? (
              <div className="bg-[#1c2025] rounded-xl p-10 text-center text-sm text-[#d0c5af] border border-white/[0.07]">
                {isRtl ? 'لا توجد سيارات منشورة حاليًا.' : 'No published vehicles right now.'}
              </div>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredInventory.map((car: PublicListingItem) => {
                  const priceAed = Math.round(Number(car.price.amountFils) / 100);
                  const heroImg = car.media[0]?.url;
                  return (
                    <li
                      key={car.id}
                      className="bg-[#1c2025] rounded-xl overflow-hidden shadow-xl flex flex-col group hover:-translate-y-1 transition-all duration-300 border border-white/[0.07]"
                    >
                      <div className="relative aspect-[16/10] bg-[#0a0e13] overflow-hidden flex items-center justify-center">
                        {heroImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={heroImg} alt={car.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <span className="text-xs text-[#99907c]">{isRtl ? 'لا توجد صورة' : 'No photo'}</span>
                        )}
                        {car.gccSpec && (
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#0a0e13]/90 text-[#58e7aa] font-mono text-[10px] font-semibold uppercase tracking-wider">
                            GCC Spec
                          </span>
                        )}
                      </div>
                      <div className="p-5 flex flex-col justify-between flex-grow gap-3">
                        <div>
                          <p className="text-[#99907c] text-[11px] uppercase tracking-wider mb-1">
                            {car.year}
                            {car.mileageKm != null ? ` • ${car.mileageKm.toLocaleString('en-US')} KM` : ''}
                          </p>
                          <h3 className="text-sm font-bold text-white group-hover:text-[#d4af37] transition-colors line-clamp-2">{car.title}</h3>
                        </div>
                        <div className="pt-2 border-t border-white/5 flex flex-col gap-3">
                          <div className="flex items-baseline gap-1">
                            <span className="font-mono text-xs text-[#d4af37] font-bold">AED</span>
                            <span className="text-xl font-bold text-white">{priceAed.toLocaleString('en-US')}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Link
                              href={`/cars/${car.slug}`}
                              className="py-2 rounded-lg bg-[#262a30] text-white text-xs text-center hover:bg-[#31353b] transition-colors font-medium border border-white/5"
                            >
                              {isRtl ? 'التفاصيل' : 'View details'}
                            </Link>
                            <Link
                              href={`/cars/${car.slug}/enquiry`}
                              className="py-2 rounded-lg bg-[#d4af37] text-[#101419] text-xs text-center font-bold hover:bg-[#f2ca50] transition-colors"
                            >
                              {isRtl ? 'طلب معاينة' : 'Request viewing'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {totalStock > dealer.inventory.length && (
              <p className="text-xs text-[#99907c]">
                {isRtl
                  ? `يتم عرض أول ${dealer.inventory.length} سيارة من أصل ${totalStock}.`
                  : `Showing the first ${dealer.inventory.length} of ${totalStock} published vehicles.`}
              </p>
            )}
          </section>
        </div>
      </main>

      <MarketplaceFooter locale={isRtl ? 'ar' : 'en'} />
    </div>
  );
}
