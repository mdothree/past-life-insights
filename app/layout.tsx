import type { Metadata, Viewport } from 'next'
import { SITE_URL, SITE_NAME, JSON_LD, pageMetadata } from './lib/seo'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  keywords: ["past life", "past life reading", "past lives", "reincarnation", "karmic patterns", "soul journey", "spiritual reading"],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
  ...pageMetadata({
    title: "Past Life Reading — Past Life Insights",
    description: "Share your birth details, passions and recurring life patterns for a reflective past life reading exploring possible past lives, karmic themes and lessons.",
    path: '/',
  }),
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: "#a855f7",
}

const SKIP_LINK_CSS =
  '.skip-link{position:absolute;left:-9999px;top:8px;z-index:10000;padding:8px 16px;background:#111111;color:#ffffff;font-weight:600;text-decoration:none;border-radius:4px}.skip-link:focus{left:8px;top:8px}'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <style dangerouslySetInnerHTML={{ __html: SKIP_LINK_CSS }} />
        <script src="/js/consent.js" defer />
      </head>
      <body style={{ margin: 0, background: '#0f0f1a', color: '#f1f5f9' }}>
        <a className="skip-link" href="#main-content">Skip to content</a>
        {children}
      </body>
    </html>
  )
}
