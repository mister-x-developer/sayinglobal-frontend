import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, type Locale } from './lib/i18n';

const LOCALE_COOKIE = 'sayin-locale';
const AUTH_COOKIE = 'sayin-auth';

// Routes accessible without authentication — marketplace browsing is public
const PUBLIC_PREFIXES = [
  '/auth',
  '/listings',
  '/sellers',
  '/search',
  '/listings/nearby',
];

function pickLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get(LOCALE_COOKIE)?.value as Locale | undefined;
  if (cookie && (locales as readonly string[]).includes(cookie)) return cookie;

  const accept = req.headers.get('accept-language') ?? '';
  const first = accept.split(',')[0]?.toLowerCase().slice(0, 5);
  if (first?.startsWith('ru')) return 'ru';
  if (first?.startsWith('en')) return 'en';
  if (first?.startsWith('uz')) return 'uz';

  return defaultLocale;
}

function isAuthenticated(req: NextRequest): boolean {
  // Check persisted Zustand auth store in cookie
  const raw = req.cookies.get(AUTH_COOKIE)?.value;
  if (!raw) return false;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    const state = parsed?.state ?? parsed;
    return !!(state?.isAuthenticated && state?.accessToken);
  } catch {
    return false;
  }
}

function isPlatformAdmin(req: NextRequest): boolean {
  const raw = req.cookies.get(AUTH_COOKIE)?.value;
  if (!raw) return false;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    const state = parsed?.state ?? parsed;
    return !!(state?.isAuthenticated && (state?.user?.is_admin || state?.user?.is_staff));
  } catch {
    return false;
  }
}

function isPublicPath(pathname: string): boolean {
  // Landing page
  if (pathname === '/') return true;
  // Auth pages
  if (pathname.startsWith('/auth')) return true;
  // Public marketplace pages — browsing without login
  // Note: /listings/new and /listings/:id/edit require auth
  if (pathname === '/listings') return true;
  if (pathname === '/listings/nearby') return true;
  if (pathname === '/search') return true;
  if (pathname === '/plans') return true;
  if (pathname.startsWith('/sellers')) return true;
  // Individual listing detail pages are public
  if (/^\/listings\/\d+$/.test(pathname)) return true;
  // Legal pages are public
  if (pathname === '/terms' || pathname === '/privacy') return true;
  return false;
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Set locale cookie if missing
  const res = NextResponse.next();
  const existingLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  if (!existingLocale || !(locales as readonly string[]).includes(existingLocale)) {
    res.cookies.set(LOCALE_COOKIE, pickLocale(req), {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  // If the user is already authenticated, do not show the auth screen.
  // Send admins to /admin, marketplace users to ?next or /dashboard.
  if (pathname === '/auth' && isAuthenticated(req)) {
    const nextUrl = req.nextUrl.clone();
    const target = isPlatformAdmin(req)
      ? '/admin'
      : (req.nextUrl.searchParams.get('next') || '/dashboard');
    nextUrl.pathname = target.startsWith('/') ? target.split('?')[0] : '/dashboard';
    nextUrl.search = '';
    return NextResponse.redirect(nextUrl);
  }

  // Auth guard — redirect unauthenticated users to /auth
  if (!isPublicPath(pathname) && !isAuthenticated(req)) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/auth';
    // Preserve intended destination so we can redirect back after login
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route guard — non-admin authenticated users cannot access /admin/*
  if (isAdminPath(pathname) && isAuthenticated(req) && !isPlatformAdmin(req)) {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    dashboardUrl.search = '';
    return NextResponse.redirect(dashboardUrl);
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|favicon|.*\\..*).*)'],
};
