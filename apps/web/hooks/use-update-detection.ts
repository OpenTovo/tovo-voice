"use client"

import { useAtom } from "jotai"
import { useCallback, useEffect, useState } from "react"
import {
  currentVersionAtom,
  lastUpdateCheckAtom,
  updateDismissedAtom,
} from "@/lib/atoms"
import { checkForUpdates, reloadApp, type UpdateInfo } from "@/lib/utils"

const CHECK_INTERVAL = 10 * 60 * 1000 // Check every 10 minutes

export function useUpdateDetection() {
  const [currentVersion, setCurrentVersion] = useAtom(currentVersionAtom)
  const [updateDismissed, setUpdateDismissed] = useAtom(updateDismissedAtom)
  const [lastUpdateCheck, setLastUpdateCheck] = useAtom(lastUpdateCheckAtom)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  // Check for updates
  const performUpdateCheck = useCallback(async () => {
    setIsChecking(true)
    try {
      const info = await checkForUpdates(currentVersion)
      setUpdateInfo(info)
      setLastUpdateCheck(Date.now())
    } catch (error) {
      console.warn(
        "Update check failed (this is normal for offline usage):",
        error
      )
      // For PWA, failed update checks are normal when offline
      // Don't show errors to users, just log for debugging
    } finally {
      setIsChecking(false)
    }
  }, [currentVersion, setLastUpdateCheck])

  // Initialize current version from version.json if not set
  useEffect(() => {
    const initializeVersion = async () => {
      if (!currentVersion) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          const response = await fetch("/version.json", {
            cache: "no-cache",
            signal: controller.signal,
          })

          clearTimeout(timeoutId)
          const { version } = await response.json()
          setCurrentVersion(version)
        } catch (error) {
          console.warn("Failed to initialize version (offline mode?):", error)
          // Set a fallback version so the app doesn't break
          setCurrentVersion("unknown")
        }
      }
    }
    initializeVersion()
  }, [currentVersion, setCurrentVersion])

  // Initial check on app start
  useEffect(() => {
    // Only perform check if we have a valid current version and it's not unknown
    if (currentVersion && currentVersion !== "unknown") {
      performUpdateCheck()
    }
  }, [performUpdateCheck, currentVersion])

  // Periodic update checks with better offline handling
  useEffect(() => {
    const interval = setInterval(() => {
      // Only check if document is visible to avoid unnecessary requests
      if (document.hidden) return

      const now = Date.now()
      if (now - lastUpdateCheck > CHECK_INTERVAL) {
        performUpdateCheck()
      }
    }, CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [lastUpdateCheck, performUpdateCheck])

  const handleAcceptUpdate = () => {
    if (updateInfo?.latestVersion) {
      setCurrentVersion(updateInfo.latestVersion)
      reloadApp()
    }
  }

  const handleDismissUpdate = () => {
    if (updateInfo?.latestVersion) {
      setUpdateDismissed(updateInfo.latestVersion)
    }
  }

  const handleCheckNow = () => {
    performUpdateCheck()
  }

  const shouldShowUpdate =
    updateInfo?.hasUpdate &&
    updateInfo.latestVersion !== updateDismissed &&
    !isChecking

  return {
    updateInfo,
    shouldShowUpdate,
    isChecking,
    currentVersion,
    handleAcceptUpdate,
    handleDismissUpdate,
    handleCheckNow,
  }
}
