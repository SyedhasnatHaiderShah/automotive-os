'use client';

import { useEffect, type RefObject } from 'react';
import { activateFocusTrap } from './focus-trap';

export interface UseOffCanvasNavOptions {
  /** Class toggled on `<body>` while the drawer is open. */
  bodyClass: string;
  /** Closes the drawer (removes the body class and notifies the toggle). */
  onClose: () => void;
  /** Media query under which the nav is an off-canvas drawer. */
  mediaQuery?: string;
}

/**
 * Makes a body-class driven off-canvas navigation behave as a modal drawer on
 * small screens: focus moves in when it opens and returns to the toggle when it
 * closes, Tab stays inside, the page behind does not scroll and a tap on the
 * backdrop closes it. Hiding the closed drawer from the tab order is done in
 * CSS (`visibility: hidden`), so it also holds before hydration.
 */
export function useOffCanvasNav(
  navRef: RefObject<HTMLElement | null>,
  { bodyClass, onClose, mediaQuery = '(max-width: 1023px)' }: UseOffCanvasNavOptions,
): void {
  useEffect(() => {
    let release: (() => void) | null = null;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target || navRef.current?.contains(target)) return;
      // The toggle button closes the drawer itself; closing here too would reopen it.
      if (target.closest('[data-nav-toggle]')) return;
      onClose();
    };

    const sync = () => {
      const nav = navRef.current;
      const open = document.body.classList.contains(bodyClass) && window.matchMedia(mediaQuery).matches;
      if (open && !release && nav) {
        const releaseTrap = activateFocusTrap(nav, { onEscape: onClose });
        document.addEventListener('pointerdown', onPointerDown, true);
        release = () => {
          document.removeEventListener('pointerdown', onPointerDown, true);
          releaseTrap();
        };
      } else if (!open && release) {
        release();
        release = null;
      }
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const media = window.matchMedia(mediaQuery);
    media.addEventListener('change', sync);
    sync();

    return () => {
      observer.disconnect();
      media.removeEventListener('change', sync);
      release?.();
    };
    // navRef is a stable ref object; onClose only touches the DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyClass, mediaQuery]);
}
