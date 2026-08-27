import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-sans-next",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ourmenuos.online'),
  alternates: {
    canonical: 'https://ourmenuos.online',
  },
  title: {
    default: "WETAEGO | The Commerce & Service Operating System for Modern Brands",
    template: "%s | WETAEGO"
  },
  description: "The Commerce & Service Operating System for Modern Brands, their Human Customers, and the AI Agents who serve them. Dual-layer actionable AI, instant WebMCP agent commerce, driverless POS printing, customer IOU financing, and 9 industry templates.",
  keywords: ["wetaego", "ourmenuos", "digital storefront", "commerce operating system", "webmcp", "ai agents", "qr menu", "hospitality software", "online ordering", "service booking", "hotel pms", "boutique ecommerce", "spa booking system", "media rate card", "real estate listings", "consulting portal", "food truck pos", "salon scheduling", "omnichannel os", "payment roulette", "digital rate card", "b2b rate cards", "ai demand forecasting", "bill splitting randomizer", "who pays the bill randomizer", "restaurant bill roulette", "split the check game"],
  authors: [{ name: "KRYPTOPACY" }],
  creator: "KRYPTOPACY",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WETAEGO",
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ourmenuos.online',
    title: 'WETAEGO | The Commerce & Service Operating System for Modern Brands',
    description: 'The Commerce & Service Operating System for Modern Brands, their Human Customers, and the AI Agents who serve them. Dual-layer actionable AI, instant WebMCP agent commerce, and driverless hardware operations.',
    siteName: 'WETAEGO',
    images: [
      {
        url: '/hero_emerald_gemstone.png',
        width: 1200,
        height: 630,
        alt: 'WETAEGO Dashboard and Guest Experience',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WETAEGO | The Commerce & Service Operating System for Modern Brands',
    description: 'The Commerce & Service Operating System for Modern Brands, their Human Customers, and the AI Agents who serve them.',
    images: ['/hero_emerald_gemstone.png'],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
};

import { PostHogProvider } from './providers'
import { PwaInstallPrompt } from './components/pwa-install-prompt'
import { OfflineBanner } from '@/components/offline-banner'

import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

import { AuthErrorToast } from '@/components/AuthErrorToast'

import { WebMcpProvider } from '@/components/WebMcpProvider'
import { CookieConsentBanner } from '@/components/cookie-banner'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://ourmenuos.online/#organization',
                  name: 'WETAEGO',
                  legalName: 'WETAEGO by CRUISEHQ LTD',
                  url: 'https://ourmenuos.online',
                  logo: 'https://ourmenuos.online/ourmenu-qr-logo.png',
                  description: 'The complete operating layer for modern hospitality, supermarkets, retail, and service businesses.',
                  email: 'support@ourmenuos.online',
                  telephone: '+234-800-687-6368',
                  contactPoint: [
                    {
                      '@type': 'ContactPoint',
                      telephone: '+234-800-687-6368',
                      contactType: 'customer support',
                      email: 'support@ourmenuos.online',
                      availableLanguage: ['English', 'Spanish', 'French', 'Yoruba', 'Igbo', 'Hausa'],
                      areaServed: 'Global'
                    },
                    {
                      '@type': 'ContactPoint',
                      contactType: 'sales',
                      email: 'partners@ourmenuos.online',
                      availableLanguage: ['English'],
                      areaServed: 'Global'
                    }
                  ],
                  address: {
                    '@type': 'PostalAddress',
                    streetAddress: 'Admiralty Way, Lekki Phase 1',
                    addressLocality: 'Lagos',
                    addressRegion: 'Lagos State',
                    postalCode: '105102',
                    addressCountry: 'NG'
                  },
                  sameAs: [
                    'https://twitter.com/ourmenuos',
                    'https://github.com/Kryptopacy/ourmenuos'
                  ]
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': 'https://ourmenuos.online/#software',
                  name: 'WETAEGO',
                  applicationCategory: 'BusinessApplication',
                  operatingSystem: 'Web, iOS, Android, PWA',
                  description: 'Autonomous hospitality & service operating system featuring smart QR portals, AI copilot, POS, inventory management, and multi-gateway billing.',
                  offers: {
                    '@type': 'AggregateOffer',
                    priceCurrency: 'NGN',
                    lowPrice: '0',
                    highPrice: '69000'
                  }
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://ourmenuos.online/#website',
                  url: 'https://ourmenuos.online',
                  name: 'WETAEGO',
                  description: 'Instant multi-template digital presence and operating system for physical businesses.',
                  publisher: {
                    '@id': 'https://ourmenuos.online/#organization'
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        <PostHogProvider>
          <NextIntlClientProvider messages={messages}>
            <AuthErrorToast />
            <OfflineBanner />
            <WebMcpProvider />
            {children}
            <PwaInstallPrompt />
            <CookieConsentBanner />
            <Toaster theme="dark" position="bottom-center" richColors />
          </NextIntlClientProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
