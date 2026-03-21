/**
 * WebLLM engine utilities for model management and inference
 *
 * Key improvements:
 * - Uses official WebLLM model IDs from the prebuilt configuration
 * - Leverages WebLLM's built-in IndexedDB cache for persistent storage
 * - Uses WebLLM's hasModelInCache() for accurate cache detection
 * - Properly integrates with WebLLM's model loading and management APIs
 * - Web worker support using WebWorkerMLCEngineHandler (./webllm-worker.ts)
 * - Complete model deletion using deleteModelAllInfoInCache()
 *
 * Web worker implementation follows WebLLM's official pattern:
 * - Custom worker file with WebWorkerMLCEngineHandler
 * - Automatic fallback to main thread if worker fails
 * - Proper worker lifecycle management with cleanup
 */

import * as webllm from "@mlc-ai/web-llm"
import { WEBLLM_MODELS, type WebLLMModelName } from "./models"

export interface WebLLMEngineState {
  isInitialized: boolean
  isLoading: boolean
  currentModel: string | null
  loadingProgress: string
  error: string | null
}

export interface WebLLMModelInfo {
  id: string
  name: string
  description: string
  isDownloaded?: boolean
  webllmId: string // Actual WebLLM model ID
  vramRequired: number // VRAM required in MB
  lowResourceRequired: boolean // Whether it can run on limited devices
}

export interface WebLLMDownloadProgress {
  modelId: string
  progress: number
  text: string
  isComplete: boolean
}

// Global engine instance for reuse
let globalEngine: webllm.MLCEngineInterface | null = null
let globalWorker: Worker | null = null

/**
 * Check if a WebLLM model is cached using WebLLM's built-in cache detection
 */
export async function isWebLLMModelCached(
  modelName: WebLLMModelName
): Promise<boolean> {
  try {
    const modelConfig = WEBLLM_MODELS[modelName]
    if (!modelConfig?.config) return false

    return await webllm.hasModelInCache(modelConfig.config.model_id, {
      useIndexedDBCache: true,
      model_list: webllm.prebuiltAppConfig.model_list,
    })
  } catch (error) {
    console.warn("Error checking WebLLM model cache:", error)
    return false
  }
}

/**
 * Get list of cached WebLLM models using WebLLM's cache detection
 */
export async function getCachedWebLLMModels(): Promise<WebLLMModelName[]> {
  try {
    const cachedModels: WebLLMModelName[] = []

    for (const [modelName] of Object.entries(WEBLLM_MODELS)) {
      const isCached = await isWebLLMModelCached(modelName as WebLLMModelName)
      if (isCached) {
        cachedModels.push(modelName as WebLLMModelName)
      }
    }

    return cachedModels
  } catch (error) {
    console.warn("Error getting cached WebLLM models:", error)
    return []
  }
}

/**
 * Get available WebLLM models from our configuration with cache status
 */
export async function getAvailableWebLLMModels(): Promise<WebLLMModelInfo[]> {
  const cachedModels = await getCachedWebLLMModels()

  return Object.entries(WEBLLM_MODELS)
    .map(([id, modelConfig]) => {
      // Use VRAM requirement in MB as the size (already a good approximation)
      const vramMB = modelConfig.config?.vram_required_MB || 0

      return {
        id,
        name: modelConfig.name,
        description: modelConfig.description,
        webllmId: modelConfig.config?.model_id || "",
        vramRequired: vramMB,
        lowResourceRequired: modelConfig.config?.low_resource_required || false,
        isDownloaded: cachedModels.includes(id as WebLLMModelName),
      }
    })
    .filter((model) => model.webllmId) // Filter out models without valid config
    .sort((a, b) => a.vramRequired - b.vramRequired)
}

/**
 * Create a WebLLM engine instance with web worker support
 */
