import React from 'react';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';

const LOCALE_COOKIE = 'ao_locale';

export const metadata: Metadata = {
  title: 'Automotive OS — UAE Verified Dealer Marketplace & Collector Exchange',
  description:
    'UAE-first verified dealership automotive exchange. Browse certified luxury, performance, and GCC-spec vehicle stock with authentic provenance.',
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
  // MK-20: the persisted locale drives the root lang/dir so RTL applies to the
  // whole document, not only to page wrappers.
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value === 'ar' ? 'ar' : 'en';
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
      <body className="min-h-screen bg-background text-on-surface font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container flex flex-col">
        {children}
        {process.env.NEXT_PUBLIC_APP_ENV === 'staging' && (
          <div data-staging-badge role="status" className="pointer-events-none fixed bottom-24 right-3 sm:bottom-3 z-[80] max-w-[calc(100vw-1.5rem)] rounded-lg border border-primary/40 bg-surface-container-lowest/95 px-3 py-2 text-[11px] font-semibold text-primary shadow-lg backdrop-blur-sm">
            STAGING · SYNTHETIC DATA · No live external approvals
          </div>
        )}
      </body>
    </html>
  );
}
