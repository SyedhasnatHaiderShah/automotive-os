/**
 * Per-status KYB badge styling shared by the dealers list and the KYB
 * registry (AD-05): only APPROVED looks verified; REJECTED/EXPIRED read as
 * errors; IN_REVIEW is highlighted; NOT_SUBMITTED is neutral.
 */
export function kybBadgeClass(status: string): string {
  return status === 'APPROVED'
    ? 'bg-tertiary/15 text-tertiary'
    : status === 'IN_REVIEW'
    ? 'bg-primary/20 text-primary'
    : status === 'REJECTED' || status === 'EXPIRED'
    ? 'bg-error-container/40 text-error'
    : 'bg-surface-container-high text-secondary';
}

const KYB_LABELS: Record<string, { en: string; ar: string }> = {
  APPROVED: { en: 'Approved', ar: 'معتمد' },
  IN_REVIEW: { en: 'In review', ar: 'قيد المراجعة' },
  REJECTED: { en: 'Rejected', ar: 'مرفوض' },
  EXPIRED: { en: 'Expired', ar: 'منتهي' },
  NOT_SUBMITTED: { en: 'Not submitted', ar: 'لم يُقدَّم' },
};

export function kybLabel(status: string, isRtl: boolean): string {
  const entry = KYB_LABELS[status];
  if (!entry) return status;
  return isRtl ? entry.ar : entry.en;
}
