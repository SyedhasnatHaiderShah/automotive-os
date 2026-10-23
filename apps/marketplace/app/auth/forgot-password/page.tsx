'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  Car,
  Globe,
  Fingerprint,
  CheckCircle2,
  RefreshCw,
  Landmark,
  ChevronRight,
  Smartphone,
  Check,
  Phone,
  Video,
  Usb,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [countdown, setCountdown] = useState(102); // 01:42 in seconds
  const [otpCountdown, setOtpCountdown] = useState(48); // 48 seconds
  const [showFallback, setShowFallback] = useState(false);
  const [otpValues, setOtpValues] = useState(['7', '2', '9', '', '', '']);
  const [masterPass, setMasterPass] = useState('Sovereign#Dxb2025!');
  const [confirmPass, setConfirmPass] = useState('Sovereign#Dxb2025!');
  const [showPass, setShowPass] = useState(false);
  const [vaultPin, setVaultPin] = useState(['9', '0', '2', '1', '8', '4']);
  const [confirmVaultPin, setConfirmVaultPin] = useState(['9', '0', '2', '1', '8', '4']);
  const [revokeSessions, setRevokeSessions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isArabic = locale === 'ar';

  // Live timer for UAE PASS challenge token
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 120));
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, val: string) => {
    const char = val.slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = char;
    setOtpValues(newOtp);
  };

  const handleVaultPinChange = (index: number, val: string) => {
    const char = val.slice(-1);
    const newPin = [...vaultPin];
    newPin[index] = char;
    setVaultPin(newPin);
  };

  const handleConfirmVaultPinChange = (index: number, val: string) => {
    const char = val.slice(-1);
    const newPin = [...confirmVaultPin];
    newPin[index] = char;
    setConfirmVaultPin(newPin);
  };

  const handleSubmitReset = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    }, 1500);
  };

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="bg-surface font-body text-on-surface antialiased min-h-screen flex flex-col justify-between selection:bg-primary selection:text-on-primary"
    >
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-2xl">
        <div className="h-20 max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
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

          <nav className="hidden md:flex items-center gap-1 bg-surface-container-lowest/80 p-1.5 rounded-xl border border-outline-variant/20">
            <Link
              href="/auth/login"
              className="px-4 py-1.5 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
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
              href="/auth/forgot-password"
              className="px-4 py-1.5 rounded-lg text-sm bg-surface-container-high text-primary font-semibold"
            >
              {isArabic ? 'استعادة الحساب السيادي' : 'Recovery Gateway'}
            </Link>
          </nav>

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

      {/* Main Container */}
      <main className="w-full pt-20 bg-surface flex-1 flex flex-col justify-start relative overflow-hidden">
        {/* Cryptographic Glow Overlays */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[720px] h-[520px] bg-gradient-to-br from-primary/10 via-surface-container/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-48 right-10 w-[500px] h-[400px] bg-gradient-to-bl from-secondary-container/10 via-transparent to-transparent blur-2xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-8 pb-16 w-full">
          {/* Breadcrumb & Protocol Attestation Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-2 text-on-surface-variant text-xs">
              <Link href="/" className="hover:text-primary transition-colors">
                {isArabic ? 'مركز القيادة' : 'Command Hub'}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/auth/login" className="hover:text-primary transition-colors">
                {isArabic ? 'بوابة التوثيق' : 'Authentication Gateway'}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-primary font-medium">
                {isArabic ? 'استعادة الحساب السيادي' : 'Sovereign Account Recovery'}
              </span>
              <span className="text-outline-variant mx-1">/</span>
              <span className="font-mono text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded text-[11px]">
                DXB-REC-89021-SEC
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                <span className="font-mono text-[10px] uppercase text-tertiary tracking-wider font-semibold">
                  UAE IAL-3 PROTOCOL ATTESTED
                </span>
                <span className="text-on-surface-variant text-[10px]">
                  | بروتوكول التوثيق السيادي
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-on-surface-variant font-mono text-xs bg-surface-container-low px-2.5 py-1 rounded border border-outline-variant/30">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>ECDSA-P384</span>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {isSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-tertiary-container/30 border border-tertiary text-on-surface flex items-center gap-3 shadow-xl animate-fade-in">
              <CheckCircle2 className="w-6 h-6 text-tertiary shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-sm">
                  {isArabic ? 'تمت استعادة الرمز السيادي وإعادة التشفير بنجاح' : 'Sovereign Credentials & Vault PIN Successfully Reset'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {isArabic ? 'تم إنهاء الجلسات السابقة وتفعيل التجميد الإلزامي لمدة 24 ساعة. جاري التحويل لتسجيل الدخول...' : 'Active sessions flushed. 24-Hour settlement freeze active. Redirecting to login portal...'}
                </p>
              </div>
            </div>
          )}

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 8 Columns: Orchestration Flow */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Orchestration Header Card */}
              <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                        <Key className="w-5 h-5" />
                      </div>
                      <h1 className="font-display text-2xl font-bold text-on-surface tracking-tight">
                        {isArabic ? 'إعادة تعيين الرمز السيادي' : 'Sovereign Credential Reset'}
                      </h1>
                    </div>
                    <p className="text-sm text-on-surface-variant mt-1.5">
                      {isArabic
                        ? 'إعادة المصادقة البيومترية وتوليد مفاتيح التوقيع الرقمية للوصول لمحفظة الأصول وسجل السيارات الفاخرة.'
                        : 'Orchestrate biometric re-attestation and regenerate sovereign signing keys for Escrow & Hypercar registry access.'}
                    </p>
                    <span className="text-xs text-on-surface-variant/80 mt-0.5" dir="rtl">
                      استعادة مفاتيح التوقيع الرقمي والوصول لمحفظة الأصول الفاخرة
                    </span>
                  </div>

                  <div className="flex flex-col items-start md:items-end bg-surface-container px-3.5 py-2 rounded-xl border border-outline-variant/30">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Clearance Level
                    </span>
                    <span className="font-mono text-xs text-primary font-bold">
                      TIER-1 PRIVATE VAULT
                    </span>
                  </div>
                </div>

                {/* 4-Step Progress Stepper */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2">
                  <div className="flex flex-col p-3 rounded-xl bg-surface-container border border-outline-variant/30">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-tertiary">01 / IDENT</span>
                      <CheckCircle2 className="w-4 h-4 text-tertiary" />
                    </div>
                    <span className="text-xs text-on-surface font-semibold mt-1">Emirates ID</span>
                    <span className="font-mono text-[11px] text-on-surface-variant truncate">
                      784-1988-4920194-1
                    </span>
                  </div>

                  <div className="flex flex-col p-3 rounded-xl bg-surface-container-high relative shadow-sm border border-primary/50">
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary rounded-b-xl" />
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-primary font-bold">02 / VERIFY</span>
                      <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    </div>
                    <span className="text-xs text-on-surface font-bold mt-1">UAE PASS Biometric</span>
                    <span className="text-[11px] text-primary font-medium">Pending Match</span>
                  </div>

                  <div className="flex flex-col p-3 rounded-xl bg-surface-container/60 opacity-80 border border-outline-variant/20">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-on-surface-variant">03 / CREDENTIALS</span>
                      <Key className="w-3.5 h-3.5 text-on-surface-variant" />
                    </div>
                    <span className="text-xs text-on-surface-variant font-medium mt-1">Passcode & PIN</span>
                    <span className="text-[11px] text-on-surface-variant">Dual-Entropy</span>
                  </div>

                  <div className="flex flex-col p-3 rounded-xl bg-surface-container/60 opacity-60 border border-outline-variant/20">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-on-surface-variant">04 / CLEARANCE</span>
                      <Shield className="w-3.5 h-3.5 text-on-surface-variant" />
                    </div>
                    <span className="text-xs text-on-surface-variant font-medium mt-1">Re-encryption</span>
                    <span className="text-[11px] text-on-surface-variant">Session Flush</span>
                  </div>
                </div>
              </div>

              {/* PRIMARY CHANNEL: UAE PASS Instant Biometric Re-attestation */}
              <div className="bg-surface-container border border-outline-variant/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary border border-outline-variant/30">
                      <Fingerprint className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-base font-bold text-on-surface">
                          {isArabic ? 'القناة الأساسية: التوثيق البيومتري الفوري عبر الهوية الرقمية' : 'Primary: UAE PASS Instant Biometric Re-attestation'}
                        </h2>
                        <span className="bg-primary/20 text-primary font-mono text-[10px] px-2 py-0.5 rounded uppercase font-semibold">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {isArabic ? 'توثيق بدون كشف البيانات وبدون إرسال كلمات المرور يدوياً.' : 'Zero-Knowledge attestation with zero manual password transmission.'}
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-highest border border-outline-variant/30 font-mono text-xs text-on-surface-variant">
                    <CheckCircle2 className="w-3.5 h-3.5 text-tertiary" />
                    <span>Tier-A Certified</span>
                  </div>
                </div>

                {/* Attested Profile & Challenge Token Matching Box */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 mb-6">
                  <div className="md:col-span-7 flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">
                        {isArabic ? 'الملف الشخصي المعتمد' : 'Authenticated Principal Profile'}
                      </span>
                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary font-display text-base font-bold border border-outline-variant/40 shadow-inner">
                          TA
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-display text-sm font-bold text-on-surface">
                              Sheikh / Dr. Tariq Al-Hashimi
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-tertiary" />
                          </div>
                          <span className="font-mono text-xs text-on-surface-variant block">
                            UID: 784-1988-4920194-1
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            Affiliation: Al-Hashimi Sovereign Family Office (DIFC)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-2 flex items-center gap-2 text-on-surface-variant text-xs">
                      <Smartphone className="w-4 h-4 text-tertiary shrink-0" />
                      <span>Push notification dispatched to iPhone 15 Pro (UAE-PASS registered)</span>
                    </div>
                  </div>

                  {/* Challenge Token Matching Box (#84) */}
                  <div className="md:col-span-5 bg-surface-container-high p-4 rounded-xl flex flex-col items-center justify-center text-center border border-outline-variant/40 shadow-inner">
                    <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-widest">
                      {isArabic ? 'رمز المطابقة' : 'Confirmation Token'}
                    </span>
                    <span className="font-display text-4xl font-bold text-primary tracking-tight my-1">
                      84
                    </span>
                    <p className="text-xs text-on-surface px-2">
                      {isArabic
                        ? 'طابق الرقم 84 في تطبيق الهوية الرقمية لتأكيد هويتك'
                        : 'Match number 84 in your UAE PASS mobile application prompt to attest identity.'}
                    </p>
                    <div className="flex items-center gap-2 mt-3 font-mono text-xs text-tertiary">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Awaiting signature: {formatTime(countdown)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Triggers */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCountdown(120)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{isArabic ? 'إعادة إرسال الإشعار البيومتري' : 'Re-send UAE PASS Mobile Biometric Push'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFallback(!showFallback)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface border border-outline-variant/30 text-xs font-medium transition-colors"
                  >
                    {showFallback
                      ? (isArabic ? 'إخفاء قنوات التوثيق البديلة' : 'Hide Fallback Verification Channels')
                      : (isArabic ? 'استخدام قنوات التوثيق البديلة' : 'Use Fallback Verification Channels')}
                  </button>
                </div>
              </div>

              {/* SECONDARY PROTOCOL: Fallback OTP & Cold Vault Seed */}
              {showFallback && (
                <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-6 shadow-xl flex flex-col gap-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant border border-outline-variant/30">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-sm font-bold text-on-surface">
                          {isArabic ? 'البروتوكول الثانوي: رمز التحقق والأمان غير المتصل' : 'Secondary Protocol: Multi-Factor OTP & HSM Recovery Token'}
                        </h3>
                        <p className="text-xs text-on-surface-variant">
                          Deploy segmented SMS/Corporate Email OTP or institutional recovery seed phrase.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container border border-outline-variant/30 text-on-surface-variant uppercase">
                      Fallback Rail
                    </span>
                  </div>

                  {/* 6-Digit Segmented Box Inputs */}
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-on-surface font-medium flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-primary" />
                        <span>Enter 6-Digit Institutional Authentication Code</span>
                      </label>
                      <span className="font-mono text-xs text-on-surface-variant">
                        Code expires in: <span className="text-primary font-semibold">{otpCountdown}s</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-6 gap-2 sm:gap-3 max-w-sm">
                      {otpValues.map((digit, i) => (
                        <input
                          key={i}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          placeholder="·"
                          className="h-11 text-center font-mono text-base font-bold bg-surface-container-highest text-on-surface rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                        />
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setOtpCountdown(60)}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Resend SMS to +971 50 ••• ••94</span>
                      </button>
                      <span className="text-outline-variant">|</span>
                      <span className="text-tertiary flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Deliver via WhatsApp VIP Desk</span>
                      </span>
                    </div>
                  </div>

                  {/* Air-Gapped Cold Vault Seed Phrase / Hardware Key */}
                  <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-secondary" />
                        <span>Institutional Hardware Key or 24-Word Recovery Phrase (Optional)</span>
                      </span>
                      <span className="font-mono text-[10px] text-on-surface-variant uppercase">
                        Air-gapped Cold Vault
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Enter cold-storage seed phrase or attach YubiKey FIPS 140-3 token..."
                        className="w-full h-11 px-4 pr-10 rounded-lg bg-surface-container-highest text-on-surface font-mono text-xs placeholder:text-outline-variant border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                      />
                      <Usb className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 DIRECT FORM: Master Passcode & Sovereign Vault PIN Reset */}
              <form onSubmit={handleSubmitReset} className="bg-surface-container border border-outline-variant/40 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                        <Key className="w-4 h-4" />
                      </div>
                      <h3 className="font-display text-base font-bold text-on-surface">
                        {isArabic ? 'توليد رمز المرور ورقم المحفظة السيادية الجديد' : 'Generate New Sovereign Master Passcode & PIN'}
                      </h3>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {isArabic ? 'تأسيس اعتمادات مشفرة مستقلة عبر قنوات التسوية في دول الخليج.' : 'Establishes new cryptographically isolated credentials across all GCC settlement channels.'}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-primary bg-primary/10 border border-primary/30 px-2.5 py-1 rounded">
                    FIPS-200 REQ
                  </span>
                </div>

                {/* Master Passcode Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-on-surface font-semibold">
                        {isArabic ? 'رمز المرور الرئيسي الجديد' : 'New Master Passcode'}
                      </label>
                      <span className="font-mono text-[10px] text-on-surface-variant">Min. 14 Chars</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={masterPass}
                        onChange={(e) => setMasterPass(e.target.value)}
                        className="w-full h-11 px-4 pr-10 rounded-xl bg-surface-container-high text-on-surface text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-on-surface font-semibold">
                      {isArabic ? 'تأكيد رمز المرور الجديد' : 'Confirm New Master Passcode'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        className="w-full h-11 px-4 pr-10 rounded-xl bg-surface-container-high text-on-surface text-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                      />
                      <Check className="w-4 h-4 text-tertiary absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* Entropy Meter */}
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant font-medium">Cryptographic Entropy Rating</span>
                    <span className="text-tertiary font-mono font-bold">96.4% — EXCELLENT / INSTITUTIONAL GRADE</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden flex">
                    <div className="h-full bg-tertiary rounded-full transition-all duration-500 w-[96%]" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-on-surface-variant">
                    <div className="flex items-center gap-1 text-tertiary">
                      <Check className="w-3.5 h-3.5" />
                      <span>14+ Length (18 chars)</span>
                    </div>
                    <div className="flex items-center gap-1 text-tertiary">
                      <Check className="w-3.5 h-3.5" />
                      <span>Uppercase & Lower</span>
                    </div>
                    <div className="flex items-center gap-1 text-tertiary">
                      <Check className="w-3.5 h-3.5" />
                      <span>Special Characters</span>
                    </div>
                    <div className="flex items-center gap-1 text-tertiary">
                      <Check className="w-3.5 h-3.5" />
                      <span>Dictionary Resilient</span>
                    </div>
                  </div>
                </div>

                {/* 6-Digit Sovereign Vault PIN */}
                <div className="p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/40 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <span>{isArabic ? 'الرقم السري للمحفظة السيادية (6 أرقام)' : 'New 6-Digit Sovereign Vault PIN'}</span>
                        <span className="font-mono text-[10px] bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded">
                          HIGH VALUE SETTLEMENTS
                        </span>
                      </h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {isArabic
                          ? 'يصرح بالإفراج عن أموال الضمان ونقل الملكيات والمزايدات التي تتجاوز 1,000,000 درهم.'
                          : 'Authorizes CBUAE Escrow releases, title transfers, and live hypercar auction bids exceeding AED 1,000,000.'}
                      </p>
                    </div>
                    <span className="text-xs text-on-surface-variant" dir="rtl">
                      رمز الأمان للمعاملات المصرفية الكبرى
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-xs text-on-surface-variant block">Enter 6-Digit Vault PIN</span>
                      <div className="flex items-center gap-2">
                        {vaultPin.map((p, i) => (
                          <input
                            key={i}
                            type="password"
                            maxLength={1}
                            value={p}
                            onChange={(e) => handleVaultPinChange(i, e.target.value)}
                            className="w-10 h-11 text-center font-mono text-base font-bold bg-surface-container text-on-surface rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs text-on-surface-variant block">Re-enter 6-Digit Vault PIN</span>
                      <div className="flex items-center gap-2">
                        {confirmVaultPin.map((p, i) => (
                          <input
                            key={i}
                            type="password"
                            maxLength={1}
                            value={p}
                            onChange={(e) => handleConfirmVaultPinChange(i, e.target.value)}
                            className="w-10 h-11 text-center font-mono text-base font-bold bg-surface-container text-on-surface rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Execution Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <Link
                    href="/auth/login"
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface text-xs font-semibold border border-outline-variant/30 text-center transition-colors"
                  >
                    {isArabic ? 'إلغاء والعودة لتسجيل الدخول' : 'Cancel & Return to Sign In'}
                  </Link>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-display font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{isArabic ? 'جاري إعادة التشفير...' : 'Re-encrypting Vault Keys...'}</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>{isArabic ? 'اعتماد وإعادة تعيين الرمز السيادي' : 'Attest & Reset Sovereign Credentials'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right 4 Columns: Sovereign Security Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Vault Security Dossier */}
              <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex items-center gap-2 text-primary font-display text-base font-bold">
                  <Landmark className="w-5 h-5" />
                  <span>{isArabic ? 'ملف أمان المحفظة السيادية' : 'Vault Security Dossier'}</span>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-1.5 shadow-inner">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                    {isArabic ? 'رؤوس الأموال وعقود الملكية المدارة' : 'Governed Capital & Titles'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-primary font-bold">AED</span>
                    <span className="font-display text-2xl font-bold text-on-surface">842,500,000</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Credentials govern First Abu Dhabi Bank (FAB) designated escrow repositories, 28 registered hypercar VIN titles, and allocation reservations.
                  </p>
                </div>

                {/* 24-Hour Settlement Freeze Notice */}
                <div className="p-4 rounded-xl bg-error-container/20 border border-error/40 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-error text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>24-Hour Mandatory Settlement Freeze</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    In strict compliance with <strong className="text-on-surface">CBUAE Regulation 29/2011</strong>, outbound escrow releases exceeding <span className="text-primary font-mono font-semibold">AED 500,000</span> are placed on temporary 24-hour review following credential updates.
                  </p>
                  <span className="text-[10px] text-on-surface-variant/80 mt-0.5" dir="rtl">
                    تجميد إلزامي لمدة ٢٤ ساعة على الحوالات الكبرى بعد إعادة التعيين
                  </span>
                </div>

                {/* Revoke Sessions Toggle */}
                <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/30 flex items-start gap-3 shadow-sm">
                  <input
                    type="checkbox"
                    id="revoke-sessions"
                    checked={revokeSessions}
                    onChange={(e) => setRevokeSessions(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-primary bg-surface-container focus:ring-primary border border-outline-variant cursor-pointer"
                  />
                  <label htmlFor="revoke-sessions" className="flex flex-col cursor-pointer select-none">
                    <span className="text-xs font-bold text-on-surface">
                      {isArabic ? 'إنهاء كافة الجلسات النشطة فوراً' : 'Terminate All Active Sessions'}
                    </span>
                    <span className="text-[11px] text-on-surface-variant leading-normal mt-0.5">
                      Immediately flushes 4 authenticated terminal nodes across DIFC, London Mayfair, and Zurich desks.
                    </span>
                  </label>
                </div>

                {/* Threat Monitoring Telemetry */}
                <div className="flex flex-col gap-2 pt-1">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                    HSM Threat Vector Monitoring
                  </span>
                  <div className="w-full h-16 rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-2.5 flex items-end justify-between gap-1 shadow-inner">
                    <div className="w-full bg-surface-container-highest rounded-t h-[30%]" />
                    <div className="w-full bg-surface-container-highest rounded-t h-[45%]" />
                    <div className="w-full bg-surface-container-highest rounded-t h-[25%]" />
                    <div className="w-full bg-surface-container-highest rounded-t h-[60%]" />
                    <div className="w-full bg-surface-container-highest rounded-t h-[40%]" />
                    <div className="w-full bg-surface-container-highest rounded-t h-[75%]" />
                    <div className="w-full bg-tertiary rounded-t h-[98%]" />
                    <div className="w-full bg-surface-container-highest rounded-t h-[20%]" />
                    <div className="w-full bg-surface-container-highest rounded-t h-[35%]" />
                    <div className="w-full bg-surface-container-highest rounded-t h-[50%]" />
                  </div>
                  <div className="flex items-center justify-between font-mono text-[10px] text-on-surface-variant">
                    <span>0.00% INTRUSION RATE</span>
                    <span className="text-tertiary font-semibold">FIPS 140-3 LEVEL 4</span>
                  </div>
                </div>
              </div>

              {/* Private Client Sovereign Concierge Card */}
              <div className="bg-surface-container border border-outline-variant/40 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                    {isArabic ? 'المكتب الخاص للعملاء' : 'VIP Sovereign Desk'}
                  </span>
                  <span className="flex items-center gap-1.5 text-tertiary font-mono text-[11px] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                    <span>On Duty</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-primary font-display text-lg font-bold shadow-md">
                    MA
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display text-sm font-bold text-on-surface">
                      Marc Ackermann / T. Al-Hashemi
                    </span>
                    <span className="text-xs text-on-surface-variant">Senior Sovereign Risk Officer</span>
                    <span className="font-mono text-[10px] text-primary mt-0.5 font-semibold">BADGE #SEC-DXB-04</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1 text-xs text-on-surface-variant">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-high border border-outline-variant/30">
                    <span className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span>Direct Encrypted Line:</span>
                    </span>
                    <span className="font-mono text-on-surface font-semibold">+971 4 800 AUTO (Ext 401)</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-outline-variant/30 shadow-sm"
                >
                  <Video className="w-4 h-4 text-secondary" />
                  <span>Initiate Priority Video KYC Verification</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
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
