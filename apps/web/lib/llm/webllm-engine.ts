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
import { modelLogger } from "@/lib/logger"
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
  requiredFeatures: string[]
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
let globalCurrentModel: WebLLMModelName | null = null

const WEBLLM_WORKER_INACTIVITY_TIMEOUT_MS = 30_000
const WEBLLM_APP_CONFIG: webllm.AppConfig = {
  ...webllm.prebuiltAppConfig,
  cacheBackend: "cache",
}

/**
 * Check if a WebLLM model is cached using WebLLM's built-in cache detection
 */
export async function isWebLLMModelCached(
  modelName: WebLLMModelName
): Promise<boolean> {
  try {
    const modelConfig = WEBLLM_MODELS[modelName]
    if (!modelConfig?.config) return false

    return await webllm.hasModelInCache(
      modelConfig.config.model_id,
      WEBLLM_APP_CONFIG
    )
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
        requiredFeatures: modelConfig.config?.required_features || [],
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

  if (isWebWorkerSupported()) {
    globalWorker = new Worker(new URL("./webllm-worker.ts", import.meta.url), {
      type: "module",
    })
    globalEngine = new webllm.WebWorkerMLCEngine(globalWorker, {
      appConfig: WEBLLM_APP_CONFIG,
    })
    modelLogger.info("Created WebLLM worker engine", getWebLLMRuntimeInfo())
    return globalEngine
  }

  globalEngine = createMainThreadEngine()
  modelLogger.info("Created WebLLM main-thread engine", getWebLLMRuntimeInfo())
  return globalEngine
}

function createMainThreadEngine(): webllm.MLCEngineInterface {
  return new webllm.MLCEngine({
    appConfig: WEBLLM_APP_CONFIG,
  })
}

function getWebLLMRuntimeInfo() {
  if (typeof window === "undefined") {
    return {}
  }

  return {
    userAgent: navigator.userAgent,
    standalone: window.matchMedia("(display-mode: standalone)").matches,
    crossOriginIsolated: window.crossOriginIsolated,
    workerSupported: isWebWorkerSupported(),
  }
}

async function reloadWorkerModel(
  engine: webllm.MLCEngineInterface,
  worker: Worker,
  modelId: string,
  onProgress?: webllm.InitProgressCallback
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout>

    const stopWaiting = () => {
      clearTimeout(timeoutId)
      worker.removeEventListener("error", handleWorkerError)
      worker.removeEventListener("messageerror", handleWorkerMessageError)
    }

    const fail = (message: string) => {
      stopWaiting()
      reject(new Error(message))
    }

    const resetTimeout = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        fail(
          `WebLLM worker produced no progress for ${
            WEBLLM_WORKER_INACTIVITY_TIMEOUT_MS / 1000
          } seconds`
        )
      }, WEBLLM_WORKER_INACTIVITY_TIMEOUT_MS)
    }

    const handleWorkerError = (event: ErrorEvent) => {
      fail(event.message || "WebLLM worker failed to start")
    }

    const handleWorkerMessageError = () => {
      fail("WebLLM worker returned an unreadable message")
    }

    worker.addEventListener("error", handleWorkerError)
    worker.addEventListener("messageerror", handleWorkerMessageError)
    engine.setInitProgressCallback((report) => {
      resetTimeout()
      onProgress?.(report)
    })
    resetTimeout()

    engine.reload(modelId).then(
      () => {
        stopWaiting()
        resolve()
      },
      (error) => {
        stopWaiting()
        reject(error)
      }
    )
  })
}

async function reloadWebLLMModel(
  modelName: WebLLMModelName,
  onProgress?: webllm.InitProgressCallback
): Promise<webllm.MLCEngineInterface> {
  if (globalEngine && globalCurrentModel === modelName) {
    return globalEngine
  }

  const modelConfig = WEBLLM_MODELS[modelName]
  if (!modelConfig?.config) {
    throw new Error(
      `Model ${modelName} not found in configuration or has invalid config`
    )
  }

  let engine = await createWebLLMEngine()
  modelLogger.info("Loading WebLLM model", {
    modelName,
    backend: globalWorker ? "worker" : "main-thread",
    ...getWebLLMRuntimeInfo(),
  })

  try {
    if (globalWorker) {
      await reloadWorkerModel(
        engine,
        globalWorker,
        modelConfig.config.model_id,
        onProgress
      )
    } else {
      engine.setInitProgressCallback(onProgress ?? (() => {}))
      await engine.reload(modelConfig.config.model_id)
    }
  } catch (error) {
    if (!globalWorker) {
      throw error
    }

    const workerError =
      error instanceof Error ? error : new Error("WebLLM worker failed")
    modelLogger.warn("WebLLM worker unavailable; retrying on main thread", {
      modelName,
      error: workerError.message,
    })
    globalWorker?.terminate()
    globalWorker = null
    globalEngine = createMainThreadEngine()
    engine = globalEngine
    onProgress?.({
      progress: 0,
      timeElapsed: 0,
      text: "Web worker unavailable; retrying on main thread...",
    })
    engine.setInitProgressCallback(onProgress ?? (() => {}))
    await engine.reload(modelConfig.config.model_id)
  }

  globalCurrentModel = modelName
  modelLogger.info("WebLLM model ready", {
    modelName,
    backend: globalWorker ? "worker" : "main-thread",
  })
  return engine
}

/**
 * Download and cache a WebLLM model using WebLLM's built-in system
 */
export async function downloadWebLLMModel(
  modelName: WebLLMModelName,
  onProgress?: (progress: WebLLMDownloadProgress) => void,
  onComplete?: () => void | Promise<void>,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const modelConfig = WEBLLM_MODELS[modelName]
    if (!modelConfig?.config) {
      throw new Error(
        `Model ${modelName} not found in configuration or has invalid config`
      )
    }

    await reloadWebLLMModel(
      modelName,
      onProgress
        ? (report) => {
            // Parse progress from WebLLM progress text
            const progressValue = Math.round(report.progress * 100)

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
          }
        : undefined
    )

    if (onComplete) {
      await onComplete()
    }
  } catch (error) {
    const err =
      error instanceof Error ? error : new Error("Model download failed")
    modelLogger.error("WebLLM model download failed", {
      modelName,
      error: err.message,
      ...getWebLLMRuntimeInfo(),
    })
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

    const engine = await reloadWebLLMModel(modelName, (report) => {
      onProgress?.(report.text)
    })

    if (onComplete) {
      onComplete()
    }

    return engine
  } catch (error) {
    modelLogger.error("WebLLM initialization failed", {
      modelName,
      error: error instanceof Error ? error.message : "Unknown error",
      ...getWebLLMRuntimeInfo(),
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
        globalCurrentModel = null
      } catch (unloadError) {
        console.warn(
          "Failed to unload engine, continuing with deletion:",
          unloadError
        )
      }
    }

    // Use WebLLM's method to delete all model information from cache
    // This completely removes the model from IndexedDB
    await webllm.deleteModelAllInfoInCache(
      modelConfig.config.model_id,
      WEBLLM_APP_CONFIG
    )

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
        globalCurrentModel = null
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
          await webllm.deleteModelAllInfoInCache(
            modelConfig.config.model_id,
            WEBLLM_APP_CONFIG
          )
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
      globalCurrentModel = null
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
  currentModel: WebLLMModelName | null
} {
  return {
    hasGlobalEngine: globalEngine !== null,
    engineReady: globalEngine !== null,
    currentModel: globalCurrentModel,
  }
}
