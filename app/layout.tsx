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
  title: {
    default: "OurMenu OS | Storefronts & Operations for Hospitality, Retail & Services",
    template: "%s | OurMenu OS"
  },
  description: "The complete operating layer for modern businesses. Build your digital storefront, manage operations, and process payments instantly. Tailored for hospitality (restaurants, bars, food trucks), retail boutiques (gadgets, fashion, pharmacies), services (salons, spas, tutors), consultants, agencies, real estate, and automotive dealerships.",
  keywords: ["ourmenuos", "our menu os", "digital storefront", "restaurant os", "qr menu", "hospitality software", "online ordering", "service booking", "hotel pms", "boutique ecommerce", "spa booking system", "media rate card", "real estate listings", "consulting portal", "food truck pos", "salon scheduling", "omnichannel os", "payment roulette", "digital rate card", "b2b rate cards", "ai demand forecasting", "bill splitting randomizer", "who pays the bill randomizer", "restaurant bill roulette", "split the check game"],
  authors: [{ name: "KRYPTOPACY" }],
  creator: "KRYPTOPACY",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OurMenu OS",
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
    title: 'OurMenu OS | Storefronts & Operations for Hospitality, Retail & Services',
    description: 'A complete management suite for hospitality, retail boutiques, wellness spas, consultants, real estate, and automotive. Ditch expensive custom websites and terrible PDF links.',
    siteName: 'OurMenu OS',
    images: [
      {
        url: '/hero_emerald_gemstone.png',
        width: 1200,
        height: 630,
        alt: 'OurMenu OS Dashboard and Guest Experience',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OurMenu OS | Storefronts & Operations for Hospitality, Retail & Services',
    description: 'The ultimate digital storefront & operations suite for hospitality, retail boutiques, spas, consultants, real estate, and automotive.',
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
                  name: 'OurMenu OS',
                  url: 'https://ourmenuos.online',
                  logo: 'https://ourmenuos.online/ourmenu-qr-logo.png',
                  description: 'The complete operating layer for modern hospitality, retail, and service businesses.'
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': 'https://ourmenuos.online/#software',
                  name: 'OurMenu OS',
                  applicationCategory: 'BusinessApplication',
                  operatingSystem: 'Web, iOS, Android, PWA',
                  description: 'Multi-business operating system featuring smart QR portals, AI copilot, POS, inventory management, and multi-gateway billing.',
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
                  name: 'OurMenu OS',
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
            {children}
            <PwaInstallPrompt />
            <Toaster theme="dark" position="bottom-center" richColors />
          </NextIntlClientProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
