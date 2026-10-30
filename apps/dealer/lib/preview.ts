/**
 * Helpers for the sample-data preview modules (sales, workshop, parts,
 * finance, fleet, accounting). Those pages run on local fixtures and never
 * call an external system, so their feedback must not claim otherwise.
 */

export const PREVIEW_NOTHING_SENT = 'Preview only — nothing was sent.';

/**
 * Wording that implies an action reached a regulator, court, bank, escrow,
 * supplier, customs or any other outside party.
 */
const EXTERNAL_ACTION_PATTERN =
  /\b(RTA|FTA|CBUAE|DLD|AECB|court|counsel|police|escrow|lien|bank|lender|insur\w*|supplier|vendor|customs|bond|tax|petition|legal|notice|dispatch\w*|submit\w*|sent|transmit\w*|filed|lodg\w*|export\w*|sync\w*|synchroni\w*|releas\w*|notif\w*|confirm\w*|wired|remit\w*|cleared|upload\w*|issued|approv\w*|reserved|placed|signed|certificate|PO|purchase order|download\w*)\b/i;

/** Map a preview page's feedback text to an honest message. */
export function previewSafeMessage(message: string | null): string | null {
  if (message === null) return null;
  if (EXTERNAL_ACTION_PATTERN.test(message)) return PREVIEW_NOTHING_SENT;
  return `Preview: ${message}`;
}
