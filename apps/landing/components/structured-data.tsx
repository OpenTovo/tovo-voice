export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Tovo",
    applicationCategory: "ProductivityApplication",
    operatingSystem: ["Web Browser", "Android", "Windows", "macOS", "Linux"],
    description:
      "Privacy-first AI assistant for meetings, interviews, and real-time voice interaction. Works entirely on your device with no data sent to servers.",
    url: "https://voice.tovo.dev",
    downloadUrl: "https://pwa.tovo.dev",
    author: {
      "@type": "Organization",
      name: "Tovo",
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
      "Meeting assistance",
      "Interview support",
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
