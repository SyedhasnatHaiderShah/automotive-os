'use client';

import React from 'react';
import { useModalFocus } from '@automotive-os/ui';

export interface AdminDialogProps {
  open: boolean;
  /** id of the element that names the dialog (usually its heading). */
  labelledBy: string;
  describedBy?: string;
  /** Called on Escape unless `dismissible` is false. The backdrop does not close (typed input is kept). */
  onClose: () => void;
  /** When false (e.g. a request is in flight) Escape is ignored. */
  dismissible?: boolean;
  /** Element to focus first; defaults to the first focusable element. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  zIndexClass?: string;
  children: React.ReactNode;
}

/**
 * Accessible modal dialog shell: role="dialog" + aria-modal, Escape to close,
 * Tab/Shift+Tab focus trap, scroll lock, and focus returned to the opener on close.
 *
 * Keyboard behaviour comes from the shared `useModalFocus` hook, which reads the
 * latest `onClose`/`dismissible` through refs so the key handler is never
 * stale (AD-01: Escape must not close while a request is busy).
 */
export function AdminDialog({
  open,
  labelledBy,
  describedBy,
  onClose,
  dismissible = true,
  initialFocusRef,
  className = 'w-full max-w-md bg-[#121824] border border-white/10 rounded-2xl p-6 shadow-2xl',
  zIndexClass = 'z-[120]',
  children,
}: AdminDialogProps) {
  const panelRef = useModalFocus<HTMLDivElement>(open, { onClose, dismissible, initialFocusRef });

  if (!open) return null;

  return (
    <div className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/70 backdrop-blur-sm p-4`}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={`${className} focus:outline-none`}
      >
        {children}
      </div>
    </div>
  );
}
