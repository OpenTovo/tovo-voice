"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { isPWAInstalled, type PWAInstallPrompt } from "@/lib/utils/pwa"

type InstallOutcome = "accepted" | "dismissed" | null

interface PWAInstallContextValue {
  canInstall: boolean
  isInstalled: boolean
  install: () => Promise<InstallOutcome>
}

const PWAInstallContext = createContext<PWAInstallContextValue | null>(null)

export function PWAInstallProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPrompt | null>(
    null
  )
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    setIsInstalled(isPWAInstalled())

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as PWAInstallPrompt)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstalled(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      )
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const install = useCallback(async (): Promise<InstallOutcome> => {
    const promptEvent = deferredPrompt
    if (!promptEvent) return null

    setDeferredPrompt(null)
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice

    if (outcome === "accepted") {
      setIsInstalled(true)
    }

    return outcome
  }, [deferredPrompt])

  return (
    <PWAInstallContext.Provider
      value={{ canInstall: Boolean(deferredPrompt), install, isInstalled }}
    >
      {children}
    </PWAInstallContext.Provider>
  )
}

export function usePWAInstall() {
  const context = useContext(PWAInstallContext)
  if (!context) {
    throw new Error("usePWAInstall must be used within PWAInstallProvider")
  }
  return context
}
