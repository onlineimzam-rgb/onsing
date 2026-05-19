const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // `standalone` produces .next/standalone which is a self-contained Node
  // server with the minimal node_modules needed at runtime. This is what the
  // Docker image consumes; it lets us ship a ~150 MB final image instead of
  // 800+ MB and keeps cold-starts under ~1s on Azure Container Apps / Fly.
  output: 'standalone',

  // The backend imports from `../shared/*` (monorepo siblings). Without an
  // explicit tracing root, Next.js infers it from the closest lockfile and
  // omits anything above. Pointing the root one level up lets the trace see
  // `../shared/contracts/*` so those files land in `.next/standalone/shared/`
  // alongside the backend bundle.
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
    serverComponentsExternalPackages: ['argon2', '@react-pdf/renderer', 'applicationinsights'],
    instrumentationHook: true,
    outputFileTracingRoot: path.join(__dirname, '..'),
  },

  poweredByHeader: false,
  compress: true,

  // applicationinsights pulls `continuation-local-storage` → `async-listener`
  // which static-requires `net`, `http`, `child_process`. Those only exist at
  // runtime, never at bundle time. Marking the package as a CommonJS external
  // tells webpack to leave the `require('applicationinsights')` call alone and
  // resolve it at process start instead — exactly what we want for telemetry.
  webpack: (config, { isServer, nextRuntime }) => {
    if (isServer && nextRuntime === 'nodejs') {
      config.externals = [
        ...(config.externals || []),
        'applicationinsights',
      ]
    }
    return config
  },

  // For multi-domain DNS later (app.onsig.com.tr, admin.onsig.com.tr, ...)
  // we keep the canonical origin in an env var and trust it on the server.
  env: {
    NEXT_PUBLIC_APP_NAME: 'OnSig',
  },

  // Per-request headers (CSP nonce, request-id) come from middleware.ts.
  // Here we only set the headers that are identical for every response.
  async headers() {
    const isProd = process.env.NODE_ENV === 'production'
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          ...(isProd
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains; preload',
                },
              ]
            : []),
        ],
      },
      // Long-cache static assets — Next.js produces hashed filenames so this
      // is safe even when content changes.
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
