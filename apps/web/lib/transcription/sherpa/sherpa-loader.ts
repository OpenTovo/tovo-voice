// Sherpa-ONNX WASM module loader

import { storageQuotaManager } from "@/lib/storage/storage-quota-manager"
import { getSherpaAssetUrl, getSherpaBaseUrl } from "./sherpa-assets"
import { getCachedFile, hasCachedFile } from "./sherpa-cache"

// R2 Configuration
const SHERPA_BASE_URL = getSherpaBaseUrl()
const SHERPA_SHARED_PATH = "sherpa-onnx-shared"

// Export function to get original fetch for downloads
export function getOriginalFetch(): typeof fetch {
  if (typeof window !== "undefined" && (window as any).__sherpaOriginalFetch) {
    return (window as any).__sherpaOriginalFetch
  }
  // Fallback to current fetch if not intercepted yet
  return fetch
}

export interface SherpaWasmModule {
  // Core recognizer functions
  _SherpaOnnxCreateOnlineRecognizer: (configPtr: number) => number
  _SherpaOnnxDestroyOnlineRecognizer: (recognizerPtr: number) => void
  _SherpaOnnxCreateOnlineStream: (recognizerPtr: number) => number
  _SherpaOnnxDestroyOnlineStream: (streamPtr: number) => void

  // Stream processing functions
  _SherpaOnnxOnlineStreamAcceptWaveform: (
    streamPtr: number,
    sampleRate: number,
    samplesPtr: number,
    numSamples: number
  ) => void
  _SherpaOnnxIsOnlineStreamReady: (
    recognizerPtr: number,
    streamPtr: number
  ) => number
  _SherpaOnnxDecodeOnlineStream: (
    recognizerPtr: number,
    streamPtr: number
  ) => void
  _SherpaOnnxGetOnlineStreamResult: (
    recognizerPtr: number,
    streamPtr: number
  ) => number
  _SherpaOnnxDestroyOnlineRecognizerResult: (resultPtr: number) => void
  _SherpaOnnxOnlineStreamReset: (
    recognizerPtr: number,
    streamPtr: number
  ) => void
  _SherpaOnnxOnlineStreamIsEndpoint: (
    recognizerPtr: number,
    streamPtr: number
  ) => number

  // Memory management
  _malloc: (size: number) => number
  _free: (ptr: number) => void
  setValue: (ptr: number, value: number, type: string) => void
  getValue: (ptr: number, type: string) => number

  // Memory views
  HEAP8: Int8Array
  HEAPU8: Uint8Array
  HEAP16: Int16Array
  HEAPU16: Uint16Array
  HEAP32: Int32Array
  HEAPU32: Uint32Array
  HEAPF32: Float32Array
  HEAPF64: Float64Array

  // Utility functions
  UTF8ToString: (ptr: number) => string
  stringToUTF8: (str: string, ptr: number, maxBytes: number) => void
  lengthBytesUTF8: (str: string) => number

  // Module state
  calledRun: boolean

  // High-level API (added by sherpa-onnx-asr.js)
  createOnlineRecognizer?: (module: SherpaWasmModule, config?: any) => any
}

declare global {
  interface Window {
    Module: any // Keep as any to avoid conflicts
  }
}

let wasmModule: SherpaWasmModule | null = null
let isLoading = false
let loadPromise: Promise<SherpaWasmModule> | null = null

// Progress tracking
type ProgressCallback = (progress: number) => void
let currentProgressCallback: ProgressCallback | null = null

/**
 * Load Sherpa-ONNX WASM module for a specific model
 */
