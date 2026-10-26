import React from 'react';
import Link from 'next/link';
import { Button } from '@automotive-os/ui';

export default function MarketplaceNotFound() {
  return (
    <div className="flex-1 min-h-[70vh] flex items-center justify-center p-6 bg-background">
      <div className="max-w-lg w-full bg-surface-container border border-outline-variant/40 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-container to-transparent" />

        <div className="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-primary mx-auto mb-6">
          <span className="font-mono text-xl font-bold">404</span>
        </div>

        <h2 className="font-headline-md text-2xl font-bold text-on-surface mb-2">
          Vehicle Dossier Not Found
        </h2>
        <p className="font-arabic text-sm text-outline mb-2" dir="rtl">
          لم يتم العثور على ملف السيارة أو الصفحة المطلوبة
        </p>
        <p className="text-sm text-outline mb-8">
          The requested listing or exchange resource may have been acquired, unlisted, or relocated.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/cars">
            <Button variant="primary" size="md">
              Browse Available Cars
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="md">
              Home Showcase
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
