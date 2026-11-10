'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { activateFocusTrap } from './focus-trap';

export interface UseModalFocusOptions {
  /** Called on Escape unless `dismissible` is false. */
  onClose?: () => void;
  /** When false (for example while a request is in flight) Escape is ignored. */
  dismissible?: boolean;
  /** Element to focus first; defaults to the first focusable element in the surface. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Lock page scroll while open. Default true. */
  lockScroll?: boolean;
}

/**
 * Keyboard behaviour for a modal surface: initial focus, Tab containment,
 * Escape, scroll lock and focus return to the opener.
 * Attach the returned ref to the element carrying `role="dialog"`.
 *
 * The latest `onClose`/`dismissible` are read through refs so the key handler
 * is never stale (Escape must not close while a request is busy).
 */
export function useModalFocus<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  options: UseModalFocusOptions = {},
): RefObject<T | null> {
  const surfaceRef = useRef<T | null>(null);
  const onCloseRef = useRef(options.onClose);
  const dismissibleRef = useRef(options.dismissible ?? true);
  const initialFocusRef = options.initialFocusRef;
  const lockScroll = options.lockScroll;
  onCloseRef.current = options.onClose;
  dismissibleRef.current = options.dismissible ?? true;

  useEffect(() => {
    if (!open || !surfaceRef.current) return;
    return activateFocusTrap(surfaceRef.current, {
      onEscape: () => {
        if (dismissibleRef.current) onCloseRef.current?.();
      },
      initialFocus: () => initialFocusRef?.current,
      lockScroll,
    });
    // initialFocusRef is a stable ref object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lockScroll]);

  return surfaceRef;
}
