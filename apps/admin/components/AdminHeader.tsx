'use client';

import React, { useEffect, useState } from 'react';

interface AdminHeaderProps {
  isRtl?: boolean;
  onToggleRtl?: () => void;
}

export function AdminHeader({ isRtl = false, onToggleRtl }: AdminHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => () => { document.body.classList.remove('admin-mobile-nav-open'); }, []);
  return (
    <header
      className={`admin-app-header fixed top-0 ${
        isRtl ? 'right-60 left-0' : 'left-60 right-0'
      } h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.60)] z-40 px-gutter border-b border-surface-container-high/40`}
    >
      <div className="h-16 w-full flex items-center justify-between gap-space-md">
        <button type="button" className="lg:hidden min-h-11 min-w-11 rounded-lg text-on-surface hover:bg-surface-container-high" aria-label="Toggle admin navigation" aria-expanded={mobileOpen} onClick={() => { const next = !mobileOpen; setMobileOpen(next); document.body.classList.toggle("admin-mobile-nav-open", next); }}><span className="material-symbols-outlined">menu</span></button>
        {/* Left Info & Clearance Badge */}
        <div className="flex items-center gap-space-md min-w-0 flex-1">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider font-semibold">
                {isRtl ? 'حوكمة المنصة وعمليات الثقة' : 'Platform Governance & Trust Ops'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container-high font-data-mono-num text-body-sm text-on-surface-variant">
                Staging
              </span>
            </div>
            <div className="flex items-center gap-space-xs text-outline text-body-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              <span className="font-data-mono-num text-body-sm">
                Synthetic staging • external gateways disconnected
              </span>
            </div>
          </div>

          {/* Quick Universal Query Search */}
          <div className="relative max-w-md w-full hidden xl:block">
            <div
              className={`absolute inset-y-0 ${
                isRtl ? 'right-0 pr-3' : 'left-0 pl-3'
              } flex items-center pointer-events-none`}
            >
              <span className="material-symbols-outlined text-outline text-[18px]">search</span>
            </div>
            <input
              className={`w-full h-9 ${
                isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
              } rounded-lg bg-surface-container-high text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary-container`}
              placeholder={
                isRtl
                  ? 'بحث برقم الهيكل، القضية، الوكيل، رخصة دائرة التنمية الاقتصادية...'
                  : 'Query VIN, Case #, Dealership, DED License...'
              }
              type="text"
            />
          </div>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-space-md flex-shrink-0">
          <div className="hidden lg:flex items-center gap-space-xs px-2.5 py-1 rounded-full bg-surface-container">
            <span className="w-2 h-2 rounded-full bg-tertiary" />
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {isRtl ? 'شرطة دبي • دائرة الاقتصاد نشطة' : 'External integrations disabled'}
            </span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-surface-container-high rounded p-0.5 font-label-caps text-label-caps">
            <button
              onClick={() => {
                if (isRtl && onToggleRtl) onToggleRtl();
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                !isRtl
                  ? 'bg-surface-bright text-on-surface font-semibold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => {
                if (!isRtl && onToggleRtl) onToggleRtl();
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                isRtl
                  ? 'bg-surface-bright text-on-surface font-semibold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              عربي
            </button>
          </div>

          {/* Notification Button */}
          <button
            className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            type="button"
            title="Notifications unavailable in staging"
            disabled
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error text-on-error font-data-mono-num text-body-sm rounded-full flex items-center justify-center text-[10px]">
              4
            </span>
          </button>

          {/* SuperAdmin Identity Badge */}
          <div className="flex items-center gap-space-sm pl-space-sm">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="font-body-sm text-body-sm text-on-surface font-medium truncate max-w-[160px]">
                {isRtl ? 'د. ميا الفلاسي' : 'Dr. Maya Al-Falasi'}
              </span>
              <span className="font-label-caps text-label-caps text-primary truncate max-w-[160px]">
                {isRtl ? 'المشرف الأعلى للمنصة' : 'Platform SuperAdmin'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
