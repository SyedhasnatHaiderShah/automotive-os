'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Car,
  Globe,
  Fingerprint,
  CheckCircle2,
  Check,
  Phone,
  Landmark,
  ShieldCheck,
  MapPin,
  Calendar,
  Share2,
  Edit,
  Award,
  TrendingUp,
  Clock,
  Copy,
  Mail,
  Home,
  Star,
  ArrowRight,
  Gauge,
  FileCheck,
  Gavel,
  History,
  Building,
} from 'lucide-react';

type Tab = 'overview' | 'identity' | 'alerts' | 'consignment';

export default function UserProfileDossierPage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [copiedUid, setCopiedUid] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [showSecurityLogs, setShowSecurityLogs] = useState(false);

  const isArabic = locale === 'ar';

  const handleCopyUid = () => {
    navigator.clipboard?.writeText('108-941-209');
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleShareGarage = () => {
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  return (
    <div
      id="dossier-root"
      dir={isArabic ? 'rtl' : 'ltr'}
      className="bg-surface font-body text-on-surface antialiased min-h-screen flex flex-col justify-between selection:bg-primary selection:text-on-primary"
    >
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-2xl">
        <div className="h-20 max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-on-primary transition-all shadow-md">
                <Car className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-lg font-bold uppercase tracking-wider text-on-surface">
                  Automotive<span className="text-primary font-bold ml-1">OS</span>
                </span>
                <span className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant">
                  {isArabic ? 'البوابة الرقمية لدولة الإمارات' : 'UAE Digital Portal'}
                </span>
              </div>
            </Link>
            <div className="hidden xl:flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-tertiary/20">
              <ShieldCheck className="w-4 h-4 text-tertiary" />
              <span className="text-[11px] font-mono text-tertiary uppercase tracking-wider font-semibold">
                {isArabic ? 'متوافق مع الهوية الرقمية UAE PASS' : 'UAE PASS Ready'}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-surface-container-lowest/80 p-1.5 rounded-xl border border-outline-variant/20">
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              {isArabic ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              UAE PASS
            </Link>
            <Link
              href="/account/settings"
              className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              {isArabic ? 'مركز الأمان' : 'Security Center'}
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              {isArabic ? 'مكتب الكونسيرج' : 'Concierge Support'}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20">
              <Lock className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs text-on-surface-variant">256-BIT SSL</span>
            </div>
            <button
              onClick={() => setLocale(isArabic ? 'en' : 'ar')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors text-xs font-medium"
              type="button"
            >
              <Globe className="w-4 h-4" />
              <span>{isArabic ? 'English' : 'العربية'}</span>
            </button>
            <Link
              href="/account/profile"
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold shadow-md hover:scale-105 transition-transform"
            >
              <Shield className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-20 bg-surface flex-1 flex flex-col">
        <div className="relative w-full overflow-hidden">
          <div className="absolute -top-32 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-48 right-10 w-80 h-80 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 flex flex-col gap-8 relative z-10">
            {/* VIP Profile Header Banner */}
            <section className="bg-surface-container rounded-2xl shadow-xl border border-outline-variant/20 overflow-hidden relative">
              {/* Top decorative banner */}
              <div
                className="relative h-44 sm:h-52 w-full bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC9_fYNtfcSit7ucVz-V_LoyPQbVaYPexa0d4JU6Mzg1nyXOGHeekUgh-0K2bCgROUN3aZWY-gygPqvXQ98Uenu7N10RmRAdZThN0iuPghxl0wfro34LrtqtIxhjVaFcadQ3vzobA91JwKU8IYhr7OSakfC8diL927PQTJhKqrVWWBU5LPxYlpfa0V7qAAUL17PdVjvMnIY9JW1YWeurc6et2Pn7aQPtJ8ZIcMa9eBKMmAdt14TUEJw')",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/60 to-transparent" />
                {/* Floating UID badge */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 bg-surface-container-lowest/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-outline-variant/30 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                  <span className="font-mono text-xs text-on-surface uppercase tracking-wider font-semibold">
                    UID: 784-1982-901428-1
                  </span>
                </div>
              </div>

              {/* Identity Bar with Negative Offset Avatar */}
              <div className="px-6 lg:px-8 pb-6 -mt-16 sm:-mt-20 relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
                  {/* Avatar with Gold Halo */}
                  <div className="relative shrink-0">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-primary via-primary-container to-surface-bright shadow-2xl">
                      <img
                        className="w-full h-full object-cover rounded-full bg-surface-container-highest"
                        alt="Dr. Tariq Al-Hashimi"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXj3mE7xY6Ce29c2bKeX1LUX1e7i1_C34zznEZoBAEzV5tiHx00j3A-OuwN17a7lkDpLNHDAwWmnx-OZ8uLkSJwhc5sEd52ELqcRxE3jGK09Wozh3tIPnpq2GuLEZSSYL9CmCgCzeSR5ds6q7XrlQ4ZJIbagbO4nSenJAYBTxjLcG3tw90aTDDI5G8gNv4kNe6uJsCScvkT-rBjXz6Ij8ACZ-V54t56BUky7wQZWUFmbLzsHB6yNXs"
                      />
                    </div>
                    {/* UAE PASS Verified Checkmark */}
                    <div
                      className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-lg border border-tertiary/40"
                      title="UAE PASS Biometric Verified"
                    >
                      <div className="w-6 h-6 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>
                  </div>

                  {/* Titles & Meta */}
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="font-display text-2xl lg:text-3xl font-bold text-on-surface">
                        {isArabic ? 'د. طارق الهاشمي' : 'Dr. Tariq Al-Hashimi'}
                      </h1>
                      <span className="text-sm text-on-surface-variant font-medium">
                        {isArabic ? '(Dr. Tariq Al-Hashimi)' : '(د. طارق الهاشمي)'}
                      </span>
                      {/* VIP Collector Pill */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 shadow-sm font-mono text-[10px] tracking-widest uppercase font-bold">
                        <Award className="w-3.5 h-3.5" />
                        {isArabic ? 'مقتني النخبة المستوى 1' : 'VIP Tier-1 Collector'}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant">
                      {isArabic ? 'مالك أسطول ومقتني سيارات خارقة خاصة' : 'Private Hypercar Collector & Fleet Owner'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-on-surface-variant mt-1 text-xs">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {isArabic ? 'عقارات جميرا للجولف، دبي، الإمارات' : 'Jumeirah Golf Estates, Dubai, UAE'}
                      </span>
                      <span className="hidden sm:inline text-outline-variant">•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-tertiary" />
                        {isArabic ? 'عضو منذ نوفمبر 2023' : 'Client Member since Nov 2023'}
                      </span>
                      <span className="hidden sm:inline text-outline-variant">•</span>
                      <span className="flex items-center gap-1 text-tertiary font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {isArabic ? 'رخصة الأسطول التجاري DED نشطة' : 'DED Commercial Fleet License Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-end">
                  <Link
                    href="/account/settings"
                    className="h-10 px-4 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-all flex items-center gap-2 shadow-sm text-xs font-semibold border border-outline-variant/30"
                  >
                    <Edit className="w-4 h-4" />
                    <span>{isArabic ? 'تعديل الملف' : 'Edit Profile'}</span>
                  </Link>
                  <button
                    id="share-garage-btn"
                    onClick={handleShareGarage}
                    type="button"
                    className="h-10 px-4 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-all flex items-center gap-2 shadow-sm text-xs font-semibold border border-outline-variant/30"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{isArabic ? 'مشاركة المرآب' : 'Share Garage'}</span>
                  </button>
                  <button
                    id="audit-cert-btn"
                    onClick={() => setShowCertModal(true)}
                    type="button"
                    className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-fixed-dim text-on-primary font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-primary/20 text-xs"
                  >
                    <Award className="w-4 h-4" />
                    <span>{isArabic ? 'شهادة التدقيق' : 'Audit Certificate'}</span>
                  </button>
                </div>
              </div>

              {shareToast && (
                <div className="mx-6 mb-4 p-3 bg-tertiary/20 border border-tertiary text-tertiary rounded-lg text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isArabic ? 'تم نسخ رابط مشاركة المرآب السيادي بنجاح!' : 'Sovereign Garage portfolio link copied to clipboard!'}</span>
                </div>
              )}
            </section>

            {/* Profile Metrics Bar (4 bespoke metric cards) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Virtual Garage */}
              <div className="bg-surface-container rounded-xl p-5 flex flex-col justify-between shadow-md border border-outline-variant/20 hover:bg-surface-container-high transition-all group">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-mono text-[10px] uppercase tracking-wider font-bold">
                    {isArabic ? 'المرآب الافتراضي' : 'Virtual Garage'}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Car className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl text-on-surface font-bold">4</span>
                    <span className="text-xs text-on-surface-variant">
                      {isArabic ? 'مركبات مسجلة' : 'Vehicles Registered'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-tertiary text-xs font-semibold">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'تسجيل شامل بنسبة 100% لدى RTA' : '100% Comprehensive RTA Reg'}</span>
                  </div>
                </div>
              </div>

              {/* Metric 2: Total Portfolio Value */}
              <div className="bg-surface-container rounded-xl p-5 flex flex-col justify-between shadow-md border border-outline-variant/20 hover:bg-surface-container-high transition-all group">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-mono text-[10px] uppercase tracking-wider font-bold">
                    {isArabic ? 'إجمالي قيمة المحفظة' : 'Total Portfolio Value'}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Landmark className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-xs text-primary font-bold">AED</span>
                    <span className="font-display text-2xl text-on-surface font-bold">8,950,000</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-tertiary text-xs font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{isArabic ? '+6.4% نمو في سوق دول الخليج' : '+6.4% GCC Market Appreciation'}</span>
                  </div>
                </div>
              </div>

              {/* Metric 3: Active Inquiries / Escrow */}
              <div className="bg-surface-container rounded-xl p-5 flex flex-col justify-between shadow-md border border-outline-variant/20 hover:bg-surface-container-high transition-all group">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-mono text-[10px] uppercase tracking-wider font-bold">
                    {isArabic ? 'الطلبات النشطة / الضمان' : 'Active Inquiries / Escrow'}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl text-secondary font-bold">1</span>
                    <span className="text-xs text-on-surface">
                      {isArabic ? 'صفقة في حساب الضمان' : 'Deal in Escrow'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-2 truncate">
                    Porsche GT3 RS (SilberArrows FZCO)
                  </p>
                </div>
              </div>

              {/* Metric 4: AECB Credit Bureau */}
              <div className="bg-surface-container rounded-xl p-5 flex flex-col justify-between shadow-md border border-outline-variant/20 hover:bg-surface-container-high transition-all group">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-mono text-[10px] uppercase tracking-wider font-bold">
                    {isArabic ? 'الاتحاد للمعلومات الائتمانية AECB' : 'AECB Credit Bureau'}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
                    <Gauge className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl text-tertiary font-bold">842</span>
                    <span className="font-mono text-xs text-on-surface-variant">/ 900</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-2 h-2 rounded-full bg-tertiary" />
                    <span className="text-xs text-on-surface font-semibold">
                      {isArabic ? 'المستوى السيادي الأول - ممتاز' : 'Tier-1 Sovereign Excellent'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Tabbed Navigation Bar */}
            <section className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-outline-variant/20">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-2 ${
                  activeTab === 'overview'
                    ? 'bg-surface-container-high text-primary shadow-sm border border-primary/30'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>{isArabic ? 'نظرة عامة والمرآب' : 'Overview & Garage'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('identity')}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-2 ${
                  activeTab === 'identity'
                    ? 'bg-surface-container-high text-primary shadow-sm border border-primary/30'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <Fingerprint className="w-4 h-4" />
                <span>{isArabic ? 'الهوية المعتمدة وبطاقة الهوية' : 'Verified Identity & Emirates ID'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('alerts')}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-2 ${
                  activeTab === 'alerts'
                    ? 'bg-surface-container-high text-primary shadow-sm border border-primary/30'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{isArabic ? 'عمليات البحث المحفوظة والتنبيهات' : 'Saved Searches & Alerts'}</span>
                <span className="w-5 h-5 rounded-full bg-surface-container-highest text-[10px] font-mono flex items-center justify-center text-on-surface">
                  3
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('consignment')}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-2 ${
                  activeTab === 'consignment'
                    ? 'bg-surface-container-high text-primary shadow-sm border border-primary/30'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>{isArabic ? 'الإيداع والتفويضات' : 'Consignment & Mandates'}</span>
              </button>
            </section>

            {/* Main Content 2-Column Layout */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Personal & Contact Dossier (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* Legal Identity Card */}
                <div className="bg-surface-container rounded-xl p-6 shadow-md border border-outline-variant/20 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-5 h-5 text-primary" />
                      <h3 className="font-display text-base font-bold text-on-surface">
                        {isArabic ? 'ملف الهوية القانونية' : 'Legal Identity Dossier'}
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-tertiary/20 text-tertiary font-mono text-[10px] uppercase font-bold flex items-center gap-1 border border-tertiary/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                      UAE PASS Level 3
                    </span>
                  </div>

                  {/* Identity Specs Data List */}
                  <div className="flex flex-col gap-3 pt-1">
                    {/* Name in AR & EN */}
                    <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1 border border-outline-variant/10">
                      <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold">
                        {isArabic ? 'الاسم القانوني الكامل' : 'Full Legal Name'}
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-on-surface font-semibold">
                          Dr. Tariq Mohammed Al-Hashimi
                        </span>
                        <span className="text-sm text-primary font-bold" dir="rtl">
                          د. طارق محمد الهاشمي
                        </span>
                      </div>
                    </div>

                    {/* Unified ID (UID) & EID Expiry */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface-container-low p-3.5 rounded-lg flex flex-col gap-1 border border-outline-variant/10">
                        <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold">
                          {isArabic ? 'الرقم الموحد (UID)' : 'Unified ID (UID)'}
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-on-surface font-bold" id="uid-display">
                            108-941-209
                          </span>
                          <button
                            id="copy-uid-btn"
                            type="button"
                            onClick={handleCopyUid}
                            className="text-on-surface-variant hover:text-primary transition-colors"
                            title="Copy UID"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {copiedUid && (
                          <span className="text-[10px] font-mono text-tertiary font-bold">
                            {isArabic ? 'تم النسخ!' : 'COPIED!'}
                          </span>
                        )}
                      </div>

                      <div className="bg-surface-container-low p-3.5 rounded-lg flex flex-col gap-1 border border-outline-variant/10">
                        <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold">
                          {isArabic ? 'انتهاء بطاقة الهوية' : 'EID Expiry Date'}
                        </span>
                        <span className="font-mono text-xs text-tertiary font-bold">
                          Valid • 14 Dec 2027
                        </span>
                      </div>
                    </div>

                    {/* Verified Contact Details */}
                    <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-2 border border-outline-variant/10">
                      <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold">
                        {isArabic ? 'قنوات الاتصال الموثقة' : 'Verified Contact Channels'}
                      </span>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-on-surface-variant" />
                          <span className="font-mono text-xs text-on-surface font-semibold">
                            +971 50 882 1904
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-tertiary font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isArabic ? 'معتمد' : 'Verified'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-on-surface-variant" />
                          <span className="text-xs text-on-surface font-medium truncate max-w-[190px] sm:max-w-none">
                            tariq.alhashimi@emiratesholdings.ae
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-tertiary font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isArabic ? 'رئيسي' : 'Primary'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Stamp Card */}
                  <div className="p-3.5 rounded-lg bg-surface-container-lowest flex items-center justify-between border border-outline-variant/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary border border-tertiary/20">
                        <Gavel className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-on-surface">
                          {isArabic ? 'سجل الهوية الاتحادية' : 'Federal Identity Registry'}
                        </span>
                        <span className="font-mono text-[10px] text-on-surface-variant">
                          KYC Biometrics Linked 18-NOV-2024
                        </span>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-tertiary" />
                  </div>
                </div>

                {/* Residence & Dispatch Hub */}
                <div className="bg-surface-container rounded-xl p-6 shadow-md border border-outline-variant/20 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-primary" />
                      <h3 className="font-display text-base font-bold text-on-surface">
                        {isArabic ? 'مقر الإقامة ونقطة الإرسال' : 'Residence & Dispatch Hub'}
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold">
                      {isArabic ? 'نقطة الأسطول الرئيسية' : 'Primary Fleet Point'}
                    </span>
                  </div>

                  {/* Static Map visual module with Makani info */}
                  <div
                    className="w-full h-36 bg-cover bg-center rounded-lg relative overflow-hidden shadow-inner flex items-end p-4 border border-outline-variant/20"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBtWp3qhc-ZHqd77fO7ekygkjVRviMOON8DmgzqdnfHRmHTntI0R-mXRn8C1ydgMwO52_v_liKSXkgdnBlg4q1i0sbn0NyTuspMLUaFUqhtoB2oyaqXedhdK-_GXyxYcpRqiV9EfKIx3UkX4NCjLexj0LvJuOGvL1dyvMbgsXh4LUUY1l7_etwuWeMf4CeHY26VYguFvaBOsC24xX4k7AkFiJXGALyQpZVb-qEwn7IX-HYxs2NfMSU5')",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/30 to-transparent" />
                    <div className="relative z-10 flex items-center gap-2 bg-surface-container-high/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-primary/20">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-on-surface">
                        Whispering Pines Enclave
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant shrink-0 mt-0.5 border border-outline-variant/20">
                      <Building className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-on-surface">
                        Villa 42, Whispering Pines
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Jumeirah Golf Estates, Dubai, United Arab Emirates
                      </span>
                      <span className="font-mono text-[10px] text-primary mt-1 font-bold">
                        Makani Number: 18274 81923
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preferred Dealership Concierge */}
                <div className="bg-surface-container rounded-xl p-6 shadow-md border border-outline-variant/20 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      <h3 className="font-display text-base font-bold text-on-surface">
                        {isArabic ? 'شريك الوكالة والكونسيرج' : 'Concierge Dealer Partner'}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[10px] uppercase font-bold">
                      {isArabic ? 'معين' : 'Designated'}
                    </span>
                  </div>

                  <div className="p-4 rounded-lg bg-surface-container-low flex items-center gap-4 border border-outline-variant/20">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0 border border-primary/30">
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-on-surface truncate">
                        SilberArrows Luxury FZCO
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Al Quoz 1, Dubai • Lead Advisor: Marcus Vance
                      </span>
                      <span className="font-mono text-xs text-tertiary mt-1 font-bold">
                        Direct Line: +971 4 380 5522
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Virtual Garage Preview & Activity Feed (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* Registered Garage Vehicles Section */}
                <div className="bg-surface-container rounded-xl p-6 shadow-md border border-outline-variant/20 flex flex-col gap-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-primary" />
                      <h3 className="font-display text-base font-bold text-on-surface">
                        {isArabic ? 'محفظة المرآب النشطة' : 'Active Garage Portfolio'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-mono text-[10px] font-bold">
                        3 of 4 Shown
                      </span>
                    </div>
                    <Link
                      href="/account/garage"
                      className="text-primary hover:text-primary-fixed text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>{isArabic ? 'عرض المواصفات الكاملة' : 'View Full Spec Sheets'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Vehicle Cards List */}
                  <div className="grid grid-cols-1 gap-4" id="garage-vehicles-list">
                    {/* Vehicle 1: Porsche 911 GT3 RS Weissach */}
                    <div className="bg-surface-container-low rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-outline-variant/20 hover:bg-surface-container-high transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="relative w-24 h-16 sm:w-28 sm:h-20 rounded-md overflow-hidden shrink-0 bg-surface-container-highest border border-outline-variant/30">
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            alt="2024 Porsche 911 GT3 RS"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCalB3gc9fXJJ-cJbiRtepJDEPCxi1zQY5rSbibetg9NeE1UTemV2ikYDcw-9oGKVYa71ae7Mtapt2qsM-DMWksfkpm8t1NWFIw7UpZM8phNOEtSPIalyIySxD36EFhWqwxz8gjmUYHx4slDt305KQJd1f_zHT2fVFq2SX78ucY6AUSlBt_lJHhqlHYOHrfdqahLxD3y-rkm7vz1-qjtY4Nnma8TIUeIZPy9zHUkj3Y2eNPlkHTuLhQ"
                          />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-surface-container-lowest/80 text-[10px] font-mono text-on-surface font-bold">
                            2024
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                              Porsche 911 GT3 RS
                            </h4>
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono uppercase font-bold">
                              Weissach
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-on-surface-variant text-xs mt-0.5">
                            <span className="bg-surface-container-highest px-1.5 py-0.5 rounded text-[11px] font-mono text-on-surface font-semibold">
                              DXB • R 911
                            </span>
                            <span>•</span>
                            <span>1,240 km</span>
                            <span>•</span>
                            <span>GCC Spec</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                        <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold">
                          {isArabic ? 'التقييم المعتمد' : 'Agreed Valuation'}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono text-xs text-primary font-bold">AED</span>
                          <span className="font-display text-base text-on-surface font-bold">1,420,000</span>
                        </div>
                        <span className="text-[11px] text-tertiary font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Fully Insured
                        </span>
                      </div>
                    </div>

                    {/* Vehicle 2: Ferrari 296 GTB Assetto Fiorano */}
                    <div className="bg-surface-container-low rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-outline-variant/20 hover:bg-surface-container-high transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="relative w-24 h-16 sm:w-28 sm:h-20 rounded-md overflow-hidden shrink-0 bg-surface-container-highest border border-outline-variant/30">
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            alt="2023 Ferrari 296 GTB"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbI4ZaR0017_1zJaqLGppiw_QZJc0-hPib-IWqTXamaZc8ibelhdn_1AqYJYSvi4nLtcQ3Tp4u9gzi5RTXYSXeVrm8tmIlg23vEecgT0fwSIJqS_tGLNV7Q8LEzjTx3k9XjzBAISlbuWGiizJ4xw086lZsuwJmmwG5WHVwnvi5t07hKWKsoQeKdAwN8qUepOH3rh2YWYxIz6R7PW1rtNBTEHUOab9J0f41LTZKBm3xpvk-Goaioh6n"
                          />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-surface-container-lowest/80 text-[10px] font-mono text-on-surface font-bold">
                            2023
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                              Ferrari 296 GTB
                            </h4>
                            <span className="px-2 py-0.5 rounded bg-secondary/20 text-secondary text-[10px] font-mono uppercase font-bold">
                              Assetto Fiorano
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-on-surface-variant text-xs mt-0.5">
                            <span className="bg-surface-container-highest px-1.5 py-0.5 rounded text-[11px] font-mono text-on-surface font-semibold">
                              DXB • W 765
                            </span>
                            <span>•</span>
                            <span>3,890 km</span>
                            <span>•</span>
                            <span>Al Tayer Spec</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                        <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold">
                          {isArabic ? 'التقييم المعتمد' : 'Agreed Valuation'}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono text-xs text-primary font-bold">AED</span>
                          <span className="font-display text-base text-on-surface font-bold">1,650,000</span>
                        </div>
                        <span className="text-[11px] text-tertiary font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Warranty 2028
                        </span>
                      </div>
                    </div>

                    {/* Vehicle 3: Mercedes-AMG G 63 */}
                    <div className="bg-surface-container-low rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-outline-variant/20 hover:bg-surface-container-high transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="relative w-24 h-16 sm:w-28 sm:h-20 rounded-md overflow-hidden shrink-0 bg-surface-container-highest border border-outline-variant/30">
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            alt="2024 Mercedes-AMG G 63"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPVKcZ3yD-oCHpRudLAkCC4JdYOt6aBvWyg87QR20wKWBsYWHxgGPXd3XITaCBC9-X-PIikoexfIG0Xq9moJETIP32hCjFNYzwkqGkn7qzZXjXEz2TigaI7vEcfLKoL1PogfJ9beTuoFrsr7iaoGFv52s3XDh2JESXG2Y7Q9am7sa7LEIz0WTGXXpz67TVLKAU5S3xDIRdWZ2UHMT6bUX-cGVNUU-71ZB7LfJ2n6iK9-2NzQCfk1sH"
                          />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-surface-container-lowest/80 text-[10px] font-mono text-on-surface font-bold">
                            2024
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                              Mercedes-AMG G 63
                            </h4>
                            <span className="px-2 py-0.5 rounded bg-surface-bright text-on-surface text-[10px] font-mono uppercase font-bold">
                              Magno Edition
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-on-surface-variant text-xs mt-0.5">
                            <span className="bg-surface-container-highest px-1.5 py-0.5 rounded text-[11px] font-mono text-on-surface font-semibold">
                              DXB • 663-4X4
                            </span>
                            <span>•</span>
                            <span>6,120 km</span>
                            <span>•</span>
                            <span>Gargash Spec</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                        <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold">
                          {isArabic ? 'التقييم المعتمد' : 'Agreed Valuation'}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono text-xs text-primary font-bold">AED</span>
                          <span className="font-display text-base text-on-surface font-bold">1,890,000</span>
                        </div>
                        <span className="text-[11px] text-tertiary font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Service Pack Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit & Transaction Activity Timeline */}
                <div className="bg-surface-container rounded-xl p-6 shadow-md border border-outline-variant/20 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" />
                      <h3 className="font-display text-base font-bold text-on-surface">
                        {isArabic ? 'سجل التدقيق ونشاط المعاملات' : 'Audit & Transaction Activity'}
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] text-tertiary flex items-center gap-1 uppercase font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                      {isArabic ? 'بيانات حية' : 'Live Telemetry'}
                    </span>
                  </div>

                  {/* Timeline list */}
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-highest">
                    {/* Item 1: Escrow Deposit */}
                    <div className="relative group">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-secondary flex items-center justify-center ring-4 ring-surface-container">
                        <Lock className="w-2.5 h-2.5 text-on-secondary" />
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1 border border-outline-variant/10 group-hover:bg-surface-container-high transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-on-surface">
                            {isArabic ? 'تأكيد إيداع الضمان (350,000 درهم)' : 'Escrow Deposit Confirmed (AED 350,000)'}
                          </span>
                          <span className="font-mono text-[11px] text-on-surface-variant">
                            Today, 11:42 AM
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {isArabic
                            ? 'دفعة مقدمة مؤمنة ومحفوظة في حساب ضمان بنك الإمارات دبي الوطني #ENBD-8821 لصفقة بورش GT3 RS.'
                            : 'Secured down-payment held in Emirates NBD Escrow Trust #ENBD-8821 for 2024 Porsche GT3 RS acquisition via SilberArrows FZCO.'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded bg-surface-container-highest text-secondary text-[10px] font-mono">
                            ESCROW-REF: #UAE-992014
                          </span>
                          <span className="text-tertiary text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Bank Locked
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Item 2: Test Drive Scheduled */}
                    <div className="relative group">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center ring-4 ring-surface-container">
                        <Gauge className="w-2.5 h-2.5 text-on-primary" />
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1 border border-outline-variant/10 group-hover:bg-surface-container-high transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-on-surface">
                            {isArabic ? 'جدولة تجربة قيادة على حلبة دبي أوتودروم' : 'Private Track Test Scheduled at Dubai Autodrome'}
                          </span>
                          <span className="font-mono text-[11px] text-on-surface-variant">
                            Yesterday, 16:30
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {isArabic
                            ? 'تم حجز يوم تجربة لكبار الشخصيات لسيارة ماكلارين سينا هيكل رقم #042 بدعم من سائق قياس القيادة المعتمد.'
                            : 'VIP Track Day briefing booked for McLaren Senna Chassis #042 with certified telemetry driver support.'}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="text-primary font-semibold flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> 28 Nov 2024 • 09:00 AM
                          </span>
                          <span className="text-on-surface-variant">Lead Marshal: Capt. R. Mansoor</span>
                        </div>
                      </div>
                    </div>

                    {/* Item 3: UAE PASS KYC Refreshed */}
                    <div className="relative group">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-tertiary flex items-center justify-center ring-4 ring-surface-container">
                        <Check className="w-2.5 h-2.5 text-on-tertiary" />
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1 border border-outline-variant/10 group-hover:bg-surface-container-high transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-on-surface">
                            {isArabic ? 'إعادة التصديق البيومتري عبر UAE PASS' : 'Biometric KYC Re-attested via UAE PASS'}
                          </span>
                          <span className="font-mono text-[11px] text-on-surface-variant">
                            18 Nov 2024
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {isArabic
                            ? 'تم التحقق من التوقيع الرقمي لبطاقة الهوية والامتثال للسجل التجاري للمعاملات بملايين الدراهم.'
                            : 'Emirates ID digital signature & high-net-worth commercial registry compliance successfully verified for multi-million AED car transactions.'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-tertiary text-[11px] font-mono flex items-center gap-1 font-semibold">
                            <Check className="w-3 h-3" /> Signature ID: e7f-4421-uaepass-cert
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Floating Assurance Strip */}
            <section className="bg-surface-container-low rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md border border-outline-variant/20 text-on-surface-variant">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary border border-primary/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">
                    {isArabic ? 'حساب الضمان الرقمي للسيارات الفاخرة مشمول بالكامل' : 'UAE High-Value Automotive Digital Escrow Covered'}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    {isArabic ? 'متوافق مع البروتوكول التنظيمي لمصرف الإمارات المركزي' : 'Compliant with Central Bank of the UAE regulatory protocol for luxury assets.'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-tertiary font-bold">
                  TOKEN: VIP-TARIQ-911
                </span>
                <button
                  id="security-logs-btn"
                  type="button"
                  onClick={() => setShowSecurityLogs(!showSecurityLogs)}
                  className="px-4 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-semibold transition-colors border border-outline-variant/30"
                >
                  {isArabic ? 'سجلات الأمان' : 'Security Logs'}
                </button>
              </div>
            </section>

            {showSecurityLogs && (
              <div className="p-4 rounded-xl bg-surface-container border border-primary/30 text-xs font-mono space-y-1">
                <div className="text-primary font-bold">&gt;&gt;&gt; AUDIT TELEMETRY STREAM #DXB-90241</div>
                <div className="text-on-surface-variant">2026-10-23T09:14:00 GST | UAE PASS Token Handshake: OK (Level 3 Attested)</div>
                <div className="text-on-surface-variant">2026-10-23T11:42:00 GST | CBUAE Escrow IPP Ledger Lock: ACTIVE</div>
                <div className="text-tertiary">Zero-Trust Cryptographic Channel Verified • TLS 1.3 Strict</div>
              </div>
            )}
          </div>
        </div>

        {/* Audit Certificate Modal */}
        {showCertModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-surface-container-low border border-primary/40 p-6 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2 text-primary">
                  <Award className="w-5 h-5" />
                  <h4 className="font-display text-base font-bold text-on-surface">
                    {isArabic ? 'شهادة التدقيق والامتثال السيادي' : 'Sovereign Compliance & Audit Certificate'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="text-on-surface-variant hover:text-on-surface text-xs font-mono"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2 text-xs font-mono text-on-surface-variant bg-surface-container p-4 rounded-xl">
                <div>ISSUED TO: Dr. Tariq Al-Hashimi (UID 108-941-209)</div>
                <div>ENTITY: Emirates Private Holdings Ltd</div>
                <div>KYC STATUS: UAE PASS LEVEL 3 (ATTESTED)</div>
                <div>AECB SCORE: 842 / 900 (SOVEREIGN PRIME)</div>
                <div>GARAGE VALUATION: AED 8,950,000 (RTA VERIFIED)</div>
                <div>CBUAE ESCROW ID: AE02-0300-0019-2838</div>
                <div className="text-tertiary font-bold pt-2">HASH: 4F8A9129C009B8E31</div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-xs font-bold shadow"
                >
                  {isArabic ? 'إغلاق الشهادة' : 'Close Certificate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/20 shadow-2xl mt-auto">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-on-surface-variant">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-tertiary" />
                <span className="text-xs">
                  {isArabic
                    ? 'متوافق مع إطار الهوية الرقمية لدولة الإمارات'
                    : 'UAE Digital Identity Framework Compliant'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-primary" />
                <span className="text-xs">GCC Automotive Transaction Protocol v4.2</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <a
                href="tel:+97148002886"
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                VIP Concierge: +971 4 800 AUTO
              </a>
              <span className="text-outline-variant">|</span>
              <span>© 2025 Automotive OS LLC. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
