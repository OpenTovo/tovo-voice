"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { useAtom } from "jotai"
import { ChevronDown, ChevronUp, Mic, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { StreamingTranscriptionDisplay } from "@/app/new/components/streaming-transcription-display"
import { TranscriptionDisplay } from "@/app/new/components/transcription-display"
import { useUnifiedTranscription } from "@/hooks/use-unified-transcription"
import { transcriptionVisibleAtom } from "@/lib/atoms"
import {
  hasCachedFile,
  hasSharedSherpaDataFile,
} from "@/lib/transcription/sherpa/sherpa-cache"
import { getModelShortName } from "@/lib/transcription/sherpa/sherpa-model"
import type { TranscriptionItem } from "@/lib/transcription/transcription-history-manager"
import { UNIFIED_MODELS } from "@/lib/transcription/unified-models"

interface TranscriptionSectionProps {
  // Transcription data
  transcription: any[]
  visibleItems: TranscriptionItem[]

  // Refs and handlers
  transcriptionRef: React.RefObject<HTMLDivElement | null>
  handleScroll: () => void
}

/**
 * Get display name for current model to show in UI badges
 */
function getModelDisplayName(currentModel: string | null): string {
  if (!currentModel) return "No model"

  // First try to find it in unified models (for Sherpa models)
  const unifiedModel = Object.values(UNIFIED_MODELS).find(
    (model: any) =>
      model.id === currentModel ||
      model.whisperConfig?.modelName === currentModel ||
      model.sherpaConfig?.modelName === currentModel
  )

  if (unifiedModel) {
    return (unifiedModel as any).displayName
  }

  // Final fallback
  return currentModel
}

export function TranscriptionSection({
  transcription,
  visibleItems,
  transcriptionRef,
  handleScroll,
}: TranscriptionSectionProps) {
  const [isTranscriptionVisible, setIsTranscriptionVisible] = useAtom(
    transcriptionVisibleAtom
  )

  // Use unified transcription hook
  const {
    isLoading: transcriptionLoading,
    currentModel,
    modelLoadProgress,
  } = useUnifiedTranscription()

  // Check if current model is Sherpa (for choosing display component)
  const isUsingSherpaModel =
    currentModel && UNIFIED_MODELS[currentModel]?.engine === "sherpa"

  // Track model checking state
  const hasCheckedModels = useRef(false)
  const [hasAvailableModels, setHasAvailableModels] = useState(false)
  const [isCheckingModels, setIsCheckingModels] = useState(true)

  const router = useRouter()

  // Check for available models (run only once, with periodic refresh)
  useEffect(() => {
    const checkAvailableModels = async () => {
      try {
        setIsCheckingModels(true)

        const hasSharedData = await hasSharedSherpaDataFile()
        if (!hasSharedData) {
          setHasAvailableModels(false)
          return
        }

        const sherpaModels = Object.values(UNIFIED_MODELS).filter(
          (model) => model.engine === "sherpa"
        )

        let hasAnyModel = false
        for (const model of sherpaModels) {
          if (!model.sherpaConfig) continue

          const shortName = getModelShortName(model.id)
          const baseUrl =
            process.env.NEXT_PUBLIC_R2_BASE_URL || "https://r2.tovo.dev"

          const wasmCached = await hasCachedFile(
            `${baseUrl}/sherpa-onnx-${shortName}/sherpa-onnx-wasm-main-asr.wasm`
          )
          const jsApiCached = await hasCachedFile(
            `${baseUrl}/sherpa-onnx-${shortName}/sherpa-onnx-asr.js`
          )
          const jsLoaderCached = await hasCachedFile(
            `${baseUrl}/sherpa-onnx-${shortName}/sherpa-onnx-wasm-main-asr.js`
          )

          if (wasmCached && jsApiCached && jsLoaderCached) {
            hasAnyModel = true
            break
          }
        }

        setHasAvailableModels(hasAnyModel)
      } catch (error) {
        console.error("Error checking available models:", error)
        setHasAvailableModels(false)
      } finally {
        setIsCheckingModels(false)
      }
    }

    // Initial check
    if (!hasCheckedModels.current) {
      hasCheckedModels.current = true
      checkAvailableModels()
    }

    // Add periodic refresh to detect newly downloaded models
    const interval = setInterval(checkAvailableModels, 15000) // Check every 15 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <Card
      className={`mb-4 flex flex-col py-4 transition-all duration-200 ${
        isTranscriptionVisible ? "min-h-[220px] gap-4" : "h-auto gap-0"
      }`}
    >
      <CardHeader
        className={`px-4 transition-all duration-200 sm:px-6 md:px-8`}
      >
        <CardTitle className="flex items-start justify-between">
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
              <Mic className="h-4.5 w-4.5" />
              Live Transcription
            </div>
            {transcriptionLoading ? (
              <Badge variant="secondary" className="-mx-1">
                <div className="mr-2 h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
                Loading...
              </Badge>
            ) : currentModel ? (
              <Badge variant="outline" className="-mx-1">
                {getModelDisplayName(currentModel)}
              </Badge>
            ) : (
              <Badge variant="secondary" className="-mx-1">
                No model set
              </Badge>
            )}
          </div>

          <Button
            onClick={() => setIsTranscriptionVisible(!isTranscriptionVisible)}
            variant="outline"
            size="sm"
            className="h-8 w-8 border p-0"
            title={
              isTranscriptionVisible
                ? "Collapse transcription"
                : "Expand transcription"
            }
          >
            {isTranscriptionVisible ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent
        className={`overflow-hidden px-4 transition-all duration-200 sm:px-6 md:px-8 ${
          isTranscriptionVisible ? "flex-1 opacity-100" : "h-0 py-0 opacity-0"
        }`}
      >
        {/* Always render StreamingTranscriptionDisplay for Sherpa models, regardless of visibility */}
        {isUsingSherpaModel && (
          <StreamingTranscriptionDisplay
            transcriptionRef={transcriptionRef}
            handleScroll={handleScroll}
            visibleItems={visibleItems}
          />
        )}

        {/* Content that's only shown when visible */}
        {isTranscriptionVisible && (
          <>
            {/* Loading Progress Display */}
            {transcriptionLoading && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {modelLoadProgress === 0 ? (
                    // Skeleton-like thin bar when no progress (auto-loading from cache)
                    <div className="bg-muted h-1 w-full animate-pulse rounded-full">
                      <div className="bg-muted-foreground/30 h-1 w-3/4 animate-pulse rounded-full" />
                    </div>
                  ) : (
                    // Actual progress bar when downloading
                    <div className="bg-muted h-2 w-full rounded-full">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${modelLoadProgress}%` }}
                      />
                    </div>
                  )}
                  <p className="text-muted-foreground text-center text-xs">
                    {modelLoadProgress === 0
                      ? "Loading cached model..."
                      : `Loading model... ${modelLoadProgress}%`}
                  </p>
                </div>
              </div>
            )}

            {/* No Transcription Results - Show download if needed */}
            {!transcriptionLoading && transcription.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center space-y-2">
                {/* Show inline model download when no models are available */}
                {!hasAvailableModels && !isCheckingModels ? (
                  <div className="w-full max-w-md">
                    <div className="space-y-4 text-center">
                      <p className="text-muted-foreground text-sm">
                        Download a transcription model (
                        <span className="font-bold">required</span>).
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Open settings page, try to focus on transcription settings
                          router.push("settings")
                        }}
                        className="w-1/2 max-w-[200px]"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Go to Settings
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Regular Transcription Display for non-Sherpa models */}
            {!isUsingSherpaModel && !transcriptionLoading && (
              <TranscriptionDisplay
                transcriptionRef={transcriptionRef}
                handleScroll={handleScroll}
                visibleItems={visibleItems}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
