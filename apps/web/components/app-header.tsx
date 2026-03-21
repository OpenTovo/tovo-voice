"use client"

import { usePathname } from "next/navigation"
import React from "react"
import { PWARefreshButton } from "./pwa-refresh-button"
import { ResponsiveNavigation } from "./responsive-navigation"

export function AppHeader() {
  const pathname = usePathname()

  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname.startsWith("/history")) return "History"
    if (pathname.startsWith("/settings")) return "Settings"
    if (pathname.startsWith("/new")) return "Session"
    return "Tovo"
  }

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex items-center justify-between border-b p-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-3">
        <ResponsiveNavigation mobileOnly />
        <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center gap-2">
        <PWARefreshButton />
      </div>
    </header>
  )
}
