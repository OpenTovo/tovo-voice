"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  TranscriptionHistoryManager,
  type TranscriptionItem,
} from "@/lib/transcription/transcription-history-manager"

/**
 * Hook for managing transcription session history and storage
 *
 * This hook handles:
 * - Storing transcription items to IndexedDB
 * - Managing sliding window display of recent items
 * - Session management and cleanup
 *
 * This is separate from unified transcription engine management.
 * Use this hook alongside useUnifiedTranscription for complete functionality.
 */

interface UseTranscriptionHistoryOptions {
  sessionId: string | null
}

export function useTranscriptionHistory({
  sessionId,
}: UseTranscriptionHistoryOptions) {
  const [visibleItems, setVisibleItems] = useState<TranscriptionItem[]>([])

  const sessionManagerRef = useRef<TranscriptionHistoryManager | null>(null)

  // Initialize session manager
  useEffect(() => {
    if (!sessionId) return

    sessionManagerRef.current = new TranscriptionHistoryManager(sessionId)
    return () => {
      // Cleanup: save final state when component unmounts
      sessionManagerRef.current?.endSession()
    }
  }, [sessionId])

  /**
   * Add new transcription item (called from transcription engine hooks)
   */
  const addTranscription = useCallback(
    async (item: Omit<TranscriptionItem, "id">) => {
      if (!sessionManagerRef.current) {
        return
      }

      const transcriptionItem: TranscriptionItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...item,
      }

      await sessionManagerRef.current.addTranscriptionItem(transcriptionItem)

      // Update visible items
      const currentItems = sessionManagerRef.current.getCurrentItems()
      setVisibleItems([...currentItems])
    },
    [] // Keep empty dependency array since we're using ref
  )

  /**
   * Clear all transcription (for current session)
   */
  const clearTranscription = useCallback(async () => {
    // Immediately clear visible items to ensure UI updates right away
    setVisibleItems([])

    if (!sessionManagerRef.current) return

    try {
      await sessionManagerRef.current.clearSession()
    } catch (error) {
      console.error("Error clearing session:", error)
    }

    // Ensure visible items are cleared even if clearSession fails
    setVisibleItems([])
  }, [])

  /**
   * End current session and save everything
   */
  const endSession = useCallback(async () => {
    if (!sessionManagerRef.current) return

    try {
      await sessionManagerRef.current.endSession()
    } catch (error) {
      console.error("Error ending session:", error)
    }

    // Clear visible items after ending session
    setVisibleItems([])
  }, [])

  return {
    // Data
    visibleItems,

    // Actions
    addTranscription,
    clearTranscription,
    endSession,

    // Stats
    visibleItemsCount: visibleItems.length,
  }
}
