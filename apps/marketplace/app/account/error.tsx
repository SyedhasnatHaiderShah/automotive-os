'use client';

import React, { useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@automotive-os/ui';

export default function AccountError({
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
    console.error('Buyer account route error:', error);
  }, [error]);

  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center p-6 bg-background">
      <div role="alert" className="max-w-md w-full bg-surface-container border border-outline-variant/40 rounded-2xl p-8 text-center shadow-xl">
        <h1 className="font-headline-sm text-xl font-bold text-on-surface mb-2">
          Your account page could not be loaded
        </h1>
        <p className="font-arabic text-sm text-outline mb-2" dir="rtl">
          تعذر تحميل صفحة حسابك
        </p>
        <p className="text-sm text-outline mb-6">
          Please try again in a moment.
          {error.digest && (
            <span className="block text-xs font-mono text-outline/60 mt-2">Reference Code: {error.digest}</span>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" size="md" onClick={retry} disabled={retrying}>
            Try Again / إعادة المحاولة
          </Button>
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-outline-variant/50 px-4 text-sm text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Return to Home / الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
