import { atom } from "jotai"
import type { UnifiedModelId } from "@/lib/transcription/unified-models"

// Unified transcription state atoms
export const unifiedTranscriptionLoadingAtom = atom(false)
export const unifiedTranscriptionModelLoadedAtom = atom(false)
export const unifiedTranscriptionCurrentModelAtom = atom<UnifiedModelId | null>(
  null
)
export const unifiedTranscriptionErrorAtom = atom<string | null>(null)
export const unifiedTranscriptionModelLoadProgressAtom = atom(0)

// Unified transcription results
export const unifiedTranscriptionResultsAtom = atom<
  Array<{
    text: string
    timestamp?: number
    speaker?: string
  }>
>([])

// Action atom to clear transcription
export const clearTranscriptionAtom = atom(null, (get, set) => {
  set(unifiedTranscriptionResultsAtom, [])
})

// Action atom to add transcription result
export const addTranscriptionAtom = atom(
  null,
  (
    get,
    set,
    result: {
      text: string
      timestamp?: number
      speaker?: string
      isFinal?: boolean
      isPartial?: boolean
      metadata?: any
    }
  ) => {
    const current = get(unifiedTranscriptionResultsAtom)

    // For Sherpa: Only add final results to avoid duplicates and excessive LLM calls
    // For Whisper: All results are considered final
    if (result.isPartial && result.isFinal === false) {
      // Skip partial results - don't add to transcription history
      return
    }

    set(unifiedTranscriptionResultsAtom, [
      ...current,
      {
        text: result.text,
        timestamp: result.timestamp,
        speaker: result.speaker,
      },
    ])
  }
)
