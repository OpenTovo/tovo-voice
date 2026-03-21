// Refactored useWhisper hook using the unified transcription system
"use client"

import { useCallback } from "react"
import { UNIFIED_MODELS } from "@/lib/transcription/unified-models"
import {
  type UseUnifiedTranscriptionReturn,
  useUnifiedTranscription,
} from "./use-unified-transcription"

export interface UseWhisperReturn {
  // State
  isLoading: boolean
  isModelLoaded: boolean
  error: string | null
  transcription: Array<{
    text: string
    timestamp?: number
    speaker?: string
  }>
  modelLoadProgress: number
  currentModel: string | null

  // Actions
  loadModel: (modelName: string) => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => void
  clearTranscription: () => void
  pauseRecording: () => void
}

/**
 * Legacy useWhisper hook that bridges to the unified transcription system
 * This maintains backward compatibility while using the new unified system
 */
export function useWhisper(): UseWhisperReturn {
  const unified = useUnifiedTranscription()

  // Map Whisper model names to unified model IDs
  const loadModel = useCallback(
    async (modelName: string) => {
      // Find the unified model ID that corresponds to this Whisper model
      const unifiedModelEntry = Object.entries(UNIFIED_MODELS).find(
        ([, config]) => config.whisperConfig?.modelName === modelName
      )

      if (!unifiedModelEntry) {
        throw new Error(
          `No unified model found for Whisper model: ${modelName}`
        )
      }

      const [unifiedModelId] = unifiedModelEntry
      await unified.loadModel(unifiedModelId)
    },
    [unified]
  )

  // Extract current Whisper model name from unified model
  const getCurrentWhisperModel = useCallback((): string | null => {
    if (!unified.currentModel) return null

    const modelConfig = UNIFIED_MODELS[unified.currentModel]
    return modelConfig?.whisperConfig?.modelName || null
  }, [unified.currentModel])

  return {
    isLoading: unified.isLoading,
    isModelLoaded: unified.isModelLoaded,
    error: unified.error,
    transcription: unified.transcription,
    modelLoadProgress: unified.modelLoadProgress,
    currentModel: getCurrentWhisperModel(),
    loadModel,
    startRecording: unified.startRecording,
    stopRecording: unified.stopRecording,
    clearTranscription: unified.clearTranscription,
    pauseRecording: unified.pauseRecording,
  }
}
