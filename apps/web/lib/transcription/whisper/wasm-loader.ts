// WASM module loader for whisper.cpp with mobile support
// Refactored and cleaned version from wasm-loader-old.ts

import { config } from "@/lib/config"
import { wasmLogger } from "@/lib/logger"
import { detectBrowser, logBrowserInfo } from "@/lib/utils"

// Global declarations
declare global {
  interface Window {
    Module: any
  }
}

export interface WasmModule {
  /**
   * Initialize a new Whisper instance with the loaded model
   * @param modelPath - Path to the whisper model file (usually "whisper.bin")
   * @returns Whisper instance handle for use with other functions
   */
  init: (modelPath: string) => any

  /**
   * Remove a file from the WASM filesystem
   * @param path - Path of the file to remove
   */
  FS_unlink: (path: string) => void

  /**
   * Create a file in the WASM filesystem with provided data
   * @param parent - Parent directory path (usually "/")
   * @param name - File name
   * @param data - File data as Uint8Array
   * @param canRead - Whether file is readable
   * @param canWrite - Whether file is writable
   */
  FS_createDataFile: (
    parent: string,
    name: string,
    data: Uint8Array,
    canRead: boolean,
    canWrite: boolean
  ) => void

  /**
   * Stream audio data to the Whisper instance for real-time transcription
   *
   * This function accumulates audio samples in an internal buffer (`g_pcmf32`)
   * that gets processed by the Whisper engine in 5-second windows. The audio
   * processing follows this flow:
   *
   * 1. Audio samples are appended to the global buffer
   * 2. When buffer reaches minimum size (1024 samples), processing begins
   * 3. Audio is processed in overlapping 5-second windows (80,000 samples at 16kHz)
   * 4. Transcription results are made available via `get_transcribed()`
   *
   * Based on whisper.cpp/examples/stream.wasm implementation:
   * - Uses 5-second processing windows for continuous transcription
   * - Maintains audio context across chunks for better word boundary detection
   * - Optimized for real-time streaming with minimal latency
   *
   * @param instance - Whisper instance handle from `init()`
   * @param audioData - PCM audio data at 16kHz sample rate (Float32Array)
   * @returns 0 on success, negative value on error (-1: invalid index, -2: null context)
   *
   * @example
   * ```typescript
   * // Stream audio from ScriptProcessorNode
   * scriptNode.onaudioprocess = (event) => {
   *   const channelData = event.inputBuffer.getChannelData(0)
   *   const result = wasmModule.set_audio(instance, channelData)
   *   if (result !== 0) {
   *     console.warn('Audio processing error:', result)
   *   }
   * }
   * ```
   */
  set_audio: (instance: any, audioData: Float32Array) => number

  /**
   * Get the latest transcription result from the Whisper instance
   *
   * This function returns transcribed text that has been processed from
   * the audio data submitted via `set_audio()`. The text is cleared after
   * each call, so results should be accumulated externally if needed.
   *
   * @returns Latest transcribed text, or empty string if no new transcription
   */
  get_transcribed: () => string

  /**
   * Get the current status of the Whisper processing engine
   *
   * Returns status information about the current processing state,
   * such as "waiting for audio...", "running whisper...", etc.
   *
   * @returns Status object with current processing state
   */
  get_status: () => any

  /**
   * Free a Whisper instance and its associated memory
   *
   * This should be called when switching models or cleaning up to prevent
   * memory leaks. The instance becomes invalid after calling this function.
   *
   * @param instance - Whisper instance handle from `init()` to free
   */
  free: (instance: any) => void
}

/**
 * Diagnose cross-origin isolation and SharedArrayBuffer support
 * This is critical for WASM threading and shared memory to work on mobile
 */
