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
  FileCheck,
  RefreshCw,
  Landmark,
  ShieldAlert,
} from 'lucide-react';

type Persona = 'vip' | 'dealer' | 'escrow';

export default function LoginPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [persona, setPersona] = useState<Persona>('vip');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isUaePassConnecting, setIsUaePassConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isArabic = locale === 'ar';

  const placeholders: Record<Persona, { en: string; ar: string }> = {
    vip: {
      en: 'collector@sovereign.ae or 784-1990-1234567-1',
      ar: 'collector@sovereign.ae أو 784-1990-1234567-1',
    },
    dealer: {
      en: 'principal@al-futtaim.ae or Dealer Desk ID',
      ar: 'principal@al-futtaim.ae أو معرف مكتب الوكالة',
    },
    escrow: {
      en: 'officer.compliance@cbuae.gov.ae or Custody ID',
      ar: 'officer.compliance@cbuae.gov.ae أو معرف الحفظ القضائي',
    },
  };

  const handleUaePassAuth = () => {
    setIsUaePassConnecting(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsUaePassConnecting(false);
      // Route based on selected persona
      if (persona === 'dealer') {
        window.location.href = 'http://localhost:3001/dashboard';
      } else if (persona === 'escrow') {
        window.location.href = 'http://localhost:3002/disputes';
      } else {
        router.push('/account/garage');
      }
    }, 1800);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMessage(isArabic ? 'يرجى إدخال اسم المستخدم وكلمة المرور' : 'Please provide identifier and master passcode');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      setIsLoading(false);
      if (persona === 'dealer') {
        window.location.href = 'http://localhost:3001/dashboard';
      } else if (persona === 'escrow') {
        window.location.href = 'http://localhost:3002/disputes';
      } else {
        router.push('/account/garage');
      }
    }, 1200);
  };

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="bg-surface font-body text-on-surface antialiased min-h-screen flex flex-col justify-between selection:bg-primary selection:text-on-primary"
    >
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-2xl">
        <div className="h-20 max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group focus:outline-none">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <Car className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-base md:text-lg uppercase tracking-wider text-on-surface">
                  Automotive<span className="text-primary ml-1">OS</span>
                </span>
                <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">
                  {isArabic ? 'بوابة الإمارات الرقمية' : 'UAE Digital Portal'}
                </span>
              </div>
            </Link>

            <div className="hidden xl:flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/30">
              <CheckCircle2 className="w-4 h-4 text-tertiary" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                UAE PASS Ready
              </span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-surface-container-lowest/80 p-1.5 rounded-xl border border-outline-variant/20">
            <Link
              href="/auth/login"
              className="px-4 py-1.5 rounded-lg text-sm bg-surface-container-high text-primary font-semibold"
            >
              {isArabic ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-1.5 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              {isArabic ? 'إنشاء حساب VIP' : 'VIP Registration'}
            </Link>
            <Link
              href="/account/settings"
              className="px-4 py-1.5 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              {isArabic ? 'مركز الأمان' : 'Security Center'}
            </Link>
          </nav>

          {/* Right Status & Localization */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/30">
              <Lock className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs text-on-surface-variant">256-BIT SSL</span>
            </div>

            <button
              onClick={() => setLocale(isArabic ? 'en' : 'ar')}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors text-sm font-medium"
            >
              <Globe className="w-4 h-4" />
              <span>{isArabic ? 'English' : 'العربية'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full pt-20 bg-surface flex-1 flex flex-col justify-center relative overflow-hidden">
        {/* Ambient Radial Lighting Overlays */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-secondary-container/10 blur-[150px] pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[30rem] h-[30rem] rounded-full bg-primary-container/10 blur-[140px] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-4 lg:px-12 py-12 lg:py-16 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            
            {/* Left Column: Sovereign Showcase & Brand Authority */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8 pr-0 lg:pr-8">
              <div className="space-y-4">
                {/* Overline Status Capsule */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high/80 border border-outline-variant/40 shadow-sm backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                  <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
                    {isArabic ? 'بوابة الخليج الرقمية • الإصدار 4.8 نشط' : 'Autonomous GCC Gateway • v4.8 Active'}
                  </span>
                </div>

                {/* Main Display Headline */}
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface leading-tight">
                  {isArabic ? 'المرآب الرقمي السيادي' : 'Sovereign Digital'}{' '}
                  <span className="block bg-gradient-to-r from-primary via-primary-fixed to-secondary-fixed bg-clip-text text-transparent">
                    {isArabic ? 'والحفظ المالي الموثوق' : 'Garage & Escrow'}
                  </span>
                </h1>

                <p className="font-body text-base lg:text-lg text-on-surface-variant max-w-xl leading-relaxed">
                  {isArabic
                    ? 'تدير منصة أوتموتيف أو إس عمليات الحفظ للسيارات النادرة، والمقاصة المؤسسية الفورية، وتوثيق الهوية الرقمية السيادية عبر الإمارات.'
                    : 'Automotive OS orchestrates ultra-rare hypercar custody, instant institutional clearing, and frictionless UAE PASS sovereign authentication across the Emirates.'}
                </p>
              </div>

              {/* Feature Showcase Banner */}
              <div className="relative rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/40 shadow-2xl group">
                <div
                  className="w-full h-64 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=1200&auto=format&fit=crop')`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/70 to-transparent" />

                {/* Floating Reserve Valuation Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="font-mono text-xs text-primary uppercase tracking-widest block">
                      {isArabic ? 'قيمة الاحتياطي النشط' : 'Active Reserve Valuation'}
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-mono text-sm text-on-surface-variant">AED</span>
                      <span className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                        842,500,000
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-surface-container-highest/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-outline-variant/40 shadow-md">
                    <CheckCircle2 className="w-4 h-4 text-tertiary" />
                    <span className="text-xs font-semibold text-on-surface">
                      {isArabic ? '+1,420 هيكل خليجي معتمد' : '1,420+ Certified GCC Chassis'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Institutional Grid Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-surface-container/70 border border-outline-variant/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <Fingerprint className="w-5 h-5" />
                    <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                      {isArabic ? 'معيار التوثيق' : 'Auth Standard'}
                    </span>
                  </div>
                  <div className="font-display font-semibold text-base text-on-surface">
                    FIDO2 Biometrics
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {isArabic ? 'إذن المفاتيح عبر أجهزة التشفير المؤمنة.' : 'Passkey clearance via secure enclave hardware.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-container/70 border border-outline-variant/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-secondary mb-1">
                    <Landmark className="w-5 h-5" />
                    <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                      {isArabic ? 'بروتوكول الضمان' : 'Escrow Protocol'}
                    </span>
                  </div>
                  <div className="font-display font-semibold text-base text-on-surface">
                    Instant CBUAE
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {isArabic ? 'إفراج ملكية متعدد التوقيعات معتمد.' : 'Multi-signature institutional title release.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-container/70 border border-outline-variant/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-tertiary mb-1">
                    <FileCheck className="w-5 h-5" />
                    <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                      {isArabic ? 'الامتثال السيادي' : 'Compliance'}
                    </span>
                  </div>
                  <div className="font-display font-semibold text-base text-on-surface">
                    Tier-1 Digital ID
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {isArabic ? 'تحقق بدون كشف البيانات للهوية الإماراتية.' : 'Zero-knowledge proof Emirates ID validation.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Authentication Card Surface */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <div className="relative bg-surface-container-low/95 border border-outline-variant/40 shadow-2xl rounded-2xl p-6 sm:p-8 backdrop-blur-2xl">
                {/* Top Subtle Light Accent Line */}
                <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                {/* Persona Mode Selector Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
                      {isArabic ? 'نوع البوابة' : 'Portal Persona'}
                    </span>
                    <span className="font-mono text-xs text-primary font-medium">SECURE-PORT::8443</span>
                  </div>

                  {/* 3 Role Tabs */}
                  <div className="grid grid-cols-3 gap-1 bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/30">
                    <button
                      type="button"
                      onClick={() => setPersona('vip')}
                      className={`py-2 px-2 text-center rounded-lg text-xs font-semibold transition-all ${
                        persona === 'vip'
                          ? 'bg-surface-container-high text-primary shadow-sm border border-outline-variant/40'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {isArabic ? 'المقتني الخاص' : 'VIP Collector'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPersona('dealer')}
                      className={`py-2 px-2 text-center rounded-lg text-xs font-semibold transition-all ${
                        persona === 'dealer'
                          ? 'bg-surface-container-high text-primary shadow-sm border border-outline-variant/40'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {isArabic ? 'مكتب الوكالة' : 'Dealer Desk'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPersona('escrow')}
                      className={`py-2 px-2 text-center rounded-lg text-xs font-semibold transition-all ${
                        persona === 'escrow'
                          ? 'bg-surface-container-high text-primary shadow-sm border border-outline-variant/40'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {isArabic ? 'مؤسسي / ضمان' : 'Institutional'}
                    </button>
                  </div>
                </div>

                {/* Primary UAE PASS Sovereign Trigger Button */}
                <div className="space-y-2 mb-6">
                  <button
                    id="uae-pass-trigger"
                    type="button"
                    onClick={handleUaePassAuth}
                    disabled={isUaePassConnecting}
                    className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-[#003824] via-[#005035] to-[#002113] p-4 text-on-surface border border-tertiary/40 shadow-lg hover:shadow-tertiary-container/30 transition-all duration-300 disabled:opacity-70"
                  >
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-lg bg-tertiary-container/30 border border-tertiary/40 flex items-center justify-center text-tertiary">
                          {isUaePassConnecting ? (
                            <RefreshCw className="w-5 h-5 animate-spin text-tertiary" />
                          ) : (
                            <Shield className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-base font-bold text-white tracking-wide">
                              {isArabic ? 'الدخول بالهوية الرقمية' : 'Sign In with UAE PASS'}
                            </span>
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-tertiary text-on-tertiary-container">
                              OFFICIAL
                            </span>
                          </div>
                          <span className="text-xs text-tertiary-fixed font-medium block">
                            {isArabic ? 'توثيق معتمد وفوري' : 'تسجيل الدخول بالهوية الرقمية'}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-tertiary group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>

                  <div className="flex items-center justify-center gap-1.5 pt-1 text-on-surface-variant text-xs">
                    <Lock className="w-3.5 h-3.5 text-tertiary" />
                    <span className="font-mono uppercase tracking-wider text-[11px]">
                      {isArabic ? 'مصادقة مشفرة عبر أجهزة التخزين الآمنة' : 'Zero-Trace Passkey Handshake'}
                    </span>
                  </div>
                </div>

                {/* Clean Divider */}
                <div className="relative my-6 flex items-center justify-center">
                  <div className="w-full h-px bg-surface-container-highest" />
                  <span className="absolute bg-surface-container-low px-4 font-mono text-[11px] text-on-surface-variant uppercase tracking-widest border border-outline-variant/30 rounded-full">
                    {isArabic ? 'أو بواسطة بيانات الدخول' : 'Or with Credentials'}
                  </span>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-lg bg-error-container/40 border border-error/50 flex items-center gap-2 text-error text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Credentials Form */}
                <form id="auth-form" onSubmit={handleCredentialsSubmit} className="space-y-4">
                  {/* Identifier Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="identifier" className="font-mono text-xs text-on-surface uppercase tracking-wider">
                        {isArabic ? 'البريد المؤسسي / الهوية الإماراتية' : 'Corporate Email / Emirates ID'}
                      </label>
                      <span className="font-mono text-[11px] text-on-surface-variant">784-XXXX-XXXXXXX-X</span>
                    </div>
                    <div className="relative flex items-center">
                      <Building2 className="w-5 h-5 absolute left-3.5 text-on-surface-variant pointer-events-none" />
                      <input
                        id="identifier"
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={isArabic ? placeholders[persona].ar : placeholders[persona].en}
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-surface-container-lowest text-on-surface font-body text-sm placeholder:text-outline-variant border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="font-mono text-xs text-on-surface uppercase tracking-wider">
                        {isArabic ? 'رمز المرور الرئيسي' : 'Master Passcode'}
                      </label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-xs text-primary hover:text-primary-fixed underline transition-colors"
                      >
                        {isArabic ? 'نسيت الرمز أو الرقم السري؟' : 'Forgot Key / PIN?'}
                      </Link>
                    </div>
                    <div className="relative flex items-center">
                      <Key className="w-5 h-5 absolute left-3.5 text-on-surface-variant pointer-events-none" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-12 pl-11 pr-12 rounded-xl bg-surface-container-lowest text-on-surface font-body text-sm placeholder:text-outline-variant border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                        className="absolute right-3.5 text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Options Row */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        className="w-4 h-4 rounded bg-surface-container-lowest accent-primary cursor-pointer border border-outline-variant"
                      />
                      <span className="text-xs text-on-surface-variant">
                        {isArabic ? 'تذكر مصادقة هذا الجهاز لمدة 30 يوماً' : 'Remember hardware trust for 30 days'}
                      </span>
                    </label>
                  </div>

                  {/* Submit Action Button */}
                  <button
                    id="submit-auth"
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 mt-2 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-display font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20 active:scale-[0.99] disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{isArabic ? 'جاري التحقق...' : 'Authorizing Hardware...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isArabic ? 'اعتماد والدخول إلى المرآب' : 'Authorize & Access Garage'}</span>
                        <Lock className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Auxiliary Registration Callout */}
                <div className="mt-6 pt-4 border-t border-surface-container-highest/60 flex flex-col items-center gap-2 text-center">
                  <p className="text-xs text-on-surface-variant">
                    {isArabic ? 'مقتني خاص أو معرض غير مسجل؟' : 'Unregistered Private Collector or Showroom?'}
                  </p>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-1.5 font-display text-xs font-semibold text-primary hover:text-primary-fixed transition-colors"
                  >
                    <span>{isArabic ? 'طلب تخصيص / تسجيل المرآب السيادي' : 'Request Allocation / Register VIP Garage'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Regulatory Certifications Footer */}
                <div className="mt-6 pt-3 border-t border-surface-container-highest/40 flex items-center justify-between text-[10px] text-on-surface-variant/80 font-mono">
                  <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-tertiary" />
                    <span>TDRA UAE Certified</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-secondary" />
                    <span>AES-256 HSM Crypt</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5 text-primary" />
                    <span>CBUAE Compliant</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Sovereign Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 py-6">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-tertiary" />
              <span>{isArabic ? 'متوافق مع إطار الهوية الرقمية الإماراتي' : 'UAE Digital Identity Framework Compliant'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-primary" />
              <span>{isArabic ? 'بروتوكول معاملات السيارات الخليجي v4.2' : 'GCC Automotive Transaction Protocol v4.2'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href="tel:+97148002886" className="text-on-surface-variant hover:text-on-surface transition-colors">
              {isArabic ? 'المكتب الخاص: 9714800AUTO+' : 'VIP Concierge: +971 4 800 AUTO'}
            </a>
            <span className="text-outline-variant">|</span>
            <span>© 2026 Automotive OS LLC. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
