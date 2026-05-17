/**
 * Next.js instrumentation hook — required for Sentry in Next.js 14+ App Router.
 * This replaces sentry.server.config.ts and sentry.edge.config.ts.
 */

export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn || process.env.NODE_ENV !== 'production') return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { init } = await import('@sentry/nextjs');
    init({
      dsn,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'production',
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      tracesSampleRate: 0.05,
      sendDefaultPii: false,
      beforeSend(event) {
        if (event.request?.headers) {
          delete (event.request.headers as Record<string, unknown>)['Authorization'];
          delete (event.request.headers as Record<string, unknown>)['authorization'];
          delete (event.request.headers as Record<string, unknown>)['Cookie'];
        }
        return event;
      },
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const { init } = await import('@sentry/nextjs');
    init({
      dsn,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'production',
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      tracesSampleRate: 0.05,
      sendDefaultPii: false,
    });
  }
}
