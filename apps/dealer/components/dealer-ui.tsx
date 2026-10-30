import React from 'react';
import Link from 'next/link';

export function StatCard({
  label,
  value,
  icon,
  note,
  accent = 'text-on-surface',
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  /** Says where the number comes from (e.g. "All stock" or "Latest 50 vehicles"). */
  note: string;
  accent?: string;
}) {
  return (
    <div className="bg-surface-container-high/70 backdrop-blur-lg p-4 rounded-xl flex flex-col justify-between border border-white/[0.05]">
      <div className="flex items-center justify-between text-on-surface-variant">
        <span className="font-label-caps text-[10px] uppercase tracking-wider font-semibold">{label}</span>
        <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">{icon}</span>
      </div>
      <div className={`mt-2 font-headline-xl text-2xl font-bold font-data-mono-num ${accent}`}>{value}</div>
      <div className="mt-1 font-body-sm text-[11px] text-on-surface-variant">{note}</div>
    </div>
  );
}

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'good' | 'warn' | 'info' | 'neutral' | 'bad' }) {
  const tones: Record<string, string> = {
    good: 'bg-tertiary/15 text-tertiary border-tertiary/20',
    warn: 'bg-primary/15 text-primary border-primary/20',
    info: 'bg-secondary/15 text-secondary border-secondary/20',
    bad: 'bg-error/15 text-error border-error/20',
    neutral: 'bg-surface-container-high text-on-surface-variant border-white/[0.05]',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tones[tone]}`}>
      {label}
    </span>
  );
}

/** Prev/next pagination driven by `page`/`limit` search params. */
export function Pager({
  basePath,
  page,
  limit,
  total,
  params = {},
  noun,
}: {
  /** Path inside the /dealer basePath, e.g. "/inventory". */
  basePath: string;
  page: number;
  limit: number;
  total: number;
  /** Extra search params to keep (filters). */
  params?: Record<string, string | undefined>;
  noun: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
    query.set('page', String(target));
    query.set('limit', String(limit));
    return `${basePath}?${query.toString()}`;
  };
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const linkClass = 'min-h-11 inline-flex items-center rounded-lg border border-outline-variant/50 px-4 hover:bg-surface-container-high';
  const disabledClass = 'min-h-11 inline-flex items-center rounded-lg border border-outline-variant/30 px-4 opacity-40 cursor-not-allowed';

  return (
    <nav aria-label={`${noun} pagination`} className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 bg-surface-container p-3 text-sm">
      <span className="text-on-surface-variant">
        Showing {from}–{to} of {total} {noun}
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={linkClass} rel="prev">Previous</Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">Previous</span>
        )}
        <span>
          Page {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link href={href(page + 1)} className={linkClass} rel="next">Next</Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">Next</span>
        )}
      </div>
    </nav>
  );
}

export function AccessNotice({ title, message }: { title: string; message: string }) {
  return (
    <div role="status" className="my-6 rounded-2xl border border-white/[0.06] bg-surface-container-low p-8 text-center flex flex-col items-center gap-3">
      <span className="material-symbols-outlined text-4xl text-outline" aria-hidden="true">lock</span>
      <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
      <p className="text-sm text-on-surface-variant max-w-md">{message}</p>
    </div>
  );
}

export function listingTone(status: string | null): 'good' | 'warn' | 'info' | 'neutral' | 'bad' {
  switch (status) {
    case 'PUBLISHED':
      return 'good';
    case 'PENDING_REVIEW':
      return 'warn';
    case 'REJECTED':
      return 'bad';
    case 'SOLD':
      return 'info';
    default:
      return 'neutral';
  }
}

export function leadTone(status: string): 'good' | 'warn' | 'info' | 'neutral' | 'bad' {
  switch (status) {
    case 'NEW':
      return 'warn';
    case 'WON':
      return 'good';
    case 'LOST':
    case 'SPAM':
      return 'bad';
    case 'CONTACTED':
    case 'QUALIFIED':
    case 'TEST_DRIVE_NEGOTIATION':
      return 'info';
    default:
      return 'neutral';
  }
}
