'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Building2,
  Car,
  Globe,
  Fingerprint,
  CheckCircle2,
  Check,
  Phone,
  Landmark,
  ShieldCheck,
  ChevronRight,
  Sliders,
  Copy,
  ArrowRight,
  Laptop,
  Smartphone,
  LogOut,
  AlertTriangle,
  Download,
  RotateCcw,
  MessageSquare,
  FileText,
  BadgeCheck,
  RefreshCw,
  Trash2,
} from 'lucide-react';

type SectionId = 'section-general' | 'section-security' | 'section-uae-pass' | 'section-banking' | 'section-privacy' | 'section-api';

export default function AccountSettingsPage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [activeSection, setActiveSection] = useState<SectionId>('section-general');

  // General Form
  const [firstName, setFirstName] = useState('Tariq');
  const [lastName, setLastName] = useState('Al-Hashimi');
  const [handle, setHandle] = useState('Tariq.Collector.DXB');
  const [affiliation, setAffiliation] = useState('Emirates Private Holdings Ltd');
  const [trn, setTrn] = useState('100-2490-5829-0003');
  const [currency, setCurrency] = useState<'AED' | 'USD' | 'EUR'>('AED');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Security & Sessions
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [uaePassMessage, setUaePassMessage] = useState<string | null>(null);
  const [terminatedSessions, setTerminatedSessions] = useState(false);

  // Banking
  const [copiedIban, setCopiedIban] = useState(false);
  const [certDownloaded, setCertDownloaded] = useState(false);

  // Privacy Toggles
  const [garageVisibility, setGarageVisibility] = useState(true);
  const [aecbRefresh, setAecbRefresh] = useState(true);
  const [whatsappComms, setWhatsappComms] = useState(true);

  // Danger Zone
  const [dangerModal, setDangerModal] = useState(false);
  const [deactivateSuccess, setDeactivateSuccess] = useState(false);

  const isArabic = locale === 'ar';

  const handleCopyIban = () => {
    navigator.clipboard?.writeText('AE02 0300 0019 2838 4810 992');
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2000);
  };

  const handleReauthUaePass = () => {
    setIsReauthenticating(true);
    setUaePassMessage(null);
    setTimeout(() => {
      setIsReauthenticating(false);
      setUaePassMessage(
        isArabic
          ? 'تم التحقق من الهوية الرقمية بنجاح عبر المستوى الثالث (Attested GST)'
          : 'UAE PASS Level 3 Attestation Verified Successfully (GST)'
      );
    }, 1000);
  };

  const handleTerminateSessions = () => {
    setTerminatedSessions(true);
    setTimeout(() => setTerminatedSessions(false), 4000);
  };

  const handleSaveChanges = () => {
    setSaveStatus(isArabic ? 'تم حفظ التغييرات بنجاح!' : 'Changes saved successfully!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleExportLedger = () => {
    const data = {
      patron: 'Tariq Al-Hashimi',
      reference: 'DXB-90241-HNWI',
      emiratesId: '784-1988-8291044-1',
      uid: 'UID 201-9840-10',
      compliance: 'Article 13 UAE PDPL Law No. 45/2021',
      escrowIban: 'AE02 0300 0019 2838 4810 992',
      disbursementBank: 'First Abu Dhabi Bank (FAB)',
      timestamp: new Date().toISOString(),
      keyHash: '9B2F7E41C0A983A19',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sovereign-audit-ledger-dxb-90241.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="settings-root"
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
                {isArabic ? 'الهوية الرقمية المباشرة: قريباً' : 'UAE PASS Live Rail: Coming Soon'}
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
              className="px-4 py-2 rounded-lg text-sm bg-surface-container-high text-primary font-semibold transition-colors"
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

      {/* Main Content Area */}
      <main className="w-full pt-20 bg-surface flex-1 flex flex-col">
        <div className="relative w-full overflow-hidden bg-surface-container-lowest pb-16">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
            {/* Breadcrumb & Status Pill Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <Link href="/" className="hover:text-on-surface transition-colors">
                  {isArabic ? 'مركز القيادة' : 'Command Hub'}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href="/account/garage" className="hover:text-on-surface transition-colors">
                  {isArabic ? 'بوابة كبار العملاء' : 'VIP Client Portal'}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-primary font-semibold">
                  {isArabic ? 'أمان الحساب والحوكمة' : 'Account Security & Governance'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary/10 border border-tertiary/20 text-tertiary">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                  <span className="font-mono text-xs font-semibold">
                    {isArabic ? 'هوية رقمية معتمدة المستوى 3' : 'UAE PASS LEVEL 3 VERIFIED'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-on-surface-variant font-mono text-xs">
                  <span>REF: DXB-90241-HNWI</span>
                </div>
              </div>
            </div>

            {/* Master Profile Heading Banner */}
            <div className="relative rounded-2xl bg-surface-container-low p-6 lg:p-8 shadow-xl border border-outline-variant/20 overflow-hidden mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-surface-container/60 to-transparent pointer-events-none" />
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-container-highest shadow-md border border-primary/20">
                      <img
                        className="w-full h-full object-cover"
                        alt="Tariq Al-Hashimi"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCoUItaxLvuKczUVi40F0RWIUlzH-fKHXA6lgRQIcJ8dEEFv50qqSV0bQn3FeYS0RbpZ3vygcff1MVxgD2wfR_aXgDOUKKFkvh9gpUCgkXcYrjoWlx6Mpi-z5ljwBSC-SAg3-3-hMoZD9I4bMQKMqfWdrmhFvu5_e2z2rOi-p_r9gTfdtE1le4Nfhm4XBCbOA9kqUUmouFVHCbVyXBQgNLpzpGoaoP_iq-uxgPgrB23l4WU5aesTZh"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg">
                      <BadgeCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="font-display text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
                        {isArabic ? 'طارق الهاشمي' : 'Tariq Al-Hashimi'}
                      </h1>
                      <span className="px-2.5 py-0.5 rounded bg-primary/20 text-primary font-mono text-[10px] uppercase font-bold tracking-wider">
                        {isArabic ? 'مقتني سيادي' : 'Patron Sovereign'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {isArabic
                        ? 'مشاريع الإمارات الخاصة القابضة ذ.م.م • شارع الشيخ زايد، وسط مدينة دبي'
                        : 'Emirates Private Holdings Ltd • Sheikh Zayed Rd, Downtown Dubai'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 font-mono text-xs text-on-surface-variant">
                      <span className="text-secondary flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> EID 784-1988-8291044-1
                      </span>
                      <span className="text-tertiary flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />{' '}
                        {isArabic ? 'حساب الضمان نشط' : 'Escrow Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Micro Metric Highlights */}
                <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
                  <div className="px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col min-w-[120px]">
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase">
                      {isArabic ? 'المحفظة' : 'Portfolio'}
                    </span>
                    <span className="font-display text-lg text-on-surface mt-0.5 font-bold">
                      14 <span className="text-xs font-normal text-on-surface-variant">{isArabic ? 'مركبة' : 'Vehicles'}</span>
                    </span>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col min-w-[120px]">
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase">
                      {isArabic ? 'خزينة الضمان' : 'Escrow Vault'}
                    </span>
                    <span className="font-display text-lg text-primary mt-0.5 font-bold">
                      AED 4.2M
                    </span>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col min-w-[120px]">
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase">
                      {isArabic ? 'تقييم الائتمان AECB' : 'AECB Score'}
                    </span>
                    <span className="font-display text-lg text-tertiary mt-0.5 font-bold">
                      785 <span className="text-xs font-normal text-tertiary">{isArabic ? 'ممتاز' : 'Prime'}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Layout Grid: Left Sidebar + Command Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Navigation Rail */}
              <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
                <div className="bg-surface-container-low rounded-2xl p-4 shadow-md border border-outline-variant/20 sticky top-24">
                  <div className="px-3 py-2 mb-2 flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">
                      {isArabic ? 'أوامر الإعدادات' : 'Settings Command'}
                    </span>
                    <Sliders className="w-4 h-4 text-primary" />
                  </div>
                  <nav className="flex flex-col gap-1.5" id="nav-command-tabs">
                    <button
                      onClick={() => setActiveSection('section-general')}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-xs font-semibold ${
                        activeSection === 'section-general'
                          ? 'bg-primary text-on-primary shadow-md'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4" />
                        <span>{isArabic ? 'التفاصيل العامة' : 'General Details'}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setActiveSection('section-security')}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-xs font-semibold ${
                        activeSection === 'section-security'
                          ? 'bg-primary text-on-primary shadow-md'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4" />
                        <span>{isArabic ? 'الأمان والمصادقة' : 'Security & Auth'}</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-tertiary" />
                    </button>

                    <button
                      onClick={() => setActiveSection('section-uae-pass')}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-xs font-semibold ${
                        activeSection === 'section-uae-pass'
                          ? 'bg-primary text-on-primary shadow-md'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Fingerprint className="w-4 h-4" />
                        <span>{isArabic ? 'ربط الهوية UAE PASS' : 'UAE PASS Linked ID'}</span>
                      </div>
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-tertiary/20 text-tertiary">
                        {isArabic ? 'معتمد' : 'Verified'}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveSection('section-banking')}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-xs font-semibold ${
                        activeSection === 'section-banking'
                          ? 'bg-primary text-on-primary shadow-md'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Landmark className="w-4 h-4" />
                        <span>{isArabic ? 'المصارف وحساب الضمان (قريباً)' : 'Banking & Escrow (Coming Soon)'}</span>
                      </div>
                      <span className="font-mono text-xs text-on-surface-variant">AED</span>
                    </button>

                    <button
                      onClick={() => setActiveSection('section-privacy')}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-xs font-semibold ${
                        activeSection === 'section-privacy'
                          ? 'bg-primary text-on-primary shadow-md'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4" />
                        <span>{isArabic ? 'الكونسيرج والخصوصية' : 'Concierge & Privacy'}</span>
                      </div>
                      <ShieldCheck className="w-4 h-4 text-primary" />
                    </button>
                  </nav>

                  {/* Trust Certificate Block */}
                  <div className="mt-6 pt-4 bg-surface-container rounded-xl p-4 border border-outline-variant/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span className="font-mono text-[10px] uppercase font-bold text-on-surface">
                        {isArabic ? 'بروتوكول التجارة الإلكترونية' : 'E-Commerce Protocol'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {isArabic
                        ? 'متوافق تماماً مع المرسوم بقانون اتحادي رقم (45) لسنة 2021 بشأن حماية البيانات الشخصية (PDPL).'
                        : 'Complies with UAE Federal Decree-Law No. 45/2021 on Personal Data Protection (PDPL).'}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-on-surface-variant font-mono text-[11px]">
                      <span>KEY HASH: 9B2F...3A19</span>
                      <span className="text-tertiary font-bold">{isArabic ? 'مدقق وموثق' : 'AUDITED'}</span>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Command Configuration Panels Column */}
              <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-8">
                {/* SECTION 1: Personal & Entity Account Details */}
                <section
                  id="section-general"
                  className="bg-surface-container-low rounded-2xl p-6 lg:p-8 shadow-xl border border-outline-variant/20 flex flex-col gap-6 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
                    <div>
                      <span className="font-mono text-[10px] text-primary uppercase tracking-widest font-bold">
                        CONFIG NODE 01
                      </span>
                      <h2 className="font-display text-xl font-bold text-on-surface tracking-tight">
                        {isArabic ? 'بيانات الحساب الشخصية والكيان التجاري' : 'Personal & Entity Account Details'}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant font-mono text-xs">
                      <span className="w-2 h-2 rounded-full bg-tertiary" />
                      <span>{isArabic ? 'متزامن مع بوابة دولة الإمارات' : 'SYNCED TO UAE PORTAL'}</span>
                    </div>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono uppercase text-on-surface-variant">
                        {isArabic ? 'الاسم الأول (حسب جواز السفر)' : 'First Name (Legal Passport)'}
                      </label>
                      <div className="relative">
                        <input
                          id="input-first-name"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full h-11 px-4 rounded-lg bg-surface-container text-on-surface text-sm border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                        />
                        <CheckCircle2 className="w-4 h-4 absolute right-3 top-3.5 text-tertiary" />
                      </div>
                    </div>

                    {/* Last Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono uppercase text-on-surface-variant">
                        {isArabic ? 'اسم العائلة / اللقب' : 'Last Name / Family Name'}
                      </label>
                      <div className="relative">
                        <input
                          id="input-last-name"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full h-11 px-4 rounded-lg bg-surface-container text-on-surface text-sm border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                        />
                        <CheckCircle2 className="w-4 h-4 absolute right-3 top-3.5 text-tertiary" />
                      </div>
                    </div>

                    {/* Display Handle */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono uppercase text-on-surface-variant">
                        {isArabic ? 'معرف السوق العام' : 'Public Marketplace Handle'}
                      </label>
                      <input
                        id="input-handle"
                        type="text"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        className="w-full h-11 px-4 rounded-lg bg-surface-container text-on-surface text-sm border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Corporate Entity Affiliation */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono uppercase text-on-surface-variant">
                        {isArabic ? 'الكيان المؤسسي التابع (شركة ذات غرض خاص)' : 'Corporate Affiliation (SPV / Holding)'}
                      </label>
                      <div className="relative">
                        <input
                          id="input-affiliation"
                          type="text"
                          value={affiliation}
                          onChange={(e) => setAffiliation(e.target.value)}
                          className="w-full h-11 px-4 rounded-lg bg-surface-container text-on-surface text-sm border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <Building2 className="w-4 h-4 absolute right-3 top-3.5 text-primary" />
                      </div>
                    </div>

                    {/* TRN / Tax Registration Number */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono uppercase text-on-surface-variant">
                        {isArabic ? 'رقم التسجيل الضريبي TRN (الهيئة الاتحادية للضرائب)' : 'UAE Federal Tax Authority TRN'}
                      </label>
                      <input
                        id="input-trn"
                        type="text"
                        value={trn}
                        onChange={(e) => setTrn(e.target.value)}
                        className="w-full h-11 px-4 rounded-lg bg-surface-container font-mono text-on-surface text-sm border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="text-[11px] text-on-surface-variant">
                        {isArabic
                          ? 'اختياري: يطبق الإعفاء الضريبي بنسبة 0% على التصدير عند الانطباق.'
                          : 'Optional: Applies corporate 0% VAT export exemption where applicable.'}
                      </span>
                    </div>

                    {/* Language & Locale Switcher */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono uppercase text-on-surface-variant">
                        {isArabic ? 'لغة الواجهة والمستندات' : 'Interface Language & Docs'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setLocale('en')}
                          className={`h-11 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                            !isArabic
                              ? 'bg-primary text-on-primary border-primary shadow-sm'
                              : 'bg-surface-container text-on-surface-variant border-outline-variant/20 hover:text-on-surface'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" /> English (UK/UAE)
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocale('ar')}
                          className={`h-11 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                            isArabic
                              ? 'bg-primary text-on-primary border-primary shadow-sm'
                              : 'bg-surface-container text-on-surface-variant border-outline-variant/20 hover:text-on-surface'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" /> العربية (الإمارات)
                        </button>
                      </div>
                    </div>

                    {/* Currency Preference */}
                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <label className="text-xs font-mono uppercase text-on-surface-variant">
                        {isArabic ? 'عملة التسوية المالية' : 'Settlement Currency'}
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrency('AED')}
                          className={`px-4 py-2.5 rounded-lg font-mono text-xs font-bold flex items-center gap-2 border transition-all ${
                            currency === 'AED'
                              ? 'bg-surface-container-high border-primary text-primary shadow-sm'
                              : 'bg-surface-container border-outline-variant/20 text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          AED — United Arab Emirates Dirham (Locked Default)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrency('USD')}
                          className={`px-4 py-2.5 rounded-lg font-mono text-xs flex items-center gap-2 border transition-all ${
                            currency === 'USD'
                              ? 'bg-surface-container-high border-primary text-primary shadow-sm font-bold'
                              : 'bg-surface-container border-outline-variant/20 text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          USD ($) Multi-Currency Wire View
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrency('EUR')}
                          className={`px-4 py-2.5 rounded-lg font-mono text-xs flex items-center gap-2 border transition-all ${
                            currency === 'EUR'
                              ? 'bg-surface-container-high border-primary text-primary shadow-sm font-bold'
                              : 'bg-surface-container border-outline-variant/20 text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          EUR (€)
                        </button>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="md:col-span-2 flex items-center justify-between pt-4 mt-2 border-t border-outline-variant/20">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-on-surface-variant">
                          {isArabic ? 'آخر تعديل من العميل عبر الويب في 12 فبراير 2025' : 'Last modified by client via Web on 12 Feb 2025'}
                        </span>
                        {saveStatus && (
                          <span className="text-xs font-semibold text-tertiary flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {saveStatus}
                          </span>
                        )}
                      </div>
                      <button
                        id="save-general-settings"
                        type="submit"
                        className="h-11 px-6 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-fixed-dim transition-all shadow-md flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isArabic ? 'حفظ التغييرات' : 'Save Changes'}</span>
                      </button>
                    </div>
                  </form>
                </section>

                {/* SECTION 2: Security, Biometrics & UAE PASS Gateway */}
                <section
                  id="section-security"
                  className="bg-surface-container-low rounded-2xl p-6 lg:p-8 shadow-xl border border-outline-variant/20 flex flex-col gap-6 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
                    <div>
                      <span className="font-mono text-[10px] text-secondary uppercase tracking-widest font-bold">
                        CONFIG NODE 02
                      </span>
                      <h2 className="font-display text-xl font-bold text-on-surface tracking-tight">
                        {isArabic ? 'الأمان، المصادقة البيومترية وبوابة UAE PASS' : 'Security, Biometrics & UAE PASS Gateway'}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 text-tertiary font-mono text-xs bg-tertiary/10 px-3 py-1 rounded-full border border-tertiary/20">
                      <Lock className="w-3.5 h-3.5" />
                      <span>FIPS 140-3 LEVEL 4</span>
                    </div>
                  </div>

                  {/* UAE PASS Identity Card (Featured) */}
                  <div
                    id="section-uae-pass"
                    className="rounded-xl bg-gradient-to-br from-surface-container to-surface-container-high p-6 shadow-lg border border-outline-variant/20 relative overflow-hidden"
                  >
                    <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-tertiary/10 blur-2xl pointer-events-none" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-surface-container-lowest flex items-center justify-center text-tertiary shadow-md shrink-0 border border-tertiary/30">
                          <Fingerprint className="w-8 h-8" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-base font-bold text-on-surface">
                              {isArabic ? 'الهوية الموحدة UAE PASS' : 'UAE PASS Unified Identity'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-tertiary/20 text-tertiary font-mono text-[10px] uppercase font-bold">
                              {isArabic ? 'سيادي رقمي' : 'Digital Sovereign'}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1">
                            {isArabic ? 'متصل بصفتك ' : 'Connected as '}
                            <strong className="text-on-surface">Tariq Al-Hashimi</strong> (Unified Number: UID 201-9840-10)
                          </p>
                          <div className="flex items-center gap-3 mt-2 font-mono text-xs text-on-surface-variant">
                            <span className="flex items-center gap-1 text-tertiary">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isArabic ? 'آخر تصديق: اليوم في 09:14 بتوقيت الإمارات' : 'Last attested: Today at 09:14 GST'}
                            </span>
                            <span>•</span>
                            <span>{isArabic ? 'المراجعة التالية: خلال 89 يوماً' : 'Next Audit: in 89 days'}</span>
                          </div>
                          {uaePassMessage && (
                            <span className="mt-2 text-xs text-tertiary font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {uaePassMessage}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        id="uae-pass-reauth-btn"
                        onClick={handleReauthUaePass}
                        disabled={isReauthenticating}
                        type="button"
                        className="h-11 px-5 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface text-xs font-bold transition-all shadow border border-outline-variant/30 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                      >
                        {isReauthenticating ? (
                          <>
                            <RotateCcw className="w-4 h-4 animate-spin text-tertiary" />
                            <span>{isArabic ? 'جاري التحقق...' : 'Re-authenticating...'}</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 text-tertiary" />
                            <span>{isArabic ? 'إعادة المصادقة عبر UAE PASS' : 'Re-authenticate with UAE PASS'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Security Sub-Modules Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Multi-Factor Authentication */}
                    <div className="rounded-xl bg-surface-container p-5 flex flex-col justify-between shadow-md border border-outline-variant/20">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm font-bold text-on-surface">
                            {isArabic ? 'بوابة التحقق متعدد العوامل (2FA)' : 'Multi-Factor Gateway (2FA)'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-mono text-[10px] uppercase font-bold">
                            {isArabic ? 'مفعل إجبارياً' : 'Enforced'}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {isArabic
                            ? 'يتم توجيه رموز المصادقة عبر تطبيق UAE PASS مع رسائل SMS الاحتياطية لمعاملات الضمان التي تتجاوز 1,000,000 درهم.'
                            : 'Cryptographic token requests are channeled through UAE PASS Authenticator app with SMS Fallback for escrow transactions exceeding AED 1,000,000.'}
                        </p>
                      </div>
                      <div className="mt-4 pt-2 flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/20">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-secondary" />
                          <span className="font-mono text-xs text-on-surface">+971 50 ••• 1904</span>
                        </div>
                        <button type="button" className="text-primary hover:underline text-xs font-semibold">
                          {isArabic ? 'إعداد' : 'Configure'}
                        </button>
                      </div>
                    </div>

                    {/* Biometric Passkeys */}
                    <div className="rounded-xl bg-surface-container p-5 flex flex-col justify-between shadow-md border border-outline-variant/20">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm font-bold text-on-surface">
                            {isArabic ? 'مفاتيح المرور البيومترية (FIDO2)' : 'Biometric Passkeys (FIDO2)'}
                          </span>
                          <span className="font-mono text-xs text-primary font-bold">
                            {isArabic ? '2 مفاتيح نشطة' : '2 Active Keys'}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {isArabic
                            ? 'بيانات اعتماد WebAuthn في الشريحة الآمنة للأجهزة تتيح الوصول الفوري دون الحاجة لكلمات مرور.'
                            : 'WebAuthn hardware secure enclave credentials enabling instant sub-second access without typing passwords.'}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/10 text-xs">
                          <div className="flex items-center gap-2">
                            <Laptop className="w-4 h-4 text-on-surface" />
                            <span className="text-on-surface font-medium">MacBook Pro Touch ID</span>
                          </div>
                          <span className="font-mono text-on-surface-variant">Created Nov &apos;24</span>
                        </div>
                        <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/10 text-xs">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-on-surface" />
                            <span className="text-on-surface font-medium">iPhone 16 Pro FaceID</span>
                          </div>
                          <span className="font-mono text-on-surface-variant">Created Jan &apos;25</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Login Sessions Grid */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-sm font-bold text-on-surface">
                          {isArabic ? 'جلسات تسجيل الدخول النشطة' : 'Active Security Sessions'}
                        </h3>
                        <p className="text-xs text-on-surface-variant">
                          {isArabic
                            ? 'الجلسات المصرح بها حالياً عبر عقد دولة الإمارات والعقد الدولية.'
                            : 'Sessions currently authorized with active token states across the UAE and international nodes.'}
                        </p>
                      </div>
                      <button
                        id="terminate-sessions-btn"
                        onClick={handleTerminateSessions}
                        type="button"
                        className="px-4 py-2 rounded-lg bg-surface-container-highest hover:bg-error-container text-on-surface hover:text-on-error-container text-xs font-semibold transition-colors flex items-center gap-1.5 shadow border border-outline-variant/20 self-start sm:self-auto"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'إنهاء الجلسات الأخرى' : 'Terminate Other Sessions'}</span>
                      </button>
                    </div>

                    {terminatedSessions && (
                      <div className="p-3 rounded-lg bg-tertiary/20 border border-tertiary text-tertiary text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isArabic ? 'تم إنهاء جميع الجلسات الخارجية بنجاح.' : 'All other active sessions have been invalidated.'}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="sessions-container">
                      {/* Session 1: Current */}
                      <div className="p-4 rounded-xl bg-surface-container border border-tertiary/30 shadow-md flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Laptop className="w-4 h-4 text-tertiary" />
                            <span className="text-xs font-bold text-on-surface">Safari • macOS</span>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(88,231,170,0.8)]" />
                        </div>
                        <div className="flex flex-col font-mono text-xs text-on-surface-variant gap-0.5">
                          <span className="text-on-surface font-semibold">
                            {isArabic ? 'دبي، الإمارات (الجلسة الحالية)' : 'Dubai, UAE (Current Session)'}
                          </span>
                          <span>IP: 94.200.182.11 (du Telecom)</span>
                          <span className="text-[11px] text-tertiary font-bold">TLS 1.3 Active • Zero Trust</span>
                        </div>
                      </div>

                      {/* Session 2 */}
                      {!terminatedSessions && (
                        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 shadow-sm flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Laptop className="w-4 h-4 text-on-surface-variant" />
                              <span className="text-xs font-semibold text-on-surface">Chrome • Windows</span>
                            </div>
                            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
                              Active 2h ago
                            </span>
                          </div>
                          <div className="flex flex-col font-mono text-xs text-on-surface-variant gap-0.5">
                            <span className="text-on-surface font-medium">DIFC Gate Precinct, Dubai</span>
                            <span>IP: 86.96.110.42 (Etisalat)</span>
                            <span className="text-[11px]">Hardware Token Bound</span>
                          </div>
                        </div>
                      )}

                      {/* Session 3 */}
                      {!terminatedSessions && (
                        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 shadow-sm flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-on-surface-variant" />
                              <span className="text-xs font-semibold text-on-surface">Automotive OS iOS</span>
                            </div>
                            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
                              Active 1d ago
                            </span>
                          </div>
                          <div className="flex flex-col font-mono text-xs text-on-surface-variant gap-0.5">
                            <span className="text-on-surface font-medium">Abu Dhabi Island, UAE</span>
                            <span>IP: 185.120.44.89 (Mobile)</span>
                            <span className="text-[11px]">Biometric Auth Verified</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* SECTION 3: Banking, Escrow Beneficiary & Payout Rails */}
                <section
                  id="section-banking"
                  className="bg-surface-container-low rounded-2xl p-6 lg:p-8 shadow-xl border border-outline-variant/20 flex flex-col gap-6 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
                    <div>
                      <span className="font-mono text-[10px] text-primary uppercase tracking-widest font-bold">
                        CONFIG NODE 03
                      </span>
                      <h2 className="font-display text-xl font-bold text-on-surface tracking-tight">
                        {isArabic ? 'المصارف، المستفيد من الضمان وقنوات الصرف' : 'Banking, Escrow Beneficiary & Payout Rails'}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant font-mono text-xs">
                      <CheckCircle2 className="w-4 h-4 text-tertiary" />
                      <span>{isArabic ? 'ربط مصرف الإمارات المركزي' : 'CENTRAL BANK UAE INTEGRATION'}</span>
                    </div>
                  </div>

                  {/* Primary Escrow Disbursement Account Box */}
                  <div className="rounded-xl bg-gradient-to-r from-surface-container to-surface-container-high p-6 shadow-lg border border-outline-variant/20 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <Landmark className="w-8 h-8" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <span className="font-display text-base font-bold text-on-surface">
                            {isArabic ? 'بنك أبوظبي الأول (FAB)' : 'First Abu Dhabi Bank (FAB)'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-tertiary/20 text-tertiary font-mono text-[10px] uppercase font-bold">
                            {isArabic ? 'هدف الضمان الرئيسي' : 'Primary Escrow Target'}
                          </span>
                        </div>
                        <span className="text-xs text-on-surface-variant mt-1">
                          {isArabic
                            ? 'صاحب الحساب: مشاريع الإمارات الخاصة القابضة ذ.م.م (حساب ضمان التداول)'
                            : 'Title Holder: Emirates Private Holdings Ltd (Trading Escrow Account)'}
                        </span>

                        <div className="mt-3 p-3 bg-surface-container-lowest rounded-lg inline-flex items-center gap-3 border border-outline-variant/20 max-w-fit">
                          <span className="font-mono text-xs uppercase text-on-surface-variant">IBAN:</span>
                          <span className="font-mono text-sm lg:text-base text-primary font-bold tracking-wider" id="iban-display">
                            AE02 0300 0019 2838 4810 992
                          </span>
                          <button
                            id="copy-iban-btn"
                            type="button"
                            onClick={handleCopyIban}
                            className="text-on-surface-variant hover:text-on-surface p-1 transition-colors"
                            title="Copy IBAN"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {copiedIban && (
                            <span className="text-[10px] font-mono text-tertiary font-bold">
                              {isArabic ? 'تم النسخ!' : 'COPIED!'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-2 font-mono text-xs text-on-surface-variant">
                          <span>BIC: FABMAEAD</span>
                          <span>•</span>
                          <span>Branch: DIFC Al Sa&apos;ada Tower</span>
                          <span>•</span>
                          <span className="text-tertiary font-medium">
                            {isArabic ? 'استرداد تلقائي موثق' : 'Auto-Refund Attested'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        id="cbuae-cert-btn"
                        type="button"
                        onClick={() => setCertDownloaded(true)}
                        className="h-11 px-4 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow border border-outline-variant/20"
                      >
                        <FileText className="w-4 h-4" />
                        <span>{isArabic ? 'شهادة المصرف المركزي' : 'Central Bank Certificate'}</span>
                      </button>
                      {certDownloaded && (
                        <span className="text-[11px] text-tertiary text-center font-mono">
                          {isArabic ? 'تم إصدار شهادة الضمان CBUAE-FAB-902' : 'CBUAE-FAB-902 Verified'}
                        </span>
                      )}
                      <button
                        type="button"
                        className="h-11 px-4 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-outline-variant/20"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>{isArabic ? 'تغيير قناة الصرف' : 'Change Disbursement Rail'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Transaction Limits and Escrow Rules Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-on-surface-variant uppercase flex items-center gap-2">
                          {isArabic ? 'سقف تحرير الضمان الفوري' : 'Instant Escrow Release Cap'}
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {isArabic ? 'قريباً' : 'Coming Soon'}
                          </span>
                        </span>
                        <div className="font-display text-lg text-on-surface font-bold mt-1">
                          AED 5,000,000
                        </div>
                        <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                          {isArabic
                            ? 'تسوية آلية فور التحقق من نقل الملكية الرقمي لدى هيئة الطرق والمواصلات.'
                            : 'Automated settlement on verified RTA digital title transfer.'}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] text-tertiary mt-3 flex items-center gap-1 font-semibold">
                        <Check className="w-3.5 h-3.5" /> Real-time CBUAE IPP Rail
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-on-surface-variant uppercase">
                          {isArabic ? 'احتياطي ضمان الدفعة المقدمة' : 'Down-Payment Guarantee Reserve'}
                        </span>
                        <div className="font-display text-lg text-on-surface font-bold mt-1">
                          AED 500,000
                        </div>
                        <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                          {isArabic
                            ? 'ضمان محجوز في حساب الضمان لامتيازات المزايدة في مزادات السيارات الفارهة.'
                            : 'Locked escrow collateral for hypercar auction bidding privileges.'}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] text-secondary mt-3 flex items-center gap-1 font-semibold">
                        <Lock className="w-3.5 h-3.5" /> Interest Yield Accruing
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-on-surface-variant uppercase">
                          {isArabic ? 'بروتوكول الفوترة الضريبية' : 'Tax Invoicing Protocol'}
                        </span>
                        <div className="font-display text-lg text-on-surface font-bold mt-1">
                          FTA Certified e-Invoice
                        </div>
                        <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                          {isArabic
                            ? 'إرسال مباشر لفواتير XML PEPPOL الإلكترونية إلى قسم المحاسبة المؤسسية.'
                            : 'Direct transmission of XML PEPPOL e-invoices to corporate accounting.'}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] text-primary mt-3 flex items-center gap-1 font-semibold">
                        <Check className="w-3.5 h-3.5" /> Peppol UAE Ready
                      </span>
                    </div>
                  </div>
                </section>

                {/* SECTION 4: Privacy, Consent & Data Governance */}
                <section
                  id="section-privacy"
                  className="bg-surface-container-low rounded-2xl p-6 lg:p-8 shadow-xl border border-outline-variant/20 flex flex-col gap-6 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
                    <div>
                      <span className="font-mono text-[10px] text-tertiary uppercase tracking-widest font-bold">
                        CONFIG NODE 04
                      </span>
                      <h2 className="font-display text-xl font-bold text-on-surface tracking-tight">
                        {isArabic ? 'الخصوصية، الموافقات وحوكمة البيانات' : 'Privacy, Consent & Data Governance'}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant font-mono text-xs">
                      <span>FEDERAL DECREE NO. 45/2021 COMPLIANT</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Consent Toggle 1 */}
                    <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container border border-outline-variant/20">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                          <Car className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-display text-sm font-bold text-on-surface">
                            {isArabic ? 'رؤية المعارض لمحفظة المرآب' : 'Dealership Garage Portfolio Visibility'}
                          </span>
                          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                            {isArabic
                              ? 'السماح لوكلاء السيارات الفاخرة المعتمدين في الدولة بالاطلاع على أصول المرآب لتقديم عروض الاستبدال الحصرية.'
                              : 'Allow verified UAE tier-1 exotic dealerships to view active garage assets to propose off-market trade-in and consignment allocations.'}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          id="toggle-garage-visibility"
                          type="checkbox"
                          checked={garageVisibility}
                          onChange={(e) => setGarageVisibility(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-surface after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-on-primary" />
                      </label>
                    </div>

                    {/* Consent Toggle 2 */}
                    <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container border border-outline-variant/20">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high text-secondary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-display text-sm font-bold text-on-surface flex items-center gap-2">
                            {isArabic ? 'تحديث التقييم الائتماني المباشر من شركة الاتحاد للمعلومات الائتمانية (AECB)' : 'Al Etihad Credit Bureau (AECB) Direct Score Refresh'}
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold uppercase">
                              {isArabic ? 'قريباً' : 'Coming Soon'}
                            </span>
                          </span>
                          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                            {isArabic
                              ? 'السماح بالاستعلام المشفر عن التقييم الائتماني المعتمد مسبقاً لعقود التمويل والتأجير دون التأثير على التصنيف.'
                              : 'Permits instant encrypted credit scoring lookups for pre-approved automotive lease and financing proposals without impacting score rating.'}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          id="toggle-aecb-refresh"
                          type="checkbox"
                          checked={aecbRefresh}
                          onChange={(e) => setAecbRefresh(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-surface after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-on-primary" />
                      </label>
                    </div>

                    {/* Consent Toggle 3 */}
                    <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container border border-outline-variant/20">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high text-tertiary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-display text-sm font-bold text-on-surface">
                            {isArabic ? 'اتصالات كونسيرج كبار الشخصيات عبر واتساب' : 'VIP Concierge WhatsApp & Telemetry Communications'}
                          </span>
                          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                            {isArabic
                              ? 'استلام تأكيدات تجارب القيادة الخاصة وتنبيهات المزادات المغلقة مباشرة عبر قناة واتساب مشفرة.'
                              : 'Receive bespoke private test-drive confirmations, closed-room auction alerts, and vehicle transit telemetry directly via encrypted WhatsApp channel.'}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          id="toggle-whatsapp-comms"
                          type="checkbox"
                          checked={whatsappComms}
                          onChange={(e) => setWhatsappComms(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-surface after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-on-primary" />
                      </label>
                    </div>
                  </div>

                  {/* Data Export Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-outline-variant/20">
                    <span className="text-xs text-on-surface-variant">
                      {isArabic ? 'الحق في نقل البيانات (المادة 13 من قانون حماية البيانات الشخصية PDPL)' : 'Right to Data Portability (Article 13 PDPL)'}
                    </span>
                    <button
                      id="export-ledger-btn"
                      type="button"
                      onClick={handleExportLedger}
                      className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex items-center gap-2 border border-outline-variant/20 self-start sm:self-auto"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isArabic ? 'تصدير سجل التدقيق غير القابل للتعديل (.JSON)' : 'Export Immutable Audit Ledger (.JSON)'}</span>
                    </button>
                  </div>
                </section>

                {/* DANGER ZONE CARD */}
                <div className="rounded-2xl bg-surface-container-lowest p-6 lg:p-8 shadow-xl border border-error-container/40 flex flex-col gap-4 relative overflow-hidden">
                  <div className="flex items-center gap-3 text-error">
                    <AlertTriangle className="w-5 h-5 text-error" />
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                      {isArabic ? 'منطقة الخطر • إلغاء التفعيل السيادي' : 'Danger Zone • Sovereign Revocation'}
                    </h3>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {isArabic
                      ? 'يؤدي إلغاء تنشيط حساب كبار العملاء إلى إنهاء جميع عقود الإيداع لدى المعارض فوراً، وإلغاء حدود الضمان المعتمدة مسبقاً، وجدولة حذف أرشيف بياناتك المشفرة خلال 30 يوماً.'
                      : 'Deactivating your VIP Account immediately severs all active dealership consignment contracts, voids pre-cleared escrow limits, and schedules your cryptographic data archive for deletion across UAE automotive registry nodes within 30 days.'}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2 text-on-surface-variant font-mono text-xs">
                      <Shield className="w-4 h-4 text-primary" />
                      <span>{isArabic ? 'يتطلب مصادقة بيومترية عبر UAE PASS للتأكيد.' : 'Requires UAE PASS biometric authorization to confirm.'}</span>
                    </div>
                    <button
                      id="deactivate-account-btn"
                      type="button"
                      onClick={() => setDangerModal(true)}
                      className="h-11 px-5 rounded-lg bg-error-container hover:bg-red-700 text-on-error-container text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{isArabic ? 'إلغاء تنشيط حساب كبار الشخصيات والأرشفة' : 'Deactivate VIP Account & Archive'}</span>
                    </button>
                  </div>
                </div>

                {dangerModal && (
                  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-surface-container-low border border-error-container p-6 rounded-2xl max-w-md w-full shadow-2xl flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-error">
                        <AlertTriangle className="w-6 h-6" />
                        <h4 className="font-display text-base font-bold">
                          {isArabic ? 'تأكيد إلغاء الحساب السيادي' : 'Confirm Sovereign Deactivation'}
                        </h4>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {isArabic
                          ? 'هل أنت متأكد من رغبتك في إلغاء التفعيل؟ سيتم تجميد محفظة الضمان (AED 4.2M) بموجب لوائح مصرف الإمارات المركزي.'
                          : 'Are you certain you wish to proceed? Escrow holdings (AED 4.2M) will be subject to CBUAE statutory freeze protocol.'}
                      </p>
                      {deactivateSuccess ? (
                        <div className="p-3 bg-tertiary/20 text-tertiary rounded-lg text-xs font-semibold">
                          {isArabic ? 'تم تأكيد طلب الإلغاء. جاري التحويل...' : 'Revocation order queued via UAE PASS handshake.'}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setDangerModal(false)}
                            className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-medium"
                          >
                            {isArabic ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button
                            id="confirm-deactivate-btn"
                            type="button"
                            onClick={() => {
                              setDeactivateSuccess(true);
                              setTimeout(() => setDangerModal(false), 2000);
                            }}
                            className="px-4 py-2 rounded-lg bg-error-container text-on-error-container text-xs font-bold"
                          >
                            {isArabic ? 'تأكيد الإلغاء عبر UAE PASS' : 'Confirm with UAE PASS'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
