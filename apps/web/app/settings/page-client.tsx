"use client"

import { Skeleton } from "@workspace/ui/components/skeleton"
import { getDefaultStore, useAtom } from "jotai"
import { useEffect, useState } from "react"
import {
  defaultAnalysisModelAtom,
  defaultTranscriptionModelAtom,
} from "@/lib/atoms"
import {
  unifiedTranscriptionCurrentModelAtom,
  unifiedTranscriptionErrorAtom,
  unifiedTranscriptionLoadingAtom,
  unifiedTranscriptionModelLoadedAtom,
} from "@/lib/atoms/transcription"
import {
  clearAllWebLLMModels,
  deleteWebLLMModel,
  getCachedWebLLMModels,
  getWebLLMStorageInfo,
  type WebLLMModelName,
} from "@/lib/llm"
import { cleanupWebLLMEngine } from "@/lib/llm/webllm-engine"
import { tovoDB } from "@/lib/tovo-idb"
import { TranscriptionEngine } from "@/lib/transcription/constants"
import {
  clearCache as clearSherpaCache,
  hasSherpaModelFiles,
} from "@/lib/transcription/sherpa/sherpa-cache"
import { getModelsForEngine } from "@/lib/transcription/unified-models"
import { smartReload } from "@/lib/utils/pwa"
import {
  AddToHomeScreen,
  ContactSupport,
  DefaultModelsConfig,
  StorageManagement,
  ThemeManagement,
  TranscriptionManagement,
  VersionManagement,
  WebLLMModelsManagement,
} from "./components"