export function diagnoseCrossOriginIsolation(): {
  crossOriginIsolated: boolean
  sharedArrayBufferSupported: boolean
  headers: { [key: string]: string }
  recommendations: string[]
} {
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined"
  const isCrossOriginIsolated =
    typeof window !== "undefined" ? Boolean(window.crossOriginIsolated) : false

  const recommendations: string[] = []
  const headers: { [key: string]: string } = {}

  if (typeof window !== "undefined") {
    // Check current page headers (best effort)
    const meta = document.querySelector(
      'meta[http-equiv="Cross-Origin-Opener-Policy"]'
    )
    if (meta) {
      headers["Cross-Origin-Opener-Policy"] = meta.getAttribute("content") || ""
    }
  }

  if (!isCrossOriginIsolated) {
    recommendations.push(
      "Cross-origin isolation is not enabled. This prevents SharedArrayBuffer usage and WASM threading."
    )
    recommendations.push(
      "Ensure your server sends: Cross-Origin-Opener-Policy: same-origin"
    )
    recommendations.push(
      "Ensure your server sends: Cross-Origin-Embedder-Policy: require-corp"
    )
  }

  if (!hasSharedArrayBuffer) {
    recommendations.push(
      "SharedArrayBuffer is not available. This may be due to missing cross-origin isolation or browser security settings."
    )
    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:"
    ) {
      recommendations.push(
        "SharedArrayBuffer requires HTTPS in most browsers. Try using HTTPS or localhost."
      )
    }
  }

  return {
    crossOriginIsolated: isCrossOriginIsolated,
    sharedArrayBufferSupported: hasSharedArrayBuffer,
    headers,
    recommendations,
  }
}

/**
 * Load and initialize the WASM module for Whisper
 */
export async function loadWasmModule(): Promise<WasmModule> {
  // Return cached module if already loaded
  if (window.Module?.init) {
    wasmLogger.debug("WASM module already loaded, returning cached")
    return window.Module as WasmModule
  }

  try {
    wasmLogger.info("Starting WASM module loading")

    // Get browser configuration
    const coiDiagnosis = diagnoseCrossOriginIsolation()

    logBrowserInfo()

    // Log cross-origin isolation status
    wasmLogger.info("Cross-origin isolation diagnosis", {
      crossOriginIsolated: coiDiagnosis.crossOriginIsolated,
      sharedArrayBufferSupported: coiDiagnosis.sharedArrayBufferSupported,
      recommendations: coiDiagnosis.recommendations,
    })

    // Warn if cross-origin isolation is missing (required for both builds)
    if (!coiDiagnosis.crossOriginIsolated) {
      wasmLogger.warn(
        "Cross-origin isolation not enabled - both desktop and mobile WASM builds require SharedArrayBuffer for pthread support",
        { recommendations: coiDiagnosis.recommendations }
      )
    }

    // Load the WASM module script directly (both builds are threaded with pthreads)
    wasmLogger.info("Loading WASM module script")
    await loadWasmScript()

    wasmLogger.info("WASM initialization complete")
    return window.Module as WasmModule
  } catch (error) {
    wasmLogger.error("WASM loading error", { error })
    throw error
  }
}

