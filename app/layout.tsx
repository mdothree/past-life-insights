import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Past Life Insights',
  description: 'Discover echoes of your soul journey. Explore past life connections and understand karmic patterns affecting your present.',
  openGraph: {
    title: 'Past Life Insights',
    description: 'Discover the echoes of your soul journey',
    url: 'https://pastlife.mdo3d.com',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔮</text></svg>" />
      </head>
      <body style={{ margin: 0, background: '#0f0f1a', color: '#f1f5f9' }}>{children}</body>
    </html>
  )
}
