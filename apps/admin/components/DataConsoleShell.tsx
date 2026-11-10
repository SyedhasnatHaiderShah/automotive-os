'use client';

import React from 'react';
import Link from 'next/link';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useLocale } from '../lib/locale';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Page frame for the data console: sidebar, header, breadcrumb and the
 * standing "raw tables" notice. Every data page renders inside it.
 */
export function DataConsoleShell({
  title,
  subtitle,
  crumbs,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  crumbs: Crumb[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { isRtl, toggleLocale, t } = useLocale();
  return (
    <div className={`min-h-screen bg-background font-body-md text-on-surface ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminSidebar isRtl={isRtl} />
      <div className={isRtl ? 'pr-60' : 'pl-60'}>
        <AdminHeader isRtl={isRtl} onToggleRtl={toggleLocale} />
        <main className="w-full pt-16 bg-background px-gutter py-space-lg">
          <nav aria-label={t('Breadcrumb', 'مسار التنقل')} className="mb-3 text-xs font-mono text-outline flex flex-wrap items-center gap-1">
            {crumbs.map((c, i) => (
              <React.Fragment key={`${c.label}-${i}`}>
                {i > 0 && <span aria-hidden="true">/</span>}
                {c.href ? (
                  <Link href={c.href} className="inline-flex min-h-6 items-center hover:text-primary">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-on-surface">{c.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" aria-hidden="true" />
                <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white">{title}</h1>
              </div>
              {subtitle && <p className="text-xs text-outline mt-1 font-mono">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 self-start">{actions}</div>}
          </div>
          <p role="note" className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
            {t(
              'Raw table access. Changes bypass workflow rules (moderation, tenant lifecycle, lead stages) but are audited and database constraints still apply. Deleting a row also deletes rows that depend on it.',
              'وصول مباشر إلى الجداول. التغييرات تتجاوز قواعد سير العمل لكنها مسجلة في سجل التدقيق وقيود قاعدة البيانات لا تزال سارية. حذف صف يحذف الصفوف المعتمدة عليه.',
            )}
          </p>
          {children}
        </main>
      </div>
    </div>
  );
}
