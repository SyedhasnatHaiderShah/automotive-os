'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, Car, Heart, Loader2, Search, Trash2 } from 'lucide-react';
import { FavoriteItem, SavedSearchItem, deleteSavedSearchApi, removeFavoriteApi } from '../lib/api';
import { BuyerAuthRequiredError } from '../lib/buyer-api-client';
import { AccountShell, AccountCard, StatusMessage, formatDubai, useAccountLocale } from './account-shell';

interface BuyerSavedViewProps {
  initialSearches: SavedSearchItem[];
  initialFavorites: FavoriteItem[];
  displayName?: string;
}

function formatAed(fils: string): string {
  const n = Number(fils);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `AED ${Math.round(n / 100).toLocaleString('en-US')}`;
}

/** Turns a saved filterJson into readable chips; values are shown as stored. */
function filterChips(filter: Record<string, unknown>): string[] {
  return Object.entries(filter)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      if (/Fils$/.test(k) && typeof v === 'number') return `${k.replace(/Fils$/, '')}: AED ${Math.round(v / 100).toLocaleString('en-US')}`;
      return `${k}: ${String(v)}`;
    });
}

/** Builds a /cars URL from known filter keys so a saved search can be re-run. */
function searchHref(filter: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const key of ['make', 'model', 'emirate', 'q', 'condition']) {
    const v = filter[key];
    if (typeof v === 'string' && v) params.set(key, v);
  }
  const qs = params.toString();
  return qs ? `/cars?${qs}` : '/cars';
}

export function BuyerSavedView({ initialSearches, initialFavorites, displayName }: BuyerSavedViewProps) {
  return (
    <AccountShell
      displayName={displayName}
      title="Saved searches & favorites"
      titleAr="عمليات البحث المحفوظة والمفضلة"
      subtitle="Vehicles you saved and searches you stored."
      subtitleAr="السيارات والبحوث التي حفظتها."
    >
      <SavedBody initialSearches={initialSearches} initialFavorites={initialFavorites} />
    </AccountShell>
  );
}

