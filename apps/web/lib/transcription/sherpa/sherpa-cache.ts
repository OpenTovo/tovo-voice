/**
 * IndexedDB cache for Sherpa model files using the unified Tovo database
 * Caches large .data files to avoid re-downloading on each session
 */

import { storageQuotaManager } from "@/lib/storage/storage-quota-manager"
import { tovoDB } from "@/lib/tovo-idb"
import {
  getSherpaAssetUrl,
  getSherpaBaseUrl,
  normalizeSherpaAssetUrl,
} from "./sherpa-assets"
import { getOriginalFetch } from "./sherpa-loader"
import { getModelShortName } from "./sherpa-model"

// Chunk size for large files (25MB chunks for Safari compatibility)
const CHUNK_SIZE = 25 * 1024 * 1024 // 25MB
const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024 // 100MB

/**
 * Check if a file is cached using the unified Tovo database
 */
export async function hasCachedFile(url: string): Promise<boolean> {
  try {
    return await hasChunkedFile(normalizeSherpaAssetUrl(url))
  } catch (error) {
    console.warn("Error checking cached file", { url, error })
    return false
  }
}

/**
 * Get cached file data using the unified Tovo database
 */
export async function getCachedFile(url: string): Promise<ArrayBuffer | null> {
  try {
    return await getFileWithChunking(normalizeSherpaAssetUrl(url))
  } catch (error) {
    console.warn("Error getting cached file", { url, error })
    return null
  }
}

/**
 * Cache a file using the unified Tovo database
 */
export async function cacheFile(url: string, data: ArrayBuffer): Promise<void> {
  try {
    const normalizedUrl = normalizeSherpaAssetUrl(url)

    await storeFileWithChunking(normalizedUrl, data)

    console.log("Cached model file", {
      url: normalizedUrl,
      size: data.byteLength,
      sizeFormatted: `${(data.byteLength / 1024 / 1024).toFixed(1)}MB`,
      chunked: shouldChunkFile(normalizedUrl, data.byteLength),
    })
  } catch (error) {
    console.error("Error caching file", { url, error })
    throw error
  }
}

/**
 * Check if the shared Sherpa data file is cached
 * Since all Sherpa models use the same .data file, we use a shared cache key
 */
export async function hasSharedSherpaDataFile(): Promise<boolean> {
  try {
    // Check for the shared data file using just the path part to avoid base URL issues
    const sharedDataPath = "sherpa-onnx-shared/sherpa-onnx-wasm-main-asr.data"

    const storageInfo = await tovoDB.getStorageInfo()

    // Check if any stored URL contains this path
    const hasExactFile = storageInfo.models.some((model) =>
      model.url.includes(sharedDataPath)
    )

    if (hasExactFile) {
      return true
    }

    // Check if chunked version exists (metadata file)
    const hasChunkedVersion = storageInfo.models.some(
      (model) =>
        model.url.includes(sharedDataPath) && model.url.includes(":metadata")
    )

    return hasChunkedVersion
  } catch (error) {
    console.warn("Error checking for shared Sherpa data file", error)
    return false
  }
}

/**
 * Get the shared Sherpa data file from cache
 */
export async function getSharedSherpaDataFile(): Promise<ArrayBuffer | null> {
  const baseUrl = getSherpaBaseUrl()
  const sharedDataUrl = `${baseUrl}/sherpa-onnx-shared/sherpa-onnx-wasm-main-asr.data`
  return getCachedFile(sharedDataUrl)
}

/**
 * Get cache info using the unified Tovo database
 */
export async function getCacheInfo(): Promise<{
  totalFiles: number
  totalSize: number
  files: Array<{ url: string; size: number; timestamp: number }>
}> {
  try {
    const storageInfo = await tovoDB.getStorageInfo()
    return {
      totalFiles: storageInfo.models.length,
      totalSize: storageInfo.models.reduce((sum, model) => sum + model.size, 0),
      files: storageInfo.models,
    }
  } catch (error) {
    console.warn("Error getting cache info", { error })
    return { totalFiles: 0, totalSize: 0, files: [] }
  }
}

/**
 * Clear all cached files using the unified Tovo database
 */
export async function clearCache(): Promise<void> {
  try {
    await tovoDB.clearAllModels()
    console.log("Cleared model cache")
  } catch (error) {
    console.error("Error clearing cache", { error })
    throw error
  }
}

/**
 * Delete a specific cached file using the unified Tovo database
 */
export async function deleteCachedFile(url: string): Promise<void> {
  try {
    const normalizedUrl = normalizeSherpaAssetUrl(url)
    await deleteChunkedFile(normalizedUrl)
    console.log("Deleted cached file", { url: normalizedUrl })
  } catch (error) {
    console.error("Error deleting cached file", { url, error })
    throw error
  }
}

/**
 * Delete all cached files for a specific Sherpa model
 * This includes .js, .wasm, and .data files
 */
