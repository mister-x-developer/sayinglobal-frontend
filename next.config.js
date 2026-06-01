/** @type {import('next').NextConfig} */
// deploy trigger Thu May 28 2026 — fix: bot username fallback + admin login unblock
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./lib/i18n.ts');

const isDev = process.env.NODE_ENV === 'development';
// Production Railway backend URL — hardcoded as fallback so Vercel rewrites
// work even if NEXT_PUBLIC_API_URL is not set in the Vercel dashboard.
const PRODUCTION_API_ORIGIN = 'https://sayinglobal.up.railway.app';
const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || `${PRODUCTION_API_ORIGIN}/api`).replace(/\/api\/?$/, '');

const nextConfig = {
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,

  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.idrivee2.com' },
      { protocol: 'https', hostname: '**.idrivee2-21.com' },
      { protocol: 'https', hostname: '**.sayinglobal.com' },
      { protocol: 'https', hostname: 'sayinglobal.up.railway.app' },
      { protocol: 'https', hostname: 'sayinglobal-backend-production.up.railway.app' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimize dangerously allowing all SVGs — only from our own origin
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Webpack: suppress benign "Critical dependency" warnings emitted by
  // @sentry/node + @opentelemetry/require-in-the-middle during server bundling.
  // These are not errors and never break the build, but we filter them so the
  // Vercel/CI logs stay clean.
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals = config.externals || [];
    }
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /@opentelemetry\/instrumentation/ },
      { module: /require-in-the-middle/ },
      { module: /@prisma\/instrumentation/ },
      { module: /@sentry\/node/ },
      /Critical dependency: the request of a dependency is an expression/,
      /Critical dependency: require function is used in a way/,
    ];
    return config;
  },

  async rewrites() {
    return [
      {
        // Proxy /api/* → Railway backend.
        // NOTE: destination does NOT add a trailing slash — the client-side
        // axios interceptor already ensures every request URL ends with '/'.
        // Adding another '/' here would create double-slash URLs (/api/listings//)
        // which Django rejects with 404.
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },

  // Production security headers
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options',  value: 'nosniff' },
      { key: 'X-Frame-Options',          value: 'DENY' },
      { key: 'X-XSS-Protection',         value: '1; mode=block' },
      { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(self), microphone=(), geolocation=(self), payment=()',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
    ];

    // Content-Security-Policy — tighten in production
    if (!isDev) {
      securityHeaders.push({
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          // Scripts — self + Next.js inline scripts + Leaflet CDN (unpkg)
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
          // Styles — self + Leaflet CDN CSS (unpkg)
          "style-src 'self' 'unsafe-inline' https://unpkg.com",
          // Images — self + our S3/Railway backend + OSM tiles + Leaflet CDN images + Nominatim
          "img-src 'self' data: blob: https://*.amazonaws.com https://*.idrivee2.com https://*.idrivee2-21.com https://sayinglobal.up.railway.app https://sayinglobal-backend-production.up.railway.app https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://unpkg.com",
          // Fonts
          "font-src 'self' data:",
          // API/WS connections — production backend + Nominatim reverse geocoding + OSM tile fetchers
          "connect-src 'self' https://sayinglobal.up.railway.app wss://sayinglobal.up.railway.app https://sayinglobal-backend-production.up.railway.app wss://sayinglobal-backend-production.up.railway.app https://sentry.io https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org https://tile.openstreetmap.org",
          // No frames
          "frame-ancestors 'none'",
          // Workers for Next.js
          "worker-src 'self' blob:",
        ].join('; '),
      });
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

// IMPORTANT: We intentionally do NOT wrap the config with `withSentryConfig`.
// The Sentry build plugin runs `sentry-cli releases new ...` during
// `next build`, which crashes the whole Vercel build with "Project not found"
// when the org/project slug or auth token is missing. We removed it so the
// build NEVER touches the Sentry CLI and can never fail because of it.
//
// Runtime error reporting is unaffected — it is configured separately at
// runtime via NEXT_PUBLIC_SENTRY_DSN in `sentry.client.config.ts` and
// `instrumentation.ts`. Source-map upload (build-time) is simply skipped;
// errors are still captured, just with minified stack traces.
module.exports = withNextIntl(nextConfig);

