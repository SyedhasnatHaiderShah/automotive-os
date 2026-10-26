'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function DealerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dealer DMS runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface">
      <div className="bg-surface-container-high border border-error/40 rounded-2xl p-8 max-w-lg w-full text-center flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-error to-transparent" />

        <div className="w-14 h-14 rounded-full bg-error-container/20 border border-error/30 flex items-center justify-center text-error">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold font-headline text-on-surface">
          Dealership Management System Offline
        </h2>
        <p className="text-sm text-on-surface-variant font-body-md">
          {error.message || 'An unexpected error occurred while communicating with the dealership tenant services.'}
        </p>
        {error.digest && (
          <span className="text-xs font-mono text-outline/60">
            DMS Trace: {error.digest}
          </span>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold hover:opacity-90 transition-opacity"
          >
            Retry Connection
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface font-semibold hover:bg-surface-container-highest transition-colors"
          >
            DMS Cockpit
          </Link>
        </div>
      </div>
    </div>
  );
}
