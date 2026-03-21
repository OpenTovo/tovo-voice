"use client"

import { Button } from "@workspace/ui/components/button"
import { Mic, MicOff, Pause, Play } from "lucide-react"
import { SessionStatus } from "@/lib/atoms"
import { TovoHaptics } from "@/lib/utils"

interface SessionControlsProps {
  sessionStatus: SessionStatus
  isModelLoaded: boolean
  transcriptionLoading: boolean
  isAIModelReady: boolean
  onStartSession: () => Promise<void>
  onPauseSession: () => void
  onContinueSession: () => Promise<void>
  onEndSession: () => void
  onClearTranscription: () => void
}

export function SessionControls({
  sessionStatus,
  isModelLoaded,
  transcriptionLoading,
  isAIModelReady,
  onStartSession,
  onPauseSession,
  onContinueSession,
  onEndSession,
}: SessionControlsProps) {
  // Enhanced handlers with haptic feedback
  const handleStartSession = async () => {
    TovoHaptics.success()
    await onStartSession()
  }

  const handlePauseSession = () => {
    TovoHaptics.medium()
    onPauseSession()
  }

  const handleContinueSession = async () => {
    TovoHaptics.success()
    await onContinueSession()
  }

  const handleEndSession = () => {
    TovoHaptics.warning()
    onEndSession()
  }

  return (
    <div className="bg-background justify-end p-2">
      <div className="mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        {/* Session Action Buttons */}
        <div className="mb-2 flex gap-2">
          {sessionStatus !== SessionStatus.Recording &&
            sessionStatus !== SessionStatus.Paused && (
              <Button
                onClick={handleStartSession}
                className="h-11 flex-1"
                disabled={
                  !isModelLoaded || transcriptionLoading || !isAIModelReady
                }
                title={
                  !isModelLoaded
                    ? "Load a Whisper model first"
                    : !isAIModelReady
                      ? "Set up AI analysis model and WebGPU"
                      : "Start recording session"
                }
              >
                <Mic className="mr-2 h-4 w-4" />
                Start Session
              </Button>
            )}

          {sessionStatus === SessionStatus.Recording && (
            <>
              <Button
                onClick={handlePauseSession}
                variant="outline"
                className="h-11 flex-1"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
              <Button
                onClick={handleEndSession}
                variant="destructive"
                className="h-11 flex-1"
              >
                <MicOff className="mr-2 h-4 w-4" />
                End Session
              </Button>
            </>
          )}

          {sessionStatus === SessionStatus.Paused && (
            <>
              <Button onClick={handleContinueSession} className="h-11 flex-1">
                <Play className="mr-2 h-4 w-4" />
                Continue
              </Button>
              <Button
                onClick={handleEndSession}
                variant="destructive"
                className="h-11 flex-1"
              >
                <MicOff className="mr-2 h-4 w-4" />
                End Session
              </Button>
            </>
          )}
        </div>

        {/* Session Status Badge */}
        <div className="text-muted-foreground flex h-6 items-center justify-center gap-2 text-sm">
          {sessionStatus === SessionStatus.Recording ? (
            <>
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
              Session in progress...
            </>
          ) : sessionStatus === SessionStatus.Paused ? (
            <>
              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
              Session paused
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-gray-400"></div>
              {!isModelLoaded
                ? "Loading a model..."
                : !isAIModelReady
                  ? "Setting up LLM..."
                  : "Ready to start"}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
