import type { Metadata } from "next"
import { Geist, Outfit } from "next/font/google"
import "./globals.css"
import { GoogleAnalytics } from "@next/third-parties/google"
import { SiteNav } from "../components/site-nav"
import { StructuredData } from "../components/structured-data"
import { TryBanner } from "../components/try-banner"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-outfit",
})
const landingUrl = "https://voice.tovo.dev"
const landingTitle = "Tovo Voice | Private AI Sidekick with Local Transcription"

const landingDescription =
  "A private voice sidekick for live sessions. Transcribe conversations with local AI while your audio stays on your device."

export const metadata: Metadata = {
  title: landingTitle,
  description: landingDescription,
  keywords: [
    "AI assistant",
    "voice AI",
    "on-device transcription",
    "privacy-first AI",
    "local AI",
    "voice transcription",
    "real-time AI",
    "tovo",
    "offline AI",
    "WebGPU",
    "browser AI",
  ],
  authors: [{ name: "Tovo Voice Team" }],
  creator: "Tovo Voice",
  publisher: "Tovo Voice",
  category: "Productivity",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(landingUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: landingTitle,
    description: landingDescription,
    type: "website",
    url: landingUrl,
    siteName: "Tovo Voice",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Tovo Voice",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: landingTitle,
    description: landingDescription,
    images: ["/twitter-image"],
    creator: "@buildin_fun",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${outfit.variable} font-sans antialiased`}
      >
        <TryBanner />
        <SiteNav />
        {children}

        <GoogleAnalytics gaId="G-Z3V8CNTNBG" />
      </body>
    </html>
  )
}
