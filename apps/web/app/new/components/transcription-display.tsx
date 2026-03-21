"use client"

import { Badge } from "@workspace/ui/components/badge"
import { useEffect } from "react"
import type { TranscriptionItem } from "@/lib/transcription/transcription-history-manager"

interface TranscriptionDisplayProps {
  transcriptionRef: React.RefObject<HTMLDivElement | null>
  handleScroll: () => void
  visibleItems: TranscriptionItem[]
}

// Simplified transcription display component (no historical loading), used by Whisper transcription
function TranscriptionDisplay({
  transcriptionRef,
  handleScroll,
  visibleItems,
}: TranscriptionDisplayProps) {
  // Auto-scroll to bottom when new items are added
  useEffect(() => {
    if (transcriptionRef.current && visibleItems.length > 0) {
      const element = transcriptionRef.current
      const { scrollTop, scrollHeight, clientHeight } = element
      const maxScrollTop = scrollHeight - clientHeight

      // Only auto-scroll if content overflows and user is near bottom
      if (maxScrollTop > 0) {
        const threshold = Math.min(100, clientHeight * 0.15)
        const isNearBottom = scrollTop >= maxScrollTop - threshold

        if (isNearBottom) {
          requestAnimationFrame(() => {
            if (transcriptionRef.current) {
              transcriptionRef.current.style.scrollBehavior = "smooth"
              transcriptionRef.current.scrollTop =
                transcriptionRef.current.scrollHeight
            }
          })
        }
      }
    }
  }, [visibleItems.length, transcriptionRef])

  return (
    <div ref={transcriptionRef} onScroll={handleScroll}>
      {/* Transcription items */}
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
          <p className="text-sm">{result.text}</p>
        </div>
      ))}
    </div>
  )
}

export { TranscriptionDisplay }