export async function loadSherpaWasm(
  modelFolder = "sherpa-onnx-bilingual",
  onProgress?: ProgressCallback
): Promise<SherpaWasmModule> {
  if (wasmModule) {
    return wasmModule
  }

  if (isLoading && loadPromise) {
    return loadPromise
  }

  isLoading = true
  currentProgressCallback = onProgress || null

  loadPromise = new Promise((resolve, reject) => {
    const loadModule = async () => {
      // Blob URLs for cached files (to prevent any network requests)
      let dataBlobUrl: string | null = null
      let wasmBlobUrl: string | null = null

      try {
        currentProgressCallback?.(5)

        // Set up Module configuration before loading scripts
        let moduleReadyResolve: () => void
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let moduleReadyReject: (error: Error) => void

        const moduleReadyPromise = new Promise<void>((resolve, reject) => {
          moduleReadyResolve = resolve
          moduleReadyReject = reject
        })

        // Set up Module configuration with blob URLs to prevent any network requests
        window.Module = {
          locateFile: (path: string, scriptDirectory: string = "") => {
            // Handle .data files - return local blob URL to prevent downloads
            if (path.includes("sherpa-onnx-wasm-main-asr.data")) {
              return dataBlobUrl
            }

            // Handle .wasm files - return local blob URL to prevent downloads
            if (path.includes("sherpa-onnx-wasm-main-asr.wasm")) {
              return wasmBlobUrl
            }

            return scriptDirectory + path
          },

          setStatus: (status: string) => {
            // console.log("🔧 WASM Status:", status)
            // Track loading progress based on status messages
            if (status.includes("Downloading")) {
              currentProgressCallback?.(20)
            } else if (status.includes("Preparing")) {
              currentProgressCallback?.(60)
            } else if (status.includes("Running")) {
              currentProgressCallback?.(80)
            }
          },

          onRuntimeInitialized: () => {
            console.log("✅ WASM runtime initialized")
            currentProgressCallback?.(90)
            // Signal that module is ready
            moduleReadyResolve()
          },

          print: () => {
            // console.log("📟 WASM:", text)
          },

          printErr: (text: string) => {
            console.warn("⚠️ WASM Error:", text)
            // Don't fail on print errors, but log them
          },
        }

        // Set up fetch interception to serve cached files only
        setupFetchInterception(modelFolder)

        // Check that all required files are cached
        currentProgressCallback?.(10)

        // Check and create blob URLs for all required files
        const sharedDataUrl = `${SHERPA_BASE_URL}/${SHERPA_SHARED_PATH}/sherpa-onnx-wasm-main-asr.data`
        const wasmUrl = `${SHERPA_BASE_URL}/${modelFolder}/sherpa-onnx-wasm-main-asr.wasm`
        const jsUrl = `${SHERPA_BASE_URL}/${modelFolder}/sherpa-onnx-asr.js`

        // Batch check all required files at once
        const [isDataCached, isWasmCached, isJsCached] = await Promise.all([
          hasCachedFile(sharedDataUrl),
          hasCachedFile(wasmUrl),
          hasCachedFile(jsUrl),
        ])

        if (!isDataCached) {
          throw new Error(
            "Required .data file not cached. Please download the model first."
          )
        }
        if (!isWasmCached) {
          throw new Error(
            "Required .wasm file not cached. Please download the model first."
          )
        }
        if (!isJsCached) {
          throw new Error(
            "Required .js file not cached. Please download the model first."
          )
        }

        console.log("All required files are cached, creating blob URLs")

        // Create blob URLs from cached files in parallel
        currentProgressCallback?.(25)

        // Check if Safari iOS optimization is needed for .data file
        const needsSafariOptimization =
          storageQuotaManager.needsSafariIOSOptimization(sharedDataUrl)

        if (needsSafariOptimization) {
          console.log("Using Safari iOS memory optimization for .data file")
          dataBlobUrl =
            await storageQuotaManager.createSafariIOSBlobUrl(sharedDataUrl)
          if (!dataBlobUrl) {
            throw new Error(
              "Failed to create Safari iOS optimized blob URL for .data file"
            )
          }
        } else {
          // Use regular method for other browsers
          const dataBlob = await getCachedFile(sharedDataUrl)
          if (!dataBlob) {
            throw new Error("Failed to get cached .data file")
          }
          dataBlobUrl = URL.createObjectURL(
            new Blob([dataBlob], { type: "application/octet-stream" })
          )
        }

        // .wasm files are typically smaller, so use regular method
        const wasmBlob = await getCachedFile(wasmUrl)
        if (!wasmBlob) {
          throw new Error("Failed to get cached .wasm file")
        }

        wasmBlobUrl = URL.createObjectURL(
          new Blob([wasmBlob], { type: "application/wasm" })
        )

        // Load scripts in parallel
        currentProgressCallback?.(30)
        await Promise.all([
          loadScriptWithCache(
            getSherpaAssetUrl(`${modelFolder}/sherpa-onnx-asr.js`)
          ),
          loadScriptWithCache(
            getSherpaAssetUrl(`${modelFolder}/sherpa-onnx-wasm-main-asr.js`)
          ),
        ])

        // Wait for module initialization with better timeout handling
        currentProgressCallback?.(60)
        await Promise.race([
          moduleReadyPromise,
          new Promise<never>((_, reject) => {
            setTimeout(
              () =>
                reject(
                  new Error(
                    "Timeout waiting for Sherpa WASM module to initialize"
                  )
                ),
              45000
            ) // 45 seconds
          }),
        ])

        // Verify module is properly initialized
        if (!window.Module?.calledRun) {
          throw new Error("WASM module failed to initialize properly")
        }

        wasmModule = window.Module as SherpaWasmModule

        // Ensure createOnlineRecognizer is available
        if (
          !wasmModule.createOnlineRecognizer &&
          typeof (window as any).createOnlineRecognizer === "function"
        ) {
          wasmModule.createOnlineRecognizer = (
            window as any
          ).createOnlineRecognizer
        }

        currentProgressCallback?.(95)

        // Clean up blob URLs
        URL.revokeObjectURL(dataBlobUrl)
        URL.revokeObjectURL(wasmBlobUrl)

        currentProgressCallback?.(100)
        isLoading = false
        resolve(wasmModule)
      } catch (error) {
        isLoading = false
        currentProgressCallback = null
        console.error("Failed to load Sherpa-ONNX WASM module", { error })

        // Clean up blob URLs on error
        if (dataBlobUrl) URL.revokeObjectURL(dataBlobUrl)
        if (wasmBlobUrl) URL.revokeObjectURL(wasmBlobUrl)

        reject(error)
      }
    }

    loadModule()
  })

  return loadPromise
}

