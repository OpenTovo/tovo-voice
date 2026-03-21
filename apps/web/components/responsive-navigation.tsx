"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"
import { cn } from "@workspace/ui/lib/utils"
import { useAtom } from "jotai"
import { ChevronLeft, History, Menu, Pause, Plus, Settings } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import React, { useState } from "react"
import { useAuth } from "@/components/providers/auth"
import { useSessionNavigationGuard } from "@/hooks/use-session-navigation-guard"
import { SessionStatus, sessionStatusAtom, type TabType } from "@/lib/atoms"
import { sideMenuExpandedAtom } from "@/lib/atoms/tabs"
import { PWARefreshButton } from "./pwa-refresh-button"

interface NavigationProps {
  className?: string
  mobileOnly?: boolean
}

export function ResponsiveNavigation({ mobileOnly = false }: NavigationProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sessionStatus] = useAtom(sessionStatusAtom)
  const [sideMenuExpanded, setSideMenuExpanded] = useAtom(sideMenuExpandedAtom)
  const { navigateWithGuard } = useSessionNavigationGuard()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Don't show navigation while loading
  if (loading) {
    return null
  }

  // Only show navigation if user is authenticated
  if (!user) {
    return null
  }

  // Determine current tab from pathname
  const getCurrentTab = (): TabType => {
    if (pathname.startsWith("/history")) return "history"
    if (pathname.startsWith("/settings")) return "settings"
    return "new"
  }

  const currentTab = getCurrentTab()

  const navigateToTab = (tab: TabType) => {
    const routes = {
      new: "/new",
      history: "/history",
      settings: "/settings",
    }

    // Don't navigate if already on the same tab
    if (currentTab === tab) {
      // Close mobile menu if open, but don't navigate
      setMobileMenuOpen(false)
      return
    }

    // Close mobile menu when navigating
    setMobileMenuOpen(false)

    // Always allow navigation to /new without guard
    if (tab === "new") {
      router.push(routes[tab])
    } else {
      // Use guard for other tabs
      navigateWithGuard(routes[tab])
    }
  }

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case "new":
        return sessionStatus === SessionStatus.Recording ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Plus className="h-5 w-5" />
        )
      case "history":
        return <History className="h-5 w-5" />
      case "settings":
        return <Settings className="h-5 w-5" />
    }
  }

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case "new":
        return sessionStatus === SessionStatus.Recording
          ? "Recording"
          : "New Session"
      case "history":
        return "History"
      case "settings":
        return "Settings"
    }
  }

  const tabs: TabType[] = ["new", "history", "settings"]

  const NavItems = ({
    onItemClick,
    collapsed = false,
  }: {
    onItemClick?: () => void
    collapsed?: boolean
  }) => (
    <>
      {tabs.map((tab) => (
        <Button
          key={tab}
          variant={currentTab === tab ? "secondary" : "ghost"}
          onClick={() => {
            navigateToTab(tab)
            onItemClick?.()
          }}
          className={cn(
            "flex w-full items-center",
            collapsed ? "justify-center p-3" : "justify-start gap-3",
            currentTab === tab && "bg-muted/50 text-foreground",
            sessionStatus === SessionStatus.Recording &&
              tab === "new" &&
              "animate-pulse bg-red-500 text-white hover:bg-red-600"
          )}
          title={collapsed ? getTabLabel(tab) : undefined}
        >
          {getTabIcon(tab)}
          {!collapsed && (
            <span className="font-medium">{getTabLabel(tab)}</span>
          )}
        </Button>
      ))}
    </>
  )

  // If mobileOnly is true, only show mobile navigation
  if (mobileOnly) {
    return (
      <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent aria-description="Navigation menu">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <DrawerTitle>Menu</DrawerTitle>
              <PWARefreshButton />
            </div>
          </DrawerHeader>
          <div className="flex flex-col space-y-2 p-6 pt-0">
            <NavItems onItemClick={() => setMobileMenuOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Default: show desktop sidebar only (mobile handled by AppHeader)
  return (
    <div
      className={cn(
        "md:bg-muted/10 hidden transition-all duration-300 md:flex md:flex-col md:border-r",
        !sideMenuExpanded ? "md:w-16" : "md:w-64"
      )}
    >
      <div className="flex items-center justify-between p-4">
        {sideMenuExpanded && <h2 className="text-lg font-semibold">Tovo</h2>}
        <div className="flex items-center gap-2">
          {sideMenuExpanded && <PWARefreshButton />}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSideMenuExpanded(!sideMenuExpanded)}
            className="p-2"
          >
            {!sideMenuExpanded ? (
              <Menu className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span className="sr-only">
              {!sideMenuExpanded ? "Expand sidebar" : "Collapse sidebar"}
            </span>
          </Button>
        </div>
      </div>
      <nav
        className={cn("flex-1 space-y-2", !sideMenuExpanded ? "p-2" : "p-4")}
      >
        <NavItems collapsed={!sideMenuExpanded} />
      </nav>
    </div>
  )
}
