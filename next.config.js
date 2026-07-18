/** @type {import('next').NextConfig} */
// deploy trigger Thu May 28 2026 — fix: bot username fallback + admin login unblock
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./lib/i18n.ts');

const isDev = process.env.NODE_ENV === 'development';
// Production Railway backend URL — hardcoded as fallback so Vercel rewrites
// work even if NEXT_PUBLIC_API_URL is not set in the Vercel dashboard.
const PRODUCTION_API_ORIGIN = 'https://sayinglobal.up.railway.app';

// In development, we use the NEXT_PUBLIC_API_URL (which defaults to localhost).
// In production (Vercel build), we use the hardcoded Railway origin to prevent build errors.
const apiOrigin = isDev 
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/api\/?$/, '')
  : PRODUCTION_API_ORIGIN;

const isCapacitor = process.env.CAPACITOR_BUILD === 'true';

const nextConfig = {
  ...(isCapacitor ? { output: 'export' } : {}),
  reactStrictMode: true,
  trailingSlash: true,

  eslint: {
    // ESLint runs in CI separately; don't let it block the build
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: isCapacitor,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sayinglobal.up.railway.app',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ]
  },

  optimizeFonts: false,
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

  ...(isCapacitor ? {} : {
    async redirects() {
      return [
        {
          source: '/notifications/:id(\\d+)',
          destination: '/notifications/detail?id=:id',
          permanent: false,
        },
      ];
    },
  }),
};

// IMPORTANT: We intentionally do NOT wrap the config with `withSentryConfigʻ.
// The Sentry build plugin runs `sentry-cli releases new ...` during
// `next build`, which crashes the whole Vercel build with "Project not found"
// when the org/project slug or auth token is missing. We removed it so the
// build NEVER touches the Sentry CLI and can never fail because of it.
//
// Runtime error reporting is unaffected — it is configured separately at
// runtime via NEXT_PUBLIC_SENTRY_DSN in `sentry.client.config.ts` and
// `instrumentation.ts`. Source-map upload (build-time) is simply skipped;
// errors are still captured, just with minified stack traces.
module.exports = nextConfig;