/**
 * Load a script dynamically with IndexedDB caching
 */
async function loadScriptWithCache(src: string): Promise<void> {
  // Check if script is already loaded in DOM
  const existingScript = document.querySelector(
    `script[data-sherpa-src="${src}"]`
  )
  if (existingScript) {
    console.debug("Script already loaded, skipping", { src })
    return
  }

  try {
    // First, check if the script is cached in IndexedDB
    const isCached = await hasCachedFile(src)
    let scriptContent: string

    if (isCached) {
      console.info("Loading script from cache", { src })
      const cachedData = await getCachedFile(src)
      if (cachedData) {
        scriptContent = new TextDecoder().decode(cachedData)
      } else {
        throw new Error("Failed to get cached script content")
      }
    } else {
      // CRITICAL: Script not cached - do NOT download automatically
      // Downloads should only happen via explicit user action in TranscriptionModelDownload
      throw new Error(
        `Required script not cached: ${src}. Please download the model first.`
      )
    }

    // Execute the script content
    const script = document.createElement("script")
    script.setAttribute("data-sherpa-src", src) // Mark with our custom attribute
    script.type = "text/javascript"

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        script.removeEventListener("load", onLoad)
        script.removeEventListener("error", onError)
      }

      const onLoad = () => {
        cleanup()
        resolve()
      }

      const onError = (event: Event | string) => {
        cleanup()
        const errorMsg = `Failed to execute script: ${src}${
          typeof event === "string" ? ` - ${event}` : ""
        }`
        console.error(errorMsg, { src, event })
        reject(new Error(errorMsg))
      }

      script.addEventListener("load", onLoad)
      script.addEventListener("error", onError)

      // Set the script content
      script.textContent = scriptContent

      // Add to DOM to execute
      document.head.appendChild(script)

      // For inline scripts, the load event might not fire reliably
      // Use a small timeout to check if the script executed
      setTimeout(() => {
        // If the script content was set and no error occurred, consider it successful
        if (script.textContent === scriptContent) {
          onLoad()
        }
      }, 100)
    })
  } catch (error) {
    console.error("Failed to load script with cache", { src, error })
    throw error
  }
}

