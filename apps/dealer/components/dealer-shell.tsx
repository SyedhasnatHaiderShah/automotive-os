'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DealerSidebar } from './dealer-sidebar';
import { DealerHeader, type DealerIdentity } from './dealer-header';
import { localeDir, persistLocale, type DealerLocale } from '../lib/i18n';

export interface DealerShellProps {
  identity: DealerIdentity;
  /** Locale read server-side from the `ao_locale` cookie. */
  locale: DealerLocale;
  children: React.ReactNode;
}

/** Sidebar + header frame for live (session-backed) dealer pages. */
export function DealerShell({ identity, locale: initialLocale, children }: DealerShellProps) {
  const router = useRouter();
  const [locale, setLocale] = useState<DealerLocale>(initialLocale);
  const [, startTransition] = useTransition();
  const dir = localeDir(locale);

  const toggleLocale = () => {
    const next: DealerLocale = locale === 'en' ? 'ar' : 'en';
    setLocale(next);
    // Persist (DL-08) and re-render the server page so its strings follow.
    persistLocale(next);
    startTransition(() => router.refresh());
  };

  return (
    <div className={`min-h-screen bg-background text-on-surface flex ${dir}`} dir={dir} lang={locale}>
      <DealerSidebar identity={identity} locale={locale} />
      <div className="ps-64 min-h-screen flex flex-col flex-1 min-w-0">
        <DealerHeader identity={identity} locale={locale} onLocaleToggle={toggleLocale} />
        <main className="w-full pt-16 bg-surface px-6 pb-12 flex-1">{children}</main>
      </div>
    </div>
  );
}
