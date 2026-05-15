const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Subdomain routing for Called to Carry.
  // calledtocarry.awakeningdestiny.global/<path> → pages/called-to-carry/<path>
  // Two rules handle nested + top-level paths. Exclusions keep /api, /_next,
  // and shared portal routes (blueprint, self-paced, login, etc.) on the main app.
  async rewrites() {
    return {
      beforeFiles: [
        // Nested paths: /a/b/c → /called-to-carry/a/b/c
        {
          has: [{ type: 'host', value: 'calledtocarry.awakeningdestiny.global' }],
          source: '/:path((?!api|_next|_vercel|favicon\\.ico|self-paced|blueprint|login|dashboard|modules|auth|success|admin)[^/]+)/:rest*',
          destination: '/called-to-carry/:path/:rest*',
        },
        // Top-level paths: /a → /called-to-carry/a
        {
          has: [{ type: 'host', value: 'calledtocarry.awakeningdestiny.global' }],
          source: '/:path((?!api|_next|_vercel|favicon\\.ico|self-paced|blueprint|login|dashboard|modules|auth|success|admin)[^/]+)',
          destination: '/called-to-carry/:path',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
};

module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;