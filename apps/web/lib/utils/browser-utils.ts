/**
 * Browser and platform detection utilities
 */

import { formatFileSizeFromBytes } from "@/lib/utils"

export interface BrowserInfo {
  isSafari: boolean
  isIOS: boolean
  isMobile: boolean
  isChrome: boolean
  isFirefox: boolean
  userAgent: string
}

export interface MemoryConfig {
  initialMemory: number
  maximumMemory: number
  description: string
}

/**
 * Detect browser and platform information (legacy interface)
 * @deprecated Use getDeviceInfo() for new code
 */
export function detectBrowser(): BrowserInfo {
  const deviceInfo = getDeviceInfo()

  return {
    isSafari: deviceInfo.isSafari,
    isIOS: deviceInfo.isIOS,
    isMobile: deviceInfo.isMobile,
    isChrome: deviceInfo.isChrome,
    isFirefox: deviceInfo.isFirefox,
    userAgent: deviceInfo.userAgent,
  }
}

/**
 * Check if device is iOS
 */
export function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Check if browser is Safari (accurate for both desktop and iOS)
 */
export function isSafariBrowser(): boolean {
  if (typeof window === "undefined") return false

  const userAgent = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/.test(userAgent)

  if (isIOS) {
    // On iOS: Safari has Version/X.X in user agent, others have CriOS or FxiOS
    return (
      /Version\/\d+\.\d+.*Safari/.test(userAgent) &&
      !/CriOS|FxiOS/.test(userAgent)
    )
  }

  // On desktop: traditional Safari detection
  return /^((?!chrome|android).)*safari/i.test(userAgent)
}

/**
 * Check if browser is Chrome (accurate for both desktop and iOS)
 */
export function isChromeBrowser(): boolean {
  if (typeof window === "undefined") return false

  const userAgent = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/.test(userAgent)

  if (isIOS) {
    return /CriOS/.test(userAgent)
  }

  return /Chrome/.test(userAgent) && !/Edg/.test(userAgent)
}

/**
 * Check if browser is Firefox (accurate for both desktop and iOS)
 */
export function isFirefoxBrowser(): boolean {
  if (typeof window === "undefined") return false

  const userAgent = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/.test(userAgent)

  if (isIOS) {
    return /FxiOS/.test(userAgent)
  }

  return /Firefox/.test(userAgent)
}

/**
 * Check if device is mobile (includes iOS and Android)
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false

  const userAgent = navigator.userAgent
  return /Mobi|Android/i.test(userAgent) || isIOSDevice()
}

/**
 * Get detailed device and browser information
 */
export function getDeviceInfo() {
  if (typeof window === "undefined") {
    return {
      isIOS: false,
      isMobile: false,
      isSafari: false,
      isChrome: false,
      isFirefox: false,
      userAgent: "",
    }
  }

  return {
    isIOS: isIOSDevice(),
    isMobile: isMobileDevice(),
    isSafari: isSafariBrowser(),
    isChrome: isChromeBrowser(),
    isFirefox: isFirefoxBrowser(),
    userAgent: navigator.userAgent,
  }
}

/**
 * Get optimal memory configuration based on browser/platform
 * Note: WASM modules are now built with 256MB INITIAL_MEMORY requirement
 */
export function getMemoryConfig(browserInfo?: BrowserInfo): MemoryConfig {
  const browser = browserInfo || detectBrowser()

  if (browser.isIOS) {
    // iOS Safari has strict memory limits - start at WASM minimum
    return {
      initialMemory: 268435456, // 256MB - matches WASM INITIAL_MEMORY requirement
      maximumMemory: 402653184, // 384MB max for iOS (modest growth allowed)
      description: "iOS Safari (WASM minimum)",
    }
  } else if (browser.isSafari) {
    // Desktop Safari - conservative but allows growth
    return {
      initialMemory: 268435456, // 256MB - matches WASM INITIAL_MEMORY requirement
      maximumMemory: 536870912, // 512MB max for Safari
      description: "Desktop Safari (conservative)",
    }
  } else if (browser.isMobile) {
    // Other mobile browsers - limited to 2GB due to resource constraints
    // Even on powerful devices like MacBook Pro, larger models use too much memory
    return {
      initialMemory: 268435456, // 256MB - matches WASM INITIAL_MEMORY requirement
      maximumMemory: 2147483648, // 2GB hard limit for all mobile devices
      description: "Mobile browser (2GB limit)",
    }
  } else {
    // Desktop Chrome/Firefox - more generous allocation
    return {
      initialMemory: 268435456, // 256MB - matches WASM INITIAL_MEMORY requirement
      maximumMemory: 1073741824, // 1GB maximum for desktop browsers
      description: "Desktop browser (generous)",
    }
  }
}

/**
 * Log browser and memory configuration details
 */
export function logBrowserInfo(): void {
  const deviceInfo = getDeviceInfo()
  const memoryConfig = getMemoryConfig()

  // Essential device/memory info for debugging
  console.log("🔍 Device:", {
    iOS: deviceInfo.isIOS,
    mobile: deviceInfo.isMobile,
    browser: deviceInfo.isSafari
      ? "Safari"
      : deviceInfo.isChrome
        ? "Chrome"
        : deviceInfo.isFirefox
          ? "Firefox"
          : "Other",
    memory: {
      profile: memoryConfig.description,
      initial: formatFileSizeFromBytes(memoryConfig.initialMemory),
      maximum: formatFileSizeFromBytes(memoryConfig.maximumMemory),
    },
  })
}
