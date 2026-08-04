/**
 * WebGPU detection utilities for WebLLM support
 */

import {
  isChromeBrowser,
  isFirefoxBrowser,
  isIOSDevice,
  isSafariBrowser,
} from "@/lib/utils"

// Basic WebGPU types for our use case
interface GPU {
  requestAdapter(): Promise<GPUAdapter | null>
}

interface GPUAdapter {
  info?: unknown
  requestAdapterInfo(): Promise<unknown>
  features?: {
    [Symbol.iterator](): IterableIterator<string>
  }
}

declare global {
  interface Navigator {
    gpu?: GPU
  }
}

export interface WebGPUInfo {
  isSupported: boolean
  isEnabled: boolean
  adapterInfo?: unknown
  features?: string[]
  error?: string
}

/**
 * Detects WebGPU availability and provides detailed information
 */
export async function detectWebGPU(): Promise<WebGPUInfo> {
  // Check if WebGPU is supported by the browser
  if (!navigator.gpu) {
    return {
      isSupported: false,
      isEnabled: false,
      error: "WebGPU not supported by this browser",
    }
  }

  try {
    // Request adapter
    const adapter = await navigator.gpu.requestAdapter()

    if (!adapter) {
      return {
        isSupported: true,
        isEnabled: false,
        error: "WebGPU adapter not available",
      }
    }

    // Get adapter info if available
    let adapterInfo = adapter.info
    if (!adapterInfo) {
      try {
        adapterInfo = await adapter.requestAdapterInfo()
      } catch {
        // requestAdapterInfo might not be available in all browsers
        adapterInfo = undefined
      }
    }

    return {
      isSupported: true,
      isEnabled: true,
      adapterInfo,
      features: adapter.features ? Array.from(adapter.features) : undefined,
    }
  } catch (error) {
    return {
      isSupported: true,
      isEnabled: false,
      error: error instanceof Error ? error.message : "Unknown WebGPU error",
    }
  }
}

/**
 * Get device-specific WebGPU guidance
 */
export function getWebGPUGuidance(): {
  needsSetup: boolean
  browserRecommendation?: string
  setupInstructions?: string[]
} {
  const isIOS = isIOSDevice()
  const isSafari = isSafariBrowser()

  if (isIOS) {
    if (!isSafari) {
      // Detect specific iOS browsers for better guidance
      const isChrome = isChromeBrowser()
      const isFirefox = isFirefoxBrowser()

      let browserName = "this browser"
      if (isChrome) browserName = "Chrome"
      else if (isFirefox) browserName = "Firefox"

      return {
        needsSetup: true,
        browserRecommendation: "Safari",
        setupInstructions: [
          `${browserName} on iOS doesn't support WebGPU yet`,
          "Please use Safari for WebGPU support",
          "Open this page in Safari to continue",
        ],
      }
    }

    return {
      needsSetup: true,
      setupInstructions: [
        "Open Settings → Safari",
        "Go to Advanced → Feature Flags",
        "Enable 'WebGPU' if not already enabled",
        "Restart Safari and try again",
      ],
    }
  }

  return {
    needsSetup: false,
  }
}
