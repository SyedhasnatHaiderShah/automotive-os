/**
 * Locale constants shared by the server root layout and the client
 * LocaleProvider. Kept out of the 'use client' module so the server can call
 * normalizeLocale directly.
 */
export type AdminLocale = 'en' | 'ar';

export const LOCALE_COOKIE = 'ao_locale';

/** Accepts `ar`, `ar-AE`, etc. Anything else falls back to English. */
export function normalizeLocale(value: string | null | undefined): AdminLocale {
  return typeof value === 'string' && value.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}
