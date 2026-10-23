'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Key,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  Car,
  Globe,
  Fingerprint,
  CheckCircle2,
  Check,
  Plus,
  Phone,
  Sparkles,
  MapPin,
  FileCheck,
  RotateCcw,
  Landmark,
  ShieldCheck,
  Award,
  Truck,
} from 'lucide-react';

type Tier = 'collector' | 'corporate' | 'dealer';
type Emirate = 'dubai' | 'abudhabi' | 'sharjah';

export default function RegisterPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [tier, setTier] = useState<Tier>('collector');
  const [uaePassState, setUaePassState] = useState<'idle' | 'loading' | 'verified'>('idle');

  // Form Fields
  const [legalName, setLegalName] = useState('Sheikh Mansoor Al-Ketbi');
  const [emiratesId, setEmiratesId] = useState('784-1988-4920194-1');
  const [mobileNumber, setMobileNumber] = useState('50 892 4114');
  const [emailAddress, setEmailAddress] = useState('m.alketbi@holding.ae');

  // Garage Preferences
  const [marques, setMarques] = useState<string[]>(['Ferrari', 'Porsche', 'Rolls-Royce']);
  const [selectedEmirate, setSelectedEmirate] = useState<Emirate>('dubai');
  const [channels, setChannels] = useState({
    whatsapp: true,
    valuation: true,
    escrow: true,
  });

  // Password & Entropy
  const [password, setPassword] = useState('V12-Ghibli#Apex2025');
  const [confirmPassword, setConfirmPassword] = useState('V12-Ghibli#Apex2025');
  const [showPassword, setShowPassword] = useState(false);

  // Legal
  const [consentSandbox, setConsentSandbox] = useState(true);
  const [consentPdpl, setConsentPdpl] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const isArabic = locale === 'ar';

  const toggleMarque = (brand: string) => {
    if (marques.includes(brand)) {
      setMarques(marques.filter((m) => m !== brand));
    } else {
      setMarques([...marques, brand]);
    }
  };

  const handleUaePassConnect = () => {
    setUaePassState('loading');
    setTimeout(() => {
      setUaePassState('verified');
      setLegalName('Sheikh Mansoor Al-Ketbi');
      setEmiratesId('784-1988-4920194-1');
      setMobileNumber('50 892 4114');
      setEmailAddress('m.alketbi@holding.ae');
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(true);
      setTimeout(() => {
        router.push('/account/garage');
      }, 1000);
    }, 1200);
  };

  const allMarques = [
    'Ferrari',
    'Porsche',
    'Mercedes-AMG',
    'Rolls-Royce',
    'Aston Martin',
    'Bugatti',
    'McLaren',
  ];

  return (
    <div
      id="auth-register-root"
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
                {isArabic ? 'الهوية الرقمية: الربط المباشر قريباً' : 'UAE PASS Live Rail: Coming Soon'}
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
              href="/auth/login"
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold shadow-md hover:scale-105 transition-transform"
            >
              <Shield className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-20 bg-surface flex-1 flex flex-col">
        <div className="relative w-full overflow-hidden pb-16">
          <div className="absolute top-0 left-1/4 w-[640px] h-[640px] rounded-full bg-primary/5 blur-[140px] pointer-events-none -translate-y-1/2" />
          <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-secondary-container/5 blur-[120px] pointer-events-none" />

          {/* Stepper Top Bar */}
          <section className="w-full bg-surface-container-low border-b border-outline-variant/20 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <Award className="w-4 h-4" />
                    <span className="text-[11px] font-mono uppercase tracking-widest font-semibold">
                      {isArabic ? 'بروتوكول انضمام كبار العملاء' : 'Client Onboarding Protocol'}
                    </span>
                  </div>
                  <h1 className="font-display text-2xl lg:text-3xl font-bold text-on-surface">
                    {isArabic ? 'أنشئ ملفك للسيارات الفاخرة' : 'Create Your Luxury Automotive Profile'}
                  </h1>
                </div>
                <div className="flex items-center gap-2.5 bg-surface-container px-4 py-2 rounded-full border border-tertiary/20 self-start md:self-auto">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                  <span className="font-mono text-xs text-on-surface-variant font-semibold">
                    {isArabic ? 'المستوى الأمني: حساب ضمان المستوى الأول' : 'SECURITY CLEARANCE: LEVEL 1 ESCROW'}
                  </span>
                </div>
              </div>

              {/* 4-Step Progress Track */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-high border border-primary/30 text-primary">
                  <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-mono text-xs font-bold shrink-0">
                    1
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                      {isArabic ? 'الخطوة 1' : 'Step 1'}
                    </span>
                    <span className="text-xs text-on-surface font-semibold truncate">
                      {isArabic ? 'نوع الحساب' : 'Account Type'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface-variant">
                  <div className="w-7 h-7 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-mono text-xs shrink-0">
                    2
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-outline">
                      {isArabic ? 'الخطوة 2' : 'Step 2'}
                    </span>
                    <span className="text-xs text-on-surface-variant truncate">
                      {isArabic ? 'الهوية وبطاقة الهوية' : 'Identity & Emirates ID'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface-variant">
                  <div className="w-7 h-7 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-mono text-xs shrink-0">
                    3
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-outline">
                      {isArabic ? 'الخطوة 3' : 'Step 3'}
                    </span>
                    <span className="text-xs text-on-surface-variant truncate">
                      {isArabic ? 'تفضيلات المرآب' : 'Garage Preferences'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface-variant">
                  <div className="w-7 h-7 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-mono text-xs shrink-0">
                    4
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-outline">
                      {isArabic ? 'الخطوة 4' : 'Step 4'}
                    </span>
                    <span className="text-xs text-on-surface-variant truncate">
                      {isArabic ? 'بيانات الأمان' : 'Security Credentials'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Form Container */}
          <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-8 w-full">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form Sequence */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* Section 01: Account Tier Selection */}
                <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-mono text-xs font-bold border border-primary/20">
                        01
                      </span>
                      <h2 className="font-display text-lg font-bold text-on-surface">
                        {isArabic ? 'اختر فئة الملف الشخصي' : 'Select Registry Profile Tier'}
                      </h2>
                    </div>
                    <span className="text-[11px] font-mono text-outline uppercase tracking-wider">
                      {isArabic ? 'حقل إلزامي' : 'Required Field'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="tier-selector">
                    {/* Tier 1: Private Collector */}
                    <div
                      onClick={() => setTier('collector')}
                      className={`tier-card cursor-pointer rounded-xl p-4 transition-all relative overflow-hidden group border ${
                        tier === 'collector'
                          ? 'bg-surface-container-high border-primary shadow-lg ring-1 ring-primary/30'
                          : 'bg-surface-container border-outline-variant/20 hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
                      <div className="flex items-center justify-between mb-3">
                        <Sparkles className="w-6 h-6 text-primary" />
                        <div
                          className={`tier-indicator w-5 h-5 rounded-full flex items-center justify-center ${
                            tier === 'collector' ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                      <h3 className="font-display text-base font-bold text-on-surface mb-0.5">
                        {isArabic ? 'مقتني خاص' : 'Private Collector'}
                      </h3>
                      <span className="text-[10px] font-mono text-primary uppercase tracking-wider block mb-2 font-bold">
                        {isArabic ? 'مشتري سيارات فاخرة' : 'Luxury Buyer'}
                      </span>
                      <p className="text-xs text-on-surface-variant mb-3">
                        {isArabic
                          ? 'مخصص لأصحاب الملاءة المالية والائتلافات الخاصة.'
                          : 'Tailored for High-Net-Worth individuals and private auto syndicates.'}
                      </p>
                      <div className="space-y-1.5 pt-2 bg-surface-container-lowest/60 p-2.5 rounded-lg border border-outline-variant/10 text-xs">
                        <div className="flex items-center gap-2 text-on-surface">
                          <CheckCircle2 className="w-3.5 h-3.5 text-tertiary shrink-0" />
                          <span>{isArabic ? 'كونسيرج خاص مخصص' : 'VIP Dedicated Concierge'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-on-surface">
                          <CheckCircle2 className="w-3.5 h-3.5 text-tertiary shrink-0" />
                          <span>{isArabic ? 'حجز مضمار وتجربة قيادة' : 'Track & Test Drive Booking'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-on-surface">
                          <CheckCircle2 className="w-3.5 h-3.5 text-tertiary shrink-0" />
                          <span>{isArabic ? 'تسوية بحساب الضمان بالدرهم' : 'Escrow AED Settlement'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tier 2: Corporate Fleet */}
                    <div
                      onClick={() => setTier('corporate')}
                      className={`tier-card cursor-pointer rounded-xl p-4 transition-all relative overflow-hidden group border ${
                        tier === 'corporate'
                          ? 'bg-surface-container-high border-primary shadow-lg ring-1 ring-primary/30'
                          : 'bg-surface-container border-outline-variant/20 hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Building2 className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
                        <div
                          className={`tier-indicator w-5 h-5 rounded-full flex items-center justify-center ${
                            tier === 'corporate' ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                      <h3 className="font-display text-base font-bold text-on-surface mb-0.5">
                        {isArabic ? 'أسطول شركات' : 'Corporate Fleet'}
                      </h3>
                      <span className="text-[10px] font-mono text-outline uppercase tracking-wider block mb-2 font-bold">
                        {isArabic ? 'كيان تجاري' : 'Business Entity'}
                      </span>
                      <p className="text-xs text-on-surface-variant mb-3">
                        {isArabic
                          ? 'مهيكل للضيافة الفاخرة وأساطيل التأجير والمجموعات القابضة.'
                          : 'Structured for corporate hospitality, rental fleets, and holding firms.'}
                      </p>
                      <div className="space-y-1.5 pt-2 bg-surface-container-lowest/60 p-2.5 rounded-lg border border-outline-variant/10 text-xs">
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <CheckCircle2 className="w-3.5 h-3.5 text-outline shrink-0" />
                          <span>{isArabic ? 'فواتير ضريبية معتمدة TRN' : 'TRN Tax Compliant Invoicing'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <CheckCircle2 className="w-3.5 h-3.5 text-outline shrink-0" />
                          <span>{isArabic ? 'شراء مجمع للأصول' : 'Bulk Asset Procurement'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <CheckCircle2 className="w-3.5 h-3.5 text-outline shrink-0" />
                          <span>{isArabic ? 'إيداع أساطيل متعددة' : 'Multi-Vehicle Consignment'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tier 3: Licensed Dealership */}
                    <div
                      onClick={() => setTier('dealer')}
                      className={`tier-card cursor-pointer rounded-xl p-4 transition-all relative overflow-hidden group border ${
                        tier === 'dealer'
                          ? 'bg-surface-container-high border-primary shadow-lg ring-1 ring-primary/30'
                          : 'bg-surface-container border-outline-variant/20 hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Car className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
                        <div
                          className={`tier-indicator w-5 h-5 rounded-full flex items-center justify-center ${
                            tier === 'dealer' ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                      <h3 className="font-display text-base font-bold text-on-surface mb-0.5">
                        {isArabic ? 'وكالة معتمدة' : 'UAE Dealership'}
                      </h3>
                      <span className="text-[10px] font-mono text-outline uppercase tracking-wider block mb-2 font-bold">
                        {isArabic ? 'معرض مرخص' : 'Licensed Agency'}
                      </span>
                      <p className="text-xs text-on-surface-variant mb-3">
                        {isArabic
                          ? 'للمعارض المرخصة ووسطاء السيارات والورش المعتمدة.'
                          : 'For licensed showrooms, exotic brokers, and authorized workshops.'}
                      </p>
                      <div className="space-y-1.5 pt-2 bg-surface-container-lowest/60 p-2.5 rounded-lg border border-outline-variant/10 text-xs">
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <CheckCircle2 className="w-3.5 h-3.5 text-outline shrink-0" />
                          <span>{isArabic ? 'ربط الرخصة التجارية DED' : 'DED Trade License Link'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <CheckCircle2 className="w-3.5 h-3.5 text-outline shrink-0" />
                          <span>{isArabic ? 'منصة إدارة المخزون DMS' : 'Full Inventory DMS Terminal'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <CheckCircle2 className="w-3.5 h-3.5 text-outline shrink-0" />
                          <span>{isArabic ? 'بوابة بطاقات أعمال الورشة' : 'Workshop Job-Card Portal'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 02: UAE PASS Quick Fill & Identity */}
                <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-mono text-xs font-bold border border-primary/20">
                        02
                      </span>
                      <h2 className="font-display text-lg font-bold text-on-surface">
                        {isArabic ? 'بيانات الهوية المعتمدة لدولة الإمارات' : 'Verified UAE Identity Details'}
                      </h2>
                    </div>
                    <div className="flex items-center gap-1.5 bg-tertiary/10 text-tertiary px-3 py-1 rounded-full border border-tertiary/20">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
                        {isArabic ? 'بوابة حكومية آمنة' : 'Gov-Secured Gateway'}
                      </span>
                    </div>
                  </div>

                  {/* UAE PASS Fast-Fill Action Card */}
                  <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-tertiary shrink-0 border border-tertiary/30">
                        <Fingerprint className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-base font-bold text-on-surface">
                            {isArabic ? 'التحقق الفوري عبر الهوية الرقمية' : 'Instant Verify with UAE PASS'}
                          </span>
                          <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                            {isArabic ? 'تعبئة سريعة' : 'Fast-Fill'}
                          </span>
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                            {isArabic ? 'الربط المباشر: قريباً' : 'Live Rail: Coming Soon'}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {isArabic
                            ? 'تجاوز الإدخال اليدوي. قم بمصادقة الهوية والاسم والاتصال بأمان.'
                            : 'Bypass manual typing. Authenticate your Emirates ID, Full Legal Name, and Mobile Number securely.'}
                        </p>
                      </div>
                    </div>
                    <button
                      id="uae-pass-trigger"
                      onClick={handleUaePassConnect}
                      disabled={uaePassState === 'loading'}
                      className={`w-full md:w-auto shrink-0 px-5 py-2.5 rounded-lg font-display text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm ${
                        uaePassState === 'verified'
                          ? 'bg-tertiary/20 text-tertiary border border-tertiary/40'
                          : 'bg-surface-bright hover:bg-primary hover:text-on-primary text-on-surface border border-outline-variant/30'
                      }`}
                      type="button"
                    >
                      {uaePassState === 'loading' ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin text-primary" />
                          <span>{isArabic ? 'جاري التحقق...' : 'Authenticating...'}</span>
                        </>
                      ) : uaePassState === 'verified' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-tertiary" />
                          <span className="text-tertiary font-bold">
                            {isArabic ? 'تم التحقق من UAE PASS' : 'UAE PASS Verified'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Fingerprint className="w-4 h-4 text-tertiary" />
                          <span>{isArabic ? 'اتصال بالهوية الرقمية UAE PASS' : 'Connect UAE PASS'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Manual / Verified Form Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-on-surface-variant flex items-center justify-between" htmlFor="legal-name">
                        <span>{isArabic ? 'الاسم القانوني الكامل (حسب الهوية)' : 'Full Legal Name (as per Emirates ID)'}</span>
                        <span className="text-primary font-mono text-[10px] uppercase">AR / EN</span>
                      </label>
                      <div className="relative">
                        <input
                          id="legal-name"
                          type="text"
                          value={legalName}
                          onChange={(e) => setLegalName(e.target.value)}
                          placeholder="First Middle Last"
                          className="w-full h-11 px-4 bg-surface-container border border-outline-variant/30 rounded-lg text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                        />
                        <CheckCircle2 className="w-4 h-4 text-tertiary absolute right-3 top-3.5" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-on-surface-variant flex items-center justify-between" htmlFor="emirates-id">
                        <span>{isArabic ? 'رقم الهوية الإماراتية' : 'Emirates ID Registry Number'}</span>
                        <span className="font-mono text-[10px] text-outline">784-XXXX-XXXXXXX-X</span>
                      </label>
                      <div className="relative">
                        <input
                          id="emirates-id"
                          type="text"
                          value={emiratesId}
                          onChange={(e) => setEmiratesId(e.target.value)}
                          placeholder="784-YYYY-NNNNNNN-C"
                          className="w-full h-11 px-4 bg-surface-container border border-outline-variant/30 rounded-lg text-on-surface font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                        />
                        <FileCheck className="w-4 h-4 text-tertiary absolute right-3 top-3.5" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-on-surface-variant" htmlFor="mobile-number">
                        {isArabic ? 'رقم الهاتف المتحرك (رمز دولة الإمارات)' : 'Mobile Contact (UAE Dial Code)'}
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="h-11 px-3 bg-surface-container-high border border-outline-variant/30 rounded-lg flex items-center gap-1.5 text-on-surface shrink-0">
                          <span className="text-sm">🇦🇪</span>
                          <span className="font-mono text-xs font-bold">+971</span>
                        </div>
                        <input
                          id="mobile-number"
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          placeholder="5X XXX XXXX"
                          className="w-full h-11 px-4 bg-surface-container border border-outline-variant/30 rounded-lg text-on-surface font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-on-surface-variant" htmlFor="email-address">
                        {isArabic ? 'البريد الإلكتروني للاتصالات السرية' : 'Confidential Communications Email'}
                      </label>
                      <div className="relative">
                        <input
                          id="email-address"
                          type="email"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          placeholder="name@domain.ae"
                          className="w-full h-11 px-4 bg-surface-container border border-outline-variant/30 rounded-lg text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                        />
                        <Lock className="w-4 h-4 text-outline absolute right-3 top-3.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 03: VIP Garage Preferences */}
                <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-mono text-xs font-bold border border-primary/20">
                        03
                      </span>
                      <h2 className="font-display text-lg font-bold text-on-surface">
                        {isArabic ? 'تفضيلات المرآب الحصرية' : 'Curated Garage Preferences'}
                      </h2>
                    </div>
                    <span className="text-[11px] font-mono text-primary uppercase tracking-widest font-bold">
                      {isArabic ? 'ضبط التغذية الخوارزمية' : 'Algorithmic Feed Tuning'}
                    </span>
                  </div>

                  {/* Marques Chips */}
                  <div className="mb-5">
                    <span className="text-xs font-medium text-on-surface-variant block mb-2">
                      {isArabic ? 'العلامات التجارية والشركات المصنعة المستهدفة (متعدد الاختيار)' : 'Target Marques & Manufacturers (Multi-Select)'}
                    </span>
                    <div className="flex flex-wrap gap-2" id="marque-chips">
                      {allMarques.map((marque) => {
                        const isSelected = marques.includes(marque);
                        return (
                          <button
                            key={marque}
                            type="button"
                            onClick={() => toggleMarque(marque)}
                            className={`marque-btn px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                              isSelected
                                ? 'bg-on-surface text-surface font-bold'
                                : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
                            }`}
                          >
                            <span>{marque}</span>
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Plus className="w-3.5 h-3.5 text-outline" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Emirate Hub Selection */}
                  <div className="mb-5">
                    <span className="text-xs font-medium text-on-surface-variant block mb-2">
                      {isArabic ? 'إمارة التسليم والفحص الرئيسية' : 'Primary Delivery & Inspection Emirate'}
                    </span>
                    <div className="grid grid-cols-3 gap-3" id="emirate-selector">
                      <button
                        type="button"
                        onClick={() => setSelectedEmirate('dubai')}
                        className={`emirate-btn py-2.5 px-4 rounded-lg font-display text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          selectedEmirate === 'dubai'
                            ? 'bg-surface-container-highest text-primary border border-primary/40 shadow-sm'
                            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/20'
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                        <span>{isArabic ? 'دبي' : 'Dubai'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedEmirate('abudhabi')}
                        className={`emirate-btn py-2.5 px-4 rounded-lg font-display text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          selectedEmirate === 'abudhabi'
                            ? 'bg-surface-container-highest text-primary border border-primary/40 shadow-sm'
                            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/20'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        <span>{isArabic ? 'أبوظبي' : 'Abu Dhabi'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedEmirate('sharjah')}
                        className={`emirate-btn py-2.5 px-4 rounded-lg font-display text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          selectedEmirate === 'sharjah'
                            ? 'bg-surface-container-highest text-primary border border-primary/40 shadow-sm'
                            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/20'
                        }`}
                      >
                        <Landmark className="w-4 h-4" />
                        <span>{isArabic ? 'الشارقة' : 'Sharjah'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Priority Telemetry & Alerts */}
                  <div>
                    <span className="text-xs font-medium text-on-surface-variant block mb-2">
                      {isArabic ? 'قنوات الإرسال الحصري واستخبارات السوق' : 'VIP Dispatch & Market Intelligence Channels'}
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-surface-container border border-outline-variant/20 cursor-pointer hover:bg-surface-container-high transition-colors">
                        <input
                          type="checkbox"
                          checked={channels.whatsapp}
                          onChange={(e) => setChannels({ ...channels, whatsapp: e.target.checked })}
                          className="w-4 h-4 rounded text-primary focus:ring-0 bg-surface-container-highest accent-primary"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-on-surface">
                            {isArabic ? 'إشعارات واتساب الخاصة' : 'WhatsApp Private Drops'}
                          </span>
                          <span className="text-[10px] text-outline">
                            {isArabic ? 'عروض حصرية خارج السوق' : 'Direct off-market listings'}
                          </span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 rounded-lg bg-surface-container border border-outline-variant/20 cursor-pointer hover:bg-surface-container-high transition-colors">
                        <input
                          type="checkbox"
                          checked={channels.valuation}
                          onChange={(e) => setChannels({ ...channels, valuation: e.target.checked })}
                          className="w-4 h-4 rounded text-primary focus:ring-0 bg-surface-container-highest accent-primary"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-on-surface">
                            {isArabic ? 'تنبيهات انخفاض التقييم' : 'Valuation Drop Signals'}
                          </span>
                          <span className="text-[10px] text-outline">
                            {isArabic ? 'تحديثات تسعير المعارض فورا' : 'Real-time dealer repricing'}
                          </span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 rounded-lg bg-surface-container border border-outline-variant/20 cursor-pointer hover:bg-surface-container-high transition-colors">
                        <input
                          type="checkbox"
                          checked={channels.escrow}
                          onChange={(e) => setChannels({ ...channels, escrow: e.target.checked })}
                          className="w-4 h-4 rounded text-primary focus:ring-0 bg-surface-container-highest accent-primary"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-on-surface">
                            {isArabic ? 'حالة سجل حساب الضمان' : 'Escrow Ledger Status'}
                          </span>
                          <span className="text-[10px] text-outline">
                            {isArabic ? 'تحويلات البنك المركزي' : 'Central Bank wired milestones'}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section 04: Security Credentials & Password Strength */}
                <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-mono text-xs font-bold border border-primary/20">
                        04
                      </span>
                      <h2 className="font-display text-lg font-bold text-on-surface">
                        {isArabic ? 'المصادقة المشفرة وكلمة المرور' : 'Cryptographic Authentication & Password'}
                      </h2>
                    </div>
                    <Lock className="w-5 h-5 text-outline" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-on-surface-variant" htmlFor="password-input">
                        {isArabic ? 'كلمة المرور الرئيسية للبوابة' : 'Master Portal Password'}
                      </label>
                      <div className="relative">
                        <input
                          id="password-input"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter secure key phrase"
                          className="w-full h-11 px-4 pr-10 bg-surface-container border border-outline-variant/30 rounded-lg text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                        />
                        <button
                          id="toggle-password"
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-outline hover:text-on-surface transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-on-surface-variant" htmlFor="password-confirm">
                        {isArabic ? 'تأكيد كلمة المرور الرئيسية' : 'Confirm Master Password'}
                      </label>
                      <div className="relative">
                        <input
                          id="password-confirm"
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full h-11 px-4 pr-10 bg-surface-container border border-outline-variant/30 rounded-lg text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                        />
                        <CheckCircle2 className="w-4 h-4 text-tertiary absolute right-3 top-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Bar & Requirements Grid */}
                  <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono text-outline uppercase tracking-wider">
                        {isArabic ? 'تصنيف الإنتروبيا المشفرة' : 'Cryptographic Entropy Rating'}
                      </span>
                      <span className="font-mono text-xs text-tertiary font-bold">
                        96% - MILITARY SPEC
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden mb-4 flex gap-1">
                      <div className="h-full w-1/4 bg-tertiary rounded-full" />
                      <div className="h-full w-1/4 bg-tertiary rounded-full" />
                      <div className="h-full w-1/4 bg-tertiary rounded-full" />
                      <div className="h-full w-1/4 bg-tertiary rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-on-surface text-xs">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-tertiary" />
                        <span>{isArabic ? '12+ حرف' : '12+ Characters'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-tertiary" />
                        <span>{isArabic ? 'رمز خاص' : 'Special Symbol'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-tertiary" />
                        <span>{isArabic ? 'أرقام عددية' : 'Numerical Digits'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-tertiary" />
                        <span>{isArabic ? 'بصمة FIDO2' : 'FIDO2 Biometrics'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 05: Legal Check & Execution Trigger */}
                <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 shadow-md">
                  <div className="space-y-3 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentSandbox}
                        onChange={(e) => setConsentSandbox(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-primary focus:ring-0 bg-surface-container-highest accent-primary shrink-0"
                      />
                      <span className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors leading-relaxed">
                        {isArabic ? (
                          <>
                            أوافق على التحقق من الهوية والتفويض الائتماني من خلال{' '}
                            <strong className="text-on-surface font-semibold">
                              البيئة التجريبية التنظيمية لمصرف الإمارات المركزي وسحابة الهوية الرقمية السيادية UAE PASS
                            </strong>
                            .
                          </>
                        ) : (
                          <>
                            I consent to identity validation and credit authorization through the{' '}
                            <strong className="text-on-surface font-semibold">
                              UAE Central Bank Regulatory Sandbox & UAE PASS Sovereign Cloud API
                            </strong>
                            .
                          </>
                        )}
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentPdpl}
                        onChange={(e) => setConsentPdpl(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-primary focus:ring-0 bg-surface-container-highest accent-primary shrink-0"
                      />
                      <span className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors leading-relaxed">
                        {isArabic ? (
                          <>
                            لقد راجعت ووافقت على{' '}
                            <Link href="/terms" className="text-primary underline hover:text-primary-fixed">
                              شروط بروتوكول خدمة كبار الشخصيات
                            </Link>{' '}
                            وأوافق على معالجة البيانات بموجب{' '}
                            <strong className="text-on-surface font-semibold">
                              المرسوم بقانون اتحادي رقم (45) لسنة 2021
                            </strong>{' '}
                            بشأن حماية البيانات الشخصية (PDPL).
                          </>
                        ) : (
                          <>
                            I have reviewed and accepted the{' '}
                            <Link href="/terms" className="text-primary underline hover:text-primary-fixed">
                              Terms of VIP Protocol Service
                            </Link>{' '}
                            and agree to data processing under{' '}
                            <strong className="text-on-surface font-semibold">
                              UAE Federal Decree-Law No. 45 of 2021
                            </strong>{' '}
                            on the Protection of Personal Data (PDPL).
                          </>
                        )}
                      </span>
                    </label>
                  </div>

                  {successMessage && (
                    <div className="mb-4 p-3 rounded-lg bg-tertiary/20 border border-tertiary text-tertiary text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isArabic ? 'تم إنشاء الحساب بنجاح! جاري التوجيه إلى المرآب الرقمي...' : 'VIP Account Registered Successfully! Redirecting to Virtual Garage...'}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                    <button
                      id="submit-registration"
                      type="submit"
                      disabled={isSubmitting || !consentSandbox || !consentPdpl}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-primary hover:bg-primary-fixed text-on-primary font-display text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/20 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin" />
                          <span>{isArabic ? 'جاري تسجيل الملف...' : 'Registering VIP Dossier...'}</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {isArabic ? 'إتمام التسجيل والدخول إلى المرآب الرقمي' : 'Complete VIP Registration & Access Virtual Garage'}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <Link
                      href="/auth/login"
                      className="text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <span>{isArabic ? 'هل لديك حساب بالفعل؟' : 'Already registered?'}</span>
                      <span className="font-semibold text-primary underline">{isArabic ? 'تسجيل الدخول' : 'Sign In'}</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column: VIP Summary Rail */}
              <aside className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-24">
                {/* Virtual Garage Preview Card */}
                <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/20 shadow-xl">
                  <div
                    className="relative h-48 w-full bg-cover bg-center"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDH6_pnkif4JqPapb0LAjDNAFoGdy6HQL-XY8dZE-tNO6UVNn9w0LwD5pgaqEcQ0Io3b5mpV4akDs96-GNgIfb2FUdnP95QaK8ffD-_hgOHmPwIGd9H5RJm2P4BUfhnA3M8K7xEpfrPCXmwgMEBk8aJadSisyX7DFMqxwg4rbdJnpbY_Uk4Qk4agCQGFWvCos6EafaFlYjzJNDUmuK7oZ3Gr8dC3QITk3lPAkygocBE0YNQ0kt8qUxW')",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/30 to-transparent" />
                    <div className="absolute top-3 left-3 bg-surface-container-lowest/80 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-primary/20">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-[10px] font-mono text-on-surface uppercase tracking-wider font-bold">
                        {isArabic ? 'معاينة الخزينة' : 'Vault Preview'}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-primary uppercase tracking-widest block font-bold">
                          {isArabic ? 'تخصيص مميز' : 'Featured Allocation'}
                        </span>
                        <h4 className="font-display text-base text-on-surface font-bold">
                          2024 Daytona SP3 Icona
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-outline block">
                          {isArabic ? 'القيمة التقديرية بالدرهم' : 'ESTIMATED AED'}
                        </span>
                        <span className="font-mono text-base text-on-surface font-bold">
                          14,200,000
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between text-on-surface-variant text-xs">
                      <span>{isArabic ? 'حالة التخصيص للعضوية:' : 'Membership Allocation Status:'}</span>
                      <span className="text-tertiary font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                        {isArabic ? 'مسار سريع مجاني' : 'Complimentary Fast-Track'}
                      </span>
                    </div>

                    {/* Membership Benefits Micro-List */}
                    <div className="space-y-2 bg-surface-container p-3 rounded-lg border border-outline-variant/10">
                      <div className="flex items-start gap-2.5">
                        <Key className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-on-surface flex items-center gap-2">
                            {isArabic ? 'تسوية محمية بحساب الضمان' : 'Escrow-Shielded Settlement'}
                            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {isArabic ? 'قريباً' : 'Coming Soon'}
                            </span>
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {isArabic
                              ? 'خزائن ضمان متوافقة مع مصرف الإمارات المركزي للتبادلات بملايين الدراهم.'
                              : 'UAE Central Bank compliant escrow vaults for multi-million dirham exchanges.'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Truck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-on-surface">
                            {isArabic ? 'توصيل عبر ناقلة مغلقة' : 'Closed-Transporter Delivery'}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {isArabic
                              ? 'نقل مبرد بشاحنة مغلقة مباشرة إلى مقر إقامتك الخاص.'
                              : 'Climate-monitored enclosed flatbed dispatch direct to your private residence.'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-on-surface">
                            {isArabic ? 'تخليص لوحات هيئة الطرق والمواصلات' : 'RTA Number Plate Clearing'}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {isArabic
                              ? 'تسريع نقل لوحات المركبات المميزة والأحادية والثنائية.'
                              : 'Expedited transfer of single and dual-digit collector registration plates.'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Security Telemetry Badge Card */}
                    <div className="bg-surface-container-high p-3 rounded-lg flex items-center justify-between border border-outline-variant/20">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-tertiary" />
                        <div className="flex flex-col">
                          <span className="font-mono text-[11px] text-on-surface font-semibold">
                            TLS 1.3 / E2EE PROTOCOL
                          </span>
                          <span className="text-[10px] font-mono text-outline">
                            HASH: 4F92...B91C
                          </span>
                        </div>
                      </div>
                      <Lock className="w-4 h-4 text-outline" />
                    </div>
                  </div>
                </div>

                {/* Secondary Concierge Help Card */}
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 shadow-md flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-md border border-primary/20">
                    <img
                      className="w-full h-full object-cover"
                      alt="Tariq Al-Hashemi - Senior Private Client Advisor"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGGTUF6bhkNdXAUwIIxrsB6VlikYjJKHUZM36G2K6CK7ELzRHsXyv7Otqq-w-GEZq2pXd9DlXGhaz4QgaocSBmbZlYTQnsenj4iYWz7N4A63O5v0_7Hrh_UPbXXHjm7bo57JbN60h_8E3s4-HQhQs9cUSewmGTJ3wiBFzU_7BnVe_ML4iZz7nnqzeeF2jvtLC4QqNEhjQOxfN9RhRPhghn-Z_tS2pHb1VAMa1g9XLkiGBZGky-2Bb1"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-mono text-primary uppercase tracking-wider font-bold">
                      {isArabic ? 'مكتب مخصص' : 'Dedicated Desk'}
                    </span>
                    <span className="text-sm font-bold text-on-surface truncate">
                      {isArabic ? 'طارق الهاشمي' : 'Tariq Al-Hashemi'}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {isArabic ? 'مستشار كبار العملاء' : 'Senior Private Client Advisor'}
                    </span>
                  </div>
                  <a
                    href="tel:+97148002886"
                    className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary flex items-center justify-center text-primary transition-colors ml-auto shrink-0 shadow-sm border border-outline-variant/20"
                    title="Call VIP Concierge"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>

                {/* Protocol Compliance Stamp */}
                <div className="px-2 py-1 flex items-center justify-between text-outline text-[11px] font-mono">
                  <span>REG ID: UAE-AUTO-OS-2025-C</span>
                  <span>BUILD 14.8.2</span>
                </div>
              </aside>
            </form>
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
