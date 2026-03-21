// Model loading and management for Whisper
import { modelLogger } from "@/lib/logger"
import { loadRemoteModel } from "./wasm-helpers"
import type { WasmModule } from "./wasm-loader"

// Whisper model configuration
export const WHISPER_MODELS = {
  "tiny-en-q5_1": {
    url: "https://whisper.ggerganov.com/ggml-model-whisper-tiny.en-q5_1.bin",
    size: 31, // MB
    name: "Tiny EN",
    description: "English-only, fast and lightweight",
  },
  "base-en-q5_1": {
    url: "https://whisper.ggerganov.com/ggml-model-whisper-base.en-q5_1.bin",
    size: 57, // MB
    name: "Base EN",
    description: "English-only, fast and lightweight, good accuracy",
  },
  // CANNOT support small models, small is too slow already for real-time transcription
  // "small-en-q5_1": {
  //   url: "https://whisper.ggerganov.com/ggml-model-whisper-small.en-q5_1.bin",
  //   size: 182, // MB
  //   name: "Small EN",
  //   description:
  //     "English-only, better accuracy, recommended for desktop device",
  // },
  // CANNOT support language other than English (since other language results are bad...)
  // "small-q5_1": {
  //   url: "https://whisper.ggerganov.com/ggml-model-whisper-small-q5_1.bin",
  //   size: 182, // MB
  //   name: "Small Multilingual",
  //   description: "Multilingual, good accuracy",
  // },
  // CANNOT support medium models, they are too demanding for most devices (even using 8 threads the result will be very slow)
  // "medium-en-q5_0": {
  //   url: "https://whisper.ggerganov.com/ggml-model-whisper-medium.en-q5_0.bin",
  //   size: 515, // MB
  //   name: "Medium EN",
  //   description: "English-only, better accuracy, only for high-end devices",
  // },
  // "medium-q5_0": {
  //   url: "https://whisper.ggerganov.com/ggml-model-whisper-medium-q5_0.bin",
  //   size: 515, // MB
  //   name: "Medium Multilingual",
  //   description: "Multilingual, better accuracy, only for high-end devices",
  // },
} as const

export type ModelName = keyof typeof WHISPER_MODELS

export interface ModelLoadCallbacks {
  onProgress: (progress: number) => void
  onComplete: () => void
  onError: (error: string) => void
}

/**
 * Load a Whisper model into the WASM filesystem
 */
export async function loadWhisperModel(
  modelName: ModelName,
  wasmModule: WasmModule,
  callbacks: ModelLoadCallbacks,
  showConfirmDialog?: (message: string) => Promise<boolean>
): Promise<void> {
  try {
    modelLogger.info("Starting model load", { modelName })

    const modelConfig = WHISPER_MODELS[modelName]
    modelLogger.debug("Model config", modelConfig)

    return new Promise<void>((resolve, reject) => {
      let lastLoggedProgress = -1

      const onProgress = (progress: number) => {
        const progressPercent = Math.round(progress * 100)

        // Only log every 10% to reduce console output
        if (
          progressPercent >= lastLoggedProgress + 10 ||
          progressPercent === 0 ||
          progressPercent === 100
        ) {
          modelLogger.debug("Model load progress", { progressPercent })
          lastLoggedProgress = progressPercent
        }

        callbacks.onProgress(progressPercent)
      }

      const onReady = (dst: string, buffer: ArrayBuffer) => {
        try {
          modelLogger.info("Model download complete", {
            size: buffer.byteLength,
            destination: dst,
          })

          // Remove existing model file if it exists
          try {
            wasmModule.FS_unlink("whisper.bin")
            modelLogger.debug("Removed existing whisper.bin")
          } catch {
            modelLogger.debug("No existing whisper.bin file to remove")
          }

          // Store model in WASM filesystem
          modelLogger.debug("Creating WASM file system entry")
          wasmModule.FS_createDataFile(
            "/",
            "whisper.bin",
            new Uint8Array(buffer),
            true,
            true
          )

          modelLogger.info("Model loaded successfully into WASM filesystem")
          callbacks.onProgress(100)
          callbacks.onComplete()
          resolve()
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error"
          modelLogger.error("Error storing model in WASM filesystem", {
            error,
          })
          callbacks.onError(errorMessage)
          reject(new Error(errorMessage))
        }
      }

      const onCancel = () => {
        const message = "Model loading cancelled"
        modelLogger.info(message)
        callbacks.onProgress(0)
        callbacks.onError(message)
        reject(new Error(message))
      }

      const onPrint = (text: string) => {
        modelLogger.debug("Model loading message", { text })
      }

      modelLogger.debug("Starting model download", {
        url: modelConfig.url,
        filename: "whisper.bin",
        size: modelConfig.size,
      })

      loadRemoteModel(
        modelConfig.url,
        "whisper.bin",
        modelConfig.size,
        onProgress,
        onReady,
        onCancel,
        onPrint,
        showConfirmDialog
      )
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load model"
    modelLogger.error("Model loading error", { error, modelName })
    callbacks.onError(errorMessage)
    throw new Error(errorMessage)
  }
}
