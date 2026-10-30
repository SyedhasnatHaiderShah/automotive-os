'use client';

import React, { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, User } from 'lucide-react';
import { MarketplaceFooter } from '@automotive-os/ui';

type Locale = 'en' | 'ar';

const LocaleContext = createContext<{ locale: Locale; isArabic: boolean }>({
  locale: 'en',
  isArabic: false,
});

export function useAccountLocale() {
  return useContext(LocaleContext);
}

const ACCOUNT_NAV: { href: string; en: string; ar: string }[] = [
  { href: '/account/enquiries', en: 'Enquiries', ar: 'الاستفسارات' },
  { href: '/account/garage', en: 'Appointments', ar: 'المواعيد' },
  { href: '/account/saved', en: 'Saved', ar: 'المحفوظات' },
  { href: '/account/profile', en: 'Profile & privacy', ar: 'الملف والخصوصية' },
  { href: '/account/settings', en: 'Settings', ar: 'الإعدادات' },
];

interface AccountShellProps {
  /** Real display name from GET /api/v1/me, passed by the server page. */
  displayName?: string | null;
  title: string;
  titleAr: string;
  subtitle?: string;
  subtitleAr?: string;
  children: React.ReactNode;
}

/**
 * Shared buyer-account chrome (Obsidian & Studio Glass). Shows only real session
 * data: the display name comes from the API, never a persona.
 */
export function AccountShell({
  displayName,
  title,
  titleAr,
  subtitle,
  subtitleAr,
  children,
}: AccountShellProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const isArabic = locale === 'ar';
  const pathname = usePathname();

  return (
    <LocaleContext.Provider value={{ locale, isArabic }}>
      <div
        dir={isArabic ? 'rtl' : 'ltr'}
        lang={locale}
        className="min-h-screen bg-[#101419] text-[#e0e2ea] font-body flex flex-col"
      >
        <header className="fixed top-0 w-full z-50 bg-[#101419]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.40)] border-b border-[#262a30]/50">
          <div className="h-20 max-w-[1440px] mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50] rounded">
              <div className="w-9 h-9 rounded bg-[#262a30] flex items-center justify-center shadow-inner">
                <Car className="w-5 h-5 text-[#f2ca50]" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[#e0e2ea] group-hover:text-[#f2ca50] transition-colors uppercase">
                Automotive<span className="text-[#f2ca50] font-bold">OS</span>
              </span>
            </Link>

            <nav aria-label={isArabic ? 'التنقل الرئيسي' : 'Main'} className="hidden lg:flex items-center gap-1 p-1 bg-[#0a0e13]/80 rounded-xl">
              {[
                { href: '/cars', en: 'Browse Stock', ar: 'تصفح السيارات' },
                { href: '/dealers', en: 'Verified Dealers', ar: 'الوكلاء المعتمدون' },
                { href: '/compare', en: 'Compare Vehicles', ar: 'مقارنة السيارات' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 text-sm text-[#d0c5af] hover:text-[#e0e2ea] hover:bg-[#262a30] transition-all rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]"
                >
                  {isArabic ? item.ar : item.en}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 bg-[#0a0e13] rounded-lg" role="group" aria-label="Language">
                {(['en', 'ar'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLocale(l)}
                    aria-pressed={locale === l}
                    className={`px-2 py-1 rounded text-[11px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50] ${
                      locale === l ? 'text-[#f2ca50] bg-[#262a30]/60' : 'text-[#d0c5af]'
                    }`}
                  >
                    {l === 'en' ? 'EN' : 'العربية'}
                  </button>
                ))}
              </div>
              <Link
                href="/account/profile"
                className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-[#181c21] hover:bg-[#262a30] transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]"
              >
                <div className="w-8 h-8 rounded-full bg-[#f2ca50] flex items-center justify-center">
                  <User className="w-4 h-4 text-[#241a00]" aria-hidden="true" />
                </div>
                <span className="hidden md:inline text-xs text-[#e0e2ea] font-semibold group-hover:text-[#f2ca50] transition-colors max-w-[160px] truncate">
                  {displayName || (isArabic ? 'حسابي' : 'My account')}
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="w-full pt-20 flex-1 relative overflow-hidden">
          <div className="absolute -top-32 left-1/4 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-[140px] pointer-events-none" aria-hidden="true" />
          <div className="relative max-w-[1440px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-8">
            <nav aria-label={isArabic ? 'قائمة الحساب' : 'Account'} className="flex flex-wrap gap-2">
              {ACCOUNT_NAV.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50] ${
                      active
                        ? 'bg-[#f2ca50] text-[#241a00]'
                        : 'bg-[#181c21] text-[#d0c5af] hover:bg-[#262a30] hover:text-[#e0e2ea]'
                    }`}
                  >
                    {isArabic ? item.ar : item.en}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-col gap-1 max-w-4xl">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-[#e0e2ea] tracking-tight leading-tight">
                {isArabic ? titleAr : title}
              </h1>
              {(subtitle || subtitleAr) && (
                <p className="text-base text-[#d0c5af]/90 max-w-2xl mt-1">
                  {isArabic ? subtitleAr || subtitle : subtitle}
                </p>
              )}
            </div>

            {children}
          </div>
        </main>

        <MarketplaceFooter locale={locale} />
      </div>
    </LocaleContext.Provider>
  );
}

/** Glass card used by account pages. */
export function AccountCard({
  children,
  className = '',
  ...rest
}: React.HTMLAttributes<HTMLElement> & { children: React.ReactNode }) {
  return (
    <section
      {...rest}
      className={`rounded-2xl bg-[#181c21]/70 backdrop-blur-xl border border-[#262a30] shadow-lg p-6 ${className}`}
    >
      {children}
    </section>
  );
}

export function StatusMessage({
  kind,
  children,
}: {
  kind: 'success' | 'error' | 'info';
  children: React.ReactNode;
}) {
  const styles =
    kind === 'success'
      ? 'bg-[#58e7aa]/10 border-[#58e7aa]/40 text-[#58e7aa]'
      : kind === 'error'
      ? 'bg-[#93000a]/20 border-[#ffb4ab]/40 text-[#ffb4ab]'
      : 'bg-[#262a30]/80 border-[#31353b] text-[#d0c5af]';
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`px-4 py-3 rounded-xl border text-sm ${styles}`}>
      {children}
    </div>
  );
}

/** Formats a UTC timestamp for display in Asia/Dubai. */
export function formatDubai(iso: string | null | undefined, withTime = true): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Asia/Dubai',
  });
}
