'use client';

import React, { useEffect, useId, useState } from 'react';
import { useModalFocus } from '../a11y/use-modal-focus';

export interface ModalOverlayProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Called on Escape unless `dismissible` is false. */
  onClose: () => void;
  dismissible?: boolean;
  children: React.ReactNode;
}

/**
 * Full-screen modal layer for a conditionally rendered overlay: mount it when
 * the modal is open, unmount it when closed. Adds `role="dialog"`,
 * `aria-modal`, initial focus, Tab containment, Escape, scroll lock and focus
 * return. The dialog is named by `aria-label`/`aria-labelledby` when given,
 * otherwise by the first heading inside it.
 */
export function ModalOverlay({ onClose, dismissible = true, children, ...rest }: ModalOverlayProps) {
  const ref = useModalFocus<HTMLDivElement>(true, { onClose, dismissible });
  const fallbackId = useId();
  const [headingId, setHeadingId] = useState<string | undefined>(undefined);
  const named = Boolean(rest['aria-label'] || rest['aria-labelledby']);

  useEffect(() => {
    if (named) return;
    const heading = ref.current?.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6');
    if (!heading) return;
    if (!heading.id) heading.id = fallbackId;
    setHeadingId(heading.id);
    // Runs once per mount: the overlay is unmounted when closed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      {...rest}
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={rest['aria-labelledby'] ?? (named ? undefined : headingId)}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}
