'use client';

import React, { useEffect, useState } from 'react';

export interface DealerHeaderProps {
  currentRole: 'PRINCIPAL' | 'SALES_REP';
  onRoleToggle: () => void;
  locale?: 'en' | 'ar';
  onLocaleToggle: () => void;
}

export const DealerHeader: React.FC<DealerHeaderProps> = ({
  currentRole,
  onRoleToggle,
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
      {/* Left: Hub Selector & Real-Time RTA Status */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button type="button" className="lg:hidden min-h-11 min-w-11 rounded-lg p-2 text-on-surface hover:bg-surface-container-high" aria-label="Toggle dealer navigation" aria-expanded={mobileOpen} onClick={() => { const next = !document.body.classList.contains("dealer-mobile-nav-open"); setMobileOpen(next); document.body.classList.toggle("dealer-mobile-nav-open", next); }}><span className="material-symbols-outlined">menu</span></button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface transition-colors border border-white/[0.05]">
          <span className="material-symbols-outlined text-[18px] text-primary">storefront</span>
          <span className="font-body-sm text-xs sm:text-sm font-semibold">
            SilberArrows • Al Quoz 1 Hub
          </span>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
            expand_more
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface border border-white/[0.04]">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
          <span className="font-body-sm text-xs font-medium">RTA integration disabled</span>
          
        </div>
      </div>

      {/* Right: Language, Notifications & User Badge */}
      <div className="flex items-center gap-3.5">
        {/* Role Toggle Pill Indicator */}
        <button
          type="button"
          onClick={onRoleToggle}
          className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container text-xs font-medium border border-white/[0.07] hover:border-primary/40 transition-colors"
          title="Click to toggle between Dealer Principal and Sales Executive RBAC mode"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">
            {currentRole === 'PRINCIPAL' ? 'admin_panel_settings' : 'badge'}
          </span>
          <span className="font-label-caps uppercase text-[10px] text-outline">Role:</span>
          <span className="text-on-surface font-semibold">
            {currentRole === 'PRINCIPAL' ? 'Principal (Full Cost Access)' : 'Sales Rep (Masked Cost)'}
          </span>
        </button>

        {/* Language Toggle */}
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

        {/* Notifications Bell */}
        <button
          type="button"
          className="relative p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          aria-label="Notifications unavailable in staging"
          title="Staging inbox is not connected"
          disabled
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="text-right hidden sm:block">
            <div className="font-body-sm text-xs font-semibold text-on-surface leading-tight">
              Staging dealer
            </div>
            <div className="font-label-caps text-[10px] text-on-surface-variant uppercase font-medium">
              Synthetic role preview
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-on-primary text-xs shadow-md">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
};
