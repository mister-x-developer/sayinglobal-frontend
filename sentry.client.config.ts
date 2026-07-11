/**
 * Sentry client-side configuration for Next.js.
 * This file initializes Sentry in the browser.
 * No PII: user phone numbers are never sent.
 */
import * as Sentry from '@sentry/nextjs';

const isMobile = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();
const SENTRY_DSN = isMobile 
  ? (process.env.NEXT_PUBLIC_SENTRY_DSN_MOBILE || process.env.NEXT_PUBLIC_SENTRY_DSN)
  : process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN && process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'production',
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

    // Performance tracing — 10% of sessions
    tracesSampleRate: 0.1,

    // Session replays — 5% of sessions, 100% of errors
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,

    // Do not send PII (no tokens, no user data beyond user ID)
    sendDefaultPii: false,

    // Filter out noise
    ignoreErrors: [
      // Browser extension errors
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Network errors that are user-side
      'Failed to fetch',
      'Network Error',
      'NetworkError',
      'Load failed',
    ],

    beforeSend(event) {
      // Strip any accidentally included auth tokens from request headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['authorization'];
      }
      return event;
    },
  });
}
