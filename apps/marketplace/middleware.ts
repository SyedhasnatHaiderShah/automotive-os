import { NextResponse, type NextRequest } from 'next/server';

/**
 * Buyer zone guard (QA-01). A missing `ao_session` cookie redirects to the
 * unified sign-in page. This is a presence check only: the API validates the
 * JWT, the session row and the account status on every request, and the
 * account pages redirect again if the API rejects the session.
 */
export function middleware(request: NextRequest) {
  if (request.cookies.get('ao_session')?.value) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const loginUrl = new URL('/auth', request.url);
  loginUrl.searchParams.set('tab', 'login');
  loginUrl.searchParams.set('redirect', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/account/:path*', '/dashboard'],
};
