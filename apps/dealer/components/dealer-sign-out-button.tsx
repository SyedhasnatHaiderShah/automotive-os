'use client';

import React, { useState } from 'react';

/**
 * Revokes the session (POST /api/v1/auth/logout on the gateway origin, which
 * also clears the httpOnly `ao_session` cookie) and then opens the sign-in
 * page. The redirect happens even if the API call fails, so the user is never
 * stuck on an error card.
 */
export function DealerSignOutButton({ label, pendingLabel, className }: { label: string; pendingLabel: string; className: string }) {
  const [pending, setPending] = useState(false);

  const signOut = async () => {
    setPending(true);
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'include',
        cache: 'no-store',
      });
    } catch {
      // Network failure: still leave the console; the sign-in page handles the rest.
    }
    window.location.assign('/auth?tab=login');
  };

  return (
    <button type="button" onClick={signOut} disabled={pending} aria-busy={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}
