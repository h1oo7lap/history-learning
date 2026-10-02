import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route protection based on cookie presence.
 * This is a UX-only redirect — the actual auth is enforced server-side (API) and
 * client-side (AuthGate component).
 */

const AUTH_COOKIE = 'access_token';

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/onboarding',
  '/learning',
  '/quiz',
  '/missions',
  '/collection',
  '/progress',
  '/ai',
  '/profile',
  '/admin',
  '/search',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has(AUTH_COOKIE);

  // NOTE: We intentionally do NOT redirect authenticated users away from /login,
  // /register, etc. A stale or expired cookie would cause a redirect to /dashboard
  // which then fails auth, producing a white screen. Instead, let the login page
  // render and allow the user to enter credentials. Client-side (useLogin / useMe)
  // will redirect to /dashboard after a successful fresh login.

  // Redirect unauthenticated users away from protected routes
  const isProtected = PROTECTED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(prefix + '/'),
  );

  if (!isAuthenticated && isProtected) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - /api/* (handled by NestJS)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/).*)',
  ],
};
