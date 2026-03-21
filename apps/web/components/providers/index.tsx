"use client"

import { Provider as JotaiProvider } from "jotai"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type * as React from "react"
import { AuthProvider } from "./auth"
import { ModelLoaderProvider } from "./model-loader"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
      >
        <AuthProvider>
          <ModelLoaderProvider>{children}</ModelLoaderProvider>
        </AuthProvider>
      </NextThemesProvider>
    </JotaiProvider>
  )
}
