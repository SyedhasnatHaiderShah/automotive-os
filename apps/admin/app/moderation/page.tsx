'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import { useLocale } from '../../lib/locale';

/**
 * Listing moderation queue.
 *
 * The API exposes GET /admin/listings/:id and POST /admin/listings/:id/decision
 * but no queue/list endpoint, so no queue rows, counts or SLA timers are shown.
 * An operator can still open a specific listing by its UUID or slug.
 */
export default function ModerationQueueListPage() {
  const router = useRouter();
  const { isRtl, toggleLocale } = useLocale();
  const [listingRef, setListingRef] = useState('');

  const openListing = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = listingRef.trim();
    if (!ref) return;
    router.push(`/moderation/listings/${encodeURIComponent(ref)}`);
  };

  return (
    <div className={`min-h-screen bg-background font-body-md text-on-surface ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminSidebar isRtl={isRtl} />
      <div className={isRtl ? 'pr-60' : 'pl-60'}>
        <AdminHeader isRtl={isRtl} onToggleRtl={toggleLocale} />

        <main className="w-full pt-16 bg-background px-gutter py-space-lg">
          <div className="flex flex-col gap-space-lg">
            {/* Header */}
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                {isRtl ? 'طابور مراجعة وتدقيق الإعلانات' : 'Vehicle Listing Moderation Queue'}
              </h1>
              <p className="font-body-sm text-body-sm text-outline mt-0.5">
                {isRtl
                  ? 'مراجعة الإعلانات المقدمة قبل النشر في السوق'
                  : 'Review submitted listings before marketplace publication'}
              </p>
            </div>

            {/* Open by reference */}
            <form
              onSubmit={openListing}
              className="p-space-md rounded-xl bg-surface-container-low shadow-md flex flex-wrap items-end gap-space-md border border-surface-container-high/40"
            >
              <div className="flex flex-col gap-1 min-w-[280px] flex-1">
                <label htmlFor="listing-ref" className="font-label-caps text-label-caps text-outline uppercase">
                  {isRtl ? 'معرّف الإعلان أو الرابط المختصر' : 'Listing UUID or slug'}
                </label>
                <input
                  id="listing-ref"
                  type="text"
                  value={listingRef}
                  onChange={(e) => setListingRef(e.target.value)}
                  placeholder={isRtl ? 'أدخل المعرّف' : 'Paste a listing UUID or slug'}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={!listingRef.trim()}
                className="h-10 px-4 rounded-lg bg-primary text-on-primary font-body-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRtl ? 'فتح الإعلان' : 'Open listing'}
              </button>
            </form>

            {/* Honest empty queue */}
            <section
              role="status"
              className="rounded-xl bg-surface-container-low shadow-xl border border-surface-container-high/40 p-space-lg flex flex-col items-start gap-space-sm"
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[24px]">policy</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  {isRtl ? 'واجهة طابور المراجعة غير متاحة بعد' : 'Queue API not available yet'}
                </h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
                {isRtl
                  ? 'لا توجد واجهة برمجية لسرد الإعلانات بانتظار المراجعة، لذلك لا يُعرض أي طابور أو عدد أو مؤقت. يمكن فتح إعلان محدد بمعرّفه أعلاه ثم اعتماده أو رفضه عبر الواجهة الحقيقية.'
                  : 'There is no API that lists listings pending review, so no queue rows, counts or SLA timers are shown. You can open a specific listing by its UUID or slug above and approve or reject it through the real decision API.'}
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
