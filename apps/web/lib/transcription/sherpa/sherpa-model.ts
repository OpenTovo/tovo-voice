// Sherpa-ONNX model configuration and management

// Sherpa-ONNX model configuration
export const SHERPA_MODELS = {
  "bilingual-zh-en-2023-02-20": {
    size: 219, // MB (complete staged WASM package, rounded up)
    name: "Bilingual ZH-EN",
    description: "Chinese + English bilingual model with real-time streaming",
    languages: ["zh", "en"],
    type: "zipformer",
    folder: "sherpa-onnx-bilingual",
    url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20.tar.bz2",
  },
  "en-20m-2023-02-17": {
    size: 122, // MB (complete staged WASM package, rounded up)
    name: "English 20M",
    description: "Lightweight English-only model (20M params) with real-time streaming",
    languages: ["en"],
    type: "zipformer",
    folder: "sherpa-onnx-en-20m",
    url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-zipformer-en-20M-2023-02-17.tar.bz2",
  },
} as const

export type SherpaModelName = keyof typeof SHERPA_MODELS

/**
 * Get the short name for a Sherpa model ID
 * Maps unified model IDs to their corresponding folder names
 */
export function getModelShortName(modelId: string): string {
  switch (modelId) {
    case "sherpa-bilingual":
      return "bilingual"
    case "sherpa-en-20m":
      return "en-20m"
    default:
      return modelId.replace("sherpa-", "")
  }
}

export function getSherpaModelFolder(modelId: string): string {
  return `sherpa-onnx-${getModelShortName(modelId)}`
}

export interface SherpaModelLoadCallbacks {
  onProgress: (progress: number) => void
  onComplete: () => void
  onError: (error: string) => void
}

/**
 * Load a Sherpa-ONNX model (models are embedded in the WASM data file)
 */
export async function loadSherpaModel(
  modelName: SherpaModelName,
  callbacks: SherpaModelLoadCallbacks
): Promise<void> {
  try {
    console.log("Loading Sherpa-ONNX model", { modelName })

    const modelConfig = SHERPA_MODELS[modelName]
    if (!modelConfig) {
      throw new Error(`Unknown Sherpa model: ${modelName}`)
    }

    // Sherpa models are embedded in the WASM data file
    // so we just need to verify the WASM module is loaded
    callbacks.onProgress(50)

    // Simulate loading process
    await new Promise((resolve) => setTimeout(resolve, 100))

    callbacks.onProgress(100)
    callbacks.onComplete()

    console.log("Sherpa-ONNX model loaded successfully", { modelName })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load Sherpa model"
    console.error("Sherpa model loading error", { error, modelName })
    callbacks.onError(errorMessage)
    throw new Error(errorMessage)
  }
}
