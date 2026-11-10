'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { dealerStrings, localizedRoleLabel, type DealerLocale } from '../lib/i18n';
import { DealerSignOutButton } from './dealer-sign-out-button';

export interface DealerProfileMenuProps {
  tenantName: string;
  displayName: string;
  role: string;
  locale: DealerLocale;
}

/** Signed-in user button in the header; opens the account dropdown. */
export function DealerProfileMenu({ tenantName, displayName, role, locale }: DealerProfileMenuProps) {
  const t = dealerStrings(locale);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const roleLabel = localizedRoleLabel(t, role);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const itemClass =
    'min-h-10 w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm text-on-surface hover:bg-surface-container-highest transition-colors disabled:opacity-60';

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t.profileMenu(displayName)}
        className="flex items-center gap-2.5 rounded-lg ps-2 pe-1 py-1 hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
      >
        <span className="text-end hidden sm:block">
          <span className="block font-body-sm text-xs font-semibold text-on-surface leading-tight">{displayName}</span>
          <span className="block font-label-caps text-[10px] text-on-surface-variant uppercase font-medium">{roleLabel}</span>
        </span>
        <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md" aria-hidden="true">
          <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </span>
        <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          expand_more
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute end-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-white/[0.08] bg-surface-container-high p-1.5 shadow-2xl"
        >
          <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
            <div className="text-sm font-semibold text-on-surface truncate">{displayName}</div>
            <div className="text-xs text-on-surface-variant truncate">{roleLabel} • {tenantName}</div>
          </div>
          <Link href="/settings" onClick={() => setOpen(false)} className={itemClass}>
            <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">tune</span>
            <span>{t.navSettings}</span>
          </Link>
          <DealerSignOutButton label={t.signOut} pendingLabel={t.signingOut} className={itemClass} />
        </div>
      )}
    </div>
  );
}
