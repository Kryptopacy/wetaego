import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withPWAInit from "@ducanh2912/next-pwa";
import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
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
      }
    ]
  }
});

const nextConfig: NextConfig = {
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
    ],
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
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.paystack.co https://checkout.paystack.com https://vercel.live https://us-assets.i.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com https://picsum.photos https://api.dicebear.com *.supabase.co; font-src 'self' data:; connect-src 'self' *.supabase.co wss://*.supabase.co https://api.paystack.co https://us.i.posthog.com https://us-assets.i.posthog.com wss://ws-us2.pusher.com https://sockjs-us2.pusher.com wss://*.vercel.live https://*.vercel.live; frame-src 'self' https://checkout.paystack.com https://vercel.live;"
          },
        ],
      },
    ]
  },
};

export default withSentryConfig(withBundleAnalyzer(withPWA(withNextIntl(nextConfig))), {
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  sourcemaps: { disable: true },
});
