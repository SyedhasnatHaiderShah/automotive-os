import React from 'react';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { LocaleProvider } from '../lib/locale';
import { LOCALE_COOKIE, normalizeLocale } from '../lib/locale-shared';
import './globals.css';

export const metadata: Metadata = {
  title: 'Automotive OS — Platform Ops Hub & Governance',
  description: 'UAE Sovereign Trust Ops, Vehicle Listing Moderation, and KYB Institutional Dealer Accreditation.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#101419',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // AD-13: locale persisted in a cookie so lang/dir are right on first paint.
  const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-on-surface font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
        {process.env.NEXT_PUBLIC_APP_ENV === 'staging' && (
          <div data-staging-badge role="status" className="pointer-events-none fixed bottom-24 right-3 sm:bottom-3 z-[80] max-w-[calc(100vw-1.5rem)] rounded-lg border border-primary/40 bg-surface-container-lowest/95 px-3 py-2 text-[11px] font-semibold text-primary shadow-lg backdrop-blur-sm">
            STAGING · SYNTHETIC DATA · No live external approvals
          </div>
        )}
      </body>
    </html>
  );
}
