/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');
const { withSentryConfig } = require('@sentry/nextjs');
const withNextIntl = createNextIntlPlugin('./lib/i18n.ts');

const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  reactStrictMode: true,

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

  // Webpack: suppress benign "Critical dependency" warning from Sentry
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals = config.externals || [];
    }
    return config;
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
          // Scripts — self + Next.js inline scripts (nonce not used here; use __next_ prefix)
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          // Styles
          "style-src 'self' 'unsafe-inline'",
          // Images — self + our S3/Railway backend
          "img-src 'self' data: blob: https://*.amazonaws.com https://*.idrivee2.com https://*.idrivee2-21.com https://sayinglobal-backend-production.up.railway.app",
          // Fonts
          "font-src 'self' data:",
          // API/WS connections
          "connect-src 'self' https://sayinglobal-backend-production.up.railway.app wss://sayinglobal-backend-production.up.railway.app https://sentry.io https://o4504523.ingest.sentry.io",
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

module.exports = withSentryConfig(
  withNextIntl(nextConfig),
  {
    // Sentry build-time options
    org: 'o4511396260478976',
    project: 'sayinglobal-frontend',
    silent: true,               // suppress Sentry CLI output during build
    widenClientFileUpload: true, // upload more source maps for better stack traces
    hideSourceMaps: true,       // hide source maps from browser
    disableLogger: true,        // remove Sentry debug logs from bundle
    automaticVercelMonitors: false,
  }
);
