/**
 * Unified Transcription Hook
 *
 * This hook replaces the old useWhisper hook and provides a unified interface
 * for transcription that works with both Whisper and Sherpa engines.
 */

import { useAtom, useSetAtom } from "jotai"
import { useCallback, useEffect, useRef } from "react"
import { SessionStatus, sessionStatusAtom } from "@/lib/atoms/session"
import {
  addTranscriptionAtom,
  clearTranscriptionAtom,
  unifiedTranscriptionCurrentModelAtom,
  unifiedTranscriptionErrorAtom,
  unifiedTranscriptionLoadingAtom,
  unifiedTranscriptionModelLoadedAtom,
  unifiedTranscriptionModelLoadProgressAtom,
  unifiedTranscriptionResultsAtom,
} from "@/lib/atoms/transcription"
import { modelLogger } from "@/lib/logger"
import {
  type TranscriptionCallbacks,
  type TranscriptionResult,
  TranscriptionStatus,
} from "@/lib/transcription/transcription-interface"
import type {
  ModelLoadCallbacks,
  UnifiedModelId,
} from "@/lib/transcription/unified-models"
import {
  getTranscriptionManager,
  type UnifiedTranscriptionManager,
} from "@/lib/transcription/unified-transcription"

export interface UseUnifiedTranscriptionReturn {
  // State
  isLoading: boolean
  isModelLoaded: boolean
  error: string | null
  transcription: TranscriptionResult[]
  modelLoadProgress: number
  currentModel: UnifiedModelId | null // Use unified model ID type

  // Actions
  loadModel: (modelId: UnifiedModelId) => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => void
  clearTranscription: () => void
  pauseRecording: () => void
}

export function useUnifiedTranscription(): UseUnifiedTranscriptionReturn {
  // Jotai state (using unified atoms)
  const [isLoading, setIsLoading] = useAtom(unifiedTranscriptionLoadingAtom)
  const [isModelLoaded, setIsModelLoaded] = useAtom(
    unifiedTranscriptionModelLoadedAtom
  )
  const [currentModel, setCurrentModel] = useAtom(
    unifiedTranscriptionCurrentModelAtom
  )
  const [error, setError] = useAtom(unifiedTranscriptionErrorAtom)
  const [transcription] = useAtom(unifiedTranscriptionResultsAtom)
  const [modelLoadProgress, setModelLoadProgress] = useAtom(
    unifiedTranscriptionModelLoadProgressAtom
  )
  const [, setSessionStatus] = useAtom(sessionStatusAtom)

  const clearTranscription = useSetAtom(clearTranscriptionAtom)
  const addTranscription = useSetAtom(addTranscriptionAtom)

  // Unified transcription manager reference
  const managerRef = useRef<UnifiedTranscriptionManager | null>(null)
  const previousModelRef = useRef<UnifiedModelId | null>(null)

  // Get or create the unified transcription manager
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = getTranscriptionManager()
    }
  }, [])

  // NOTE: We don't cleanup the global manager on unmount since it's shared
  // across components. Cleanup should only happen when explicitly requested
  // or when the entire app is shutting down.

  // Load a model using the unified system
  const loadModel = useCallback(
    async (modelId: UnifiedModelId) => {
      try {
        setIsLoading(true)
        setError(null)
        setModelLoadProgress(0)
        setIsModelLoaded(false)

        if (!managerRef.current) {
          throw new Error("Transcription manager not initialized")
        }

        // Stop any ongoing recording when changing models
        if (managerRef.current.status !== TranscriptionStatus.IDLE) {
          await managerRef.current.stopRecording()
        }

        // When changing models, we need proper cleanup
        const needsCleanup =
          previousModelRef.current && previousModelRef.current !== modelId

        if (needsCleanup) {
          modelLogger.info("Switching models, cleaning up", {
            from: previousModelRef.current,
            to: modelId,
          })
          await managerRef.current.cleanup()
          // Recreate manager for clean state
          managerRef.current = getTranscriptionManager()
        }

        // Update the previous model reference
        previousModelRef.current = modelId

        const callbacks: ModelLoadCallbacks = {
          onProgress: (progress: number) => {
            setModelLoadProgress(progress)
          },
          onComplete: () => {
            setIsModelLoaded(true)
            setCurrentModel(modelId) // Store the unified model ID
            setModelLoadProgress(100)
          },
          onError: (errorMessage: string) => {
            setError(errorMessage)
            setModelLoadProgress(0)
            setIsModelLoaded(false)
            setCurrentModel(null)
          },
        }

        await managerRef.current.loadModel(modelId, callbacks)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load model"
        setError(errorMessage)
        setModelLoadProgress(0)
        setIsModelLoaded(false)
        throw new Error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [
      setIsLoading,
      setError,
      setModelLoadProgress,
      setIsModelLoaded,
      setCurrentModel,
    ]
  )

  // Start recording and transcription
  const startRecording = useCallback(async () => {
    modelLogger.debug("Starting unified transcription recording", {
      isModelLoaded,
      hasManager: !!managerRef.current,
      currentModel,
      managerStatus: managerRef.current?.status,
    })

    if (!managerRef.current) {
      throw new Error("Transcription manager not initialized")
    }

    if (!isModelLoaded) {
      throw new Error("No model loaded")
    }

    if (managerRef.current.status === TranscriptionStatus.RECORDING) {
      throw new Error("Already recording")
    }

    try {
      setError(null)

      const callbacks: TranscriptionCallbacks = {
        onTranscription: (result: TranscriptionResult) => {
          addTranscription({
            text: result.text,
            timestamp: result.timestamp,
            speaker: result.speaker,
            isFinal: result.isFinal,
            isPartial: result.isPartial,
            metadata: result.metadata,
          })
        },
        onError: (errorMessage: string) => {
          setError(errorMessage)
        },
        onStatusChange: (status: TranscriptionStatus) => {
          // Map transcription status to session status
          switch (status) {
            case TranscriptionStatus.RECORDING:
              setSessionStatus(SessionStatus.Recording)
              break
            case TranscriptionStatus.IDLE:
              setSessionStatus(SessionStatus.Idle)
              break
            case TranscriptionStatus.LOADING_MODEL:
              setSessionStatus(SessionStatus.Idle) // Map to idle since we don't have Loading
              break
            default:
              setSessionStatus(SessionStatus.Idle)
              break
          }
        },
      }

      await managerRef.current.startRecording(callbacks)
      setSessionStatus(SessionStatus.Recording)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start recording"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [
    isModelLoaded,
    currentModel,
    setError,
    setSessionStatus,
    addTranscription,
  ])

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (managerRef.current) {
      await managerRef.current.stopRecording()
      setSessionStatus(SessionStatus.Idle)
    }
  }, [setSessionStatus])

  // Pause recording
  const pauseRecording = useCallback(async () => {
    if (
      managerRef.current &&
      managerRef.current.status === TranscriptionStatus.RECORDING
    ) {
      await managerRef.current.stopRecording()
      setSessionStatus(SessionStatus.Paused)
    }
  }, [setSessionStatus])

  return {
    isLoading,
    isModelLoaded,
    error,
    transcription,
    modelLoadProgress,
    currentModel,
    loadModel,
    startRecording,
    stopRecording,
    pauseRecording,
    clearTranscription,
  }
}

// Legacy alias for backward compatibility
export const useWhisper = useUnifiedTranscription
