import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"
import { GoogleAnalytics } from "@next/third-parties/google"
import { StructuredData } from "../components/structured-data"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })
const landingUrl = "https://voice.tovo.dev"

const descLong =
  "Meet Tovo - a local AI assistant perfect for meetings, interviews, and all kinds of sessions. Listens quietly and helps in real time. No type and send, just real-time voice interaction."

export const metadata: Metadata = {
  title: "Tovo - AI Sidekick for Interviews & Meetings",
  description:
    "Meet Tovo - A privacy-first, local voice AI that listens quietly and helps in real time during interviews, meetings, and sessions.",
  keywords: [
    "AI assistant",
    "interview helper",
    "meeting assistant",
    "privacy-first AI",
    "local AI",
    "voice transcription",
    "real-time AI",
    "tovo",
    "offline AI",
    "WebGPU",
    "browser AI",
  ],
  authors: [{ name: "Tovo Team" }],
  creator: "Tovo",
  publisher: "Tovo",
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
    title: "Tovo - AI Sidekick for Interviews & Meetings",
    description: descLong,
    type: "website",
    url: landingUrl,
    siteName: "Tovo",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tovo - AI Sidekick for Interviews & Meetings",
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
