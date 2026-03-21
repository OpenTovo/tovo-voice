/**
 * Storage Quota Manager
 * Handles browser storage limitations, especially Safari's strict IndexedDB quotas
 */

import { tovoDB } from "@/lib/tovo-idb"
import { formatFileSizeFromBytes } from "@/lib/utils"
import { getDeviceInfo } from "@/lib/utils/browser-utils"

/**
 * IndexedDB storage limit information for different browsers
 */
export interface IndexedDBStorageLimit {
  maxSize: number // In bytes
  description: string
  isApproximate: boolean
  hasUserPermission?: boolean // Whether it requires user permission at certain thresholds
  permissionThreshold?: number // Size in bytes where permission is typically requested
  browser: string
  maxRecommendedFileSize: number
  shouldRequestPersistent: boolean
  limitations: string[]
}

// Storage safety margin to account for metadata and other storage overhead
export const STORAGE_SAFETY_MARGIN = 0.96

export interface StorageQuotaInfo {
  available: number
  used: number
  quota: number
  isPersistent: boolean
  canRequestPersistent: boolean
}

export class StorageQuotaManager {
  private static instance: StorageQuotaManager | null = null

  static getInstance(): StorageQuotaManager {
    if (!StorageQuotaManager.instance) {
      StorageQuotaManager.instance = new StorageQuotaManager()
    }
    return StorageQuotaManager.instance
  }

  /**
   * Check current storage quota status
   */
  async getQuotaInfo(): Promise<StorageQuotaInfo> {
    if (!navigator.storage || !navigator.storage.estimate) {
      throw new Error("Storage API not supported")
    }

    const estimate = await navigator.storage.estimate()
    const isPersistent = await this.isPersistentStorageGranted()

    return {
      available: (estimate.quota || 0) - (estimate.usage || 0),
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
      isPersistent,
      canRequestPersistent: !!navigator.storage.persist,
    }
  }

  /**
   * Check if persistent storage is granted
   */
  async isPersistentStorageGranted(): Promise<boolean> {
    if (!navigator.storage || !navigator.storage.persisted) {
      return false
    }

    try {
      return await navigator.storage.persisted()
    } catch (error) {
      console.warn("Failed to check persistent storage status:", error)
      return false
    }
  }

  /**
   * Request persistent storage (important for Safari)
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (!navigator.storage || !navigator.storage.persist) {
      return false
    }

    try {
      const granted = await navigator.storage.persist()
      return granted
    } catch {
      return false
    }
  }

  /**
   * Check if there's enough space for a file
   */
  async hasSpaceForFile(fileSize: number): Promise<boolean> {
    try {
      const quotaInfo = await this.getQuotaInfo()

      // Add 10% buffer for metadata and other overhead
      const requiredSpace = fileSize * 1.1

      return quotaInfo.available >= requiredSpace
    } catch {
      // Assume we have space if we can't check
      return true
    }
  }

