'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Car, Globe, KeyRound, Mail, ArrowLeft, Info } from 'lucide-react';

/**
 * Password reset is NOT implemented by the API yet (no reset endpoint exists in
 * apps/api/src/auth/auth.controller.ts). This page states that honestly instead of
 * simulating a reset flow.
 */
export default function ForgotPasswordPage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const isArabic = locale === 'ar';

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="bg-surface font-body text-on-surface antialiased min-h-screen flex flex-col justify-between selection:bg-primary selection:text-on-primary"
    >
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-2xl">
        <div className="h-20 max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <Car className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="font-display font-bold text-base md:text-lg uppercase tracking-wider text-on-surface">
              Automotive<span className="text-primary ml-1">OS</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setLocale(isArabic ? 'en' : 'ar')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant/40 text-xs font-mono uppercase tracking-widest text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <Globe className="w-4 h-4" aria-hidden="true" />
            {isArabic ? 'EN' : 'عربي'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pt-28 pb-16">
        <section
          aria-labelledby="reset-title"
          className="w-full max-w-lg bg-surface-container/60 backdrop-blur-xl border border-outline-variant/30 rounded-2xl p-8 shadow-2xl"
        >
          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-6">
            <KeyRound className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 id="reset-title" className="font-display text-2xl font-bold text-on-surface mb-3">
            {isArabic ? 'استعادة كلمة المرور' : 'Password reset'}
          </h1>

          <div role="status" className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-high border border-outline-variant/40 mb-6">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {isArabic
                ? 'إعادة تعيين كلمة المرور ذاتيًا غير متاحة بعد. يرجى التواصل مع فريق الدعم لاستعادة الوصول إلى حسابك.'
                : 'Self-service password reset is not available yet. Please contact support to regain access to your account.'}
            </p>
          </div>

          <p className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-on-surface-variant mb-8">
            <Mail className="w-4 h-4 text-primary" aria-hidden="true" />
            {isArabic ? 'لم يتم إرسال أي رسالة' : 'No reset email has been sent'}
          </p>

          <Link
            href="/auth?tab=login"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-primary"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
            {isArabic ? 'العودة إلى تسجيل الدخول' : 'Back to sign in'}
          </Link>
        </section>
      </main>

      <footer className="border-t border-outline-variant/30 py-6 text-center text-xs text-on-surface-variant font-mono">
        © {new Date().getFullYear()} Automotive OS
      </footer>
    </div>
  );
}
