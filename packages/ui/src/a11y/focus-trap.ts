/**
 * Focus containment for modal surfaces (dialogs, drawers, sheets, off-canvas nav).
 *
 * Traps form a stack: only the most recently activated trap handles Tab and
 * Escape, so a confirmation dialog opened from a drawer works without the two
 * fighting over focus.
 */

export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

export interface FocusTrapOptions {
  /** Called when Escape is pressed while this trap is the top-most one. */
  onEscape?: () => void;
  /** Element to focus first. Defaults to the first focusable element, then the container. */
  initialFocus?: () => HTMLElement | null | undefined;
  /** Prevent the page behind from scrolling while the trap is active. Default true. */
  lockScroll?: boolean;
  /** Return focus to the element that had it before activation. Default true. */
  restoreFocus?: boolean;
}

interface ActiveTrap {
  container: HTMLElement;
  options: FocusTrapOptions;
}

const stack: ActiveTrap[] = [];
let scrollLocks = 0;
let previousOverflow = '';

/**
 * Elements the browser would actually stop on. `visibility` is checked as well as layout: a child
 * with `transition: all` is still `visibility: hidden` for the first frame after its drawer opens,
 * and Tab skips it, so it must not be taken for the last stop.
 */
function visibleFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      el === document.activeElement ||
      (el.getClientRects().length > 0 && getComputedStyle(el).visibility === 'visible'),
  );
}

function onKeyDown(event: KeyboardEvent): void {
  const top = stack[stack.length - 1];
  if (!top) return;

  if (event.key === 'Escape') {
    if (top.options.onEscape) {
      event.stopPropagation();
      top.options.onEscape();
    }
    return;
  }
  if (event.key !== 'Tab') return;

  const { container } = top;
  const nodes = visibleFocusable(container);
  if (nodes.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  const active = document.activeElement;
  const outside = !container.contains(active);
  if (event.shiftKey && (active === first || active === container || outside)) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && (active === last || outside)) {
    event.preventDefault();
    first?.focus();
  }
}

function lockScroll(): void {
  if (scrollLocks === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  scrollLocks += 1;
}

function unlockScroll(): void {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) document.body.style.overflow = previousOverflow;
}

/**
 * Moves focus into `container`, keeps Tab/Shift+Tab inside it and wires Escape.
 * Returns a function that releases the trap and restores focus to the opener.
 */
export function activateFocusTrap(container: HTMLElement, options: FocusTrapOptions = {}): () => void {
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const trap: ActiveTrap = { container, options };
  const shouldLock = options.lockScroll !== false;

  if (stack.length === 0) document.addEventListener('keydown', onKeyDown, true);
  stack.push(trap);
  if (shouldLock) lockScroll();

  // After paint, so content rendered in the same commit (or a slide-in transition) is focusable.
  const focusTimer = window.setTimeout(() => {
    if (container.contains(document.activeElement) && document.activeElement !== container) return;
    const target = options.initialFocus?.() ?? visibleFocusable(container)[0] ?? container;
    target.focus();
  }, 0);

  let released = false;
  return () => {
    if (released) return;
    released = true;
    window.clearTimeout(focusTimer);
    const index = stack.indexOf(trap);
    if (index !== -1) stack.splice(index, 1);
    if (stack.length === 0) document.removeEventListener('keydown', onKeyDown, true);
    if (shouldLock) unlockScroll();
    if (options.restoreFocus !== false && opener && document.contains(opener)) opener.focus();
  };
}
