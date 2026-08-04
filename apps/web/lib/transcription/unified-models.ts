/**
 * Unified transcription model interface
 *
 * This interface keeps model selection independent from the active ASR engine.
 */

import { TranscriptionEngine } from "./constants"
import { SHERPA_MODELS, type SherpaModelName } from "./sherpa/sherpa-model"

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
  "sherpa-bilingual": {
    id: "sherpa-bilingual",
    name: "Bilingual ZH-EN",
    displayName: "ZH+EN",
    description: "Chinese + English bilingual model with real-time streaming",
    engine: TranscriptionEngine.SHERPA,
    size: SHERPA_MODELS["bilingual-zh-en-2023-02-20"].size,
    languages: ["zh", "en"],
    isRealTime: true,
    sherpaConfig: {
      modelName: "bilingual-zh-en-2023-02-20",
    },
  },
} as const

export type UnifiedModelId = keyof typeof UNIFIED_MODELS

/**
 * Get default model ID based on current transcription engine
 */
export function getDefaultModelId(engine: TranscriptionEngine): UnifiedModelId {
  switch (engine) {
    case TranscriptionEngine.SHERPA:
      return "sherpa-bilingual"
    default:
      return "sherpa-bilingual"
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
