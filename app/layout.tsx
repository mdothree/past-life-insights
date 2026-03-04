import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Past Life Insights',
  description: 'Birth data generates past life narrative',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
