/**
 * The API does not send email yet (no provider is connected; see
 * docs/implementation/INTEGRATION_TRUTH_TABLE.md). Verification copy must not
 * claim a message was delivered until a provider is live and this flag is set.
 */
export const EMAIL_DELIVERY_AVAILABLE = process.env.NEXT_PUBLIC_EMAIL_DELIVERY_ENABLED === 'true';

/** Reads the API error envelope `{ error: { message } }`, falling back to a top-level message. */
export function apiErrorMessage(data: unknown, fallback: string): string {
  const body = data as { error?: { message?: unknown }; message?: unknown } | null;
  const nested = body?.error?.message;
  if (typeof nested === 'string' && nested) return nested;
  if (typeof body?.message === 'string' && body.message) return body.message;
  return fallback;
}
