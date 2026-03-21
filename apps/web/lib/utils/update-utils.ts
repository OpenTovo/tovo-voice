/**
 * Simple update detection utilities for PWA
 */

import { smartReload } from "./pwa"

export interface VersionInfo {
  version: string
  timestamp: string
}

export interface UpdateInfo {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
}

/**
 * Fetch latest version from /version.json
 */
export async function fetchLatestVersion(): Promise<VersionInfo> {
  // Add timeout and better error handling for PWA
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    const response = await fetch("/version.json", {
      cache: "no-cache",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Validate response structure
    if (!data.version) {
      throw new Error("Invalid version response structure")
    }

    return data
  } catch (error) {
    clearTimeout(timeoutId)

    // If it's an AbortError, it was a timeout
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout - check your internet connection")
    }

    throw error
  }
}

/**
 * Check for updates by comparing current version with latest
 */
export async function checkForUpdates(
  currentVersion: string | null
): Promise<UpdateInfo> {
  try {
    const latestInfo = await fetchLatestVersion()

    // If we don't have a current version, there's no update to show
    if (!currentVersion) {
      return {
        hasUpdate: false,
        currentVersion: latestInfo.version,
        latestVersion: latestInfo.version,
      }
    }

    return {
      hasUpdate: currentVersion !== latestInfo.version,
      currentVersion,
      latestVersion: latestInfo.version,
    }
  } catch (error) {
    console.error("Error checking for updates:", error)
    return {
      hasUpdate: false,
      currentVersion: currentVersion || "unknown",
      latestVersion: currentVersion || "unknown",
    }
  }
}

/**
 * Reload the app to apply updates with PWA cache management
 */
export function reloadApp(): void {
  if (typeof window !== "undefined") {
    smartReload()
  }
}
