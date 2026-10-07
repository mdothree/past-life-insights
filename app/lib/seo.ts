import type { Metadata } from 'next'

export const SITE_URL = "https://pastlife.mdo3d.com"
export const SITE_NAME = "Past Life Insights"
const OG_IMAGE = {
  url: `${SITE_URL}/og-image.png`,
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: "Past Life Insights — Explore the echoes of your soul's journey. Part of MDO3D Guidance.",
}

// Shared SEO defaults; pages override title/description/canonical via their own metadata.
export function pageMetadata(opts: { title: string; description: string; path: string; noindex?: boolean }): Metadata {
  const url = `${SITE_URL}${opts.path}`
  return {
    title: { absolute: opts.title },
    description: opts.description,
    alternates: { canonical: url },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: 'website',
      siteName: "Past Life Insights · MDO3D Guidance",
      title: opts.title,
      description: opts.description,
      url,
      images: [OG_IMAGE],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images: [{ url: OG_IMAGE.url, alt: OG_IMAGE.alt }],
    },
  }
}

export const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://pastlife.mdo3d.com/#website",
      "url": "https://pastlife.mdo3d.com/",
      "name": "Past Life Insights",
      "description": "Share your birth details, passions and recurring life patterns for a reflective past life reading exploring possible past lives, karmic themes and lessons.",
      "inLanguage": "en",
      "publisher": {
        "@type": "Organization",
        "name": "MDO3D"
      }
    },
    {
      "@type": "WebApplication",
      "@id": "https://pastlife.mdo3d.com/#app",
      "name": "Past Life Insights",
      "url": "https://pastlife.mdo3d.com/",
      "description": "Share your birth details, passions and recurring life patterns for a reflective past life reading exploring possible past lives, karmic themes and lessons.",
      "applicationCategory": "LifestyleApplication",
      "operatingSystem": "Any (web browser)",
      "image": "https://pastlife.mdo3d.com/og-image.png",
      "isPartOf": {
        "@id": "https://pastlife.mdo3d.com/#website"
      }
    }
  ]
}