export default function SettingsPageClient() {
  const isReady = true

  const [defaultTranscriptionModel, setDefaultTranscriptionModel] = useAtom(
    defaultTranscriptionModelAtom
  )
  const [defaultAnalysisModel, setDefaultAnalysisModel] = useAtom(
    defaultAnalysisModelAtom
  )

  const [cachedSherpaModels, setCachedSherpaModels] = useState<string[]>([])
  const [cachedWebLLMModels, setCachedWebLLMModels] = useState<string[]>([])
  const [storageInfo, setStorageInfo] = useState<{
    quota?: number
    webllmModels: Array<{
      id: string
      name: string
      size: number
      modelId: string
    }>
    sherpaModels: Array<{ url: string; size: number; timestamp: number }>
    sessionHistorySize: number
  }>({
    webllmModels: [],
    sherpaModels: [],
    sessionHistorySize: 0,
  })
  const [isLoadingStorage, setIsLoadingStorage] = useState(true)

  useEffect(() => {
    loadCachedModels()
    loadStorageInfo()
  }, [])

  const loadCachedModels = async () => {
    try {
      const sherpaCached: string[] = []
      const sherpaModels = getModelsForEngine(TranscriptionEngine.SHERPA)

      for (const model of sherpaModels) {
        if (model.sherpaConfig) {
          if (await hasSherpaModelFiles(model.id)) {
            sherpaCached.push(model.id)
          }
        }
      }
      setCachedSherpaModels(sherpaCached)

      const webllmCached = await getCachedWebLLMModels()
      setCachedWebLLMModels(webllmCached)
    } catch (error) {
      console.error("Error loading cached models:", error)
      setCachedSherpaModels([])
      setCachedWebLLMModels([])
    }
  }

  const loadStorageInfo = async () => {
    try {
      setIsLoadingStorage(true)
      const [tovoIDB, webllmModels, sessionHistorySize] = await Promise.all([
        tovoDB.getStorageInfo(),
        getWebLLMStorageInfo(),
        tovoDB.getSessionHistoryStorageSize(),
      ])

      const allModels = tovoIDB?.models ?? []
      const sherpaModels = allModels.filter((model) =>
        model.url.includes("sherpa-onnx")
      )

      setStorageInfo({
        quota: tovoIDB?.quota ?? 0,
        webllmModels: webllmModels,
        sherpaModels: sherpaModels,
        sessionHistorySize: sessionHistorySize,
      })
    } catch (error) {
      console.error("Error loading storage info:", error)
      setStorageInfo({
        quota: 0,
        webllmModels: [],
        sherpaModels: [],
        sessionHistorySize: 0,
      })
    } finally {
      setIsLoadingStorage(false)
    }
  }

  const resetTranscriptionState = () => {
    const store = getDefaultStore()
    store.set(unifiedTranscriptionCurrentModelAtom, null)
    store.set(unifiedTranscriptionModelLoadedAtom, false)
    store.set(unifiedTranscriptionLoadingAtom, false)
    store.set(unifiedTranscriptionErrorAtom, null)
  }

  const cleanupAllEngines = async () => {
    try {
      await cleanupWebLLMEngine()
      resetTranscriptionState()
    } catch (error) {
      console.warn("Error during engine cleanup:", error)
    }
  }

  const handleModelChange = async () => {
    await Promise.all([loadCachedModels(), loadStorageInfo()])
  }

  const handleTranscriptionModelReady = async () => {
    await Promise.all([loadCachedModels(), loadStorageInfo()])
  }

  const handleDeleteWebLLMModel = async (modelId: WebLLMModelName) => {
    try {
      const updatedWebLLMModels = cachedWebLLMModels.filter(
        (modelName) => modelName !== modelId
      )
      const shouldClearDefault =
        updatedWebLLMModels.length === 0 || defaultAnalysisModel === modelId

      await deleteWebLLMModel(modelId)

      if (
        updatedWebLLMModels.length === 0 ||
        defaultAnalysisModel === modelId
      ) {
        await cleanupWebLLMEngine()
      }

      if (shouldClearDefault) {
        setDefaultAnalysisModel(null)
      }

      await loadCachedModels()
      await loadStorageInfo()

      setTimeout(() => {
        smartReload()
      }, 100)
    } catch (error) {
      console.warn("Error deleting WebLLM model:", error)
    }
  }

  const canDeleteModel = (
    modelName: string,
    modelType: "transcription" | "webllm"
  ) => {
    if (modelType === "transcription") {
      return (
        cachedSherpaModels.length === 1 ||
        defaultTranscriptionModel !== modelName
      )
    }

    return cachedWebLLMModels.length === 1 || defaultAnalysisModel !== modelName
  }

  const handleSetDefaultTranscriptionModel = (modelId: string) => {
    const isSherpaCached = cachedSherpaModels.includes(modelId)

    if (isSherpaCached) {
      setDefaultTranscriptionModel(modelId)
    } else {
      console.warn(`Cannot set '${modelId}' as default - model is not cached`)
    }
  }

  const handleSetDefaultAnalysisModel = (modelName: string) => {
    if (cachedWebLLMModels.includes(modelName)) {
      setDefaultAnalysisModel(modelName as WebLLMModelName)
    } else {
      console.warn(`Cannot set '${modelName}' as default - model is not cached`)
    }
  }

  if (!isReady) {
    return (
      <div className="flex-1 p-4">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="mb-6 h-8 w-24" />

          <div className="space-y-6">
            <div className="rounded-lg border p-6">
              <Skeleton className="mb-4 h-6 w-32" />
              <div className="space-y-4">
                <div>
                  <Skeleton className="mb-2 h-4 w-40" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="mb-2 h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-6">
              <Skeleton className="mb-4 h-6 w-32" />
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Skeleton className="mb-1 h-5 w-32" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-6">
              <Skeleton className="mb-4 h-6 w-20" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="mb-1 h-4 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div>
                  <Skeleton className="mb-1 h-4 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="hidden flex-shrink-0 p-4 pb-2 md:block">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-6 pt-2 md:pt-6">
        <div className="space-y-4 px-4 sm:px-6 md:px-8">
          <div>
            <h2 className="text-muted-foreground mb-2 text-lg font-semibold">
              General
            </h2>
            <div className="space-y-0">
              <ThemeManagement />
              <AddToHomeScreen />
            </div>
          </div>

          <div>
            <h2 className="text-muted-foreground mb-2 text-lg font-semibold">
              Models
            </h2>
            <div className="space-y-0">
              <TranscriptionManagement
                onModelReady={handleTranscriptionModelReady}
              />
              <WebLLMModelsManagement
                onModelChange={handleModelChange}
                canDeleteModel={(modelName: string) =>
                  canDeleteModel(modelName, "webllm")
                }
                onDeleteModel={handleDeleteWebLLMModel}
              />
              <DefaultModelsConfig
                defaultTranscriptionModel={defaultTranscriptionModel}
                defaultAnalysisModel={defaultAnalysisModel}
                cachedSherpaModels={cachedSherpaModels}
                cachedWebLLMModels={cachedWebLLMModels}
                onSetDefaultTranscriptionModel={
                  handleSetDefaultTranscriptionModel
                }
                onSetDefaultAnalysisModel={handleSetDefaultAnalysisModel}
              />
            </div>
          </div>

          <div>
            <h2 className="text-muted-foreground mb-2 text-lg font-semibold">
              Storage
            </h2>
            <StorageManagement
              storageInfo={storageInfo}
              isLoading={isLoadingStorage}
              onClearAllCache={async () => {
                try {
                  await tovoDB.clearAllModels()
                  await clearAllWebLLMModels()
                  await clearSherpaCache()
                  await tovoDB.clearAllSessionHistory()
                  await cleanupAllEngines()
                  setDefaultTranscriptionModel(null)
                  setDefaultAnalysisModel(null)
                  await loadCachedModels()
                  await loadStorageInfo()

                  setTimeout(() => {
                    smartReload()
                  }, 100)
                } catch (error) {
                  console.error("Error clearing all cache:", error)
                }
              }}
            />
          </div>

          <div>
            <h2 className="text-muted-foreground mb-2 text-lg font-semibold">
              About
            </h2>
            <div className="space-y-0">
              <VersionManagement />
              <ContactSupport />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
