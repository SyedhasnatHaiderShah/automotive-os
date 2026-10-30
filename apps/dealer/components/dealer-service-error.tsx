import React from 'react';
import { DealerSessionError } from '../lib/session';
import { DealerApiError } from '../lib/dealer-api';
import { dealerStrings, localeDir, type DealerLocale } from '../lib/i18n';
import { DealerSignOutButton } from './dealer-sign-out-button';

export interface DealerServiceErrorProps {
  title: string;
  error: unknown;
  fallbackMessage: string;
  /** Full gateway path of this page, including the /dealer basePath. */
  retryPath: string;
  locale: DealerLocale;
}

type ErrorKind = 'sign-in' | 'session-expired' | 'no-access' | 'forbidden' | 'account-restricted' | 'tenant-suspended' | 'unavailable' | 'failed';

/** Map an error to what the user can do about it (DL-10). */
function classify(error: unknown): ErrorKind {
  if (error instanceof DealerSessionError) {
    switch (error.code) {
      case 'NOT_SIGNED_IN':
        return 'sign-in';
      case 'SESSION_INVALID':
        return 'session-expired';
      case 'ACCOUNT_RESTRICTED':
        return 'account-restricted';
      case 'NO_DEALER_MEMBERSHIP':
        return 'no-access';
      case 'TENANT_SUSPENDED':
        return 'tenant-suspended';
      default:
        return 'unavailable';
    }
  }
  if (error instanceof DealerApiError) {
    if (error.status === 401) return 'session-expired';
    if (error.status === 403) return 'forbidden';
    if (error.status === 0 || error.status >= 500) return 'unavailable';
    return 'failed';
  }
  return 'failed';
}

/**
 * Error card for dealer server pages. Plain anchors are used on purpose:
 * `/auth` and the marketplace live on the gateway (outside the /dealer
 * basePath), and retry links carry the basePath explicitly. Only localised
 * copy is shown; raw error codes and HTTP details never reach the user.
 */
export function DealerServiceError({ title, error, fallbackMessage, retryPath, locale }: DealerServiceErrorProps) {
  const t = dealerStrings(locale);
  const kind = classify(error);

  const primaryClass =
    'min-h-11 inline-flex items-center px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-60';
  const secondaryClass =
    'min-h-11 inline-flex items-center px-5 py-2.5 rounded-xl border border-outline-variant/50 text-on-surface font-label-md font-semibold hover:bg-surface-container-highest transition-colors';

  const content: Record<ErrorKind, { icon: string; heading: string; message: string }> = {
    'sign-in': { icon: 'lock', heading: t.signInTitle, message: t.signInMessage },
    'session-expired': { icon: 'lock', heading: t.signInTitle, message: t.sessionExpiredMessage },
    'no-access': { icon: 'domain_disabled', heading: t.noAccessTitle, message: t.noAccessMessage },
    forbidden: { icon: 'block', heading: t.forbiddenTitle, message: t.forbiddenMessage },
    'account-restricted': { icon: 'person_off', heading: t.accountRestrictedTitle, message: t.accountRestrictedMessage },
    'tenant-suspended': { icon: 'pause_circle', heading: t.tenantSuspendedTitle, message: t.tenantSuspendedMessage },
    unavailable: { icon: 'cloud_off', heading: title, message: t.serviceUnavailableMessage },
    failed: { icon: 'error', heading: title, message: fallbackMessage },
  };
  const { icon, heading, message } = content[kind];

  const needsSignIn = kind === 'sign-in' || kind === 'session-expired';
  const needsSignOut = kind === 'no-access' || kind === 'forbidden' || kind === 'account-restricted' || kind === 'tenant-suspended';

  return (
    <div dir={localeDir(locale)} lang={locale} className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface">
      <div role="alert" className="bg-surface-container-high border border-error/30 rounded-2xl p-8 max-w-lg text-center flex flex-col items-center gap-4 shadow-2xl">
        <span className="material-symbols-outlined text-5xl text-error" aria-hidden="true">
          {icon}
        </span>
        <h2 className="text-xl font-bold font-headline">{heading}</h2>
        <p className="text-sm text-on-surface-variant font-body-md">{message}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {needsSignIn && (
            <a href={`/auth?tab=login&redirect=${encodeURIComponent(retryPath)}`} className={primaryClass}>
              {t.signIn}
            </a>
          )}
          {needsSignOut && (
            <>
              <DealerSignOutButton label={t.signOut} pendingLabel={t.signingOut} className={primaryClass} />
              <a href="/" className={secondaryClass}>
                {t.backToMarketplace}
              </a>
            </>
          )}
          {!needsSignIn && !needsSignOut && (
            <a href={retryPath} className={primaryClass}>
              {t.retry}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
