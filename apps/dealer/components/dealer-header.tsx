'use client';

import React, { useEffect, useState } from 'react';
import { roleLabel } from '../lib/permissions';

/** Non-secret identity fields from the server session (never the token). */
export interface DealerIdentity {
  tenantName: string;
  displayName: string;
  role: string;
  hasMultipleTenants?: boolean;
}

export interface DealerHeaderProps {
  /** Omitted on preview (sample-data) pages, which have no live session. */
  identity?: DealerIdentity;
  locale?: 'en' | 'ar';
  onLocaleToggle: () => void;
}

export const DealerHeader: React.FC<DealerHeaderProps> = ({
  identity,
  locale = 'en',
  onLocaleToggle,
}) => {
  const isArabic = locale === 'ar';
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const closed = () => setMobileOpen(false);
    window.addEventListener('dealer-nav-closed', closed);
    return () => { document.body.classList.remove('dealer-mobile-nav-open'); window.removeEventListener('dealer-nav-closed', closed); };
  }, []);

  return (
    <header className="dealer-app-header fixed top-0 left-64 right-0 h-16 bg-surface-container-low/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.1)] z-40 px-6 flex items-center justify-between border-b border-white/[0.06]">
      {/* Left: active dealership */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button type="button" className="lg:hidden min-h-11 min-w-11 rounded-lg p-2 text-on-surface hover:bg-surface-container-high" aria-label="Toggle dealer navigation" aria-expanded={mobileOpen} onClick={() => { const next = !document.body.classList.contains("dealer-mobile-nav-open"); setMobileOpen(next); document.body.classList.toggle("dealer-mobile-nav-open", next); }}><span className="material-symbols-outlined">menu</span></button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface border border-white/[0.05] min-w-0">
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">storefront</span>
          <span className="font-body-sm text-xs sm:text-sm font-semibold truncate">
            {identity ? identity.tenantName : isArabic ? 'معاينة — لا توجد جلسة' : 'Preview — no dealer session'}
          </span>
        </div>
        {identity?.hasMultipleTenants && (
          <span className="hidden md:inline text-[11px] text-on-surface-variant" title="Dealership switching is not available yet">
            First active dealership shown
          </span>
        )}
      </div>

      {/* Right: role, language, user */}
      <div className="flex items-center gap-3.5">
        {identity && (
          <span
            className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container text-xs font-medium border border-white/[0.07]"
            aria-label={`Your role: ${roleLabel(identity.role)}`}
          >
            <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">badge</span>
            <span className="text-on-surface font-semibold">{roleLabel(identity.role)}</span>
          </span>
        )}

        <button
          type="button"
          onClick={onLocaleToggle}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-high text-on-surface font-body-sm text-xs hover:bg-surface-container-highest transition-colors border border-white/[0.05]"
          aria-label="Toggle language"
        >
          <span className={!isArabic ? 'font-bold text-primary' : 'text-on-surface-variant'}>EN</span>
          <span className="text-on-surface-variant">/</span>
          <span className={isArabic ? 'font-bold text-primary' : 'text-on-surface-variant'}>عربي</span>
        </button>

        <div className="flex items-center gap-2.5 pl-1">
          <div className="text-right hidden sm:block">
            <div className="font-body-sm text-xs font-semibold text-on-surface leading-tight">
              {identity ? identity.displayName : 'Preview'}
            </div>
            <div className="font-label-caps text-[10px] text-on-surface-variant uppercase font-medium">
              {identity ? roleLabel(identity.role) : 'Sample data only'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-on-primary text-xs shadow-md" aria-hidden="true">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
};
