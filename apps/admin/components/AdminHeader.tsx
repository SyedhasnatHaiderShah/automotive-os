'use client';

import React, { useEffect, useState } from 'react';
import { CurrentAdmin, errorMessage, getCurrentAdmin, signOutAdmin } from '../lib/api';

interface AdminHeaderProps {
  isRtl?: boolean;
  onToggleRtl?: () => void;
}

export function AdminHeader({ isRtl = false, onToggleRtl }: AdminHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [me, setMe] = useState<CurrentAdmin | null>(null);
  const [meError, setMeError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOutAdmin();
    } catch (err) {
      setSignOutError(errorMessage(err, isRtl ? 'تعذر تسجيل الخروج.' : 'Sign out failed.'));
      setSigningOut(false);
    }
  };
  useEffect(() => {
    const closed = () => setMobileOpen(false);
    window.addEventListener('admin-nav-closed', closed);
    return () => { document.body.classList.remove('admin-mobile-nav-open'); window.removeEventListener('admin-nav-closed', closed); };
  }, []);
  useEffect(() => {
    let active = true;
    getCurrentAdmin()
      .then((data) => { if (active) setMe(data); })
      .catch(() => { if (active) setMeError(true); });
    return () => { active = false; };
  }, []);

  const identityName = me
    ? me.displayName || me.email || me.id
    : meError
    ? (isRtl ? 'الهوية غير متاحة' : 'Identity unavailable')
    : '…';
  const identityRole = me
    ? me.isPlatformAdmin
      ? (isRtl ? 'مشرف المنصة' : 'Platform Admin')
      : (isRtl ? 'ليس مشرفاً للمنصة' : 'Not a platform admin')
    : '';

  return (
    <header
      className={`admin-app-header fixed top-0 ${
        isRtl ? 'right-60 left-0' : 'left-60 right-0'
      } h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.60)] z-40 px-gutter border-b border-surface-container-high/40`}
    >
      <div className="h-16 w-full flex items-center justify-between gap-space-md">
        <button type="button" className="lg:hidden min-h-11 min-w-11 rounded-lg text-on-surface hover:bg-surface-container-high" aria-label="Toggle admin navigation" aria-expanded={mobileOpen} onClick={() => { const next = !document.body.classList.contains("admin-mobile-nav-open"); setMobileOpen(next); document.body.classList.toggle("admin-mobile-nav-open", next); }}><span className="material-symbols-outlined">menu</span></button>
        {/* Left Info & Clearance Badge */}
        <div className="flex items-center gap-space-md min-w-0 flex-1">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider font-semibold">
                {isRtl ? 'حوكمة المنصة وعمليات الثقة' : 'Platform Governance & Trust Ops'}
              </span>
              {process.env.NEXT_PUBLIC_APP_ENV && process.env.NEXT_PUBLIC_APP_ENV !== 'production' && (
                <span className="px-1.5 py-0.5 rounded bg-surface-container-high font-data-mono-num text-body-sm text-on-surface-variant capitalize">
                  {process.env.NEXT_PUBLIC_APP_ENV}
                </span>
              )}
            </div>
            <div className="flex items-center gap-space-xs text-outline text-body-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              <span className="font-data-mono-num text-body-sm">
                {isRtl ? 'البوابات الخارجية غير متصلة' : 'External gateways disconnected'}
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
              } rounded-lg bg-surface-container-high text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary-container disabled:opacity-60 disabled:cursor-not-allowed`}
              placeholder={isRtl ? 'البحث الشامل غير متاح بعد' : 'Universal search — not available yet'}
              aria-label={isRtl ? 'البحث الشامل (غير متاح بعد)' : 'Universal search (not available yet)'}
              title="Not available yet: no universal search API"
              type="text"
              disabled
            />
          </div>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-space-md flex-shrink-0">
          <div className="hidden lg:flex items-center gap-space-xs px-2.5 py-1 rounded-full bg-surface-container">
            <span className="w-2 h-2 rounded-full bg-tertiary" />
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {isRtl ? 'التكاملات الخارجية معطلة' : 'External integrations disabled'}
            </span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-surface-container-high rounded p-0.5 font-label-caps text-label-caps">
            <button
              type="button"
              aria-label="Switch interface to English"
              onClick={() => {
                if (isRtl && onToggleRtl) onToggleRtl();
              }}
              aria-pressed={!isRtl}
              className={`px-2 py-0.5 rounded transition-colors ${
                !isRtl
                  ? 'bg-surface-bright text-on-surface font-semibold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              aria-label="التحويل إلى اللغة العربية"
              onClick={() => {
                if (!isRtl && onToggleRtl) onToggleRtl();
              }}
              aria-pressed={isRtl}
              className={`px-2 py-0.5 rounded transition-colors ${
                isRtl
                  ? 'bg-surface-bright text-on-surface font-semibold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              عربي
            </button>
          </div>

          {/* Notification Button (no notifications API yet) */}
          <button
            className="relative p-2 rounded-lg text-on-surface-variant opacity-60 cursor-not-allowed"
            type="button"
            title="Not available yet: no notifications API"
            aria-label="Notifications (not available yet)"
            disabled
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>

          {/* Signed-in identity from GET /api/v1/auth/me */}
          <div className="flex items-center gap-space-sm pl-space-sm">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="font-body-sm text-body-sm text-on-surface font-medium truncate max-w-[160px]" title={me?.email ?? undefined}>
                {identityName}
              </span>
              <span className="font-label-caps text-label-caps text-primary truncate max-w-[160px]">
                {identityRole}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>

          {/* AD-07: sign out (POST /api/v1/auth/logout) */}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label={isRtl ? 'تسجيل الخروج' : 'Sign out'}
            title={signOutError ?? (isRtl ? 'تسجيل الخروج' : 'Sign out')}
            className="min-h-11 min-w-11 px-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
            <span className="hidden md:inline font-body-sm text-body-sm">
              {signingOut ? (isRtl ? 'جارٍ الخروج…' : 'Signing out…') : isRtl ? 'خروج' : 'Sign out'}
            </span>
          </button>
          {signOutError && (
            <p
              role="alert"
              className={`absolute top-16 mt-1 ${isRtl ? 'left-4' : 'right-4'} max-w-xs rounded-lg border border-red-500/40 bg-red-950/90 px-3 py-2 text-xs text-red-200 shadow-xl`}
            >
              {signOutError}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
