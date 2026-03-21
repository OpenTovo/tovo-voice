/**
 * Unified transcription model interface
 *
 * This interface abstracts over different transcription engines (Whisper, Sherpa-ONNX)
 * providing a consistent API for model selection, loading, and configuration.
 */

import { TranscriptionEngine } from "./constants"
import { SHERPA_MODELS, type SherpaModelName } from "./sherpa/sherpa-model"
import {
  WHISPER_MODELS,
  type ModelName as WhisperModelName,
} from "./whisper/whisper-model"

/**
 * Unified model configuration
 */
export interface UnifiedModelConfig {
  id: string
  name: string
  displayName: string // Short name for UI badges and compact displays
  description: string
  engine: TranscriptionEngine
  size: number // MB
  languages: string[]
  isRealTime: boolean
  // Engine-specific data
  whisperConfig?: {
    modelName: WhisperModelName
    url: string
  }
  sherpaConfig?: {
    modelName: SherpaModelName
  }
}

/**
 * Model loading callbacks
 */
export interface ModelLoadCallbacks {
  onProgress: (progress: number) => void
  onComplete: () => void
  onError: (error: string) => void
}

/**
 * Unified model registry
 * Maps all available models from different engines into a consistent format
 */
export const UNIFIED_MODELS: Record<string, UnifiedModelConfig> = {
  // Whisper models
  "whisper-tiny-en": {
    id: "whisper-tiny-en",
    name: "Whisper Tiny EN",
    displayName: "Tiny EN",
    description: "English-only, fast and lightweight",
    engine: TranscriptionEngine.WHISPER,
    size: WHISPER_MODELS["tiny-en-q5_1"].size,
    languages: ["en"],
    isRealTime: false,
    whisperConfig: {
      modelName: "tiny-en-q5_1",
      url: WHISPER_MODELS["tiny-en-q5_1"].url,
    },
  },
  "whisper-base-en": {
    id: "whisper-base-en",
    name: "Whisper Base EN",
    displayName: "Base EN",
    description: "English-only, good accuracy",
    engine: TranscriptionEngine.WHISPER,
    size: WHISPER_MODELS["base-en-q5_1"].size,
    languages: ["en"],
    isRealTime: false,
    whisperConfig: {
      modelName: "base-en-q5_1",
      url: WHISPER_MODELS["base-en-q5_1"].url,
    },
  },

  // Sherpa-ONNX models (Primary transcription engine)
  "sherpa-bilingual": {
    id: "sherpa-bilingual",
    name: "Bilingual ZH-EN",
    displayName: "ZH+EN",
    description:
      "Chinese + English bilingual model, optimized for mobile, real-time streaming",
    engine: TranscriptionEngine.SHERPA,
    size: SHERPA_MODELS["bilingual-zh-en-2023-02-20-mobile"].size,
    languages: ["zh", "en"],
    isRealTime: true,
    sherpaConfig: {
      modelName: "bilingual-zh-en-2023-02-20-mobile",
    },
  },
  "sherpa-multilingual": {
    id: "sherpa-multilingual",
    name: "Multilingual (8 Languages)",
    displayName: "Multi-Lang",
    description:
      "Arabic, English, Indonesian, Japanese, Russian, Thai, Vietnamese, Chinese streaming model",
    engine: TranscriptionEngine.SHERPA,
    size: SHERPA_MODELS["multilingual-2025-02-10"].size,
    languages: ["ar", "en", "id", "ja", "ru", "th", "vi", "zh"],
    isRealTime: true,
    sherpaConfig: {
      modelName: "multilingual-2025-02-10",
    },
  },
  "sherpa-english": {
    id: "sherpa-english",
    name: "English Only",
    displayName: "English",
    description:
      "English-only streaming model, optimized for mobile and English transcription",
    engine: TranscriptionEngine.SHERPA,
    size: SHERPA_MODELS["english-2023-06-21-mobile"].size,
    languages: ["en"],
    isRealTime: true,
    sherpaConfig: {
      modelName: "english-2023-06-21-mobile",
    },
  },
  "sherpa-french": {
    id: "sherpa-french",
    name: "French Only",
    displayName: "French",
    description:
      "French-only streaming model, optimized for mobile and French transcription",
    engine: TranscriptionEngine.SHERPA,
    size: SHERPA_MODELS["french-2023-04-14-mobile"].size,
    languages: ["fr"],
    isRealTime: true,
    sherpaConfig: {
      modelName: "french-2023-04-14-mobile",
    },
  },
} as const

export type UnifiedModelId = keyof typeof UNIFIED_MODELS

/**
 * Get default model ID based on current transcription engine
 */
export function getDefaultModelId(engine: TranscriptionEngine): UnifiedModelId {
  switch (engine) {
    case TranscriptionEngine.WHISPER:
      return "whisper-base-en"
    case TranscriptionEngine.SHERPA:
      return "sherpa-bilingual" // Primary: Bilingual for main target users (ZH+EN)
    default:
      return "sherpa-bilingual" // Default to Sherpa bilingual
  }
}

/**
 * Get models available for a specific engine
 */
export function getModelsForEngine(
  engine: TranscriptionEngine
): UnifiedModelConfig[] {
  return Object.values(UNIFIED_MODELS).filter(
    (model) => model.engine === engine
  )
}

/**
 * Get all available models
 */
export function getAllModels(): UnifiedModelConfig[] {
  return Object.values(UNIFIED_MODELS)
}

/**
 * Get model configuration by ID
 */
export function getModelById(id: UnifiedModelId): UnifiedModelConfig {
  const model = UNIFIED_MODELS[id]
  if (!model) {
    throw new Error(`Model not found: ${id}`)
  }
  return model
}
