/**
 * Helpers for the sample-data preview modules (sales, workshop, parts,
 * finance, fleet, accounting). Those pages run on local fixtures and never
 * call an external system, so their feedback must not claim otherwise.
 */

export const PREVIEW_NOTHING_SENT = 'Preview only — nothing was sent.';

export const PREVIEW_NOTHING_SENT_AR = 'معاينة فقط — لم يتم إرسال أي شيء.';

const ARABIC_SCRIPT = /[\u0600-\u06FF]/; // Arabic Unicode block

/**
 * Map a preview page's feedback text to an honest message. Every action in a
 * preview module is local, so feedback never repeats the page's own wording
 * (keyword filters missed Arabic success text, DL-01). The language follows
 * the message the page tried to show.
 */
export function previewSafeMessage(message: string | null): string | null {
  if (message === null) return null;
  return ARABIC_SCRIPT.test(message) ? PREVIEW_NOTHING_SENT_AR : PREVIEW_NOTHING_SENT;
}
