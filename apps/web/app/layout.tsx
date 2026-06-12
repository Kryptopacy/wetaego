import type { Metadata } from "next";
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
  title: "OurMenu OS",
  description: "Digital Menus & Operations for Hospitality",
  manifest: "/manifest.json",
  themeColor: "#0a0a0f",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OurMenu OS",
  },
  icons: {
    apple: "/icon-192x192.png",
  },
};

import { PostHogProvider } from './providers'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        <PostHogProvider>
          {children}
          <Toaster theme="dark" position="bottom-center" richColors />
        </PostHogProvider>
      </body>
    </html>
  );
}