export async function deleteModelFiles(modelId: string): Promise<void> {
  try {
    const shortName = getModelShortName(modelId)

    const storageInfo = await tovoDB.getStorageInfo()

    // Find model-specific files (not shared files)
    const modelSpecificFiles = storageInfo.models.filter(
      (model) =>
        model.url.includes(shortName) &&
        !model.url.includes("sherpa-onnx-shared")
    )

    // Check if there are other Sherpa models that still need the shared files
    const otherSherpaFiles = storageInfo.models.filter(
      (model) =>
        model.url.includes("sherpa-onnx") &&
        !model.url.includes(shortName) &&
        !model.url.includes("sherpa-onnx-shared")
    )

    // Only delete shared files if this is the last Sherpa model
    const shouldDeleteSharedFiles = otherSherpaFiles.length === 0

    let filesToDelete = [...modelSpecificFiles]

    if (shouldDeleteSharedFiles) {
      const sharedFiles = storageInfo.models.filter((model) =>
        model.url.includes("sherpa-onnx-shared")
      )
      filesToDelete = [...filesToDelete, ...sharedFiles]
    }

    console.log(
      `Deleting ${filesToDelete.length} files for model: ${modelId} (shared files: ${shouldDeleteSharedFiles})`
    )

    // Delete each file
    const deletePromises = filesToDelete.map(async (file) => {
      try {
        await deleteCachedFile(file.url)
      } catch (error) {
        console.warn(`Failed to delete file: ${file.url}`, error)
      }
    })

    await Promise.all(deletePromises)
    console.log(`Successfully deleted files for model: ${modelId}`)
  } catch (error) {
    console.error(`Error deleting model files for: ${modelId}`, error)
    throw error
  }
}

/**
 * Download and cache all required files for a specific Sherpa model
 * This includes .js, .wasm, and shared .data files
 */
export async function downloadModelFiles(
  modelId: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    const shortName = getModelShortName(modelId)
    const baseUrl = getSherpaBaseUrl()
    const originalFetch = getOriginalFetch()

    // Request persistent storage if not already granted
    const quotaInfo = await storageQuotaManager.getQuotaInfo()
    if (!quotaInfo.isPersistent && quotaInfo.canRequestPersistent) {
      await storageQuotaManager.requestPersistentStorage()
    }

    // Define the files to download
    const modelFiles = [
      {
        url: getSherpaAssetUrl(
          `sherpa-onnx-${shortName}/sherpa-onnx-wasm-main-asr.wasm`
        ),
        name: "WASM module",
      },
      {
        url: getSherpaAssetUrl(`sherpa-onnx-${shortName}/sherpa-onnx-asr.js`),
        name: "JavaScript API wrapper",
      },
      {
        url: getSherpaAssetUrl(
          `sherpa-onnx-${shortName}/sherpa-onnx-wasm-main-asr.js`
        ),
        name: "JavaScript WASM loader",
      },
    ]

    // Check if shared data file needs to be downloaded
    const sharedDataUrl = `${baseUrl}/sherpa-onnx-shared/sherpa-onnx-wasm-main-asr.data`
    const hasSharedData = await hasSharedSherpaDataFile()

    if (!hasSharedData) {
      modelFiles.push({
        url: getSherpaAssetUrl(
          "sherpa-onnx-shared/sherpa-onnx-wasm-main-asr.data"
        ),
        name: "Shared data file",
      })
    }

    console.log(`Downloading ${modelFiles.length} files for model: ${modelId}`)

    let completedFiles = 0
    const totalFiles = modelFiles.length

    // Download all files in parallel for better performance
    await Promise.all(
      modelFiles.map(async (file) => {
        try {
          console.log(`Downloading ${file.name}: ${file.url}`)

          const response = await originalFetch(file.url)
          if (!response.ok) {
            throw new Error(
              `Failed to download ${file.name}: ${response.status} ${response.statusText}`
            )
          }

          const data = await response.arrayBuffer()
          await cacheFile(file.url, data)

          completedFiles++
          onProgress?.(Math.round((completedFiles / totalFiles) * 100))

          console.log(`Successfully downloaded ${file.name}`)
        } catch (error) {
          console.error(`Failed to download ${file.name}:`, error)
          throw error
        }
      })
    )

    console.log(`Successfully downloaded all files for model: ${modelId}`)
  } catch (error) {
    console.error(`Error downloading model files for: ${modelId}`, error)
    throw error
  }
}

/**
 * Check if a file needs chunking based on browser limits and file size
 */
function shouldChunkFile(url: string, fileSize: number): boolean {
  // Always chunk .data files for Safari compatibility
  if (url.includes(".data")) {
    const storageLimit = storageQuotaManager.getIndexedDBStorageLimit()
    // Safari has strict limits, so chunk large .data files
    return (
      storageLimit.maxSize < Number.MAX_SAFE_INTEGER &&
      fileSize > LARGE_FILE_THRESHOLD
    )
  }
  return false
}

/**
 * Store a file in chunks if it's large, otherwise store normally
 */
