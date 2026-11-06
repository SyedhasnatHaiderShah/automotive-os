'use client';

/**
 * Marketplace locale (MK-20).
 *
 * The chosen locale is persisted in the `ao_locale` cookie (shared with the
 * dealer console on the same gateway origin) so it survives navigation and
 * reloads. The root layout reads the cookie server-side to render
 * `<html lang dir>`; client pages use `useMarketplaceLocale()` so the toggle
 * also updates the root element immediately.
 */
import { useCallback, useEffect, useState } from 'react';

export type MarketplaceLocale = 'en' | 'ar';

export const LOCALE_COOKIE = 'ao_locale';

export function normalizeLocale(value: string | null | undefined): MarketplaceLocale {
  return value === 'ar' ? 'ar' : 'en';
}

export function localeDir(locale: MarketplaceLocale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function readLocaleCookie(): MarketplaceLocale {
  if (typeof document === 'undefined') return 'en';
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  return normalizeLocale(match?.[1]);
}

/** Persist for one year on the gateway origin and update the root element. */
export function persistLocale(locale: MarketplaceLocale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  document.documentElement.lang = locale;
  document.documentElement.dir = localeDir(locale);
}

type LocaleUpdate = MarketplaceLocale | ((previous: MarketplaceLocale) => MarketplaceLocale);

/**
 * Drop-in replacement for `useState<'en' | 'ar'>('en')`: starts from the
 * server-rendered value, adopts the persisted cookie on mount, and persists
 * every change.
 */
export function useMarketplaceLocale(
  initial: MarketplaceLocale = 'en',
): [MarketplaceLocale, (next: LocaleUpdate) => void] {
  const [locale, setLocaleState] = useState<MarketplaceLocale>(initial);

  useEffect(() => {
    const persisted = readLocaleCookie();
    setLocaleState(persisted);
    document.documentElement.lang = persisted;
    document.documentElement.dir = localeDir(persisted);
  }, []);

  const setLocale = useCallback((next: LocaleUpdate) => {
    setLocaleState((previous) => {
      const resolved = typeof next === 'function' ? next(previous) : next;
      persistLocale(resolved);
      return resolved;
    });
  }, []);

  return [locale, setLocale];
}
