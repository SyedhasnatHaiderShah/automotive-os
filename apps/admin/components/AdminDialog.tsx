'use client';

import React, { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
 * Tab/Shift+Tab focus trap, and focus returned to the opener on close.
 *
 * Latest `onClose`/`dismissible` are read through refs so the key handler is
 * never stale (AD-01: Escape must not close while a request is busy).
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
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  onCloseRef.current = onClose;
  dismissibleRef.current = dismissible;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusTimer = window.setTimeout(() => {
      const target =
        initialFocusRef?.current ??
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
        panelRef.current;
      target?.focus();
    }, 0);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (dismissibleRef.current) {
          event.stopPropagation();
          onCloseRef.current();
        }
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (nodes.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (active === last || !panelRef.current.contains(active))) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
      if (opener && document.contains(opener)) opener.focus();
    };
    // initialFocusRef is a stable ref object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
