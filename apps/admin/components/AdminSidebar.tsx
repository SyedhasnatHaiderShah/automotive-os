'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  isRtl?: boolean;
}

export function AdminSidebar({ isRtl = false }: AdminSidebarProps) {
  const pathname = usePathname();
  useEffect(() => {
    const close = () => { document.body.classList.remove('admin-mobile-nav-open'); window.dispatchEvent(new Event('admin-nav-closed')); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    close();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pathname]);

  const isListingActive = pathname?.includes('/moderation') ?? false;
  const isKybActive = pathname?.includes('/verifications') ?? false;
  const isDisputesActive = pathname?.includes('/disputes') ?? false;
  const isCommandActive = pathname === '/' || pathname === '/operations-command';
  const isUsersActive = pathname?.includes('/users') ?? false;
  const isDealersActive = pathname?.includes('/dealers') ?? false;
  const isAuditActive = pathname?.includes('/audit-logs') ?? false;

  return (
    <aside
      className={`admin-app-sidebar fixed ${
        isRtl ? 'right-0' : 'left-0'
      } top-0 h-full w-60 bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.60)] z-50 flex flex-col justify-between`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto">
        <button type="button" className="lg:hidden absolute top-3 right-3 rounded-lg p-2 text-on-surface" aria-label="Close admin navigation" onClick={() => { document.body.classList.remove("admin-mobile-nav-open"); window.dispatchEvent(new Event("admin-nav-closed")); }}>✕</button>
        {/* Brand Header */}
        <div className="h-16 px-space-md flex items-center gap-space-sm bg-surface-container-lowest">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[20px]">
              shield_with_house
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight uppercase truncate">
              {isRtl ? 'نظام السيارات' : 'Automotive OS'}
            </span>
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider truncate">
              {isRtl ? 'مركز إدارة المنصة' : 'Platform Ops Hub'}
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="p-space-md flex flex-col gap-space-lg">
          {/* Supervision & Governance */}
          <div className="flex flex-col gap-space-xs">
            <span className="font-label-caps text-label-caps text-outline px-space-sm uppercase tracking-wider">
              {isRtl ? 'الرقابة والحوكمة' : 'Supervision & Governance'}
            </span>
            <nav className="flex flex-col gap-space-xs">
              <Link
                href="/"
                className={`flex items-center justify-between px-space-sm py-2 rounded-lg transition-colors ${
                  isCommandActive
                    ? 'bg-surface-container-high text-primary font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[18px]">monitoring</span>
                  <span className="font-body-sm text-body-sm">
                    {isRtl ? 'قيادة العمليات' : 'Operations Command'}
                  </span>
                </div>
              </Link>

              <Link
                href="/verifications"
                className={`flex items-center justify-between px-space-sm py-2 rounded-lg transition-colors ${
                  isKybActive
                    ? 'bg-surface-container-high text-primary font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span className="font-body-sm text-body-sm">
                    {isRtl ? 'اعتماد الوكلاء (KYB)' : 'KYB Verification'}
                  </span>
                </div>
              </Link>

              <Link
                href="/moderation"
                className={`flex items-center justify-between px-space-sm py-2 rounded-lg transition-colors ${
                  isListingActive
                    ? 'bg-surface-container-high text-primary font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[18px]">policy</span>
                  <span className="font-body-sm text-body-sm">
                    {isRtl ? 'مراجعة وتدقيق الإعلانات' : 'Listing Moderation'}
                  </span>
                </div>
              </Link>

              <Link
                href="/disputes"
                className={`flex items-center justify-between px-space-sm py-2 rounded-lg transition-colors ${
                  isDisputesActive
                    ? 'bg-surface-container-high text-primary font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[18px]">gavel</span>
                  <span className="font-body-sm text-body-sm">
                    {isRtl ? 'النزاعات والعقوبات' : 'Disputes & Sanctions'}
                  </span>
                </div>
              </Link>
            </nav>
          </div>

          {/* Platform Infrastructure */}
          <div className="flex flex-col gap-space-xs">
            <span className="font-label-caps text-label-caps text-outline px-space-sm uppercase tracking-wider">
              {isRtl ? 'البنية التحتية للمنصة' : 'Platform Infrastructure'}
            </span>
            <nav className="flex flex-col gap-space-xs">
              <Link
                href="/dealers"
                className={`flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors ${
                  isDealersActive
                    ? 'bg-surface-container-high text-primary font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">apartment</span>
                <span className="font-body-sm text-body-sm">
                  {isRtl ? 'إدارة الوكالات المعتمدة' : 'Institutional Dealers'}
                </span>
              </Link>

              <Link
                href="/users"
                className={`flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors ${
                  isUsersActive
                    ? 'bg-surface-container-high text-primary font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                <span className="font-body-sm text-body-sm">
                  {isRtl ? 'حوكمة المستخدمين والجلسات' : 'User Governance'}
                </span>
              </Link>

              <Link
                href="/audit-logs"
                className={`flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors ${
                  isAuditActive
                    ? 'bg-surface-container-high text-primary font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">lock_clock</span>
                <span className="font-body-sm text-body-sm">
                  {isRtl ? 'سجل التدقيق غير القابل للتغيير' : 'Audit Activity Ledger'}
                </span>
              </Link>

              <a
                aria-disabled="true"
                title="Not available yet: server-side integration required"
                tabIndex={-1}
                className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant opacity-50 cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span className="font-body-sm text-body-sm">
                  {isRtl ? 'تعرفات الوكلاء' : 'Dealer Tariffs'}
                </span>
              </a>

              <a
                aria-disabled="true"
                title="Not available yet: server-side integration required"
                tabIndex={-1}
                className="flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-on-surface-variant opacity-50 cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">hub</span>
                <span className="font-body-sm text-body-sm">
                  {isRtl ? 'البوابات السيادية' : 'Sovereign Gateways'}
                </span>
              </a>
            </nav>
          </div>
        </div>
      </div>

      {/* Emergency controls: no enforcement API exists yet */}
      <div className="p-space-md bg-surface-container-lowest flex flex-col gap-space-sm">
        <button
          disabled
          aria-disabled="true"
          title="Not available yet: no emergency freeze API"
          className="w-full h-8 px-space-sm rounded bg-error-container text-on-error-container opacity-50 cursor-not-allowed font-body-sm text-body-sm flex items-center justify-center gap-space-xs"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">lock_reset</span>
          <span>{isRtl ? 'تجميد طارئ (غير متاح بعد)' : 'Emergency Freeze (not available yet)'}</span>
        </button>
      </div>
    </aside>
  );
}
