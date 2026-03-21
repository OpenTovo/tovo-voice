/**
 * PWA Detection and Installation Utilities
 */

import { atomWithStorage } from "jotai/utils"
import { isIOSDevice, isMobileDevice } from "./browser-utils"

export interface PWAInstallPrompt extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

// Atom to track if user has dismissed the PWA prompt
export const pwaPromptDismissedAtom = atomWithStorage<boolean>(
  "tovo-pwa-prompt-dismissed",
  false
)

export function isPWAInstalled(): boolean {
  if (typeof window === "undefined") return false

  // Check if running in standalone mode (iOS Safari)
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true
  }

  // Check if running as PWA (iOS Safari older method)
  if ((window.navigator as any).standalone === true) {
    return true
  }

  // Check if launched from home screen (Android)
  if (document.referrer.includes("android-app://")) {
    return true
  }

  return false
}

// Re-export device detection functions from browser-utils for compatibility
export const isMobile = isMobileDevice
export const isIOS = isIOSDevice
export function isAndroid(): boolean {
  if (typeof window === "undefined") return false
  return /Android/.test(navigator.userAgent)
}

export function getDeviceType(): "ios" | "android" | "desktop" {
  if (isIOS()) return "ios"
  if (isAndroid()) return "android"
  return "desktop"
}

export function canShowInstallPrompt(): boolean {
  return !isPWAInstalled() && isMobile()
}

export function shouldShowInstallPrompt(): boolean {
  // Don't show if already installed
  if (isPWAInstalled()) return false

  // This is now handled by the atom, but keep for backward compatibility
  return true
}

// PWA Cache Management
export interface CacheInfo {
  name: string
  size: number
}

/**
 * Check if running in PWA mode
 */
export function isPWAMode(): boolean {
  if (typeof window === "undefined") return false

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  )
}

/**
 * Clear all caches except for user data
 */
export async function clearAppCaches(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return
  }

  try {
    const cacheNames = await caches.keys()
    console.log("🧹 Clearing app caches:", cacheNames)

    // Clear all caches except for specific user data caches
    const cachesToClear = cacheNames.filter(
      (name) =>
        !name.includes("tovo-models") && // Keep model cache
        !name.includes("user-data") && // Keep user data
        !name.includes("indexed-db") // Keep IndexedDB-related caches
    )

    await Promise.all(
      cachesToClear.map((cacheName) => caches.delete(cacheName))
    )

    console.log("✅ Cleared caches:", cachesToClear)
  } catch (error) {
    console.error("❌ Error clearing caches:", error)
  }
}

/**
 * Smart reload for PWA - clears caches before reloading
 */
export async function smartReload(): Promise<void> {
  if (typeof window === "undefined") return

  if (isPWAMode()) {
    console.log("🔄 PWA smart reload: clearing caches before reload")

    try {
      // Clear app caches but keep user data
      await clearAppCaches()

      // Add a small delay to ensure cache clearing completes
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Reload with cache bypass
      window.location.href = window.location.href + "?cache-bust=" + Date.now()
    } catch (error) {
      console.error("❌ Error in smart reload:", error)
      // Fallback to regular reload
      window.location.reload()
    }
  } else {
    // Regular web browser - normal reload is fine
    window.location.reload()
  }
}

/**
 * Get cache information for debugging
 */
export async function getCacheInfo(): Promise<CacheInfo[]> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return []
  }

  try {
    const cacheNames = await caches.keys()
    const cacheInfos: CacheInfo[] = []

    for (const name of cacheNames) {
      try {
        const cache = await caches.open(name)
        const keys = await cache.keys()
        cacheInfos.push({
          name,
          size: keys.length,
        })
      } catch (error) {
        console.warn(`Error getting info for cache ${name}:`, error)
      }
    }

    return cacheInfos
  } catch (error) {
    console.error("Error getting cache info:", error)
    return []
  }
}
