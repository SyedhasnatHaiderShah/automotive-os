import React from 'react';
import { DealerSessionError } from '../lib/session';

export interface DealerServiceErrorProps {
  title: string;
  error: unknown;
  fallbackMessage: string;
  /** Full gateway path of this page, including the /dealer basePath. */
  retryPath: string;
}

/**
 * Error card for dealer server pages. Plain anchors are used on purpose:
 * `/auth` lives on the marketplace gateway (outside the /dealer basePath), and
 * retry links carry the basePath explicitly.
 */
export function DealerServiceError({ title, error, fallbackMessage, retryPath }: DealerServiceErrorProps) {
  const needsSignIn =
    error instanceof DealerSessionError &&
    (error.code === 'NOT_SIGNED_IN' || error.code === 'SESSION_INVALID');
  const message = error instanceof Error && error.message ? error.message : fallbackMessage;

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface">
      <div className="bg-surface-container-high border border-error/30 rounded-2xl p-8 max-w-lg text-center flex flex-col items-center gap-4 shadow-2xl">
        <span className="material-symbols-outlined text-5xl text-error" aria-hidden="true">
          {needsSignIn ? 'lock' : 'cloud_off'}
        </span>
        <h2 className="text-xl font-bold font-headline">{needsSignIn ? 'Dealer Sign-In Required' : title}</h2>
        <p className="text-sm text-on-surface-variant font-body-md">{message}</p>
        <a
          href={needsSignIn ? `/auth?tab=login&redirect=${encodeURIComponent(retryPath)}` : retryPath}
          className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md font-semibold hover:opacity-90 transition-opacity"
        >
          {needsSignIn ? 'Sign In' : 'Retry Connection'}
        </a>
      </div>
    </div>
  );
}
