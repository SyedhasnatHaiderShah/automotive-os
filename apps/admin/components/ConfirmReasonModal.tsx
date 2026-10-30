'use client';

import React, { useEffect, useId, useRef, useState } from 'react';

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
  const titleId = useId();
  const descId = useId();
  const reasonId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setReason('');
    const t = window.setTimeout(() => textareaRef.current?.focus(), 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const trimmed = reason.trim();
  const valid = trimmed.length >= minReasonLength;
  const confirmClass =
    tone === 'danger'
      ? 'bg-error text-on-error hover:opacity-90'
      : tone === 'warning'
      ? 'bg-amber-500/90 text-black hover:bg-amber-400'
      : 'bg-primary text-on-primary hover:opacity-90';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-md bg-[#121824] border border-white/10 rounded-2xl p-6 shadow-2xl"
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
            {reasonLabel ?? 'Reason (required, recorded with the action)'}
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
            <p className="text-[11px] text-amber-300 font-mono">Enter at least {minReasonLength} characters.</p>
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={!valid || busy}
              className={`px-4 py-2 rounded-lg font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed ${confirmClass}`}
            >
              {busy ? 'Working…' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