/**
 * Get the loaded WASM module (throws if not loaded)
 */
export function getSherpaWasm(): SherpaWasmModule {
  if (!wasmModule) {
    throw new Error(
      "Sherpa-ONNX WASM module not loaded. Call loadSherpaWasm() first."
    )
  }
  return wasmModule
}

/**
 * Check if the WASM module is loaded
 */
export function isSherpaWasmLoaded(): boolean {
  return wasmModule !== null
}

/**
 * Reset the module loading state (for testing/debugging)
 */
export function resetSherpaWasm(): void {
  wasmModule = null
  isLoading = false
  loadPromise = null
  currentProgressCallback = null

  // Clean up any existing module
  if (window.Module) {
    delete window.Module
  }

  console.info("Sherpa WASM module state reset")
}

/**
 * Setup fetch interception to serve cached WASM and data files
 * CRITICAL: This ONLY serves from cache, NEVER downloads files
 * Downloads should only happen via explicit user action in TranscriptionModelDownload
 */
function setupFetchInterception(modelFolder: string): void {
  // Only set up if not already done
  if ((window as any).__sherpaFetchIntercepted) {
    return
  }

  const originalFetch = window.fetch

  // Store original fetch globally for downloads
  if (typeof window !== "undefined") {
    ;(window as any).__sherpaOriginalFetch = originalFetch
  }

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url

    // Handle .data files with shared caching
    if (
      url.includes(".data") &&
      (url.includes("sherpa-onnx-") || url.includes(`/${modelFolder}/`))
    ) {
      try {
        console.info("Processing .data file request", { url })

        // Use shared cache key for all Sherpa .data files
        const sharedDataUrl = `${SHERPA_BASE_URL}/${SHERPA_SHARED_PATH}/sherpa-onnx-wasm-main-asr.data`

        // Check if already cached
        const isCached = await hasCachedFile(sharedDataUrl)
        if (isCached) {
          console.info("Loading .data file from cache", {
            url,
            sharedUrl: sharedDataUrl,
          })
          const cachedData = await getCachedFile(sharedDataUrl)
          if (cachedData) {
            return new Response(cachedData, {
              status: 200,
              statusText: "OK",
              headers: {
                "Content-Type": "application/octet-stream",
                "Content-Length": cachedData.byteLength.toString(),
              },
            })
          }
        }

        // CRITICAL: NOT cached - return 404 instead of downloading
        // Downloads should only happen via explicit user action
        console.warn("Required .data file not cached, cannot serve", {
          url,
          sharedUrl: sharedDataUrl,
        })
        return new Response("File not cached", {
          status: 404,
          statusText: "Not Found",
        })
      } catch (error) {
        console.warn("Error in .data file caching", { url, error })
        return new Response("Error accessing cache", {
          status: 500,
          statusText: "Internal Server Error",
        })
      }
    }

    // Handle .wasm files with model-specific caching
    if (url.includes("sherpa-onnx-") && url.includes(".wasm")) {
      try {
        console.info("Processing .wasm file request", { url })

        // Check if already cached
        const isCached = await hasCachedFile(url)
        if (isCached) {
          console.info("Loading .wasm file from cache", { url })
          const cachedData = await getCachedFile(url)
          if (cachedData) {
            return new Response(cachedData, {
              status: 200,
              statusText: "OK",
              headers: {
                "Content-Type": "application/wasm",
                "Content-Length": cachedData.byteLength.toString(),
              },
            })
          }
        }

        // CRITICAL: NOT cached - return 404 instead of downloading
        // Downloads should only happen via explicit user action
        console.warn("Required .wasm file not cached, cannot serve", { url })
        return new Response("File not cached", {
          status: 404,
          statusText: "Not Found",
        })
      } catch (error) {
        console.warn("Error in .wasm file caching", { url, error })
        return new Response("Error accessing cache", {
          status: 500,
          statusText: "Internal Server Error",
        })
      }
    }

    // For all other files, use normal fetch
    return originalFetch(input, init)
  }

  // Mark as intercepted
  ;(window as any).__sherpaFetchIntercepted = true
}
