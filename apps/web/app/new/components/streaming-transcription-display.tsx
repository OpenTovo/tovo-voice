"use client"

import { Badge } from "@workspace/ui/components/badge"
import { useAtom } from "jotai"
import { useCallback, useEffect, useRef, useState } from "react"
import { unifiedTranscriptionCurrentModelAtom } from "@/lib/atoms/transcription"
import type { TranscriptionItem } from "@/lib/transcription/transcription-history-manager"
import { UNIFIED_MODELS } from "@/lib/transcription/unified-models"

interface StreamingTranscriptionDisplayProps {
  transcriptionRef: React.RefObject<HTMLDivElement | null>
  handleScroll: () => void
  visibleItems: TranscriptionItem[]
}

// Enhanced transcription display that shows streaming for Sherpa models
function StreamingTranscriptionDisplay({
  transcriptionRef,
  handleScroll,
  visibleItems,
}: StreamingTranscriptionDisplayProps) {
  const [currentModel] = useAtom(unifiedTranscriptionCurrentModelAtom)
  const [partialText, setPartialText] = useState("")
  const [, setCurrentUtteranceId] = useState<number | null>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [, setLastFinalText] = useState("") // Track last final text to filter out duplicates
  const lastScrollTop = useRef(0)

  // Check if current model is Sherpa
  const isUsingSherpaModel =
    currentModel && UNIFIED_MODELS[currentModel]?.engine === "sherpa"

  // Auto-scroll function for streaming content (less aggressive)
  const autoScrollToBottom = useCallback(() => {
    if (!transcriptionRef.current) return

    const element = transcriptionRef.current
    const { scrollTop, scrollHeight, clientHeight } = element
    const maxScrollTop = scrollHeight - clientHeight

    // Only auto-scroll if we have content that overflows
    if (maxScrollTop <= 0) return

    // Less aggressive threshold - larger value means less likely to auto-scroll
    const threshold = Math.min(35, clientHeight * 0.06) // 6% of viewport or 35px
    const isNearBottom = scrollTop >= maxScrollTop - threshold

    // Auto-scroll if user is near bottom or if we have new content
    if (isNearBottom || !isUserScrolling) {
      // Use direct scrollTop assignment for more reliable scrolling
      element.scrollTop = scrollHeight
      // Also try smooth behavior as backup
      requestAnimationFrame(() => {
        if (transcriptionRef.current) {
          transcriptionRef.current.scrollTop =
            transcriptionRef.current.scrollHeight
        }
      })
    }
  }, [isUserScrolling, transcriptionRef])

  // Handle scroll events to detect user scrolling (less sensitive)
  const handleScrollWithDetection = useCallback(() => {
    if (!transcriptionRef.current) return

    const element = transcriptionRef.current
    const { scrollTop, scrollHeight, clientHeight } = element
    const maxScrollTop = scrollHeight - clientHeight

    // Only track user scrolling if we have overflow content
    if (maxScrollTop <= 0) {
      setIsUserScrolling(false)
      lastScrollTop.current = scrollTop
      handleScroll()
      return
    }

    // Larger threshold for detecting bottom position (less sensitive)
    const threshold = Math.min(35, clientHeight * 0.06)
    const isAtBottom = scrollTop >= maxScrollTop - threshold
    const scrollDelta = Math.abs(scrollTop - lastScrollTop.current)

    // Only consider it user scrolling if they scrolled a significant amount upward
    if (scrollDelta > 15 && scrollTop < lastScrollTop.current && !isAtBottom) {
      setIsUserScrolling(true)
    } else if (isAtBottom) {
      // Reset user scrolling when they reach bottom
      setIsUserScrolling(false)
    }

    lastScrollTop.current = scrollTop

    // Call the parent scroll handler
    handleScroll()
  }, [handleScroll, transcriptionRef])

  // Less frequent auto-scroll when content changes
  useEffect(() => {
    // For partial text, scroll with slight delay to reduce jumpiness
    // For visible items, longer delay to be less intrusive
    const timeoutId = setTimeout(
      () => {
        autoScrollToBottom()
      },
      partialText ? 0 : 50
    )

    return () => clearTimeout(timeoutId)
  }, [visibleItems, partialText, autoScrollToBottom])

  // Clear partial text when transcription is cleared
  useEffect(() => {
    if (visibleItems.length === 0) {
      setPartialText("")
      setCurrentUtteranceId(null)
      setIsUserScrolling(false)
      setLastFinalText("")
    }
  }, [visibleItems.length])

  // Listen for transcription events from the unified manager
  useEffect(() => {
    if (!isUsingSherpaModel) {
      setPartialText("")
      setCurrentUtteranceId(null)
      return
    }

    // Custom event listener for streaming transcription (partial results)
    const handleStreamingTranscription = (event: CustomEvent) => {
      const { text, isFinal, isPartial, metadata } = event.detail

      if (metadata?.clear) {
        // Clear event - reset all state
        setPartialText("")
        setCurrentUtteranceId(null)
        setIsUserScrolling(false)
        setLastFinalText("")
        return
      }

      if (isPartial && !isFinal) {
        // Simply set the partial text
        setPartialText(text)

        // Update utterance ID if provided
        if (metadata?.utteranceId !== undefined) {
          setCurrentUtteranceId(metadata.utteranceId)
        }
      } else if (isFinal) {
        // Store final text to filter future partials
        if (text && text.trim()) {
          setLastFinalText(text.trim())
        }

        // Clear partial text when we get final result
        setPartialText("")
        if (text === "") {
          // This is an end-of-utterance clear event
          setCurrentUtteranceId(null)
          setIsUserScrolling(false)
          setLastFinalText("")
        }
      }
    }

    // Add event listener for streaming results
    window.addEventListener(
      "sherpa-streaming-transcription",
      handleStreamingTranscription as EventListener
    )

    return () => {
      window.removeEventListener(
        "sherpa-streaming-transcription",
        handleStreamingTranscription as EventListener
      )
    }
  }, [isUsingSherpaModel])

  return (
    <div
      ref={transcriptionRef}
      onScroll={handleScrollWithDetection}
      className="h-full space-y-2 overflow-y-auto scroll-smooth"
    >
      {/* Finalized transcription items */}
      {visibleItems.map((result) => (
        <div key={result.id} className="border-primary border-l-2 py-2 pl-3">
          <div className="mb-1 flex items-center gap-2">
            {result.speaker && (
              <Badge variant="outline" className="text-xs">
                {result.speaker}
              </Badge>
            )}
            {result.timestamp && (
              <span className="text-muted-foreground text-xs">
                {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
          <p className="text-base sm:text-sm">{result.text}</p>
        </div>
      ))}

      {/* Streaming partial result for Sherpa models */}
      {isUsingSherpaModel && partialText && (
        <div className="border-l-2 border-blue-400 py-2 pl-3 opacity-70">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Listening...
            </Badge>
            <span className="text-muted-foreground text-xs">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
          <p className="text-base italic sm:text-sm">{partialText}</p>
        </div>
      )}
    </div>
  )
}

export { StreamingTranscriptionDisplay }
