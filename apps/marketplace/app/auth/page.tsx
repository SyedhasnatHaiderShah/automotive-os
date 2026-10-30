'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield,
  Key,
  ArrowRight,
  Eye,
  EyeOff,
  Car,
  Globe,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { EMAIL_DELIVERY_AVAILABLE, apiErrorMessage } from '../../lib/email-delivery';

export default function UnifiedAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [locale, setLocale] = useState<'en' | 'ar'>('en');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  // Login was refused because the email is unverified; show a path to verify/resend (MK-12).
  const [loginNeedsVerification, setLoginNeedsVerification] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regPhone, setRegPhone] = useState('');
  const [regEmirate, setRegEmirate] = useState('Dubai');
  const [consentPdpl, setConsentPdpl] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  const isArabic = locale === 'ar';

  // Password Strength Checker
  const hasMinLength = regPassword.length >= 10;
  const hasUpper = /[A-Z]/.test(regPassword);
  const hasLower = /[a-z]/.test(regPassword);
  const hasNumber = /[0-9]/.test(regPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(regPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'register' || tabParam === 'login') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginNeedsVerification(false);
    if (!loginEmail || !loginPassword) {
      setLoginError(isArabic ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please provide both email and master password');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const apiMessage = apiErrorMessage(data, 'Authentication failed. Please check your credentials.');
        if (data?.error?.code === 'EMAIL_NOT_VERIFIED' || apiMessage.startsWith('EMAIL_NOT_VERIFIED')) {
          setLoginNeedsVerification(true);
          throw new Error(
            isArabic
              ? 'لم يتم التحقق من بريدك الإلكتروني بعد. افتح رابط التحقق أو اطلب رابطاً جديداً قبل تسجيل الدخول.'
              : 'Your email address is not verified yet. Open your verification link or request a new one before signing in.'
          );
        }
        throw new Error(apiMessage);
      }

      // The API sets the httpOnly `ao_session` cookie; the JWT is never persisted in
      // script-readable storage (SEC-19). Clear any token left by older builds.
      try {
        localStorage.removeItem('ao_token');
        localStorage.removeItem('ao_user');
      } catch {
        // Storage unavailable; nothing to clear.
      }

      // Return to the guarded page that sent the user here (same-origin paths only),
      // otherwise use the backend resolved role target.
      const requested = searchParams.get('redirect');
      const safeRequested =
        requested && requested.startsWith('/') && !requested.startsWith('//') && !requested.startsWith('/\\')
          ? requested
          : null;
      const targetUrl = safeRequested || data.user?.redirectUrl || '/dashboard';
      router.push(targetUrl);
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessMessage('');

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setRegError(isArabic ? 'يرجى إكمال جميع الحقول المطلوبة' : 'Please complete all required fields');
      return;
    }

    if (!isPasswordValid) {
      setRegError(isArabic ? 'كلمة المرور لا تفي بالمعايير الأمنية' : 'Password does not meet all security complexity requirements');
      return;
    }

    if (!consentPdpl) {
      setRegError(isArabic ? 'الموافقة على سياسة الخصوصية PDPL مطلوبة للمتابعة' : 'Explicit consent under UAE PDPL Law No. 45/2021 is mandatory');
      return;
    }

    setRegLoading(true);
    try {
      const response = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          displayName: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
          phone: regPhone.trim() || undefined,
          emirate: regEmirate,
          consentPdpl: true,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(apiErrorMessage(data, 'Registration failed. An account may already exist with this email.'));
      }

      setRegSuccessMessage(
        EMAIL_DELIVERY_AVAILABLE
          ? isArabic
            ? 'تم إنشاء الحساب. يرجى فتح رابط التحقق المرسل إلى بريدك الإلكتروني لتفعيل الحساب.'
            : 'Account created. Please open the verification link sent to your email before logging in.'
          : isArabic
            ? 'تم إنشاء الحساب، لكن رسائل التحقق عبر البريد الإلكتروني غير مفعّلة بعد. لا يمكن تفعيل الحساب حتى يتم تفعيل خدمة البريد أو يقوم فريق الدعم بتفعيله.'
            : 'Account created, but verification emails are not being sent yet. Your account cannot be activated until email delivery is connected or support activates it.'
      );

      setTimeout(() => {
        setActiveTab('login');
        setLoginEmail(regEmail);
      }, 4000);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="bg-[#0b0f17] font-body text-gray-100 antialiased min-h-screen flex flex-col justify-between selection:bg-[#d4af37] selection:text-black"
    >
      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 bg-[#0b0f17]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="h-20 max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#997d25] flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-[#d4af37]/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-black fill-current" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg lg:text-xl tracking-tight text-white block">
                AUTOMOTIVE<span className="text-[#d4af37]">OS</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-gray-400 block -mt-1 font-mono">
                UAE Unified Gateway
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocale(isArabic ? 'en' : 'ar')}
              className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-[#d4af37]/40 text-xs font-mono text-gray-300 flex items-center gap-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>{isArabic ? 'English' : 'العربية'}</span>
            </button>
            <Link
              href="/"
              className="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              {isArabic ? 'العودة للسوق' : 'Browse Cars'}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 pt-28 pb-16 px-4 max-w-7xl mx-auto w-full flex items-center justify-center">
        <div className="w-full max-w-xl">
          {/* Unified Tab Pill Selector */}
          <div className="mb-8 p-1.5 bg-black/40 border border-white/10 rounded-2xl flex items-center gap-2 backdrop-blur-xl shadow-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                router.replace('/auth?tab=login');
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b39129] text-black shadow-lg shadow-[#d4af37]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>{isArabic ? 'تسجيل الدخول الموحد' : 'Sign In'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                router.replace('/auth?tab=register');
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b39129] text-black shadow-lg shadow-[#d4af37]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isArabic ? 'حساب عميل جديد' : 'Customer Signup'}</span>
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-[#121824]/90 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
            {/* Ambient Gold Glow */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

            {/* TAB 1: LOGIN */}
            {activeTab === 'login' && (
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-mono mb-3">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Single Sign-On (SSO) Portal</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                    {isArabic ? 'تسجيل الدخول إلى النظام' : 'Welcome to Automotive OS'}
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">
                    {isArabic
                      ? 'مدخل مركزي موحد للمشترين، موظفي الوكالات، ومديري المنصة'
                      : 'One secure authentication gateway for Buyers, Verified Dealerships, and Platform Administration'}
                  </p>
                </div>

                {loginError && (
                  <div role="alert" className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      {loginError}
                      {loginNeedsVerification && (
                        <>
                          {' '}
                          <Link href="/auth/verify-email" className="text-[#d4af37] underline">
                            {isArabic ? 'التحقق من البريد أو إعادة الإرسال' : 'Verify email or resend link'}
                          </Link>
                        </>
                      )}
                    </span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="login-email" className="block text-xs uppercase tracking-wider text-gray-400 font-mono mb-2">
                      {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="user@autonexa.ae"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] text-white text-sm outline-none transition-all placeholder:text-gray-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="login-password" className="block text-xs uppercase tracking-wider text-gray-400 font-mono">
                        {isArabic ? 'كلمة المرور' : 'Master Passcode'}
                      </label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-xs text-[#d4af37] hover:underline"
                      >
                        {isArabic ? 'نسيت الرمز؟' : 'Forgot passcode?'}
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        id="login-password"
                        autoComplete="current-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] text-white text-sm outline-none transition-all placeholder:text-gray-600 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        aria-label={showLoginPassword ? (isArabic ? 'إخفاء كلمة المرور' : 'Hide password') : (isArabic ? 'إظهار كلمة المرور' : 'Show password')}
                        aria-pressed={showLoginPassword}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full mt-4 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b39129] hover:from-[#e5be3b] hover:to-[#c4a132] text-black font-bold text-sm tracking-wide shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loginLoading ? (
                      <span>{isArabic ? 'جاري التحقق...' : 'Authenticating...'}</span>
                    ) : (
                      <>
                        <span>{isArabic ? 'تسجيل الدخول والمتابعة' : 'Sign In to Dashboard'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Role Redirection Information Note */}
                <div className="mt-8 pt-6 border-t border-white/10 text-xs text-gray-400 space-y-2">
                  <div className="flex items-center gap-2 text-gray-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Automatic Role-Based Redirection:</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                    <li className="p-2 rounded-lg bg-black/30 border border-white/5">
                      <strong className="text-white block">Platform Admin</strong>
                      /admin
                    </li>
                    <li className="p-2 rounded-lg bg-black/30 border border-white/5">
                      <strong className="text-white block">Dealership Staff</strong>
                      /dealer
                    </li>
                    <li className="p-2 rounded-lg bg-black/30 border border-white/5">
                      <strong className="text-white block">Verified Buyer</strong>
                      /account/garage
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 2: CUSTOMER SIGNUP */}
            {activeTab === 'register' && (
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-mono mb-3">
                    <Car className="w-3.5 h-3.5" />
                    <span>Retail Buyer & VIP Collector</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                    {isArabic ? 'إنشاء حساب مشترٍ معتمد' : 'Create Customer Account'}
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">
                    {isArabic
                      ? 'تسجيل ذاتي للمشترين فقط. حسابات الوكالات والإدارة تمنح عبر المشرفين حصراً.'
                      : 'Customer self-registration only. Dealership and Admin access is provisioned by enterprise administration.'}
                  </p>
                </div>

                {regError && (
                  <div role="alert" className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>{regError}</span>
                  </div>
                )}

                {regSuccessMessage && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-sm flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{regSuccessMessage}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="register-name" className="block text-xs uppercase tracking-wider text-gray-400 font-mono mb-2">
                      {isArabic ? 'الاسم الكامل أو اسم الجهة' : 'Full Name / Primary Contact'} *
                    </label>
                    <input
                      id="register-name"
                      autoComplete="name"
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Sultan Al Qasimi"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] text-white text-sm outline-none transition-all placeholder:text-gray-600"
                    />
                  </div>

                  <div>
                    <label htmlFor="register-email" className="block text-xs uppercase tracking-wider text-gray-400 font-mono mb-2">
                      {isArabic ? 'البريد الإلكتروني' : 'Email Address'} *
                    </label>
                    <input
                      id="register-email"
                      autoComplete="email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="client@domain.ae"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] text-white text-sm outline-none transition-all placeholder:text-gray-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="register-phone" className="block text-xs uppercase tracking-wider text-gray-400 font-mono mb-2">
                        {isArabic ? 'رقم الهاتف (اختياري)' : 'UAE Mobile (Optional)'}
                      </label>
                      <input
                        id="register-phone"
                        autoComplete="tel"
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+971 50 123 4567"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] text-white text-sm outline-none transition-all placeholder:text-gray-600"
                      />
                    </div>
                    <div>
                      <label htmlFor="register-emirate" className="block text-xs uppercase tracking-wider text-gray-400 font-mono mb-2">
                        {isArabic ? 'الإمارة' : 'Primary Emirate'}
                      </label>
                      <select
                        id="register-emirate"
                        value={regEmirate}
                        onChange={(e) => setRegEmirate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] text-white text-sm outline-none transition-all"
                      >
                        <option value="Dubai" className="bg-[#121824]">Dubai (دبي)</option>
                        <option value="Abu Dhabi" className="bg-[#121824]">Abu Dhabi (أبوظبي)</option>
                        <option value="Sharjah" className="bg-[#121824]">Sharjah (الشارقة)</option>
                        <option value="Ajman" className="bg-[#121824]">Ajman (عجمان)</option>
                        <option value="Ras Al Khaimah" className="bg-[#121824]">Ras Al Khaimah (رأس الخيمة)</option>
                        <option value="Fujairah" className="bg-[#121824]">Fujairah (الفجيرة)</option>
                        <option value="Umm Al Quwain" className="bg-[#121824]">Umm Al Quwain (أم القيوين)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="register-password" className="block text-xs uppercase tracking-wider text-gray-400 font-mono mb-2">
                      {isArabic ? 'كلمة المرور' : 'Create Master Password'} *
                    </label>
                    <div className="relative">
                      <input
                        id="register-password"
                        autoComplete="new-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] text-white text-sm outline-none transition-all placeholder:text-gray-600 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        aria-label={showRegPassword ? (isArabic ? 'إخفاء كلمة المرور' : 'Hide password') : (isArabic ? 'إظهار كلمة المرور' : 'Show password')}
                        aria-pressed={showRegPassword}
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Checklist */}
                    <div className="mt-2.5 p-3 rounded-xl bg-black/30 border border-white/5 text-[11px] grid grid-cols-2 gap-1.5 font-mono">
                      <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>10+ Characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>Uppercase Letter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {hasLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>Lowercase Letter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasNumber && hasSpecial ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {hasNumber && hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>Number & Special Symbol</span>
                      </div>
                    </div>
                  </div>

                  {/* PDPL Consent Agreement */}
                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={consentPdpl}
                        onChange={(e) => setConsentPdpl(e.target.checked)}
                        required
                        className="mt-1 w-4 h-4 rounded border-white/20 bg-black/40 text-[#d4af37] focus:ring-[#d4af37]"
                      />
                      <span className="text-xs text-gray-300 leading-relaxed">
                        {isArabic ? (
                          <>
                            أوافق بموجب هذا على معالجة بياناتي وفقاً لأحكام{' '}
                            <span className="text-[#d4af37] font-semibold">
                              مرسوم بقانون اتحادي رقم (45) لسنة 2021
                            </span>{' '}
                            بشأن حماية البيانات الشخصية (PDPL).
                          </>
                        ) : (
                          <>
                            I consent to personal data intake under{' '}
                            <span className="text-[#d4af37] font-semibold">
                              UAE Federal Decree-Law No. 45/2021 (PDPL)
                            </span>{' '}
                            for verified vehicle enquiries and garage management.
                          </>
                        )}
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading || !isPasswordValid || !consentPdpl}
                    className="w-full mt-4 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b39129] hover:from-[#e5be3b] hover:to-[#c4a132] text-black font-bold text-sm tracking-wide shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  >
                    {regLoading ? (
                      <span>{isArabic ? 'جاري إنشاء الحساب...' : 'Creating Account...'}</span>
                    ) : (
                      <>
                        <span>{isArabic ? 'إتمام التسجيل والدخول' : 'Complete Registration'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-gray-400">
                  <span>{isArabic ? 'لديك حساب بالفعل؟' : 'Already have an account?'} </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-[#d4af37] hover:underline font-semibold"
                  >
                    {isArabic ? 'سجل الدخول هنا' : 'Sign In here'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5 bg-[#0b0f17] text-center text-xs text-gray-500 font-mono">
        <p>© 2026 Automotive OS — UAE Dealership SaaS & Verified Marketplace. All rights reserved.</p>
      </footer>
    </div>
  );
}
