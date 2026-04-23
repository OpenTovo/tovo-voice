"use client"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { useAtom } from "jotai"
import { useEffect, useRef, useState } from "react"
import { useTranscriptionHistory } from "@/hooks/use-transcription-history"
import { useUnifiedTranscription } from "@/hooks/use-unified-transcription"
import {
  analysisResponsesAtom,
  llmEngineReadyAtom,
  SessionStatus,
  sessionStatusAtom,
} from "@/lib/atoms"
import {
  AIResponseSection,
  SessionControls,
  TranscriptionSection,
} from "./components"

export default function NewSessionPageClient() {
  const generateNewSessionId = () => {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const [sessionId, setSessionId] = useState<string | null>(null)

  const {
    addTranscription,
    clearTranscription: clearHistoryTranscription,
    endSession: endHistorySession,
    visibleItems,
  } = useTranscriptionHistory({ sessionId })

  const {
    isLoading: transcriptionLoading,
    isModelLoaded,
    error,
    transcription,
    startRecording,
    stopRecording,
    pauseRecording,
    clearTranscription,
  } = useUnifiedTranscription()
  const [sessionStatus] = useAtom(sessionStatusAtom)
  const [, setAnalysisResponses] = useAtom(analysisResponsesAtom)
  const [isAIModelReady] = useAtom(llmEngineReadyAtom)

  const processedCountRef = useRef(0)
  const lastProcessedItemRef = useRef<{
    text: string
    timestamp: number
  } | null>(null)

  useEffect(() => {
    const newItems = transcription.slice(processedCountRef.current)

    if (newItems.length > 0) {
      newItems.forEach((result) => {
        const now = Date.now()
        const resultTimestamp = result.timestamp || now

        const lastProcessed = lastProcessedItemRef.current
        if (
          lastProcessed &&
          lastProcessed.text.trim() === result.text.trim() &&
          Math.abs(resultTimestamp - lastProcessed.timestamp) < 1000
        ) {
          return
        }

        addTranscription({
          text: result.text,
          timestamp: resultTimestamp,
          speaker: result.speaker,
        })

        lastProcessedItemRef.current = {
          text: result.text.trim(),
          timestamp: resultTimestamp,
        }
      })

      processedCountRef.current = transcription.length
    }
  }, [transcription, addTranscription])

  const handleStartSession = async () => {
    if (sessionStatus === SessionStatus.Idle) {
      const newSessionId = generateNewSessionId()
      setSessionId(newSessionId)
    }
    await startRecording()
  }

  const handlePauseSession = () => {
    pauseRecording()
  }

  const handleContinueSession = async () => {
    await startRecording()
  }

  const handleEndSession = async () => {
    stopRecording()

    await endHistorySession()

    setSessionId(null)

    clearTranscription()
    clearHistoryTranscription()
    processedCountRef.current = 0
    lastProcessedItemRef.current = null
    setAnalysisResponses([])
  }

  const handleClearTranscription = () => {
    clearTranscription()
    clearHistoryTranscription()
    processedCountRef.current = 0
    lastProcessedItemRef.current = null
  }

  const transcriptionRef = useRef<HTMLDivElement>(null)
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false)
  const isAutoScrolling = useRef(false)

  useEffect(() => {
    if (
      !isUserScrolledUp &&
      transcriptionRef.current &&
      visibleItems.length > 0
    ) {
      isAutoScrolling.current = true
      requestAnimationFrame(() => {
        if (transcriptionRef.current) {
          transcriptionRef.current.scrollTop =
            transcriptionRef.current.scrollHeight
          setTimeout(() => {
            isAutoScrolling.current = false
          }, 150)
        }
      })
    }
  }, [visibleItems.length, isUserScrolledUp])

  const handleScroll = () => {
    if (isAutoScrolling.current || !transcriptionRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = transcriptionRef.current
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50
    setIsUserScrolledUp(!isAtBottom)
  }

  return (
    <div className="flex h-full flex-col px-3 py-4 pb-6 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      {error && (
        <Alert className="mb-4 flex-shrink-0">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <TranscriptionSection
        transcription={transcription}
        visibleItems={visibleItems}
        transcriptionRef={transcriptionRef}
        handleScroll={handleScroll}
      />

      <AIResponseSection sessionId={sessionId} />

      <div className="h-[85px] flex-shrink-0">
        <SessionControls
          sessionStatus={sessionStatus}
          isModelLoaded={isModelLoaded}
          transcriptionLoading={transcriptionLoading}
          isAIModelReady={isAIModelReady}
          onStartSession={handleStartSession}
          onPauseSession={handlePauseSession}
          onContinueSession={handleContinueSession}
          onEndSession={handleEndSession}
          onClearTranscription={handleClearTranscription}
        />
      </div>
    </div>
  )
}
