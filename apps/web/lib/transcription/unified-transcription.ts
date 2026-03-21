/**
 * Unified Transcription Factory - Real-time Audio Transcription Engine Management
 *
 * Creates and manages transcription engines based on configuration.
 * Provides a single entry point for all transcription functionality.
 *
 * ARCHITECTURE:
 * - UnifiedTranscriptionManager: Handles engines, model loading, real-time transcription
 * - TranscriptionHistoryManager: Handles storage, session history, UI display (separate)
 *
 * Use with useUnifiedTranscription() hook for React integration.
 */

import { TRANSCRIPTION_ENGINE, TranscriptionEngine } from "./constants"
import { SherpaTranscriptionEngine } from "./sherpa/sherpa-engine"
import {
  type EngineRegistry,
  type ITranscriptionEngine,
  type TranscriptionCallbacks,
  TranscriptionStatus,
} from "./transcription-interface"
import {
  getDefaultModelId,
  getModelById,
  type ModelLoadCallbacks,
  type UnifiedModelConfig,
  type UnifiedModelId,
} from "./unified-models"
import { WhisperTranscriptionEngine } from "./whisper/whisper-engine"

/**
 * Lazy-loaded engine factories
 */
const engineFactories: EngineRegistry = {
  [TranscriptionEngine.WHISPER]: async () => {
    return new WhisperTranscriptionEngine()
  },
  [TranscriptionEngine.SHERPA]: async () => {
    return new SherpaTranscriptionEngine()
  },
}

/**
 * Unified transcription manager
 * Manages the current transcription engine and provides a consistent API
 */
export class UnifiedTranscriptionManager {
  private currentEngine: ITranscriptionEngine | null = null
  private engineType: TranscriptionEngine = TRANSCRIPTION_ENGINE

  /**
   * Get current engine type
   */
  get currentEngineType(): TranscriptionEngine {
    return this.engineType
  }

  /**
   * Get current engine status
   */
  get status(): TranscriptionStatus {
    return this.currentEngine?.status ?? TranscriptionStatus.IDLE
  }

  /**
   * Get current model
   */
  get currentModel(): UnifiedModelConfig | null {
    return this.currentEngine?.currentModel ?? null
  }

  /**
   * Check if engine supports real-time transcription
   */
  get supportsRealTime(): boolean {
    return this.currentEngine?.supportsRealTime ?? false
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return (
      this.currentEngine?.getStats() ?? {
        utteranceCount: 0,
        finalResultCount: 0,
        averageProcessingTime: 0,
        currentState: TranscriptionStatus.IDLE,
        recordingDuration: 0,
      }
    )
  }

  /**
   * Switch to a different transcription engine
   */
  async switchEngine(newEngine: TranscriptionEngine): Promise<void> {
    if (this.engineType === newEngine && this.currentEngine) {
      return // Already using the requested engine
    }

    // Clean up current engine
    if (this.currentEngine) {
      await this.currentEngine.cleanup()
      this.currentEngine = null
    }

    // Create new engine
    this.engineType = newEngine
    this.currentEngine = await this.createEngine(newEngine)
  }

  /**
   * Load a model
   */
  async loadModel(
    modelId: UnifiedModelId,
    callbacks: ModelLoadCallbacks
  ): Promise<void> {
    // Get model configuration to determine the required engine
    const modelConfig = getModelById(modelId)
    const requiredEngine = modelConfig.engine

    // Switch to the required engine if needed
    if (this.engineType !== requiredEngine || !this.currentEngine) {
      await this.switchEngine(requiredEngine)
    }

    if (!this.currentEngine) {
      throw new Error("Failed to create transcription engine")
    }

    await this.currentEngine.loadModel(modelId, callbacks)
  }

  /**
   * Load default model for current engine
   */
  async loadDefaultModel(callbacks: ModelLoadCallbacks): Promise<void> {
    const defaultModelId = getDefaultModelId(this.engineType)
    await this.loadModel(defaultModelId, callbacks)
  }

  /**
   * Unload current model
   */
  async unloadModel(): Promise<void> {
    if (this.currentEngine) {
      await this.currentEngine.unloadModel()
    }
  }

  /**
   * Start recording and transcription
   */
  async startRecording(callbacks: TranscriptionCallbacks): Promise<void> {
    if (!this.currentEngine) {
      throw new Error("No transcription engine available")
    }

    if (!this.currentEngine.isInitialized) {
      throw new Error("Model not loaded")
    }

    await this.currentEngine.startRecording(callbacks)
  }

  /**
   * Stop recording
   */
  async stopRecording(): Promise<void> {
    if (this.currentEngine) {
      await this.currentEngine.stopRecording()
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.currentEngine?.resetStats()
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    if (this.currentEngine) {
      await this.currentEngine.cleanup()
      this.currentEngine = null
    }
  }

  /**
   * Create engine instance
   */
  private async createEngine(
    engineType: TranscriptionEngine
  ): Promise<ITranscriptionEngine> {
    const factory = engineFactories[engineType]
    if (!factory) {
      throw new Error(`No factory available for engine: ${engineType}`)
    }

    try {
      const engine = await factory()
      return engine
    } catch (error) {
      throw new Error(`Failed to create ${engineType} engine: ${error}`)
    }
  }
}

/**
 * Global transcription manager instance
 */
let globalTranscriptionManager: UnifiedTranscriptionManager | null = null

/**
 * Get or create the global transcription manager
 */
export function getTranscriptionManager(): UnifiedTranscriptionManager {
  if (!globalTranscriptionManager) {
    globalTranscriptionManager = new UnifiedTranscriptionManager()
  }
  return globalTranscriptionManager
}

/**
 * Convenience functions for common operations
 */

/**
 * Initialize transcription with default model
 */
export async function initializeTranscription(
  callbacks: ModelLoadCallbacks
): Promise<UnifiedTranscriptionManager> {
  const manager = getTranscriptionManager()
  await manager.loadDefaultModel(callbacks)
  return manager
}

/**
 * Start transcription with the current engine
 */
export async function startTranscription(
  callbacks: TranscriptionCallbacks
): Promise<void> {
  const manager = getTranscriptionManager()
  await manager.startRecording(callbacks)
}

/**
 * Stop transcription
 */
export async function stopTranscription(): Promise<void> {
  const manager = getTranscriptionManager()
  await manager.stopRecording()
}

/**
 * Switch transcription engine and reload with default model
 */
export async function switchTranscriptionEngine(
  engine: TranscriptionEngine,
  modelCallbacks: ModelLoadCallbacks
): Promise<void> {
  const manager = getTranscriptionManager()
  await manager.switchEngine(engine)
  await manager.loadDefaultModel(modelCallbacks)
}