  /**
   * Get comprehensive storage information for the current browser
   * Combines storage limits and browser-specific recommendations
   */
  getIndexedDBStorageLimit(): IndexedDBStorageLimit {
    const deviceInfo = getDeviceInfo()

    if (deviceInfo.isIOS && deviceInfo.isSafari) {
      // iOS Safari: Typically 1 GB per origin, can be less on older iOS
      return {
        maxSize: 1 * 1024 * 1024 * 1024, // 1 GB
        description: "iOS Safari, 1 GB per origin",
        isApproximate: true,
        hasUserPermission: false,
        browser: "Safari iOS",
        maxRecommendedFileSize: 50 * 1024 * 1024, // 50MB conservative limit
        shouldRequestPersistent: true,
        limitations: [
          "Strict IndexedDB quota limits",
          "Very aggressive data eviction",
          "Lower quota on older iOS versions",
          "No explicit permission dialog",
        ],
      }
    } else if (deviceInfo.isSafari) {
      // Desktop Safari: Similar to iOS but potentially more generous
      return {
        maxSize: 2 * 1024 * 1024 * 1024, // 2 GB
        description: "Desktop Safari, similar to iOS limits",
        isApproximate: true,
        hasUserPermission: false,
        browser: "Safari",
        maxRecommendedFileSize: 100 * 1024 * 1024, // 100MB
        shouldRequestPersistent: true,
        limitations: [
          "Strict IndexedDB quota limits",
          "May require user permission for large files",
          "Proactive data eviction after 7 days without interaction",
          "Lower quota in private browsing mode",
        ],
      }
    } else if (deviceInfo.isFirefox && deviceInfo.isMobile) {
      // Firefox Mobile: ~5 MB initial, asks for permission
      return {
        maxSize: 5 * 1024 * 1024, // 5 MB initial
        description: "Firefox Mobile, 5 MB initial",
        isApproximate: true,
        hasUserPermission: true,
        permissionThreshold: 5 * 1024 * 1024, // 5 MB
        browser: "Firefox Mobile",
        maxRecommendedFileSize: 500 * 1024 * 1024, // 500MB after permission
        shouldRequestPersistent: true,
        limitations: [
          "Very small initial quota (5MB)",
          "Requires explicit user permission for larger files",
          "Good support after permission granted",
        ],
      }
    } else if (deviceInfo.isFirefox) {
      // Firefox Desktop: ~2 GB, asks permission at 50 MB
      return {
        maxSize: 2 * 1024 * 1024 * 1024, // 2 GB
        description: "Firefox Desktop, 2 GB, permission at 50 MB",
        isApproximate: true,
        hasUserPermission: true,
        permissionThreshold: 50 * 1024 * 1024, // 50 MB
        browser: "Firefox",
        maxRecommendedFileSize: 500 * 1024 * 1024, // 500MB
        shouldRequestPersistent: true,
        limitations: [
          "Asks permission at 50MB threshold",
          "Good quota management after permission",
          "Respects persistent storage requests",
        ],
      }
    } else if (deviceInfo.isMobile) {
      // On iOS, all browsers are actually Safari WebKit underneath
      if (deviceInfo.isIOS) {
        // iOS Chrome/Firefox are actually Safari WebKit - use same limits as Safari
        return {
          maxSize: 1 * 1024 * 1024 * 1024, // 1 GB
          description: "iOS Browser, 1 GB per origin",
          isApproximate: true,
          hasUserPermission: false,
          browser: "iOS Browser",
          maxRecommendedFileSize: 50 * 1024 * 1024, // 50MB
          shouldRequestPersistent: true,
          limitations: [
            "All iOS browsers use Safari WebKit",
            "Same strict limits as Safari",
            "Very aggressive data eviction",
          ],
        }
      } else {
        // Android Chrome/Edge: unlimited
        return {
          maxSize: Number.MAX_SAFE_INTEGER, // Use device quota
          description: "Android Mobile, unlimited",
          isApproximate: true,
          hasUserPermission: false,
          browser: "Chrome Mobile",
          maxRecommendedFileSize: 1024 * 1024 * 1024, // 1GB
          shouldRequestPersistent: false,
          limitations: [
            "Quota varies by device storage",
            "Can be limited by available device storage",
            "Generally good support for large files",
          ],
        }
      }
    } else {
      // Chrome/Chromium/Edge Desktop: Uses device quota, no static limit
      return {
        maxSize: Number.MAX_SAFE_INTEGER, // Use device quota
        description: "Chrome/Edge Desktop, uses device quota",
        isApproximate: true,
        hasUserPermission: false, // No permission prompts
        browser: "Chrome/Edge",
        maxRecommendedFileSize: 2 * 1024 * 1024 * 1024, // 2GB
        shouldRequestPersistent: false,
        limitations: [
          "Very generous quota limits",
          "May prompt user for very large files",
          "Best overall support for large files",
        ],
      }
    }
  }