async function loadWasmScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      wasmLogger.error("WASM loading timeout after 30 seconds")
      reject(new Error("WASM module loading timeout"))
    }, 30000)

    // Track initialization state
    let runtimeInitialized = false

    // Determine which WASM module to use based on browser capabilities and environment
    const browserInfo = detectBrowser()
    const coiDiagnosis = diagnoseCrossOriginIsolation()

    // Use mobile WASM if optimized for mobile/limited environments
    const shouldUseMobile =
      browserInfo.isMobile ||
      browserInfo.isIOS ||
      !coiDiagnosis.crossOriginIsolated ||
      !coiDiagnosis.sharedArrayBufferSupported

    const wasmScriptPath = shouldUseMobile
      ? "/wasm/stream-mobile.js"
      : "/wasm/stream.js"

    // Log memory requirements for the selected build
    const memoryRequirements = shouldUseMobile
      ? { initial: "256MB", maximum: "1024MB", threads: 4 }
      : { initial: "1024MB", maximum: "2048MB", threads: 8 }

    wasmLogger.info("Selecting WASM module", {
      path: wasmScriptPath,
      shouldUseMobile: shouldUseMobile,
      memoryRequirements,
      reason: shouldUseMobile
        ? "mobile threaded (mobile device with 4 threads + ENVIRONMENT=web,worker)"
        : "desktop threaded (8 threads with full COI support)",
    })

    // Check if we can meet memory requirements
    const requiredMemory = shouldUseMobile ? 128 : 1024 // Reduce mobile requirement to 128MB
    const perfMemoryCheck = (performance as any).memory
    if (perfMemoryCheck) {
      const availableMemory = Math.round(
        perfMemoryCheck.jsHeapSizeLimit / 1024 / 1024
      )

      wasmLogger.info("Memory availability check", {
        availableMemoryMB: availableMemory,
        requiredMemoryMB: requiredMemory,
        canMeetRequirements: availableMemory >= requiredMemory,
      })

      if (availableMemory < requiredMemory) {
        wasmLogger.error("Insufficient memory for WASM module", {
          available: availableMemory + "MB",
          required: requiredMemory + "MB",
          suggestion: shouldUseMobile
            ? "Your browser/device has very limited memory. Try closing other tabs or applications, or use a device with more available RAM."
            : "Consider using a mobile build or device with more memory.",
        })

        clearTimeout(timeout)
        reject(
          new Error(
            `Insufficient memory for Whisper.cpp WASM: Available ${availableMemory}MB, need ${requiredMemory}MB. ${
              shouldUseMobile
                ? "Even the mobile WASM build requires significant memory. Try closing other browser tabs/apps, or consider using a Sherpa model instead which has lower memory requirements."
                : "Try using the mobile WASM build or consider Sherpa models for lower memory usage."
            }`
          )
        )
        return
      }
    } else {
      // If we can't check memory, but we know mobile builds need significant memory, warn aggressively
      wasmLogger.warn(
        "Cannot check memory availability - WASM builds require significant memory",
        {
          requiredMemory: requiredMemory + "MB",
          recommendation: shouldUseMobile
            ? "Mobile WASM still needs ~128MB+. If you get 'Out of memory' errors, try Sherpa models instead."
            : "Desktop WASM needs ~1GB+. Consider mobile build or Sherpa models for lower memory usage.",
        }
      )
    }

    // Setup Module configuration BEFORE loading the script (minimal config like reference)
    wasmLogger.debug("Setting up Module configuration")

    window.Module = {
      // Minimal configuration to reduce memory pressure
      locateFile: (path: string) => {
        if (path.endsWith(".wasm")) {
          const wasmPath = shouldUseMobile
            ? "/wasm/stream-mobile.wasm"
            : "/wasm/stream.wasm"
          wasmLogger.debug("Locating WASM file", {
            requested: path,
            resolved: wasmPath,
          })
          return wasmPath
        }
        return path
      },

      // Conservative memory settings to reduce allocation pressure
      ...(shouldUseMobile && {
        INITIAL_MEMORY: 64 * 1024 * 1024, // Start with 64MB instead of 256MB
        MAXIMUM_MEMORY: 256 * 1024 * 1024, // Cap at 256MB instead of 1024MB
        ALLOW_MEMORY_GROWTH: true,
      }),

      print: (text: string) => wasmLogger.verbose("WASM output", { text }),
      printErr: (text: string) => {
        // Filter out common non-error messages
        if (
          text.includes("error") ||
          text.includes("failed") ||
          text.includes("abort") ||
          text.includes("LinkError") ||
          text.includes("Memory import")
        ) {
          wasmLogger.error("WASM error output", { text })
        } else {
          wasmLogger.debug("WASM info", { text })
        }
      },
      setStatus: (text: string) => {
        wasmLogger.debug("WASM status", { text })
      },
      monitorRunDependencies: (left: number) => {
        wasmLogger.debug("WASM dependencies", { left })
      },
      preRun: () => {
        wasmLogger.debug("WASM preparing...")
      },
      postRun: () => {
        wasmLogger.info("WASM initialized successfully!")
        setTimeout(() => {
          runtimeInitialized = true
          clearTimeout(timeout)
          resolve()
        }, 100)
      },
      onRuntimeInitialized: () => {
        wasmLogger.info("WASM runtime initialized!")
      },
      onAbort: (what: any) => {
        wasmLogger.error("WASM aborted", { what })
        clearTimeout(timeout)

        // Provide specific error messages based on the failure type
        if (typeof what === "string") {
          if (what.includes("Memory import") && what.includes("size")) {
            reject(
              new Error(
                shouldUseMobile
                  ? "WASM mobile memory error. The mobile WASM module (256MB-1024MB) requires more memory than available. Try closing other apps or use a device with more RAM."
                  : "WASM desktop memory error. The desktop WASM module (1024MB-2048MB) requires more memory than available. Try closing other applications or use a system with more available RAM."
              )
            )
          } else if (
            what.includes("Memory import") ||
            what.includes("LinkError")
          ) {
            reject(
              new Error(
                "WASM threading error. Both mobile and desktop builds require SharedArrayBuffer and cross-origin isolation for pthread support. Your environment doesn't support the required threading features. Enable COI headers or use the COI ServiceWorker to fix this issue."
              )
            )
          } else if (what.includes("memory")) {
            const memoryRange = shouldUseMobile
              ? "256MB-1024MB"
              : "1024MB-2048MB"
            reject(
              new Error(
                `WASM memory allocation failed. Your browser/device may not support the required ${memoryRange} memory allocation for ${shouldUseMobile ? "mobile" : "desktop"} threading. ` +
                  "Try using a browser with more available memory or enable cross-origin isolation."
              )
            )
          } else {
            reject(new Error("WASM module aborted: " + what))
          }
        } else {
          reject(new Error("WASM module aborted: " + what))
        }
      },
    }

    // Load the script
    const script = document.createElement("script")
    script.src = wasmScriptPath

    script.onload = () => {
      wasmLogger.debug(`${wasmScriptPath} script loaded successfully`)
      wasmLogger.info("Waiting for WASM runtime initialization...")

      // Add delay to show loading state
      setTimeout(() => {
        wasmLogger.debug("WASM script loaded, initializing runtime...")
      }, 300)

      // Additional check after script loads
      setTimeout(() => {
        if (!runtimeInitialized) {
          wasmLogger.warn(
            "5 seconds after script load, runtime still not initialized",
            {
              exists: !!window.Module,
              hasInit: !!(window.Module && window.Module.init),
              hasFS: !!(window.Module && window.Module.FS),
            }
          )
        }
      }, 5000)
    }

    script.onerror = (error) => {
      wasmLogger.error(`Failed to load ${wasmScriptPath}`, { error })
      clearTimeout(timeout)
      reject(new Error("Failed to load WASM module script"))
    }

    wasmLogger.debug(`Adding ${wasmScriptPath} script to document head`)

    // Log memory info before loading WASM
    const perfMemory = (performance as any).memory
    if (perfMemory) {
      wasmLogger.debug("Memory before WASM load", {
        usedJSHeapSize:
          Math.round(perfMemory.usedJSHeapSize / 1024 / 1024) + "MB",
        totalJSHeapSize:
          Math.round(perfMemory.totalJSHeapSize / 1024 / 1024) + "MB",
        jsHeapSizeLimit:
          Math.round(perfMemory.jsHeapSizeLimit / 1024 / 1024) + "MB",
      })
    }

    // Check if WASM files exist before loading
    wasmLogger.debug("Checking WASM file availability", { wasmScriptPath })

    document.head.appendChild(script)
  })
}