export async function createWebLLMEngine(): Promise<webllm.MLCEngineInterface> {
  if (globalEngine) {
    return globalEngine
  }

  try {
    // First try to create engine with web worker for better performance
    if (isWebWorkerSupported()) {
      try {
        // Create worker using our custom worker file
        globalWorker = new Worker(
          new URL("./webllm-worker.ts", import.meta.url),
          { type: "module" }
        )

        const engineConfig: webllm.MLCEngineConfig = {
          appConfig: {
            model_list: webllm.prebuiltAppConfig.model_list,
            useIndexedDBCache: true, // Enable IndexedDB cache for persistent storage
          },
        }

        globalEngine = await webllm.CreateWebWorkerMLCEngine(
          globalWorker,
          [], // Empty model list - we'll reload models as needed
          engineConfig
        )

        return globalEngine
      } catch (workerError) {
        console.warn(
          "Failed to create web worker engine, falling back to main thread:",
          workerError
        )

        // Clean up failed worker
        if (globalWorker) {
          globalWorker.terminate()
          globalWorker = null
        }
      }
    }

    // Fallback to main thread engine
    const engineConfig: webllm.MLCEngineConfig = {
      appConfig: {
        model_list: webllm.prebuiltAppConfig.model_list,
        useIndexedDBCache: true,
      },
    }

    globalEngine = await webllm.CreateMLCEngine([], engineConfig)
    return globalEngine
  } catch (error) {
    console.error("Failed to create WebLLM engine:", error)
    throw error
  }
}

/**
 * Download and cache a WebLLM model using WebLLM's built-in system
 */
export async function downloadWebLLMModel(
  modelName: WebLLMModelName,
  onProgress?: (progress: WebLLMDownloadProgress) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const modelConfig = WEBLLM_MODELS[modelName]
    if (!modelConfig?.config) {
      throw new Error(
        `Model ${modelName} not found in configuration or has invalid config`
      )
    }

    const engine = await createWebLLMEngine()

    // Set up progress tracking
    if (onProgress) {
      engine.setInitProgressCallback((report) => {
        // Parse progress from WebLLM progress text
        const progressMatch = report.text.match(/(\d+)%/)
        const progressValue = progressMatch
          ? parseInt(progressMatch[1] || "0")
          : 0

        // Customize progress text for better UX
        let customText = report.text
        if (report.text.includes("Loading model from cache")) {
          customText = "Loading model from cache..."
        } else if (report.text.includes("Initializing")) {
          customText = "Initializing..."
        } else if (report.text.includes("Downloading")) {
          customText = `Downloading model... ${progressValue}%`
        } else if (report.text.includes("Loading")) {
          customText = `Loading model... ${progressValue}%`
        } else if (report.text.includes("Fetching")) {
          customText = `Fetching model files... ${progressValue}%`
        } else if (progressValue >= 100) {
          customText = "Model ready!"
        } else if (progressValue > 0) {
          customText = `Preparing model... ${progressValue}%`
        }

        onProgress({
          modelId: modelName,
          progress: progressValue,
          text: customText,
          isComplete: progressValue >= 100,
        })
      })
    }

    // Download and initialize the model using WebLLM's model ID
    await engine.reload(modelConfig.config.model_id)

    if (onComplete) {
      onComplete()
    }
  } catch (error) {
    const err =
      error instanceof Error ? error : new Error("Model download failed")
    if (onError) {
      onError(err)
    }
    throw err
  }
}

/**
 * Initialize WebLLM engine with a specific model
 */
