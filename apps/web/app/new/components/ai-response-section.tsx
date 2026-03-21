"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Textarea } from "@workspace/ui/components/textarea"
import { useAtom } from "jotai"
import { Bot, Brain, Loader2, RotateCcw, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { AIResponseMarkdown } from "@/components/ai/ai-response-markdown"
import { WebGPUSetupDialog } from "@/components/dialogs/webgpu-setup"
import {
  defaultAnalysisModelAtom,
  sessionContextAtom,
  transcriptionVisibleAtom,
} from "@/lib/atoms"
import {
  analysisLoadingAtom,
  analysisResponsesAtom,
  clearSessionDataAtom,
  llmEngineReadyAtom,
  SessionStatus,
  sessionStatusAtom,
  sessionTypeAtom,
} from "@/lib/atoms/session"
import { unifiedTranscriptionResultsAtom } from "@/lib/atoms/transcription"
import { detectWebGPU, getCachedWebLLMModels } from "@/lib/llm"
import { AIResponseManager } from "@/lib/llm/ai-response-manager"
import {
  type AnalysisProgress,
  llmAnalysisEngine,
} from "@/lib/llm/analysis-engine"
import { WEBLLM_MODELS, type WebLLMModelName } from "@/lib/llm/models"
import { SessionTypeSelector } from "./session-type-selector"

// Maximum number of AI responses to display in the UI
const MAX_DISPLAY_RESPONSES = 12

interface AIResponseSectionProps {
  sessionId?: string | null
}

export function AIResponseSection({
  sessionId = null,
}: AIResponseSectionProps) {
  const [defaultAnalysisModel] = useAtom(defaultAnalysisModelAtom)
  const [sessionType] = useAtom(sessionTypeAtom)
  const [sessionStatus] = useAtom(sessionStatusAtom)
  const [transcription] = useAtom(unifiedTranscriptionResultsAtom)
  const [analysisResponses, setAnalysisResponses] = useAtom(
    analysisResponsesAtom
  )
  const [isAnalyzing, setIsAnalyzing] = useAtom(analysisLoadingAtom)
  const [isEngineReady, setIsEngineReady] = useAtom(llmEngineReadyAtom)
  const [, clearSessionData] = useAtom(clearSessionDataAtom)
  const [webgpuInfo, setWebgpuInfo] = useState<any>(null)
  const [showWebGPUDialog, setShowWebGPUDialog] = useState(false)
  const [hasModels, setHasModels] = useState(false)
  const [engineProgress, setEngineProgress] = useState<AnalysisProgress | null>(
    null
  )
  const [currentStreamingResponse, setCurrentStreamingResponse] =
    useState<string>("")
  const [sessionContext, setSessionContext] = useAtom(sessionContextAtom)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const lastScrollTop = useRef(0)

  // Simple function to force scroll to absolute bottom
  const forceScrollToBottom = useCallback(() => {
    if (scrollAreaRef.current && !isUserScrolling) {
      const element = scrollAreaRef.current
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight
        // Set again after a brief delay to handle any layout changes
        setTimeout(() => {
          if (element) {
            element.scrollTop = element.scrollHeight
          }
        }, 10)
      })
    }
  }, [isUserScrolling])

  // Track transcription timing for proper LLM request frequency
  const lastTranscriptionTimestamp = useRef<number>(0)
  const transcriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentAnalysisAbortRef = useRef<AbortController | null>(null)

  // AI Response Manager for saving responses
  const aiResponseManagerRef = useRef<AIResponseManager | null>(null)

  const router = useRouter()

  const [isTranscriptionVisible] = useAtom(transcriptionVisibleAtom)

  // Handle scroll events to detect user scrolling - Very sensitive to respect user intent
  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current) return

    const element = scrollAreaRef.current
    const { scrollTop, scrollHeight, clientHeight } = element
    const maxScrollTop = scrollHeight - clientHeight

    // Be very sensitive to user scrolling so they can easily disable auto-scroll
    if (currentStreamingResponse) {
      // During streaming, small scroll up should disable auto-scroll
      const significantThreshold = Math.min(20, clientHeight * 0.006) // Very sensitive during streaming
      const hasScrolledSignificantly =
        scrollTop < maxScrollTop - significantThreshold
      setIsUserScrolling(hasScrolledSignificantly)
    } else {
      // When not streaming, also be very sensitive
      const normalThreshold = Math.min(20, clientHeight * 0.006) // Very sensitive threshold
      const isUserScrolling = scrollTop < maxScrollTop - normalThreshold
      setIsUserScrolling(isUserScrolling)
    }

    lastScrollTop.current = scrollTop
  }, [currentStreamingResponse])

  // Initialize the analysis engine when model and session type change
  useEffect(() => {
    const initializeEngine = async () => {
      if (!defaultAnalysisModel || !webgpuInfo?.isEnabled || !hasModels) {
        setIsEngineReady(false)
        return
      }

      // Check if this specific model is available
      const cachedModels = await getCachedWebLLMModels()
      if (!cachedModels.includes(defaultAnalysisModel)) {
        setIsEngineReady(false)
        return
      }

      // Verify the engine is actually ready with this model (not just the stored atom state)
      const actuallyReady = llmAnalysisEngine.isReadyForModel(
        defaultAnalysisModel as WebLLMModelName
      )

      if (actuallyReady) {
        // Engine is actually ready, update atom if needed
        if (!isEngineReady) {
          setIsEngineReady(true)
        }
        return
      }

      // Engine is not ready - need to initialize
      try {
        setIsEngineReady(false)
        setEngineProgress({
          stage: "initializing",
          message: "Initializing AI sidekick...",
        })

        await llmAnalysisEngine.initialize(
          defaultAnalysisModel as WebLLMModelName,
          (progress) => {
            setEngineProgress(progress)
          }
        )
        setIsEngineReady(true)
        setEngineProgress(null)
      } catch (error) {
        console.error("Failed to initialize analysis engine:", error)
        setIsEngineReady(false)
        setEngineProgress({
          stage: "error",
          message: "Failed to initialize AI analysis",
        })
      }
    }

    initializeEngine()
  }, [
    defaultAnalysisModel,
    webgpuInfo?.isEnabled,
    hasModels,
    setIsEngineReady,
    isEngineReady,
  ])

  // Initialize AI response manager when sessionId changes
  useEffect(() => {
    if (sessionId) {
      aiResponseManagerRef.current = new AIResponseManager(sessionId)
    } else {
      aiResponseManagerRef.current = null
    }
  }, [sessionId])

  // Improved analyze function that respects transcription timing
  // CRITICAL: This ensures one transcription chunk = one LLM request (never concatenated)
  const analyzeTranscription = useCallback(async () => {
    if (!transcription?.length || !isEngineReady || isAnalyzing) {
      return
    }

    // Check if we have a new transcription chunk based on timing
    const latestChunk = transcription[transcription.length - 1]
    const currentTimestamp = latestChunk?.timestamp || Date.now()

    // Only analyze if this is actually a new chunk (different timestamp)
    // This prevents concatenation and ensures natural chat flow
    if (currentTimestamp <= lastTranscriptionTimestamp.current) {
      return
    }

    lastTranscriptionTimestamp.current = currentTimestamp

    // Create abort controller for this analysis
    const abortController = new AbortController()
    currentAnalysisAbortRef.current = abortController

    // Let the engine handle processing logic
    try {
      setIsAnalyzing(true)
      setCurrentStreamingResponse("")

      const response = await llmAnalysisEngine.analyze({
        transcription: transcription, // Full array sent, but engine only processes latest chunk (new chat flow)
        sessionType,
        modelName: defaultAnalysisModel as WebLLMModelName,
        previousResponses: analysisResponses,
        userProvidedContext: sessionContext.trim() || undefined, // Include user context if provided
        onStreamChunk: (content: string) => {
          // Check if analysis should be aborted
          if (abortController.signal.aborted) {
            return
          }
          setCurrentStreamingResponse(content)
          // Let user control scrolling during streaming - no auto-scroll
        },
      })

      // Check if aborted before processing response
      if (abortController.signal.aborted) {
        setCurrentStreamingResponse("")
        return
      }

      if (response.content?.trim() && response.content.trim() !== "none") {
        setCurrentStreamingResponse("")

        // Save AI response to database
        if (aiResponseManagerRef.current && sessionId) {
          try {
            await aiResponseManagerRef.current.addAIResponse(
              response.content.trim(),
              response.timestamp,
              sessionType
            )
          } catch (error) {
            console.error("Failed to save AI response:", error)
          }
        }

        setAnalysisResponses((prev) => {
          const newResponses = [...prev, response]
          return newResponses.slice(-MAX_DISPLAY_RESPONSES)
        })
      } else {
        setCurrentStreamingResponse("")
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error("Analysis failed:", error)
      }
      setCurrentStreamingResponse("")
    } finally {
      setIsAnalyzing(false)
      currentAnalysisAbortRef.current = null
    }
  }, [
    transcription,
    sessionType,
    isEngineReady,
    defaultAnalysisModel,
    isAnalyzing,
    analysisResponses,
    sessionContext,
    setAnalysisResponses,
    setIsAnalyzing,
    sessionId,
  ])

  useEffect(() => {
    // Clear any existing timeout
    if (transcriptionTimeoutRef.current) {
      clearTimeout(transcriptionTimeoutRef.current)
      transcriptionTimeoutRef.current = null
    }

    // Only run analysis when transcription actually changes and we have content
    if (transcription && transcription.length > 0) {
      const latestChunk = transcription[transcription.length - 1]
      const currentTimestamp = latestChunk?.timestamp || Date.now()

      // Only set timeout if this is a new transcription chunk (different timestamp)
      if (currentTimestamp > lastTranscriptionTimestamp.current) {
        // Short delay to ensure transcription is stable
        transcriptionTimeoutRef.current = setTimeout(() => {
          analyzeTranscription()
        }, 300) // Reduced delay for faster response
      }
    }

    // Cleanup timeout on unmount or when transcription changes
    return () => {
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current)
        transcriptionTimeoutRef.current = null
      }
    }
  }, [transcription, analyzeTranscription])

  useEffect(() => {
    const checkStatus = async () => {
      const [webgpuResult, cachedModels] = await Promise.all([
        detectWebGPU(),
        getCachedWebLLMModels(),
      ])

      setWebgpuInfo(webgpuResult)
      setHasModels(cachedModels.length > 0)
    }

    checkStatus()

    // Add an interval to refresh model status periodically
    const interval = setInterval(checkStatus, 25000) // Check every 25 seconds

    return () => clearInterval(interval)
  }, [])

  const getAnalysisModelDisplayName = () => {
    if (!defaultAnalysisModel) return ""
    const modelConfig = WEBLLM_MODELS[defaultAnalysisModel as WebLLMModelName]
    return modelConfig?.name || defaultAnalysisModel
  }

  const clearResponses = () => {
    // Abort any ongoing analysis to stop streaming
    if (currentAnalysisAbortRef.current) {
      currentAnalysisAbortRef.current.abort()
      currentAnalysisAbortRef.current = null
    }

    // Clear any pending timeouts to stop new analysis requests
    if (transcriptionTimeoutRef.current) {
      clearTimeout(transcriptionTimeoutRef.current)
      transcriptionTimeoutRef.current = null
    }

    // Clear ONLY the displayed AI responses and UI state - leave session/LLM memory intact
    setAnalysisResponses([])
    setCurrentStreamingResponse("") // Clear any ongoing streaming response
    setIsUserScrolling(false) // Reset scroll tracking
    setIsAnalyzing(false) // Stop analyzing indicator

    // Clean up AI response manager session
    if (aiResponseManagerRef.current) {
      aiResponseManagerRef.current.clearSession().catch(console.error)
    }

    // Reset timing tracking to prevent stale analysis requests
    lastTranscriptionTimestamp.current = 0
  }

  // Reset everything when session ends (when transcription is cleared)
  const prevTranscriptionLength = useRef(0)
  useEffect(() => {
    const currentLength = transcription.length

    // Only reset if we went from having transcription to having none (session ended)
    if (prevTranscriptionLength.current > 0 && currentLength === 0) {
      // Abort any ongoing analysis
      if (currentAnalysisAbortRef.current) {
        currentAnalysisAbortRef.current.abort()
        currentAnalysisAbortRef.current = null
      }

      // Clear any pending timeouts
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current)
        transcriptionTimeoutRef.current = null
      }

      clearSessionData()
      setCurrentStreamingResponse("") // Clear streaming state
      setIsAnalyzing(false) // Also stop any ongoing analysis
      setIsUserScrolling(false) // Reset scroll state
      llmAnalysisEngine.clearConversationHistory() // Clear LLM conversation memory

      // End AI response session and save any pending responses
      if (aiResponseManagerRef.current) {
        aiResponseManagerRef.current.endSession().catch(console.error)
      }

      // Reset timing tracking
      lastTranscriptionTimestamp.current = 0
    }

    // Update the ref for next comparison
    prevTranscriptionLength.current = currentLength
    // setState functions are stable and don't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcription.length, clearSessionData])

  // Simple auto-scroll: scroll to bottom whenever streaming content changes
  useEffect(() => {
    forceScrollToBottom()
  }, [currentStreamingResponse, forceScrollToBottom])

  // Simple auto-scroll: scroll to bottom whenever new responses are added
  useEffect(() => {
    forceScrollToBottom()
  }, [analysisResponses.length, forceScrollToBottom])

  // Monitor session status to abort streaming when session stops
  useEffect(() => {
    if (sessionStatus === SessionStatus.Idle && transcription.length === 0) {
      // Session has been stopped/cleared - abort any ongoing analysis
      if (currentAnalysisAbortRef.current) {
        currentAnalysisAbortRef.current.abort()
        currentAnalysisAbortRef.current = null
      }

      // Clear streaming state
      setCurrentStreamingResponse("")
      setIsAnalyzing(false)

      // Clear timeouts
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current)
        transcriptionTimeoutRef.current = null
      }
    }
  }, [sessionStatus, transcription.length, setIsAnalyzing])

  return (
    <Card className="mb-4 flex h-full w-full flex-col gap-4 py-4">
      <CardHeader className="flex-shrink-0 px-4 sm:px-6 md:px-8">
        <CardTitle className="flex justify-between gap-3">
          <div className="flex items-start justify-between">
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Sidekick
              </div>
              {defaultAnalysisModel ? (
                <Badge
                  variant="outline"
                  className="-mx-1 flex items-center gap-2 text-xs"
                >
                  {getAnalysisModelDisplayName()}
                  {/* Engine status indicator */}
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isEngineReady
                        ? "bg-green-500"
                        : engineProgress?.stage === "initializing"
                          ? "animate-pulse bg-yellow-500"
                          : engineProgress?.stage === "error"
                            ? "bg-red-500"
                            : "bg-gray-400"
                    }`}
                    title={
                      isEngineReady
                        ? "AI sidekick ready"
                        : engineProgress?.message || "AI sidekick not ready"
                    }
                  />
                </Badge>
              ) : (
                <Badge variant="secondary" className="-mx-1 text-xs">
                  No model set
                </Badge>
              )}
            </div>
          </div>
          <div className="items-center justify-start">
            <SessionTypeSelector />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden px-4 sm:px-6 md:px-8">
        {!webgpuInfo?.isEnabled ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              WebGPU is required for local LLMs.{" "}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowWebGPUDialog(true)}
                className="ml-2"
              >
                <Settings className="mr-2 h-4 w-4" />
                Setup
              </Button>
            </p>
          </div>
        ) : !hasModels ? (
          <div className="flex h-full flex-col space-y-2">
            <div className="flex flex-1 items-center justify-center">
              <div className="w-full max-w-md">
                <div className="space-y-4 text-center">
                  <p className="text-muted-foreground text-sm">
                    Download a large language model (
                    <span className="font-bold">required</span>).
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Open settings page, try to focus on AI model settings
                      router.push("settings")
                    }}
                    className="w-1/2 max-w-[200px]"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Go to Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : engineProgress ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{engineProgress.message}</span>
            </div>
            {engineProgress.progress ? (
              <div className="bg-secondary h-2 w-full rounded-full">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${engineProgress.progress}%` }}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div
            className={`relative flex min-h-0 flex-col ${
              isTranscriptionVisible
                ? "h-[calc(45svh-35px)]"
                : "h-[calc(80svh-250px)] md:h-[calc(80svh-210px)]"
            }`}
          >
            {/* Static Clear Button - positioned absolutely at top right */}
            {analysisResponses.length > 0 && (
              <div className="absolute bottom-0 right-0 z-10 flex gap-2">
                {/* Scroll to bottom indicator when user has scrolled up */}
                {isUserScrolling && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsUserScrolling(false)
                      forceScrollToBottom()
                    }}
                    className="text-muted-foreground hover:text-foreground bg-background/50 border-border/50 hover:bg-background/70 h-6 border px-2 text-xs shadow-sm backdrop-blur-sm transition-colors"
                  >
                    ↓ Latest
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearResponses}
                  className="text-muted-foreground hover:text-foreground bg-background/50 border-border/50 hover:bg-background/70 h-6 border px-2 text-xs shadow-sm backdrop-blur-sm transition-colors"
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              </div>
            )}

            {isAnalyzing ? (
              <div className="text-muted-foreground mb-3 flex flex-shrink-0 items-center gap-2">
                <Brain className="h-4 w-4 animate-pulse" />
                <span className="text-sm">Analyzing...</span>
              </div>
            ) : null}

            {/* Scrollable responses area */}
            <div
              ref={scrollAreaRef}
              className={`h-full min-h-0 flex-1 space-y-4 overflow-y-auto pr-2 ${
                currentStreamingResponse ? "" : "scroll-smooth"
              }`}
              onScroll={handleScroll}
            >
              {analysisResponses.length > 0 ? (
                <>
                  {analysisResponses.map((response, index) => (
                    <div
                      key={`${response.timestamp}-${index}`}
                      className="border-border/20 space-y-3 border-b pb-4 last:border-b-0 last:pb-0"
                    >
                      {/* Main analysis content */}
                      <AIResponseMarkdown className="text-sm leading-relaxed">
                        {response.content}
                      </AIResponseMarkdown>

                      {/* Timestamp */}
                      <div className="flex items-center justify-end">
                        <div className="text-muted-foreground text-xs">
                          {new Date(response.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Streaming response */}
                  {currentStreamingResponse && (
                    <div className="border-border/20 space-y-3 border-b pb-4 opacity-80 last:border-b-0 last:pb-0">
                      <div className="text-sm leading-relaxed">
                        <AIResponseMarkdown>
                          {currentStreamingResponse}
                        </AIResponseMarkdown>
                        <span className="animate-pulse">▌</span>
                      </div>
                      <div className="flex items-center justify-end">
                        <div className="text-muted-foreground text-xs">
                          Streaming...
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : currentStreamingResponse ? (
                <div className="space-y-3 opacity-80">
                  <div className="text-sm leading-relaxed">
                    <AIResponseMarkdown>
                      {currentStreamingResponse}
                    </AIResponseMarkdown>
                    <span className="animate-pulse">▌</span>
                  </div>
                  <div className="flex items-center justify-end">
                    <div className="text-muted-foreground text-xs">
                      Streaming...
                    </div>
                  </div>
                </div>
              ) : sessionStatus === SessionStatus.Idle ? (
                <div className="flex h-full items-center justify-center space-y-4">
                  <div className="w-full max-w-[600px] space-y-2">
                    <label
                      htmlFor="session-context"
                      className="text-sm font-medium"
                    >
                      Session Context
                    </label>
                    <div className="relative pt-1">
                      <Textarea
                        id="session-context"
                        value={sessionContext}
                        onChange={(e) => setSessionContext(e.target.value)}
                        placeholder="(Optional) Enter session topic, number of speakers, your role, what tips do you want, etc. This helps improve accuracy."
                        className="border-border focus:border-ring min-h-[100px] w-full resize-none border-2 pr-16"
                        maxLength={200}
                      />
                      <div className="text-muted-foreground absolute bottom-2 right-2 text-xs">
                        {sessionContext.length}/200
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Listening for content to analyze...
                </p>
              )}
            </div>
          </div>
        )}

        <WebGPUSetupDialog
          open={showWebGPUDialog}
          onOpenChange={setShowWebGPUDialog}
        />
      </CardContent>
    </Card>
  )
}
