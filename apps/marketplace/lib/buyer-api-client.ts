/**
 * Authenticated buyer API transport.
 *
 * Server components pass the `ao_session` cookie value (see lib/server-session.ts)
 * and the request goes straight to the API service with a Bearer token.
 * Client components omit it: the request stays same-origin through the
 * marketplace `/api/*` rewrite so the httpOnly `ao_session` cookie is sent.
 *
 * Failures are never converted into fixtures or fake success.
 */
export class BuyerAuthRequiredError extends Error {
  constructor(message = 'Buyer sign-in is required.') {
    super(message);
    this.name = 'BuyerAuthRequiredError';
  }
}

export class BuyerApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'BuyerApiError';
  }
}

function serverApiBase(): string {
  return (
    process.env.API_SERVICE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000'
  ).replace(/\/+$/, '');
}

export async function buyerApiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
  sessionToken?: string
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const isServer = typeof window === 'undefined';
  let url = path;

  if (isServer) {
    if (!sessionToken) throw new BuyerAuthRequiredError();
    headers.set('Authorization', `Bearer ${sessionToken}`);
    url = `${serverApiBase()}${path}`;
  }
  // Client calls never attach a script-readable token (SEC-19); the same-origin
  // `/api/*` rewrite forwards the httpOnly ao_session cookie.

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: isServer ? 'omit' : 'same-origin',
    cache: 'no-store',
    signal: init.signal ?? AbortSignal.timeout(8000),
  });

  if (response.status === 401) {
    throw new BuyerAuthRequiredError();
  }
  if (!response.ok) {
    let message = `Request failed with HTTP ${response.status}`;
    try {
      const body = await response.json();
      const apiMessage = body?.error?.message;
      if (apiMessage) message = Array.isArray(apiMessage) ? apiMessage.join(', ') : String(apiMessage);
    } catch {
      // Non-JSON error body.
    }
    throw new BuyerApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
