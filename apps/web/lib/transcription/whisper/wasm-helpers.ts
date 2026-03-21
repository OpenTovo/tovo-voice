// Modern TypeScript utilities for WASM operations, replacing public/wasm/helpers.js
// Provides model downloading, caching, progress tracking, and storage management
// Includes browser-compatible functions for remote file fetching with IndexedDB persistence

import { modelLogger } from "../../logger"
import { tovoDB } from "../../tovo-idb"

export type ProgressCallback = (progress: number) => void

export type ReadyCallback = (dst: string, buffer: ArrayBuffer) => void

export type CancelCallback = () => void

export type PrintCallback = (message: string) => void

/**
 * Fetch remote file with progress tracking
 */
export async function fetchRemote(
  url: string,
  onProgress?: ProgressCallback,
  onPrint?: PrintCallback
): Promise<Uint8Array> {
  const response = await fetch(url, { method: "GET" })

  if (!response.ok) {
    const error = `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    onPrint?.(error)
    throw new Error(error)
  }

  const contentLength = response.headers.get("content-length")
  const total = contentLength ? parseInt(contentLength, 10) : 0
  const reader = response.body?.getReader()

  if (!reader) {
    throw new Error("Failed to get response body reader")
  }

  const chunks: Uint8Array[] = []
  let receivedLength = 0
  let progressLast = -1

  while (true) {
    const { done, value } = await reader.read()

    if (done) break

    chunks.push(value)
    receivedLength += value.length

    if (total > 0) {
      const progress = receivedLength / total
      onProgress?.(progress)

      // Log every 20% to reduce console spam
      const progressCur = Math.round(progress * 5) // 0-5 = 0%, 20%, 40%, 60%, 80%, 100%
      if (progressCur !== progressLast && progressCur <= 5) {
        onPrint?.(`Download ${progressCur * 20}%`)
        progressLast = progressCur
      }
    }
  }

  // Combine chunks into single Uint8Array efficiently
  const result = new Uint8Array(receivedLength)
  let position = 0
  for (const chunk of chunks) {
    result.set(chunk, position)
    position += chunk.length
  }

  return result
}

/**
 * Check storage quota and log information
 */
export async function checkStorageQuota(): Promise<void> {
  if (!navigator.storage?.estimate) {
    return
  }

  try {
    const estimate = await navigator.storage.estimate()
    if (estimate.quota && estimate.usage) {
      const usagePercent = Math.round((estimate.usage / estimate.quota) * 100)
      modelLogger.info("Storage usage", {
        quota: estimate.quota,
        usage: estimate.usage,
        usagePercent: `${usagePercent}%`,
      })
    }
  } catch (error) {
    modelLogger.warn("Failed to check storage quota", { error })
  }
}

/**
 * Modern replacement for loadRemote function
 * Loads a remote model file, caching it in IndexedDB
 */
export async function loadRemoteModel(
  url: string,
  destinationFilename: string,
  sizeMB: number,
  onProgress: ProgressCallback,
  onReady: ReadyCallback,
  onCancel: CancelCallback,
  onPrint: PrintCallback,
  showConfirmDialog?: (message: string) => Promise<boolean>
): Promise<void> {
  try {
    // Check storage quota
    await checkStorageQuota()

    // Check if model is already cached
    const hasModel = await tovoDB.hasModel(url)

    if (hasModel) {
      onPrint(`Loading from cache...`)
      const cachedModel = await tovoDB.getModel(url)
      if (cachedModel) {
        onReady(destinationFilename, cachedModel)
        return
      }
    }

    // Model not cached, need to download
    onPrint(`Downloading ${sizeMB}MB model...`)

    // Show confirmation dialog if available
    if (showConfirmDialog) {
      const confirmed = await showConfirmDialog(
        `You are about to download ${sizeMB} MB of data.\n` +
          `The model will be cached locally for future use.\n\n` +
          `Continue?`
      )

      if (!confirmed) {
        onCancel()
        return
      }
    }

    // Download the model
    const modelData = await fetchRemote(url, onProgress, onPrint)

    // Store in cache
    onPrint("Storing in cache...")
    await tovoDB.storeModel(url, modelData)

    onPrint("Model ready!")
    onReady(destinationFilename, modelData.buffer)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    onPrint(`Failed to load model: ${errorMessage}`)
    modelLogger.error("Model loading failed", { url, error })
    onCancel()
  }
}

/**
 * Clear all cached models
 */
export async function clearModelCache(onPrint?: PrintCallback): Promise<void> {
  try {
    await tovoDB.clearAllModels()
    onPrint?.("Model cache cleared successfully")
    modelLogger.info("Model cache cleared")
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    onPrint?.(`Failed to clear cache: ${errorMessage}`)
    modelLogger.error("Failed to clear model cache", { error })
    throw error
  }
}

/**
 * Get list of cached models
 */
export async function getCachedModels(): Promise<
  Array<{ url: string; size: number; timestamp: number }>
> {
  try {
    return await tovoDB.listModels()
  } catch (error) {
    modelLogger.error("Failed to get cached models", { error })
    return []
  }
}

/**
 * Get current memory usage information
 */
export function getMemoryUsage(): {
  jsHeapSizeLimit: number
  totalJSHeapSize: number
  usedJSHeapSize: number
  wasmMemoryPages?: number
  wasmMemoryBytes?: number
} {
  const performance = (globalThis as any).performance
  const memory = performance?.memory

  const result: {
    jsHeapSizeLimit: number
    totalJSHeapSize: number
    usedJSHeapSize: number
    wasmMemoryPages?: number
    wasmMemoryBytes?: number
  } = {
    jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0,
    totalJSHeapSize: memory?.totalJSHeapSize || 0,
    usedJSHeapSize: memory?.usedJSHeapSize || 0,
  }

  // Try to get WASM memory info if available
  try {
    const wasmMemory = (globalThis as any).Module?.wasmMemory
    if (wasmMemory) {
      result.wasmMemoryPages = wasmMemory.buffer.byteLength / (64 * 1024)
      result.wasmMemoryBytes = wasmMemory.buffer.byteLength
    }
  } catch {
    // Ignore errors getting WASM memory info
  }

  return result
}

/**
 * Log memory usage with optional label
 */
export function logMemoryUsage(label: string = "Memory usage") {
  if (process.env.NODE_ENV === "development") {
    const usage = getMemoryUsage()
    modelLogger.debug(label, {
      jsHeapMB: Math.round(usage.usedJSHeapSize / 1024 / 1024),
      jsHeapLimitMB: Math.round(usage.jsHeapSizeLimit / 1024 / 1024),
      wasmMemoryMB: usage.wasmMemoryBytes
        ? Math.round(usage.wasmMemoryBytes / 1024 / 1024)
        : undefined,
    })
  }
}

/**
 * Force garbage collection if available (development only)
 */
export function forceGC() {
  if (process.env.NODE_ENV === "development") {
    try {
      if ((globalThis as any).gc) {
        ;(globalThis as any).gc()
        modelLogger.debug("Forced garbage collection")
      }
    } catch {
      // Ignore GC errors
    }
  }
}
