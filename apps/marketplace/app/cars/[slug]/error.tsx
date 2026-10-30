'use client';

import React, { useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@automotive-os/ui';

export default function ListingDetailError({
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
    console.error('Vehicle listing detail error:', error);
  }, [error]);

  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full bg-surface-container border border-outline-variant/40 rounded-2xl p-8 text-center shadow-xl">
        <div className="w-14 h-14 rounded-full bg-error-container/20 border border-error/30 flex items-center justify-center text-error mx-auto mb-4">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="font-headline-sm text-xl font-bold text-on-surface mb-2">
          Unable to Load Vehicle Dossier
        </h3>
        <p className="text-sm text-outline mb-6">
          The requested vehicle specifications or gallery assets could not be retrieved from the dealer catalog.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="primary" size="md" onClick={retry} disabled={retrying}>
            Retry Dossier
          </Button>
          <Link href="/cars">
            <Button variant="outline" size="md">
              Browse Vehicles
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
