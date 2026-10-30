'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { capabilitiesFor, INTAKE_UNAVAILABLE_MESSAGE, roleLabel } from '../lib/permissions';
import type { DealerIdentity } from './dealer-header';


/** Sample-data modules are only linked when explicitly enabled for a preview build. */
const PREVIEW_MODULES_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PREVIEW_MODULES === 'true';

export interface DealerSidebarProps {
  /** Omitted on preview (sample-data) pages, which have no live session. */
  identity?: DealerIdentity;
  locale?: 'en' | 'ar';
}

interface NavItem {
  label: string;
  href: string;
  icon: string;
  disabledReason?: string;
}

export const DealerSidebar: React.FC<DealerSidebarProps> = ({ identity, locale = 'en' }) => {
  const pathname = usePathname();
  useEffect(() => {
    const close = () => { document.body.classList.remove('dealer-mobile-nav-open'); window.dispatchEvent(new Event('dealer-nav-closed')); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    close();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pathname]);
  const isArabic = locale === 'ar';
  const caps = identity ? capabilitiesFor(identity.role) : null;

  const navItems: NavItem[] = [
    { label: isArabic ? 'لوحة التحكم' : 'Dashboard', href: '/', icon: 'space_dashboard' },
    { label: isArabic ? 'إدارة المخزون' : 'Inventory', href: '/inventory', icon: 'garage' },
    {
      label: isArabic ? 'إدخال مركبة' : 'Add Vehicle',
      href: '/inventory',
      icon: 'add_circle',
      disabledReason: INTAKE_UNAVAILABLE_MESSAGE,
    },
    {
      label: isArabic ? 'العملاء المحتملون' : 'Leads',
      href: '/leads',
      icon: 'filter_alt',
      disabledReason: caps && !caps.canReadLeads ? 'Your role cannot view leads' : undefined,
    },
    { label: isArabic ? 'تجارب القيادة' : 'Test Drives', href: '/appointments', icon: 'speed', disabledReason: 'Not available yet' },
    { label: isArabic ? 'إعدادات الوكالة' : 'Dealership Settings', href: '/settings', icon: 'tune', disabledReason: 'Not available yet' },
  ];

  const previewItems: NavItem[] = [
    { label: isArabic ? 'طلبات المبيعات وعروض الأسعار' : 'Sales Orders & Quotes', href: '/sales', icon: 'receipt_long' },
    { label: isArabic ? 'ورشة العمل' : 'Workshop & Bays', href: '/workshop', icon: 'build_circle' },
    { label: isArabic ? 'قطع الغيار والتوريد' : 'Parts & Procurement', href: '/parts', icon: 'precision_manufacturing' },
    { label: isArabic ? 'التمويل والتأمين' : 'Finance & Insurance', href: '/finance', icon: 'account_balance' },
    { label: isArabic ? 'الفواتير والمحاسبة' : 'Invoices & Accounting', href: '/accounting', icon: 'receipt_long' },
    { label: isArabic ? 'الأساطيل والبيع بالأمانة' : 'Fleet & Consignment', href: '/fleet', icon: 'directions_car' },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname === '/dashboard' : Boolean(pathname?.startsWith(href));

  const renderDisabled = (item: NavItem, badge: string, reason: string) => (
    <span
      key={item.label}
      aria-disabled="true"
      title={reason}
      className="flex gap-3 items-center px-3.5 py-2 rounded-lg text-on-surface-variant/60 cursor-not-allowed"
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{item.icon}</span>
      <span className="text-xs">{item.label}</span>
      <span className="ml-auto text-[10px] font-label-caps uppercase tracking-wider">{badge}</span>
      <span className="sr-only">({reason})</span>
    </span>
  );

  const renderLink = (item: NavItem, badge?: string) => (
    <Link
      key={item.label}
      href={item.href}
      aria-current={isActive(item.href) ? 'page' : undefined}
      className={`flex items-center gap-3 px-3.5 py-2 rounded-lg transition-all text-xs sm:text-sm ${
        isActive(item.href)
          ? 'bg-primary-container text-on-primary-container font-semibold shadow-md'
          : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
      }`}
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{item.icon}</span>
      <span className="font-body-md">{item.label}</span>
      {badge && <span className="ml-auto text-[10px] font-label-caps uppercase tracking-wider text-secondary">{badge}</span>}
    </Link>
  );

  return (
    <aside aria-label="Dealer navigation" className="dealer-app-sidebar fixed left-0 top-0 h-screen w-64 bg-surface-container-low/95 backdrop-blur-xl z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.2)] border-r border-white/[0.06] overflow-y-auto">
      <div className="flex flex-col">
        <button type="button" className="lg:hidden absolute top-3 right-3 rounded-lg p-2 text-on-surface" aria-label="Close dealer navigation" onClick={() => { document.body.classList.remove("dealer-mobile-nav-open"); window.dispatchEvent(new Event("dealer-nav-closed")); }}>✕</button>
        <div className="h-16 px-4 flex items-center bg-surface-container/60 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-on-primary-container text-[20px]" aria-hidden="true">directions_car</span>
            </div>
            <div>
              <div className="font-headline-sm text-sm font-semibold text-on-surface tracking-tight leading-none">Automotive OS</div>
              <div className="font-label-caps text-[10px] uppercase text-primary mt-0.5 tracking-wider font-bold">Dealership Suite</div>
            </div>
          </div>
        </div>

        <div className="px-4 py-2">
          <div className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
            {isArabic ? 'العمليات الأساسية' : 'Operational Core'}
          </div>
        </div>

        <nav aria-label="Core modules" className="flex flex-col gap-1 px-2.5">
          {navItems.map((item) =>
            item.disabledReason
              ? renderDisabled(item, item.disabledReason === 'Not available yet' ? 'Soon' : 'Unavailable', item.disabledReason)
              : renderLink(item),
          )}
        </nav>

        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
            {isArabic ? 'وحدات المعاينة' : 'Preview modules'}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-label-caps font-semibold uppercase bg-secondary/15 text-secondary tracking-widest">
            Sample data
          </span>
        </div>

        <nav aria-label="Preview modules (sample data)" className="flex flex-col gap-1 px-2.5 pb-2">
          {previewItems.map((item) =>
            PREVIEW_MODULES_ENABLED
              ? renderLink(item, 'Preview')
              : renderDisabled(item, 'Preview', 'Preview module with sample data — not enabled in this build'),
          )}
        </nav>
      </div>

      {/* Signed-in dealership */}
      <div className="p-3 bg-surface-container-lowest/80 flex flex-col gap-2 border-t border-white/[0.05]">
        {identity ? (
          <div className="p-2 bg-surface-container/60 rounded-lg flex flex-col gap-0.5 border border-white/[0.04]">
            <div className="font-body-sm text-xs font-semibold text-on-surface truncate">{identity.tenantName}</div>
            <div className="font-label-caps text-[10px] text-on-surface-variant flex items-center gap-1 truncate">
              <span className="material-symbols-outlined text-[13px] text-primary" aria-hidden="true">badge</span>
              <span>{identity.displayName} • {roleLabel(identity.role)}</span>
            </div>
          </div>
        ) : (
          <div className="p-2 bg-surface-container/60 rounded-lg text-[11px] text-on-surface-variant border border-white/[0.04]">
            Preview page — no dealer session is loaded here.
          </div>
        )}
      </div>
    </aside>
  );
};