  /**
   * Check if a model size would fit within browser storage limits
   */
  canStorageAccommodateModel(modelSizeBytes: number): {
    canStore: boolean
    limit: IndexedDBStorageLimit
    reason?: string
  } {
    const limit = this.getIndexedDBStorageLimit()

    // For browsers with unlimited quota (Chrome/Edge), allow all downloads
    if (limit.maxSize === Number.MAX_SAFE_INTEGER) {
      return {
        canStore: true,
        limit,
      }
    }

    // Add some safety margin (20%) to account for metadata and other storage
    const safeMaxSize = limit.maxSize * STORAGE_SAFETY_MARGIN

    if (modelSizeBytes > safeMaxSize) {
      return {
        canStore: false,
        limit,
        reason: `Model size (${formatFileSizeFromBytes(
          modelSizeBytes
        )}) exceeds safe storage limit (${formatFileSizeFromBytes(safeMaxSize)})`,
      }
    }

    // Check if it would trigger permission request (only Firefox)
    if (
      limit.hasUserPermission &&
      limit.permissionThreshold &&
      modelSizeBytes > limit.permissionThreshold
    ) {
      return {
        canStore: true,
        limit,
        reason: `Model download may require browser permission (${formatFileSizeFromBytes(
          modelSizeBytes
        )} > ${formatFileSizeFromBytes(limit.permissionThreshold)})`,
      }
    }

    return {
      canStore: true,
      limit,
    }
  }

  /**
   * Get storage usage warning message for large models
   */
  getStorageWarningMessage(modelSizeBytes: number): string | null {
    const storageCheck = this.canStorageAccommodateModel(modelSizeBytes)

    if (!storageCheck.canStore) {
      return `⚠️ Storage Limit: ${storageCheck.reason}

Your browser (${storageCheck.limit.description}) may not have enough storage space for this model. Consider choosing a smaller model or freeing up browser storage.`
    }

    if (storageCheck.reason) {
      return `📱 Permission Required: ${storageCheck.reason}

Your browser may ask for permission to store this large model.`
    }

    return null
  }

  /**
   * Check if file needs special Safari iOS handling
   */
  needsSafariIOSOptimization(url: string, estimatedSize?: number): boolean {
    const deviceInfo = getDeviceInfo()

    return (
      deviceInfo.isSafari &&
      deviceInfo.isMobile &&
      url.includes(".data") &&
      (estimatedSize ? estimatedSize > 100 * 1024 * 1024 : true) // 100MB threshold
    )
  }

  /**
   * Create a memory-efficient blob URL for Safari iOS
   * Uses streaming approach to avoid large memory allocations
   */
  async createSafariIOSBlobUrl(url: string): Promise<string | null> {
    try {
      // Check if it's a chunked file
      const metadataKey = `${url}:metadata`
      const metadataBuffer = await tovoDB.getModel(metadataKey)

      if (!metadataBuffer) {
        // Not chunked, get normally
        const data = await tovoDB.getModel(url)
        if (data) {
          return URL.createObjectURL(
            new Blob([data], { type: "application/octet-stream" })
          )
        }
        return null
      }

      const metadataStr = Buffer.from(metadataBuffer).toString()
      const metadata = JSON.parse(metadataStr)

      if (!metadata.isChunked) {
        // Not chunked, get normally
        const data = await tovoDB.getModel(url)
        if (data) {
          return URL.createObjectURL(
            new Blob([data], { type: "application/octet-stream" })
          )
        }
        return null
      }

      console.log(`Creating Safari iOS optimized blob for chunked file: ${url}`)

      // For Safari iOS, create a ReadableStream that yields chunks without reconstructing the entire file
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for (let i = 0; i < metadata.totalChunks; i++) {
              const chunkKey = `${url}:chunk:${i}`
              const chunkData = await tovoDB.getModel(chunkKey)

              if (!chunkData) {
                throw new Error(`Missing chunk ${i} for ${url}`)
              }

              // Enqueue the chunk
              controller.enqueue(new Uint8Array(chunkData))

              // Yield control to prevent blocking (crucial for Safari iOS)
              await new Promise((resolve) => setTimeout(resolve, 0))
            }

            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      })

      // Convert stream to blob (this is more memory efficient than reconstructing the full array)
      const response = new Response(stream)
      const blob = await response.blob()

      return URL.createObjectURL(blob)
    } catch (error) {
      console.error("Error creating Safari iOS blob URL", { url, error })
      return null
    }
  }
}

export const storageQuotaManager = StorageQuotaManager.getInstance()
