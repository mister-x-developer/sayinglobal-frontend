import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, type Locale } from './lib/i18n';

const LOCALE_COOKIE = 'sayin-locale';
const AUTH_COOKIE = 'sayin-auth';

// Routes accessible without authentication — ONLY landing, auth, and legal pages.
// Per user request: Loginsiz hech narsa ko'rinmasin! (marketplace, listings, etc. require login)
const PUBLIC_PREFIXES = [
  '/auth',
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
  // Per strict requirement: Loginsiz hech narsa ko'rinmasin!
  // Only landing page, auth flows, and legal pages are public.
  if (pathname === '/') return true;
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin/login')) return true;
  if (pathname === '/terms' || pathname === '/privacy') return true;
  return false;
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const res = NextResponse.next();
  // Always sync the locale cookie so changes from LanguageSwitcher propagate
  // to server components on the very next request.
  const resolvedLocale = pickLocale(req);
  res.cookies.set(LOCALE_COOKIE, resolvedLocale, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });

  // If the user is already authenticated, redirect away from auth.
  // Normal users are also redirected from the landing page to /dashboard.
  // Admins are allowed to stay on the landing page if they want.
  if ((pathname.startsWith('/auth') || pathname.startsWith('/admin/login') || (pathname === '/' && !isPlatformAdmin(req))) && isAuthenticated(req)) {
    const nextUrl = req.nextUrl.clone();
    const target = isPlatformAdmin(req)
      ? '/admin'
      : (req.nextUrl.searchParams.get('next') || '/dashboard');
    nextUrl.pathname = target.startsWith('/') ? target.split('?')[0] : '/dashboard';
    nextUrl.search = '';
    const redirectRes = NextResponse.redirect(nextUrl);
    redirectRes.cookies.set(LOCALE_COOKIE, resolvedLocale, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
    return redirectRes;
  }

  // Auth guard — redirect unauthenticated users to /auth. Loginsiz hech narsa ko'rinmasin!
  if (!isPublicPath(pathname) && !isAuthenticated(req)) {
    const loginUrl = req.nextUrl.clone();
    // If they were trying to reach an admin page, redirect to admin login
    loginUrl.pathname = pathname.startsWith('/admin') ? '/admin/login' : '/auth';
    // Preserve intended destination so we can redirect back after login
    loginUrl.searchParams.set('next', pathname);
    const loginRes = NextResponse.redirect(loginUrl);
    loginRes.cookies.set(LOCALE_COOKIE, resolvedLocale, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
    return loginRes;
  }

  // Admin route guard — non-admin authenticated users cannot access /admin/*
  if (isAdminPath(pathname) && isAuthenticated(req) && !isPlatformAdmin(req)) {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    dashboardUrl.search = '';
    const adminRes = NextResponse.redirect(dashboardUrl);
    adminRes.cookies.set(LOCALE_COOKIE, resolvedLocale, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
    return adminRes;
  }

  // Admin redirect — admins should not use user dashboard, profile, or user listings
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/listings/my') || pathname.startsWith('/chat') || pathname.startsWith('/profile')) && isPlatformAdmin(req)) {
    const adminUrl = req.nextUrl.clone();
    adminUrl.pathname = '/admin';
    adminUrl.search = '';
    const redirectRes = NextResponse.redirect(adminUrl);
    redirectRes.cookies.set(LOCALE_COOKIE, resolvedLocale, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
    return redirectRes;
  }


  return res;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|favicon|.*\\..*).*)'],
};
