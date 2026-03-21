"use client"

import { useAtom } from "jotai"
import { useEffect, useState } from "react"
import { defaultAnalysisModelAtom } from "@/lib/atoms"
import {
  detectWebGPU,
  getCachedWebLLMModels,
  initializeWebLLMModel,
  type WebGPUInfo,
  type WebLLMEngineState,
} from "@/lib/llm"
import type { WebLLMModelName } from "@/lib/llm/models"

export interface UseWebLLMReturn {
  webgpuInfo: WebGPUInfo | null
  engineState: WebLLMEngineState
  cachedModels: WebLLMModelName[]
  engine: any
  initializeModel: (modelName: WebLLMModelName) => Promise<void>
  isReady: boolean
  refreshCachedModels: () => Promise<void>
}

export function useWebLLM(): UseWebLLMReturn {
  const [defaultAnalysisModel] = useAtom(defaultAnalysisModelAtom)
  const [webgpuInfo, setWebgpuInfo] = useState<WebGPUInfo | null>(null)
  const [webllmAvailable, setWebllmAvailable] = useState(false)
  const [cachedModels, setCachedModels] = useState<WebLLMModelName[]>([])
  const [engine, setEngine] = useState<any>(null)
  const [engineState, setEngineState] = useState<WebLLMEngineState>({
    isInitialized: false,
    isLoading: false,
    currentModel: null,
    loadingProgress: "",
    error: null,
  })

  // Check WebGPU and WebLLM availability
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const webgpuResult = await detectWebGPU()
        setWebgpuInfo(webgpuResult)
      } catch (error) {
        console.error("Error checking WebGPU availability:", error)
        setWebgpuInfo({
          isSupported: false,
          isEnabled: false,
          error: "Detection failed",
        })
      }
    }

    checkAvailability()
  }, [])

  // Load cached models
  const refreshCachedModels = async () => {
    try {
      const models = await getCachedWebLLMModels()
      setCachedModels(models)
    } catch (error) {
      console.error("Error loading cached models:", error)
      setCachedModels([])
    }
  }

  useEffect(() => {
    refreshCachedModels()
  }, [])

  // Initialize model
  const initializeModel = async (modelName: WebLLMModelName) => {
    if (!webgpuInfo?.isEnabled) {
      throw new Error("WebGPU not available")
    }

    setEngineState((prev) => ({
      ...prev,
      isLoading: true,
      loadingProgress: "Initializing...",
      error: null,
    }))

    try {
      const newEngine = await initializeWebLLMModel(
        modelName,
        (progress) => {
          setEngineState((prev) => ({
            ...prev,
            loadingProgress: progress,
          }))
        },
        () => {
          setEngineState((prev) => ({
            ...prev,
            isInitialized: true,
            isLoading: false,
            currentModel: modelName,
            loadingProgress: "Ready",
          }))
        },
        (error) => {
          setEngineState((prev) => ({
            ...prev,
            isLoading: false,
            error: error.message,
          }))
        }
      )

      setEngine(newEngine)
      await refreshCachedModels()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      setEngineState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      throw error
    }
  }

  const isReady = Boolean(webgpuInfo?.isEnabled && !engineState.isLoading)

  return {
    webgpuInfo,
    engineState,
    cachedModels,
    engine,
    initializeModel,
    isReady,
    refreshCachedModels,
  }
}
