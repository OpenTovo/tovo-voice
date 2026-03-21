/**
 * Unified Transcription Interface
 *
 * This interface provides a consistent API for transcription across different engines
 * (Whisper.cpp and Sherpa-ONNX). It abstracts the differences between engines and
 * provides a common interface for:
 * - Model loading and initialization
 * - Audio recording and processing
 * - Real-time transcription results
 * - Memory management and cleanup
 */

import { TranscriptionEngine } from "./constants"
import type {
  ModelLoadCallbacks,
  UnifiedModelConfig,
  UnifiedModelId,
} from "./unified-models"

/**
 * Transcription result from any engine
 */
export interface TranscriptionResult {
  text: string
  timestamp?: number
  speaker?: string
  confidence?: number
  isFinal?: boolean
  isPartial?: boolean
  metadata?: {
    utteranceId?: number
    processingTime?: number
    language?: string
  }
}

/**
 * Transcription callbacks
 */
export interface TranscriptionCallbacks {
  onTranscription: (result: TranscriptionResult) => void
  onError: (error: string) => void
  onStatusChange?: (status: TranscriptionStatus) => void
}

/**
 * Transcription status
 */
export enum TranscriptionStatus {
  IDLE = "idle",
  INITIALIZING = "initializing",
  LOADING_MODEL = "loading_model",
  READY = "ready",
  RECORDING = "recording",
  PROCESSING = "processing",
  ERROR = "error",
}

/**
 * Audio processing statistics
 */
export interface AudioStats {
  utteranceCount: number
  finalResultCount: number
  averageProcessingTime: number
  currentState: TranscriptionStatus
  recordingDuration: number
}

/**
 * Unified transcription engine interface
 */
export interface ITranscriptionEngine {
  /**
   * Engine identification
   */
  readonly engineType: TranscriptionEngine
  readonly isInitialized: boolean
  readonly currentModel: UnifiedModelConfig | null
  readonly status: TranscriptionStatus

  /**
   * Model management
   */
  loadModel(
    modelId: UnifiedModelId,
    callbacks: ModelLoadCallbacks
  ): Promise<void>
  unloadModel(): Promise<void>

  /**
   * Audio recording and transcription
   */
  startRecording(callbacks: TranscriptionCallbacks): Promise<void>
  stopRecording(): Promise<void>

  /**
   * Real-time capabilities (if supported)
   */
  readonly supportsRealTime: boolean

  /**
   * Statistics and monitoring
   */
  getStats(): AudioStats
  resetStats(): void

  /**
   * Memory management
   */
  cleanup(): Promise<void>
}

/**
 * Engine factory function type
 */
export type EngineFactory = () => Promise<ITranscriptionEngine>

/**
 * Engine registry for dynamic loading
 */
export interface EngineRegistry {
  [TranscriptionEngine.WHISPER]: EngineFactory
  [TranscriptionEngine.SHERPA]: EngineFactory
}

/**
 * Base class for transcription engines
 * Provides common functionality and state management
 */
export abstract class BaseTranscriptionEngine implements ITranscriptionEngine {
  protected _status: TranscriptionStatus = TranscriptionStatus.IDLE
  protected _currentModel: UnifiedModelConfig | null = null
  protected _isInitialized = false
  protected _callbacks: TranscriptionCallbacks | null = null

  // Statistics tracking
  protected _stats: AudioStats = {
    utteranceCount: 0,
    finalResultCount: 0,
    averageProcessingTime: 0,
    currentState: TranscriptionStatus.IDLE,
    recordingDuration: 0,
  }

  // Timing tracking
  protected _recordingStartTime: number | null = null
  protected _processingTimes: number[] = []

  abstract readonly engineType: TranscriptionEngine
  abstract readonly supportsRealTime: boolean

  get isInitialized(): boolean {
    return this._isInitialized
  }

  get currentModel(): UnifiedModelConfig | null {
    return this._currentModel
  }

  get status(): TranscriptionStatus {
    return this._status
  }

  getStats(): AudioStats {
    return {
      ...this._stats,
      currentState: this._status,
      recordingDuration: this._recordingStartTime
        ? Date.now() - this._recordingStartTime
        : 0,
    }
  }

  resetStats(): void {
    this._stats = {
      utteranceCount: 0,
      finalResultCount: 0,
      averageProcessingTime: 0,
      currentState: this._status,
      recordingDuration: 0,
    }
    this._processingTimes = []
  }

  protected setStatus(status: TranscriptionStatus): void {
    this._status = status
    this._stats.currentState = status
    this._callbacks?.onStatusChange?.(status)
  }

  protected recordProcessingTime(timeMs: number): void {
    this._processingTimes.push(timeMs)

    // Keep only last 100 measurements for average calculation
    if (this._processingTimes.length > 100) {
      this._processingTimes.shift()
    }

    this._stats.averageProcessingTime =
      this._processingTimes.reduce((sum, time) => sum + time, 0) /
      this._processingTimes.length
  }

  protected recordUtterance(): void {
    this._stats.utteranceCount++
  }

  protected recordFinalResult(): void {
    this._stats.finalResultCount++
  }

  // Abstract methods that must be implemented by concrete engines
  abstract loadModel(
    modelId: UnifiedModelId,
    callbacks: ModelLoadCallbacks
  ): Promise<void>
  abstract unloadModel(): Promise<void>
  abstract startRecording(callbacks: TranscriptionCallbacks): Promise<void>
  abstract stopRecording(): Promise<void>
  abstract cleanup(): Promise<void>
}
