import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withPWAInit from "@ducanh2912/next-pwa";
import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

if (!process.env.SENTRY_AUTH_TOKEN) {
  process.env.SENTRY_DISABLE_AUTO_UPLOAD = "true";
}

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheStartUrl: false,
  dynamicStartUrl: false,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'supabase-images',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-images',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-responses',
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        urlPattern: /\/api\/(?:bookings|orders|feedback-entry|service-request).*/i,
        handler: 'NetworkOnly',
        options: {
          backgroundSync: {
            name: 'offline-mutations-queue',
            options: {
              maxRetentionTime: 24 * 60 // Retry for up to 24 hours
            }
          }
        }
      },
      {
        urlPattern: /^https:\/\/(?:.*\.)?vercel\.live\/.*/i,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /^https:\/\/(?:.*\.)?posthog\.com\/.*/i,
        handler: 'NetworkOnly',
      }
    ]
  }
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        // Supabase Storage — user-uploaded images
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/affiliate',
        destination: '/affiliates',
        permanent: true,
      },
      {
        source: '/roulette',
        destination: '/tools/who-pays-the-bill',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Vary',
            value: 'Accept, Accept-Encoding',
          },
          {
            key: 'Link',
            value: '</.well-known/api-catalog>; rel="api-catalog", </docs>; rel="service-doc", </openapi.json>; rel="service-desc"; type="application/openapi+json", </llms.txt>; rel="describedby", </.well-known/oauth-authorization-server>; rel="oauth-authorization-server", </.well-known/oauth-protected-resource>; rel="oauth-protected-resource", </.well-known/ai-catalog.json>; rel="ai-catalog", </.well-known/agent-skills/index.json>; rel="agent-skills", </.well-known/mcp.json>; rel="mcp", </.well-known/ucp>; rel="ucp", </.well-known/acp.json>; rel="acp", </auth.md>; rel="author-doc"',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.paystack.co https://checkout.paystack.com https://vercel.live https://us-assets.i.posthog.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com https://picsum.photos https://api.dicebear.com *.supabase.co https://api.qrserver.com; font-src 'self' data:; connect-src 'self' *.supabase.co wss://*.supabase.co https://api.paystack.co https://us.i.posthog.com https://us-assets.i.posthog.com wss://ws-us2.pusher.com https://sockjs-us2.pusher.com wss://*.vercel.live https://*.vercel.live; frame-src 'self' https://checkout.paystack.com https://vercel.live;"
          },
        ],
      },
      {
        source: '/(.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff|woff2))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
};

const finalConfig = withBundleAnalyzer(withPWA(withNextIntl(nextConfig)));

export default process.env.ENABLE_SENTRY_BUILD === "true"
  ? withSentryConfig(finalConfig, {
      org: process.env.SENTRY_ORG || "ourmenu",
      project: process.env.SENTRY_PROJECT || "ourmenu",
      silent: !process.env.CI,
      widenClientFileUpload: true,
      tunnelRoute: "/monitoring",
      sourcemaps: { disable: true },
      release: { create: false },
    })
  : finalConfig;
