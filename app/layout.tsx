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
    default: "OurMenu OS",
    template: "%s | OurMenu OS"
  },
  description: "The complete operating layer for modern businesses. Build your digital storefront, manage operations, and process payments instantly. Tailored for restaurants, boutiques, hotels, wellness spas, and creators.",
  keywords: ["digital storefront", "restaurant os", "qr menu", "hospitality software", "online ordering", "service booking", "hotel pms", "boutique ecommerce", "spa booking system", "media rate card", "real estate listings", "consulting portal", "food truck pos", "salon scheduling", "omnichannel os", "payment roulette", "digital rate card", "b2b rate cards", "ai demand forecasting", "bill splitting randomizer", "who pays the bill randomizer", "restaurant bill roulette", "split the check game"],
  authors: [{ name: "CruiseHQ" }],
  creator: "CruiseHQ",
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
    title: 'OurMenu OS - The ultimate digital storefront & operations suite',
    description: 'A complete management suite for restaurants, boutiques, hotels, wellness spas, consultants, and real estate. Ditch expensive custom websites and terrible PDF links.',
    siteName: 'OurMenu OS',
    images: [
      {
        url: '/hero_restaurant_bg.png',
        width: 1200,
        height: 630,
        alt: 'OurMenu OS Dashboard and Guest Experience',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OurMenu OS',
    description: 'The ultimate digital storefront & operations suite for hospitality, retail, and services.',
    images: ['/hero_restaurant_bg.png'],
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
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        <PostHogProvider>
          <NextIntlClientProvider messages={messages}>
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
