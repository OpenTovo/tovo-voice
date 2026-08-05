"use client"

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

  return (
    <div className="flex h-full flex-col">
      <div className="hidden flex-shrink-0 p-4 pb-2 md:block">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-6 pt-2 md:pt-6">
        <div className="mx-auto w-full max-w-3xl space-y-4 px-4 sm:px-6 md:px-8">
          <div>
            <h2 className="mb-2 text-lg font-semibold tracking-tight">
              General
            </h2>
            <div className="space-y-0">
              <ThemeManagement />
              <AddToHomeScreen />
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold tracking-tight">
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
            <h2 className="mb-2 text-lg font-semibold tracking-tight">
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
            <h2 className="mb-2 text-lg font-semibold tracking-tight">
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
