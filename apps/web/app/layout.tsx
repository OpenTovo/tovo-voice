import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "@workspace/ui/globals.css"
import { GoogleAnalytics } from "@next/third-parties/google"
import { Toaster } from "@workspace/ui/components/sonner"
import { AppHeader } from "@/components/app-header"
import { ConfirmDialog } from "@/components/dialogs/confirm"
import { UpdateVersion } from "@/components/dialogs/update-version"
import { GlobalComponents } from "@/components/global-components"
import { Providers } from "@/components/providers/index"
import { ResponsiveNavigation } from "@/components/responsive-navigation"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Tovo",
  description:
    "Your personal real-time AI sidekick for meetings, interviews, and more",
  manifest: process.env.NEXT_PUBLIC_APP_URL
    ? new URL("/manifest.json", process.env.NEXT_PUBLIC_APP_URL)
    : "/manifest.json", // Relative URL - adapts to current protocol
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tovo",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* COI Service Worker - only load when needed for WASM */}
        <script src="/coi-serviceworker.js" defer />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
        />
      </head>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <Providers>
          <div className="bg-background flex h-svh">
            {/* Desktop Sidebar Navigation */}
            <ResponsiveNavigation />

            <div className="flex min-h-0 flex-1 flex-col">
              {/* Mobile Header */}
              <AppHeader />

              {/* Main content area */}
              <main className="flex-1 overflow-hidden">{children}</main>
            </div>
          </div>

          {/* Global dialogs */}
          <ConfirmDialog />
          <UpdateVersion />

          {/* PWA components */}
          <GlobalComponents />

          {/* Toast notifications */}
          <Toaster position="top-center" />
        </Providers>
      </body>
      <GoogleAnalytics gaId="G-Q1X6RYRNSD" />
    </html>
  )
}
