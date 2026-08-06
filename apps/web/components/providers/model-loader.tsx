"use client"

import { useAtom } from "jotai"
import { useEffect, useRef } from "react"
import { useUnifiedTranscription } from "@/hooks/use-unified-transcription"
import { defaultTranscriptionModelAtom } from "@/lib/atoms"
import { removeLegacyWhisperModels } from "@/lib/transcription/legacy-model-cleanup"
import {
  UNIFIED_MODELS,
  type UnifiedModelId,
} from "@/lib/transcription/unified-models"

const AUTO_LOAD_MARKER = "tovo-transcription-autoloading"

/**
 * ModelLoader provider that automatically loads default models in the background
 * This ensures models are available regardless of which page the user enters first
 * Uses the unified transcription system so another ASR engine can be added later.
 */
export function ModelLoaderProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [defaultTranscriptionModel, setDefaultTranscriptionModel] = useAtom(
    defaultTranscriptionModelAtom
  )

  // Use the unified transcription hook for consistent state and loadModel function
  const { loadModel, isLoading, isModelLoaded, currentModel } =
    useUnifiedTranscription()

  // Track what we're trying to load to prevent infinite loops
  const loadingModelRef = useRef<string | null>(null)
  const lastDefaultModelRef = useRef<string | null>(null)
  const previousModelRef = useRef<string | null>(null)

  useEffect(() => {
    removeLegacyWhisperModels().catch((error) => {
      console.warn("Failed to remove legacy Whisper model cache:", error)
    })
  }, [])

  // Auto-load default transcription model when it changes
  useEffect(() => {
    const loadDefaultModel = async () => {
      // Update current model ref to track state
      previousModelRef.current = currentModel

      // Prevent infinite loops and unnecessary reloads
      if (
        !defaultTranscriptionModel ||
        isLoading ||
        loadingModelRef.current === defaultTranscriptionModel ||
        (isModelLoaded &&
          previousModelRef.current === defaultTranscriptionModel)
      ) {
        return
      }

      // A mobile browser can kill the tab while the model is being restored.
      // On the next page boot, do not immediately start the same high-memory
      // operation again. Clear the default so the user can retry deliberately
      // from Settings after closing other tabs.
      let previousAutoLoad: string | null = null
      let wasDiscarded = false
      try {
        previousAutoLoad = window.localStorage.getItem(AUTO_LOAD_MARKER)
        wasDiscarded =
          (document as Document & { wasDiscarded?: boolean }).wasDiscarded ===
          true
      } catch {
        // Storage and the optional Page Lifecycle property are best-effort.
      }

      if (previousAutoLoad === defaultTranscriptionModel || wasDiscarded) {
        console.warn(
          "Skipping automatic transcription model restore after a discarded tab"
        )
        try {
          window.localStorage.removeItem(AUTO_LOAD_MARKER)
        } catch {
          // Ignore storage failures; the model can still be selected manually.
        }
        setDefaultTranscriptionModel(null)
        lastDefaultModelRef.current = null
        return
      }

      try {
        // Check if the default model is a valid unified model
        const modelConfig =
          UNIFIED_MODELS[defaultTranscriptionModel as UnifiedModelId]
        if (!modelConfig) {
          console.warn(
            `Default transcription model '${defaultTranscriptionModel}' is not a valid unified model. Clearing default.`
          )
          setDefaultTranscriptionModel(null)
          lastDefaultModelRef.current = null
          return
        }

        // Track what we're loading to prevent concurrent loads
        loadingModelRef.current = defaultTranscriptionModel
        lastDefaultModelRef.current = defaultTranscriptionModel

        try {
          window.localStorage.setItem(
            AUTO_LOAD_MARKER,
            defaultTranscriptionModel
          )
        } catch {
          // Storage is only used as a crash-loop guard.
        }

        // Load the model using unified transcription system
        await loadModel(defaultTranscriptionModel as UnifiedModelId)

        try {
          window.localStorage.removeItem(AUTO_LOAD_MARKER)
        } catch {
          // Ignore storage failures after a successful load.
        }
      } catch (error) {
        console.error("Error loading default transcription model:", error)

        // Clear loading state to prevent infinite retries
        loadingModelRef.current = null

        // If the error is about missing files, clear the default model to stop retries
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        if (
          errorMessage.includes("not cached") ||
          errorMessage.includes("Please download")
        ) {
          console.warn(
            "Model files not available, clearing default model to prevent retries"
          )
          setDefaultTranscriptionModel(null)
          lastDefaultModelRef.current = null
          try {
            window.localStorage.removeItem(AUTO_LOAD_MARKER)
          } catch {
            // Ignore storage failures.
          }
        }
      } finally {
        loadingModelRef.current = null
      }
    }

    loadDefaultModel()
  }, [
    defaultTranscriptionModel,
    setDefaultTranscriptionModel,
    loadModel,
    isLoading,
    isModelLoaded,
    currentModel,
  ])

  return <>{children}</>
}
