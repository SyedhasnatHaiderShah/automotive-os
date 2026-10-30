'use client';

import React, { useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@automotive-os/ui';

export default function MarketplaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [retrying, startTransition] = useTransition();
  // reset() alone re-renders the client tree; refresh() re-runs the server fetch (MK-18).
  const retry = () => startTransition(() => { router.refresh(); reset(); });
  useEffect(() => {
    console.error('Marketplace route runtime error:', error);
  }, [error]);

  return (
    <div className="flex-1 min-h-[70vh] flex items-center justify-center p-6 bg-background">
      <div className="max-w-lg w-full bg-surface-container border border-outline-variant/40 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Subtle top gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="w-16 h-16 rounded-full bg-error-container/20 border border-error/30 flex items-center justify-center text-error mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="font-headline-md text-2xl font-bold text-on-surface mb-2">
          Something went wrong
        </h2>
        <p className="font-arabic text-sm text-outline mb-2" dir="rtl">
          حدث خطأ غير متوقع أثناء تحميل هذه الصفحة
        </p>
        <p className="text-sm text-outline mb-8">
          This page could not be loaded. Please try again.
          {error.digest && (
            <span className="block text-xs font-mono text-outline/60 mt-2">
              Reference Code: {error.digest}
            </span>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" size="md" onClick={retry} disabled={retrying}>
            Try Again / إعادة المحاولة
          </Button>
          <Link href="/">
            <Button variant="outline" size="md">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
