'use client';

import React from 'react';
import Link from 'next/link';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import { useLocale } from '../../lib/locale';

/**
 * Disputes & Sanctions.
 *
 * There is no disputes, escrow or sanctions API in the platform yet, so this
 * screen intentionally shows no case data and offers no adjudication controls.
 * Nothing here simulates an escrow release, dual-control signature or sanction.
 */
export default function DisputesAndSanctionsPage() {
  const { isRtl, toggleLocale } = useLocale();

  return (
    <div className={`min-h-screen bg-background font-body-md text-on-surface ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminSidebar isRtl={isRtl} />
      <div className={isRtl ? 'pr-60' : 'pl-60'}>
        <AdminHeader isRtl={isRtl} onToggleRtl={toggleLocale} />

        <main className="w-full pt-16 bg-background px-gutter py-space-lg">
          <div className="flex flex-col gap-space-lg">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                {isRtl ? 'النزاعات والعقوبات' : 'Disputes & Sanctions'}
              </h1>
              <p className="font-body-sm text-body-sm text-outline mt-0.5">
                {isRtl
                  ? 'مراجعة النزاعات وقرارات الضمان والعقوبات على الوكلاء'
                  : 'Dispute review, escrow disposition and dealer sanctions'}
              </p>
            </div>

            <section
              role="status"
              className="rounded-xl bg-surface-container-low border border-surface-container-high/40 p-space-lg shadow-xl flex flex-col items-start gap-space-sm"
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[28px]">gavel</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  {isRtl ? 'وحدة النزاعات غير متاحة بعد' : 'Disputes module not available yet'}
                </h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
                {isRtl
                  ? 'لا توجد واجهة برمجية للنزاعات أو الضمان أو العقوبات في المنصة حتى الآن. لا تُعرض أي قضايا ولا يمكن تنفيذ أي قرار من هذه الشاشة.'
                  : 'The platform has no disputes, escrow or sanctions API yet. No cases are shown and no adjudication, escrow release or sanction can be executed from this screen.'}
              </p>
              <p className="font-body-sm text-body-sm text-outline max-w-2xl">
                {isRtl
                  ? 'لتعليق وكالة بشكل فعلي استخدم صفحة الوكالات المعتمدة، التي تستدعي واجهة حالة المستأجر الحقيقية.'
                  : 'To actually suspend a dealership, use Institutional Dealers, which calls the real tenant status API with a recorded reason.'}
              </p>
              <Link
                href="/dealers"
                className="mt-space-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-body-sm font-medium transition-colors"
              >
                <span>{isRtl ? 'الوكالات المعتمدة' : 'Go to Institutional Dealers'}</span>
                <span className="material-symbols-outlined text-[16px]">{isRtl ? 'chevron_left' : 'chevron_right'}</span>
              </Link>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
