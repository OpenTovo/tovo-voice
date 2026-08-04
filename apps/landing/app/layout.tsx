import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"
import { GoogleAnalytics } from "@next/third-parties/google"
import { StructuredData } from "../components/structured-data"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })
const landingUrl = "https://voice.tovo.dev"

const descLong =
  "Tovo Voice transcribes speech in real time and turns it into useful AI insights, all locally in your browser."

export const metadata: Metadata = {
  title: "Tovo Voice — Private, On-Device Voice AI",
  description:
    "Private, on-device transcription and local AI analysis in your browser.",
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
    title: "Tovo Voice — Private, On-Device Voice AI",
    description: descLong,
    type: "website",
    url: landingUrl,
    siteName: "Tovo Voice",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tovo Voice — Private, On-Device Voice AI",
    description: descLong,
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
      <body className={outfit.className}>
        {children}

        <GoogleAnalytics gaId="G-Z3V8CNTNBG" />
      </body>
    </html>
  )
}
