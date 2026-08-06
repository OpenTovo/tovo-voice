"use client"

import { Provider as JotaiProvider } from "jotai"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type * as React from "react"
import { ModelLoaderProvider } from "./model-loader"
import { PWAInstallProvider } from "./pwa-install"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
      >
        <PWAInstallProvider>
          <ModelLoaderProvider>{children}</ModelLoaderProvider>
        </PWAInstallProvider>
      </NextThemesProvider>
    </JotaiProvider>
  )
}
