'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { AdminDialog } from './AdminDialog';
import { useLocale } from '../lib/locale';

export interface ConfirmReasonModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'danger' | 'warning' | 'neutral';
  /** Optional honesty note, e.g. when the API does not persist the reason. */
  note?: string;
  busy?: boolean;
  error?: string | null;
  minReasonLength?: number;
  /** Label for the reason field. Defaults to a required-reason label. */
  reasonLabel?: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

/**
 * Confirmation dialog for destructive admin actions. A written reason is
 * mandatory; the action only runs after the operator confirms.
 */
export function ConfirmReasonModal({
  open,
  title,
  description,
  confirmLabel,
  tone = 'danger',
  note,
  busy = false,
  error,
  minReasonLength = 5,
  reasonLabel,
  onCancel,
  onConfirm,
}: ConfirmReasonModalProps) {
  const [reason, setReason] = useState('');
  const { t } = useLocale();
  const titleId = useId();
  const descId = useId();
  const reasonId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Clear the reason each time the dialog opens. Escape handling, focus trap
  // and focus return live in AdminDialog, which always reads the latest
  // `busy` (AD-01: Escape cannot close the dialog while a request runs).
  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const trimmed = reason.trim();
  const valid = trimmed.length >= minReasonLength;
  const confirmClass =
    tone === 'danger'
      ? 'bg-error text-on-error hover:opacity-90'
      : tone === 'warning'
      ? 'bg-amber-500/90 text-black hover:bg-amber-400'
      : 'bg-primary text-on-primary hover:opacity-90';

  return (
    <AdminDialog
      open={open}
      labelledBy={titleId}
      describedBy={descId}
      onClose={onCancel}
      dismissible={!busy}
      initialFocusRef={textareaRef}
    >
      <h2 id={titleId} className="text-lg font-bold font-heading text-white">
        {title}
      </h2>
      <p id={descId} className="mt-2 text-xs text-gray-300 font-mono">
        {description}
      </p>

      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !busy) onConfirm(trimmed);
        }}
      >
        <label htmlFor={reasonId} className="block text-xs text-gray-400 font-mono">
          {reasonLabel ?? t('Reason (required, recorded with the action)', 'السبب (مطلوب، يُسجَّل مع الإجراء)')}
        </label>
        <textarea
          id={reasonId}
          ref={textareaRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required={minReasonLength > 0}
          minLength={minReasonLength > 0 ? minReasonLength : undefined}
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-primary focus:outline-none"
        />
        {!valid && reason.length > 0 && (
          <p className="text-[11px] text-amber-300 font-mono">
            {t(`Enter at least ${minReasonLength} characters.`, `أدخل ${minReasonLength} أحرف على الأقل.`)}
          </p>
        )}
        {note && <p className="text-[11px] text-outline font-mono">{note}</p>}
        {error && (
          <p role="alert" className="text-xs text-red-300 font-mono">
            {error}
          </p>
        )}

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:text-white text-xs disabled:opacity-50"
          >
            {t('Cancel', 'إلغاء')}
          </button>
          <button
            type="submit"
            disabled={!valid || busy}
            className={`px-4 py-2 rounded-lg font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed ${confirmClass}`}
          >
            {busy ? t('Working…', 'جارٍ التنفيذ…') : confirmLabel}
          </button>
        </div>
      </form>
    </AdminDialog>
  );
}
