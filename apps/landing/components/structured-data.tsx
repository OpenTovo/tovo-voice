export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Tovo Voice",
    applicationCategory: "ProductivityApplication",
    operatingSystem: ["Web Browser", "Android", "Windows", "macOS", "Linux"],
    description:
      "Private, on-device voice transcription and local AI analysis in your browser.",
    url: "https://voice.tovo.dev",
    downloadUrl: "https://pwa.tovo.dev",
    author: {
      "@type": "Organization",
      name: "Tovo Voice",
      url: "https://voice.tovo.dev",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "52",
    },
    features: [
      "Privacy-first AI processing",
      "Real-time voice transcription",
      "Local AI analysis",
      "Offline functionality",
    ],
  }

  // Sanitize to prevent XSS (Next.js recommendation)
  const sanitizedJsonLd = JSON.stringify(structuredData).replace(
    /</g,
    "\\u003c"
  )

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: sanitizedJsonLd }}
    />
  )
}
