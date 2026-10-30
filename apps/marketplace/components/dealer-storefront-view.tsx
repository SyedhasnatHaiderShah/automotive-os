'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { PublicDealerProfile, PublicListingItem } from '../lib/api';

interface DealerStorefrontViewProps {
  dealer: PublicDealerProfile;
}

export function DealerStorefrontView({ dealer }: DealerStorefrontViewProps) {
  const [isRtl, setIsRtl] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChassis, setSelectedChassis] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00 AM - 12:00 PM (Morning Viewing)');

  const toggleRtl = () => setIsRtl(!isRtl);

  const handleShareClick = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopyFeedback(isRtl ? 'تم نسخ رابط المعرض' : 'Storefront link copied to clipboard.');
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  const handleCopyAddress = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(dealer.contact.address);
      setCopyFeedback(isRtl ? 'تم نسخ العنوان' : 'Showroom address copied.');
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  const handleOpenBooking = (vehicleTitle?: string) => {
    if (vehicleTitle) {
      setSelectedChassis(vehicleTitle);
    } else {
      setSelectedChassis(dealer.inventory[0]?.title || 'General Vault Tour & Classic Collection');
    }
    setModalSuccess(false);
    setIsModalOpen(true);
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setModalSuccess(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setModalSuccess(false);
    }, 2500);
  };

  // Filter listings
  const filteredInventory = dealer.inventory.filter((item) => {
    if (activeFilter === 'GCC') return item.gccSpec !== false;
    if (activeFilter === 'SUPERCARS') {
      const t = item.title.toLowerCase();
      return t.includes('gt') || t.includes('turbo') || t.includes('sl');
    }
    if (activeFilter === 'SUVS') {
      const t = item.title.toLowerCase();
      return t.includes('g 63') || t.includes('suv') || t.includes('defender');
    }
    return true;
  });

  const formattedInventoryValue = (Number(dealer.stats.inventoryValueFils) / 100 / 1000000).toFixed(1);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#101419] font-sans text-[#e0e2ea] antialiased selection:bg-[#d4af37] selection:text-[#101419] ${
        isRtl ? 'font-arabic' : ''
      }`}
    >
      {/* Toast Alert */}
      {copyFeedback && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-[#262a30] px-4 py-3 text-sm text-[#f2ca50] shadow-2xl border border-[#d4af37]/30 transition-all">
          {copyFeedback}
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e13]/90 backdrop-blur-xl border-b border-white/[0.07] shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        <div className="h-20 max-w-[1440px] mx-auto px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-[#1c2025] border border-white/10 flex items-center justify-center text-[#d4af37] font-bold">
                AO
              </div>
              <div className="flex flex-col">
                <span className="text-base uppercase tracking-wider text-white font-semibold">
                  Automotive<span className="text-[#d4af37]">.OS</span>
                </span>
                <span className="text-[11px] uppercase tracking-wider text-[#99907c]">
                  {isRtl ? 'منصة نخبة السيارات الإماراتية' : 'UAE Collector Exchange'}
                </span>
              </div>
            </Link>

            <div className="h-6 w-px bg-white/10 hidden lg:block"></div>

            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181c21] border border-white/[0.07] text-[#d0c5af]">
              <span className="text-[#d4af37] text-xs">📍</span>
              <span className="text-xs text-white">Dubai Hub</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/cars" className="text-sm text-[#d0c5af] hover:text-white transition-colors py-2">
              {isRtl ? 'تصفح السيارات' : 'Browse Stock'}
            </Link>
            <span className="text-sm text-[#f2ca50] font-semibold py-2 border-b-2 border-[#d4af37]">
              {isRtl ? 'المعارض المعتمدة' : 'Verified Dealers'}
            </span>
            <span className="text-sm text-[#d0c5af]/60 py-2 cursor-not-allowed" aria-disabled="true">
              {isRtl ? 'بيع وإيداع' : 'Sell & Consign'}
              <span className="ms-1 text-[9px] opacity-80">{isRtl ? 'قريباً' : 'Soon'}</span>
            </span>
            <Link href="/compare" className="text-sm text-[#d0c5af] hover:text-white transition-colors py-2">
              {isRtl ? 'مقارنة السيارات' : 'Compare Vehicles'}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleRtl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181c21] border border-white/[0.07] text-[#d0c5af] hover:text-white transition-all text-xs"
              title="Toggle English / Arabic RTL"
            >
              <span className="font-semibold">{isRtl ? 'EN' : 'العربية'}</span>
            </button>

            <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1c2025] border border-[#d4af37]/40 flex items-center justify-center text-xs font-semibold text-[#f2ca50]">
                VIP
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full pt-20 bg-[#101419]">
        <div className="flex flex-col w-full">
          {/* Top Ambient Glow Field */}
          <div className="relative w-full overflow-hidden">
            <div className="absolute -top-40 right-1/4 w-[620px] h-[340px] bg-[#d4af37]/10 rounded-full blur-[140px] pointer-events-none"></div>
            <div className="absolute top-1/2 -left-48 w-[480px] h-[300px] bg-[#00a6e0]/5 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Storefront Brand Header */}
            <section className="max-w-[1440px] mx-auto px-6 lg:px-8 pt-8 pb-12 relative z-10">
              {/* Breadcrumbs & Verification Telemetry */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 text-xs text-[#99907c]">
                  <Link href="/cars" className="hover:text-white transition-colors">
                    {isRtl ? 'شبكة المعارض المعتمدة' : 'Verified Network'}
                  </Link>
                  <span>/</span>
                  <span className="text-white">
                    {dealer.branches[0]?.emirate || 'Dubai'} / {dealer.branches[0]?.city || 'Al Quoz'}
                  </span>
                  <span>/</span>
                  <span className="text-[#d4af37] font-medium">{dealer.displayName}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {dealer.verification?.tradeLicenseRef && (
                    <div className="px-3 py-1 rounded-full bg-[#262a30] flex items-center gap-1.5 shadow-sm border border-white/5">
                      <span className="w-2 h-2 rounded-full bg-[#58e7aa]"></span>
                      <span className="font-mono text-[11px] text-[#58e7aa] uppercase tracking-wider font-semibold">
                        {dealer.verification.tradeLicenseRef}
                      </span>
                    </div>
                  )}

                  {dealer.verification?.jurisdiction && (
                    <div className="px-3 py-1 rounded-full bg-[#262a30] flex items-center gap-1.5 shadow-sm border border-white/5">
                      <span className="text-xs text-[#d4af37]">⚖️</span>
                      <span className="font-mono text-[11px] text-[#d0c5af] uppercase tracking-wider">
                        {dealer.verification.jurisdiction}
                      </span>
                    </div>
                  )}

                  <div className="px-3 py-1 rounded-full bg-[#262a30] flex items-center gap-1.5 shadow-sm border border-white/5">
                    <span className="text-xs text-[#7bd0ff]">🛡️</span>
                    <span className="font-mono text-[11px] text-[#d0c5af] uppercase tracking-wider">
                      {isRtl ? 'ترخيص تجاري سارٍ' : 'UAE Sovereign Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Profile Banner Block */}
              <div className="bg-[#181c21] rounded-2xl p-6 lg:p-8 shadow-2xl relative overflow-hidden border border-white/[0.07]">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-8 relative z-10">
                  {/* Left: Identity & Badges */}
                  <div className="flex flex-col sm:flex-row items-start gap-6 max-w-3xl">
                    {/* Dealer Crest Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#0a0e13] flex items-center justify-center p-3 shadow-md border border-white/10">
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#262a30] to-[#101419] flex items-center justify-center text-[#d4af37] font-bold text-2xl tracking-widest border border-[#d4af37]/30">
                          {dealer.displayName.slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <span
                        className="absolute -bottom-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full bg-[#58e7aa] text-[#003824] shadow-md font-bold text-xs"
                        title="KYB Institutional Audit Passed"
                      >
                        ✓
                      </span>
                    </div>

                    {/* Titles and Heritage */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                          {dealer.displayName}
                        </h1>
                      </div>
                      <p className="text-base text-[#d4af37] mt-1.5 font-medium leading-relaxed">
                        {dealer.tagline}
                      </p>

                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-4 text-[#d0c5af] text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[#d4af37]">📍</span>
                          {dealer.contact.address}
                        </span>
                        <span className="text-[#4d4635]">•</span>
                        {dealer.stats.establishedYears !== null && (
                          <span className="flex items-center gap-1.5">
                            <span className="text-[#58e7aa]">⏳</span>
                            {dealer.stats.establishedYears} {isRtl ? 'سنوات خبرة' : 'Years Established'}
                          </span>
                        )}
                        <span className="text-[#4d4635]">•</span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-[#d4af37]">🔒</span>
                          {isRtl ? 'ضمان الحيازة المادية بالمعرض' : 'Direct Showroom Custody Guarantee'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Direct VIP Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenBooking()}
                      className="px-6 py-3.5 rounded-xl bg-[#d4af37] text-[#101419] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#f2ca50] transition-all shadow-lg shadow-[#d4af37]/20"
                    >
                      <span>📅</span>
                      {isRtl ? 'حجز موعد بالمعرض' : 'Schedule Showroom Visit'}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={dealer.contact.directPhone ? `tel:${dealer.contact.directPhone}` : undefined}
                        aria-disabled={!dealer.contact.directPhone}
                        className="px-4 py-2.5 rounded-lg bg-[#262a30] text-white text-xs hover:bg-[#31353b] transition-colors flex items-center justify-center gap-1.5 border border-white/5"
                      >
                        <span className="text-[#d4af37]">📞</span>
                        VIP Desk
                      </a>
                      <a
                        href={dealer.contact.whatsappNumber ? `https://wa.me/${dealer.contact.whatsappNumber.replace(/[^0-9]/g, '')}` : undefined}
                        aria-disabled={!dealer.contact.whatsappNumber}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-lg bg-[#262a30] text-[#58e7aa] text-xs hover:bg-[#31353b] transition-colors flex items-center justify-center gap-1.5 border border-white/5"
                      >
                        <span>💬</span>
                        WhatsApp
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={handleShareClick}
                      className="px-4 py-2 rounded-lg bg-[#1c2025] text-[#99907c] hover:text-white transition-colors text-xs flex items-center justify-center gap-1.5 border border-white/5"
                    >
                      <span>🔗</span>
                      {isRtl ? 'مشاركة ملف المعرض المعتمد' : 'Share Verified Dossier'}
                    </button>
                  </div>
                </div>

                {/* Telemetry Stats Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/[0.07] bg-[#0a0e13]/60 rounded-xl p-4">
                  <div className="flex flex-col pl-2">
                    <span className="text-[11px] uppercase tracking-wider text-[#99907c] font-semibold">
                      {isRtl ? 'المخزون الميداني الحي' : 'Live Grounded Stock'}
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold text-white">{dealer.stats.liveGroundedStock}</span>
                      <span className="text-xs text-[#58e7aa] font-medium">100% In Vault</span>
                    </div>
                  </div>

                  <div className="flex flex-col pl-2">
                    <span className="text-[11px] uppercase tracking-wider text-[#99907c] font-semibold">
                      {isRtl ? 'قيمة مخزون الخزينة' : 'Vault Inventory Value'}
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xs text-[#d4af37] font-bold">AED</span>
                      <span className="text-2xl font-bold text-white">{formattedInventoryValue}M</span>
                    </div>
                  </div>

                  <div className="flex flex-col pl-2">
                    <span className="text-[11px] uppercase tracking-wider text-[#99907c] font-semibold">
                      {isRtl ? 'تقييم هواة الاقتناء' : 'Collector Rating'}
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <div className="flex items-center gap-1 text-[#d4af37]">
                        <span>★</span>
                        <span className="text-2xl font-bold text-white">{dealer.stats.collectorRating ?? '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col pl-2">
                    <span className="text-[11px] uppercase tracking-wider text-[#99907c] font-semibold">
                      {isRtl ? 'مساحة المنشأة' : 'Physical Facility'}
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold text-white">
                        {dealer.stats.facilitySqFt !== null ? dealer.stats.facilitySqFt.toLocaleString() : '—'}
                      </span>
                      <span className="text-xs text-[#99907c]">SQ. FT</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Main Storefront Sections Bento */}
          <div className="max-w-[1440px] mx-auto px-6 lg:px-8 w-full pb-16 flex flex-col gap-12">
            {/* Section 1: Facility Capabilities & Physical Reality (Anti-Phantom Assurance) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Showroom Facility Highlights */}
              <div className="lg:col-span-8 bg-[#1c2025] rounded-2xl p-6 lg:p-8 shadow-xl flex flex-col justify-between border border-white/[0.07]">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37]"></span>
                      <h2 className="text-xl font-bold text-white uppercase tracking-wide">
                        {dealer.branches[0]?.name || 'Al Quoz 1 Showroom & Engineering Hub'}
                      </h2>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#58e7aa]/10 text-[#58e7aa] text-xs font-semibold uppercase tracking-wider">
                      Open Until 8:00 PM GST
                    </span>
                  </div>

                  <p className="text-sm text-[#d0c5af] max-w-2xl mb-6 leading-relaxed">
                    {dealer.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#181c21] p-4 rounded-xl border border-white/5 flex items-start gap-3">
                      <span className="text-xl text-[#d4af37]">❄️</span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {isRtl ? 'خزينة عرض مكيفة بيئياً' : 'Climate-Controlled Display Vault'}
                        </h3>
                        <p className="text-xs text-[#99907c] mt-1 leading-normal">
                          Constant 21°C ambient temperature with 45% stabilized humidity to protect leather, rubbers, and factory coatings.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#181c21] p-4 rounded-xl border border-white/5 flex items-start gap-3">
                      <span className="text-xl text-[#58e7aa]">🔧</span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {isRtl ? 'فنيون معتمدون في الموقع' : 'In-House Certified Master Technicians'}
                        </h3>
                        <p className="text-xs text-[#99907c] mt-1 leading-normal">
                          Full diagnostic bays equipped with factory Star Diagnostic, PIWIS, and laser chassis alignment systems.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#181c21] p-4 rounded-xl border border-white/5 flex items-start gap-3">
                      <span className="text-xl text-[#7bd0ff]">🛋️</span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {isRtl ? 'صالة تسليم خاصة بكبار الشخصيات' : 'Discrete VIP Handover Lounge'}
                        </h3>
                        <p className="text-xs text-[#99907c] mt-1 leading-normal">
                          Private indoor transit bays with veiled glass to ensure total privacy for collector transfers and signatures.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#181c21] p-4 rounded-xl border border-white/5 flex items-start gap-3">
                      <span className="text-xl text-[#d4af37]">🏛️</span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {isRtl ? 'مكتب الإيداع المصرفي المباشر' : 'Direct Sovereign Escrow Desks'}
                        </h3>
                        <p className="text-xs text-[#99907c] mt-1 leading-normal">
                          Central Bank regulated escrow protocol with instant on-site RTA ownership certificate issuance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Interactive Coordinates & Map Card */}
              <div className="lg:col-span-4 bg-[#1c2025] rounded-2xl overflow-hidden shadow-xl flex flex-col border border-white/[0.07]">
                <div className="relative w-full h-48 bg-[#0a0e13] flex items-center justify-center p-6 bg-gradient-to-br from-[#181c21] to-[#0a0e13]">
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">🗺️</span>
                    <span className="font-mono text-xs text-[#d4af37] font-semibold">
                      {dealer.contact.gpsCoordinates ?? (isRtl ? 'الموقع غير متوفر' : 'Location not provided')}
                    </span>
                    <span className="block text-[11px] text-[#99907c] mt-1">
                      Makani: {dealer.contact.makaniNumber ?? '—'}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#0a0e13]/90 rounded-md flex items-center gap-1.5 border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#58e7aa] animate-pulse"></span>
                    <span className="text-[10px] text-white font-medium">VIP Valet Available</span>
                  </div>
                </div>

                <div className="p-6 flex flex-col justify-between flex-grow">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#99907c] font-semibold">
                      {isRtl ? 'إحداثيات المعرض المباشرة' : 'Showroom Direct Coordinates'}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">
                      {dealer.branches[0]?.address || 'Street 4B, Behind Times Square'}
                    </h3>
                    <p className="text-xs text-[#d0c5af] mt-2">
                      Al Quoz Industrial 1, Sheikh Zayed Road Exit 43, Dubai, United Arab Emirates
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <a
                      href="https://maps.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2.5 rounded-lg bg-[#262a30] text-white text-xs text-center hover:bg-[#31353b] transition-colors font-medium border border-white/5"
                    >
                      {isRtl ? 'الاتجاهات' : 'Get Directions'}
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="px-3 py-2.5 rounded-lg bg-[#262a30] text-white text-xs text-center hover:bg-[#31353b] transition-colors font-medium border border-white/5"
                    >
                      {isRtl ? 'نسخ العنوان' : 'Copy Address'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Trust & Sovereign Governance Architecture (Three Pillars) */}
            <section className="bg-[#181c21] rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden border border-white/[0.07]">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
                    {isRtl ? 'معايير الامتثال السيادي' : 'Institutional Compliance Standard'}
                  </span>
                  <h2 className="text-2xl font-bold text-white mt-1">
                    {isRtl ? 'ركائز حماية المشتري الثلاث' : 'Three Pillars of Collector Protection'}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#99907c]">
                  <span>⚖️</span>
                  <span>Regulated under UAE Federal Law No. 15 of 2020 on Consumer Protection</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pillar 1 */}
                <div className="bg-[#1c2025] p-6 rounded-xl flex flex-col justify-between border border-white/5 shadow-md">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 flex items-center justify-center text-[#d4af37] mb-4 text-xl">
                      🛡️
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {isRtl ? 'حيازة فعلية غير وهمية' : 'Anti-Phantom Physical Grounding'}
                    </h3>
                    <p className="text-xs text-[#d0c5af] mt-2 leading-relaxed">
                      Every vehicle presented on this storefront is physically housed on our showroom floor in Dubai. We do not aggregate foreign broker stock. Walk in at any time to inspect the exact chassis.
                    </p>
                  </div>
                  <div className="mt-6 pt-3 bg-[#0a0e13]/60 px-3 py-2 rounded-lg flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#99907c]">PHYSICAL AUDIT</span>
                    <span className="text-[#58e7aa] font-bold">WEEKLY RTA SYNC</span>
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="bg-[#1c2025] p-6 rounded-xl flex flex-col justify-between border border-white/5 shadow-md">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#58e7aa]/15 flex items-center justify-center text-[#58e7aa] mb-4 text-xl">
                      📋
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {isRtl ? 'براءة ذمة وفحص هيئة الطرق 100%' : '100% RTA Title Clearance'}
                    </h3>
                    <p className="text-xs text-[#d0c5af] mt-2 leading-relaxed">
                      Before intake, all vehicles undergo a comprehensive sovereign lien, traffic fine, bank hypothecation, and GCC structural history clearance. Titles are clean and immediately transferable.
                    </p>
                  </div>
                  <div className="mt-6 pt-3 bg-[#0a0e13]/60 px-3 py-2 rounded-lg flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#99907c]">CHASSIS INSPECTION</span>
                    <span className="text-[#58e7aa] font-bold">160-POINT CERTIFIED</span>
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="bg-[#1c2025] p-6 rounded-xl flex flex-col justify-between border border-white/5 shadow-md">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#00a6e0]/20 flex items-center justify-center text-[#7bd0ff] mb-4 text-xl">
                      🏛️
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {isRtl ? 'حساب إيداع وسيط من الدرجة الأولى' : 'Tier-1 UAE Escrow Custody'}
                    </h3>
                    <p className="text-xs text-[#d0c5af] mt-2 leading-relaxed">
                      Buyer funds are secured in regulated escrow custody through First Abu Dhabi Bank (FAB) or Emirates NBD. Funds release to dealership only upon confirmed RTA ownership certificate issuance.
                    </p>
                  </div>
                  <div className="mt-6 pt-3 bg-[#0a0e13]/60 px-3 py-2 rounded-lg flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#99907c]">FUNDS CUSTODY</span>
                    <span className="text-[#58e7aa] font-bold">CENTRAL BANK REGULATED</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Live Grounded Showroom Stock Grid */}
            <section className="flex flex-col gap-6">
              {/* Section Header & Filters */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#58e7aa] animate-pulse"></span>
                    <span className="text-xs uppercase tracking-wider text-[#58e7aa] font-semibold">
                      {isRtl ? 'مخزون المعرض المتاح حالياً' : 'Live Real-Time Inventory'}
                    </span>
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mt-1">
                    {isRtl ? 'تخصيصات الخزينة المتاحة' : 'Available Vault Allocations'}
                  </h2>
                </div>

                <div className="text-xs font-mono text-[#99907c]">
                  Showing <span className="text-white font-bold">{filteredInventory.length}</span> of{' '}
                  <span className="text-white font-bold">{dealer.inventory.length}</span> grounded units
                </div>
              </div>

              {/* Filter Chips Bar */}
              <div className="bg-[#181c21] p-2 rounded-xl flex items-center justify-between flex-wrap gap-2 border border-white/5">
                <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('ALL')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                      activeFilter === 'ALL'
                        ? 'bg-[#d4af37] text-[#101419]'
                        : 'bg-[#1c2025] text-[#d0c5af] hover:text-white'
                    }`}
                  >
                    All Current Stock ({dealer.inventory.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('GCC')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                      activeFilter === 'GCC'
                        ? 'bg-[#d4af37] text-[#101419]'
                        : 'bg-[#1c2025] text-[#d0c5af] hover:text-white'
                    }`}
                  >
                    GCC Specs ({dealer.inventory.filter((i) => i.gccSpec !== false).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('SUPERCARS')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                      activeFilter === 'SUPERCARS'
                        ? 'bg-[#d4af37] text-[#101419]'
                        : 'bg-[#1c2025] text-[#d0c5af] hover:text-white'
                    }`}
                  >
                    Supercars & GT
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('SUVS')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                      activeFilter === 'SUVS'
                        ? 'bg-[#d4af37] text-[#101419]'
                        : 'bg-[#1c2025] text-[#d0c5af] hover:text-white'
                    }`}
                  >
                    Luxury SUVs
                  </button>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c2025] rounded-lg text-[#99907c] text-xs">
                  <span>↕</span>
                  <span>Sort: Price High-to-Low</span>
                </div>
              </div>

              {/* Vehicle Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredInventory.map((car: PublicListingItem) => {
                  const priceAed = Math.round(Number(car.price.amountFils) / 100);
                  const formattedPrice = priceAed.toLocaleString('en-US');
                  const monthlyEstimate = Math.round(priceAed / 60).toLocaleString('en-US');
                  const heroImg = car.media[0]?.url || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800';

                  return (
                    <div
                      key={car.id}
                      className="bg-[#1c2025] rounded-xl overflow-hidden shadow-xl flex flex-col group hover:-translate-y-1 transition-all duration-300 border border-white/[0.07]"
                    >
                      {/* Image Frame */}
                      <div className="relative aspect-[16/10] bg-[#0a0e13] overflow-hidden">
                        <img
                          src={heroImg}
                          alt={car.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#101419] via-transparent to-transparent opacity-80"></div>

                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                          <span className="px-2 py-0.5 rounded bg-[#0a0e13]/90 backdrop-blur-md text-[#58e7aa] font-mono text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#58e7aa]"></span> GCC Spec
                          </span>
                        </div>

                        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between font-mono text-xs text-white">
                          <span className="flex items-center gap-1 text-[11px]">
                            <span>⏱️</span>
                            {car.mileageKm ? `${car.mileageKm.toLocaleString()} KM` : 'Delivery KM'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#262a30]/90 text-[10px] text-[#58e7aa] font-medium border border-white/5">
                            Chassis Cleared
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 flex flex-col justify-between flex-grow">
                        <div>
                          <div className="flex items-center justify-between text-[#99907c] text-[11px] uppercase tracking-wider mb-1">
                            <span>{car.year} Model</span>
                            <span className="text-[#58e7aa]">RTA Verified</span>
                          </div>
                          <h3 className="text-sm font-bold text-white group-hover:text-[#d4af37] transition-colors line-clamp-1">
                            {car.title}
                          </h3>

                          {/* Spec Strip */}
                          <div className="grid grid-cols-3 gap-1 my-3 py-1.5 bg-[#181c21] rounded-lg text-center text-xs border border-white/5">
                            <div className="flex flex-col">
                              <span className="text-[#99907c] text-[10px] uppercase">Spec</span>
                              <span className="font-mono text-white text-[11px] font-medium">GCC Official</span>
                            </div>
                            <div className="flex flex-col border-x border-white/5">
                              <span className="text-[#99907c] text-[10px] uppercase">Engine</span>
                              <span className="font-mono text-white text-[11px] font-medium">Bespoke</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[#99907c] text-[10px] uppercase">Status</span>
                              <span className="font-mono text-[#58e7aa] text-[11px] font-medium">Available</span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div className="pt-2 border-t border-white/5 flex flex-col gap-3">
                          <div className="flex items-baseline justify-between">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-[#99907c] uppercase tracking-wider">
                                {isRtl ? 'السعر النقدي' : 'Cash Price'}
                              </span>
                              <div className="flex items-baseline gap-1">
                                <span className="font-mono text-xs text-[#d4af37] font-bold">AED</span>
                                <span className="text-xl font-bold text-white">{formattedPrice}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-[#99907c] uppercase tracking-wider">
                                {isRtl ? 'تقدير بنكي' : 'Estimated Bank Rate'}
                              </span>
                              <span className="font-mono text-xs text-[#d0c5af] block">
                                AED {monthlyEstimate} / mo
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Link
                              href={`/cars/${car.slug}`}
                              className="py-2 rounded-lg bg-[#262a30] text-white text-xs text-center hover:bg-[#31353b] transition-colors font-medium border border-white/5"
                            >
                              {isRtl ? 'فحص المواصفات' : 'Inspect Spec'}
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleOpenBooking(car.title)}
                              className="py-2 rounded-lg bg-[#d4af37] text-[#101419] text-xs font-bold hover:bg-[#f2ca50] transition-colors"
                            >
                              {isRtl ? 'حجز الشاسيه' : 'Reserve Chassis'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Section 4: Collector Testimonials & Institutional Audits */}
            <section className="bg-[#181c21] rounded-2xl p-6 lg:p-8 shadow-xl border border-white/[0.07]">
              <div className="mb-6">
                <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
                  {isRtl ? 'شهادات التحقق المؤسسي' : 'Institutional Proof of Delivery'}
                </span>
                <h2 className="text-xl lg:text-2xl font-bold text-white mt-1">
                  {isRtl ? 'سجل المعاملات والتقييمات السيادية' : 'Verified Collector Exchange Audits'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1c2025] rounded-xl p-5 border border-white/5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center text-[#d4af37] text-xs">★★★★★</div>
                      <span className="px-2 py-0.5 rounded-full bg-[#262a30] text-[10px] text-[#58e7aa] font-mono">
                        DIFC Escrow Verified
                      </span>
                    </div>
                    <p className="text-xs text-[#d0c5af] italic leading-relaxed mb-4">
                      "Acquired a Porsche 911 GT3 RS with zero title delays. Escrow deposit via Emirates NBD released strictly upon Tasjeel ownership issuance. Sovereign-grade standard."
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#262a30] flex items-center justify-center font-bold text-xs text-[#d4af37]">
                      T.N.
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">Tariq Al-Nuaimi</span>
                      <span className="text-[10px] text-[#99907c]">DIFC Collector Office, Dubai</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1c2025] rounded-xl p-5 border border-white/5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center text-[#d4af37] text-xs">★★★★★</div>
                      <span className="px-2 py-0.5 rounded-full bg-[#262a30] text-[10px] text-[#58e7aa] font-mono">
                        Export Carnet Cleared
                      </span>
                    </div>
                    <p className="text-xs text-[#d0c5af] italic leading-relaxed mb-4">
                      "Their classic workshop documented dyno and compression tests on our Mercedes 560 SEC prior to delivery in Abu Dhabi. Genuine OEM craftsmanship stamped in Germany."
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#262a30] flex items-center justify-center font-bold text-xs text-[#7bd0ff]">
                      K.N.
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">H.E. Dr. K. Al-Nahyan</span>
                      <span className="text-[10px] text-[#99907c]">Al Maryah Island, Abu Dhabi</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1c2025] rounded-xl p-5 border border-white/5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center text-[#d4af37] text-xs">★★★★★</div>
                      <span className="px-2 py-0.5 rounded-full bg-[#262a30] text-[10px] text-[#58e7aa] font-mono">
                        KSA Customs Dispatched
                      </span>
                    </div>
                    <p className="text-xs text-[#d0c5af] italic leading-relaxed mb-4">
                      "Cross-border transaction handled with surgical accuracy. Sourced an AMG GT Black Series, secured closed-carrier transport to Riyadh, and registered SASO conformity."
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#262a30] flex items-center justify-center font-bold text-xs text-[#d4af37]">
                      F.R.
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">Faisal Al-Rasheed</span>
                      <span className="text-[10px] text-[#99907c]">Diriyah Heritage Office, Riyadh</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Institutional Escrow Settlement Architecture */}
            <section className="bg-[#1c2025] rounded-2xl p-6 lg:p-8 shadow-xl border border-white/[0.07]">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#d4af37] text-base">🛡️</span>
                    <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider">
                      {isRtl ? 'الامتثال المصرفي الإماراتي' : 'UAE Banking Compliance'}
                    </span>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-white">
                    {isRtl ? 'هندسة التسوية عبر حساب الضمان المؤسسي' : 'Institutional Escrow Settlement Architecture'}
                  </h3>
                  <p className="text-xs text-[#d0c5af] mt-2 leading-relaxed">
                    Transactions over AED 200,000 route through an independent Central Bank-licensed custodial vault. Your payment is quarantined in a neutral escrow holding until official RTA transfer certificates are stamped in your name.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[#58e7aa] text-xs">🔒</span>
                      <span className="text-xs text-white font-medium">Emirates NBD Escrow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#58e7aa] text-xs">🛡️</span>
                      <span className="text-xs text-white font-medium">FAB Custody Protocol</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#58e7aa] text-xs">🧾</span>
                      <span className="text-xs text-white font-medium">VAT & Customs Cleared</span>
                    </div>
                  </div>
                </div>

                {/* Escrow Steps Visual */}
                <div className="w-full lg:w-auto bg-[#181c21] p-6 rounded-xl shadow-inner flex flex-col gap-4 min-w-[320px] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#d4af37] text-[#101419] flex items-center justify-center font-mono text-xs font-bold">
                      1
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">Mutual Agreement & Chassis Hold</span>
                      <span className="text-[11px] text-[#99907c]">10% Holding Escrow Deposit</span>
                    </div>
                  </div>
                  <div className="w-0.5 h-3 bg-white/10 ml-3.5"></div>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#d4af37] text-[#101419] flex items-center justify-center font-mono text-xs font-bold">
                      2
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">Tasjeel On-Site Physical Audit</span>
                      <span className="text-[11px] text-[#99907c]">Full lift pass & title clearance test</span>
                    </div>
                  </div>
                  <div className="w-0.5 h-3 bg-white/10 ml-3.5"></div>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#58e7aa] text-[#003824] flex items-center justify-center font-mono text-xs font-bold">
                      3
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">RTA Title Pass & Release</span>
                      <span className="text-[11px] text-[#58e7aa]">Immediate keys & transfer certificate</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Interactive Modal: Schedule Showroom VIP Visit */}
      {isModalOpen && (
        <div
          id="visitModal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <div className="bg-[#181c21] w-full max-w-xl rounded-2xl p-6 lg:p-8 shadow-2xl relative border border-white/10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#d4af37] font-semibold">
                  {dealer.displayName} Concierge
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {isRtl ? 'حجز موعد بالمعرض والخزينة' : 'Book Showroom & Vault Appointment'}
                </h3>
                <p className="text-xs text-[#99907c] mt-1">
                  {dealer.contact.address} • Dedicated parking & private lift viewing reserved.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-[#99907c] hover:text-white bg-[#1c2025] transition-colors"
              >
                ✕
              </button>
            </div>

            {modalSuccess ? (
              <div className="p-6 rounded-xl bg-[#58e7aa]/10 border border-[#58e7aa]/30 text-center">
                <span className="text-3xl block mb-2">✅</span>
                <h4 className="text-base font-bold text-white mb-1">
                  {isRtl ? 'تم تأكيد طلب الموعد' : 'VIP Appointment Requested'}
                </h4>
                <p className="text-xs text-[#58e7aa]">
                  {isRtl
                    ? 'سيتواصل معك مدير علاقات كبار الشخصيات بالمعرض خلال 15 دقيقة.'
                    : `A ${dealer.displayName} VIP Concierge manager will contact you within 15 minutes.`}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-[#99907c] font-semibold">
                      {isRtl ? 'الاسم الكريم' : 'Your Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Sheikh / Dr. / Mr."
                      className="px-3 py-2.5 rounded-lg bg-[#1c2025] text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#d4af37] border border-white/5"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-[#99907c] font-semibold">
                      {isRtl ? 'رقم الهاتف / واتساب' : 'UAE Mobile / WhatsApp'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+971 50 000 0000"
                      className="px-3 py-2.5 rounded-lg bg-[#1c2025] text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#d4af37] border border-white/5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-[#99907c] font-semibold">
                      {isRtl ? 'التاريخ المفضل' : 'Preferred Date'}
                    </label>
                    <input
                      type="date"
                      required
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="px-3 py-2.5 rounded-lg bg-[#1c2025] text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#d4af37] border border-white/5"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-[#99907c] font-semibold">
                      {isRtl ? 'الفترة الزمنية المفضلة' : 'Preferred Time Slot'}
                    </label>
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="px-3 py-2.5 rounded-lg bg-[#1c2025] text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#d4af37] border border-white/5"
                    >
                      <option>10:00 AM - 12:00 PM (Morning Viewing)</option>
                      <option>02:00 PM - 04:00 PM (Afternoon Viewing)</option>
                      <option>05:00 PM - 07:30 PM (Evening VIP Bay)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-[#99907c] font-semibold">
                    {isRtl ? 'شاسيه السيارة المستهدفة' : 'Vehicle Chassis of Interest'}
                  </label>
                  <select
                    value={selectedChassis}
                    onChange={(e) => setSelectedChassis(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-[#1c2025] text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#d4af37] border border-white/5"
                  >
                    {dealer.inventory.map((i) => (
                      <option key={i.id} value={i.title}>
                        {i.title}
                      </option>
                    ))}
                    <option value="General Vault Tour">General Vault Tour & Classic Collection</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 p-3 bg-[#1c2025] rounded-lg text-[#99907c] text-xs border border-white/5">
                  <span className="text-[#58e7aa]">✓</span>
                  <span>Complimentary Tasjeel pre-purchase lift inspection included during visit.</span>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg bg-[#1c2025] text-[#99907c] hover:text-white transition-colors text-xs"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg bg-[#d4af37] text-[#101419] font-bold text-xs hover:bg-[#f2ca50] transition-all shadow-md shadow-[#d4af37]/20"
                  >
                    {isRtl ? 'تأكيد موعد كبار الشخصيات' : 'Confirm VIP Appointment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full bg-[#0a0e13] border-t border-white/[0.07] text-[#d0c5af]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <span className="text-base uppercase tracking-wider text-white font-bold">
                Automotive<span className="text-[#d4af37]">.OS</span>
              </span>
              <p className="text-xs text-[#99907c] max-w-sm leading-relaxed">
                The benchmark sovereign digital infrastructure for fine collector automobiles, hypercars, and certified pre-owned institutional inventory in the United Arab Emirates.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="px-3 py-1 rounded-lg bg-[#181c21] border border-white/10 text-[#d4af37] text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <span>✓</span> RTA Certified Dealer Portal
                </div>
                <div className="px-3 py-1 rounded-lg bg-[#181c21] border border-white/10 text-[#99907c] text-[10px] font-semibold uppercase tracking-wider">
                  DED License #984210
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <span className="uppercase tracking-widest text-white font-semibold mb-1">Inventory</span>
              <span className="text-[#99907c]">Hypercars & Special Projects</span>
              <span className="text-[#99907c]">Classic & Historical</span>
              <span className="text-[#99907c]">GCC Specification Only</span>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <span className="uppercase tracking-widest text-white font-semibold mb-1">Emirates Hubs</span>
              <span className="text-[#99907c]">Dubai International Financial Centre</span>
              <span className="text-[#99907c]">Abu Dhabi - Al Maryah Island</span>
              <span className="text-[#99907c]">Sharjah Auto City Hub</span>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <span className="uppercase tracking-widest text-white font-semibold mb-1">Compliance</span>
              <span className="text-[#99907c]">Roads and Transport Authority</span>
              <span className="text-[#99907c]">Escrow Custody Services</span>
              <span className="text-[#99907c]">Export Customs & Carnet ATA</span>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#99907c]">
            <span>© 2025 Automotive OS FZ-LLC. All rights reserved. Sovereign UAE automotive marketplace exchange.</span>
            <div className="flex items-center gap-6">
              <span>Privacy Policy</span>
              <span>Terms of Brokerage</span>
              <span>Security & AML</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