export async function initializeWebLLMModel(
  modelName: WebLLMModelName,
  onProgress?: (progress: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<webllm.MLCEngineInterface> {
  try {
    const modelConfig = WEBLLM_MODELS[modelName]
    if (!modelConfig?.config) {
      throw new Error(
        `Model ${modelName} not found in configuration or has invalid config`
      )
    }

    const engine = await createWebLLMEngine()

    // Set progress callback if provided
    if (onProgress) {
      engine.setInitProgressCallback((report) => {
        onProgress(report.text)
      })
    }

    // Load the model using WebLLM's model ID
    await engine.reload(modelConfig.config.model_id)

    if (onComplete) {
      onComplete()
    }

    return engine
  } catch (error) {
    console.error("❌ WebLLM Initialization Failed:", {
      modelName,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })

    const err = error instanceof Error ? error : new Error("Unknown error")
    if (onError) {
      onError(err)
    }
    throw err
  }
}

/**
 * Unload and delete a WebLLM model using WebLLM's cache deletion methods
 */
export async function deleteWebLLMModel(
  modelName: WebLLMModelName,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const modelConfig = WEBLLM_MODELS[modelName]
    if (!modelConfig?.config) {
      throw new Error(
        `Model ${modelName} not found in configuration or has invalid config`
      )
    }

    // Check if model is actually cached before trying to delete
    const isCached = await isWebLLMModelCached(modelName)

    if (!isCached) {
      if (onComplete) {
        onComplete()
      }
      return
    }

    // If we have a global engine, unload the model first
    if (globalEngine) {
      try {
        await globalEngine.unload()
      } catch (unloadError) {
        console.warn(
          "Failed to unload engine, continuing with deletion:",
          unloadError
        )
      }
    }

    // Use WebLLM's method to delete all model information from cache
    // This completely removes the model from IndexedDB
    await webllm.deleteModelAllInfoInCache(modelConfig.config.model_id, {
      useIndexedDBCache: true,
      model_list: webllm.prebuiltAppConfig.model_list,
    })

    if (onComplete) {
      onComplete()
    }
  } catch (error) {
    console.error("Model deletion failed:", error)
    const err =
      error instanceof Error ? error : new Error("Model deletion failed")
    if (onError) {
      onError(err)
    }
    throw err
  }
}

/**
 * Clear all cached WebLLM models
 */
export async function clearAllWebLLMModels(): Promise<void> {
  try {
    // Get all currently cached models
    const cachedModels = await getCachedWebLLMModels()

    // If we have a global engine, unload it first
    if (globalEngine) {
      try {
        await globalEngine.unload()
      } catch (unloadError) {
        console.warn(
          "Failed to unload engine, continuing with deletion:",
          unloadError
        )
      }
    }

    // Delete each model individually
    for (const modelName of cachedModels) {
      try {
        const modelConfig = WEBLLM_MODELS[modelName]
        if (modelConfig?.config) {
          await webllm.deleteModelAllInfoInCache(modelConfig.config.model_id, {
            useIndexedDBCache: true,
            model_list: webllm.prebuiltAppConfig.model_list,
          })
        }
      } catch (error) {
        console.warn(`Failed to delete model ${modelName}:`, error)
        // Continue with other models even if one fails
      }
    }
  } catch (error) {
    console.error("Error clearing all WebLLM models:", error)
    throw error
  }
}

/**
 * Check if web worker support is available
 */
export function isWebWorkerSupported(): boolean {
  try {
    return typeof Worker !== "undefined" && typeof URL !== "undefined"
  } catch {
    return false
  }
}

/**
 * Cleanup WebLLM engine and web worker
 */
export async function cleanupWebLLMEngine(): Promise<void> {
  try {
    if (globalEngine) {
      await globalEngine.unload()
      globalEngine = null
    }

    if (globalWorker) {
      globalWorker.terminate()
      globalWorker = null
    }
  } catch (error) {
    console.warn("Error during WebLLM cleanup:", error)
  }
}

/**
 * Get the current engine status and configuration
 */
export function getWebLLMEngineStatus(): {
  isInitialized: boolean
  isUsingWebWorker: boolean
  hasActiveModel: boolean
} {
  return {
    isInitialized: globalEngine !== null,
    isUsingWebWorker: globalWorker !== null,
    hasActiveModel: globalEngine !== null, // We could add more specific checks here
  }
}

/**
 * Get storage information for WebLLM cached models
 */
export async function getWebLLMStorageInfo(): Promise<
  Array<{
    id: string
    name: string
    size: number
    modelId: string
  }>
> {
  try {
    const cachedModels = await getCachedWebLLMModels()
    const storageInfo = []

    for (const modelName of cachedModels) {
      const modelConfig = WEBLLM_MODELS[modelName]
      if (modelConfig?.config) {
        storageInfo.push({
          id: modelName,
          name: modelConfig.name,
          size: modelConfig.config.vram_required_MB || 0,
          modelId: modelConfig.config.model_id,
        })
      }
    }

    return storageInfo
  } catch (error) {
    console.warn("Error getting WebLLM storage info:", error)
    return []
  }
}

/**
 * Get the current WebLLM engine state for debugging
 */
export function getWebLLMEngineState(): {
  hasGlobalEngine: boolean
  engineReady: boolean
  currentModel: string | null
} {
  return {
    hasGlobalEngine: globalEngine !== null,
    engineReady: globalEngine !== null,
    currentModel: null, // WebLLM doesn't expose current model directly
  }
}
