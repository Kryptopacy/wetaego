import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/api/',
        '/affiliate/dashboard/',
        '/pay/',
        '/d/',
        '/kiosk-scan/',
        '/invite/',
      ],
    },
    sitemap: 'https://ourmenuos.online/sitemap.xml',
  }
}