function SavedBody({ initialSearches, initialFavorites }: Omit<BuyerSavedViewProps, 'displayName'>) {
  const { isArabic } = useAccountLocale();
  const router = useRouter();
  const [searches, setSearches] = useState(initialSearches);
  const [favorites, setFavorites] = useState(initialFavorites);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const run = async (id: string, action: () => Promise<unknown>, onDone: () => void, okText: string) => {
    setBusyId(id);
    setMessage(null);
    try {
      await action();
      onDone();
      setMessage({ kind: 'success', text: okText });
    } catch (err) {
      if (err instanceof BuyerAuthRequiredError) {
        router.push(`/auth?tab=login&redirect=${encodeURIComponent('/account/saved')}`);
        return;
      }
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Request failed.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {message && <StatusMessage kind={message.kind}>{message.text}</StatusMessage>}

      <section aria-labelledby="favorites-title" className="flex flex-col gap-4">
        <h2 id="favorites-title" className="flex items-center gap-2 text-xl font-bold text-[#e0e2ea]">
          <Heart className="w-5 h-5 text-[#f2ca50]" aria-hidden="true" />
          {isArabic ? 'السيارات المفضلة' : 'Favorite vehicles'}
          <span className="text-sm font-mono text-[#99907c]">({favorites.length})</span>
        </h2>
        {favorites.length === 0 ? (
          <AccountCard className="text-center py-10">
            <p className="text-sm text-[#d0c5af] mb-4">
              {isArabic ? 'لم تحفظ أي سيارة بعد.' : 'You have not saved any vehicles yet.'}
            </p>
            <Link href="/cars" className="text-sm font-semibold text-[#f2ca50] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50] rounded">
              {isArabic ? 'تصفح السيارات' : 'Browse vehicles'}
            </Link>
          </AccountCard>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {favorites.map((fav) => {
              const listed = fav.status === 'PUBLISHED';
              return (
                <li key={fav.listingId}>
                  <AccountCard className="p-0 overflow-hidden flex flex-col h-full">
                    <div className="aspect-[16/10] bg-[#0a0e13] flex items-center justify-center">
                      {fav.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={fav.thumbnailUrl} alt={fav.title} className="w-full h-full object-cover" />
                      ) : (
                        <Car className="w-10 h-10 text-[#4d4635]" aria-hidden="true" />
                      )}
                    </div>
                    <div className="p-5 flex flex-col gap-2 flex-1">
                      <h3 className="text-base font-bold text-[#e0e2ea]">{fav.title || '—'}</h3>
                      <p className="text-lg font-bold text-[#f2ca50]">{formatAed(fav.askingPriceFils)}</p>
                      {!listed && (
                        <p className="text-xs text-[#ffb4ab]">{isArabic ? 'لم يعد معروضًا' : 'No longer listed'}</p>
                      )}
                      <p className="text-[11px] text-[#99907c]">
                        {isArabic ? 'حُفظ' : 'Saved'} {formatDubai(fav.createdAt, false)}
                      </p>
                      <div className="flex gap-2 mt-auto pt-3">
                        {listed && (
                          <Link
                            href={`/cars/${fav.slug}`}
                            className="flex-1 text-center px-4 py-2 rounded-lg bg-[#f2ca50] text-[#241a00] text-xs font-bold hover:bg-[#e9c349] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]"
                          >
                            {isArabic ? 'عرض' : 'View listing'}
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            run(
                              fav.listingId,
                              () => removeFavoriteApi(fav.listingId),
                              () => setFavorites((prev) => prev.filter((f) => f.listingId !== fav.listingId)),
                              isArabic ? 'تمت الإزالة من المفضلة.' : 'Removed from favorites.'
                            )
                          }
                          disabled={busyId === fav.listingId}
                          aria-label={`${isArabic ? 'إزالة' : 'Remove'} ${fav.title}`}
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-[#31353b] text-[#d0c5af] text-xs hover:text-[#ffb4ab] hover:border-[#ffb4ab]/50 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]"
                        >
                          {busyId === fav.listingId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          {isArabic ? 'إزالة' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  </AccountCard>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="searches-title" className="flex flex-col gap-4">
        <h2 id="searches-title" className="flex items-center gap-2 text-xl font-bold text-[#e0e2ea]">
          <Bookmark className="w-5 h-5 text-[#f2ca50]" aria-hidden="true" />
          {isArabic ? 'عمليات البحث المحفوظة' : 'Saved searches'}
          <span className="text-sm font-mono text-[#99907c]">({searches.length})</span>
        </h2>
        {searches.length === 0 ? (
          <AccountCard className="text-center py-10">
            <p className="text-sm text-[#d0c5af]">
              {isArabic ? 'لا توجد عمليات بحث محفوظة.' : 'No saved searches yet.'}
            </p>
          </AccountCard>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {searches.map((s) => {
              const chips = filterChips(s.filterJson);
              return (
                <li key={s.id}>
                  <AccountCard className="flex flex-col gap-3 h-full">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-[#e0e2ea]">{s.name || '—'}</h3>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#99907c]">
                        {s.alertsEnabled ? (isArabic ? 'التنبيهات مفعلة' : 'Alerts on') : isArabic ? 'التنبيهات متوقفة' : 'Alerts off'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {chips.length === 0 ? (
                        <span className="text-xs text-[#99907c]">{isArabic ? 'بدون فلاتر' : 'No filters'}</span>
                      ) : (
                        chips.map((c) => (
                          <span key={c} className="px-2.5 py-1 rounded-full bg-[#262a30] text-xs text-[#e0e2ea]">
                            {c}
                          </span>
                        ))
                      )}
                    </div>
                    <p className="text-[11px] text-[#99907c]">
                      {isArabic ? 'أنشئ' : 'Created'} {formatDubai(s.createdAt, false)}
                    </p>
                    <p className="text-[11px] text-[#99907c]">
                      {isArabic ? 'تعديل التنبيهات غير متاح بعد.' : 'Changing alert settings is not available yet.'}
                    </p>
                    <div className="flex gap-2 mt-auto pt-2">
                      <Link
                        href={searchHref(s.filterJson)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#181c21] border border-[#31353b] text-[#e0e2ea] text-xs font-semibold hover:border-[#f2ca50] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]"
                      >
                        <Search className="w-3.5 h-3.5" aria-hidden="true" />
                        {isArabic ? 'تشغيل البحث' : 'Run search'}
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            s.id,
                            () => deleteSavedSearchApi(s.id),
                            () => setSearches((prev) => prev.filter((x) => x.id !== s.id)),
                            isArabic ? 'تم حذف البحث.' : 'Saved search deleted.'
                          )
                        }
                        disabled={busyId === s.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#ffb4ab]/50 text-[#ffb4ab] text-xs font-semibold hover:bg-[#93000a]/20 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb4ab]"
                      >
                        {busyId === s.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        {isArabic ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  </AccountCard>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
