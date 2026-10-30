'use client';

import React, { useState } from 'react';
import { DealerSidebar } from './dealer-sidebar';
import { DealerHeader, type DealerIdentity } from './dealer-header';

export interface DealerShellProps {
  identity: DealerIdentity;
  children: React.ReactNode;
}

/** Sidebar + header frame for live (session-backed) dealer pages. */
export function DealerShell({ identity, children }: DealerShellProps) {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const isArabic = locale === 'ar';

  return (
    <div className={`min-h-screen bg-background text-on-surface flex ${isArabic ? 'rtl' : 'ltr'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <DealerSidebar identity={identity} locale={locale} />
      <div className="pl-64 min-h-screen flex flex-col flex-1 min-w-0">
        <DealerHeader
          identity={identity}
          locale={locale}
          onLocaleToggle={() => setLocale((prev) => (prev === 'en' ? 'ar' : 'en'))}
        />
        <main className="w-full pt-16 bg-surface px-6 pb-12 flex-1">{children}</main>
      </div>
    </div>
  );
}
