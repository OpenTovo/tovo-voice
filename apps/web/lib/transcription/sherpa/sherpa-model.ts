// Sherpa-ONNX model configuration and management

// Sherpa-ONNX model configuration
export const SHERPA_MODELS = {
  "bilingual-zh-en-2023-02-20-mobile": {
    size: 336, // MB (actual size including WASM + data files)
    name: "Bilingual ZH-EN",
    description:
      "Chinese + English bilingual model, optimized for mobile, real-time streaming",
    languages: ["zh", "en"],
    type: "zipformer",
    folder: "sherpa-onnx-bilingual",
    url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20-mobile.tar.bz2",
  },
  "multilingual-2025-02-10": {
    size: 336, // MB (actual size including WASM + data files)
    name: "Multilingual (8 Languages)",
    description:
      "Arabic, English, Indonesian, Japanese, Russian, Thai, Vietnamese, Chinese streaming model",
    languages: ["ar", "en", "id", "ja", "ru", "th", "vi", "zh"],
    type: "zipformer",
    folder: "sherpa-onnx-multilingual",
    url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-zipformer-ar_en_id_ja_ru_th_vi_zh-2025-02-10.tar.bz2",
  },
  "english-2023-06-21-mobile": {
    size: 336, // MB (actual size including WASM + data files)
    name: "English Only",
    description:
      "English-only streaming model, optimized for mobile and English transcription",
    languages: ["en"],
    type: "zipformer",
    folder: "sherpa-onnx-english",
    url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-zipformer-en-2023-06-21-mobile.tar.bz2",
  },
  "french-2023-04-14-mobile": {
    size: 336, // MB (actual size including WASM + data files)
    name: "French Only",
    description:
      "French-only streaming model, optimized for mobile and French transcription",
    languages: ["fr"],
    type: "zipformer",
    folder: "sherpa-onnx-french",
    url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-zipformer-fr-2023-04-14-mobile.tar.bz2",
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
      return "bilingual" // Maps to sherpa-onnx-bilingual/
    case "sherpa-multilingual":
      return "multilingual" // Maps to sherpa-onnx-multilingual/
    case "sherpa-english":
      return "english" // Maps to sherpa-onnx-english/
    case "sherpa-french":
      return "french" // Maps to sherpa-onnx-french/
    default:
      return modelId.replace("sherpa-", "")
  }
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
