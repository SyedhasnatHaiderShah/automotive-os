import React from 'react';
import Link from 'next/link';

/** Unknown or unpublished dealer slug; the root not-found copy is vehicle-specific (MK-18). */
export default function DealerNotFound() {
  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full bg-surface-container border border-outline-variant/40 rounded-2xl p-8 text-center shadow-xl">
        <div className="w-14 h-14 rounded-full bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-primary mx-auto mb-4">
          <span className="font-mono text-lg font-bold">404</span>
        </div>
        <h1 className="font-headline-sm text-xl font-bold text-on-surface mb-2">Dealer not found</h1>
        <p className="font-arabic text-sm text-outline mb-2" dir="rtl">
          لم يتم العثور على الوكيل المطلوب
        </p>
        <p className="text-sm text-outline mb-6">
          This dealership page does not exist or is not currently published.
        </p>
        <Link
          href="/dealers"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Browse verified dealers / تصفح الوكلاء
        </Link>
      </div>
    </div>
  );
}
