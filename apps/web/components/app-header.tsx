"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"
import React from "react"
import { PWARefreshButton } from "./pwa-refresh-button"
import { ResponsiveNavigation } from "./responsive-navigation"
import { ThemeToggle } from "./theme-toggle"

export function AppHeader() {
  const pathname = usePathname()

  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname.startsWith("/history")) return "History"
    if (pathname.startsWith("/settings")) return "Settings"
    if (pathname.startsWith("/new")) return "Session"
    return "Tovo Voice"
  }

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex items-center justify-between border-b p-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-3">
        <ResponsiveNavigation mobileOnly />
        <a
          href="https://voice.tovo.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3"
        >
          <Image
            src="/tovo-icon.png"
            alt="Tovo Voice logo"
            width={24}
            height={24}
            className="rounded-md"
          />
          <h1 className="text-lg font-semibold tracking-tight">
            {getPageTitle()}
          </h1>
        </a>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <PWARefreshButton />
      </div>
    </header>
  )
}
