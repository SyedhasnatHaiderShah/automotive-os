'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Admin console locale (AD-13).
 *
 * The choice is persisted in the `ao_locale` cookie so the server-rendered
 * root layout can set `<html lang dir>` on the first paint, and it is shared
 * through React context so it survives client-side navigation between pages.
 */
import { AdminLocale, LOCALE_COOKIE } from './locale-shared';

export type { AdminLocale } from './locale-shared';

interface LocaleContextValue {
  locale: AdminLocale;
  isRtl: boolean;
  setLocale: (next: AdminLocale) => void;
  toggleLocale: () => void;
  /** Pick the English or Arabic string for the active locale. */
  t: (en: string, ar: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: AdminLocale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<AdminLocale>(initialLocale);

  const setLocale = useCallback((next: AdminLocale) => {
    setLocaleState(next);
    try {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Cookie writes can be blocked; the in-memory choice still applies.
    }
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      isRtl: locale === 'ar',
      setLocale,
      toggleLocale: () => setLocale(locale === 'ar' ? 'en' : 'ar'),
      t: (en: string, ar: string) => (locale === 'ar' ? ar : en),
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Outside the provider (should not happen in the app shell): English, no-op setters.
    return {
      locale: 'en',
      isRtl: false,
      setLocale: () => undefined,
      toggleLocale: () => undefined,
      t: (en: string) => en,
    };
  }
  return ctx;
}
