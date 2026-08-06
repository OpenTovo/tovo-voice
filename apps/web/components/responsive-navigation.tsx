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
import {
  ChevronLeft,
  Download,
  History,
  Menu,
  Pause,
  Plus,
  Settings,
} from "lucide-react"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useSessionNavigationGuard } from "@/hooks/use-session-navigation-guard"
import { SessionStatus, sessionStatusAtom, type TabType } from "@/lib/atoms"
import { sideMenuExpandedAtom } from "@/lib/atoms/tabs"
import { GithubIcon, XIcon } from "./icons/brand-icons"
import { usePWAInstall } from "./providers/pwa-install"
import { PWARefreshButton } from "./pwa-refresh-button"
import { ThemeToggle } from "./theme-toggle"

interface NavigationProps {
  className?: string
  mobileOnly?: boolean
}

export function ResponsiveNavigation({ mobileOnly = false }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sessionStatus] = useAtom(sessionStatusAtom)
  const [sideMenuExpanded, setSideMenuExpanded] = useAtom(sideMenuExpandedAtom)
  const { navigateWithGuard } = useSessionNavigationGuard()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { canInstall, install, isInstalled } = usePWAInstall()

  const handleInstall = async () => {
    setMobileMenuOpen(false)
    await install()
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
              "bg-status-recording/10 text-status-recording hover:bg-status-recording/15"
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
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <PWARefreshButton />
              </div>
            </div>
          </DrawerHeader>
          <div className="flex flex-col space-y-2 p-6 pt-0">
            <NavItems onItemClick={() => setMobileMenuOpen(false)} />
            {canInstall && !isInstalled && (
              <Button
                variant="ghost"
                onClick={handleInstall}
                className="flex w-full items-center justify-start gap-3"
              >
                <Download className="h-5 w-5" />
                <span className="font-medium">Install Tovo Voice</span>
              </Button>
            )}
            <Button
              variant="ghost"
              asChild
              className="flex w-full items-center justify-start gap-3"
            >
              <a
                href="https://github.com/OpenTovo/tovo-voice"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon className="h-5 w-5" />
                <span className="font-medium">GitHub</span>
              </a>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="flex w-full items-center justify-start gap-3"
            >
              <a
                href="https://x.com/qiweiy"
                target="_blank"
                rel="noopener noreferrer"
              >
                <XIcon className="h-5 w-5" />
                <span className="font-medium">X (Twitter)</span>
              </a>
            </Button>
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
        <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
          <a
            href="https://voice.tovo.dev"
            target="_blank"
            rel="noopener noreferrer"
            title="Go to landing page"
            className="flex items-center gap-2.5"
          >
            <Image
              src="/tovo-icon.png"
              alt="Tovo Voice logo"
              width={28}
              height={28}
              className="shrink-0 rounded-md"
            />
            {sideMenuExpanded && (
              <h2 className="text-lg font-semibold tracking-tight whitespace-nowrap">
                Tovo Voice
              </h2>
            )}
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
      <div
        className={cn(
          "flex items-center",
          !sideMenuExpanded
            ? "flex-col justify-center gap-1 p-2"
            : "justify-start gap-1 p-4"
        )}
      >
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="p-2"
          title="View source on GitHub"
        >
          <a
            href="https://github.com/OpenTovo/tovo-voice"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </a>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="p-2"
          title="Follow @qiweiy on X"
        >
          <a
            href="https://x.com/qiweiy"
            target="_blank"
            rel="noopener noreferrer"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">X (Twitter)</span>
          </a>
        </Button>
      </div>
    </div>
  )
}