async function storeFileWithChunking(
  url: string,
  data: ArrayBuffer
): Promise<void> {
  const fileSize = data.byteLength

  if (shouldChunkFile(url, fileSize)) {
    console.log(
      `Storing large file in chunks: ${url} (${(fileSize / 1024 / 1024).toFixed(1)}MB)`
    )

    const uint8Array = new Uint8Array(data)
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE)

    // Store metadata about the chunked file
    const metadata = {
      originalSize: fileSize,
      totalChunks,
      chunkSize: CHUNK_SIZE,
      isChunked: true,
    }

    const metadataKey = `${url}:metadata`
    const metadataSuccess = await tovoDB.storeModel(
      metadataKey,
      new Uint8Array(Buffer.from(JSON.stringify(metadata)))
    )

    if (!metadataSuccess) {
      throw new Error("Failed to store file metadata")
    }

    // Store each chunk
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, fileSize)
      const chunkData = uint8Array.slice(start, end)

      const chunkKey = `${url}:chunk:${i}`
      const chunkSuccess = await tovoDB.storeModel(chunkKey, chunkData)

      if (!chunkSuccess) {
        // Clean up any stored chunks on failure
        for (let j = 0; j < i; j++) {
          await tovoDB.deleteModel(`${url}:chunk:${j}`)
        }
        await tovoDB.deleteModel(metadataKey)
        throw new Error(`Failed to store chunk ${i}`)
      }
    }

    console.log(`Stored ${totalChunks} chunks for ${url}`)
  } else {
    // Store normally for small files
    const uint8Array = new Uint8Array(data)
    const success = await tovoDB.storeModel(url, uint8Array)

    if (!success) {
      throw new Error("Failed to store model in database")
    }
  }
}

/**
 * Retrieve a file that may be chunked
 */
async function getFileWithChunking(url: string): Promise<ArrayBuffer | null> {
  try {
    // First check if it's a chunked file
    const metadataKey = `${url}:metadata`
    const metadataBuffer = await tovoDB.getModel(metadataKey)

    if (metadataBuffer) {
      // File is chunked, reconstruct it
      const metadataStr = Buffer.from(metadataBuffer).toString()
      const metadata = JSON.parse(metadataStr)

      if (metadata.isChunked) {
        const chunks = new Array(metadata.totalChunks)

        // Load all chunks
        for (let i = 0; i < metadata.totalChunks; i++) {
          const chunkKey = `${url}:chunk:${i}`
          const chunkData = await tovoDB.getModel(chunkKey)

          if (!chunkData) {
            throw new Error(`Missing chunk ${i} for ${url}`)
          }

          chunks[i] = chunkData
        }

        // Reconstruct the original file
        const totalSize = chunks.reduce(
          (sum, chunk) => sum + chunk.byteLength,
          0
        )
        const reconstructed = new Uint8Array(totalSize)

        let offset = 0
        for (const chunk of chunks) {
          reconstructed.set(new Uint8Array(chunk), offset)
          offset += chunk.byteLength
        }

        return reconstructed.buffer.slice(
          reconstructed.byteOffset,
          reconstructed.byteOffset + reconstructed.byteLength
        )
      }
    }

    // Not chunked, get normally
    const data = await tovoDB.getModel(url)
    if (data) {
      const arrayBuffer = new ArrayBuffer(data.byteLength)
      new Uint8Array(arrayBuffer).set(data)
      return arrayBuffer
    }

    return null
  } catch (error) {
    console.warn("Error getting file with chunking", { url, error })
    return null
  }
}

/**
 * Check if a chunked file exists
 */
async function hasChunkedFile(url: string): Promise<boolean> {
  try {
    // Check for metadata first
    const metadataKey = `${url}:metadata`
    const hasMetadata = await tovoDB.hasModel(metadataKey)

    if (hasMetadata) {
      return true
    }

    // Check for regular file
    return await tovoDB.hasModel(url)
  } catch (error) {
    console.warn("Error checking chunked file", { url, error })
    return false
  }
}

/**
 * Delete a chunked file and all its chunks
 */
async function deleteChunkedFile(url: string): Promise<void> {
  try {
    // Check if it's chunked
    const metadataKey = `${url}:metadata`
    const metadataBuffer = await tovoDB.getModel(metadataKey)

    if (metadataBuffer) {
      const metadataStr = Buffer.from(metadataBuffer).toString()
      const metadata = JSON.parse(metadataStr)

      if (metadata.isChunked) {
        // Delete all chunks
        for (let i = 0; i < metadata.totalChunks; i++) {
          const chunkKey = `${url}:chunk:${i}`
          await tovoDB.deleteModel(chunkKey)
        }

        // Delete metadata
        await tovoDB.deleteModel(metadataKey)
        return
      }
    }

    // Not chunked, delete normally
    await tovoDB.deleteModel(url)
  } catch (error) {
    console.error("Error deleting chunked file", { url, error })
    throw error
  }
}
