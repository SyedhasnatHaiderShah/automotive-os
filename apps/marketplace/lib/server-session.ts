// Server-only module: imports next/headers, so never import it from a client component.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BuyerAuthRequiredError } from './buyer-api-client';

export const SESSION_COOKIE = 'ao_session';

export function loginRedirectPath(returnTo: string): string {
  return `/auth?tab=login&redirect=${encodeURIComponent(returnTo)}`;
}

/** Returns the session JWT or redirects to sign-in. */
export async function requireSessionToken(returnTo: string): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect(loginRedirectPath(returnTo));
  return token;
}

/**
 * Runs an authenticated server fetch; an expired or revoked session sends the
 * buyer back to sign-in instead of rendering an error or demo data.
 */
export async function withBuyerSession<T>(
  returnTo: string,
  load: (token: string) => Promise<T>
): Promise<T> {
  const token = await requireSessionToken(returnTo);
  try {
    return await load(token);
  } catch (err) {
    if (err instanceof BuyerAuthRequiredError) redirect(loginRedirectPath(returnTo));
    throw err;
  }
}
