'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface DealerSidebarProps {
  onIntakeClick?: () => void;
  locale?: 'en' | 'ar';
}

export const DealerSidebar: React.FC<DealerSidebarProps> = ({
  onIntakeClick,
  locale = 'en',
}) => {
  const pathname = usePathname();
  const isArabic = locale === 'ar';

  const navItems = [
    {
      label: isArabic ? 'لوحة التحكم' : 'Dashboard',
      href: '/',
      path: '/',
      icon: 'space_dashboard',
    },
    {
      label: isArabic ? 'إدارة المخزون' : 'Inventory',
      href: '/inventory',
      path: '/inventory',
      icon: 'garage',
    },
    {
      label: isArabic ? 'إدخال مركبة' : 'Add Vehicle',
      href: '#',
      icon: 'add_circle',
      onClick: onIntakeClick,
    },
    {
      label: isArabic ? 'إدارة العملاء والطلبات' : 'CRM Pipeline',
      href: '/leads',
      path: '/leads',
      icon: 'filter_alt',
    },
    {
      label: isArabic ? 'تجارب القيادة' : 'Test Drives',
      href: '#',
      path: '/appointments',
      icon: 'speed',
    },
    {
      label: isArabic ? 'الامتثال والتسجيل RTA' : 'RTA & Compliance',
      href: '#',
      path: '/compliance',
      icon: 'verified',
    },
    {
      label: isArabic ? 'إعدادات الوكالة' : 'Dealership Settings',
      href: '#',
      path: '/settings',
      icon: 'tune',
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-low/95 backdrop-blur-xl z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.2)] border-r border-white/[0.06]">
      <div className="flex flex-col">
        {/* Dealership Suite Branding */}
        <div className="h-16 px-4 flex items-center justify-between bg-surface-container/60 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-on-primary-container text-[20px]">
                directions_car
              </span>
            </div>
            <div>
              <div className="font-headline-sm text-sm font-semibold text-on-surface tracking-tight leading-none">
                Automotive OS
              </div>
              <div className="font-label-caps text-[10px] uppercase text-primary mt-0.5 tracking-wider font-bold">
                Dealership Suite
              </div>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[18px] cursor-pointer hover:text-on-surface">
            unfold_more
          </span>
        </div>

        {/* Section Label */}
        <div className="px-4 py-2">
          <div className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
            Operational Core
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 px-2.5">
          {navItems.map((item) => {
            const isActive =
              item.path &&
              (item.path === '/'
                ? pathname === '/' || pathname === '/dashboard'
                : pathname?.startsWith(item.path));

            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all text-left w-full"
                >
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    {item.icon}
                  </span>
                  <span className="font-body-md text-xs sm:text-sm font-medium">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2 rounded-lg transition-all text-xs sm:text-sm ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-md'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
                <span className="font-body-md">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Tenant & Allocation Status Card */}
      <div className="p-3 bg-surface-container-lowest/80 flex flex-col gap-2 border-t border-white/[0.05]">
        <div className="bg-surface-container-high/90 p-3 rounded-xl flex flex-col gap-1.5 border border-white/[0.05]">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[10px] uppercase text-on-surface font-semibold tracking-wider">
              Vault Allocations
            </span>
            <span className="font-data-mono-num text-xs text-primary font-bold">
              42 / 50
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '84%' }} />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-body-sm text-[11px] text-on-surface-variant flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary inline-block animate-pulse" />
              All changes saved
            </span>
            <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">
              Tier-1
            </span>
          </div>
        </div>

        <div className="p-2 bg-surface-container/60 rounded-lg flex flex-col gap-0.5 border border-white/[0.04]">
          <div className="font-body-sm text-xs font-semibold text-on-surface truncate">
            SilberArrows Luxury FZCO
          </div>
          <div className="font-label-caps text-[10px] text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-tertiary">verified</span>
            <span>DED #612048 • GCC Spec</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
