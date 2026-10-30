import { cookies } from 'next/headers';
import { LOCALE_COOKIE, normalizeLocale, type DealerLocale } from './i18n';

/** Server-side: the locale persisted in the `ao_locale` cookie (default English). */
export async function getDealerLocale(): Promise<DealerLocale> {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}
